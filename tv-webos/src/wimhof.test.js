import { describe, it, expect } from 'vitest'
import { resolveTotal, getWimHofState, getWimHofSeek } from './wimhof.js'

const total = 1080.05

describe('resolveTotal', () => {
  it('cae al respaldo con valores no válidos', () => {
    expect(resolveTotal(NaN)).toBe(1080.05)
    expect(resolveTotal(Infinity)).toBe(1080.05)
    expect(resolveTotal(0)).toBe(1080.05)
  })
  it('usa audio.duration si es válido', () => {
    expect(resolveTotal(1080.018)).toBe(1080.018)
  })
})

describe('getWimHofState', () => {
  it('inicio', () => {
    expect(getWimHofState(0, total)).toMatchObject({
      elapsedText: '0:00', totalText: '18:00', leftText: '18:00', progress: 0, done: false,
    })
  })
  it('a mitad', () => {
    const s = getWimHofState(452.7, total)
    expect(s.elapsedText).toBe('7:32')
    expect(s.leftText).toBe('10:28')
    expect(Math.abs(s.progress - 0.41915)).toBeLessThan(0.0001)
  })
  it('tiempo negativo', () => {
    expect(getWimHofState(-3, total)).toMatchObject({ elapsedSec: 0, progress: 0 })
  })
  it('final y pasado el final', () => {
    expect(getWimHofState(1080.05, total)).toMatchObject({ done: true, progress: 1, leftText: '0:00' })
    expect(getWimHofState(2000, total)).toMatchObject({ elapsedSec: 1080, progress: 1, done: true })
  })
  it('barrido: elapsed + left = total y progreso monótono', () => {
    let prev = -1
    for (let t = 0; t <= 1080; t += 0.5) {
      const s = getWimHofState(t, total)
      expect(s.elapsedSec + s.leftSec).toBe(s.totalSec)
      expect(s.progress).toBeGreaterThanOrEqual(prev)
      prev = s.progress
    }
  })
})

describe('getWimHofSeek', () => {
  it('+30 s', () => { expect(getWimHofSeek(100, total, 1)).toBe(130) })
  it('-30 s con tope en 0', () => { expect(getWimHofSeek(10, total, -1)).toBe(0) })
  it('cerca del final', () => {
    expect(Math.abs(getWimHofSeek(1070, total, 1) - 1079.05)).toBeLessThan(0.001)
    expect(getWimHofSeek(1079.5, total, 1)).toBe(null)
  })
})
