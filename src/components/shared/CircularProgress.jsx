import { useEffect, useRef } from 'preact/hooks'

/**
 * Circular Progress Component
 * - Outer ring: total workout progress
 * - Inner ring: current round/interval progress
 *
 * Uses refs + direct DOM style writes so CSS transitions fire reliably on SVG elements.
 * Preact/React inline styles on SVG can silently drop SVG-specific CSS properties.
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
  const outerRef = useRef(null)
  const innerRef = useRef(null)

  const size = 400
  const center = size / 2

  const outerRadius = 185
  const outerStroke = 10
  const innerRadius = 145
  const innerStroke = 18

  const outerCirc = 2 * Math.PI * outerRadius
  const innerCirc = 2 * Math.PI * innerRadius

  // Direct DOM writes ensure CSS transitions fire for SVG stroke-dashoffset
  useEffect(() => {
    const outerOffset = outerCirc * (1 - totalProgress / 100)
    if (outerRef.current) {
      outerRef.current.style.strokeDashoffset = outerOffset
    }
  }, [totalProgress, outerCirc])

  useEffect(() => {
    const innerOffset = innerCirc * (1 - roundProgress / 100)
    if (innerRef.current) {
      innerRef.current.style.strokeDashoffset = innerOffset
    }
  }, [roundProgress, innerCirc])

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
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={outerStroke}
        />
        {/* Outer ring - progress fill */}
        <circle
          ref={outerRef}
          cx={center} cy={center} r={outerRadius}
          fill="none"
          className="progress-ring-fill outer"
          strokeWidth={outerStroke}
          strokeDasharray={`${outerCirc} ${outerCirc}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
        />
        {/* Inner ring - background track */}
        <circle
          cx={center} cy={center} r={innerRadius}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={innerStroke}
        />
        {/* Inner ring - progress fill */}
        <circle
          ref={innerRef}
          cx={center} cy={center} r={innerRadius}
          fill="none"
          className="progress-ring-fill inner"
          strokeWidth={innerStroke}
          strokeDasharray={`${innerCirc} ${innerCirc}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
        />
      </svg>

      <div className="circular-progress-content">
        {isFinished
          ? <span className="material-symbols-outlined progress-done-icon">check_circle</span>
          : (
            <>
              <span className="progress-time">{timeDisplay}</span>
              {label && <span className="progress-label">{label}</span>}
            </>
          )
        }
      </div>
    </div>
  )
}

export default CircularProgress
