import "dotenv/config";
import express from "express";
import { OpenAI } from "openai";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import fs from "fs";
import mimeTypes from "mime-types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Enhanced CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, "Uploads");
    // Ensure Uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    // Sanitize filename to avoid issues with special characters
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + sanitizedName);
  },
});

// Configure multer to accept all file types
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

const client = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: "https://integrate.api.nvidia.com/v1",
});

// File upload endpoint with multer error handling
app.post("/api/upload", (req, res, next) => {
  upload.array("files")(req, res, (err) => {
    if (err) {
      console.error("Multer error:", err);
      return res.status(400).json({ 
        error: "File upload error",
        details: err.message 
      });
    }
    
    try {
      console.log("Upload request received");
      console.log("Files:", req.files);
      console.log("Body:", req.body);
      
      if (!req.files || req.files.length === 0) {
        console.error("No files in request");
        return res.status(400).json({ error: "No files uploaded" });
      }

      const uploadedFiles = req.files.map((file) => ({
        filename: file.filename,
        originalName: file.originalname,
        path: file.path,
        size: file.size,
        mimetype: file.mimetype,
      }));

      console.log("Files uploaded successfully:", uploadedFiles);
      res.json({
        message: "Files uploaded successfully",
        files: uploadedFiles,
      });
    } catch (err) {
      console.error("Upload error:", err);
      console.error("Error stack:", err.stack);
      res.status(500).json({ 
        error: "File upload failed",
        details: err.message 
      });
    }
  });
});

// API endpoint to process files with NVIDIA AI model
app.post("/api/process-files", async (req, res) => {
  const { filePaths, message } = req.body;

  try {
    if (!filePaths || filePaths.length === 0) {
      return res.status(400).json({ error: "No file paths provided" });
    }

    // Read files and convert to base64 for NVIDIA API
    const fileContents = await Promise.all(
      filePaths.map(async (filePath) => {
        const fullPath = path.isAbsolute(filePath) 
          ? filePath 
          : path.join(__dirname, "Uploads", filePath);
        
        if (!fs.existsSync(fullPath)) {
          throw new Error(`File not found: ${fullPath}`);
        }

        const fileBuffer = fs.readFileSync(fullPath);
        const base64 = fileBuffer.toString("base64");
        const mimeType = mimeTypes.lookup(fullPath) || "application/octet-stream";

        return {
          type: "image_url",
          image_url: {
            url: `data:${mimeType};base64,${base64}`,
          },
        };
      })
    );

    // Prepare messages for NVIDIA API
    const userMessage = {
      role: "user",
      content: [
        ...fileContents,
        { type: "text", text: message || "What is in these images?" },
      ],
    };

    const completion = await client.chat.completions.create({
      model: "nvidia/llama-3.1-nemotron-nano-vl-8b-v1",
      messages: [userMessage],
      max_tokens: 1024,
    });

    res.json({ reply: completion.choices[0].message.content });
  } catch (err) {
    console.error("Processing error:", err);
    res.status(500).json({ error: "Failed to process files with AI model" });
  }
});

// API endpoint for your React app
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;

  try {
    const completion = await client.chat.completions.create({
      model: "nvidia/llama-3.1-nemotron-nano-vl-8b-v1",
      messages: [{ role: "user", content: message }],
      max_tokens: 256
    });

    res.json({ reply: completion.choices[0].message.content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Model error" });
  }
});

app.listen(3001, () => console.log("Backend running on port 3001"));
