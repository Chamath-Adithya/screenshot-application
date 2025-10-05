# Quality Assurance Checklist

## Manual Testing Checklist for Milestone 1

### Setup & Installation
- [ ] Application builds successfully on target platform
- [ ] Application launches without errors
- [ ] UI displays correctly with proper styling
- [ ] Window is resizable and responsive

### Screenshot Capture
- [ ] Full-screen capture button works
- [ ] Screenshot is saved to configured directory
- [ ] File format matches settings (PNG default)
- [ ] Screenshot appears in history
- [ ] Toast notification shows success message
- [ ] Auto-copy to clipboard works (if enabled)

- [ ] Active window capture button works
- [ ] Window screenshot is saved correctly
- [ ] Window screenshot appears in history

### Settings Management
- [ ] Settings load on application start
- [ ] Save directory can be changed
- [ ] File format selection works (PNG/JPG)
- [ ] Auto-copy toggle works
- [ ] Settings persist across application restarts
- [ ] Invalid paths are handled gracefully

### History Management
- [ ] History loads on application start
- [ ] Screenshots display with thumbnails
- [ ] File paths are correct
- [ ] Timestamps are accurate
- [ ] History persists across restarts

### UI Navigation
- [ ] Capture view is default
- [ ] History view displays correctly
- [ ] Settings view displays correctly
- [ ] Navigation between views works
- [ ] Back to capture button works

### Error Handling
- [ ] Screenshot failures show error toast
- [ ] File system permission errors are handled
- [ ] Invalid settings fall back to defaults
- [ ] Network unavailability doesn't break app

### Cross-Platform Testing

#### Windows
- [ ] Screenshot capture works
- [ ] File paths are Windows-compatible
- [ ] Hotkeys work with Windows modifiers
- [ ] Clipboard integration works

#### macOS
- [ ] Screenshot capture works
- [ ] File paths are macOS-compatible
- [ ] Hotkeys work with macOS modifiers
- [ ] Clipboard integration works

#### Linux
- [ ] Screenshot capture works
- [ ] File paths are Linux-compatible
- [ ] Hotkeys work with Linux modifiers
- [ ] Clipboard integration works

### Performance
- [ ] Application starts quickly
- [ ] Screenshot capture is fast
- [ ] UI remains responsive during capture
- [ ] Memory usage is reasonable
- [ ] No memory leaks during extended use

### Security
- [ ] Screenshots are saved locally only
- [ ] No unauthorized network access
- [ ] File system access limited to configured directory
- [ ] Settings don't contain sensitive data

### Accessibility
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] High contrast mode works
- [ ] Color blind friendly

### Edge Cases
- [ ] Multiple monitors (if available)
- [ ] Very large screens
- [ ] Low disk space
- [ ] Read-only file system
- [ ] Corrupted settings file
- [ ] Empty history
- [ ] Very long file paths

## Automated Testing

### Unit Tests
- [ ] Rust settings serialization tests pass
- [ ] Rust history serialization tests pass
- [ ] Frontend component tests pass
- [ ] Test coverage meets minimum requirements

### Integration Tests
- [ ] End-to-end capture flow works
- [ ] Settings persistence works
- [ ] History management works

## Build & Deployment
- [ ] Production build completes successfully
- [ ] Application bundle is created
- [ ] Installer works on clean system
- [ ] Uninstallation removes all files
- [ ] No runtime dependencies missing

## Regression Testing
- [ ] All previous features still work
- [ ] No performance degradation
- [ ] No new crashes or errors

## Documentation
- [ ] README is accurate and complete
- [ ] Setup instructions work
- [ ] Troubleshooting guide helps with common issues
- [ ] API documentation is up to date
