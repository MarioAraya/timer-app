/**
 * Integration tests — flujos que cruzan varios módulos.
 *
 * Cubren lo que los unit tests no pueden: que localStorage + ticksEngine
 * funcionen juntos, que los configs hardcodeados sean consistentes con los
 * ticks del MP3, y que el invariante de audio (posición ≈ elapsed) se
 * mantenga durante un workout completo.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  buildConfigFromTicks,
  getStateFromElapsed,
  getExpectedAudioPosition,
  getTotalDuration,
} from './ticksEngine'
import { HIIT_TICKS } from '../config/hiitTicks'
import { TABATA_TICKS } from '../config/tabataTicks'
import { HIIT_CONFIG, CALIBRATION_MARKS } from '../config/hiitConfig'
import { TABATA_CONFIG } from '../config/tabataConfig'
import {
  saveHiitState,
  loadHiitState,
  saveTabataState,
  loadTabataState,
  clearAllTimerData,
} from './localStorage'

// localStorage mock (node environment)
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

const hiitConfig = buildConfigFromTicks(HIIT_TICKS)
const tabataConfig = buildConfigFromTicks(TABATA_TICKS)

// ─────────────────────────────────────────────────────
// Ciclo pausa → guardar → restaurar (localStorage + ticksEngine)
// ─────────────────────────────────────────────────────

describe('HIIT: ciclo pausa/resume con localStorage', () => {
  const pauseAt = (config, elapsed) => {
    const state = getStateFromElapsed(config, elapsed)
    const audioPos = getExpectedAudioPosition({ config, ...state, audioStartOffset: 0 })
    return { ...state, audioPosition: audioPos, musicMode: true, volume: 0.7,
              isRunning: false, isFinished: false, currentSubtitle: state.subtitle ?? '' }
  }

  it('restaura round y fase correctos al pausar en medio del workout', () => {
    const elapsed = 150  // en round 2
    const stateSaved = pauseAt(hiitConfig, elapsed)
    saveHiitState(stateSaved)

    const loaded = loadHiitState()
    expect(loaded.currentRound).toBe(stateSaved.currentRound)
    expect(loaded.isWorkPhase).toBe(stateSaved.isWorkPhase)
    expect(loaded.timeLeft).toBeCloseTo(stateSaved.timeLeft, 2)
  })

  it('la audioPosition guardada es consistente con elapsed original', () => {
    const elapsed = 300  // round 4
    const stateSaved = pauseAt(hiitConfig, elapsed)
    saveHiitState(stateSaved)

    const loaded = loadHiitState()
    // La audioPosition guardada debe aproximarse al elapsed original
    expect(loaded.audioPosition).toBeCloseTo(elapsed, 0)
  })

  it('pausar en prep → restaurar sigue en prep', () => {
    const stateSaved = pauseAt(hiitConfig, 5)
    saveHiitState(stateSaved)

    const loaded = loadHiitState()
    expect(loaded.isPreparationPhase).toBe(true)
  })

  it('pausar en round 12 final → restaura el último round', () => {
    const total = getTotalDuration(hiitConfig)
    const stateSaved = pauseAt(hiitConfig, total - 5)
    saveHiitState(stateSaved)

    const loaded = loadHiitState()
    expect(loaded.currentRound).toBe(12)
    expect(loaded.isFinished).toBe(false)
  })
})

describe('HIIT y Tabata: estados no se pisan entre sí', () => {
  it('guardar estado HIIT no afecta estado Tabata', () => {
    saveHiitState({ currentRound: 6, timeLeft: 10, isWorkPhase: true,
                    isPreparationPhase: false, isRunning: false, isFinished: false,
                    currentSubtitle: '', musicMode: true, audioPosition: 300, volume: 0.7 })

    expect(loadTabataState()).toBeNull()
  })

  it('clearAllTimerData limpia ambos estados simultáneamente', () => {
    saveHiitState({ currentRound: 3, timeLeft: 20, isWorkPhase: true,
                    isPreparationPhase: false, isRunning: false, isFinished: false,
                    currentSubtitle: '', musicMode: true, audioPosition: 150, volume: 0.7 })
    saveTabataState({ currentRound: 2, timeLeft: 8, isWorkPhase: false,
                      isPreparationPhase: false, isRunning: false, isFinished: false,
                      currentSubtitle: '', musicMode: false, audioPosition: 50, volume: 0.5 })

    clearAllTimerData()
    expect(loadHiitState()).toBeNull()
    expect(loadTabataState()).toBeNull()
  })
})

// ─────────────────────────────────────────────────────
// Invariante de audio: getExpectedAudioPosition(t) ≈ t
// ─────────────────────────────────────────────────────

describe('HIIT: invariante de sincronía de audio', () => {
  it('posición de audio ≈ elapsed en todo el workout (tolerancia 0.5s)', () => {
    const total = getTotalDuration(hiitConfig)
    const failures = []

    for (let t = 0; t <= total; t += 2) {
      const state = getStateFromElapsed(hiitConfig, t)
      const audioPos = getExpectedAudioPosition({ config: hiitConfig, ...state, audioStartOffset: 0 })
      const drift = Math.abs(audioPos - t)
      if (drift > 0.5) {
        failures.push({ t, audioPos, drift })
      }
    }

    expect(failures).toEqual([])
  })
})

describe('Tabata: invariante de sincronía de audio', () => {
  it('posición de audio ≈ elapsed en todo el workout (tolerancia 0.1s)', () => {
    const total = getTotalDuration(tabataConfig)
    const failures = []

    for (let t = 0; t <= total; t += 1) {
      const state = getStateFromElapsed(tabataConfig, t)
      const audioPos = getExpectedAudioPosition({ config: tabataConfig, ...state, audioStartOffset: 0 })
      const drift = Math.abs(audioPos - t)
      if (drift > 0.1) {
        failures.push({ t, audioPos, drift })
      }
    }

    expect(failures).toEqual([])
  })
})

// ─────────────────────────────────────────────────────
// Consistencia HIIT_CONFIG hardcodeado vs CALIBRATION_MARKS
// Detecta si alguien edita el config manualmente y rompe la calibración
// ─────────────────────────────────────────────────────

describe('HIIT_CONFIG vs CALIBRATION_MARKS', () => {
  const TOLERANCE = 0.05  // 50ms — suficiente para variación de punto flotante

  it('round 1 work coincide con las marcas de calibración', () => {
    const expected = CALIBRATION_MARKS.r1_rest - CALIBRATION_MARKS.prep_end
    expect(HIIT_CONFIG.rounds[0].work).toBeCloseTo(expected, 1)
  })

  it('round 1 rest coincide con las marcas de calibración', () => {
    const expected = CALIBRATION_MARKS.r2_work - CALIBRATION_MARKS.r1_rest
    expect(HIIT_CONFIG.rounds[0].rest).toBeCloseTo(expected, 1)
  })

  it('round 2 work coincide', () => {
    const expected = CALIBRATION_MARKS.r2_rest - CALIBRATION_MARKS.r2_work
    expect(HIIT_CONFIG.rounds[1].work).toBeCloseTo(expected, 1)
  })

  it('round 3 work coincide', () => {
    const expected = CALIBRATION_MARKS.r3_rest - CALIBRATION_MARKS.r3_work
    expect(HIIT_CONFIG.rounds[2].work).toBeCloseTo(expected, 1)
  })

  it('round 5 work coincide', () => {
    const expected = CALIBRATION_MARKS.r5_rest - CALIBRATION_MARKS.r5_work
    expect(HIIT_CONFIG.rounds[4].work).toBeCloseTo(expected, 1)
  })

  it('round 6 work coincide', () => {
    const expected = CALIBRATION_MARKS.r6_rest - CALIBRATION_MARKS.r6_work
    expect(HIIT_CONFIG.rounds[5].work).toBeCloseTo(expected, 1)
  })
})

// ─────────────────────────────────────────────────────
// TABATA_CONFIG hardcodeado vs TABATA_TICKS
// Los valores enteros de Tabata deben coincidir exactamente
// ─────────────────────────────────────────────────────

describe('TABATA_CONFIG vs buildConfigFromTicks(TABATA_TICKS)', () => {
  it('número de rounds coincide', () => {
    expect(TABATA_CONFIG.rounds.length).toBe(tabataConfig.rounds.length)
  })

  it('duración de preparación coincide', () => {
    expect(TABATA_CONFIG.preparation.duration).toBe(tabataConfig.preparation.duration)
  })

  it('todos los rounds tienen work=20 en ambos configs', () => {
    for (let i = 0; i < TABATA_CONFIG.rounds.length; i++) {
      expect(TABATA_CONFIG.rounds[i].work).toBe(tabataConfig.rounds[i].work)
    }
  })

  it('rounds 1-7 tienen rest=10 en ambos configs', () => {
    for (let i = 0; i < 7; i++) {
      expect(TABATA_CONFIG.rounds[i].rest).toBe(tabataConfig.rounds[i].rest)
    }
  })

  it('round 8 tiene rest=0 en ambos configs', () => {
    expect(TABATA_CONFIG.rounds[7].rest).toBe(0)
    expect(tabataConfig.rounds[7].rest).toBe(0)
  })

  it('duración total coincide', () => {
    const totalFromTicks = getTotalDuration(tabataConfig)
    const totalFromConfig = TABATA_CONFIG.preparation.duration +
      TABATA_CONFIG.rounds.reduce((s, r) => s + r.work + r.rest, 0)
    expect(totalFromConfig).toBe(totalFromTicks)
  })
})

// ─────────────────────────────────────────────────────
// Contrato de forma del config (WorkoutTimer espera estos campos)
// ─────────────────────────────────────────────────────

describe('forma de los configs (contrato WorkoutTimer)', () => {
  const configs = [
    ['HIIT_CONFIG', HIIT_CONFIG],
    ['TABATA_CONFIG', TABATA_CONFIG],
    ['hiitConfig (from ticks)', hiitConfig],
    ['tabataConfig (from ticks)', tabataConfig],
  ]

  for (const [name, config] of configs) {
    it(`${name} tiene preparation.duration numérico`, () => {
      expect(typeof config.preparation.duration).toBe('number')
      expect(config.preparation.duration).toBeGreaterThan(0)
    })

    it(`${name} tiene al menos 1 round`, () => {
      expect(Array.isArray(config.rounds)).toBe(true)
      expect(config.rounds.length).toBeGreaterThan(0)
    })

    it(`${name}: cada round tiene work y rest numéricos`, () => {
      for (const round of config.rounds) {
        expect(typeof round.work).toBe('number')
        expect(typeof round.rest).toBe('number')
        expect(round.work).toBeGreaterThan(0)
        expect(round.rest).toBeGreaterThanOrEqual(0)
      }
    })
  }
})
