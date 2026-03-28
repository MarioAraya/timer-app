import { useState } from 'preact/hooks'
import './AuthModal.scss'

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#4285F4" d="M45.5 24.5c0-1.5-.1-3-.4-4.4H24v8.3h12.1c-.5 2.7-2.1 5-4.4 6.5v5.4h7.1c4.2-3.8 6.7-9.5 6.7-15.8z"/>
      <path fill="#34A853" d="M24 46c6.1 0 11.2-2 14.9-5.4l-7.1-5.4c-2 1.3-4.5 2.1-7.8 2.1-6 0-11.1-4-12.9-9.5H3.8v5.6C7.5 41.4 15.2 46 24 46z"/>
      <path fill="#FBBC04" d="M11.1 27.8A13.8 13.8 0 0 1 10.6 24c0-1.3.2-2.6.5-3.8v-5.6H3.8A22 22 0 0 0 2 24c0 3.6.9 7 2.4 10l6.4-4.8-.1-1.4z" />
      <path fill="#EA4335" d="M24 10.7c3.4 0 6.4 1.2 8.8 3.4l6.6-6.6C35.2 3.8 30 1.8 24 1.8 15.2 1.8 7.5 6.6 3.8 13.6l7.3 5.6c1.8-5.5 6.9-8.5 12.9-8.5z"/>
    </svg>
  )
}

export default function AuthModal({ onClose, signInWithGoogle, signInWithMagicLink }) {
  const [email, setEmail] = useState('')
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [loadingGoogle, setLoadingGoogle] = useState(false)
  const [loadingEmail, setLoadingEmail] = useState(false)
  const [error, setError] = useState('')

  const handleGoogle = async () => {
    setLoadingGoogle(true)
    setError('')
    const { error } = await signInWithGoogle()
    if (error) {
      setError(error.message)
      setLoadingGoogle(false)
    }
    // Si no hay error, el browser redirige — no hace falta limpiar loading
  }

  const handleMagicLink = async (e) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoadingEmail(true)
    setError('')
    const { error } = await signInWithMagicLink(email.trim())
    setLoadingEmail(false)
    if (error) {
      setError(error.message)
    } else {
      setMagicLinkSent(true)
    }
  }

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal__close" onClick={onClose} aria-label="Cerrar">
          <span className="material-symbols-outlined">close</span>
        </button>

        <div className="auth-modal__header">
          <span className="material-symbols-outlined auth-modal__logo">fitness_center</span>
          <h2>Inicia sesión</h2>
          <p>Guarda tu progreso y rutinas personalizadas</p>
        </div>

        {magicLinkSent ? (
          <div className="auth-modal__success">
            <span className="material-symbols-outlined">mark_email_read</span>
            <h3>Revisa tu correo</h3>
            <p>Enviamos un link a <strong>{email}</strong>. Haz clic en él para entrar.</p>
            <button className="auth-modal__back-link" onClick={() => setMagicLinkSent(false)}>
              Usar otro correo
            </button>
          </div>
        ) : (
          <div className="auth-modal__body">
            <button
              className="auth-modal__google-btn"
              onClick={handleGoogle}
              disabled={loadingGoogle}
            >
              {loadingGoogle
                ? <span className="auth-modal__spinner" />
                : <GoogleIcon />
              }
              Continuar con Google
            </button>

            <div className="auth-modal__divider">
              <span>o</span>
            </div>

            <form onSubmit={handleMagicLink} className="auth-modal__email-form">
              <input
                type="email"
                placeholder="tu@correo.com"
                value={email}
                onInput={(e) => setEmail(e.target.value)}
                required
                className="auth-modal__input"
                autoComplete="email"
              />
              <button
                type="submit"
                className="auth-modal__email-btn"
                disabled={loadingEmail || !email.trim()}
              >
                {loadingEmail
                  ? <span className="auth-modal__spinner" />
                  : 'Enviar link mágico'
                }
              </button>
            </form>

            {error && <p className="auth-modal__error">{error}</p>}

            <p className="auth-modal__disclaimer">
              Al continuar aceptas que guardemos tu progreso. Sin contraseñas.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
