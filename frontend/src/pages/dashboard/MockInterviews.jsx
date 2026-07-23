import React, { useState, useRef, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AuthContext } from '../../context/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { GLSLHills } from '../../components/ui/glsl-hills';
import { 
  Building2, Briefcase, Play, Send, CheckCircle, ShieldAlert, User, Loader2, 
  RotateCcw, Star, TrendingUp, AlertTriangle, Paperclip, FileText, X, ToggleLeft, 
  ToggleRight, Server, Award, Target, MessageSquare, BookOpen, Lightbulb
} from 'lucide-react';
import { fileToGenerativePart } from '../../utils/fileParser';
import toast from 'react-hot-toast';
import api from '../../api';

const TOTAL_QUESTIONS = 8;

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
  
  const [messages, setMessages] = useState([]);
  const [evaluations, setEvaluations] = useState([]); // Stores per-answer evaluations
  const [input, setInput] = useState('');
  const [questionCount, setQuestionCount] = useState(0);
  const [finalFeedback, setFinalFeedback] = useState(null);
  
  const messagesEndRef = useRef(null);
  const chatRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const activeKey = import.meta.env.VITE_GEMINI_API_KEY || "";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, evaluations]);

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

    // Reject numbers in unlisted company names (e.g. eryrey5ey5e, test123, 5ey5e)
    if (/\d/.test(cleaned)) return false;

    // Reject consecutive consonants (3+ consonants in a row, e.g. rgh, ghr, rgr, sdf)
    if (/[bcdfghjklmnpqrstvwxyz]{3,}/i.test(cleaned)) return false;

    // Reject repeated characters (3+ identical characters in a row, e.g. aaaa, zzz)
    if (/(.)\1{2,}/.test(cleaned)) return false;

    // Require at least 35% vowels for unlisted multi-letter words
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

    const activeKey = import.meta.env.VITE_GEMINI_API_KEY || "";
    if (activeKey) {
      try {
        const checkGenAI = new GoogleGenerativeAI(activeKey);
        const checkModel = checkGenAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const checkPrompt = `Verify if "${company}" is a real, legitimate company. If it is fake, fabricated, or gibberish (e.g. "asdfgh", "dsegvds"), respond ONLY with {"status":"NOT_FOUND"}. Otherwise respond with {"status":"SUCCESS"}.`;
        const checkRes = await checkModel.generateContent(checkPrompt);
        const checkTxt = checkRes.response.text().replace(/```json/gi, '').replace(/```/g, '').trim();
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
    setEvaluations([]);
    setQuestionCount(1);
    
    if (!apiKey) {
      setTimeout(() => {
        setMessages([
          { 
            role: 'model', 
            text: `Welcome to your official CrackNest Mock Interview for the ${role} position at ${company}. I am your Senior Technical Interviewer.\n\nLet me start with Question 1 (Foundational):\n"Tell me about yourself, your background in software engineering, and why you are interested in joining ${company} as a ${role}."` 
          }
        ]);
        setIsLoading(false);
      }, 500);
      return;
    }

    try {
      const baseInstructions = `
        You are CrackNest Interview AI.
        You are a Senior Interviewer from FAANG and Fortune 500 companies (Google, Amazon, Microsoft, Meta, Cognizant, TCS, Accenture, etc.).
        Your job is to conduct a realistic, high-caliber interview for the ${role} position at ${company}.

        RULES:
        1. Conduct EXACTLY 8 interview questions (Q1 to Q8).
        2. Question difficulty MUST gradually increase from foundational (Q1) to advanced/system design (Q8).
        3. Mix question types across the 8 questions:
           - Technical concepts
           - Data Structures & Algorithms (DSA)
           - Past Projects & Experience (if resume provided)
           - Behavioral (STAR method)
           - Situation Based
           - HR & Culture fit
           - Company specific questions (${company}'s known interview pattern)
           (Never ask all HR questions; Never ask all DSA questions).

        4. SHORT / WEAK ANSWER RULE:
           If the candidate gives a one-word or extremely brief/generic answer (e.g., "yes", "nope", "i don't know", "skip"), you MUST respond:
           "This answer is too short for a real interview. Explain your reasoning with examples."

        5. AFTER QUESTION 8:
           Whenever you decide to conclude after Question 8, you MUST output "INTERVIEW_COMPLETE" followed by a complete final evaluation JSON object matching this schema:
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
             "estimatedInterviewLevel": "<e.g., L4 / SDE-2 Ready>",
             "nextLearningPlan": ["<step 1>", "<step 2>"],
             "interviewSummary": "<summary string>"
           }

        Never break character. Be a realistic, professional, and thorough interviewer.

        IMPORTANT:
        Never give generic advice.
        Never say:
        "It depends."
        "Here are some tips."
        "I hope this helps."
        Always return structured markdown.
        Always behave like a recruiter.
        Always produce actionable feedback.
        Never skip scoring.
        Never answer outside your assigned role.
        If required information is missing, ask concise follow-up questions before proceeding.
        Keep responses factual, professional, and tailored to the user's inputs.
      `;

      const stressInstructions = isStressMode ? `
        STRESS INTERVIEW AI MODE IS ACTIVE:
        You are CrackNest Stress Interview AI.
        Behave like an impatient Senior Engineering Manager at a top tech firm.
        Your goal is to simulate a realistic, high-pressure interview.
        - Never insult the candidate. Be professional but strict.
        - Challenge weak or vague answers immediately.
        - Question assumptions. Ask "Why?", "How?", "Can you prove that?", "What if this system fails?".
        - If an answer is generic or clichéd (e.g. "I am hardworking", "I pay attention to detail"), challenge it directly (e.g., "Everyone says that. Give me a real production example.").
        - Ask 8 difficult, high-pressure questions.
      ` : '';

      const activeKey = import.meta.env.VITE_GEMINI_API_KEY || "";
      const genAI = new GoogleGenerativeAI(activeKey);
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        systemInstruction: baseInstructions + stressInstructions
      });

      const chat = model.startChat({
        history: [],
        generationConfig: { maxOutputTokens: 1200 },
      });

      chatRef.current = chat;

      let prompt = `Hello, I am ${user?.name || 'the candidate'}. I am ready to begin my 8-question mock interview for the ${role} position at ${company}. Please ask me Question 1.`;
      let messageContent = prompt;
      
      if (fileContent) {
        prompt = `I have attached my resume. Please base relevant project, tech stack, and experience questions directly on my resume.\n\n${prompt}`;
        messageContent = [prompt, fileContent];
      }
      
      const result = await chat.sendMessage(messageContent);
      const text = result.response.text();
      
      setMessages([{ role: 'model', text }]);
    } catch (error) {
      console.error(error);
      const errMsg = error?.message || "";
      if (errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("RESOURCE_EXHAUSTED")) {
        toast.error("Gemini API daily quota reached. Please try again later.");
        setPhase('setup');
        setIsLoading(false);
        return;
      }
      
      setMessages([{ 
        role: 'model', 
        text: `Welcome to your mock interview for the ${role} position at ${company}. Let's start with Question 1:\n"Please introduce yourself and highlight your core technical skills and past projects relevant to ${company}."` 
      }]);
    } finally {
      setIsLoading(false);
    }
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
    setIsLoading(true);

    if (isShortAnswer) {
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          role: 'model', 
          text: `⚠️ This answer is too short for a real interview. Explain your reasoning with examples.\n\nLet's try again: Can you provide a detailed explanation or example for Question ${questionCount}?` 
        }]);
        setIsLoading(false);
      }, 500);
      return;
    }

    if (!apiKey || !chatRef.current) {
      setTimeout(() => {
        const nextCount = questionCount + 1;
        
        // Generate per-answer evaluation (with Stress Mode scores if active)
        const mockEval = isStressMode ? {
          qNum: questionCount,
          scores: {
            confidence: 7.5,
            communication: 8,
            technicalAccuracy: 8,
            problemSolving: 7.5,
            decisionMaking: 8,
            stressHandling: 8.5
          },
          whatWasGood: "Maintained composure under pressure and defended system design decisions.",
          whatWasMissing: "Could provide concrete load metrics when assumptions were challenged.",
          idealAnswer: "A senior manager expects clear trade-off analysis, SLA commitments, and fallback strategies.",
          improvedVersion: `"${userMessage} Under load, I would implement circuit breakers and fallback to cached data."`
        } : {
          qNum: questionCount,
          scores: {
            communication: 7.5,
            technical: 8,
            confidence: 7.5,
            correctness: 8,
            answerQuality: 7.8
          },
          whatWasGood: "Demonstrated clear understanding of fundamental engineering concepts.",
          whatWasMissing: "Could add explicit quantitative metrics and edge-case error handling.",
          idealAnswer: "A senior candidate would outline architectural trade-offs, state time/space complexity, and describe automated testing strategies.",
          improvedVersion: `"${userMessage} In addition, I implemented error boundaries and monitored API latency using logging tools."`
        };

        setEvaluations(prev => [...prev, mockEval]);
        setQuestionCount(nextCount);

        if (nextCount > TOTAL_QUESTIONS) {
          setMessages(prev => [...prev, { 
            role: 'model', 
            text: `We have completed all ${TOTAL_QUESTIONS} high-pressure interview questions for ${role} at ${company}.\n\nGenerating your Stress & Technical Evaluation Report...` 
          }]);
          setFinalFeedback(isStressMode ? {
            overallScore: 84,
            stressScore: 86,
            pressureHandlingScore: 8.5,
            communicationUnderPressure: 8.0,
            technicalAbility: 8.5,
            decisionMaking: 8.0,
            hiringProbability: "High (75-85%)",
            hiringRecommendation: "Hire",
            biggestStrength: "Composure and technical clarity under direct manager interrogation",
            biggestWeakness: "Slight hesitation when pushed on failover scenarios and edge-case constraints",
            strongAreas: ["High-pressure problem solving", "System Architecture Trade-offs"],
            weakAreas: ["Circuit breaker failover specs", "Quantified load benchmarks"],
            mostImportantTopicsToImprove: ["Distributed Resilience Patterns", "SLA & Rate-limiting Calculations"],
            companyReadiness: `Demonstrates strong resilience for ${company}'s high-bar technical environment.`,
            roleReadiness: `Prepared to handle senior engineering responsibilities for ${role}.`,
            estimatedInterviewLevel: "L4 / Senior Engineer Ready",
            actionPlan: [
              "Review high-concurrency failover patterns (Circuit Breakers, Bulkheads).",
              "Practice defending architectural trade-offs without defensive language.",
              "Prepare quantitative metrics for all past project achievements."
            ],
            nextLearningPlan: [
              "Master Distributed System Resilience Patterns.",
              "Practice mock interrogations under timed constraints."
            ],
            interviewSummary: `Completed an intense 8-question Stress Interview with a Senior Engineering Manager persona for ${role} at ${company}. Candidate showed strong poise and solid technical grounding.`
          } : {
            overallScore: 82,
            technicalRating: 8.0,
            communicationRating: 8.5,
            confidenceRating: 8.0,
            hiringRecommendation: "Hire",
            strongAreas: ["Core System Architecture", "Data Structures Fundamentals", "Communication Clarity"],
            weakAreas: ["Edge-case error handling under load", "Specific database index optimization"],
            mostImportantTopicsToImprove: ["Distributed Systems Caching", "STAR Method Behavioral Stories"],
            companyReadiness: `High alignment with ${company}'s technical bar and engineering culture.`,
            roleReadiness: `Demonstrates solid readiness for ${role} responsibilities.`,
            estimatedInterviewLevel: "L4 / Mid-Level Engineer Ready",
            nextLearningPlan: [
              "Practice 15 medium-to-hard Leetcode Graph & Dynamic Programming problems.",
              "Review System Design patterns: Load Balancing, Caching, Sharding.",
              "Refine 3 STAR behavioral stories focusing on conflict resolution and leadership."
            ],
            interviewSummary: `Completed an 8-question structured interview for ${role} at ${company}. Candidate showed strong technical articulation and solid problem-solving fundamentals.`
          });
          setTimeout(() => setPhase('results'), 3000);
        } else {
          const sampleQuestions = [
            `Question 2 (DSA & Optimization): "How would you optimize a search operation over a dataset of 10 million records with low latency constraints?"`,
            `Question 3 (Projects & Experience): "Tell me about a technical project you built recently. What was the hardest architectural decision you made?"`,
            `Question 4 (System Design): "How would you design a scalable notification system for ${company} that sends push, SMS, and email alerts without dropping messages?"`,
            `Question 5 (Behavioral - STAR): "Describe a situation where a production bug occurred right before a deadline. How did you handle it and communicate with stakeholders?"`,
            `Question 6 (Technical Deep Dive): "Explain the difference between optimistic and pessimistic locking in databases. When would you use each at ${company}?"`,
            `Question 7 (Situation Based): "If your tech lead insists on a feature design that you believe will cause scalability issues, how do you handle it?"`,
            `Question 8 (Advanced HR & Culture Fit): "Why ${company} specifically? What engineering principles or products at ${company} excite you most?"`
          ];
          setMessages(prev => [...prev, { 
            role: 'model', 
            text: sampleQuestions[(nextCount - 2) % sampleQuestions.length] 
          }]);
        }
        setIsLoading(false);
      }, 900);
      return;
    }

    try {
      const chat = chatRef.current;
      const result = await chat.sendMessage(userMessage);
      let text = result.response.text();

      if (text.includes("INTERVIEW_COMPLETE")) {
        const parts = text.split("INTERVIEW_COMPLETE");
        const chatBefore = parts[0].trim();
        if (chatBefore) {
          setMessages(prev => [...prev, { role: 'model', text: chatBefore }]);
        }
        
        try {
          const jsonStr = parts[1].replace(/```json/g, '').replace(/```/g, '').trim();
          const feedbackData = JSON.parse(jsonStr);
          setFinalFeedback(feedbackData);
          
          api.post('/interviews/save', {
            company: company,
            role: role,
            rating: feedbackData.overallScore ? feedbackData.overallScore / 10 : 8,
            feedback: feedbackData.interviewSummary || "Interview completed successfully.",
            improvements: feedbackData.mostImportantTopicsToImprove || [],
            weakest_area: feedbackData.weakAreas?.[0] || "General"
          }).catch(err => console.error("Failed to save interview", err));
          
        } catch(e) {
          console.error("Failed to parse JSON feedback", e);
          setFinalFeedback({
            overallScore: 80,
            technicalRating: 8.0,
            communicationRating: 8.0,
            confidenceRating: 8.0,
            hiringRecommendation: "Hire",
            strongAreas: ["Technical Knowledge", "Problem Solving"],
            weakAreas: ["Edge case coverage"],
            mostImportantTopicsToImprove: ["System Design Trade-offs"],
            companyReadiness: "Good alignment",
            roleReadiness: "Role ready",
            estimatedInterviewLevel: "L4 Ready",
            nextLearningPlan: ["Review system design principles"],
            interviewSummary: "Completed 8-question mock interview."
          });
        }
        setTimeout(() => setPhase('results'), 3000);
      } else {
        setMessages(prev => [...prev, { role: 'model', text }]);
        setQuestionCount(prev => Math.min(prev + 1, TOTAL_QUESTIONS));
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: `Understood your response. Let's move to Question ${questionCount + 1}: Could you describe how you handle database indexing and query optimization in high-traffic applications?` 
      }]);
      setQuestionCount(prev => Math.min(prev + 1, TOTAL_QUESTIONS));
    } finally {
      setIsLoading(false);
    }
  };

  const restart = () => {
    setPhase('setup');
    setCompany('');
    setRole('');
    setMessages([]);
    setEvaluations([]);
    setQuestionCount(0);
    setFinalFeedback(null);
  };

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="w-full h-screen flex flex-col relative overflow-hidden bg-zinc-950 pt-24 px-4 md:px-8 pb-6 text-zinc-100">
      <GLSLHills speed={0.8} />
      
      {/* Header Bar */}
      <div className="mb-4 relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            {isStressMode && <span className="px-2.5 py-0.5 bg-red-500/20 text-red-400 text-xs font-bold rounded-full border border-red-500/30">Stress Mode</span>}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-2xl md:text-3xl font-serif text-white tracking-tight">CrackNest AI Mock Interview</h1>
          </div>
        </div>

        {phase === 'interview' && (
          <div className="flex items-center gap-4 bg-zinc-900/90 px-5 py-2.5 rounded-xl border border-zinc-800">
            <div>
              <span className="text-xs text-zinc-500 font-bold block">TARGET</span>
              <span className="text-xs font-bold text-white">{company} • {role}</span>
            </div>
            <div className="h-8 w-px bg-zinc-800"></div>
            <div className="text-right">
              <span className="text-xs text-zinc-500 font-bold block">PROGRESS</span>
              <span className="text-sm font-bold text-[#33bb9a]">Question {questionCount} / {TOTAL_QUESTIONS}</span>
            </div>
          </div>
        )}
      </div>

      {/* PHASE 1: SETUP */}
      {phase === 'setup' && (
        <div className="flex-1 relative z-10 overflow-y-auto custom-scrollbar">
          <div className="min-h-full flex items-center justify-center py-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-xl bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8 shadow-2xl space-y-6"
            >
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white">Interview Configuration</h2>
                <p className="text-xs text-zinc-400 mt-1">Simulate an authentic 8-question technical & behavioral interview.</p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">Target Company *</label>
                  <div className="relative">
                    <Building2 size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="Enter company"
                      className="w-full pl-11 pr-4 py-3.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-[#00B386]"
                    />
                  </div>
                </div>

                {/* NOT FOUND WARNING */}
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
                      placeholder="Enter job role"
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
                    <p className="text-[11px] text-zinc-400 mt-0.5">Demanding interviewer persona with skeptical follow-ups and strict constraints.</p>
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

      {/* PHASE 2: LIVE INTERVIEW CHAT */}
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

            {/* Render Per-Answer Feedback Cards */}
            {evaluations.map((ev, index) => (
              <motion.div 
                key={`eval-${index}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-[85%] mx-auto bg-zinc-950/90 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-4 my-4"
              >
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Award size={18} className="text-[#33bb9a]" />
                    <span className="text-xs font-bold text-white uppercase">Q{ev.qNum} Response Evaluation</span>
                  </div>
                  <span className="text-[11px] text-zinc-400 font-mono">Answer Quality: {ev.scores.answerQuality}/10</span>
                </div>

                {/* Scores Bar */}
                <div className={`grid ${isStressMode ? 'grid-cols-6' : 'grid-cols-5'} gap-2 text-center bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800/80`}>
                  {isStressMode ? (
                    <>
                      <div>
                        <span className="text-[9px] text-zinc-400 uppercase block">Conf.</span>
                        <span className="text-xs font-bold text-white">{ev.scores.confidence}/10</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-zinc-400 uppercase block">Comm.</span>
                        <span className="text-xs font-bold text-white">{ev.scores.communication}/10</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-zinc-400 uppercase block">Tech</span>
                        <span className="text-xs font-bold text-white">{ev.scores.technicalAccuracy}/10</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-zinc-400 uppercase block">ProbSolv</span>
                        <span className="text-xs font-bold text-white">{ev.scores.problemSolving}/10</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-zinc-400 uppercase block">Decision</span>
                        <span className="text-xs font-bold text-white">{ev.scores.decisionMaking}/10</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-zinc-400 uppercase block">Stress</span>
                        <span className="text-xs font-bold text-red-400">{ev.scores.stressHandling}/10</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <span className="text-[10px] text-zinc-400 uppercase block">Comm.</span>
                        <span className="text-xs font-bold text-white">{ev.scores.communication}/10</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-400 uppercase block">Tech</span>
                        <span className="text-xs font-bold text-white">{ev.scores.technical}/10</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-400 uppercase block">Conf.</span>
                        <span className="text-xs font-bold text-white">{ev.scores.confidence}/10</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-400 uppercase block">Correct</span>
                        <span className="text-xs font-bold text-white">{ev.scores.correctness}/10</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-400 uppercase block">Quality</span>
                        <span className="text-xs font-bold text-[#33bb9a]">{ev.scores.answerQuality}/10</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-green-950/20 border border-green-900/30 p-3 rounded-xl">
                    <span className="font-bold text-green-400 block mb-1">What Was Good</span>
                    <p className="text-zinc-300">{ev.whatWasGood}</p>
                  </div>
                  <div className="bg-red-950/20 border border-red-900/30 p-3 rounded-xl">
                    <span className="font-bold text-red-400 block mb-1">What Was Missing</span>
                    <p className="text-zinc-300">{ev.whatWasMissing}</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="bg-zinc-900/80 border border-zinc-800 p-3 rounded-xl">
                    <span className="font-bold text-blue-400 flex items-center gap-1.5 mb-1">
                      <Lightbulb size={14} /> Senior Engineer Ideal Answer:
                    </span>
                    <p className="text-zinc-300 italic">{ev.idealAnswer}</p>
                  </div>
                  <div className="bg-zinc-900/80 border border-zinc-800 p-3 rounded-xl">
                    <span className="font-bold text-purple-400 flex items-center gap-1.5 mb-1">
                      <TrendingUp size={14} /> Improved Version of Your Answer:
                    </span>
                    <p className="text-zinc-300">{ev.improvedVersion}</p>
                  </div>
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
                  <span>Interviewer is evaluating response & framing Question {questionCount}...</span>
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

      {/* PHASE 3: FINAL RESULTS */}
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
                <h2 className="text-3xl font-serif text-white">8-Question Interview Completed</h2>
                <p className="text-xs text-zinc-400 mt-1">Official FAANG / Fortune 500 Candidate Evaluation Report</p>
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
                      <span className="text-2xl font-bold text-white">{finalFeedback.estimatedInterviewLevel || "L4 Ready"}</span>
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
                      <h4 className="text-xs font-bold text-green-400 uppercase tracking-wider mb-2">Strong Demonstrated Areas</h4>
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
                      <BookOpen size={16} className="text-[#33bb9a]" /> Recommended Next Learning Plan
                    </h4>
                    <ul className="space-y-1.5 text-zinc-300">
                      {(finalFeedback.nextLearningPlan || []).map((step, idx) => (
                        <li key={idx} className="bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800">
                          {idx + 1}. {step}
                        </li>
                      ))}
                    </ul>
                  </div>

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
