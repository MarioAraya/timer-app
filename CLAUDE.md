# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**HIIT & Tabata Timer** — a PWA for high-intensity workout timers with millisecond-precise MP3 audio synchronization. Primary focus is HIIT (12 rounds: 40s work/20s rest) and Tabata (8 rounds: 20s work/10s rest). Secondary features: Pomodoro, breathing timers.

## Development Commands

```bash
npm run dev        # Start Vite dev server (http://localhost:5173)
npm run build      # Production build
npm run preview    # Preview production build
npm run test       # Run Vitest tests once
npm run test:watch # Run Vitest in watch mode
```

Run a single test file:
```bash
npx vitest run src/utils/ticksEngine.test.js
```

Backend (Go):
```bash
cd backend && go run cmd/api/main.go
```

## Architecture

### Frontend (Preact + Vite)

**Key constraint:** Audio sync is the core differentiator. Any timing change must preserve MP3 sync.

**Navigation flow:** `App.jsx` → `TimersHome.jsx` (grid of timer cards) → individual timer components

**Workout timer architecture:**
- `src/components/WorkoutTimer.jsx` — base component (~500 lines) with all shared timer logic
- `src/components/HiitTimer.jsx` / `TabataTimer.jsx` — thin wrappers (~65 lines each) passing config to WorkoutTimer
- Subdirectories `src/components/hiit/` contain `HiitTimerNew.jsx`, `HiitActiveView.jsx`, `HiitSetupView.jsx` (newer split architecture for HIIT)

**Ticks system** (how audio sync actually works):
- `src/config/hiitTicks.js` / `tabataTicks.js` — arrays of absolute MP3 timestamps marking phase boundaries
- `src/utils/ticksEngine.js` — derives round durations from tick differences; `buildConfigFromTicks()` is the entry point
- Configs in `src/config/hiitConfig.js` / `tabataConfig.js` are ultimately built from ticks, not hardcoded
- `src/utils/WorkoutAudioPlayer.js` — manages MP3 playback, watchdog timer (300ms interval), drift correction

**Audio modes:** Music (MP3 synced to ticks) or Beeps (Web Audio API). Toggle per timer.

**State persistence** (`src/utils/localStorage.js`):
- Save/load/clear functions per timer type (HIIT, Tabata, Pomodoro)
- 1-hour expiry; saves on pause and unmount, restores on mount

**Auth:** `src/components/auth/` — `AuthModal.jsx`, `UserMenu.jsx` integrate with Supabase (`@supabase/supabase-js`)

### Backend (Go)

Located in `backend/`. Uses `chi` router, JWT auth, Supabase as DB.

```
backend/
  cmd/api/main.go          # Entry point
  internal/
    auth/middleware.go     # JWT middleware
    auth/supabase.go       # Supabase auth integration
    db/                    # Database layer
    handlers/              # HTTP handlers (presets, progress, routines, social)
    models/                # Data models
    api/                   # Route registration
```

Handlers cover: workout presets, user progress, routines, social features.

### Styling

SCSS with `src/styles/_variables.scss` (colors, timing) and `src/styles/_mixins.scss`. Component-specific `.scss` files colocated with components. Phase-based dynamic class names drive background colors and animations.

## Key Files

| Purpose | File |
|---|---|
| HIIT timing (ticks) | `src/config/hiitTicks.js` |
| Tabata timing (ticks) | `src/config/tabataTicks.js` |
| Tick → config conversion | `src/utils/ticksEngine.js` |
| Audio player + watchdog | `src/utils/WorkoutAudioPlayer.js` |
| Audio utilities (beeps) | `src/utils/audioUtils.js` |
| State persistence | `src/utils/localStorage.js` |
| Shared timer logic | `src/components/WorkoutTimer.jsx` |
| Timer home grid | `src/components/TimersHome.jsx` |

## Timer Component Props Interface

All timers share: `name`, `autoMaximize`, `autoStart` (always false), `showBackButton`, `onBackClick`

Maximized mode: double-click to toggle fullscreen; click anywhere to pause/resume; controls at opacity 0.3, visible on hover.
