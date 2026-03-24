import { useEffect } from 'preact/hooks'

/**
 * Seek controls hook
 * Handles keyboard arrow keys for seeking forward/backward in timer
 */
export function useSeekControls({
  isRunning,
  isFinished,
  isPreparationPhase,
  currentRound,
  timeLeft,
  isWorkPhase,
  musicMode,
  playerStatus,
  config,
  audioFunctions,
  setCurrentRound,
  setIsWorkPhase,
  setTimeLeft,
  setIsPreparationPhase,
  setCurrentSubtitle
}) {
  const preparationTime = config.preparation.duration

  // Seek forward/backward in timer and audio
  const handleSeek = (seconds) => {
    if (isFinished || isPreparationPhase) return

    // Calculate total elapsed time from start of workout
    let totalElapsedTime = preparationTime

    // Add completed rounds
    for (let i = 0; i < currentRound - 1; i++) {
      totalElapsedTime += config.rounds[i].work + config.rounds[i].rest
    }

    // Add current phase time
    const currentRoundConfig = config.rounds[currentRound - 1]
    if (isWorkPhase) {
      totalElapsedTime += currentRoundConfig.work - timeLeft
    } else {
      totalElapsedTime += currentRoundConfig.work + (currentRoundConfig.rest - timeLeft)
    }

    // Apply seek offset
    totalElapsedTime += seconds

    // Clamp to valid range
    const totalWorkoutTime = preparationTime + config.rounds.reduce((sum, r) => sum + r.work + r.rest, 0)
    totalElapsedTime = Math.max(preparationTime, Math.min(totalElapsedTime, totalWorkoutTime - 1))

    // Calculate new position
    let remainingTime = totalElapsedTime - preparationTime
    let newRound = 1
    let newIsWorkPhase = true
    let newTimeLeft = 0

    for (let i = 0; i < config.rounds.length; i++) {
      const roundConfig = config.rounds[i]

      if (remainingTime <= roundConfig.work) {
        newRound = i + 1
        newIsWorkPhase = true
        newTimeLeft = roundConfig.work - remainingTime
        break
      }
      remainingTime -= roundConfig.work

      if (remainingTime <= roundConfig.rest) {
        newRound = i + 1
        newIsWorkPhase = false
        newTimeLeft = roundConfig.rest - remainingTime
        break
      }
      remainingTime -= roundConfig.rest
    }

    // Update state
    setCurrentRound(newRound)
    setIsWorkPhase(newIsWorkPhase)
    setTimeLeft(Math.max(1, newTimeLeft))
    setIsPreparationPhase(false)
    setCurrentSubtitle(
      newIsWorkPhase
        ? config.rounds[newRound - 1].workSubtitle
        : config.rounds[newRound - 1].restSubtitle
    )

    // Seek audio if in music mode
    if (musicMode && playerStatus === 'ready') {
      const audioPlayer = audioFunctions.getPlayer()
      if (audioPlayer) {
        const newAudioTime = totalElapsedTime
        audioPlayer.currentTime = newAudioTime
        console.log(`⏩ Seeked to ${seconds > 0 ? '+' : ''}${seconds}s (audio: ${newAudioTime.toFixed(2)}s, round: ${newRound}, ${newIsWorkPhase ? 'work' : 'rest'})`)
      }
    }
  }

  // Handle keyboard events for seeking
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isRunning || isFinished) return

      if (e.key === 'ArrowRight') {
        e.preventDefault()
        handleSeek(10)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        handleSeek(-10)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isRunning, isFinished, isPreparationPhase, currentRound, timeLeft, isWorkPhase, musicMode, playerStatus])

  return { handleSeek }
}
