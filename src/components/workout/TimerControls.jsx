/**
 * Timer Controls Component
 * Shows start/pause, skip, and reset buttons
 */
function TimerControls({
  isRunning,
  isFinished,
  isPreparationPhase,
  timeLeft,
  preparationTime,
  musicMode,
  playerStatus,
  hasStarted,
  showSkipButton,
  handleStart,
  handlePause,
  handleSkip,
  handleReset
}) {
  return (
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

      {hasStarted && (
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
  )
}

export default TimerControls
