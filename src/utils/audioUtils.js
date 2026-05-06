import WorkoutAudioPlayer from './WorkoutAudioPlayer'

let audioContext

const initAudioContext = () => {
  if (!audioContext && (window.AudioContext || window.webkitAudioContext)) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)()
  }
  return audioContext
}

// ─── Audio configs ────────────────────────────────────────────────────────────

export const HIIT_AUDIO_CONFIG = {
  name: 'HIIT',
  audioPath: '/audio/hiit_next-level_40-20_x12.mp3',
  startTime: 1.37,
  url: '/audio/hiit_next-level_40-20.mp3',
  defaultVolume: 0.7,
  loop: false
}

export const TABATA_AUDIO_CONFIG = {
  name: 'Tabata',
  audioPath: '/audio/tabata_rocky_20-10_x4.mp3',
  startTime: 0,
  url: '/audio/tabata_rocky_20-10_x4.mp3',
  defaultVolume: 0.7,
  loop: false
}

export const POMODORO_AUDIO_CONFIG = {
  name: 'Pomodoro',
  audioPath: '/audio/lofi_morning_routine-chosic.com.mp3',
  startTime: 0,
  url: '/audio/lofi_morning_routine-chosic.com.mp3',
  defaultVolume: 0.7,
  loop: true
}

// ─── Player instances — import and call methods directly ──────────────────────

export const hiitAudio     = new WorkoutAudioPlayer(HIIT_AUDIO_CONFIG)
export const tabataAudio   = new WorkoutAudioPlayer(TABATA_AUDIO_CONFIG)
export const pomodoroAudio = new WorkoutAudioPlayer(POMODORO_AUDIO_CONFIG)

// ─── Beep sounds (Web Audio API) ─────────────────────────────────────────────

export const playBeep = (frequency = 800, duration = 150, volume = 0.3) => {
  const ctx = initAudioContext()
  if (!ctx) return
  if (ctx.state === 'suspended') ctx.resume()

  const oscillator = ctx.createOscillator()
  const gainNode = ctx.createGain()
  oscillator.connect(gainNode)
  gainNode.connect(ctx.destination)

  oscillator.frequency.value = frequency
  oscillator.type = 'sine'
  gainNode.gain.setValueAtTime(0, ctx.currentTime)
  gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01)
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000)
  oscillator.start(ctx.currentTime)
  oscillator.stop(ctx.currentTime + duration / 1000)
}

export const playWorkSound      = () => playBeep(1000, 200, 0.4)
export const playCountdownSound = (count) => playBeep({ 3: 600, 2: 700, 1: 800 }[count] ?? 500, 300, 0.35)
export const playPrepSound      = () => playBeep(500, 100, 0.25)

// ─── Auto-resume when tab regains focus ──────────────────────────────────────

if (typeof document !== 'undefined') {
  const players = [hiitAudio, tabataAudio, pomodoroAudio]
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) return
    for (const player of players) {
      const audio = player.getPlayer()
      if (audio && player.shouldBePlaying && audio.paused) {
        audio.play().catch(err => console.error('Failed to resume audio:', err))
      }
    }
  })
}
