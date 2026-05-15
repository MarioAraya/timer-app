import { useState, useEffect, useRef } from 'preact/hooks'
import './WimHofTimer.scss'
import { useLang } from '../../context/LanguageContext'
import { incrementSessionCount } from '../../utils/localStorage'

const MP3_URL = 'https://veqjsjzuaviqctplwkdb.supabase.co/storage/v1/object/public/audio/win_hof_4rounds.mp3'

function formatTime(s) {
  if (!isFinite(s) || s < 0) s = 0
  const m = Math.floor(s / 60)
  const r = Math.floor(s % 60)
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
}

function WimHofTimer({ autoMaximize = true, showBackButton, onBackClick, onFinish }) {
  const { t } = useLang()
  const audioRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [duration, setDuration] = useState(0)
  const maximized = autoMaximize

  useEffect(() => {
    const audio = new Audio(MP3_URL)
    audio.preload = 'auto'
    audioRef.current = audio

    const onTime = () => setElapsed(audio.currentTime)
    const onMeta = () => setDuration(audio.duration)
    const onEnd = () => {
      setIsPlaying(false)
      setHasStarted(false)
      setElapsed(0)
      incrementSessionCount('wimHof')
      onFinish?.()
    }

    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('loadedmetadata', onMeta)
    audio.addEventListener('ended', onEnd)

    return () => {
      audio.pause()
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('loadedmetadata', onMeta)
      audio.removeEventListener('ended', onEnd)
      audioRef.current = null
    }
  }, [])

  const togglePlay = async () => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      try {
        await audio.play()
        setIsPlaying(true)
        setHasStarted(true)
      } catch (e) {
        setIsPlaying(false)
      }
    } else {
      audio.pause()
      setIsPlaying(false)
    }
  }

  const reset = () => {
    const audio = audioRef.current
    if (!audio) return
    audio.pause()
    audio.currentTime = 0
    setElapsed(0)
    setIsPlaying(false)
    setHasStarted(false)
  }

  const handleScreenClick = () => {
    if (!hasStarted) return
    togglePlay()
  }

  const stop = (e) => e.stopPropagation()

  const remaining = Math.max(0, duration - elapsed)
  const progress = duration > 0 ? (elapsed / duration) * 100 : 0

  return (
    <div
      className={`wim-hof-timer ${maximized ? 'maximized' : ''} ${hasStarted ? 'wh-clickable' : ''}`}
      onClick={handleScreenClick}
    >
      {showBackButton && (
        <button className="wh-back" onClick={(e) => { stop(e); onBackClick?.() }} aria-label="Back">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
      )}

      <div className="wh-content">
        <h2 className="wh-title">{t('wimHof.title')}</h2>
        <p className="wh-subtitle">{t('wimHof.subtitle')}</p>

        <div className="wh-time-display">
          <span className="wh-elapsed">{formatTime(elapsed)}</span>
          <span className="wh-sep">/</span>
          <span className="wh-duration">{formatTime(duration)}</span>
        </div>

        <div className="wh-progress">
          <div className="wh-progress-fill" style={{ width: `${progress}%` }} />
        </div>

        <p className="wh-remaining">{t('wimHof.remaining')}: {formatTime(remaining)}</p>

        <div className="wh-controls">
          <button className="wh-btn wh-btn-primary" onClick={(e) => { stop(e); togglePlay() }}>
            <span className="material-symbols-outlined">
              {isPlaying ? 'pause' : 'play_arrow'}
            </span>
            {isPlaying ? t('active.controls.pause') : t('active.controls.start')}
          </button>
          <button className="wh-btn wh-btn-secondary" onClick={(e) => { stop(e); reset() }}>
            <span className="material-symbols-outlined">restart_alt</span>
            {t('active.controls.reset')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default WimHofTimer
