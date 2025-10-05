# Contributing to Screenshot Application

Thank you for your interest in contributing to the Screenshot Application! This document provides guidelines and information for contributors.

## Development Setup

1. **Prerequisites**
   - Node.js 18+
   - Rust stable
   - Tauri CLI

2. **Clone and Setup**
   ```bash
   git clone <repository-url>
   cd screenshot-application
   npm install
   ```

3. **Development**
   ```bash
   npm run tauri dev
   ```

## Code Style

### Rust Code
- Use `rustfmt` for formatting
- Follow `clippy` linting rules
- Use conventional naming and structure

### TypeScript/React Code
- Use TypeScript strict mode
- Follow ESLint rules
- Use descriptive component and variable names
- Prefer functional components with hooks

### Commit Messages
Follow [Conventional Commits](https://conventionalcommits.org/):
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation
- `style:` for formatting
- `refactor:` for code restructuring
- `test:` for testing
- `chore:` for maintenance

## Pull Request Process

1. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Write tests for new functionality
   - Update documentation if needed
   - Ensure all tests pass

3. **Test Your Changes**
   ```bash
   npm test
   cargo test
   npm run tauri build
   ```

4. **Submit PR**
   - Provide clear description
   - Reference related issues
   - Include screenshots for UI changes

## Testing

### Frontend Tests
```bash
npm test
```

### Backend Tests
```bash
cargo test
```

### Manual Testing
- Test on all supported platforms (Windows, macOS, Linux)
- Verify screenshot capture works
- Check settings persistence
- Test hotkey functionality

## Architecture Guidelines

### Frontend
- Keep components small and focused
- Use TypeScript interfaces for data models
- Handle errors gracefully
- Maintain responsive design

### Backend
- Use async/await for I/O operations
- Validate input parameters
- Return descriptive error messages
- Follow Rust ownership principles

## File Organization

### Frontend (`src/`)
- `App.tsx`: Main application component
- `App.css`: Global styles
- `__tests__/`: Test files

### Backend (`src-tauri/`)
- `lib.rs`: Tauri commands and logic
- `main.rs`: Application entry point
- `Cargo.toml`: Dependencies
- `tauri.conf.json`: Configuration

## Security

- Never store sensitive data in code
- Validate all user inputs
- Use secure file paths
- Follow Tauri security best practices

## Performance

- Optimize image processing
- Minimize memory usage
- Use efficient data structures
- Profile performance-critical code

## Documentation

- Update README for new features
- Document API changes
- Include code comments for complex logic
- Update architecture docs if needed

## Issue Reporting

When reporting bugs:
- Include OS and version
- Describe steps to reproduce
- Include error messages
- Attach screenshots if relevant

## Feature Requests

- Check existing issues first
- Provide detailed use case
- Consider cross-platform implications
- Include mockups if UI-related

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (ISC).
