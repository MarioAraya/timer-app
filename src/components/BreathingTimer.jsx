import { useState, useEffect, useRef } from 'preact/hooks'
import { useDoubleClick } from '../hooks/useDoubleClick'
import { isClickOnButton } from '../utils/timerHelpers'
import './BreathingTimer.scss'

const SCALE_MIN = 0.65
const SCALE_MAX = 1.35

// For hold phases, find the scale of the last non-hold phase before this one
function getHoldScale(phases, phaseIndex) {
  for (let i = phaseIndex - 1; i >= 0; i--) {
    if (phases[i].type === 'inhale') return SCALE_MAX
    if (phases[i].type === 'exhale') return SCALE_MIN
  }
  return SCALE_MAX
}

function BreathingTimer({
  name,
  phases,
  patternName,
  className,
  autoMaximize = false,
  autoStart = false,
  showBackButton = true,
  onBackClick
}) {
  const [currentPhase, setCurrentPhase] = useState(0)
  const [timeLeft, setTimeLeft] = useState(phases[0].duration)
  const [isRunning, setIsRunning] = useState(false)
  const [cycleCount, setCycleCount] = useState(0)
  const [isMaximized, setIsMaximized] = useState(autoMaximize)
  const circleRef = useRef(null)

  useEffect(() => {
    if (autoStart && !isRunning) setIsRunning(true)
  }, [autoStart])

  // JS-driven circle scale animation
  useEffect(() => {
    const el = circleRef.current
    if (!el) return

    const phase = phases[currentPhase]

    if (!isRunning) {
      el.style.transition = 'none'
      el.style.transform = `scale(${SCALE_MIN})`
      return
    }

    if (phase.type === 'inhale') {
      el.style.transition = 'none'
      el.style.transform = `scale(${SCALE_MIN})`
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.style.transition = `transform ${phase.duration}s ease-in-out`
          el.style.transform = `scale(${SCALE_MAX})`
        })
      })
    } else if (phase.type === 'exhale') {
      el.style.transition = 'none'
      el.style.transform = `scale(${SCALE_MAX})`
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.style.transition = `transform ${phase.duration}s ease-in-out`
          el.style.transform = `scale(${SCALE_MIN})`
        })
      })
    } else {
      // hold: freeze at whatever scale the previous phase ended on
      el.style.transition = 'none'
      el.style.transform = `scale(${getHoldScale(phases, currentPhase)})`
    }
  }, [currentPhase, isRunning, phases])

  // Timer countdown
  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      setTimeLeft(time => {
        if (time <= 1) {
          const nextPhase = (currentPhase + 1) % phases.length
          if (nextPhase === 0) setCycleCount(count => count + 1)
          setCurrentPhase(nextPhase)
          return phases[nextPhase].duration
        }
        return time - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning, currentPhase, phases])

  const handleStart = () => setIsRunning(true)
  const handlePause = () => setIsRunning(false)
  const handleReset = () => {
    setIsRunning(false)
    setCurrentPhase(0)
    setTimeLeft(phases[0].duration)
    setCycleCount(0)
  }

  const handleSkip = () => {
    const nextPhase = (currentPhase + 1) % phases.length
    if (nextPhase === 0) setCycleCount(count => count + 1)
    setCurrentPhase(nextPhase)
    setTimeLeft(phases[nextPhase].duration)
  }

  const handleDoubleClick = useDoubleClick(() => setIsMaximized(!isMaximized))

  const handleContainerClick = (e) => {
    if (!isClickOnButton(e)) {
      if (isMaximized) {
        isRunning ? handlePause() : handleStart()
      } else {
        handleDoubleClick()
      }
    }
  }

  const currentPhaseConfig = phases[currentPhase]

  return (
    <div
      className={`breathing-timer-root ${className} ${currentPhaseConfig.color} ${isMaximized ? 'maximized' : ''}`}
      onClick={handleContainerClick}
    >
      {onBackClick && (
        <button
          onClick={(e) => { e.stopPropagation(); onBackClick() }}
          className={`breathing-back-btn ${isMaximized ? 'maximized' : ''}`}
        >
          ← Back
        </button>
      )}

      <h3 className="breathing-name">{name}</h3>

      <div className="breathing-cycle">
        <div className="cycle-info">Cycle {cycleCount + 1}</div>
      </div>

      <div className="breathing-animation">
        <div ref={circleRef} className={`breathing-circle ${currentPhaseConfig.color}`}>
          <div className="breathing-circle-inner">
            <div className="breathing-timer-display">
              {Math.floor(timeLeft)}
            </div>
          </div>
        </div>
      </div>

      <div className="breathing-phase">
        <div className={`phase-indicator ${currentPhaseConfig.color}`}>
          {currentPhaseConfig.name}
        </div>
        <div className="breathing-instruction">
          {currentPhaseConfig.instruction}
        </div>
      </div>

      <div className="breathing-controls">
        {!isRunning ? (
          <button onClick={(e) => { e.stopPropagation(); handleStart() }} className="btn btn-start">
            {cycleCount === 0 && currentPhase === 0 ? 'Start' : 'Resume'}
          </button>
        ) : (
          <button onClick={(e) => { e.stopPropagation(); handlePause() }} className="btn btn-pause">
            Pause
          </button>
        )}

        <button onClick={(e) => { e.stopPropagation(); handleSkip() }} className="btn btn-skip">
          Skip Phase
        </button>

        <button onClick={(e) => { e.stopPropagation(); handleReset() }} className="btn btn-reset">
          Reset
        </button>
      </div>

      <div className="breathing-pattern">
        <div className="pattern-info">
          <span className="pattern-label">Pattern:</span>
          <span className="pattern-value">{patternName}</span>
        </div>
      </div>
    </div>
  )
}

export default BreathingTimer
