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

// Cycles through all 9 lofi tracks sequentially, looping indefinitely.
// Mirrors WorkoutAudioPlayer's play/resume/watchdog flow so HIIT-style
// browser autoplay handling applies to pomodoro/breathing too.
export class LofiPlaylistPlayer {
  constructor(tracks, defaultVolume = 0.5) {
    this.config = { name: 'Lofi', defaultVolume, startTime: 0 }
    this.tracks = tracks
    this.currentIndex = 0
    this.audio = null
    this.playerReady = false
    this.playerLoading = false
    this.playbackStartTime = 0
    this.shouldBePlaying = false
    this.watchdog = null
    this.inTrackTransition = false
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
      this.audio.volume = this.config.defaultVolume

      this.audio.setAttribute('playsinline', '')
      this.audio.setAttribute('webkit-playsinline', '')
      this.audio.setAttribute('disableRemotePlayback', '')
      this.audio.setAttribute('x-webkit-airplay', 'deny')

      this.audio.addEventListener('suspend', (e) => {
        console.log(`🔇 ${this.config.name} audio suspend event`, e)
        if (this.shouldBePlaying) {
          setTimeout(() => {
            if (this.audio.paused && this.shouldBePlaying) {
              console.log('🔄 Auto-resuming after suspend')
              this.audio.play().catch(err => console.error('Resume after suspend failed:', err))
            }
          }, 100)
        }
      })

      this.audio.addEventListener('stalled', (e) => {
        console.log(`⚠️ ${this.config.name} audio stalled event`, e)
      })

      this.audio.addEventListener('waiting', (e) => {
        console.log(`⏳ ${this.config.name} audio waiting event`, e)
      })

      this.audio.addEventListener('ended', () => {
        console.log(`🏁 ${this.config.name} track ended, advancing`)
        this._nextTrack()
      })

      this.audio.addEventListener('canplaythrough', () => {
        this.playerReady = true
        this.playerLoading = false
        // After a track swap, auto-play if user intent is still active
        if (this.shouldBePlaying && this.audio.paused) {
          this.audio.play().catch(() => {})
          this.playbackStartTime = Date.now()
          this.startWatchdog()
        }
        resolve(true)
      })

      this.audio.addEventListener('error', (error) => {
        console.error(`${this.config.name} audio loading error:`, error)
        if (!this.playerReady) {
          this.playerReady = false
          this.playerLoading = false
          resolve(false)
        } else {
          this._nextTrack()
        }
      })

      this.audio.load()
    })
  }

  startWatchdog() {
    if (this.watchdog) clearInterval(this.watchdog)
    this.watchdog = setInterval(() => {
      if (this.audio && this.playerReady && this.shouldBePlaying) {
        if (this.audio.paused) {
          if (this.audio.ended) {
            // ended handler swaps track; keep watchdog running
            return
          }
          const timeSinceStart = Date.now() - this.playbackStartTime
          if (timeSinceStart > 500) {
            console.log(`⚠️ ${this.config.name} auto-pause detected! Resuming... (${timeSinceStart}ms)`)
            this.audio.play().catch(err => console.error('Auto-resume failed:', err))
            this.playbackStartTime = Date.now()
          }
        }
      }
    }, 100)
  }

  stopWatchdog() {
    if (this.watchdog) {
      clearInterval(this.watchdog)
      this.watchdog = null
    }
    this.shouldBePlaying = false
  }

  _nextTrack() {
    // Flag prevents the 'pause' DOM event fired by audio.load() from
    // being mistakenly treated as a user-initiated pause in PomodoroTimer
    this.inTrackTransition = true
    this.currentIndex = (this.currentIndex + 1) % this.tracks.length
    if (this.audio) {
      this.playerReady = false
      this.audio.src = this.tracks[this.currentIndex]
      this.audio.load()
      setTimeout(() => { this.inTrackTransition = false }, 1500)
    }
  }

  nextTrack() {
    this._nextTrack()
  }

  repeatTrack() {
    if (this.audio && this.playerReady) {
      this.audio.currentTime = 0
      if (this.shouldBePlaying) {
        this.audio.play().catch(() => {})
      }
    }
  }

  async play() {
    if (!this.audio) {
      await this.initialize()
    }

    if (this.playerReady && this.audio) {
      try {
        this.audio.currentTime = 0
        await this.audio.play()
        this.playbackStartTime = Date.now()
        this.shouldBePlaying = true
        this.startWatchdog()
        console.log(`🎵 Playing ${this.config.name} (watchdog enabled)`)
      } catch (error) {
        console.error(`Error playing ${this.config.name} audio:`, error)
      }
    }
  }

  stop() {
    if (this.playerReady && this.audio) {
      try {
        this.stopWatchdog()
        this.audio.pause()
        this.audio.currentTime = 0
        console.log(`⏹️ Stopping ${this.config.name}`)
      } catch (error) {
        console.error(`Error stopping ${this.config.name} audio:`, error)
      }
    }
  }

  pause() {
    if (this.playerReady && this.audio) {
      try {
        this.stopWatchdog()
        this.audio.pause()
        console.log(`⏸️ Pausing ${this.config.name}`)
      } catch (error) {
        console.error(`Error pausing ${this.config.name} audio:`, error)
      }
    }
  }

  resume() {
    if (this.playerReady && this.audio) {
      try {
        this.audio.play()
        this.playbackStartTime = Date.now()
        this.shouldBePlaying = true
        this.startWatchdog()
        console.log(`▶️ Resuming ${this.config.name} (watchdog enabled)`)
      } catch (error) {
        console.error(`Error resuming ${this.config.name} audio:`, error)
      }
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
    if (this.inTrackTransition) return true
    const timeSinceStart = Date.now() - this.playbackStartTime
    return timeSinceStart < 2000
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

export const playCheerSound = () => {
  const ctx = initAudioContext()
  if (!ctx) return
  if (ctx.state === 'suspended') ctx.resume()

  // Ascending fanfare: C5-E5-G5-C6-E6
  const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.value = freq

    const t = ctx.currentTime + i * 0.11
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.28, t + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.22)
    osc.start(t)
    osc.stop(t + 0.25)
  })
}

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
