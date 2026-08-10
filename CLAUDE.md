# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**HIIT & Tabata Timer** — a PWA for high-intensity workout timers with millisecond-precise MP3 audio synchronization. Primary focus is HIIT (12 rounds: 40s work/20s rest) and Tabata (8 rounds: 20s work/10s rest). Secondary features: Pomodoro, breathing timers.

## Development Commands

```bash
npm run dev        # Start Vite dev server (http://localhost:5555)
npm run build      # Production build
npm run preview    # Preview production build
npm run test       # Run Vitest tests once
npm run test:watch # Run Vitest in watch mode
npm run test:e2e   # Playwright e2e tests
npm run test:e2e:ui # Playwright UI mode
```

Run a single test file:
```bash
npx vitest run src/utils/ticksEngine.test.js
```

Backend (Go):
```bash
cd backend && go run cmd/api/main.go
```

## Slash Commands (`.claude/commands/`)

Project-scoped Claude Code commands. Invoke con `/<nombre>`.

| Comando | Propósito |
|---|---|
| `/commit` | Analiza git state y crea commit |
| `/commit-msg` | Sugiere mensaje commit (EN) sin commitear |
| `/lint` | Lint frontend + backend con autofix |
| `/test-hiit` | Corre vitest de HIIT |
| `/deploy-preview` | Build prod + servidor preview local |
| `/create-release-pr <version>` | Crea release PR `release/<v>` → `main` con changelog |
| `/new-worktree <descripción>` | Crea worktree aislado + branch `feat\|fix\|exp/<slug>` en `../<repo>-<tipo>-<slug>` |
| `/merge-worktree [path\|branch]` | Mergea branch del worktree, borra worktree + branch local (con confirmaciones) |

Workflow worktrees típico:
```
/new-worktree quiero arreglar drift de audio en tabata
# trabajar en ../timer-app-fix-audio-drift-tabata
/merge-worktree fix/audio-drift-tabata
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
WorkoutAudioPlayer.js           ← manages MP3 playback, 100ms watchdog (500ms threshold), drift correction
```

Changing phase durations means updating the ticks files, not the config files directly.

**Audio modes:** Music (MP3 synced to ticks) or Beeps (Web Audio API `playBeep`/`playWorkSound`/`playCountdownSound` in `audioUtils.js`). Toggle per timer.

### Audio Utilities (`src/utils/audioUtils.js`)

Four player instances exported directly (not wrapped):
- `hiitAudio`, `tabataAudio` — `WorkoutAudioPlayer` (single MP3 synced to ticks)
- `pomodoroAudio`, `breathingAudio` — `LofiPlaylistPlayer` (9 lofi tracks from Supabase, advances on `ended`, supports `nextTrack()` / `repeatTrack()`)

`LofiPlaylistPlayer` is exported from `audioUtils.js` (for testability) and mirrors `WorkoutAudioPlayer`'s play/resume/watchdog flow exactly (100ms watchdog, 500ms auto-resume threshold, `shouldBePlaying` set after `await audio.play()`). When swapping tracks, `playerReady` is reset and `canplaythrough` re-triggers play if `shouldBePlaying` is still true. The `inTrackTransition` flag (1.5s) prevents the `pause` DOM event from `audio.load()` being misread as a user pause.

The `visibilitychange` handler at the bottom of the file auto-resumes whichever player has `shouldBePlaying === true` when the tab regains focus.

Beep mode uses Web Audio API (`playBeep` / `playWorkSound` / `playCountdownSound` / `playPrepSound`) — independent of the player instances.

### Breathing Timers

Shared base in `BreathingTimer.jsx` + `BreathingTimer.scss`. Three wrapper components pass a `phases` array (each phase has `name`, `duration`, `instruction`, `color`, `type: 'inhale'|'hold'|'exhale'`):

