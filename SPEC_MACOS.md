# SPEC: App macOS universal (Tauri v2)

Estado: draft · Fecha: 2026-08-08 · Plan de ejecución: `PLAN_MACOS.md`

## 1. Objetivo

Empaquetar la PWA de timers como una app nativa de macOS (`Timer.app`), binario **universal** (arm64 + x86_64), reusando el frontend Preact existente sin bifurcarlo. La app desktop existe para resolver tres cosas que el navegador no puede:

1. La Mac se duerme a mitad del workout y mata el sync de audio.
2. No hay forma de tener el timer visible al costado mientras trabajás en otra app.
3. Hay que dejar una pestaña abierta para ver cuánto falta.

**Usuario objetivo:** el mismo usuario de la PWA, en su Mac, entrenando o en sesión Pomodoro con otras apps en primer plano.

**No-objetivo:** reescribir nada en Swift/SwiftUI. El ticks engine, los timers, i18n y el layout son código compartido con la web y siguen siendo la única fuente de verdad.

## 2. Alcance

### Incluye (v1)

| # | Capacidad | Resumen |
|---|---|---|
| A | Shell Tauri v2 | `src-tauri/` con el frontend actual cargado desde `dist/`. Build universal. |
| B | Audio 100% offline | Los 9 lofi + Wim Hof (hoy en Supabase) se bundlean en la `.app`. |
| C | Prevenir sleep | Mientras un timer corre, la Mac no duerme ni apaga pantalla. |
| D | Modo overlay | Ventana chica, siempre encima, sin decoración, arrastrable. |
| E | Menubar / tray | Ícono con tiempo restante en vivo + menú play/pause/skip. |

### No incluye (v1 — backlog explícito)

- Firma con Developer ID y notarización. La `.app` v1 se abre con click derecho → Abrir la primera vez.
- Auto-update (`tauri-plugin-updater`).
- Notificaciones nativas de macOS.
- Windows / Linux. El scope es macOS universal.
- E2E automatizado sobre la `.app` (`tauri-driver`).
- Cualquier cambio de comportamiento de los timers. Si un timer se comporta distinto en la `.app` que en el browser, es un bug, no una feature.

## 3. Restricción rectora

**El sync de audio MP3 es el diferenciador del producto.** Toda decisión de esta spec se subordina a no romperlo.

Consecuencias concretas:

- El audio sigue viviendo en el WebView (`HTMLAudioElement` / Web Audio API), exactamente como hoy. No se mueve a Rust ni a `AVAudioEngine`.
- `WorkoutAudioPlayer` y `LofiPlaylistPlayer` no se tocan salvo por el punto de resolución de URL (§5.2).
- El watchdog de 100ms y el umbral de 500ms se mantienen sin cambios.
- El handler de `visibilitychange` de `audioUtils.js` debe seguir funcionando: en una ventana Tauri minimizada u oculta el WebView también dispara `visibilitychange`. Verificar, no asumir.

## 4. Comandos

```bash
# Prerrequisito, una sola vez
rustup target add x86_64-apple-darwin
npm i -D @tauri-apps/cli
npm i @tauri-apps/api

# Desarrollo — abre ventana nativa contra el dev server de Vite (:5555)
npm run tauri:dev

# Build universal → src-tauri/target/universal-apple-darwin/release/bundle/macos/Timer.app
npm run tauri:build

# Build solo para esta Mac (mucho más rápido, para iterar)
npm run tauri:build:native

# Descargar los MP3 de Supabase a assets locales (una vez, y al cambiar la playlist)
npm run audio:fetch

# Los de siempre — siguen valiendo, el frontend es el mismo
npm run dev
npm run test
```

Scripts a agregar en `package.json`:

```json
{
  "tauri": "tauri",
  "tauri:dev": "tauri dev",
  "tauri:build": "npm run audio:local && tauri build --target universal-apple-darwin",
  "tauri:build:native": "npm run audio:local && tauri build",
  "audio:fetch": "node scripts/fetch-audio.mjs",
  "audio:local": "node scripts/link-audio.mjs"
}
```

## 5. Arquitectura

