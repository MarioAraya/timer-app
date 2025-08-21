import { useState, useEffect } from 'preact/hooks'
import './HiitTimer.scss'
import { useDoubleClick } from '../hooks/useDoubleClick'
import { formatTimeSeconds, calculateProgress, isClickOnButton } from '../utils/timerHelpers'
import { playWorkSound, playCountdownSound, playHiitSong, stopHiitSong, pauseHiitSong, resumeHiitSong, HIIT_YOUTUBE_CONFIG, initializeYouTubePlayer, isPlayerReady, isPlayerLoading } from '../utils/audioUtils'
import { HIIT_CONFIG, calculateTotalTime } from '../config/hiitConfig'
import Confetti from './Confetti'

function HiitTimer({ name = 'HIIT Workout' }) {
  const [currentRound, setCurrentRound] = useState(1)
  const [timeLeft, setTimeLeft] = useState(HIIT_CONFIG.preparation.duration)
  const [isWorkPhase, setIsWorkPhase] = useState(true)
  const [isPreparationPhase, setIsPreparationPhase] = useState(true)
  const [isRunning, setIsRunning] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)
  const [currentSubtitle, setCurrentSubtitle] = useState(HIIT_CONFIG.preparation.subtitle)
  const [musicMode, setMusicMode] = useState(true) // true = YouTube music, false = beeps only
  const [playerStatus, setPlayerStatus] = useState('idle') // 'idle', 'loading', 'ready'
  const [showConfetti, setShowConfetti] = useState(false)
  
  const totalRounds = HIIT_CONFIG.rounds.length
  const preparationTime = HIIT_CONFIG.preparation.duration

  // Initialize YouTube player when music mode is enabled
  useEffect(() => {
    if (musicMode && playerStatus === 'idle') {
      setPlayerStatus('loading')
      initializeYouTubePlayer().then((ready) => {
        setPlayerStatus(ready ? 'ready' : 'error')
      })
    }
  }, [musicMode, playerStatus])

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
              setCurrentSubtitle(HIIT_CONFIG.rounds[0].workSubtitle)
              if (!musicMode) playWorkSound()
              return HIIT_CONFIG.rounds[0].work
            } else if (isWorkPhase) {
              // Work phase ending
              const currentRoundConfig = HIIT_CONFIG.rounds[currentRound - 1]
              if (currentRound >= totalRounds) {
                // Final work phase - go to final celebration rest
                setIsWorkPhase(false)
                setCurrentSubtitle("🎉 You just killed this worked out! Hit music! Number one, baby!")
                return currentRoundConfig.rest
              } else {
                // Go to rest
                setIsWorkPhase(false)
                setCurrentSubtitle(currentRoundConfig.restSubtitle)
                return currentRoundConfig.rest
              }
            } else {
              // Rest phase ending
              if (currentRound >= totalRounds) {
                // Final rest phase ending - workout complete
                setIsRunning(false)
                setIsFinished(true)
                setShowConfetti(true)
                if (musicMode) {
                  stopHiitSong()
                }
                return 0
              } else {
                // Next round
                const nextRound = currentRound + 1
                setCurrentRound(nextRound)
                setIsWorkPhase(true)
                setCurrentSubtitle(HIIT_CONFIG.rounds[nextRound - 1].workSubtitle)
                if (!musicMode) playWorkSound()
                return HIIT_CONFIG.rounds[nextRound - 1].work
              }
            }
          }
          
          // Play countdown sounds during rest phase (but not in final rest)
          if (!isPreparationPhase && !isWorkPhase && time <= 4 && time > 1 && currentRound < totalRounds) {
            if (!musicMode) { // Only play beeps when not in music mode
              playCountdownSound(time - 1)
            }
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
    // Check if we should wait for YouTube player
    if (musicMode && playerStatus === 'loading') {
      return // Don't start until player is ready
    }
    
    setIsRunning(true)
    if (musicMode) {
      if (isPreparationPhase && timeLeft === preparationTime) {
        // Starting fresh workout - play song
        playHiitSong()
      } else {
        // Resuming - resume song
        resumeHiitSong()
      }
    }
  }

  const handlePause = () => {
    setIsRunning(false)
    if (musicMode) {
      pauseHiitSong()
    }
  }

  const handleReset = () => {
    setIsRunning(false)
    setIsFinished(false)
    setCurrentRound(1)
    setIsWorkPhase(true)
    setIsPreparationPhase(true)
    setTimeLeft(preparationTime)
    setCurrentSubtitle(HIIT_CONFIG.preparation.subtitle)
    setShowConfetti(false)
    if (musicMode) {
      stopHiitSong()
    }
  }

  const handleSkip = () => {
    if (isPreparationPhase) {
      // Skip preparation - start first work phase
      setIsPreparationPhase(false)
      setIsWorkPhase(true)
      setCurrentSubtitle(HIIT_CONFIG.rounds[0].workSubtitle)
      setTimeLeft(HIIT_CONFIG.rounds[0].work)
    } else if (isWorkPhase) {
      const currentRoundConfig = HIIT_CONFIG.rounds[currentRound - 1]
      if (currentRound >= totalRounds) {
        // Final work phase - go to final celebration rest
        setIsWorkPhase(false)
        setCurrentSubtitle("🎉 You just killed this worked out! Hit music! Number one, baby!")
        setTimeLeft(currentRoundConfig.rest)
      } else {
        // Go to rest
        setIsWorkPhase(false)
        setCurrentSubtitle(currentRoundConfig.restSubtitle)
        setTimeLeft(currentRoundConfig.rest)
      }
    } else {
      // Skip rest
      if (currentRound >= totalRounds) {
        // Final rest phase - complete workout
        setIsFinished(true)
        setIsRunning(false)
        setTimeLeft(0)
        setShowConfetti(true)
        if (musicMode) {
          stopHiitSong()
        }
      } else {
        // Next round
        const nextRound = currentRound + 1
        setCurrentRound(nextRound)
        setIsWorkPhase(true)
        setCurrentSubtitle(HIIT_CONFIG.rounds[nextRound - 1].workSubtitle)
        setTimeLeft(HIIT_CONFIG.rounds[nextRound - 1].work)
      }
    }
  }

  const getPhaseMessage = () => {
    if (isFinished) return "🎉 Workout Complete!"
    if (isPreparationPhase) return "🏃‍♂️ GET READY!"
    return isWorkPhase ? "💪 WORK HARD!" : "😮‍💨 REST"
  }

  const getProgressPercentage = () => {
    if (isPreparationPhase) return 0
    const totalPhases = totalRounds * 2 // work + rest phases for all 12 rounds (including final rest)
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
        {isRunning || isFinished ? formatTimeSeconds(timeLeft) : '--:--'}
      </div>
      
      <div className="hiit-message">
        {getPhaseMessage()}
      </div>
      
      {currentSubtitle && (
        <div className="hiit-subtitle">
          {currentSubtitle}
        </div>
      )}
      
      <div className="hiit-controls">
        {!isRunning ? (
          <button 
            onClick={handleStart} 
            className="btn btn-start" 
            disabled={isFinished || (musicMode && playerStatus === 'loading')}
          >
            {isFinished ? 'Finished' : 
             (musicMode && playerStatus === 'loading') ? 'Loading...' :
             (isPreparationPhase && timeLeft === preparationTime ? 'Start' : 'Resume')}
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

      <div className="hiit-music-toggle">
        <label className="toggle-container">
          <input 
            type="checkbox" 
            checked={musicMode} 
            onChange={(e) => setMusicMode(e.target.checked)}
            disabled={isRunning}
          />
          <span className="toggle-slider"></span>
          <span className="toggle-label">
            {musicMode ? '🎵 YouTube Music' : '🔊 Beeps Only'}
            {musicMode && playerStatus === 'loading' && ' (Loading...)'}
          </span>
        </label>
      </div>

      <div className="hiit-stats">
        <div className="stat">
          <span className="stat-label">Song:</span>
          <span className="stat-value">
            <a href={HIIT_YOUTUBE_CONFIG.url} target="_blank" rel="noopener noreferrer" className="song-link">
              🎵 Play
            </a>
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">Rounds:</span>
          <span className="stat-value">{totalRounds}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Total:</span>
          <span className="stat-value">{calculateTotalTime()}</span>
        </div>
      </div>

      <Confetti 
        isActive={showConfetti} 
        onComplete={() => setShowConfetti(false)} 
      />
    </div>
  )
}

export default HiitTimer