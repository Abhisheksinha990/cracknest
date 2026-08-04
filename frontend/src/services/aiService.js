import { GoogleGenerativeAI } from '@google/generative-ai';

const MODEL_CANDIDATES = [
  'gemini-flash-latest',
  'gemma-4-26b-a4b-it',
  'gemma-4-31b-it',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash-001'
];

export const getActiveApiKey = () => {
  const customKey = localStorage.getItem('user_gemini_api_key');
  if (customKey && customKey.trim().length > 10) {
    return customKey.trim();
  }
  return import.meta.env.VITE_GEMINI_API_KEY || "";
};

export const setCustomApiKey = (key) => {
  if (key && key.trim()) {
    localStorage.setItem('user_gemini_api_key', key.trim());
  } else {
    localStorage.removeItem('user_gemini_api_key');
  }
};

/**
 * Execute generateContent with automatic model fallback across candidate models
 */
export const generateAIContent = async ({ prompt, filePart, systemInstruction }) => {
  const apiKey = getActiveApiKey();
  if (!apiKey) {
    throw new Error("No Gemini API key found. Please configure VITE_GEMINI_API_KEY or enter your custom API key in settings.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  let lastError = null;

  for (const modelName of MODEL_CANDIDATES) {
    try {
      const modelOptions = { model: modelName };
      if (systemInstruction) {
        modelOptions.systemInstruction = systemInstruction;
      }

      const model = genAI.getGenerativeModel(modelOptions);
      const contents = filePart ? [prompt, filePart] : prompt;

      const result = await model.generateContent(contents);
      const responseText = result.response.text();

      if (responseText && responseText.trim()) {
        return {
          text: responseText,
          modelUsed: modelName
        };
      }
    } catch (err) {
      console.warn(`[AI Service] Model ${modelName} failed:`, err.status || err.message);
      lastError = err;
      // Continue to next model candidate in case of 404, 429, or model unavailable
    }
  }

  throw lastError || new Error("All AI model requests failed. Please check your API key or network connection.");
};

/**
 * Generate clean structured JSON output from AI with fallback
 */
export const generateAIJSON = async ({ prompt, filePart, systemInstruction }) => {
  const jsonSystemPrompt = (systemInstruction || "") + `\n\nCRITICAL OUTPUT REQUIREMENT:\nYou MUST return EXACTLY ONE valid JSON object. Do NOT wrap in markdown, do NOT include backticks (\`\`\`json), and do NOT include any introductory or concluding conversational text.`;
  
  const response = await generateAIContent({
    prompt,
    filePart,
    systemInstruction: jsonSystemPrompt
  });

  let raw = response.text;
  // Clean markdown backticks and json markers
  let cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();

  // Handle potential thinking trace or pre-text
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(cleaned);
  } catch (parseErr) {
    console.error("[AI Service] JSON Parse error. Raw response:", raw);
    throw new Error("Failed to parse structured response from AI model.");
  }
};

/**
 * Robust chat session wrapper with model fallback
 */
export class RobustAIChatSession {
  constructor({ systemInstruction, history = [] }) {
    this.systemInstruction = systemInstruction;
    this.history = history;
    this.activeChat = null;
    this.activeModelName = null;
  }

  async init() {
    const apiKey = getActiveApiKey();
    if (!apiKey) {
      throw new Error("No Gemini API key found.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    let lastError = null;

    for (const modelName of MODEL_CANDIDATES) {
      try {
        const modelOptions = { model: modelName };
        if (this.systemInstruction) {
          modelOptions.systemInstruction = this.systemInstruction;
        }

        const model = genAI.getGenerativeModel(modelOptions);
        const chat = model.startChat({
          history: this.history,
          generationConfig: { maxOutputTokens: 1500 }
        });

        this.activeChat = chat;
        this.activeModelName = modelName;
        return;
      } catch (err) {
        console.warn(`[AI Chat] Failed to start chat with model ${modelName}:`, err.message);
        lastError = err;
      }
    }

    throw lastError || new Error("Failed to initialize AI Chat Session.");
  }

  async sendMessage(message) {
    if (!this.activeChat) {
      await this.init();
    }

    try {
      const result = await this.activeChat.sendMessage(message);
      return result.response.text();
    } catch (err) {
      console.warn(`[AI Chat] Error on model ${this.activeModelName}, attempting re-init...`, err.message);
      // Re-init with next candidate
      await this.init();
      const result = await this.activeChat.sendMessage(message);
      return result.response.text();
    }
  }
}