- `BoxBreathingTimer.jsx` — 4-4-4-4 (4 phases, uses `hold1` / `hold2` color classes)
- `CalmingBreathTimer.jsx` — 4-2-6
- `RelaxingBreathTimer.jsx` — 4-7-8
- `WimHofTimer.jsx` — **does NOT use `BreathingTimer` base.** Standalone component that plays `public/win_hof_4rounds.mp3` via raw `HTMLAudioElement` with play/pause/reset, no phase coordination yet. Phase sync via ticks is planned (see `features.json` → `wim-hof-breathing.todo` and `docs/WIM_HOF_AUDACITY.md`).

The circle animation is **JS-driven** (not CSS keyframes): `BreathingTimer.jsx` uses a `useRef` on the circle element and sets `el.style.transform` + `el.style.transition` via `requestAnimationFrame` on phase change. CSS `transform` on individual timer SCSS files is overridden by these inline styles.

**Desktop layout:** `BreathingTimer.scss` applies a two-column CSS Grid layout at `≥900px` when `.breathing-timer-root.maximized` — circle left, text/controls right. The `breathing-timer-root` class is added by `BreathingTimer.jsx`; individual timer SCSS files only define wrapper colors and the maximized fixed-position block.

### Pomodoro

`PomodoroTimer.jsx` delegates to two hooks: `usePomodoroTimer` (countdown logic) and `usePomodoroControls` (start/pause/reset handlers). Sub-components in `src/components/pomodoro/` handle display, progress, and stats.

### Internationalization (i18n)

`src/i18n/` holds translation dictionaries (`es.js`, `en.js`) and a `t(lang, key)` helper that resolves dot-notation keys (e.g. `t(lang, 'timer.start')`). Default language is Spanish (`es`).

