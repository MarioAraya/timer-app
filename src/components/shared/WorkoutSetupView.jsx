import { useState } from 'preact/hooks'
import './WorkoutSetupView.scss'

/**
 * Shared Workout Setup View Component
 * Used by both HIIT and Tabata timers
 *
 * @param {object} props.config - Timer config (preparation, rounds)
 * @param {object} props.theme - Theme config: { name, className, title, roundsLabel, workLabel, startText, defaultTotalTime, quote, work, rest }
 * @param {function} props.onStart - Start workout callback
 * @param {function} props.onBackClick - Back button callback
 * @param {string} props.totalTime - Pre-calculated total time string
 */
function WorkoutSetupView({
  config,
  theme,
  onStart,
  onBackClick,
  totalTime
}) {
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

  return (
    <div className={`workout-setup-view ${theme.className}`}>
      {/* Header */}
      <header className="setup-header">
        <button className="back-button" onClick={onBackClick}>
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <h2 className="setup-title">{theme.title}</h2>
        <button className="settings-button">
          <span className="material-symbols-outlined">settings</span>
        </button>
      </header>

      <main className="setup-main">
        {/* Visual Preview */}
        <div className="setup-preview">
          <div className="preview-ring clickable" onClick={onStart}>
            <div className="preview-ring-outer"></div>
            <div className="preview-ring-inner"></div>
            <div className="preview-content">
              <span className="preview-label">TOTAL TIME</span>
              <span className="preview-time">{totalTime || theme.defaultTotalTime}</span>
              <span className="preview-info">{totalRounds} {theme.roundsLabel}</span>
            </div>
            <div className="preview-play-overlay">
              <span className="material-symbols-outlined">play_arrow</span>
            </div>
          </div>
        </div>

        {/* Interval Settings */}
        <div className="interval-settings">
          <h3 className="settings-section-title">INTERVAL SETTINGS</h3>

          {/* Prep Duration Card */}
          <div className="interval-card">
            <div className="card-header">
              <div className="card-label">
                <span className="label-category">PREPARATION</span>
                <span className="label-title">Intro Duration</span>
              </div>
              <span className="card-time">{formatTime(prepDuration)}</span>
            </div>
            <div className="slider-container">
              <input
                type="range"
                min="5"
                max="30"
                value={prepDuration}
                onChange={(e) => setPrepDuration(Number(e.target.value))}
                className="slider prep-slider"
              />
              <div
                className="slider-fill"
                style={{ width: `${sliderFillPercent(prepDuration, 5, 30)}%` }}
              ></div>
            </div>
          </div>

          {/* Work Duration Card */}
          <div className="interval-card active">
            <div className="card-header">
              <div className="card-label">
                <span className="label-category primary">{theme.workLabel}</span>
                <span className="label-title">Work Interval</span>
              </div>
              <span className="card-time primary">{formatTime(workDuration)}</span>
            </div>
            <div className="slider-container">
              <input
                type="range"
                min={theme.work.min}
                max={theme.work.max}
                value={workDuration}
                onChange={(e) => setWorkDuration(Number(e.target.value))}
                className="slider work-slider"
              />
              <div
                className="slider-fill primary"
                style={{ width: `${sliderFillPercent(workDuration, theme.work.min, theme.work.max)}%` }}
              ></div>
            </div>
          </div>

          {/* Rest Duration Card */}
          <div className="interval-card">
            <div className="card-header">
              <div className="card-label">
                <span className="label-category">RECOVERY</span>
                <span className="label-title">Rest Interval</span>
              </div>
              <span className="card-time">{formatTime(restDuration)}</span>
            </div>
            <div className="slider-container">
              <input
                type="range"
                min={theme.rest.min}
                max={theme.rest.max}
                value={restDuration}
                onChange={(e) => setRestDuration(Number(e.target.value))}
                className="slider rest-slider"
              />
              <div
                className="slider-fill"
                style={{ width: `${sliderFillPercent(restDuration, theme.rest.min, theme.rest.max)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Motivational Quote Preview */}
        <div className="quote-preview">
          <div className="quote-badge">
            <span className="badge-phase">{theme.quote.phase}</span>
            <span className="badge-time">{theme.quote.time}</span>
          </div>
          <p className="quote-text">"{theme.quote.text}"</p>
        </div>
      </main>

      {/* Start Button */}
      <footer className="setup-footer">
        <button className="start-button" onClick={onStart}>
          <span className="material-symbols-outlined">play_arrow</span>
          {theme.startText}
        </button>
      </footer>
    </div>
  )
}

export default WorkoutSetupView
