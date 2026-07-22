import React, { useState, useEffect, useRef, useContext } from 'react';
import { motion } from 'framer-motion';
import { Send, User, Bot, Loader2, Paperclip, FileText, X } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { fileToGenerativePart } from '../../utils/fileParser';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const StrategicCareerAdvisor = () => {
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([
    {
      role: 'model',
      text: `Hi ${user?.name || 'there'}! I'm your Strategic Career Advisor. How can I help you with your placement preparation today?`
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [fileContent, setFileContent] = useState(null);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  
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
        toast.success("Resume attached successfully!");
      } catch (err) {
        console.error(err);
        toast.error("Failed to parse file.");
      }
    }
  };

  const removeFile = () => {
    setAttachedFile(null);
    setFileContent(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    if (!apiKey) {
      setMessages(prev => [...prev, 
        { role: 'user', text: input },
        { role: 'model', text: 'Error: Gemini API Key is missing. Please configure VITE_GEMINI_API_KEY in your .env file.' }
      ]);
      setInput('');
      return;
    }

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    let messageContent = userMessage;
    if (fileContent) {
      messageContent = [`CRITICAL INSTRUCTION: I have provided my resume. You MUST base your career advice strictly on my current background, projects, and skills. Use it to inform your strategy.\n\nUser Question: ${userMessage}`, fileContent];
      removeFile();
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-3.5-flash',
        systemInstruction: "You are an elite Career Advisor & Placement Strategist for CrackNest. Your ONLY purpose is to help students get hired. You provide detailed company-specific roadmaps (e.g., how to get into Google, Cognizant, TCS), technical interview questions, aptitude test strategies, HR round tips, and resume reviews. If a student asks for a roadmap, break it down step-by-step (week by week or month by month) with specific resources and topics. STRICT RULE: You must politely but firmly refuse to answer any prompt that is not related to placements, software engineering careers, coding interviews, or professional development. Keep responses structured, highly actionable, and professional."
      });
      
      const history = messages.slice(1).map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.text }]
      }));
      
      const chat = model.startChat({
        history,
        generationConfig: { maxOutputTokens: 1000 },
      });

      const result = await chat.sendMessage(messageContent);
      const response = await result.response;
      const text = response.text();

      setMessages(prev => [...prev, { role: 'model', text }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: `Sorry, I encountered an error: ${error.message || 'Unknown error'}. Please try again.` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif text-white tracking-tight mb-2">Strategic Career Advisor</h1>
          <p className="text-zinc-400">Get personalized roadmaps, interview strategies, and system-level placement guidance.</p>
        </div>
        <button 
          onClick={() => navigate('/interviews')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#009973] to-[#009973] hover:from-[#00B386] hover:to-[#00B386] text-white font-bold rounded-xl transition-all shadow-lg"
        >
          🎯 Take a Mock Interview
        </button>
      </div>
      
      <div className="flex-1 flex flex-col border border-zinc-700/50 rounded-2xl bg-zinc-900/50 backdrop-blur-md overflow-hidden shadow-2xl">
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {messages.map((msg, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-4 max-w-[80%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
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
                  <Bot size={20} />
                )}
              </div>
              <div className={`p-4 rounded-2xl shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-gradient-to-br from-[#009973] to-[#009973] text-white rounded-tr-sm' 
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
                <Bot size={20} />
              </div>
              <div className="p-4 rounded-2xl shadow-sm bg-zinc-800 border border-zinc-700 text-zinc-400 rounded-tl-sm flex items-center gap-2">
                <Loader2 size={18} className="animate-spin text-[#33bb9a]" />
                <span className="text-sm font-medium">Thinking...</span>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-zinc-800 bg-zinc-900/80">
          {attachedFile && (
            <div className="mb-3 flex items-center gap-2 bg-zinc-800/80 w-max px-3 py-1.5 rounded-lg border border-zinc-700">
              <FileText size={14} className="text-[#33bb9a]" />
              <span className="text-xs text-zinc-300 truncate max-w-[200px]">{attachedFile}</span>
              <button onClick={removeFile} className="ml-1 text-zinc-500 hover:text-red-400 transition-colors">
                <X size={14} />
              </button>
            </div>
          )}
          <form onSubmit={handleSend} className="relative flex items-center">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileChange} 
              accept=".pdf"
            />
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 text-zinc-400 hover:text-[#33bb9a] rounded-full flex items-center justify-center transition-colors"
              title="Attach Resume Context"
            >
              <Paperclip size={20} />
            </button>
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything or upload your resume for context..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-full py-4 pl-14 pr-14 text-white placeholder-zinc-500 focus:outline-none focus:border-[#00B386] focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
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
          {!apiKey && (
            <p className="text-red-400 text-xs mt-2 text-center font-medium">
              Note: Gemini API key is missing. Add VITE_GEMINI_API_KEY to your frontend .env file.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StrategicCareerAdvisor;
