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
  audioError, onCloseAudioError,
}) {
  const { t } = useLang()
  const exercises = t('hiit.exercises')

  const getPhaseLabel = () => {
    if (isFinished) return t('active.phases.complete')
    if (isPreparationPhase) return t('active.phases.prep')
    return isWorkPhase ? t('active.phases.work') : t('active.phases.rest')
  }

  const getExerciseName = () => {
    if (isFinished || isPreparationPhase) return null
    return Array.isArray(exercises) ? exercises[(currentRound - 1) % exercises.length] : exercises
  }

  const getMotivation = () => {
    if (isFinished) return { text: t('hiit.motivation.finishedText'), highlight: t('hiit.motivation.finishedHighlight') }
    if (isWorkPhase) return { text: t('hiit.motivation.workText'), highlight: t('hiit.motivation.workHighlight') }
    return { text: t('hiit.motivation.restText'), highlight: t('hiit.motivation.restHighlight') }
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
      audioError={audioError}
      onCloseAudioError={onCloseAudioError}
      themeClass="theme-hiit"
      phaseLabel={getPhaseLabel()}
      motivationalContent={getMotivation()}
      exerciseName={getExerciseName()}
    />
  )
}

export default HiitActiveView
