# PLAN — Timer TV (LG webOS 2017-18)

App para entrenar frente al TV: **HIIT y Tabata con sus canciones default**, nada más.
Vive en `tv-webos/` como sub-proyecto con su propio `package.json`, y reutiliza el
timing del repo principal sin forkearlo.

Estado: slices 0-3 implementados en código (sin probar en TV). `.ipk` generado: `npm run tv:package`. Ampliación planificada y sin implementar: Wim Hof EN y Pomodoro con música (secciones 11-16).
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

---

## 11. Ampliación: cambios comunes (Wim Hof + Pomodoro)

Las secciones 11-16 **amplían** el plan. Donde contradicen a las secciones 1-9, mandan
estas: Wim Hof, Pomodoro y lofi dejan de estar "fuera" (§1), y `localStorage` pasa a
estar permitido en un único archivo (§13.7). Todo lo demás de la sección 2 sigue
vigente sin excepciones.

Dos features, dos PR, en este orden: **PR 1 Wim Hof EN** (§12), **PR 2 Pomodoro +
música** (§13). Los cambios comunes de esta sección se implementan en el PR 1 (tareas
W1-W3); el PR 2 solo agrega la cuarta tarjeta.

### 11.1 Registro de actividades (`src/activities.js`, nuevo)

`tracks.js` no se toca: sigue siendo el catálogo de workouts con ticks. Home deja de
leer `TRACKS` y lee `ACTIVITIES`.

```js
import { TRACKS } from './tracks.js'
import { WIMHOF } from './wimhof.js'
import { getTotalDuration } from '../../src/utils/ticksEngine.js'
import { formatClock } from './clock.js'

// kind decide a qué pantalla va App.jsx al dar OK en Home.
export const ACTIVITIES = {
  hiit:     { id, kind: 'workout',  label, summary, color, getDurationText(), doneSub },
  tabata:   { id, kind: 'workout',  ... },
  wimhof:   { id, kind: 'wimhof',   ... },
  pomodoro: { id, kind: 'pomodoro', ... },   // PR 2
}
export const ACTIVITY_ORDER = ['hiit', 'tabata', 'wimhof']   // PR 2 agrega 'pomodoro'
```

Valores exactos:

| id | label | summary | color | `getDurationText()` | `doneSub` |
|---|---|---|---|---|---|
| `hiit` | `TRACKS.hiit.label` | `TRACKS.hiit.summary` | `TRACKS.hiit.colors.work` | `formatClock(getTotalDuration(config))` → `12:25` | `label + ' · ' + config.rounds.length + ' rounds · ' + duración` |
| `tabata` | ídem con `TRACKS.tabata` | | | → `4:01` | ídem |
| `wimhof` | `WIM HOF` | `4 rondas · guiado en inglés` | `#56c8d8` | `formatClock(WIMHOF.duration)` → `18:00` | `WIM HOF · 4 rondas · 18:00` |
| `pomodoro` | `POMODORO` | `Foco con música lofi` | `#ff6b6b` | `prefs.work + ' / ' + prefs.short` con `prefs = loadPomodoroPrefs()` (§13.7) → `25 / 5` por defecto | `null` (no tiene Done) |

### 11.2 Home: de 2 a 4 tarjetas (2×2, flexbox)

Una fila de 4 no deja espacio para `POMODORO` a tamaño legible; se usa 2×2 con dos
contenedores `.home-row` (sin Grid, sin `gap`). Con 3 actividades (PR 1) la segunda
fila tiene una sola tarjeta alineada a la izquierda.

```
x=96                                                     x=1824
y=54   TIMER                                  (título 64px, alto 90)
y=180  ┌──────── 840×360 ────────┐ 48 ┌──────── 840×360 ────────┐
       │ HIIT                    │    │ TABATA                  │
       │ 12 rounds · 40 / 20     │    │ 8 rounds · 20 / 10      │
       │ 12:25                   │    │ 4:01                    │
y=540  └─────────────────────────┘    └─────────────────────────┘
y=588  ┌─────────────────────────┐    ┌─────────────────────────┐
       │ WIM HOF                 │    │ POMODORO                │
       │ 4 rondas · guiado en…   │    │ Foco con música lofi    │
       │ 18:00                   │    │ 25 / 5                  │
y=948  └─────────────────────────┘    └─────────────────────────┘
y=990  OK  Empezar                            (leyenda 36px, bottom 54)
```

SCSS (reemplaza `.home-cards` y los tamaños de `.card` en `home.scss`):

| Selector | Reglas |
|---|---|
| `.home-rows` | `margin-top: 36px` |
| `.home-row` | `display: flex; height: 360px; margin-bottom: 48px` |
| `.card` | `position: relative; width: 840px; height: 360px; padding: 36px 48px; margin-right: 48px; border-left: 16px solid` (resto igual que hoy; `&:last-child { margin-right: 0 }`) |
| `.card-name` | `font-size: 120px; line-height: 1` |
| `.card-summary` | `font-size: 40px` |
| `.card-duration` | `font-size: 72px` |
| `.card.is-focused` | igual que hoy (`scale(1.05)`, fondo = `color`, texto `$on-phase`) + `z-index: 1` |

`Home.jsx` parte `ACTIVITY_ORDER` en filas de 2 (`i` y `i + 1`), pinta desde
`ACTIVITIES[id]` (`label`, `summary`, `getDurationText()`, `color`). `onStart(id)` no cambia.

**Foco** (`src/homeNav.js`, puro; el foco sigue siendo estado, nunca DOM):

```js
/** action: 'left'|'right'|'up'|'down'. Sin wrap. Si el destino no existe, devuelve index. */
export function moveFocus(index, action, count, cols) → Number   // cols = 2
```

- `left`: `index - 1` si `index % cols !== 0`. `right`: `index + 1` si `index % cols !== cols - 1` y `index + 1 < count`.
- `up`: `index - cols` si `>= 0`. `down`: `index + cols` si `< count`.

Casos de test (`homeNav.test.js`), `cols = 2`:

| count | index, action → resultado |
|---|---|
| 4 | `0,right→1` · `1,right→1` · `1,left→0` · `2,left→2` · `0,down→2` · `1,down→3` · `2,up→0` · `3,down→3` · `0,up→0` |
| 3 | `1,down→1` · `2,right→2` · `0,down→2` · `2,up→0` |

### 11.3 `App.jsx` — máquina de pantallas ampliada

Estado: `{ screen, activityId, run, pomo }` (`pomo` = config elegida en el setup, o `null`).

```
home ─ok─▶ active      (kind workout)  ─fin─▶ done ─ok─▶ active
     ─ok─▶ wimhof      (kind wimhof)   ─fin─▶ done ─ok─▶ wimhof
     ─ok─▶ pomoSetup   (kind pomodoro) ─EMPEZAR─▶ pomoActive ─back×2/stop─▶ pomoSetup ─back─▶ home
```

| screen | Componente | Props |
|---|---|---|
| `home` | `Home` | `onStart(id)`, `onExit` |
| `active` | `Active` (sin cambios) | `key={run}`, `trackId`, `onDone`, `onHome` |
| `wimhof` | `WimHof` (§12) | `key={run}`, `onDone`, `onHome` |
| `done` | `Done` | `color`, `sub`, `onRepeat`, `onHome` |
| `pomoSetup` | `PomodoroSetup` (§13.6) | `onStart(prefs)`, `onHome` |
| `pomoActive` | `PomodoroActive` (§13.8) | `key={run}`, `prefs`, `onExit` (→ `pomoSetup`) |

`Done.jsx` deja de importar `TRACKS`: recibe `color` y `sub` (App pasa
`ACTIVITIES[id].color` y `.doneSub`); `onRepeat` vuelve a la pantalla de origen según
`kind` con `run + 1`. Su leyenda y tamaños no cambian.

### 11.4 Audio empaquetado, versión y tamaño del `.ipk`

`copy-audio.mjs`: la lista `FILES` crece por PR. El resto del script no cambia.

| PR | Archivos añadidos a `FILES` | Bytes añadidos | `.ipk` esperado |
|---|---|---|---|
| (hoy) | HIIT + Tabata | — | 16,3 MB (medido) |
| PR 1 | `win_hof_4rounds.mp3` | 14 131 340 | ~31 MB |
| PR 2, modo `youtube` | ninguno | 0 | ~31 MB |
| PR 2, modo `local` o `both` | las 9 de `LOFI_TRACKS` (§13.3) | 46 683 823 | ~77 MB |

Versión: PR 1 sube a `0.2.0` y PR 2 a `0.3.0`, **en tres lugares a la vez**:
`public/appinfo.json` (`version`), `package.json` (`version`) y la ruta del `.ipk`
dentro del script `tv:install` (`com.timerapp.tv_<versión>_all.ipk`).

**Límites de Developer Mode: verificar en TV.** No hay un límite de tamaño documentado
que este plan pueda afirmar. Lo que se mide y anota en §16 (tareas W8 y P4.3): tiempo
de `ares-install`, si la instalación termina, y espacio libre del TV. Si ~77 MB no
instala, el modo `local` baja a las 4 pistas más livianas (regla en §13.3).

### 11.5 `check-compat.mjs` — reglas nuevas

`es-check` solo ve `dist/assets/*.js`. Un script externo (YouTube) **no está en `dist/`
y no es verificable en build**; se trata así:

1. **Prohibido cargar scripts externos.** Regla nueva: falla si `dist/index.html`
   contiene `<script` con `src="http`. La app nunca carga `iframe_api` ni ningún JS
   remoto en su propio contexto: YouTube corre **solo dentro de un `<iframe>`** y se
   controla por `postMessage` (§13.4). Lo que ejecuta el iframe lo valida el spike en
   el TV real (§13.2), no el build.
2. **Escaneo del código fuente** (`src/**/*.js` y `*.jsx`, excluyendo `*.test.js`):

