import { describe, it, expect, beforeEach } from 'vitest'
import {
  saveToStorage,
  loadFromStorage,
  removeFromStorage,
  saveFavoriteTimer,
  loadFavoriteTimer,
  saveActiveTimer,
  loadActiveTimer,
  clearActiveTimer,
  saveHiitState,
  loadHiitState,
  clearHiitState,
  saveTabataState,
  loadTabataState,
  clearTabataState,
  savePomodoroState,
  loadPomodoroState,
  clearPomodoroState,
  clearAllTimerData,
} from './localStorage'

// localStorage mock for node environment
const makeStorage = () => {
  const store = new Map()
  return {
    getItem: (k) => store.get(k) ?? null,
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  }
}

global.localStorage = makeStorage()

beforeEach(() => global.localStorage.clear())

// ─────────────────────────────────────────────────────
// Generic helpers
// ─────────────────────────────────────────────────────

describe('saveToStorage / loadFromStorage', () => {
  it('roundtrips a plain object', () => {
    saveToStorage('k', { a: 1, b: 'x' })
    expect(loadFromStorage('k')).toEqual({ a: 1, b: 'x' })
  })

  it('roundtrips a number', () => {
    saveToStorage('num', 42)
    expect(loadFromStorage('num')).toBe(42)
  })

  it('returns null for a key that was never written', () => {
    expect(loadFromStorage('missing')).toBeNull()
  })

  it('overwrites an existing value', () => {
    saveToStorage('k', 'old')
    saveToStorage('k', 'new')
    expect(loadFromStorage('k')).toBe('new')
  })
})

describe('removeFromStorage', () => {
  it('deletes an existing key', () => {
    saveToStorage('k', 1)
    removeFromStorage('k')
    expect(loadFromStorage('k')).toBeNull()
  })

  it('is a no-op for a missing key (does not throw)', () => {
    expect(() => removeFromStorage('never_existed')).not.toThrow()
  })
})

// ─────────────────────────────────────────────────────
// Favorite timer
// ─────────────────────────────────────────────────────

describe('favoriteTimer', () => {
  it('saves and loads', () => {
    saveFavoriteTimer({ type: 'hiit' })
    expect(loadFavoriteTimer()).toEqual({ type: 'hiit' })
  })
})

// ─────────────────────────────────────────────────────
// Active timer
// ─────────────────────────────────────────────────────

describe('activeTimer', () => {
  it('saves and loads', () => {
    saveActiveTimer({ name: 'Tabata' })
    expect(loadActiveTimer()).toEqual({ name: 'Tabata' })
  })

  it('clear removes it', () => {
    saveActiveTimer({ name: 'HIIT' })
    clearActiveTimer()
    expect(loadActiveTimer()).toBeNull()
  })
})

// ─────────────────────────────────────────────────────
// HIIT state
// ─────────────────────────────────────────────────────

const hiitSample = {
  currentRound: 3,
  timeLeft: 25.5,
  isWorkPhase: true,
  isPreparationPhase: false,
  isRunning: false,
  isFinished: false,
  currentSubtitle: 'Go!',
  musicMode: true,
  audioPosition: 120.5,
  volume: 0.7,
}

describe('HIIT state persistence', () => {
  it('saves and loads all fields', () => {
    saveHiitState(hiitSample)
    const loaded = loadHiitState()
    expect(loaded.currentRound).toBe(3)
    expect(loaded.timeLeft).toBe(25.5)
    expect(loaded.isWorkPhase).toBe(true)
    expect(loaded.musicMode).toBe(true)
    expect(loaded.audioPosition).toBe(120.5)
    expect(loaded.volume).toBe(0.7)
  })

  it('adds a timestamp on save', () => {
    saveHiitState(hiitSample)
    const loaded = loadHiitState()
    expect(typeof loaded.timestamp).toBe('number')
    expect(loaded.timestamp).toBeCloseTo(Date.now(), -3) // within 1s
  })

  it('returns null for state older than 1 hour', () => {
    saveHiitState(hiitSample)
    const raw = JSON.parse(global.localStorage.getItem('timerApp_hiitState'))
    raw.timestamp = Date.now() - 61 * 60 * 1000
    global.localStorage.setItem('timerApp_hiitState', JSON.stringify(raw))
    expect(loadHiitState()).toBeNull()
  })

  it('fresh state (1s old) is accepted', () => {
    saveHiitState(hiitSample)
    const raw = JSON.parse(global.localStorage.getItem('timerApp_hiitState'))
    raw.timestamp = Date.now() - 1000
    global.localStorage.setItem('timerApp_hiitState', JSON.stringify(raw))
    expect(loadHiitState()).not.toBeNull()
  })

  it('clearHiitState removes it', () => {
    saveHiitState(hiitSample)
    clearHiitState()
    expect(loadHiitState()).toBeNull()
  })

  it('expiry also clears the key from storage', () => {
    saveHiitState(hiitSample)
    const raw = JSON.parse(global.localStorage.getItem('timerApp_hiitState'))
    raw.timestamp = Date.now() - 61 * 60 * 1000
    global.localStorage.setItem('timerApp_hiitState', JSON.stringify(raw))
    loadHiitState() // triggers clearHiitState internally
    expect(global.localStorage.getItem('timerApp_hiitState')).toBeNull()
  })
})

