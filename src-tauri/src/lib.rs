use tauri::{Emitter, Manager};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            if let Some(window) = app.get_webview_window("main") {
                window.show().ok();
            }
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app, event| {
            if let tauri::RunEvent::Opened { urls } = event {
                if let Some(url) = urls.first() {
                    let path = url.to_file_path().unwrap_or_default();
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.emit("open-file", path.to_string_lossy().to_string());
                    }
                }
            }
        });
}
