import { useState, useEffect, useRef } from 'preact/hooks'
import './WorkoutTimer.scss'
import { useDoubleClick } from '../hooks/useDoubleClick'
import { formatTimeSeconds, calculateProgress, isClickOnButton } from '../utils/timerHelpers'
import { playWorkSound, playCountdownSound } from '../utils/audioUtils'
import Confetti from './Confetti'

/**
 * Generic Workout Timer Component
 * Shared base for HIIT, Tabata, and other interval-based workout timers
 *
 * @param {Object} props
 * @param {string} props.workoutType - 'hiit' or 'tabata'
 * @param {string} props.name - Display name of the timer
 * @param {Object} props.config - Workout configuration (rounds, durations, etc.)
 * @param {Object} props.audioFunctions - Audio playback functions
 * @param {Object} props.storageFunctions - localStorage functions
 * @param {Object} props.messages - Custom messages for different phases
 * @param {string} props.className - Base CSS class name
 * @param {boolean} props.autoMaximize - Auto-enter fullscreen mode
 * @param {boolean} props.autoStart - Auto-start timer (always false for UX)
 * @param {boolean} props.showBackButton - Show/hide back button
 * @param {Function} props.onBackClick - Back navigation handler
 * @param {boolean} props.hasFinalRest - Whether workout has rest after final work phase
 */
