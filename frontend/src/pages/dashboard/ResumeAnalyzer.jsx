import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Building2, Briefcase, FileWarning, Search, Loader2, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { fileToGenerativePart } from '../../utils/fileParser';

const ResumeAnalyzer = () => {
  const [file, setFile] = useState(null);
  const [targetCompany, setTargetCompany] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [results, setResults] = useState(null);
  const [loadingStep, setLoadingStep] = useState(0);
  const navigate = useNavigate();
  
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  useEffect(() => {
    let interval;
    if (isUploading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < 4 ? prev + 1 : prev));
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isUploading]);

  const loadingSteps = [
    "Extracting text and layout from document...",
    "Scanning for ATS parse rate...",
    "Checking spelling, grammar, and brevity...",
    "Analyzing impact and formatting consistency...",
    targetCompany ? `Comparing against ${targetCompany} requirements...` : "Evaluating against tech industry standards..."
  ];

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== 'application/pdf') {
        toast.error("Please upload PDF format only.");
        e.target.value = null;
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return toast.error("Please select a file first");
    if (!apiKey) return toast.error("Gemini API key is missing");
    
    setIsUploading(true);

    try {
      const filePart = await fileToGenerativePart(file);
      
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

      const basePrompt = targetCompany 
        ? `You are an expert ATS (Applicant Tracking System) algorithm and a Senior Technical Recruiter at ${targetCompany}.
           Analyze the attached resume document against the target company ${targetCompany} and this job description (if provided): ${jobDescription}.`
        : `You are an expert ATS (Applicant Tracking System) algorithm and a Senior Technical Recruiter.
           Analyze the attached resume document against general tech industry standards and best practices for formatting and content.`;

      const requirementText = targetCompany ? `why ${targetCompany} needs it` : `why modern tech companies need it`;

      const prompt = `
        ${basePrompt}
        
        CRITICAL INSTRUCTION: If the attached document does NOT appear to be a valid Resume or CV (for example: a restaurant menu, a bill, a totally irrelevant document, or mostly blank), you MUST give a score of 0 for fit and ATS compatibility. In the 'suggestions' array, you MUST include the exact string: "You might have uploaded the wrong document. Please upload a valid Resume or CV."

        OUTPUT FORMAT:
        You MUST return EXACTLY ONE valid JSON object, and absolutely NO markdown formatting, NO backticks, and NO conversational text.
        The JSON must match this structure:
        {
          "score": <number between 0-100 based on fit and ATS compatibility>,
          "breakdown": {
            "formatting": <number 0-100>,
            "keywords": <number 0-100>,
            "impact": <number 0-100>,
            "brevity": <number 0-100>
          },
          "formatErrors": [
            "<string array of structural or formatting errors found in the resume, e.g., 'Missing contact info', 'Inconsistent date formats'>"
          ],
          "suggestions": [
            "<string array of 3-5 actionable tips to improve the resume>"
          ],
          "weakTechStack": [
            { "tech": "<Skill name>", "current": "<candidate's level based on resume>", "requirement": "<${requirementText}>" }
          ]
        }
      `;

      const result = await model.generateContent([prompt, filePart]);
      const responseText = result.response.text();
      let cleanedJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      
      try {
        const parsedResults = JSON.parse(cleanedJson);
        setResults(parsedResults);
        toast.success("Resume analyzed successfully!");
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError, "Raw output:", responseText);
        toast.error("Failed to parse evaluation report.");
      }

    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to analyze resume");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full h-screen flex flex-col overflow-hidden bg-zinc-950 pt-24 px-6 md:px-12">
      <div className="mb-6 flex-shrink-0">
        <h1 className="text-3xl font-serif text-white tracking-tight">Smart Resume Analyzer</h1>
        <p className="text-zinc-400 mt-2">Upload your resume and enter the target company to get instant, algorithmic ATS feedback.</p>
      </div>
      
      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
        
        {/* LEFT COLUMN: Setup */}
        <div className="w-full lg:w-[400px] xl:w-[450px] flex flex-col overflow-y-auto custom-scrollbar pb-6 flex-shrink-0">
          <div className="bg-[#111] border border-white/5 rounded-xl p-6 shadow-xl flex flex-col gap-6">
            
            {/* Upload Area */}
            <div>
              <label className="block text-zinc-300 text-sm font-bold mb-3">Upload Resume</label>
              <div className="border-2 border-dashed border-zinc-700 rounded-2xl bg-zinc-900/40 p-6 flex flex-col items-center justify-center transition-all hover:bg-zinc-900/60 hover:border-[#00B386]/50">
                <div className="w-16 h-16 bg-[#00B386]/10 rounded-full flex items-center justify-center mb-4 border border-[#00B386]/20">
                  <UploadCloud size={24} className="text-[#33bb9a]" />
                </div>
                <input 
                  type="file" 
                  accept=".pdf" 
                  onChange={handleFileChange} 
                  className="hidden" 
                  id="resume-upload" 
                />
                <label 
                  htmlFor="resume-upload" 
                  className="cursor-pointer px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-xl transition-colors border border-zinc-700 mb-2 w-full text-center flex justify-center items-center h-10"
                >
                  <span className="truncate w-full">{file ? file.name : "Select PDF File"}</span>
                </label>
                <p className="text-xs text-zinc-500 text-center">PDF up to 5MB</p>
              </div>
            </div>

            {/* Target Company */}
            <div>
              <label className="block text-zinc-300 text-sm font-bold mb-2">Target Company (Optional)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building2 size={16} className="text-zinc-500" />
                </div>
                <input
                  type="text"
                  value={targetCompany}
                  onChange={(e) => setTargetCompany(e.target.value)}
                  placeholder="Enter your company"
                  className="block w-full pl-10 pr-3 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-[#00B386] focus:ring-1 focus:ring-indigo-500 transition-colors text-sm"
                />
              </div>
            </div>

            {/* Job Description */}
            <div>
              <label className="block text-zinc-300 text-sm font-bold mb-2">Job Description (Optional)</label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job requirements to get role-specific feedback..."
                className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl p-4 text-white placeholder-zinc-500 focus:outline-none focus:border-[#00B386] focus:ring-1 focus:ring-indigo-500 transition-all resize-none h-28 text-sm custom-scrollbar"
              />
            </div>

            <button 
              onClick={handleUpload}
              disabled={isUploading || !file}
              className="w-full py-4 bg-gradient-to-r from-[#00B386] to-[#009973] hover:from-[#33bb9a] hover:to-[#00B386] text-white font-bold rounded-xl transition-all shadow-lg shadow-[#00B386]/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Analyzing Resume...
                </>
              ) : (
                <>
                  <FileText size={18} />
                  Analyze Match
                </>
              )}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Results */}
        <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar pb-6 pr-2">
          {!results && !isUploading ? (
            <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-900/20 p-12 text-center">
              <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mb-6">
                <Search size={32} className="text-zinc-500" />
              </div>
              <h3 className="text-xl font-bold text-zinc-300 mb-2">Ready to Analyze</h3>
              <p className="text-zinc-500 max-w-sm">Upload your resume to get general ATS feedback, or enter a target company on the left to see how well you match their specific requirements.</p>
            </div>
          ) : isUploading ? (
            <div className="h-full flex flex-col items-center justify-center border border-zinc-800 rounded-xl bg-zinc-900/50 p-8 lg:p-12">
              <div className="w-16 h-16 bg-[#00B386]/10 rounded-full flex items-center justify-center mb-8 border border-[#00B386]/30">
                 <Loader2 size={32} className="text-[#33bb9a] animate-spin" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-8 text-center">Analyzing Resume...</h3>
              
              <div className="w-full max-w-md mx-auto space-y-5">
                {loadingSteps.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <div className="w-6 h-6 flex-shrink-0 rounded-full flex items-center justify-center">
                      {loadingStep > idx ? (
                        <div className="w-full h-full bg-green-500/20 text-green-400 rounded-full flex items-center justify-center">
                          <CheckCircle2 size={16} />
                        </div>
                      ) : loadingStep === idx ? (
                         <Loader2 size={16} className="text-[#33bb9a] animate-spin" />
                      ) : (
                        <div className="w-full h-full border border-zinc-700 rounded-full bg-zinc-800/50"></div>
                      )}
                    </div>
                    <span className={`text-sm md:text-base font-medium transition-colors duration-300 ${loadingStep > idx ? 'text-zinc-400' : loadingStep === idx ? 'text-white' : 'text-zinc-600'}`}>
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Score Header */}
              <div className="bg-[#111] border border-white/5 rounded-xl p-8 shadow-xl flex flex-col md:flex-row items-center gap-8">
                <div className="relative w-40 h-40 flex items-center justify-center flex-shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#18181b" strokeWidth="10" />
                    <motion.circle 
                      cx="50" cy="50" r="45" fill="none" 
                      stroke="url(#gradient)" 
                      strokeWidth="10"
                      strokeDasharray={`${(results.score / 100) * 283} 283`}
                      initial={{ strokeDasharray: "0 283" }}
                      animate={{ strokeDasharray: `${(results.score / 100) * 283} 283` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#06b6d4" />
                        <stop offset="3b82f6" stopColor="#3b82f6" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-serif text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-400">
                      {results.score}
                    </span>
                    <span className="text-xs text-zinc-500 font-medium">/ 100</span>
                  </div>
                </div>
                
                <div className="flex-1 w-full">
                  <h3 className="text-2xl font-bold text-white mb-2">ATS Match {targetCompany ? `for ${targetCompany}` : 'Score'}</h3>
                  <p className="text-zinc-400 mb-6 text-sm">
                    {results.score >= 80 ? "Excellent match! Your resume is highly compatible with their systems." : 
                     results.score >= 60 ? "Good match, but you might get filtered out in highly competitive roles." : 
                     "Poor match. Serious improvements are needed to pass the initial screening."}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(results.breakdown).map(([key, value]) => (
                      <div key={key}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-zinc-400 capitalize">{key}</span>
                          <span className="text-[#33bb9a] font-bold">{value}%</span>
                        </div>
                        <div className="w-full bg-zinc-800 rounded-full h-1.5">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${value}%` }}
                            transition={{ duration: 1, delay: 0.5 }}
                            className="bg-gradient-to-r from-[#00B386] to-[#00B386] h-1.5 rounded-full"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Formatting Errors */}
              {results.formatErrors && results.formatErrors.length > 0 && (
                <div className="bg-orange-950/20 backdrop-blur-xl border border-orange-900/50 rounded-xl p-8 shadow-xl">
                  <h3 className="text-xl font-bold text-orange-400 mb-6 flex items-center gap-2">
                    <FileWarning size={22} />
                    Formatting & Structural Errors
                  </h3>
                  <ul className="space-y-4">
                    {results.formatErrors.map((error, idx) => (
                      <motion.li 
                        key={idx}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + (idx * 0.1) }}
                        className="flex gap-4 items-start bg-zinc-900/40 p-4 rounded-xl border border-orange-900/30"
                      >
                        <div className="mt-0.5 min-w-max">
                          <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5"></div>
                        </div>
                        <p className="text-zinc-300 text-sm leading-relaxed">{error}</p>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actionable Suggestions */}
              <div className="bg-[#111] border border-white/5 rounded-xl p-8 shadow-xl">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <CheckCircle2 size={22} className="text-green-400" />
                  How to Improve {targetCompany ? `for ${targetCompany}` : 'Your Resume'}
                </h3>
                <ul className="space-y-4">
                  {results.suggestions.map((suggestion, idx) => (
                    <motion.li 
                      key={idx}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + (idx * 0.1) }}
                      className="flex gap-4 items-start"
                    >
                      <div className="mt-1 min-w-max">
                        <AlertCircle size={18} className="text-[#33bb9a]" />
                      </div>
                      <p className="text-zinc-300 text-sm leading-relaxed">{suggestion}</p>
                    </motion.li>
                  ))}
                </ul>
              </div>

              {/* Weak Tech Stack */}
              {results.weakTechStack && results.weakTechStack.length > 0 && (
                <div className="bg-red-950/20 backdrop-blur-xl border border-red-900/50 rounded-xl p-8 shadow-xl">
                  <h3 className="text-xl font-bold text-red-400 mb-6 flex items-center gap-2">
                    <AlertCircle size={22} />
                    Skill Gaps {targetCompany ? `vs ${targetCompany} Requirements` : 'Identified'}
                  </h3>
                  <div className="space-y-4">
                    {results.weakTechStack.map((item, idx) => (
                      <motion.div 
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 + (idx * 0.1) }}
                        className="bg-zinc-900/60 border border-red-900/30 p-5 rounded-xl flex flex-col gap-2"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-white font-bold text-lg">{item.tech}</span>
                          <span className="text-xs font-semibold px-2 py-1 bg-red-500/20 text-red-400 rounded-full border border-red-500/20">
                            Current: {item.current}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-400 mt-2"><span className="text-zinc-300 font-semibold">Why they need it:</span> {item.requirement}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Take Mock Interview Action */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="pt-6 border-t border-zinc-800"
              >
                <div className="bg-gradient-to-r from-zinc-900 to-zinc-900/50 border border-zinc-800 p-8 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#00B386]/5 rounded-full blur-2xl -mr-16 -mt-16"></div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Ready to test your skills?</h3>
                    <p className="text-zinc-400 text-sm max-w-md">Take a realistic mock interview tailored to this resume and target company. Get real-time feedback on your answers.</p>
                  </div>
                  <button 
                    onClick={() => navigate('/interviews')}
                    className="w-full sm:w-auto px-8 py-4 bg-[#00B386] hover:bg-[#009973] text-white rounded-xl font-bold transition-all shadow-lg shadow-[#00B386]/20 flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    <Play size={18} />
                    Start Mock Interview
                  </button>
                </div>
              </motion.div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeAnalyzer;
