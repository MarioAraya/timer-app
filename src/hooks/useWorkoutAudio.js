import { playBeep } from '../utils/audioUtils'

export function useWorkoutAudio({ audioObj, musicMode, setMusicMode, isFinished, setIsRunning, onPause, onAudioError }) {
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
    const next = !musicMode
    if (musicMode) audioObj.stop()
    setMusicMode(next)

    // Confirmation tone so the user knows audio output works
    playBeep(880, 120, 0.35)

    // Check the MP3 actually loads when switching into music mode
    if (next) {
      audioObj.initialize().then((ready) => {
        if (!ready) onAudioError?.()
      })
    }
  }

  return { handleStart, handlePause, handleToggleMusicMode }
}
