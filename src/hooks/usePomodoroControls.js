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
  storageFunctions,
  config = POMODORO_CONFIG
}) {
  const handleStart = () => {
    setIsRunning(true)

    // If starting fresh, set initial message
    if (!hasStarted()) {
      setCurrentMessage(getPhaseMessage(true, currentSession))
      setCurrentSubtitle(getPhaseSubtitle(true, currentSession))

      // Play appropriate sound
      if (musicMode && isWorkPhase && playerStatus !== 'error') {
        ignoreNextPlay.current = true
        audioFunctions.play()
        // Beep as immediate feedback if music not loaded yet
        if (playerStatus !== 'ready') playWorkSound()
      } else {
        playWorkSound()
      }
    } else if (isWorkPhase && musicMode && playerStatus !== 'error') {
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
    setTimeLeft(config.workDuration)
    setCurrentMessage(config.messages.preparation)
    setCurrentSubtitle(config.subtitles.preparation)
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
      if (musicMode && playerStatus === 'ready') {
        ignoreNextPause.current = true
        audioFunctions.stop()
      }

      const breakDuration = getBreakDuration(currentSession, config)
      setIsWorkPhase(false)
      setTimeLeft(breakDuration)
      setCurrentMessage(getPhaseMessage(false, currentSession, config))
      setCurrentSubtitle(getPhaseSubtitle(false, currentSession, config))
    } else {
      const isLongBreak = currentSession % config.sessionsBeforeLongBreak === 0

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
        setTimeLeft(config.workDuration)
        setCurrentMessage(getPhaseMessage(true, nextSession, config))
        setCurrentSubtitle(getPhaseSubtitle(true, nextSession, config))

        if (musicMode && playerStatus !== 'error') {
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
