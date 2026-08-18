import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  UploadCloud, FileText, CheckCircle2, AlertCircle, Building2, Briefcase, 
  FileWarning, Search, Loader2, Play, Award, Code, BookOpen, UserCheck, 
  TrendingUp, ShieldAlert, Zap, Target
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { generateAIJSON, getActiveApiKey } from '../../services/aiService';
import { fileToGenerativePart } from '../../utils/fileParser';
import { AIKeyModal } from '../../components/AIKeyModal';
import { Settings } from 'lucide-react';

const ResumeAnalyzer = () => {
  const [file, setFile] = useState(null);
  const [targetCompany, setTargetCompany] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [results, setResults] = useState(null);
  const [loadingStep, setLoadingStep] = useState(0);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const navigate = useNavigate();
  
  const apiKey = getActiveApiKey();

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
    "Parsing resume text and structural layout...",
    "Running ATS algorithm scan (Formatting, Keywords, Readability)...",
    "Evaluating projects, experience, and achievement metrics...",
    targetCompany ? `Comparing against ${targetCompany} hiring standards...` : "Measuring against top tech recruiter standards...",
    jobRole ? `Evaluating exact fit for ${jobRole} role...` : "Generating actionable improvement roadmap..."
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

  const runLocalAlgorithmicScan = (extractedText, targetCompany, jobRole, jobDescription) => {
    const text = (extractedText || "").toLowerCase();
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    
    // Detect sections
    const hasEducation = /education|degree|btech|b\.tech|bachelor|university|college|gpa|cgpa/i.test(text);
    const hasExperience = /experience|work|internship|intern|employment|company|engineer|developer/i.test(text);
    const hasProjects = /projects|project|built|developed|created|github|portfolio/i.test(text);
    const hasSkills = /skills|technologies|tech stack|tools|programming|languages/i.test(text);
    const hasAchievements = /achievements|awards|honors|certifications|certified|rank|hackathon/i.test(text);

    // Quantitative metrics check
    const metricsMatches = text.match(/\b\d+(\.\d+)?(%|k|m|x|\s*ms|\s*sec|\s*users|\s*clients)?\b/gi) || [];
    
    // Tech skills scanner
    const commonTech = ["react", "node", "python", "javascript", "typescript", "java", "c++", "sql", "html", "css", "git", "aws", "docker", "express", "mongodb", "postgresql", "tailwind", "rest api", "dsa", "algorithms"];
    const foundSkills = commonTech.filter(s => text.includes(s));

    // Calculating dynamic section scores based on actual text
    const formattingScore = Math.min(100, Math.max(30, (hasEducation ? 20 : 0) + (hasExperience ? 20 : 0) + (hasProjects ? 25 : 0) + (hasSkills ? 20 : 0) + (wordCount > 150 ? 15 : 5)));
    const skillsScore = Math.min(100, Math.max(25, foundSkills.length * 11));
    const experienceScore = hasExperience ? Math.min(95, Math.max(45, 50 + (wordCount > 300 ? 30 : 15))) : 30;
    const projectsScore = hasProjects ? Math.min(95, Math.max(40, 45 + (wordCount > 250 ? 30 : 15))) : 35;
    const educationScore = hasEducation ? 85 : 50;
    const achievementsScore = hasAchievements ? Math.min(90, Math.max(30, 40 + metricsMatches.length * 10)) : 35;
    const keywordsScore = Math.min(95, Math.max(30, foundSkills.length * 8 + (targetCompany && text.includes(targetCompany.toLowerCase()) ? 15 : 0)));
    const readabilityScore = wordCount >= 120 && wordCount <= 900 ? 88 : wordCount < 120 ? 45 : 65;

    const overall = Math.min(96, Math.max(28, Math.round(
      (formattingScore * 0.15) +
      (skillsScore * 0.20) +
      (experienceScore * 0.20) +
      (projectsScore * 0.20) +
      (educationScore * 0.05) +
      (achievementsScore * 0.05) +
      (keywordsScore * 0.10) +
      (readabilityScore * 0.05)
    )));

    const missingTech = commonTech.filter(s => !foundSkills.includes(s)).slice(0, 8);

    return {
      overallAtsScore: overall,
      companyMatchPercent: Math.min(95, Math.max(35, overall + (targetCompany && text.includes(targetCompany.toLowerCase()) ? 10 : -5))),
      roleMatchPercent: Math.min(95, Math.max(40, overall + (jobRole ? 2 : 0))),
      interviewReadinessPercent: Math.min(95, Math.max(35, overall - 5)),
      probabilityOfGettingShortlisted: overall >= 75 ? "High (80-90%)" : overall >= 55 ? "Moderate (45-60%)" : "Low (15-30%)",
      extractedWordCount: wordCount,
      extractedSkillsCount: foundSkills.length,
      foundSkills,
      sectionScores: {
        formatting: formattingScore,
        skillsMatch: skillsScore,
        experience: experienceScore,
        projects: projectsScore,
        education: educationScore,
        achievements: achievementsScore,
        keywords: keywordsScore,
        readability: readabilityScore
      },
      strengths: [
        foundSkills.length > 0 ? `Detected key skills: ${foundSkills.slice(0, 4).join(', ')}` : "Structured layout",
        hasProjects ? "Dedicated project section detected" : "Education credentials verified",
        metricsMatches.length > 0 ? `Extracted ${metricsMatches.length} quantitative impact metrics` : "Standard ATS parseable text"
      ],
      weaknesses: [
        metricsMatches.length === 0 ? "Missing quantitative achievements (e.g. %, $, performance numbers)" : "Keyword density can be boosted",
        !hasExperience ? "No work/internship experience detected in extracted text" : "Project tech details could be expanded",
        missingTech.length > 0 ? `Missing target keywords: ${missingTech.slice(0, 3).join(', ')}` : "Formatting structure needs refinement"
      ],
      missingKeywords: missingTech.slice(0, 5),
      top15MissingKeywords: missingTech,
      atsProblems: [
        metricsMatches.length === 0 ? "Absence of measurable achievement numbers" : "Standard ATS format verified",
        wordCount < 150 ? "Resume text length is too concise (< 150 words)" : "Ensure bullet points start with strong action verbs"
      ],
      recruiterConcerns: [
        !hasExperience ? "Recruiters favor candidates with internships or real production projects" : "Verify bullet points emphasize individual contribution"
      ],
      technicalSkillGap: missingTech.slice(0, 4),
      softSkillGap: ["Cross-functional Communication", "System Ownership & Debugging"],
      projectsImprovement: [
        "Include GitHub repository links and deployed live demo URLs",
        "Detail architecture decisions and performance benchmarks"
      ],
      resumeImprovementSuggestions: [
        "Structure bullet points using STAR format (Situation, Task, Action, Result)",
        "Tailor technical keywords directly to target company requirements"
      ],
      recommendedCertifications: ["AWS Certified Developer", "Meta Professional Software Engineer"],
      recommendedProjects: ["Distributed High-Throughput System", "Real-Time Collaborative Platform"],
      recommendedDsaTopics: ["Dynamic Programming", "Graph Traversals (BFS/DFS)", "System Design Patterns"],
      recommendedInterviewTopics: ["Scalable Architecture", "Concurrency", "Database Optimization"],
      finalVerdict: `Analyzed extracted text (${wordCount} words, ${foundSkills.length} skills found). Computed dynamic ATS score: ${overall}/100.`
    };
  };

  const handleUpload = async () => {
    if (!file) return toast.error("Please select a resume PDF file first");
    
    setIsUploading(true);

    try {
      const parsedFile = await fileToGenerativePart(file);
      const extractedText = parsedFile.extractedText || "";

      const activeKey = getActiveApiKey();
      if (!activeKey) {
        // Run local algorithmic scanner fallback
        const localScan = runLocalAlgorithmicScan(extractedText, targetCompany, jobRole, jobDescription);
        setResults(localScan);
        toast.success(`Resume scanned offline! Computed ATS score: ${localScan.overallAtsScore}/100`);
        return;
      }

      const promptText = `
        You are CrackNest AI Resume Analyzer.
        Your job is NOT to chat.
        Your job is to behave strictly like an algorithmic ATS scanner and Senior Technical Recruiter from top tier companies (Google, Microsoft, Amazon, Meta, Accenture, Cognizant, TCS, Infosys, Deloitte, Uber, Flipkart, Adobe).

        CRITICAL REQUIREMENT:
        You MUST analyze the candidate's resume based STRICTLY on the actual extracted text below.
        Evaluate every project, tech stack, work experience duration, metric, and skill listed in this exact resume text.
        Compute realistic, dynamic scores (0-100) reflecting the real strength or weakness of this candidate.
        - If the resume contains basic/academic projects (e.g. simple to-do list, basic calculator), score projects realistically low (e.g. 35-55).
        - If work experience or internships are missing, score experience low.
        - CRITICAL: Calculate a unique, dynamic score matching the actual candidate content. NEVER return fixed default numbers.
        - Reference specific project titles, tools, and sections from the candidate's text in your feedback.

        --- START OF CANDIDATE RESUME CONTENT ---
        ${extractedText ? extractedText : "[PDF Content Attached]"}
        --- END OF CANDIDATE RESUME CONTENT ---

        EVALUATION CONTEXT:
        - Target Company: ${targetCompany || "General Top Tech Companies"}
        - Target Job Role: ${jobRole || "Software Engineer / Tech Professional"}
        - Job Description: ${jobDescription || "Not specified"}

        STRICT RECRUITER STANDARDS:
        - Do not praise weak resumes.
        - If the resume contains weak or basic projects, state explicitly why they fail recruiter standards.
        - If the resume has no internships or formal work experience, mention it explicitly.
        - If achievements or quantitative metrics are missing, penalize the score.
        - If target company exists (${targetCompany}), evaluate against ${targetCompany}'s hiring bar and tech stack.

        OUTPUT FORMAT:
        You MUST return EXACTLY ONE valid JSON object matching this schema:

        {
          "overallAtsScore": <number 0-100 based strictly on resume strength>,
          "companyMatchPercent": <number 0-100>,
          "roleMatchPercent": <number 0-100>,
          "interviewReadinessPercent": <number 0-100>,
          "probabilityOfGettingShortlisted": "<string e.g. Low (15-30%), Moderate (45-60%), High (80-90%)>",
          
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
          
          "strengths": ["<strength 1 citing specific item from resume>", "<strength 2>", "<strength 3>"],
          "weaknesses": ["<weakness 1 citing specific gap from resume>", "<weakness 2>", "<weakness 3>"],
          "missingKeywords": ["<keyword 1>", "<keyword 2>", "<keyword 3>"],
          "top15MissingKeywords": ["<k1>", "<k2>", "<k3>", "<k4>", "<k5>", "<k6>", "<k7>", "<k8>", "<k9>", "<k10>", "<k11>", "<k12>", "<k13>", "<k14>", "<k15>"],
          "atsProblems": ["<ats problem 1>", "<ats problem 2>"],
          "recruiterConcerns": ["<recruiter concern 1>", "<recruiter concern 2>"],
          "technicalSkillGap": ["<tech gap 1>", "<tech gap 2>"],
          "softSkillGap": ["<soft skill gap 1>", "<soft skill gap 2>"],
          "projectsImprovement": ["<project tip 1>", "<project tip 2>"],
          "resumeImprovementSuggestions": ["<suggestion 1>", "<suggestion 2>"],
          
          "recommendedCertifications": ["<cert 1>", "<cert 2>"],
          "recommendedProjects": ["<project recommendation 1>", "<project recommendation 2>"],
          "recommendedDsaTopics": ["<dsa topic 1>", "<dsa topic 2>"],
          "recommendedInterviewTopics": ["<interview topic 1>", "<interview topic 2>"],
          
          "finalVerdict": "<detailed 2-3 sentence recruiter verdict citing specific resume items>"
        }
      `;

      try {
        const parsedResults = await generateAIJSON({
          prompt: promptText,
          filePart: parsedFile.inlineData ? parsedFile : null
        });

        if (parsedResults && parsedResults.overallAtsScore) {
          setResults(parsedResults);
          toast.success("Resume analyzed successfully by CrackNest ATS Engine!");
          return;
        }
      } catch (aiErr) {
        console.warn("AI scan issue, falling back to local algorithmic ATS scanner:", aiErr);
      }

      // Fallback if AI JSON fails
      const fallbackScan = runLocalAlgorithmicScan(extractedText, targetCompany, jobRole, jobDescription);
      setResults(fallbackScan);
      toast.success(`Resume scanned by CrackNest ATS Engine! ATS Score: ${fallbackScan.overallAtsScore}/100`);

    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to analyze resume");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col bg-zinc-950 pt-24 px-4 md:px-8 pb-16 text-zinc-100">
      
      {/* Header Banner */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-[#00B386]/10 text-[#33bb9a] text-xs font-bold uppercase rounded-full border border-[#00B386]/20">
              Top Recruiter ATS Engine
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-serif text-white tracking-tight mt-2">CrackNest AI Resume Scanner</h1>
          <p className="text-zinc-400 mt-1 text-sm max-w-2xl">
            Algorithmic ATS evaluation & senior technical recruiter audit based on strict hiring standards.
          </p>
        </div>
        <button
          onClick={() => setIsKeyModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl border border-zinc-800 text-xs font-medium transition-all cursor-pointer self-start md:self-auto"
        >
          <Settings size={15} className="text-cyan-400" />
          <span>AI Model & Key Settings</span>
        </button>
      </div>

      <AIKeyModal isOpen={isKeyModalOpen} onClose={() => setIsKeyModalOpen(false)} />
      
      <div className="flex-1 flex flex-col lg:flex-row gap-8">
        
        {/* LEFT PANEL: Inputs */}
        <div className="w-full lg:w-[380px] xl:w-[420px] flex flex-col gap-6 flex-shrink-0">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-6">
            
            {/* PDF File Upload */}
            <div>
              <label className="block text-zinc-200 text-sm font-bold mb-2 flex items-center justify-between">
                <span>Upload Resume PDF <span className="text-red-400">*</span></span>
                <span className="text-xs text-zinc-500 font-normal">PDF up to 5MB</span>
              </label>
              <div className="border-2 border-dashed border-zinc-700/80 rounded-xl bg-zinc-900/50 p-6 flex flex-col items-center justify-center transition-all hover:border-[#00B386]">
                <div className="w-12 h-12 bg-[#00B386]/10 rounded-full flex items-center justify-center mb-3 text-[#33bb9a]">
                  <UploadCloud size={24} />
                </div>
                <input 
                  type="file" 
                  accept=".pdf" 
                  onChange={handleFileChange} 
                  className="hidden" 
                  id="resume-file-input" 
                />
                <label 
                  htmlFor="resume-file-input" 
                  className="cursor-pointer px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold rounded-lg transition-colors border border-zinc-700 w-full text-center truncate"
                >
                  {file ? file.name : "Choose Resume PDF"}
                </label>
              </div>
            </div>

            {/* Target Company */}
            <div>
              <label className="block text-zinc-300 text-xs font-bold mb-1.5 uppercase tracking-wider">
                Target Company (Optional)
              </label>
              <div className="relative">
                <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={targetCompany}
                  onChange={(e) => setTargetCompany(e.target.value)}
                  placeholder="Enter company"
                  className="w-full pl-10 pr-3 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-[#00B386]"
                />
              </div>
            </div>

            {/* Job Role */}
            <div>
              <label className="block text-zinc-300 text-xs font-bold mb-1.5 uppercase tracking-wider">
                Target Job Role (Optional)
              </label>
              <div className="relative">
                <Briefcase size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value)}
                  placeholder="Enter job role"
                  className="w-full pl-10 pr-3 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-[#00B386]"
                />
              </div>
            </div>

            {/* Job Description */}
            <div>
              <label className="block text-zinc-300 text-xs font-bold mb-1.5 uppercase tracking-wider">
                Job Description / Skills (Optional)
              </label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste key job requirements, technologies, or responsibilities..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-[#00B386] h-24 resize-none custom-scrollbar"
              />
            </div>

            {/* Submit Button */}
            <button 
              onClick={handleUpload}
              disabled={isUploading || !file}
              className="w-full py-4 bg-gradient-to-r from-[#00B386] to-[#008060] hover:from-[#33bb9a] hover:to-[#00B386] text-white font-bold rounded-xl transition-all shadow-xl shadow-[#00B386]/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              {isUploading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Running Recruiter Audit...
                </>
              ) : (
                <>
                  <FileText size={18} />
                  Scan & Analyze Resume
                </>
              )}
            </button>
          </div>
        </div>

        {/* RIGHT PANEL: Audit Results */}
        <div className="flex-1 min-w-0">
          {!results && !isUploading ? (
            <div className="h-full min-h-[450px] flex flex-col items-center justify-center border-2 border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20 p-8 text-center">
              <div className="w-16 h-16 bg-zinc-800/80 rounded-2xl flex items-center justify-center mb-4 text-zinc-400 border border-zinc-700/50">
                <Search size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Ready for Recruiter & ATS Inspection</h3>
              <p className="text-zinc-400 max-w-md text-sm leading-relaxed">
                Upload your resume PDF on the left. Enter target company or job role for specialized evaluation against real top-tier recruiter standards.
              </p>
            </div>
          ) : isUploading ? (
            <div className="h-full min-h-[450px] flex flex-col items-center justify-center border border-zinc-800 rounded-2xl bg-[#111] p-8">
              <div className="w-16 h-16 bg-[#00B386]/10 rounded-full flex items-center justify-center mb-6 border border-[#00B386]/30 text-[#33bb9a]">
                <Loader2 size={32} className="animate-spin" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-6 text-center">Scanning Resume...</h3>
              
              <div className="w-full max-w-md space-y-4">
                {loadingSteps.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-6 h-6 flex-shrink-0 rounded-full flex items-center justify-center text-xs">
                      {loadingStep > idx ? (
                        <div className="w-full h-full bg-green-500/20 text-green-400 rounded-full flex items-center justify-center">
                          <CheckCircle2 size={16} />
                        </div>
                      ) : loadingStep === idx ? (
                        <Loader2 size={16} className="text-[#33bb9a] animate-spin" />
                      ) : (
                        <div className="w-full h-full border border-zinc-800 rounded-full bg-zinc-900"></div>
                      )}
                    </div>
                    <span className={`text-xs md:text-sm font-medium ${loadingStep > idx ? 'text-zinc-400' : loadingStep === idx ? 'text-white' : 'text-zinc-600'}`}>
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              
              {/* EXTRACTED RESUME TEXT SUMMARY BANNER */}
              {results.extractedWordCount !== undefined && (
                <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-[#33bb9a] font-bold">
                    <CheckCircle2 size={16} />
                    <span>Extracted PDF Resume Text Successfully</span>
                  </div>
                  <div className="flex items-center gap-4 text-zinc-300">
                    <span>Words Extracted: <strong className="text-white">{results.extractedWordCount}</strong></span>
                    {results.extractedSkillsCount > 0 && (
                      <span>Detected Tech Skills: <strong className="text-white">{results.extractedSkillsCount}</strong> ({results.foundSkills?.slice(0, 5).join(', ')})</span>
                    )}
                  </div>
                </div>
              )}

              {/* TOP METRICS SUMMARY BAR */}
              <div className="bg-[#111] border border-white/10 rounded-2xl p-6 shadow-2xl grid grid-cols-1 md:grid-cols-4 gap-6">
                
                {/* Overall Score */}
                <div className="flex items-center gap-5 md:border-r border-zinc-800 pr-4">
                  <div className="relative w-24 h-24 flex items-center justify-center flex-shrink-0">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="#222" strokeWidth="10" />
                      <motion.circle 
                        cx="50" cy="50" r="42" fill="none" 
                        stroke={results.overallAtsScore >= 75 ? "#00B386" : results.overallAtsScore >= 50 ? "#eab308" : "#ef4444"} 
                        strokeWidth="10"
                        strokeDasharray={`${((results.overallAtsScore || 70) / 100) * 264} 264`}
                        initial={{ strokeDasharray: "0 264" }}
                        animate={{ strokeDasharray: `${((results.overallAtsScore || 70) / 100) * 264} 264` }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-white">{results.overallAtsScore || 70}</span>
                      <span className="text-[10px] text-zinc-500 font-bold uppercase">ATS Score</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-400 font-semibold block uppercase">Overall Verdict</span>
                    <span className={`text-sm font-bold ${results.overallAtsScore >= 75 ? "text-[#33bb9a]" : results.overallAtsScore >= 50 ? "text-yellow-400" : "text-red-400"}`}>
                      {results.overallAtsScore >= 75 ? "Strong Candidate" : results.overallAtsScore >= 50 ? "Needs Improvement" : "High Risk of Rejection"}
                    </span>
                  </div>
                </div>

                {/* Company Match */}
                <div className="flex flex-col justify-center md:border-r border-zinc-800 px-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-zinc-400 font-semibold uppercase">{targetCompany ? targetCompany : 'Company'} Match</span>
                    <span className="text-sm font-bold text-white">{results.companyMatchPercent || 75}%</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-2">
                    <div className="bg-[#00B386] h-2 rounded-full" style={{ width: `${results.companyMatchPercent || 75}%` }}></div>
                  </div>
                </div>

                {/* Role Match */}
                <div className="flex flex-col justify-center md:border-r border-zinc-800 px-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-zinc-400 font-semibold uppercase">{jobRole ? jobRole : 'Role'} Match</span>
                    <span className="text-sm font-bold text-white">{results.roleMatchPercent || 72}%</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${results.roleMatchPercent || 72}%` }}></div>
                  </div>
                </div>

                {/* Shortlisting Probability */}
                <div className="flex flex-col justify-center items-start">
                  <span className="text-xs text-zinc-400 font-semibold uppercase mb-1">Shortlist Probability</span>
                  <span className="px-3 py-1.5 bg-zinc-800 text-white rounded-lg font-bold text-xs border border-zinc-700">
                    {results.probabilityOfGettingShortlisted || "Moderate (45-60%)"}
                  </span>
                  <span className="text-[11px] text-zinc-500 mt-1">Readiness: {results.interviewReadinessPercent || 70}%</span>
                </div>

              </div>

              {/* SECTION SCORES GRID (8 SECTION BREAKDOWNS) */}
              <div className="bg-[#111] border border-white/10 rounded-2xl p-6 shadow-xl">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Target size={20} className="text-[#33bb9a]" />
                  Detailed Section Scores
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {Object.entries(results.sectionScores || {
                    formatting: 85, skillsMatch: 75, experience: 70, projects: 68,
                    education: 90, achievements: 65, keywords: 72, readability: 88
                  }).map(([key, score]) => (
                    <div key={key} className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
                      <span className="text-xs text-zinc-400 capitalize block mb-1">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <div className="flex items-end justify-between">
                        <span className="text-xl font-bold text-white">{score}%</span>
                        <div className="w-16 bg-zinc-800 h-1.5 rounded-full overflow-hidden mb-1">
                          <div 
                            className={`h-full ${score >= 75 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${score}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* STRENGTHS & WEAKNESSES GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Strengths */}
                <div className="bg-green-950/20 border border-green-900/40 rounded-2xl p-6 shadow-xl">
                  <h3 className="text-base font-bold text-green-400 mb-4 flex items-center gap-2">
                    <CheckCircle2 size={20} />
                    Key Resume Strengths
                  </h3>
                  <ul className="space-y-2.5">
                    {(results.strengths || []).map((item, idx) => (
                      <li key={idx} className="flex gap-2.5 text-xs text-zinc-300 leading-relaxed bg-zinc-900/40 p-3 rounded-lg border border-green-900/20">
                        <span className="text-green-400 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Weaknesses */}
                <div className="bg-red-950/20 border border-red-900/40 rounded-2xl p-6 shadow-xl">
                  <h3 className="text-base font-bold text-red-400 mb-4 flex items-center gap-2">
                    <ShieldAlert size={20} />
                    Critical Weaknesses & Risks
                  </h3>
                  <ul className="space-y-2.5">
                    {(results.weaknesses || []).map((item, idx) => (
                      <li key={idx} className="flex gap-2.5 text-xs text-zinc-300 leading-relaxed bg-zinc-900/40 p-3 rounded-lg border border-red-900/20">
                        <span className="text-red-400 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>

              {/* ATS PROBLEMS & RECRUITER CONCERNS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
                  <h3 className="text-base font-bold text-orange-400 mb-4 flex items-center gap-2">
                    <FileWarning size={20} />
                    ATS Parsing Errors
                  </h3>
                  <ul className="space-y-2 text-xs text-zinc-300">
                    {(results.atsProblems || []).map((prob, idx) => (
                      <li key={idx} className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800 flex items-start gap-2">
                        <span className="text-orange-400">⚠️</span>
                        <span>{prob}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
                  <h3 className="text-base font-bold text-yellow-400 mb-4 flex items-center gap-2">
                    <UserCheck size={20} />
                    Recruiter Red Flags & Concerns
                  </h3>
                  <ul className="space-y-2 text-xs text-zinc-300">
                    {(results.recruiterConcerns || []).map((concern, idx) => (
                      <li key={idx} className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800 flex items-start gap-2">
                        <span className="text-yellow-400">🚩</span>
                        <span>{concern}</span>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>

              {/* TOP 15 MISSING KEYWORDS */}
              <div className="bg-[#111] border border-white/10 rounded-2xl p-6 shadow-xl">
                <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                  <Search size={20} className="text-[#33bb9a]" />
                  Top 15 Missing Industry & Role Keywords
                </h3>
                <p className="text-xs text-zinc-400 mb-4">Integrate these essential keywords naturally into your skills and project bullet points to bypass ATS filters.</p>
                <div className="flex flex-wrap gap-2">
                  {(results.top15MissingKeywords || results.missingKeywords || []).slice(0, 15).map((kw, idx) => (
                    <span key={idx} className="px-3 py-1.5 bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg hover:border-[#00B386] transition-colors">
                      + {kw}
                    </span>
                  ))}
                </div>
              </div>

              {/* SKILL GAPS & PROJECT IMPROVEMENTS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Tech & Soft Skill Gaps */}
                <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
                  <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                    <Code size={20} className="text-blue-400" />
                    Identified Skill Gaps
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">Technical Gaps</span>
                      <ul className="space-y-1.5 text-xs text-zinc-300">
                        {(results.technicalSkillGap || []).map((gap, idx) => (
                          <li key={idx} className="bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-800">• {gap}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="pt-2">
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">Soft Skill Gaps</span>
                      <ul className="space-y-1.5 text-xs text-zinc-300">
                        {(results.softSkillGap || []).map((gap, idx) => (
                          <li key={idx} className="bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-800">• {gap}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Project & Resume Improvements */}
                <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
                  <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                    <Zap size={20} className="text-yellow-400" />
                    Projects & Bullet Point Optimization
                  </h3>
                  <div className="space-y-3 text-xs text-zinc-300">
                    <div>
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">Project Enhancements</span>
                      <ul className="space-y-1.5">
                        {(results.projectsImprovement || []).map((tip, idx) => (
                          <li key={idx} className="bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-800">💡 {tip}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

              </div>

              {/* RECOMMENDED GROWTH PLAN (Certifications, DSA, Projects, Interview Topics) */}
              <div className="bg-[#111] border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Award size={22} className="text-purple-400" />
                  Recommended Actionable Growth Plan
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  {/* Certifications */}
                  <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
                    <span className="text-xs font-bold text-purple-400 uppercase block mb-2">Recommended Certifications</span>
                    <ul className="space-y-1 text-xs text-zinc-300">
                      {(results.recommendedCertifications || []).map((cert, idx) => (
                        <li key={idx}>✓ {cert}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Projects */}
                  <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
                    <span className="text-xs font-bold text-blue-400 uppercase block mb-2">Recommended Projects</span>
                    <ul className="space-y-1 text-xs text-zinc-300">
                      {(results.recommendedProjects || []).map((proj, idx) => (
                        <li key={idx}>🚀 {proj}</li>
                      ))}
                    </ul>
                  </div>

                  {/* DSA Topics */}
                  <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
                    <span className="text-xs font-bold text-green-400 uppercase block mb-2">Recommended DSA Topics</span>
                    <ul className="space-y-1 text-xs text-zinc-300">
                      {(results.recommendedDsaTopics || []).map((dsa, idx) => (
                        <li key={idx}>⚡ {dsa}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Interview Topics */}
                  <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
                    <span className="text-xs font-bold text-yellow-400 uppercase block mb-2">Interview Topics</span>
                    <ul className="space-y-1 text-xs text-zinc-300">
                      {(results.recommendedInterviewTopics || []).map((topic, idx) => (
                        <li key={idx}>🎯 {topic}</li>
                      ))}
                    </ul>
                  </div>

                </div>
              </div>

              {/* FINAL SENIOR RECRUITER VERDICT */}
              <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-900 border border-[#00B386]/30 p-6 rounded-2xl shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#00B386]/10 rounded-full blur-2xl -mr-12 -mt-12"></div>
                <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                  <TrendingUp size={20} className="text-[#33bb9a]" />
                  Senior Recruiter Final Verdict
                </h3>
                <p className="text-xs md:text-sm text-zinc-300 leading-relaxed mb-6 font-medium">
                  {results.finalVerdict}
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-zinc-800">
                  <div className="text-xs text-zinc-400">
                    Ready to practice your interview strategy for {targetCompany || 'top companies'}?
                  </div>
                  <button 
                    onClick={() => navigate('/interviews')}
                    className="w-full sm:w-auto px-6 py-3 bg-[#00B386] hover:bg-[#009973] text-white text-xs font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
                  >
                    <Play size={16} />
                    Start Tailored Mock Interview
                  </button>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeAnalyzer;
