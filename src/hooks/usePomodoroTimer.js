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
  audioFunctions,
  config = POMODORO_CONFIG
}) {
  const [currentSession, setCurrentSession] = useState(savedState?.currentSession || 1)
  const [timeLeft, setTimeLeft] = useState(savedState?.timeLeft || config.workDuration)
  const [isWorkPhase, setIsWorkPhase] = useState(savedState?.isWorkPhase ?? true)
  const [isRunning, setIsRunning] = useState(false)
  const [isFinished, setIsFinished] = useState(savedState?.isFinished || false)
  const [currentMessage, setCurrentMessage] = useState(savedState?.currentMessage || config.messages.preparation)
  const [currentSubtitle, setCurrentSubtitle] = useState(savedState?.currentSubtitle || config.subtitles.preparation)
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
              const breakDuration = getBreakDuration(currentSession, config)
              setIsWorkPhase(false)
              setCurrentMessage(getPhaseMessage(false, currentSession, config))
              setCurrentSubtitle(getPhaseSubtitle(false, currentSession, config))
              return breakDuration
            } else {
              // Break phase ending
              const isLongBreak = currentSession % config.sessionsBeforeLongBreak === 0

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
                setCurrentMessage(getPhaseMessage(true, nextSession, config))
                setCurrentSubtitle(getPhaseSubtitle(true, nextSession, config))

                if (musicMode && playerStatus !== 'error') {
                  audioFunctions.play()
                } else {
                  playWorkSound()
                }

                return config.workDuration
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
      timeLeft === config.workDuration &&
      !isRunning &&
      currentSession === 1 &&
      currentMessage === config.messages.preparation
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
