import { useState } from 'preact/hooks'

/**
 * Tabata Setup View Component
 * Configuration screen before starting workout
 */
function TabataSetupView({
  config,
  onStart,
  onBackClick,
  totalTime
}) {
  // Default values from config
  const [prepDuration, setPrepDuration] = useState(config.preparation?.duration || 10)
  const [workDuration, setWorkDuration] = useState(20) // Default Tabata work
  const [restDuration, setRestDuration] = useState(10) // Default Tabata rest

  const totalRounds = config.rounds?.length || 8

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="tabata-setup-view">
      {/* Header */}
      <header className="setup-header">
        <button className="back-button" onClick={onBackClick}>
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <h2 className="setup-title">Tabata Setup</h2>
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
              <span className="preview-time">{totalTime || '4:00'}</span>
              <span className="preview-info">{totalRounds} Rounds</span>
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
                style={{ width: `${((prepDuration - 5) / 25) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Work Duration Card */}
          <div className="interval-card active">
            <div className="card-header">
              <div className="card-label">
                <span className="label-category primary">MAX EFFORT</span>
                <span className="label-title">Work Interval</span>
              </div>
              <span className="card-time primary">{formatTime(workDuration)}</span>
            </div>
            <div className="slider-container">
              <input
                type="range"
                min="10"
                max="30"
                value={workDuration}
                onChange={(e) => setWorkDuration(Number(e.target.value))}
                className="slider work-slider"
              />
              <div
                className="slider-fill primary"
                style={{ width: `${((workDuration - 10) / 20) * 100}%` }}
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
                min="5"
                max="20"
                value={restDuration}
                onChange={(e) => setRestDuration(Number(e.target.value))}
                className="slider rest-slider"
              />
              <div
                className="slider-fill"
                style={{ width: `${((restDuration - 5) / 15) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Motivational Quote Preview */}
        <div className="quote-preview">
          <div className="quote-badge">
            <span className="badge-phase">WORK</span>
            <span className="badge-time">0:15</span>
          </div>
          <p className="quote-text">"Maximum effort! Give it everything!"</p>
        </div>
      </main>

      {/* Start Button */}
      <footer className="setup-footer">
        <button className="start-button" onClick={onStart}>
          <span className="material-symbols-outlined">play_arrow</span>
          START TABATA
        </button>
      </footer>
    </div>
  )
}

export default TabataSetupView