`src/context/LanguageContext.jsx` wraps the app (via `main.jsx`'s `<LanguageProvider>`) and exposes the `useLang()` hook. Components call `useLang()` to get `{ lang, t }` — never call `t()` directly with a hardcoded lang string.

`src/hooks/useLanguage.js` manages language state and persists selection via `src/i18n/languageStorage.js`.

### Theming (`src/styles/themes.css`)

Three appearance themes: `dark` (default), `light`, `green` (light with green tones). Tokens are CSS custom properties on `:root[data-theme='…']`; `useTheme.js` writes the `data-theme` attribute on `<html>`.

`src/theme/index.js` (`VALID_THEMES`, `nextTheme`) + `themeStorage.js` (key `timer-app-theme`) + `context/ThemeContext.jsx` mirror the i18n setup. Components call `useThemeCtx()` — never read the attribute directly. The header toggle in `TimersHome.jsx` cycles dark → light → green.

Two token channels, and the distinction matters:
- `--fg-rgb` / `--shadow-rgb` go **inside** `rgba()`, so pre-existing alphas keep working when the theme inverts (`rgba(var(--fg-rgb), 0.1)`).
- `--surface-1/2/3`, `--border-1/2`, `--text-1/2/3` are explicit per theme, because a 3% overlay that reads as "elevated" on dark reads as nothing on light.
- `--accent-text` is the accent darkened for small text on light backgrounds; `--on-accent` is text sitting **on** an accent fill.
- `--bg-active` is the immersive full-screen timer background (deeper than `--bg-base`); `--track` is the unfilled part of progress rings and bars.

Phase colors (`--accent-rgb`, `--rest-rgb`, `--primary-rgb` in `WorkoutActiveView.scss`) are **identity, not theme** — they stay the same in all three themes. Same for `--btn-text`, which sits on an accent fill.

Breathing timers work the other way around: the phase **is** the background, so everything drawn on top reads against the phase gradient, not against `--bg-base`. They use a separate channel — `--breath-fg` / `--breath-fg-rgb` for content, `--breath-on-fg` for text on a `--breath-fg` fill, and `--breath-idle` / `--breath-inhale` / `--breath-hold` / `--breath-exhale` / `--breath-hold2` for the gradients themselves. Never use `--fg-rgb` inside `BreathingTimer.scss`; on the light themes it resolves to a color that fights the pastel gradient.

Two things there are deliberately not the content color: `--breath-sheen-*` (the circle's glass highlights, always white — light comes from above in every theme) and Wim Hof's `--wimhof-bg`, which keeps its own teal identity per theme.

Themed: everything except the two orphaned `Breathing426Timer` / `Breathing478Timer` components, which nothing imports.

### State Persistence (`src/utils/localStorage.js`)

Save/load/clear functions per timer type (HIIT, Tabata, Pomodoro). All `load*State` functions enforce a 1-hour expiry via a `timestamp` field — stale state is cleared and returns `null`. State is saved on pause and unmount, restored on mount.

`app.jsx` also persists the user's **favorite timer** (`saveFavoriteTimer` / `loadFavoriteTimer`) and **last active timer** (`saveActiveTimer` / `loadActiveTimer`) to survive page reloads.

### macOS Desktop App (Tauri v2)

`src-tauri/` wraps the **same** `src/` frontend in a native macOS window — there is no desktop fork of any component. Build docs: `docs/MACOS_BUILD.md`. Spec: `SPEC_MACOS.md`.

```bash
npm run audio:fetch    # once — downloads 13 MP3s (81MB) to assets-audio/
npm run tauri:dev      # native window against the Vite dev server
npm run tauri:build    # universal binary (arm64 + x86_64) → Timer.app
```

**The Rust layer never counts time.** Timer state lives in the frontend and only there; `src-tauri/` reflects what the frontend reports (`update_tray`) and forwards tray clicks back as `tray-action` events. A phase check in a `.rs` file means the abstraction is wrong.

Three commands, three modules: `sleep.rs` (`set_keep_awake` — IOKit assertion via the `keepawake` crate), `overlay.rs` (`set_overlay_mode` — 320×320 always-on-top, restores prior geometry), `tray.rs` (`update_tray` — menubar label + play/skip/reset menu).

Frontend seams — do not bypass them:
- `src/utils/tauri.js` — the only place that calls `invoke()`/`listen()`. Every wrapper is a **no-op that resolves** outside Tauri, so shared components call them unconditionally and the web PWA is unaffected.
- `src/config/audioSource.js` — the only place that decides Supabase vs bundled `/audio/`. All 13 tracks (2 workout + 9 lofi + 2 Wim Hof) come from Supabase on the web; `audioUrl()` swaps them wholesale under Tauri.
- `src/hooks/useDesktopIntegration.js` — wires one timer to keep-awake + tray. Called by `HiitTimerNew`, `TabataTimerNew`, `PomodoroTimer`.

Closing the window hides it (`prevent_close`) so the tray keeps counting; Quit is explicit from the tray menu.

**`npm ci` is currently broken:** `package.json` depends on `@tauri-apps/cli` and `@tauri-apps/api` but the lockfile predates them. Re-sync with the `node:22-alpine` command below before trusting CI.

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
| macOS shell setup | `src-tauri/src/lib.rs` |
| Tauri IPC wrappers | `src/utils/tauri.js` |
| Audio local vs remote | `src/config/audioSource.js` |
| macOS build docs | `docs/MACOS_BUILD.md` |

## Timer Component Props Interface

All timers accept: `name`, `autoMaximize`, `autoStart` (always false), `showBackButton`, `onBackClick`.

Maximized mode: double-click to toggle fullscreen; click anywhere to pause/resume.

## Dead Code Note

These hooks exist but have no active imports — candidates for removal:
`useAudioSync.js`, `useSeekControls.js`, `useTimerPersistence.js`

`useMouseTracking.js` — no active imports found; likely dead but verify before removing.

Active hooks sometimes confused as dead: `useLanguage.js` (used by `LanguageContext.jsx`), `useWorkoutTimer.js` and `useDoubleClick.js` (both used by `PomodoroTimer.jsx` and `BreathingTimer.jsx`).

Stale backup files in `src/components/`: `HiitTimer.jsx.backup`, `HiitTimer.scss.backup`, `TabataTimer.jsx.backup`, `TabataTimer.scss.backup` — safe to delete.
