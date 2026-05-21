import { useState, useEffect, useRef } from 'preact/hooks'
import './WimHofTimer.scss'
import { useLang } from '../../context/LanguageContext'
import { incrementSessionCount } from '../../utils/localStorage'
import { getWimHofUrl } from '../../config/wimHofAudio'

function formatTime(s) {
  if (!isFinite(s) || s < 0) s = 0
  const m = Math.floor(s / 60)
  const r = Math.floor(s % 60)
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
}

function WimHofTimer({ autoMaximize = true, showBackButton, onBackClick, onFinish }) {
  const { lang, t } = useLang()
  const audioRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [duration, setDuration] = useState(0)
  const [audioSource, setAudioSource] = useState(null)
  const maximized = autoMaximize

  const mp3Url = getWimHofUrl(lang)

  useEffect(() => {
    const prev = audioRef.current
    if (prev) {
      prev.pause()
      prev.src = ''
    }

    const audio = new Audio(mp3Url)
    audio.preload = 'auto'
    audioRef.current = audio
    setElapsed(0)
    setIsPlaying(false)
    setDuration(0)
    setAudioSource(null)

    if ('caches' in self) {
      caches.match(mp3Url).then(hit => setAudioSource(hit ? 'cache' : 'network'))
    }

    const onTime = () => setElapsed(audio.currentTime)
    const onMeta = () => setDuration(audio.duration)
    const onEnd = () => {
      setIsPlaying(false)
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
  }, [mp3Url])

  const togglePlay = async () => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      try {
        await audio.play()
        setIsPlaying(true)
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
  }

  const remaining = Math.max(0, duration - elapsed)
  const progress = duration > 0 ? (elapsed / duration) * 100 : 0

  return (
    <div className={`wim-hof-timer ${maximized ? 'maximized' : ''}`}>
      {showBackButton && (
        <button className="wh-back" onClick={onBackClick} aria-label="Back">
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
          <button className="wh-btn wh-btn-primary" onClick={togglePlay}>
            <span className="material-symbols-outlined">
              {isPlaying ? 'pause' : 'play_arrow'}
            </span>
            {isPlaying ? t('active.controls.pause') : t('active.controls.start')}
          </button>
          <button className="wh-btn wh-btn-secondary" onClick={reset}>
            <span className="material-symbols-outlined">restart_alt</span>
            {t('active.controls.reset')}
          </button>
        </div>

        {audioSource && (
          <p className="wh-audio-source">
            {audioSource === 'cache' ? '⚡ caché' : '🌐 internet'}
          </p>
        )}

        <p className="wh-credit">
          {t('wimHof.credit')}
        </p>
      </div>
    </div>
  )
}

export default WimHofTimer
