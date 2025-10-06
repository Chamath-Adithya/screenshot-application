import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import "./App.css";

function App() {
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [screenshotDimensions, setScreenshotDimensions] = useState<{width: number, height: number} | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [savedScreenshots, setSavedScreenshots] = useState<string[]>([]);
  const [screenshotPreviews, setScreenshotPreviews] = useState<{[key: string]: string}>({});

  useEffect(() => {
    loadSavedScreenshots();

    // Add keyboard shortcut listener
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'S') {
        event.preventDefault();
        captureScreenshot();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    // Load previews for all screenshots
    const loadPreviews = async () => {
      const previews: {[key: string]: string} = {};
      for (const filename of savedScreenshots.slice(0, 10)) { // Load first 10
        try {
          const base64Data = await invoke<string>("load_screenshot", { filename });
          previews[filename] = base64Data;
        } catch (err) {
          console.error(`Failed to load preview for ${filename}:`, err);
        }
      }
      setScreenshotPreviews(previews);
    };

    if (savedScreenshots.length > 0) {
      loadPreviews();
    }
  }, [savedScreenshots]);

  async function loadSavedScreenshots() {
    try {
      const screenshots = await invoke<string[]>("list_screenshots");
      setSavedScreenshots(screenshots);
    } catch (err) {
      console.error("Failed to load screenshots:", err);
    }
  }

  async function captureScreenshot() {
    setLoading(true);
    setError(null);
    try {
      const [base64Data, width, height] = await invoke<[string, number, number]>("capture_fullscreen");
      setScreenshot(base64Data);
      setScreenshotDimensions({ width, height });
      setSaveMessage(null);
    } catch (err) {
      setError(err as string);
    } finally {
      setLoading(false);
    }
  }

  async function saveScreenshot() {
    if (!screenshot) return;

    setSaving(true);
    setSaveMessage(null);
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `screenshot-${timestamp}.png`;
      const filePath = await invoke<string>("save_screenshot", {
        base64Data: screenshot,
        filename
      });
      setSaveMessage(`Screenshot saved to: ${filePath}`);
      // Refresh the screenshot list
      loadSavedScreenshots();
    } catch (err) {
      setSaveMessage(`Error saving screenshot: ${err}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="container">
      <h1>Screenshot Application</h1>

      <div className="row">
        <button
          onClick={captureScreenshot}
          disabled={loading}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            backgroundColor: loading ? "#ccc" : "#007bff",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "Capturing..." : "Capture Fullscreen"}
        </button>
      </div>

      <div style={{
        marginTop: "10px",
        fontSize: "14px",
        color: "#666",
        textAlign: "center"
      }}>
        💡 Tip: Use <kbd style={{
          backgroundColor: "#f0f0f0",
          padding: "2px 6px",
          borderRadius: "3px",
          fontSize: "12px"
        }}>Ctrl+Shift+S</kbd> for quick screenshot capture
      </div>

      {error && (
        <div style={{ color: "red", marginTop: "10px" }}>
          Error: {error}
        </div>
      )}

      {screenshot && (
        <div style={{ marginTop: "20px" }}>
          <h3>Captured Screenshot:</h3>
          <img
            src={`data:image/png;base64,${screenshot}`}
            alt="Screenshot"
            style={{
              maxWidth: "100%",
              maxHeight: "400px",
              border: "1px solid #ccc",
              borderRadius: "5px"
            }}
          />
          <div style={{ marginTop: "10px" }}>
            <button
              onClick={saveScreenshot}
              disabled={saving}
              style={{
                padding: "8px 16px",
                backgroundColor: saving ? "#ccc" : "#28a745",
                color: "white",
                border: "none",
                borderRadius: "3px",
                cursor: saving ? "not-allowed" : "pointer"
              }}
            >
              {saving ? "Saving..." : "Save Screenshot"}
            </button>
          </div>
          {saveMessage && (
            <div style={{
              marginTop: "10px",
              color: saveMessage.includes("Error") ? "red" : "green"
            }}>
              {saveMessage}
            </div>
          )}
        </div>
      )}

      {savedScreenshots.length > 0 && (
        <div style={{ marginTop: "30px" }}>
          <h3>Saved Screenshots ({savedScreenshots.length})</h3>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
            gap: "10px",
            marginTop: "10px"
          }}>
            {savedScreenshots.slice(0, 10).map((filename, index) => (
              <div key={index} style={{
                border: "1px solid #ccc",
                borderRadius: "5px",
                padding: "5px",
                textAlign: "center",
                cursor: "pointer",
                transition: "transform 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
              >
                <div style={{
                  fontSize: "10px",
                  marginBottom: "5px",
                  wordBreak: "break-all",
                  color: "#666"
                }}>
                  {filename.replace('screenshot-', '').replace('.png', '').replace('T', ' ').slice(0, 16)}
                </div>
                {screenshotPreviews[filename] ? (
                  <img
                    src={`data:image/png;base64,${screenshotPreviews[filename]}`}
                    alt={filename}
                    style={{
                      width: "100%",
                      height: "80px",
                      objectFit: "cover",
                      borderRadius: "3px",
                      border: "1px solid #ddd"
                    }}
                  />
                ) : (
                  <div style={{
                    width: "100%",
                    height: "80px",
                    backgroundColor: "#f0f0f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "3px",
                    fontSize: "10px",
                    color: "#666"
                  }}>
                    Loading...
                  </div>
                )}
              </div>
            ))}
          </div>
          {savedScreenshots.length > 10 && (
            <div style={{ marginTop: "10px", fontSize: "14px", color: "#666" }}>
              And {savedScreenshots.length - 10} more...
            </div>
          )}
        </div>
      )}
    </main>
  );
}

export default App;
