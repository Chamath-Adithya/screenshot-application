use xcap::{Monitor, Window};
use image::ImageFormat;
use std::env;
use std::fs;
use std::path::Path;

#[derive(Debug)]
enum CaptureMode {
    Monitor,
    Window,
    Area,
}

fn print_usage() {
    println!("📸 Standalone Screenshot Tool");
    println!("Usage:");
    println!("  cargo run --bin standalone_screenshot monitor [output.png]");
    println!("  cargo run --bin standalone_screenshot window [output.png]");
    println!("  cargo run --bin standalone_screenshot area [output.png]");
    println!("Examples:");
    println!("  cargo run --bin standalone_screenshot monitor");
    println!("  cargo run --bin standalone_screenshot window screenshot.png");
    println!("  cargo run --bin standalone_screenshot area /tmp/area.png");
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args: Vec<String> = env::args().collect();
    
    if args.len() < 2 {
        print_usage();
        return Ok(());
    }
    
    let mode = match args[1].as_str() {
        "monitor" => CaptureMode::Monitor,
        "window" => CaptureMode::Window,
        "area" => CaptureMode::Area,
        _ => {
            println!("❌ Unknown mode: {}", args[1]);
            print_usage();
            return Ok(());
        }
    };
    
    let output_path = if args.len() > 2 {
        args[2].clone()
    } else {
        format!("screenshot_{}.png", chrono::Utc::now().timestamp())
    };
    
    println!("🚀 Capturing screenshot...");
    
    match mode {
        CaptureMode::Monitor => {
            let monitors = Monitor::all()?;
            if let Some(monitor) = monitors.first() {
                println!("📺 Capturing monitor: {}x{}", monitor.width(), monitor.height());
                let image = monitor.capture_image()?;
                image.save_with_format(&output_path, ImageFormat::Png)?;
                println!("✅ Screenshot saved to: {}", output_path);
            } else {
                println!("❌ No monitors found");
            }
        }
        CaptureMode::Window => {
            let windows = Window::all()?;
            if let Some(window) = windows.first() {
                println!("��️  Capturing window: {}", window.title());
                let image = window.capture_image()?;
                image.save_with_format(&output_path, ImageFormat::Png)?;
                println!("✅ Screenshot saved to: {}", output_path);
            } else {
                println!("❌ No windows found");
            }
        }
        CaptureMode::Area => {
            println!("🎯 Area capture requires manual implementation");
            println!("💡 For now, using monitor capture as fallback");
            let monitors = Monitor::all()?;
            if let Some(monitor) = monitors.first() {
                let image = monitor.capture_image()?;
                image.save_with_format(&output_path, ImageFormat::Png)?;
                println!("✅ Screenshot saved to: {}", output_path);
            }
        }
    }
    
    Ok(())
}
