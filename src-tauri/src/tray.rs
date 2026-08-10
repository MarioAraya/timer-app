//! Menubar icon showing the remaining time, plus quick controls.
//!
//! The tray is a mirror, not a source of truth: the frontend pushes the label
//! through `update_tray`, and menu clicks are forwarded back as `tray-action`
//! events for the frontend to interpret. No timer logic lives here.

use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager,
};

/// Pushes the current timer label into the menubar.
/// The frontend formats the string — it owns display and i18n; duplicating the
/// formatting here would be a second place for it to drift.
/// Callers must throttle to at most once per second — see SPEC_MACOS.md §5.6.
#[tauri::command]
pub fn update_tray(label: String, running: bool, app: AppHandle) -> Result<(), String> {
    let Some(tray) = app.tray_by_id("main") else {
        // Loud on purpose: a silently missing tray looks identical to a timer
        // that simply is not running.
        eprintln!("[tray] icon 'main' not found — was build() called in setup?");
        return Err("tray icon not found".into());
    };

    tray.set_title(Some(&label)).map_err(|e| {
        eprintln!("[tray] set_title failed: {e}");
        e.to_string()
    })?;

    if let Some(item) = app.state::<TrayItems>().toggle.lock().ok().and_then(|g| g.clone()) {
        let text = if running { "Pausar" } else { "Reanudar" };
        item.set_text(text).map_err(|e| e.to_string())?;
    }

    Ok(())
}

/// Handle to the menu items that need their label updated at runtime.
#[derive(Default)]
pub struct TrayItems {
    pub toggle: std::sync::Mutex<Option<MenuItem<tauri::Wry>>>,
}

pub fn build(app: &AppHandle) -> tauri::Result<()> {
    let toggle = MenuItem::with_id(app, "toggle", "Pausar", true, None::<&str>)?;
    let skip = MenuItem::with_id(app, "skip", "Saltar fase", true, None::<&str>)?;
    let reset = MenuItem::with_id(app, "reset", "Reiniciar", true, None::<&str>)?;
    let show = MenuItem::with_id(app, "show", "Mostrar ventana", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Salir", true, None::<&str>)?;

    let menu = Menu::with_items(
        app,
        &[
            &toggle,
            &skip,
            &reset,
            &PredefinedMenuItem::separator(app)?,
            &show,
            &quit,
        ],
    )?;

    if let Ok(mut guard) = app.state::<TrayItems>().toggle.lock() {
        *guard = Some(toggle.clone());
    }

    TrayIconBuilder::with_id("main")
        .icon(app.default_window_icon().unwrap().clone())
        .icon_as_template(true)
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id().as_ref() {
            "quit" => app.exit(0),
            "show" => show_main_window(app),
            action => {
                let _ = app.emit("tray-action", action);
            }
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                show_main_window(tray.app_handle());
            }
        })
        .build(app)?;

    Ok(())
}

fn show_main_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}
