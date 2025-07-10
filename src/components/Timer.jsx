import { useState, useEffect } from 'preact/hooks'
import './Timer.css'
import { useDoubleClick } from '../hooks/useDoubleClick'
import { formatTime, isClickOnButton } from '../utils/timerHelpers'

export default function Timer({ initialTime = 0, message = '', name = 'Timer' }) {
  const [timeLeft, setTimeLeft] = useState(initialTime)
  const [isRunning, setIsRunning] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    let interval = null
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft => {
          if (timeLeft <= 1) {
            setIsRunning(false)
            setIsFinished(true)
            return 0
          }
          return timeLeft - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, timeLeft])


  const handleStart = () => {
    setIsRunning(true)
    setIsFinished(false)
  }

  const handlePause = () => {
    setIsRunning(false)
  }

  const handleReset = () => {
    setIsRunning(false)
    setTimeLeft(initialTime)
    setIsFinished(false)
  }

  const handleDoubleClick = useDoubleClick(() => {
    setIsMaximized(!isMaximized)
  })

  return (
    <div 
      className={`timer ${isFinished ? 'finished' : ''} ${isMaximized ? 'maximized' : ''}`}
      onClick={(e) => {
        // Solo activar si el clic no es en botones
        if (!isClickOnButton(e)) {
          handleDoubleClick()
        }
      }}
    >
      <h3 className="timer-name">{name}</h3>
      
      <div className="timer-display">
        {formatTime(timeLeft)}
      </div>
      
      <div className="timer-controls">
        {!isRunning ? (
          <button onClick={handleStart} className="btn btn-start">
            {timeLeft === initialTime ? 'Start' : 'Resume'}
          </button>
        ) : (
          <button onClick={handlePause} className="btn btn-pause">
            Pause
          </button>
        )}
        
        <button onClick={handleReset} className="btn btn-reset">
          Reset
        </button>
      </div>
      
      {message && (
        <div className="timer-message">
          {isFinished ? message : `Ready: ${message}`}
        </div>
      )}
    </div>
  )
}