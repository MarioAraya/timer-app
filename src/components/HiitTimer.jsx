import WorkoutTimer from './WorkoutTimer'
import './HiitTimer.scss'
import {
  playHiitSong,
  stopHiitSong,
  pauseHiitSong,
  resumeHiitSong,
  HIIT_AUDIO_CONFIG,
  initializeAudioPlayer,
  getAudioPosition,
  setAudioPosition,
  getAudioPlayer,
  shouldIgnoreHiitPause
} from '../utils/audioUtils'
import { HIIT_CONFIG, calculateTotalTime } from '../config/hiitConfig'
import { saveHiitState, loadHiitState, clearHiitState } from '../utils/localStorage'

/**
 * HIIT Timer Component
 * Thin wrapper around WorkoutTimer with HIIT-specific configuration
 *
 * HIIT (High-Intensity Interval Training):
 * - 12 rounds: 40s work / 20s rest
 * - 10s preparation phase
 * - Final rest after last work phase
 * - Total: ~12 minutes
 */
function HiitTimer({ name = 'HIIT Workout', autoMaximize = false, autoStart = false, showBackButton = true, onBackClick }) {
  // Audio functions configuration
  const audioFunctions = {
    initialize: initializeAudioPlayer,
    play: playHiitSong,
    stop: stopHiitSong,
    pause: pauseHiitSong,
    resume: resumeHiitSong,
    getPosition: getAudioPosition,
    setPosition: setAudioPosition,
    getPlayer: getAudioPlayer,
    shouldIgnorePause: shouldIgnoreHiitPause,
    config: HIIT_AUDIO_CONFIG
  }

  // localStorage functions configuration
  const storageFunctions = {
    save: saveHiitState,
    load: loadHiitState,
    clear: clearHiitState
  }

  // Custom messages for HIIT
  const messages = {
    complete: "🎉 Workout Complete!",
    prep: "🏃‍♂️ GET READY!",
    work: "💪 WORK HARD!",
    rest: "😮‍💨 REST",
    finalRest: "🎉 You just killed this workout! Hit music! Number one, baby!",
    initial: "40 sec work & 20 sec rest = 12 min Total workout!",
    initialDisplay: "HIIT Music",
    mediaTitle: "HIIT Workout"
  }

  // Extended config with total time calculator
  const extendedConfig = {
    ...HIIT_CONFIG,
    calculateTotalTime
  }

  return (
    <WorkoutTimer
      workoutType="hiit"
      name={name}
      config={extendedConfig}
      audioFunctions={audioFunctions}
      storageFunctions={storageFunctions}
      messages={messages}
      className="hiit-timer"
      autoMaximize={autoMaximize}
      autoStart={autoStart}
      showBackButton={showBackButton}
      onBackClick={onBackClick}
      hasFinalRest={true} // HIIT has a final rest phase after last work
      showSkipButton={false} // Hide skip button for HIIT
    />
  )
}

export default HiitTimer
