# HIIT & Tabata Timer

> [English version](./README.md)

PWA de entrenamiento con sincronización de audio MP3 a milisegundos. HIIT (12 rondas 40s/20s) y Tabata (8 rondas 20s/10s) como core; incluye Pomodoro, temporizadores de respiración y Wim Hof.

## Timers

| Timer | Protocolo | Audio |
|-------|-----------|-------|
| HIIT | 12 rondas × 40s trabajo / 20s descanso | `hiit_next-level_40-20.mp3` |
| Tabata | 8 rondas × 20s trabajo / 10s descanso | `tabata_rocky_20-10.mp3` |
| Pomodoro | 25min trabajo / 5min pausa | Playlist lofi |
| Box Breathing | 4-4-4-4 | — |
| Calming Breath | 4-2-6 | — |
| Relaxing Breath | 4-7-8 | — |
| Wim Hof | 4 rondas (guiado por audio, sin coordinación de fases todavía) | `win_hof_4rounds.mp3` |

## Features principales

- **Sincronización de audio precisa** — ticks MP3 alineados con fases trabajo/descanso
- **Anti-pausa agresivo** — watchdog cada 100ms, auto-resume si el browser pausa
- **Estado persistente** — pausa y retoma la sesión (expira tras 1 hora)
- **Modo fullscreen** — doble-click para maximizar, click para pausar
- **Modo offline** — Service Worker, funciona sin internet
- **Dos modos de audio** — Música (MP3 sincronizado) o Beeps (Web Audio API)
- **i18n** — Español (default) / Inglés

## Dev

```bash
npm run dev        # http://localhost:5177
npm run build
npm run preview
npm run test
npm run test:watch
npm run test:e2e
npm run test:e2e:ui

# Backend (Go)
cd backend && go run cmd/api/main.go
```

Test archivo específico:
```bash
npx vitest run src/utils/ticksEngine.test.js
```

## Stack

- **Preact** + Vite + SCSS
- **Web Audio API** (beeps) + HTML5 Audio (MP3)
- **Supabase** (auth + DB + bucket de audio)
- **Go/chi** (backend: presets, progress, rutinas sociales)

## Arquitectura clave

```
src/
  app.jsx                            ← routing (currentView + activeTimer state)
  components/
    TimersHome.jsx                   ← grid de selección
    hiit/HiitTimerNew.jsx            ← root HIIT
    tabata/TabataTimerNew.jsx        ← root Tabata
    breath/
      BreathingTimer.jsx             ← base compartida (Box / Calming / Relaxing)
      WimHofTimer.jsx                ← standalone (sin base compartida, v1 solo MP3)
  config/
    hiitTicks.js / tabataTicks.js    ← timestamps MP3 absolutos (segundos)
  utils/
    ticksEngine.js                   ← buildConfigFromTicks() deriva duraciones
    WorkoutAudioPlayer.js            ← playback + watchdog + corrección de drift
    audioUtils.js                    ← WorkoutAudioPlayer + LofiPlaylistPlayer + beeps
    localStorage.js                  ← persistencia con expiry 1h
```

**Importante:** Para cambiar duraciones de fases, editar los archivos `*Ticks.js`, no los configs directamente.

## Audio sync — cómo funciona

```
hiitTicks.js (timestamps)
  → ticksEngine.buildConfigFromTicks()
  → hiitConfig.js (duraciones derivadas)
  → WorkoutAudioPlayer (seek + watchdog 100ms, threshold auto-resume 500ms)
```

## Agregar música propia

1. Colocar MP3 en `public/` (o subir al bucket de audio en Supabase)
2. Editar `src/config/hiitTicks.js` con los timestamps de tus fases
3. `ticksEngine.js` deriva la config automáticamente

## Estado Wim Hof

v1 sale como reproductor MP3 simple (sin sync de fases). v2 sincronizará fases visuales (breathe / hold / recovery × 4 rondas) vía ticks — ver `docs/WIM_HOF_AUDACITY.md` y `features.json` para el roadmap.

## Backend (Go)

```
backend/cmd/api/main.go
backend/internal/
  auth/        ← JWT middleware + Supabase
  handlers/    ← presets, progress, routines, social
```

## Licencia

MIT
