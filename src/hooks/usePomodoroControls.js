import { playWorkSound } from '../utils/audioUtils'
import { getBreakDuration, getPhaseMessage, getPhaseSubtitle } from '../config/pomodoroConfig'
import { POMODORO_CONFIG } from '../config/pomodoroConfig'

/**
 * Pomodoro controls hook
 * Provides start, pause, reset, and skip handlers for Pomodoro timer
 */
export function usePomodoroControls({
  musicMode,
  playerStatus,
  audioFunctions,
  isWorkPhase,
  currentSession,
  hasStarted,
  ignoreNextPlay,
  ignoreNextPause,
  setIsRunning,
  setIsFinished,
  setCurrentSession,
  setIsWorkPhase,
  setTimeLeft,
  setCurrentMessage,
  setCurrentSubtitle,
  setShowConfetti,
  storageFunctions
}) {
  const handleStart = () => {
    setIsRunning(true)

    // If starting fresh, set initial message
    if (!hasStarted()) {
      setCurrentMessage(getPhaseMessage(true, currentSession))
      setCurrentSubtitle(getPhaseSubtitle(true, currentSession))

      // Play appropriate sound
      if (musicMode && playerStatus === 'ready' && isWorkPhase) {
        ignoreNextPlay.current = true
        audioFunctions.play()
      } else {
        playWorkSound()
      }
    } else if (isWorkPhase && musicMode && playerStatus === 'ready') {
      // Resuming work phase with music
      ignoreNextPlay.current = true
      audioFunctions.resume()
    }
  }

  const handlePause = () => {
    setIsRunning(false)

    // Pause music if in work phase
    if (isWorkPhase && musicMode && playerStatus === 'ready') {
      ignoreNextPause.current = true
      audioFunctions.pause()
    }
  }

  const handleReset = () => {
    setIsRunning(false)
    setIsFinished(false)
    setCurrentSession(1)
    setIsWorkPhase(true)
    setTimeLeft(POMODORO_CONFIG.workDuration)
    setCurrentMessage(POMODORO_CONFIG.messages.preparation)
    setCurrentSubtitle(POMODORO_CONFIG.subtitles.preparation)
    setShowConfetti(false)

    // Stop music if playing
    if (musicMode && playerStatus === 'ready') {
      ignoreNextPause.current = true
      audioFunctions.stop()
    }

    storageFunctions.clear()
  }

  const handleSkip = () => {
    if (isWorkPhase) {
      // Skip work - go to break
      if (musicMode && playerStatus === 'ready') {
        ignoreNextPause.current = true
        audioFunctions.stop()
      }

      const breakDuration = getBreakDuration(currentSession)
      setIsWorkPhase(false)
      setTimeLeft(breakDuration)
      setCurrentMessage(getPhaseMessage(false, currentSession))
      setCurrentSubtitle(getPhaseSubtitle(false, currentSession))
    } else {
      // Skip break - go to next work session or finish
      const isLongBreak = currentSession % POMODORO_CONFIG.sessionsBeforeLongBreak === 0

      if (isLongBreak) {
        // After long break, finish
        setIsFinished(true)
        setIsRunning(false)
        setTimeLeft(0)
        setShowConfetti(true)
        setCurrentMessage("🎉 Pomodoro Cycle Complete!")
        setCurrentSubtitle(`Completed ${currentSession} sessions!`)
      } else {
        // Start next work session
        const nextSession = currentSession + 1
        setCurrentSession(nextSession)
        setIsWorkPhase(true)
        setTimeLeft(POMODORO_CONFIG.workDuration)
        setCurrentMessage(getPhaseMessage(true, nextSession))
        setCurrentSubtitle(getPhaseSubtitle(true, nextSession))

        // Start music if timer is running and in music mode
        const isRunning = true // We're in running state if skipping
        if (isRunning && musicMode && playerStatus === 'ready') {
          ignoreNextPlay.current = true
          audioFunctions.play()
        }
      }
    }
  }

  return {
    handleStart,
    handlePause,
    handleReset,
    handleSkip
  }
}
