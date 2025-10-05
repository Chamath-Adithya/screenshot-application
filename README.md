# Screenshot Application

A cross-platform desktop screenshot utility built with Tauri, React, and TypeScript.

## Features

- **Full-screen capture**: Capture the entire screen
- **Active window capture**: Capture the currently focused window
- **Settings management**: Configure save directory, file format, and auto-copy options
- **Screenshot history**: View and manage captured screenshots
- **Global hotkeys**: Register system-wide shortcuts for quick capture
- **Cross-platform**: Works on Windows, macOS, and Linux

## Prerequisites

- **Node.js** (v18 or later)
- **Rust** (stable toolchain)
- **Tauri CLI**: Install with `npm install -g @tauri-apps/cli`

### Linux Dependencies

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install libwebkit2gtk-4.0-dev libappindicator3-dev librsvg2-dev patchelf

# Fedora
sudo dnf install webkit2gtk3-devel libappindicator-gtk3-devel librsvg2-devel patchelf
```

### macOS Dependencies

```bash
# Install Xcode command line tools
xcode-select --install
```

### Windows Dependencies

- Install Visual Studio with C++ build tools
- Install WebView2 runtime

## Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd screenshot-application
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run in development mode**
   ```bash
   npm run tauri dev
   ```

4. **Build for production**
   ```bash
   npm run tauri build
   ```

## Project Structure

```
src-tauri/          # Rust backend
├── src/
│   ├── lib.rs      # Tauri commands and logic
│   └── main.rs     # Application entry point
├── Cargo.toml      # Rust dependencies
└── tauri.conf.json # Tauri configuration

src/                # React frontend
├── App.tsx         # Main application component
├── App.css         # Styles
└── __tests__/      # Frontend tests

.gitlab-ci.yml      # CI/CD pipeline
package.json        # Node dependencies and scripts
```

## Available Scripts

- `npm run dev` - Start Vite development server
- `npm run build` - Build frontend for production
- `npm run tauri dev` - Start Tauri development mode
- `npm run tauri build` - Build Tauri application
- `npm test` - Run frontend tests
- `cargo test` - Run Rust tests

## Configuration

Settings are stored in JSON files in the application's data directory:

- `settings.json`: Application settings
- `history.json`: Screenshot history

## Hotkeys

Default hotkeys:
- **Full screen**: `Ctrl+Shift+S` (Windows/Linux) or `Cmd+Shift+S` (macOS)
- **Active window**: `Ctrl+Shift+W` (Windows/Linux) or `Cmd+Shift+W` (macOS)
- **Region**: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (macOS)

## Testing

Run tests with:
```bash
npm test          # Frontend tests
cargo test        # Backend tests
```

## Building for Distribution

### Linux
```bash
npm run tauri build
```

### Windows (cross-compile from Linux)
```bash
npm run tauri build --target x86_64-pc-windows-msvc
```

### macOS (cross-compile from Linux)
```bash
npm run tauri build --target x86_64-apple-darwin
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

ISC License
