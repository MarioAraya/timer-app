# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production 
- `npm run preview` - Preview production build locally

## Project Architecture

This is a timer application built with Preact and Vite, featuring multiple specialized timer components.

### Tech Stack
- **Preact**: Lightweight React alternative for UI components
- **Vite**: Build tool and development server
- **CSS**: Component-scoped styling (no CSS-in-JS framework)

### Component Architecture

The app follows a component-based architecture with a main container and specialized timer components:

- **App.jsx**: Main container that manages a collection of basic timers and renders all timer types
- **Timer.jsx**: Basic countdown timer component (used for Pomodoro and custom timers)
- **HiitTimer.jsx**: High-Intensity Interval Training timer (12 rounds: 40s work/20s rest)
- **TabataTimer.jsx**: Tabata protocol timer (8 rounds: 20s work/10s rest) 
- **Breathing44Timer.jsx**: 4-4-4-4 breathing exercise timer (4 phases: inhale/hold/exhale/hold)

### Timer Component Patterns

All specialized timers share common patterns:
- State management for current phase, time remaining, and running status
- `useEffect` hook for interval management with proper cleanup
- Phase transition logic in timer countdown
- Double-click functionality to toggle maximized fullscreen mode
- CSS classes for different phases and maximized state
- Control buttons: start/pause, skip phase, reset

### Maximized Mode Feature

Specialized timers (HIIT, Tabata, Breathing) support fullscreen maximization:
- Double-click toggles maximized state
- Fullscreen overlay with larger display
- Controls and stats become semi-transparent (0.3 opacity) and fully visible on hover
- Basic Timer component (Pomodoro) does not have maximization feature

### State Management

Each timer manages its own state independently:
- No global state management library
- Parent-child communication via props
- Timer-specific state: time, phase, running status, round counters

### Styling Approach

- Each component has its own CSS file
- Component-specific class naming (e.g., `.hiit-timer`, `.tabata-timer`)
- Phase-based styling with dynamic classes
- Responsive design with mobile breakpoints
- Animation and transition effects for phase changes