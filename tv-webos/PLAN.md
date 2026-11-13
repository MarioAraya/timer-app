# PLAN — Timer TV (LG webOS 2017-18)

App para entrenar frente al TV: **HIIT y Tabata con sus canciones default**, nada más.
Vive en `tv-webos/` como sub-proyecto con su propio `package.json`, y reutiliza el
timing del repo principal sin forkearlo.

Estado: slices 0-3 implementados en código (sin probar en TV). `.ipk` generado: `npm run tv:package`.
**Desplegado en el TV (192.168.0.8) el 2026-11-13; `ares-launch` OK.**
Pendiente: tareas 👤 TV (T0.6, T1.5, T2.4, T3.5), T4.1 salvapantallas, T4.2 calibrar Tabata, T4.3 íconos reales, T4.5.

**Cómo leer este documento:** las secciones 1-6 son la especificación (qué y por qué).
La sección 7 es la lista de tareas con ID, modelo recomendado y criterio de aceptación.
La sección 8 dice qué modelo usar para qué. Quien implemente una tarea debe leer
primero la sección 2 (restricciones duras): casi todos los errores posibles salen de ahí.

---

## 1. Alcance

**Dentro**
- HIIT con `hiit_next-level_40-20_x12.mp3` (12 rounds, pista `x12`, la calibrada).
- Tabata con `tabata_rocky_20-10_x4.mp3` (8 rounds).
- Control completo con el control remoto (D-pad + OK + Back + teclas de media).
- Audio empaquetado dentro del `.ipk`: funciona sin red.

