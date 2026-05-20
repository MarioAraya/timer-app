import { useLang } from '../../context/LanguageContext'

function TimerControls({
  isRunning,
  isFinished,
  isPreparationPhase,
  timeLeft,
  preparationTime,
  musicMode,
  playerStatus,
  hasStarted,
  showSkipButton,
  handleStart,
  handlePause,
  handleSkip,
  handleReset
}) {
  const { t } = useLang()
  return (
    <div className="timer-controls">
      {!isRunning ? (
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleStart()
          }}
          className="btn btn-start"
          disabled={isFinished || (musicMode && playerStatus === 'loading')}
        >
          {isFinished ? t('active.finished') :
           (musicMode && playerStatus === 'loading') ? t('active.controls.loading') :
           (isPreparationPhase && timeLeft === preparationTime ? t('active.controls.start') : t('active.controls.resume'))}
        </button>
      ) : (
        <button
          onClick={(e) => {
            e.stopPropagation()
            handlePause()
          }}
          className="btn btn-pause"
        >
          {t('active.controls.pause')}
        </button>
      )}

      {hasStarted && (
        <>
          {showSkipButton && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleSkip()
              }}
              className="btn btn-icon btn-skip"
              disabled={isFinished}
              title={t('active.controls.skip')}
            >
              <span className="btn-icon-symbol">⏭️</span>
              <span className="btn-tooltip">{t('active.controls.skip')}</span>
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation()
              handleReset()
            }}
            className="btn btn-icon btn-reset"
            title={t('active.controls.reset')}
          >
            <span className="btn-icon-symbol">🔄</span>
            <span className="btn-tooltip">{t('active.controls.reset')}</span>
          </button>
        </>
      )}
    </div>
  )
}

export default TimerControls
