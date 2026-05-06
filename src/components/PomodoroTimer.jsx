import { useState, useEffect, useRef } from 'preact/hooks'
import './PomodoroTimer.scss'
import { useDoubleClick } from '../hooks/useDoubleClick'
import { usePomodoroTimer } from '../hooks/usePomodoroTimer'
import { usePomodoroControls } from '../hooks/usePomodoroControls'
import { isClickOnButton } from '../utils/timerHelpers'
import { pomodoroAudio } from '../utils/audioUtils'
import Confetti from './Confetti'
import PomodoroDisplay from './pomodoro/PomodoroDisplay'
import PomodoroProgress from './pomodoro/PomodoroProgress'
import PomodoroStats from './pomodoro/PomodoroStats'
import { savePomodoroState, loadPomodoroState, clearPomodoroState } from '../utils/localStorage'

function PomodoroTimer({
  name = 'Pomodoro Timer',
  autoMaximize = false,
  autoStart = false,
  showBackButton = true,
  onBackClick
}) {
  // Load saved state
  const savedState = loadPomodoroState()

  // UI state
  const [isMaximized, setIsMaximized] = useState(autoMaximize)
  const [musicMode, setMusicMode] = useState(savedState?.musicMode ?? false)
  const [playerStatus, setPlayerStatus] = useState('idle')
  const [volume, setVolume] = useState(savedState?.volume || 0.5)
  const [stateRestored, setStateRestored] = useState(false)

  const ignoreNextPause = useRef(false)
  const ignoreNextPlay = useRef(false)

  const audioFunctions = pomodoroAudio

  // Storage functions object
  const storageFunctions = {
    save: savePomodoroState,
    load: loadPomodoroState,
    clear: clearPomodoroState
  }

  // Pomodoro timer logic hook
  const timerState = usePomodoroTimer({
    savedState,
    musicMode,
    playerStatus,
    audioFunctions
  })

  const {
    currentSession,
    timeLeft,
    isWorkPhase,
    isRunning,
    isFinished,
    currentMessage,
    currentSubtitle,
    showConfetti,
    setCurrentSession,
    setTimeLeft,
    setIsWorkPhase,
    setIsRunning,
    setIsFinished,
    setCurrentMessage,
    setCurrentSubtitle,
    setShowConfetti,
    hasStarted
  } = timerState

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
      pomodoroAudio.initialize().then((ready) => {
        setPlayerStatus(ready ? 'ready' : 'error')
      })
    }
  }, [musicMode, playerStatus])

  // Update audio volume
  useEffect(() => {
    const audioPlayer = pomodoroAudio.getPlayer()
    if (audioPlayer) {
      audioPlayer.volume = volume
    }
  }, [volume])

  // Listen for audio pause/play events
  useEffect(() => {
    if (!musicMode || playerStatus !== 'ready') return

    const handleAudioPause = (event) => {
      if (ignoreNextPause.current) {
        ignoreNextPause.current = false
        return
      }

      if (pomodoroAudio.shouldIgnorePause()) {
        return
      }

      if (isRunning && isWorkPhase && hasStarted()) {
        setIsRunning(false)
      }
    }

    const handleAudioPlay = (event) => {
      if (ignoreNextPlay.current) {
        ignoreNextPlay.current = false
        return
      }

      if (!isRunning && !isFinished && isWorkPhase && hasStarted()) {
        setIsRunning(true)
      }
    }

    const audioPlayer = pomodoroAudio.getPlayer()
    if (audioPlayer) {
      audioPlayer.addEventListener('pause', handleAudioPause)
      audioPlayer.addEventListener('play', handleAudioPlay)

      // Setup Media Session API
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: 'Pomodoro Focus',
          artist: 'Timer App',
          album: 'Productivity',
        })

        navigator.mediaSession.setActionHandler('play', () => {
          if (!isRunning && !isFinished && isWorkPhase && playerStatus === 'ready') {
            ignoreNextPlay.current = true
            pomodoroAudio.resume()
            setIsRunning(true)
          }
        })

        navigator.mediaSession.setActionHandler('pause', () => {
          if (isRunning && isWorkPhase) {
            ignoreNextPause.current = true
            pomodoroAudio.pause()
            setIsRunning(false)
          }
        })
      }

      return () => {
        audioPlayer.removeEventListener('pause', handleAudioPause)
        audioPlayer.removeEventListener('play', handleAudioPlay)

        if ('mediaSession' in navigator) {
          navigator.mediaSession.setActionHandler('play', null)
          navigator.mediaSession.setActionHandler('pause', null)
        }
      }
    }
  }, [musicMode, playerStatus, isRunning, isFinished, isWorkPhase])

  // Save state when paused
  useEffect(() => {
    if (!stateRestored && savedState) {
      return
    }

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
    }
  }, [isRunning, isFinished])

  // Save state on unmount
  useEffect(() => {
    return () => {
      if (musicMode && isWorkPhase) {
        pomodoroAudio.pause()
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
    }
  }, [currentSession, timeLeft, isWorkPhase, isRunning, isFinished, currentMessage, currentSubtitle, musicMode, volume])

  // Pomodoro controls hook
  const { handleStart, handlePause, handleReset, handleSkip } = usePomodoroControls({
    musicMode,
    playerStatus,
    audioFunctions,
    isWorkPhase,
    currentSession,
    hasStarted,
    ignoreNextPlay,
    ignoreNextPause,
    setIsRunning,
    setIsFinished,
    setCurrentSession,
    setIsWorkPhase,
    setTimeLeft,
    setCurrentMessage,
    setCurrentSubtitle,
    setShowConfetti,
    storageFunctions
  })

  // Double click to maximize
  const handleDoubleClick = useDoubleClick(() => {
    setIsMaximized(!isMaximized)
  })

  // Container click handler
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

  return (
    <div
      className={`pomodoro-timer ${isFinished ? 'finished' : ''} ${isWorkPhase ? 'work-phase' : 'break-phase'} ${isMaximized ? 'maximized' : ''}`}
      onClick={handleContainerClick}
    >
      {/* Back button */}
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

      {/* Progress bar */}
      <PomodoroProgress
        hasStarted={hasStarted()}
        currentSession={currentSession}
        isWorkPhase={isWorkPhase}
      />

      {/* Central content */}
      <PomodoroDisplay
        hasStarted={hasStarted()}
        isWorkPhase={isWorkPhase}
        timeLeft={timeLeft}
        currentMessage={currentMessage}
        currentSubtitle={currentSubtitle}
      />

      {/* Controls */}
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

      <PomodoroStats />

      <Confetti isActive={showConfetti} onComplete={() => setShowConfetti(false)} />
    </div>
  )
}

export default PomodoroTimer
