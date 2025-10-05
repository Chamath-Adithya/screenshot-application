import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

// Mock Tauri invoke
jest.mock('@tauri-apps/api/tauri', () => ({
  invoke: jest.fn(),
}));

import { invoke } from '@tauri-apps/api/tauri';

const mockInvoke = invoke as jest.MockedFunction<typeof invoke>;

describe('App', () => {
  beforeEach(() => {
    mockInvoke.mockClear();
  });

  it('renders the app with capture view', async () => {
    mockInvoke.mockResolvedValueOnce({
      save_directory: '~/Pictures/Screenshots',
      file_format: 'png',
      auto_copy: true,
      hotkeys: {},
      last_version: '0.1.0',
    });
    mockInvoke.mockResolvedValueOnce([]);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Capture Screenshot')).toBeInTheDocument();
    });

    expect(screen.getByText('Full Screen')).toBeInTheDocument();
    expect(screen.getByText('Active Window')).toBeInTheDocument();
  });

  it('switches to settings view', async () => {
    mockInvoke.mockResolvedValueOnce({
      save_directory: '~/Pictures/Screenshots',
      file_format: 'png',
      auto_copy: true,
      hotkeys: {},
      last_version: '0.1.0',
    });
    mockInvoke.mockResolvedValueOnce([]);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Settings'));

    expect(screen.getByText('Save Directory:')).toBeInTheDocument();
  });

  it('captures fullscreen and shows toast', async () => {
    mockInvoke.mockResolvedValueOnce({
      save_directory: '~/Pictures/Screenshots',
      file_format: 'png',
      auto_copy: true,
      hotkeys: {},
      last_version: '0.1.0',
    });
    mockInvoke.mockResolvedValueOnce([]);
    mockInvoke.mockResolvedValueOnce('/path/to/screenshot.png');
    mockInvoke.mockResolvedValueOnce([]);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Full Screen')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Full Screen'));

    await waitFor(() => {
      expect(screen.getByText('Screenshot saved to /path/to/screenshot.png')).toBeInTheDocument();
    });
  });
});
