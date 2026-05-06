# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**HIIT & Tabata Timer** — a PWA for high-intensity workout timers with millisecond-precise MP3 audio synchronization. Primary focus is HIIT (12 rounds: 40s work/20s rest) and Tabata (8 rounds: 20s work/10s rest). Secondary features: Pomodoro, breathing timers.

## Development Commands

```bash
npm run dev        # Start Vite dev server (http://localhost:5177)
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

**Navigation flow:** `app.jsx` → `TimersHome.jsx` (grid of timer cards) → individual timer components

**Routing:** `app.jsx` uses a `currentView` + `activeTimer` state pattern (no router library). Timer names in `case` statements (`'HiitTimer'`, `'TabataTimer'`, etc.) must match exactly what `TimersHome.jsx` emits.

### Workout Timers (HIIT / Tabata)

Each has a **two-view architecture** inside its subdirectory:

```
src/components/hiit/
  HiitTimerNew.jsx    ← root component (imported as HiitTimer in app.jsx)
  HiitSetupView.jsx   ← pre-workout config screen
  HiitActiveView.jsx  ← workout in progress
  HiitTimer.scss

src/components/tabata/
  TabataTimerNew.jsx  ← root component (imported as TabataTimer in app.jsx)
  TabataSetupView.jsx
  TabataActiveView.jsx
  TabataTimer.scss
```

`HiitTimerNew` / `TabataTimerNew` own all timer state and pass it down. They use shared UI components from `src/components/shared/` (WorkoutActiveView, WorkoutSetupView, CircularProgress) and `src/components/workout/` (TimerDisplay, TimerControls, etc).

**Important HIIT-only features:** `handleCalibrate` (dev tool logging MP3 timestamps to console) and `startTimeRef` (audio sync reference). These do not exist in Tabata.

**Progress tracking difference:**
- HIIT: `calculateCurrentRoundProgress()` tracks the full round (work + rest as one unit)
- Tabata: `calculateIntervalProgress()` tracks only the current phase (work or rest separately)

### Ticks System (how audio sync works)

```
hiitTicks.js / tabataTicks.js   ← arrays of absolute MP3 timestamps (seconds)
ticksEngine.js                  ← buildConfigFromTicks() derives durations from tick diffs
hiitConfig.js / tabataConfig.js ← configs built from ticks, not hardcoded durations
WorkoutAudioPlayer.js           ← manages MP3 playback, 300ms watchdog, drift correction
```

Changing phase durations means updating the ticks files, not the config files directly.

**Audio modes:** Music (MP3 synced to ticks) or Beeps (Web Audio API `playBeep`/`playWorkSound`/`playCountdownSound` in `audioUtils.js`). Toggle per timer.

### Audio Utilities (`src/utils/audioUtils.js`)

Three `WorkoutAudioPlayer` instances: `hiitPlayer`, `tabataPlayer`, `pomodoroPlayer`. Each exposes identically-shaped wrapper functions with prefixed names (`playHiitSong`, `playTabataSong`, `playPomodoroSong`, etc.). The `visibilitychange` handler at the bottom of the file auto-resumes whichever player `shouldBePlaying` when the tab regains focus.

### Breathing Timers

Shared base in `BreathingTimer.jsx` + `BreathingTimer.scss`. Three wrapper components pass a `phases` array (each phase has `name`, `duration`, `instruction`, `color`, `type: 'inhale'|'hold'|'exhale'`):

- `BoxBreathingTimer.jsx` — 4-4-4-4 (4 phases, uses `hold1` / `hold2` color classes)
- `CalmingBreathTimer.jsx` — 4-2-6
- `RelaxingBreathTimer.jsx` — 4-7-8

The circle animation is **JS-driven** (not CSS keyframes): `BreathingTimer.jsx` uses a `useRef` on the circle element and sets `el.style.transform` + `el.style.transition` via `requestAnimationFrame` on phase change. CSS `transform` on individual timer SCSS files is overridden by these inline styles.

**Desktop layout:** `BreathingTimer.scss` applies a two-column CSS Grid layout at `≥900px` when `.breathing-timer-root.maximized` — circle left, text/controls right. The `breathing-timer-root` class is added by `BreathingTimer.jsx`; individual timer SCSS files only define wrapper colors and the maximized fixed-position block.

### Pomodoro

`PomodoroTimer.jsx` delegates to two hooks: `usePomodoroTimer` (countdown logic) and `usePomodoroControls` (start/pause/reset handlers). Sub-components in `src/components/pomodoro/` handle display, progress, and stats.

### Internationalization (i18n)

`src/i18n/` holds translation dictionaries (`es.js`, `en.js`) and a `t(lang, key)` helper that resolves dot-notation keys (e.g. `t(lang, 'timer.start')`). Default language is Spanish (`es`).

`src/context/LanguageContext.jsx` wraps the app (via `main.jsx`'s `<LanguageProvider>`) and exposes the `useLang()` hook. Components call `useLang()` to get `{ lang, t }` — never call `t()` directly with a hardcoded lang string.

`src/hooks/useLanguage.js` manages language state and persists selection via `src/i18n/languageStorage.js`.

### State Persistence (`src/utils/localStorage.js`)

Save/load/clear functions per timer type (HIIT, Tabata, Pomodoro). All `load*State` functions enforce a 1-hour expiry via a `timestamp` field — stale state is cleared and returns `null`. State is saved on pause and unmount, restored on mount.

`app.jsx` also persists the user's **favorite timer** (`saveFavoriteTimer` / `loadFavoriteTimer`) and **last active timer** (`saveActiveTimer` / `loadActiveTimer`) to survive page reloads.

### Auth

`src/hooks/useAuth.js` + `src/components/auth/` integrate with Supabase. Auth is used in `app.jsx` to show/hide `AuthModal` and `UserMenu`.

### Backend (Go)

Located in `backend/`. Uses `chi` router, JWT auth, Supabase as DB.

```
backend/cmd/api/main.go          ← entry point
backend/internal/
  auth/                          ← JWT middleware + Supabase integration
  handlers/                      ← presets, progress, routines, social
  db/ models/ api/
