import { formatTime } from '../../utils/timerHelpers'

/**
 * Pomodoro Display Component
 * Shows phase indicator, time, and message
 */
function PomodoroDisplay({
  hasStarted,
  isWorkPhase,
  timeLeft,
  currentMessage,
  currentSubtitle
}) {
  return (
    <div className="pomodoro-central-content">
      <div className="pomodoro-phase">
        <div className={`phase-indicator ${isWorkPhase ? 'work' : 'break'}`}>
          {!hasStarted ? 'POMODORO' : isWorkPhase ? 'WORK' : 'BREAK'}
        </div>
      </div>

      <div className="pomodoro-display">
        {!hasStarted ? '25:00' : formatTime(timeLeft)}
      </div>

      <div className="pomodoro-message">{currentMessage}</div>

      {currentSubtitle && hasStarted && (
        <div className="pomodoro-subtitle">{currentSubtitle}</div>
      )}
    </div>
  )
}

export default PomodoroDisplay