| Patrón (regex) | Permitido solo en |
|---|---|
| `localStorage` | `src/storage.js` |
| `\bfetch\(` | ningún archivo |
| `\.focus\(` | `src/music/youtubeSource.js` (solo `window.focus()`, §13.4) |
| `\b(e\|ev\|event)\.(key\|code)\b` | ningún archivo |
| `youtube\.com` | `src/music/ytProtocol.js` |

Cada hallazgo imprime archivo + patrón y suma a `bad`.

### 11.6 `tv-webos/CLAUDE.md` — reglas que cambian

Se editan exactamente estas líneas (tarea W0 y P1.3):

- Imports permitidos de `../src`: agregar `pomodoroConfig` (PR 2). Sigue prohibido
  `audioSource.js` (importa `utils/tauri`); por eso los nombres lofi se duplican en
  `lofiTracks.js` con un test que los ata (§13.3).
- `localStorage`: pasa de prohibido a "solo dentro de `src/storage.js`, con try/catch" (PR 2).
- Regla nueva: "Nada de `<script>` externos. YouTube solo en `<iframe>` creado por
  `src/music/youtubeSource.js` (URLs en `ytProtocol.js`). La pantalla de Pomodoro no conoce la fuente de música."

---

## 12. Wim Hof en inglés (PR 1)

### 12.1 Alcance

**Dentro (v1):** reproducir `win_hof_4rounds.mp3` (inglés, ~1080 s, 14 MB, empaquetado)
con tiempo transcurrido / total, barra de progreso, play/pausa y salto de ±30 s.

**Fuera:** versión en español (`win_hof_4rounds-es.mp3`), fases en pantalla y círculo
respiratorio. **Motivo del círculo:** sin ticks no hay forma de sincronizarlo con la voz;
un círculo a ritmo propio contradice al narrador. Entra en v2 (§12.7) junto con las fases.

### 12.2 Interfaces

**`src/wimhof.js`** (puro, sin imports de `../src`):

```js
export const WIMHOF = {
  id: 'wimhof',
  label: 'WIM HOF',
  audioSrc: 'audio/win_hof_4rounds.mp3',
  startTime: 0,
  duration: 1080.05,   // respaldo; en runtime manda audio.duration
}

/** audio.duration puede ser NaN/Infinity/0 en Chromium 38 antes de la metadata. */
export function resolveTotal(audioDuration) → Number
//   isFinite(d) && d > 0 ? d : WIMHOF.duration

export function getWimHofState(audioTime, total) → {
  elapsedSec: Number,   // min(floor(max(0, audioTime)), totalSec)
  totalSec: Number,     // floor(total)
  leftSec: Number,      // totalSec - elapsedSec
  elapsedText: String,  // formatClock(elapsedSec)
  totalText: String,
  leftText: String,
  progress: Number,     // clamp(audioTime / total, 0, 1)
  done: Boolean,        // audioTime >= total
}

/** dir = -1 | +1. Salto de 30 s. Devuelve audio.currentTime o null. */
export function getWimHofSeek(audioTime, total, dir) → Number | null
//   dir -1 → max(0, audioTime - 30)
//   dir +1 → null si audioTime >= total - 1; si no, min(audioTime + 30, total - 1)
```

**`src/player.js`** — único cambio, aditivo: `getDuration: function () { return audio.duration }`.
`createPlayer(WIMHOF, hooks)` funciona tal cual (usa `audioSrc` y `startTime`).

**`src/useWimHofClock.js`**: `useWimHofClock(player) → state`. Mismo patrón que
`useClock.js` (loop rAF, cancelar al desmontar); calcula
`getWimHofState(player.getTime(), resolveTotal(player.getDuration()))` y hace `setState`
solo si cambió `elapsedSec`, `totalSec` o `done`.

**`src/components/BigClock.jsx`**: `BigClock({ text })`. Pinta `m:ss` con cada carácter
en un `<span>`: dígitos con clase `digit` (ya existe, `0.5em`), `:` con clase `colon`
(`display: inline-block; width: 0.25em; text-align: center`). Contenedor `.big-clock`.
Lo reutiliza Pomodoro.

**`src/screens/WimHof.jsx`**: `WimHof({ onDone, onHome })`. Estructura calcada de
`Active.jsx`: `useMemo(createPlayer(WIMHOF, { onEnded: onDone, onError }))`,
`useEffect` con `player.play()` / `player.destroy()`, `useWimHofClock`, `useRemote`,
estados `paused`, `error`, `debug`. Si `state.done` → `onDone()`.

### 12.3 Controles

| Estado | Acción | Efecto |
|---|---|---|
| Reproduciendo | `ok`, `playPause` | Pausa |
| Reproduciendo | `back` | Pausa (igual que Active: el primer Back no saca) |
| En pausa | `ok`, `playPause` | Reanuda |
| En pausa | `back` | → Home |
| Cualquiera | `left` / `right` | `player.seek(getWimHofSeek(...))` si no es `null` |
| Cualquiera | `stop` | → Home |
| Cualquiera | `debug` | Alterna `DebugOverlay` (recibe `player`) |
| Error de audio | `back`, `ok` | → Home |
| Fin (`ended` o `done`) | — | → Done (`OK Repetir · BACK Inicio`) |

Reproduce de inmediato al entrar, como HIIT/Tabata.

### 12.4 Diseño (10-foot)

Se hace acostado y con poca luz: **fondo oscuro**, no el color pleno de los workouts.
Tokens nuevos en `_tokens.scss`: `$wimhof: #56c8d8` (acento; mismo valor que
`ACTIVITIES.wimhof.color`) y `$wimhof-bg: #203a43` (tono medio del gradiente
`--wimhof-bg` de la app web, plano).

```
┌──────────────────────────────────────────────────────────────┐
│  WIM HOF                                    GUIADO · INGLÉS  │  96px $wimhof / 72px $text-dim
│                                                              │
│                           7:32                               │  BigClock 400px, $text
│                         de 18:00                             │  64px, $text-dim
│                                                              │
│  Restan 10:28                                   ◀ ▶  30 s    │  48px / 48px $text-dim
│  ████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │  ProgressBar
│  Sentado o acostado. Nunca en el agua ni manejando.          │  32px, $text-dim
└──────────────────────────────────────────────────────────────┘
```

`src/styles/wimhof.scss` (importar en `base.scss`):

| Selector | Reglas |
|---|---|
| `.wimhof` | `position: relative; width: 1920px; height: 1080px; overflow: hidden; background: $wimhof-bg; color: $text` |
| `.wimhof-top` | `position: absolute; top: 54px; left: 96px; right: 96px; height: 120px; display: flex; justify-content: space-between; align-items: center` |
| `.wimhof-center` | `position: absolute; top: 174px; left: 0; width: 1920px; height: 620px; display: flex; flex-direction: column; align-items: center; justify-content: center` |
| `.big-clock` | `font-size: 400px; line-height: 1; white-space: nowrap` |
| `.wimhof-bottom` | `position: absolute; left: 96px; right: 96px; bottom: 54px` |
| `.wimhof .progress-track` | `background: rgba(255, 255, 255, 0.15)` |
| `.wimhof .progress-fill` | `background: $wimhof` |
| `.wimhof-note` | `font-size: 32px; color: $text-dim; margin-top: 20px` |

Overlays de pausa y error: se reutilizan `.overlay`, `.overlay-title`, `.overlay-hint`.
Leyenda de pausa: `OK  Seguir  ·  ◀ ▶  30 s  ·  BACK  Salir`.

### 12.5 Tests (`src/wimhof.test.js`)

Con `total = 1080.05`:

| Entrada | Esperado |
|---|---|
| `resolveTotal(NaN)`, `(Infinity)`, `(0)` | `1080.05` |
| `resolveTotal(1080.018)` | `1080.018` |
| `getWimHofState(0, total)` | `elapsedText '0:00'`, `totalText '18:00'`, `leftText '18:00'`, `progress 0`, `done false` |
| `getWimHofState(452.7, total)` | `elapsedText '7:32'`, `leftText '10:28'`, `progress ≈ 0.41915` (±0,0001) |
| `getWimHofState(-3, total)` | `elapsedSec 0`, `progress 0` |
| `getWimHofState(1080.05, total)` | `done true`, `progress 1`, `leftText '0:00'` |
| `getWimHofState(2000, total)` | `elapsedSec 1080`, `progress 1`, `done true` |
| `getWimHofSeek(100, total, 1)` | `130` |
| `getWimHofSeek(10, total, -1)` | `0` |
| `getWimHofSeek(1070, total, 1)` | `1079.05` (±0,001) |
| `getWimHofSeek(1079.5, total, 1)` | `null` |
| Barrido 0…1080 paso 0,5 | `elapsedSec + leftSec === totalSec` siempre; `progress` monótono |

Además: `ACTIVITIES.wimhof.getDurationText() === '18:00'` y cada id de
`ACTIVITY_ORDER` existe en `ACTIVITIES` (`src/activities.test.js`).

### 12.6 Tareas (rama `feat/tv-webos-wimhof`)

