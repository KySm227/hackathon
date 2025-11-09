import "dotenv/config";
import { sendNemotronMessage } from "./Nvidia Model/nemotron.js";
import { readFileForNvidia } from "./utils/fileReader.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function test() {
  console.log("Testing NVIDIA model with file…");

  // Example: Read an uploaded file from the uploads directory
  // Replace 'your-uploaded-file.jpg' with the actual filename
  const uploadsDir = path.join(__dirname, "uploads");
  
  // Get the first file from uploads directory (or specify a filename)
  // You can modify this to use a specific file path
  const filePath = process.argv[2]; // Get file path from command line argument
  
  if (filePath) {
    try {
      // Read the file and convert it to a variable
      const fileData = await readFileForNvidia(filePath);
      console.log(`File loaded: ${fileData.isImage ? 'Image' : 'Text file'}`);
      console.log(`MIME type: ${fileData.mimeType}`);
      
      // Send the file to NVIDIA model for analysis
      const prompt = fileData.isImage 
        ? "What do you see in this image? Describe it in detail."
        : "Analyze this file content and provide a summary.";
      
      const stream = await sendNemotronMessage(prompt, fileData);

      let output = "";
      for await (const chunk of stream) {
        output += chunk.choices?.[0]?.delta?.content || "";
      }

      console.log("\nMODEL REPLY:");
      console.log(output);
    } catch (error) {
      console.error("Error:", error.message);
      console.log("\nUsage: node testNvidia.js <path-to-file>");
      console.log("Example: node testNvidia.js uploads/my-image.jpg");
    }
  } else {
    // Test without file
    console.log("No file provided. Testing with text only...");
    const stream = await sendNemotronMessage("what is today?");

    let output = "";
    for await (const chunk of stream) {
      output += chunk.choices?.[0]?.delta?.content || "";
    }

    console.log("\nMODEL REPLY:");
    console.log(output);
    console.log("\nTo test with a file, provide the file path:");
    console.log("Example: node testNvidia.js uploads/my-image.jpg");
  }
}

test();
