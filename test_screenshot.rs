use xcap::{Monitor, Window};
use image::ImageFormat;
use std::fs;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("Testing xcap screenshot functionality...");
    
    // Test monitor capture
    let monitors = Monitor::all()?;
    println!("Found {} monitors", monitors.len());
    
    if let Some(monitor) = monitors.first() {
        println!("Capturing monitor: {}x{}", monitor.width(), monitor.height());
        let image = monitor.capture_image()?;
        let path = "/tmp/test_screenshot.png";
        image.save_with_format(path, ImageFormat::Png)?;
        println!("Screenshot saved to: {}", path);
    }
    
    // Test window capture
    let windows = Window::all()?;
    println!("Found {} windows", windows.len());
    
    if let Some(window) = windows.first() {
        println!("Capturing window: {}", window.title());
        let image = window.capture_image()?;
        let path = "/tmp/test_window.png";
        image.save_with_format(path, ImageFormat::Png)?;
        println!("Window screenshot saved to: {}", path);
    }
    
    println!("Screenshot test completed successfully!");
    Ok(())
}
