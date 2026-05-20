import { useState, useEffect, useRef } from 'preact/hooks'
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

  // Timer countdown — rAF + wall-clock anchor (no drift, ~60fps updates)
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

      if (next <= 0) {
        if (isWorkPhase) {
          if (musicMode && playerStatus === 'ready') audioFunctions.stop()
          if (!musicMode) playBeep(1200, 300, 0.4)
          const breakDuration = getBreakDuration(currentSession, config)
          setIsWorkPhase(false)
          setCurrentMessage(getPhaseMessage(false, currentSession, config))
          setCurrentSubtitle(getPhaseSubtitle(false, currentSession, config))
          setTimeLeft(breakDuration)
        } else {
          const isLongBreak = currentSession % config.sessionsBeforeLongBreak === 0
          if (isLongBreak) {
            setIsRunning(false)
            setIsFinished(true)
            setShowConfetti(true)
            playBeep(1500, 500, 0.5)
            setCurrentMessage("🎉 Pomodoro Cycle Complete!")
            setCurrentSubtitle(`Completed ${currentSession} sessions!`)
            incrementSessionCount('pomodoro')
            setTimeLeft(0)
          } else {
            const nextSession = currentSession + 1
            setCurrentSession(nextSession)
            setIsWorkPhase(true)
            setCurrentMessage(getPhaseMessage(true, nextSession, config))
            setCurrentSubtitle(getPhaseSubtitle(true, nextSession, config))
            if (musicMode && playerStatus !== 'error') audioFunctions.play()
            else playWorkSound()
            setTimeLeft(config.workDuration)
          }
        }
        return
      }

      // Countdown beeps last 3 seconds of work phase
      if (!musicMode && isWorkPhase) {
        const secondsLeft = Math.ceil(next)
        if (secondsLeft <= 3 && secondsLeft >= 1 && lastBeepRef.current !== secondsLeft) {
          lastBeepRef.current = secondsLeft
          playCountdownSound(secondsLeft)
        }
      }

      setTimeLeft(Math.ceil(next)) // integer display, no float rendering
      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [isRunning, isFinished, isWorkPhase, currentSession, musicMode, playerStatus])

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