// ─────────────────────────────────────────────────────
// Tabata state
// ─────────────────────────────────────────────────────

const tabataSample = {
  currentRound: 5,
  timeLeft: 8,
  isWorkPhase: false,
  isPreparationPhase: false,
  isRunning: true,
  isFinished: false,
  currentSubtitle: 'Rest',
  musicMode: false,
  audioPosition: 0,
  volume: 0.5,
}

describe('Tabata state persistence', () => {
  it('saves and loads all fields', () => {
    saveTabataState(tabataSample)
    const loaded = loadTabataState()
    expect(loaded.currentRound).toBe(5)
    expect(loaded.isWorkPhase).toBe(false)
    expect(loaded.volume).toBe(0.5)
  })

  it('returns null for stale state', () => {
    saveTabataState(tabataSample)
    const raw = JSON.parse(global.localStorage.getItem('timerApp_tabataState'))
    raw.timestamp = Date.now() - 61 * 60 * 1000
    global.localStorage.setItem('timerApp_tabataState', JSON.stringify(raw))
    expect(loadTabataState()).toBeNull()
  })

  it('clearTabataState removes it', () => {
    saveTabataState(tabataSample)
    clearTabataState()
    expect(loadTabataState()).toBeNull()
  })
})

// ─────────────────────────────────────────────────────
// Pomodoro state
// ─────────────────────────────────────────────────────

const pomodoroSample = {
  currentSession: 2,
  timeLeft: 300,
  isWorkPhase: true,
  isRunning: false,
  isFinished: false,
  currentMessage: 'Focus',
  currentSubtitle: '',
  musicMode: true,
  volume: 0.6,
}

describe('Pomodoro state persistence', () => {
  it('saves and loads all fields', () => {
    savePomodoroState(pomodoroSample)
    const loaded = loadPomodoroState()
    expect(loaded.currentSession).toBe(2)
    expect(loaded.timeLeft).toBe(300)
    expect(loaded.musicMode).toBe(true)
  })

  it('returns null for stale state', () => {
    savePomodoroState(pomodoroSample)
    const raw = JSON.parse(global.localStorage.getItem('timerApp_pomodoroState'))
    raw.timestamp = Date.now() - 61 * 60 * 1000
    global.localStorage.setItem('timerApp_pomodoroState', JSON.stringify(raw))
    expect(loadPomodoroState()).toBeNull()
  })

  it('clearPomodoroState removes it', () => {
    savePomodoroState(pomodoroSample)
    clearPomodoroState()
    expect(loadPomodoroState()).toBeNull()
  })
})

// ─────────────────────────────────────────────────────
// clearAllTimerData
// ─────────────────────────────────────────────────────

describe('clearAllTimerData', () => {
  it('removes all timer states at once', () => {
    saveHiitState(hiitSample)
    saveTabataState(tabataSample)
    savePomodoroState(pomodoroSample)
    saveActiveTimer({ name: 'HIIT' })

    clearAllTimerData()

    expect(loadHiitState()).toBeNull()
    expect(loadTabataState()).toBeNull()
    expect(loadPomodoroState()).toBeNull()
    expect(loadActiveTimer()).toBeNull()
  })

  it('does not throw when storage is already empty', () => {
    expect(() => clearAllTimerData()).not.toThrow()
  })
})

// ─────────────────────────────────────────────────────
// Storage key names (regression guard)
// ─────────────────────────────────────────────────────

describe('storage key names', () => {
  it('HIIT uses the expected key', () => {
    saveHiitState(hiitSample)
    expect(global.localStorage.getItem('timerApp_hiitState')).not.toBeNull()
  })

  it('Tabata uses the expected key', () => {
    saveTabataState(tabataSample)
    expect(global.localStorage.getItem('timerApp_tabataState')).not.toBeNull()
  })

  it('Pomodoro uses the expected key', () => {
    savePomodoroState(pomodoroSample)
    expect(global.localStorage.getItem('timerApp_pomodoroState')).not.toBeNull()
  })

  it('activeTimer uses the expected key', () => {
    saveActiveTimer({ name: 'test' })
    expect(global.localStorage.getItem('timerApp_activeTimer')).not.toBeNull()
  })

  it('favoriteTimer uses the expected key', () => {
    saveFavoriteTimer({ type: 'hiit' })
    expect(global.localStorage.getItem('timerApp_favoriteTimer')).not.toBeNull()
  })
})
