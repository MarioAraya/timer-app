import { useEffect, useCallback, useRef } from 'preact/hooks'
import CircularProgress from './CircularProgress'
import Confetti from './Confetti'
import { useLang } from '../../context/LanguageContext'
import './WorkoutActiveView.scss'

/**
 * Shared Workout Active View Component
 * Used by both HIIT and Tabata timers
 */
function WorkoutActiveView({
  currentRound, totalRounds, timeLeft, totalElapsed,
  isWorkPhase, isPreparationPhase, isRunning, isFinished,
  currentSubtitle, showConfetti, setShowConfetti,
  totalProgress, roundProgress,
  onBackClick, onStart, onPause, onReset, onSkip,
  onToggleFullscreen, isMaximized,
  musicMode, onToggleMusicMode,
  themeClass,
  phaseLabel,
  motivationalContent,
  exerciseName,
}) {
  const { t } = useLang()
  const containerRef = useRef(null)

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Native fullscreen toggle with CSS fallback
  const handleFullscreen = useCallback(() => {
    const el = containerRef.current
    if (!el) return

    const doc = document
    const isNativeFullscreen = doc.fullscreenElement || doc.webkitFullscreenElement

    if (!isNativeFullscreen) {
      const request = el.requestFullscreen || el.webkitRequestFullscreen
      if (request) {
        request.call(el).catch(() => {
          // Fallback to CSS maximized if native fails
          onToggleFullscreen()
        })
      } else {
        onToggleFullscreen()
      }
    } else {
      const exit = doc.exitFullscreen || doc.webkitExitFullscreen
      if (exit) {
        exit.call(doc)
      } else {
        onToggleFullscreen()
      }
    }
  }, [onToggleFullscreen])

  // Toggle fullscreen with F key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault()
        handleFullscreen()
      }
      if (e.key === ' ') {
        e.preventDefault()
        if (isFinished) return
        isRunning ? onPause() : onStart()
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [handleFullscreen, isRunning, isFinished, onPause, onStart])

  // Sync isMaximized state with native fullscreen changes
  useEffect(() => {
    const handleChange = () => {
      const isNative = !!(document.fullscreenElement || document.webkitFullscreenElement)
      // If native fullscreen state doesn't match isMaximized, sync it
      if (isNative !== isMaximized) {
        onToggleFullscreen()
      }
    }
    document.addEventListener('fullscreenchange', handleChange)
    document.addEventListener('webkitfullscreenchange', handleChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleChange)
      document.removeEventListener('webkitfullscreenchange', handleChange)
    }
  }, [isMaximized, onToggleFullscreen])

  const modeClass = isWorkPhase || isPreparationPhase ? 'work-mode' : 'rest-mode'
  const hasEverStarted = isRunning || totalElapsed > 0

  return (
    <div
      ref={containerRef}
      className={`workout-active-view ${themeClass} ${modeClass} ${isFinished ? 'finished-mode' : ''} ${isMaximized ? 'maximized' : ''}`}
    >
      {/* Header */}
      <header className="active-header">
        <button data-testid="active-back-btn" className="back-button" onClick={onBackClick}>
          <span className="material-symbols-outlined">arrow_back_ios</span>
        </button>
        <div className="header-center">
          <span className="session-label">
            {isFinished
              ? t(`${themeClass.includes('hiit') ? 'hiit' : 'tabata'}.finishedTitle`)
              : t('active.activeSession')}
          </span>
          <h2 className="round-info">
            {isFinished
              ? t('active.completedRounds').replace('{n}', totalRounds)
              : `Round ${currentRound} of ${totalRounds}`}
          </h2>
        </div>
        <button className="fullscreen-button" onClick={handleFullscreen}>
          <span className="material-symbols-outlined">
            {isMaximized ? 'fullscreen_exit' : 'fullscreen'}
          </span>
        </button>
      </header>

      <main className="active-main">
        {/* Stats HUD */}
        <div className="stats-hud">
          <div className="stat-card elapsed">
            <span className="stat-label">{t('active.totalElapsed')}</span>
            <span className="stat-value">{formatTime(totalElapsed)}</span>
          </div>
          <div className={`stat-card mode ${isWorkPhase || isPreparationPhase ? 'work' : 'rest'}`}>
            <span className="stat-label">{t('active.currentMode')}</span>
            <span className="stat-value">{phaseLabel}</span>
          </div>
        </div>

        {/* Circular Progress */}
        <CircularProgress
          totalProgress={totalProgress}
          roundProgress={roundProgress}
          timeDisplay={Math.floor(timeLeft)}
          label={t('active.seconds')}
          onClick={isRunning ? onPause : onStart}
          isRunning={isRunning}
          isFinished={isFinished}
        />

        {/* Set Progress Bar */}
        <div className="set-progress">
          <div className="progress-header">
            <span>{t('active.setProgress')}</span>
            <span>{Math.round(totalProgress)}%</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${totalProgress}%` }}
            ></div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="active-footer">
        {/* Exercise name (HIIT) */}
        {exerciseName && (isWorkPhase || isPreparationPhase) && (
          <div className="exercise-name">{exerciseName}</div>
        )}

        {/* Motivational Text */}
        <div className="motivational-text">
          {currentSubtitle ? (
            <h3 className="subtitle-text">{currentSubtitle}</h3>
          ) : motivationalContent ? (
            <h3>
              {motivationalContent.text}{' '}
              <span className="highlight">{motivationalContent.highlight}</span>
            </h3>
          ) : null}
        </div>

        {/* Controls */}
        <div className="playback-controls">
          <button
            className="control-button secondary"
            onClick={onToggleMusicMode}
          >
            <span className="material-symbols-outlined">
              {musicMode ? 'music_note' : 'volume_up'}
            </span>
            <span className="btn-tooltip">{musicMode ? t('active.controls.musicOn') : t('active.controls.beepsOn')}</span>
          </button>

          {hasEverStarted && (
            <button
              data-testid="ctrl-reset"
              className="control-button secondary"
              onClick={onReset}
            >
              <span className="material-symbols-outlined">refresh</span>
              <span className="btn-tooltip">{t('active.controls.reset')}</span>
            </button>
          )}

          {!isRunning ? (
            <button
              data-testid="ctrl-start"
              className="control-button primary"
              onClick={onStart}
              disabled={isFinished}
            >
              <span className="material-symbols-outlined filled">play_arrow</span>
              <span className="btn-tooltip">{t('active.controls.start')}</span>
            </button>
          ) : (
            <button data-testid="ctrl-pause" className="control-button primary" onClick={onPause}>
              <span className="material-symbols-outlined filled">pause</span>
              <span className="btn-tooltip">{t('active.controls.pause')}</span>
            </button>
          )}

          {hasEverStarted && (
            <button
              className="control-button secondary"
              onClick={onSkip}
              disabled={isFinished}
            >
              <span className="material-symbols-outlined">skip_next</span>
              <span className="btn-tooltip">{t('active.controls.skip')}</span>
            </button>
          )}
        </div>
      </footer>

      {/* Background glows */}
      <div className="bg-glow top-left"></div>
      <div className="bg-glow bottom-right"></div>

      <Confetti
        isActive={showConfetti}
        onComplete={() => setShowConfetti(false)}
      />
    </div>
  )
}

export default WorkoutActiveView
