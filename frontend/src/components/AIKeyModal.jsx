import React, { useState, useEffect } from 'react';
import { Key, Sparkles, Check, AlertCircle, RefreshCw, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getActiveApiKey, setCustomApiKey } from '../services/aiService';

export const AIKeyModal = ({ isOpen, onClose }) => {
  const [keyInput, setKeyInput] = useState('');
  const [hasCustomKey, setHasCustomKey] = useState(false);

  useEffect(() => {
    const custom = localStorage.getItem('user_gemini_api_key') || '';
    setKeyInput(custom);
    setHasCustomKey(Boolean(custom));
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    if (keyInput.trim()) {
      setCustomApiKey(keyInput.trim());
      toast.success("Custom Gemini API Key saved successfully!");
      setHasCustomKey(true);
    } else {
      setCustomApiKey('');
      toast.success("Reset to default system API Key.");
      setHasCustomKey(false);
    }
    onClose();
  };

  const handleClear = () => {
    setCustomApiKey('');
    setKeyInput('');
    setHasCustomKey(false);
    toast.success("Cleared custom API key.");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Sparkles size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">AI Model & API Key Settings</h3>
            <p className="text-xs text-zinc-400">Multi-model fallback active with real-world intelligence</p>
          </div>
        </div>

        <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 mb-5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400">Active Key Source:</span>
            <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${hasCustomKey ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'}`}>
              {hasCustomKey ? 'Custom User Key' : 'Default System Key'}
            </span>
          </div>
          <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
            <Check size={14} className="text-green-400" />
            <span>Automatic fallback across Gemma 4 26B, Gemma 31B, & Gemini 2.0 Flash</span>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
              Enter Custom Gemini API Key (Optional)
            </label>
            <div className="relative">
              <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full pl-10 pr-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>
            <p className="text-[11px] text-zinc-500 mt-1.5">
              Get a free API key from <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" className="text-cyan-400 underline">Google AI Studio</a> to ensure high rate limits.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold rounded-xl text-xs transition-all shadow-lg"
            >
              Save Settings
            </button>
            {hasCustomKey && (
              <button
                type="button"
                onClick={handleClear}
                className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl text-xs transition-colors border border-zinc-700"
              >
                Reset Default
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
