import { useState, useEffect } from 'preact/hooks'
import { playWorkSound, playBeep, playCountdownSound } from '../utils/audioUtils'
import { getBreakDuration, getPhaseMessage, getPhaseSubtitle } from '../config/pomodoroConfig'
import { POMODORO_CONFIG } from '../config/pomodoroConfig'
import { incrementSessionCount } from '../utils/localStorage'

/**
 * Pomodoro timer logic hook
 * Manages Pomodoro-specific timer state and phase transitions
 */
export function usePomodoroTimer({
  savedState,
  musicMode,
  playerStatus,
  audioFunctions
}) {
  const [currentSession, setCurrentSession] = useState(savedState?.currentSession || 1)
  const [timeLeft, setTimeLeft] = useState(savedState?.timeLeft || POMODORO_CONFIG.workDuration)
  const [isWorkPhase, setIsWorkPhase] = useState(savedState?.isWorkPhase ?? true)
  const [isRunning, setIsRunning] = useState(false)
  const [isFinished, setIsFinished] = useState(savedState?.isFinished || false)
  const [currentMessage, setCurrentMessage] = useState(savedState?.currentMessage || POMODORO_CONFIG.messages.preparation)
  const [currentSubtitle, setCurrentSubtitle] = useState(savedState?.currentSubtitle || POMODORO_CONFIG.subtitles.preparation)
  const [showConfetti, setShowConfetti] = useState(false)

  // Timer countdown logic
  useEffect(() => {
    let interval = null

    if (isRunning && !isFinished) {
      interval = setInterval(() => {
        setTimeLeft(time => {
          if (time <= 1) {
            // Phase transition logic
            if (isWorkPhase) {
              // Work phase ending - stop music
              if (musicMode && playerStatus === 'ready') {
                audioFunctions.stop()
              }

              // Play completion beep (only if not in music mode)
              if (!musicMode) {
                playBeep(1200, 300, 0.4)
              }

              // Go to break
              const breakDuration = getBreakDuration(currentSession)
              setIsWorkPhase(false)
              setCurrentMessage(getPhaseMessage(false, currentSession))
              setCurrentSubtitle(getPhaseSubtitle(false, currentSession))
              return breakDuration
            } else {
              // Break phase ending
              const isLongBreak = currentSession % POMODORO_CONFIG.sessionsBeforeLongBreak === 0

              if (isLongBreak) {
                // After long break, show completion
                setIsRunning(false)
                setIsFinished(true)
                setShowConfetti(true)
                playBeep(1500, 500, 0.5)
                setCurrentMessage("🎉 Pomodoro Cycle Complete!")
                setCurrentSubtitle(`Completed ${currentSession} sessions!`)
                incrementSessionCount('pomodoro')
                return 0
              } else {
                // After short break, start next work session
                const nextSession = currentSession + 1
                setCurrentSession(nextSession)
                setIsWorkPhase(true)
                setCurrentMessage(getPhaseMessage(true, nextSession))
                setCurrentSubtitle(getPhaseSubtitle(true, nextSession))

                // Start music if in music mode
                if (musicMode && playerStatus === 'ready') {
                  audioFunctions.play()
                } else {
                  playWorkSound()
                }

                return POMODORO_CONFIG.workDuration
              }
            }
          }

          // Play countdown sounds during last 3 seconds of work phase
          if (!musicMode && isWorkPhase && time <= 4 && time > 1) {
            playCountdownSound(time - 1)
          }

          return time - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, isWorkPhase, currentSession, isFinished, musicMode, playerStatus])

  const hasStarted = () => {
    return !(
      isWorkPhase &&
      timeLeft === POMODORO_CONFIG.workDuration &&
      !isRunning &&
      currentSession === 1 &&
      currentMessage === POMODORO_CONFIG.messages.preparation
    )
  }

  return {
    currentSession,
    timeLeft,
    isWorkPhase,
    isRunning,
    isFinished,
    currentMessage,
    currentSubtitle,
    showConfetti,
    setCurrentSession,
    setTimeLeft,
    setIsWorkPhase,
    setIsRunning,
    setIsFinished,
    setCurrentMessage,
    setCurrentSubtitle,
    setShowConfetti,
    hasStarted
  }
}