| ID | Tarea | Modelo | Aceptación |
|---|---|---|---|
| W0 | Commit de `PLAN.md` (§11-16) y edición de `tv-webos/CLAUDE.md` según §11.6 (solo la regla de scripts externos; las de PR 2 van en P1.3) | Haiku | `git show --stat` toca solo esos 2 archivos |
| W1 | `wimhof.js` (solo la constante `WIMHOF`), `activities.js` con 3 actividades, `homeNav.js` + `homeNav.test.js` + `activities.test.js` | Sonnet | `npm test` en verde; casos de §11.2 presentes |
| W2 | Home 2×2 (§11.2), `Done.jsx` genérico y `App.jsx` (§11.3, sin las pantallas de Pomodoro); la tarjeta Wim Hof lleva a un `WimHof` provisional que solo muestra el título | Sonnet | En `npm run dev`: ←/→/↑/↓ recorren las 3 tarjetas según la tabla; HIIT y Tabata siguen completando Home → Active → Done → Home |
| W3 | `copy-audio.mjs` (+ `win_hof_4rounds.mp3`), versión `0.2.0` (3 lugares, §11.4), reglas nuevas de `check-compat.mjs` (§11.5) | Sonnet | `npm run build` pasa; agregar a mano `fetch('x')` en un `.jsx` lo hace fallar con el archivo y el patrón; `dist/audio/win_hof_4rounds.mp3` existe |
| W4 | `wimhof.js` completo (§12.2) + `wimhof.test.js` (§12.5); `getDuration` en `player.js` | Sonnet | `npm test` en verde |
| W5 | `BigClock.jsx`, `useWimHofClock.js`, `screens/WimHof.jsx`, `wimhof.scss`, tokens | Sonnet | En Chrome por `file://` (`open dist/index.html`): suena, el reloj avanza 1/s, ◀▶ saltan 30 s, Back en dos pasos, al terminar (seek al final) pasa a Done y OK repite; cada fila de §12.3 se cumple |
| W6 | `npm test`, `npm run build`, `npm run tv:package`; anotar en §16 tamaño del `.ipk`; `npm run tv:install` | Sonnet | Los 3 comandos con código 0; `.ipk` `0.2.0` existe; si `tv:install` falla por TV apagado → se anota y queda para W8 |
| W7 | Push y PR contra `feat/tv-webos` (§14.3) | Sonnet | URL del PR impresa; cuerpo con la salida resumida de W6 y la lista 👤 |
| W8 | **👤 TV** — instalar (`npm run tv:install`), Home con 3 tarjetas y foco con el D-pad, Wim Hof completo o al menos 3 min + seek + pausa + fin, HIIT sigue funcionando. Medir tiempo de instalación del `.ipk` de ~31 MB | Persona | Resultados en §16; es **puerta de merge**, no de apertura del PR |

### 12.7 v2 opcional: fases con ticks (PR aparte, `feat/tv-webos-wimhof-phases`)

No se empieza sin pedido explícito del usuario. Requiere la tarea 👤 W9.

| ID | Tarea | Modelo | Aceptación |
|---|---|---|---|
| W9 | **👤** Marcar en Audacity según `docs/WIM_HOF_AUDACITY.md` §2-4 y exportar `tv-webos/scripts/wim_hof_labels.txt` (14 etiquetas: `intro`, `breathe_rN`, `hold_rN`, `recovery_rN` para N = 1…4, `end`) | Persona | El archivo existe con 14 líneas |
| W10 | `scripts/labels-to-ticks.mjs` → genera `tv-webos/src/wimHofTicks.js` | Haiku | 14 ticks, `time` creciente |
| W11 | `getWimHofPhase` + tests, etiqueta de fase/ronda y círculo en `WimHof.jsx` | Sonnet | Tests en verde; el círculo anima solo `transform` |

Formato de `wimHofTicks.js`: **mismos nombres de campo que `HIIT_TICKS` / `TABATA_TICKS`**
(`time`, `phase`, `round`), no el `{ t, phase }` que sugiere el doc de Audacity:

```js
export const WIMHOF_TICKS = [
  { time: 0,      phase: 'intro' },
  { time: 45.821, phase: 'breathe',  round: 1 },   // valores de ejemplo
  { time: 98.456, phase: 'hold',     round: 1 },
  { time: 160.01, phase: 'recovery', round: 1 },
  // … rounds 2-4 …
  { time: 1065.2, phase: 'end' },
]
```

`buildConfigFromTicks` de `ticksEngine.js` solo modela `prep/work/rest` (dos fases por
round), así que **no se usa**; la TV lleva su propia función pura:

```js
/** Último tick con time <= audioTime. */
export function getWimHofPhase(ticks, audioTime) → {
  phase: 'intro'|'breathe'|'hold'|'recovery'|'end', round: Number|null,
  timeInPhase: Number, phaseDuration: Number   // hasta el tick siguiente; en 'end', hasta total
}
```

Etiquetas: `INTRO`, `RESPIRA`, `RETÉN`, `RECUPERA`, `FIN`; `RONDA n / 4`. Círculo de
320 px sobre el reloj: `scale(1.0 ↔ 1.25)` cada 3,5 s en `breathe`, `scale(0.8)` fijo en
`hold`, `scale(1.25)` fijo en `recovery`. Los ticks viven en `tv-webos/src/` hasta que
la app web implemente la feature; entonces se mueven a `src/config/` en el repo principal.

### 12.8 Riesgos

1. **`audio.duration` no confiable** en Chromium 38 con MP3 → cubierto por `resolveTotal`.
2. **Seek en un MP3 de 18 min** puede tardar o caer impreciso en el TV → verificar en W8;
   no afecta la lógica (el reloj lee `currentTime`).
3. **Salvapantallas** durante las retenciones: mismo riesgo 2 de §6; lo resuelve T4.1.
4. **Tamaño:** el `.ipk` pasa a ~31 MB → medir instalación en W8.

---

## 13. Pomodoro configurable con música (PR 2)

### 13.1 Alcance

**Dentro:** Pomodoro con duraciones configurables desde el control (presets + steppers),
ciclo trabajo / descanso corto / descanso largo, y música elegida de un **listado fijo**.
La fuente de la música (YouTube o MP3 lofi empaquetados) la decide el spike de §13.2.

**Fuera de este PR:** buscador de YouTube (v2, §13.10), estadísticas, sonidos
configurables, persistencia del timer en curso, volumen propio (se usa el del TV).

### 13.2 Spike de YouTube (Slice P0, **obligatorio antes de cualquier UI**)

Tres riesgos independientes, que el spike mide por separado:

| Variable | Pregunta | Cómo se aísla |
|---|---|---|
| **MOTOR** | ¿El player embebido de YouTube corre en el Chromium del TV? | Embed dentro de una página servida por `http://` (origen válido) |
| **ORIGEN** | ¿YouTube acepta el embed desde `file://` (sin `Referer`; error 153)? | El mismo embed directo desde la app empaquetada |
| **CONTROL** | ¿Responde a `postMessage` (play/pausa/estado) y el control sigue llegando a la app? | Comandos desde el spike con OK |

**Artefactos (tarea P0.2).** Todo HTML/JS escrito a mano en **ES5**, sin build:

- `tv-webos/bridge/yt-bridge.html` — "puente": lee `?v=ID`, crea un `<iframe>` a
  pantalla completa con el embed de YouTube y **reenvía `postMessage` en ambos
  sentidos** (de `window.parent` al iframe y del iframe a `window.parent`, destino `'*'`).
- `tv-webos/bridge/hosted.html` — página completa (no iframe) con el embed directo, el
  mismo log en pantalla y `back` (461) → `history.back()`.
- `tv-webos/spike/` — mini app webOS independiente: `appinfo.json`
  (`id: com.timerapp.tvspike`, `version: 0.0.1`, `main: index.html`), `index.html`,
  `icon.png` (copia del actual), y `config.js` generado (gitignored vía `tv-webos/.gitignore`).
- `scripts/make-spike.mjs --host <ip-del-Mac> --port 8099 --vod <ID> --live <ID>` →
  escribe `spike/config.js` (`window.SPIKE = { host, port, vod, live }`). La IP sale de
  `ipconfig getifaddr en0`.
- Scripts npm: `spike:serve` = `python3 -m http.server 8099 --directory bridge`;
  `spike:install` = `ares-package spike --no-minify -o build && ares-install --device tv build/com.timerapp.tvspike_0.0.1_all.ipk && ares-launch --device tv com.timerapp.tvspike`.

`spike/index.html`: lista de pruebas (↑/↓ + OK; foco como estado), un recuadro de
video 960×540 y un log en pantalla (32 px, últimas 12 líneas, con ms desde el inicio).
`▶` alterna entre el ID `vod` y el `live`. `BACK` vuelve a la lista (destruye el iframe).

| Prueba | Qué hace | Evidencia automática en el log |
|---|---|---|
| S0 | Muestra `navigator.userAgent`; `localStorage` set/get/remove de una clave; beep con `AudioContext \|\| webkitAudioContext` (880 Hz, 150 ms) | `ls: ok/fail`, `audioctx: ok/fail` |
| S1 | Embed directo: `https://www.youtube.com/embed/ID?autoplay=1&controls=0&rel=0&playsinline=1&enablejsapi=1&fs=0&disablekb=1&iv_load_policy=3` | `iframe load` |
| S2 | S1 + protocolo `postMessage` (§13.4); OK alterna `pauseVideo` / `playVideo` | `msg onReady`, `state 1`, `state 2`, `error N` |
| S3 | iframe a `http://HOST:PORT/yt-bridge.html?v=ID` con el mismo protocolo | igual que S2 |
| S4 | `location.href = 'http://HOST:PORT/hosted.html?v=ID'` (app alojada) | log de `hosted.html` |

**Tarea 👤 P0.3 — guion exacto para la persona:**

1. En el Mac: `npm run spike:serve` (dejarlo corriendo; si macOS pregunta por el firewall, permitir).
2. Opcional pero barato: abrir `http://HOST:8099/hosted.html?v=ID` en el **navegador
   del TV**. Anotar si se ve y se oye.
3. `npm run spike:install`. Correr S0…S4, cada una con el ID `vod` y con el `live`.
4. Por cada prueba anotar en §16: ¿se ve el video?, ¿**se oye ≥ 2 min**?, ¿OK pausa y
   reanuda?, ¿después de reproducir, ↑/↓/BACK siguen respondiendo?, código de error o
   texto que muestre el player, y las líneas del log.

**Árbol de decisión (tarea P0.4, Opus).** "Pasa" = se oye ≥ 2 min **y** el control
sigue respondiendo. Se aplica la primera fila que se cumpla:

