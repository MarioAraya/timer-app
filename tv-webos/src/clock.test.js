import { describe, it, expect } from 'vitest'
import { TRACKS } from './tracks.js'
import { getTvState, getRoundStartTime, getSeekTarget, formatClock } from './clock.js'
import { CALIBRATION_MARKS } from '../../src/config/hiitConfig.js'

const hiit = TRACKS.hiit
const tabata = TRACKS.tabata

describe('HIIT', () => {
  it('startTime + prep ≈ prep_end calibrado', () => {
    expect(Math.abs(hiit.startTime + hiit.config.preparation.duration - CALIBRATION_MARKS.prep_end)).toBeLessThan(0.001)
  })
  it('getRoundStartTime coincide con marcas', () => {
    for (let n = 2; n <= 12; n++) {
      expect(Math.abs(getRoundStartTime(hiit, n) - CALIBRATION_MARKS['r' + n + '_work'])).toBeLessThan(0.01)
    }
  })
  it('estados puntuales', () => {
    expect(getTvState(hiit, 0)).toMatchObject({ phase: 'prep', round: 1, secondsShown: 9 })
    expect(getTvState(hiit, 10.32)).toMatchObject({ phase: 'work', round: 1 })
    const r = getTvState(hiit, 51.29)
    expect(r).toMatchObject({ phase: 'rest', round: 1 })
    expect(r.next.phase).toBe('work')
    expect(getTvState(hiit, 730)).toMatchObject({ phase: 'rest', round: 12, next: null })
    expect(getTvState(hiit, 747.03)).toMatchObject({ phase: 'done', totalProgress: 1 })
  })
  it('secondsShown nunca 0 y progreso monótono', () => {
    let prev = -1
    for (let t = 0; t < 747; t += 0.25) {
      const s = getTvState(hiit, t)
      if (s.phase !== 'done') expect(s.secondsShown).toBeGreaterThan(0)
      expect(s.totalProgress).toBeGreaterThanOrEqual(prev)
      prev = s.totalProgress
    }
  })
})

describe('Tabata', () => {
  it('estados puntuales', () => {
    expect(getTvState(tabata, 5)).toMatchObject({ phase: 'prep', secondsShown: 6 })
    expect(getTvState(tabata, 11)).toMatchObject({ phase: 'work', round: 1 })
    expect(getTvState(tabata, 225)).toMatchObject({ phase: 'work', round: 8, next: null })
    expect(getTvState(tabata, 241).phase).toBe('done')
  })
})

describe('seek', () => {
  it('+1', () => {
    expect(getSeekTarget(hiit, 3, 1)).toBeCloseTo(getRoundStartTime(hiit, 1))
    expect(getSeekTarget(hiit, 700, 1)).toBe(null)
    expect(getSeekTarget(hiit, 750, 1)).toBe(null)
  })
  it('-1', () => {
    const r3 = getRoundStartTime(hiit, 3)
    expect(getSeekTarget(hiit, r3 + 5, -1)).toBeCloseTo(r3)
    expect(getSeekTarget(hiit, r3 + 2, -1)).toBeCloseTo(getRoundStartTime(hiit, 2))
    expect(getSeekTarget(hiit, getRoundStartTime(hiit, 1) + 2, -1)).toBe(hiit.startTime)
    expect(getSeekTarget(hiit, 3, -1)).toBe(hiit.startTime)
  })
})

describe('formatClock', () => {
  it('formatea', () => {
    expect(formatClock(745.657)).toBe('12:25')
    expect(formatClock(241)).toBe('4:01')
    expect(formatClock(59.9)).toBe('0:59')
    expect(formatClock(0)).toBe('0:00')
  })
})
