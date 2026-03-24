/**
 * Timer controls hook
 * Provides start, pause, reset, and skip handlers
 */
export function useTimerControls({
  config,
  musicMode,
  playerStatus,
  audioFunctions,
  isPreparationPhase,
  timeLeft,
  preparationTime,
  isWorkPhase,
  currentRound,
  totalRounds,
  hasFinalRest,
  messages,
  ignoreNextPlay,
  ignoreNextPause,
  setIsRunning,
  setIsFinished,
  setCurrentRound,
  setIsWorkPhase,
  setIsPreparationPhase,
  setTimeLeft,
  setCurrentSubtitle,
  setShowConfetti,
  storageFunctions,
  workoutType
}) {
  const handleStart = () => {
    if (musicMode && playerStatus === 'loading') {
      return
    }

    setIsRunning(true)
    if (musicMode) {
      ignoreNextPlay.current = true

      if (isPreparationPhase && timeLeft === preparationTime) {
        audioFunctions.play()
      } else {
        audioFunctions.resume()
      }
    }
  }

  const handlePause = () => {
    setIsRunning(false)
    if (musicMode) {
      ignoreNextPause.current = true
      audioFunctions.pause()
    }
  }

  const handleReset = () => {
    setIsRunning(false)
    setIsFinished(false)
    setCurrentRound(1)
    setIsWorkPhase(true)
    setIsPreparationPhase(true)
    setTimeLeft(preparationTime)
    setCurrentSubtitle(config.preparation.subtitle)
    setShowConfetti(false)
    if (musicMode) {
      audioFunctions.stop()
    }
    storageFunctions.clear()
    console.log(`🗑️ Cleared saved ${workoutType} state`)
  }

  const handleSkip = () => {
    if (isPreparationPhase) {
      setIsPreparationPhase(false)
      setIsWorkPhase(true)
      setCurrentSubtitle(config.rounds[0].workSubtitle)
      setTimeLeft(config.rounds[0].work)
    } else if (isWorkPhase) {
      const currentRoundConfig = config.rounds[currentRound - 1]
      if (currentRound >= totalRounds) {
        if (hasFinalRest) {
          setIsWorkPhase(false)
          setCurrentSubtitle(messages.finalRest || "🎉 You just killed this workout!")
          setTimeLeft(currentRoundConfig.rest)
        } else {
          setIsFinished(true)
          setIsRunning(false)
          setTimeLeft(0)
          setShowConfetti(true)
          if (musicMode) {
            audioFunctions.stop()
          }
        }
      } else {
        setIsWorkPhase(false)
        setCurrentSubtitle(currentRoundConfig.restSubtitle)
        setTimeLeft(currentRoundConfig.rest)
      }
    } else {
      if (currentRound >= totalRounds) {
        setIsFinished(true)
        setIsRunning(false)
        setTimeLeft(0)
        setShowConfetti(true)
        if (musicMode) {
          audioFunctions.stop()
        }
      } else {
        const nextRound = currentRound + 1
        setCurrentRound(nextRound)
        setIsWorkPhase(true)
        setCurrentSubtitle(config.rounds[nextRound - 1].workSubtitle)
        setTimeLeft(config.rounds[nextRound - 1].work)
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