| # | Resultado | Decisión | `MUSIC_MODE` | `YT_BRIDGE_URL` | `YT_CONTROL` |
|---|---|---|---|---|---|
| 1 | S2 pasa con pausa/reanudar | **A** — iframe directo | `youtube` | `''` | `postmessage` |
| 2 | S1 pasa pero S2 no controla | **A** degradada | `youtube` | `''` | `reload` |
| 3 | S3 pasa con pausa/reanudar | **B1** — puente alojado | `youtube` | `http://192.168.0.103:8088/yt-bridge.html` | `postmessage` |
| 4 | S3 suena pero no controla | **B1** degradada | `youtube` | ídem | `reload` |
| 5 | Solo S4 pasa | **C** en este PR + propuesta **B2** anotada en §16 | `local` | `''` | — |
| 6 | Nada pasa (MOTOR falla) | **C** — lofi MP3 empaquetado | `local` | `''` | — |

Si solo pasa el ID `vod` (o solo el `live`), la decisión vale y `lofiList.js` se limita
a ese tipo. Si los resultados son contradictorios o incompletos, Opus pide a la persona
repetir la prueba puntual; **no se asume un resultado**.

Qué exige cada alternativa:

- **A — iframe directo.** Nada de infraestructura. Pomodoro necesita internet para la
  música; el resto de la app sigue offline.
- **B1 — puente alojado.** La app sigue empaquetada y offline; **solo** el iframe de
  música apunta al homelab. Infraestructura (tarea 👤 P0.5): un `server` de nginx en
  `192.168.0.103` puerto `8088` sirviendo como estáticos el contenido de
  `tv-webos/bridge/` (`root /srv/tv-bridge; listen 8088; location / { try_files $uri =404; }`),
  copiado con `scp tv-webos/bridge/*.html` al homelab. HTTP plano a propósito: un
  certificado autofirmado fallaría en el TV. La música depende de que el homelab esté
  encendido y de internet; si no, Pomodoro corre en silencio con aviso (§13.8).
- **B2 — app alojada completa** (`main` del `.ipk` redirige a
  `http://192.168.0.103:8088/app/`). Exigiría: publicar `dist/` completo (incluidos los
  MP3) en nginx, un paso de despliegue por cada cambio, y **rompe el offline de toda la
  app**: sin homelab no hay ni HIIT. Por eso **no se implementa en este PR**: se
  entrega C y B2 queda como propuesta para aprobación explícita del usuario.
- **C — lofi local.** Las 9 pistas de `AUDIO_FILES.lofi` empaquetadas (+46,7 MB).
  Funciona offline. Es también el modo por defecto del código mientras no haya decisión.
- **Descartado:** lanzar la app nativa de YouTube (webOS no mantiene dos apps en primer
  plano: no habría timer en pantalla) y cargar `iframe_api` en el contexto de la app
  (script externo no verificable, §11.5).

**Puerta:** los slices P2 y P3 no empiezan sin P0.4 escrita en §16. El slice P1 (lógica
pura) no depende del spike y puede hacerse antes.

### 13.3 Listados de música

**`src/lofiList.js`** (YouTube; esquema fijo, **prohibido inventar IDs**):

```js
// Cada entrada validada con `npm run lofi:check` (oEmbed HTTP 200) y aprobada por el usuario.
export const LOFI_LIST = [
  // { id: '<11 caracteres>', title: '<máx. 60 caracteres>' },
]
```

**Tarea P0.1 — obtener candidatos:** buscar en la web (WebSearch) videos y streams de
lofi; el `id` se extrae **de la URL de un resultado real**, nunca de memoria. Meta: ≥ 8
entradas, de las cuales ≥ 2 streams en vivo y ≥ 4 mixes de ≥ 1 h.
`scripts/validate-lofi.mjs` (Node, usa `fetch` de Node; script `lofi:check`) pide
`https://www.youtube.com/oembed?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3D<ID>&format=json`
por cada entrada; imprime `id · status · title devuelto`; sale con código 1 si alguna
no da 200 (401 = embed deshabilitado, 404 = no existe). El `title` del archivo se toma
del que devuelve oEmbed, recortado. `lofi:check` **no** forma parte de `npm run build`
(el build debe funcionar sin red). Si no hay herramienta de búsqueda disponible, el
agente se detiene y pide al usuario las URLs. La lista final requiere aprobación 👤 (P4.2).

**`src/lofiTracks.js`** (local; puro, importable desde Node para `copy-audio.mjs`):

```js
export const LOFI_TRACKS = [
  { file: 'lofi_morning_routine-chosic.com.mp3', title: 'Morning Routine' },
  { file: 'lofi_music_library-lofi-ambient-study-lofi-music-455378.mp3', title: 'Ambient Study' },
  { file: 'fassounds-lofi-study-calm-peaceful-chill-hop-112191.mp3', title: 'Calm Chill Hop' },
  { file: 'fassounds-good-night-lofi-cozy-chill-music-160166.mp3', title: 'Good Night' },
  { file: 'lofidreams-cozy-lofi-background-music-for-study-457198.mp3', title: 'Cozy Study' },
  { file: 'mondamusic-lofi-lofi-girl-lofi-chill-512853.mp3', title: 'Lofi Chill' },
  { file: 'pulsebox-lofi-melody-522894.mp3', title: 'Lofi Melody' },
  { file: 'pulsebox-lofi-night-522890.mp3', title: 'Lofi Night' },
  { file: 'pulsebox-lofi-smooth-522876.mp3', title: 'Lofi Smooth' },
]
```

Test que lo ata al repo principal sin importarlo: leer
`../src/config/audioSource.js` como texto (`readFileSync`) y verificar que contiene
cada `file`. `copy-audio.mjs` importa `MUSIC_MODE` y `LOFI_TRACKS` y copia las 9 solo si
el modo es `local` o `both`. Si en P4.3 el `.ipk` de ~77 MB no instala: dejar las 4
más livianas (`lofi_morning_routine…` 1,9 MB, `pulsebox-lofi-smooth…` 3,2 MB,
`mondamusic…` 3,5 MB, `pulsebox-lofi-night…` 4,0 MB) y ajustar el test de cantidad.

### 13.4 Interfaz `musicSource` (`src/music/`)

La pantalla de Pomodoro solo conoce esto. A, B1 y C se intercambian cambiando
`config.js`, sin tocar `screens/`.

```
src/music/
  config.js          ← MUSIC_MODE, YT_BRIDGE_URL, YT_CONTROL (valores de P0.4)
  index.js           ← getMusicCatalog(), createMusicSource()
  noneSource.js  localSource.js  youtubeSource.js
  ytProtocol.js      ← puro: URLs y parseo de mensajes
```

```js
// config.js — puro, importable desde Node
export var MUSIC_MODE = 'local'        // 'local' | 'youtube' | 'both'
export var YT_BRIDGE_URL = ''          // '' = embed directo (A); URL = puente (B1)
export var YT_CONTROL = 'postmessage'  // 'postmessage' | 'reload'

// index.js
/** Siempre empieza con { id: 'none', kind: 'none', title: 'Sin música' }. */
export function getMusicCatalog(mode /* = MUSIC_MODE */) → [{ id, kind, title }]
//   local   → 'local:0' … 'local:8'  (title de LOFI_TRACKS)
//   youtube → 'yt:<videoId>'         (title de LOFI_LIST)
//   both    → none, locales, luego youtube
export function defaultMusicId(catalog) → String   // catalog[1].id si existe; si no 'none'
export function createMusicSource(musicId, hooks) → MusicSource
//   id desconocido → noneSource

MusicSource = {
  kind: 'none' | 'local' | 'youtube',
  hasVideo: Boolean,         // true solo en youtube: la pantalla reserva el recuadro
  mount(containerEl),        // youtube: crea el iframe adentro; resto: no-op
  play(), pause(),
  next(),                    // siguiente entrada del mismo listado, con wrap
  getTitle() → String,
  destroy(),
}
hooks = { onTitle(title), onError(code) }   // code: Number de YouTube | 'timeout' | 'all-failed'
```

- **`noneSource`**: todo no-op; `getTitle()` → `'Sin música'`.
- **`localSource`**: un `HTMLAudioElement`, `src = 'audio/' + file`. `play()` con la
  guarda de §2.1. `ended` → `next()`. `error` → `next()`; tras 9 errores seguidos →
  `onError('all-failed')`. Empieza en la pista elegida y sigue en orden.
- **`youtubeSource`**: crea `<iframe width=480 height=270 frameborder=0 allow="autoplay; encrypted-media">`
  dentro de `containerEl` con `src = buildEmbedUrl(id, YT_BRIDGE_URL)`. Sin `<script>`
  externos. Protocolo (`YT_CONTROL = 'postmessage'`):
  - Al `load` del iframe, enviar cada 500 ms (máx. 20 veces, hasta recibir algo)
    `{"event":"listening","id":1,"channel":"widget"}` con `iframe.contentWindow.postMessage(str, '*')`.
  - Comandos: `{"event":"command","func":"playVideo","args":[]}` y `pauseVideo`.
  - Escuchar `message` en `window`; aceptar solo si `e.source === iframe.contentWindow`;
    parsear con `parseYtMessage`.
  - `state 0` (terminó) → `next()`. Error `100`, `101` o `150` → `next()` automático;
    si falla toda la lista seguida → `onError('all-failed')`. Otros errores (`2`, `5`,
    `153`) → `onError(code)`. Sin ningún mensaje a los 15 s de `mount` → `onError('timeout')`.
  - `YT_CONTROL = 'reload'`: `pause()` = `iframe.src = 'about:blank'`; `play()` = volver
    a poner la URL (reinicia el video; aceptable para lofi). Sin timeout ni detección de fin.
  - **Foco:** si el iframe roba el foco, el control deja de llegar a la app. Dos
    defensas: un `<div class="pomo-video-shield">` transparente encima del recuadro
    (que el puntero del Magic Remote nunca haga click en el iframe) y, en el `blur` de
    `window`, `setTimeout(function () { window.focus() }, 0)`. Es la única excepción a
    la regla de foco DOM y vive solo en este archivo.

