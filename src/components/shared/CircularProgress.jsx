import { useRef, useEffect } from 'preact/hooks'

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
  const outerStroke = 10
  const innerRadius = 145
  const innerStroke = 18

  const outerCirc = 2 * Math.PI * outerRadius
  const innerCirc = 2 * Math.PI * innerRadius

  const outerRef = useRef(null)
  const innerRef = useRef(null)

  useEffect(() => {
    const offset = outerCirc * (1 - Math.min(100, Math.max(0, totalProgress)) / 100)
    if (outerRef.current) outerRef.current.style.strokeDashoffset = offset
  }, [totalProgress])

  useEffect(() => {
    const offset = innerCirc * (1 - Math.min(100, Math.max(0, roundProgress)) / 100)
    if (innerRef.current) innerRef.current.style.strokeDashoffset = offset
  }, [roundProgress])

  const ringStyle = {
    transition: 'stroke-dashoffset 0.1s linear, stroke 0.35s ease, opacity 0.3s ease'
  }

  return (
    <div
      className={`circular-progress-container ${isRunning ? 'running' : 'paused'}`}
      onClick={() => onClick && !isFinished && onClick()}
    >
      <svg viewBox={`0 0 ${size} ${size}`} className="circular-progress-svg">
        {/* Outer ring track */}
        <circle cx={center} cy={center} r={outerRadius} fill="none"
          stroke="rgba(255,255,255,0.07)" strokeWidth={outerStroke} />
        {/* Outer ring fill */}
        <circle
          ref={outerRef}
          cx={center} cy={center} r={outerRadius}
          fill="none"
          className="progress-ring-fill outer"
          strokeWidth={outerStroke}
          strokeDasharray={`${outerCirc} ${outerCirc}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
          style={{ ...ringStyle, strokeDashoffset: outerCirc }}
        />
        {/* Inner ring track */}
        <circle cx={center} cy={center} r={innerRadius} fill="none"
          stroke="rgba(255,255,255,0.07)" strokeWidth={innerStroke} />
        {/* Inner ring fill */}
        <circle
          ref={innerRef}
          cx={center} cy={center} r={innerRadius}
          fill="none"
          className="progress-ring-fill inner"
          strokeWidth={innerStroke}
          strokeDasharray={`${innerCirc} ${innerCirc}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
          style={{ ...ringStyle, strokeDashoffset: innerCirc }}
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
