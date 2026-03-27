/**
 * Circular Progress Component
 * - Outer ring: total workout progress
 * - Inner ring: current round progress
 */
function CircularProgress({
  totalProgress = 0,
  roundProgress = 0,
  timeDisplay,
  label = '',
  onClick,
  isRunning,
  isFinished
}) {
  const size = 400
  const center = size / 2

  const outerRadius = 185
  const outerStroke = 12
  const innerRadius = 145
  const innerStroke = 18

  const outerCirc = 2 * Math.PI * outerRadius
  const innerCirc = 2 * Math.PI * innerRadius

  const outerOffset = outerCirc * (1 - totalProgress / 100)
  const innerOffset = innerCirc * (1 - roundProgress / 100)

  return (
    <div
      className={`circular-progress-container ${isRunning ? 'running' : 'paused'}`}
      onClick={() => onClick && !isFinished && onClick()}
    >
      <svg viewBox={`0 0 ${size} ${size}`} className="circular-progress-svg">
        {/* Outer ring - background track */}
        <circle
          cx={center} cy={center} r={outerRadius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={outerStroke}
        />
        {/* Outer ring - progress fill */}
        <circle
          cx={center} cy={center} r={outerRadius}
          fill="none"
          className="progress-ring-fill outer"
          strokeWidth={outerStroke}
          strokeDasharray={`${outerCirc}`}
          strokeDashoffset={`${outerOffset}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
        />
        {/* Inner ring - background track */}
        <circle
          cx={center} cy={center} r={innerRadius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={innerStroke}
        />
        {/* Inner ring - progress fill */}
        <circle
          cx={center} cy={center} r={innerRadius}
          fill="none"
          className="progress-ring-fill inner"
          strokeWidth={innerStroke}
          strokeDasharray={`${innerCirc}`}
          strokeDashoffset={`${innerOffset}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
        />
      </svg>

      <div className="circular-progress-content">
        <span className="progress-time">{timeDisplay}</span>
        {label && <span className="progress-label">{label}</span>}
      </div>
    </div>
  )
}

export default CircularProgress
