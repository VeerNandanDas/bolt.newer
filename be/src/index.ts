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
const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) {
  console.warn("GOOGLE_API_KEY not found in environment variables. Using mock responses.");
}
const client = apiKey ? new GoogleGenerativeAI(apiKey) : null;

app.post("/template", async (req, res) => {
  const prompt: string = req.body.prompt;

  try {
    // If no API key, return mock response for React
    if (!client) {
      console.log("Using mock response for template endpoint");
      res.json({
        prompts: [
          BASE_PROMPT,
          `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`,
        ],
        uiPrompts: [reactBasePrompt],
      });
      return;
    }

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
    // If no API key, return mock response
    if (!client) {
      console.log("Using mock response for chat endpoint");
      const mockResponse = `<boltArtifact id="todo-app" title="Todo App">
  <boltAction type="file" filePath="src/App.tsx">
import React, { useState } from 'react';
import './App.css';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputValue, setInputValue] = useState('');

  const addTodo = () => {
    if (inputValue.trim() !== '') {
      const newTodo: Todo = {
        id: Date.now(),
        text: inputValue,
        completed: false
      };
      setTodos([...todos, newTodo]);
      setInputValue('');
    }
  };

  const toggleTodo = (id: number) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id: number) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  return (
    <div className="App">
      <h1>Todo App</h1>
      <div className="todo-input">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Add a new todo..."
          onKeyPress={(e) => e.key === 'Enter' && addTodo()}
        />
        <button onClick={addTodo}>Add</button>
      </div>
      <ul className="todo-list">
        {todos.map(todo => (
          <li key={todo.id} className={todo.completed ? 'completed' : ''}>
            <span onClick={() => toggleTodo(todo.id)}>
              {todo.text}
            </span>
            <button onClick={() => deleteTodo(todo.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
  </boltAction>
  <boltAction type="file" filePath="src/App.css">
.App {
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

h1 {
  color: #333;
  margin-bottom: 30px;
}

.todo-input {
  margin-bottom: 20px;
}

.todo-input input {
  padding: 10px;
  width: 300px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-right: 10px;
}

.todo-input button {
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.todo-input button:hover {
  background-color: #0056b3;
}

.todo-list {
  list-style: none;
  padding: 0;
}

.todo-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  margin: 5px 0;
  background-color: #f9f9f9;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.todo-list li.completed {
  text-decoration: line-through;
  opacity: 0.6;
}

.todo-list li span {
  cursor: pointer;
  flex-grow: 1;
  text-align: left;
}

.todo-list li button {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
}

.todo-list li button:hover {
  background-color: #c82333;
}
  </boltAction>
  <boltAction type="file" filePath="src/index.tsx">
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
  </boltAction>
  <boltAction type="file" filePath="package.json">
{
  "name": "todo-app",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "@types/node": "^16.18.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "typescript": "^4.9.0",
    "web-vitals": "^2.1.0"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}
  </boltAction>
</boltArtifact>`;
      
      res.json({
        response: mockResponse,
      });
      return;
    }

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
