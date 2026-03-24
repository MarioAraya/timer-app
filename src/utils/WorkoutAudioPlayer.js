/**
 * WorkoutAudioPlayer - Generic audio player for workout timers
 * Handles MP3 playback with watchdog timer to prevent mobile browser auto-pause
 */
class WorkoutAudioPlayer {
  constructor(config) {
    this.config = config
    this.audio = null
    this.playerReady = false
    this.playerLoading = false
    this.playbackStartTime = 0
    this.shouldBePlaying = false
    this.watchdog = null
  }

  /**
   * Initialize the audio player
   * @returns {Promise<boolean>} - True if ready, false on error
   */
  initialize() {
    return new Promise((resolve) => {
      if (this.audio) {
        resolve(this.playerReady)
        return
      }

      if (this.playerLoading) {
        // Wait for existing load to complete
        const checkReady = setInterval(() => {
          if (!this.playerLoading) {
            clearInterval(checkReady)
            resolve(this.playerReady)
          }
        }, 100)
        return
      }

      this.playerLoading = true
      this.audio = new Audio(this.config.audioPath)
      this.audio.preload = 'auto'

      // Add attributes to prevent unwanted pausing on mobile browsers
      this.audio.setAttribute('playsinline', '')
      this.audio.setAttribute('webkit-playsinline', '')
      this.audio.setAttribute('disableRemotePlayback', '')
      this.audio.setAttribute('x-webkit-airplay', 'deny')

      // Set loop if configured
      if (this.config.loop) {
        this.audio.loop = true
      }

      // Set volume
      this.audio.volume = this.config.defaultVolume || 0.7

      // Event listeners for mobile browser issues
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
        console.log(`🏁 ${this.config.name} audio ended`)
        this.stopWatchdog()
      })

      this.audio.addEventListener('canplaythrough', () => {
        this.playerReady = true
        this.playerLoading = false
        resolve(true)
      })

      this.audio.addEventListener('error', (error) => {
        console.error(`${this.config.name} audio loading error:`, error)
        this.playerReady = false
        this.playerLoading = false
        resolve(false)
      })

      this.audio.load()
    })
  }

  /**
   * Start watchdog timer to detect and fix auto-pauses
   */
  startWatchdog() {
    if (this.watchdog) clearInterval(this.watchdog)

    this.watchdog = setInterval(() => {
      if (this.audio && this.playerReady && this.shouldBePlaying) {
        if (this.audio.paused) {
          // Don't resume if the audio reached the end naturally
          if (this.audio.ended) {
            console.log(`🏁 ${this.config.name} audio ended naturally, stopping watchdog`)
            this.stopWatchdog()
            return
          }
          const timeSinceStart = Date.now() - this.playbackStartTime
          // Aggressive resume after 500ms
          if (timeSinceStart > 500) {
            console.log(`⚠️ ${this.config.name} auto-pause detected! Resuming... (paused for ${timeSinceStart}ms)`)
            this.audio.play().catch(err => console.error('Auto-resume failed:', err))
            this.playbackStartTime = Date.now()
          }
        }
      }
    }, 100) // Check every 100ms
  }

  /**
   * Stop watchdog timer
   */
  stopWatchdog() {
    if (this.watchdog) {
      clearInterval(this.watchdog)
      this.watchdog = null
    }
    this.shouldBePlaying = false
  }

  /**
   * Play audio from start
   */
  async play() {
    if (!this.audio) {
      await this.initialize()
    }

    if (this.playerReady && this.audio) {
      try {
        this.audio.currentTime = this.config.startTime
        await this.audio.play()
        this.playbackStartTime = Date.now()
        this.shouldBePlaying = true
        this.startWatchdog()
        console.log(`🎵 Playing ${this.config.name} song (watchdog enabled)`)
      } catch (error) {
        console.error(`Error playing ${this.config.name} audio:`, error)
      }
    }
  }

  /**
   * Stop audio and reset to start
   */
  stop() {
    if (this.playerReady && this.audio) {
      try {
        this.stopWatchdog()
        this.audio.pause()
        this.audio.currentTime = this.config.startTime
        console.log(`⏹️ Stopping ${this.config.name} song`)
      } catch (error) {
        console.error(`Error stopping ${this.config.name} audio:`, error)
      }
    }
  }

  /**
   * Pause audio without resetting
   */
  pause() {
    if (this.playerReady && this.audio) {
      try {
        this.stopWatchdog()
        this.audio.pause()
        console.log(`⏸️ Pausing ${this.config.name} song`)
      } catch (error) {
        console.error(`Error pausing ${this.config.name} audio:`, error)
      }
    }
  }

  /**
   * Resume audio from current position
   */
  resume() {
    if (this.playerReady && this.audio) {
      try {
        this.audio.play()
        this.playbackStartTime = Date.now()
        this.shouldBePlaying = true
        this.startWatchdog()
        console.log(`▶️ Resuming ${this.config.name} song (watchdog enabled)`)
      } catch (error) {
        console.error(`Error resuming ${this.config.name} audio:`, error)
      }
    }
  }

  /**
   * Get current audio position
   * @returns {number|null}
   */
  getPosition() {
    if (this.playerReady && this.audio) {
      return this.audio.currentTime
    }
    return null
  }

  /**
   * Set audio position
   * @param {number} position - Time in seconds
   * @returns {boolean}
   */
  setPosition(position) {
    if (this.playerReady && this.audio && position !== null && position >= 0) {
      try {
        this.audio.currentTime = position
        console.log(`⏩ Setting ${this.config.name} audio position to ${position.toFixed(2)}s`)
        return true
      } catch (error) {
        console.error(`Error setting ${this.config.name} audio position:`, error)
        return false
      }
    }
    return false
  }

  /**
   * Get the audio element instance
   * @returns {HTMLAudioElement|null}
   */
  getPlayer() {
    return this.audio
  }

  /**
   * Check if audio is currently playing
   * @returns {boolean}
   */
  isPlaying() {
    if (this.playerReady && this.audio) {
      return !this.audio.paused
    }
    return false
  }

  /**
   * Check if we should ignore pause events (within 2 seconds of playback start)
   * @returns {boolean}
   */
  shouldIgnorePause() {
    const timeSinceStart = Date.now() - this.playbackStartTime
    return timeSinceStart < 2000 // Ignore pauses within first 2 seconds
  }

  /**
   * Check if player is ready
   * @returns {boolean}
   */
  isReady() {
    return this.playerReady
  }

  /**
   * Check if player is loading
   * @returns {boolean}
   */
  isLoading() {
    return this.playerLoading
  }

  /**
   * Set volume
   * @param {number} volume - Volume level (0.0 to 1.0)
   */
  setVolume(volume) {
    if (this.audio) {
      this.audio.volume = Math.max(0, Math.min(1, volume))
    }
  }
}

export default WorkoutAudioPlayer
