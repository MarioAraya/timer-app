// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import WorkoutAudioPlayer from './WorkoutAudioPlayer'
import { LofiPlaylistPlayer } from './audioUtils'

// ─── Audio mock ───────────────────────────────────────────────────────────────

function makeMockAudio() {
  const listeners = {}
  const el = {
    src: '',
    currentTime: 0,
    volume: 1,
    paused: true,
    ended: false,
    loop: false,
    preload: '',
    setAttribute: vi.fn(),
    addEventListener: vi.fn((event, cb) => { listeners[event] = cb }),
    removeEventListener: vi.fn(),
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(() => { el.paused = true }),
    load: vi.fn(),
    _emit: (event) => listeners[event]?.(),
    _fire: (event) => { const h = listeners[event]; if (h) h() },
    _setReady: () => { el.paused = true; listeners['canplaythrough']?.() },
  }
  return el
}

let currentMockAudio = null

beforeEach(() => {
  currentMockAudio = makeMockAudio()
  class MockAudio { constructor() { return currentMockAudio } }
  vi.stubGlobal('Audio', MockAudio)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

// ─── WorkoutAudioPlayer helpers ───────────────────────────────────────────────

function makePlayer() {
  return new WorkoutAudioPlayer({
    name: 'Test',
    audioPath: '/test.mp3',
    startTime: 0,
    loop: false,
    defaultVolume: 0.7,
  })
}

async function readyPlayer() {
  const p = makePlayer()
  const initPromise = p.initialize()
  currentMockAudio._setReady()
  await initPromise
  return p
}

// ─────────────────────────────────────────────────────
// WorkoutAudioPlayer — shouldBePlaying
// ─────────────────────────────────────────────────────

describe('WorkoutAudioPlayer — shouldBePlaying', () => {
  it('false en estado inicial', () => {
    expect(makePlayer().shouldBePlaying).toBe(false)
  })

  it('true después de play()', async () => {
    const p = await readyPlayer()
    await p.play()
    expect(p.shouldBePlaying).toBe(true)
  })

  it('false después de stop()', async () => {
    const p = await readyPlayer()
    await p.play()
    p.stop()
    expect(p.shouldBePlaying).toBe(false)
  })

  it('false después de pause()', async () => {
    const p = await readyPlayer()
    await p.play()
    p.pause()
    expect(p.shouldBePlaying).toBe(false)
  })

  it('true después de resume()', async () => {
    const p = await readyPlayer()
    await p.play()
    p.pause()
    p.resume()
    expect(p.shouldBePlaying).toBe(true)
  })
})

// ─────────────────────────────────────────────────────
// WorkoutAudioPlayer — watchdog
// ─────────────────────────────────────────────────────

describe('WorkoutAudioPlayer — watchdog', () => {
  it('null antes de play()', () => {
    expect(makePlayer().watchdog).toBeNull()
  })

  it('stopWatchdog() limpia watchdog y shouldBePlaying', async () => {
    const p = await readyPlayer()
    await p.play()
    p.stopWatchdog()
    expect(p.watchdog).toBeNull()
    expect(p.shouldBePlaying).toBe(false)
  })
})

// ─────────────────────────────────────────────────────
// WorkoutAudioPlayer — shouldIgnorePause
// ─────────────────────────────────────────────────────

describe('WorkoutAudioPlayer — shouldIgnorePause', () => {
  it('true justo después de play() (< 2s)', async () => {
    const p = await readyPlayer()
    await p.play()
    expect(p.shouldIgnorePause()).toBe(true)
  })
})

// ─── LofiPlaylistPlayer helpers ───────────────────────────────────────────────

const TRACKS = ['/a.mp3', '/b.mp3', '/c.mp3']

async function readyLofi() {
  const p = new LofiPlaylistPlayer(TRACKS, 0.5)
  const initPromise = p.initialize()
  currentMockAudio._setReady()
  await initPromise
  return p
}

// ─────────────────────────────────────────────────────
// LofiPlaylistPlayer — nextTrack
// ─────────────────────────────────────────────────────

describe('LofiPlaylistPlayer — nextTrack', () => {
  it('currentIndex=0 en estado inicial', () => {
    expect(new LofiPlaylistPlayer(TRACKS).currentIndex).toBe(0)
  })

  it('nextTrack() incrementa currentIndex', async () => {
    const p = await readyLofi()
    p.nextTrack()
    expect(p.currentIndex).toBe(1)
  })

  it('nextTrack() wraps al final del array', async () => {
    const p = await readyLofi()
    p.nextTrack(); p.nextTrack(); p.nextTrack()
    expect(p.currentIndex).toBe(0)
  })

  it('nextTrack() setea inTrackTransition=true', async () => {
    const p = await readyLofi()
    p.nextTrack()
    expect(p.inTrackTransition).toBe(true)
  })

  it('nextTrack() resetea playerReady=false', async () => {
    const p = await readyLofi()
    expect(p.playerReady).toBe(true)
    p.nextTrack()
    expect(p.playerReady).toBe(false)
  })

  it('shouldIgnorePause=true durante inTrackTransition', async () => {
    const p = await readyLofi()
    p.nextTrack()
    expect(p.shouldIgnorePause()).toBe(true)
  })
})

// ─────────────────────────────────────────────────────
// LofiPlaylistPlayer — repeatTrack
// ─────────────────────────────────────────────────────

describe('LofiPlaylistPlayer — repeatTrack', () => {
  it('no cambia currentIndex', async () => {
    const p = await readyLofi()
    p.nextTrack()
    p.playerReady = true
    p.repeatTrack()
    expect(p.currentIndex).toBe(1)
  })

  it('resetea currentTime a 0', async () => {
    const p = await readyLofi()
    currentMockAudio.currentTime = 30
    p.repeatTrack()
    expect(currentMockAudio.currentTime).toBe(0)
  })
})

// ─────────────────────────────────────────────────────
// LofiPlaylistPlayer — ended event avanza track automáticamente
// ─────────────────────────────────────────────────────

describe('LofiPlaylistPlayer — ended event', () => {
  it('ended → _nextTrack → currentIndex avanza', async () => {
    const p = await readyLofi()
    currentMockAudio._emit('ended')
    expect(p.currentIndex).toBe(1)
  })
})
