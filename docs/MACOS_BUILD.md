# Build de la app macOS

App nativa vía Tauri v2. El frontend Preact es el mismo que la web — no hay fork.
Spec: `SPEC_MACOS.md` · Plan: `PLAN_MACOS.md`

## Prerrequisitos

```bash
rustup target add x86_64-apple-darwin   # el otro slice del universal
npm install
npm run audio:fetch                     # baja 81 MB de MP3 a assets-audio/
```

`audio:fetch` corre una vez. Los MP3 no están en el repo (ver `public/AUDIO_FILES.md`);
`assets-audio/` es el cache local y está en `.gitignore`. Volvé a correrlo solo si
cambia la playlist. Es idempotente: saltea lo que ya bajó.

## Desarrollo

```bash
npm run tauri:dev
```

Abre una ventana nativa contra el dev server de Vite en `:5555`, con HMR.
Ojo: en dev el audio se sirve desde Supabase, no desde el bundle — el modo
offline solo se puede probar sobre una `.app` compilada.

## Build

```bash
npm run tauri:build          # universal (arm64 + x86_64) — lento
npm run tauri:build:native   # solo esta Mac — para iterar
```

Ambos corren `audio:local` antes, que copia `assets-audio/` → `public/audio/`
para que Vite lo meta en `dist/` y Tauri lo bundlee. Si falta alguna de las 13
pistas el script aborta: una `.app` con audio parcial se ve bien hasta que te
quedás sin internet.

Resultado:

```
src-tauri/target/universal-apple-darwin/release/bundle/macos/Timer.app
src-tauri/target/universal-apple-darwin/release/bundle/dmg/Timer_0.1.0_universal.dmg
```

Verificar que salió universal de verdad:

```bash
lipo -archs src-tauri/target/universal-apple-darwin/release/bundle/macos/Timer.app/Contents/MacOS/Timer
# → x86_64 arm64
```

## Abrir la app sin firma

No está firmada ni notarizada (decisión explícita para la v1, feature #33).
Gatekeeper la va a bloquear en el primer intento:

1. Click derecho sobre `Timer.app` → **Abrir**
2. **Abrir** de nuevo en el diálogo

Una sola vez por máquina. Doble click normal después.

Si macOS dice que está "dañada", es la cuarentena del atributo extendido:

```bash
xattr -cr /Applications/Timer.app
```

## Capacidades nativas

| Qué | Cómo | Dónde |
|---|---|---|
| No dormir | Assertion IOKit mientras corre un timer | `src-tauri/src/sleep.rs` |
| Modo flotante | Ventana 320×320, always-on-top, sin marco | `src-tauri/src/overlay.rs` |
| Menubar | Tiempo restante + pausar/saltar/reiniciar | `src-tauri/src/tray.rs` |

Cerrar la ventana **no** cierra la app: se oculta y el menubar sigue contando.
Para salir de verdad, **Salir** en el menú del tray.

El estado del timer vive solo en el frontend. Rust no cuenta tiempo ni conoce
fases — refleja lo que el frontend le manda por `update_tray` y reenvía los
clicks del menú como eventos `tray-action`. Ver SPEC_MACOS.md §5.3.

## Estructura

```
src-tauri/
  Cargo.toml          keepawake + tauri con feature tray-icon
  tauri.conf.json     bundle, ventana, macOS 10.15 mínimo
  src/
    lib.rs            setup, registro de comandos, hide-on-close
    sleep.rs          set_keep_awake
    overlay.rs        set_overlay_mode
    tray.rs           update_tray + menú
src/
  config/audioSource.js       único punto local vs remoto
  utils/tauri.js              único punto de entrada al IPC
  hooks/useDesktopIntegration.js  cablea un timer al shell nativo
  components/desktop/OverlayToggle.jsx
scripts/
  fetch-audio.mjs     Supabase → assets-audio/
  link-audio.mjs      assets-audio/ → public/audio/
```

## Agregar una capacidad nativa

1. Comando nuevo en su propio módulo de `src-tauri/src/`, registrado en `lib.rs`.
2. Wrapper en `src/utils/tauri.js` — **nunca** `invoke()` suelto en un componente.
3. El wrapper tiene que ser no-op fuera de Tauri, o rompés la web.

## Deuda conocida

- **`npm ci` está roto.** `package.json` depende de `@tauri-apps/*` y el lockfile
  no los tiene. Re-sync:
  ```bash
  docker run --rm -v $PWD:/app -w /app node:22-alpine npm install --package-lock-only
  ```
- Sin firma ni notarización → sin auto-update (features #33).
- Los E2E de Playwright corren contra la web, no contra la `.app`. `tauri-driver`
  quedó fuera de scope.
