import { useState, useEffect, useRef } from 'preact/hooks'
import './HiitTimer.scss'
import HiitSetupView from './HiitSetupView'
import HiitActiveView from './HiitActiveView'
import { hiitAudio, playWorkSound, playCountdownSound, playCheerSound } from '../../utils/audioUtils'
import { HIIT_CONFIG } from '../../config/hiitConfig'
import { saveHiitState, loadHiitState, clearHiitState, incrementSessionCount } from '../../utils/localStorage'
import { calculateElapsedTime, calculateTotalProgress, calculateRoundProgress } from '../../utils/timerHelpers'
import { useWorkoutAudio } from '../../hooks/useWorkoutAudio'
import { useDesktopIntegration } from '../../hooks/useDesktopIntegration'
import { useLang } from '../../context/LanguageContext'

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
  onFinish,
  onRunningChange,
}) {
  const { t } = useLang()
  // Load saved state; a finished workout must not restore into the
  // "Complete" screen — re-entry starts fresh (feature #25)
  let savedState = loadHiitState()
  if (savedState?.isFinished) {
    clearHiitState()
    savedState = null
  }

  // Config lives in a modal over the active view — the cog opens it
  const [showSetup, setShowSetup] = useState(false)

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
  const [audioError, setAudioError] = useState(false)

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
    }),
    onAudioError: () => setAudioError(true)
  })

  useEffect(() => {
    onRunningChange?.(isRunning)
  }, [isRunning])

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
      timerRef.current = rafId
    }

    timerRef.current = requestAnimationFrame(tick)
    rafId = timerRef.current
    return () => {
      cancelAnimationFrame(rafId)
      timerRef.current = null
    }
  }, [isRunning, isFinished, currentRound, isWorkPhase, isPreparationPhase])

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
      // Last round: finish immediately after work, skip rest
      if (currentRound >= totalRounds) {
        handleWorkoutComplete()
        return 0
      }
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
    setCurrentSubtitle(t('hiit.finishedSubtitle'))
    incrementSessionCount('hiit')
    clearHiitState()
    playCheerSound()
  }

  const handleReset = () => {
    if (timerRef.current) {
      cancelAnimationFrame(timerRef.current)
      timerRef.current = null
    }
    setIsRunning(false)
    setCurrentRound(1)
    setTimeLeft(preparationTime)
    setIsWorkPhase(true)
    setIsPreparationPhase(true)
    setIsFinished(false)
    setCurrentSubtitle('')
    setShowConfetti(false)

    if (musicMode) {
      // reset(), not stop(): parks the playhead exactly on startTime so the
      // next Play does not clip the opening of the track.
      hiitAudio.reset()
    }

    clearHiitState()
  }

  const handleOpenSetup = () => {
    if (isRunning) handlePause()
    setShowSetup(true)
  }

  const handleSkip = () => {
    if (isFinished) return
    const newTime = handlePhaseComplete()
    setTimeLeft(newTime)
  }

  const handleToggleFullscreen = () => {
    setIsMaximized(!isMaximized)
  }

  // Keep-awake, menubar label and tray controls. No-op outside the macOS app.
  useDesktopIntegration({
    isRunning,
    timeLeft,
    onToggle: () => (isRunning ? handlePause() : handleStart()),
    onSkip: handleSkip,
    onReset: handleReset,
  })

  // Calibration: log current audio time to console
  const calibrationMarksRef = useRef([])
  const handleCalibrate = () => {
    const audioTime = hiitAudio.getPosition()

    // getPosition() is null until the MP3 is loaded, and in beeps mode it never
    // loads. Marking then would push NaN into the list and poison every
    // duration derived from it afterwards.
    if (audioTime == null) {
      console.warn('[calibrate] no audio position yet — start the workout in Music mode first')
      return
    }

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

    // Duration of the phase this mark just closed
    const marks = calibrationMarksRef.current
    if (marks.length >= 2) {
      const prev = marks[marks.length - 2]
      const duration = audioTime - prev.time
      console.log(`  → ${prev.type} round ${prev.round} lasted ${duration.toFixed(2)}s`)
    }

    dumpCalibration()
  }

  // Prints the marks so far as a paste-ready HIIT_TICKS block. Reprinted after
  // every mark, so whatever is at the bottom of the console when the workout
  // ends is the complete list.
  const dumpCalibration = () => {
    const marks = calibrationMarksRef.current
    if (!marks.length) return

    const lines = marks.map(m =>
      `  { time: ${m.time.toFixed(3)}, phase: '${m.type.toLowerCase()}', round: ${m.round} },`
    )
    console.log(
      `%c─── HIIT_TICKS (${marks.length} marks) ───\n{ time: 0, phase: 'prep' },\n${lines.join('\n')}`,
      'color:#888'
    )
  }

  // M marks a calibration point against the MP3 clock — see
  // docs/HIIT_CALIBRATION_NEXT_LEVEL.md. Not SPACE: that toggles playback, and
  // one key doing both would pause the song on every mark.
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== 'm' && e.key !== 'M') return
      const target = e.target
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return
      e.preventDefault()
      handleCalibrate()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  })

  // Save state on unmount (not on every state change — a cleanup keyed to
  // state deps re-fires on reset and re-saves the stale pre-reset values,
  // overwriting the clearHiitState() call handleReset just made)
  const latestStateRef = useRef(null)
  useEffect(() => {
    latestStateRef.current = {
      currentRound, timeLeft, isWorkPhase, isPreparationPhase,
      isFinished, currentSubtitle, musicMode, volume
    }
  })

  useEffect(() => {
    return () => {
      const s = latestStateRef.current
      if (s && !s.isFinished) {
        saveHiitState({ ...s, hasStarted: true })
      }
    }
  }, [])

  // Pause music when leaving the timer (feature #11) — position is kept so
  // re-entering and pressing play resumes where it stopped
  useEffect(() => {
    return () => { hiitAudio.pause() }
  }, [])

  // Entering lands directly on the active view — preload audio on mount
  useEffect(() => {
    if (musicMode) {
      hiitAudio.initialize().then((ready) => {
        if (!ready) setAudioError(true)
      })
    }
  }, [])

  return (
    <div className="hiit-timer-new">
      {showSetup && (
        <HiitSetupView
          config={HIIT_CONFIG}
          onClose={() => setShowSetup(false)}
        />
      )}

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
        roundProgress={calculateRoundProgress({ ...timerCtx, isFinished })}
        onBackClick={onBackClick}
        onOpenSettings={handleOpenSetup}
        onStart={handleStart}
        onPause={handlePause}
        onReset={handleReset}
        onSkip={handleSkip}
        onToggleFullscreen={handleToggleFullscreen}
        isMaximized={isMaximized}
        musicMode={musicMode}
        onToggleMusicMode={handleToggleMusicMode}
        onCalibrate={handleCalibrate}
        audioError={audioError}
        onCloseAudioError={() => setAudioError(false)}
      />
    </div>
  )
}

export default HiitTimerNew
