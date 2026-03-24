import { useState, useEffect, useRef } from 'preact/hooks'
import './WorkoutTimer.scss'
import { useDoubleClick } from '../hooks/useDoubleClick'
import { useWorkoutTimer } from '../hooks/useWorkoutTimer'
import { useAudioSync } from '../hooks/useAudioSync'
import { useSeekControls } from '../hooks/useSeekControls'
import { useTimerPersistence } from '../hooks/useTimerPersistence'
import { useMouseTracking } from '../hooks/useMouseTracking'
import { useTimerControls } from '../hooks/useTimerControls'
import { isClickOnButton } from '../utils/timerHelpers'
import Confetti from './Confetti'
import TimerDisplay from './workout/TimerDisplay'
import TimerControls from './workout/TimerControls'
import VolumeControl from './workout/VolumeControl'
import ProgressBar from './workout/ProgressBar'

/**
 * Generic Workout Timer Component
 * Shared base for HIIT, Tabata, and other interval-based workout timers
 *
 * @param {Object} props
 * @param {string} props.workoutType - 'hiit' or 'tabata'
 * @param {string} props.name - Display name of the timer
 * @param {Object} props.config - Workout configuration (rounds, durations, etc.)
 * @param {Object} props.audioFunctions - Audio playback functions
 * @param {Object} props.storageFunctions - localStorage functions
 * @param {Object} props.messages - Custom messages for different phases
 * @param {string} props.className - Base CSS class name
 * @param {boolean} props.autoMaximize - Auto-enter fullscreen mode
 * @param {boolean} props.autoStart - Auto-start timer (always false for UX)
 * @param {boolean} props.showBackButton - Show/hide back button
 * @param {Function} props.onBackClick - Back navigation handler
 * @param {boolean} props.hasFinalRest - Whether workout has rest after final work phase
 * @param {boolean} props.showSkipButton - Show/hide skip phase button
 */
function WorkoutTimer({
  workoutType,
  name,
  config,
  audioFunctions,
  storageFunctions,
  messages,
  className,
  autoMaximize = false,
  autoStart = false,
  showBackButton = true,
  onBackClick,
  hasFinalRest = false,
  showSkipButton = true
}) {
  // Load saved state
  const savedState = storageFunctions.load()

  // UI state
  const [isMaximized, setIsMaximized] = useState(autoMaximize)
  const [musicMode, setMusicMode] = useState(savedState?.musicMode ?? true)
  const [volume, setVolume] = useState(savedState?.volume ?? 0.7)
  const containerRef = useRef(null)

  // Core timer logic hook
  const timerState = useWorkoutTimer({
    config,
    savedState,
    musicMode,
    audioFunctions,
    hasFinalRest,
    messages
  })

  const {
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
    setCurrentRound,
    setTimeLeft,
    setIsWorkPhase,
    setIsPreparationPhase,
    setIsRunning,
    setIsFinished,
    setCurrentSubtitle,
    setShowConfetti,
    hasStarted
  } = timerState

  // Audio synchronization hook
  const { playerStatus, ignoreNextPause, ignoreNextPlay } = useAudioSync({
    musicMode,
    audioFunctions,
    messages,
    isRunning,
    isFinished,
    hasStarted,
    savedState,
    workoutType
  })

  // Update audio volume when volume state changes
  useEffect(() => {
    const audioPlayer = audioFunctions.getPlayer()
    if (audioPlayer) {
      audioPlayer.volume = volume
    }
  }, [volume])

  // Seek controls hook
  useSeekControls({
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
  })

  // Timer persistence hook
  useTimerPersistence({
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
  })

  // Mouse tracking hook
  const { showControls, handleMouseMove, handleMouseLeave } = useMouseTracking(containerRef)

  // Timer controls hook
  const { handleStart, handlePause, handleReset, handleSkip } = useTimerControls({
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
  })

  // Double click to maximize
  const handleDoubleClick = useDoubleClick(() => {
    setIsMaximized(!isMaximized)
  })

  // Container click handler
  const handleContainerClick = (e) => {
    if (isMaximized && !isClickOnButton(e)) {
      if (isRunning) {
        handlePause()
      } else if (!isFinished) {
        handleStart()
      }
    } else if (!isMaximized && !isClickOnButton(e)) {
      handleDoubleClick()
    }
  }

  // Get phase message
  const getPhaseMessage = () => {
    if (isFinished) return messages.complete
    if (!isRunning && isPreparationPhase && timeLeft === preparationTime) {
      return ""
    }
    if (isPreparationPhase) return messages.prep
    return isWorkPhase ? messages.work : messages.rest
  }

  return (
    <div
      ref={containerRef}
      className={`${className} ${isFinished ? 'finished' : ''} ${isWorkPhase || isPreparationPhase ? 'work-phase' : 'rest-phase'} ${isMaximized ? 'maximized' : ''} ${showControls ? 'show-controls' : ''} ${!isRunning && hasStarted() && !isFinished ? 'paused' : ''}`}
      onClick={handleContainerClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Back button */}
      {onBackClick && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onBackClick()
          }}
          className={`back-btn ${isMaximized ? (showBackButton ? 'visible' : 'hidden') : ''}`}
        >
          ← Back
        </button>
      )}

      <h3 className="timer-name">{name}</h3>

      {/* Progress bar */}
      <ProgressBar
        hasStarted={hasStarted()}
        currentRound={currentRound}
        totalRounds={totalRounds}
        isPreparationPhase={isPreparationPhase}
        isWorkPhase={isWorkPhase}
        hasFinalRest={hasFinalRest}
      />

      {/* Central content */}
      <TimerDisplay
        hasStarted={hasStarted()}
        isPreparationPhase={isPreparationPhase}
        isWorkPhase={isWorkPhase}
        isFinished={isFinished}
        isRunning={isRunning}
        timeLeft={timeLeft}
        currentMessage={getPhaseMessage()}
        currentSubtitle={currentSubtitle}
        messages={messages}
      />

      {/* Controls */}
      <TimerControls
        isRunning={isRunning}
        isFinished={isFinished}
        isPreparationPhase={isPreparationPhase}
        timeLeft={timeLeft}
        preparationTime={preparationTime}
        musicMode={musicMode}
        playerStatus={playerStatus}
        hasStarted={hasStarted()}
        showSkipButton={showSkipButton}
        handleStart={handleStart}
        handlePause={handlePause}
        handleSkip={handleSkip}
        handleReset={handleReset}
      />

      {/* Audio controls */}
      <VolumeControl
        musicMode={musicMode}
        playerStatus={playerStatus}
        volume={volume}
        isRunning={isRunning}
        setMusicMode={setMusicMode}
        setVolume={setVolume}
      />

      <Confetti
        isActive={showConfetti}
        onComplete={() => setShowConfetti(false)}
      />
    </div>
  )
}

export default WorkoutTimer
