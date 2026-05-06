import { useState, useEffect, useRef } from 'preact/hooks'
import { playWorkSound, playCountdownSound } from '../utils/audioUtils'

/**
 * Core workout timer logic hook
 * Manages timer state, countdown, and phase transitions
 */
export function useWorkoutTimer({
  config,
  savedState,
  musicMode,
  audioFunctions,
  hasFinalRest,
  messages
}) {
  const [currentRound, setCurrentRound] = useState(savedState?.currentRound || 1)
  const [timeLeft, setTimeLeft] = useState(savedState?.timeLeft || config.preparation.duration)
  const [isWorkPhase, setIsWorkPhase] = useState(savedState?.isWorkPhase ?? true)
  const [isPreparationPhase, setIsPreparationPhase] = useState(savedState?.isPreparationPhase ?? true)
  const [isRunning, setIsRunning] = useState(false)
  const [isFinished, setIsFinished] = useState(savedState?.isFinished || false)
  const [currentSubtitle, setCurrentSubtitle] = useState(savedState?.currentSubtitle || config.preparation.subtitle)
  const [showConfetti, setShowConfetti] = useState(false)

  const totalRounds = config.rounds.length
  const preparationTime = config.preparation.duration

  // Timer interval logic
  useEffect(() => {
    let interval = null

    if (isRunning && !isFinished) {
      interval = setInterval(() => {
        setTimeLeft(time => {
          if (time <= 1) {
            // Phase transition logic
            if (isPreparationPhase) {
              // Preparation phase ending - start first work phase
              setIsPreparationPhase(false)
              setIsWorkPhase(true)
              setCurrentSubtitle(config.rounds[0].workSubtitle)
              if (!musicMode) playWorkSound()
              return config.rounds[0].work
            } else if (isWorkPhase) {
              // Work phase ending
              const currentRoundConfig = config.rounds[currentRound - 1]
              if (currentRound >= totalRounds) {
                // Final work phase
                if (hasFinalRest) {
                  // Go to final celebration rest (HIIT)
                  setIsWorkPhase(false)
                  setCurrentSubtitle(messages.finalRest || "🎉 You just killed this workout!")
                  return currentRoundConfig.rest
                } else {
                  // Workout complete (Tabata)
                  setIsRunning(false)
                  setIsFinished(true)
                  setShowConfetti(true)
                  if (musicMode) {
                    audioFunctions.stop()
                  }
                  return 0
                }
              } else {
                // Go to rest
                setIsWorkPhase(false)
                setCurrentSubtitle(currentRoundConfig.restSubtitle)
                return currentRoundConfig.rest
              }
            } else {
              // Rest phase ending
              if (currentRound >= totalRounds) {
                // Final rest phase ending - workout complete
                setIsRunning(false)
                setIsFinished(true)
                setShowConfetti(true)
                if (musicMode) {
                  audioFunctions.stop()
                }
                return 0
              } else {
                // Next round
                const nextRound = currentRound + 1
                setCurrentRound(nextRound)
                setIsWorkPhase(true)
                setCurrentSubtitle(config.rounds[nextRound - 1].workSubtitle)
                if (!musicMode) playWorkSound()
                return config.rounds[nextRound - 1].work
              }
            }
          }

          // Play countdown sounds before every phase transition
          if (!musicMode && time <= 4 && time > 1) {
            const isFinalRest = hasFinalRest && !isPreparationPhase && !isWorkPhase && currentRound >= totalRounds
            if (!isFinalRest) {
              playCountdownSound(time - 1)
            }
          }

          return time - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, isWorkPhase, isPreparationPhase, currentRound, isFinished, musicMode])

  const hasStarted = () => {
    return !(isPreparationPhase && timeLeft === preparationTime && !isRunning && currentRound === 1)
  }

  return {
    // State
    currentRound,
    timeLeft,
    isWorkPhase,
    isPreparationPhase,
    isRunning,
    isFinished,
    currentSubtitle,
    showConfetti,
    totalRounds,
    preparationTime,
    // State setters
    setCurrentRound,
    setTimeLeft,
    setIsWorkPhase,
    setIsPreparationPhase,
    setIsRunning,
    setIsFinished,
    setCurrentSubtitle,
    setShowConfetti,
    // Helpers
    hasStarted
  }
}
