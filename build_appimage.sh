#!/bin/bash

echo "🚀 Building Screenshot Application as AppImage..."

# Build the Rust application
echo "📦 Building Rust binary..."
cd src-tauri
cargo build --release

# Create AppDir structure
echo "📁 Creating AppDir structure..."
mkdir -p appimage_build/usr/bin
mkdir -p appimage_build/usr/share/applications
mkdir -p appimage_build/usr/share/icons/hicolor/256x256/apps
mkdir -p appimage_build/usr/share/metainfo

# Copy binary
cp target/release/tauri-app appimage_build/usr/bin/screenshot-app

# Create desktop file
cat > appimage_build/usr/share/applications/screenshot-app.desktop << DESKTOP_EOF
[Desktop Entry]
Name=Screenshot App
Comment=Take screenshots easily
Exec=screenshot-app
Icon=screenshot-app
Terminal=false
Type=Application
Categories=Utility;Graphics;
DESKTOP_EOF

# Create AppImage (requires linuxdeployqt or similar tool)
echo "🔧 AppImage creation requires additional tools..."
echo "Consider using: https://github.com/linuxdeploy/linuxdeploy"

echo "✅ Build preparation completed!"
echo "📋 Next steps:"
echo "1. Install linuxdeploy: https://github.com/linuxdeploy/linuxdeploy"
echo "2. Run: linuxdeploy-x86_64.AppImage --appdir=appimage_build"
echo "3. This will create a portable AppImage that works outside Snap environment"
