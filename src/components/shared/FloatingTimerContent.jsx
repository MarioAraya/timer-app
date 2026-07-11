/**
 * Compact content rendered inside the Document Picture-in-Picture window.
 * Kept dependency-free (no material icons / app CSS) since it lives in a
 * separate document.
 */
function FloatingTimerContent({ phaseLabel, timeDisplay, isRunning, isFinished, onToggle }) {
  return (
    <>
      <div className="pip-phase">{phaseLabel}</div>
      <div className="pip-time">{timeDisplay}</div>
      {!isFinished && (
        <button className="pip-btn" onClick={onToggle}>
          {isRunning ? '⏸' : '▶'}
        </button>
      )}
    </>
  )
}

export default FloatingTimerContent
