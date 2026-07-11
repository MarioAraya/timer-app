import { render } from 'preact'
import { useEffect, useRef, useState, useCallback } from 'preact/hooks'

const PIP_STYLES = `
  html, body { margin: 0; padding: 0; height: 100%; }
  body {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 10px; font-family: system-ui, -apple-system, sans-serif;
    background: #111; color: #fff; user-select: none; -webkit-user-select: none;
  }
  .pip-phase { font-size: 13px; letter-spacing: 2px; opacity: 0.65; text-transform: uppercase; }
  .pip-time { font-size: 46px; font-weight: 700; font-variant-numeric: tabular-nums; }
  .pip-btn {
    border: none; border-radius: 999px; width: 44px; height: 44px;
    background: rgba(255, 255, 255, 0.15); color: #fff; font-size: 20px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
  }
  .pip-btn:active { background: rgba(255, 255, 255, 0.3); }
`

export const isFloatingWindowSupported = () =>
  typeof window !== 'undefined' && 'documentPictureInPicture' in window

/**
 * Opens a Document Picture-in-Picture window (Chrome/Edge) that floats
 * above every other app on the OS, keeping `content` rendered inside it.
 * Re-renders on every call since `content` is a cheap vnode tree.
 */
export function useFloatingTimer(content) {
  const [pipWindow, setPipWindow] = useState(null)
  const pipWindowRef = useRef(null)

  const open = useCallback(async () => {
    if (!isFloatingWindowSupported() || pipWindowRef.current) return
    const win = await window.documentPictureInPicture.requestWindow({ width: 220, height: 160 })
    const style = win.document.createElement('style')
    style.textContent = PIP_STYLES
    win.document.head.appendChild(style)
    win.addEventListener('pagehide', () => {
      pipWindowRef.current = null
      setPipWindow(null)
    })
    pipWindowRef.current = win
    setPipWindow(win)
  }, [])

  const close = useCallback(() => {
    pipWindowRef.current?.close()
  }, [])

  const toggle = useCallback(() => {
    pipWindowRef.current ? close() : open()
  }, [open, close])

  useEffect(() => {
    if (pipWindow) render(content, pipWindow.document.body)
  })

  // Close the floating window on unmount (e.g. leaving this timer's view)
  useEffect(() => () => pipWindowRef.current?.close(), [])

  return { isFloating: !!pipWindow, isSupported: isFloatingWindowSupported(), toggle }
}
