import { useState, useEffect, useRef, useCallback } from 'preact/hooks'
import './PomodoroTimer.scss'
import { usePomodoroTimer } from '../hooks/usePomodoroTimer'
import { usePomodoroControls } from '../hooks/usePomodoroControls'
import { pomodoroAudio } from '../utils/audioUtils'
import { POMODORO_CONFIG, POMODORO_PRESETS, getBreakDuration, formatSessionInfo } from '../config/pomodoroConfig'
import Confetti from './shared/Confetti'
import CircularProgress from './shared/CircularProgress'
import { savePomodoroState, loadPomodoroState, clearPomodoroState } from '../utils/localStorage'
import PomodoroSetupView from './pomodoro/PomodoroSetupView'

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
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

  const defaultPreset = POMODORO_PRESETS.find(p => p.id === 'popular')
  const [pomodoroConfig, setPomodoroConfig] = useState(savedState?.config || defaultPreset)
  const [showSetup, setShowSetup] = useState(true)

  const [isMaximized, setIsMaximized] = useState(false)
  const [musicMode, setMusicMode] = useState(savedState?.musicMode ?? true)
  const [playerStatus, setPlayerStatus] = useState('idle')
  const [volume, setVolume] = useState(savedState?.volume || 0.5)
  const [stateRestored, setStateRestored] = useState(false)
  const [musicPlaying, setMusicPlaying] = useState(false)

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
    audioFunctions: pomodoroAudio,
    config: pomodoroConfig
  })

  const {
    currentSession, timeLeft, isWorkPhase, isRunning, isFinished,
    currentMessage, currentSubtitle, showConfetti,
    setCurrentSession, setTimeLeft, setIsWorkPhase, setIsRunning,
    setIsFinished, setCurrentMessage, setCurrentSubtitle, setShowConfetti,
    hasStarted
  } = timerState

  // Progress calculations
  const totalSessions = pomodoroConfig.sessionsBeforeLongBreak
  const totalProgress = isFinished
    ? 100
    : ((currentSession - 1 + (isWorkPhase ? 0 : 0.5)) / totalSessions) * 100

  const phaseDuration = isWorkPhase
    ? pomodoroConfig.workDuration
    : getBreakDuration(currentSession, pomodoroConfig)
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

  // Start music immediately if timer already running when music becomes ready
  useEffect(() => {
    if (musicMode && playerStatus === 'ready' && isRunning && isWorkPhase) {
      ignoreNextPlay.current = true
      pomodoroAudio.resume()
    }
  }, [playerStatus])

  // Update audio volume
  useEffect(() => {
    const audioPlayer = pomodoroAudio.getPlayer()
    if (audioPlayer) audioPlayer.volume = volume
  }, [volume])

  // Track music play/pause state for standalone play/pause button
  useEffect(() => {
    const audio = pomodoroAudio.getPlayer()
    if (!audio) return
    const onPlay = () => setMusicPlaying(true)
    const onPause = () => { if (!pomodoroAudio.shouldIgnorePause()) setMusicPlaying(false) }
    const onEnded = () => setMusicPlaying(false)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onEnded)
    return () => {
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', onEnded)
    }
  }, [playerStatus])

  // Standalone music play/pause toggle — independent of timer state.
  // Synchronous inside user gesture so Safari grants autoplay activation.
  const handleMusicToggle = (e) => {
    e.stopPropagation()
    if (!musicMode) {
      setMusicMode(true)
      pomodoroAudio.play()
      return
    }
    if (pomodoroAudio.isPlaying()) {
      pomodoroAudio.pause()
    } else if (pomodoroAudio.isReady()) {
      pomodoroAudio.resume()
    } else {
      pomodoroAudio.play()
    }
  }

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
      savePomodoroState({ currentSession, timeLeft, isWorkPhase, isRunning, isFinished, currentMessage, currentSubtitle, musicMode, volume, config: pomodoroConfig })
    }
  }, [isRunning, isFinished])

  // Keep latest state in ref so unmount cleanup reads fresh values
  // without re-subscribing on every tick (which paused audio every second)
  const latestStateRef = useRef({})
  latestStateRef.current = { currentSession, timeLeft, isWorkPhase, isRunning, isFinished, currentMessage, currentSubtitle, musicMode, volume, pomodoroConfig }

  // Save and pause on actual unmount only (empty deps)
  useEffect(() => {
    return () => {
      const s = latestStateRef.current
      if (s.musicMode && s.isWorkPhase) pomodoroAudio.pause()
      savePomodoroState({ currentSession: s.currentSession, timeLeft: s.timeLeft, isWorkPhase: s.isWorkPhase, isRunning: s.isRunning, isFinished: s.isFinished, currentMessage: s.currentMessage, currentSubtitle: s.currentSubtitle, musicMode: s.musicMode, volume: s.volume, config: s.pomodoroConfig })
    }
  }, [])

  const { handleStart, handlePause, handleReset, handleSkip } = usePomodoroControls({
    musicMode, playerStatus, audioFunctions: pomodoroAudio,
    isWorkPhase, currentSession, hasStarted,
    ignoreNextPlay, ignoreNextPause,
    setIsRunning, setIsFinished, setCurrentSession, setIsWorkPhase,
    setTimeLeft, setCurrentMessage, setCurrentSubtitle, setShowConfetti,
    storageFunctions,
    config: pomodoroConfig
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

  if (showSetup) {
    return (
      <PomodoroSetupView
        onStart={(config) => {
          clearPomodoroState()
          setIsRunning(false)
          setIsFinished(false)
          setCurrentSession(1)
          setIsWorkPhase(true)
          setTimeLeft(config.workDuration)
          setCurrentMessage(config.messages.preparation)
          setCurrentSubtitle(config.subtitles.preparation)
          setShowConfetti(false)
          setPomodoroConfig(config)
          setShowSetup(false)
        }}
        onBackClick={onBackClick}
      />
    )
  }

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
        <button
          className="fullscreen-button"
          onClick={handleFullscreen}
          data-testid="pomodoro-fullscreen"
        >
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
          timeDisplay={formatTime(timeLeft)}
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

        {/* Audio player — always visible */}
        <div className="audio-player-bar">
          <div className="audio-top-row">
            <button
              className={`audio-mode-btn ${musicMode ? 'active' : ''}`}
              data-testid="pomodoro-music-mode"
              onClick={(e) => {
                e.stopPropagation()
                const next = !musicMode
                setMusicMode(next)
                // If switching music ON while timer running, call play() NOW within
                // this user gesture to register browser autoplay activation
                if (next && isRunning && isWorkPhase) {
                  pomodoroAudio.play()
                }
              }}
            >
              <span className="material-symbols-outlined">
                {musicMode ? 'music_note' : 'music_off'}
              </span>
              <span className="audio-mode-label">
                {playerStatus === 'loading' ? 'Loading…' : musicMode ? 'Lofi Music' : 'Beeps'}
              </span>
            </button>

            {musicMode && (
              <div className="audio-track-controls">
                <button
                  className="track-btn"
                  data-testid="pomodoro-music-play"
                  onClick={handleMusicToggle}
                  disabled={playerStatus === 'loading'}
                  title={musicPlaying ? 'Pause music' : 'Play music'}
                >
                  <span className="material-symbols-outlined">
                    {musicPlaying ? 'pause' : 'play_arrow'}
                  </span>
                </button>
                <button
                  className="track-btn"
                  data-testid="pomodoro-music-repeat"
                  onClick={(e) => { e.stopPropagation(); pomodoroAudio.repeatTrack() }}
                  disabled={playerStatus !== 'ready'}
                  title="Repeat track"
                >
                  <span className="material-symbols-outlined">replay</span>
                </button>
                <button
                  className="track-btn"
                  data-testid="pomodoro-music-next"
                  onClick={(e) => { e.stopPropagation(); pomodoroAudio.nextTrack() }}
                  disabled={playerStatus !== 'ready'}
                  title="Next track"
                >
                  <span className="material-symbols-outlined">skip_next</span>
                </button>
              </div>
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
        </div>
      </footer>

      <div className="bg-glow top-left"></div>
      <div className="bg-glow bottom-right"></div>

      <Confetti isActive={showConfetti} onComplete={() => setShowConfetti(false)} />
    </div>
  )
}

export default PomodoroTimer
