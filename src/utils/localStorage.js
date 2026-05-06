const STORAGE_KEYS = {
  FAVORITE_TIMER: 'timerApp_favoriteTimer',
  HIIT_STATE:     'timerApp_hiitState',
  TABATA_STATE:   'timerApp_tabataState',
  POMODORO_STATE: 'timerApp_pomodoroState',
  ACTIVE_TIMER:   'timerApp_activeTimer',
  SESSIONS:       'timerApp_sessions',
}

const ONE_HOUR = 60 * 60 * 1000

// ─── Generic helpers ──────────────────────────────────────────────────────────

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

// ─── Favorite / active timer ──────────────────────────────────────────────────

export const saveFavoriteTimer = (data) => saveToStorage(STORAGE_KEYS.FAVORITE_TIMER, data)
export const loadFavoriteTimer = ()     => loadFromStorage(STORAGE_KEYS.FAVORITE_TIMER)

export const saveActiveTimer  = (data) => saveToStorage(STORAGE_KEYS.ACTIVE_TIMER, data)
export const loadActiveTimer  = ()     => loadFromStorage(STORAGE_KEYS.ACTIVE_TIMER)
export const clearActiveTimer = ()     => removeFromStorage(STORAGE_KEYS.ACTIVE_TIMER)

// ─── Timer state persistence factory ─────────────────────────────────────────

const WORKOUT_FIELDS  = ['currentRound', 'timeLeft', 'isWorkPhase', 'isPreparationPhase', 'isRunning', 'isFinished', 'currentSubtitle', 'musicMode', 'audioPosition', 'volume']
const POMODORO_FIELDS = ['currentSession', 'timeLeft', 'isWorkPhase', 'isRunning', 'isFinished', 'currentMessage', 'currentSubtitle', 'musicMode', 'volume']

function createTimerPersistence(key, fields) {
  const clear = () => removeFromStorage(key)

  const save = (state) => {
    const data = {}
    for (const f of fields) data[f] = state[f]
    data.timestamp = Date.now()
    return saveToStorage(key, data)
  }

  const load = () => {
    const state = loadFromStorage(key)
    if (state?.timestamp && Date.now() - state.timestamp > ONE_HOUR) {
      clear()
      return null
    }
    return state
  }

  return { save, load, clear }
}

const hiit     = createTimerPersistence(STORAGE_KEYS.HIIT_STATE,     WORKOUT_FIELDS)
const tabata   = createTimerPersistence(STORAGE_KEYS.TABATA_STATE,   WORKOUT_FIELDS)
const pomodoro = createTimerPersistence(STORAGE_KEYS.POMODORO_STATE, POMODORO_FIELDS)

export const saveHiitState    = hiit.save
export const loadHiitState    = hiit.load
export const clearHiitState   = hiit.clear

export const saveTabataState  = tabata.save
export const loadTabataState  = tabata.load
export const clearTabataState = tabata.clear

export const savePomodoroState  = pomodoro.save
export const loadPomodoroState  = pomodoro.load
export const clearPomodoroState = pomodoro.clear

// ─── Session counts ───────────────────────────────────────────────────────────

export function incrementSessionCount(timerKey) {
  const counts = loadFromStorage(STORAGE_KEYS.SESSIONS) || {}
  counts[timerKey] = (counts[timerKey] || 0) + 1
  saveToStorage(STORAGE_KEYS.SESSIONS, counts)
}

export function loadSessionCounts() {
  return loadFromStorage(STORAGE_KEYS.SESSIONS) || {}
}

// ─── Clear all ────────────────────────────────────────────────────────────────

export const clearAllTimerData = () => {
  clearActiveTimer()
  clearHiitState()
  clearTabataState()
  clearPomodoroState()
  return true
}
