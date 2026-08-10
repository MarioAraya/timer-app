// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { isTauri, setKeepAwake, setOverlayMode, updateTray, onNativeEvent } from './tauri'

const leaveTauri = () => { delete globalThis.window.__TAURI_INTERNALS__ }

describe('tauri wrappers', () => {
  afterEach(leaveTauri)

  it('reports not running under Tauri in a plain browser', () => {
    expect(isTauri()).toBe(false)
  })

  it('detects the Tauri WebView by its internals global', () => {
    globalThis.window.__TAURI_INTERNALS__ = {}
    expect(isTauri()).toBe(true)
  })

  // The web PWA calls these on every timer start; they must stay inert there
  // rather than throwing on a missing @tauri-apps/api.
  it('resolves to null instead of throwing outside Tauri', async () => {
    await expect(setKeepAwake(true)).resolves.toBeNull()
    await expect(setOverlayMode(true)).resolves.toBeNull()
    await expect(updateTray('12:34', true)).resolves.toBeNull()
  })

  it('returns a callable unlisten so cleanup never blows up', async () => {
    const unlisten = await onNativeEvent('tray-action', () => {})
    expect(typeof unlisten).toBe('function')
    expect(() => unlisten()).not.toThrow()
  })
})
