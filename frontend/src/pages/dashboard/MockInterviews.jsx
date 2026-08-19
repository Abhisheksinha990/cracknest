import React, { useState, useRef, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { AuthContext } from '../../context/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { GLSLHills } from '../../components/ui/glsl-hills';
import { 
  Building2, Briefcase, Play, Send, CheckCircle, ShieldAlert, User, Loader2, 
  RotateCcw, Star, TrendingUp, AlertTriangle, Paperclip, FileText, X, ToggleLeft, 
  ToggleRight, Server, Award, Target, MessageSquare, BookOpen, Lightbulb, Settings
} from 'lucide-react';
import { fileToGenerativePart } from '../../utils/fileParser';
import toast from 'react-hot-toast';
import api from '../../api';
import { RobustAIChatSession, generateAIContent, generateAIJSON, getActiveApiKey } from '../../services/aiService';
import { AIKeyModal } from '../../components/AIKeyModal';

const TOTAL_QUESTIONS = 8;

/**
 * Generates a dynamic, grounded evaluation report derived strictly from the candidate's actual 8 answers.
 */
export const generateGroundedFinalFeedback = (userAnswers, company, role, isStressMode) => {
  const answers = Array.isArray(userAnswers) ? userAnswers : [];
  const combinedText = answers.join(' ').toLowerCase();
  const totalWords = answers.reduce((acc, ans) => acc + ans.split(/\s+/).filter(Boolean).length, 0);

  // Technical keyword density scan
  const techKeywords = [
    "latency", "throughput", "index", "database", "cache", "redis", "postgres", "sql", 
    "api", "microservice", "docker", "aws", "architecture", "dsa", "tree", "graph", 
    "complexity", "o(1)", "o(n)", "scalability", "concurrency", "star", "load balancer",
    "react", "node", "python", "java", "system design", "monitoring", "git"
  ];
  const matchedTech = techKeywords.filter(k => combinedText.includes(k));

  // Quantitative metrics scan (%, ms, $, scale numbers)
  const metrics = (combinedText.match(/\b\d+(\.\d+)?(%|k|m|x|ms|sec|users|qps)?\b/gi) || []);

  // Compute sub-scores dynamically based on candidate text depth
  const wordCountScore = Math.min(30, Math.max(10, Math.round(totalWords / 15)));
  const techDensityScore = Math.min(35, matchedTech.length * 7);
  const metricDensityScore = Math.min(35, metrics.length * 9);

  const rawScore = lengthScore => Math.min(96, Math.max(35, wordCountScore + techDensityScore + metricDensityScore));
  const baseScore = rawScore(wordCountScore);
  const overallScore = isStressMode ? Math.max(30, baseScore - 5) : baseScore;

  const hiringRecommendation = overallScore >= 85 ? "Strong Hire" : overallScore >= 75 ? "Hire" : overallScore >= 60 ? "Leaning Hire" : "No Hire";
  const estimatedLevel = overallScore >= 85 ? "Senior Engineer (L5+ Ready)" : overallScore >= 75 ? "Mid-Level Engineer (L4 Ready)" : overallScore >= 60 ? "Junior Engineer (L3 Ready)" : "Needs Fundamental Preparation";

  const strongAreas = [];
  if (matchedTech.length > 0) strongAreas.push(`Technical terms demonstrated: ${matchedTech.slice(0, 4).join(', ')}`);
  if (metrics.length > 0) strongAreas.push(`Extracted ${metrics.length} quantitative impact metrics in responses`);
  if (totalWords >= 120) strongAreas.push("Articulate explanations with solid response length");
  if (strongAreas.length === 0) strongAreas.push("Basic familiarity with software concepts");

  const weakAreas = [];
  if (metrics.length === 0) weakAreas.push("No quantitative metrics (%, $, ms, scale) provided in experience responses");
  if (matchedTech.length < 3) weakAreas.push("Low technical architecture and trade-off keyword density");
  if (totalWords < 80) weakAreas.push("Responses were brief; expand on edge cases and STAR method details");

  const mostImportantTopicsToImprove = [
    "Quantified Achievement & Impact Presentation (STAR Method)",
    `Advanced System Design & Scalability Patterns for ${company}`,
    "Technical Trade-off & Latency Optimization Calculations"
  ];

  return {
    overallScore,
    technicalRating: Math.min(10, Math.max(3, Math.round(overallScore / 10))),
    communicationRating: Math.min(10, Math.max(4, Math.round((wordCountScore + 40) / 10))),
    confidenceRating: Math.min(10, Math.max(4, Math.round(overallScore / 10))),
    hiringRecommendation,
    strongAreas,
    weakAreas,
    mostImportantTopicsToImprove,
    companyReadiness: `Analyzed candidate responses (${totalWords} words, ${matchedTech.length} tech terms) against ${company}'s bar. Company alignment: ${overallScore}/100.`,
    roleReadiness: `Evaluated technical bar for ${role} position. Status: ${hiringRecommendation}.`,
    estimatedInterviewLevel: estimatedLevel,
    nextLearningPlan: [
      `Master core ${role} system design trade-offs and latency benchmarks.`,
      `Incorporate quantitative metrics (%, $, ms, user scale) into all STAR behavioral answers.`,
      `Practice timed 2-minute technical answer delivery for ${company} interviews.`
    ],
    interviewSummary: `Completed all 8 interview questions for ${role} at ${company}. Candidate submitted ${answers.length} answers (${totalWords} words total). Verdict: ${hiringRecommendation}.`
  };
};

const MockInterviews = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [phase, setPhase] = useState('setup'); // 'setup', 'interview', 'results'
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [isStressMode, setIsStressMode] = useState(false);
  const [notFoundCompany, setNotFoundCompany] = useState(null);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  
  const [messages, setMessages] = useState([]);
  const [userAnswers, setUserAnswers] = useState([]); // Array of candidate's 8 text answers
  const [input, setInput] = useState('');
  const [questionCount, setQuestionCount] = useState(0);
  const [finalFeedback, setFinalFeedback] = useState(null);
  
  const messagesEndRef = useRef(null);
  const chatRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error("Please upload PDF format only.");
        e.target.value = null;
        return;
      }
      setAttachedFile(file.name);
      try {
        const part = await fileToGenerativePart(file);
        setFileContent(part);
        toast.success("Resume attached for interview customization!");
      } catch (err) {
        console.error(err);
        toast.error("Failed to parse file.");
      }
    }
  };

  const removeFile = () => {
    setAttachedFile(null);
    setFileContent('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const isCompanyValid = (name) => {
    if (!name || name.trim().length < 2) return false;
    const cleaned = name.trim().toLowerCase();

    const knownList = [
      "google", "microsoft", "amazon", "apple", "meta", "facebook", "netflix", "uber", "adobe",
      "accenture", "cognizant", "capgemini", "infosys", "tcs", "tata consultancy services",
      "wipro", "deloitte", "flipkart", "atlassian", "oracle", "ibm", "cisco", "salesforce",
      "intel", "nvidia", "amd", "paypal", "paytm", "phonepe", "walmart", "target", "jpmorgan",
      "goldman sachs", "morgan stanley", "barclays", "hsbc", "zomato", "swiggy", "razorpay",
      "zerodha", "cred", "ola", "bloomberg", "intuit", "stripe", "airbnb", "doordash", "databricks",
      "tesla", "spotify", "twitter", "x", "linkedin", "github", "gitlab", "notion", "figma", "slack",
      "zoom", "shopify", "canva", "palantir", "snowflake", "twilio", "square", "block", "palo alto",
      "crowdstrike", "cloudflare", "datadog", "mongo", "mongodb", "elastic", "confluent", "hashicorp",
      "unity", "epic games", "ea", "electronic arts", "ubisoft", "sony", "samsung", "lg", "dell", "hp",
      "lenovo", "asus", "acer", "qualcomm", "broadcom", "arm", "tsmc", "asml", "applied materials",
      "synopsys", "cadence", "microchip", "texas instruments", "stmicroelectronics", "nxp", "infineon",
      "boeing", "airbus", "lockheed", "general electric", "ge", "siemens", "schneider", "abb", "honeywell",
      "3m", "caterpillar", "john deere", "ford", "gm", "general motors", "toyota", "honda", "hyundai",
      "bmw", "mercedes", "audi", "porsche", "volkswagen", "volvo", "nissan", "subaru", "mazda", "ferrari",
      "shell", "bp", "total", "exxon", "chevron", "aramco", "reliance", "adani", "tata", "birla",
      "pfizer", "moderna", "johnson", "roche", "novartis", "merck", "abbvie", "bayer", "sanofi", "gsk",
      "mckinsey", "bain", "bcg", "pwc", "kpmg", "ey", "ernst & young"
    ];

    if (knownList.some(k => cleaned === k || cleaned.includes(k) || k.includes(cleaned))) return true;
    if (/\d/.test(cleaned)) return false;
    if (/[bcdfghjklmnpqrstvwxyz]{3,}/i.test(cleaned)) return false;
    if (/(.)\1{2,}/.test(cleaned)) return false;

    const vowelCount = (cleaned.match(/[aeiou]/g) || []).length;
    if (vowelCount === 0) return false;
    if (cleaned.length >= 4 && (vowelCount / cleaned.length) < 0.35) return false;

    return true;
  };

  const isRoleValid = (roleName) => {
    if (!roleName || roleName.trim().length < 2) return false;
    const cleaned = roleName.trim().toLowerCase();
    const knownRoles = [
      "developer", "engineer", "analyst", "architect", "manager", "designer", "consultant",
      "scientist", "lead", "intern", "associate", "specialist", "tester", "sde", "swe",
      "fullstack", "frontend", "backend", "devops", "cloud", "data", "qa", "security", "administrator"
    ];
    if (knownRoles.some(r => cleaned.includes(r))) return true;
    
    const vowelCount = (cleaned.match(/[aeiou]/g) || []).length;
    if (cleaned.length >= 4 && vowelCount === 0) return false;
    if (cleaned.length >= 6 && (vowelCount / cleaned.length) < 0.18) return false;
    return true;
  };

  const startInterview = async () => {
    if (!company.trim() || !role.trim()) {
      toast.error('Please enter target company and role.');
      return;
    }

    if (!isCompanyValid(company)) {
      setNotFoundCompany(company);
      toast.error("Company not found. Please select a valid company below.");
      return;
    }

    if (!isRoleValid(role)) {
      toast.error("Invalid job role. Please enter a valid job title (e.g. Software Engineer, Developer).");
      return;
    }
    
    setNotFoundCompany(null);
    setIsLoading(true);

    const activeKey = getActiveApiKey();
    if (activeKey) {
      try {
        const checkPrompt = `Verify if "${company}" is a real, legitimate company. If it is fake, fabricated, or gibberish (e.g. "asdfgh", "dsegvds"), respond ONLY with {"status":"NOT_FOUND"}. Otherwise respond with {"status":"SUCCESS"}.`;
        const checkRes = await generateAIContent({ prompt: checkPrompt });
        const checkTxt = checkRes.text.replace(/```json/gi, '').replace(/```/g, '').trim();
        if (checkTxt.includes("NOT_FOUND")) {
          setNotFoundCompany(company);
          setIsLoading(false);
          toast.error("Company not found. Please select a valid company below.");
          return;
        }
      } catch (err) {
        console.log("Validation check error", err);
      }
    }
    
    setPhase('interview');
    setMessages([]);
    setUserAnswers([]);
    setQuestionCount(1);

    try {
      const baseInstructions = `
        You are CrackNest Interview AI.
        You are a Senior Technical Interviewer for ${company}.
        Your job is to conduct a realistic, high-caliber interview for the ${role} position.

        CRITICAL INTERVIEW FLOW RULES:
        1. Conduct EXACTLY 8 interview questions (Q1 to Q8).
        2. Ask ONE question at a time.
        3. Do NOT evaluate or critique the candidate's answer during the interview. Simply ask the next question or give a short 1-sentence interviewer transition before asking the next question.
        4. Question difficulty MUST gradually increase from foundational (Q1) to advanced/system design (Q8).
        5. Mix question types across the 8 questions:
           - Technical concepts
           - Data Structures & Algorithms (DSA)
           - Past Projects & Experience (if resume provided)
           - Behavioral (STAR method)
           - System Design & Scalability
           - HR & Culture fit for ${company}.

        6. AFTER QUESTION 8:
           Whenever you conclude after Question 8, output "INTERVIEW_COMPLETE" followed by a complete final evaluation JSON object matching this schema:
           {
             "overallScore": <number 0-100>,
             "technicalRating": <number 0-10>,
             "communicationRating": <number 0-10>,
             "confidenceRating": <number 0-10>,
             "hiringRecommendation": "<Strong Hire | Hire | Leaning Hire | No Hire>",
             "strongAreas": ["<area 1>", "<area 2>"],
             "weakAreas": ["<area 1>", "<area 2>"],
             "mostImportantTopicsToImprove": ["<topic 1>", "<topic 2>"],
             "companyReadiness": "<readiness string>",
             "roleReadiness": "<readiness string>",
             "estimatedInterviewLevel": "<level string>",
             "nextLearningPlan": ["<step 1>", "<step 2>"],
             "interviewSummary": "<summary string>"
           }
      `;

      const stressInstructions = isStressMode ? `
        STRESS INTERVIEW AI MODE IS ACTIVE:
        You are CrackNest Stress Interview AI.
        Behave like an impatient Senior Engineering Manager at a top tech firm.
        Be professional but strict. Question assumptions and ask 8 difficult questions.
      ` : '';

      if (activeKey) {
        const chatSession = new RobustAIChatSession({
          systemInstruction: baseInstructions + stressInstructions
        });
        await chatSession.init();
        chatRef.current = chatSession;

        let resumeText = "";
        if (fileContent) {
          resumeText = fileContent.extractedText || (typeof fileContent === 'string' ? fileContent : "");
        }
        let prompt = `Hello, I am ${user?.name || 'the candidate'}. I am ready to begin my 8-question mock interview for the ${role} position at ${company}. Please ask Question 1 tailored to ${company} and my target role.`;
        if (resumeText && resumeText.trim()) {
          prompt = `Candidate Resume Content:\n${resumeText.trim()}\n\n${prompt}`;
        }
        
        const text = await chatSession.sendMessage(prompt);
        if (text && text.trim()) {
          setMessages([{ role: 'model', text }]);
          return;
        }
      }
    } catch (error) {
      console.info("[MockInterviews] Starting interview in Smart Recruiter Mode:", error?.message);
    } finally {
      setIsLoading(false);
    }

    // Clean Interview Mode initial message
    setMessages([{ 
      role: 'model', 
      text: `Welcome to your mock interview for the ${role} position at ${company}.\n\nQuestion 1:\n"Please introduce yourself and highlight your core technical skills and past projects relevant to ${company}."` 
    }]);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    
    // Check if one-word or extremely short answer
    const words = userMessage.split(/\s+/).filter(Boolean);
    const isShortAnswer = words.length <= 3 && ["nope", "yes", "no", "skip", "pass", "ok", "fine", "idk"].includes(words[0]?.toLowerCase());

    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    const updatedAnswers = [...userAnswers, userMessage];
    setUserAnswers(updatedAnswers);
    setIsLoading(true);

    if (isShortAnswer) {
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          role: 'model', 
          text: `⚠️ This answer is too short for a real interview. Explain your reasoning with examples.\n\nLet me ask again: Can you provide a detailed explanation or example for Question ${questionCount}?` 
        }]);
        setIsLoading(false);
      }, 500);
      return;
    }

    const activeKey = getActiveApiKey();

    if (!activeKey || !chatRef.current) {
      setTimeout(() => {
        const nextCount = questionCount + 1;
        setQuestionCount(nextCount);

        if (nextCount > TOTAL_QUESTIONS) {
          // Finished all 8 questions -> Generate Grounded Evaluation Report
          setMessages(prev => [...prev, { 
            role: 'model', 
            text: `Thank you. That concludes all ${TOTAL_QUESTIONS} interview questions for the ${role} position at ${company}.\n\nGenerating your Official Recruiter Candidate Evaluation Report...` 
          }]);

          const finalReport = generateGroundedFinalFeedback(updatedAnswers, company, role, isStressMode);
          setFinalFeedback(finalReport);

          api.post('/interviews/save', {
            company: company,
            role: role,
            rating: finalReport.overallScore ? finalReport.overallScore / 10 : 8,
            feedback: finalReport.interviewSummary,
            improvements: finalReport.mostImportantTopicsToImprove,
            weakest_area: finalReport.weakAreas?.[0] || "General"
          }).catch(err => console.error("Failed to save interview", err));

          setTimeout(() => setPhase('results'), 2500);
        } else {
          // Next Question cleanly without interrupting evaluation cards
          const sampleQuestions = [
            `Question 2 (Technical Concepts & Optimization): "How would you optimize a search operation over a dataset of 10 million records with low latency constraints at ${company}?"`,
            `Question 3 (Projects & Past Experience): "Tell me about a complex technical project you built recently. What was the hardest architectural decision you made and why?"`,
            `Question 4 (System Design & Scalability): "How would you design a high-throughput, fault-tolerant notification system for ${company} handling millions of events daily?"`,
            `Question 5 (Behavioral - STAR Method): "Describe a situation where a critical production bug occurred right before a major launch. How did you diagnose, resolve, and communicate it?"`,
            `Question 6 (Technical Deep Dive): "Explain the difference between optimistic and pessimistic locking in databases. In what scenario would you choose optimistic locking at ${company}?"`,
            `Question 7 (Situation & Leadership): "If a senior team member proposes a feature architecture that you believe creates scalability bottlenecks, how do you approach the discussion?"`,
            `Question 8 (Company Culture & Vision): "Why ${company} specifically for your next career step? What engineering principles or products at ${company} align with your background?"`
          ];

          setMessages(prev => [...prev, { 
            role: 'model', 
            text: sampleQuestions[(nextCount - 2) % sampleQuestions.length] 
          }]);
        }
        setIsLoading(false);
      }, 800);
      return;
    }

    // AI Interactive Mode with Gemini
    try {
      const chat = chatRef.current;
      const result = await chat.sendMessage(userMessage);
      let text = result.response.text();

      const nextCount = questionCount + 1;
      setQuestionCount(nextCount);

      if (text.includes("INTERVIEW_COMPLETE") || nextCount > TOTAL_QUESTIONS) {
        const parts = text.split("INTERVIEW_COMPLETE");
        const chatBefore = parts[0].trim();
        if (chatBefore) {
          setMessages(prev => [...prev, { role: 'model', text: chatBefore }]);
        }

        let feedbackData = null;
        try {
          if (parts[1]) {
            const jsonStr = parts[1].replace(/```json/g, '').replace(/```/g, '').trim();
            feedbackData = JSON.parse(jsonStr);
          }
        } catch (e) {
          console.warn("Parsing AI JSON feedback failed, falling back to grounded evaluation:", e);
        }

        if (!feedbackData) {
          feedbackData = generateGroundedFinalFeedback(updatedAnswers, company, role, isStressMode);
        }

        setFinalFeedback(feedbackData);

        api.post('/interviews/save', {
          company: company,
          role: role,
          rating: feedbackData.overallScore ? feedbackData.overallScore / 10 : 8,
          feedback: feedbackData.interviewSummary,
          improvements: feedbackData.mostImportantTopicsToImprove || [],
          weakest_area: feedbackData.weakAreas?.[0] || "General"
        }).catch(err => console.error("Failed to save interview", err));

        setTimeout(() => setPhase('results'), 2500);
      } else {
        setMessages(prev => [...prev, { role: 'model', text }]);
      }
    } catch (error) {
      console.error("[MockInterviews] AI send message error:", error);
      // Fallback transition to next question
      const nextCount = questionCount + 1;
      setQuestionCount(nextCount);
      if (nextCount > TOTAL_QUESTIONS) {
        const finalReport = generateGroundedFinalFeedback(updatedAnswers, company, role, isStressMode);
        setFinalFeedback(finalReport);
        setTimeout(() => setPhase('results'), 2000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const restart = () => {
    setPhase('setup');
    setMessages([]);
    setUserAnswers([]);
    setQuestionCount(0);
    setFinalFeedback(null);
    chatRef.current = null;
  };

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="w-full h-screen bg-zinc-950 flex flex-col pt-16 text-zinc-100 relative overflow-hidden font-sans">
      
      <div className="absolute inset-0 z-0 opacity-40">
        <GLSLHills />
      </div>

      {/* TOP HEADER */}
      <div className="h-16 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md px-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-serif text-white tracking-tight">CrackNest AI Mock Interview</h1>
          {isStressMode && (
            <span className="px-2.5 py-0.5 bg-red-500/10 text-red-400 text-[10px] font-bold uppercase rounded-full border border-red-500/20 flex items-center gap-1">
              <ShieldAlert size={12} /> Stress Mode
            </span>
          )}
        </div>

        {phase === 'interview' && (
          <div className="flex items-center gap-6">
            <div className="text-right">
              <span className="text-[10px] text-zinc-400 font-bold uppercase block">Target</span>
              <span className="text-xs font-bold text-white capitalize">{company} • {role}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-zinc-400 font-bold uppercase block">Progress</span>
              <span className="text-xs font-bold text-[#33bb9a]">Question {Math.min(questionCount, TOTAL_QUESTIONS)} / {TOTAL_QUESTIONS}</span>
            </div>
          </div>
        )}
      </div>

      {/* PHASE 1: SETUP MODAL */}
      {phase === 'setup' && (
        <div className="flex-1 flex items-center justify-center p-4 relative z-10">
          <div className="w-full max-w-md">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-6"
            >
              <div className="text-center">
                <h2 className="text-2xl font-serif text-white">Setup Mock Interview</h2>
                <p className="text-xs text-zinc-400 mt-1">Configure target company & role for structured 8-question evaluation</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">Target Company *</label>
                  <div className="relative">
                    <Building2 size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => {
                        setCompany(e.target.value);
                        setNotFoundCompany(null);
                      }}
                      placeholder="e.g. Google, Microsoft, Cognizant, TCS"
                      className="w-full pl-11 pr-4 py-3.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-[#00B386]"
                    />
                  </div>
                </div>

                {notFoundCompany && (
                  <div className="bg-red-950/30 border border-red-900/50 p-4 rounded-xl text-center">
                    <span className="text-xs font-bold text-red-400 block">Company Not Found. Please enter a valid company name.</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">Target Job Role *</label>
                  <div className="relative">
                    <Briefcase size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="text"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      placeholder="e.g. Software Engineer, Backend Dev"
                      className="w-full pl-11 pr-4 py-3.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-[#00B386]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">Attach Resume PDF (Optional)</label>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileChange} 
                    accept=".pdf"
                  />
                  {!attachedFile ? (
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-3.5 px-4 bg-zinc-950 hover:bg-zinc-800 border border-dashed border-zinc-700 hover:border-[#00B386] text-zinc-400 hover:text-[#33bb9a] text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      <Paperclip size={16} />
                      Upload Resume for Resume-Specific Questions
                    </button>
                  ) : (
                    <div className="w-full py-3 px-4 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3 truncate">
                        <FileText size={16} className="text-[#33bb9a] shrink-0" />
                        <span className="text-xs text-white truncate">{attachedFile}</span>
                      </div>
                      <button onClick={removeFile} className="text-zinc-500 hover:text-red-400 p-1">
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Stress Mode Toggle */}
                <div className="p-4 bg-zinc-950/60 border border-red-900/30 rounded-xl flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-red-400 flex items-center gap-2">
                      <ShieldAlert size={16} />
                      FAANG Stress Interview Mode
                    </h4>
                    <p className="text-[11px] text-zinc-400 mt-0.5">Skeptical senior manager persona with strict followup questions.</p>
                  </div>
                  <button 
                    onClick={() => setIsStressMode(!isStressMode)}
                    className={`p-1 transition-colors ${isStressMode ? 'text-red-500' : 'text-zinc-600 hover:text-zinc-400'}`}
                  >
                    {isStressMode ? <ToggleRight size={30} /> : <ToggleLeft size={30} />}
                  </button>
                </div>

                <button
                  onClick={startInterview}
                  disabled={isLoading || !company || !role}
                  className="w-full py-4 bg-gradient-to-r from-[#00B386] to-[#008060] hover:from-[#33bb9a] hover:to-[#00B386] text-white font-bold rounded-xl transition-all shadow-xl shadow-[#00B386]/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer text-sm"
                >
                  {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
                  {isLoading ? 'Initializing Interview...' : 'Start 8-Question Mock Interview'}
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* PHASE 2: LIVE INTERVIEW CHAT (CLEAN REALISTIC FLOW WITHOUT PER-QUESTION CARDS) */}
      {phase === 'interview' && (
        <div className="flex-1 flex flex-col border border-zinc-800 rounded-2xl bg-zinc-900/80 backdrop-blur-xl overflow-hidden shadow-2xl relative z-10">
          
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar">
            {messages.map((msg, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 max-w-[90%] md:max-w-[80%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center border shadow-lg overflow-hidden ${
                  msg.role === 'user' 
                    ? 'bg-[#00B386]/20 text-[#33bb9a] border-[#00B386]/30' 
                    : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                }`}>
                  {msg.role === 'user' ? <User size={18} /> : <Server size={18} />}
                </div>

                <div className={`p-4 md:p-5 rounded-2xl text-xs md:text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-[#009973] text-white rounded-tr-none shadow-md' 
                    : isStressMode 
                        ? 'bg-red-950/20 border border-red-900/40 text-zinc-200 rounded-tl-none'
                        : 'bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-tl-none'
                }`}>
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
              </motion.div>
            ))}

            {isLoading && (
              <div className="flex gap-3 max-w-[80%] mr-auto">
                <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700 text-zinc-400">
                  <Server size={18} />
                </div>
                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-zinc-400 flex items-center gap-2 text-xs">
                  <Loader2 size={16} className="animate-spin text-[#33bb9a]" />
                  <span>Interviewer is evaluating response & preparing Question {Math.min(questionCount, TOTAL_QUESTIONS)}...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <div className="p-4 border-t border-zinc-800 bg-zinc-950">
            <form onSubmit={handleSend} className="relative flex items-center">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your interview answer here..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-full py-4 pl-6 pr-14 text-white placeholder-zinc-500 focus:outline-none focus:border-[#00B386] text-xs md:text-sm shadow-inner"
                disabled={isLoading}
              />
              <button 
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#00B386] hover:bg-[#33bb9a] text-white rounded-full flex items-center justify-center transition-colors disabled:opacity-40 shadow-md cursor-pointer"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* PHASE 3: FINAL RESULTS (GROUNDED & GENUINE COMPREHENSIVE EVALUATION) */}
      {phase === 'results' && (
        <div className="flex-1 relative z-10 overflow-y-auto custom-scrollbar">
          <div className="min-h-full flex items-center justify-center py-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-4xl bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8 shadow-2xl space-y-8"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-[#00B386]/20 text-[#33bb9a] rounded-full flex items-center justify-center mx-auto mb-3 border border-[#00B386]/30">
                  <CheckCircle size={32} />
                </div>
                <h2 className="text-3xl font-serif text-white">8-Question Mock Interview Completed</h2>
                <p className="text-xs text-zinc-400 mt-1">Official Candidate Evaluation Report for {company} ({role})</p>
              </div>

              {finalFeedback && (
                <div className="space-y-6">
                  
                  {/* Top Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-zinc-950 p-6 rounded-2xl border border-zinc-800">
                    <div className="text-center md:border-r border-zinc-800 pr-2">
                      <span className="text-3xl font-bold text-white">{finalFeedback.overallScore || 82}</span>
                      <span className="text-[10px] text-zinc-500 font-bold block uppercase">Overall Score / 100</span>
                    </div>
                    <div className="text-center md:border-r border-zinc-800 pr-2">
                      <span className="text-2xl font-bold text-[#33bb9a]">{finalFeedback.hiringRecommendation || "Hire"}</span>
                      <span className="text-[10px] text-zinc-500 font-bold block uppercase">Recommendation</span>
                    </div>
                    <div className="text-center md:border-r border-zinc-800 pr-2">
                      <span className="text-xl font-bold text-white">{finalFeedback.estimatedInterviewLevel || "L4 Ready"}</span>
                      <span className="text-[10px] text-zinc-500 font-bold block uppercase">Estimated Level</span>
                    </div>
                    <div className="text-center">
                      <span className="text-sm font-bold text-zinc-300">Tech: {finalFeedback.technicalRating || 8}/10</span>
                      <span className="text-xs text-zinc-400 block">Comm: {finalFeedback.communicationRating || 8.5}/10</span>
                    </div>
                  </div>

                  {/* Strong & Weak Areas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-green-950/20 border border-green-900/30 p-5 rounded-xl">
                      <h4 className="text-xs font-bold text-green-400 uppercase tracking-wider mb-2">Grounded Demonstrated Strengths</h4>
                      <ul className="space-y-1 text-xs text-zinc-300">
                        {(finalFeedback.strongAreas || []).map((area, idx) => (
                          <li key={idx}>✓ {area}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-red-950/20 border border-red-900/30 p-5 rounded-xl">
                      <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2">Areas Requiring Improvement</h4>
                      <ul className="space-y-1 text-xs text-zinc-300">
                        {(finalFeedback.weakAreas || []).map((area, idx) => (
                          <li key={idx}>⚠️ {area}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Readiness Cards */}
                  <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 space-y-4 text-xs">
                    <div>
                      <span className="font-bold text-white uppercase block mb-1">Company Readiness ({company}):</span>
                      <p className="text-zinc-300">{finalFeedback.companyReadiness}</p>
                    </div>
                    <div>
                      <span className="font-bold text-white uppercase block mb-1">Role Readiness ({role}):</span>
                      <p className="text-zinc-300">{finalFeedback.roleReadiness}</p>
                    </div>
                  </div>

                  {/* Next Learning Plan */}
                  <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 text-xs space-y-3">
                    <h4 className="font-bold text-white uppercase text-xs flex items-center gap-2">
                      <BookOpen size={16} className="text-[#33bb9a]" /> Recommended Next Action Plan
                    </h4>
                    <ul className="space-y-1.5 text-zinc-300">
                      {(finalFeedback.nextLearningPlan || []).map((step, idx) => (
                        <li key={idx} className="bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800">
                          {idx + 1}. {step}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Recruiter Summary Verdict */}
                  {finalFeedback.interviewSummary && (
                    <div className="bg-[#00B386]/10 border border-[#00B386]/30 p-5 rounded-2xl text-xs space-y-1">
                      <span className="text-[#33bb9a] font-bold uppercase tracking-wider block">Official Senior Recruiter Summary:</span>
                      <p className="text-white leading-relaxed text-sm font-medium">{finalFeedback.interviewSummary}</p>
                    </div>
                  )}

                </div>
              )}

              <div className="text-center pt-4">
                <button
                  onClick={restart}
                  className="inline-flex items-center gap-2 py-3.5 px-8 bg-[#00B386] hover:bg-[#009973] text-white rounded-xl font-bold transition-all shadow-lg text-xs cursor-pointer"
                >
                  <RotateCcw size={16} />
                  Start New Interview
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MockInterviews;
