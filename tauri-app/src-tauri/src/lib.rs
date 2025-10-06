// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn capture_fullscreen() -> Result<String, String> {
    let screens = screenshots::Screen::all().map_err(|e| e.to_string())?;

    if screens.is_empty() {
        return Err("No screens found".to_string());
    }

    // Capture the primary screen (first screen)
    let screen = &screens[0];
    let image = screen.capture().map_err(|e| e.to_string())?;

    // Convert to base64
    let buffer = image.as_raw();
    let base64_string = base64::encode(buffer);

    Ok(base64_string)
}

#[tauri::command]
fn save_screenshot(base64_data: &str, filename: &str) -> Result<String, String> {
    use std::fs;
    use std::path::Path;

    // Decode base64 data
    let image_data = base64::decode(base64_data).map_err(|e| e.to_string())?;

    // Create screenshots directory if it doesn't exist
    let screenshots_dir = Path::new("screenshots");
    if !screenshots_dir.exists() {
        fs::create_dir_all(screenshots_dir).map_err(|e| e.to_string())?;
    }

    // Save the file
    let file_path = screenshots_dir.join(filename);
    fs::write(&file_path, image_data).map_err(|e| e.to_string())?;

    Ok(file_path.to_string_lossy().to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, capture_fullscreen, save_screenshot])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
