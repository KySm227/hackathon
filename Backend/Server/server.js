import "dotenv/config";
import express from "express";
import { OpenAI } from "openai";
import multer from "multer";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

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

// File upload endpoint
app.post("/api/upload", upload.array("files"), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const uploadedFiles = req.files.map((file) => ({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      path: file.path,
    }));

    console.log(`Successfully uploaded ${uploadedFiles.length} file(s)`);
    res.json({
      message: "Files uploaded successfully",
      files: uploadedFiles,
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "File upload failed" });
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

app.listen(3000, () => console.log("Backend running on port 3001"));
