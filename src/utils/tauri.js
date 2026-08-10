/**
 * Thin wrapper over the Tauri IPC layer.
 *
 * Every call from the frontend into the native shell goes through here —
 * never `invoke()` straight from a component. Outside Tauri (i.e. the web
 * PWA) each wrapper is a no-op that resolves, so shared components can call
 * them unconditionally without branching. See SPEC_MACOS.md §5.3.
 */

/** True when running inside the Tauri WebView, false in a plain browser. */
export function isTauri() {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

/**
 * Calls a Tauri command, resolving to null when not running under Tauri.
 * Never throws: a failing native call must not take the timer down with it.
 */
async function safeInvoke(command, args) {
  if (!isTauri()) return null
  try {
    const { invoke } = await import('@tauri-apps/api/core')
    return await invoke(command, args)
  } catch (err) {
    console.warn(`[tauri] command "${command}" failed:`, err)
    return null
  }
}

/**
 * Subscribes to a native event. Returns an unlisten function
 * (a no-op outside Tauri, so callers can always call it on cleanup).
 */
export async function onNativeEvent(event, handler) {
  if (!isTauri()) return () => {}
  try {
    const { listen } = await import('@tauri-apps/api/event')
    return await listen(event, handler)
  } catch (err) {
    console.warn(`[tauri] listen "${event}" failed:`, err)
    return () => {}
  }
}

/** Keeps the Mac awake while a timer runs. Slice 3. */
export const setKeepAwake = (enabled) => safeInvoke('set_keep_awake', { enabled })

/** Toggles the small always-on-top overlay window. Slice 4. */
export const setOverlayMode = (enabled) => safeInvoke('set_overlay_mode', { enabled })

/** Updates the menubar title. Callers must throttle to 1/s. Slice 5. */
export const updateTray = (label, running) => safeInvoke('update_tray', { label, running })
