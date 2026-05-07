import WorkoutAudioPlayer from './WorkoutAudioPlayer'

let audioContext

const initAudioContext = () => {
  if (!audioContext && (window.AudioContext || window.webkitAudioContext)) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)()
  }
  return audioContext
}

// ─── Audio configs ────────────────────────────────────────────────────────────

const SUPABASE_AUDIO = 'https://veqjsjzuaviqctplwkdb.supabase.co/storage/v1/object/public/audio'

export const HIIT_AUDIO_CONFIG = {
  name: 'HIIT',
  audioPath: `${SUPABASE_AUDIO}/hiit_next-level_40-20_x12.mp3`,
  startTime: 1.37,
  url: `${SUPABASE_AUDIO}/hiit_next-level_40-20_x12.mp3`,
  defaultVolume: 0.7,
  loop: false
}

export const TABATA_AUDIO_CONFIG = {
  name: 'Tabata',
  audioPath: `${SUPABASE_AUDIO}/tabata_rocky_20-10_x4.mp3`,
  startTime: 0,
  url: `${SUPABASE_AUDIO}/tabata_rocky_20-10_x4.mp3`,
  defaultVolume: 0.7,
  loop: false
}

// ─── Lofi playlist ────────────────────────────────────────────────────────────

export const LOFI_TRACKS = [
  `${SUPABASE_AUDIO}/lofi_morning_routine-chosic.com.mp3`,
  `${SUPABASE_AUDIO}/lofi_music_library-lofi-ambient-study-lofi-music-455378.mp3`,
  `${SUPABASE_AUDIO}/fassounds-lofi-study-calm-peaceful-chill-hop-112191.mp3`,
  `${SUPABASE_AUDIO}/fassounds-good-night-lofi-cozy-chill-music-160166.mp3`,
  `${SUPABASE_AUDIO}/lofidreams-cozy-lofi-background-music-for-study-457198.mp3`,
  `${SUPABASE_AUDIO}/mondamusic-lofi-lofi-girl-lofi-chill-512853.mp3`,
  `${SUPABASE_AUDIO}/pulsebox-lofi-melody-522894.mp3`,
  `${SUPABASE_AUDIO}/pulsebox-lofi-night-522890.mp3`,
  `${SUPABASE_AUDIO}/pulsebox-lofi-smooth-522876.mp3`,
]

// Cycles through all 9 lofi tracks sequentially, looping indefinitely
class LofiPlaylistPlayer {
  constructor(tracks, defaultVolume = 0.5) {
    this.tracks = tracks
    this.defaultVolume = defaultVolume
    this.currentIndex = 0
    this.audio = null
    this.playerReady = false
    this.playerLoading = false
    this.shouldBePlaying = false
    this.watchdog = null
    this.playbackStartTime = 0
  }

  initialize() {
    return new Promise((resolve) => {
      if (this.audio) {
        resolve(this.playerReady)
        return
      }
      if (this.playerLoading) {
        const check = setInterval(() => {
          if (!this.playerLoading) {
            clearInterval(check)
            resolve(this.playerReady)
          }
        }, 100)
        return
      }

      this.playerLoading = true
      this.audio = new Audio(this.tracks[this.currentIndex])
      this.audio.preload = 'auto'
      this.audio.volume = this.defaultVolume
      this.audio.setAttribute('playsinline', '')
      this.audio.setAttribute('webkit-playsinline', '')
      this.audio.setAttribute('disableRemotePlayback', '')
      this.audio.setAttribute('x-webkit-airplay', 'deny')

      let initResolved = false
      const resolveOnce = (val) => {
        if (!initResolved) {
          initResolved = true
          this.playerLoading = false
          this.playerReady = val
          resolve(val)
        }
      }

      this.audio.addEventListener('canplaythrough', () => {
        resolveOnce(true)
        // After a track change, auto-play if we should be playing
        if (initResolved && this.shouldBePlaying) {
          this.audio.play().catch(() => {})
          this.playbackStartTime = Date.now()
          this._startWatchdog()
        }
      })

      this.audio.addEventListener('ended', () => {
        this._nextTrack()
      })

      this.audio.addEventListener('error', () => {
        if (!initResolved) {
          resolveOnce(false)
        } else {
          this._nextTrack()
        }
      })

      this.audio.addEventListener('suspend', () => {
        if (this.shouldBePlaying && this.audio?.paused && !this.audio?.ended) {
          setTimeout(() => {
            if (this.shouldBePlaying && this.audio?.paused) {
              this.audio.play().catch(() => {})
            }
          }, 100)
        }
      })

      this.audio.load()
    })
  }

  _nextTrack() {
    this.currentIndex = (this.currentIndex + 1) % this.tracks.length
    if (this.audio) {
      this.audio.src = this.tracks[this.currentIndex]
      this.audio.load()
    }
  }

  _startWatchdog() {
    if (this.watchdog) clearInterval(this.watchdog)
    this.watchdog = setInterval(() => {
      if (this.audio && this.playerReady && this.shouldBePlaying) {
        if (this.audio.paused && !this.audio.ended) {
          const t = Date.now() - this.playbackStartTime
          if (t > 500) {
            this.audio.play().catch(() => {})
            this.playbackStartTime = Date.now()
          }
        }
      }
    }, 300)
  }

  _stopWatchdog() {
    if (this.watchdog) {
      clearInterval(this.watchdog)
      this.watchdog = null
    }
    this.shouldBePlaying = false
  }

  async play() {
    if (!this.audio) await this.initialize()
    if (this.playerReady && this.audio) {
      try {
        this.audio.currentTime = 0
        await this.audio.play()
        this.shouldBePlaying = true
        this.playbackStartTime = Date.now()
        this._startWatchdog()
      } catch (err) {
        console.error('LofiPlaylist play error:', err)
      }
    }
  }

  pause() {
    this._stopWatchdog()
    this.audio?.pause()
  }

  resume() {
    if (this.playerReady && this.audio) {
      this.audio.play().catch(() => {})
      this.shouldBePlaying = true
      this.playbackStartTime = Date.now()
      this._startWatchdog()
    }
  }

  stop() {
    this._stopWatchdog()
    if (this.audio) {
      this.audio.pause()
      this.audio.currentTime = 0
    }
  }

  setVolume(v) {
    if (this.audio) this.audio.volume = Math.max(0, Math.min(1, v))
  }

  getPlayer() { return this.audio }
  isReady() { return this.playerReady }
  isLoading() { return this.playerLoading }
  isPlaying() { return this.audio ? !this.audio.paused : false }

  shouldIgnorePause() {
    return (Date.now() - this.playbackStartTime) < 2000
  }
}

// ─── Player instances ─────────────────────────────────────────────────────────

export const hiitAudio     = new WorkoutAudioPlayer(HIIT_AUDIO_CONFIG)
export const tabataAudio   = new WorkoutAudioPlayer(TABATA_AUDIO_CONFIG)
export const pomodoroAudio = new LofiPlaylistPlayer(LOFI_TRACKS, 0.5)
export const breathingAudio = new LofiPlaylistPlayer(LOFI_TRACKS, 0.4)

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
  const players = [hiitAudio, tabataAudio, pomodoroAudio, breathingAudio]
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
