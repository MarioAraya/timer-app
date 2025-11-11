// localStorage utilities for timer state persistence

const STORAGE_KEYS = {
  FAVORITE_TIMER: 'timerApp_favoriteTimer',
  HIIT_STATE: 'timerApp_hiitState',
  TABATA_STATE: 'timerApp_tabataState',
  POMODORO_STATE: 'timerApp_pomodoroState',
  ACTIVE_TIMER: 'timerApp_activeTimer'
}

// Generic localStorage helpers
export const saveToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (error) {
    console.error('Error saving to localStorage:', error)
    return false
  }
}

export const loadFromStorage = (key) => {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : null
  } catch (error) {
    console.error('Error loading from localStorage:', error)
    return null
  }
}

export const removeFromStorage = (key) => {
  try {
    localStorage.removeItem(key)
    return true
  } catch (error) {
    console.error('Error removing from localStorage:', error)
    return false
  }
}

// Favorite timer management
export const saveFavoriteTimer = (timerData) => {
  return saveToStorage(STORAGE_KEYS.FAVORITE_TIMER, timerData)
}

export const loadFavoriteTimer = () => {
  return loadFromStorage(STORAGE_KEYS.FAVORITE_TIMER)
}

// Active timer tracking
export const saveActiveTimer = (timerData) => {
  return saveToStorage(STORAGE_KEYS.ACTIVE_TIMER, timerData)
}

export const loadActiveTimer = () => {
  return loadFromStorage(STORAGE_KEYS.ACTIVE_TIMER)
}

export const clearActiveTimer = () => {
  return removeFromStorage(STORAGE_KEYS.ACTIVE_TIMER)
}

// HIIT timer state management
export const saveHiitState = (state) => {
  const stateToSave = {
    currentRound: state.currentRound,
    timeLeft: state.timeLeft,
    isWorkPhase: state.isWorkPhase,
    isPreparationPhase: state.isPreparationPhase,
    isRunning: state.isRunning,
    isFinished: state.isFinished,
    currentSubtitle: state.currentSubtitle,
    musicMode: state.musicMode,
    audioPosition: state.audioPosition, // Current position in song
    timestamp: Date.now() // For detecting stale data
  }
  return saveToStorage(STORAGE_KEYS.HIIT_STATE, stateToSave)
}

export const loadHiitState = () => {
  const state = loadFromStorage(STORAGE_KEYS.HIIT_STATE)

  // Don't restore state if it's older than 1 hour (stale)
  if (state && state.timestamp) {
    const age = Date.now() - state.timestamp
    const ONE_HOUR = 60 * 60 * 1000

    if (age > ONE_HOUR) {
      clearHiitState()
      return null
    }
  }

  return state
}

export const clearHiitState = () => {
  return removeFromStorage(STORAGE_KEYS.HIIT_STATE)
}

// Tabata timer state management
export const saveTabataState = (state) => {
  const stateToSave = {
    currentRound: state.currentRound,
    timeLeft: state.timeLeft,
    isWorkPhase: state.isWorkPhase,
    isPreparationPhase: state.isPreparationPhase,
    isRunning: state.isRunning,
    isFinished: state.isFinished,
    currentSubtitle: state.currentSubtitle,
    musicMode: state.musicMode,
    audioPosition: state.audioPosition, // Current position in song
    timestamp: Date.now() // For detecting stale data
  }
  return saveToStorage(STORAGE_KEYS.TABATA_STATE, stateToSave)
}

export const loadTabataState = () => {
  const state = loadFromStorage(STORAGE_KEYS.TABATA_STATE)

  // Don't restore state if it's older than 1 hour (stale)
  if (state && state.timestamp) {
    const age = Date.now() - state.timestamp
    const ONE_HOUR = 60 * 60 * 1000

    if (age > ONE_HOUR) {
      clearTabataState()
      return null
    }
  }

  return state
}

export const clearTabataState = () => {
  return removeFromStorage(STORAGE_KEYS.TABATA_STATE)
}

// Pomodoro timer state management
export const savePomodoroState = (state) => {
  const stateToSave = {
    currentSession: state.currentSession,
    timeLeft: state.timeLeft,
    isWorkPhase: state.isWorkPhase,
    isRunning: state.isRunning,
    isFinished: state.isFinished,
    currentMessage: state.currentMessage,
    currentSubtitle: state.currentSubtitle,
    musicMode: state.musicMode,
    volume: state.volume,
    timestamp: Date.now() // For detecting stale data
  }
  return saveToStorage(STORAGE_KEYS.POMODORO_STATE, stateToSave)
}

export const loadPomodoroState = () => {
  const state = loadFromStorage(STORAGE_KEYS.POMODORO_STATE)

  // Don't restore state if it's older than 1 hour (stale)
  if (state && state.timestamp) {
    const age = Date.now() - state.timestamp
    const ONE_HOUR = 60 * 60 * 1000

    if (age > ONE_HOUR) {
      clearPomodoroState()
      return null
    }
  }

  return state
}

export const clearPomodoroState = () => {
  return removeFromStorage(STORAGE_KEYS.POMODORO_STATE)
}

// Clear all app data
export const clearAllTimerData = () => {
  clearActiveTimer()
  clearHiitState()
  clearTabataState()
  clearPomodoroState()
  return true
}
