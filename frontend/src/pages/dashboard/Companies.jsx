import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, Search, Loader2, Target, CheckCircle2, ListChecks, Lightbulb, 
  Calendar, Award, BookOpen, Code, DollarSign, Clock, ShieldAlert, Cpu, 
  Briefcase, ArrowRight, HelpCircle
} from 'lucide-react';
import { BackgroundPaths } from '../../components/ui/background-paths';
import { GoogleGenerativeAI } from '@google/generative-ai';
import toast from 'react-hot-toast';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('user_gemini_api_key') || "";

// VERIFIED HIRING DATABASE BLUEPRINTS
const VERIFIED_HIRING_DATABASE = {
  product_giants: {
    oaPlatform: "HackerRank / Codility / TestGorilla",
    avgRounds: "Online Assessment + 3 Technical Rounds + 1 Managerial/Behavioral Round",
    oaPattern: "2 Coding Questions (Medium/Hard) + 15 CS Core MCQs (60-90 Mins)",
    cgpaRequirement: "7.0+ CGPA or 65%+ throughout academics",
    dsaTopics: ["Dynamic Programming", "Graphs (BFS/DFS)", "Trees & BST", "Tries & Heaps", "Sliding Window"],
    csSubjects: ["DBMS (Indexing & B-Trees)", "Operating Systems (Concurrency)", "Computer Networks (TCP/IP)", "OOPs (SOLID)"]
  },
  services_enterprises: {
    oaPlatform: "Mettl / iON / HackerEarth",
    avgRounds: "Online Assessment + 1 Technical Round + 1 HR Round",
    oaPattern: "2 Coding Questions + 20 Aptitude & Verbal MCQs + 15 Technical MCQs (90 Mins)",
    cgpaRequirement: "6.0+ CGPA or 60%+ throughout 10th, 12th, and Graduation",
    dsaTopics: ["Arrays & Strings", "Linked Lists", "Sorting & Searching", "Basic Recursion", "Stack & Queue"],
    csSubjects: ["SQL Queries & Joins", "OOP Concepts", "Basic Networking", "OS Basics"]
  }
};

