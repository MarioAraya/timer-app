import CircularProgress from './CircularProgress'
import Confetti from '../Confetti'

/**
 * HIIT Active Session View Component
 * Simplified: circle timer + controls only
 */
function HiitActiveView({
  currentRound,
  totalRounds,
  timeLeft,
  isWorkPhase,
  isPreparationPhase,
  isRunning,
  isFinished,
  currentSubtitle,
  showConfetti,
  setShowConfetti,
  roundProgress,
  phaseProgress,
  onBackClick,
  onStart,
  onPause,
  onReset,
  onSkip,
  onToggleFullscreen,
  isMaximized,
  musicMode,
  onToggleMusicMode,
  onCalibrate
}) {
  const getPhaseLabel = () => {
    if (isFinished) return 'DONE!'
    if (isPreparationPhase) return 'GET READY'
    return isWorkPhase ? 'WORK' : 'REST'
  }

  return (
    <div className={`hiit-active-view ${isWorkPhase || isPreparationPhase ? 'work-mode' : 'rest-mode'} ${isFinished ? 'finished-mode' : ''} ${isMaximized ? 'maximized' : ''}`}>
      {/* Minimal Header */}
      <header className="active-header">
        <button className="icon-btn" onClick={onBackClick} aria-label="Back">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>

        <div className="header-title">
          <span className="phase-label">{getPhaseLabel()}</span>
          <span className="round-label">Round {currentRound}/{totalRounds}</span>
        </div>

        <button className="icon-btn" onClick={onToggleFullscreen} aria-label="Fullscreen">
          <span className="material-symbols-outlined">
            {isMaximized ? 'fullscreen_exit' : 'fullscreen'}
          </span>
        </button>
      </header>

      {/* Main Content - Just the Circle */}
      <main className="active-main">
        <CircularProgress
          roundProgress={roundProgress}
          phaseProgress={phaseProgress}
          timeDisplay={Math.floor(timeLeft)}
          label={currentSubtitle || (isPreparationPhase ? 'GET READY' : isWorkPhase ? 'PUSH IT!' : 'BREATHE')}
          onClick={isRunning ? onPause : onStart}
          isRunning={isRunning}
          isFinished={isFinished}
          isWorkPhase={isWorkPhase}
          isPreparationPhase={isPreparationPhase}
        />
      </main>

      {/* Simple Footer Controls */}
      <footer className="active-footer">
        <div className="playback-controls">
          <button className="control-btn" onClick={onToggleMusicMode} aria-label={musicMode ? 'Music mode' : 'Beeps mode'}>
            <span className="material-symbols-outlined">
              {musicMode ? 'music_note' : 'volume_up'}
            </span>
          </button>

          <button className="control-btn" onClick={onReset} aria-label="Reset">
            <span className="material-symbols-outlined">refresh</span>
          </button>

          {!isRunning ? (
            <button
              className="control-btn primary"
              onClick={onStart}
              disabled={isFinished}
              aria-label="Play"
            >
              <span className="material-symbols-outlined">play_arrow</span>
            </button>
          ) : (
            <button className="control-btn primary" onClick={onPause} aria-label="Pause">
              <span className="material-symbols-outlined">pause</span>
            </button>
          )}

          <button
            className="control-btn"
            onClick={onSkip}
            disabled={isFinished}
            aria-label="Skip"
          >
            <span className="material-symbols-outlined">skip_next</span>
          </button>

          <button
            className="control-btn calibrate"
            onClick={onCalibrate}
            aria-label="Calibrate"
          >
            <span className="material-symbols-outlined">flag</span>
          </button>
        </div>

        {/* Progress indicator */}
        <div className="progress-bar-container">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${roundProgress}%` }}
            />
          </div>
        </div>
      </footer>

      <Confetti
        isActive={showConfetti}
        onComplete={() => setShowConfetti(false)}
      />
    </div>
  )
}

export default HiitActiveView
