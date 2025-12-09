import WorkoutTimer from './WorkoutTimer'
import './TabataTimer.scss'
import {
  playTabataSong,
  stopTabataSong,
  pauseTabataSong,
  resumeTabataSong,
  TABATA_AUDIO_CONFIG,
  initializeTabataAudioPlayer,
  getTabataAudioPosition,
  setTabataAudioPosition,
  getTabataAudioPlayer,
  shouldIgnoreTabataPause
} from '../utils/audioUtils'
import { TABATA_CONFIG, calculateTabataTotalTime } from '../config/tabataConfig'
import { saveTabataState, loadTabataState, clearTabataState } from '../utils/localStorage'

/**
 * Tabata Timer Component
 * Thin wrapper around WorkoutTimer with Tabata-specific configuration
 *
 * Tabata Protocol:
 * - 8 rounds: 20s work / 10s rest
 * - 10s preparation phase
 * - NO final rest (completes after last work phase)
 * - Total: ~4 minutes
 *
 * Note: Original Tabata protocol requires MAXIMUM EFFORT during work phases
 */
function TabataTimer({ name = 'Tabata Protocol', autoMaximize = false, autoStart = false, showBackButton = true, onBackClick }) {
  // Audio functions configuration
  const audioFunctions = {
    initialize: initializeTabataAudioPlayer,
    play: playTabataSong,
    stop: stopTabataSong,
    pause: pauseTabataSong,
    resume: resumeTabataSong,
    getPosition: getTabataAudioPosition,
    setPosition: setTabataAudioPosition,
    getPlayer: getTabataAudioPlayer,
    shouldIgnorePause: shouldIgnoreTabataPause,
    config: TABATA_AUDIO_CONFIG
  }

  // localStorage functions configuration
  const storageFunctions = {
    save: saveTabataState,
    load: loadTabataState,
    clear: clearTabataState
  }

  // Custom messages for Tabata
  const messages = {
    complete: "⚡ TABATA COMPLETE!",
    prep: "🏃‍♂️ GET READY!",
    work: "🔥 MAXIMUM EFFORT!",
    rest: "⏸️ RECOVER",
    finalRest: "", // Not used in Tabata
    initial: "20 sec work & 10 sec rest = 4 min Total workout!",
    initialDisplay: "Tabata Music",
    mediaTitle: "Tabata Workout"
  }

  // Extended config with total time calculator
  const extendedConfig = {
    ...TABATA_CONFIG,
    calculateTotalTime: calculateTabataTotalTime
  }

  return (
    <WorkoutTimer
      workoutType="tabata"
      name={name}
      config={extendedConfig}
      audioFunctions={audioFunctions}
      storageFunctions={storageFunctions}
      messages={messages}
      className="tabata-timer"
      autoMaximize={autoMaximize}
      autoStart={autoStart}
      showBackButton={showBackButton}
      onBackClick={onBackClick}
      hasFinalRest={false} // Tabata completes immediately after final work phase
      showSkipButton={false} // Hide skip button for Tabata
    />
  )
}

export default TabataTimer