```

### Styling

SCSS with `src/styles/_variables.scss` (colors, timing) and `src/styles/_mixins.scss`. Component SCSS files are colocated. Phase-based dynamic class names (e.g. `inhale`, `hold`, `exhale`, `isWorkPhase`) drive background gradients and animations.

## Key Files

| Purpose | File |
|---|---|
| App routing + auth | `src/app.jsx` |
| HIIT timer (root) | `src/components/hiit/HiitTimerNew.jsx` |
| Tabata timer (root) | `src/components/tabata/TabataTimerNew.jsx` |
| Breathing timer base | `src/components/BreathingTimer.jsx` |
| HIIT timing (ticks) | `src/config/hiitTicks.js` |
| Tabata timing (ticks) | `src/config/tabataTicks.js` |
| Tick → config conversion | `src/utils/ticksEngine.js` |
| Audio player + watchdog | `src/utils/WorkoutAudioPlayer.js` |
| Audio instances + beeps | `src/utils/audioUtils.js` |
| State persistence | `src/utils/localStorage.js` |
| Timer home grid | `src/components/TimersHome.jsx` |

## Timer Component Props Interface

All timers accept: `name`, `autoMaximize`, `autoStart` (always false), `showBackButton`, `onBackClick`.

Maximized mode: double-click to toggle fullscreen; click anywhere to pause/resume.

## Dead Code Note

These hooks exist but have no active imports — candidates for removal:
`useAudioSync.js`, `useSeekControls.js`, `useTimerPersistence.js`

`useMouseTracking.js` — no active imports found; likely dead but verify before removing.

Active hooks sometimes confused as dead: `useLanguage.js` (used by `LanguageContext.jsx`), `useWorkoutTimer.js` and `useDoubleClick.js` (both used by `PomodoroTimer.jsx` and `BreathingTimer.jsx`).

Stale backup files in `src/components/`: `HiitTimer.jsx.backup`, `HiitTimer.scss.backup`, `TabataTimer.jsx.backup`, `TabataTimer.scss.backup` — safe to delete.
