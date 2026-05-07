import { useState, useEffect, useRef, useCallback } from 'preact/hooks'
import './PomodoroTimer.scss'
import { usePomodoroTimer } from '../hooks/usePomodoroTimer'
import { usePomodoroControls } from '../hooks/usePomodoroControls'
import { pomodoroAudio } from '../utils/audioUtils'
import { POMODORO_CONFIG, getBreakDuration, formatSessionInfo } from '../config/pomodoroConfig'
import Confetti from './Confetti'
import CircularProgress from './shared/CircularProgress'
import { savePomodoroState, loadPomodoroState, clearPomodoroState } from '../utils/localStorage'

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function PomodoroTimer({
  name = 'Pomodoro Timer',
  autoMaximize = false,
  autoStart = false,
  showBackButton = true,
  onBackClick
}) {
  const savedState = loadPomodoroState()
  const containerRef = useRef(null)

  const [isMaximized, setIsMaximized] = useState(autoMaximize)
  const [musicMode, setMusicMode] = useState(savedState?.musicMode ?? false)
  const [playerStatus, setPlayerStatus] = useState('idle')
  const [volume, setVolume] = useState(savedState?.volume || 0.5)
  const [stateRestored, setStateRestored] = useState(false)

  const ignoreNextPause = useRef(false)
  const ignoreNextPlay = useRef(false)

  const storageFunctions = {
    save: savePomodoroState,
    load: loadPomodoroState,
    clear: clearPomodoroState
  }

  const timerState = usePomodoroTimer({
    savedState,
    musicMode,
    playerStatus,
    audioFunctions: pomodoroAudio
  })

  const {
    currentSession, timeLeft, isWorkPhase, isRunning, isFinished,
    currentMessage, currentSubtitle, showConfetti,
    setCurrentSession, setTimeLeft, setIsWorkPhase, setIsRunning,
    setIsFinished, setCurrentMessage, setCurrentSubtitle, setShowConfetti,
    hasStarted
  } = timerState

  // Progress calculations
  const totalSessions = POMODORO_CONFIG.sessionsBeforeLongBreak
  const totalProgress = isFinished
    ? 100
    : ((currentSession - 1 + (isWorkPhase ? 0 : 0.5)) / totalSessions) * 100

  const phaseDuration = isWorkPhase
    ? POMODORO_CONFIG.workDuration
    : getBreakDuration(currentSession)
  const roundProgress = isFinished
    ? 100
    : ((phaseDuration - timeLeft) / phaseDuration) * 100

  const phaseLabel = isFinished ? 'DONE' : (isWorkPhase ? 'WORK' : 'BREAK')
  const modeClass = isWorkPhase || isFinished ? 'work-mode' : 'rest-mode'

  useEffect(() => {
    if (savedState) setStateRestored(true)
  }, [])

  // Initialize audio when music mode enabled
  useEffect(() => {
    if (musicMode && playerStatus === 'idle') {
      setPlayerStatus('loading')
      pomodoroAudio.initialize().then(ready => {
        setPlayerStatus(ready ? 'ready' : 'error')
      })
    }
  }, [musicMode, playerStatus])

  // Update audio volume
  useEffect(() => {
    const audioPlayer = pomodoroAudio.getPlayer()
    if (audioPlayer) audioPlayer.volume = volume
  }, [volume])

  // Sync audio play/pause events with timer
  useEffect(() => {
    if (!musicMode || playerStatus !== 'ready') return

    const handleAudioPause = () => {
      if (ignoreNextPause.current) { ignoreNextPause.current = false; return }
      if (pomodoroAudio.shouldIgnorePause()) return
      if (isRunning && isWorkPhase && hasStarted()) setIsRunning(false)
    }

    const handleAudioPlay = () => {
      if (ignoreNextPlay.current) { ignoreNextPlay.current = false; return }
      if (!isRunning && !isFinished && isWorkPhase && hasStarted()) setIsRunning(true)
    }

    const audioPlayer = pomodoroAudio.getPlayer()
    if (audioPlayer) {
      audioPlayer.addEventListener('pause', handleAudioPause)
      audioPlayer.addEventListener('play', handleAudioPlay)

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
    if (!stateRestored && savedState) return
    if (!isRunning && hasStarted()) {
      savePomodoroState({ currentSession, timeLeft, isWorkPhase, isRunning, isFinished, currentMessage, currentSubtitle, musicMode, volume })
    }
  }, [isRunning, isFinished])

  // Save on unmount
  useEffect(() => {
    return () => {
      if (musicMode && isWorkPhase) pomodoroAudio.pause()
      savePomodoroState({ currentSession, timeLeft, isWorkPhase, isRunning, isFinished, currentMessage, currentSubtitle, musicMode, volume })
    }
  }, [currentSession, timeLeft, isWorkPhase, isRunning, isFinished, currentMessage, currentSubtitle, musicMode, volume])

  const { handleStart, handlePause, handleReset, handleSkip } = usePomodoroControls({
    musicMode, playerStatus, audioFunctions: pomodoroAudio,
    isWorkPhase, currentSession, hasStarted,
    ignoreNextPlay, ignoreNextPause,
    setIsRunning, setIsFinished, setCurrentSession, setIsWorkPhase,
    setTimeLeft, setCurrentMessage, setCurrentSubtitle, setShowConfetti,
    storageFunctions
  })

  // Native fullscreen toggle
  const handleFullscreen = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const isNative = document.fullscreenElement || document.webkitFullscreenElement
    if (!isNative) {
      const req = el.requestFullscreen || el.webkitRequestFullscreen
      if (req) {
        req.call(el).catch(() => setIsMaximized(v => !v))
      } else {
        setIsMaximized(v => !v)
      }
    } else {
      const exit = document.exitFullscreen || document.webkitExitFullscreen
      if (exit) exit.call(document)
      else setIsMaximized(v => !v)
    }
  }, [])

  // Sync CSS maximized with native fullscreen
  useEffect(() => {
    const handler = () => {
      const isNative = !!(document.fullscreenElement || document.webkitFullscreenElement)
      if (isNative !== isMaximized) setIsMaximized(isNative)
    }
    document.addEventListener('fullscreenchange', handler)
    document.addEventListener('webkitfullscreenchange', handler)
    return () => {
      document.removeEventListener('fullscreenchange', handler)
      document.removeEventListener('webkitfullscreenchange', handler)
    }
  }, [isMaximized])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT') return
      if (e.key === 'f' || e.key === 'F') { e.preventDefault(); handleFullscreen() }
      if (e.key === ' ') {
        e.preventDefault()
        if (isFinished) return
        isRunning ? handlePause() : handleStart()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [handleFullscreen, isRunning, isFinished, handlePause, handleStart])

  const sessionDisplay = isFinished
    ? 'Complete!'
    : `Session ${currentSession} of ${totalSessions}`

  return (
    <div
      ref={containerRef}
      className={`pomodoro-timer ${modeClass} ${isFinished ? 'finished-mode' : ''} ${isMaximized ? 'maximized' : ''}`}
    >
      {/* Header */}
      <header className="pomodoro-header">
        {onBackClick && (
          <button className="back-button" onClick={(e) => { e.stopPropagation(); onBackClick() }}>
            <span className="material-symbols-outlined">arrow_back_ios</span>
          </button>
        )}
        <div className="header-center">
          <span className="session-label">POMODORO</span>
          <h2 className="round-info">{sessionDisplay}</h2>
        </div>
        <button className="fullscreen-button" onClick={handleFullscreen}>
          <span className="material-symbols-outlined">
            {isMaximized ? 'fullscreen_exit' : 'fullscreen'}
          </span>
        </button>
      </header>

      {/* Main */}
      <main className="pomodoro-main">
        <div className="stats-hud">
          <div className="stat-card elapsed">
            <span className="stat-label">Session</span>
            <span className="stat-value">{currentSession}/{totalSessions}</span>
          </div>
          <div className="stat-card mode">
            <span className="stat-label">Phase</span>
            <span className="stat-value">{phaseLabel}</span>
          </div>
        </div>

        <CircularProgress
          totalProgress={totalProgress}
          roundProgress={roundProgress}
          timeDisplay={hasStarted() ? formatTime(timeLeft) : '25:00'}
          label="sec"
          onClick={isRunning ? handlePause : (!isFinished ? handleStart : undefined)}
          isRunning={isRunning}
          isFinished={isFinished}
        />

        <div className="set-progress">
          <div className="progress-header">
            <span>Cycle progress</span>
            <span>{Math.round(totalProgress)}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${totalProgress}%` }}></div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="pomodoro-footer">
        <div className="motivational-text">
          {currentMessage && (
            <h3>{currentMessage}</h3>
          )}
          {currentSubtitle && hasStarted() && (
            <p className="subtitle-text">{currentSubtitle}</p>
          )}
        </div>

        <div className="playback-controls">
          <button
            className="control-button secondary"
            onClick={(e) => { e.stopPropagation(); setMusicMode(!musicMode) }}
            title={musicMode ? 'Music on' : 'Music off'}
          >
            <span className="material-symbols-outlined">
              {musicMode ? 'music_note' : 'volume_up'}
            </span>
            {playerStatus === 'loading' && <span className="loading-dot">●</span>}
          </button>

          <button
            className="control-button secondary"
            onClick={(e) => { e.stopPropagation(); handleReset() }}
            title="Reset"
          >
            <span className="material-symbols-outlined">refresh</span>
          </button>

          {!isRunning ? (
            <button
              className="control-button primary"
              onClick={(e) => { e.stopPropagation(); handleStart() }}
              disabled={isFinished}
            >
              <span className="material-symbols-outlined filled">play_arrow</span>
            </button>
          ) : (
            <button
              className="control-button primary"
              onClick={(e) => { e.stopPropagation(); handlePause() }}
            >
              <span className="material-symbols-outlined filled">pause</span>
            </button>
          )}

          {hasStarted() && (
            <button
              className="control-button secondary"
              onClick={(e) => { e.stopPropagation(); handleSkip() }}
              disabled={isFinished}
              title="Skip phase"
            >
              <span className="material-symbols-outlined">skip_next</span>
            </button>
          )}
        </div>

        {musicMode && playerStatus === 'ready' && (
          <div className="volume-row">
            <span className="material-symbols-outlined vol-icon">volume_up</span>
            <input
              type="range"
              min="0"
              max="100"
              value={volume * 100}
              onChange={(e) => { e.stopPropagation(); setVolume(parseFloat(e.target.value) / 100) }}
              onClick={(e) => e.stopPropagation()}
              className="volume-slider"
            />
            <span className="volume-value">{Math.round(volume * 100)}%</span>
          </div>
        )}
      </footer>

      <div className="bg-glow top-left"></div>
      <div className="bg-glow bottom-right"></div>

      <Confetti isActive={showConfetti} onComplete={() => setShowConfetti(false)} />
    </div>
  )
}

export default PomodoroTimer