```js
// ytProtocol.js
export function buildEmbedUrl(videoId, bridgeUrl) → String
//   bridgeUrl '' → 'https://www.youtube.com/embed/' + id + '?enablejsapi=1&autoplay=1&controls=0&rel=0&playsinline=1&fs=0&disablekb=1&iv_load_policy=3'
//   si no       → bridgeUrl + '?v=' + id
export function ytCommand(func) → String            // JSON del comando
export function parseYtMessage(data) →
  { type: 'ready' } | { type: 'state', state: Number } | { type: 'error', code: Number } | null
//   data es string JSON u objeto. 'onReady' → ready. 'onStateChange' con info numérico → state.
//   'infoDelivery'/'initialDelivery' con info.playerState numérico → state. 'onError' → error.
//   Cualquier otra cosa o JSON inválido → null (nunca lanza).
```

### 13.5 Reloj del Pomodoro (`src/pomodoroClock.js`, puro)

No hay audio que sirva de reloj. La verdad es **`Date.now()` contra un vencimiento
absoluto** (`endsAt`); nunca se cuenta sumando intervalos. Todas las funciones reciben
`now` (ms) y devuelven un estado nuevo (o el mismo objeto si nada cambió).

```js
export var MAX_CATCHUP_MS = 10000

cfg   = { workMs, shortMs, longMs, every }       // every = sesiones antes del descanso largo
state = { phase: 'work'|'short'|'long', session: Number /* 1-based */, completed: Number,
          running: Boolean, endsAt: Number|null, remainingMs: Number, durationMs: Number,
          suspended: Boolean }

export function breakKind(session, every) → 'short' | 'long'      // long si session % every === 0
export function createPomodoro(cfg) → state   // work, session 1, parado, remainingMs = workMs
export function start(state, now) → state     // running, endsAt = now + remainingMs, suspended = false
export function pause(state, now) → state     // remainingMs = max(0, endsAt - now), endsAt = null
export function tick(state, cfg, now) → state
export function skip(state, cfg, now) → state          // a la fase siguiente; una sesión saltada NO suma a completed
export function restartPhase(state, cfg, now) → state  // remainingMs = durationMs (y endsAt = now + durationMs si corre)
export function getPomodoroView(state, cfg, now) → {
  phase, session, sessionInCycle /* ((session-1) % every) + 1 */, every, completed, running, suspended,
  timeLeftMs, clockText /* formatClock(Math.ceil(timeLeftMs / 1000)) */,
  progress /* 1 - timeLeftMs / durationMs, 0..1 */,
  next: 'work' | 'short' | 'long', nextMinutes: Number,
}
```

Reglas de `tick` (solo actúa si `running && now >= endsAt`):

- **Transición:** de `work` → `completed + 1` y fase `breakKind(session, every)`; de
  `short`/`long` → `work` con `session + 1`.
- **Corrección de deriva:** si `now - endsAt <= MAX_CATCHUP_MS`, la fase nueva vence en
  `endsAt_anterior + duraciónNueva` (anclada al vencimiento anterior, no a `now`). Un
  tick que llega 400 ms tarde no alarga el ciclo.
- **Suspensión del JS** (TV en espera, app en segundo plano): si
  `now - endsAt > MAX_CATCHUP_MS`, se avanza **una sola fase** y queda **en pausa** con
  la duración completa de la fase nueva (`running: false`, `endsAt: null`,
  `suspended: true`). No se "recuperan" fases que nadie vivió. Dentro de una fase, el
  tiempo de pared manda: si el JS se congela 3 min a mitad de una fase, al volver
  faltan 3 min menos.
- `skip` con el timer en pausa deja la fase nueva en pausa con su duración completa.

**`src/usePomodoro.js`**: `usePomodoro(cfg, hooks) → { view, toggle(), skip(), restart() }`.
`setInterval` de 250 ms (no rAF) que llama `tick(state, cfg, Date.now())`; `setState`
solo si cambió `clockText`, `phase`, `session`, `running` o `suspended`. Arranca
corriendo al montar. Llama `hooks.onPhaseChange(phase)` en cada transición.

**`src/beep.js`**: `playChime()` — dos tonos (880 Hz y 1175 Hz, 150 ms cada uno) con
`window.AudioContext || window.webkitAudioContext`, todo en `try/catch`; si no existe,
no-op. Suena en cada cambio de fase. (S0 del spike dice si funciona en el TV.)

### 13.6 Presets y pantalla de configuración

**`src/pomodoroSetup.js`** (puro). Importa de `../../src/config/pomodoroConfig.js`
**solo** `POMODORO_CONFIG` y `POMODORO_PRESETS`, y de ellos **solo las duraciones**
(`workDuration`, `shortBreakDuration`, `longBreakDuration`, `sessionsBeforeLongBreak`).
`messages` / `subtitles` son claves i18n: la TV no las usa. El preset `custom` del repo
principal se ignora: en la TV "personalizado" es lo que resulta de mover un stepper.

```js
prefs = { work, short, long, every, musicId }   // minutos, entero; every = sesiones

export const PRESETS = [   // derivado en runtime de pomodoroConfig (segundos / 60)
  { id: 'classic',  label: 'CLÁSICO',  work: 25, short: 5,  long: 15, every: 4 },  // POMODORO_CONFIG
  { id: 'baby',     label: 'CORTO',    work: 10, short: 5,  long: 10, every: 4 },
  { id: 'popular',  label: 'POPULAR',  work: 20, short: 5,  long: 15, every: 4 },
  { id: 'medium',   label: 'MEDIO',    work: 40, short: 8,  long: 20, every: 4 },
  { id: 'extended', label: 'LARGO',    work: 60, short: 10, long: 25, every: 4 },
]
export const LIMITS = {
  work:  { min: 5, max: 90, step: 5 },
  short: { min: 1, max: 30, step: 1 },
  long:  { min: 5, max: 60, step: 5 },
  every: { min: 2, max: 8,  step: 1 },
}
export function matchPreset(prefs) → String            // id del preset igual en los 4 campos, o 'custom'
export function cyclePreset(presetId, dir) → String    // con wrap; desde 'custom': +1 → 'classic', -1 → 'extended'
export function applyPreset(prefs, presetId) → prefs   // conserva musicId
export function stepField(prefs, field, dir) → prefs   // clamp a LIMITS, sin wrap
export function cycleMusic(musicId, catalog, dir) → String   // con wrap
export function sanitizePrefs(raw, catalog) → prefs    // cualquier campo inválido o fuera de rango → valor de 'classic'; musicId desconocido → defaultMusicId(catalog)
export function toClockConfig(prefs) → cfg             // minutos → ms
```

**`screens/PomodoroSetup.jsx`** — `PomodoroSetup({ onStart, onHome })`. Siete filas,
foco como estado (`row` 0…6). Foco inicial en **EMPEZAR** (fila 6): desde Home, OK + OK
arranca con la última configuración.

```
┌──────────────────────────────────────────────────────────────┐
│  POMODORO                                                    │  96px, $pomo-work, alto 120 (y=54)
│  PRESET                              ◀  CLÁSICO  ▶           │  fila 0   y=190
│  TRABAJO                             ◀  25 min  ▶            │  fila 1
│  DESCANSO                            ◀  5 min  ▶             │  fila 2
│  DESCANSO LARGO                      ◀  15 min  ▶            │  fila 3
│  SESIONES POR CICLO                  ◀  4  ▶                 │  fila 4
│  MÚSICA                              ◀  Lofi Night  ▶        │  fila 5
│  [                      EMPEZAR                      ]       │  fila 6   termina en y=918
│  ▲▼ Elegir · ◀▶ Cambiar · OK Empezar · BACK Inicio           │  36px, bottom 54
└──────────────────────────────────────────────────────────────┘
```

| Selector | Reglas |
|---|---|
| `.pomo-setup` | `width: 1920px; height: 1080px; box-sizing: border-box; padding: 54px 96px; background: $bg; position: relative` |
| `.pomo-title` | `font-size: 96px; line-height: 120px; height: 120px; color: $pomo-work; margin-bottom: 16px` |
| `.pomo-row` | `display: flex; justify-content: space-between; align-items: center; height: 88px; margin-bottom: 16px; padding: 0 40px; box-sizing: border-box; background: $surface; font-size: 52px` |
| `.pomo-row.is-focused` | `background: $pomo-work; color: $on-phase` |
| `.pomo-row-value` | `width: 760px; display: flex; justify-content: space-between` (`◀`, texto, `▶`) |
| `.pomo-row.is-start` | `justify-content: center; font-size: 60px` |
| `.pomo-hint` | `position: absolute; left: 96px; bottom: 54px; font-size: 36px; color: $text-dim` |

Preset `custom` se muestra como `PERSONALIZADO`. Títulos de música recortados a 28
caracteres + `…`. Con una sola entrada en el catálogo (`Sin música`) la fila se muestra igual.

| Acción | Efecto |
|---|---|
| `up` / `down` | Mueve `row` (sin wrap) |
| `left` / `right` en fila 0 | `applyPreset(prefs, cyclePreset(matchPreset(prefs), dir))` |
| `left` / `right` en filas 1-4 | `stepField` |
| `left` / `right` en fila 5 | `cycleMusic` |
| `left` / `right` en fila 6 | Nada |
| `ok` en filas 0-5 | Salta el foco a la fila 6 |
| `ok` en fila 6, o `playPause` en cualquiera | `savePomodoroPrefs(prefs)` y `onStart(prefs)` |
| `back` | `onHome()` |

### 13.7 Persistencia

