import { POMODORO_CONFIG } from '../../config/pomodoroConfig'

/**
 * Pomodoro Stats Component
 * Shows timer configuration details
 */
function PomodoroStats() {
  return (
    <div className="pomodoro-stats">
      <div className="stat">
        <span className="stat-label">Work:</span>
        <span className="stat-value">{POMODORO_CONFIG.workDuration / 60}m</span>
      </div>
      <div className="stat">
        <span className="stat-label">Short Break:</span>
        <span className="stat-value">{POMODORO_CONFIG.shortBreakDuration / 60}m</span>
      </div>
      <div className="stat">
        <span className="stat-label">Long Break:</span>
        <span className="stat-value">{POMODORO_CONFIG.longBreakDuration / 60}m</span>
      </div>
      <div className="stat">
        <span className="stat-label">Cycle:</span>
        <span className="stat-value">{POMODORO_CONFIG.sessionsBeforeLongBreak} sessions</span>
      </div>
    </div>
  )
}

export default PomodoroStats
