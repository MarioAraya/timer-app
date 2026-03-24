import { formatTimeSeconds } from '../../utils/timerHelpers'

/**
 * Timer Display Component
 * Shows phase indicator, time, message, and subtitle
 */
function TimerDisplay({
  hasStarted,
  isPreparationPhase,
  isWorkPhase,
  isFinished,
  isRunning,
  timeLeft,
  currentMessage,
  currentSubtitle,
  messages
}) {
  return (
    <div className="timer-central-content">
      <div className="timer-phase">
        <div className={`phase-indicator ${isPreparationPhase ? 'work' : isWorkPhase ? 'work' : 'rest'}`}>
          {!hasStarted
            ? messages.initial
            : (isPreparationPhase ? 'PREP' : isWorkPhase ? 'WORK' : 'REST')}
        </div>
      </div>

      <div className="timer-display">
        {!hasStarted
          ? messages.initialDisplay
          : (isRunning || isFinished || hasStarted ? formatTimeSeconds(timeLeft) : '--:--')}
      </div>

      <div className="timer-message">
        {currentMessage}
      </div>

      {currentSubtitle && hasStarted && !isFinished && (
        <div className="timer-subtitle">
          {currentSubtitle}
        </div>
      )}
    </div>
  )
}

export default TimerDisplay
