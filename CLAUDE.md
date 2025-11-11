# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## /init - Project Overview

This is **HIIT & Tabata Timer**, a specialized Progressive Web Application focused on high-intensity workout timers with synchronized audio playback. While the codebase includes multiple timer types (Pomodoro, breathing exercises), the PRIMARY FOCUS is on HIIT and Tabata timers for fitness enthusiasts.

### Core Product Vision

**Primary Timers (Launch Focus):**
- **HIIT Timer:** 12 rounds of 40s work / 20s rest with synchronized MP3 music (`hiit_next-level_40-20.mp3`)
- **Tabata Timer:** 8 rounds of 20s work / 10s rest with synchronized MP3 music (`tabata_rocky_20-10.mp3`)

**Secondary Features (Future Expansion):**
- Pomodoro Timer for productivity
- Breathing timers for wellness

### Key Technical Differentiators

1. **Millisecond-Precise Audio Synchronization:** MP3 tracks are synchronized with timer phases using watchdog timers and drift correction
2. **Dual Audio Modes:** Users can toggle between motivational music (MP3) or simple beeps (Web Audio API)
3. **Mobile-First PWA:** Installable, offline-capable, with aggressive anti-pause mechanisms for mobile browsers
4. **State Persistence:** Workouts auto-save and restore with 1-hour expiry for interrupted sessions
5. **Fullscreen Workout Mode:** Immersive, distraction-free timer display with auto-hiding controls

### When Working on This Project

- **Priority:** Always optimize HIIT and Tabata timer functionality first
- **Audio is Critical:** Any changes to timing must maintain perfect sync with MP3 files
- **Mobile Performance:** Test thoroughly on mobile browsers (Safari, Chrome Mobile)
- **Configuration Files:** Use `hiitConfig.js` and `tabataConfig.js` for all timing adjustments
- **Documentation:** Refer to `docs/TECHNICAL_DOCUMENTATION.md` for complete technical specs

### Quick Reference

- **Main Config Files:** `src/config/hiitConfig.js`, `src/config/tabataConfig.js`
- **Audio System:** `src/utils/audioUtils.js` (HIIT/Tabata player functions, watchdog timers)
- **Timer Components:** `src/components/HiitTimer.jsx`, `src/components/TabataTimer.jsx`
- **State Persistence:** `src/utils/localStorage.js` (auto-save/restore with 1-hour expiry)

---

## Development Commands

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production 
- `npm run preview` - Preview production build locally

## Project Architecture

This is a **HIIT & Tabata Timer** application built with Preact and Vite. The architecture is designed around two core workout timers (HIIT and Tabata) with synchronized audio playback, precise timing, and mobile-first UX. Additional timer types (Pomodoro, breathing exercises) are included as secondary features for future expansion.

### Tech Stack
- **Preact**: Lightweight React alternative for UI components
- **Vite**: Build tool and development server
- **SCSS**: Component-scoped styling with variables and mixins
- **Web Audio API**: For synthesized sounds (beeps, countdown tones)
- **HTML5 Audio**: For MP3 music playback synchronized with timer phases

### Component Architecture

The app follows a component-based architecture with a main container, grid-based timer selection, and specialized timer components:

- **App.jsx**: Main container managing view state, navigation, and rendering all timer types
- **TimerCarousel.jsx**: Grid-based collage display showing all available timers side-by-side (not a carousel despite the name)

**REFACTORED ARCHITECTURE (November 2025):**
- **WorkoutTimer.jsx**: Base component with shared timer logic (500 lines)
- **WorkoutTimer.scss**: Shared styles and mixins for all workout timers

**PRIMARY TIMERS (Launch Focus):**
- **HiitTimer.jsx**: Thin wrapper (65 lines) around WorkoutTimer with HIIT-specific config (12 rounds: 40s work/20s rest)
- **TabataTimer.jsx**: Thin wrapper (65 lines) around WorkoutTimer with Tabata-specific config (8 rounds: 20s work/10s rest)

**REFACTORING BENEFITS:**
- 89% code reduction in HIIT/Tabata components
- Single source of truth for timer logic
- Easy to add new workout timers (AMRAP, EMOM, etc.)
- See `docs/REFACTORING_HIIT_TABATA.md` for details

**SECONDARY TIMERS (Future Expansion):**
- **PomodoroTimer.jsx**: Full Pomodoro Technique timer with work/break cycles (25min work, 5min short break, 15min long break after 4 sessions)
- **BoxBreathingTimer.jsx**: Box breathing exercise timer (4-4-4-4 pattern) with visual animations
- **RelaxingBreathTimer.jsx**: Relaxing breath exercise timer (4-7-8 pattern)
- **CalmingBreathTimer.jsx**: Calming breath exercise timer (4-2-6 pattern)

**SHARED COMPONENTS:**
- **Confetti.jsx**: Celebration animation component for workout completion

### UI Layout

The main view displays all timer types in a responsive grid layout:
- **Desktop (>1200px)**: Multi-column grid with auto-fit based on available space
- **Tablet (768-1200px)**: 2-3 column grid
- **Mobile (<480px)**: Single column stacked layout

Timer cards are displayed side-by-side showing:
- Category badge and duration
- Timer icon and title
- Description of the timer
- Session count statistics
- "Now Playing" indicator for active timers

