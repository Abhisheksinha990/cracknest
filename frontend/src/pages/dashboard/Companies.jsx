import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Search, Loader2, Target, CheckCircle2, ListChecks, Lightbulb } from 'lucide-react';
import { BackgroundPaths } from '../../components/ui/background-paths';
import { GoogleGenerativeAI } from '@google/generative-ai';
import toast from 'react-hot-toast';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

const Companies = () => {
  const [companyInput, setCompanyInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [roadmapData, setRoadmapData] = useState(null);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!companyInput.trim()) return;

    if (!apiKey) {
      setTimeout(() => {
        setRoadmapData({
          company: companyInput,
          description: `${companyInput} is known for technical rigor, software architecture standards, and culture-fit assessments.`,
          roadmap: [
            { round: "Round 1: Technical Screen & Coding Assessment", details: "2-3 coding problems covering Data Structures (Arrays, Strings, Trees) and basic time/space complexity analysis." },
            { round: "Round 2: System Design & Architecture", details: "Low-Level (LLD) or High-Level System Design (HLD) evaluating scalability, microservices, and database selection." },
            { round: "Round 3: Technical Deep Dive & Past Projects", details: "In-depth review of your technical decisions, trade-offs, and past engineering accomplishments." },
            { round: "Round 4: Behavioral & Culture Fit", details: "Leadership principles and situational questions structured around the STAR method." }
          ],
          preparation: [
            "Practice medium to hard Leetcode problems focusing on optimal time complexity.",
            "Review system design patterns like load balancing, caching strategies, and database sharding.",
            "Prepare 3-4 structured stories using the STAR method for behavioral questions."
          ]
        });
        setIsLoading(false);
      }, 500);
      return;
    }

    setIsLoading(true);
    setRoadmapData(null);

    try {
      const activeKey = apiKey || localStorage.getItem('user_gemini_api_key');
      const genAI = new GoogleGenerativeAI(activeKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `You are an expert technical recruiter and career coach. I need a comprehensive hiring roadmap and preparation strategy for interviewing at ${companyInput}.
      FIRST, verify if the company "${companyInput}" actually exists and is a real entity. If it is a fake, fabricated, or nonsensical string (like random letters), you MUST return EXACTLY this JSON object and nothing else: {"error": "Company does not exist"}
      If the company does exist, base your roadmap strictly on real-world, factual research about their hiring process. Do not hallucinate or guess.
      Return the response strictly as a JSON object with this exact structure (do NOT include any markdown blocks, just the raw JSON object):
      {
        "company": "Exact name of the company",
        "description": "A 1-2 sentence description of the company and its hiring culture.",
        "roadmap": [
          { "round": "Name of the Round (e.g., Round 1: Online Assessment)", "details": "Detailed description of what to expect, types of questions, and duration." }
        ],
        "preparation": [
          "Actionable tip 1",
          "Actionable tip 2"
        ]
      }`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      
      // Clean up the JSON if it has markdown formatting
      let cleanJson = text;
      if (text.includes('```json')) {
        cleanJson = text.split('```json')[1].split('```')[0].trim();
      } else if (text.includes('```')) {
        cleanJson = text.split('```')[1].split('```')[0].trim();
      }

      const parsedData = JSON.parse(cleanJson);
      
      if (parsedData.error) {
        toast.error(parsedData.error);
        return;
      }
      
      setRoadmapData(parsedData);
    } catch (error) {
      console.error(error);
      toast.error(`Failed to generate roadmap for ${companyInput}.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BackgroundPaths>
      <div className="w-full min-h-screen flex flex-col pt-32 px-6 md:px-12 pb-20 relative z-10">
        <div className="mb-12 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-serif text-white tracking-tight mb-4"
          >
            Dynamic Company <span className="text-[#33bb9a] italic">Roadmaps</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-zinc-400 text-lg max-w-2xl mx-auto"
          >
            Enter any company name to instantly generate its typical hiring process and an expert preparation strategy using AI.
          </motion.p>
        </div>

        {/* Input Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-2xl mx-auto w-full mb-16"
        >
          <form onSubmit={handleGenerate} className="relative flex items-center">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <Building2 size={20} className="text-zinc-500" />
            </div>
            <input 
              type="text" 
              value={companyInput}
              onChange={(e) => setCompanyInput(e.target.value)}
              placeholder="Enter your company"
              className="w-full bg-[#111] border border-zinc-700/80 rounded-2xl py-5 pl-14 pr-32 text-white placeholder-zinc-500 focus:outline-none focus:border-[#00B386] focus:ring-1 focus:ring-[#00B386] shadow-2xl transition-all text-lg"
              disabled={isLoading}
            />
            <button 
              type="submit"
              disabled={!companyInput.trim() || isLoading}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-[calc(100%-24px)] px-6 bg-[#009973] hover:bg-[#00B386] text-white rounded-xl font-bold flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
              <span className="ml-2 hidden sm:inline">{isLoading ? 'Analyzing...' : 'Generate'}</span>
            </button>
          </form>
        </motion.div>

        {/* Results Section */}
        <AnimatePresence mode="wait">
          {roadmapData && !isLoading && (
            <motion.div
              key={roadmapData.company}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-5xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Left Column: Hiring Process Timeline */}
              <div className="lg:col-span-2 space-y-8">
                <div className="bg-[#111] border border-white/5 rounded-2xl p-8 shadow-2xl">
                  <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/5">
                    <div className="w-16 h-16 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-2xl flex items-center justify-center text-[#33bb9a] border border-zinc-700 shadow-inner">
                      <Target size={32} />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-white">{roadmapData.company}</h2>
                      <p className="text-zinc-400 mt-1">{roadmapData.description}</p>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
                    <ListChecks size={22} className="text-[#33bb9a]" />
                    Hiring Roadmap
                  </h3>

                  <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-zinc-700 before:to-transparent">
                    {roadmapData.roadmap.map((step, index) => (
                      <div key={index} className="relative flex items-start group">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#111] bg-zinc-800 text-[#33bb9a] shadow shrink-0 z-10">
                          <span className="text-sm font-bold">{index + 1}</span>
                        </div>
                        <div className="ml-6 w-full p-5 rounded-2xl border border-zinc-800/80 bg-zinc-900/50 hover:bg-zinc-800/80 transition-colors shadow-sm">
                          <h4 className="font-bold text-white text-lg mb-2">{step.round}</h4>
                          <p className="text-zinc-400 leading-relaxed">{step.details}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Preparation Strategies */}
              <div className="space-y-6">
                <div className="bg-[#0a0a0a] border border-[#00B386]/20 rounded-2xl p-8 shadow-[0_0_30px_rgba(0,179,134,0.05)] sticky top-32">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Lightbulb size={22} className="text-yellow-400" />
                    How to Prepare
                  </h3>
                  <ul className="space-y-4">
                    {(roadmapData.preparation || []).map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-zinc-300 bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                        <div className="w-5 h-5 rounded-full bg-[#00B386]/10 flex items-center justify-center text-[#33bb9a] shrink-0 mt-0.5">
                          <CheckCircle2 size={14} />
                        </div>
                        <span className="text-sm leading-relaxed">{tip}</span>
                      </li>
                    ))}
                  </ul>
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
