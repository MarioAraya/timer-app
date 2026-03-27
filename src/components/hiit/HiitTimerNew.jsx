import { useState, useEffect, useRef } from 'preact/hooks'
import './HiitTimer.scss'
import HiitSetupView from './HiitSetupView'
import HiitActiveView from './HiitActiveView'
import {
  playHiitSong,
  stopHiitSong,
  pauseHiitSong,
  resumeHiitSong,
  HIIT_AUDIO_CONFIG,
  initializeAudioPlayer,
  getAudioPosition,
  setAudioPosition,
  getAudioPlayer,
  shouldIgnoreHiitPause,
  playWorkSound,
  playCountdownSound
} from '../../utils/audioUtils'
import { HIIT_CONFIG, calculateTotalTime } from '../../config/hiitConfig'
import { saveHiitState, loadHiitState, clearHiitState } from '../../utils/localStorage'

/**
 * HIIT Timer Component - New Design
 * Two views: Setup and Active workout
 */
function HiitTimerNew({
  name = 'HIIT Workout',
  autoMaximize = false,
  autoStart = false,
  showBackButton = true,
  onBackClick,
  onFinish
}) {
  // Load saved state
  const savedState = loadHiitState()

  // View state: 'setup' or 'active'
  // If autoMaximize is true and we have saved state, go directly to active view
  const [view, setView] = useState(savedState?.hasStarted ? 'active' : 'setup')

  // If autoMaximize is true, start in maximized mode
  const initialMaximized = autoMaximize && savedState?.hasStarted

  // Timer state
  const [currentRound, setCurrentRound] = useState(savedState?.currentRound ?? 1)
  const [timeLeft, setTimeLeft] = useState(savedState?.timeLeft ?? HIIT_CONFIG.preparation.duration)
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
  const startTimeRef = useRef(null)

  const totalRounds = HIIT_CONFIG.rounds.length
  const preparationTime = HIIT_CONFIG.preparation.duration

  // Calculate total workout time
  const totalTime = calculateTotalTime()

  // Calculate total workout duration in seconds
  const getTotalWorkoutSeconds = () => {
    const prepTime = HIIT_CONFIG.preparation.duration
    const roundsTime = HIIT_CONFIG.rounds.reduce((total, round) => total + round.work + round.rest, 0)
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
        elapsed += HIIT_CONFIG.rounds[i].work + HIIT_CONFIG.rounds[i].rest
      }

      // Add current round progress
      const currentRoundConfig = HIIT_CONFIG.rounds[currentRound - 1]
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
  // Outer circle: total workout progress (all 12 minutes)
  const calculateTotalProgress = () => {
    if (isFinished) return 100
    const totalSeconds = getTotalWorkoutSeconds()
    const elapsed = calculateElapsedTime()
    return Math.min(100, (elapsed / totalSeconds) * 100)
  }

  // Inner circle: current round progress (work + rest of this round)
  const calculateCurrentRoundProgress = () => {
    if (isFinished) return 100
    if (isPreparationPhase) {
      return ((preparationTime - timeLeft) / preparationTime) * 100
    }

    const currentRoundConfig = HIIT_CONFIG.rounds[currentRound - 1]
    if (!currentRoundConfig) return 0

    const roundDuration = currentRoundConfig.work + currentRoundConfig.rest
    let elapsedInRound = isWorkPhase
      ? currentRoundConfig.work - timeLeft
      : currentRoundConfig.work + (currentRoundConfig.rest - timeLeft)

    return Math.min(100, (elapsedInRound / roundDuration) * 100)
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
      const isFinalRest = currentRound >= totalRounds

      // Don't play countdown on final rest (celebration phase)
      if (!isFinalRest && secondsLeft <= 3 && secondsLeft >= 1 && lastBeepRef.current !== secondsLeft) {
        lastBeepRef.current = secondsLeft
        playCountdownSound(secondsLeft)
      }
    }

    // Reset beep tracker when phase changes
    if (isWorkPhase || isPreparationPhase) {
      lastBeepRef.current = 0
    }
  }, [timeLeft, isRunning, isFinished, isWorkPhase, isPreparationPhase, musicMode, currentRound, totalRounds])

  // Handle phase completion - returns the new timeLeft value
  const handlePhaseComplete = () => {
    if (isPreparationPhase) {
      // Move to first work phase
      setIsPreparationPhase(false)
      setIsWorkPhase(true)
      setCurrentSubtitle(HIIT_CONFIG.rounds[0].workSubtitle)
      if (!musicMode) playWorkSound()
      return HIIT_CONFIG.rounds[0].work
    } else if (isWorkPhase) {
      // Move to rest phase
      setIsWorkPhase(false)
      setCurrentSubtitle(HIIT_CONFIG.rounds[currentRound - 1].restSubtitle)
      return HIIT_CONFIG.rounds[currentRound - 1].rest
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
        setCurrentSubtitle(HIIT_CONFIG.rounds[nextRound - 1].workSubtitle)
        if (!musicMode) playWorkSound()
        return HIIT_CONFIG.rounds[nextRound - 1].work
      }
    }
  }

  // Handle workout completion
  const handleWorkoutComplete = () => {
    setIsRunning(false)
    setIsFinished(true)
    setShowConfetti(true)
    setCurrentSubtitle("Amazing workout! You crushed it!")

    clearHiitState()

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
      const audioPlayer = getAudioPlayer()
      if (audioPlayer && audioPlayer.paused) {
        resumeHiitSong()
      } else if (!audioPlayer) {
        playHiitSong()
      }
    }
  }

  const handlePause = () => {
    setIsRunning(false)

    // Always pause audio when in music mode
    if (musicMode) {
      pauseHiitSong()
    }

    // Save state
    saveHiitState({
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
      stopHiitSong()
    }

    clearHiitState()
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
      initializeAudioPlayer()
    }
  }

  const handleToggleFullscreen = () => {
    setIsMaximized(!isMaximized)
  }

  const handleToggleMusicMode = () => {
    // Stop current audio if switching modes
    if (musicMode) {
      stopHiitSong()
    }
    setMusicMode(!musicMode)
  }

  // Calibration: log current audio time to console
  const calibrationMarksRef = useRef([])
  const handleCalibrate = () => {
    const audioTime = getAudioPosition()
    const markIndex = calibrationMarksRef.current.length
    const isWork = markIndex % 2 === 0
    const roundNum = Math.floor(markIndex / 2) + 1

    const mark = {
      index: markIndex + 1,
      time: audioTime,
      type: isWork ? 'WORK' : 'REST',
      round: roundNum
    }

    calibrationMarksRef.current.push(mark)

    const mins = Math.floor(audioTime / 60)
    const secs = Math.floor(audioTime % 60)
    const ms = Math.floor((audioTime % 1) * 1000)
    const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`

    console.log(`%c[MARK ${mark.index}] ${timeStr} - ${mark.type} Round ${mark.round}`,
      `color: ${isWork ? '#00ff88' : '#ffaa00'}; font-size: 16px; font-weight: bold;`)

    // Also log the raw seconds for config
    console.log(`  → ${audioTime.toFixed(3)}s`)

    // If we have pairs, log the duration
    if (!isWork && calibrationMarksRef.current.length >= 2) {
      const prevMark = calibrationMarksRef.current[calibrationMarksRef.current.length - 2]
      const duration = audioTime - prevMark.time
      console.log(`  → Work duration: ${duration.toFixed(2)}s`)
    }
  }

  // Save state on unmount
  useEffect(() => {
    return () => {
      if (view === 'active' && !isFinished) {
        saveHiitState({
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
    <div className="hiit-timer-new">
      {view === 'setup' ? (
        <HiitSetupView
          config={HIIT_CONFIG}
          onStart={handleStartWorkout}
          onBackClick={onBackClick}
          totalTime={totalTime}
        />
      ) : (
        <HiitActiveView
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
          roundProgress={calculateCurrentRoundProgress()}
          onBackClick={handleBackToSetup}
          onStart={handleStart}
          onPause={handlePause}
          onReset={handleReset}
          onSkip={handleSkip}
          onToggleFullscreen={handleToggleFullscreen}
          isMaximized={isMaximized}
          musicMode={musicMode}
          onToggleMusicMode={handleToggleMusicMode}
          onCalibrate={handleCalibrate}
        />
      )}
    </div>
  )
}

export default HiitTimerNew