### Audio System Architecture (CRITICAL COMPONENT)

The audio system is the core differentiator of this application, providing perfectly synchronized workout music:

**Dual Audio Modes:**
- **Music Mode (Primary)**: Synchronized MP3 playback with millisecond-precision timing
- **Beep Mode (Fallback)**: Synthesized sounds using Web Audio API for phase transitions

**HIIT Audio System:**
- MP3 File: `public/hiit_next-level_40-20.mp3` (12 rounds synchronized)
- Configuration: `src/config/hiitConfig.js` (precise timing offsets)
- Start Time: 1.37s offset to match MP3 intro
- Watchdog Timer: 300ms check interval to prevent mobile browser auto-pause
- State Persistence: Audio position saved/restored on pause/resume

**Tabata Audio System:**
- MP3 File: `public/tabata_rocky_20-10.mp3` (8 rounds synchronized)
- Configuration: `src/config/tabataConfig.js`
- Start Time: 0s (no offset)
- Watchdog Timer: Same anti-pause mechanism as HIIT

**Implementation Files:**
- `src/utils/audioUtils.js`: Audio player management, MP3 sync, beep generation, watchdog timers
- `src/config/hiitConfig.js`: HIIT timing configurations matching MP3 tracks
- `src/config/tabataConfig.js`: Tabata timing configurations matching MP3 tracks

### Configuration System

Timer configurations are externalized for easy customization and precise audio synchronization:

**PRIMARY CONFIGS (HIIT/Tabata Focus):**
- `hiitConfig.js`: Millisecond-precise timing for work/rest phases synchronized to MP3 track
  - Preparation: 10s
  - Work: 40s
  - Rest: 20s
  - Rounds: 12
  - Audio start offset: 1.37s
- `tabataConfig.js`: Tabata protocol configuration with audio sync
  - Preparation: 10s
  - Work: 20s
  - Rest: 10s
  - Rounds: 8
  - Audio start offset: 0s

**SECONDARY CONFIGS:**
- `pomodoroConfig.js`: Pomodoro Technique settings (work duration, break durations, sessions before long break)

**Key Feature:** Timing precision down to milliseconds for perfect audio synchronization

### Timer Component Patterns

All specialized timers share common patterns:
- **State Persistence**: All timers save/restore state via localStorage with 1-hour expiry
- **Props Interface**: Consistent props across all timers:
  - `name`: Timer display name
  - `autoMaximize`: Auto-enter fullscreen mode
  - `autoStart`: Auto-start timer (always false for UX)
  - `showBackButton`: Auto-hide back button visibility
  - `onBackClick`: Back navigation handler
- **State Management**: Current phase, time remaining, running status, session/round counters
- **Lifecycle Management**:
  - `useEffect` hooks for interval management with proper cleanup
  - State saving on pause/unmount
  - State restoration on mount
- **Phase Transition Logic**: Automatic or synchronized with audio
- **Maximization**:
  - Double-click in normal mode toggles fullscreen
  - Click anywhere in maximized mode pauses/resumes
  - Auto-hiding controls and back button (opacity: 0.3, visible on hover)
- **Control Buttons**:
  - Start/Pause (primary action)
  - Skip Phase (icon button with tooltip)
  - Reset (icon button with tooltip)
  - Only shown after timer starts
- **Audio Integration**:
  - HIIT/Tabata: MP3 music mode OR beeps mode
  - Pomodoro: Beeps for phase transitions and completion
  - Breathing: Optional audio cues
- **Visual Feedback**:
  - Progress bars with session/round info
  - Phase-specific background colors and animations
  - Confetti on completion
  - Pulsing animations during active phases

### Maximized Mode Feature

Specialized timers (HIIT, Tabata, Breathing) support fullscreen maximization:
- Double-click toggles maximized state (avoiding button clicks)
- Fullscreen overlay with larger display
- Controls become semi-transparent (0.3 opacity) with hover visibility
- Basic Timer component does not have maximization

### State Management

**Component State**:
- No global state management library
- Each timer manages its own state independently
- Parent-child communication via props
- Timer-specific state: time, phase, running status, session/round counters

**State Persistence** (`src/utils/localStorage.js`):
- `savePomodoroState()` / `loadPomodoroState()` / `clearPomodoroState()`
- `saveHiitState()` / `loadHiitState()` / `clearHiitState()`
- `saveTabataState()` / `loadTabataState()` / `clearTabataState()`
- Automatic 1-hour expiry on saved states
- Saves on pause and component unmount
- Restores on component mount

**Audio State**:
- Audio player state management in `audioUtils.js`
- HIIT and Tabata maintain separate audio instances
- Tracks playback position for state restoration
- Prevents spurious auto-pause with 2-second ignore window

### Styling Architecture

- **SCSS** with organized structure:
  - `src/styles/_variables.scss`: Global color and timing variables
  - `src/styles/_mixins.scss`: Reusable SCSS mixins
  - Component-specific `.scss` files for each timer
- Component-specific class naming (`.hiit-timer`, `.tabata-timer`)
- Phase-based styling with dynamic classes
- Responsive design with mobile breakpoints
- CSS animations for breathing exercises and phase transitions

### Service Worker Integration

- PWA functionality with offline support
- Service worker registration in App.jsx
- Network status detection for online/offline indicators