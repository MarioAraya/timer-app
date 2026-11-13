import { describe, it, expect } from 'vitest'
import { moveFocus } from './homeNav.js'

describe('moveFocus (cols = 2)', () => {
  it('4 actividades', () => {
    expect(moveFocus(0, 'right', 4, 2)).toBe(1)
    expect(moveFocus(1, 'right', 4, 2)).toBe(1)
    expect(moveFocus(1, 'left', 4, 2)).toBe(0)
    expect(moveFocus(2, 'left', 4, 2)).toBe(2)
    expect(moveFocus(0, 'down', 4, 2)).toBe(2)
    expect(moveFocus(1, 'down', 4, 2)).toBe(3)
    expect(moveFocus(2, 'up', 4, 2)).toBe(0)
    expect(moveFocus(3, 'down', 4, 2)).toBe(3)
    expect(moveFocus(0, 'up', 4, 2)).toBe(0)
  })
  it('3 actividades', () => {
    expect(moveFocus(1, 'down', 3, 2)).toBe(1)
    expect(moveFocus(2, 'right', 3, 2)).toBe(2)
    expect(moveFocus(0, 'down', 3, 2)).toBe(2)
    expect(moveFocus(2, 'up', 3, 2)).toBe(0)
  })
})
