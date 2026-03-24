import { calculateProgress } from '../../utils/timerHelpers'

/**
 * Progress Bar Component
 * Shows workout progress and current round
 */
function ProgressBar({
  hasStarted,
  currentRound,
  totalRounds,
  isPreparationPhase,
  isWorkPhase,
  hasFinalRest
}) {
  const getProgressPercentage = () => {
    if (isPreparationPhase) return 0
    const totalPhases = hasFinalRest ? (totalRounds * 2) : (totalRounds * 2 - 1)
    const completedPhases = (currentRound - 1) * 2 + (isWorkPhase ? 0 : 1)
    return calculateProgress(completedPhases, totalPhases)
  }

  if (!hasStarted) return null

  return (
    <div className="timer-progress">
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${getProgressPercentage()}%` }}
        ></div>
      </div>
      <div className="round-info">
        Round {currentRound} / {totalRounds}
      </div>
    </div>
  )
}

export default ProgressBar
