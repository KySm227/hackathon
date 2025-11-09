// models/nemotron.js
import { nvidia } from "../nvidiaClient.js";

/**
 * Sends a message to NVIDIA Nemotron model
 * @param {string} userText - The text prompt/question
 * @param {Object} fileData - Optional file data to analyze
 * @param {string} fileData.content - Base64 encoded image or text content
 * @param {string} fileData.mimeType - MIME type of the file
 * @param {boolean} fileData.isImage - Whether the file is an image
 * @returns {Promise} - Streaming completion response
 */
export async function sendNemotronMessage(userText, fileData = null) {
  let messageContent;
  
  // If file data is provided, format it for the vision model
  if (fileData && fileData.isImage) {
    // For images, use the vision format with base64
    messageContent = [
      {
        type: "image_url",
        image_url: {
          url: `data:${fileData.mimeType};base64,${fileData.content}`
        }
      },
      {
        type: "text",
        text: userText
      }
    ];
  } else if (fileData && fileData.text) {
    // For text files, include the text content in the prompt
    messageContent = `${userText}\n\nFile content:\n${fileData.text}`;
  } else {
    // Just text message
    messageContent = userText;
  }
  
  const completion = await nvidia.chat.completions.create({
    model: "nvidia/llama-3.1-nemotron-nano-vl-8b-v1",
    messages: [{ role: "user", content: messageContent }],
    temperature: 1.0,
    top_p: 0.01,
    max_tokens: 1024,
    stream: true,
  });

  return completion;
}
