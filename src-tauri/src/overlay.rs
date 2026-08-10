//! Small always-on-top overlay window.
//!
//! Toggling into overlay mode shrinks the window, strips its decorations and
//! floats it over other apps. The pre-overlay geometry is stashed so leaving
//! the mode restores exactly what the user had, rather than a guessed default.

use std::sync::Mutex;
use tauri::{LogicalSize, Manager, PhysicalPosition, PhysicalSize};

const OVERLAY_SIZE: f64 = 320.0;
const OVERLAY_MARGIN: f64 = 24.0;

/// Geometry captured before entering overlay mode, so it can be put back.
#[derive(Default)]
pub struct OverlayState(pub Mutex<Option<PreviousGeometry>>);

pub struct PreviousGeometry {
    size: PhysicalSize<u32>,
    position: PhysicalPosition<i32>,
    decorated: bool,
}

#[tauri::command]
pub fn set_overlay_mode(
    enabled: bool,
    app: tauri::AppHandle,
    state: tauri::State<'_, OverlayState>,
) -> Result<(), String> {
    let window = app
        .get_webview_window("main")
        .ok_or_else(|| "main window not found".to_string())?;

    let mut saved = state
        .0
        .lock()
        .map_err(|e| format!("overlay state poisoned: {e}"))?;

    if enabled {
        // Only capture on the first toggle in — re-entering must not overwrite
        // the original geometry with the overlay's own.
        if saved.is_none() {
            *saved = Some(PreviousGeometry {
                size: window.outer_size().map_err(|e| e.to_string())?,
                position: window.outer_position().map_err(|e| e.to_string())?,
                decorated: window.is_decorated().map_err(|e| e.to_string())?,
            });
        }

        window.set_decorations(false).map_err(|e| e.to_string())?;
        window.set_always_on_top(true).map_err(|e| e.to_string())?;
        window
            .set_size(LogicalSize::new(OVERLAY_SIZE, OVERLAY_SIZE))
            .map_err(|e| e.to_string())?;

        // Park it bottom-right of the monitor the window currently sits on.
        if let Ok(Some(monitor)) = window.current_monitor() {
            let scale = monitor.scale_factor();
            let area = monitor.size();
            let side = (OVERLAY_SIZE * scale) as i32;
            let margin = (OVERLAY_MARGIN * scale) as i32;
            let pos = monitor.position();
            window
                .set_position(PhysicalPosition::new(
                    pos.x + area.width as i32 - side - margin,
                    pos.y + area.height as i32 - side - margin * 2,
                ))
                .map_err(|e| e.to_string())?;
        }
    } else {
        window.set_always_on_top(false).map_err(|e| e.to_string())?;

        if let Some(previous) = saved.take() {
            window
                .set_decorations(previous.decorated)
                .map_err(|e| e.to_string())?;
            window.set_size(previous.size).map_err(|e| e.to_string())?;
            window
                .set_position(previous.position)
                .map_err(|e| e.to_string())?;
        } else {
            window.set_decorations(true).map_err(|e| e.to_string())?;
        }
    }

    Ok(())
}
