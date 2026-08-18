import { GoogleGenerativeAI } from '@google/generative-ai';

const MODEL_CANDIDATES = [
  'gemini-1.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-pro',
  'gemini-flash-latest'
];

export const getActiveApiKey = () => {
  if (typeof localStorage !== 'undefined') {
    const customKey = localStorage.getItem('user_gemini_api_key');
    if (customKey && customKey.trim().length > 10) {
      return customKey.trim();
    }
  }
  return (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) || "";
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

      let formattedFilePart = null;
      if (filePart) {
        if (filePart.inlineData) {
          formattedFilePart = {
            inlineData: {
              data: filePart.inlineData.data,
              mimeType: filePart.inlineData.mimeType
            }
          };
        } else if (filePart.data && filePart.mimeType) {
          formattedFilePart = {
            inlineData: {
              data: filePart.data,
              mimeType: filePart.mimeType
            }
          };
        }
      }

      const contents = formattedFilePart ? [prompt, formattedFilePart] : prompt;

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
 * Robust chat session wrapper with automatic candidate model fallback & state preservation
 */
export class RobustAIChatSession {
  constructor({ systemInstruction, history = [] }) {
    this.systemInstruction = systemInstruction;
    this.history = [...history];
    this.currentCandidateIndex = 0;
    this.activeChat = null;
    this.activeModelName = null;
  }

  async init() {
    const apiKey = getActiveApiKey();
    if (!apiKey) {
      this.isOffline = true;
      return;
    }
    this.activeModelName = MODEL_CANDIDATES[this.currentCandidateIndex] || MODEL_CANDIDATES[0];
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const modelOptions = { model: this.activeModelName };
      if (this.systemInstruction) {
        modelOptions.systemInstruction = this.systemInstruction;
      }
      const model = genAI.getGenerativeModel(modelOptions);
      this.activeChat = model.startChat({
        history: this.history,
        generationConfig: { maxOutputTokens: 1500 }
      });
    } catch (e) {
      console.warn("[RobustAIChatSession] init warning:", e);
    }
  }

  async sendMessage(message) {
    const apiKey = getActiveApiKey();
    if (!apiKey || this.isOffline) {
      return null;
    }


    let lastError = null;

    for (let attempt = 0; attempt < MODEL_CANDIDATES.length; attempt++) {
      const idx = (this.currentCandidateIndex + attempt) % MODEL_CANDIDATES.length;
      const modelName = MODEL_CANDIDATES[idx];

      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const modelOptions = { model: modelName };
        if (this.systemInstruction) {
          modelOptions.systemInstruction = this.systemInstruction;
        }

        const model = genAI.getGenerativeModel(modelOptions);
        const chat = model.startChat({
          history: this.history,
          generationConfig: { maxOutputTokens: 1500 }
        });

        const result = await chat.sendMessage(message);
        const responseText = result.response.text();

        if (responseText && responseText.trim()) {
          this.currentCandidateIndex = idx;
          this.activeChat = chat;
          this.activeModelName = modelName;

          // Preserve conversation turns across model candidates
          this.history.push(
            { role: 'user', parts: [{ text: message }] },
            { role: 'model', parts: [{ text: responseText }] }
          );

          return responseText;
        }
      } catch (err) {
        console.warn(`[RobustAIChatSession] Model '${modelName}' failed:`, err.status || err.message);
        lastError = err;
      }
    }

    throw lastError || new Error("All AI chat model candidates failed. Please check your API key or network connection.");
  }
}


/**
 * Interface-gated Roadmap Generator.
 * REQUIRES a verified CompanyValidationResult as input.
 * Throws a runtime gating error if input is not verified.
 * 
 * @param {{ status: string, matchedName: string|null, confidence: number, sourceUrl: string|null }} validationResult 
 * @param {string} roleInput 
 */
