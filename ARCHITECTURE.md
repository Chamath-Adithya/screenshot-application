# Architecture Overview

## System Architecture

The Screenshot Application is built using a client-server architecture with a desktop frontend and a native backend.

### Frontend (React + TypeScript)
- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **State Management**: React hooks (useState, useEffect)
- **Styling**: CSS modules with responsive design
- **Testing**: Jest + React Testing Library

### Backend (Rust + Tauri)
- **Framework**: Tauri 2.0
- **Language**: Rust (stable)
- **IPC**: Tauri commands for frontend-backend communication
- **Plugins**: Global shortcuts, file system access
- **Testing**: Built-in Rust testing framework

## Data Flow

### Screenshot Capture Flow
1. User clicks capture button or triggers hotkey
2. Frontend invokes Tauri command (`capture_fullscreen` or `capture_active_window`)
3. Backend captures screenshot using `screenshots` crate
4. Image is saved to configured directory
5. Metadata is stored in history JSON
6. Frontend updates UI and shows toast notification

### Settings Management Flow
1. App loads settings from `settings.json` on startup
2. User modifies settings in UI
3. Frontend invokes `save_settings` command
4. Backend writes settings to JSON file
5. Settings persist across app restarts

## File Structure

```
screenshot-application/
├── src/                          # Frontend source
│   ├── App.tsx                   # Main component
│   ├── App.css                   # Styles
│   ├── main.tsx                  # Entry point
│   ├── vite-env.d.ts             # TypeScript declarations
│   └── __tests__/                # Frontend tests
├── src-tauri/                    # Backend source
│   ├── src/
│   │   ├── lib.rs                # Tauri commands
│   │   └── main.rs               # Application entry
│   ├── Cargo.toml                # Rust dependencies
│   ├── tauri.conf.json           # Tauri config
│   └── icons/                    # Application icons
├── dist/                         # Built frontend (generated)
├── src-tauri/target/             # Rust build artifacts (generated)
└── node_modules/                 # Node dependencies (generated)
```

## Key Components

### Frontend Components

#### App Component
- Main application container
- Manages view state (capture/history/settings)
- Handles user interactions
- Displays notifications

#### Capture View
- Primary interface for screenshot actions
- Buttons for different capture modes
- Quick access to settings

#### History View
- Displays list of captured screenshots
- Thumbnail previews
- Action buttons (open, copy, delete)

#### Settings View
- Configuration interface
- Form inputs for save directory, format, etc.
- Save/cancel actions

### Backend Commands

#### Screenshot Commands
- `capture_fullscreen()`: Captures entire screen
- `capture_active_window()`: Captures focused window
- `capture_region()`: Planned for Milestone 2

#### File Management
- `save_image()`: Saves image bytes to disk
- `copy_image_to_clipboard()`: Copies image to system clipboard

#### Settings & History
- `load_settings()` / `save_settings()`: JSON persistence
- `get_history()` / `add_history()` / `clear_history()`: History management

#### Hotkeys
- `register_hotkey()` / `unregister_hotkey()`: Global shortcut management

## Data Models

### Settings
```typescript
interface Settings {
  save_directory: string;
  file_format: string;
  auto_copy: boolean;
  hotkeys: Record<string, string>;
  last_version: string;
}
```

### History Entry
```typescript
interface HistoryEntry {
  id: string;
  file_path: string;
  timestamp: string;
  width: number;
  height: number;
  tags: string[];
}
```

## Security Considerations

- **File System Access**: Limited to configured save directory
- **Clipboard Access**: Only for copying captured images
- **Global Shortcuts**: User-configurable hotkeys
- **No Network Access**: All operations are local

## Performance Considerations

- **Image Processing**: PNG encoding for lossless quality
- **Memory Usage**: Images processed in memory before saving
- **UI Responsiveness**: Async operations with loading states
- **File I/O**: Efficient JSON serialization for settings/history

## Cross-Platform Compatibility

### Windows
- Uses Windows API for screenshot capture
- Supports Windows clipboard
- Compatible with Windows file paths

### macOS
- Uses macOS screenshot utilities
- Supports macOS clipboard
- Compatible with macOS file paths

### Linux
- Uses X11/Wayland screenshot APIs
- Supports Linux clipboard
- Compatible with Linux file paths

## Error Handling

- **Screenshot Failures**: Graceful fallback with user notification
- **File System Errors**: Clear error messages for permission issues
- **Invalid Settings**: Default values for corrupted config files
- **Network Issues**: Offline-first design (no network required)

## Testing Strategy

### Unit Tests
- Rust: Settings/history serialization
- Frontend: Component rendering and interactions

### Integration Tests
- End-to-end screenshot capture flow
- Settings persistence
- Hotkey registration

### Manual QA
- Cross-platform compatibility testing
- UI/UX validation
- Performance testing
