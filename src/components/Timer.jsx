import { useState, useEffect } from 'preact/hooks'
import './Timer.css'

export default function Timer({ initialTime = 0, message = '', name = 'Timer' }) {
  const [timeLeft, setTimeLeft] = useState(initialTime)
  const [isRunning, setIsRunning] = useState(false)
  const [isFinished, setIsFinished] = useState(false)

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

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

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

  return (
    <div className={`timer ${isFinished ? 'finished' : ''}`}>
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