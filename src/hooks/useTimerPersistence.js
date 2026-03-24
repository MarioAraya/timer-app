import { useState, useEffect, useRef } from 'preact/hooks'

/**
 * Timer state persistence hook
 * Saves/loads timer state to/from localStorage
 */
export function useTimerPersistence({
  workoutType,
  storageFunctions,
  savedState,
  isRunning,
  isFinished,
  hasStarted,
  musicMode,
  audioFunctions,
  currentRound,
  timeLeft,
  isWorkPhase,
  isPreparationPhase,
  currentSubtitle,
  volume
}) {
  const [stateRestored, setStateRestored] = useState(false)

  // Ref to track current state for cleanup
  const stateRef = useRef({
    currentRound,
    timeLeft,
    isWorkPhase,
    isPreparationPhase,
    isRunning,
    isFinished,
    currentSubtitle,
    musicMode,
    volume
  })

  // Update state ref whenever state changes
  useEffect(() => {
    stateRef.current = {
      currentRound,
      timeLeft,
      isWorkPhase,
      isPreparationPhase,
      isRunning,
      isFinished,
      currentSubtitle,
      musicMode,
      volume
    }
  }, [currentRound, timeLeft, isWorkPhase, isPreparationPhase, isRunning, isFinished, currentSubtitle, musicMode, volume])

  // Save state when paused
  useEffect(() => {
    if (!stateRestored && savedState) {
      setStateRestored(true)
      return
    }

    if (!isRunning && hasStarted()) {
      const audioPosition = musicMode ? audioFunctions.getPosition() : null

      const currentState = {
        currentRound,
        timeLeft,
        isWorkPhase,
        isPreparationPhase,
        isRunning,
        isFinished,
        currentSubtitle,
        musicMode,
        audioPosition,
        volume
      }

      storageFunctions.save(currentState)
      console.log(`💾 Saved ${workoutType} state (paused)`)
    }
  }, [isRunning, isFinished])

  // Save state when component unmounts
  useEffect(() => {
    return () => {
      console.log(`🔄 Unmounting ${workoutType} timer...`)

      const audioPlayer = audioFunctions.getPlayer()
      const currentAudioPosition = audioPlayer ? audioFunctions.getPosition() : null

      if (audioPlayer && !audioPlayer.paused) {
        console.log('⏸️ Pausing music before saving state')
        audioFunctions.pause()
      }

      setTimeout(() => {
        const state = stateRef.current
        storageFunctions.save({
          ...state,
          audioPosition: currentAudioPosition
        })
        console.log(`💾 Saved ${workoutType} state on unmount`)
      }, 100)
    }
  }, [])

  return { stateRestored, setStateRestored }
}
