import { useState, useEffect } from 'preact/hooks'
import './TabataTimer.css'

export default function TabataTimer({ name = 'Tabata Protocol' }) {
  const [currentRound, setCurrentRound] = useState(1)
  const [timeLeft, setTimeLeft] = useState(20) // Start with work phase
  const [isWorkPhase, setIsWorkPhase] = useState(true)
  const [isRunning, setIsRunning] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  
  const totalRounds = 8
  const workTime = 20 // seconds
  const restTime = 10 // seconds

  useEffect(() => {
    let interval = null
    
    if (isRunning && !isFinished) {
      interval = setInterval(() => {
        setTimeLeft(time => {
          if (time <= 1) {
            // Phase transition logic
            if (isWorkPhase) {
              // Work phase ending, go to rest
              setIsWorkPhase(false)
              return restTime
            } else {
              // Rest phase ending
              if (currentRound >= totalRounds) {
                // Workout finished
                setIsRunning(false)
                setIsFinished(true)
                return 0
              } else {
                // Next round
                setCurrentRound(round => round + 1)
                setIsWorkPhase(true)
                return workTime
              }
            }
          }
          return time - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, isWorkPhase, currentRound, isFinished])

  const formatTime = (seconds) => {
    return seconds.toString().padStart(2, '0')
  }

  const handleStart = () => {
    setIsRunning(true)
  }

  const handlePause = () => {
    setIsRunning(false)
  }

  const handleReset = () => {
    setIsRunning(false)
    setIsFinished(false)
    setCurrentRound(1)
    setIsWorkPhase(true)
    setTimeLeft(workTime)
  }

  const handleSkip = () => {
    if (isWorkPhase) {
      setIsWorkPhase(false)
      setTimeLeft(restTime)
    } else {
      if (currentRound >= totalRounds) {
        setIsFinished(true)
        setIsRunning(false)
        setTimeLeft(0)
      } else {
        setCurrentRound(round => round + 1)
        setIsWorkPhase(true)
        setTimeLeft(workTime)
      }
    }
  }

  const getPhaseMessage = () => {
    if (isFinished) return "⚡ TABATA COMPLETE!"
    return isWorkPhase ? "🔥 MAXIMUM EFFORT!" : "⏸️ RECOVER"
  }

  const getProgressPercentage = () => {
    const totalPhases = totalRounds * 2 // work + rest phases
    const completedPhases = (currentRound - 1) * 2 + (isWorkPhase ? 0 : 1)
    return (completedPhases / totalPhases) * 100
  }

  return (
    <div className={`tabata-timer ${isFinished ? 'finished' : ''} ${isWorkPhase ? 'work-phase' : 'rest-phase'}`}>
      <h3 className="tabata-name">{name}</h3>
      
      <div className="tabata-progress">
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

      <div className="tabata-phase">
        <div className={`phase-indicator ${isWorkPhase ? 'work' : 'rest'}`}>
          {isWorkPhase ? 'WORK' : 'REST'}
        </div>
      </div>
      
      <div className="tabata-display">
        {formatTime(timeLeft)}
      </div>
      
      <div className="tabata-message">
        {getPhaseMessage()}
      </div>
      
      <div className="tabata-controls">
        {!isRunning ? (
          <button onClick={handleStart} className="btn btn-start" disabled={isFinished}>
            {isFinished ? 'Finished' : (currentRound === 1 && isWorkPhase && timeLeft === workTime ? 'Start' : 'Resume')}
          </button>
        ) : (
          <button onClick={handlePause} className="btn btn-pause">
            Pause
          </button>
        )}
        
        <button onClick={handleSkip} className="btn btn-skip" disabled={isFinished}>
          Skip Phase
        </button>
        
        <button onClick={handleReset} className="btn btn-reset">
          Reset
        </button>
      </div>

      <div className="tabata-stats">
        <div className="stat">
          <span className="stat-label">Work:</span>
          <span className="stat-value">{workTime}s</span>
        </div>
        <div className="stat">
          <span className="stat-label">Rest:</span>
          <span className="stat-value">{restTime}s</span>
        </div>
        <div className="stat">
          <span className="stat-label">Total:</span>
          <span className="stat-value">{(workTime + restTime) * totalRounds / 60}min</span>
        </div>
      </div>
    </div>
  )
}