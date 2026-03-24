import { calculateProgress } from '../../utils/timerHelpers'
import { formatSessionInfo } from '../../config/pomodoroConfig'
import { POMODORO_CONFIG } from '../../config/pomodoroConfig'

/**
 * Pomodoro Progress Component
 * Shows session progress bar
 */
function PomodoroProgress({
  hasStarted,
  currentSession,
  isWorkPhase
}) {
  const getProgressPercentage = () => {
    if (!hasStarted) return 0

    const totalSessions = POMODORO_CONFIG.sessionsBeforeLongBreak
    const completedSessions = currentSession - 1
    const currentPhaseProgress = isWorkPhase ? 0 : 0.5

    return calculateProgress(completedSessions + currentPhaseProgress, totalSessions)
  }

  if (!hasStarted) return null

  return (
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
  )
}

export default PomodoroProgress