### 5.1 Estructura de archivos

```
timer-app/
  src/                        ← Preact. COMPARTIDO. Sin fork.
    config/
      audioSource.js          ← NUEVO. Único punto que decide local vs remoto.
    utils/
      tauri.js                ← NUEVO. isTauri() + wrappers de invoke/listen.
      audioUtils.js           ← tocado solo en el punto de URL
  src-tauri/                  ← NUEVO. Shell Rust.
    Cargo.toml
    tauri.conf.json
    build.rs
    icons/
    src/
      main.rs                 ← entry, delega a lib.rs
      lib.rs                  ← setup, registro de comandos y tray
      sleep.rs                ← comandos prevent-sleep (C)
      overlay.rs              ← comandos de ventana overlay (D)
      tray.rs                 ← tray icon, título en vivo, menú (E)
  assets-audio/               ← NUEVO, git-ignored. MP3 bajados de Supabase.
  scripts/
    fetch-audio.mjs           ← NUEVO. Baja los MP3 de Supabase a assets-audio/.
    link-audio.mjs            ← NUEVO. Copia assets-audio/ → public/audio/ pre-build.
  public/
    audio/                    ← git-ignored. Poblado por link-audio. Excluido de Vercel.
  SPEC_MACOS.md
  PLAN_MACOS.md
```

**Por qué `assets-audio/` fuera de `public/`:** si los MP3 vivieran en `public/`, se subirían en cada deploy de Vercel (~50–100MB). El build web sigue apuntando a Supabase; solo el build Tauri copia los archivos a `public/audio/` justo antes de compilar. `public/audio/` y `assets-audio/` van a `.gitignore` y a `.vercelignore`.

### 5.2 Resolución de audio — el único punto de bifurcación

```js
// src/config/audioSource.js
const SUPABASE_AUDIO = 'https://zyfiugarcxtcyjnuopft.supabase.co/storage/v1/object/public/audio'

export const isTauri = () => typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

/** @param {string} filename p.ej. 'pulsebox-lofi-night-522890.mp3' */
export function audioUrl(filename) {
  return isTauri() ? `/audio/${filename}` : `${SUPABASE_AUDIO}/${filename}`
}
```

`audioUtils.js` y `wimHofAudio.js` pasan a construir sus URLs con `audioUrl()`. Ningún otro archivo del frontend sabe que existe Tauri.

Los MP3 que **ya** están en `public/` (`hiit_next-level_40-20_x12.mp3`, `tabata_rocky_20-10_x4.mp3`) no cambian: ya son locales y ya se bundlean.

### 5.3 Contrato IPC frontend ↔ Rust

Tres comandos y dos eventos. Nada más.

**Frontend → Rust (`invoke`):**

| Comando | Firma | Cuándo |
|---|---|---|
| `set_keep_awake` | `(enabled: bool)` | Al arrancar/pausar/resetear cualquier timer |
| `set_overlay_mode` | `(enabled: bool)` | Toggle de modo overlay |
| `update_tray` | `(label: String, running: bool)` | En cada cambio de segundo visible |

**Rust → Frontend (`emit`):**

| Evento | Payload | Cuándo |
|---|---|---|
| `tray-action` | `'toggle' \| 'skip' \| 'reset'` | Click en un ítem del menú del tray |
| `overlay-changed` | `boolean` | La ventana cambió de modo (para sincronizar UI) |

Regla: **el estado del timer vive en el frontend, siempre.** Rust no cuenta tiempo, no conoce fases, no decide nada. Solo refleja lo que el frontend le dice y reenvía clicks. Duplicar el timer en Rust sería una segunda fuente de verdad y una segunda fuente de drift.

### 5.4 Prevenir sleep (C)

Crate `keepawake` (usa `IOPMAssertionCreateWithName` de IOKit por debajo). Se mantiene un `Option<keepawake::KeepAwake>` en el estado de Tauri; `set_keep_awake(true)` lo crea, `false` lo dropea.