**Fuera (a propósito — no agregar aunque parezca fácil)**
- Pomodoro, breathing, Wim Hof, lofi.
- Login, backend, presets, progreso, favoritos, persistencia en `localStorage`.
- Selector de pista, modo beeps, sliders de duración, temas, i18n (solo español).
- Pista `x12-2`: su calibración sigue incompleta (feature #36).
- Publicación en LG Content Store: se instala por Developer Mode.

---

## 2. Restricciones duras de plataforma

| Año TV | webOS | Motor |
|---|---|---|
| 2017 | 3.5 | Chromium 38 |
| 2018 | 4.0 | Chromium 53 |

El piso es **Chromium 38**. La app carga desde `file://`, no desde HTTP.

### 2.1 JavaScript

El código fuente se escribe en ES moderno; el build lo baja a ES5. Pero el build solo
transpila **sintaxis** y agrega polyfills de `core-js`; las APIs del navegador no se
arreglan solas. Reglas para el código fuente:

| Prohibido | Por qué | Usar |
|---|---|---|
| `audio.play().then(...)` / `await audio.play()` sin guarda | En Chromium < 50 `play()` devuelve `undefined` | `var p = audio.play(); if (p && p.catch) p.catch(fn)` |
| `event.key`, `event.code` | No existen hasta Chromium 51 | `event.keyCode` |
| `fetch`, `import()` dinámico, Web Workers de módulo | No existen / no funcionan en `file://` | No se necesitan |
| `navigator.wakeLock`, `IntersectionObserver`, `ResizeObserver` | No existen | No se necesitan |
| Foco DOM (`:focus`, `tabindex`, `.focus()`) para navegar | Comportamiento errático con el control | Foco como estado de Preact + clase `.is-focused` |
| `localStorage` | Fuera de alcance | — |

`Object.assign`, `Array.prototype.find/includes`, `String.prototype.padStart` y
`Object.entries` no existen en Chromium 38, pero `plugin-legacy` los inyecta desde
`core-js`. Ojo: `hiitConfig.js` del repo principal llama `padStart` al importarse, así
que si los polyfills faltan la app muere antes de pintar nada (ver T0.4).

### 2.2 CSS

| Prohibido | Usar |
|---|---|
| Custom properties (`var(--x)`) | Variables Sass (`$x`), resueltas en build |
| CSS Grid, `gap` en flex | Flexbox + márgenes |
| `inset`, `aspect-ratio`, `clamp()`, `min()`, `max()` | `top/right/bottom/left`, tamaños en px |
| `filter`, `backdrop-filter`, `box-shadow` grande, `mix-blend-mode` | Nada: colores planos |
| `font-variant-numeric: tabular-nums` | Cada dígito en un `<span>` de ancho fijo |
| `position: sticky`, `:focus-visible`, `:is()`, `:where()` | — |
| Colores `#RRGGBBAA` | `rgba()` |
| Animar `width`, `height`, `top`, `left`, `background-color` | Animar solo `transform` y `opacity` |

`animation` y `@keyframes` necesitan prefijo `-webkit-` en Chromium 38: lo agrega
`autoprefixer`, no se escribe a mano.

### 2.3 Layout

- Resolución fija **1920×1080**. Todo en `px` sobre esa base. `html, body` con
  `width: 1920px; height: 1080px; overflow: hidden; margin: 0`.
- Margen seguro de **96px horizontal / 54px vertical** (5%, por overscan).
- Un solo tema oscuro. `src/styles/themes.css` del repo principal no se usa.

### 2.4 Rutas

`base: './'` en Vite. Toda ruta a un asset es relativa (`audio/x.mp3`, nunca
`/audio/x.mp3`). Los `song.mp3File` / `song.audioPath` de los configs del repo
principal son absolutos y **no se usan**; las rutas viven en `tracks.js`.

---

## 3. Arquitectura

```
tv-webos/
  PLAN.md
  CLAUDE.md               ← restricciones de la sección 2, resumidas (T0.3)
  package.json
  vite.config.js
  vitest.config.js
  index.html
  scripts/
    copy-audio.mjs        ← copia los 2 MP3 de ../public a public/audio
    postbuild.mjs         ← limpia dist/index.html para file://
    check-compat.mjs      ← falla si dist/ trae sintaxis o CSS prohibidos
  public/
    appinfo.json
    icon.png  largeIcon.png
    audio/                ← gitignored, lo llena copy-audio.mjs
  src/
    main.jsx
    App.jsx               ← máquina de pantallas: home | active | done
    tracks.js             ← catálogo: config + ruta de audio + startTime + colores
    clock.js              ← funciones puras: tiempo de audio → estado del timer
    clock.test.js
    player.js             ← envoltorio de un HTMLAudioElement
    remote.js             ← keyCode → acción (puro)
    remote.test.js
    useRemote.js          ← hook: listener de keydown → callback(acción)
    useClock.js           ← hook: loop rAF que lee player y emite estado
    screens/
      Home.jsx  Active.jsx  Done.jsx
    components/
      BigDigits.jsx  ProgressBar.jsx  DebugOverlay.jsx
    styles/
      _tokens.scss  base.scss  home.scss  active.scss  done.scss
```

### 3.1 Qué se importa del repo principal

Con **imports relativos** (`../../src/...`), sin alias. Así resuelven igual en Vite,
en Vitest y en cualquier editor.

| Import | Uso |
|---|---|
| `HIIT_CONFIG`, `CALIBRATION_MARKS` de `../../src/config/hiitConfig.js` | Duraciones calibradas; las marcas solo en tests |
| `TABATA_CONFIG` de `../../src/config/tabataConfig.js` | Duraciones Tabata |
| `getStateFromElapsed`, `getTotalDuration` de `../../src/utils/ticksEngine.js` | Tiempo → round/fase/timeLeft |

Forma de un config (ambos la comparten):

```js
{
  preparation: { duration: Number, subtitle: String },
  rounds: [{ work: Number, rest: Number, workSubtitle, restSubtitle }, ...]
}
```

Datos reales, para no tener que deducirlos:

| | HIIT | Tabata |
|---|---|---|
| Archivo | `hiit_next-level_40-20_x12.mp3` (12 MB) | `tabata_rocky_20-10_x4.mp3` (3,9 MB) |
| Duración del MP3 | 755,15 s | 245,28 s |
| `startTime` del audio | 1,37 s | 0 s |
| Preparación | 8,945 s | 11 s |
| Rounds | 12, ~40,9 s / ~20,4 s (medidos, distintos por round) | 8, 20 s / 10 s (teóricos) |
| Último round | rest de 21,398 s (outro) | `rest: 0` |
| Duración según config | 745,657 s | 241 s |

**No se importa** nada de `src/components/`, ni `audioUtils.js` (al importarse
instancia 5 reproductores y arrastra `audioSource.js` → Supabase/Tauri), ni
`WorkoutAudioPlayer.js`, ni `localStorage.js`. Por eso `startTime` se duplica en
`tracks.js`; un test lo ata a `CALIBRATION_MARKS` (ver 3.3).

**No se modifica ningún archivo de `src/` del repo principal** desde este sub-proyecto.

### 3.2 `tracks.js`

```js
import { HIIT_CONFIG } from '../../src/config/hiitConfig.js'
import { TABATA_CONFIG } from '../../src/config/tabataConfig.js'

export const TRACKS = {
  hiit: {
    id: 'hiit',
    label: 'HIIT',
    summary: '12 rounds · 40 / 20',
    config: HIIT_CONFIG,
    audioSrc: 'audio/hiit_next-level_40-20_x12.mp3',
    startTime: 1.37, // = HIIT_AUDIO_CONFIG.startTime en src/utils/audioUtils.js
  },
  tabata: {
    id: 'tabata',
    label: 'TABATA',
    summary: '8 rounds · 20 / 10',
    config: TABATA_CONFIG,
    audioSrc: 'audio/tabata_rocky_20-10_x4.mp3',
    startTime: 0,
  },
}
export const TRACK_ORDER = ['hiit', 'tabata']
```

La duración que muestra Home se calcula con `getTotalDuration(config)` y se formatea
`m:ss` (HIIT → `12:25`, Tabata → `4:01`). No se hardcodea.

### 3.3 `clock.js` — el audio es el reloj

La app web cuenta con `requestAnimationFrame` y corrige el audio con un watchdog. Acá
se invierte: **`audio.currentTime` es la única fuente de verdad.** No hay drift
posible, pausar es pausar el audio, y saltar de round es asignar `currentTime`.

Todas las funciones son puras y reciben `track` (una entrada de `TRACKS`).

```js
/** Estado completo para pintar la pantalla. audioTime = audio.currentTime. */
export function getTvState(track, audioTime) → {
  phase: 'prep' | 'work' | 'rest' | 'done',
  round: Number,          // 1-based; 1 durante prep
  totalRounds: Number,
  timeLeft: Number,       // segundos reales restantes de la fase
  secondsShown: Number,   // Math.ceil(timeLeft): muestra 40…1, nunca 0
  phaseDuration: Number,
  totalProgress: Number,  // 0..1 sobre getTotalDuration(config)
  totalLeft: Number,      // segundos hasta el final del workout
  next: { phase: 'work' | 'rest', duration: Number } | null,  // null = lo que sigue es el fin
}

/** audio.currentTime donde empieza el WORK del round n (1-based). */
export function getRoundStartTime(track, round) → Number

/** Destino de ←/→. dir = -1 | +1. Devuelve audio.currentTime, o null si no hay salto. */
export function getSeekTarget(track, audioTime, dir) → Number | null

/** 745.657 → '12:25'. Redondea hacia abajo. */
export function formatClock(seconds) → String
```

Reglas:

- `elapsed = Math.max(0, audioTime - track.startTime)`.
- `elapsed >= getTotalDuration(config)` → `phase: 'done'`, `timeLeft: 0`,
  `totalProgress: 1`, `next: null`. Se evalúa **antes** de llamar a
  `getStateFromElapsed`.
- Si no, se llama `getStateFromElapsed(config, elapsed)` y se traduce:
  `isPreparationPhase` → `'prep'`; si no, `isWorkPhase` → `'work'`; si no → `'rest'`.
- `next`: en `prep` → work del round 1. En `work` → rest del mismo round si
  `rest > 0`; si `rest === 0` (último de Tabata) → `null`. En `rest` → work del round
  siguiente, o `null` si es el último.
- `getRoundStartTime(track, n) = startTime + prep + Σ(work + rest) de los rounds 1..n-1`.
- `getSeekTarget`:
  - `dir = +1`: inicio del round siguiente. En prep → round 1. En el último round o en `done` → `null`.
  - `dir = -1`: si van más de 3 s dentro del round actual → inicio de ese round. Si
    no → inicio del round anterior. En round 1 con menos de 3 s, o en prep →
    `track.startTime` (reinicia la preparación).

### 3.4 `player.js`

Un solo `HTMLAudioElement` por sesión de workout. Sin watchdog: el TV no pausa audio
en segundo plano como un móvil.

```js
export function createPlayer(track, { onEnded, onError }) → {
  play(),          // respeta la regla de play() de 2.1; si no hay metadata, encola
  pause(),
  toggle(),
  seek(seconds),
  getTime(),       // tiempo interpolado, ver abajo
  isPlaying(),
  destroy(),       // pause + quitar listeners + src = ''
}
```

- Al crear: `audio.preload = 'auto'`, `audio.src = track.audioSrc`. En
  `loadedmetadata` → `audio.currentTime = track.startTime` (asignarlo antes falla).
- **Interpolación.** En motores viejos `currentTime` puede avanzar a saltos. `getTime()`
  guarda la última lectura distinta y su `performance.now()`. Si está reproduciendo y
  la lectura no cambió, devuelve `ultima + min((now - marca) / 1000, 0.5)`. En pausa
  devuelve `audio.currentTime` tal cual. El tope de 0,5 s evita que el contador siga
  corriendo si el audio se quedó sin datos.
- `onError` se dispara con el evento `error` del elemento; Active muestra
  `No se pudo cargar el audio` y Back vuelve a Home.

### 3.5 `useClock.js`

Loop de `requestAnimationFrame` mientras Active está montado. En cada frame calcula
`getTvState(track, player.getTime())` y hace `setState` **solo si cambió**
`phase`, `round`, `secondsShown` o `done`. Resultado: un render por segundo, no 60.
Cancela el rAF al desmontar.

### 3.6 `remote.js` y `useRemote.js`

`remote.js` es un mapa puro `keyCode → acción`:

| Acción | keyCodes del control | keyCodes de teclado (desarrollo) |
|---|---|---|
| `left` / `right` / `up` / `down` | 37 / 39 / 38 / 40 | iguales |
| `ok` | 13 | 13 (Enter) |
| `back` | 461 | 8 (Backspace), 27 (Escape) |
| `playPause` | 415 (Play), 19 (Pause) | 32 (Space) |
| `stop` | 413 | — |
| `debug` | 406 (azul) | 68 (D) |

`export function actionForKey(keyCode) → String | null`.

`useRemote(handler)` registra un `keydown` en `window`, llama
`handler(accion)` y hace `preventDefault()` cuando hay acción. Un solo listener
activo: lo monta la pantalla visible.

### 3.7 `App.jsx` — máquina de pantallas

```
home ──ok──▶ active ──fin──▶ done
  ▲            │ back×2 / stop  │ ok → active (misma pista, desde cero)
  └────────────┴────────────────┘ back → home
```

Estado: `{ screen, trackId }`. Sin router.

| Pantalla | Acción | Efecto |
|---|---|---|
| Home | `left` / `right` | Mueve el foco entre tarjetas (sin wrap) |
| Home | `ok` | → Active con la pista enfocada, **reproduce de inmediato** |
| Home | `back` | `window.close()` |
| Active (reproduciendo) | `ok`, `playPause` | Pausa |
| Active (reproduciendo) | `back` | Pausa (primer Back nunca saca del workout) |
| Active (en pausa) | `ok`, `playPause` | Reanuda |
| Active (en pausa) | `back` | → Home |
| Active | `left` / `right` | `player.seek(getSeekTarget(...))` si no es `null` |
| Active | `stop` | → Home |
| Active | `phase === 'done'` o evento `ended` | → Done (el audio sigue hasta acabar su outro) |
| Done | `ok` | → Active, misma pista |
| Done | `back` | → Home |
| Cualquiera | `debug` | Alterna `DebugOverlay` |

Al salir de Active o Done hacia Home: `player.destroy()`. El click del Magic Remote
funciona en tarjetas y overlay con `onClick` equivalentes a `ok`.

---

## 4. Diseño

Se lee a 3 metros, sudando. Regla: **el número y el color de fondo dicen todo.**

### 4.1 Tokens (`_tokens.scss`)

Colores de fase iguales a la app web (`WorkoutActiveView.scss`): son identidad.

| Token | HIIT | Tabata |
|---|---|---|
| `work` | `rgb(27, 212, 127)` verde | `rgb(255, 107, 53)` naranja |
| `rest` | `rgb(250, 167, 22)` ámbar | `rgb(78, 205, 196)` turquesa |
| `prep` | `rgb(35, 147, 247)` azul | `rgb(35, 147, 247)` azul |

Comunes: `$bg: #0a0a0a`, `$surface: #18181b`, `$text: #ffffff`,
`$text-dim: rgba(255, 255, 255, 0.6)`, `$on-phase: #0a0a0a` (texto sobre color de fase).

Tipografía: **Barlow Condensed 700** vía `@fontsource/barlow-condensed`
(se empaqueta, sin CDN). Fallback `'Arial Narrow', Arial, sans-serif`.

### 4.2 Home

```
┌──────────────────────────────────────────────────────────────┐
│  TIMER                                                       │  título 64px, $text-dim
│                                                              │
│   ┌────────────────────────┐   ┌────────────────────────┐    │
│   │ HIIT                   │   │ TABATA                 │    │  tarjetas 820×560
│   │ 12 rounds · 40 / 20    │   │ 8 rounds · 20 / 10     │    │  nombre 180px
│   │ 12:25                  │   │ 4:01                   │    │  resumen 48px, duración 96px
│   └────────────────────────┘   └────────────────────────┘    │
│                                                              │
│  OK  Empezar                                                 │  leyenda 36px, $text-dim
└──────────────────────────────────────────────────────────────┘
```

- Tarjeta: fondo `$surface`, borde izquierdo de 16px en el color `work` de la pista.
- `.is-focused`: `transform: scale(1.05)`, fondo = color `work`, texto `$on-phase`.
  Transición `transform 150ms`.
- Foco inicial: HIIT.

### 4.3 Active

```
┌──────────────────────────────────────────────────────────────┐
│  TRABAJO                                      ROUND 3 / 12   │  96px / 72px
│                                                              │
│                          27                                  │  dígitos 560px, line-height 1
│                                                              │
│  Sigue: DESCANSO 20s                                  8:41   │  48px
│  ████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │  barra 16px de alto
└──────────────────────────────────────────────────────────────┘
```

- **Fondo:** tres capas `position: absolute` a pantalla completa, una por fase, con
  `opacity` 0 o 1 y `transition: opacity 200ms`. Solo la activa en 1. Texto `$on-phase`.
- **Etiquetas:** `PREPÁRATE`, `TRABAJO`, `DESCANSO`. En prep, en lugar de
  `ROUND n / N` va el nombre de la pista.
- **`BigDigits`:** recibe un entero; pinta cada dígito en un `<span>` de
  `width: 0.5em; text-align: center; display: inline-block`. Sin ceros a la izquierda.
- **Pulso:** con `secondsShown <= 3` en work o rest, clase `.is-final` → keyframes
  `scale(1) → scale(1.08) → scale(1)`, 1 s, infinito.
- **`Sigue:`** `DESCANSO 20s` / `TRABAJO 41s` (duración redondeada); con `next === null` → `Sigue: FIN`.
- **Abajo a la derecha:** `formatClock(totalLeft)`.
- **`ProgressBar`:** pista `rgba(0,0,0,0.25)`, relleno `$on-phase`, `transform-origin: left`,
  `transform: scaleX(totalProgress)`, `transition: transform 1s linear`.
- **Pausa:** overlay `rgba(10,10,10,0.85)` con `PAUSA` (200px) y leyenda:
  `OK Seguir · ◀ ▶ Round · BACK Salir`.
- **Error de audio:** mismo overlay con `No se pudo cargar el audio` y `BACK Volver`.

### 4.4 Done

Fondo `$bg`. `¡LISTO!` (320px, color `work` de la pista), debajo
`HIIT · 12 rounds · 12:25` (64px), leyenda `OK Repetir · BACK Inicio`.

### 4.5 `DebugOverlay`

Caja fija arriba a la derecha, monoespaciada 24px, fondo negro semitransparente. Muestra:
`navigator.userAgent`, `audio.currentTime` crudo, cuántos ms pasan entre cambios de
`currentTime` (mín / máx de los últimos 50), FPS del loop, último `keyCode` recibido y
el último error de `window.onerror`. Existe porque el inspector remoto puede no
funcionar contra Chromium 38; queda en la app, oculto, detrás de la tecla azul.

---

## 5. Build y empaquetado

### 5.1 `package.json`

```json
{
  "name": "timer-tv-webos",
  "private": true,
  "type": "module",
  "scripts": {
    "audio:copy": "node scripts/copy-audio.mjs",
    "dev": "npm run audio:copy && vite",
    "test": "vitest run",
    "build": "npm run audio:copy && vite build && node scripts/postbuild.mjs && node scripts/check-compat.mjs",
    "tv:package": "ares-package dist --no-minify -o build",
    "tv:install": "npm run build && npm run tv:package && ares-install --device tv build/com.timerapp.tv_0.1.0_all.ipk && ares-launch --device tv com.timerapp.tv",
    "tv:inspect": "ares-inspect --device tv --app com.timerapp.tv --open"
  }
}
```

Dependencias: `preact` (misma versión que la raíz). Dev: `vite`, `@preact/preset-vite`,
`sass`, `vitest` (mismas versiones que la raíz), `@vitejs/plugin-legacy` (major igual
al de Vite), `terser`, `autoprefixer`, `es-check`, `@fontsource/barlow-condensed`,
`@webos-tools/cli`.

`npm install` se corre **dentro de `tv-webos/`**, nunca en la raíz: el lockfile raíz
solo se regenera en `node:22-alpine`.

### 5.2 `vite.config.js`

```js
import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import legacy from '@vitejs/plugin-legacy'
import autoprefixer from 'autoprefixer'

export default defineConfig({
  base: './',
  plugins: [
    preact(),
    legacy({ targets: ['chrome >= 38'], renderModernChunks: false }),
  ],
  server: { port: 5556, fs: { allow: ['..'] } }, // '..' = importar ../src
  build: {
    outDir: 'dist',
    cssTarget: 'chrome38',   // sin esto esbuild emite #RRGGBBAA
    cssCodeSplit: false,
    assetsInlineLimit: 0,
  },
  css: {
    preprocessorOptions: { scss: { api: 'modern-compiler' } },
    postcss: { plugins: [autoprefixer({ overrideBrowserslist: ['chrome >= 38'] })] },
  },
})
```

`vitest.config.js`: `defineConfig({ test: { include: ['src/**/*.test.js'] } })`.

### 5.3 Scripts

- **`copy-audio.mjs`**: copia los dos MP3 de `../public/` a `public/audio/`. Si falta
  alguno, termina con código 1 y un mensaje que nombra el archivo. No recopia si el
  destino ya tiene el mismo tamaño.
- **`postbuild.mjs`**: en `dist/index.html` quita los atributos `crossorigin` y
  `nomodule` de los `<script>` (bajo `file://`, `crossorigin` hace fallar la carga).
  Verifica que `dist/appinfo.json` exista.
- **`check-compat.mjs`**: corre `es-check es5 'dist/assets/*.js'` y busca en
  `dist/assets/*.css` los patrones `var(--`, `display:grid`, `backdrop-filter`,
  `inset:`, `aspect-ratio`, `clamp(`. Cualquier hallazgo → código 1 con archivo y patrón.

### 5.4 `public/appinfo.json`

```json
{
  "id": "com.timerapp.tv",
  "version": "0.1.0",
  "vendor": "Timer App",
  "type": "web",
  "main": "index.html",
  "title": "Timer TV",
  "icon": "icon.png",
  "largeIcon": "largeIcon.png",
  "bgColor": "#0a0a0a",
  "resolution": "1920x1080",
  "disableBackHistoryAPI": true
}
```

`icon.png` 80×80, `largeIcon.png` 130×130.

### 5.5 Cambios en el repo raíz (los únicos)

- `.gitignore`: agregar `tv-webos/node_modules/`, `tv-webos/dist/`, `tv-webos/build/`,
  `tv-webos/public/audio/`.
- `vitest.config.js`: agregar `'tv-webos/**'` a `test.exclude`, para que `npm run test`
  de la raíz no intente correr los tests de la TV.
- `.dockerignore`: agregar `tv-webos`.

---

## 6. Riesgos

1. **Bundle legacy bajo `file://`.** `plugin-legacy` carga con SystemJS y está pensado
   para HTTP. Si no arranca en el TV aun con `postbuild.mjs`: plan B, quitar
   `plugin-legacy` y construir con Rollup en formato IIFE + `@rollup/plugin-babel`
   (`preset-env`, `targets: chrome 38`, `useBuiltIns: 'usage'`). Se decide en T0.6.
2. **Salvapantallas.** webOS lo activa con imagen estática sin video y no hay Wake
   Lock. La pantalla cambia cada segundo, pero no está confirmado que baste.
   Mitigaciones en orden: (a) medir si aparece; (b) `<video>` mudo de 1×1 en loop;
   (c) servicio Luna `tvpower` (API no pública). Se decide en T4.1.
3. **Tabata sin calibrar.** `tabataTicks.js` declara que sus valores son teóricos.
   Además el MP3 dura 245,28 s y el config suma 241 s. En pantalla grande el desfase
   se nota. Si aparece, se calibra en el repo principal (T4.2) y la TV lo hereda.
4. **Inspector remoto.** `ares-inspect` contra Chromium 38 puede no renderizar en un
   Chrome actual. Por eso existe `DebugOverlay`.
5. **Developer Mode expira.** Hay que renovar la sesión desde la app Developer Mode
   del TV; si vence, la app se desinstala. Anotar el plazo real en el README (T4.4).
6. **Cierre de la app.** Con `disableBackHistoryAPI: true`, `window.close()` debería
   cerrar la app desde Home. Si no lo hace en el TV, cargar `webOSTV.js` y usar
   `webOS.platformBack()`. Se verifica en T2.4.
7. **Repo principal con cambios sin commitear** en `hiitConfig.js`. La TV importa
   solo `HIIT_CONFIG` y `CALIBRATION_MARKS`, que existen antes y después de esos cambios.

---

## 7. Tareas

Rama sugerida: `feat/tv-webos`. Un commit por tarea. Las tareas marcadas **👤 TV**
necesitan a una persona frente al televisor; el agente prepara todo y se detiene ahí.

Columna **Modelo**: ver sección 8 para el criterio.

### Slice 0 — Go/no-go en el TV

| ID | Tarea | Modelo | Aceptación |
|---|---|---|---|
| T0.1 | `package.json`, `vite.config.js`, `vitest.config.js`, `index.html`, `public/appinfo.json`, íconos provisionales (PNG de color plano) | Haiku | `npm install` dentro de `tv-webos/` termina sin errores |
| T0.2 | Cambios en la raíz (5.5) | Haiku | `git status` no muestra `node_modules` ni `dist` de `tv-webos`; `npm run test` de la raíz da el mismo resultado que antes |
| T0.3 | `tv-webos/CLAUDE.md`: tablas de 2.1 y 2.2, regla de rutas (2.4), "no modificar `../src`", comandos | Haiku | Menos de 80 líneas; cada regla de 2.1 y 2.2 está |
| T0.4 | `copy-audio.mjs`, `postbuild.mjs`, `check-compat.mjs` | Sonnet | `npm run build` pasa; meter a mano `display: grid` en un SCSS hace fallar el build |
| T0.5 | Spike: `main.jsx` que importa `tracks.js`, pinta `audio.currentTime` y reproduce HIIT con OK; `DebugOverlay` completo (4.5); `remote.js` mínimo | Sonnet | `npm run dev` funciona en Chrome; `open dist/index.html` (por `file://`) también reproduce |
| T0.6 | **👤 TV** — cuenta LG Developer, app Developer Mode, `ares-setup-device` (nombre `tv`), `npm run tv:install`. Anotar en `PLAN.md`: ¿arranca?, ¿suena?, granularidad de `currentTime`, ¿salvapantallas a los 15 min?, ¿llegan los keyCodes de la tabla 3.6? | Persona | Resultados anotados en la sección 10 |
| T0.7 | Solo si T0.6 falla: diagnosticar y aplicar plan B del riesgo 1 | **Opus** | El spike arranca y suena en el TV |

**Puerta:** no se empieza el slice 1 sin T0.6 en verde.

### Slice 1 — Reloj y reproductor

| ID | Tarea | Modelo | Aceptación |
|---|---|---|---|
| T1.1 | `clock.js` según 3.3 + `clock.test.js` con los casos de 7.1 | Sonnet | `npm run test` en verde |
| T1.2 | `player.js` según 3.4 | Sonnet | En Chrome: play, pausa, seek y fin de pista funcionan; no hay `.then` sobre `play()` |
| T1.3 | `useClock.js` según 3.5 | Sonnet | Un `console.count` en el render de Active marca ~1 por segundo |
| T1.4 | `Active.jsx` sin estilos: fase, round, segundos, OK = play/pausa | Sonnet | HIIT corre completo en Chrome y pasa a `done` |
| T1.5 | **👤 TV** — HIIT completo en el TV | Persona | En el round 12 la fase en pantalla coincide con la música |

### Slice 2 — Control remoto y navegación

| ID | Tarea | Modelo | Aceptación |
|---|---|---|---|
| T2.1 | `remote.js` completo + `remote.test.js` + `useRemote.js` | Sonnet | Tests en verde; un keyCode desconocido devuelve `null` |
| T2.2 | `App.jsx` con la máquina de 3.7; `Home.jsx` y `Done.jsx` sin estilos | Sonnet | Flujo Home → Active → Done → Home con teclado; cada fila de la tabla 3.7 se cumple |
| T2.3 | Seek con ←/→ y Back en dos pasos | Sonnet | → en el round 12 no hace nada; ← a los 2 s de un round va al anterior |
| T2.4 | **👤 TV** — flujo completo con el control, ambas pistas; verificar cierre desde Home (riesgo 6) | Persona | Todo el flujo sin teclado |

### Slice 3 — Diseño

| ID | Tarea | Modelo | Aceptación |
|---|---|---|---|
| T3.1 | `_tokens.scss`, `base.scss`, fuente | Sonnet | `npm run build` pasa `check-compat` |
| T3.2 | Home (4.2) | Sonnet | Coincide con el esquema a 1920×1080 |
| T3.3 | Active (4.3): capas de fondo, `BigDigits`, `ProgressBar`, pulso, overlays | Sonnet | Los dígitos no se mueven al cambiar de 20 a 19; el pulso arranca en 3 |
| T3.4 | Done (4.4) | Haiku | Coincide con la spec |
| T3.5 | **👤 TV** — fluidez y legibilidad desde el sillón | Persona | Sin tirones en el cambio de fase |
| T3.6 | Revisión completa del sub-proyecto contra las secciones 2 y 3 | **Opus** | Lista de hallazgos resuelta o descartada con motivo |

### Slice 4 — Cierre

| ID | Tarea | Modelo | Aceptación |
|---|---|---|---|
| T4.1 | Salvapantallas, según lo medido en T0.6 (riesgo 2) | **Opus** decide, Sonnet implementa | 15 min de HIIT en el TV sin salvapantallas |
| T4.2 | Solo si T2.4 mostró desfase: calibrar Tabata en el repo principal | **Opus** + persona | Fase y música coinciden en el round 8 |
| T4.3 | Íconos definitivos | Haiku | 80×80 y 130×130 |
| T4.4 | `README.md`: instalación, Developer Mode y su renovación, comandos | Haiku | Alguien sin contexto instala la app siguiéndolo |
| T4.5 | Sección en `CLAUDE.md` raíz + entrada en `features.json` | Haiku | — |

### 7.1 Casos de test obligatorios (`clock.test.js`)

Para **HIIT**:
- `TRACKS.hiit.startTime + HIIT_CONFIG.preparation.duration` ≈ `CALIBRATION_MARKS.prep_end` (±0,001).
  Es el test que ata el `startTime` duplicado a la calibración.
- `getRoundStartTime(hiit, n)` ≈ `CALIBRATION_MARKS['r' + n + '_work']` (±0,01) para n = 2…12.
- `audioTime = 0` → `prep`, `round: 1`, `secondsShown: 9`.
- `audioTime = 10.32` → `work`, `round: 1`.
- `audioTime = 51.29` → `rest`, `round: 1`, `next` = work del round 2.
- `audioTime = 730` → `rest`, `round: 12`, `next: null`.
- `audioTime = 747.03` → `done`, `totalProgress: 1`.
- `secondsShown` nunca es 0 mientras `phase !== 'done'` (barrer de 0 a 747 en pasos de 0,25 s).
- `totalProgress` es monótono creciente en ese mismo barrido.

Para **Tabata**:
- `audioTime = 5` → `prep`, `secondsShown: 6`.
- `audioTime = 11` → `work`, `round: 1`.
- `audioTime = 225` → `work`, `round: 8`, `next: null` (último round sin rest).
- `audioTime = 241` → `done`.

Para **seek** (HIIT):
- `+1` en prep → inicio del round 1. `+1` en round 12 → `null`. `+1` en `done` → `null`.
- `-1` a los 5 s del round 3 → inicio del round 3. `-1` a los 2 s del round 3 → inicio del round 2.
- `-1` a los 2 s del round 1 → `startTime`. `-1` en prep → `startTime`.

`formatClock`: `745.657 → '12:25'`, `241 → '4:01'`, `59.9 → '0:59'`, `0 → '0:00'`.

---

## 8. Qué modelo para qué

El plan está escrito para que **Sonnet** haga casi todo: las tareas tienen interfaz,
reglas y criterio de aceptación explícitos, y no piden decisiones de diseño.

| Modelo | Tareas | Criterio |
|---|---|---|
| **Haiku** | T0.1, T0.2, T0.3, T3.4, T4.3, T4.4, T4.5 | Mecánicas: el contenido ya está dictado en este plan, solo hay que transcribirlo |
| **Sonnet** | T0.4, T0.5, todo el slice 1 y 2, T3.1-T3.3 | Implementación con spec cerrada |
| **Opus** | T0.7, T3.6, T4.1, T4.2 | Diagnóstico con poca información (un TV sin inspector), revisión contra restricciones, decisiones con trade-offs |
| **Fable** | Ninguna tarea fija | Solo si T0.6 falla **y** el plan B también: ahí hay que replantear la arquitectura |

Dos tareas no admiten bajar de modelo:
- **T0.7** — depurar un bundle que no arranca en Chromium 38 mirando solo un overlay
  es el trabajo más difícil del proyecto.
- **T3.6** — la revisión es la única red contra una API prohibida que `check-compat`
  no detecta (las de 2.1 son APIs, no sintaxis: `es-check` no las ve).

### 8.1 Subagentes

**No hace falta configurar subagentes propios.** El proyecto son unas 700 líneas; lo
que un subagente aportaría ya está cubierto con piezas más baratas y deterministas:

| Necesidad | Solución | Por qué no un subagente |
|---|---|---|
| Que nadie use una API o CSS prohibido | `tv-webos/CLAUDE.md` (T0.3) + `check-compat.mjs` (T0.4) | Un script falla siempre igual; un agente a veces se le pasa |
| Correr tests y build | Agente `test-runner` que ya existe | — |
| Revisión antes de mergear | Agente `agent-skills:code-reviewer` que ya existe, lanzado con Opus | — |
| Desplegar al TV | `npm run tv:install` | Es un comando |

Lo que sí rinde es `tv-webos/CLAUDE.md`: se carga solo cuando el agente trabaja en esa
carpeta, y es lo que mantiene a Sonnet dentro de las restricciones sin repetirlas en
cada prompt.

Único subagente que valdría la pena, y solo si el proyecto crece más allá de este
plan: un `webos-reviewer` de solo lectura sobre Opus con la sección 2 como checklist.
Hoy T3.6 lo cubre con una sola invocación.

### 8.2 Cómo lanzar cada sesión

Una sesión por slice, en este orden, con contexto limpio:

```
Implementa el slice N de tv-webos/PLAN.md. Lee las secciones 2 y 3 antes de escribir
código. Un commit por tarea. Detente en las tareas marcadas 👤 TV y dime qué probar.
```

Las tareas Haiku del slice 0 pueden ir en una misma sesión Sonnet si no se quiere
cambiar de modelo: el ahorro es chico.

---

## 9. Decisiones abiertas

1. **Carpeta vs repo aparte.** El plan asume carpeta dentro del monorepo, porque
   importa el timing con `../../src`. Como submódulo git o repo separado habría que
   copiar los configs y se pierde la recalibración compartida.
2. **Modelo exacto del TV.** Si es 2018 (webOS 4.0) el piso sube a Chromium 53 y
   varias restricciones de la sección 2 se relajan; el plan cubre el peor caso.

## 10. Resultados de las pruebas en el TV

T0.6 parcial (2026-11-13): instalación y lanzamiento OK. Fix de despliegue: `ares-setup-device --modify tv -i "privateKey=tv_webos" -i "passphrase=<pass>"` (nombre relativo a ~/.ssh, no ruta absoluta; el Key Server debe estar ON para `--getkey`). Falta mirar la pantalla: ¿arranca?, ¿suena?, ¿salvapantallas?, keyCodes.

_(Se llena en T0.6, T1.5, T2.4 y T3.5.)_

Verificado solo en Chrome de escritorio por `file://` (sin errores de consola): Home, prep, work, pausa. Hallazgo: con plugin-legacy (SystemJS) el CSS queda inyectado dentro del JS, no como `.css`; `check-compat.mjs` escanea ahí.
