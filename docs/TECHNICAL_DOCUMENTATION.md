# Timer Application - Technical Documentation

**Version:** 1.0.0
**Date:** November 2025
**Tech Stack:** Preact, Vite, SCSS, Web Audio API, HTML5 Audio

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Component Structure](#component-structure)
4. [Audio System](#audio-system)
5. [State Management](#state-management)
6. [Configuration System](#configuration-system)
7. [Design Patterns](#design-patterns)
8. [API Reference](#api-reference)
9. [Development Guide](#development-guide)
10. [Deployment](#deployment)
11. [Testing Strategy](#testing-strategy)
12. [Performance Considerations](#performance-considerations)

---

## Overview

### Project Description

A Progressive Web Application (PWA) for specialized timers including Pomodoro Technique, HIIT workouts, Tabata training, and breathing exercises. Built with Preact for optimal performance and featuring synchronized audio playback, state persistence, and responsive design.

### Key Features

- **6 Specialized Timer Types:**
  - Pomodoro Timer (25-5-15 work/break cycles)
  - HIIT Timer (12 rounds: 40s work / 20s rest)
  - Tabata Timer (8 rounds: 20s work / 10s rest)
  - Box Breathing (4-4-4-4 pattern)
  - Relaxing Breath (4-7-8 pattern)
  - Calming Breath (4-2-6 pattern)

- **Audio Integration:**
  - Dual mode: MP3 music or synthesized beeps
  - Synchronized MP3 playback with precise timing
  - Web Audio API for beep sounds
  - Watchdog timers to prevent auto-pause

- **PWA Features:**
  - Service Worker for offline support
  - Installable on mobile and desktop
  - Network status detection

- **State Management:**
  - localStorage persistence with 1-hour expiry
  - State restoration on page reload
  - Active timer tracking

- **User Experience:**
  - Fullscreen maximization mode
  - Auto-hiding controls
  - Touch gestures and swipe navigation
  - Responsive grid layout
  - Celebration effects on completion

---

## Architecture

### High-Level Architecture

The application follows a component-based architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────┐
│              User Layer (Browser APIs)              │
│  Web Browser | PWA | Web Audio API | localStorage   │
└─────────────────────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────┐
│         Application Layer (Preact Components)       │
│  App.jsx → TimerCarousel → Individual Timers        │
└─────────────────────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────┐
│      Utilities Layer (Business Logic & I/O)         │
│  audioUtils | localStorage | timerHelpers          │
└─────────────────────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────┐
│     Configuration Layer (External Settings)         │
│  pomodoroConfig | hiitConfig | tabataConfig        │
└─────────────────────────────────────────────────────┘
```

### Directory Structure

```
timer-app/
├── public/                          # Static assets
│   ├── hiit_next-level_40-20.mp3    # HIIT workout music
│   ├── tabata_rocky_20-10.mp3       # Tabata workout music
│   ├── lofi_morning_routine.mp3     # Pomodoro work music
│   └── sw.js                        # Service Worker
├── src/
│   ├── components/                  # React/Preact components
│   │   ├── PomodoroTimer.jsx
│   │   ├── HiitTimer.jsx
│   │   ├── TabataTimer.jsx
│   │   ├── BoxBreathingTimer.jsx
│   │   ├── RelaxingBreathTimer.jsx
│   │   ├── CalmingBreathTimer.jsx
│   │   ├── TimerCarousel.jsx
│   │   └── Confetti.jsx
│   ├── config/                      # Configuration files
│   │   ├── pomodoroConfig.js
│   │   ├── hiitConfig.js
│   │   └── tabataConfig.js
│   ├── utils/                       # Utility modules
│   │   ├── audioUtils.js
│   │   ├── localStorage.js
│   │   └── timerHelpers.js
│   ├── hooks/                       # Custom React hooks
│   │   └── useDoubleClick.js
│   ├── styles/                      # Global styles
│   │   ├── _variables.scss
│   │   └── _mixins.scss
│   ├── app.jsx                      # Main application component
│   └── main.jsx                     # Application entry point
├── docs/                            # Documentation
│   ├── architecture-diagram.drawio  # Draw.io diagram
│   └── TECHNICAL_DOCUMENTATION.md   # This file
└── CLAUDE.md                        # Claude Code instructions
```

---

## Component Structure

### App Component (`src/app.jsx`)

**Responsibilities:**
- Main application container
- View state management (carousel vs timer view)
- Navigation handling (back button, browser history, swipe gestures)
- Service Worker registration
- Network status monitoring
- Active timer tracking

**State:**
- `currentView`: 'carousel' | 'timer'
- `activeTimer`: Currently selected timer data
- `isOnline`: Network connectivity status
- `favoriteTimer`: User's favorite timer
- `showBackButton`: Back button visibility

**Props Interface:**
```typescript
interface AppState {
  currentView: 'carousel' | 'timer';
  activeTimer: TimerData | null;
  isOnline: boolean;
  favoriteTimer: TimerData | null;
  showBackButton: boolean;
}
```

**Key Methods:**
- `handleTimerSelect(timerData)`: Navigate to timer view
- `handleBackToCarousel()`: Return to carousel view
- `handleSetFavorite(timerData)`: Mark timer as favorite
- `renderActiveTimer()`: Dynamically render selected timer

---

### TimerCarousel Component (`src/components/TimerCarousel.jsx`)

**Responsibilities:**
- Display all available timers in grid layout
- Handle timer selection
- Show session statistics
- Display "Now Playing" indicator for active timers
- Favorite timer management

**Props:**
```typescript
interface TimerCarouselProps {
  onTimerSelect: (timerData: TimerData) => void;
  onSetFavorite: (timerData: TimerData) => void;
  favoriteTimer: TimerData | null;
  activeTimer: TimerData | null;
}
```

**Layout:**
- **Desktop (>1200px):** Multi-column grid with auto-fit
- **Tablet (768-1200px):** 2-3 column grid
- **Mobile (<480px):** Single column stacked

---

### Timer Components (Specialized)

All specialized timer components share a common pattern and interface:

#### Common Props Interface

```typescript
interface TimerProps {
  name: string;           // Display name
  autoMaximize: boolean;  // Auto-enter fullscreen
  autoStart: boolean;     // Auto-start timer (always false)
  showBackButton: boolean;// Back button visibility
  onBackClick: () => void;// Back navigation handler
}
```

#### Common State Pattern

```typescript
interface TimerState {
  currentRound: number;        // Current round/session
  timeLeft: number;            // Remaining time in seconds
  isRunning: boolean;          // Timer running status
  isFinished: boolean;         // Completion status
  isWorkPhase: boolean;        // Work vs rest phase
  isPreparationPhase: boolean; // Preparation countdown
  musicMode: boolean;          // Music vs beeps mode
  isMaximized: boolean;        // Fullscreen state
}
```

#### Component Lifecycle

1. **Mount:**
   - Load saved state from localStorage
   - Restore timer position and phase
   - Initialize audio players

2. **Running:**
   - Update time every 100ms (precision timing)
   - Sync audio position with timer
   - Handle phase transitions
   - Auto-save state periodically

3. **Unmount:**
   - Save current state to localStorage
   - Cleanup intervals and timeouts
   - Stop audio playback

#### Timer-Specific Components

##### PomodoroTimer (`src/components/PomodoroTimer.jsx`)

**Algorithm:**
```
1. Work Session: 25 minutes
2. Short Break: 5 minutes
3. Repeat 4 times
4. Long Break: 15 minutes after 4th session
5. Restart cycle
```

**Audio:**
- Looping lo-fi music during work sessions
- Beeps for phase transitions
- Completion sound

**Configuration:** `src/config/pomodoroConfig.js`

---

##### HiitTimer (`src/components/HiitTimer.jsx`)

**Algorithm:**
```
1. Preparation: 10 seconds
2. Work: 40 seconds
3. Rest: 20 seconds
4. Repeat for 12 rounds
5. Celebration
```

**Audio Modes:**
- **Music Mode:** Synchronized MP3 playback (`hiit_next-level_40-20.mp3`)
- **Beeps Mode:** Synthesized countdown beeps

**Timing Precision:**
- MP3 start time: 1.37 seconds (config: `HIIT_AUDIO_CONFIG.startTime`)
- Watchdog timer: Checks every 300ms for auto-pause
- Audio position sync: Saves/restores playback position

**Configuration:** `src/config/hiitConfig.js`

---

##### TabataTimer (`src/components/TabataTimer.jsx`)

**Algorithm:**
```
1. Preparation: 10 seconds
2. Work: 20 seconds
3. Rest: 10 seconds
4. Repeat for 8 rounds
5. Celebration
```

**Audio Modes:**
- **Music Mode:** Synchronized MP3 playback (`tabata_rocky_20-10.mp3`)
- **Beeps Mode:** Synthesized countdown beeps

**Configuration:** `src/config/tabataConfig.js`

---

##### Breathing Timers

Three variants with different breathing patterns:

1. **BoxBreathingTimer:** 4-4-4-4 (inhale-hold-exhale-hold)
2. **RelaxingBreathTimer:** 4-7-8 (inhale-hold-exhale)
3. **CalmingBreathTimer:** 4-2-6 (inhale-hold-exhale)

**Visual Features:**
- Animated breathing circle
- Pulsing animations
- Phase-specific instructions
- Cycle counter

---

### Confetti Component (`src/components/Confetti.jsx`)

**Responsibilities:**
- Celebration animation on timer completion
- Canvas-based particle system
- Auto-cleanup after animation

**Props:**
```typescript
interface ConfettiProps {
  isActive: boolean;
  onComplete?: () => void;
}
```

---

## Audio System

### Architecture

The audio system supports two playback modes with separate implementations:

```
┌────────────────────────────────────────┐
│          Audio System                  │
├────────────────────────────────────────┤
│  Mode 1: Music (HTML5 Audio)          │
│  - MP3 Playback                        │
│  - Position Synchronization            │
│  - Watchdog Timers                     │
├────────────────────────────────────────┤
│  Mode 2: Beeps (Web Audio API)        │
│  - Synthesized Sounds                  │
│  - Frequency/Duration Control          │
│  - Envelope Shaping                    │
└────────────────────────────────────────┘
```

### Music Mode (HTML5 Audio)

#### Audio Player Management

**File:** `src/utils/audioUtils.js`

**Key Features:**
- Separate audio instances for HIIT, Tabata, and Pomodoro
- Lazy initialization on first use
- Preload and ready state tracking
- Auto-resume watchdog timers

**Audio Instance Structure:**

```javascript
// HIIT Audio Player
let hiitAudio = null;
let audioPlayerReady = false;
let audioPlayerLoading = false;
let hiitPlaybackStartTime = 0;
let hiitShouldBePlaying = false;
let hiitWatchdog = null;

// Similar structure for Tabata and Pomodoro
```

#### Audio Configuration

```javascript
// HIIT Configuration
export const HIIT_AUDIO_CONFIG = {
  audioPath: '/hiit_next-level_40-20_x12.mp3',
  startTime: 1.37, // Precise timing offset
  url: '/hiit_next-level_40-20.mp3'
};

// Tabata Configuration
export const TABATA_AUDIO_CONFIG = {
  audioPath: '/tabata_rocky_20-10_x4.mp3',
  startTime: 0,
  url: '/tabata_rocky_20-10_x4.mp3'
};

// Pomodoro Configuration
export const POMODORO_AUDIO_CONFIG = {
  audioPath: '/lofi_morning_routine-chosic.com.mp3',
  startTime: 0,
  url: '/lofi_morning_routine-chosic.com.mp3'
};
```

#### Watchdog Timer System

**Purpose:** Prevent browser auto-pause on mobile devices

**Algorithm:**
```javascript
// Check every 300ms
setInterval(() => {
  if (audio && shouldBePlaying) {
    if (audio.paused) {
      const timeSinceStart = Date.now() - playbackStartTime;
      if (timeSinceStart > 3000) {
        // Auto-resume after 3 seconds
        audio.play();
        playbackStartTime = Date.now();
      }
    }
  }
}, 300);
```

**Why 3 seconds?**
- Ignores intentional pauses within first 2 seconds
- Catches unintentional auto-pauses from browser
- Balances responsiveness and stability

#### Position Synchronization

**State Persistence:**
```javascript
// Save audio position on pause
const audioPosition = getAudioPosition(); // returns currentTime
saveHiitState({ ...state, audioPosition });

// Restore on resume
const savedState = loadHiitState();
if (savedState.audioPosition) {
  setAudioPosition(savedState.audioPosition);
}
```

### Beeps Mode (Web Audio API)

#### Synthesized Sound Generation

**Implementation:**

```javascript
export const playBeep = (frequency = 800, duration = 150, volume = 0.3) => {
  const ctx = initAudioContext();
  if (!ctx) return;

  // Resume context (required by browsers)
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  // Create oscillator and gain node
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  // Configure sound
  oscillator.frequency.value = frequency;
  oscillator.type = 'sine';

  // Envelope: Attack-Decay
  gainNode.gain.setValueAtTime(0, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000);

  // Play
  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + duration / 1000);
};
```

#### Specialized Sounds

```javascript
// Work phase start (energetic)
playWorkSound() → playBeep(1000, 200, 0.4);

// Countdown (3-2-1 pattern)
playCountdownSound(3) → playBeep(600, 300, 0.35);
playCountdownSound(2) → playBeep(700, 300, 0.35);
playCountdownSound(1) → playBeep(800, 300, 0.35);

// Preparation (gentle)
playPrepSound() → playBeep(500, 100, 0.25);
```

### Audio API Reference

#### HIIT Audio Functions

```javascript
// Initialization
initializeAudioPlayer(): Promise<boolean>
isPlayerReady(): boolean
isPlayerLoading(): boolean

// Playback Control
playHiitSong(): Promise<void>
pauseHiitSong(): void
resumeHiitSong(): void
stopHiitSong(): void

// Position Management
getAudioPosition(): number | null
setAudioPosition(position: number): boolean

// State Queries
isAudioPlaying(): boolean
shouldIgnoreHiitPause(): boolean
getAudioPlayer(): HTMLAudioElement
```

#### Tabata Audio Functions

```javascript
// Similar structure to HIIT
initializeTabataAudioPlayer(): Promise<boolean>
isTabataPlayerReady(): boolean
playTabataSong(): Promise<void>
pauseTabataSong(): void
resumeTabataSong(): void
stopTabataSong(): void
getTabataAudioPosition(): number | null
setTabataAudioPosition(position: number): boolean
isTabataAudioPlaying(): boolean
shouldIgnoreTabataPause(): boolean
```

#### Pomodoro Audio Functions

```javascript
// Similar structure, with looping support
initializePomodoroAudioPlayer(): Promise<boolean>
isPomodoroPlayerReady(): boolean
playPomodoroSong(): Promise<void>
pausePomodoroSong(): void
resumePomodoroSong(): void
stopPomodoroSong(): void
isPomodoroAudioPlaying(): boolean
```

#### Beep Functions

```javascript
playBeep(frequency: number, duration: number, volume: number): void
playWorkSound(): void
playCountdownSound(count: number): void
playPrepSound(): void
```

---

## State Management

### Overview

The application uses a hybrid state management approach:

1. **Component State:** Local useState hooks for UI state
2. **localStorage:** Persistent state for timer progress
3. **No Global Store:** Parent-child communication via props

### localStorage Architecture

**File:** `src/utils/localStorage.js`

#### Storage Keys

```javascript
const STORAGE_KEYS = {
  FAVORITE_TIMER: 'timerApp_favoriteTimer',
  HIIT_STATE: 'timerApp_hiitState',
  TABATA_STATE: 'timerApp_tabataState',
  POMODORO_STATE: 'timerApp_pomodoroState',
  ACTIVE_TIMER: 'timerApp_activeTimer'
};
```

#### State Structure

**HIIT/Tabata State:**
```javascript
{
  currentRound: number,
  timeLeft: number,
  isWorkPhase: boolean,
  isPreparationPhase: boolean,
  isRunning: boolean,
  isFinished: boolean,
  currentSubtitle: string,
  musicMode: boolean,
  audioPosition: number,
  timestamp: number
}
```

**Pomodoro State:**
```javascript
{
  currentSession: number,
  timeLeft: number,
  isWorkPhase: boolean,
  isRunning: boolean,
  isFinished: boolean,
  currentMessage: string,
  currentSubtitle: string,
  musicMode: boolean,
  volume: number,
  timestamp: number
}
```

#### State Expiry

**Algorithm:**
```javascript
const loadState = () => {
  const state = localStorage.getItem(key);
  if (state && state.timestamp) {
    const age = Date.now() - state.timestamp;
    const ONE_HOUR = 60 * 60 * 1000;

    if (age > ONE_HOUR) {
      clearState();
      return null;
    }
  }
  return state;
};
```

**Rationale:**
- Prevents restoration of stale sessions
- 1-hour window for short breaks
- Automatic cleanup of old data

#### API Reference

```javascript
// Generic helpers
saveToStorage(key: string, value: any): boolean
loadFromStorage(key: string): any | null
removeFromStorage(key: string): boolean

// Favorite timer
saveFavoriteTimer(timerData: object): boolean
loadFavoriteTimer(): object | null

// Active timer tracking
saveActiveTimer(timerData: object): boolean
loadActiveTimer(): object | null
clearActiveTimer(): boolean

// HIIT state
saveHiitState(state: object): boolean
loadHiitState(): object | null
clearHiitState(): boolean

// Tabata state
saveTabataState(state: object): boolean
loadTabataState(): object | null
clearTabataState(): boolean

// Pomodoro state
savePomodoroState(state: object): boolean
loadPomodoroState(): object | null
clearPomodoroState(): boolean

// Cleanup
clearAllTimerData(): boolean
```

---

## Configuration System

### Design Philosophy

**Externalized Configuration:**
- Timer parameters in separate config files
- Easy customization without code changes
- Multiple timer variants support
- Precise timing for audio synchronization

### Configuration Files

#### Pomodoro Configuration

**File:** `src/config/pomodoroConfig.js`

```javascript
export const POMODORO_CONFIG = {
  workDuration: 25 * 60,      // 25 minutes in seconds
  shortBreakDuration: 5 * 60, // 5 minutes
  longBreakDuration: 15 * 60, // 15 minutes
  sessionsBeforeLongBreak: 4  // 4 work sessions
};
```

**Customization Example:**
```javascript
// Ultra-focused variant
export const DEEP_WORK_CONFIG = {
  workDuration: 90 * 60,      // 90 minutes
  shortBreakDuration: 15 * 60, // 15 minutes
  longBreakDuration: 30 * 60,  // 30 minutes
  sessionsBeforeLongBreak: 2
};
```

#### HIIT Configuration

**File:** `src/config/hiitConfig.js`

```javascript
export const HIIT_CONFIG = {
  preparationTime: 10,    // seconds
  workTime: 40,           // seconds
  restTime: 20,           // seconds
  rounds: 12,

  // MP3 synchronization (milliseconds precision)
  audio: {
    startTime: 1.37,      // seconds offset
    preparationOffset: 0,
    workPhaseOffset: 10,
    restPhaseOffset: 50,
    roundDuration: 60     // total seconds per round
  }
};
```

**Timing Precision:**
- Millisecond-level accuracy for MP3 sync
- Accounts for MP3 intro/outro
- Configurable phase offsets

#### Tabata Configuration

**File:** `src/config/tabataConfig.js`

```javascript
export const TABATA_CONFIG = {
  preparationTime: 10,    // seconds
  workTime: 20,           // seconds
  restTime: 10,           // seconds
  rounds: 8,

  // MP3 synchronization
  audio: {
    startTime: 0,
    roundDuration: 30
  }
};
```

---

## Design Patterns

### Component Patterns

#### 1. Maximization Pattern

**Feature:** Fullscreen mode for distraction-free timers

**Implementation:**

```javascript
// State
const [isMaximized, setIsMaximized] = useState(false);

// Double-click handler (avoiding button clicks)
const handleDoubleClick = (e) => {
  // Ignore if clicking on buttons/controls
  if (e.target.closest('button')) return;
  setIsMaximized(!isMaximized);
};

// Click-to-pause in maximized mode
const handleMaximizedClick = () => {
  if (isMaximized) {
    setIsRunning(!isRunning);
  }
};

// Conditional rendering
{isMaximized ? (
  <div className="maximized-view" onClick={handleMaximizedClick}>
    {/* Large display with auto-hiding controls */}
  </div>
) : (
  <div className="normal-view" onDoubleClick={handleDoubleClick}>
    {/* Standard view */}
  </div>
)}
```

**CSS Pattern:**
```scss
.maximized-view {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 1000;

  .controls {
    opacity: 0.3;
    transition: opacity 0.3s;

    &:hover {
      opacity: 1;
    }
  }
}
```

#### 2. Auto-Hide Controls Pattern

**Feature:** Controls fade out after 3 seconds of inactivity

**Implementation:**

```javascript
const [showBackButton, setShowBackButton] = useState(true);
const [hideButtonTimeout, setHideButtonTimeout] = useState(null);

useEffect(() => {
  const handleMouseMove = () => {
    setShowBackButton(true);

    if (hideButtonTimeout) {
      clearTimeout(hideButtonTimeout);
    }

    const timeout = setTimeout(() => {
      setShowBackButton(false);
    }, 3000);

    setHideButtonTimeout(timeout);
  };

  if (currentView === 'timer') {
    window.addEventListener('mousemove', handleMouseMove);
  }

  return () => {
    window.removeEventListener('mousemove', handleMouseMove);
    if (hideButtonTimeout) {
      clearTimeout(hideButtonTimeout);
    }
  };
}, [currentView, hideButtonTimeout]);
```

#### 3. Precision Timing Pattern

**Feature:** Accurate countdown with drift correction

**Implementation:**

```javascript
// Don't rely on setInterval alone
let startTime = Date.now();
let expectedTime = startTime + 1000;

const tick = () => {
  const drift = Date.now() - expectedTime;

  // Update state
  setTimeLeft(prev => Math.max(0, prev - 1));

  // Adjust next tick for drift
  expectedTime += 1000;
  setTimeout(tick, Math.max(0, 1000 - drift));
};

// Start timing loop
setTimeout(tick, 1000);
```

**Why This Matters:**
- Browser timers are not precise
- Accumulated drift over long sessions
- Ensures audio stays synchronized

#### 4. State Persistence Pattern

**Feature:** Save/restore timer state across sessions

**Implementation:**

```javascript
// Save on pause
useEffect(() => {
  if (!isRunning && timeLeft > 0 && timeLeft < totalTime) {
    const state = {
      currentRound,
      timeLeft,
      isWorkPhase,
      audioPosition: getAudioPosition(),
      timestamp: Date.now()
    };
    saveHiitState(state);
  }
}, [isRunning, timeLeft, currentRound, isWorkPhase]);

// Save on unmount
useEffect(() => {
  return () => {
    if (!isFinished && timeLeft > 0) {
      saveHiitState(currentState);
    }
  };
}, []);

// Restore on mount
useEffect(() => {
  const savedState = loadHiitState();
  if (savedState) {
    setCurrentRound(savedState.currentRound);
    setTimeLeft(savedState.timeLeft);
    setIsWorkPhase(savedState.isWorkPhase);
    // ... restore other state
  }
}, []);
```

### Responsive Design Patterns

#### Grid Layout

**CSS Implementation:**

```scss
.timer-carousel {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  padding: 2rem;

  @media (min-width: 1200px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
}
```

---

## API Reference

### Component APIs

#### App Component

```typescript
interface App {
  // No public API - root component
}
```

#### TimerCarousel Component

```typescript
interface TimerCarousel {
  props: {
    onTimerSelect: (timerData: TimerData) => void;
    onSetFavorite: (timerData: TimerData) => void;
    favoriteTimer: TimerData | null;
    activeTimer: TimerData | null;
  };
}

interface TimerData {
  component: string;
  title: string;
  duration: string;
  category: string;
  description: string;
}
```

#### Timer Components (Common Interface)

```typescript
interface TimerComponent {
  props: {
    name: string;
    autoMaximize: boolean;
    autoStart: boolean;
    showBackButton: boolean;
    onBackClick: () => void;
  };

  state: {
    currentRound: number;
    timeLeft: number;
    isRunning: boolean;
    isFinished: boolean;
    isWorkPhase: boolean;
    isMaximized: boolean;
    musicMode: boolean;
  };

  methods: {
    handleStart: () => void;
    handlePause: () => void;
    handleReset: () => void;
    handleSkipPhase: () => void;
  };
}
```

### Utility APIs

See [Audio API Reference](#audio-api-reference) and [State Management API](#api-reference-1) sections above.

---

## Development Guide

### Prerequisites

```bash
Node.js >= 18.x
npm >= 9.x
```

### Installation

```bash
# Clone repository
git clone <repository-url>
cd timer-app

# Install dependencies
npm install
```

### Development Commands

```bash
# Start development server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Development Workflow

#### Adding a New Timer Component

1. **Create Component File:**
```javascript
// src/components/MyCustomTimer.jsx
import { useState, useEffect } from 'preact/hooks';
import './MyCustomTimer.scss';

export default function MyCustomTimer({
  name,
  autoMaximize,
  autoStart,
  showBackButton,
  onBackClick
}) {
  // State setup
  const [timeLeft, setTimeLeft] = useState(300);
  const [isRunning, setIsRunning] = useState(false);

  // Timer logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isRunning, timeLeft]);

  return (
    <div className="my-custom-timer">
      {/* UI implementation */}
    </div>
  );
}
```

2. **Create SCSS File:**
```scss
// src/components/MyCustomTimer.scss
@import '../styles/variables';
@import '../styles/mixins';

.my-custom-timer {
  // Styles
}
```

3. **Add to TimerCarousel:**
```javascript
// src/components/TimerCarousel.jsx
const timers = [
  // ... existing timers
  {
    component: 'MyCustomTimer',
    title: 'My Custom Timer',
    duration: '5 min',
    category: 'Custom',
    description: 'Description of your timer'
  }
];
```

4. **Register in App:**
```javascript
// src/app.jsx
import MyCustomTimer from './components/MyCustomTimer';

const renderActiveTimer = () => {
  // ...
  case 'MyCustomTimer':
    return <MyCustomTimer {...commonProps} />;
  // ...
};
```

#### Adding Audio to Timer

1. **Place MP3 in public folder:**
```
public/my-custom-audio.mp3
```

2. **Add configuration to audioUtils.js:**
```javascript
// src/utils/audioUtils.js
export const MY_CUSTOM_AUDIO_CONFIG = {
  audioPath: '/my-custom-audio.mp3',
  startTime: 0,
  url: '/my-custom-audio.mp3'
};

// Create player functions
let myCustomAudio = null;
// ... (follow pattern from HIIT/Tabata examples)
```

3. **Integrate in component:**
```javascript
import {
  initializeMyCustomAudioPlayer,
  playMyCustomSong,
  pauseMyCustomSong
} from '../utils/audioUtils';

// In component
useEffect(() => {
  initializeMyCustomAudioPlayer();
}, []);

const handleStart = async () => {
  setIsRunning(true);
  if (musicMode) {
    await playMyCustomSong();
  }
};
```

#### State Persistence

1. **Add storage key:**
```javascript
// src/utils/localStorage.js
const STORAGE_KEYS = {
  // ...
  MY_CUSTOM_STATE: 'timerApp_myCustomState'
};
```

2. **Create save/load functions:**
```javascript
export const saveMyCustomState = (state) => {
  const stateToSave = {
    ...state,
    timestamp: Date.now()
  };
  return saveToStorage(STORAGE_KEYS.MY_CUSTOM_STATE, stateToSave);
};

export const loadMyCustomState = () => {
  const state = loadFromStorage(STORAGE_KEYS.MY_CUSTOM_STATE);

  if (state && state.timestamp) {
    const age = Date.now() - state.timestamp;
    const ONE_HOUR = 60 * 60 * 1000;

    if (age > ONE_HOUR) {
      clearMyCustomState();
      return null;
    }
  }

  return state;
};

export const clearMyCustomState = () => {
  return removeFromStorage(STORAGE_KEYS.MY_CUSTOM_STATE);
};
```

### Code Style Guidelines

#### JavaScript/JSX

- Use functional components with hooks
- Prefer `const` over `let`, avoid `var`
- Use arrow functions for callbacks
- Destructure props and state
- Keep components under 300 lines

#### SCSS

- Use BEM-like naming: `.component__element--modifier`
- Organize: variables → mixins → base → components
- Use variables from `_variables.scss`
- Mobile-first media queries

#### Comments

```javascript
// Good: Explain why, not what
// Watchdog prevents mobile browser auto-pause

// Bad: Redundant
// Set running to true
setIsRunning(true);
```

---

## Deployment

### Build Process

```bash
# Production build
npm run build

# Output: dist/ directory
```

### Build Configuration

**File:** `vite.config.js`

```javascript
export default {
  build: {
    outDir: 'dist',
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'preact': ['preact'],
          'audio': ['./src/utils/audioUtils.js']
        }
      }
    }
  }
};
```

### PWA Configuration

**Service Worker:** `public/sw.js`

```javascript
const CACHE_NAME = 'timer-app-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/hiit_next-level_40-20.mp3',
  '/tabata_rocky_20-10.mp3',
  '/lofi_morning_routine.mp3'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});
```

### Deployment Platforms

#### Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

#### Netlify

```bash
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"
```

#### GitHub Pages

```bash
# Install gh-pages
npm install --save-dev gh-pages

# Add to package.json
"scripts": {
  "deploy": "gh-pages -d dist"
}

# Deploy
npm run deploy
```

---

## Testing Strategy

### Unit Testing

**Framework:** Vitest + Testing Library

```javascript
// Example: Timer component test
import { render, screen, fireEvent } from '@testing-library/preact';
import { describe, it, expect } from 'vitest';
import PomodoroTimer from '../components/PomodoroTimer';

describe('PomodoroTimer', () => {
  it('renders with initial time', () => {
    render(<PomodoroTimer name="Pomodoro" />);
    expect(screen.getByText('25:00')).toBeInTheDocument();
  });

  it('starts timer on button click', () => {
    render(<PomodoroTimer name="Pomodoro" />);
    const startButton = screen.getByText('Start');
    fireEvent.click(startButton);
    expect(screen.getByText('Pause')).toBeInTheDocument();
  });
});
```

### Integration Testing

**Test Scenarios:**
- Navigation between carousel and timer views
- State persistence across page reloads
- Audio playback synchronization
- PWA offline functionality

### Manual Testing Checklist

- [ ] All 6 timers load correctly
- [ ] Audio plays in both music and beep modes
- [ ] State persists after page reload
- [ ] Maximization works with double-click
- [ ] Back button and swipe gestures navigate correctly
- [ ] Confetti displays on completion
- [ ] Responsive layout on mobile/tablet/desktop
- [ ] PWA installs on mobile devices
- [ ] Offline functionality works

---

## Performance Considerations

### Bundle Size Optimization

**Current Bundle Sizes:**
- Main bundle: ~45 KB (gzipped)
- Preact: ~4 KB
- SCSS: ~8 KB (gzipped)

**Optimization Strategies:**
1. Code splitting by route
2. Lazy loading audio players
3. Minification with esbuild
4. Tree-shaking unused imports

### Runtime Performance

**Optimization Techniques:**

1. **Memoization:**
```javascript
const formatTime = useMemo(() => {
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}, [timeLeft]);
```

2. **Debouncing:**
```javascript
const debouncedSave = debounce(() => {
  saveTimerState(currentState);
}, 1000);
```

3. **requestAnimationFrame for animations:**
```javascript
const animate = () => {
  updateAnimation();
  requestAnimationFrame(animate);
};
```

### Audio Performance

- Preload audio files on component mount
- Use watchdog timers sparingly (300ms interval)
- Cleanup audio resources on unmount

### Memory Management

```javascript
useEffect(() => {
  // Setup
  const timer = setInterval(tick, 1000);
  const watchdog = setInterval(checkAudio, 300);

  // Cleanup
  return () => {
    clearInterval(timer);
    clearInterval(watchdog);
    stopAudio();
  };
}, [dependencies]);
```

---

## Troubleshooting

### Common Issues

#### Audio Not Playing

**Symptoms:** Audio doesn't start when timer begins

**Solutions:**
1. Check browser autoplay policies (requires user interaction)
2. Verify MP3 files are in `public/` folder
3. Check console for loading errors
4. Ensure audio context is initialized

#### State Not Persisting

**Symptoms:** Timer resets after page reload

**Solutions:**
1. Check localStorage is enabled in browser
2. Verify state timestamp is within 1-hour window
3. Check for localStorage quota errors
4. Clear browser cache and test

#### Timer Drift

**Symptoms:** Timer becomes out of sync with audio

**Solutions:**
1. Use precision timing pattern (see [Design Patterns](#3-precision-timing-pattern))
2. Verify watchdog timers are running
3. Check for performance issues in DevTools
4. Reduce other CPU-intensive operations

#### PWA Not Installing

**Symptoms:** "Install App" prompt doesn't appear

**Solutions:**
1. Verify HTTPS connection (required for PWA)
2. Check `manifest.json` is valid
3. Ensure service worker is registered
4. Test in supported browsers (Chrome, Edge, Safari)

---

## Future Enhancements

### Planned Features

1. **Custom Timer Builder:**
   - User-defined work/rest intervals
   - Save custom timer presets
   - Share timers via URL

2. **Statistics Dashboard:**
   - Total sessions completed
   - Time spent per timer type
   - Streak tracking
   - Charts and visualizations

3. **Themes:**
   - Dark mode
   - Custom color schemes
   - Accessibility themes

4. **Social Features:**
   - Share achievements
   - Challenge friends
   - Leaderboards

5. **Advanced Audio:**
   - Spotify integration
   - Custom playlist support
   - Volume controls per timer
   - Audio equalizer

6. **Notifications:**
   - Browser notifications for breaks
   - Desktop alerts
   - Customizable notification sounds

---

## Contributing

### Getting Started

1. Fork repository
2. Create feature branch: `git checkout -b feature/my-feature`
3. Make changes and test
4. Commit: `git commit -m 'feat: Add my feature'`
5. Push: `git push origin feature/my-feature`
6. Open Pull Request

### Commit Message Format

```
type(scope): subject

body

footer
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Tests
- `chore`: Maintenance

**Example:**
```
feat(audio): Add volume control to Pomodoro timer

Implement volume slider in settings panel
Save volume preference to localStorage
Update audioUtils to support volume control

Closes #123
```

---

## License

MIT License - See LICENSE file for details

---

## Contact

For questions or support:
- GitHub Issues: [repository-url/issues]
- Email: [your-email]
- Documentation: [docs-url]

---

**Document Version:** 1.0.0
**Last Updated:** November 2025
**Maintained by:** Development Team
