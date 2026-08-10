import { useState, useEffect, useRef } from 'preact/hooks'
import { useDoubleClick } from '../../hooks/useDoubleClick'
import { isClickOnButton } from '../../utils/timerHelpers'
import { breathingAudio } from '../../utils/audioUtils'
import { useLang } from '../../context/LanguageContext'
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
  const { t } = useLang()
  const [currentPhase, setCurrentPhase] = useState(0)
  const [timeLeft, setTimeLeft] = useState(phases[0].duration)
  const [isRunning, setIsRunning] = useState(false)
  const [cycleCount, setCycleCount] = useState(0)
  const [isMaximized, setIsMaximized] = useState(autoMaximize)
  const [audioMode, setAudioMode] = useState(false)
  const [audioVolume, setAudioVolume] = useState(0.4)
  const [audioStatus, setAudioStatus] = useState('idle')
  const [repeatOne, setRepeatOne] = useState(false)
  const circleRef = useRef(null)
  const pausedRef = useRef(false)

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
      // Freeze the circle exactly where it was instead of snapping to
      // SCALE_MIN, which caused a visible shrink-then-grow flash on pause/resume
      pausedRef.current = true
      const frozenTransform = getComputedStyle(el).transform
      el.style.transition = 'none'
      el.style.transform = frozenTransform && frozenTransform !== 'none'
        ? frozenTransform
        : `scale(${SCALE_MIN})`
      return
    }

    // Resuming mid-phase: animate only the remaining time from the frozen
    // scale instead of restarting the full phase duration from scratch
    const resuming = pausedRef.current
    pausedRef.current = false

    if (phase.type === 'inhale' || phase.type === 'exhale') {
      const startScale = phase.type === 'inhale' ? SCALE_MIN : SCALE_MAX
      const targetScale = phase.type === 'inhale' ? SCALE_MAX : SCALE_MIN
      const duration = resuming ? timeLeft : phase.duration

      if (!resuming) {
        el.style.transition = 'none'
        el.style.transform = `scale(${startScale})`
      }
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.style.transition = `transform ${duration}s ease-in-out`
          el.style.transform = `scale(${targetScale})`
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

  const handleAudioToggle = (e, next) => {
    e.stopPropagation()
    if (next === audioMode) return
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
  // "4-7-8 (Relaxing Breath)" → "4-7-8" for the chip; full text stays in the tooltip
  const patternShort = patternName?.split('(')[0].trim()

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
          {t('breathing.back')}
        </button>
      )}

      <h3 className="breathing-name">{name}</h3>

      <div className="breathing-cycle">
        <div className="cycle-info">{t('breathing.cycle')} {cycleCount + 1}</div>
        {patternName && (
          <div className="pattern-chip" title={patternName}>{patternShort}</div>
        )}
      </div>

      <div className="breathing-animation">
        <div ref={circleRef} className={`breathing-circle ${currentPhaseConfig.color}`}>
          <div className="breathing-circle-inner"></div>
        </div>

        {/* Sits outside the circle element so the scale animation never
            stretches the copy — it only tracks the circle's center */}
        <div className="breathing-phase">
          <div className={`phase-indicator ${currentPhaseConfig.color}`}>
            {currentPhaseConfig.name}
          </div>
          <div className="breathing-instruction">
            {currentPhaseConfig.instruction}
          </div>
          <div className="breathing-timer-display">
            {Math.floor(timeLeft)}
          </div>
        </div>
      </div>

      {currentPhaseConfig.guidances?.length > 0 && (
        <div className="breathing-guidance">
          {currentPhaseConfig.guidances[cycleCount % currentPhaseConfig.guidances.length]}
        </div>
      )}

      <div className="breathing-controls">
        {!isRunning ? (
          <button onClick={(e) => { e.stopPropagation(); handleStart() }} className="btn btn-start">
            {cycleCount === 0 && currentPhase === 0 ? t('breathing.start') : t('breathing.resume')}
          </button>
        ) : (
          <button onClick={(e) => { e.stopPropagation(); handlePause() }} className="btn btn-pause">
            {t('breathing.pause')}
          </button>
        )}

        <button onClick={(e) => { e.stopPropagation(); handleSkip() }} className="btn btn-skip">
          {t('breathing.skipPhase')}
        </button>

        <button onClick={(e) => { e.stopPropagation(); handleReset() }} className="btn btn-reset">
          {t('breathing.reset')}
        </button>
      </div>

      <div className="breathing-audio-controls">
        <div
          className={`breathing-audio-toggle ${audioMode ? 'on' : 'off'}`}
          role="radiogroup"
          aria-label={t('breathing.audioMode')}
        >
          <span className="audio-toggle-thumb" aria-hidden="true"></span>

          <button
            type="button"
            role="radio"
            aria-checked={!audioMode}
            className={`audio-toggle-option ${!audioMode ? 'active' : ''}`}
            onClick={(e) => handleAudioToggle(e, false)}
            title={t('breathing.muteTitle')}
          >
            <span className="audio-icon">🔇</span>
            <span className="audio-label">{t('breathing.mute')}</span>
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={audioMode}
            className={`audio-toggle-option ${audioMode ? 'active' : ''}`}
            onClick={(e) => handleAudioToggle(e, true)}
            title={t('breathing.musicOffTitle')}
          >
            <span className="audio-icon">🎵</span>
            <span className="audio-label">
              {audioMode && audioStatus === 'loading' ? '...' : t('breathing.music')}
            </span>
          </button>
        </div>

        {audioMode && audioStatus === 'ready' && (
          <div className="breathing-track-controls">
            <button
              type="button"
              className={`breathing-track-btn ${repeatOne ? 'active' : ''}`}
              onClick={(e) => { e.stopPropagation(); setRepeatOne(breathingAudio.repeatTrack()) }}
              title={t('breathing.repeatTrack')}
            >
              <span className="material-symbols-outlined">repeat_one</span>
            </button>
            <button
              type="button"
              className="breathing-track-btn"
              onClick={(e) => { e.stopPropagation(); breathingAudio.nextTrack() }}
              title={t('breathing.nextTrack')}
            >
              <span className="material-symbols-outlined">skip_next</span>
            </button>
          </div>
        )}

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
    </div>
  )
}

export default BreathingTimer
