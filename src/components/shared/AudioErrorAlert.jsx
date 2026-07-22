import { useLang } from '../../context/LanguageContext'
import './AudioErrorAlert.scss'

function AudioErrorAlert({ onClose }) {
  const { t } = useLang()

  return (
    <div className="audio-error-alert">
      <span className="material-symbols-outlined audio-error-alert__icon">error</span>
      <p className="audio-error-alert__text">{t('active.audioError')}</p>
      <button
        className="audio-error-alert__close"
        onClick={onClose}
        aria-label="Cerrar"
      >
        <span className="material-symbols-outlined">close</span>
      </button>
    </div>
  )
}

export default AudioErrorAlert
