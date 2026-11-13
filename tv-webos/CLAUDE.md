# CLAUDE.md — tv-webos

App LG webOS 2017-18 (Chromium 38, `file://`). Spec y tareas: `PLAN.md`. Instalar deps SOLO aquí, nunca `npm install` en la raíz.

## Reglas duras
- NO modificar `../src`. Se importa con rutas relativas (`../../src/...`): solo `hiitConfig`, `tabataConfig`, `ticksEngine`.
- NO importar `audioUtils.js`, `WorkoutAudioPlayer.js`, `localStorage.js`, ni `src/components`.
- Rutas de assets relativas (`audio/x.mp3`), nunca `/x.mp3`.
- Nada de `<script>` externos. YouTube solo en `<iframe>` creado por `src/music/youtubeSource.js` (URLs en `ytProtocol.js`). La pantalla de Pomodoro no conoce la fuente de música.

## JS prohibido (Chromium 38)
- `audio.play().then` / `await audio.play()` → `var p = audio.play(); if (p && p.catch) p.catch(fn)`
- `event.key` / `event.code` → `event.keyCode`
- `fetch`, `import()` dinámico, Workers, `navigator.wakeLock`, `IntersectionObserver`, `ResizeObserver`
- Foco DOM (`tabindex`, `.focus()`, `:focus`) → foco como estado + clase `.is-focused`
- `localStorage`

## CSS prohibido
- `var(--x)` → variables Sass; Grid y `gap` en flex → flexbox + márgenes
- `inset`, `aspect-ratio`, `clamp/min/max()`, `filter`, `backdrop-filter`, `box-shadow` grande, `mix-blend-mode`
- `tabular-nums` → un `<span>` de ancho fijo por dígito
- `#RRGGBBAA` → `rgba()`; animar solo `transform` y `opacity`
- No escribir prefijos `-webkit-` a mano (autoprefixer)

## Layout
1920×1080 fijo, px. Margen seguro 96px horizontal / 54px vertical. Un solo tema oscuro.

## Comandos
`npm run dev` · `npm test` · `npm run build` (incluye check-compat) · `npm run tv:package` · `npm run tv:install`
