import { describe, it, expect } from 'vitest'
import {
  formatTime,
  formatTimeSeconds,
  calculateProgress,
  getTotalWorkoutSeconds,
  calculateElapsedTime,
  calculateTotalProgress,
  calculateRoundProgress,
} from './timerHelpers'

// Config mínima para tests: 2 rondas, prep=5s, work=10s, rest=5s
const makeConfig = ({ rounds = 2, prep = 5, work = 10, rest = 5 } = {}) => ({
  preparation: { duration: prep },
  rounds: Array.from({ length: rounds }, () => ({ work, rest })),
})

// ─────────────────────────────────────────────────────
// formatTime
// ─────────────────────────────────────────────────────

describe('formatTime', () => {
  it('formatea 0 → 0:00', () => {
    expect(formatTime(0)).toBe('0:00')
  })

  it('formatea 65 → 1:05', () => {
    expect(formatTime(65)).toBe('1:05')
  })

  it('formatea 3600 → 60:00', () => {
    expect(formatTime(3600)).toBe('60:00')
  })

  it('trunca fracciones (no redondea)', () => {
    expect(formatTime(59.9)).toBe('0:59')
  })
})

// ─────────────────────────────────────────────────────
// formatTimeSeconds
// ─────────────────────────────────────────────────────

describe('formatTimeSeconds', () => {
  it('formatea 5 → "05"', () => {
    expect(formatTimeSeconds(5)).toBe('05')
  })

  it('formatea 10 → "10"', () => {
    expect(formatTimeSeconds(10)).toBe('10')
  })

  it('trunca fracciones', () => {
    expect(formatTimeSeconds(9.9)).toBe('09')
  })
})

// ─────────────────────────────────────────────────────
// calculateProgress
// ─────────────────────────────────────────────────────

describe('calculateProgress', () => {
  it('mitad → 50', () => {
    expect(calculateProgress(5, 10)).toBe(50)
  })

  it('completo → 100', () => {
    expect(calculateProgress(10, 10)).toBe(100)
  })

  it('inicio → 0', () => {
    expect(calculateProgress(0, 10)).toBe(0)
  })
})

// ─────────────────────────────────────────────────────
// getTotalWorkoutSeconds
// ─────────────────────────────────────────────────────

describe('getTotalWorkoutSeconds', () => {
  it('prep + rounds', () => {
    const cfg = makeConfig({ rounds: 2, prep: 5, work: 10, rest: 5 })
    // 5 + 2*(10+5) = 5+30 = 35
    expect(getTotalWorkoutSeconds(cfg)).toBe(35)
  })

  it('1 ronda', () => {
    const cfg = makeConfig({ rounds: 1, prep: 3, work: 20, rest: 10 })
    expect(getTotalWorkoutSeconds(cfg)).toBe(33)
  })
})

// ─────────────────────────────────────────────────────
// calculateElapsedTime
// ─────────────────────────────────────────────────────

describe('calculateElapsedTime', () => {
  const cfg = makeConfig({ rounds: 2, prep: 5, work: 10, rest: 5 })
  const base = { config: cfg, preparationTime: 5 }

  it('inicio de prep → elapsed 0', () => {
    const elapsed = calculateElapsedTime({ ...base, currentRound: 1, timeLeft: 5, isWorkPhase: true, isPreparationPhase: true })
    expect(elapsed).toBe(0)
  })

  it('mitad de prep (timeLeft=2.5) → elapsed 2.5', () => {
    const elapsed = calculateElapsedTime({ ...base, currentRound: 1, timeLeft: 2.5, isWorkPhase: true, isPreparationPhase: true })
    expect(elapsed).toBe(2.5)
  })

  it('inicio de round 1 work → elapsed = preparationTime', () => {
    const elapsed = calculateElapsedTime({ ...base, currentRound: 1, timeLeft: 10, isWorkPhase: true, isPreparationPhase: false })
    expect(elapsed).toBe(5)
  })

  it('mitad de round 1 work (timeLeft=5) → elapsed 10', () => {
    const elapsed = calculateElapsedTime({ ...base, currentRound: 1, timeLeft: 5, isWorkPhase: true, isPreparationPhase: false })
    expect(elapsed).toBe(10)
  })

  it('inicio de round 1 rest → elapsed = prep + work (timeLeft=restDuration, rest consumed=0)', () => {
    const elapsed = calculateElapsedTime({ ...base, currentRound: 1, timeLeft: 5, isWorkPhase: false, isPreparationPhase: false })
    expect(elapsed).toBe(15)
  })

  it('inicio de round 2 work → elapsed = prep + round1.work + round1.rest', () => {
    const elapsed = calculateElapsedTime({ ...base, currentRound: 2, timeLeft: 10, isWorkPhase: true, isPreparationPhase: false })
    expect(elapsed).toBe(20)
  })

  it('nunca retorna valor negativo', () => {
    const elapsed = calculateElapsedTime({ ...base, currentRound: 1, timeLeft: 999, isWorkPhase: true, isPreparationPhase: true })
    expect(elapsed).toBeGreaterThanOrEqual(0)
  })
})