export const generateCompanyRoadmap = async (validationResult, roleInput = 'Software Engineer') => {
  if (!validationResult || typeof validationResult !== 'object') {
    throw new Error("GATING_ERROR: Invalid company validation result passed to roadmap generator.");
  }

  if (validationResult.status !== 'verified' || !validationResult.matchedName) {
    throw new Error(`GATING_ERROR: Cannot generate company roadmap for status '${validationResult?.status || 'unknown'}'. Company validation with 'verified' status is strictly required.`);
  }

  const targetCompany = validationResult.matchedName;
  const targetRole = (roleInput && roleInput.trim()) ? roleInput.trim() : 'Software Engineer';
  const sourceUrl = validationResult.sourceUrl;

  const prompt = `
    You are CrackNest Company Preparation AI.

    PIPELINE REQUIREMENT:
    Verified Target Company: "${targetCompany}" (Evidence Source: ${sourceUrl || 'Official Website'})
    Target Role: "${targetRole}"

    Generate a comprehensive, accurate company hiring roadmap for "${targetCompany}" for the role "${targetRole}".
    Return EXACTLY ONE valid JSON object with this schema:
    {
      "status": "SUCCESS",
      "company": "${targetCompany}",
      "role": "${targetRole}",
      "sourceUrl": "${sourceUrl || ''}",
      "companyOverview": "<Factual 2-3 sentence overview of ${targetCompany}>",
      "eligibility": {
        "minCgpa": "<Minimum CGPA e.g. 6.5+ CGPA>",
        "backlogsAllowed": "<Backlogs allowed e.g. 0 Active Backlogs>",
        "degree": "<Eligible Degrees e.g. B.Tech / B.E / M.Tech / MCA>",
        "graduationYear": "<Batch eligibility e.g. 2024 / 2025 / 2026 Batch>",
        "branchEligibility": "<Branch eligibility e.g. CS, IT, ECE, EEE & related>"
      },
      "selectionProcess": [
        { "round": "Round 1", "title": "Online Assessment (OA)", "details": "<Details>" },
        { "round": "Round 2", "title": "Technical Interview I", "details": "<Details>" },
        { "round": "Round 3", "title": "Technical Interview II", "details": "<Details>" },
        { "round": "Round 4", "title": "HR & Managerial Round", "details": "<Details>" }
      ],
      "onlineAssessment": {
        "aptitude": "<Aptitude section breakdown>",
        "logical": "<Logical section breakdown>",
        "verbal": "<Verbal section breakdown>",
        "coding": "<Coding questions breakdown>",
        "mcqs": "<CS Core MCQs>",
        "sql": "<SQL queries requirement>",
        "debugging": "<Debugging questions>",
        "timeLimit": "<Time limit e.g. 90-120 Minutes>"
      },
      "codingQuestions": {
        "difficulty": "<Difficulty level>",
        "languagesAllowed": ["Java", "Python", "C++", "C#"],
        "expectedTopics": ["Arrays & Strings", "Trees & BST", "Dynamic Programming", "Graphs"]
      },
      "technicalInterview": {
        "java": "<Java focus topics>",
        "python": "<Python focus topics>",
        "cpp": "<C++ focus topics>",
        "dbms": "<DBMS focus topics>",
        "os": "<OS focus topics>",
        "cn": "<CN focus topics>",
        "oop": "<OOP focus topics>",
        "projects": "<Projects focus topics>",
        "resume": "<Resume focus topics>"
      },
      "hrInterview": [
        "<Behavioral / HR question 1>",
        "<Behavioral / HR question 2>",
        "<Behavioral / HR question 3>",
        "<Behavioral / HR question 4>"
      ],
      "preparationRoadmap": {
        "week1": "<Week 1 study focus>",
        "week2": "<Week 2 study focus>",
        "week3": "<Week 3 study focus>",
        "week4": "<Week 4 study focus>"
      },
      "importantResources": [
        "<Resource 1>",
        "<Resource 2>",
        "<Resource 3>"
      ],
      "latestHiringTips": [
        "<Hiring Tip 1>",
        "<Hiring Tip 2>",
        "<Hiring Tip 3>"
      ]
    }
  `;

  return await generateAIJSON({ prompt });
};

