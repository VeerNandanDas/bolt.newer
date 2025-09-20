require("dotenv").config();
import express from "express";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";

import { BASE_PROMPT, getSystemPrompt } from "./prompts";
import { basePrompt as nodeBasePrompt } from "./defaults/node";
import { basePrompt as reactBasePrompt } from "./defaults/react";

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Gemini client with your Google API Key from env
const client = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

app.post("/template", async (req, res) => {
  const prompt: string = req.body.prompt;

  try {
    // Create chat completion request to Gemini
    const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const result = await model.generateContent(
      `Return either node or react based on what do you think this project should be. Only return a single word either 'node' or 'react'. Do not return anything extra. User prompt: ${prompt}`
    );

    const answer = result.response.text().trim().toLowerCase();

    if (answer === "react") {
      res.json({
        prompts: [
          BASE_PROMPT,
          `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`,
        ],
        uiPrompts: [reactBasePrompt],
      });
      return;
    }

    if (answer === "node") {
      res.json({
        prompts: [
          `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${nodeBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`,
        ],
        uiPrompts: [nodeBasePrompt],
      });
      return;
    }

    res.status(403).json({ message: "You can't access this" });
  } catch (err) {
    console.error("Error in /template:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/chat", async (req, res) => {
  const messages: { role: string; content: string }[] = req.body.messages;

  try {
    // Transform incoming messages to Gemini format
    const model = client.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8000,
      }
    });

    // Combine system prompt with messages
    const systemPrompt = getSystemPrompt();
    const conversationHistory = messages.map((msg) => 
      `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`
    ).join("\n");

    const fullPrompt = `${systemPrompt}\n\nConversation:\n${conversationHistory}`;

    const result = await model.generateContent(fullPrompt);

    const response = result.response.text();

    res.json({
      response: response,
    });
  } catch (err) {
    console.error("Error in /chat:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
