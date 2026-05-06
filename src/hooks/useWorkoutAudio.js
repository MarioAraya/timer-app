export function useWorkoutAudio({ audioObj, musicMode, setMusicMode, isFinished, setIsRunning, onPause }) {
  const handleStart = () => {
    if (isFinished) return
    setIsRunning(true)
    if (musicMode) {
      const player = audioObj.getPlayer()
      if (player && player.paused) {
        audioObj.resume()
      } else if (!player) {
        audioObj.play()
      }
    }
  }

  const handlePause = () => {
    setIsRunning(false)
    if (musicMode) audioObj.pause()
    onPause?.()
  }

  const handleToggleMusicMode = () => {
    if (musicMode) audioObj.stop()
    setMusicMode(!musicMode)
  }

  return { handleStart, handlePause, handleToggleMusicMode }
}
