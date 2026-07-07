/**
 * Lofi audio controls bar: mode toggle, track controls, and volume slider.
 */
function PomodoroAudioBar({
  musicMode,
  setMusicMode,
  isRunning,
  isWorkPhase,
  playerStatus,
  musicPlaying,
  handleMusicToggle,
  volume,
  setVolume,
  audioFunctions,
  t,
}) {
  return (
    <div className="audio-player-bar">
      <div className="audio-top-row">
        <button
          className={`audio-mode-btn ${musicMode ? 'active' : ''}`}
          data-testid="pomodoro-music-mode"
          onClick={(e) => {
            e.stopPropagation()
            const next = !musicMode
            setMusicMode(next)
            // If switching music ON while timer running, call play() NOW within
            // this user gesture to register browser autoplay activation
            if (next && isRunning && isWorkPhase) {
              audioFunctions.play()
            }
          }}
        >
          <span className="material-symbols-outlined">
            {musicMode ? 'music_note' : 'music_off'}
          </span>
          <span className="audio-mode-label">
            {playerStatus === 'loading' ? t('pomodoro.audio.loading') : musicMode ? t('pomodoro.audio.lofi') : t('pomodoro.audio.beeps')}
          </span>
        </button>

        {musicMode && (
          <div className="audio-track-controls">
            <button
              className="track-btn"
              data-testid="pomodoro-music-play"
              onClick={handleMusicToggle}
              disabled={playerStatus === 'loading'}
              title={musicPlaying ? t('pomodoro.audio.pauseMusic') : t('pomodoro.audio.playMusic')}
            >
              <span className="material-symbols-outlined">
                {musicPlaying ? 'pause' : 'play_arrow'}
              </span>
            </button>
            <button
              className="track-btn"
              data-testid="pomodoro-music-repeat"
              onClick={(e) => { e.stopPropagation(); audioFunctions.repeatTrack() }}
              disabled={playerStatus !== 'ready'}
              title={t('pomodoro.audio.repeatTrack')}
            >
              <span className="material-symbols-outlined">replay</span>
            </button>
            <button
              className="track-btn"
              data-testid="pomodoro-music-next"
              onClick={(e) => { e.stopPropagation(); audioFunctions.nextTrack() }}
              disabled={playerStatus !== 'ready'}
              title={t('pomodoro.audio.nextTrack')}
            >
              <span className="material-symbols-outlined">skip_next</span>
            </button>
          </div>
        )}
      </div>

      {musicMode && playerStatus === 'ready' && (
        <div className="volume-row">
          <span className="material-symbols-outlined vol-icon">volume_up</span>
          <input
            type="range"
            min="0"
            max="100"
            value={volume * 100}
            onChange={(e) => { e.stopPropagation(); setVolume(parseFloat(e.target.value) / 100) }}
            onClick={(e) => e.stopPropagation()}
            className="volume-slider"
          />
          <span className="volume-value">{Math.round(volume * 100)}%</span>
        </div>
      )}
    </div>
  )
}

export default PomodoroAudioBar
