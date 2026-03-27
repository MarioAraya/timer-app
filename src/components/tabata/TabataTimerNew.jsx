import { useState, useEffect, useRef } from 'preact/hooks'
import './TabataTimer.scss'
import TabataSetupView from './TabataSetupView'
import TabataActiveView from './TabataActiveView'
import {
  playTabataSong,
  stopTabataSong,
  pauseTabataSong,
  resumeTabataSong,
  TABATA_AUDIO_CONFIG,
  initializeTabataAudioPlayer,
  getTabataAudioPosition,
  setTabataAudioPosition,
  getTabataAudioPlayer,
  shouldIgnoreTabataPause,
  playWorkSound,
  playCountdownSound
} from '../../utils/audioUtils'
import { TABATA_CONFIG, calculateTabataTotalTime } from '../../config/tabataConfig'
import { saveTabataState, loadTabataState, clearTabataState } from '../../utils/localStorage'

/**
 * Tabata Timer Component - New Design
 * Two views: Setup and Active workout
 */
function TabataTimerNew({
  name = 'Tabata Protocol',
  autoMaximize = false,
  autoStart = false,
  showBackButton = true,
  onBackClick,
  onFinish
}) {
  // Load saved state
  const savedState = loadTabataState()

  // View state: 'setup' or 'active'
  const [view, setView] = useState(savedState?.hasStarted ? 'active' : 'setup')

  // If autoMaximize is true, start in maximized mode
  const initialMaximized = autoMaximize && savedState?.hasStarted

  // Timer state
  const [currentRound, setCurrentRound] = useState(savedState?.currentRound ?? 1)
  const [timeLeft, setTimeLeft] = useState(savedState?.timeLeft ?? TABATA_CONFIG.preparation.duration)
  const [isWorkPhase, setIsWorkPhase] = useState(savedState?.isWorkPhase ?? true)
  const [isPreparationPhase, setIsPreparationPhase] = useState(savedState?.isPreparationPhase ?? true)
  const [isRunning, setIsRunning] = useState(false)
  const [isFinished, setIsFinished] = useState(savedState?.isFinished ?? false)
  const [currentSubtitle, setCurrentSubtitle] = useState(savedState?.currentSubtitle ?? '')
  const [showConfetti, setShowConfetti] = useState(false)

  // UI state
  const [isMaximized, setIsMaximized] = useState(initialMaximized || false)
  const [musicMode, setMusicMode] = useState(savedState?.musicMode ?? true)
  const [volume, setVolume] = useState(savedState?.volume ?? 0.7)
  const [totalElapsed, setTotalElapsed] = useState(0)

  // Refs
  const timerRef = useRef(null)

  const totalRounds = TABATA_CONFIG.rounds.length
  const preparationTime = TABATA_CONFIG.preparation.duration

  // Calculate total workout time
  const totalTime = calculateTabataTotalTime()

  // Calculate total workout duration in seconds
  const getTotalWorkoutSeconds = () => {
    const prepTime = TABATA_CONFIG.preparation.duration
    const roundsTime = TABATA_CONFIG.rounds.reduce((total, round) => total + round.work + round.rest, 0)
    return prepTime + roundsTime
  }

  // Calculate elapsed time based on current position
  const calculateElapsedTime = () => {
    let elapsed = 0

    if (isPreparationPhase) {
      elapsed = preparationTime - timeLeft
    } else {
      elapsed = preparationTime // Prep time

      // Add completed rounds
      for (let i = 0; i < currentRound - 1; i++) {
        elapsed += TABATA_CONFIG.rounds[i].work + TABATA_CONFIG.rounds[i].rest
      }

      // Add current round progress
      const currentRoundConfig = TABATA_CONFIG.rounds[currentRound - 1]
      if (currentRoundConfig) {
        if (isWorkPhase) {
          elapsed += currentRoundConfig.work - timeLeft
        } else {
          elapsed += currentRoundConfig.work + (currentRoundConfig.rest - timeLeft)
        }
      }
    }

    return Math.max(0, elapsed)
  }

  // Calculate progress percentages
  const calculateTotalProgress = () => {
    const totalSeconds = getTotalWorkoutSeconds()
    const elapsed = calculateElapsedTime()
    return Math.min(100, (elapsed / totalSeconds) * 100)
  }

  const calculateIntervalProgress = () => {
    if (isPreparationPhase) {
      return ((preparationTime - timeLeft) / preparationTime) * 100
    }

    const currentRoundConfig = TABATA_CONFIG.rounds[currentRound - 1]
    if (!currentRoundConfig) return 0

    const phaseDuration = isWorkPhase ? currentRoundConfig.work : currentRoundConfig.rest
    if (phaseDuration === 0) return 100
    return ((phaseDuration - timeLeft) / phaseDuration) * 100
  }

  // Update elapsed time
  useEffect(() => {
    setTotalElapsed(calculateElapsedTime())
  }, [currentRound, timeLeft, isWorkPhase, isPreparationPhase])

  // Timer effect
  useEffect(() => {
    if (isRunning && !isFinished) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 0.1) {
            return handlePhaseComplete()
          }
          return prev - 0.1
        })
      }, 100)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isRunning, isFinished, currentRound, isWorkPhase, isPreparationPhase])

  // Countdown beeps effect (3-2-1 before work phase starts)
  const lastBeepRef = useRef(0)
  useEffect(() => {
    if (!musicMode && isRunning && !isFinished && !isWorkPhase && !isPreparationPhase) {
      // During rest phase, play countdown beeps at 3, 2, 1 seconds
      const secondsLeft = Math.ceil(timeLeft)

      if (secondsLeft <= 3 && secondsLeft >= 1 && lastBeepRef.current !== secondsLeft) {
        lastBeepRef.current = secondsLeft
        playCountdownSound(secondsLeft)
      }
    }

    // Reset beep tracker when phase changes
    if (isWorkPhase || isPreparationPhase) {
      lastBeepRef.current = 0
    }
  }, [timeLeft, isRunning, isFinished, isWorkPhase, isPreparationPhase, musicMode])

  // Handle phase completion - returns the new timeLeft value
  const handlePhaseComplete = () => {
    if (isPreparationPhase) {
      // Move to first work phase
      setIsPreparationPhase(false)
      setIsWorkPhase(true)
      setCurrentSubtitle(TABATA_CONFIG.rounds[0].workSubtitle)
      if (!musicMode) playWorkSound()
      return TABATA_CONFIG.rounds[0].work
    } else if (isWorkPhase) {
      const currentRoundConfig = TABATA_CONFIG.rounds[currentRound - 1]

      // Check if this is the last round with no rest
      if (currentRound >= totalRounds && currentRoundConfig.rest === 0) {
        handleWorkoutComplete()
        return 0
      }

      // Move to rest phase
      setIsWorkPhase(false)
      setCurrentSubtitle(currentRoundConfig.restSubtitle)
      return currentRoundConfig.rest
    } else {
      // Rest phase complete
      if (currentRound >= totalRounds) {
        // Workout complete
        handleWorkoutComplete()
        return 0
      } else {
        // Move to next round
        const nextRound = currentRound + 1
        setCurrentRound(nextRound)
        setIsWorkPhase(true)
        setCurrentSubtitle(TABATA_CONFIG.rounds[nextRound - 1].workSubtitle)
        if (!musicMode) playWorkSound()
        return TABATA_CONFIG.rounds[nextRound - 1].work
      }
    }
  }

  // Handle workout completion
  const handleWorkoutComplete = () => {
    setIsRunning(false)
    setIsFinished(true)
    setShowConfetti(true)
    setCurrentSubtitle("Tabata complete! You crushed it!")

    if (musicMode) {
      stopTabataSong()
    }

    clearTabataState()

    // Auto-reset after 5 seconds, then notify parent
    setTimeout(() => {
      handleReset()
      if (onFinish) onFinish()
    }, 5000)
  }

  // Control handlers
  const handleStart = () => {
    if (isFinished) return

    setIsRunning(true)

    // Always control audio when in music mode, regardless of phase
    if (musicMode) {
      const audioPlayer = getTabataAudioPlayer()
      if (audioPlayer && audioPlayer.paused) {
        resumeTabataSong()
      } else if (!audioPlayer) {
        playTabataSong()
      }
    }
  }

  const handlePause = () => {
    setIsRunning(false)

    // Always pause audio when in music mode
    if (musicMode) {
      pauseTabataSong()
    }

    // Save state
    saveTabataState({
      currentRound,
      timeLeft,
      isWorkPhase,
      isPreparationPhase,
      isFinished,
      currentSubtitle,
      musicMode,
      volume,
      hasStarted: true
    })
  }

  const handleReset = () => {
    setIsRunning(false)
    setCurrentRound(1)
    setTimeLeft(preparationTime)
    setIsWorkPhase(true)
    setIsPreparationPhase(true)
    setIsFinished(false)
    setCurrentSubtitle('')
    setShowConfetti(false)

    if (musicMode) {
      stopTabataSong()
    }

    clearTabataState()
  }

  const handleBackToSetup = () => {
    handleReset()
    setView('setup')
  }

  const handleSkip = () => {
    if (isFinished) return
    const newTime = handlePhaseComplete()
    setTimeLeft(newTime)
  }

  const handleStartWorkout = () => {
    setView('active')
    // Initialize audio if in music mode
    if (musicMode) {
      initializeTabataAudioPlayer()
    }
  }

  const handleToggleFullscreen = () => {
    setIsMaximized(!isMaximized)
  }

  const handleToggleMusicMode = () => {
    // Stop current audio if switching modes
    if (musicMode) {
      stopTabataSong()
    }
    setMusicMode(!musicMode)
  }

  // Save state on unmount
  useEffect(() => {
    return () => {
      if (view === 'active' && !isFinished) {
        saveTabataState({
          currentRound,
          timeLeft,
          isWorkPhase,
          isPreparationPhase,
          isFinished,
          currentSubtitle,
          musicMode,
          volume,
          hasStarted: true
        })
      }
    }
  }, [view, currentRound, timeLeft, isWorkPhase, isPreparationPhase, isFinished, musicMode, volume])

  return (
    <div className="tabata-timer-new">
      {view === 'setup' ? (
        <TabataSetupView
          config={TABATA_CONFIG}
          onStart={handleStartWorkout}
          onBackClick={onBackClick}
          totalTime={totalTime}
        />
      ) : (
        <TabataActiveView
          currentRound={currentRound}
          totalRounds={totalRounds}
          timeLeft={timeLeft}
          totalElapsed={totalElapsed}
          isWorkPhase={isWorkPhase}
          isPreparationPhase={isPreparationPhase}
          isRunning={isRunning}
          isFinished={isFinished}
          currentSubtitle={currentSubtitle}
          showConfetti={showConfetti}
          setShowConfetti={setShowConfetti}
          totalProgress={calculateTotalProgress()}
          roundProgress={calculateIntervalProgress()}
          onBackClick={handleBackToSetup}
          onStart={handleStart}
          onPause={handlePause}
          onReset={handleReset}
          onSkip={handleSkip}
          onToggleFullscreen={handleToggleFullscreen}
          isMaximized={isMaximized}
          musicMode={musicMode}
          onToggleMusicMode={handleToggleMusicMode}
        />
      )}
    </div>
  )
}

export default TabataTimerNew