- Bloquea display sleep e idle sleep. **No** bloquea el cierre de tapa — eso es correcto y esperado.
- Si el crate falla al inicializar (permisos, versión de macOS), el comando devuelve `Err` y el frontend loguea un warning. **La app no se cae ni bloquea el timer por esto.**
- La assertion se libera sí o sí en el `Drop` de la app. Un assertion filtrado deja la Mac sin dormir para siempre — es el peor bug posible de esta feature.

### 5.5 Modo overlay (D)

`set_overlay_mode(true)`:
- `set_always_on_top(true)`
- `set_decorations(false)`
- `set_size(320 × 320)` — cuadrada, el círculo de progreso es el elemento dominante
- `set_min_size(240 × 240)`, redimensionable
- posición: esquina inferior derecha del display activo, respetando el área visible

Arrastre: región `data-tauri-drag-region` sobre el header del timer. La app agrega la clase `overlay-mode` al root; el SCSS oculta lo no esencial (stats HUD, nav, selector de idioma) y agranda el dígito del contador.

`set_overlay_mode(false)` restaura tamaño, decoración y always-on-top previos, guardados en el estado.

### 5.6 Tray / menubar (E)

`TrayIconBuilder` con:
- **Título:** texto del tiempo restante, `set_title(Some("12:34"))`. Se actualiza vía `update_tray`, **máximo una vez por segundo** — no en cada tick de render. El frontend hace throttle antes de invocar; un IPC a 60fps es desperdicio puro.
- **Menú:** `Pausar/Reanudar` (label dinámico según `running`), `Saltar fase`, `Reiniciar`, separador, `Mostrar ventana`, `Salir`.
- **Click izquierdo:** muestra y enfoca la ventana principal.

Cerrar la ventana **oculta** la app en vez de matarla (`prevent_close` + `hide`), para que el tray siga contando. Salir es explícito desde el menú del tray.

### 5.7 Configuración de bundle

```jsonc
// src-tauri/tauri.conf.json — campos clave
{
  "productName": "Timer",
  "identifier": "cl.marioaraya.timer",
  "build": {
    "devUrl": "http://localhost:5555",
    "frontendDist": "../dist",
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build"
  },
  "bundle": {
    "targets": ["app", "dmg"],
    "macOS": { "minimumSystemVersion": "10.15" }
  },
  "app": {
    "windows": [{ "width": 1100, "height": 760, "title": "Timer", "resizable": true }]
  }
}
```

`minimumSystemVersion: 10.15` (Catalina) — es el piso razonable para que el slice x86_64 del universal tenga sentido. Bajarlo más no aporta.

## 6. Estilo de código

- **Frontend:** sin cambios. Mismas convenciones que el resto de `src/`. Preact + SCSS colocado, i18n vía `useLang()` — nunca `t()` con lang hardcodeado.
- **Rust:** un módulo por capacidad (`sleep.rs`, `overlay.rs`, `tray.rs`). `lib.rs` solo hace setup y registra. Sin `unwrap()` en código que corre en respuesta a input del usuario — devolver `Result<_, String>` y dejar que el frontend decida.
- **Nada de lógica de negocio en Rust.** Si aparece un `if phase == "work"` en un `.rs`, la abstracción está mal.
- Los comandos Tauri se llaman siempre desde `src/utils/tauri.js`, nunca `invoke()` suelto en un componente. Ese wrapper es no-op fuera de Tauri, así la web no se rompe.

## 7. Estrategia de testing

Decisión explícita del usuario: **los tests entran después de la verificación manual.** El orden por slice es implementar → verificar a mano en la `.app` → escribir el test que congela ese comportamiento → commit.

| Capa | Herramienta | Qué se testea |
|---|---|---|
| `audioSource.js` | vitest | `audioUrl()` devuelve local con `__TAURI_INTERNALS__` presente, Supabase sin él |
| `utils/tauri.js` | vitest | wrappers son no-op fuera de Tauri y no tiran |
| Timers existentes | vitest (ya existen) | **Deben seguir en verde.** Es el guardarraíl de que el shell no cambió comportamiento |
| Formato del tray | `#[cfg(test)]` en Rust | `format_tray_title(secs)` → `"12:34"`, `"00:05"`, edge de 0 y >99min |
| `.app` completa | manual | Checklist de §8 |
| E2E sobre la `.app` | — | Fuera de scope. `tauri-driver` queda en backlog |

