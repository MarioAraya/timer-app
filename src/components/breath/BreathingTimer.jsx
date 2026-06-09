import { useState, useEffect, useRef } from 'preact/hooks'
import { useDoubleClick } from '../../hooks/useDoubleClick'
import { isClickOnButton } from '../../utils/timerHelpers'
import { breathingAudio } from '../../utils/audioUtils'
import './BreathingTimer.scss'

const SCALE_MIN = 0.65
const SCALE_MAX = 1.35

function getHoldScale(phases, phaseIndex) {
  for (let i = phaseIndex - 1; i >= 0; i--) {
    if (phases[i].type === 'inhale') return SCALE_MAX
    if (phases[i].type === 'exhale') return SCALE_MIN
  }
  return SCALE_MAX
}

function BreathingTimer({
  name,
  phases,
  patternName,
  className,
  autoMaximize = false,
  autoStart = false,
  showBackButton = true,
  onBackClick,
  onCycleComplete,
}) {
  const [currentPhase, setCurrentPhase] = useState(0)
  const [timeLeft, setTimeLeft] = useState(phases[0].duration)
  const [isRunning, setIsRunning] = useState(false)
  const [cycleCount, setCycleCount] = useState(0)
  const [isMaximized, setIsMaximized] = useState(autoMaximize)
  const [audioMode, setAudioMode] = useState(false)
  const [audioVolume, setAudioVolume] = useState(0.4)
  const [audioStatus, setAudioStatus] = useState('idle')
  const circleRef = useRef(null)

  useEffect(() => {
    if (autoStart && !isRunning) setIsRunning(true)
  }, [autoStart])

  // Initialize lofi player when audio mode enabled
  useEffect(() => {
    if (!audioMode || audioStatus !== 'idle') return
    setAudioStatus('loading')
    breathingAudio.initialize().then(ready => {
      setAudioStatus(ready ? 'ready' : 'error')
    })
  }, [audioMode])

  // Sync audio playback with timer running state
  useEffect(() => {
    if (!audioMode || audioStatus !== 'ready') return
    if (isRunning) {
      breathingAudio.resume()
    } else {
      breathingAudio.pause()
    }
  }, [isRunning, audioMode, audioStatus])

  // Stop audio on unmount
  useEffect(() => {
    return () => { breathingAudio.stop() }
  }, [])

  // JS-driven circle scale animation
  useEffect(() => {
    const el = circleRef.current
    if (!el) return

    const phase = phases[currentPhase]

    if (!isRunning) {
      el.style.transition = 'none'
      el.style.transform = `scale(${SCALE_MIN})`
      return
    }

    if (phase.type === 'inhale') {
      el.style.transition = 'none'
      el.style.transform = `scale(${SCALE_MIN})`
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.style.transition = `transform ${phase.duration}s ease-in-out`
          el.style.transform = `scale(${SCALE_MAX})`
        })
      })
    } else if (phase.type === 'exhale') {
      el.style.transition = 'none'
      el.style.transform = `scale(${SCALE_MAX})`
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.style.transition = `transform ${phase.duration}s ease-in-out`
          el.style.transform = `scale(${SCALE_MIN})`
        })
      })
    } else {
      el.style.transition = 'none'
      el.style.transform = `scale(${getHoldScale(phases, currentPhase)})`
    }
  }, [currentPhase, isRunning, phases])

  // Timer countdown
  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      setTimeLeft(time => {
        if (time <= 1) {
          const nextPhase = (currentPhase + 1) % phases.length
          if (nextPhase === 0) {
            setCycleCount(count => count + 1)
            onCycleComplete?.()
          }
          setCurrentPhase(nextPhase)
          return phases[nextPhase].duration
        }
        return time - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning, currentPhase, phases])

  const handleStart = () => setIsRunning(true)
  const handlePause = () => setIsRunning(false)
  const handleReset = () => {
    setIsRunning(false)
    setCurrentPhase(0)
    setTimeLeft(phases[0].duration)
    setCycleCount(0)
  }

  const handleSkip = () => {
    const nextPhase = (currentPhase + 1) % phases.length
    if (nextPhase === 0) {
      setCycleCount(count => count + 1)
      onCycleComplete?.()
    }
    setCurrentPhase(nextPhase)
    setTimeLeft(phases[nextPhase].duration)
  }

  const handleAudioToggle = (e) => {
    e.stopPropagation()
    const next = !audioMode
    setAudioMode(next)
    if (!next) breathingAudio.stop()
  }

  const handleVolumeChange = (e) => {
    e.stopPropagation()
    const v = parseFloat(e.target.value) / 100
    setAudioVolume(v)
    breathingAudio.setVolume(v)
  }

  const handleDoubleClick = useDoubleClick(() => setIsMaximized(!isMaximized))

  const handleContainerClick = (e) => {
    if (!isClickOnButton(e)) {
      if (isMaximized) {
        isRunning ? handlePause() : handleStart()
      } else {
        handleDoubleClick()
      }
    }
  }

  const currentPhaseConfig = phases[currentPhase]

  return (
    <div
      className={`breathing-timer-root ${className} ${currentPhaseConfig.color} ${isMaximized ? 'maximized' : ''}`}
      onClick={handleContainerClick}
    >
      {onBackClick && (
        <button
          onClick={(e) => { e.stopPropagation(); onBackClick() }}
          className={`breathing-back-btn ${isMaximized ? 'maximized' : ''}`}
        >
          ← Back
        </button>
      )}

      <h3 className="breathing-name">{name}</h3>

      <div className="breathing-cycle">
        <div className="cycle-info">Cycle {cycleCount + 1}</div>
      </div>

      <div className="breathing-animation">
        <div ref={circleRef} className={`breathing-circle ${currentPhaseConfig.color}`}>
          <div className="breathing-circle-inner">
            <div className="breathing-timer-display">
              {Math.floor(timeLeft)}
            </div>
          </div>
        </div>
      </div>

      <div className="breathing-phase">
        <div className={`phase-indicator ${currentPhaseConfig.color}`}>
          {currentPhaseConfig.name}
        </div>
        <div className="breathing-instruction">
          {currentPhaseConfig.instruction}
        </div>
        {currentPhaseConfig.guidances?.length > 0 && (
          <div className="breathing-guidance">
            {currentPhaseConfig.guidances[cycleCount % currentPhaseConfig.guidances.length]}
          </div>
        )}
      </div>

      <div className="breathing-controls">
        {!isRunning ? (
          <button onClick={(e) => { e.stopPropagation(); handleStart() }} className="btn btn-start">
            {cycleCount === 0 && currentPhase === 0 ? 'Start' : 'Resume'}
          </button>
        ) : (
          <button onClick={(e) => { e.stopPropagation(); handlePause() }} className="btn btn-pause">
            Pause
          </button>
        )}

        <button onClick={(e) => { e.stopPropagation(); handleSkip() }} className="btn btn-skip">
          Skip Phase
        </button>

        <button onClick={(e) => { e.stopPropagation(); handleReset() }} className="btn btn-reset">
          Reset
        </button>
      </div>

      <div className="breathing-audio-controls">
        <button
          onClick={handleAudioToggle}
          className={`breathing-audio-toggle ${audioMode ? 'active' : ''}`}
          title={audioMode ? 'Music on — click to disable' : 'Enable lofi music'}
        >
          <span className="audio-icon">{audioMode ? '🎵' : '🔇'}</span>
          <span className="audio-label">
            {audioStatus === 'loading' ? '...' : audioMode ? 'Lofi' : 'Mute'}
          </span>
        </button>

        {audioMode && audioStatus === 'ready' && (
          <div className="breathing-volume">
            <span>🔊</span>
            <input
              type="range"
              min="0"
              max="100"
              value={audioVolume * 100}
              onChange={handleVolumeChange}
              onClick={(e) => e.stopPropagation()}
              className="volume-slider"
            />
            <span className="volume-pct">{Math.round(audioVolume * 100)}%</span>
          </div>
        )}
      </div>

      <div className="breathing-pattern">
        <div className="pattern-info">
          <span className="pattern-label">Pattern:</span>
          <span className="pattern-value">{patternName}</span>
        </div>
      </div>
    </div>
  )
}

export default BreathingTimer
