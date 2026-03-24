/**
 * Circular Progress Component
 * - Outer ring: total workout progress (12 rounds)
 * - Inner ring: current phase progress (work/rest countdown)
 */
function CircularProgress({
  roundProgress = 0,
  phaseProgress = 0,
  timeDisplay,
  label = '',
  onClick,
  isRunning,
  isFinished,
  isWorkPhase = true,
  isPreparationPhase = false
}) {
  const size = 320
  const outerRadius = 152
  const innerRadius = 110
  const outerStroke = 8
  const innerStroke = 14

  const outerCirc = 2 * Math.PI * outerRadius
  const innerCirc = 2 * Math.PI * innerRadius

  // Calculate stroke offsets (0 = full, circumference = empty)
  const outerOffset = outerCirc * (1 - roundProgress / 100)
  const innerOffset = innerCirc * (1 - phaseProgress / 100)

  const phaseClass = isPreparationPhase ? 'prep' : (isWorkPhase ? 'work' : 'rest')

  return (
    <div
      className={`circular-progress-container ${isRunning ? 'running' : 'paused'}`}
      onClick={() => onClick && !isFinished && onClick()}
    >
      <svg viewBox={`0 0 ${size} ${size}`} className="circular-progress-svg">
        {/* Outer ring - background */}
        <circle
          cx={size/2} cy={size/2} r={outerRadius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={outerStroke}
        />

        {/* Outer ring - progress (total rounds) */}
        <circle
          cx={size/2} cy={size/2} r={outerRadius}
          fill="none"
          className="progress-ring-fill outer"
          strokeWidth={outerStroke}
          strokeDasharray={outerCirc}
          strokeDashoffset={outerOffset}
          strokeLinecap="round"
          style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
        />

        {/* Inner ring - background */}
        <circle
          cx={size/2} cy={size/2} r={innerRadius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={innerStroke}
        />

        {/* Inner ring - progress (current phase) */}
        <circle
          cx={size/2} cy={size/2} r={innerRadius}
          fill="none"
          className={`progress-ring-fill inner ${phaseClass}`}
          strokeWidth={innerStroke}
          strokeDasharray={innerCirc}
          strokeDashoffset={innerOffset}
          strokeLinecap="round"
          style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
        />
      </svg>

      {/* Center content */}
      <div className="circular-progress-content">
        <span className="progress-time">{timeDisplay}</span>
        {label && <span className="progress-label">{label}</span>}
      </div>
    </div>
  )
}

export default CircularProgress
