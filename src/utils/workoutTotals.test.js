import { describe, it, expect } from 'vitest'
import { computeTotalSeconds, formatTotal } from './workoutTotals'

describe('computeTotalSeconds', () => {
  it('suma intro + rounds × (work + rest) — HIIT por defecto', () => {
    // 11s intro + 12 × (40 + 20) = 731s
    expect(computeTotalSeconds({ prep: 11, rounds: 12, work: 40, rest: 20 })).toBe(731)
  })

  it('Tabata por defecto', () => {
    // 10s intro + 8 × (20 + 10) = 250s
    expect(computeTotalSeconds({ prep: 10, rounds: 8, work: 20, rest: 10 })).toBe(250)
  })

  it('reacciona al cambio de work', () => {
    const base = computeTotalSeconds({ prep: 11, rounds: 12, work: 40, rest: 20 })
    const longer = computeTotalSeconds({ prep: 11, rounds: 12, work: 60, rest: 20 })
    expect(longer - base).toBe(12 * 20)
  })

  it('reacciona al cambio de rest', () => {
    const base = computeTotalSeconds({ prep: 11, rounds: 12, work: 40, rest: 20 })
    const shorter = computeTotalSeconds({ prep: 11, rounds: 12, work: 40, rest: 10 })
    expect(base - shorter).toBe(12 * 10)
  })

  it('el intro suma una sola vez, no por round', () => {
    expect(computeTotalSeconds({ prep: 30, rounds: 12, work: 40, rest: 20 }))
      .toBe(computeTotalSeconds({ prep: 11, rounds: 12, work: 40, rest: 20 }) + 19)
  })

  it('trata valores ausentes o inválidos como cero', () => {
    expect(computeTotalSeconds({})).toBe(0)
    expect(computeTotalSeconds({ prep: NaN, rounds: 12, work: 40, rest: 20 })).toBe(720)
    expect(computeTotalSeconds({ prep: -5, rounds: 8, work: 20, rest: 10 })).toBe(240)
  })
})

describe('formatTotal', () => {
  it('formatea como M:SS', () => {
    expect(formatTotal(731)).toBe('12:11')
    expect(formatTotal(250)).toBe('4:10')
  })

  it('rellena los segundos a dos dígitos', () => {
    expect(formatTotal(65)).toBe('1:05')
  })

  it('redondea los decimales de las duraciones calibradas', () => {
    expect(formatTotal(729.6)).toBe('12:10')
  })

  it('devuelve 0:00 ante valores inválidos', () => {
    expect(formatTotal(0)).toBe('0:00')
    expect(formatTotal(NaN)).toBe('0:00')
    expect(formatTotal(-10)).toBe('0:00')
  })
})
