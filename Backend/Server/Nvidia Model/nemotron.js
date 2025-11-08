// models/nemotron.js
import { nvidia } from "../nvidiaClient.js";

export async function sendNemotronMessage(userText) {
  const completion = await nvidia.chat.completions.create({
    model: "nvidia/llama-3.1-nemotron-nano-vl-8b-v1",
    messages: [{ role: "user", content: userText }],
    temperature: 1.0,
    top_p: 0.01,
    max_tokens: 1024,
    stream: true,
    
  });

  return completion;
}
