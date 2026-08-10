import { useState, useCallback } from 'preact/hooks'
import { isTauri, setOverlayMode } from '../../utils/tauri'
import './OverlayToggle.scss'

/**
 * Floating toggle for the macOS overlay window: small, always-on-top, chrome-free.
 *
 * Renders nothing in the browser. The `data-overlay` attribute on <html> is what
 * the SCSS hooks into to strip the UI down to the essentials — Rust resizes the
 * window, this marks the document so the layout can follow.
 */
function OverlayToggle() {
  const [active, setActive] = useState(false)

  const toggle = useCallback(() => {
    const next = !active
    setActive(next)
    document.documentElement.dataset.overlay = next ? 'true' : 'false'
    setOverlayMode(next)
  }, [active])

  if (!isTauri()) return null

  return (
    <button
      className={`overlay-toggle ${active ? 'active' : ''}`}
      onClick={toggle}
      title={active ? 'Salir del modo flotante' : 'Modo flotante'}
      aria-label={active ? 'Salir del modo flotante' : 'Modo flotante'}
      aria-pressed={active}
    >
      <span className="material-symbols-outlined">
        {active ? 'close_fullscreen' : 'picture_in_picture'}
      </span>
    </button>
  )
}

export default OverlayToggle
