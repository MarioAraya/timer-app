import { useState, useEffect } from 'preact/hooks'
import './HiitTimer.scss'
import { useDoubleClick } from '../hooks/useDoubleClick'
import { formatTimeSeconds, calculateProgress, isClickOnButton } from '../utils/timerHelpers'
import { playWorkSound, playCountdownSound } from '../utils/audioUtils'

function HiitTimer({ name = 'HIIT Workout' }) {
  const [currentRound, setCurrentRound] = useState(1)
  const [timeLeft, setTimeLeft] = useState(7) // Start with preparation phase
  const [isWorkPhase, setIsWorkPhase] = useState(true)
  const [isPreparationPhase, setIsPreparationPhase] = useState(true)
  const [isRunning, setIsRunning] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)
  
  const totalRounds = 12
  const workTime = 40 // seconds
  const restTime = 20 // seconds
  const preparationTime = 7 // seconds

  useEffect(() => {
    let interval = null
    
    if (isRunning && !isFinished) {
      interval = setInterval(() => {
        setTimeLeft(time => {
          if (time <= 1) {
            // Phase transition logic
            if (isPreparationPhase) {
              // Preparation phase ending - start first work phase
              setIsPreparationPhase(false)
              setIsWorkPhase(true)
              playWorkSound()
              return workTime
            } else if (isWorkPhase) {
              // Work phase ending
              if (currentRound >= totalRounds) {
                // Final work phase - workout finished
                setIsRunning(false)
                setIsFinished(true)
                return 0
              } else {
                // Go to rest
                setIsWorkPhase(false)
                return restTime
              }
            } else {
              // Rest phase ending - next round
              setCurrentRound(round => round + 1)
              setIsWorkPhase(true)
              playWorkSound()
              return workTime
            }
          }
          
          // Play countdown sounds during rest phase
          if (!isPreparationPhase && !isWorkPhase && time <= 4 && time > 1) {
            playCountdownSound(time - 1)
          }
          
          return time - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, isWorkPhase, isPreparationPhase, currentRound, isFinished])


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
    setIsPreparationPhase(true)
    setTimeLeft(preparationTime)
  }

  const handleSkip = () => {
    if (isPreparationPhase) {
      // Skip preparation - start first work phase
      setIsPreparationPhase(false)
      setIsWorkPhase(true)
      setTimeLeft(workTime)
    } else if (isWorkPhase) {
      if (currentRound >= totalRounds) {
        // Final work phase - complete workout
        setIsFinished(true)
        setIsRunning(false)
        setTimeLeft(0)
      } else {
        // Go to rest
        setIsWorkPhase(false)
        setTimeLeft(restTime)
      }
    } else {
      // Skip rest - next round
      setCurrentRound(round => round + 1)
      setIsWorkPhase(true)
      setTimeLeft(workTime)
    }
  }

  const getPhaseMessage = () => {
    if (isFinished) return "🎉 Workout Complete!"
    if (isPreparationPhase) return "🏃‍♂️ GET READY!"
    return isWorkPhase ? "💪 WORK HARD!" : "😮‍💨 REST"
  }

  const getProgressPercentage = () => {
    if (isPreparationPhase) return 0
    const totalPhases = totalRounds * 2 - 1 // work + rest phases, minus final rest
    const completedPhases = (currentRound - 1) * 2 + (isWorkPhase ? 0 : 1)
    return calculateProgress(completedPhases, totalPhases)
  }

  const handleDoubleClick = useDoubleClick(() => {
    setIsMaximized(!isMaximized)
  })


  return (
    <div 
      className={`hiit-timer ${isFinished ? 'finished' : ''} ${isWorkPhase || isPreparationPhase ? 'work-phase' : 'rest-phase'} ${isMaximized ? 'maximized' : ''}`}
      onClick={(e) => {
        // Solo activar si el clic no es en botones
        if (!isClickOnButton(e)) {
          handleDoubleClick()
        }
      }}
    >
      <h3 className="hiit-name">{name}</h3>
      
      <div className="hiit-progress">
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

      <div className="hiit-phase">
        <div className={`phase-indicator ${isPreparationPhase ? 'work' : isWorkPhase ? 'work' : 'rest'}`}>
          {isPreparationPhase ? 'PREP' : isWorkPhase ? 'WORK' : 'REST'}
        </div>
      </div>
      
      <div className="hiit-display">
        {formatTimeSeconds(timeLeft)}
      </div>
      
      <div className="hiit-message">
        {getPhaseMessage()}
      </div>
      
      <div className="hiit-controls">
        {!isRunning ? (
          <button onClick={handleStart} className="btn btn-start" disabled={isFinished}>
            {isFinished ? 'Finished' : (isPreparationPhase && timeLeft === preparationTime ? 'Start' : 'Resume')}
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

      <div className="hiit-stats">
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

export default HiitTimer