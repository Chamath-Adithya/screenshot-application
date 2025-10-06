// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use base64::Engine;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn capture_fullscreen() -> Result<(String, u32, u32), String> {
    let screens = screenshots::Screen::all().map_err(|e| e.to_string())?;

    if screens.is_empty() {
        return Err("No screens found".to_string());
    }

    // Capture the primary screen (first screen)
    let screen = &screens[0];
    let image = screen.capture().map_err(|e| e.to_string())?;

    // Convert to PNG and then to base64
    let mut png_data = Vec::new();
    image.write_to(&mut std::io::Cursor::new(&mut png_data), screenshots::image::ImageFormat::Png)
        .map_err(|e| e.to_string())?;

    let base64_string = base64::engine::general_purpose::STANDARD.encode(&png_data);
    let width = image.width();
    let height = image.height();

    Ok((base64_string, width, height))
}

#[tauri::command]
fn save_screenshot(base64_data: &str, filename: &str) -> Result<String, String> {
    use std::fs;
    use std::path::Path;

    // Decode base64 PNG data
    let png_data = base64::engine::general_purpose::STANDARD.decode(base64_data).map_err(|e| e.to_string())?;

    // Create screenshots directory if it doesn't exist
    let screenshots_dir = Path::new("screenshots");
    if !screenshots_dir.exists() {
        fs::create_dir_all(screenshots_dir).map_err(|e| e.to_string())?;
    }

    // Save PNG data directly
    let file_path = screenshots_dir.join(filename);
    fs::write(&file_path, png_data).map_err(|e| e.to_string())?;

    Ok(file_path.to_string_lossy().to_string())
}

#[tauri::command]
fn list_screenshots() -> Result<Vec<String>, String> {
    use std::fs;
    use std::path::Path;

    let screenshots_dir = Path::new("screenshots");
    if !screenshots_dir.exists() {
        return Ok(vec![]);
    }

    let mut screenshots = vec![];
    let entries = fs::read_dir(screenshots_dir).map_err(|e| e.to_string())?;

    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        if path.is_file() {
            if let Some(filename) = path.file_name() {
                if let Some(filename_str) = filename.to_str() {
                    screenshots.push(filename_str.to_string());
                }
            }
        }
    }

    // Sort by filename (which includes timestamp, so newest first)
    screenshots.sort_by(|a, b| b.cmp(a));

    Ok(screenshots)
}

#[tauri::command]
fn load_screenshot(filename: &str) -> Result<String, String> {
    use std::fs;
    use std::path::Path;

    let screenshots_dir = Path::new("screenshots");
    let file_path = screenshots_dir.join(filename);

    if !file_path.exists() {
        return Err("Screenshot file not found".to_string());
    }

    let image_data = fs::read(&file_path).map_err(|e| e.to_string())?;
    let base64_string = base64::engine::general_purpose::STANDARD.encode(&image_data);

    Ok(base64_string)
}

#[tauri::command]
fn resize_screenshot(filename: &str, width: u32, height: u32) -> Result<String, String> {
    use std::fs;
    use std::path::Path;

    let screenshots_dir = Path::new("screenshots");
    let file_path = screenshots_dir.join(filename);

    if !file_path.exists() {
        return Err("Screenshot file not found".to_string());
    }

    // Load the image
    let img = image::open(&file_path).map_err(|e| e.to_string())?;

    // Resize the image
    let resized = img.resize(width, height, image::imageops::FilterType::Lanczos3);

    // Save to a new file
    let resized_filename = format!("resized_{}x{}_{}", width, height, filename);
    let resized_path = screenshots_dir.join(&resized_filename);
    resized.save(&resized_path).map_err(|e| e.to_string())?;

    Ok(resized_filename)
}

#[tauri::command]
fn convert_screenshot_format(filename: &str, format: &str) -> Result<String, String> {
    use std::fs;
    use std::path::Path;

    let screenshots_dir = Path::new("screenshots");
    let file_path = screenshots_dir.join(filename);

    if !file_path.exists() {
        return Err("Screenshot file not found".to_string());
    }

    // Load the image
    let img = image::open(&file_path).map_err(|e| e.to_string())?;

    // Determine the format and extension
    let (image_format, extension) = match format.to_lowercase().as_str() {
        "jpeg" | "jpg" => (image::ImageFormat::Jpeg, "jpg"),
        "png" => (image::ImageFormat::Png, "png"),
        "bmp" => (image::ImageFormat::Bmp, "bmp"),
        "tiff" => (image::ImageFormat::Tiff, "tiff"),
        _ => return Err("Unsupported format. Use: jpeg, png, bmp, or tiff".to_string()),
    };

    // Create new filename
    let base_name = filename.split('.').next().unwrap_or("screenshot");
    let converted_filename = format!("{}.{}", base_name, extension);
    let converted_path = screenshots_dir.join(&converted_filename);

    // Save in the new format
    img.save_with_format(&converted_path, image_format).map_err(|e| e.to_string())?;

    Ok(converted_filename)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, capture_fullscreen, save_screenshot, list_screenshots, load_screenshot, resize_screenshot, convert_screenshot_format])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn capture_fullscreen_impl() -> Result<(String, u32, u32), String> {
    let screens = screenshots::Screen::all().map_err(|e| e.to_string())?;

    if screens.is_empty() {
        return Err("No screens found".to_string());
    }

    // Capture the primary screen (first screen)
    let screen = &screens[0];
    let image = screen.capture().map_err(|e| e.to_string())?;

    // Convert to PNG and then to base64
    let mut png_data = Vec::new();
    image.write_to(&mut std::io::Cursor::new(&mut png_data), screenshots::image::ImageFormat::Png)
        .map_err(|e| e.to_string())?;

    let base64_string = base64::engine::general_purpose::STANDARD.encode(&png_data);
    let width = image.width();
    let height = image.height();

    Ok((base64_string, width, height))
}

fn save_screenshot_impl(base64_data: &str, filename: &str) -> Result<String, String> {
    use std::fs;
    use std::path::Path;

    // Decode base64 PNG data
    let png_data = base64::engine::general_purpose::STANDARD.decode(base64_data).map_err(|e| e.to_string())?;

    // Create screenshots directory if it doesn't exist
    let screenshots_dir = Path::new("screenshots");
    if !screenshots_dir.exists() {
        fs::create_dir_all(screenshots_dir).map_err(|e| e.to_string())?;
    }

    // Save PNG data directly
    let file_path = screenshots_dir.join(filename);
    fs::write(&file_path, png_data).map_err(|e| e.to_string())?;

    Ok(file_path.to_string_lossy().to_string())
}
