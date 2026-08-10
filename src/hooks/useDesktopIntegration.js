import { useEffect, useRef } from 'preact/hooks'
import { isTauri, setKeepAwake, updateTray, onNativeEvent } from '../utils/tauri'
import { formatTime } from '../utils/timerHelpers'

/**
 * Wires a timer to the native macOS shell: keeps the Mac awake while it runs,
 * mirrors the remaining time into the menubar, and routes tray menu clicks back
 * to the timer's own handlers.
 *
 * A no-op in the browser, so timers can call it unconditionally.
 *
 * @param {object}   opts
 * @param {boolean}  opts.isRunning  timer currently counting down
 * @param {number}   opts.timeLeft   seconds remaining in the current phase
 * @param {Function} [opts.onToggle] tray "Pausar/Reanudar"
 * @param {Function} [opts.onSkip]   tray "Saltar fase"
 * @param {Function} [opts.onReset]  tray "Reiniciar"
 */
export function useDesktopIntegration({ isRunning, timeLeft, onToggle, onSkip, onReset }) {
  // Handlers are read through a ref so the tray listener is registered once
  // instead of being torn down and rebuilt on every render.
  const handlers = useRef({ onToggle, onSkip, onReset })
  handlers.current = { onToggle, onSkip, onReset }

  const lastPush = useRef({ label: null, running: null })

  // Keep the Mac awake only while actually running.
  useEffect(() => {
    if (!isTauri()) return
    setKeepAwake(isRunning)
    // Releasing on unmount matters: leaving the timer with the assertion held
    // would keep the machine from ever sleeping.
    return () => { setKeepAwake(false) }
  }, [isRunning])

  // Mirror remaining time into the menubar. timeLeft changes at most once per
  // second, but the guard also drops the repeats caused by unrelated re-renders.
  useEffect(() => {
    if (!isTauri()) return
    const label = formatTime(timeLeft)
    if (lastPush.current.label === label && lastPush.current.running === isRunning) return
    lastPush.current = { label, running: isRunning }
    updateTray(label, isRunning)
  }, [timeLeft, isRunning])

  // Forward tray menu clicks to the timer's real controls.
  useEffect(() => {
    if (!isTauri()) return
    let dispose = () => {}
    let cancelled = false

    onNativeEvent('tray-action', ({ payload }) => {
      const { onToggle, onSkip, onReset } = handlers.current
      if (payload === 'toggle') onToggle?.()
      else if (payload === 'skip') onSkip?.()
      else if (payload === 'reset') onReset?.()
    }).then((unlisten) => {
      // The component may have unmounted while listen() was in flight.
      if (cancelled) unlisten()
      else dispose = unlisten
    })

    return () => { cancelled = true; dispose() }
  }, [])
}

export default useDesktopIntegration
