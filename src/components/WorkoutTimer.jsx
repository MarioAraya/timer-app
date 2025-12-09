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
 * @param {boolean} props.showSkipButton - Show/hide skip phase button
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
  hasFinalRest = false,
  showSkipButton = true
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
  const [volume, setVolume] = useState(savedState?.volume ?? 0.7) // Volume state (0.0 to 1.0)
  const [showControls, setShowControls] = useState(false) // Show controls when mouse in bottom 20%

  // Use refs for ignore flags so they persist across renders and are accessible everywhere
  const ignoreNextPause = useRef(false)
  const ignoreNextPlay = useRef(false)
  const containerRef = useRef(null)

  // Ref to track current state for cleanup
  const stateRef = useRef({
    currentRound,
    timeLeft,
    isWorkPhase,
    isPreparationPhase,
    isRunning,
    isFinished,
    currentSubtitle,
    musicMode,
    volume
  })

  const totalRounds = config.rounds.length
  const preparationTime = config.preparation.duration

  // Update state ref whenever state changes
  useEffect(() => {
    stateRef.current = {
      currentRound,
      timeLeft,
      isWorkPhase,
      isPreparationPhase,
      isRunning,
      isFinished,
      currentSubtitle,
      musicMode,
      volume
    }
  }, [currentRound, timeLeft, isWorkPhase, isPreparationPhase, isRunning, isFinished, currentSubtitle, musicMode, volume])

  // Handle mouse move to show/hide controls based on position
  const handleMouseMove = (e) => {
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const mouseY = e.clientY - rect.top
    const containerHeight = rect.height
    const bottomThreshold = containerHeight * 0.8 // 80% from top = 20% from bottom

    setShowControls(mouseY >= bottomThreshold)
  }

  const handleMouseLeave = () => {
    setShowControls(false)
  }

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

  // Seek forward/backward in timer and audio
  const handleSeek = (seconds) => {
    if (isFinished || isPreparationPhase) return

    // Calculate total elapsed time from start of workout
    let totalElapsedTime = preparationTime // Start with prep time

    // Add completed rounds
    for (let i = 0; i < currentRound - 1; i++) {
      totalElapsedTime += config.rounds[i].work + config.rounds[i].rest
    }

    // Add current phase time
    const currentRoundConfig = config.rounds[currentRound - 1]
    if (isWorkPhase) {
      totalElapsedTime += currentRoundConfig.work - timeLeft
    } else {
      totalElapsedTime += currentRoundConfig.work + (currentRoundConfig.rest - timeLeft)
    }

    // Apply seek offset
    totalElapsedTime += seconds

    // Clamp to valid range (prep time to total workout time)
    const totalWorkoutTime = preparationTime + config.rounds.reduce((sum, r) => sum + r.work + r.rest, 0)
    totalElapsedTime = Math.max(preparationTime, Math.min(totalElapsedTime, totalWorkoutTime - 1))

    // Calculate new position (round, phase, time)
    let remainingTime = totalElapsedTime - preparationTime
    let newRound = 1
    let newIsWorkPhase = true
    let newTimeLeft = 0

    for (let i = 0; i < config.rounds.length; i++) {
      const roundConfig = config.rounds[i]

      if (remainingTime <= roundConfig.work) {
        // In work phase of this round
        newRound = i + 1
        newIsWorkPhase = true
        newTimeLeft = roundConfig.work - remainingTime
        break
      }
      remainingTime -= roundConfig.work

      if (remainingTime <= roundConfig.rest) {
        // In rest phase of this round
        newRound = i + 1
        newIsWorkPhase = false
        newTimeLeft = roundConfig.rest - remainingTime
        break
      }
      remainingTime -= roundConfig.rest
    }

    // Update state
    setCurrentRound(newRound)
    setIsWorkPhase(newIsWorkPhase)
    setTimeLeft(Math.max(1, newTimeLeft))
    setIsPreparationPhase(false)
    setCurrentSubtitle(
      newIsWorkPhase
        ? config.rounds[newRound - 1].workSubtitle
        : config.rounds[newRound - 1].restSubtitle
    )

    // Seek audio if in music mode
    if (musicMode && playerStatus === 'ready') {
      const audioPlayer = audioFunctions.getPlayer()
      if (audioPlayer) {
        const newAudioTime = totalElapsedTime
        audioPlayer.currentTime = newAudioTime
        console.log(`⏩ Seeked to ${seconds > 0 ? '+' : ''}${seconds}s (audio: ${newAudioTime.toFixed(2)}s, round: ${newRound}, ${newIsWorkPhase ? 'work' : 'rest'})`)
      }
    }
  }

  // Handle keyboard events for seeking
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only handle arrow keys when timer is running and not finished
      if (!isRunning || isFinished) return

      if (e.key === 'ArrowRight') {
        e.preventDefault()
        handleSeek(10) // Forward 10 seconds
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        handleSeek(-10) // Backward 10 seconds
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isRunning, isFinished, isPreparationPhase, currentRound, timeLeft, isWorkPhase, musicMode, playerStatus])

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
        audioPosition,
        volume
      }

      storageFunctions.save(currentState)
      console.log(`💾 Saved ${workoutType} state (paused)`)
    }
  }, [isRunning, isFinished])

  // Save state and pause when component unmounts (switching timers)
  useEffect(() => {
    return () => {
      console.log(`🔄 Unmounting ${workoutType} timer...`)

      // Get current values at cleanup time
      const audioPlayer = audioFunctions.getPlayer()
      const currentAudioPosition = audioPlayer ? audioFunctions.getPosition() : null

      if (audioPlayer && !audioPlayer.paused) {
        console.log('⏸️ Pausing music before saving state')
        audioFunctions.pause()
      }

      // Save state using ref (has the latest values)
      setTimeout(() => {
        const state = stateRef.current
        storageFunctions.save({
          ...state,
          audioPosition: currentAudioPosition
        })
        console.log(`💾 Saved ${workoutType} state on unmount`)
      }, 100)
    }
  }, []) // Empty deps - only run on actual unmount

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
      ref={containerRef}
      className={`${className} ${isFinished ? 'finished' : ''} ${isWorkPhase || isPreparationPhase ? 'work-phase' : 'rest-phase'} ${isMaximized ? 'maximized' : ''} ${showControls ? 'show-controls' : ''} ${!isRunning && hasStarted() && !isFinished ? 'paused' : ''}`}
      onClick={handleContainerClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
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

        {currentSubtitle && hasStarted() && !isFinished && (
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
            {showSkipButton && (
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
            )}

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
      <div className="timer-music-toggle" onClick={(e) => e.stopPropagation()}>
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
      <div className="timer-volume-control" onClick={(e) => e.stopPropagation()}>
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

      <Confetti
        isActive={showConfetti}
        onComplete={() => setShowConfetti(false)}
      />
    </div>
  )
}

export default WorkoutTimer
