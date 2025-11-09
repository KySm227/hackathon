import "dotenv/config";
import express from "express";
import { OpenAI } from "openai";
import multer from "multer";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { readFileForNvidia, splitFileByDays } from "./utils/fileReader.js";
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

// The specific prompt for the AI model
const ANALYSIS_PROMPT = `You are an intelligent financial and inventory assistant specializing in business expense analysis. Your task is to analyze raw receipt data, filter out non-essential personal items, and track only the most important groceries or operating expenses relevant to the stated business type.

Business Context: Infer the business type (e.g., restaurant, office, retail) from the receipt items. This context is critical for assigning the priority of items (e.g., fresh produce is high priority for a cafe; printer ink is high priority for an office).

Your final output MUST strictly adhere to the following two-part format:

### 1. Summary of Changes and Business Focus

* Provide a **very short, one-to-two-sentence summary** of your analysis.
* State the inferred **type of business** this receipt likely pertains to.
* Briefly mention the **key items prioritized** and the general category of items filtered out (e.g., "The focus was placed on fresh ingredients and essential dry goods, filtering out personal snacks and non-business consumables.").

---

### 2. Prioritized Essential Expense List

* Create a detailed, ordered list of **only the items deemed necessary and relevant** for the continued operation of the business.
* **Priority Level:** Assign the most critical, high-impact, and/or perishable items the lowest number (starting with **1**). Assign lower-priority, non-perishable, or less-frequently-needed items higher numbers.
*  To find the cost per unit of an item, search the internet and find the average cost for similar items in the same category.
* To find the recommended restock, take how frequent the idem is used and determine how much the company should restock.
* To find the total cost, multiply the cost per unit by the recommended restock amount.
* To find the total quantity/unit used, sum up the quantity/unit used for each day.
* Remove unecessary characters and make the table look sleek
* The list must be presented as a clear Markdown table using the following seven columns:

| Priority | Item Description | Total Quantity/Unit Used | Cost per Unit | Recommended Restock | Total Cost | Notes (Business Justification) |
| :---: | :--- | :--- | :--- | :--- | :---
| 1 | [Highest Priority Item] | [Amount used] | [Cost per unit] | [Recommended Restock] | [Total Cost] | [Brief reason for high priority, e.g., "Core menu item," "Perishable," "Needed immediately"] |
| 2 | [Next Item] | [Amount used] | [Cost per unit] | [Recommended Restock] | [Total Cost] | [Justification] |
| ... | ... | ... | ... | ... | ...|`;

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
        message: `Rejected ${invalidFiles.length} file(s): ${invalidFiles.join(
          ", "
        )}`,
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
        // Try to split file by days - if file contains multiple days, process each separately
        const daySections = await splitFileByDays(file.path);
        console.log(`File ${file.originalname} split into ${daySections.length} day(s)`);

        // Process each day section separately
        for (const daySection of daySections) {
          try {
            // Create file data object for this day section
            const fileData = {
              content: daySection.content,
              mimeType: path.extname(file.originalname).toLowerCase() === '.csv' ? 'text/csv' : 'text/plain',
              isImage: false,
              text: daySection.content,
            };

            console.log(`Processing ${daySection.dayLabel} from file: ${file.originalname}`);

            // **MODIFIED: Use the detailed analysis prompt**
            const prompt = ANALYSIS_PROMPT;

            // Send the day section to NVIDIA model for analysis
            const stream = await sendNemotronMessage(prompt, fileData);

            // Collect the streaming response
            let output = "";
            for await (const chunk of stream) {
              const content = chunk.choices?.[0]?.delta?.content || "";
              output += content;
            }

            console.log(
              `Analysis output length: ${output.length} for ${daySection.dayLabel} from ${file.originalname}`
            );
            console.log(`Analysis preview: ${output.substring(0, 100)}...`);

            // Create a unique identifier for this day section
            const dayIdentifier = daySections.length > 1 
              ? `${file.originalname} - ${daySection.dayLabel}`
              : file.originalname;

            analysisResults.push({
              filename: file.filename,
              originalName: dayIdentifier,
              analysis: output || "No analysis generated",
              fileType: "text",
              mimeType: fileData.mimeType,
              dayIndex: daySection.dayIndex,
              dayLabel: daySection.dayLabel,
            });

            console.log(`Analysis completed for: ${daySection.dayLabel} from ${file.originalname}`);
          } catch (dayAnalysisError) {
            console.error(
              `Error analyzing ${daySection.dayLabel} from ${file.originalname}:`,
              dayAnalysisError
            );
            analysisResults.push({
              filename: file.filename,
              originalName: `${file.originalname} - ${daySection.dayLabel}`,
              analysis: null,
              error: dayAnalysisError.message,
              dayIndex: daySection.dayIndex,
              dayLabel: daySection.dayLabel,
            });
          }
        }
      } catch (fileError) {
        console.error(
          `Error processing file ${file.originalname}:`,
          fileError
        );
        analysisResults.push({
          filename: file.filename,
          originalName: file.originalname,
          analysis: null,
          error: fileError.message,
        });
      }
    }

    // Note: analysisResults.length may be greater than uploadedFiles.length
    // if files contain multiple days (each day becomes a separate analysis)
    console.log(
      `Processed ${uploadedFiles.length} file(s) into ${analysisResults.length} analysis result(s)`
    );

    console.log(
      `Sending response with ${uploadedFiles.length} files and ${analysisResults.length} analyses`
    );
    console.log(
      "Analysis results being sent:",
      analysisResults.map((a) => ({
        originalName: a.originalName,
        hasAnalysis: !!a.analysis,
        analysisLength: a.analysis?.length || 0,
        error: a.error,
      }))
    );

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
        analyses: uploadedFiles.map((file) => ({
          filename: file.filename,
          originalName: file.originalName,
          analysis: null,
          error: err.message,
        })),
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

app.listen(3001, () => console.log("Backend running on port 3001"));
