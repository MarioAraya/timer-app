//! Tauri shell for the timer app.
//!
//! Deliberately thin: timer state lives in the frontend and only there.
//! This layer reflects what the frontend reports and forwards user intent
//! back to it. It never counts time and knows nothing about phases.
//! See SPEC_MACOS.md §5.3.

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
