import { useState, useEffect, useRef } from 'preact/hooks'
import './PomodoroTimer.scss'
import { useDoubleClick } from '../hooks/useDoubleClick'
import { formatTime, calculateProgress, isClickOnButton } from '../utils/timerHelpers'
import {
  playWorkSound,
  playBeep,
  playCountdownSound,
  playPomodoroSong,
  stopPomodoroSong,
  pausePomodoroSong,
  resumePomodoroSong,
  POMODORO_AUDIO_CONFIG,
  initializePomodoroAudioPlayer,
  isPomodoroPlayerReady,
  isPomodoroPlayerLoading,
  getPomodoroAudioPlayer,
  shouldIgnorePomodoroPause
} from '../utils/audioUtils'
import {
  POMODORO_CONFIG,
  formatSessionInfo,
  getBreakDuration,
  getPhaseMessage,
  getPhaseSubtitle
} from '../config/pomodoroConfig'
import Confetti from './Confetti'
import { savePomodoroState, loadPomodoroState, clearPomodoroState } from '../utils/localStorage'

function PomodoroTimer({ name = 'Pomodoro Timer', autoMaximize = false, autoStart = false, showBackButton = true, onBackClick }) {
  // Try to restore saved state
  const savedState = loadPomodoroState()

  const [currentSession, setCurrentSession] = useState(savedState?.currentSession || 1)
  const [timeLeft, setTimeLeft] = useState(savedState?.timeLeft || POMODORO_CONFIG.workDuration)
  const [isWorkPhase, setIsWorkPhase] = useState(savedState?.isWorkPhase ?? true)
  const [isRunning, setIsRunning] = useState(false) // Always start paused on mount
  const [isFinished, setIsFinished] = useState(savedState?.isFinished || false)
  const [isMaximized, setIsMaximized] = useState(autoMaximize)
  const [currentMessage, setCurrentMessage] = useState(savedState?.currentMessage || POMODORO_CONFIG.messages.preparation)
  const [currentSubtitle, setCurrentSubtitle] = useState(savedState?.currentSubtitle || POMODORO_CONFIG.subtitles.preparation)
  const [showConfetti, setShowConfetti] = useState(false)
  const [stateRestored, setStateRestored] = useState(false)
  const [musicMode, setMusicMode] = useState(savedState?.musicMode ?? false) // false by default - beeps only
  const [playerStatus, setPlayerStatus] = useState('idle') // 'idle', 'loading', 'ready'
  const [volume, setVolume] = useState(savedState?.volume || 0.5) // Volume state (0.0 to 1.0)

  // Use refs for ignore flags
  const ignoreNextPause = useRef(false)
  const ignoreNextPlay = useRef(false)

  // Mark state as restored after first mount
  useEffect(() => {
    if (savedState) {
      setStateRestored(true)
    }
  }, [])

  // Initialize audio player when music mode is enabled
  useEffect(() => {
    if (musicMode && playerStatus === 'idle') {
      setPlayerStatus('loading')
      initializePomodoroAudioPlayer().then((ready) => {
        setPlayerStatus(ready ? 'ready' : 'error')
      })
    }
  }, [musicMode, playerStatus])

  // Update audio volume when volume state changes
  useEffect(() => {
    const audioPlayer = getPomodoroAudioPlayer()
    if (audioPlayer) {
      audioPlayer.volume = volume
    }
  }, [volume])

  // Listen for audio pause/play events to sync timer
  useEffect(() => {
    if (!musicMode || playerStatus !== 'ready') return

    const handleAudioPause = (event) => {
      // Ignore if this pause was triggered by our code
      if (ignoreNextPause.current) {
        // console.log('🔇 Ignoring pause event (triggered by our code)')
        ignoreNextPause.current = false
        return
      }

      // Ignore spurious pause events within first 2 seconds of playback
      if (shouldIgnorePomodoroPause()) {
        // console.log('🔇 Ignoring spurious pause event (within 2s of playback start)')
        return
      }

      // Only react if timer is running and we're in work phase
      if (isRunning && isWorkPhase && hasStarted()) {
        // console.log('🎵 Audio paused externally - pausing timer')
        setIsRunning(false)
      }
    }

    const handleAudioPlay = (event) => {
      // Ignore if this play was triggered by our code
      if (ignoreNextPlay.current) {
        // console.log('🔊 Ignoring play event (triggered by our code)')
        ignoreNextPlay.current = false
        return
      }

      // Only react if timer is not running and not finished and in work phase
      if (!isRunning && !isFinished && isWorkPhase && hasStarted()) {
        // console.log('🎵 Audio played externally - resuming timer')
        setIsRunning(true)
      }
    }

    const audioPlayer = getPomodoroAudioPlayer()
    if (audioPlayer) {
      audioPlayer.addEventListener('pause', handleAudioPause)
      audioPlayer.addEventListener('play', handleAudioPlay)

      // Setup Media Session API for keyboard/system media controls
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: 'Pomodoro Focus',
          artist: 'Timer App',
          album: 'Productivity',
        })

        navigator.mediaSession.setActionHandler('play', () => {
          if (!isRunning && !isFinished && isWorkPhase && playerStatus === 'ready') {
            // console.log('⌨️ Play from media controls')
            ignoreNextPlay.current = true
            resumePomodoroSong()
            setIsRunning(true)
          }
        })

        navigator.mediaSession.setActionHandler('pause', () => {
          if (isRunning && isWorkPhase) {
            // console.log('⌨️ Pause from media controls')
            ignoreNextPause.current = true
            pausePomodoroSong()
            setIsRunning(false)
          }
        })
      }

      return () => {
        audioPlayer.removeEventListener('pause', handleAudioPause)
        audioPlayer.removeEventListener('play', handleAudioPlay)

        // Clear media session handlers
        if ('mediaSession' in navigator) {
          navigator.mediaSession.setActionHandler('play', null)
          navigator.mediaSession.setActionHandler('pause', null)
        }
      }
    }
  }, [musicMode, playerStatus, isRunning, isFinished, isWorkPhase])

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

  // Save state when paused
  useEffect(() => {
    // Don't save if we just mounted and haven't interacted yet
    if (!stateRestored && savedState) {
      return
    }

    // Only save when NOT running (paused or finished)
    if (!isRunning && hasStarted()) {
      const currentState = {
        currentSession,
        timeLeft,
        isWorkPhase,
        isRunning,
        isFinished,
        currentMessage,
        currentSubtitle,
        musicMode,
        volume
      }

      savePomodoroState(currentState)
      // console.log('💾 Saved Pomodoro state (paused)')
    }
  }, [isRunning, isFinished])

  // Save state and pause when component unmounts
  useEffect(() => {
    return () => {
      // console.log('🔄 Unmounting Pomodoro timer...')

      // Stop music if playing
      if (musicMode && isWorkPhase) {
        pausePomodoroSong()
      }

      savePomodoroState({
        currentSession,
        timeLeft,
        isWorkPhase,
        isRunning,
        isFinished,
        currentMessage,
        currentSubtitle,
        musicMode,
        volume
      })
      // console.log('💾 Saved Pomodoro state on unmount')
    }
  }, [currentSession, timeLeft, isWorkPhase, isRunning, isFinished, currentMessage, currentSubtitle, musicMode, volume])

  // Timer countdown effect
  useEffect(() => {
    let interval = null

    if (isRunning && !isFinished) {
      interval = setInterval(() => {
        setTimeLeft(time => {
          if (time <= 1) {
            // Phase transition logic
            if (isWorkPhase) {
              // Work phase ending
              // Stop music if playing
              if (musicMode && playerStatus === 'ready') {
                ignoreNextPause.current = true
                stopPomodoroSong()
              }

              // Play completion beep (only if not in music mode)
              if (!musicMode) {
                playBeep(1200, 300, 0.4)
              }

              // Go to break
              const breakDuration = getBreakDuration(currentSession)
              setIsWorkPhase(false)
              setCurrentMessage(getPhaseMessage(false, currentSession))
              setCurrentSubtitle(getPhaseSubtitle(false, currentSession))
              return breakDuration
            } else {
              // Break phase ending
              const isLongBreak = currentSession % POMODORO_CONFIG.sessionsBeforeLongBreak === 0

              if (isLongBreak) {
                // After long break, show completion
                setIsRunning(false)
                setIsFinished(true)
                setShowConfetti(true)
                playBeep(1500, 500, 0.5) // Completion sound
                setCurrentMessage("🎉 Pomodoro Cycle Complete!")
                setCurrentSubtitle(`Completed ${currentSession} sessions!`)
                return 0
              } else {
                // After short break, start next work session
                const nextSession = currentSession + 1
                setCurrentSession(nextSession)
                setIsWorkPhase(true)
                setCurrentMessage(getPhaseMessage(true, nextSession))
                setCurrentSubtitle(getPhaseSubtitle(true, nextSession))

                // Start music if in music mode
                if (musicMode && playerStatus === 'ready') {
                  ignoreNextPlay.current = true
                  playPomodoroSong()
                } else {
                  playWorkSound()
                }

                return POMODORO_CONFIG.workDuration
              }
            }
          }

          // Play countdown sounds during last 3 seconds of work phase (only if not in music mode)
          if (!musicMode && isWorkPhase && time <= 4 && time > 1) {
            playCountdownSound(time - 1)
          }

          return time - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, isWorkPhase, currentSession, isFinished])

  const handleStart = () => {
    setIsRunning(true)

    // If starting fresh, set initial message
    if (!hasStarted()) {
      setCurrentMessage(getPhaseMessage(true, currentSession))
      setCurrentSubtitle(getPhaseSubtitle(true, currentSession))

      // Play appropriate sound
      if (musicMode && playerStatus === 'ready' && isWorkPhase) {
        ignoreNextPlay.current = true
        playPomodoroSong()
      } else {
        playWorkSound()
      }
    } else if (isWorkPhase && musicMode && playerStatus === 'ready') {
      // Resuming work phase with music
      ignoreNextPlay.current = true
      resumePomodoroSong()
    }
  }

  const handlePause = () => {
    setIsRunning(false)

    // Pause music if in work phase
    if (isWorkPhase && musicMode && playerStatus === 'ready') {
      ignoreNextPause.current = true
      pausePomodoroSong()
    }
  }

  const handleReset = () => {
    setIsRunning(false)
    setIsFinished(false)
    setCurrentSession(1)
    setIsWorkPhase(true)
    setTimeLeft(POMODORO_CONFIG.workDuration)
    setCurrentMessage(POMODORO_CONFIG.messages.preparation)
    setCurrentSubtitle(POMODORO_CONFIG.subtitles.preparation)
    setShowConfetti(false)

    // Stop music if playing
    if (musicMode && playerStatus === 'ready') {
      ignoreNextPause.current = true
      stopPomodoroSong()
    }

    clearPomodoroState()
    // console.log('🗑️ Cleared saved Pomodoro state')
  }

  const handleSkip = () => {
    if (isWorkPhase) {
      // Skip work - go to break
      // Stop music if playing
      if (musicMode && playerStatus === 'ready') {
        ignoreNextPause.current = true
        stopPomodoroSong()
      }

      const breakDuration = getBreakDuration(currentSession)
      setIsWorkPhase(false)
      setTimeLeft(breakDuration)
      setCurrentMessage(getPhaseMessage(false, currentSession))
      setCurrentSubtitle(getPhaseSubtitle(false, currentSession))
    } else {
      // Skip break - go to next work session or finish
      const isLongBreak = currentSession % POMODORO_CONFIG.sessionsBeforeLongBreak === 0

      if (isLongBreak) {
        // After long break, finish
        setIsFinished(true)
        setIsRunning(false)
        setTimeLeft(0)
        setShowConfetti(true)
        setCurrentMessage("🎉 Pomodoro Cycle Complete!")
        setCurrentSubtitle(`Completed ${currentSession} sessions!`)
      } else {
        // Start next work session
        const nextSession = currentSession + 1
        setCurrentSession(nextSession)
        setIsWorkPhase(true)
        setTimeLeft(POMODORO_CONFIG.workDuration)
        setCurrentMessage(getPhaseMessage(true, nextSession))
        setCurrentSubtitle(getPhaseSubtitle(true, nextSession))

        // Start music if timer is running and in music mode
        if (isRunning && musicMode && playerStatus === 'ready') {
          ignoreNextPlay.current = true
          playPomodoroSong()
        }
      }
    }
  }

  const hasStarted = () => {
    // Check if timer has ever been started
    return !(
      isWorkPhase &&
      timeLeft === POMODORO_CONFIG.workDuration &&
      !isRunning &&
      currentSession === 1 &&
      currentMessage === POMODORO_CONFIG.messages.preparation
    )
  }

  const getProgressPercentage = () => {
    if (!hasStarted()) return 0

    const totalSessions = POMODORO_CONFIG.sessionsBeforeLongBreak
    const completedSessions = currentSession - 1
    const currentPhaseProgress = isWorkPhase ? 0 : 0.5 // Break counts as half progress toward next session

    return calculateProgress(completedSessions + currentPhaseProgress, totalSessions)
  }

  const handleDoubleClick = useDoubleClick(() => {
    setIsMaximized(!isMaximized)
  })

  return (
    <div
      className={`pomodoro-timer ${isFinished ? 'finished' : ''} ${isWorkPhase ? 'work-phase' : 'break-phase'} ${isMaximized ? 'maximized' : ''}`}
      onClick={handleContainerClick}
    >
      {/* Back button - visible in normal mode, auto-hide in fullscreen */}
      {onBackClick && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onBackClick()
          }}
          className={`pomodoro-back-btn ${isMaximized ? (showBackButton ? 'visible' : 'hidden') : ''}`}
        >
          ← Back
        </button>
      )}

      <h3 className="pomodoro-name">{name}</h3>

      {/* Progress bar - only show if started */}
      {hasStarted() && (
        <div className="pomodoro-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
          <div className="session-info">
            {isWorkPhase
              ? formatSessionInfo(currentSession, true)
              : formatSessionInfo(currentSession, false)}
          </div>
        </div>
      )}

      {/* Central content */}
      <div className="pomodoro-central-content">
        <div className="pomodoro-phase">
          <div className={`phase-indicator ${isWorkPhase ? 'work' : 'break'}`}>
            {!hasStarted() ? 'POMODORO' : isWorkPhase ? 'WORK' : 'BREAK'}
          </div>
        </div>

        <div className="pomodoro-display">
          {!hasStarted() ? '25:00' : formatTime(timeLeft)}
        </div>

        <div className="pomodoro-message">{currentMessage}</div>

        {currentSubtitle && hasStarted() && (
          <div className="pomodoro-subtitle">{currentSubtitle}</div>
        )}
      </div>

      <div className="pomodoro-controls">
        {!isRunning ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleStart()
            }}
            className="btn btn-start"
            disabled={isFinished}
          >
            {isFinished ? 'Finished' : !hasStarted() ? 'Start' : 'Resume'}
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

        {/* Only show Skip and Reset buttons if started */}
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

      {/* Audio controls */}
      <div className="pomodoro-audio-controls">
        <button
          onClick={(e) => {
            e.stopPropagation()
            setMusicMode(!musicMode)
          }}
          className={`audio-mode-toggle ${musicMode ? 'active' : ''}`}
          title={musicMode ? 'Music Mode (Click to disable)' : 'Beeps Mode (Click for music)'}
        >
          <span className="mode-icon">{musicMode ? '🎵' : '🔔'}</span>
          <span className="mode-label">{musicMode ? 'Music' : 'Beeps'}</span>
          {playerStatus === 'loading' && <span className="loading-spinner">⏳</span>}
        </button>

        {musicMode && playerStatus === 'ready' && (
          <div className="volume-control">
            <span className="volume-icon">🔊</span>
            <input
              type="range"
              min="0"
              max="100"
              value={volume * 100}
              onChange={(e) => {
                e.stopPropagation()
                setVolume(parseFloat(e.target.value) / 100)
              }}
              className="volume-slider"
              title={`Volume: ${Math.round(volume * 100)}%`}
            />
            <span className="volume-value">{Math.round(volume * 100)}%</span>
          </div>
        )}
      </div>

      <div className="pomodoro-stats">
        <div className="stat">
          <span className="stat-label">Work:</span>
          <span className="stat-value">{POMODORO_CONFIG.workDuration / 60}m</span>
        </div>
        <div className="stat">
          <span className="stat-label">Short Break:</span>
          <span className="stat-value">{POMODORO_CONFIG.shortBreakDuration / 60}m</span>
        </div>
        <div className="stat">
          <span className="stat-label">Long Break:</span>
          <span className="stat-value">{POMODORO_CONFIG.longBreakDuration / 60}m</span>
        </div>
        <div className="stat">
          <span className="stat-label">Cycle:</span>
          <span className="stat-value">{POMODORO_CONFIG.sessionsBeforeLongBreak} sessions</span>
        </div>
      </div>

      <Confetti isActive={showConfetti} onComplete={() => setShowConfetti(false)} />
    </div>
  )
}

export default PomodoroTimer
