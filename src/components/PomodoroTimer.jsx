import { useState, useEffect, useRef, useCallback } from 'preact/hooks'
import './PomodoroTimer.scss'
import { usePomodoroTimer } from '../hooks/usePomodoroTimer'
import { usePomodoroControls } from '../hooks/usePomodoroControls'
import { usePomodoroAudioSync } from '../hooks/usePomodoroAudioSync'
import { useFloatingTimer } from '../hooks/useFloatingTimer'
import { pomodoroAudio } from '../utils/audioUtils'
import { POMODORO_PRESETS, getBreakDuration } from '../config/pomodoroConfig'
import Confetti from './shared/Confetti'
import CircularProgress from './shared/CircularProgress'
import FloatingTimerContent from './shared/FloatingTimerContent'
import { savePomodoroState, loadPomodoroState, clearPomodoroState } from '../utils/localStorage'
import PomodoroSetupView from './pomodoro/PomodoroSetupView'
import PomodoroAudioBar from './pomodoro/PomodoroAudioBar'
import { useLang } from '../context/LanguageContext'

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
  const { t } = useLang()
  const savedState = loadPomodoroState()
  const containerRef = useRef(null)

  const defaultPreset = POMODORO_PRESETS.find(p => p.id === 'popular')
  const [pomodoroConfig, setPomodoroConfig] = useState(savedState?.config || defaultPreset)
  // Config lives in a modal over the active view — the cog opens it
  const [showSetup, setShowSetup] = useState(false)

  const [isMaximized, setIsMaximized] = useState(false)
  const [musicMode, setMusicMode] = useState(savedState?.musicMode ?? true)
  const [playerStatus, setPlayerStatus] = useState('idle')
  const [volume, setVolume] = useState(savedState?.volume || 0.5)
  const [stateRestored, setStateRestored] = useState(false)

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

  const phaseLabel = isFinished
    ? t('pomodoro.active.phases.done')
    : (isWorkPhase ? t('pomodoro.active.phases.work') : t('pomodoro.active.phases.break'))
  const modeClass = isWorkPhase || isFinished ? 'work-mode' : 'rest-mode'

  useEffect(() => {
    if (savedState) setStateRestored(true)
  }, [])

  const { musicPlaying, handleMusicToggle, ignoreNextPause, ignoreNextPlay } = usePomodoroAudioSync({
    musicMode, setMusicMode,
    playerStatus, setPlayerStatus,
    volume, setVolume,
    isRunning, setIsRunning, isFinished, isWorkPhase, hasStarted,
    audioFunctions: pomodoroAudio,
  })

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
    ? t('pomodoro.active.complete')
    : t('pomodoro.active.sessionOf').replace('{current}', currentSession).replace('{total}', totalSessions)

  const { isFloating, isSupported: pipSupported, toggle: togglePip } = useFloatingTimer(
    <FloatingTimerContent
      phaseLabel={phaseLabel}
      timeDisplay={formatTime(timeLeft)}
      isRunning={isRunning}
      isFinished={isFinished}
      onToggle={isRunning ? handlePause : handleStart}
    />
  )

  const handleApplyConfig = (config) => {
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
  }

  const handleOpenSetup = () => {
    if (isRunning) handlePause()
    setShowSetup(true)
  }

  return (
    <div
      ref={containerRef}
      className={`pomodoro-timer ${modeClass} ${isFinished ? 'finished-mode' : ''} ${isMaximized ? 'maximized' : ''}`}
    >
      {showSetup && (
        <PomodoroSetupView
          onApply={handleApplyConfig}
          onClose={() => setShowSetup(false)}
        />
      )}

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
          data-testid="pomodoro-settings-btn"
          className="fullscreen-button"
          onClick={handleOpenSetup}
          title={t('active.controls.settings')}
        >
          <span className="material-symbols-outlined">settings</span>
        </button>
        {pipSupported && (
          <button
            className="fullscreen-button"
            onClick={togglePip}
            data-testid="pomodoro-floating-window"
            title={t('active.controls.floatingWindow')}
          >
            <span className="material-symbols-outlined">
              {isFloating ? 'picture_in_picture' : 'picture_in_picture_alt'}
            </span>
          </button>
        )}
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
            <span className="stat-label">{t('pomodoro.active.session')}</span>
            <span className="stat-value">{currentSession}/{totalSessions}</span>
          </div>
          <div className="stat-card mode">
            <span className="stat-label">{t('pomodoro.active.phase')}</span>
            <span className="stat-value">{phaseLabel}</span>
          </div>
        </div>

        <CircularProgress
          totalProgress={totalProgress}
          roundProgress={roundProgress}
          timeDisplay={formatTime(timeLeft)}
          label={t('pomodoro.active.sec')}
          onClick={isRunning ? handlePause : (!isFinished ? handleStart : undefined)}
          isRunning={isRunning}
          isFinished={isFinished}
        />

        <div className="set-progress">
          <div className="progress-header">
            <span>{t('pomodoro.active.cycleProgress')}</span>
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
            <h3>{t(currentMessage)}</h3>
          )}
          {currentSubtitle && hasStarted() && (
            <p className="subtitle-text">{t(currentSubtitle)}</p>
          )}
        </div>

        <div className="playback-controls">
          <button
            className="control-button secondary"
            onClick={(e) => { e.stopPropagation(); handleReset() }}
            title={t('active.controls.reset')}
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
              title={t('active.controls.skip')}
            >
              <span className="material-symbols-outlined">skip_next</span>
            </button>
          )}
        </div>

        {/* Audio player — always visible */}
        <PomodoroAudioBar
          musicMode={musicMode}
          setMusicMode={setMusicMode}
          isRunning={isRunning}
          isWorkPhase={isWorkPhase}
          playerStatus={playerStatus}
          musicPlaying={musicPlaying}
          handleMusicToggle={handleMusicToggle}
          volume={volume}
          setVolume={setVolume}
          audioFunctions={pomodoroAudio}
          t={t}
        />
      </footer>

      <div className="bg-glow top-left"></div>
      <div className="bg-glow bottom-right"></div>

      <Confetti isActive={showConfetti} onComplete={() => setShowConfetti(false)} />
    </div>
  )
}

export default PomodoroTimer
