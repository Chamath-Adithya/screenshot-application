use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use serde::{Deserialize, Serialize};
use tauri::Manager;
use tauri_plugin_global_shortcut::GlobalShortcutExt;

#[derive(Serialize, Deserialize, Clone)]
pub struct Settings {
    pub save_directory: String,
    pub file_format: String,
    pub auto_copy: bool,
    pub hotkeys: HashMap<String, String>,
    pub last_version: String,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct HistoryEntry {
    pub id: String,
    pub file_path: String,
    pub timestamp: String,
    pub width: u32,
    pub height: u32,
    pub tags: Vec<String>,
}

fn get_app_data_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    app.path().app_data_dir().map_err(|e| e.to_string())
}

fn get_settings_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let mut path = get_app_data_dir(app)?;
    path.push("settings.json");
    Ok(path)
}

fn get_history_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let mut path = get_app_data_dir(app)?;
    path.push("history.json");
    Ok(path)
}

#[tauri::command]
async fn load_settings(app: tauri::AppHandle) -> Result<Settings, String> {
    let path = get_settings_path(&app)?;
    if path.exists() {
        let data = fs::read_to_string(&path).map_err(|e| e.to_string())?;
        serde_json::from_str(&data).map_err(|e| e.to_string())
    } else {
        // Default settings
        Ok(Settings {
            save_directory: "~/Pictures/Screenshots".to_string(),
            file_format: "png".to_string(),
            auto_copy: true,
            hotkeys: HashMap::from([
                ("capture_fullscreen".to_string(), "CmdOrCtrl+Shift+S".to_string()),
                ("capture_region".to_string(), "CmdOrCtrl+Shift+R".to_string()),
                ("capture_window".to_string(), "CmdOrCtrl+Shift+W".to_string()),
            ]),
            last_version: "0.1.0".to_string(),
        })
    }
}

