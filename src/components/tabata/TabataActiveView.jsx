import WorkoutActiveView from '../shared/WorkoutActiveView'
import { useLang } from '../../context/LanguageContext'

function TabataActiveView({
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

  const getPhaseLabel = () => {
    if (isFinished) return t('active.phases.complete')
    if (isPreparationPhase) return t('active.phases.prep')
    return isWorkPhase ? t('active.phases.work') : t('active.phases.rest')
  }

  const getMotivation = () => {
    if (isFinished) return { text: t('tabata.motivation.finishedText'), highlight: t('tabata.motivation.finishedHighlight') }
    if (isWorkPhase) return { text: t('tabata.motivation.workText'), highlight: t('tabata.motivation.workHighlight') }
    return { text: t('tabata.motivation.restText'), highlight: t('tabata.motivation.restHighlight') }
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
      themeClass="theme-tabata"
      phaseLabel={getPhaseLabel()}
      motivationalContent={getMotivation()}
    />
  )
}

export default TabataActiveView
