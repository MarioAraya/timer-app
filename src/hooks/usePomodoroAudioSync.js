import { useState, useEffect, useRef } from 'preact/hooks'

/**
 * Manages the lofi audio player lifecycle for Pomodoro: init, volume,
 * play/pause tracking, MediaSession integration, and syncing audio
 * play/pause events with the timer's running state.
 */
export function usePomodoroAudioSync({
  musicMode,
  setMusicMode,
  playerStatus,
  setPlayerStatus,
  volume,
  setVolume,
  isRunning,
  setIsRunning,
  isFinished,
  isWorkPhase,
  hasStarted,
  audioFunctions,
}) {
  const [musicPlaying, setMusicPlaying] = useState(false)

  const ignoreNextPause = useRef(false)
  const ignoreNextPlay = useRef(false)

  // Initialize audio when music mode enabled
  useEffect(() => {
    if (musicMode && playerStatus === 'idle') {
      setPlayerStatus('loading')
      audioFunctions.initialize().then(ready => {
        setPlayerStatus(ready ? 'ready' : 'error')
      })
    }
  }, [musicMode, playerStatus])

  // Start music immediately if timer already running when music becomes ready
  useEffect(() => {
    if (musicMode && playerStatus === 'ready' && isRunning && isWorkPhase) {
      ignoreNextPlay.current = true
      audioFunctions.resume()
    }
  }, [playerStatus])

  // Update audio volume
  useEffect(() => {
    const audioPlayer = audioFunctions.getPlayer()
    if (audioPlayer) audioPlayer.volume = volume
  }, [volume])

  // Track music play/pause state for standalone play/pause button
  useEffect(() => {
    const audio = audioFunctions.getPlayer()
    if (!audio) return
    const onPlay = () => setMusicPlaying(true)
    const onPause = () => { if (!audioFunctions.shouldIgnorePause()) setMusicPlaying(false) }
    const onEnded = () => setMusicPlaying(false)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onEnded)
    return () => {
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', onEnded)
    }
  }, [playerStatus])

  // Standalone music play/pause toggle — independent of timer state.
  // Synchronous inside user gesture so Safari grants autoplay activation.
  const handleMusicToggle = (e) => {
    e.stopPropagation()
    if (!musicMode) {
      setMusicMode(true)
      audioFunctions.play()
      return
    }
    if (audioFunctions.isPlaying()) {
      audioFunctions.pause()
    } else if (audioFunctions.isReady()) {
      audioFunctions.resume()
    } else {
      audioFunctions.play()
    }
  }

  // Sync audio play/pause events with timer
  useEffect(() => {
    if (!musicMode || playerStatus !== 'ready') return

    const handleAudioPause = () => {
      if (ignoreNextPause.current) { ignoreNextPause.current = false; return }
      if (audioFunctions.shouldIgnorePause()) return
      if (isRunning && isWorkPhase && hasStarted()) setIsRunning(false)
    }

    const handleAudioPlay = () => {
      if (ignoreNextPlay.current) { ignoreNextPlay.current = false; return }
      if (!isRunning && !isFinished && isWorkPhase && hasStarted()) setIsRunning(true)
    }

    const audioPlayer = audioFunctions.getPlayer()
    if (audioPlayer) {
      audioPlayer.addEventListener('pause', handleAudioPause)
      audioPlayer.addEventListener('play', handleAudioPlay)

      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: 'Pomodoro Focus',
          artist: 'Timer App',
          album: 'Productivity',
        })
        navigator.mediaSession.setActionHandler('play', () => {
          if (!isRunning && !isFinished && isWorkPhase && playerStatus === 'ready') {
            ignoreNextPlay.current = true
            audioFunctions.resume()
            setIsRunning(true)
          }
        })
        navigator.mediaSession.setActionHandler('pause', () => {
          if (isRunning && isWorkPhase) {
            ignoreNextPause.current = true
            audioFunctions.pause()
            setIsRunning(false)
          }
        })
      }

      return () => {
        audioPlayer.removeEventListener('pause', handleAudioPause)
        audioPlayer.removeEventListener('play', handleAudioPlay)
        if ('mediaSession' in navigator) {
          navigator.mediaSession.setActionHandler('play', null)
          navigator.mediaSession.setActionHandler('pause', null)
        }
      }
    }
  }, [musicMode, playerStatus, isRunning, isFinished, isWorkPhase])

  return {
    musicPlaying,
    handleMusicToggle,
    ignoreNextPause,
    ignoreNextPlay,
  }
}