**Decisión: sí, mínima.** Reconfigurar siete filas con el control en cada uso es el
costo que hace que la feature no se use. Se persiste **solo la última configuración**
(no el timer en curso, no estadísticas).

**`src/storage.js`** — único archivo autorizado a tocar `localStorage` (§11.5, §11.6):

```js
var KEY = 'timer-tv:pomodoro:v1'
export function loadJson(key) → Object | null     // try/catch; JSON inválido o sin storage → null
export function saveJson(key, value) → Boolean    // try/catch; nunca lanza
export function loadPomodoroPrefs() → prefs       // sanitizePrefs(loadJson(KEY), getMusicCatalog())
export function savePomodoroPrefs(prefs)
```

Si `localStorage` no existe o falla bajo `file://` en el TV (S0 del spike lo dice), la
app funciona igual con los valores por defecto: la persistencia es una comodidad, nunca
un requisito.

### 13.8 Pantalla activa (`screens/PomodoroActive.jsx`)

`PomodoroActive({ prefs, onExit })`. Usa `usePomodoro(toClockConfig(prefs), …)` y
`createMusicSource(prefs.musicId, …)` (en `useMemo`; `mount` + `destroy` en `useEffect`).
Un `useEffect` sobre `view.running` llama `source.play()` o `source.pause()`: la música
sigue al timer y suena en todas las fases.

**Fondo oscuro siempre** (`$bg`): es una pantalla que queda horas encendida, y en un
OLED un fondo pleno fijo es mala idea. El color de fase va solo en la etiqueta, el
reloj y la barra. Tokens nuevos: `$pomo-work: #ff6b6b`, `$pomo-short: $tabata-rest`
(`#4ecdc4`), `$pomo-long: $prep` (`#2393f7`).

```
┌──────────────────────────────────────────────────────────────┐
│  FOCO                                         SESIÓN 2 / 4   │  96px color de fase / 72px $text-dim
│                                                              │
│                         17:42                                │  BigClock 400px, color de fase
│                                              ┌────────────┐  │
│                                              │   video    │  │  480×270, solo si hasVideo
│  Sigue: DESCANSO 5 min                       │            │  │  48px
│  MÚSICA: Lofi Night                          └────────────┘  │  40px $text-dim
│  ████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │  ProgressBar (progreso de la fase)
└──────────────────────────────────────────────────────────────┘
```

| Selector | Reglas |
|---|---|
| `.pomo` | `position: relative; width: 1920px; height: 1080px; overflow: hidden; background: $bg; color: $text` |
| `.pomo-top` | `position: absolute; top: 54px; left: 96px; right: 96px; height: 120px; display: flex; justify-content: space-between; align-items: center` |
| `.pomo-center` | `position: absolute; top: 174px; left: 0; width: 1920px; height: 466px; display: flex; align-items: center; justify-content: center` |
| `.pomo-video`, `.pomo-video-shield` | `position: absolute; left: 1344px; top: 640px; width: 480px; height: 270px` (`.pomo-video` con `background: #000`; el shield va después en el DOM, transparente) |
| `.pomo-bottom` | `position: absolute; left: 96px; right: 96px; bottom: 54px` |
| `.pomo-next` / `.pomo-music` | `font-size: 48px` / `font-size: 40px; color: $text-dim; margin-bottom: 20px` |
| `.phase-work` / `.phase-short` / `.phase-long` | color de `.pomo-phase`, `.big-clock` y `.progress-fill` = `$pomo-work` / `$pomo-short` / `$pomo-long`; `.pomo .progress-track { background: rgba(255, 255, 255, 0.15) }` |

Textos: fase `FOCO` / `DESCANSO` / `DESCANSO LARGO`; `SESIÓN n / every` (con
`sessionInCycle`); `Sigue: FOCO 25 min` / `DESCANSO 5 min` / `DESCANSO LARGO 15 min`;
`MÚSICA: <título, máx. 40 caracteres + …>`. Si `onError` de la música se dispara, la
línea pasa a `Música no disponible (<code>)` y **el timer no se detiene**.

| Estado | Acción | Efecto |
|---|---|---|
| Corriendo | `ok`, `playPause` | Pausa timer y música |
| Corriendo | `back` | Pausa (el primer Back no saca) |
| En pausa | `ok`, `playPause` | Reanuda |
| En pausa | `back` | `onExit()` → `pomoSetup` |
| Cualquiera | `right` | `skip` (fase siguiente) |
| Cualquiera | `left` | `restartPhase` |
| Cualquiera | `up` | `source.next()` (otra pista) |
| Cualquiera | `stop` | `onExit()` |
| Cualquiera | `debug` | `DebugOverlay` con `player={null}` |

Overlay de pausa (clases `.overlay*` existentes): `PAUSA`, o `PAUSA · EL TV ESTUVO
INACTIVO` (96px) si `view.suspended`. Leyenda:
`OK  Seguir  ·  ◀  Reiniciar fase  ·  ▶  Saltar  ·  ▲  Otra pista  ·  BACK  Salir`.
El Pomodoro no tiene fin ni pantalla Done: cicla hasta que el usuario sale.

### 13.9 Tests

**`src/pomodoroClock.test.js`** — `cfg = { workMs: 1500000, shortMs: 300000, longMs: 900000, every: 4 }`, `t0 = 1000000`. Las filas 3-10, 13 y 15 parten del estado de la fila 2 (`endsAt 2500000`):

| # | Pasos | Esperado |
|---|---|---|
| 1 | `createPomodoro(cfg)` | `phase 'work'`, `session 1`, `completed 0`, `running false`, `remainingMs 1500000`, `endsAt null` |
| 2 | `start(s, t0)` | `running true`, `endsAt 2500000` |
| 3 | vista en `t0 + 1` / `t0 + 1000` / `t0 + 1499001` | `clockText '25:00'` / `'24:59'` / `'0:01'` |
| 4 | vista en `t0 + 750000` | `progress 0.5`, `timeLeftMs 750000` |
| 5 | `tick` en `t0 + 1499999` | mismo objeto (`toBe`) |
| 6 | `tick` en `2500000` | `phase 'short'`, `session 1`, `completed 1`, `running true`, `endsAt 2800000`, `durationMs 300000` |
| 7 | `tick` en `2500400` (deriva) | `endsAt 2800000`; vista ahí: `timeLeftMs 299600` |
| 8 | `tick` en `2510000` (umbral exacto) | `running true`, `endsAt 2800000`, `suspended false` |
| 9 | `tick` en `2510001` (suspensión) | `phase 'short'`, `completed 1`, `running false`, `endsAt null`, `remainingMs 300000`, `suspended true`; luego `start(s, 9000000)` → `endsAt 9300000`, `suspended false` |
| 10 | `pause(s, t0 + 600000)` | `running false`, `remainingMs 900000`; `tick` en `t0 + 5000000` → mismo objeto; `start(s, 6000000)` → `endsAt 6900000` |
| 11 | Ciclo completo con ticks exactos en cada `endsAt` | fases: work1, short, work2, short, work3, short, work4, **long** (`durationMs 900000`), work5 (`session 5`, `sessionInCycle 1`); `completed 4` al entrar a work5 |
| 12 | `every: 2` | tras work2 → `'long'` |
| 13 | `skip` en `t0 + 600000` corriendo | `phase 'short'`, `completed 0`, `endsAt 1900000` |
| 14 | `skip` en pausa | `phase 'short'`, `running false`, `remainingMs 300000` |
| 15 | `restartPhase` en `t0 + 600000` corriendo | `endsAt 3100000` |
| 16 | `view.next` / `nextMinutes` | work1 → `'short'`, `5`; work4 → `'long'`, `15`; cualquier descanso → `'work'`, `25` |
| 17 | `breakKind` contra el repo principal | para cada preset de `POMODORO_PRESETS` y `n = 1…8`: `breakKind(n, p.sessionsBeforeLongBreak) === 'long'` ⇔ `getBreakDuration(n, p) === p.longBreakDuration` |
| 18 | Barrido `t0 … t0 + 1500000` paso 250 | `timeLeftMs` nunca negativo; `clockText` nunca `'0:00'` antes del vencimiento |

**`src/pomodoroSetup.test.js`**: `PRESETS` tiene los 5 valores de la tabla de §13.6;
`stepField` work `25→30`, `90→90`, `5,-1→5`; short `5→6`, `1,-1→1`; long `15→20`;
every `4→5`, `8→8`, `2,-1→2`; `matchPreset({25,5,15,4}) → 'classic'`,
`({30,5,15,4}) → 'custom'`; `cyclePreset('classic',1) → 'baby'`,
`('extended',1) → 'classic'`, `('classic',-1) → 'extended'`, `('custom',1) → 'classic'`,
`('custom',-1) → 'extended'`; `applyPreset` conserva `musicId`;
`toClockConfig({25,5,15,4}) → {1500000, 300000, 900000, 4}`;
`sanitizePrefs(null, cat)` → clásico + `defaultMusicId(cat)`;
`sanitizePrefs({ work: 999, short: 'x', long: 15, every: 4, musicId: 'yt:nope' }, cat)` →
`work 25`, `short 5`, `musicId` por defecto; `cycleMusic` con wrap en ambos extremos.

**`src/music/music.test.js`**: `getMusicCatalog('local')` → 10 entradas, primera `none`,
ids `local:0…8`; `('youtube')` → `1 + LOFI_LIST.length`; `('both')` → `10 + LOFI_LIST.length`;
`defaultMusicId([none]) → 'none'`; `LOFI_TRACKS` tiene 9 y cada `file` aparece en el
texto de `../src/config/audioSource.js`; cada `LOFI_LIST[i].id` cumple
`/^[A-Za-z0-9_-]{11}$/`, sin repetidos, `title` no vacío y ≤ 60.
`buildEmbedUrl('abc', '')` empieza con `https://www.youtube.com/embed/abc?` y contiene
`enablejsapi=1`; `buildEmbedUrl('abc', 'http://h/yt-bridge.html') === 'http://h/yt-bridge.html?v=abc'`.
`parseYtMessage`: `'{"event":"onReady","id":1}'` → `ready`;
`'{"event":"infoDelivery","info":{"playerState":1}}'` → `state 1`;
`'{"event":"onStateChange","info":2}'` → `state 2`; `'{"event":"onError","info":150}'` →
`error 150`; `'{"event":"infoDelivery","info":{"volume":50}}'`, `'basura'`, `null`, `42` → `null`.

