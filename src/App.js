import { useState, useRef } from "react";
import "./App.css";

function App() {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

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

  const handleSendFiles = async () => {
    if (files.length > 0) {
      try {
        // First check if server is running
        try {
          const healthCheck = await fetch("http://localhost:3001/api/health");
          if (!healthCheck.ok) {
            throw new Error("Server is not responding");
          }
        } catch (healthError) {
          throw new Error("Cannot connect to server. Make sure the backend server is running on port 3001. Start it with: cd Backend/Server && node server.js");
        }

        const formData = new FormData();
        files.forEach((file) => {
          formData.append("files", file);
        });

        const response = await fetch("http://localhost:3001/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          // Try to get error message from response
          let errorMessage = "File upload failed";
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch (e) {
            errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log("Files uploaded successfully:", data);
        alert(`Successfully uploaded ${data.files.length} file(s)!`);
        
        // Files are now saved on the server and can be used with NVIDIA AI model
        // The file paths are available in data.files array
        setFiles([]); // Clear files after successful upload
      } catch (error) {
        console.error("Error uploading files:", error);
        let errorMessage = "Failed to upload files. Please try again.";
        
        if (error.message) {
          errorMessage = error.message;
        } else if (error.name === "TypeError" && error.message.includes("fetch")) {
          errorMessage = "Cannot connect to server. Make sure the backend server is running on port 3001.";
        }
        
        alert(`Upload failed: ${errorMessage}`);
      }
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="App">
      <nav className="navbar">
        <div className="nav-logo-container">
          <div className="logo-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
          <h2 className="hero-title">Where AI Efficiency Meets Small Businesses</h2>
        </div>
        <div className="hero-content-subtitle">
          <p className="hero-subtitle">
            Upload your financial receipts and let PopoAI analyze your business expenses. 
            Get a comprehensive economic outlook summary that helps you identify cost-cutting opportunities 
            by prioritizing essential needs and eliminating unnecessary expenses.
          </p>
        </div>
      </div>
      <div className="landing-container-wrapper">
        <div className="landing-container">
          <h1 className="title">Upload Your Files</h1>
          <p className="subtitle">Add images, text files, or any other documents</p>

          <div
            className={`upload-box ${isDragging ? 'dragging' : ''}`}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
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
                {isDragging ? 'Drop files here' : 'Click or drag files here to upload'}
              </p>
              <p className="upload-hint">Supports images, text files, and more</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </div>

          {files.length > 0 && (
            <div className="files-list">
              <h2 className="files-title">Selected Files ({files.length})</h2>
              <div className="files-grid">
                {files.map((file, index) => (
                  <div key={index} className="file-item">
                    <div className="file-info">
                      <span className="file-name">{file.name}</span>
                      <span className="file-size">{formatFileSize(file.size)}</span>
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

          <button
            className={`send-button ${files.length > 0 ? 'enabled' : 'disabled'}`}
            onClick={handleSendFiles}
            disabled={files.length === 0}
          >
            Send Files
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
