import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

function App() {
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  async function captureScreenshot() {
    setLoading(true);
    setError(null);
    try {
      const base64Data = await invoke<string>("capture_fullscreen");
      setScreenshot(base64Data);
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
      const filePath = await invoke<string>("save_screenshot", { base64Data: screenshot, filename });
      setSaveMessage(`Screenshot saved to: ${filePath}`);
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
    </main>
  );
}

export default App;
