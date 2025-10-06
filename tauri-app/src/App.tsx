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
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  const [resizeWidth, setResizeWidth] = useState<string>("800");
  const [resizeHeight, setResizeHeight] = useState<string>("600");
  const [convertFormat, setConvertFormat] = useState<string>("jpeg");
  const [processing, setProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState<string | null>(null);

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

  async function resizeScreenshot() {
    if (!selectedScreenshot) return;

    setProcessing(true);
    setProcessingMessage(null);
    try {
      const width = parseInt(resizeWidth);
      const height = parseInt(resizeHeight);
      if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
        throw new Error("Invalid dimensions");
      }

      const resizedFilename = await invoke<string>("resize_screenshot", {
        filename: selectedScreenshot,
        width,
        height
      });
      setProcessingMessage(`Screenshot resized and saved as: ${resizedFilename}`);
      // Refresh the screenshot list
      loadSavedScreenshots();
    } catch (err) {
      setProcessingMessage(`Error resizing screenshot: ${err}`);
    } finally {
      setProcessing(false);
    }
  }

  async function convertScreenshotFormat() {
    if (!selectedScreenshot) return;

    setProcessing(true);
    setProcessingMessage(null);
    try {
      const convertedFilename = await invoke<string>("convert_screenshot_format", {
        filename: selectedScreenshot,
        format: convertFormat
      });
      setProcessingMessage(`Screenshot converted and saved as: ${convertedFilename}`);
      // Refresh the screenshot list
      loadSavedScreenshots();
    } catch (err) {
      setProcessingMessage(`Error converting screenshot: ${err}`);
    } finally {
      setProcessing(false);
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

      {savedScreenshots.length > 0 && (
        <div style={{ marginTop: "30px" }}>
          <h3>Image Processing Tools</h3>

          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
              Select Screenshot:
            </label>
            <select
              value={selectedScreenshot || ""}
              onChange={(e) => setSelectedScreenshot(e.target.value || null)}
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "3px",
                border: "1px solid #ccc",
                fontSize: "14px"
              }}
            >
              <option value="">Choose a screenshot...</option>
              {savedScreenshots.map((filename, index) => (
                <option key={index} value={filename}>
                  {filename}
                </option>
              ))}
            </select>
          </div>

          {selectedScreenshot && (
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
              marginTop: "15px"
            }}>
              {/* Resize Section */}
              <div style={{
                border: "1px solid #ddd",
                borderRadius: "5px",
                padding: "15px",
                backgroundColor: "#f9f9f9"
              }}>
                <h4 style={{ marginTop: 0, color: "#333" }}>Resize Image</h4>
                <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", marginBottom: "3px" }}>
                      Width:
                    </label>
                    <input
                      type="number"
                      value={resizeWidth}
                      onChange={(e) => setResizeWidth(e.target.value)}
                      style={{
                        width: "80px",
                        padding: "5px",
                        borderRadius: "3px",
                        border: "1px solid #ccc"
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", marginBottom: "3px" }}>
                      Height:
                    </label>
                    <input
                      type="number"
                      value={resizeHeight}
                      onChange={(e) => setResizeHeight(e.target.value)}
                      style={{
                        width: "80px",
                        padding: "5px",
                        borderRadius: "3px",
                        border: "1px solid #ccc"
                      }}
                    />
                  </div>
                </div>
                <button
                  onClick={resizeScreenshot}
                  disabled={processing}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: processing ? "#ccc" : "#17a2b8",
                    color: "white",
                    border: "none",
                    borderRadius: "3px",
                    cursor: processing ? "not-allowed" : "pointer",
                    fontSize: "14px"
                  }}
                >
                  {processing ? "Processing..." : "Resize & Save"}
                </button>
              </div>

              {/* Convert Format Section */}
              <div style={{
                border: "1px solid #ddd",
                borderRadius: "5px",
                padding: "15px",
                backgroundColor: "#f9f9f9"
              }}>
                <h4 style={{ marginTop: 0, color: "#333" }}>Convert Format</h4>
                <div style={{ marginBottom: "10px" }}>
                  <label style={{ display: "block", fontSize: "12px", marginBottom: "3px" }}>
                    Format:
                  </label>
                  <select
                    value={convertFormat}
                    onChange={(e) => setConvertFormat(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "5px",
                      borderRadius: "3px",
                      border: "1px solid #ccc",
                      fontSize: "14px"
                    }}
                  >
                    <option value="jpeg">JPEG</option>
                    <option value="png">PNG</option>
                    <option value="bmp">BMP</option>
                    <option value="tiff">TIFF</option>
                  </select>
                </div>
                <button
                  onClick={convertScreenshotFormat}
                  disabled={processing}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: processing ? "#ccc" : "#6f42c1",
                    color: "white",
                    border: "none",
                    borderRadius: "3px",
                    cursor: processing ? "not-allowed" : "pointer",
                    fontSize: "14px"
                  }}
                >
                  {processing ? "Processing..." : "Convert & Save"}
                </button>
              </div>
            </div>
          )}

          {processingMessage && (
            <div style={{
              marginTop: "15px",
              padding: "10px",
              borderRadius: "3px",
              backgroundColor: processingMessage.includes("Error") ? "#f8d7da" : "#d4edda",
              color: processingMessage.includes("Error") ? "#721c24" : "#155724",
              border: `1px solid ${processingMessage.includes("Error") ? "#f5c6cb" : "#c3e6cb"}`
            }}>
              {processingMessage}
            </div>
          )}
        </div>
      )}
    </main>
  );
}

export default App;
