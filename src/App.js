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
  const [vendorMap, setVendorMap] = useState(new Map()); // itemName -> vendor
  const fileInputRef = useRef(null);
  const resultsFileInputRef = useRef(null);

  const API_URL = "http://localhost:3001";

  // Parse CSV file to extract vendor information
  const parseCSVForVendors = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        const lines = text.split("\n");
        const vendorData = new Map();

        // Skip header row
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          // Parse CSV line (handle quoted values)
          const values = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g) || [];
          if (values.length >= 3) {
            const vendor = values[1].replace(/^"|"$/g, "").trim();
            const itemDescription = values[2].replace(/^"|"$/g, "").trim();
            
            // Normalize item name (remove extra details for matching)
            const normalizedItem = itemDescription.toLowerCase();
            vendorData.set(normalizedItem, vendor);
          }
        }

        resolve(vendorData);
      };
      reader.readAsText(file);
    });
  };

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

      // Parse CSV files to extract vendor information
      const newVendorMap = new Map(vendorMap);
      for (const file of filesToUpload) {
        if (file.name.endsWith(".csv")) {
          try {
            const vendorData = await parseCSVForVendors(file);
            // Merge vendor data into the map
            vendorData.forEach((vendor, item) => {
              if (!newVendorMap.has(item)) {
                newVendorMap.set(item, vendor);
              }
            });
          } catch (error) {
            console.error("Error parsing CSV for vendors:", error);
          }
        }
      }
      setVendorMap(newVendorMap);

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

  // Parse analysis text to extract numerical data from markdown tables
  const parseAnalysisForNumericalData = (analysisText) => {
    if (!analysisText) return [];

    const lines = analysisText.split("\n");
    const tableData = [];
    let inTable = false;
    let headers = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Detect table start (look for header row with |)
      if (line.includes("|") && line.includes("Priority") && line.includes("Item Description")) {
        inTable = true;
        headers = line
          .split("|")
          .map((h) => h.trim())
          .filter((h) => h.length > 0);
        continue;
      }

      // Skip separator row (|---|---|)
      if (inTable && line.match(/^\|[\s\-:]+\|/)) {
        continue;
      }

      // Parse table rows
      if (inTable && line.includes("|") && !line.match(/^\|[\s\-:]+\|/)) {
        const cells = line
          .split("|")
          .map((c) => c.trim())
          .filter((c) => c.length > 0);

        if (cells.length >= 6) {
          // Extract numerical values
          const priority = parseInt(cells[0]) || 0;
          const itemDescription = cells[1] || "";
          const quantityUsed = cells[2] || "0";
          const costPerUnit = cells[3] || "0";
          const recommendedRestock = cells[4] || "0";
          const totalCost = cells[5] || "0";

          // Extract numbers from strings (handle formats like "3 box", "$5.50", etc.)
          const extractNumber = (str) => {
            const match = str.match(/[\d.]+/);
            return match ? parseFloat(match[0]) : 0;
          };

          const quantityNum = extractNumber(quantityUsed);
          const restockNum = extractNumber(recommendedRestock);
          const costNum = extractNumber(costPerUnit);
          const totalNum = extractNumber(totalCost);

          // Calculate change (restock - quantity used)
          const change = restockNum - quantityNum;
          const changePercent =
            quantityNum > 0 ? ((change / quantityNum) * 100).toFixed(1) : 0;

          tableData.push({
            priority,
            item: itemDescription,
            quantityUsed: quantityNum,
            recommendedRestock: restockNum,
            change,
            changePercent: parseFloat(changePercent),
            costPerUnit: costNum,
            totalCost: totalNum,
          });
        }
      }

      // Stop parsing if we hit another section
      if (inTable && line.startsWith("###")) {
        break;
      }
    }

    return tableData;
  };

  // Aggregate data across all files/weeks and calculate week-to-week changes
  const aggregateAnalysisData = () => {
    if (!analysisResults || analysisResults.length === 0) {
      return { items: [], weeks: [] };
    }

    // Use current vendorMap from state
    const currentVendorMap = vendorMap;

    // Parse all analysis results and group by item name
    const itemMap = new Map(); // itemName -> { weeks: [], netChange: 0 }
    const weekData = [];

    analysisResults.forEach((analysis, weekIndex) => {
      if (!analysis || !analysis.analysis) return;

      const weekItems = parseAnalysisForNumericalData(analysis.analysis);
      weekData.push({
        week: weekIndex + 1,
        items: weekItems,
      });

      // Group items by name across weeks
      weekItems.forEach((item) => {
        const itemName = item.item.trim();
        if (!itemMap.has(itemName)) {
          itemMap.set(itemName, {
            name: itemName,
            weeks: [],
            firstWeekValue: null,
            lastWeekValue: null,
            netChange: 0,
            netChangePercent: 0,
            priority: item.priority || 999, // Default to high number if no priority
          });
        }

        const itemData = itemMap.get(itemName);
        
        // Store priority from first occurrence (lower number = higher priority = more frequent restocks)
        if (itemData.priority === undefined || item.priority < itemData.priority) {
          itemData.priority = item.priority;
        }
        
        // Find vendor for this item (try exact match and normalized match)
        let vendor = null;
        const normalizedItemName = itemName.toLowerCase();
        if (currentVendorMap.has(normalizedItemName)) {
          vendor = currentVendorMap.get(normalizedItemName);
        } else {
          // Try partial matching
          for (const [key, value] of currentVendorMap.entries()) {
            if (normalizedItemName.includes(key) || key.includes(normalizedItemName)) {
              vendor = value;
              break;
            }
          }
        }
        
        if (!itemData.vendor && vendor) {
          itemData.vendor = vendor;
        }
        
        itemData.weeks.push({
          week: weekIndex + 1,
          quantityUsed: item.quantityUsed,
          recommendedRestock: item.recommendedRestock,
          change: item.change,
          changePercent: item.changePercent,
          costPerUnit: item.costPerUnit || 0,
          totalCost: item.totalCost || 0,
        });

        // Track first and last week values for net change calculation
        if (itemData.firstWeekValue === null) {
          itemData.firstWeekValue = item.quantityUsed;
        }
        itemData.lastWeekValue = item.recommendedRestock;
      });
    });

    // Calculate net change per item
    const items = Array.from(itemMap.values()).map((item) => {
      const netChange = item.lastWeekValue - item.firstWeekValue;
      const netChangePercent =
        item.firstWeekValue > 0
          ? ((netChange / item.firstWeekValue) * 100).toFixed(1)
          : 0;

      return {
        ...item,
        netChange,
        netChangePercent: parseFloat(netChangePercent),
      };
    });

    // Sort by priority (lower number = higher priority = more frequent restocks needed)
    // Then by cost per item (higher cost items first within same priority)
    // Then by item name for consistency
    items.sort((a, b) => {
      // First sort by priority (lower number = higher priority)
      if (a.priority !== b.priority) {
        return (a.priority || 999) - (b.priority || 999);
      }
      
      // If same priority, sort by cost per item (higher cost first)
      const aCost = a.weeks.find((w) => w.costPerUnit > 0)?.costPerUnit || 0;
      const bCost = b.weeks.find((w) => w.costPerUnit > 0)?.costPerUnit || 0;
      if (Math.abs(aCost - bCost) > 0.01) {
        return bCost - aCost;
      }
      
      // Finally, sort alphabetically by name
      return a.name.localeCompare(b.name);
    });

    // Check if any items have cost data
    const hasCostData = items.some((item) =>
      item.weeks.some((w) => w.totalCost > 0 || w.costPerUnit > 0)
    );

    return { items, weeks: weekData, hasCostData };
  };

  // Render numerical analysis view as ledger/spreadsheet with multi-week tracking
  const renderNumericalAnalysis = () => {
    if (!analysisResults || analysisResults.length === 0) {
      return (
        <p className="result-placeholder">
          Upload files to see weekly change analysis...
        </p>
      );
    }

    const { items, weeks, hasCostData } = aggregateAnalysisData();

    if (items.length === 0) {
      return (
        <p className="result-placeholder">
          No numerical data found in analysis.
        </p>
      );
    }

    // Build table headers dynamically based on number of weeks
    const weekHeaders = weeks.map((w) => (
      <th key={`week-${w.week}`} className="ledger-col-number">
        Week {w.week}
      </th>
    ));

    return (
      <div className="numerical-analysis ledger-view">
        <div className="ledger-header">
          <h4>
            Inventory Ledger - Multi-Week Analysis ({weeks.length} week
            {weeks.length !== 1 ? "s" : ""})
          </h4>
        </div>
        <div className="ledger-table-container">
          <table className="ledger-table">
            <thead>
              <tr>
                <th className="ledger-col-item">Item</th>
                {weekHeaders}
                <th className="ledger-col-number">Net Change</th>
                <th className="ledger-col-number">% Change</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                // Calculate net change percentage for color coding
                const netChangePercent = item.netChangePercent;
                const isSignificantIncrease = netChangePercent > 5;
                const isSignificantDecrease = netChangePercent < -5;

                // Build week cells
                const weekCells = weeks.map((week) => {
                  const weekItem = item.weeks.find((w) => w.week === week.week);
                  if (!weekItem) {
                    return (
                      <td key={`${index}-week-${week.week}`} className="ledger-number">
                        -
                      </td>
                    );
                  }

                  // Calculate week-to-week change
                  const prevWeek = item.weeks.find((w) => w.week === week.week - 1);
                  let weekChange = 0;
                  let displayValue = Math.round(weekItem.quantityUsed);

                  if (prevWeek) {
                    // Change from previous week's quantity used to current week's quantity used
                    weekChange = Math.round(weekItem.quantityUsed - prevWeek.quantityUsed);
                  } else {
                    // First week - no change to show (no previous week)
                    weekChange = 0;
                  }

                  const weekChangePercent =
                    prevWeek && prevWeek.quantityUsed > 0
                      ? ((weekChange / prevWeek.quantityUsed) * 100).toFixed(1)
                      : 0;

                  const isWeekIncrease = parseFloat(weekChangePercent) > 5;
                  const isWeekDecrease = parseFloat(weekChangePercent) < -5;

                  // Format: "value (change)" or just "value" if no change
                  const changeDisplay = weekChange !== 0 
                    ? ` (${weekChange > 0 ? "+" : ""}${weekChange})`
                    : "";

                  return (
                    <td
                      key={`${index}-week-${week.week}`}
                      className={`ledger-number ledger-week-value ${
                        isWeekIncrease
                          ? "ledger-increase"
                          : isWeekDecrease
                          ? "ledger-decrease"
                          : ""
                      }`}
                    >
                      {displayValue}{changeDisplay}
                    </td>
                  );
                });

                return (
                  <tr key={index} className="ledger-row">
                    <td className="ledger-item-name">{item.name}</td>
                    {weekCells}
                    <td
                      className={`ledger-number ledger-change ${
                        isSignificantIncrease
                          ? "ledger-increase"
                          : isSignificantDecrease
                          ? "ledger-decrease"
                          : ""
                      }`}
                    >
                      {item.netChange > 0 ? "+" : ""}
                      {Math.round(item.netChange)}
                    </td>
                    <td
                      className={`ledger-number ledger-percent ${
                        isSignificantIncrease
                          ? "ledger-increase"
                          : isSignificantDecrease
                          ? "ledger-decrease"
                          : ""
                      }`}
                    >
                      {netChangePercent > 0 ? "+" : ""}
                      {netChangePercent.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {hasCostData && renderMoneyProfitTable(items, weeks)}
      </div>
    );
  };

  // Render money/profit analysis table
  const renderMoneyProfitTable = (items, weeks) => {
    // Build table headers dynamically based on number of weeks
    const weekHeaders = weeks.map((w) => (
      <th key={`money-week-${w.week}`} className="ledger-col-number">
        Week {w.week}
      </th>
    ));

    return (
      <div className="money-profit-analysis">
        <div className="ledger-header" style={{ marginTop: "30px" }}>
          <h4>Financial Analysis - Cost & Profit</h4>
        </div>
        <div className="ledger-table-container">
          <table className="ledger-table">
            <thead>
              <tr>
                <th className="ledger-col-item">Item</th>
                <th className="ledger-col-item">Supplier</th>
                <th className="ledger-col-number">Cost Per Item</th>
                {weekHeaders}
                <th className="ledger-col-number">Profit</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                // Get cost per item from the analysis (use first available week's cost per unit)
                // This ensures it matches the text summary
                const displayCostPerItem = item.weeks.find((w) => w.costPerUnit > 0)?.costPerUnit || 0;

                // Calculate total profit: sum of (quantity * cost per item) across all weeks
                // Or if totalCost represents something else, we can adjust
                // For now, calculating profit as total cost across weeks
                const totalQuantity = item.weeks.reduce((sum, w) => sum + w.quantityUsed, 0);
                const totalProfit = item.weeks.reduce((sum, w) => {
                  // If we have cost per item, calculate profit as totalCost - (quantity * cost per item)
                  // Otherwise, just use totalCost
                  if (displayCostPerItem > 0) {
                    return sum + (w.totalCost || 0) - (w.quantityUsed * displayCostPerItem);
                  }
                  return sum + (w.totalCost || 0);
                }, 0);

                const isProfitPositive = totalProfit > 0;
                const isProfitNegative = totalProfit < 0;

                // Build week cells for money
                const weekCells = weeks.map((week) => {
                  const weekItem = item.weeks.find((w) => w.week === week.week);
                  if (!weekItem || weekItem.totalCost === 0) {
                    return (
                      <td key={`${index}-money-week-${week.week}`} className="ledger-number">
                        -
                      </td>
                    );
                  }

                  // Calculate week-to-week money change
                  const prevWeek = item.weeks.find((w) => w.week === week.week - 1);
                  let moneyChange = 0;
                  let displayValue = weekItem.totalCost;

                  if (prevWeek && prevWeek.totalCost > 0) {
                    // Change from previous week's total cost to current week's total cost
                    moneyChange = weekItem.totalCost - prevWeek.totalCost;
                  } else {
                    // First week - no change to show
                    moneyChange = 0;
                  }

                  // Format: "value (change)" or just "value" if no change
                  // Show decimals for money values
                  const changeDisplay = Math.abs(moneyChange) > 0.01 
                    ? ` (${moneyChange > 0 ? "+" : ""}$${Math.abs(moneyChange).toFixed(2)})`
                    : "";

                  const isMoneyIncrease = moneyChange > 0;
                  const isMoneyDecrease = moneyChange < 0;

                  return (
                    <td
                      key={`${index}-money-week-${week.week}`}
                      className={`ledger-number ledger-week-value ${
                        isMoneyIncrease
                          ? "ledger-increase"
                          : isMoneyDecrease
                          ? "ledger-decrease"
                          : ""
                      }`}
                    >
                      ${displayValue.toFixed(2)}{changeDisplay}
                    </td>
                  );
                });

                return (
                  <tr key={`money-${index}`} className="ledger-row">
                    <td className="ledger-item-name">{item.name}</td>
                    <td className="ledger-item-name">{item.vendor || "-"}</td>
                    <td className="ledger-number">
                      {displayCostPerItem > 0 ? `$${displayCostPerItem.toFixed(2)}` : "-"}
                    </td>
                    {weekCells}
                    <td
                      className={`ledger-number ledger-profit ${
                        isProfitPositive
                          ? "ledger-increase"
                          : isProfitNegative
                          ? "ledger-decrease"
                          : ""
                      }`}
                    >
                      ${totalProfit.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
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
    // ** ADDED: Get the analysis for the selected file
    const selectedAnalysis = analysisResults[selectedFileIndex] || null;

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
                <h3> Future Receipt Analysis </h3>
              </div>
              <div className="result-content">
                {uploadedFiles.length > 0 ? (
                  renderNumericalAnalysis()
                ) : (
                  <p className="result-placeholder">
                    Upload files to see weekly change analysis...
                  </p>
                )}
              </div>
            </div>
            {/* ** MODIFIED: Popo's Receipt Summary Window ** */}
            <div className="result-window result-window-lower">
              <div className="panel-header">
                <h3> Popo's Receipt Summary</h3>
              </div>
              <div className="result-content">
                {selectedAnalysis ? (
                  selectedAnalysis.analysis ? (
                    <div className="analysis-text">
                      {selectedAnalysis.analysis}
                    </div>
                  ) : selectedAnalysis.error ? (
                    <div className="analysis-error" style={{ margin: 20 }}>
                      <p><strong>Analysis Error:</strong></p>
                      <p>{selectedAnalysis.error}</p>
                    </div>
                  ) : (
                    <p className="result-placeholder">
                      Analysis is pending or not available for this file.
                    </p>
                  )
                ) : uploadedFiles.length > 0 ? (
                  <p className="result-placeholder">
                    Select a file to see its analysis.
                  </p>
                ) : (
                  <p className="result-placeholder">
                    Additional results will appear here...
                  </p>
                )}
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
