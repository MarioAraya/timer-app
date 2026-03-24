import { useState, useEffect } from 'preact/hooks'
import { useDoubleClick } from '../hooks/useDoubleClick'
import { isClickOnButton } from '../utils/timerHelpers'

/**
 * Generic Breathing Timer Component
 * Shared base for all breathing exercise timers
 *
 * @param {Object} props
 * @param {string} props.name - Display name
 * @param {Array} props.phases - Breathing phases configuration
 * @param {string} props.patternName - Pattern description (e.g., "4-4-4-4 (Box Breathing)")
 * @param {string} props.className - CSS class name
 * @param {boolean} props.autoMaximize - Auto-enter fullscreen
 * @param {boolean} props.autoStart - Auto-start timer
 * @param {boolean} props.showBackButton - Show back button
 * @param {Function} props.onBackClick - Back navigation handler
 */
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

  // Auto-start if requested
  useEffect(() => {
    if (autoStart && !isRunning) {
      setIsRunning(true)
    }
  }, [autoStart])

  // Timer countdown
  useEffect(() => {
    let interval = null

    if (isRunning) {
      interval = setInterval(() => {
        setTimeLeft(time => {
          if (time <= 1) {
            const nextPhase = (currentPhase + 1) % phases.length
            if (nextPhase === 0) {
              setCycleCount(count => count + 1)
            }
            setCurrentPhase(nextPhase)
            return phases[nextPhase].duration
          }
          return time - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
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
    if (nextPhase === 0) {
      setCycleCount(count => count + 1)
    }
    setCurrentPhase(nextPhase)
    setTimeLeft(phases[nextPhase].duration)
  }

  const handleDoubleClick = useDoubleClick(() => {
    setIsMaximized(!isMaximized)
  })

  const handleContainerClick = (e) => {
    if (!isClickOnButton(e)) {
      if (isMaximized) {
        if (isRunning) {
          handlePause()
        } else {
          handleStart()
        }
      } else {
        handleDoubleClick()
      }
    }
  }

  const currentPhaseConfig = phases[currentPhase]

  return (
    <div
      className={`${className} ${currentPhaseConfig.color} ${isMaximized ? 'maximized' : ''}`}
      onClick={handleContainerClick}
    >
      {/* Back button */}
      {onBackClick && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onBackClick()
          }}
          className={`breathing-back-btn ${isMaximized ? 'maximized' : ''}`}
        >
          ← Back
        </button>
      )}

      <h3 className="breathing-name">{name}</h3>

      <div className="breathing-cycle">
        <div className="cycle-info">
          Cycle {cycleCount + 1}
        </div>
      </div>

      <div className="breathing-animation">
        <div className={`breathing-circle ${isRunning ? 'breathing-circle--animated' : ''} ${currentPhaseConfig.color}`}>
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
          <button onClick={(e) => { e.stopPropagation(); handleStart(); }} className="btn btn-start">
            {cycleCount === 0 && currentPhase === 0 ? 'Start' : 'Resume'}
          </button>
        ) : (
          <button onClick={(e) => { e.stopPropagation(); handlePause(); }} className="btn btn-pause">
            Pause
          </button>
        )}

        <button onClick={(e) => { e.stopPropagation(); handleSkip(); }} className="btn btn-skip">
          Skip Phase
        </button>

        <button onClick={(e) => { e.stopPropagation(); handleReset(); }} className="btn btn-reset">
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
