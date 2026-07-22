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

const Companies = () => {
  const [companyInput, setCompanyInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [roadmapData, setRoadmapData] = useState(null);
  const [notFoundCompany, setNotFoundCompany] = useState(null);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!companyInput.trim()) return;

    setIsLoading(true);

    if (!apiKey) {
      setTimeout(() => {
        setRoadmapData({
          status: "SUCCESS",
          company: companyInput,
          companyOverview: `${companyInput} is a global tech enterprise known for engineering excellence, system scalability, and rigorous multi-stage candidate evaluations.`,
          hiringPattern: "On-campus and Off-campus drives via Online Assessment followed by 3-4 rounds of technical & HR interviews.",
          eligibility: "B.Tech / B.E / M.Tech in CS, IT, ECE, or related engineering disciplines.",
          cgpaRequirement: "6.5+ CGPA or 60%+ throughout 10th, 12th, and Graduation.",
          skillsRequired: ["Data Structures & Algorithms", "System Architecture & LLD", "SQL & Database Indexing", "Object-Oriented Programming"],
          rounds: [
            { round: "Round 1: Online Assessment (OA)", details: "2 Coding Questions (Medium/Hard) + 20 Technical MCQs (DBMS, OS, Computer Networks) on HackerRank or TestGorilla (90 mins)." },
            { round: "Round 2: Technical Interview I (DSA & Coding)", details: "Live coding on shared whiteboard. Focus on Arrays, Graphs, Trees, and Time/Space complexity optimization (60 mins)." },
            { round: "Round 3: Technical Interview II (System Design & CS Core)", details: "Low-Level Design (LLD) / High-Level Design (HLD) evaluating database schema design, caching, and microservices architecture (60 mins)." },
            { round: "Round 4: Managerial & Behavioral Round", details: "Culture fit, leadership principles, past project deep-dive, and situational questions using the STAR framework (45 mins)." }
          ],
          oaPattern: "2 Coding Questions + 15-20 CS Fundamentals MCQs",
          codingDifficulty: "Medium to Hard",
          interviewDifficulty: "High (Rigorous multi-stage filter)",
          dsaTopics: ["Dynamic Programming", "Graphs (BFS/DFS)", "Trees & BST", "Heaps & Priority Queues", "Two Pointers / Sliding Window"],
          csSubjects: ["DBMS & SQL", "Operating Systems", "Computer Networks", "Object-Oriented Programming (OOPs)"],
          projectsExpected: ["Full-Stack Microservices App with Docker/CI-CD", "High-concurrency Real-Time System or Distributed Cache"],
          behavioralQuestions: [
            "Tell me about a time you had a technical disagreement with your team lead.",
            "Describe a complex production bug you resolved under tight deadlines."
          ],
          systemDesign: "Focus on URL Shortener, Notification Service, or Rate Limiter architecture with database sharding and Redis caching.",
          timeline: "3 to 4 Weeks from OA to Final Offer Letter",
          preparationRoadmap: {
            week1: "Master Core DSA (Arrays, Strings, Linked Lists, Trees) & Revise CS Core (DBMS, OS).",
            week2: "Solve Top 30 Company-Specific LeetCode Medium/Hard questions & practice System Design LLD.",
            week3: "Build a deployment-ready project & prepare 4 STAR method behavioral stories.",
            week4: "Conduct mock interviews, revise past interview experiences, and practice whiteboard coding."
          },
          resources: ["LeetCode Top Interview Questions", "NeetCode 150", "Grokking System Design", "GeeksforGeeks Company Archives"],
          leetcodeDifficulty: "70% Medium, 30% Hard",
          importantInterviewExperiences: [
            "Focus heavily on explaining time and space complexity before writing code.",
            "Expect follow-up questions asking to optimize memory usage without extra space."
          ],
          expectedSalary: "12 LPA - 35 LPA (Depending on tier and role level)",
          hiringTips: [
            "Always clarify edge cases with the interviewer before coding.",
            "Structure behavioral responses strictly with Situation, Task, Action, and Result."
          ],
          latestHiringTrend: "Increasing focus on Cloud Native development, System Scalability, and AI integration."
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
        You are CrackNest Company Roadmap AI.
        Generate hiring roadmap ONLY for real, existing companies.

        STRICT NON-EXISTENT COMPANY RULE:
        Verify if "${companyInput}" actually exists as a real company. If it is a fake, fabricated, or nonsensical string (like random letters, e.g. "asdfgh", "xyz123"), you MUST return EXACTLY this JSON object and NOTHING ELSE:
        {
          "status": "NOT_FOUND",
          "message": "Company not found. Please enter a valid company name."
        }

        For real companies, return EXACTLY ONE JSON object matching this schema:
        {
          "status": "SUCCESS",
          "company": "${companyInput}",
          "companyOverview": "<2-3 sentence overview of company culture and scale>",
          "hiringPattern": "<hiring pattern description>",
          "eligibility": "<eligibility criteria e.g. B.Tech / M.Tech in CS/IT>",
          "cgpaRequirement": "<CGPA or percentage criteria e.g. 6.5+ CGPA>",
          "skillsRequired": ["<skill 1>", "<skill 2>", "<skill 3>"],
          
          "rounds": [
            { "round": "Round 1: Online Assessment (OA)", "details": "<OA pattern, duration, questions>" },
            { "round": "Round 2: Technical Interview I (DSA & Coding)", "details": "<details>" },
            { "round": "Round 3: Technical Interview II (System Design & CS Core)", "details": "<details>" },
            { "round": "Round 4: HR & Behavioral Round", "details": "<details>" }
          ],
          
          "oaPattern": "<OA question distribution e.g., 2 Coding + 20 Aptitude / CS MCQs>",
          "codingDifficulty": "<e.g. Medium to Hard>",
          "interviewDifficulty": "<e.g. High (4 Rounds)>",
          "dsaTopics": ["<dsa topic 1>", "<dsa topic 2>", "<dsa topic 3>"],
          "csSubjects": ["DBMS", "Operating Systems", "Computer Networks", "OOPs"],
          "projectsExpected": ["<project 1>", "<project 2>"],
          "behavioralQuestions": ["<question 1>", "<question 2>"],
          "systemDesign": "<system design expectations if applicable>",
          "timeline": "<hiring duration e.g. 3-4 weeks>",
          
          "preparationRoadmap": {
            "week1": "<Week 1 focus>",
            "week2": "<Week 2 focus>",
            "week3": "<Week 3 focus>",
            "week4": "<Week 4 focus>"
          },
          
          "resources": ["<resource 1>", "<resource 2>"],
          "leetcodeDifficulty": "<e.g., 70% Medium, 30% Hard>",
          "importantInterviewExperiences": ["<insight 1>", "<insight 2>"],
          "expectedSalary": "<salary range e.g. 12 LPA - 35 LPA>",
          "hiringTips": ["<tip 1>", "<tip 2>"],
          "latestHiringTrend": "<latest hiring trend>"
        }

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

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      
      let cleanJson = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsedData = JSON.parse(cleanJson);
      
      if (parsedData.status === "NOT_FOUND") {
        setNotFoundCompany(companyInput);
        setRoadmapData(null);
        toast.error("Company not found. Please select a valid company below.");
        return;
      }
      
      setNotFoundCompany(null);
      setRoadmapData(parsedData);
    } catch (error) {
      console.error(error);
      toast.error(`Could not generate roadmap for ${companyInput}.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSuggestedCompany = (compName) => {
    setCompanyInput(compName);
    setNotFoundCompany(null);
    // Auto submit
    setTimeout(() => {
      const fakeEvent = { preventDefault: () => {} };
      // Trigger generate directly with compName
      setIsLoading(true);
      if (!apiKey) {
        setTimeout(() => {
          setRoadmapData({
            status: "SUCCESS",
            company: compName,
            companyOverview: `${compName} is a global tech leader known for engineering excellence, system scalability, and structured candidate evaluations.`,
            hiringPattern: "On-campus and Off-campus drives via Online Assessment followed by 3-4 technical & HR rounds.",
            eligibility: "B.Tech / B.E / M.Tech in CS, IT, ECE, or related engineering disciplines.",
            cgpaRequirement: "6.5+ CGPA or 60%+ throughout academics.",
            skillsRequired: ["Data Structures & Algorithms", "System Architecture & LLD", "SQL & Databases", "Object-Oriented Programming"],
            rounds: [
              { round: "Round 1: Online Assessment (OA)", details: "2 Coding Questions (Medium/Hard) + 20 Technical MCQs (DBMS, OS, Computer Networks)." },
              { round: "Round 2: Technical Interview I (DSA & Coding)", details: "Live coding on shared whiteboard focusing on Arrays, Graphs, Trees, and time complexity optimization." },
              { round: "Round 3: Technical Interview II (System Design & CS Core)", details: "Low-Level Design (LLD) / High-Level Design (HLD) evaluating database design and caching." },
              { round: "Round 4: Managerial & Behavioral Round", details: "Culture fit, leadership principles, past project deep-dive, and STAR method questions." }
            ],
            oaPattern: "2 Coding Questions + 20 CS Fundamentals MCQs",
            codingDifficulty: "Medium to Hard",
            interviewDifficulty: "High",
            dsaTopics: ["Dynamic Programming", "Graphs (BFS/DFS)", "Trees & BST", "Heaps", "Sliding Window"],
            csSubjects: ["DBMS & SQL", "Operating Systems", "Computer Networks", "OOPs"],
            projectsExpected: ["Full-Stack Microservices App", "High-concurrency Real-Time System"],
            behavioralQuestions: [
              "Tell me about a time you had a technical disagreement with your team lead.",
              "Describe a complex production bug you resolved under tight deadlines."
            ],
            systemDesign: "Focus on URL Shortener, Rate Limiter, or Notification Service architecture.",
            timeline: "3 to 4 Weeks",
            preparationRoadmap: {
              week1: "Master Core DSA & Revise CS Fundamentals (DBMS, OS).",
              week2: "Solve Top 30 Company-Specific LeetCode Medium/Hard questions.",
              week3: "Build a deployment-ready project & prepare 4 STAR behavioral stories.",
              week4: "Conduct mock interviews and review past company interview experiences."
            },
            resources: ["LeetCode Top Questions", "NeetCode 150", "Grokking System Design"],
            leetcodeDifficulty: "70% Medium, 30% Hard",
            importantInterviewExperiences: [
              "Always explain time and space complexity before writing code."
            ],
            expectedSalary: "12 LPA - 45 LPA",
            hiringTips: [
              "Clarify edge cases before writing code."
            ],
            latestHiringTrend: "Increasing focus on Cloud Native development and System Scalability."
          });
          setIsLoading(false);
        }, 600);
      }
    }, 50);
  };

  return (
    <BackgroundPaths>
      <div className="w-full min-h-screen flex flex-col pt-28 px-4 md:px-10 pb-20 relative z-10 text-zinc-100">
        
        {/* Header */}
        <div className="mb-10 text-center max-w-3xl mx-auto">
          <span className="px-3.5 py-1 bg-[#00B386]/10 text-[#33bb9a] text-xs font-bold uppercase rounded-full border border-[#00B386]/20">
            Real Company Hiring Intelligence
          </span>
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-serif text-white tracking-tight mt-3 mb-3"
          >
            CrackNest Company <span className="text-[#33bb9a] italic">Roadmaps</span>
          </motion.h1>
          <p className="text-zinc-400 text-sm md:text-base">
            Enter any real company to instantly generate hiring patterns, round breakdowns, DSA topics, salary ranges, and a 4-week preparation plan.
          </p>
        </div>

        {/* Input Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto w-full mb-12"
        >
          <form onSubmit={handleGenerate} className="relative flex items-center">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-zinc-500">
              <Building2 size={22} />
            </div>
            <input 
              type="text" 
              value={companyInput}
              onChange={(e) => setCompanyInput(e.target.value)}
              placeholder="Enter company"
              className="w-full bg-[#111] border border-zinc-800 rounded-2xl py-5 pl-14 pr-36 text-white placeholder-zinc-500 focus:outline-none focus:border-[#00B386] shadow-2xl text-base"
              disabled={isLoading}
            />
            <button 
              type="submit"
              disabled={!companyInput.trim() || isLoading}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-[calc(100%-24px)] px-6 bg-[#009973] hover:bg-[#00B386] text-white rounded-xl font-bold flex items-center justify-center transition-colors disabled:opacity-40 shadow-md cursor-pointer text-sm"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
              <span className="ml-2 hidden sm:inline">{isLoading ? 'Analyzing...' : 'Generate'}</span>
            </button>
          </form>
        </motion.div>

        {/* NOT FOUND CARD */}
        {notFoundCompany && !isLoading && !roadmapData && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto w-full bg-red-950/20 border border-red-900/40 rounded-2xl p-8 shadow-2xl text-center space-y-6 mb-12"
          >
            <div className="w-14 h-14 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
              <ShieldAlert size={28} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-1">Company Not Found</h3>
              <p className="text-xs text-zinc-400">
                "{notFoundCompany}" is not recognized in our verified hiring database. Please enter a valid company name.
              </p>
            </div>

            <div className="pt-2 border-t border-red-900/30">
              <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-3">Did you mean:</span>
              <div className="flex flex-wrap justify-center gap-2.5">
                {["Accenture", "Cognizant", "Capgemini", "Infosys", "Google", "Microsoft", "Adobe", "Amazon"].map((compName, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectSuggestedCompany(compName)}
                    className="px-4 py-2 bg-zinc-900 hover:bg-[#00B386] text-white hover:text-white text-xs font-semibold rounded-xl border border-zinc-700 hover:border-[#00B386] transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    <span>{compName}</span>
                    <ArrowRight size={12} />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Results */}
        <AnimatePresence mode="wait">
          {roadmapData && !isLoading && (
            <motion.div
              key={roadmapData.company}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-6xl mx-auto w-full space-y-8"
            >
              
              {/* TOP HEADER CARD */}
              <div className="bg-[#111] border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 bg-[#00B386]/10 rounded-2xl flex items-center justify-center text-[#33bb9a] border border-[#00B386]/20">
                      <Building2 size={30} />
                    </div>
                    <div>
                      <h2 className="text-3xl font-serif font-bold text-white">{roadmapData.company}</h2>
                      <span className="text-xs text-zinc-400 font-mono">Hiring Timeline: {roadmapData.timeline || '3-4 Weeks'}</span>
                    </div>
                  </div>
                  <p className="text-zinc-300 text-sm leading-relaxed pt-2">
                    {roadmapData.companyOverview}
                  </p>
                </div>

                {/* At-a-Glance Stats */}
                <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 space-y-3 text-xs">
                  <div className="flex justify-between border-b border-zinc-800/80 pb-2">
                    <span className="text-zinc-400">Expected Salary:</span>
                    <span className="text-[#33bb9a] font-bold">{roadmapData.expectedSalary}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-800/80 pb-2">
                    <span className="text-zinc-400">Coding Difficulty:</span>
                    <span className="text-yellow-400 font-bold">{roadmapData.codingDifficulty}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-800/80 pb-2">
                    <span className="text-zinc-400">CGPA Cut-off:</span>
                    <span className="text-white font-bold">{roadmapData.cgpaRequirement}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">LeetCode Benchmark:</span>
                    <span className="text-blue-400 font-bold">{roadmapData.leetcodeDifficulty}</span>
                  </div>
                </div>
              </div>

              {/* MAIN CONTENT GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left 2 Columns: Interview Rounds & 4-Week Roadmap */}
                <div className="lg:col-span-2 space-y-8">
                  
                  {/* Interview Rounds */}
                  <div className="bg-[#111] border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                      <ListChecks size={22} className="text-[#33bb9a]" />
                      Interview Rounds & OA Pattern
                    </h3>
                    
                    <div className="mb-6 bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-xs">
                      <span className="font-bold text-white uppercase block mb-1">Online Assessment (OA) Pattern:</span>
                      <p className="text-zinc-300">{roadmapData.oaPattern}</p>
                    </div>

                    <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-zinc-800 before:to-transparent">
                      {(roadmapData.rounds || []).map((step, index) => (
                        <div key={index} className="relative flex items-start group">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#111] bg-zinc-900 text-[#33bb9a] shadow shrink-0 z-10">
                            <span className="text-xs font-bold">{index + 1}</span>
                          </div>
                          <div className="ml-5 w-full p-5 rounded-xl border border-zinc-800 bg-zinc-950 hover:border-zinc-700 transition-colors shadow-sm">
                            <h4 className="font-bold text-white text-base mb-1.5">{step.round}</h4>
                            <p className="text-zinc-400 text-xs leading-relaxed">{step.details}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 4-Week Preparation Roadmap */}
                  <div className="bg-[#111] border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                      <Calendar size={22} className="text-blue-400" />
                      4-Week Actionable Preparation Plan
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(roadmapData.preparationRoadmap || {}).map(([weekKey, plan]) => (
                        <div key={weekKey} className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 space-y-2">
                          <span className="px-2.5 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase rounded-md border border-blue-500/20">
                            {weekKey.replace(/([A-Z])/g, ' $1')}
                          </span>
                          <p className="text-xs text-zinc-300 leading-relaxed pt-1">{plan}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Right Column: Topics, CS Core, Behavioral & Tips */}
                <div className="space-y-6">
                  
                  {/* Must-Know DSA Topics */}
                  <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
                    <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                      <Code size={18} className="text-[#33bb9a]" />
                      High-Frequency DSA Topics
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {(roadmapData.dsaTopics || []).map((topic, idx) => (
                        <span key={idx} className="px-3 py-1 bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs rounded-lg font-medium">
                          ⚡ {topic}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* CS Fundamentals & System Design */}
                  <div className="bg-[#111] border border-white/10 rounded-2xl p-6 space-y-4">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <BookOpen size={18} className="text-purple-400" />
                      CS Core & System Design
                    </h3>
                    <div className="text-xs space-y-2">
                      <span className="font-bold text-zinc-400 uppercase block">Core Subjects:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {(roadmapData.csSubjects || []).map((sub, idx) => (
                          <span key={idx} className="px-2.5 py-1 bg-purple-500/10 text-purple-300 rounded-md border border-purple-500/20">
                            {sub}
                          </span>
                        ))}
                      </div>
                    </div>
                    {roadmapData.systemDesign && (
                      <div className="text-xs pt-2 border-t border-zinc-800">
                        <span className="font-bold text-zinc-400 uppercase block mb-1">System Design Expectation:</span>
                        <p className="text-zinc-300">{roadmapData.systemDesign}</p>
                      </div>
                    )}
                  </div>

                  {/* Behavioral & Hiring Tips */}
                  <div className="bg-[#111] border border-white/10 rounded-2xl p-6 space-y-4">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Lightbulb size={18} className="text-yellow-400" />
                      Hiring Tips & Culture Fit
                    </h3>
                    <ul className="space-y-2 text-xs text-zinc-300">
                      {(roadmapData.hiringTips || []).map((tip, idx) => (
                        <li key={idx} className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 flex items-start gap-2">
                          <span className="text-yellow-400">💡</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

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
