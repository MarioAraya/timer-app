import { useState, useEffect, useRef } from 'preact/hooks'
import './HiitTimer.scss'
import HiitSetupView from './HiitSetupView'
import HiitActiveView from './HiitActiveView'
import { hiitAudio, playWorkSound, playCountdownSound } from '../../utils/audioUtils'
import { HIIT_CONFIG, calculateTotalTime } from '../../config/hiitConfig'
import { saveHiitState, loadHiitState, clearHiitState } from '../../utils/localStorage'
import { calculateElapsedTime, calculateTotalProgress } from '../../utils/timerHelpers'
import { useWorkoutAudio } from '../../hooks/useWorkoutAudio'

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

  const timerCtx = { config: HIIT_CONFIG, preparationTime, currentRound, timeLeft, isWorkPhase, isPreparationPhase }

  const { handleStart, handlePause, handleToggleMusicMode } = useWorkoutAudio({
    audioObj: hiitAudio,
    musicMode,
    setMusicMode,
    isFinished,
    setIsRunning,
    onPause: () => saveHiitState({
      currentRound, timeLeft, isWorkPhase, isPreparationPhase,
      isFinished, currentSubtitle, musicMode, volume, hasStarted: true
    })
  })

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
    setTotalElapsed(calculateElapsedTime(timerCtx))
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

  // Countdown beeps effect (3-2-1 before every phase transition)
  const lastBeepRef = useRef(0)
  useEffect(() => {
    if (!musicMode && isRunning && !isFinished) {
      const secondsLeft = Math.ceil(timeLeft)
      const isFinalRest = !isPreparationPhase && !isWorkPhase && currentRound >= totalRounds

      if (!isFinalRest && secondsLeft <= 3 && secondsLeft >= 1 && lastBeepRef.current !== secondsLeft) {
        lastBeepRef.current = secondsLeft
        playCountdownSound(secondsLeft)
      }
    }

    if (!isRunning || timeLeft <= 0) {
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
      hiitAudio.stop()
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
      hiitAudio.initialize()
    }
  }

  const handleToggleFullscreen = () => {
    setIsMaximized(!isMaximized)
  }

  // Calibration: log current audio time to console
  const calibrationMarksRef = useRef([])
  const handleCalibrate = () => {
    const audioTime = hiitAudio.getPosition()
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
          totalProgress={calculateTotalProgress({ ...timerCtx, isFinished })}
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
