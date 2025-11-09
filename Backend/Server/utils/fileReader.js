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
      '.pdf': 'application/pdf',
    };
    
    const mimeType = mimeTypes[ext] || 'text/plain';
    let content;
    let text;
    
    // Handle text and CSV files
    if (ext === '.txt' || ext === '.csv') {
      // For text and CSV files, read as UTF-8
      content = fileBuffer.toString('utf-8');
      text = content;
    } else if (ext === '.pdf') {
      // PDFs are accepted but not parsed - return error
      throw new Error(`PDF files are accepted but cannot be parsed. Only .txt and .csv files can be analyzed.`);
    } else {
      throw new Error(`Unsupported file type: ${ext}. Only .txt, .csv, and .pdf are supported.`);
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

