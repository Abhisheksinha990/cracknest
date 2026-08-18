import { GoogleGenerativeAI } from '@google/generative-ai';
import { getActiveApiKey } from './aiService';
import { extractTextFromPdf } from '../utils/fileParser';

/**
 * Custom error thrown when a PDF has insufficient or unparseable text (e.g. scanned/image PDF)
 */
export class UnreadablePdfError extends Error {
  constructor(message = "We couldn't read text from this PDF. Try uploading a text-based PDF or a different file.") {
    super(message);
    this.name = "UnreadablePdfError";
  }
}

/**
 * Detect potential multi-column resume layout hazards that break standard ATS systems
 */
export const detectLayoutHazards = (extractedText) => {
  const lines = extractedText.split('\n').map(l => l.trim()).filter(Boolean);
  
  // Check for multi-column indicator (lines with wide gap intervals or parallel section headers)
  let multiColumnDetected = false;
  let wideGaps = 0;
  for (const line of lines) {
    if (/\s{4,}/.test(line) && line.length > 30) {
      wideGaps++;
    }
  }

  if (wideGaps >= 4 || lines.some(l => /experience.*education|skills.*projects/i.test(l))) {
    multiColumnDetected = true;
  }

  // Check for table or box markers
  const tableMarkers = (extractedText.match(/[|┌┐└┘├┤┼─│]/g) || []).length;
  const hasTables = tableMarkers >= 5;

  return {
    multiColumnDetected,
    hasTables,
    isAtsLayoutRisk: multiColumnDetected || hasTables
  };
};

/**
 * Clean header/footer/watermark noise from extracted text
 */