#[tauri::command]
async fn save_settings(app: tauri::AppHandle, settings: Settings) -> Result<(), String> {
    let path = get_settings_path(&app)?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let data = serde_json::to_string_pretty(&settings).map_err(|e| e.to_string())?;
    fs::write(&path, data).map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_history(app: tauri::AppHandle) -> Result<Vec<HistoryEntry>, String> {
    let path = get_history_path(&app)?;
    if path.exists() {
        let data = fs::read_to_string(&path).map_err(|e| e.to_string())?;
        serde_json::from_str(&data).map_err(|e| e.to_string())
    } else {
        Ok(vec![])
    }
}

#[tauri::command]
async fn add_history(app: tauri::AppHandle, entry: HistoryEntry) -> Result<(), String> {
    let mut history = get_history(app.clone()).await?;
    history.push(entry);
    let path = get_history_path(&app)?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let data = serde_json::to_string_pretty(&history).map_err(|e| e.to_string())?;
    fs::write(&path, data).map_err(|e| e.to_string())
}

#[tauri::command]
async fn clear_history(app: tauri::AppHandle) -> Result<(), String> {
    let path = get_history_path(&app)?;
    fs::write(&path, "[]").map_err(|e| e.to_string())
}

#[tauri::command]
async fn capture_fullscreen(app: tauri::AppHandle) -> Result<String, String> {
    let screens = screenshots::Screen::all().map_err(|e| e.to_string())?;
    if let Some(screen) = screens.first() {
        let image = screen.capture().map_err(|e| e.to_string())?;
        let dynamic_image = image::DynamicImage::ImageRgba8(image);
        let settings = load_settings(app.clone()).await?;
        let filename = format!("screenshot_{}.{}", chrono::Utc::now().timestamp(), settings.file_format);
        let mut filepath = PathBuf::from(settings.save_directory.replace("~", &std::env::var("HOME").unwrap_or_default()));
        filepath.push(&filename);

        if let Some(parent) = filepath.parent() {
            fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }

        // Save based on format
        if settings.file_format == "jpg" {
            dynamic_image.save_with_format(&filepath, image::ImageFormat::Jpeg).map_err(|e| e.to_string())?;
        } else {
            dynamic_image.save_with_format(&filepath, image::ImageFormat::Png).map_err(|e| e.to_string())?;
        }

        // Add to history
        let entry = HistoryEntry {
            id: uuid::Uuid::new_v4().to_string(),
            file_path: filepath.to_string_lossy().to_string(),
            timestamp: chrono::Utc::now().to_rfc3339(),
            width: image.width(),
            height: image.height(),
            tags: vec![],
        };
        add_history(app, entry).await?;

        Ok(filepath.to_string_lossy().to_string())
    } else {
        Err("No screens found".to_string())
    }
}

#[tauri::command]
async fn capture_active_window(app: tauri::AppHandle) -> Result<String, String> {
    // For simplicity, capture fullscreen as active window capture is more complex
    // In a real implementation, use platform-specific APIs
    capture_fullscreen(app).await
}

#[tauri::command]
async fn save_image(app: tauri::AppHandle, path: String, bytes: Vec<u8>) -> Result<(), String> {
    fs::write(&path, bytes).map_err(|e| e.to_string())
}

#[tauri::command]
async fn copy_image_to_clipboard(_app: tauri::AppHandle, bytes: Vec<u8>) -> Result<(), String> {
    let mut clipboard = arboard::Clipboard::new().map_err(|e| e.to_string())?;
    let image = image::load_from_memory(&bytes).map_err(|e| e.to_string())?;
    clipboard.set_image(arboard::ImageData {
        width: image.width() as usize,
        height: image.height() as usize,
        bytes: image.as_bytes().to_vec().into(),
    }).map_err(|e| e.to_string())
}

#[tauri::command]
async fn register_hotkey(app: tauri::AppHandle, hotkey: String) -> Result<(), String> {
    app.global_shortcut().register(hotkey).map_err(|e| e.to_string())
}

#[tauri::command]
async fn unregister_hotkey(app: tauri::AppHandle, hotkey: String) -> Result<(), String> {
    app.global_shortcut().unregister(hotkey).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            load_settings,
            save_settings,
            get_history,
            add_history,
            clear_history,
            capture_fullscreen,
            capture_active_window,
            save_image,
            copy_image_to_clipboard,
            register_hotkey,
            unregister_hotkey
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::path::PathBuf;
    use tauri::test::mock_app;

    #[test]
    fn test_settings_serialization() {
        let settings = Settings {
            save_directory: "~/Pictures/Screenshots".to_string(),
            file_format: "png".to_string(),
            auto_copy: true,
            hotkeys: HashMap::from([
                ("capture_fullscreen".to_string(), "CmdOrCtrl+Shift+S".to_string()),
            ]),
            last_version: "0.1.0".to_string(),
        };

        let json = serde_json::to_string(&settings).unwrap();
        let deserialized: Settings = serde_json::from_str(&json).unwrap();

        assert_eq!(settings.save_directory, deserialized.save_directory);
        assert_eq!(settings.file_format, deserialized.file_format);
        assert_eq!(settings.auto_copy, deserialized.auto_copy);
    }

    #[test]
    fn test_history_serialization() {
        let history = vec![
            HistoryEntry {
                id: "test-id".to_string(),
                file_path: "/path/to/screenshot.png".to_string(),
                timestamp: "2025-10-05T14:02:00Z".to_string(),
                width: 1920,
                height: 1080,
                tags: vec!["test".to_string()],
            }
        ];

        let json = serde_json::to_string(&history).unwrap();
        let deserialized: Vec<HistoryEntry> = serde_json::from_str(&json).unwrap();

        assert_eq!(history.len(), deserialized.len());
        assert_eq!(history[0].id, deserialized[0].id);
        assert_eq!(history[0].file_path, deserialized[0].file_path);
    }
}
