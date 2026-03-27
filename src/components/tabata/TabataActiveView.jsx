import WorkoutActiveView from '../shared/WorkoutActiveView'

function TabataActiveView({
  currentRound, totalRounds, timeLeft, totalElapsed,
  isWorkPhase, isPreparationPhase, isRunning, isFinished,
  currentSubtitle, showConfetti, setShowConfetti,
  totalProgress, roundProgress,
  onBackClick, onStart, onPause, onReset, onSkip,
  onToggleFullscreen, isMaximized,
  musicMode, onToggleMusicMode,
}) {
  const getPhaseLabel = () => {
    if (isFinished) return 'COMPLETE'
    if (isPreparationPhase) return 'PREP'
    return isWorkPhase ? 'WORK' : 'REST'
  }

  const getMotivation = () => {
    if (isFinished) return { text: 'TABATA', highlight: 'COMPLETE!' }
    if (isWorkPhase) return { text: 'GIVE IT', highlight: 'EVERYTHING!' }
    return { text: 'BREATHE &', highlight: 'RECOVER' }
  }

  return (
    <WorkoutActiveView
      currentRound={currentRound}
      totalRounds={totalRounds}
      timeLeft={timeLeft}
      totalElapsed={totalElapsed}
      isWorkPhase={isWorkPhase}
      isPreparationPhase={isPreparationPhase}
      isRunning={isRunning}
      isFinished={isFinished}
      currentSubtitle={currentSubtitle}
      showConfetti={showConfetti}
      setShowConfetti={setShowConfetti}
      totalProgress={totalProgress}
      roundProgress={roundProgress}
      onBackClick={onBackClick}
      onStart={onStart}
      onPause={onPause}
      onReset={onReset}
      onSkip={onSkip}
      onToggleFullscreen={onToggleFullscreen}
      isMaximized={isMaximized}
      musicMode={musicMode}
      onToggleMusicMode={onToggleMusicMode}
      themeClass="theme-tabata"
      phaseLabel={getPhaseLabel()}
      motivationalContent={getMotivation()}
    />
  )
}

export default TabataActiveView
