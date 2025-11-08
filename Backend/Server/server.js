import "dotenv/config";
import express from "express";
import { OpenAI } from "openai";

const app = express();
app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: "https://integrate.api.nvidia.com/v1",
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
