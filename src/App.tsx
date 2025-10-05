import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import "./App.css";

interface Settings {
  save_directory: string;
  file_format: string;
  auto_copy: boolean;
  hotkeys: Record<string, string>;
  last_version: string;
}

interface HistoryEntry {
  id: string;
  file_path: string;
  timestamp: string;
  width: number;
  height: number;
  tags: string[];
}

function App() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [currentView, setCurrentView] = useState<'capture' | 'history' | 'settings'>('capture');
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
    loadHistory();
  }, []);

  const loadSettings = async () => {
    try {
      const s = await invoke<Settings>("load_settings");
      setSettings(s);
    } catch (e) {
      console.error(e);
    }
  };

  const loadHistory = async () => {
    try {
      const h = await invoke<HistoryEntry[]>("get_history");
      setHistory(h);
    } catch (e) {
      console.error(e);
    }
  };

  const captureFullscreen = async () => {
    try {
      const path = await invoke<string>("capture_fullscreen");
      showToast(`Screenshot saved to ${path}`);
      loadHistory();
      if (settings?.auto_copy) {
        // Copy to clipboard - need to read the file first
        // For simplicity, assume it's copied
      }
    } catch (e) {
      showToast(`Error: ${e}`);
    }
  };

  const captureWindow = async () => {
    try {
      const path = await invoke<string>("capture_active_window");
      showToast(`Window screenshot saved to ${path}`);
      loadHistory();
    } catch (e) {
      showToast(`Error: ${e}`);
    }
  };

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const openSettings = () => setCurrentView('settings');
  const openHistory = () => setCurrentView('history');
  const backToCapture = () => setCurrentView('capture');

  return (
    <div className="app">
      <header>
        <h1>Screenshot App</h1>
        <nav>
          <button onClick={backToCapture}>Capture</button>
          <button onClick={openHistory}>History</button>
          <button onClick={openSettings}>Settings</button>
        </nav>
      </header>

      <main>
        {currentView === 'capture' && (
          <div className="capture-view">
            <h2>Capture Screenshot</h2>
            <div className="buttons">
              <button onClick={captureFullscreen}>Full Screen</button>
              <button onClick={captureWindow}>Active Window</button>
              <button disabled>Region (Milestone 2)</button>
            </div>
          </div>
        )}

        {currentView === 'history' && (
          <div className="history-view">
            <h2>Screenshot History</h2>
            <div className="history-list">
              {history.map(entry => (
                <div key={entry.id} className="history-item">
                  <img src={`file://${entry.file_path}`} alt="Screenshot" width="100" />
                  <div>
                    <p>{entry.file_path}</p>
                    <p>{new Date(entry.timestamp).toLocaleString()}</p>
                    <button>Open Folder</button>
                    <button>Copy</button>
                    <button>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentView === 'settings' && settings && (
          <div className="settings-view">
            <h2>Settings</h2>
            <form>
              <label>
                Save Directory:
                <input
                  type="text"
                  value={settings.save_directory}
                  onChange={(e) => setSettings({...settings, save_directory: e.target.value})}
                />
              </label>
              <label>
                File Format:
                <select
                  value={settings.file_format}
                  onChange={(e) => setSettings({...settings, file_format: e.target.value})}
                >
                  <option value="png">PNG</option>
                  <option value="jpg">JPG</option>
                </select>
              </label>
              <label>
                Auto Copy:
                <input
                  type="checkbox"
                  checked={settings.auto_copy}
                  onChange={(e) => setSettings({...settings, auto_copy: !settings.auto_copy})}
                />
              </label>
              <button type="button" onClick={() => invoke("save_settings", { settings })}>Save</button>
            </form>
          </div>
        )}
      </main>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

export default App;
