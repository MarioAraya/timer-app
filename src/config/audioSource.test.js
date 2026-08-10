// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { audioUrl, ALL_AUDIO_FILES, AUDIO_FILES, SUPABASE_AUDIO } from './audioSource'

// isTauri() sniffs this global, so the two environments are simulated by
// adding and removing it.
const enterTauri = () => { globalThis.window.__TAURI_INTERNALS__ = {} }
const leaveTauri = () => { delete globalThis.window.__TAURI_INTERNALS__ }

describe('audioSource', () => {
  afterEach(leaveTauri)

  it('resolves to Supabase in the browser', () => {
    expect(audioUrl('pulsebox-lofi-night-522890.mp3'))
      .toBe(`${SUPABASE_AUDIO}/pulsebox-lofi-night-522890.mp3`)
  })

  it('resolves to the bundled copy under Tauri', () => {
    enterTauri()
    expect(audioUrl('pulsebox-lofi-night-522890.mp3'))
      .toBe('/audio/pulsebox-lofi-night-522890.mp3')
  })

  it('switches every track at once, with no host left behind', () => {
    enterTauri()
    const urls = ALL_AUDIO_FILES.map(audioUrl)
    expect(urls.every(u => u.startsWith('/audio/'))).toBe(true)
    expect(urls.some(u => u.includes('supabase'))).toBe(false)
  })

  it('covers the 13 tracks the fetch script downloads', () => {
    expect(ALL_AUDIO_FILES).toHaveLength(13)
    expect(AUDIO_FILES.workout).toHaveLength(2)
    expect(AUDIO_FILES.lofi).toHaveLength(9)
    expect(AUDIO_FILES.breathing).toHaveLength(2)
  })

  it('lists only bare filenames, never full URLs', () => {
    // A URL slipping into the list would produce '/audio/https://…' under Tauri.
    ALL_AUDIO_FILES.forEach(f => {
      expect(f).not.toContain('/')
      expect(f).toMatch(/\.mp3$/)
    })
  })
})
