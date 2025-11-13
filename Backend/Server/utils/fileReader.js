// utils/fileReader.js
import fs from "fs";
import path from "path";

/**
 * Reads a file and converts it to text content
 * @param {string} filePath - Path to the file
 * @returns {Promise<{content: string, mimeType: string, isImage: boolean, text: string}>}
 */
export async function readFileForNvidia(filePath) {
  try {
    const ext = path.extname(filePath).toLowerCase();
    const fileBuffer = fs.readFileSync(filePath);
    
    // Determine MIME type based on file extension
    const mimeTypes = {
      '.txt': 'text/plain',
      '.csv': 'text/csv',
    };
    
    const mimeType = mimeTypes[ext] || 'text/plain';
    let content;
    let text;
    
    // Handle text and CSV files
    if (ext === '.txt' || ext === '.csv') {
      // For text and CSV files, read as UTF-8
      content = fileBuffer.toString('utf-8');
      text = content;
    } else {
      throw new Error(`Unsupported file type: ${ext}. Only .txt and .csv are supported.`);
    }
    
    return {
      content,
      mimeType,
      isImage: false,
      text: text,
    };
  } catch (error) {
    throw new Error(`Failed to read file: ${error.message}`);
  }
}

/**
 * Splits file content by day/period if it contains multiple days
 * @param {string} filePath - Path to the file
 * @returns {Promise<Array<{content: string, dayIndex: number, dayLabel: string}>>}
 */
export async function splitFileByDays(filePath) {
  try {
    const ext = path.extname(filePath).toLowerCase();
    const fileBuffer = fs.readFileSync(filePath);
    const content = fileBuffer.toString('utf-8');
    const lines = content.split('\n');
    
    const daySections = [];
    let currentDay = null;
    let currentDayLines = [];
    let dayIndex = 0;
    
    // Patterns to detect day separators
    const dayPatterns = [
      /^day\s*(\d+)/i,
      /^day\s*(\d+):/i,
      /^(\d+)\s*day/i,
      /date.*?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
      /^(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    ];
    
    // For CSV files, check if there's a date column
    if (ext === '.csv' && lines.length > 0) {
      const headerLine = lines[0];
      // Parse header to handle quoted values
      const headerValues = headerLine.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g) || [];
      const headerLower = headerValues.map(h => h.replace(/^"|"$/g, '').toLowerCase());
      
      // Find date column index
      const dateColumnIndex = headerLower.findIndex(col => 
        col.includes('date') || col.includes('day') || col.includes('time')
      );
      
      if (dateColumnIndex >= 0) {
        // Group rows by date
        const dateGroups = new Map();
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          // Parse CSV line to handle quoted values
          const values = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g) || [];
          if (values.length > dateColumnIndex) {
            const dateValue = values[dateColumnIndex].replace(/^"|"$/g, '').trim();
            // Normalize date value (remove time if present)
            const normalizedDate = dateValue.split(/\s+/)[0]; // Take first part (date without time)
            
            if (!dateGroups.has(normalizedDate)) {
              dateGroups.set(normalizedDate, []);
            }
            dateGroups.get(normalizedDate).push(line);
          }
        }
        
        // Create sections for each unique date (sorted by date)
        const sortedDates = Array.from(dateGroups.keys()).sort();
        sortedDates.forEach((date, index) => {
          const rows = dateGroups.get(date);
          daySections.push({
            content: headerLine + '\n' + rows.join('\n'),
            dayIndex: index + 1,
            dayLabel: `Day ${index + 1} (${date})`,
          });
        });
        
        // If we found multiple days, return them
        if (daySections.length > 1) {
          return daySections;
        }
      }
    }
    
    // For text files or CSV without date column, look for day headers
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check if this line is a day header
      let isDayHeader = false;
      for (const pattern of dayPatterns) {
        const match = line.match(pattern);
        if (match) {
          isDayHeader = true;
          // Save previous day if exists
          if (currentDay !== null && currentDayLines.length > 0) {
            daySections.push({
              content: currentDayLines.join('\n'),
              dayIndex: currentDay,
              dayLabel: `Day ${currentDay}`,
            });
          }
          // Start new day
          currentDay = currentDay + 1 || 1;
          currentDayLines = [line]; // Include the header line
          break;
        }
      }
      
      if (!isDayHeader) {
        if (currentDay !== null) {
          currentDayLines.push(line);
        } else {
          // No day header found yet, add to first day
          if (currentDayLines.length === 0) {
            currentDay = 1;
          }
          currentDayLines.push(line);
        }
      }
    }
    
    // Add the last day
    if (currentDay !== null && currentDayLines.length > 0) {
      daySections.push({
        content: currentDayLines.join('\n'),
        dayIndex: currentDay,
        dayLabel: `Day ${currentDay}`,
      });
    }
    
    // If we found multiple days, return them; otherwise return single section
    if (daySections.length > 1) {
      return daySections;
    } else {
      // Single day or no day separation found
      return [{
        content: content,
        dayIndex: 1,
        dayLabel: 'Day 1',
      }];
    }
  } catch (error) {
    throw new Error(`Failed to split file by days: ${error.message}`);
  }
}

