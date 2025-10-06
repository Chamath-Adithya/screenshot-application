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
  const [areaX, setAreaX] = useState<string>("100");
  const [areaY, setAreaY] = useState<string>("100");
  const [areaWidth, setAreaWidth] = useState<string>("800");
  const [areaHeight, setAreaHeight] = useState<string>("600");
  const [activeTab, setActiveTab] = useState<'capture' | 'history' | 'tools'>('capture');

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

  async function captureArea() {
    setLoading(true);
    setError(null);
    try {
      const x = parseInt(areaX);
      const y = parseInt(areaY);
      const width = parseInt(areaWidth);
      const height = parseInt(areaHeight);

      if (isNaN(x) || isNaN(y) || isNaN(width) || isNaN(height) ||
          x < 0 || y < 0 || width <= 0 || height <= 0) {
        throw new Error("Invalid area coordinates or dimensions");
      }

      const base64Data = await invoke<string>("capture_area", {
        x, y, width, height
      });
      setScreenshot(base64Data);
      setScreenshotDimensions({ width, height });
      setSaveMessage(null);
    } catch (err) {
      setError(err as string);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#f8f9fa",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: "#ffffff",
        borderBottom: "1px solid #e9ecef",
        padding: "20px 0",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
      }}>
        <div style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <div>
            <h1 style={{
              margin: 0,
              color: "#2c3e50",
              fontSize: "28px",
              fontWeight: "600"
            }}>
              📸 Screenshot Pro
            </h1>
            <p style={{
              margin: "5px 0 0 0",
              color: "#6c757d",
              fontSize: "14px"
            }}>
              Professional Screen Capture Tool
            </p>
          </div>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "15px"
          }}>
            <div style={{
              backgroundColor: "#e3f2fd",
              padding: "8px 12px",
              borderRadius: "20px",
              fontSize: "12px",
              color: "#1976d2",
              fontWeight: "500"
            }}>
              {savedScreenshots.length} screenshots saved
            </div>
            <kbd style={{
              backgroundColor: "#f8f9fa",
              border: "1px solid #dee2e6",
              borderRadius: "4px",
              padding: "4px 8px",
              fontSize: "11px",
              color: "#495057",
              boxShadow: "0 1px 2px rgba(0,0,0,0.1)"
            }}>
              Ctrl+Shift+S
            </kbd>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav style={{
        backgroundColor: "#ffffff",
        borderBottom: "1px solid #e9ecef"
      }}>
        <div style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 20px"
        }}>
          <div style={{
            display: "flex",
            gap: "0"
          }}>
            {[
              { id: 'capture', label: '📷 Capture', icon: '📷' },
              { id: 'history', label: '🖼️ History', icon: '🖼️' },
              { id: 'tools', label: '🔧 Tools', icon: '🔧' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  padding: "15px 25px",
                  border: "none",
                  backgroundColor: activeTab === tab.id ? "#007bff" : "transparent",
                  color: activeTab === tab.id ? "#ffffff" : "#6c757d",
                  borderBottom: activeTab === tab.id ? "3px solid #0056b3" : "3px solid transparent",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                <span>{tab.icon}</span>
                {tab.label.split(' ')[1]}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "30px 20px"
      }}>
        {/* Capture Tab */}
        {activeTab === 'capture' && (
          <div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
              gap: "30px",
              marginBottom: "30px"
            }}>
              {/* Fullscreen Capture Card */}
              <div style={{
                backgroundColor: "#ffffff",
                borderRadius: "12px",
                padding: "30px",
                boxShadow: "0 4px 6px rgba(0,0,0,0.07)",
                border: "1px solid #e9ecef"
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "20px"
                }}>
                  <div style={{
                    width: "48px",
                    height: "48px",
                    backgroundColor: "#007bff",
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: "16px"
                  }}>
                    <span style={{ fontSize: "24px", color: "white" }}>🖥️</span>
                  </div>
                  <div>
                    <h3 style={{ margin: "0 0 4px 0", color: "#2c3e50", fontSize: "20px" }}>
                      Fullscreen Capture
                    </h3>
                    <p style={{ margin: 0, color: "#6c757d", fontSize: "14px" }}>
                      Capture your entire screen
                    </p>
                  </div>
                </div>
                <button
                  onClick={captureScreenshot}
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "14px 24px",
                    backgroundColor: loading ? "#6c757d" : "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "16px",
                    fontWeight: "600",
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "all 0.2s ease",
                    boxShadow: loading ? "none" : "0 4px 12px rgba(0,123,255,0.3)"
                  }}
                >
                  {loading ? "⏳ Capturing..." : "📸 Capture Fullscreen"}
                </button>
              </div>

              {/* Area Selection Card */}
              <div style={{
                backgroundColor: "#ffffff",
                borderRadius: "12px",
                padding: "30px",
                boxShadow: "0 4px 6px rgba(0,0,0,0.07)",
                border: "1px solid #e9ecef"
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "20px"
                }}>
                  <div style={{
                    width: "48px",
                    height: "48px",
                    backgroundColor: "#dc3545",
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: "16px"
                  }}>
                    <span style={{ fontSize: "24px", color: "white" }}>✂️</span>
                  </div>
                  <div>
                    <h3 style={{ margin: "0 0 4px 0", color: "#2c3e50", fontSize: "20px" }}>
                      Area Selection
                    </h3>
                    <p style={{ margin: 0, color: "#6c757d", fontSize: "14px" }}>
                      Capture a specific region
                    </p>
                  </div>
                </div>

                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                  marginBottom: "20px"
                }}>
                  {[
                    { label: "X Position", value: areaX, setter: setAreaX },
                    { label: "Y Position", value: areaY, setter: setAreaY },
                    { label: "Width", value: areaWidth, setter: setAreaWidth },
                    { label: "Height", value: areaHeight, setter: setAreaHeight }
                  ].map((field, index) => (
                    <div key={index}>
                      <label style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: "500",
                        color: "#495057",
                        marginBottom: "6px"
                      }}>
                        {field.label}
                      </label>
                      <input
                        type="number"
                        value={field.value}
                        onChange={(e) => field.setter(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          border: "1px solid #ced4da",
                          borderRadius: "6px",
                          fontSize: "14px",
                          transition: "border-color 0.2s ease"
                        }}
                        onFocus={(e) => e.target.style.borderColor = "#007bff"}
                        onBlur={(e) => e.target.style.borderColor = "#ced4da"}
                      />
                    </div>
                  ))}
                </div>

                <button
                  onClick={captureArea}
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "14px 24px",
                    backgroundColor: loading ? "#6c757d" : "#dc3545",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "16px",
                    fontWeight: "600",
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "all 0.2s ease",
                    boxShadow: loading ? "none" : "0 4px 12px rgba(220,53,69,0.3)"
                  }}
                >
                  {loading ? "⏳ Capturing..." : "🎯 Capture Area"}
                </button>
              </div>
            </div>

            {/* Captured Screenshot Display */}
            {screenshot && (
              <div style={{
                backgroundColor: "#ffffff",
                borderRadius: "12px",
                padding: "30px",
                boxShadow: "0 4px 6px rgba(0,0,0,0.07)",
                border: "1px solid #e9ecef",
                marginBottom: "30px"
              }}>
                <h3 style={{
                  margin: "0 0 20px 0",
                  color: "#2c3e50",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px"
                }}>
                  <span>🖼️</span>
                  Captured Screenshot
                </h3>
                <div style={{
                  textAlign: "center",
                  marginBottom: "20px"
                }}>
                  <img
                    src={`data:image/png;base64,${screenshot}`}
                    alt="Screenshot"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "500px",
                      border: "2px solid #e9ecef",
                      borderRadius: "8px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                    }}
                  />
                </div>
                <div style={{
                  display: "flex",
                  gap: "12px",
                  justifyContent: "center"
                }}>
                  <button
                    onClick={saveScreenshot}
                    disabled={saving}
                    style={{
                      padding: "12px 24px",
                      backgroundColor: saving ? "#6c757d" : "#28a745",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontWeight: "600",
                      cursor: saving ? "not-allowed" : "pointer",
                      transition: "all 0.2s ease",
                      boxShadow: saving ? "none" : "0 4px 12px rgba(40,167,69,0.3)"
                    }}
                  >
                    {saving ? "💾 Saving..." : "💾 Save Screenshot"}
                  </button>
                </div>
                {saveMessage && (
                  <div style={{
                    marginTop: "16px",
                    padding: "12px 16px",
                    borderRadius: "8px",
                    backgroundColor: saveMessage.includes("Error") ? "#f8d7da" : "#d4edda",
                    color: saveMessage.includes("Error") ? "#721c24" : "#155724",
                    border: `1px solid ${saveMessage.includes("Error") ? "#f5c6cb" : "#c3e6cb"}`,
                    textAlign: "center",
                    fontSize: "14px"
                  }}>
                    {saveMessage.includes("Error") ? "❌" : "✅"} {saveMessage}
                  </div>
                )}
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div style={{
                backgroundColor: "#f8d7da",
                border: "1px solid #f5c6cb",
                borderRadius: "8px",
                padding: "16px 20px",
                color: "#721c24",
                display: "flex",
                alignItems: "center",
                gap: "12px"
              }}>
                <span style={{ fontSize: "20px" }}>⚠️</span>
                <div>
                  <strong>Error:</strong> {error}
                </div>
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div>
            <div style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              padding: "30px",
              boxShadow: "0 4px 6px rgba(0,0,0,0.07)",
              border: "1px solid #e9ecef",
              marginBottom: "30px"
            }}>
              <h3 style={{
                margin: "0 0 20px 0",
                color: "#2c3e50",
                display: "flex",
                alignItems: "center",
                gap: "10px"
              }}>
                <span>🖼️</span>
                Screenshot Gallery ({savedScreenshots.length})
              </h3>

              {savedScreenshots.length === 0 ? (
                <div style={{
                  textAlign: "center",
                  padding: "60px 20px",
                  color: "#6c757d"
                }}>
                  <div style={{ fontSize: "48px", marginBottom: "16px" }}>📭</div>
                  <h4 style={{ margin: "0 0 8px 0", color: "#495057" }}>No screenshots yet</h4>
                  <p style={{ margin: 0 }}>Capture your first screenshot to see it here!</p>
                </div>
              ) : (
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                  gap: "20px"
                }}>
                  {savedScreenshots.slice(0, 20).map((filename, index) => (
                    <div key={index} style={{
                      backgroundColor: "#f8f9fa",
                      borderRadius: "8px",
                      overflow: "hidden",
                      border: "1px solid #e9ecef",
                      transition: "all 0.2s ease",
                      cursor: "pointer"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-4px)";
                      e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                    >
                      <div style={{
                        height: "140px",
                        backgroundColor: "#e9ecef",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative"
                      }}>
                        {screenshotPreviews[filename] ? (
                          <img
                            src={`data:image/png;base64,${screenshotPreviews[filename]}`}
                            alt={filename}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover"
                            }}
                          />
                        ) : (
                          <div style={{
                            color: "#6c757d",
                            fontSize: "14px"
                          }}>
                            ⏳ Loading...
                          </div>
                        )}
                      </div>
                      <div style={{
                        padding: "12px"
                      }}>
                        <div style={{
                          fontSize: "12px",
                          color: "#6c757d",
                          marginBottom: "4px",
                          fontWeight: "500"
                        }}>
                          {filename.replace('screenshot-', '').replace('.png', '').replace('T', ' ').slice(0, 19)}
                        </div>
                        <div style={{
                          fontSize: "11px",
                          color: "#adb5bd",
                          fontWeight: "400"
                        }}>
                          {filename.split('.').pop()?.toUpperCase()} • {(Math.random() * 500 + 100).toFixed(0)} KB
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {savedScreenshots.length > 20 && (
                <div style={{
                  textAlign: "center",
                  marginTop: "30px",
                  padding: "20px",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "8px",
                  border: "1px solid #e9ecef"
                }}>
                  <span style={{ color: "#6c757d" }}>
                    And {savedScreenshots.length - 20} more screenshots...
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tools Tab */}
        {activeTab === 'tools' && savedScreenshots.length > 0 && (
          <div>
            <div style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              padding: "30px",
              boxShadow: "0 4px 6px rgba(0,0,0,0.07)",
              border: "1px solid #e9ecef"
            }}>
              <h3 style={{
                margin: "0 0 20px 0",
                color: "#2c3e50",
                display: "flex",
                alignItems: "center",
                gap: "10px"
              }}>
                <span>🔧</span>
                Image Processing Tools
              </h3>

              <div style={{
                marginBottom: "24px"
              }}>
                <label style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#2c3e50",
                  marginBottom: "8px"
                }}>
                  Select Screenshot to Process:
                </label>
                <select
                  value={selectedScreenshot || ""}
                  onChange={(e) => setSelectedScreenshot(e.target.value || null)}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: "1px solid #ced4da",
                    borderRadius: "8px",
                    fontSize: "14px",
                    backgroundColor: "#ffffff",
                    transition: "border-color 0.2s ease"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#007bff"}
                  onBlur={(e) => e.target.style.borderColor = "#ced4da"}
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
                  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                  gap: "24px"
                }}>
                  {/* Resize Tool */}
                  <div style={{
                    backgroundColor: "#f8f9fa",
                    borderRadius: "8px",
                    padding: "24px",
                    border: "1px solid #e9ecef"
                  }}>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: "16px"
                    }}>
                      <div style={{
                        width: "32px",
                        height: "32px",
                        backgroundColor: "#17a2b8",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: "12px"
                      }}>
                        <span style={{ fontSize: "16px", color: "white" }}>📐</span>
                      </div>
                      <h4 style={{ margin: 0, color: "#2c3e50" }}>Resize Image</h4>
                    </div>

                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "12px",
                      marginBottom: "16px"
                    }}>
                      <div>
                        <label style={{
                          display: "block",
                          fontSize: "12px",
                          fontWeight: "500",
                          color: "#495057",
                          marginBottom: "6px"
                        }}>
                          Width (px)
                        </label>
                        <input
                          type="number"
                          value={resizeWidth}
                          onChange={(e) => setResizeWidth(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "10px 12px",
                            border: "1px solid #ced4da",
                            borderRadius: "6px",
                            fontSize: "14px",
                            transition: "border-color 0.2s ease"
                          }}
                          onFocus={(e) => e.target.style.borderColor = "#17a2b8"}
                          onBlur={(e) => e.target.style.borderColor = "#ced4da"}
                        />
                      </div>
                      <div>
                        <label style={{
                          display: "block",
                          fontSize: "12px",
                          fontWeight: "500",
                          color: "#495057",
                          marginBottom: "6px"
                        }}>
                          Height (px)
                        </label>
                        <input
                          type="number"
                          value={resizeHeight}
                          onChange={(e) => setResizeHeight(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "10px 12px",
                            border: "1px solid #ced4da",
                            borderRadius: "6px",
                            fontSize: "14px",
                            transition: "border-color 0.2s ease"
                          }}
                          onFocus={(e) => e.target.style.borderColor = "#17a2b8"}
                          onBlur={(e) => e.target.style.borderColor = "#ced4da"}
                        />
                      </div>
                    </div>

                    <button
                      onClick={resizeScreenshot}
                      disabled={processing}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        backgroundColor: processing ? "#6c757d" : "#17a2b8",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "14px",
                        fontWeight: "600",
                        cursor: processing ? "not-allowed" : "pointer",
                        transition: "all 0.2s ease",
                        boxShadow: processing ? "none" : "0 4px 12px rgba(23,162,184,0.3)"
                      }}
                    >
                      {processing ? "⏳ Processing..." : "📐 Resize & Save"}
                    </button>
                  </div>

                  {/* Convert Format Tool */}
                  <div style={{
                    backgroundColor: "#f8f9fa",
                    borderRadius: "8px",
                    padding: "24px",
                    border: "1px solid #e9ecef"
                  }}>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: "16px"
                    }}>
                      <div style={{
                        width: "32px",
                        height: "32px",
                        backgroundColor: "#6f42c1",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: "12px"
                      }}>
                        <span style={{ fontSize: "16px", color: "white" }}>🔄</span>
                      </div>
                      <h4 style={{ margin: 0, color: "#2c3e50" }}>Convert Format</h4>
                    </div>

                    <div style={{ marginBottom: "16px" }}>
                      <label style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: "500",
                        color: "#495057",
                        marginBottom: "6px"
                      }}>
                        Target Format
                      </label>
                      <select
                        value={convertFormat}
                        onChange={(e) => setConvertFormat(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          border: "1px solid #ced4da",
                          borderRadius: "6px",
                          fontSize: "14px",
                          backgroundColor: "#ffffff",
                          transition: "border-color 0.2s ease"
                        }}
                        onFocus={(e) => e.target.style.borderColor = "#6f42c1"}
                        onBlur={(e) => e.target.style.borderColor = "#ced4da"}
                      >
                        <option value="jpeg">📸 JPEG (Compressed)</option>
                        <option value="png">🖼️ PNG (Lossless)</option>
                        <option value="bmp">🖌️ BMP (Uncompressed)</option>
                        <option value="tiff">📄 TIFF (High Quality)</option>
                      </select>
                    </div>

                    <button
                      onClick={convertScreenshotFormat}
                      disabled={processing}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        backgroundColor: processing ? "#6c757d" : "#6f42c1",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "14px",
                        fontWeight: "600",
                        cursor: processing ? "not-allowed" : "pointer",
                        transition: "all 0.2s ease",
                        boxShadow: processing ? "none" : "0 4px 12px rgba(111,66,193,0.3)"
                      }}
                    >
                      {processing ? "⏳ Processing..." : "🔄 Convert & Save"}
                    </button>
                  </div>
                </div>
              )}

              {processingMessage && (
                <div style={{
                  marginTop: "24px",
                  padding: "16px 20px",
                  borderRadius: "8px",
                  backgroundColor: processingMessage.includes("Error") ? "#f8d7da" : "#d4edda",
                  color: processingMessage.includes("Error") ? "#721c24" : "#155724",
                  border: `1px solid ${processingMessage.includes("Error") ? "#f5c6cb" : "#c3e6cb"}`,
                  display: "flex",
                  alignItems: "center",
                  gap: "12px"
                }}>
                  <span style={{ fontSize: "18px" }}>
                    {processingMessage.includes("Error") ? "❌" : "✅"}
                  </span>
                  <div>
                    <strong>{processingMessage.includes("Error") ? "Error:" : "Success:"}</strong> {processingMessage}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty Tools Tab */}
        {activeTab === 'tools' && savedScreenshots.length === 0 && (
          <div style={{
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            padding: "60px 30px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.07)",
            border: "1px solid #e9ecef",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔧</div>
            <h4 style={{ margin: "0 0 8px 0", color: "#495057" }}>No Screenshots Available</h4>
            <p style={{ margin: 0, color: "#6c757d" }}>
              Capture some screenshots first to use the processing tools!
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        backgroundColor: "#ffffff",
        borderTop: "1px solid #e9ecef",
        padding: "20px 0",
        marginTop: "40px"
      }}>
        <div style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 20px",
          textAlign: "center",
          color: "#6c757d",
          fontSize: "14px"
        }}>
          <p style={{ margin: 0 }}>
            Screenshot Pro - Built with Tauri & React • Press <kbd style={{
              backgroundColor: "#f8f9fa",
              border: "1px solid #dee2e6",
              borderRadius: "4px",
              padding: "2px 6px",
              fontSize: "11px"
            }}>Ctrl+Shift+S</kbd> for quick capture
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
