import { useState, useEffect } from 'preact/hooks'
import './TabataTimer.scss'
import { useDoubleClick } from '../hooks/useDoubleClick'
import { formatTimeSeconds, calculateProgress, isClickOnButton } from '../utils/timerHelpers'
import { playWorkSound, playCountdownSound } from '../utils/audioUtils'
import Confetti from './Confetti'

function TabataTimer({ name = 'Tabata Protocol' }) {
  const [currentRound, setCurrentRound] = useState(1)
  const [timeLeft, setTimeLeft] = useState(7) // Start with preparation phase
  const [isWorkPhase, setIsWorkPhase] = useState(true)
  const [isPreparationPhase, setIsPreparationPhase] = useState(true)
  const [isRunning, setIsRunning] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  
  const totalRounds = 8
  const workTime = 20 // seconds
  const restTime = 10 // seconds
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
                setShowConfetti(true)
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
    setShowConfetti(false)
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
        setShowConfetti(true)
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
    if (isFinished) return "⚡ TABATA COMPLETE!"
    if (isPreparationPhase) return "🏃‍♂️ GET READY!"
    return isWorkPhase ? "🔥 MAXIMUM EFFORT!" : "⏸️ RECOVER"
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
      className={`tabata-timer ${isFinished ? 'finished' : ''} ${isWorkPhase || isPreparationPhase ? 'work-phase' : 'rest-phase'} ${isMaximized ? 'maximized' : ''}`}
      onClick={(e) => {
        // Solo activar si el clic no es en botones
        if (!isClickOnButton(e)) {
          handleDoubleClick()
        }
      }}
    >
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
        <div className={`phase-indicator ${isPreparationPhase ? 'work' : isWorkPhase ? 'work' : 'rest'}`}>
          {isPreparationPhase ? 'PREP' : isWorkPhase ? 'WORK' : 'REST'}
        </div>
      </div>
      
      <div className="tabata-display">
        {isRunning || isFinished ? formatTimeSeconds(timeLeft) : '--:--'}
      </div>
      
      <div className="tabata-message">
        {getPhaseMessage()}
      </div>
      
      <div className="tabata-controls">
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

      <Confetti 
        isActive={showConfetti} 
        onComplete={() => setShowConfetti(false)} 
      />
    </div>
  )
}

export default TabataTimer