function WorkoutTimer({
  workoutType,
  name,
  config,
  audioFunctions,
  storageFunctions,
  messages,
  className,
  autoMaximize = false,
  autoStart = false,
  showBackButton = true,
  onBackClick,
  hasFinalRest = false
}) {
  // Try to restore saved state
  const savedState = storageFunctions.load()

  const [currentRound, setCurrentRound] = useState(savedState?.currentRound || 1)
  const [timeLeft, setTimeLeft] = useState(savedState?.timeLeft || config.preparation.duration)
  const [isWorkPhase, setIsWorkPhase] = useState(savedState?.isWorkPhase ?? true)
  const [isPreparationPhase, setIsPreparationPhase] = useState(savedState?.isPreparationPhase ?? true)
  const [isRunning, setIsRunning] = useState(false) // Always start paused on mount
  const [isFinished, setIsFinished] = useState(savedState?.isFinished || false)
  const [isMaximized, setIsMaximized] = useState(autoMaximize)
  const [currentSubtitle, setCurrentSubtitle] = useState(savedState?.currentSubtitle || config.preparation.subtitle)
  const [musicMode, setMusicMode] = useState(savedState?.musicMode ?? true) // true = music, false = beeps only
  const [playerStatus, setPlayerStatus] = useState('idle') // 'idle', 'loading', 'ready'
  const [showConfetti, setShowConfetti] = useState(false)
  const [stateRestored, setStateRestored] = useState(false)
  const [volume, setVolume] = useState(0.7) // Volume state (0.0 to 1.0)

  // Use refs for ignore flags so they persist across renders and are accessible everywhere
  const ignoreNextPause = useRef(false)
  const ignoreNextPlay = useRef(false)

  const totalRounds = config.rounds.length
  const preparationTime = config.preparation.duration

  // Handle click anywhere to pause/resume (only in maximized mode)
  const handleContainerClick = (e) => {
    if (isMaximized && !isClickOnButton(e)) {
      if (isRunning) {
        handlePause()
      } else if (!isFinished) {
        handleStart()
      }
    } else if (!isMaximized && !isClickOnButton(e)) {
      handleDoubleClick()
    }
  }

  // Initialize audio player when music mode is enabled
  useEffect(() => {
    if (musicMode && playerStatus === 'idle') {
      setPlayerStatus('loading')
      audioFunctions.initialize().then((ready) => {
        setPlayerStatus(ready ? 'ready' : 'error')

        // Restore audio position if we have saved state
        if (ready && savedState && savedState.audioPosition && !stateRestored) {
          audioFunctions.setPosition(savedState.audioPosition)
          setStateRestored(true)
          console.log(`🔄 Restored ${workoutType.toUpperCase()} audio position:`, savedState.audioPosition)
        }
      })
    }
  }, [musicMode, playerStatus])

  // Update audio volume when volume state changes
  useEffect(() => {
    const audioPlayer = audioFunctions.getPlayer()
    if (audioPlayer) {
      audioPlayer.volume = volume
    }
  }, [volume])

  // Listen for audio pause/play events to sync timer
  useEffect(() => {
    if (!musicMode || playerStatus !== 'ready') return

    const handleAudioPause = (event) => {
      // Always check ignore flag first
      if (ignoreNextPause.current) {
        console.log('🔇 Ignoring pause event (triggered by our code)')
        ignoreNextPause.current = false
        return
      }

      // Ignore spurious pause events within first 2s of playback
      if (audioFunctions.shouldIgnorePause()) {
        console.log('🔇 Ignoring spurious pause event (within 2s of playback start)')
        return
      }

      // DISABLED: Don't auto-pause timer when audio pauses
      // This was causing issues with spurious pause events
      // Users can manually pause if needed
      /*
      if (isRunning && hasStarted()) {
        console.log('🎵 Audio paused externally - pausing timer')
        setIsRunning(false)
      }
      */
    }

    const handleAudioPlay = (event) => {
      // Always check ignore flag first
      if (ignoreNextPlay.current) {
        console.log('🔊 Ignoring play event (triggered by our code)')
        ignoreNextPlay.current = false
        return
      }

      // DISABLED: Don't auto-resume timer when audio plays
      // This was causing unexpected behavior
      // Users can manually resume if needed
      /*
      if (!isRunning && !isFinished && hasStarted()) {
        console.log('🎵 Audio played externally - resuming timer')
        setIsRunning(true)
      }
      */
    }

    const audioPlayer = audioFunctions.getPlayer()
    if (audioPlayer) {
      audioPlayer.addEventListener('pause', handleAudioPause)
      audioPlayer.addEventListener('play', handleAudioPlay)

      // Setup Media Session API for keyboard/system media controls
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: messages.mediaTitle,
          artist: 'Timer App',
          album: 'Fitness',
        })

        navigator.mediaSession.setActionHandler('play', () => {
          if (!isRunning && !isFinished && playerStatus === 'ready') {
            console.log('⌨️ Play from media controls')
            ignoreNextPlay.current = true
            audioFunctions.resume()
            setIsRunning(true)
          }
        })

        // DISABLED: Media Session pause handler
        // This was causing automatic pauses from browser/system events
        // Users can manually pause using the pause button
        /*
        navigator.mediaSession.setActionHandler('pause', () => {
          if (isRunning) {
            console.log('⌨️ Pause from media controls')
            ignoreNextPause.current = true
            audioFunctions.pause()
            setIsRunning(false)
          }
        })
        */
      }

      return () => {
        audioPlayer.removeEventListener('pause', handleAudioPause)
        audioPlayer.removeEventListener('play', handleAudioPlay)

        if ('mediaSession' in navigator) {
          navigator.mediaSession.setActionHandler('play', null)
          // No need to clear pause handler since we don't set it anymore
          // navigator.mediaSession.setActionHandler('pause', null)
        }
      }
    }
  }, [musicMode, playerStatus, isRunning, isFinished])

  // Save state only when paused (not while running to avoid saving mid-workout)
  useEffect(() => {
    if (!stateRestored && savedState) {
      return
    }

    if (!isRunning && hasStarted()) {
      const audioPosition = musicMode ? audioFunctions.getPosition() : null

      const currentState = {
        currentRound,
        timeLeft,
        isWorkPhase,
        isPreparationPhase,
        isRunning,
        isFinished,
        currentSubtitle,
        musicMode,
        audioPosition
      }

      storageFunctions.save(currentState)
      console.log(`💾 Saved ${workoutType} state (paused)`)
    }
  }, [isRunning, isFinished])

  // Save state and pause when component unmounts (switching timers)
  useEffect(() => {
    return () => {
      console.log(`🔄 Unmounting ${workoutType} timer...`)

      if (musicMode && isRunning) {
        console.log('⏸️ Pausing music before saving state')
        audioFunctions.pause()

        setTimeout(() => {
          const audioPosition = musicMode ? audioFunctions.getPosition() : null

          storageFunctions.save({
            currentRound,
            timeLeft,
            isWorkPhase,
            isPreparationPhase,
            isRunning,
            isFinished,
            currentSubtitle,
            musicMode,
            audioPosition
          })
          console.log(`💾 Saved ${workoutType} state after pausing music, position:`, audioPosition)
        }, 100)
      } else {
        const audioPosition = musicMode ? audioFunctions.getPosition() : null
        storageFunctions.save({
          currentRound,
          timeLeft,
          isWorkPhase,
          isPreparationPhase,
          isRunning,
          isFinished,
          currentSubtitle,
          musicMode,
          audioPosition
        })
        console.log(`💾 Saved ${workoutType} state on unmount`)
      }
    }
  }, [musicMode, isRunning, currentRound, timeLeft, isWorkPhase, isPreparationPhase, isFinished, currentSubtitle])

  // Timer interval logic
  useEffect(() => {
    let interval = null

    if (isRunning && !isFinished) {
      interval = setInterval(() => {
        setTimeLeft(time => {
          if (time <= 1) {
            // Phase transition logic
            if (isPreparationPhase) {
              // Preparation phase ending - start first work phase
              setIsPreparationPhase(false)
              setIsWorkPhase(true)
              setCurrentSubtitle(config.rounds[0].workSubtitle)
              if (!musicMode) playWorkSound()
              return config.rounds[0].work
            } else if (isWorkPhase) {
              // Work phase ending
              const currentRoundConfig = config.rounds[currentRound - 1]
              if (currentRound >= totalRounds) {
                // Final work phase
                if (hasFinalRest) {
                  // Go to final celebration rest (HIIT)
                  setIsWorkPhase(false)
                  setCurrentSubtitle(messages.finalRest || "🎉 You just killed this workout!")
                  return currentRoundConfig.rest
                } else {
                  // Workout complete (Tabata)
                  setIsRunning(false)
                  setIsFinished(true)
                  setShowConfetti(true)
                  if (musicMode) {
                    audioFunctions.stop()
                  }
                  return 0
                }
              } else {
                // Go to rest
                setIsWorkPhase(false)
                setCurrentSubtitle(currentRoundConfig.restSubtitle)
                return currentRoundConfig.rest
              }
            } else {
              // Rest phase ending
              if (currentRound >= totalRounds) {
                // Final rest phase ending - workout complete
                setIsRunning(false)
                setIsFinished(true)
                setShowConfetti(true)
                if (musicMode) {
                  audioFunctions.stop()
                }
                return 0
              } else {
                // Next round
                const nextRound = currentRound + 1
                setCurrentRound(nextRound)
                setIsWorkPhase(true)
                setCurrentSubtitle(config.rounds[nextRound - 1].workSubtitle)
                if (!musicMode) playWorkSound()
                return config.rounds[nextRound - 1].work
              }
            }
          }

          // Play countdown sounds during rest phase
          if (!isPreparationPhase && !isWorkPhase && time <= 4 && time > 1) {
            // Don't play countdown on final rest (if exists) or when in music mode
            const isFinalRest = currentRound >= totalRounds
            if (!musicMode && !(hasFinalRest && isFinalRest)) {
              playCountdownSound(time - 1)
            }
          }

          return time - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, isWorkPhase, isPreparationPhase, currentRound, isFinished])

  const handleStart = () => {
    if (musicMode && playerStatus === 'loading') {
      return // Don't start until player is ready
    }

    setIsRunning(true)
    if (musicMode) {
      ignoreNextPlay.current = true

      if (isPreparationPhase && timeLeft === preparationTime) {
        // Starting fresh workout - play song
        audioFunctions.play()
      } else {
        // Resuming - resume song
        audioFunctions.resume()
      }
    }
  }

  const handlePause = () => {
    setIsRunning(false)
    if (musicMode) {
      ignoreNextPause.current = true
      audioFunctions.pause()
    }
  }

  const handleReset = () => {
    setIsRunning(false)
    setIsFinished(false)
    setCurrentRound(1)
    setIsWorkPhase(true)
    setIsPreparationPhase(true)
    setTimeLeft(preparationTime)
    setCurrentSubtitle(config.preparation.subtitle)
    setShowConfetti(false)
    if (musicMode) {
      audioFunctions.stop()
    }
    storageFunctions.clear()
    console.log(`🗑️ Cleared saved ${workoutType} state`)
  }

  const handleSkip = () => {
    if (isPreparationPhase) {
      // Skip preparation - start first work phase
      setIsPreparationPhase(false)
      setIsWorkPhase(true)
      setCurrentSubtitle(config.rounds[0].workSubtitle)
      setTimeLeft(config.rounds[0].work)
    } else if (isWorkPhase) {
      const currentRoundConfig = config.rounds[currentRound - 1]
      if (currentRound >= totalRounds) {
        // Final work phase
        if (hasFinalRest) {
          // Go to final celebration rest
          setIsWorkPhase(false)
          setCurrentSubtitle(messages.finalRest || "🎉 You just killed this workout!")
          setTimeLeft(currentRoundConfig.rest)
        } else {
          // Complete workout
          setIsFinished(true)
          setIsRunning(false)
          setTimeLeft(0)
          setShowConfetti(true)
          if (musicMode) {
            audioFunctions.stop()
          }
        }
      } else {
        // Go to rest
        setIsWorkPhase(false)
        setCurrentSubtitle(currentRoundConfig.restSubtitle)
        setTimeLeft(currentRoundConfig.rest)
      }
    } else {
      // Skip rest
      if (currentRound >= totalRounds) {
        // Final rest phase - complete workout
        setIsFinished(true)
        setIsRunning(false)
        setTimeLeft(0)
        setShowConfetti(true)
        if (musicMode) {
          audioFunctions.stop()
        }
      } else {
        // Next round
        const nextRound = currentRound + 1
        setCurrentRound(nextRound)
        setIsWorkPhase(true)
        setCurrentSubtitle(config.rounds[nextRound - 1].workSubtitle)
        setTimeLeft(config.rounds[nextRound - 1].work)
      }
    }
  }

  const getPhaseMessage = () => {
    if (isFinished) return messages.complete
    if (!isRunning && isPreparationPhase && timeLeft === preparationTime) {
      return ""
    }
    if (isPreparationPhase) return messages.prep
    return isWorkPhase ? messages.work : messages.rest
  }

  const hasStarted = () => {
    return !(isPreparationPhase && timeLeft === preparationTime && !isRunning && currentRound === 1)
  }

  const getProgressPercentage = () => {
    if (isPreparationPhase) return 0
    // Calculate total phases based on whether there's a final rest
    const totalPhases = hasFinalRest ? (totalRounds * 2) : (totalRounds * 2 - 1)
    const completedPhases = (currentRound - 1) * 2 + (isWorkPhase ? 0 : 1)
    return calculateProgress(completedPhases, totalPhases)
  }

  const handleDoubleClick = useDoubleClick(() => {
    setIsMaximized(!isMaximized)
  })

  return (
    <div
      className={`${className} ${isFinished ? 'finished' : ''} ${isWorkPhase || isPreparationPhase ? 'work-phase' : 'rest-phase'} ${isMaximized ? 'maximized' : ''}`}
      onClick={handleContainerClick}
    >
      {/* Back button */}
      {onBackClick && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onBackClick()
          }}
          className={`back-btn ${isMaximized ? (showBackButton ? 'visible' : 'hidden') : ''}`}
        >
          ← Back
        </button>
      )}

      <h3 className="timer-name">{name}</h3>

      {/* Progress bar */}
      {hasStarted() && (
        <div className="timer-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
          <div className="round-info">
            Round {currentRound} / {totalRounds}
          </div>
        </div>
      )}

      {/* Central content */}
      <div className="timer-central-content">
        <div className="timer-phase">
          <div className={`phase-indicator ${isPreparationPhase ? 'work' : isWorkPhase ? 'work' : 'rest'}`}>
            {!hasStarted()
              ? messages.initial
              : (isPreparationPhase ? 'PREP' : isWorkPhase ? 'WORK' : 'REST')}
          </div>
        </div>

        <div className="timer-display">
          {!hasStarted()
            ? messages.initialDisplay
            : (isRunning || isFinished || hasStarted() ? formatTimeSeconds(timeLeft) : '--:--')}
        </div>

        <div className="timer-message">
          {getPhaseMessage()}
        </div>

        {currentSubtitle && hasStarted() && (
          <div className="timer-subtitle">
            {currentSubtitle}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="timer-controls">
        {!isRunning ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleStart()
            }}
            className="btn btn-start"
            disabled={isFinished || (musicMode && playerStatus === 'loading')}
          >
            {isFinished ? 'Finished' :
             (musicMode && playerStatus === 'loading') ? 'Loading...' :
             (isPreparationPhase && timeLeft === preparationTime ? 'Start' : 'Resume')}
          </button>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation()
              handlePause()
            }}
            className="btn btn-pause"
          >
            Pause
          </button>
        )}

        {hasStarted() && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleSkip()
              }}
              className="btn btn-icon btn-skip"
              disabled={isFinished}
              title="Skip Phase"
            >
              <span className="btn-icon-symbol">⏭️</span>
              <span className="btn-tooltip">Skip Phase</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation()
                handleReset()
              }}
              className="btn btn-icon btn-reset"
              title="Reset"
            >
              <span className="btn-icon-symbol">🔄</span>
              <span className="btn-tooltip">Reset</span>
            </button>
          </>
        )}
      </div>

      {/* Music mode toggle */}
      <div className="timer-music-toggle">
        <label className="toggle-container">
          <input
            type="checkbox"
            checked={musicMode}
            onChange={(e) => setMusicMode(e.target.checked)}
            disabled={isRunning}
          />
          <span className="toggle-slider"></span>
          <span className="toggle-label">
            {musicMode ? '🎵 Local Music' : '🔊 Beeps Only'}
            {musicMode && playerStatus === 'loading' && ' (Loading...)'}
          </span>
        </label>
      </div>

      {/* Volume control */}
      {musicMode && (
        <div className="timer-volume-control">
          <label className="volume-label">
            <span className="volume-icon">🔊</span>
            <input
              type="range"
              min="0"
              max="100"
              value={volume * 100}
              onChange={(e) => setVolume(e.target.value / 100)}
              className="volume-slider"
            />
            <span className="volume-value">{Math.round(volume * 100)}%</span>
          </label>
        </div>
      )}

      {/* Stats */}
      <div className="timer-stats">
        <div className="stat">
          <span className="stat-label">Song:</span>
          <span className="stat-value">
            <a href={audioFunctions.config.url} target="_blank" rel="noopener noreferrer" className="song-link">
              🎵 Local MP3
            </a>
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">Rounds:</span>
          <span className="stat-value">{totalRounds}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Total:</span>
          <span className="stat-value">{config.calculateTotalTime()}</span>
        </div>
      </div>

      <Confetti
        isActive={showConfetti}
        onComplete={() => setShowConfetti(false)}
      />
    </div>
  )
}

export default WorkoutTimer
