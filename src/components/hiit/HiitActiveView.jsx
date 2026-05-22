import WorkoutActiveView from '../shared/WorkoutActiveView'
import { useLang } from '../../context/LanguageContext'

function HiitActiveView({
  currentRound, totalRounds, timeLeft, totalElapsed,
  isWorkPhase, isPreparationPhase, isRunning, isFinished,
  currentSubtitle, showConfetti, setShowConfetti,
  totalProgress, roundProgress,
  onBackClick, onStart, onPause, onReset, onSkip,
  onToggleFullscreen, isMaximized,
  musicMode, onToggleMusicMode,
}) {
  const { t } = useLang()
  const exercises = t('hiit.exercises')

  const getPhaseLabel = () => {
    if (isFinished) return 'COMPLETE'
    if (isPreparationPhase) return 'PREP'
    return isWorkPhase ? 'WORK' : 'REST'
  }

  const getExerciseName = () => {
    if (isFinished || isPreparationPhase) return null
    return Array.isArray(exercises) ? exercises[(currentRound - 1) % exercises.length] : exercises
  }

  const getMotivation = () => {
    if (isFinished) return { text: 'HIIT', highlight: 'COMPLETE!' }
    if (isWorkPhase) return { text: 'PUSH YOUR', highlight: 'LIMITS!' }
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
      themeClass="theme-hiit"
      phaseLabel={getPhaseLabel()}
      motivationalContent={getMotivation()}
      exerciseName={getExerciseName()}
    />
  )
}

export default HiitActiveView
