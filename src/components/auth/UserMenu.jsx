import { useState, useEffect, useRef } from 'preact/hooks'
import './UserMenu.scss'

function getInitials(user) {
  const name = user.user_metadata?.full_name || user.email || '?'
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

export default function UserMenu({ session, onSignOut }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const user = session.user
  const avatar = user.user_metadata?.avatar_url
  const displayName = user.user_metadata?.full_name || user.email

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="user-menu" ref={ref}>
      <button
        className="user-menu__trigger"
        onClick={() => setOpen((o) => !o)}
        aria-label="Menú de usuario"
        aria-expanded={open}
      >
        {avatar ? (
          <img src={avatar} alt={displayName} className="user-menu__avatar" />
        ) : (
          <span className="user-menu__initials">{getInitials(user)}</span>
        )}
      </button>

      {open && (
        <div className="user-menu__dropdown">
          <div className="user-menu__info">
            <span className="material-symbols-outlined">account_circle</span>
            <span className="user-menu__email">{user.email}</span>
          </div>
          <hr className="user-menu__sep" />
          <button
            className="user-menu__signout"
            onClick={() => { setOpen(false); onSignOut() }}
          >
            <span className="material-symbols-outlined">logout</span>
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  )
}
