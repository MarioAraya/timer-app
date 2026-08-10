//! Keeps the Mac awake while a timer is running.
//!
//! Backed by IOKit power assertions (via the `keepawake` crate). The assertion
//! lives in Tauri's managed state and is released by dropping it — leaking one
//! would stop the machine from ever sleeping again, which is the worst failure
//! this module can cause, so every path that clears it must actually drop it.
//!
//! Blocks display and idle sleep. It deliberately does *not* fight a lid close.

use std::sync::Mutex;

#[derive(Default)]
pub struct SleepBlocker(pub Mutex<Option<keepawake::KeepAwake>>);

/// Enables or disables the sleep block. Returns an error string rather than
/// panicking: a failed assertion must never take the timer down with it.
#[tauri::command]
pub fn set_keep_awake(
    enabled: bool,
    blocker: tauri::State<'_, SleepBlocker>,
) -> Result<(), String> {
    let mut guard = blocker
        .0
        .lock()
        .map_err(|e| format!("sleep blocker state poisoned: {e}"))?;

    if !enabled {
        // Dropping the handle releases the IOKit assertion.
        *guard = None;
        return Ok(());
    }

    if guard.is_some() {
        return Ok(()); // already held; creating a second one would leak the first
    }

    let awake = keepawake::Builder::default()
        .display(true)
        .idle(true)
        .reason("Workout timer running")
        .app_name("Timer")
        .app_reverse_domain("cl.marioaraya.timer")
        .create()
        .map_err(|e| format!("could not create power assertion: {e}"))?;

    *guard = Some(awake);
    Ok(())
}
