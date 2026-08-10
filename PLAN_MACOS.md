# PLAN: App macOS universal (Tauri v2)

Spec: `SPEC_MACOS.md` · Features: `features.json` ids 27–33 (`area: "desktop"`)

Cada slice es vertical, funcional y commiteable. Orden: implementar → **vos verificás a mano** → escribo el test → commit. Nada de tests antes de tu verificación.

---

## Slice 0 — Base limpia

**Estado (verificado 2026-08-09):** suite en **296/296 verde**. La regresión de `setup.startButton` que menciona la feature #26 ya estaba resuelta — ese texto de `features.json` había quedado viejo. Baseline limpia, no hay nada que arreglar antes de arrancar.

| # | Tarea |
|---|---|
| 0.1 | ~~Resolver tests fallando de #26~~ — no aplica, suite verde |
| 0.2 | `rustup target add x86_64-apple-darwin` |
| 0.3 | `.gitignore` += `assets-audio/`, `public/audio/`, `src-tauri/target/` · `.vercelignore` += `public/audio/` |
| 0.4 | Commitear o stashear el working tree actual (#26 breathing carousel + trabajo suelto previo) para que los diffs de desktop queden aislados |

**Verificable:** `rustup target list --installed` lista `x86_64-apple-darwin`. `git status` limpio antes del slice 1.

---

## Slice 1 — Shell Tauri corriendo + build universal

El slice más importante: valida el supuesto de riesgo #1 (WKWebView throttlea audio/timers) antes de invertir en nada más.

| # | Tarea |
|---|---|
| 1.1 | `npm i -D @tauri-apps/cli` · `npm i @tauri-apps/api` |
| 1.2 | `npm run tauri init` → `src-tauri/`, ajustar `tauri.conf.json` según SPEC §5.7 |
| 1.3 | Íconos: generar desde `public/favicon.svg` con `tauri icon` |
| 1.4 | Scripts `tauri:dev` / `tauri:build` / `tauri:build:native` en `package.json` |
| 1.5 | `src/utils/tauri.js` — `isTauri()` + wrappers no-op fuera de Tauri |

**Verificás vos:** la app abre en ventana nativa. Corrés **un HIIT completo de 12 rondas** con la ventana en background y otra app en primer plano. Escuchás si hay drift. Esto es el go/no-go de todo el proyecto.

**Verificable:** `lipo -archs .../Timer.app/Contents/MacOS/Timer` → `x86_64 arm64`.

**Tests después:** `utils/tauri.js` no-op fuera de Tauri.

⚠️ Si el audio driftea acá, **paramos y replanteamos** antes de los slices 2–5.

---

## Slice 2 — Audio offline bundleado

| # | Tarea |
|---|---|
| 2.1 | `scripts/fetch-audio.mjs` — baja los 9 lofi + 2 Wim Hof de Supabase a `assets-audio/` |
| 2.2 | `scripts/link-audio.mjs` — copia `assets-audio/` → `public/audio/` (corre en `beforeBuildCommand`) |
| 2.3 | `src/config/audioSource.js` — `audioUrl(filename)` (SPEC §5.2) |
| 2.4 | `audioUtils.js` + `wimHofAudio.js` construyen URLs con `audioUrl()`. **Único cambio permitido en esos archivos** |

**Verificás vos:** WiFi apagado → la app abre, las 9 pistas suenan, next/repeat funcionan, Wim Hof suena en ES y EN. Y en el browser: todo sigue viniendo de Supabase, sin regresión.

**Tests después:** `audioSource.test.js` — ambos caminos. `audioUtils.test.js` (19 tests) debe seguir verde.

---

## Slice 3 — Prevenir sleep

| # | Tarea |
|---|---|
| 3.1 | `src-tauri/src/sleep.rs` — comando `set_keep_awake(enabled)`, assertion en el estado de Tauri |
| 3.2 | Frontend: invocar en start/pause/reset/unmount de HIIT, Tabata, Pomodoro y breathing |
| 3.3 | Fallo suave: si la assertion falla, warning en consola y el timer sigue |

**Verificás vos:** System Settings → idle a 1 min. Arrancás un Tabata, no tocás nada, la Mac no duerme. Pausás → `pmset -g assertions` ya no la muestra. Cerrás la app a mitad de workout y confirmás que la assertion se liberó.

**Tests después:** manual solamente — no hay forma sana de testear IOKit en unit test.

---

## Slice 4 — Modo overlay

| # | Tarea |
|---|---|
| 4.1 | `src-tauri/src/overlay.rs` — `set_overlay_mode(enabled)`, guarda/restaura estado previo |
| 4.2 | Botón de toggle en la UI del timer + atajo de teclado |
| 4.3 | SCSS `.overlay-mode`: oculta stats HUD / nav / selector de idioma, agranda el contador |
| 4.4 | `data-tauri-drag-region` en el header |

**Verificás vos:** overlay sobre una app en fullscreen, arrastrable, redimensionable hasta 240px sin romper el layout, y al desactivarlo vuelve exacto al tamaño y posición previos.

**Tests después:** ninguno automatizable con valor real. Manual.

---

## Slice 5 — Tray / menubar

| # | Tarea |
|---|---|
| 5.1 | `src-tauri/src/tray.rs` — `TrayIconBuilder`, `format_tray_title(secs)`, menú |
| 5.2 | Comando `update_tray(label, running)`; **throttle a 1/s en el frontend** |
| 5.3 | Evento `tray-action` → handler en el frontend que enruta a los controles reales del timer |
| 5.4 | `prevent_close` + `hide`: cerrar la ventana oculta, no mata. Salir solo desde el tray |

**Verificás vos:** el tiempo en la barra avanza cada segundo. Pausar/Saltar/Reiniciar desde el menú afectan el timer real. Cerrás la ventana → sigue contando en el tray → `Mostrar ventana` la trae de vuelta con el estado correcto.

**Tests después:** `#[cfg(test)]` para `format_tray_title` — `0`, `5`, `754`, `>99min`.

---

## Slice 6 — Cierre

| # | Tarea |
|---|---|
| 6.1 | Correr el checklist completo de aceptación (SPEC §8, los 10 puntos) |
| 6.2 | `docs/MACOS_BUILD.md` — cómo buildear, dónde queda la `.app`, cómo abrirla sin firma |
| 6.3 | Actualizar `CLAUDE.md` (sección Tauri) y `CURRENT.md` |
| 6.4 | Cerrar features 27–33 en `features.json` |

---

## Backlog post-v1

| Feature | Nota |
|---|---|
| Firma Developer ID + notarización | Requiere Apple Developer Program (US$99/año) |
| Auto-update (`tauri-plugin-updater`) | Depende de firma |
| Notificaciones nativas | Descartado de v1 por vos |
| E2E con `tauri-driver` | Playwright no maneja ventanas Tauri |
| Windows / Linux | El shell Tauri ya lo permitiría, pero fuera de scope |

---

## Ruta crítica

```
Slice 0 ──→ Slice 1 ──┬──→ Slice 2 (audio offline)
  base       shell     ├──→ Slice 3 (no sleep)
  limpia    + GO/NO-GO ├──→ Slice 4 (overlay)
                       └──→ Slice 5 (tray)
                                  │
                                  └──→ Slice 6 (cierre)
```

Los slices 2–5 son independientes entre sí: una vez pasado el slice 1, se pueden reordenar según lo que más te sirva primero.