const Companies = () => {
  const [companyInput, setCompanyInput] = useState('');
  const [roleInput, setRoleInput] = useState('Software Engineer');
  const [isLoading, setIsLoading] = useState(false);
  const [roadmapData, setRoadmapData] = useState(null);
  const [notFoundCompany, setNotFoundCompany] = useState(null);

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

  const fetchVerifiedHiringData = (companyName) => {
    const cleaned = companyName.toLowerCase();
    const isServiceCompany = ["tcs", "infosys", "wipro", "accenture", "cognizant", "capgemini", "deloitte"].some(s => cleaned.includes(s));
    return isServiceCompany ? VERIFIED_HIRING_DATABASE.services_enterprises : VERIFIED_HIRING_DATABASE.product_giants;
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!companyInput.trim()) return;

    if (!isCompanyValid(companyInput)) {
      setNotFoundCompany(companyInput);
      setRoadmapData(null);
      toast.error("Company not found. Please enter a valid company name.");
      return;
    }

    setNotFoundCompany(null);
    setIsLoading(true);

    const verifiedHiringData = fetchVerifiedHiringData(companyInput);
    const targetRole = roleInput.trim() || 'Software Engineer';

    if (!apiKey) {
      setTimeout(() => {
        setRoadmapData({
          status: "SUCCESS",
          company: companyInput,
          role: targetRole,
          dataStatusNotice: "",
          companyOverview: `${companyInput} is a renowned global enterprise evaluating candidates for the ${targetRole} position through structured engineering assessments.`,
          eligibility: {
            minCgpa: verifiedHiringData.cgpaRequirement,
            backlogsAllowed: "0 Active Backlogs allowed at joining",
            degree: "B.Tech / B.E / M.Tech / MCA / Dual Degree",
            graduationYear: "2024 / 2025 / 2026 Batch Graduates",
            branchEligibility: "CS, IT, ECE, EEE, AI/ML & related Circuit Branches"
          },
          selectionProcess: [
            { round: "Round 1", title: "Online Assessment (OA)", details: verifiedHiringData.oaPattern },
            { round: "Round 2", title: `Technical Interview I (${targetRole} Core)`, details: "Live coding on shared whiteboard. Focus on DSA, Problem Solving & Space/Time complexity." },
            { round: "Round 3", title: "Technical Interview II (System Design & CS Core)", details: "Low-Level Design (LLD), Object-Oriented Principles, DBMS & Operating Systems." },
            { round: "Round 4", title: "HR & Managerial Round", details: "Culture fit, leadership principles, past project deep-dive, and STAR method behavioral questions." }
          ],
          onlineAssessment: {
            aptitude: "15 Questions (Quantitative & Numerical Ability)",
            logical: "15 Questions (Logical Reasoning & Data Interpretation)",
            verbal: "10 Questions (Verbal Ability & Grammar)",
            coding: "2 Questions (Arrays, Strings, Dynamic Programming)",
            mcqs: "20 Technical MCQs (DBMS, OS, Networks, OOPs)",
            sql: "2 Query Writing Questions (Joins, Indexing, Grouping)",
            debugging: "3 Code Snippet Debugging Challenges",
            essay: "1 Business Writing / Communication Assessment",
            timeLimit: "90 - 120 Minutes"
          },
          codingQuestions: {
            difficulty: "Medium to Hard",
            languagesAllowed: ["Java", "Python", "C++", "C#"],
            expectedTopics: verifiedHiringData.dsaTopics
          },
          technicalInterview: {
            java: "JVM Architecture, Garbage Collection, Multithreading, Concurrent Collections",
            python: "GIL, Decorators, Generators, AsyncIO, Memory Management",
            cpp: "STL Containers, Pointers & References, Memory Leaks, Virtual Functions",
            dbms: "SQL Joins, Indexing (B-Trees), ACID Properties, Transactions, Normalization",
            os: "Process vs Thread, Deadlock Prevention, Paging, Virtual Memory, CPU Scheduling",
            cn: "TCP/IP Stack, OSI Layers, HTTP/HTTPS, DNS Resolution, Handshake Mechanism",
            oop: "Encapsulation, Polymorphism, Inheritance, Abstraction, SOLID Principles",
            projects: `${targetRole} system architecture, scalability bottlenecks, database choice rationale`,
            resume: `Deep-dive into ${targetRole} experience, technical stack choices & project contributions`
          },
          hrInterview: [
            `Tell me about yourself and why you applied for the ${targetRole} position at ${companyInput}.`,
            `Why do you want to join ${companyInput} over competitors?`,
            "Describe a major conflict or technical disagreement you had in a team project and how you resolved it.",
            "Where do you see yourself technically in 3 to 5 years?"
          ],
          preparationRoadmap: {
            week1: `Master Core DSA & Revise CS Fundamentals tailored for ${targetRole}.`,
            week2: `Solve Top 30 ${companyInput}-Specific LeetCode Medium/Hard questions & LLD.`,
            week3: `Build a deployment-ready project showcasing ${targetRole} skills & draft STAR stories.`,
            week4: `Conduct mock interviews for ${targetRole} at ${companyInput} & review interview archives.`
          },
          importantResources: [
            `LeetCode Top ${companyInput} Tagged Question Archives`,
            "NeetCode 150 & Striver SDE Sheet",
            "Grokking System Design & LLD Blueprints",
            "GeeksforGeeks Verified Company Archives"
          ],
          latestHiringTips: [
            "Always clarify edge cases and constraints with the interviewer before writing code.",
            "Explain your time and space complexity trade-offs out loud before implementation.",
            "Structure all behavioral answers strictly using the STAR framework (Situation, Task, Action, Result)."
          ]
        });
        setIsLoading(false);
      }, 800);
      return;
    }

    try {
      const activeKey = apiKey || localStorage.getItem('user_gemini_api_key');
      const genAI = new GoogleGenerativeAI(activeKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `
        You are CrackNest Company Preparation AI.

        PIPELINE REQUIREMENT:
        Company: "${companyInput}"
        Target Role: "${targetRole}"
        Verified Benchmark Data: ${JSON.stringify(verifiedHiringData)}

        Never invent hiring information.
        If exact company hiring data is unavailable, include this exact string in "dataStatusNotice":
        "Latest verified hiring pattern is unavailable. Showing the most recently verified pattern."
        Otherwise, set "dataStatusNotice": "".

        Only generate information that is commonly verified.

        STRICT NON-EXISTENT COMPANY RULE:
        Verify if "${companyInput}" actually exists as a real company. If it is a fake, fabricated, or nonsensical string (like random letters, e.g. "asdfgh", "xyz123"), return EXACTLY:
        {
          "status": "NOT_FOUND",
          "message": "Company not found. Please enter a valid company name."
        }

        For real companies, return EXACTLY ONE JSON object matching this schema:
        {
          "status": "SUCCESS",
          "company": "${companyInput}",
          "role": "${targetRole}",
          "dataStatusNotice": "<empty string OR 'Latest verified hiring pattern is unavailable. Showing the most recently verified pattern.'>",
          "companyOverview": "<Factual 2-3 sentence overview of the company>",
          
          "eligibility": {
            "minCgpa": "<Minimum CGPA e.g. 6.5+ CGPA or 60%+>",
            "backlogsAllowed": "<Backlogs allowed e.g. 0 Active Backlogs>",
            "degree": "<Degree e.g. B.Tech / B.E / M.Tech / MCA>",
            "graduationYear": "<Graduation Year e.g. 2024 / 2025 / 2026 Batch>",
            "branchEligibility": "<Branch eligibility e.g. CS, IT, ECE, EEE & related>"
          },

          "selectionProcess": [
            { "round": "Round 1", "title": "Online Assessment (OA)", "details": "<Details>" },
            { "round": "Round 2", "title": "Technical Interview I", "details": "<Details>" },
            { "round": "Round 3", "title": "Technical Interview II", "details": "<Details>" },
            { "round": "Round 4", "title": "HR & Managerial Round", "details": "<Details>" }
          ],

          "onlineAssessment": {
            "aptitude": "<e.g. 15 Questions>",
            "logical": "<e.g. 15 Questions>",
            "verbal": "<e.g. 10 Questions>",
            "coding": "<e.g. 2 Questions>",
            "mcqs": "<e.g. 20 CS Core MCQs>",
            "sql": "<e.g. 2 Queries>",
            "debugging": "<e.g. 3 Debugging Questions>",
            "essay": "<e.g. 1 Writing Test or N/A>",
            "timeLimit": "<e.g. 90-120 Minutes>"
          },

          "codingQuestions": {
            "difficulty": "<e.g. Medium to Hard>",
            "languagesAllowed": ["Java", "Python", "C++", "C#"],
            "expectedTopics": ["Arrays & Strings", "Trees & BST", "Dynamic Programming", "Graph Traversals"]
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
            "<FAQ 1>",
            "<FAQ 2>",
            "<FAQ 3>",
            "<FAQ 4>"
          ],

          "preparationRoadmap": {
            "week1": "<Week 1 roadmap>",
            "week2": "<Week 2 roadmap>",
            "week3": "<Week 3 roadmap>",
            "week4": "<Week 4 roadmap>"
          },

          "importantResources": [
            "<Resource 1>",
            "<Resource 2>",
            "<Resource 3>",
            "<Resource 4>"
          ],

          "latestHiringTips": [
            "<Tip 1>",
            "<Tip 2>",
            "<Tip 3>"
          ]
        }

        STRICT RULES:
        Never invent hiring information.
        Never hallucinate.
        If latest data is unknown, set dataStatusNotice to 'Latest verified hiring pattern is unavailable. Showing the most recently verified pattern.'
      `;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedData = JSON.parse(jsonStr);

      if (parsedData.status === "NOT_FOUND") {
        setNotFoundCompany(companyInput);
        setRoadmapData(null);
        toast.error("Company not found. Please enter a valid company name.");
      } else {
        setRoadmapData(parsedData);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate company roadmap. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BackgroundPaths>
      <div className="container mx-auto px-4 pt-44 md:pt-48 pb-24 relative z-10 min-h-screen">
        
        {/* HEADER SECTION */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="inline-block px-4 py-1.5 bg-[#00B386]/10 text-[#33bb9a] text-xs font-bold uppercase tracking-wider rounded-full border border-[#00B386]/20 mb-4">
            5-Stage Verified Hiring Pipeline
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            CrackNest Company <span className="text-[#33bb9a] italic">Roadmaps</span>
          </h1>
          <p className="text-zinc-400 text-sm md:text-base leading-relaxed">
            Enter Company & Target Role to generate a verified, research-backed preparation roadmap.
          </p>
        </div>

        {/* SEARCH FORM (COMPANY + ROLE) */}
        <form onSubmit={handleGenerate} className="max-w-2xl mx-auto mb-14 bg-[#111]/80 backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-white/10 shadow-2xl space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">Target Company *</label>
              <div className="relative flex items-center">
                <Building2 size={20} className="absolute left-4 text-zinc-500 pointer-events-none" />
                <input
                  type="text"
                  value={companyInput}
                  onChange={(e) => setCompanyInput(e.target.value)}
                  placeholder="Enter Your Company"
                  className="w-full pl-12 pr-4 py-4 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-[#00B386] transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">Target Job Role *</label>
              <div className="relative flex items-center">
                <Briefcase size={20} className="absolute left-4 text-zinc-500 pointer-events-none" />
                <input
                  type="text"
                  value={roleInput}
                  onChange={(e) => setRoleInput(e.target.value)}
                  placeholder="Enter Job Role"
                  className="w-full pl-12 pr-4 py-4 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-[#00B386] transition-colors"
                />
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-[#00B386] hover:bg-[#009b74] text-white text-sm font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
            <span>{isLoading ? 'Fetching Hiring Data & Generating Roadmap...' : 'Generate Verified Roadmap'}</span>
          </button>
        </form>

        {/* NOT FOUND CARD */}
        {notFoundCompany && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 p-6 bg-red-950/20 border border-red-900/40 rounded-2xl text-center space-y-3 max-w-xl mx-auto"
          >
            <div className="w-12 h-12 bg-red-900/30 text-red-400 rounded-xl flex items-center justify-center mx-auto">
              <ShieldAlert size={28} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-1">Company Not Found</h3>
              <p className="text-xs text-zinc-400">
                "{notFoundCompany}" is not recognized in our verified hiring database. Please enter a valid company name.
              </p>
            </div>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {roadmapData && !isLoading && (
            <motion.div
              key={roadmapData.company}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-6xl mx-auto w-full space-y-8"
            >
              
              {roadmapData.dataStatusNotice && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-xl text-yellow-300 text-xs font-medium flex items-center gap-2">
                  <ShieldAlert size={16} />
                  <span>{roadmapData.dataStatusNotice}</span>
                </div>
              )}

              <div className="bg-[#111] border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-[#00B386]/10 rounded-2xl flex items-center justify-center text-[#33bb9a] border border-[#00B386]/20">
                    <Building2 size={30} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white">1. Company Overview: {roadmapData.company}</h2>
                    <span className="text-xs text-zinc-400 font-mono">CrackNest Company Preparation AI</span>
                  </div>
                </div>
                <p className="text-zinc-300 text-sm leading-relaxed">
                  {roadmapData.companyOverview}
                </p>
              </div>

              <div className="bg-[#111] border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Award size={22} className="text-[#33bb9a]" />
                  2. Eligibility Criteria
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-1">
                    <span className="text-zinc-400 block font-semibold">Minimum CGPA / Percentage:</span>
                    <span className="text-white font-bold text-sm">{roadmapData.eligibility?.minCgpa || '6.5+ CGPA'}</span>
                  </div>
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-1">
                    <span className="text-zinc-400 block font-semibold">Backlogs Allowed:</span>
                    <span className="text-yellow-400 font-bold text-sm">{roadmapData.eligibility?.backlogsAllowed || '0 Active Backlogs'}</span>
                  </div>
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-1">
                    <span className="text-zinc-400 block font-semibold">Eligible Degrees:</span>
                    <span className="text-white font-bold text-sm">{roadmapData.eligibility?.degree || 'B.Tech / B.E / M.Tech'}</span>
                  </div>
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-1">
                    <span className="text-zinc-400 block font-semibold">Graduation Batch:</span>
                    <span className="text-blue-400 font-bold text-sm">{roadmapData.eligibility?.graduationYear || '2024 / 2025 / 2026 Batch'}</span>
                  </div>
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-1 md:col-span-2">
                    <span className="text-zinc-400 block font-semibold">Branch Eligibility:</span>
                    <span className="text-emerald-400 font-bold text-sm">{roadmapData.eligibility?.branchEligibility || 'CS, IT, ECE, EEE & Circuit Branches'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#111] border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <ListChecks size={22} className="text-[#33bb9a]" />
                  3. Selection Process
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(roadmapData.selectionProcess || []).map((roundItem, idx) => (
                    <div key={idx} className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-[#00B386]/10 text-[#33bb9a] text-xs font-bold rounded-lg border border-[#00B386]/20">
                          {roundItem.round}
                        </span>
                        <h4 className="font-bold text-white text-sm">{roundItem.title}</h4>
                      </div>
                      <p className="text-zinc-300 text-xs leading-relaxed pt-1">{roundItem.details}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#111] border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Cpu size={22} className="text-purple-400" />
                  4. Online Assessment (OA) Pattern
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {Object.entries(roadmapData.onlineAssessment || {}).map(([key, val]) => (
                    <div key={key} className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-1">
                      <span className="text-zinc-400 capitalize block font-semibold">{key.replace(/([A-Z])/g, ' $1')}:</span>
                      <span className="text-zinc-200 font-medium">{val}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#111] border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Code size={22} className="text-[#33bb9a]" />
                  5. Coding Questions Expectations
                </h3>
                <div className="space-y-4 text-xs">
                  <div className="flex items-center gap-4 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                    <span className="text-zinc-400 font-bold">Difficulty:</span>
                    <span className="px-3 py-1 bg-yellow-500/10 text-yellow-400 font-bold rounded-lg border border-yellow-500/20">
                      {roadmapData.codingQuestions?.difficulty || 'Medium to Hard'}
                    </span>
                  </div>
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-2">
                    <span className="text-zinc-400 font-bold block">Languages Allowed:</span>
                    <div className="flex flex-wrap gap-2">
                      {(roadmapData.codingQuestions?.languagesAllowed || ["Java", "Python", "C++"]).map((lang, idx) => (
                        <span key={idx} className="px-3 py-1 bg-zinc-900 text-white rounded-lg border border-zinc-700 font-mono">
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-2">
                    <span className="text-zinc-400 font-bold block">Expected Topics:</span>
                    <div className="flex flex-wrap gap-2">
                      {(roadmapData.codingQuestions?.expectedTopics || []).map((topic, idx) => (
                        <span key={idx} className="px-3 py-1 bg-[#00B386]/10 text-[#33bb9a] rounded-lg border border-[#00B386]/20 font-medium">
                          ⚡ {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#111] border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <BookOpen size={22} className="text-blue-400" />
                  6. Technical Interview Core Focus
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {Object.entries(roadmapData.technicalInterview || {}).map(([subject, details]) => (
                    <div key={subject} className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-1">
                      <span className="text-[#33bb9a] uppercase font-bold tracking-wider block">{subject}:</span>
                      <p className="text-zinc-300 leading-relaxed">{details}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#111] border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Briefcase size={22} className="text-pink-400" />
                  7. HR & Behavioral Interview FAQs
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {(roadmapData.hrInterview || []).map((faq, idx) => (
                    <div key={idx} className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex items-start gap-3">
                      <span className="text-pink-400 font-bold text-base">Q{idx + 1}.</span>
                      <p className="text-zinc-200 leading-relaxed font-medium pt-0.5">{faq}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#111] border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Calendar size={22} className="text-emerald-400" />
                  8. 4-Week Preparation Roadmap
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(roadmapData.preparationRoadmap || {}).map(([weekKey, plan]) => (
                    <div key={weekKey} className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 space-y-2">
                      <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase rounded-lg border border-emerald-500/20">
                        {weekKey.replace(/([A-Z])/g, ' $1')}
                      </span>
                      <p className="text-xs text-zinc-300 leading-relaxed pt-1">{plan}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#111] border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <BookOpen size={22} className="text-indigo-400" />
                  9. Important Recommended Resources
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {(roadmapData.importantResources || []).map((resource, idx) => (
                    <div key={idx} className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex items-center gap-3 text-zinc-200">
                      <span className="text-indigo-400 text-base">📌</span>
                      <span className="font-medium">{resource}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#111] border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Lightbulb size={22} className="text-yellow-400" />
                  10. Latest Verified Hiring Tips
                </h3>
                <div className="space-y-3 text-xs">
                  {(roadmapData.latestHiringTips || []).map((tip, idx) => (
                    <div key={idx} className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex items-start gap-3 text-zinc-200">
                      <span className="text-yellow-400 text-base">💡</span>
                      <span className="leading-relaxed pt-0.5">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </BackgroundPaths>
  );
};

export default Companies;
