import { useState, useEffect, useRef } from 'preact/hooks'

/**
 * Audio synchronization hook
 * Manages audio player initialization, event listeners, and media session
 */
export function useAudioSync({
  musicMode,
  audioFunctions,
  messages,
  isRunning,
  isFinished,
  hasStarted,
  savedState,
  workoutType
}) {
  const [playerStatus, setPlayerStatus] = useState('idle')
  const [stateRestored, setStateRestored] = useState(false)

  const ignoreNextPause = useRef(false)
  const ignoreNextPlay = useRef(false)

  // Initialize audio player when music mode is enabled
  useEffect(() => {
    if (musicMode && playerStatus === 'idle') {
      setPlayerStatus('loading')
      audioFunctions.initialize().then((ready) => {
        setPlayerStatus(ready ? 'ready' : 'error')

        // Restore audio position if we have saved state
        if (ready && savedState && savedState.audioPosition && !stateRestored) {
          audioFunctions.setPosition(savedState.audioPosition)
          setStateRestored(true)
          console.log(`🔄 Restored ${workoutType.toUpperCase()} audio position:`, savedState.audioPosition)
        }
      })
    }
  }, [musicMode, playerStatus])

  // Listen for audio pause/play events to sync timer
  useEffect(() => {
    if (!musicMode || playerStatus !== 'ready') return

    const handleAudioPause = (event) => {
      if (ignoreNextPause.current) {
        console.log('🔇 Ignoring pause event (triggered by our code)')
        ignoreNextPause.current = false
        return
      }

      if (audioFunctions.shouldIgnorePause()) {
        console.log('🔇 Ignoring spurious pause event (within 2s of playback start)')
        return
      }
    }

    const handleAudioPlay = (event) => {
      if (ignoreNextPlay.current) {
        console.log('🔊 Ignoring play event (triggered by our code)')
        ignoreNextPlay.current = false
        return
      }
    }

    const audioPlayer = audioFunctions.getPlayer()
    if (audioPlayer) {
      audioPlayer.addEventListener('pause', handleAudioPause)
      audioPlayer.addEventListener('play', handleAudioPlay)

      // Setup Media Session API for keyboard/system media controls
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: messages.mediaTitle,
          artist: 'Timer App',
          album: 'Fitness',
        })

        navigator.mediaSession.setActionHandler('play', () => {
          if (!isRunning && !isFinished && playerStatus === 'ready') {
            console.log('⌨️ Play from media controls')
            ignoreNextPlay.current = true
            audioFunctions.resume()
          }
        })
      }

      return () => {
        audioPlayer.removeEventListener('pause', handleAudioPause)
        audioPlayer.removeEventListener('play', handleAudioPlay)

        if ('mediaSession' in navigator) {
          navigator.mediaSession.setActionHandler('play', null)
        }
      }
    }
  }, [musicMode, playerStatus, isRunning, isFinished])

  return {
    playerStatus,
    ignoreNextPause,
    ignoreNextPlay
  }
}