**`src/storage.test.js`**: con `localStorage` ausente (`globalThis.localStorage` sin
definir) `loadJson` → `null` y `saveJson` → `false`, sin lanzar.

### 13.10 Buscador de YouTube — v2 opcional (no en este PR)

Solo si P0.4 decidió A o B1, y solo con pedido explícito. Diseño ya cerrado:

- **Entrada de texto:** teclado propio en pantalla (cuadrícula A-Z, 0-9, espacio,
  borrar, buscar) con foco como estado. No se usa `<input>` ni el teclado del sistema:
  exigiría foco DOM, prohibido en §2.1.
- **Búsqueda:** `XMLHttpRequest` (no `fetch`) a
  `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&maxResults=10&q=…&key=…`.
  Cada búsqueda cuesta 100 unidades de una cuota diaria de 10 000 → ~100 búsquedas/día.
- **API key:** en `tv-webos/.env.local` (gitignored) como `VITE_YT_API_KEY`; se hornea
  en el `.ipk` en build. No puede restringirse por referrer (no hay `Referer` bajo
  `file://`): queda expuesta dentro del `.ipk`, aceptable solo porque el `.ipk` no se
  publica. Sin key, la fila "Buscar" no se muestra.
- **Riesgo propio:** CORS de la Data API contra origen `null` (`file://`) → hay que
  agregar una prueba S5 al spike antes de construirlo.

### 13.11 Tareas (rama `feat/tv-webos-pomodoro`)

**Slice P0 — spike de música (puerta)**

| ID | Tarea | Modelo | Aceptación |
|---|---|---|---|
| P0.1 | Candidatos + `scripts/validate-lofi.mjs` + script `lofi:check` + `src/lofiList.js` (§13.3) | Sonnet | `npm run lofi:check` sale 0 con ≥ 8 entradas; ningún ID que no venga de una URL encontrada |
| P0.2 | `bridge/yt-bridge.html`, `bridge/hosted.html`, `spike/`, `scripts/make-spike.mjs`, scripts `spike:serve` / `spike:install`, `tv-webos/.gitignore` (§13.2) | Sonnet | Los `<script>` inline de `bridge/*.html` y `spike/index.html` no contienen `=>`, `let `, `const ` ni template strings (verificado con `grep`); en Chrome de escritorio S1-S3 reproducen con `spike:serve` corriendo; `ares-package spike` genera el `.ipk` |
| P0.3 | **👤 TV** — guion de §13.2 | Persona | Tabla de resultados S0-S4 (vod y live) en §16 |
| P0.4 | Aplicar el árbol de decisión; escribir en §16 `Decisión música: <A\|A degradada\|B1\|B1 degradada\|C>` con los 3 valores de `config.js` y el motivo | **Opus** | La fila aplicada del árbol está citada; si hay ambigüedad, pregunta puntual a la persona en vez de decidir |
| P0.5 | **👤** Solo si B1: nginx en `192.168.0.103:8088` sirviendo `bridge/` | Persona | `curl -I http://192.168.0.103:8088/yt-bridge.html` → 200 |

**Slice P1 — lógica pura (no depende del spike)**

| ID | Tarea | Modelo | Aceptación |
|---|---|---|---|
| P1.1 | `pomodoroClock.js` + `pomodoroClock.test.js` (18 casos) | Sonnet | `npm test` en verde |
| P1.2 | `pomodoroSetup.js` + test | Sonnet | `npm test` en verde |
| P1.3 | `storage.js` + test; reglas de `tv-webos/CLAUDE.md` de §11.6 (imports y `localStorage`) | Haiku | `npm run build` pasa; `localStorage` en cualquier otro archivo lo hace fallar |

**Slice P2 — música (requiere P0.4)**

| ID | Tarea | Modelo | Aceptación |
|---|---|---|---|
| P2.1 | `music/config.js` con los valores de P0.4, `lofiTracks.js`, `music/index.js`, `noneSource.js`, `ytProtocol.js`, `music.test.js`; `copy-audio.mjs` según modo | Sonnet | `npm test` en verde; con modo `local`, `dist/audio/` tiene las 9 pistas; con `youtube`, no |
| P2.2 | `localSource.js` | Sonnet | En Chrome: suena, pasa a la siguiente al terminar (seek al final), `next()` hace wrap |
| P2.3 | `youtubeSource.js` — **solo si la decisión es A o B1**; si es C se omite y se dice en el PR | Sonnet | En Chrome por `file://` o `npm run dev`: play/pausa/next funcionan; un ID inexistente dispara `next()`; sin red → `onError('timeout')` a los 15 s |

**Slice P3 — pantallas**

| ID | Tarea | Modelo | Aceptación |
|---|---|---|---|
| P3.1 | `PomodoroSetup.jsx` + `pomodoro.scss` (setup) + tokens | Sonnet | Cada fila de la tabla de acciones de §13.6 se cumple con teclado; recargar conserva la configuración |
| P3.2 | `usePomodoro.js`, `beep.js`, `PomodoroActive.jsx` + estilos | Sonnet | En Chrome, usando `▶` (`skip`) para recorrer work → short → … → long sin esperar: cada fila de §13.8 se cumple; la música pausa y reanuda con el timer; cambio de fase suena y cambia el color |
| P3.3 | Cuarta tarjeta (`ACTIVITY_ORDER` + `ACTIVITIES.pomodoro`), rutas en `App.jsx`, versión `0.3.0` | Sonnet | Home 2×2 completo; Pomodoro → setup → activo → BACK×2 → setup → BACK → Home |

**Slice P4 — cierre**

| ID | Tarea | Modelo | Aceptación |
|---|---|---|---|
| P4.1 | `npm test`, `npm run build`, `npm run tv:package`, `npm run tv:install`; tamaño en §16; push y PR (§14.3) | Sonnet | Los 3 primeros con código 0; URL del PR impresa |
| P4.2 | **👤** Aprobar o corregir `lofiList.js` (lista en el cuerpo del PR) | Persona | Aprobación escrita en el PR; **puerta de merge** |
| P4.3 | **👤 TV** — Pomodoro en el TV: setup con el control, 1 ciclo con `skip`, 10 min corridos con música, pausa/reanudar, cambio de pista, beep, persistencia tras cerrar y abrir, salvapantallas a los 15 min, tiempo de instalación | Persona | Resultados en §16; **puerta de merge** |

### 13.12 Riesgos

1. **YouTube no corre en Chromium 38** (lo más probable en un TV 2017). Mitigado por
   diseño: C siempre funciona y el spike va primero. B1/B2 **no arreglan el MOTOR**,
   solo el ORIGEN.
2. **El iframe roba el foco** y el control deja de responder → shield + `window.focus()`
   (§13.4); el spike lo verifica explícitamente.
3. **Protocolo `postMessage` no documentado.** Estable hace años, pero YouTube puede
   cambiarlo → `YT_CONTROL = 'reload'` es la salida sin tocar la pantalla.
4. **Anuncios y videos caídos.** Un embed puede mostrar anuncios que el control no puede
   saltar; los streams en vivo cambian de ID. `npm run lofi:check` detecta los caídos;
   `next()` automático cubre el runtime.
5. **Términos de YouTube:** el player debe verse (por eso el recuadro de 480×270, no un
   iframe oculto) y no se descarga ni extrae audio.
6. **Suspensión del TV:** cubierta por la regla de `MAX_CATCHUP_MS`; el comportamiento
   real del JS en segundo plano en webOS se observa en P4.3.
7. **Salvapantallas / burn-in** con pantalla casi estática 25 min: el reloj cambia cada
   segundo y el fondo es negro; si aparece el salvapantallas aplica la mitigación de T4.1.
8. **`.ipk` de ~77 MB** en modo `local` → regla de recorte a 4 pistas (§13.3).
9. **`AudioContext` ausente** → sin beep; el cambio de color y de etiqueta es la señal.

---

## 14. Protocolo de ejecución

### 14.1 Orden y ramas

1. **PR 1 — Wim Hof:** `feat/tv-webos-wimhof`, creada desde `feat/tv-webos`. Tareas W0-W7; W8 es 👤.
2. **PR 2 — Pomodoro:** `feat/tv-webos-pomodoro`, creada desde `feat/tv-webos`.
   Depende de los cambios comunes del PR 1 (§11): si el PR 1 **ya está mergeado** en
   `feat/tv-webos`, nada más que hacer; si **no**, el primer commit de la rama es
   `git merge --no-ff feat/tv-webos-wimhof` y el cuerpo del PR dice `Depende de #<PR 1>`.