export const cleanExtractedText = (text) => {
  if (!text) return "";
  return text
    .replace(/Page\s+\d+\s+of\s+\d+/gi, '')
    .replace(/Confidential\s+Resume/gi, '')
    .replace(/Created\s+with\s+[^\r\n]+/gi, '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

/**
 * Extracts and validates resume text from a PDF file.
 * Throws UnreadablePdfError if text length is below 100 characters.
 */
export const extractAndValidateResumeText = async (file) => {
  const rawText = await extractTextFromPdf(file);
  const cleaned = cleanExtractedText(rawText);

  if (!cleaned || cleaned.trim().length < 100) {
    throw new UnreadablePdfError("We couldn't read text from this PDF. Try uploading a text-based PDF or a different file.");
  }

  const wordCount = cleaned.split(/\s+/).filter(Boolean).length;
  const layoutAnalysis = detectLayoutHazards(cleaned);

  return {
    extractedText: cleaned,
    wordCount,
    characterCount: cleaned.length,
    layoutAnalysis
  };
};

/**
 * Offline algorithmic fallback scanner when API key is unavailable.
 * Strictly respects input gating (returns null match fields if target inputs absent).
 */
export const runOfflineAlgorithmicScan = (extractedText, layoutAnalysis, targetCompany = '', jobRole = '', jobDescription = '') => {
  const text = extractedText.toLowerCase();
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  const hasEducation = /education|degree|btech|b\.tech|bachelor|university|college|gpa|cgpa/i.test(text);
  const hasExperience = /experience|work|internship|intern|employment|company|engineer|developer/i.test(text);
  const hasProjects = /projects|project|built|developed|created|github|portfolio/i.test(text);
  const hasSkills = /skills|technologies|tech stack|tools|programming|languages/i.test(text);
  const hasAchievements = /achievements|awards|honors|certifications|certified|rank|hackathon/i.test(text);

  // Measure quantitative metrics
  const metricsMatches = text.match(/\b\d+(\.\d+)?(%|k|m|x|\s*ms|\s*sec|\s*users|\s*clients)?\b/gi) || [];

  const commonTech = ["react", "node", "python", "javascript", "typescript", "java", "c++", "sql", "html", "css", "git", "aws", "docker", "express", "mongodb", "postgresql", "tailwind", "rest api", "dsa", "algorithms"];
  const foundSkills = commonTech.filter(s => text.includes(s));
  const missingTech = commonTech.filter(s => !foundSkills.includes(s));

  // Compute sub-scores
  let formattingScore = (hasEducation ? 25 : 0) + (hasExperience ? 25 : 0) + (hasProjects ? 25 : 0) + (hasSkills ? 25 : 0);
  if (layoutAnalysis?.isAtsLayoutRisk) {
    formattingScore = Math.max(30, formattingScore - 25);
  }

  const completenessScore = (hasEducation ? 25 : 0) + (hasExperience ? 25 : 0) + (hasProjects ? 25 : 0) + (hasSkills ? 25 : 0);
  const impactScore = Math.min(100, Math.max(20, 30 + metricsMatches.length * 15));
  const skillsScore = Math.min(100, Math.max(20, foundSkills.length * 12));
  const experienceScore = hasExperience ? Math.min(95, 45 + (wordCount > 250 ? 35 : 15)) : 25;
  const projectsScore = hasProjects ? Math.min(95, 40 + (wordCount > 200 ? 35 : 15)) : 30;

  const hasTargetInputs = Boolean((targetCompany && targetCompany.trim()) || (jobRole && jobRole.trim()) || (jobDescription && jobDescription.trim()));
  
  let keywordRelevance = null;
  let companyMatchPercent = null;
  let roleMatchPercent = null;

  if (hasTargetInputs) {
    const jdWords = (jobDescription || `${targetCompany} ${jobRole}`).toLowerCase().split(/\s+/).filter(w => w.length >= 4);
    const matchedJdWords = jdWords.filter(w => text.includes(w));
    keywordRelevance = jdWords.length > 0 ? Math.min(95, Math.max(30, Math.round((matchedJdWords.length / jdWords.length) * 100))) : 70;

    companyMatchPercent = targetCompany ? Math.min(95, Math.max(35, Math.round((skillsScore + impactScore) / 2 + (text.includes(targetCompany.toLowerCase()) ? 15 : 0)))) : null;
    roleMatchPercent = jobRole ? Math.min(95, Math.max(35, Math.round((skillsScore + experienceScore) / 2))) : null;
  }

  const overallScore = Math.min(96, Math.max(25, Math.round(
    (formattingScore * 0.25) +
    (completenessScore * 0.25) +
    (impactScore * 0.25) +
    (skillsScore * 0.25)
  )));

  const flaggedIssues = [];
  if (layoutAnalysis?.multiColumnDetected) {
    flaggedIssues.push("Multi-column resume layout detected. Real-world ATS parsers frequently misalign multi-column text.");
  }
  if (metricsMatches.length === 0) {
    flaggedIssues.push("No quantitative achievements or measurable metrics detected in experience/project bullet points.");
  }
  if (!hasExperience) {
    flaggedIssues.push("Missing dedicated Work Experience or Internship section.");
  }
  if (foundSkills.length < 3) {
    flaggedIssues.push("Low technical keyword density. Add specific programming languages, frameworks, and database tools.");
  }

  return {
    overallAtsScore: overallScore,
    companyMatchPercent,
    roleMatchPercent,
    interviewReadinessPercent: Math.min(95, Math.max(30, overallScore - 5)),
    probabilityOfGettingShortlisted: overallScore >= 75 ? "High (80-90%)" : overallScore >= 55 ? "Moderate (45-60%)" : "Low (15-30%)",
    subScores: {
      formatting: formattingScore,
      keywordRelevance,
      sectionCompleteness: completenessScore,
      quantifiedImpact: impactScore
    },
    sectionScores: {
      formatting: formattingScore,
      skillsMatch: skillsScore,
      experience: experienceScore,
      projects: projectsScore,
      education: hasEducation ? 85 : 40,
      achievements: hasAchievements ? 80 : 35,
      keywords: keywordRelevance || skillsScore,
      readability: wordCount >= 120 && wordCount <= 900 ? 88 : 55
    },
    flaggedIssues,
    extractedSections: {
      contactInfo: /phone|email|linkedin|github|@/i.test(text),
      experience: hasExperience,
      education: hasEducation,
      skills: hasSkills
    },
    strengths: [
      foundSkills.length > 0 ? `Detected key technical skills: ${foundSkills.slice(0, 4).join(', ')}` : "Standard text layout",
      hasProjects ? "Dedicated project section identified" : "Academic credentials listed",
      metricsMatches.length > 0 ? `Extracted ${metricsMatches.length} measurable impact metrics` : "Valid text parseability"
    ],
    weaknesses: flaggedIssues.slice(0, 3),
    missingKeywords: missingTech.slice(0, 5),
    top15MissingKeywords: missingTech.slice(0, 15),
    atsProblems: flaggedIssues,
    recruiterConcerns: !hasExperience ? ["Recruiters favor candidates with internships or real production projects"] : ["Ensure experience bullets highlight individual contribution"],
    technicalSkillGap: missingTech.slice(0, 4),
    softSkillGap: ["Cross-functional Collaboration", "System Ownership & Debugging"],
    projectsImprovement: ["Include GitHub repository links and deployed live URLs", "Quantify user scale, latency improvements, or test coverage"],
    resumeImprovementSuggestions: ["Structure bullet points using STAR format (Situation, Task, Action, Result)", "Add measurable numbers (%, $, ms, user count) to every experience entry"],
    recommendedCertifications: ["AWS Certified Developer", "Meta Professional Software Engineer"],
    recommendedProjects: ["Distributed High-Throughput Microservice", "Real-Time Collaborative Platform"],
    recommendedDsaTopics: ["Dynamic Programming", "Graph Traversals (BFS/DFS)", "System Design Patterns"],
    recommendedInterviewTopics: ["Scalable Architecture", "Concurrency & Threading", "Database Query Tuning"],
    finalVerdict: `Analyzed extracted text (${wordCount} words, ${foundSkills.length} skills found). Grounded ATS Score: ${overallScore}/100.`
  };
};

/**
 * Main Resume Analysis function with strict input-gating and low temperature
 * 
 * @param {File} file PDF File
 * @param {{ targetCompany?: string, jobRole?: string, jobDescription?: string }} options 
 */
export const analyzeResume = async (file, options = {}) => {
  const { targetCompany = '', jobRole = '', jobDescription = '' } = options;

  // Step 1: Pre-Parse & Validate PDF Text (Must be >= 100 characters)
  const extractionResult = await extractAndValidateResumeText(file);
  const { extractedText, wordCount, layoutAnalysis } = extractionResult;

  const apiKey = getActiveApiKey();
  if (!apiKey) {
    // Offline algorithmic scanner fallback
    return runOfflineAlgorithmicScan(extractedText, layoutAnalysis, targetCompany, jobRole, jobDescription);
  }

  // Step 2: Select Prompt Template based on Target Inputs (Strict Gating)
  const hasTargetInputs = Boolean(
    (targetCompany && targetCompany.trim()) || 
    (jobRole && jobRole.trim()) || 
    (jobDescription && jobDescription.trim())
  );

  let systemInstruction = `You are CrackNest AI Resume Analyzer.
Your task is to behave strictly as an objective, algorithmic ATS scanner and Senior Technical Recruiter.
Analyze the candidate's resume based STRICTLY and ONLY on the extracted plain text provided below.

CRITICAL RULES:
1. Compute a unique, dynamic score (0-100) reflecting the real strength or weakness of this candidate's text.
2. Ground all feedback in actual content patterns (cite specific projects, tools, metrics, or missing elements).
3. Do NOT invent or assume facts not present in the text.
4. Set overallAtsScore based strictly on structure, technical depth, section completeness, and quantified metrics.`;

  let prompt = "";

  if (hasTargetInputs) {
    systemInstruction += `\n5. Target context IS provided. Compute companyMatchPercent, roleMatchPercent, and subScores.keywordRelevance based on exact alignment with the target inputs.`;
    
    prompt = `
      CANDIDATE RESUME EXTRACTED TEXT:
      """
      ${extractedText}
      """

      TARGET CONTEXT (PROVIDED BY USER):
      - Target Company: ${targetCompany.trim() || "Not specified"}
      - Target Job Role: ${jobRole.trim() || "Not specified"}
      - Job Description: ${jobDescription.trim() || "Not specified"}

      LAYOUT HAZARDS DETECTED:
      - Multi-Column Layout: ${layoutAnalysis.multiColumnDetected ? "YES (Flag as ATS formatting risk)" : "NO"}
      - Tabular/Box Layout: ${layoutAnalysis.hasTables ? "YES (Flag as ATS formatting risk)" : "NO"}

      Return EXACTLY ONE valid JSON object with this schema:
      {
        "overallAtsScore": <number 0-100>,
        "companyMatchPercent": ${targetCompany.trim() ? "<number 0-100>" : "null"},
        "roleMatchPercent": ${(jobRole.trim() || jobDescription.trim()) ? "<number 0-100>" : "null"},
        "interviewReadinessPercent": <number 0-100>,
        "probabilityOfGettingShortlisted": "<Low (15-30%) | Moderate (45-60%) | High (80-90%)>",
        "subScores": {
          "formatting": <number 0-100>,
          "keywordRelevance": ${(jobRole.trim() || jobDescription.trim()) ? "<number 0-100>" : "null"},
          "sectionCompleteness": <number 0-100>,
          "quantifiedImpact": <number 0-100>
        },
        "sectionScores": {
          "formatting": <number 0-100>,
          "skillsMatch": <number 0-100>,
          "experience": <number 0-100>,
          "projects": <number 0-100>,
          "education": <number 0-100>,
          "achievements": <number 0-100>,
          "keywords": <number 0-100>,
          "readability": <number 0-100>
        },
        "flaggedIssues": ["<specific issue referencing extracted text 1>", "<specific issue 2>"],
        "extractedSections": {
          "contactInfo": true|false,
          "experience": true|false,
          "education": true|false,
          "skills": true|false
        },
        "strengths": ["<strength 1>", "<strength 2>"],
        "weaknesses": ["<weakness 1>", "<weakness 2>"],
        "missingKeywords": ["<kw1>", "<kw2>"],
        "top15MissingKeywords": ["<k1>", "<k2>", "<k3>", "<k4>", "<k5>"],
        "atsProblems": ["<ats problem 1>"],
        "recruiterConcerns": ["<concern 1>"],
        "technicalSkillGap": ["<tech gap 1>"],
        "softSkillGap": ["<soft skill 1>"],
        "projectsImprovement": ["<tip 1>"],
        "resumeImprovementSuggestions": ["<suggestion 1>"],
        "recommendedCertifications": ["<cert 1>"],
        "recommendedProjects": ["<proj 1>"],
        "recommendedDsaTopics": ["<dsa 1>"],
        "recommendedInterviewTopics": ["<topic 1>"],
        "finalVerdict": "<Grounded 1-2 sentence verdict referencing extracted word count and findings>"
      }
    `;
  } else {
    systemInstruction += `\n5. CRITICAL: NO target company or job role was provided by the user. You MUST NOT compute, invent, or mention company match or job role match. You MUST return null for companyMatchPercent, roleMatchPercent, and subScores.keywordRelevance. Focus purely on general ATS structure and resume quality.`;

    prompt = `
      CANDIDATE RESUME EXTRACTED TEXT:
      """
      ${extractedText}
      """

      TARGET CONTEXT:
      NONE. User has NOT requested target company or role matching.

      LAYOUT HAZARDS DETECTED:
      - Multi-Column Layout: ${layoutAnalysis.multiColumnDetected ? "YES (Flag as ATS formatting risk)" : "NO"}
      - Tabular/Box Layout: ${layoutAnalysis.hasTables ? "YES (Flag as ATS formatting risk)" : "NO"}

      Return EXACTLY ONE valid JSON object with this schema:
      {
        "overallAtsScore": <number 0-100>,
        "companyMatchPercent": null,
        "roleMatchPercent": null,
        "interviewReadinessPercent": <number 0-100>,
        "probabilityOfGettingShortlisted": "<Low (15-30%) | Moderate (45-60%) | High (80-90%)>",
        "subScores": {
          "formatting": <number 0-100>,
          "keywordRelevance": null,
          "sectionCompleteness": <number 0-100>,
          "quantifiedImpact": <number 0-100>
        },
        "sectionScores": {
          "formatting": <number 0-100>,
          "skillsMatch": <number 0-100>,
          "experience": <number 0-100>,
          "projects": <number 0-100>,
          "education": <number 0-100>,
          "achievements": <number 0-100>,
          "keywords": <number 0-100>,
          "readability": <number 0-100>
        },
        "flaggedIssues": ["<specific issue referencing extracted text 1>", "<specific issue 2>"],
        "extractedSections": {
          "contactInfo": true|false,
          "experience": true|false,
          "education": true|false,
          "skills": true|false
        },
        "strengths": ["<strength 1>", "<strength 2>"],
        "weaknesses": ["<weakness 1>", "<weakness 2>"],
        "missingKeywords": ["<kw1>", "<kw2>"],
        "top15MissingKeywords": ["<k1>", "<k2>", "<k3>", "<k4>", "<k5>"],
        "atsProblems": ["<ats problem 1>"],
        "recruiterConcerns": ["<concern 1>"],
        "technicalSkillGap": ["<tech gap 1>"],
        "softSkillGap": ["<soft skill 1>"],
        "projectsImprovement": ["<tip 1>"],
        "resumeImprovementSuggestions": ["<suggestion 1>"],
        "recommendedCertifications": ["<cert 1>"],
        "recommendedProjects": ["<proj 1>"],
        "recommendedDsaTopics": ["<dsa 1>"],
        "recommendedInterviewTopics": ["<topic 1>"],
        "finalVerdict": "<Grounded 1-2 sentence verdict referencing extracted word count and findings>"
      }
    `;
  }

  // Step 3: Hit Gemini API with low temperature (0.1) for deterministic output
  const genAI = new GoogleGenerativeAI(apiKey);
  const modelCandidates = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-pro'];
  let lastError = null;

  for (const modelName of modelCandidates) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction,
        generationConfig: {
          temperature: 0.1, // Low temperature for deterministic factual scoring
          topP: 0.8
        }
      });

      const response = await model.generateContent(prompt);
      const text = response.response.text();

      let cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleaned = cleaned.substring(firstBrace, lastBrace + 1);
      }

      const parsed = JSON.parse(cleaned);

      // Enforce strict match field gating on output
      if (!hasTargetInputs) {
        parsed.companyMatchPercent = null;
        parsed.roleMatchPercent = null;
        if (parsed.subScores) {
          parsed.subScores.keywordRelevance = null;
        }
      }

      return parsed;
    } catch (err) {
      console.warn(`[ResumeAnalysisService] Model candidate '${modelName}' failed:`, err.message);
      lastError = err;
    }
  }

  // If Gemini API fails, fallback to offline algorithmic scanner
  console.warn("[ResumeAnalysisService] API call failed, falling back to offline algorithmic scanner:", lastError?.message);
  return runOfflineAlgorithmicScan(extractedText, layoutAnalysis, targetCompany, jobRole, jobDescription);
};
