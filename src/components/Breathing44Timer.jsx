import { useState, useEffect } from 'preact/hooks'
import './Breathing44Timer.css'

export default function Breathing44Timer({ name = '4-4-4-4 Breathing' }) {
  const [currentPhase, setCurrentPhase] = useState(0) // 0: inhale, 1: hold, 2: exhale, 3: hold
  const [timeLeft, setTimeLeft] = useState(4)
  const [isRunning, setIsRunning] = useState(false)
  const [cycleCount, setCycleCount] = useState(0)
  const [totalTime, setTotalTime] = useState(0)
  
  const phases = ['Inhale', 'Hold', 'Exhale', 'Hold']
  const phaseDuration = 4 // seconds for each phase
  const phaseEmojis = ['🌬️', '🫁', '💨', '⏸️']

  useEffect(() => {
    let interval = null
    
    if (isRunning) {
      interval = setInterval(() => {
        setTotalTime(prev => prev + 1)
        setTimeLeft(time => {
          if (time <= 1) {
            // Move to next phase
            setCurrentPhase(prevPhase => {
              const nextPhase = (prevPhase + 1) % 4
              if (nextPhase === 0) {
                setCycleCount(prev => prev + 1)
              }
              return nextPhase
            })
            return phaseDuration
          }
          return time - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleStart = () => {
    setIsRunning(true)
  }

  const handlePause = () => {
    setIsRunning(false)
  }

  const handleReset = () => {
    setIsRunning(false)
    setCurrentPhase(0)
    setTimeLeft(phaseDuration)
    setCycleCount(0)
    setTotalTime(0)
  }

  const handleSkip = () => {
    setCurrentPhase(prevPhase => {
      const nextPhase = (prevPhase + 1) % 4
      if (nextPhase === 0) {
        setCycleCount(prev => prev + 1)
      }
      return nextPhase
    })
    setTimeLeft(phaseDuration)
  }

  const getPhaseInstruction = () => {
    switch(currentPhase) {
      case 0: return "Breathe in slowly through your nose"
      case 1: return "Hold your breath gently"
      case 2: return "Exhale slowly through your mouth"
      case 3: return "Rest and prepare for next breath"
      default: return ""
    }
  }

  const getCircleScale = () => {
    const progress = (phaseDuration - timeLeft) / phaseDuration
    
    switch(currentPhase) {
      case 0: // Inhale - expand
        return 0.5 + (progress * 0.5)
      case 1: // Hold - maintain
        return 1
      case 2: // Exhale - contract
        return 1 - (progress * 0.5)
      case 3: // Hold - maintain small
        return 0.5
      default:
        return 0.5
    }
  }

  return (
    <div className={`breathing-timer phase-${currentPhase}`}>
      <h3 className="breathing-name">{name}</h3>
      
      <div className="breathing-stats">
        <div className="stat">
          <span className="stat-label">Cycles:</span>
          <span className="stat-value">{cycleCount}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Total Time:</span>
          <span className="stat-value">{formatTime(totalTime)}</span>
        </div>
      </div>

      <div className="breathing-circle-container">
        <div 
          className="breathing-circle"
          style={{ 
            transform: `scale(${getCircleScale()})`,
            transition: isRunning ? 'transform 1s ease-in-out' : 'none'
          }}
        >
          <div className="circle-inner">
            <div className="phase-emoji">{phaseEmojis[currentPhase]}</div>
            <div className="phase-name">{phases[currentPhase]}</div>
          </div>
        </div>
      </div>
      
      <div className="breathing-display">
        {timeLeft}
      </div>
      
      <div className="breathing-instruction">
        {getPhaseInstruction()}
      </div>
      
      <div className="breathing-controls">
        {!isRunning ? (
          <button onClick={handleStart} className="btn btn-start">
            {totalTime === 0 ? 'Start' : 'Resume'}
          </button>
        ) : (
          <button onClick={handlePause} className="btn btn-pause">
            Pause
          </button>
        )}
        
        <button onClick={handleSkip} className="btn btn-skip">
          Next Phase
        </button>
        
        <button onClick={handleReset} className="btn btn-reset">
          Reset
        </button>
      </div>

      <div className="phase-indicator">
        {phases.map((phase, index) => (
          <div 
            key={index}
            className={`phase-dot ${index === currentPhase ? 'active' : ''} ${index < currentPhase ? 'completed' : ''}`}
          >
            {phaseEmojis[index]}
          </div>
        ))}
      </div>
    </div>
  )
}