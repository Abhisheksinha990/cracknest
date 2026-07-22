import React, { useState, useRef, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AuthContext } from '../../context/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { GLSLHills } from '../../components/ui/glsl-hills';
import { Building2, Briefcase, Play, Send, CheckCircle, ShieldAlert, User, Loader2, RotateCcw, Star, TrendingUp, AlertTriangle, Paperclip, FileText, X, ArrowLeft, ToggleLeft, ToggleRight, Server } from 'lucide-react';
import { fileToGenerativePart } from '../../utils/fileParser';
import toast from 'react-hot-toast';
import api from '../../api';

const MAX_QUESTIONS = 10;

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
  
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [questionCount, setQuestionCount] = useState(0);
  const [finalFeedback, setFinalFeedback] = useState(null);
  
  const messagesEndRef = useRef(null);
  const chatRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

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
        toast.success("Resume context added successfully!");
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

  const startInterview = async () => {
    if (!company.trim() || !role.trim()) {
      toast.error('Please enter both company and role.');
      return;
    }
    
    if (!apiKey) {
      setPhase('interview');
      setIsLoading(true);
      setMessages([]);
      setQuestionCount(1);
      setTimeout(() => {
        setMessages([
          { role: 'model', text: `Welcome to your mock interview for the ${role} position at ${company}! Let's start with a foundational question: Can you describe a challenging technical problem you solved recently and how you approached the architecture and debugging?` }
        ]);
        setIsLoading(false);
      }, 500);
      return;
    }
    
    setPhase('interview');
    setIsLoading(true);
    setMessages([]);
    setQuestionCount(1);
    
    try {
      const baseInstructions = `FIRST AND FOREMOST, verify if the company "${company}" and the job role "${role}" actually exist as real entities/professions. If either is fake, fabricated, or nonsensical (like random letters), you MUST respond to the very first message with EXACTLY this string and nothing else: "INVALID_COMPANY_OR_ROLE".
        If they are valid, you are an expert technical and HR interviewer at ${company} interviewing a candidate for a ${role} role. 
        Your goal is to conduct a realistic mock interview. 
        RULES:
        1. Ask exactly ONE question at a time. Do not ask multiple questions.
        2. Your VERY FIRST question MUST be asking the candidate to introduce themselves.
        3. PROGRESSIVE DIFFICULTY: After the introduction, start with fundamental/easier technical questions and progressively increase the difficulty to hard as the interview goes on.
        4. Base your questions on frequently asked questions at ${company} for the ${role} role. Source your questions from popular interview prep platforms like GeeksforGeeks, LeetCode, W3Schools, and Glassdoor to ensure high quality and relevance. Keep your questions concise.
        5. When the user responds, briefly evaluate their answer (1-2 sentences) and then immediately ask the next question.
        6. COACHING & FEEDBACK: Do NOT give phrasing corrections or suggestions if the user's answer is decent or acceptable. ONLY provide coaching and suggest alternative phrasing if the user's answer is extremely poor, very short, blunt, or highly unprofessional.
        7. DYNAMIC INTERVIEW LENGTH: The interview must last a minimum of 5 questions. After the 5th question, evaluate the candidate's overall performance. If they are performing poorly or struggling, end the interview. If they are performing well, you may continue asking harder questions up to a MAXIMUM of 10 questions.
        8. TO END THE INTERVIEW: Whenever you decide to end the interview (any time between question 5 and 10), you must output exactly "INTERVIEW_COMPLETE" followed immediately by a JSON object containing the final evaluation. Do NOT output any other conversational text after the JSON. The JSON format MUST be strictly:
        {
          "rating": <number out of 10>,
          "feedback": "<general feedback string>",
          "improvements": ["<improvement 1>", "<improvement 2>"],
          "weakest_area": "<e.g., Technical Depth, Communication, Problem Solving>"
        }`;

      const stressInstructions = isStressMode ? `\n\nSTRESS INTERVIEW MODE IS ACTIVE: You MUST act as an extremely demanding, impatient, and skeptical FAANG interviewer. Constantly challenge the user's assumptions. If they give a generic answer, interrupt and tell them it sounds rehearsed. Add sudden constraints (e.g., "Okay, but what if you couldn't use extra memory?"). Do not be polite. Be ruthlessly critical to prepare them for high-pressure situations.` : '';

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-3.5-flash',
        systemInstruction: baseInstructions + stressInstructions
      });

      const chat = model.startChat({
        history: [],
        generationConfig: { maxOutputTokens: 1000 },
      });

      chatRef.current = chat;

      let prompt = `Hello, I am ${user?.name || 'the candidate'}. I am ready to begin my mock interview for the ${role} role at ${company}. Please ask me the first question.`;
      let messageContent = prompt;
      
      if (fileContent) {
        prompt = `CRITICAL INSTRUCTION: I have provided my resume. You MUST base a significant portion of your interview questions directly on my resume. Specifically, ask me in-depth questions about the projects I have listed, my past experiences, and assess my soft skills based on my background.\n\n${prompt}`;
        messageContent = [prompt, fileContent];
      }
      
      const result = await chat.sendMessage(messageContent);
      const text = result.response.text();
      
      if (text.trim() === "INVALID_COMPANY_OR_ROLE") {
        toast.error("Company or Job Role does not exist. Please enter real values.");
        setPhase('setup');
        return;
      }
      
      setMessages([{ role: 'model', text }]);
    } catch (error) {
      console.error(error);
      setMessages([{ role: 'model', text: `Error starting interview: ${error.message}` }]);
      toast.error('Failed to start interview.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const chat = chatRef.current;
      const result = await chat.sendMessage(userMessage);
      let text = result.response.text();
      
      if (text.includes("INTERVIEW_COMPLETE")) {
        const parts = text.split("INTERVIEW_COMPLETE");
        const chatBeforeComplete = parts[0].trim();
        if (chatBeforeComplete) {
          setMessages(prev => [...prev, { role: 'model', text: chatBeforeComplete }]);
        }
        
        try {
          const jsonStr = parts[1].replace(/```json/g, '').replace(/```/g, '').trim();
          const feedbackData = JSON.parse(jsonStr);
          setFinalFeedback(feedbackData);
          
          // Save to backend
          api.post('/interviews/save', {
            company: company,
            role: role,
            rating: feedbackData.rating,
            feedback: feedbackData.feedback,
            improvements: feedbackData.improvements,
            weakest_area: feedbackData.weakest_area
          }).catch(err => console.error("Failed to save interview", err));
          
        } catch(e) {
          console.error("Failed to parse JSON feedback", e);
          setFinalFeedback({
             rating: 7, 
             feedback: "Good effort overall, but the final feedback could not be fully parsed.", 
             improvements: ["Keep practicing structured answers."], 
             weakest_area: "General"
          });
        }
        setTimeout(() => setPhase('results'), 3000); // Wait 3 seconds then show results screen
      } else {
        setMessages(prev => [...prev, { role: 'model', text }]);
        setQuestionCount(prev => prev + 1);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: `Error: ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const restart = () => {
    setPhase('setup');
    setCompany('');
    setRole('');
    setMessages([]);
    setQuestionCount(0);
    setFinalFeedback(null);
  };

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="w-full h-screen flex flex-col relative overflow-hidden bg-zinc-950 pt-24 px-6 md:px-12 pb-6">
      <GLSLHills speed={0.8} />
      
      <div className="mb-6 relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif text-white tracking-tight">Interactive Mock Interviews</h1>
          <p className="text-zinc-400 mt-2">Practice text-based interviews tailored to top tech companies.</p>
        </div>
      </div>
      
      {phase === 'setup' && (
        <div className="flex-1 relative z-10 overflow-y-auto custom-scrollbar">
          <div className="min-h-full flex items-center justify-center py-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-xl bg-zinc-900/50 backdrop-blur-md border border-zinc-700/50 rounded-xl p-8 shadow-2xl"
            >
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Interview Setup</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Target Company</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Building2 size={18} className="text-zinc-500" />
                  </div>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Enter your company"
                    className="block w-full pl-11 pr-4 py-4 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-[#00B386] focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Target Role</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Briefcase size={18} className="text-zinc-500" />
                  </div>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="Enter your job role"
                    className="block w-full pl-11 pr-4 py-4 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-[#00B386] focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Attach Resume (Optional)</label>
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
                    className="w-full py-4 px-4 bg-zinc-800/50 hover:bg-zinc-800 border border-dashed border-zinc-600 hover:border-[#00B386] text-zinc-400 hover:text-[#33bb9a] rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <Paperclip size={18} />
                    Upload Resume for Tailored Questions
                  </button>
                ) : (
                  <div className="w-full py-3 px-4 bg-zinc-800 border border-zinc-700 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-8 h-8 rounded-full bg-[#00B386]/20 flex items-center justify-center flex-shrink-0">
                        <FileText size={16} className="text-[#33bb9a]" />
                      </div>
                      <span className="text-white truncate font-medium">{attachedFile}</span>
                    </div>
                    <button 
                      onClick={removeFile}
                      className="text-zinc-500 hover:text-red-400 transition-colors p-1"
                      title="Remove file"
                    >
                      <X size={18} />
                    </button>
                  </div>
                )}
              </div>

              {/* Stress Mode Toggle */}
              <div className="p-4 bg-zinc-800/30 border border-red-900/30 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="text-red-400 font-bold flex items-center gap-2">
                    <ShieldAlert size={16} />
                    Stress Interview Mode
                  </h4>
                  <p className="text-xs text-zinc-400 mt-1">Simulates a high-pressure FAANG interview. Expect ruthless follow-ups and constraints.</p>
                </div>
                <button 
                  onClick={() => setIsStressMode(!isStressMode)}
                  className={`transition-colors p-1 ${isStressMode ? 'text-red-500' : 'text-zinc-600 hover:text-zinc-400'}`}
                >
                  {isStressMode ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                </button>
              </div>

              <button
                onClick={startInterview}
                disabled={isLoading || !company || !role}
                className="w-full mt-4 flex items-center justify-center gap-2 py-4 px-6 bg-gradient-to-r from-[#009973] to-[#009973] hover:from-[#00B386] hover:to-[#00B386] text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Play size={20} />}
                {isLoading ? 'Starting...' : 'Start Mock Interview'}
              </button>
            </div>
          </motion.div>
          </div>
        </div>
      )}

      {phase === 'interview' && (
        <div className="flex-1 flex flex-col border border-zinc-700/50 rounded-2xl bg-zinc-900/60 backdrop-blur-xl overflow-hidden shadow-2xl relative z-10">
          <div className="bg-zinc-800/80 px-6 py-4 border-b border-zinc-700 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white">{company} Mock Interview {isStressMode && <span className="ml-2 text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full border border-red-500/30">Stress Mode</span>}</h3>
              <p className="text-sm text-zinc-400">{role}</p>
            </div>
            <div className="flex items-center gap-2 bg-zinc-900 px-4 py-2 rounded-full border border-zinc-700">
              <span className="text-[#33bb9a] font-bold">Q{questionCount}</span>
              {questionCount > 5 && <span className="text-xs text-zinc-500 ml-1">(Bonus)</span>}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {messages.map((msg, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2 shadow-lg overflow-hidden ${
                  msg.role === 'user' 
                    ? 'bg-[#00B386]/20 text-[#33bb9a] border-[#00B386]/30' 
                    : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                }`}>
                  {msg.role === 'user' ? (
                    user?.picture ? (
                      <img src={user.picture} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <User size={20} />
                    )
                  ) : (
                    <Server size={20} />
                  )}
                </div>
                <div className={`p-5 rounded-2xl shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-gradient-to-br from-[#009973] to-[#009973] text-white rounded-tr-sm' 
                    : isStressMode 
                        ? 'bg-red-950/20 border border-red-900/30 text-zinc-200 rounded-tl-sm'
                        : 'bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-tl-sm'
                }`}>
                  <p className="whitespace-pre-wrap leading-relaxed text-sm md:text-base">{msg.text}</p>
                </div>
              </motion.div>
            ))}
            {isLoading && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex gap-4 max-w-[80%] mr-auto"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2 shadow-lg bg-zinc-800 text-zinc-300 border-zinc-700">
                  <Server size={20} />
                </div>
                <div className="p-5 rounded-2xl shadow-sm bg-zinc-800 border border-zinc-700 text-zinc-400 rounded-tl-sm flex items-center gap-3">
                  <Loader2 size={18} className="animate-spin text-[#33bb9a]" />
                  <span className="text-sm font-medium">Interviewer is typing...</span>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-zinc-800 bg-zinc-900/80">
            <form onSubmit={handleSend} className="relative flex items-center">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your answer here..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-full py-4 pl-6 pr-14 text-white placeholder-zinc-500 focus:outline-none focus:border-[#00B386] focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
                disabled={isLoading}
              />
              <button 
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-2 top-1/2 -tranzinc-y-1/2 w-10 h-10 bg-[#00B386] hover:bg-[#33bb9a] text-white rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                <Send size={18} className="ml-1" />
              </button>
            </form>
          </div>
        </div>
      )}

      {phase === 'results' && (
        <div className="flex-1 relative z-10 overflow-y-auto custom-scrollbar">
          <div className="min-h-full flex items-center justify-center py-8">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-4xl bg-zinc-900/50 backdrop-blur-md border border-zinc-700/50 rounded-xl p-8 lg:p-12 shadow-2xl"
            >
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-[#00B386]/20 text-[#33bb9a] rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-[#00B386]/30">
                <CheckCircle size={40} />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Interview Completed!</h2>
              <p className="text-zinc-400 text-lg">
                Your performance for the <span className="font-bold text-white">{role}</span> role at <span className="font-bold text-white">{company}</span>.
              </p>
            </div>
            
            {finalFeedback && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-left">
                {/* Score Card */}
                <div className="bg-zinc-800/80 border border-zinc-700 rounded-2xl p-6 text-center flex flex-col items-center justify-center">
                  <div className="text-yellow-400 mb-2 flex">
                    {[...Array(10)].map((_, i) => (
                      <Star key={i} size={20} fill={i < Math.round(finalFeedback.rating) ? 'currentColor' : 'none'} className={i < Math.round(finalFeedback.rating) ? 'text-yellow-400' : 'text-zinc-600'} />
                    ))}
                  </div>
                  <h3 className="text-4xl font-serif text-white mb-1">{finalFeedback.rating}<span className="text-xl text-zinc-500">/10</span></h3>
                  <p className="text-sm text-zinc-400 uppercase tracking-wider font-bold">Overall Rating</p>
                </div>

                {/* Feedback Card */}
                <div className="md:col-span-2 bg-zinc-800/80 border border-zinc-700 rounded-2xl p-6">
                  <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                    <Server size={20} className="text-[#33bb9a]"/> Evaluation Report {isStressMode && <span className="ml-2 text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full border border-red-500/30">Stress Mode Tested</span>}
                  </h3>
                  <p className="text-zinc-300 leading-relaxed text-sm md:text-base">
                    {finalFeedback.feedback}
                  </p>
                  
                  <div className="mt-4 pt-4 border-t border-zinc-700">
                    <h4 className="text-sm font-bold text-red-400 flex items-center gap-2">
                      <AlertTriangle size={16} /> Weakest Area: <span className="text-white ml-1">{finalFeedback.weakest_area}</span>
                    </h4>
                  </div>
                </div>

                {/* Improvements List */}
                <div className="md:col-span-3 bg-zinc-800/80 border border-zinc-700 rounded-2xl p-6">
                   <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                    <TrendingUp size={20} className="text-green-400"/> Key Areas for Improvement
                  </h3>
                  <ul className="space-y-3">
                    {finalFeedback.improvements.map((imp, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="text-green-400 mt-0.5">•</span>
                        <span className="text-zinc-300">{imp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="text-center">
              <button
                onClick={restart}
                className="inline-flex items-center gap-2 py-4 px-8 bg-gradient-to-r from-[#009973] to-[#009973] hover:from-[#00B386] hover:to-[#00B386] text-white rounded-xl font-bold transition-all shadow-lg"
              >
                <RotateCcw size={20} />
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
