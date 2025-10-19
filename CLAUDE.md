# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production 
- `npm run preview` - Preview production build locally

## Project Architecture

This is a timer application built with Preact and Vite, featuring multiple specialized timer components with audio integration and precise timing configurations.

### Tech Stack
- **Preact**: Lightweight React alternative for UI components
- **Vite**: Build tool and development server
- **SCSS**: Component-scoped styling with variables and mixins
- **Web Audio API**: For synthesized sounds (beeps, countdown tones)
- **HTML5 Audio**: For MP3 music playback synchronized with timer phases

### Component Architecture

The app follows a component-based architecture with a main container and specialized timer components:

- **App.jsx**: Main container managing basic timers collection and rendering all timer types
- **Timer.jsx**: Basic countdown timer component (Pomodoro/custom timers)
- **HiitTimer.jsx**: HIIT timer with precise MP3 sync (12 rounds: 40s work/20s rest)
- **TabataTimer.jsx**: Tabata protocol timer (8 rounds: 20s work/10s rest) 
- **Breathing44Timer.jsx**: 4-4-4-4 breathing exercise timer with visual animations
- **Confetti.jsx**: Celebration animation component for workout completion

### Audio System Architecture

The audio system supports two modes:
- **Music Mode**: Synchronized MP3 playback (`audioUtils.js`) with precise timing
- **Beep Mode**: Synthesized sounds using Web Audio API for phase transitions

Key audio files:
- `src/utils/audioUtils.js`: Audio player management, MP3 sync, beep generation
- `src/config/hiitConfig.js`: Precise timing configurations matching MP3 tracks
- `public/hiit_next-level_40-20.mp3`: Local MP3 file for HIIT workouts

### Configuration System

Timer configurations are externalized for easy customization:
- `hiitConfig.js`: Contains precise timing for work/rest phases synchronized to specific MP3 tracks
- Supports multiple song configurations through `SONG_CONFIGURATIONS` object
- Timing precision down to milliseconds for perfect audio synchronization

### Timer Component Patterns

All specialized timers share common patterns:
- State management for current phase, time remaining, running status
- `useEffect` hook for interval management with proper cleanup
- Phase transition logic synchronized with audio
- Double-click functionality for maximized fullscreen mode
- CSS classes for different phases and maximized state
- Control buttons: start/pause, skip phase, reset
- Audio mode toggling (music vs beeps)

### Maximized Mode Feature

Specialized timers (HIIT, Tabata, Breathing) support fullscreen maximization:
- Double-click toggles maximized state (avoiding button clicks)
- Fullscreen overlay with larger display
- Controls become semi-transparent (0.3 opacity) with hover visibility
- Basic Timer component does not have maximization

### State Management

Each timer manages its own state independently:
- No global state management library
- Parent-child communication via props
- Timer-specific state: time, phase, running status, round counters
- Audio player state management in `audioUtils.js`

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