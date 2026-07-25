import { useState, useEffect } from 'preact/hooks'
import { useLang } from '../../context/LanguageContext'
import './WorkoutSetupView.scss'

function WorkoutSetupView({ config, theme, onClose, totalTime }) {
  const { t } = useLang()
  const [prepDuration, setPrepDuration] = useState(config.preparation?.duration || 10)
  const [workDuration, setWorkDuration] = useState(theme.work.default)
  const [restDuration, setRestDuration] = useState(theme.rest.default)

  const totalRounds = config.rounds?.length || 8

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const sliderFillPercent = (value, min, max) => ((value - min) / (max - min)) * 100

  // Esc closes the modal
  useEffect(() => {
    const onKeyDown = (e) => { if (e.key === 'Escape') onClose?.() }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div
      className="setup-modal-overlay"
      data-testid="setup-modal-overlay"
      onClick={onClose}
    >
      <div
        className={`workout-setup-view setup-modal ${theme.className}`}
        role="dialog"
        aria-modal="true"
        aria-label={theme.title}
        onClick={(e) => e.stopPropagation()}
      >
      <header className="setup-header">
        <h2 className="setup-title">{theme.title}</h2>
        <button
          data-testid="setup-close-btn"
          className="close-button"
          onClick={onClose}
          aria-label={t('setup.close')}
          title={t('setup.close')}
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </header>

      <main className="setup-main">
        <div className="setup-preview">
          <div className="preview-ring">
            <div className="preview-ring-outer"></div>
            <div className="preview-ring-inner"></div>
            <div className="preview-content">
              <span className="preview-label">{t('setup.totalTime')}</span>
              <span className="preview-time">{totalTime || theme.defaultTotalTime}</span>
              <span className="preview-info">{totalRounds} {t('setup.sets')}</span>
            </div>
          </div>
        </div>

        <div className="interval-settings">
          <h3 className="settings-section-title">{t('setup.intervalSettings')}</h3>

          <div className="interval-card">
            <div className="card-header">
              <div className="card-label">
                <span className="label-category">{t('setup.preparation')}</span>
                <span className="label-title">{t('setup.introLabel')}</span>
              </div>
              <span className="card-time">{formatTime(prepDuration)}</span>
            </div>
            <div className="slider-container">
              <input
                type="range" min="5" max="30" value={prepDuration}
                onChange={(e) => setPrepDuration(Number(e.target.value))}
                className="slider prep-slider"
              />
              <div className="slider-fill" style={{ width: `${sliderFillPercent(prepDuration, 5, 30)}%` }}></div>
            </div>
          </div>

          <div className="interval-card active">
            <div className="card-header">
              <div className="card-label">
                <span className="label-category primary">{theme.workLabel}</span>
                <span className="label-title">{t('setup.workInterval')}</span>
              </div>
              <span className="card-time primary">{formatTime(workDuration)}</span>
            </div>
            <div className="slider-container">
              <input
                type="range" min={theme.work.min} max={theme.work.max} value={workDuration}
                onChange={(e) => setWorkDuration(Number(e.target.value))}
                className="slider work-slider"
              />
              <div className="slider-fill primary" style={{ width: `${sliderFillPercent(workDuration, theme.work.min, theme.work.max)}%` }}></div>
            </div>
          </div>

          <div className="interval-card">
            <div className="card-header">
              <div className="card-label">
                <span className="label-category">{t('setup.recovery')}</span>
                <span className="label-title">{t('setup.restInterval')}</span>
              </div>
              <span className="card-time">{formatTime(restDuration)}</span>
            </div>
            <div className="slider-container">
              <input
                type="range" min={theme.rest.min} max={theme.rest.max} value={restDuration}
                onChange={(e) => setRestDuration(Number(e.target.value))}
                className="slider rest-slider"
              />
              <div className="slider-fill" style={{ width: `${sliderFillPercent(restDuration, theme.rest.min, theme.rest.max)}%` }}></div>
            </div>
          </div>
        </div>

      </main>
      </div>
    </div>
  )
}

export default WorkoutSetupView
