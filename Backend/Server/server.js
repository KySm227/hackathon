import "dotenv/config";
import express from "express";
import { OpenAI } from "openai";
import multer from "multer";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { readFileForNvidia } from "./utils/fileReader.js";
import { sendNemotronMessage } from "./Nvidia Model/nemotron.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Preserve original filename with timestamp to avoid conflicts
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({ storage: storage });

const client = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: "https://integrate.api.nvidia.com/v1",
});

// File upload endpoint - automatically sends files to NVIDIA for analysis
app.post("/api/upload", upload.array("files"), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    // Validate file types - only accept .txt or .csv
    const allowedExtensions = ['.txt', '.csv'];
    const invalidFiles = [];
    const validFiles = [];

    for (const file of req.files) {
      const ext = path.extname(file.originalname).toLowerCase();
      if (allowedExtensions.includes(ext)) {
        validFiles.push(file);
      } else {
        invalidFiles.push(file.originalname);
        // Delete invalid file
        try {
          fs.unlinkSync(file.path);
        } catch (err) {
          console.error(`Failed to delete invalid file ${file.path}:`, err);
        }
      }
    }

    if (invalidFiles.length > 0) {
      return res.status(400).json({ 
        error: `Invalid file types. Only .txt and .csv files are accepted.`,
        invalidFiles: invalidFiles,
        message: `Rejected ${invalidFiles.length} file(s): ${invalidFiles.join(', ')}`
      });
    }

    if (validFiles.length === 0) {
      return res.status(400).json({ error: "No valid files uploaded. Only .txt and .csv files are accepted." });
    }

    const uploadedFiles = validFiles.map((file) => ({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      path: file.path,
    }));

    console.log(`Successfully uploaded ${uploadedFiles.length} valid file(s)`);
    
    // Process each file and send to NVIDIA model
    const analysisResults = [];
    
    for (const file of validFiles) {
      try {
        // Read the uploaded file and convert it to a variable
        const fileData = await readFileForNvidia(file.path);
        console.log(`Processing file: ${file.originalname} (Text file)`);
        
        // Create prompt for text file analysis
        const prompt = "Analyze this file content and provide a summary.";
        
        // Send the fileData to NVIDIA model for analysis
        const stream = await sendNemotronMessage(prompt, fileData);
        
        // Collect the streaming response
        let output = "";
        for await (const chunk of stream) {
          const content = chunk.choices?.[0]?.delta?.content || "";
          output += content;
        }
        
        console.log(`Analysis output length: ${output.length} for ${file.originalname}`);
        console.log(`Analysis preview: ${output.substring(0, 100)}...`);
        
        analysisResults.push({
          filename: file.filename,
          originalName: file.originalname,
          analysis: output || "No analysis generated",
          fileType: "text",
          mimeType: fileData.mimeType,
        });
        
        console.log(`Analysis completed for: ${file.originalname}`);
      } catch (analysisError) {
        console.error(`Error analyzing file ${file.originalname}:`, analysisError);
        analysisResults.push({
          filename: file.filename,
          originalName: file.originalname,
          analysis: null,
          error: analysisError.message,
        });
      }
    }
    
    // Ensure we have analysis results for all files
    if (analysisResults.length !== uploadedFiles.length) {
      console.warn(`Mismatch: ${uploadedFiles.length} files but ${analysisResults.length} analyses`);
      // Add placeholder analyses for missing ones
      for (let i = analysisResults.length; i < uploadedFiles.length; i++) {
        analysisResults.push({
          filename: uploadedFiles[i].filename,
          originalName: uploadedFiles[i].originalName,
          analysis: null,
          error: "Analysis failed or was not completed",
        });
      }
    }
    
    console.log(`Sending response with ${uploadedFiles.length} files and ${analysisResults.length} analyses`);
    console.log("Analysis results being sent:", analysisResults.map(a => ({
      originalName: a.originalName,
      hasAnalysis: !!a.analysis,
      analysisLength: a.analysis?.length || 0,
      error: a.error
    })));
    
    // Always send analyses array, even if empty
    res.json({
      message: "Files uploaded successfully and analyzed",
      files: uploadedFiles,
      analyses: analysisResults.length > 0 ? analysisResults : [],
    });
  } catch (err) {
    console.error("Upload error:", err);
    console.error("Error stack:", err.stack);
    // Even on error, try to send what we have
    if (req.files && req.files.length > 0) {
      const uploadedFiles = req.files.map((file) => ({
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        path: file.path,
      }));
      
      res.status(500).json({ 
        error: "File upload failed: " + err.message,
        files: uploadedFiles,
        analyses: uploadedFiles.map(file => ({
          filename: file.filename,
          originalName: file.originalName,
          analysis: null,
          error: err.message,
        }))
      });
    } else {
      res.status(500).json({ error: "File upload failed: " + err.message });
    }
  }
});

// API endpoint for your React app
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;

  try {
    const completion = await client.chat.completions.create({
      model: "nvidia/llama-3.1-nemotron-nano-vl-8b-v1",
      messages: [{ role: "user", content: message }],
      max_tokens: 256,
    });

    res.json({ reply: completion.choices[0].message.content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Model error" });
  }
});

// API endpoint to analyze an uploaded file with NVIDIA model
app.post("/api/analyze-file", async (req, res) => {
  const { filePath, prompt } = req.body;

  if (!filePath) {
    return res.status(400).json({ error: "File path is required" });
  }

  try {
    // Read the uploaded file and convert it to a variable
    const fileData = await readFileForNvidia(filePath);
    
    // Use the provided prompt or a default one
    const analysisPrompt = prompt || 
      (fileData.isImage 
        ? "What do you see in this image? Describe it in detail."
        : "If youre reading this, say whats in the file.");

    // Send the file to NVIDIA model for analysis
    const stream = await sendNemotronMessage(analysisPrompt, fileData);

    // Collect the streaming response
    let output = "";
    for await (const chunk of stream) {
      output += chunk.choices?.[0]?.delta?.content || "";
    }

    res.json({ 
      reply: output,
      fileType: fileData.isImage ? "image" : "text",
      mimeType: fileData.mimeType
    });
  } catch (err) {
    console.error("File analysis error:", err);
    res.status(500).json({ error: "File analysis failed: " + err.message });
  }
});

app.listen(3001, () => console.log("Backend running on port 3001"));
