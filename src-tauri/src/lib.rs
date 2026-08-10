//! Tauri shell for the timer app.
//!
//! Deliberately thin: timer state lives in the frontend and only there.
//! This layer reflects what the frontend reports and forwards user intent
//! back to it. It never counts time and knows nothing about phases.
//! See SPEC_MACOS.md §5.3.

mod overlay;
mod sleep;
mod tray;

use tauri::WindowEvent;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(sleep::SleepBlocker::default())
        .manage(overlay::OverlayState::default())
        .manage(tray::TrayItems::default())
        .invoke_handler(tauri::generate_handler![
            sleep::set_keep_awake,
            overlay::set_overlay_mode,
            tray::update_tray,
        ])
        .setup(|app| {
            tray::build(app.handle())?;
            Ok(())
        })
        .on_window_event(|window, event| {
            // Closing the window hides it so the tray keeps counting.
            // Quitting is explicit, from the tray menu.
            if let WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
