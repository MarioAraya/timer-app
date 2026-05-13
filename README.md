# HIIT & Tabata Timer

> [Versión en Español](./README.ES.md)

Workout PWA with millisecond-precise MP3 audio sync. HIIT (12 rounds 40s/20s) and Tabata (8 rounds 20s/10s) are the core; also includes Pomodoro, breathing timers, and Wim Hof.

## Timers

| Timer | Protocol | Audio |
|-------|----------|-------|
| HIIT | 12 rounds × 40s work / 20s rest | `hiit_next-level_40-20.mp3` |
| Tabata | 8 rounds × 20s work / 10s rest | `tabata_rocky_20-10.mp3` |
| Pomodoro | 25min work / 5min break | Lofi playlist |
| Box Breathing | 4-4-4-4 | — |
| Calming Breath | 4-2-6 | — |
| Relaxing Breath | 4-7-8 | — |
| Wim Hof | 4 rounds (audio-guided, no phase coordination yet) | `win_hof_4rounds.mp3` |

## Core features

- **Precise audio sync** — MP3 ticks aligned with work/rest phases
- **Aggressive anti-pause** — 100ms watchdog, auto-resume if browser pauses
- **Persistent state** — pause and resume sessions (expires after 1 hour)
- **Fullscreen mode** — double-click to maximize, click to pause
- **Offline mode** — Service Worker, works without internet
- **Two audio modes** — Music (synced MP3) or Beeps (Web Audio API)
- **i18n** — Spanish (default) / English

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

Run a single test file:
```bash
npx vitest run src/utils/ticksEngine.test.js
```

## Stack

- **Preact** + Vite + SCSS
- **Web Audio API** (beeps) + HTML5 Audio (MP3)
- **Supabase** (auth + DB + audio bucket)
- **Go/chi** (backend: presets, progress, social routines)

## Key architecture

```
src/
  app.jsx                            ← routing (currentView + activeTimer state)
  components/
    TimersHome.jsx                   ← selection grid
    hiit/HiitTimerNew.jsx            ← HIIT root
    tabata/TabataTimerNew.jsx        ← Tabata root
    breath/
      BreathingTimer.jsx             ← shared base (Box / Calming / Relaxing)
      WimHofTimer.jsx                ← standalone (no shared base, MP3-only v1)
  config/
    hiitTicks.js / tabataTicks.js    ← absolute MP3 timestamps (seconds)
  utils/
    ticksEngine.js                   ← buildConfigFromTicks() derives durations
    WorkoutAudioPlayer.js            ← playback + watchdog + drift correction
    audioUtils.js                    ← WorkoutAudioPlayer + LofiPlaylistPlayer + beeps
    localStorage.js                  ← state persistence (1h expiry)
```

**Important:** To change phase durations, edit `*Ticks.js` files — not the configs directly.

## Audio sync — how it works

```
hiitTicks.js (timestamps)
  → ticksEngine.buildConfigFromTicks()
  → hiitConfig.js (derived durations)
  → WorkoutAudioPlayer (seek + 100ms watchdog, 500ms auto-resume threshold)
```

## Adding your own music

1. Drop MP3 in `public/` (or upload to the Supabase audio bucket)
2. Edit `src/config/hiitTicks.js` with your phase timestamps
3. `ticksEngine.js` derives the config automatically

## Wim Hof status

v1 ships as an MP3-only player (no phase sync). v2 will sync visual phases (breathe / hold / recovery × 4 rounds) via ticks — see `docs/WIM_HOF_AUDACITY.md` and `features.json` for the roadmap.

## Backend (Go)

```
backend/cmd/api/main.go
backend/internal/
  auth/        ← JWT middleware + Supabase
  handlers/    ← presets, progress, routines, social
```

## License

MIT
