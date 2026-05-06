/**
 * Volume Control Component
 * Shows music/beeps toggle and volume slider
 */
function VolumeControl({
  musicMode,
  playerStatus,
  volume,
  isRunning,
  setMusicMode,
  setVolume
}) {
  return (
    <>
      {/* Music mode toggle */}
      <div className="timer-music-toggle" onClick={(e) => e.stopPropagation()}>
        <label className="toggle-container">
          <input
            type="checkbox"
            checked={musicMode}
            onChange={(e) => setMusicMode(e.target.checked)}
            disabled={isRunning}
          />
          <span className="toggle-slider"></span>
          <span className="toggle-label">
            {musicMode ? '🎵 Local Music' : '🔊 Beeps Only'}
            {musicMode && playerStatus === 'loading' && ' (Loading...)'}
          </span>
        </label>
      </div>

      {/* Volume control */}
      <div className="timer-volume-control" onClick={(e) => e.stopPropagation()}>
        <label className="volume-label">
          <span className="volume-icon">🔊</span>
          <input
            type="range"
            min="0"
            max="100"
            value={volume * 100}
            onChange={(e) => setVolume(e.target.value / 100)}
            className="volume-slider"
          />
          <span className="volume-value">{Math.round(volume * 100)}%</span>
        </label>
      </div>
    </>
  )
}

export default VolumeControl
