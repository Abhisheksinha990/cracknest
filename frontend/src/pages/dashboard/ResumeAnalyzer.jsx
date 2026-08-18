import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  UploadCloud, FileText, CheckCircle2, AlertCircle, Building2, Briefcase, 
  FileWarning, Search, Loader2, Play, Award, Code, BookOpen, UserCheck, 
  TrendingUp, ShieldAlert, Zap, Target, FileX, AlertTriangle, Layers
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { analyzeResume, UnreadablePdfError, NotAResumeError } from '../../services/resumeAnalysisService';
import { AIKeyModal } from '../../components/AIKeyModal';
import { Settings } from 'lucide-react';

const ResumeAnalyzer = () => {
  const [file, setFile] = useState(null);
  const [targetCompany, setTargetCompany] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [results, setResults] = useState(null);
  const [extractionError, setExtractionError] = useState(null);
  const [loadingStep, setLoadingStep] = useState(0);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const navigate = useNavigate();

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
    "Pre-parsing PDF text and validating text readability...",
    "Scanning multi-column layouts & formatting hazard risks...",
    "Evaluating project depth, technical stack & quantified impact...",
    targetCompany ? `Measuring alignment with ${targetCompany} hiring standards...` : "Evaluating general ATS structural completeness...",
    jobRole ? `Auditing exact keyword fit for ${jobRole}...` : "Generating grounded recruiter audit feedback..."
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
      setExtractionError(null);
      setResults(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return toast.error("Please select a resume PDF file first");
    
    setIsUploading(true);
    setExtractionError(null);
    setResults(null);

    try {
      // Grounded & Strict Input-Gated Resume Analysis
      const analysisResults = await analyzeResume(file, {
        targetCompany: targetCompany.trim(),
        jobRole: jobRole.trim(),
        jobDescription: jobDescription.trim()
      });

      setResults(analysisResults);
      toast.success(`Resume analyzed! Grounded ATS Score: ${analysisResults.overallAtsScore}/100`);

    } catch (error) {
      console.error("[ResumeAnalyzer] Upload Error:", error);
      if (error instanceof UnreadablePdfError || error instanceof NotAResumeError) {
        setExtractionError(error.message);
        toast.error(error.message);
      } else {
        toast.error(error.message || "Failed to analyze resume. Please try again.");
      }
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
              Grounded ATS Engine
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-serif text-white tracking-tight mt-2">CrackNest AI Resume Scanner</h1>
          <p className="text-zinc-400 mt-1 text-sm max-w-2xl">
            Strict text-grounded ATS evaluation & recruiter audit based on pre-parsed PDF text.
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
                <span className="text-xs text-zinc-500 font-normal">Text PDF up to 5MB</span>
              </label>
              <div className="border-2 border-dashed border-zinc-700/80 rounded-xl bg-zinc-900/50 p-6 flex flex-col items-center justify-center transition-all hover:border-[#00B386]">
                <div className="w-12 h-12 bg-[#00B386]/10 rounded-full flex items-center justify-center mb-3 text-[#33bb9a]">
                  <UploadCloud size={24} />
                </div>
                <input 
                  type="file" 
                  accept=".pdf" 
                  onClick={(e) => { e.target.value = null; }}
                  onChange={handleFileChange} 
                  className="hidden" 
                  id="resume-upload" 
                />

                <label 
                  htmlFor="resume-upload" 
                  className="px-4 py-2 bg-[#00B386] hover:bg-[#009b74] text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-lg"
                >
                  Choose PDF File
                </label>
                {file ? (
                  <div className="mt-3 flex items-center gap-2 text-xs text-zinc-300 bg-zinc-950 px-3 py-1.5 rounded-md border border-zinc-800">
                    <FileText size={14} className="text-[#33bb9a]" />
                    <span className="truncate max-w-[200px]">{file.name}</span>
                  </div>
                ) : (
                  <p className="text-[11px] text-zinc-500 mt-2 text-center">
                    Must be text-selectable PDF format.
                  </p>
                )}
              </div>
            </div>

            {/* Target Context Options (Explicit Optional Fields) */}
            <div className="pt-4 border-t border-zinc-800/80 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Target Context (Optional)</span>
                <span className="text-[10px] text-zinc-500">Enables company/role match</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Target Company</label>
                <div className="relative flex items-center">
                  <Building2 size={16} className="absolute left-3 text-zinc-500" />
                  <input
                    type="text"
                    value={targetCompany}
                    onChange={(e) => setTargetCompany(e.target.value)}
                    placeholder="e.g. Google, Accenture, TCS"
                    className="w-full pl-9 pr-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-[#00B386]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Target Job Role</label>
                <div className="relative flex items-center">
                  <Briefcase size={16} className="absolute left-3 text-zinc-500" />
                  <input
                    type="text"
                    value={jobRole}
                    onChange={(e) => setJobRole(e.target.value)}
                    placeholder="e.g. Software Engineer, Backend Dev"
                    className="w-full pl-9 pr-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-[#00B386]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Job Description Keywords (Optional)</label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste target job requirements or keywords..."
                  rows={3}
                  className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-[#00B386]"
                />
              </div>
            </div>

            {/* Analyze Button */}
            <button 
              onClick={handleUpload}
              disabled={isUploading || !file}
              className="w-full py-4 bg-gradient-to-r from-[#00B386] to-[#008060] hover:from-[#33bb9a] hover:to-[#00B386] text-white font-bold rounded-xl transition-all shadow-xl shadow-[#00B386]/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              {isUploading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Running Grounded ATS Audit...
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
          
          {/* EXTRACTION ERROR CARD */}
          {extractionError && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 bg-red-950/30 border border-red-900/60 rounded-2xl space-y-3 mb-8"
            >
              <div className="flex items-center gap-3 text-red-400 font-bold text-base">
                <FileX size={24} />
                <span>PDF Text Extraction Failed</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                {extractionError}
              </p>
              <div className="p-3 bg-zinc-900/60 rounded-xl text-[11px] text-zinc-400 space-y-1">
                <span className="font-semibold text-zinc-300 block">Why did this happen?</span>
                <p>• The PDF might be a scanned image or picture with no readable digital text layer.</p>
                <p>• Try exporting your resume from Google Docs, Canva, or MS Word as a text-selectable PDF.</p>
              </div>
            </motion.div>
          )}

          {!results && !isUploading && !extractionError ? (
            <div className="h-full min-h-[450px] flex flex-col items-center justify-center border-2 border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20 p-8 text-center">
              <div className="w-16 h-16 bg-zinc-800/80 rounded-2xl flex items-center justify-center mb-4 text-zinc-400 border border-zinc-700/50">
                <Search size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Ready for Grounded Recruiter Inspection</h3>
              <p className="text-zinc-400 max-w-md text-sm leading-relaxed">
                Upload your resume PDF. Scores & feedback are derived strictly from extracted text. Leave target context empty for general ATS scoring.
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
          ) : results ? (
            <div className="space-y-8">
              
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

                {/* Company Match Card (GATED: Only rendered if targetCompany provided) */}
                {results.companyMatchPercent !== null && results.companyMatchPercent !== undefined ? (
                  <div className="flex flex-col justify-center md:border-r border-zinc-800 px-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-zinc-400 font-semibold uppercase">{targetCompany ? targetCompany : 'Company'} Match</span>
                      <span className="text-sm font-bold text-white">{results.companyMatchPercent}%</span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-2">
                      <div className="bg-[#00B386] h-2 rounded-full" style={{ width: `${results.companyMatchPercent}%` }}></div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col justify-center md:border-r border-zinc-800 px-2 text-xs">
                    <span className="text-zinc-500 font-semibold block mb-1">Quantified Impact Subscore</span>
                    <span className="text-lg font-bold text-emerald-400">{results.subScores?.quantifiedImpact || 70}/100</span>
                    <span className="text-[11px] text-zinc-500">Measurable achievement metrics</span>
                  </div>
                )}

                {/* Role Match Card (GATED: Only rendered if jobRole/jobDescription provided) */}
                {results.roleMatchPercent !== null && results.roleMatchPercent !== undefined ? (
                  <div className="flex flex-col justify-center md:border-r border-zinc-800 px-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-zinc-400 font-semibold uppercase">{jobRole ? jobRole : 'Role'} Match</span>
                      <span className="text-sm font-bold text-white">{results.roleMatchPercent}%</span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${results.roleMatchPercent}%` }}></div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col justify-center md:border-r border-zinc-800 px-2 text-xs">
                    <span className="text-zinc-500 font-semibold block mb-1">Formatting Subscore</span>
                    <span className="text-lg font-bold text-blue-400">{results.subScores?.formatting || 80}/100</span>
                    <span className="text-[11px] text-zinc-500">Parseable ATS structure</span>
                  </div>
                )}

                {/* Shortlisting Probability */}
                <div className="flex flex-col justify-center items-start">
                  <span className="text-xs text-zinc-400 font-semibold uppercase mb-1">Shortlist Probability</span>
                  <span className="px-3 py-1.5 bg-zinc-800 text-white rounded-lg font-bold text-xs border border-zinc-700">
                    {results.probabilityOfGettingShortlisted || "Moderate (45-60%)"}
                  </span>
                  <span className="text-[11px] text-zinc-500 mt-1">Readiness: {results.interviewReadinessPercent || 70}%</span>
                </div>

              </div>

              {/* FLAGGED ISSUES ALERT BOX */}
              {results.flaggedIssues && results.flaggedIssues.length > 0 && (
                <div className="bg-amber-950/20 border border-amber-500/40 rounded-2xl p-6 space-y-3">
                  <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                    <AlertTriangle size={18} />
                    <span>Grounded ATS Issues Flagged in Extracted Text</span>
                  </h4>
                  <ul className="space-y-2 text-xs text-zinc-300">
                    {results.flaggedIssues.map((issue, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-amber-400 shrink-0">•</span>
                        <span>{issue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* SECTION SCORES GRID */}
              <div className="bg-[#111] border border-white/10 rounded-2xl p-6 shadow-xl">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Target size={20} className="text-[#33bb9a]" />
                  Detailed Section Scores
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {Object.entries(results.sectionScores || {}).map(([key, val]) => (
                    <div key={key} className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                      <span className="text-zinc-400 text-xs capitalize block mb-1">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <span className="text-lg font-bold text-white">{val}/100</span>
                      <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-2">
                        <div 
                          className="bg-[#00B386] h-1.5 rounded-full" 
                          style={{ width: `${val}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* STRENGTHS & WEAKNESSES */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Strengths */}
                <div className="bg-[#111] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <CheckCircle2 size={20} className="text-emerald-400" />
                    Verified Strengths
                  </h3>
                  <ul className="space-y-2.5 text-xs text-zinc-300">
                    {(results.strengths || []).map((item, idx) => (
                      <li key={idx} className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 flex items-start gap-2.5">
                        <span className="text-emerald-400 font-bold">✓</span>
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Weaknesses */}
                <div className="bg-[#111] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <AlertCircle size={20} className="text-red-400" />
                    Areas to Improve
                  </h3>
                  <ul className="space-y-2.5 text-xs text-zinc-300">
                    {(results.weaknesses || []).map((item, idx) => (
                      <li key={idx} className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 flex items-start gap-2.5">
                        <span className="text-red-400 font-bold">✗</span>
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>

              {/* RECOMMENDED IMPROVEMENT ROADMAP */}
              <div className="bg-[#111] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <TrendingUp size={20} className="text-cyan-400" />
                  Recommended Action Plan
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-2">
                    <span className="text-cyan-400 font-bold block">Resume Bullet Suggestions:</span>
                    <ul className="space-y-1.5 text-zinc-300">
                      {(results.resumeImprovementSuggestions || []).map((sugg, idx) => (
                        <li key={idx}>• {sugg}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-2">
                    <span className="text-purple-400 font-bold block">Recommended Projects to Build:</span>
                    <ul className="space-y-1.5 text-zinc-300">
                      {(results.recommendedProjects || []).map((proj, idx) => (
                        <li key={idx}>⚡ {proj}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* RECRUITER VERDICT */}
              {results.finalVerdict && (
                <div className="bg-[#00B386]/10 border border-[#00B386]/30 rounded-2xl p-6 text-xs text-zinc-200 space-y-2">
                  <span className="text-[#33bb9a] font-bold uppercase tracking-wider block">Grounded Recruiter Verdict:</span>
                  <p className="leading-relaxed text-sm font-medium text-white">{results.finalVerdict}</p>
                </div>
              )}

            </div>
          ) : null}

        </div>

      </div>
    </div>
  );
};

export default ResumeAnalyzer;