// ─────────────────────────────────────────────────────
// calculateTotalProgress
// ─────────────────────────────────────────────────────

describe('calculateTotalProgress', () => {
  const cfg = makeConfig({ rounds: 2, prep: 5, work: 10, rest: 5 })
  const base = { config: cfg, preparationTime: 5 }

  it('isFinished → 100', () => {
    const p = calculateTotalProgress({ ...base, currentRound: 1, timeLeft: 5, isWorkPhase: true, isPreparationPhase: true, isFinished: true })
    expect(p).toBe(100)
  })

  it('inicio de workout → cerca de 0', () => {
    const p = calculateTotalProgress({ ...base, currentRound: 1, timeLeft: 5, isWorkPhase: true, isPreparationPhase: true, isFinished: false })
    expect(p).toBeCloseTo(0)
  })

  it('siempre en rango [0, 100]', () => {
    const p = calculateTotalProgress({ ...base, currentRound: 1, timeLeft: 0, isWorkPhase: false, isPreparationPhase: false, isFinished: false })
    expect(p).toBeGreaterThanOrEqual(0)
    expect(p).toBeLessThanOrEqual(100)
  })
})

// ─────────────────────────────────────────────────────
// calculateRoundProgress
// ─────────────────────────────────────────────────────

describe('calculateRoundProgress', () => {
  const cfg = makeConfig({ rounds: 2, prep: 5, work: 10, rest: 5 })
  const base = { config: cfg, preparationTime: 5 }

  it('isFinished → 100', () => {
    const p = calculateRoundProgress({ ...base, currentRound: 1, timeLeft: 5, isWorkPhase: true, isPreparationPhase: false, isFinished: true })
    expect(p).toBe(100)
  })

  it('inicio de prep → 0', () => {
    const p = calculateRoundProgress({ ...base, currentRound: 1, timeLeft: 5, isWorkPhase: true, isPreparationPhase: true, isFinished: false })
    expect(p).toBe(0)
  })

  it('mitad de prep → 50', () => {
    const p = calculateRoundProgress({ ...base, currentRound: 1, timeLeft: 2.5, isWorkPhase: true, isPreparationPhase: true, isFinished: false })
    expect(p).toBeCloseTo(50)
  })

  it('mitad de work → 50', () => {
    const p = calculateRoundProgress({ ...base, currentRound: 1, timeLeft: 5, isWorkPhase: true, isPreparationPhase: false, isFinished: false })
    expect(p).toBeCloseTo(50)
  })

  it('inicio de rest → 0 (ring se resetea)', () => {
    const p = calculateRoundProgress({ ...base, currentRound: 1, timeLeft: 5, isWorkPhase: false, isPreparationPhase: false, isFinished: false })
    expect(p).toBe(0)
  })

  it('mitad de rest → 50', () => {
    const p = calculateRoundProgress({ ...base, currentRound: 1, timeLeft: 2.5, isWorkPhase: false, isPreparationPhase: false, isFinished: false })
    expect(p).toBeCloseTo(50)
  })

  it('round inexistente → 0', () => {
    const p = calculateRoundProgress({ ...base, currentRound: 99, timeLeft: 5, isWorkPhase: true, isPreparationPhase: false, isFinished: false })
    expect(p).toBe(0)
  })
})
