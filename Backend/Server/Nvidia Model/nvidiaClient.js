// nvidiaClient.js
import { OpenAI } from "openai";

export const nvidia = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,   // recommended: use env variable
  baseURL: "https://integrate.api.nvidia.com/v1",
});
