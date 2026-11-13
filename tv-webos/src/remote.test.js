import { describe, it, expect } from 'vitest'
import { actionForKey } from './remote.js'

describe('actionForKey', () => {
  it('mapea control y teclado', () => {
    expect(actionForKey(13)).toBe('ok')
    expect(actionForKey(461)).toBe('back')
    expect(actionForKey(8)).toBe('back')
    expect(actionForKey(415)).toBe('playPause')
    expect(actionForKey(413)).toBe('stop')
    expect(actionForKey(406)).toBe('debug')
    expect(actionForKey(37)).toBe('left')
  })
  it('desconocido → null', () => {
    expect(actionForKey(9999)).toBe(null)
    expect(actionForKey(0)).toBe(null)
  })
})