Playwright **no** puede manejar una ventana Tauri. Los E2E actuales siguen corriendo contra la web y no cubren la `.app`.

## 8. Criterios de aceptación

La v1 está lista cuando, en una Mac limpia:

1. `npm run tauri:build` produce `Timer.app` y `lipo -archs` sobre el binario reporta `x86_64 arm64`.
2. La app abre sin conexión a internet y las 9 pistas lofi + Wim Hof suenan.
3. Un HIIT completo de 12 rondas termina con el audio sincronizado, sin drift audible ni intervenciones del watchdog en consola.
4. Con un timer corriendo, `pmset -g assertions` muestra la assertion activa; al pausar, desaparece.
5. La Mac no se duerme durante un workout con el idle timer del sistema en 1 minuto.
6. El modo overlay deja la ventana encima de una app en fullscreen, arrastrable, y vuelve al estado previo al desactivarlo.
7. El tray muestra el tiempo restante actualizado cada segundo, y `Pausar` / `Saltar` / `Reiniciar` afectan el timer real.
8. Cerrar la ventana no mata la app: el tray sigue contando y `Mostrar ventana` la trae de vuelta.
9. `npm run test` sigue en verde, incluidos los tests nuevos.
10. `npm run build` + deploy web siguen funcionando idénticos a hoy — la web no regresiona por nada de esto.

## 9. Límites (boundaries)

**Siempre:**
- Frontend compartido. Un fix en el ticks engine sirve para web y para mac, sin duplicar.
- Toda capacidad nativa detrás de `isTauri()`, degradando a no-op en la web.
- Verificación manual antes del test, antes del commit.
- Un slice = un commit funcional.

**Preguntar primero:**
- Agregar cualquier dependencia npm o crate que no esté nombrada en esta spec.
- Tocar `WorkoutAudioPlayer.js`, los archivos de ticks, o `ticksEngine.js` por cualquier motivo relacionado con desktop.
- Cambiar el layout o el comportamiento de un timer "ya que estamos en el archivo".
- Cualquier cosa que implique Apple Developer Program o costo.

**Nunca:**
- Reimplementar la cuenta de tiempo en Rust.
- Bifurcar componentes en variantes `*.desktop.jsx`.
- Commitear MP3 al repo (`assets-audio/`, `public/audio/` van a `.gitignore`).
- Commitear `package-lock.json` de un `npm install` local sin re-sync en `node:22-alpine` — trampa conocida de este repo.
- Dejar una assertion de keep-awake sin liberar.

## 10. Riesgos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| WKWebView throttlea timers/audio con ventana oculta | Alto — rompe el core | Verificar temprano (slice 1, antes de invertir en el resto). Si pasa: mover solo el *scheduling* a Rust, nunca el audio |
| `keepawake` desactualizado o roto en macOS reciente | Medio | Fallback: comando Rust propio con `io-kit-sys`. Falla suave, nunca bloquea el timer |
| Bundle de ~100MB de MP3 | Bajo | Aceptado a cambio de offline total. Si molesta: re-encodear a 96kbps mono |
| `update_tray` a alta frecuencia satura el IPC | Medio | Throttle a 1/s en el frontend, no en Rust |
| Regresión en la web al tocar `audioUtils.js` | Alto | `audioSource.js` como único punto de cambio + test de ambos caminos |

## 11. Estado previo a tener en cuenta

Suite verificada el 2026-08-09: **296/296 en verde, 11 archivos**. La regresión de `setup.startButton` que describe la feature #26 en `features.json` ya está resuelta (la clave existe en `es.js` y `en.js`, `PomodoroSetupView.jsx:159` la lee bien) — ese texto quedó desactualizado.

Baseline limpia: cualquier test que se ponga en rojo de acá en adelante es responsabilidad del trabajo de desktop. El working tree igual tiene cambios sin commitear de #26 (breathing carousel) y de sesiones previas; conviene commitearlos o stashearlos antes del slice 1 para que los diffs de desktop queden aislados.
