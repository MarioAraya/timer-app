import { useState, useEffect, useRef } from 'preact/hooks'
import './TabataTimer.scss'
import TabataSetupView from './TabataSetupView'
import TabataActiveView from './TabataActiveView'
import { tabataAudio, playWorkSound, playCountdownSound } from '../../utils/audioUtils'
import { TABATA_CONFIG, calculateTabataTotalTime } from '../../config/tabataConfig'
import { saveTabataState, loadTabataState, clearTabataState, incrementSessionCount } from '../../utils/localStorage'
import { calculateElapsedTime, calculateTotalProgress, calculateRoundProgress } from '../../utils/timerHelpers'
import { useWorkoutAudio } from '../../hooks/useWorkoutAudio'
import { useLang } from '../../context/LanguageContext'

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
  const { t } = useLang()
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

  const timerCtx = { config: TABATA_CONFIG, preparationTime, currentRound, timeLeft, isWorkPhase, isPreparationPhase }

  const { handleStart, handlePause, handleToggleMusicMode } = useWorkoutAudio({
    audioObj: tabataAudio,
    musicMode,
    setMusicMode,
    isFinished,
    setIsRunning,
    onPause: () => saveTabataState({
      currentRound, timeLeft, isWorkPhase, isPreparationPhase,
      isFinished, currentSubtitle, musicMode, volume, hasStarted: true
    })
  })

  // Update elapsed time
  useEffect(() => {
    setTotalElapsed(calculateElapsedTime(timerCtx))
  }, [currentRound, timeLeft, isWorkPhase, isPreparationPhase])

  // Timer effect — rAF + wall-clock anchor (no drift, ~60fps updates)
  const lastBeepRef = useRef(0)
  useEffect(() => {
    if (!isRunning || isFinished) return

    const start = performance.now()
    const startTime = timeLeft
    lastBeepRef.current = 0
    let rafId

    const tick = () => {
      const elapsed = (performance.now() - start) / 1000
      const next = startTime - elapsed

      // Countdown beeps before every phase transition (in non-music mode)
      if (!musicMode) {
        const secondsLeft = Math.ceil(next)
        const isFinalRest = !isPreparationPhase && !isWorkPhase && currentRound >= totalRounds
        if (!isFinalRest && secondsLeft <= 3 && secondsLeft >= 1 && lastBeepRef.current !== secondsLeft) {
          lastBeepRef.current = secondsLeft
          playCountdownSound(secondsLeft)
        }
      }

      if (next <= 0) {
        setTimeLeft(handlePhaseComplete())
        return
      }
      setTimeLeft(next)
      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [isRunning, isFinished, currentRound, isWorkPhase, isPreparationPhase])

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
    setCurrentSubtitle(t('tabata.finishedSubtitle'))
    incrementSessionCount('tabata')
    clearTabataState()
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
      tabataAudio.stop()
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
      tabataAudio.initialize()
    }
  }

  const handleToggleFullscreen = () => {
    setIsMaximized(!isMaximized)
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
          totalProgress={calculateTotalProgress({ ...timerCtx, isFinished })}
          roundProgress={calculateRoundProgress({ ...timerCtx, isFinished })}
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
