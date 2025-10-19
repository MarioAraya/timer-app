import { useState, useEffect } from 'preact/hooks'
import './Breathing478Timer.scss'
import { useDoubleClick } from '../hooks/useDoubleClick'
import { isClickOnButton } from '../utils/timerHelpers'

const BREATHING_CONFIG = {
  phases: [
    { name: 'Inhale', duration: 4, instruction: 'Breathe In', color: 'inhale' },
    { name: 'Hold', duration: 7, instruction: 'Hold', color: 'hold' },
    { name: 'Exhale', duration: 8, instruction: 'Breathe Out', color: 'exhale' }
  ]
}

function Breathing478Timer({ name = '4-7-8 Breathing', autoMaximize = false, autoStart = false }) {
  const [currentPhase, setCurrentPhase] = useState(0)
  const [timeLeft, setTimeLeft] = useState(BREATHING_CONFIG.phases[0].duration)
  const [isRunning, setIsRunning] = useState(false)
  const [cycleCount, setCycleCount] = useState(0)
  const [isMaximized, setIsMaximized] = useState(autoMaximize)

  // Auto-start if requested
  useEffect(() => {
    if (autoStart && !isRunning) {
      setIsRunning(true)
    }
  }, [autoStart])

  useEffect(() => {
    let interval = null

    if (isRunning) {
      interval = setInterval(() => {
        setTimeLeft(time => {
          if (time <= 1) {
            const nextPhase = (currentPhase + 1) % BREATHING_CONFIG.phases.length
            if (nextPhase === 0) {
              setCycleCount(count => count + 1)
            }
            setCurrentPhase(nextPhase)
            return BREATHING_CONFIG.phases[nextPhase].duration
          }
          return time - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, currentPhase])

  const handleStart = () => setIsRunning(true)
  const handlePause = () => setIsRunning(false)
  const handleReset = () => {
    setIsRunning(false)
    setCurrentPhase(0)
    setTimeLeft(BREATHING_CONFIG.phases[0].duration)
    setCycleCount(0)
  }

  const handleSkip = () => {
    const nextPhase = (currentPhase + 1) % BREATHING_CONFIG.phases.length
    if (nextPhase === 0) {
      setCycleCount(count => count + 1)
    }
    setCurrentPhase(nextPhase)
    setTimeLeft(BREATHING_CONFIG.phases[nextPhase].duration)
  }

  const handleDoubleClick = useDoubleClick(() => {
    setIsMaximized(!isMaximized)
  })

  const currentPhaseConfig = BREATHING_CONFIG.phases[currentPhase]

  return (
    <div 
      className={`breathing-478-timer ${currentPhaseConfig.color} ${isMaximized ? 'maximized' : ''}`}
      onClick={(e) => {
        if (!isClickOnButton(e)) {
          handleDoubleClick()
        }
      }}
    >
      <h3 className="breathing-name">{name}</h3>
      
      <div className="breathing-cycle">
        <div className="cycle-info">
          Cycle {cycleCount + 1}
        </div>
      </div>

      <div className="breathing-animation">
        <div className={`breathing-circle ${isRunning ? 'breathing-circle--animated' : ''}`}>
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
          <button onClick={handleStart} className="btn btn-start">
            {cycleCount === 0 && currentPhase === 0 ? 'Start' : 'Resume'}
          </button>
        ) : (
          <button onClick={handlePause} className="btn btn-pause">
            Pause
          </button>
        )}
        
        <button onClick={handleSkip} className="btn btn-skip">
          Skip Phase
        </button>
        
        <button onClick={handleReset} className="btn btn-reset">
          Reset
        </button>
      </div>

      <div className="breathing-pattern">
        <div className="pattern-info">
          <span className="pattern-label">Pattern:</span>
          <span className="pattern-value">4-7-8 (Inhale-Hold-Exhale)</span>
        </div>
      </div>
    </div>
  )
}

export default Breathing478Timer