3. Ambos PR van **contra `feat/tv-webos`** (PR #1 del repo). Cuando #1 se mergee a
   `main`, se re-apuntan: `gh pr edit <n> --base main`.

```bash
git switch feat/tv-webos && git pull --ff-only origin feat/tv-webos
git switch -c feat/tv-webos-wimhof          # o feat/tv-webos-pomodoro
```

### 14.2 Reglas de commit

- **Un commit por tarea**, mensaje en inglés, `feat(tv): …` / `test(tv): …` / `docs(tv): …`, con el ID al final (`(W4)`).
- Cada mensaje termina con: `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
- El árbol de trabajo tiene **cambios ajenos sin commitear** en la raíz (`src/`,
  `features.json`, `package-lock.json`, `docs/`…). **Nunca** `git add -A`, `git add .`
  ni `git commit -a`: siempre `git add tv-webos/<ruta>` explícito. Antes de cada commit,
  `git diff --cached --stat` debe mostrar solo rutas bajo `tv-webos/`.
- Fuera de `tv-webos/` no se commitea nada. La raíz `.gitignore` ya cubre
  `tv-webos/public/audio/`; lo nuevo que haya que ignorar va en `tv-webos/.gitignore`.
- No se modifica `../src`. No se corre `npm install` en la raíz. Si hace falta una
  dependencia nueva en `tv-webos/` → detenerse y preguntar (este plan no requiere ninguna).

### 14.3 Criterios de PR

Antes de abrirlo, desde `tv-webos/`, los tres con código 0:

```bash
npm test
npm run build          # incluye postbuild + check-compat
npm run tv:package     # .ipk de la versión nueva en build/
```

Luego `npm run tv:install` (dispositivo `tv` = 192.168.0.8, ya configurado). Si falla
porque el TV está apagado o expiró Developer Mode, **no se reintenta en bucle ni se
reconfigura el dispositivo**: se anota y pasa a ser parte de la tarea 👤.

```bash
git push -u origin <rama>
gh pr create --base feat/tv-webos --head <rama> --title "<título>" --body-file <archivo>
git push gitea <rama>      # opcional; el PR en Gitea se abre a mano
```

Cuerpo del PR: qué incluye, salida resumida de los tres comandos, tamaño del `.ipk`,
checklist de tareas 👤 pendientes (puertas de merge) y, al final,
`🤖 Generated with [Claude Code](https://claude.com/claude-code)`. El agente **no mergea**.

| PR | Título | Verifica además |
|---|---|---|
| 1 | `feat(tv): Wim Hof (English) guided breathing` | Home con 3 tarjetas; HIIT/Tabata sin regresión (`clock.test.js` intacto) |
| 2 | `feat(tv): configurable Pomodoro with lofi music` | Decisión de música citada; lista `lofiList.js` pegada para aprobación; `dist/index.html` sin scripts externos |

### 14.4 Tareas que detienen al agente

| Tarea | Qué necesita | Bloquea |
|---|---|---|
| W8 | Persona frente al TV | Merge del PR 1 (no su apertura) |
| W9 | Audacity (solo v2) | Todo §12.7 |
| P0.1 (solo si no hay búsqueda web) | URLs de YouTube del usuario | P0.2 en adelante |
| P0.3 | Persona frente al TV con el spike | P0.4, slices P2 y P3 |
| P0.4 con resultados ambiguos | Repetir una prueba | Ídem |
| P0.5 (solo B1) | Acceso al homelab | P4.3; no bloquea el código |
| P4.2, P4.3 | Aprobación de lista y prueba en TV | Merge del PR 2 |

Al llegar a una tarea 👤 el agente: (1) deja todo lo previo commiteado, (2) escribe en
§16 `PENDIENTE 👤 <ID>` con los pasos exactos, (3) **se detiene y lo pide**. Está
prohibido: inventar resultados del TV, asumir una fila del árbol de decisión, marcar
la tarea como hecha, o saltarla construyendo lo que depende de ella. Única excepción
ya prevista: el slice P1 puede hacerse mientras se espera P0.3.

### 14.5 Qué modelo para qué (ampliación de §8)

| Modelo | Tareas | Criterio |
|---|---|---|
| **Haiku** | W0, W10, P1.3 | Transcripción mecánica de lo dictado en este plan |
| **Sonnet** | W1-W7, W11, P0.1, P0.2, P1.1, P1.2, todo P2 y P3, P4.1 | Implementación con spec cerrada (por defecto) |
| **Opus** | P0.4 | Decisión A/B/C y diagnóstico si el spike da resultados raros en un TV sin inspector |
| **Persona** | W8, W9, P0.3, P0.5, P4.2, P4.3 | Requieren el TV, Audacity, el homelab o una aprobación |

Si toda la sesión corre en Sonnet, P0.4 se resuelve aplicando la tabla de §13.2 al pie
de la letra; solo se escala a Opus si ninguna fila calza con lo observado.

---

## 15. Prompts `/goal`

Una sesión por PR, con contexto limpio, lanzada desde `/Users/maaya/dev/timer-app`.

### 15.1 PR 1 — Wim Hof

```
/goal Implementa el PR 1 (Wim Hof EN) de tv-webos/PLAN.md: tareas W0 a W7 de §12.6, en orden, siguiendo §11, §12 y el protocolo de §14 al pie de la letra. Lee antes tv-webos/CLAUDE.md y las secciones 2, 3, 11, 12 y 14 de PLAN.md. Rama feat/tv-webos-wimhof creada desde feat/tv-webos; un commit por tarea; solo `git add tv-webos/...` explícito. No tomes decisiones de diseño: si el plan no cubre algo, detente y pregunta.

CUMPLIDO cuando todo esto es cierto y lo muestras en tu último mensaje:
1. `cd tv-webos && npm test` termina con código 0 e incluye wimhof.test.js, homeNav.test.js y activities.test.js.
2. `npm run build` termina con código 0 (imprime "check-compat ok").
3. `npm run tv:package` genera build/com.timerapp.tv_0.2.0_all.ipk; muestras su tamaño con `ls -la`.
4. `git log --oneline feat/tv-webos..HEAD` muestra un commit por cada tarea W0…W6 y `git diff --stat feat/tv-webos..HEAD` solo toca rutas bajo tv-webos/.
5. Existe un PR abierto contra feat/tv-webos (`gh pr view --json url,baseRefName,state`) y muestras su URL.
6. §16 de PLAN.md tiene el tamaño del .ipk, el resultado de `npm run tv:install` (OK o el error literal) y la línea `PENDIENTE 👤 W8` con los pasos a probar.

W8 es de una persona: NO la hagas ni la simules. Cuando solo falte W8, el goal está cumplido: detente y dime exactamente qué probar en el TV. Si `tv:install` falla porque el TV no responde, anótalo y sigue; no reconfigures el dispositivo.
```

### 15.2 PR 2 — Pomodoro + música

```
/goal Implementa el PR 2 (Pomodoro con música) de tv-webos/PLAN.md: tareas de §13.11 en orden, siguiendo §11, §13 y el protocolo de §14 al pie de la letra. Lee antes tv-webos/CLAUDE.md y las secciones 2, 3, 11, 13, 14 y 16 de PLAN.md. Rama feat/tv-webos-pomodoro según §14.1; un commit por tarea; solo `git add tv-webos/...` explícito. Nunca inventes IDs de YouTube ni resultados del TV. No tomes decisiones de diseño: si el plan no cubre algo, detente y pregunta.

Este goal tiene una PUERTA humana. Procede así:
- Fase 1: haz P0.1, P0.2 y el slice P1 (P1.1-P1.3). Luego mira §16 de PLAN.md.
- Si §16 NO contiene una línea "Decisión música:" ni la tabla de resultados S0-S4 de P0.3: escribe `PENDIENTE 👤 P0.3` en §16 con el guion de §13.2, commitea, y DETENTE pidiéndome que corra el spike en el TV. No construyas P2 ni P3, no asumas una fila del árbol, no elijas C "por las dudas". En ese punto el goal queda CUMPLIDO EN FASE 1 si muestras: `npm test` en código 0 con pomodoroClock.test.js (18 casos), pomodoroSetup.test.js y storage.test.js; `npm run lofi:check` en código 0; el .ipk del spike generado; y los comandos exactos que debo correr.
- Fase 2 (solo si §16 ya tiene los resultados de P0.3): haz P0.4 aplicando la tabla de §13.2, y luego P2, P3 y P4.1.

CUMPLIDO (fase 2) cuando todo esto es cierto y lo muestras en tu último mensaje:
1. `cd tv-webos && npm test` termina con código 0 e incluye pomodoroClock.test.js, pomodoroSetup.test.js, music.test.js y storage.test.js.
2. `npm run build` termina con código 0 (imprime "check-compat ok") y `grep -c 'src="http' dist/index.html` da 0.
3. `npm run tv:package` genera build/com.timerapp.tv_0.3.0_all.ipk; muestras su tamaño.
4. §16 de PLAN.md contiene la línea "Decisión música: …" con la fila del árbol aplicada, y src/music/config.js tiene esos mismos tres valores.
5. `git diff --stat feat/tv-webos..HEAD` solo toca rutas bajo tv-webos/, con un commit por tarea.
6. Existe un PR abierto contra feat/tv-webos y muestras su URL; su cuerpo incluye la lista de lofiList.js para aprobación.
7. §16 lista `PENDIENTE 👤 P4.2` y `PENDIENTE 👤 P4.3` (y P0.5 si la decisión es B1) con los pasos exactos.

P0.3, P0.5, P4.2 y P4.3 son de una persona: no las hagas ni las simules. Cuando solo falten tareas 👤, detente y pídemelas.
```

Para la fase 2 se relanza **el mismo prompt** después de anotar los resultados del
spike en §16: el agente detecta la tabla y sigue desde P0.4.

---

## 16. Resultados y decisiones (features de §11-13)

_(Lo llenan las tareas W6, W8, P0.3, P0.4, P4.1 y P4.3. Formato libre, una entrada
por tarea con fecha. Las líneas `PENDIENTE 👤 <ID>` se borran al completarse.)_

Plantilla para P0.3:

| Prueba | ID | ¿Se ve? | ¿Se oye ≥ 2 min? | ¿OK pausa/reanuda? | ¿El control sigue respondiendo? | Error / texto del player | Log |
|---|---|---|---|---|---|---|---|
| Navegador del TV | vod | | | — | — | | |
| S0 | — | — | — | — | — | `ls:` `audioctx:` | UA: |
| S1 | vod / live | | | — | | | |
| S2 | vod / live | | | | | | |
| S3 | vod / live | | | | | | |
| S4 | vod / live | | | — | | | |
