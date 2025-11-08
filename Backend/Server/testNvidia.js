import "dotenv/config";
import { sendNemotronMessage } from "./Nvidia Model/nemotron.js";

async function test() {
  console.log("Testing NVIDIA model…");

  const stream = await sendNemotronMessage("what is today?");

  let output = "";
  for await (const chunk of stream) {
    output += chunk.choices?.[0]?.delta?.content || "";
  }

  console.log("MODEL REPLY:");
  console.log(output);
}

test();
