import { useState, useRef } from "react";
import "./App.css";

function App() {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [isDraggingResults, setIsDraggingResults] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [analysisResults, setAnalysisResults] = useState([]);
  const fileInputRef = useRef(null);
  const resultsFileInputRef = useRef(null);

  const API_URL = "http://localhost:3001";

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles((prevFiles) => [...prevFiles, ...droppedFiles]);
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles((prevFiles) => [...prevFiles, ...selectedFiles]);
  };

  const handleRemoveFile = (index) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const uploadFilesToServer = async (filesToUpload) => {
    if (filesToUpload.length === 0) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      filesToUpload.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(errorData.error || errorData.message || "Upload failed");
      }

      const data = await response.json();
      console.log("Files uploaded successfully:", data);
      console.log("NVIDIA Analysis Results:", data.analyses);
      console.log("Number of analyses:", data.analyses?.length);

      // Add files to uploadedFiles state
      setUploadedFiles((prev) => {
        const newFiles = [...prev, ...filesToUpload];
        console.log("Updated uploadedFiles:", newFiles.length);
        return newFiles;
      });

      // Store analysis results - ensure we have the same number as files
      console.log("Response data:", data);
      console.log("Has analyses:", !!data.analyses);
      console.log("Analyses length:", data.analyses?.length);
      
      if (data.analyses && Array.isArray(data.analyses) && data.analyses.length > 0) {
        setAnalysisResults((prev) => {
          const newResults = [...prev, ...data.analyses];
          console.log("Updated analysisResults:", newResults.length);
          console.log("Analysis results content:", newResults);
          console.log("Each analysis:", newResults.map(a => ({
            name: a.originalName,
            hasAnalysis: !!a.analysis,
            error: a.error
          })));
          return newResults;
        });
      } else {
        console.warn("No analyses received from server or analyses array is empty");
        console.warn("Full response data:", JSON.stringify(data, null, 2));
        // Create placeholder analyses for files that don't have results
        setAnalysisResults((prev) => {
          const placeholders = filesToUpload.map(file => ({
            originalName: file.name,
            analysis: null,
            error: data.analyses ? "Analysis array is empty" : "Analysis not received from server"
          }));
          return [...prev, ...placeholders];
        });
      }

      return data;
    } catch (error) {
      console.error("Upload error:", error);
      setUploadError("Failed to upload files. Please try again.");
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendFiles = async () => {
    if (files.length > 0) {
      try {
        await uploadFilesToServer(files);
        setIsUploaded(true);
        setFiles([]);
      } catch (error) {
        // Error already handled in uploadFilesToServer
      }
    }
  };

  const handleBackToUpload = () => {
    setIsUploaded(false);
    setUploadedFiles([]);
    setSelectedFileIndex(0);
    setFiles([]);
    setAnalysisResults([]);
  };

  const handleResultsDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingResults(true);
  };

  const handleResultsDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingResults(false);
  };

  const handleResultsDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleResultsDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingResults(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    try {
      await uploadFilesToServer(droppedFiles);
    } catch (error) {
      // Error already handled in uploadFilesToServer
    }
  };

  const handleResultsFileSelect = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    try {
      await uploadFilesToServer(selectedFiles);
      // Reset input so same file can be selected again
      e.target.value = "";
    } catch (error) {
      // Error already handled in uploadFilesToServer
    }
  };

  const handleRemoveUploadedFile = (index) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
    setAnalysisResults((prev) => prev.filter((_, i) => i !== index));
    if (selectedFileIndex >= index && selectedFileIndex > 0) {
      setSelectedFileIndex(selectedFileIndex - 1);
    } else if (selectedFileIndex >= uploadedFiles.length - 1) {
      setSelectedFileIndex(Math.max(0, uploadedFiles.length - 2));
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const renderFilePreview = (file) => {
    if (!file) return null;

    const fileType = file.type;
    const isImage = fileType.startsWith("image/");
    const isText =
      fileType.startsWith("text/") ||
      file.name.endsWith(".txt") ||
      file.name.endsWith(".md");

    if (isImage) {
      const imageUrl = URL.createObjectURL(file);
      return (
        <img src={imageUrl} alt={file.name} className="file-preview-image" />
      );
    } else if (isText) {
      return (
        <div className="file-preview-text">
          <p>Text file: {file.name}</p>
          <p className="file-preview-size">{formatFileSize(file.size)}</p>
        </div>
      );
    } else {
      return (
        <div className="file-preview-generic">
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          <p className="file-preview-name">{file.name}</p>
          <p className="file-preview-size">{formatFileSize(file.size)}</p>
        </div>
      );
    }
  };

  if (isUploaded) {
    const selectedFile = uploadedFiles[selectedFileIndex] || null;

    return (
      <div className="App">
        <nav className="navbar">
          <div className="nav-logo-container">
            <div className="logo-icon">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="logo-name">PopoAI</span>
          </div>
        </nav>
        <div className="results-container">
          <div className="file-viewer-panel">
            <div className="panel-header">
              <h3>Uploaded Files ({uploadedFiles.length})</h3>
              <button className="back-button" onClick={handleBackToUpload}>
                ← Back to Upload
              </button>
            </div>
            <div className="file-viewer-content">
              {uploadedFiles.length > 0 ? (
                <div className="file-viewer-wrapper">
                  <div className="uploaded-files-list">
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
                        className={`uploaded-file-item ${
                          index === selectedFileIndex ? "selected" : ""
                        }`}
                        onClick={() => setSelectedFileIndex(index)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedFileIndex(index);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                      >
                        <div className="uploaded-file-info">
                          <span className="uploaded-file-name">
                            {file.name}
                          </span>
                          <span className="uploaded-file-size">
                            {formatFileSize(file.size)}
                          </span>
                        </div>
                        <button
                          className="remove-uploaded-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveUploadedFile(index);
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="file-preview-container">
                    {selectedFile && renderFilePreview(selectedFile)}
                  </div>
                </div>
              ) : (
                <p className="no-files-message">No files uploaded yet</p>
              )}
            </div>
            {uploadError && (
              <div className="error-message" style={{ margin: "10px 20px" }}>
                {uploadError}
              </div>
            )}
            <div
              className={`add-files-section ${
                isDraggingResults ? "dragging" : ""
              } ${isUploading ? "uploading" : ""}`}
              onDragEnter={handleResultsDragEnter}
              onDragOver={handleResultsDragOver}
              onDragLeave={handleResultsDragLeave}
              onDrop={handleResultsDrop}
              onClick={() =>
                !isUploading && resultsFileInputRef.current?.click()
              }
              onKeyDown={(e) => {
                if (!isUploading && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  resultsFileInputRef.current?.click();
                }
              }}
              role="button"
              tabIndex={isUploading ? -1 : 0}
              style={{
                opacity: isUploading ? 0.6 : 1,
                cursor: isUploading ? "not-allowed" : "pointer",
              }}
            >
              {isUploading ? (
                <>
                  <div className="loading-spinner"></div>
                  <p className="add-files-text">Uploading...</p>
                </>
              ) : (
                <>
                  <svg
                    className="add-files-icon"
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <p className="add-files-text">Add More Files</p>
                </>
              )}
              <input
                ref={resultsFileInputRef}
                type="file"
                multiple
                onChange={handleResultsFileSelect}
                disabled={isUploading}
                style={{ display: "none" }}
              />
            </div>
          </div>
          <div className="results-panel">
            <div className="result-window result-window-upper">
              <div className="panel-header">
                <h3>Results - Upper Window</h3>
              </div>
              <div className="result-content">
                <p className="result-placeholder">
                  Analysis results will appear here...
                </p>
              </div>
            </div>
            <div className="result-window result-window-lower">
              <div className="panel-header">
                <h3>Results - Lower Window</h3>
              </div>
              <div className="result-content">
                <p className="result-placeholder">
                  Additional results will appear here...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <nav className="navbar">
        <div className="nav-logo-container">
          <div className="logo-icon">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="logo-name">PopoAI</span>
        </div>
      </nav>
      <div className="hero-banner">
        <div className="hero-content">
          <h2 className="hero-title">
            Where AI Efficiency Meets Small Businesses
          </h2>
        </div>
        <div className="hero-content-subtitle">
          <p className="hero-subtitle">
            Upload your financial receipts and let PopoAI analyze your business
            expenses. Get a comprehensive economic outlook summary that helps
            you identify cost-cutting opportunities by prioritizing essential
            needs and eliminating unnecessary expenses.
          </p>
        </div>
      </div>
      <div className="landing-container-wrapper">
        <div className="landing-container">
          <h1 className="title">Upload Your Files</h1>
          <p className="subtitle">
            Add images, text files, or any other documents
          </p>

          <div
            className={`upload-box ${isDragging ? "dragging" : ""}`}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            role="button"
            tabIndex={0}
          >
            <div className="upload-content">
              <svg
                className="upload-icon"
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <p className="upload-text">
                {isDragging
                  ? "Drop files here"
                  : "Click or drag files here to upload"}
              </p>
              <p className="upload-hint">
                Supports images, text files, and more
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              style={{ display: "none" }}
            />
          </div>

          {files.length > 0 && (
            <div className="files-list">
              <h2 className="files-title">Selected Files ({files.length})</h2>
              <div className="files-grid">
                {files.map((file, index) => (
                  <div
                    key={`${file.name}-${file.size}-${file.lastModified}`}
                    className="file-item"
                  >
                    <div className="file-info">
                      <span className="file-name">{file.name}</span>
                      <span className="file-size">
                        {formatFileSize(file.size)}
                      </span>
                    </div>
                    <button
                      className="remove-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile(index);
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {uploadError && <div className="error-message">{uploadError}</div>}
          <button
            className={`send-button ${
              files.length > 0 && !isUploading ? "enabled" : "disabled"
            }`}
            onClick={handleSendFiles}
            disabled={files.length === 0 || isUploading}
          >
            {isUploading ? "Uploading..." : "Send Files"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
