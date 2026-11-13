import { describe, it, expect } from 'vitest'
import { ACTIVITIES, ACTIVITY_ORDER } from './activities.js'

describe('activities', () => {
  it('Wim Hof dura 18:00', () => {
    expect(ACTIVITIES.wimhof.getDurationText()).toBe('18:00')
    expect(ACTIVITIES.wimhof.doneSub).toBe('WIM HOF · 4 rondas · 18:00')
  })
  it('HIIT y Tabata conservan duración y doneSub', () => {
    expect(ACTIVITIES.hiit.getDurationText()).toBe('12:25')
    expect(ACTIVITIES.tabata.getDurationText()).toBe('4:01')
    expect(ACTIVITIES.hiit.doneSub).toBe('HIIT · 12 rounds · 12:25')
  })
  it('cada id del orden existe', () => {
    ACTIVITY_ORDER.forEach(function (id) { expect(ACTIVITIES[id]).toBeTruthy() })
  })
})
