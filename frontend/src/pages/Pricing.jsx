import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Sparkles } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { BackgroundPaths } from '../components/ui/background-paths';

const Pricing = () => {
  const { user, upgradeToPro } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <BackgroundPaths>
      <div className="min-h-screen pt-32 pb-20 px-4 sm:px-6 relative flex flex-col items-center">
        {/* Background removed */}

      <div className="max-w-5xl w-full mx-auto relative z-10">
        <div className="text-center mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-serif text-white mb-4 tracking-tight"
          >
            Simple, transparent <span className="text-[#33bb9a] italic">pricing</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-zinc-400 text-lg max-w-xl mx-auto"
          >
            Start for free, upgrade when you need more power to accelerate your placement journey.
          </motion.p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded bg-[#111] border border-white/5 text-sm text-zinc-300">
            <span className="w-2 h-2 rounded-full bg-[#00B386]"></span>
            A Google account is required to sign up for any of our plans.
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Tier */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#111] border border-white/5 rounded-xl p-8 flex flex-col"
          >
            <h3 className="text-2xl font-serif text-white mb-2">Free</h3>
            <p className="text-zinc-400 mb-6 h-12">Perfect for getting started and exploring the platform.</p>
            
            <div className="mb-8">
              <span className="text-5xl font-extrabold text-white">₹0</span>
              <span className="text-zinc-500 font-medium">/mo</span>
            </div>

            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-center gap-3 text-zinc-300">
                <div className="w-6 h-6 rounded bg-white/5 flex items-center justify-center text-[#33bb9a]">
                  <Check size={14} />
                </div>
                1 Resume Analysis per month
              </li>
              <li className="flex items-center gap-3 text-zinc-300">
                <div className="w-6 h-6 rounded bg-white/5 flex items-center justify-center text-[#33bb9a]">
                  <Check size={14} />
                </div>
                Basic Job Board Access
              </li>
              <li className="flex items-center gap-3 text-zinc-300">
                <div className="w-6 h-6 rounded bg-white/5 flex items-center justify-center text-[#33bb9a]">
                  <Check size={14} />
                </div>
                1 Mock Interview
              </li>
            </ul>

            <Link to={user ? "/resume" : "/register"} className="w-full py-4 rounded font-bold text-white bg-zinc-800 hover:bg-zinc-700 transition-colors border border-zinc-700 text-center block">
              Continue with Free
            </Link>
          </motion.div>

          {/* Pro Tier */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-[#0a0a0a] border border-[#00B386]/50 rounded-xl p-8 flex flex-col relative"
          >
            <div className="absolute -top-3 left-1/2 -tranzinc-x-1/2 px-4 py-1 rounded bg-[#009973] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm">
              <Sparkles size={12} />
              Most Popular
            </div>

            <h3 className="text-2xl font-serif text-white mb-2">Pro</h3>
            <p className="text-zinc-400 mb-6 h-12">For serious job seekers ready to land their dream offer.</p>
            
            <div className="mb-8">
              <span className="text-5xl font-extrabold text-white">₹99</span>
              <span className="text-zinc-500 font-medium">/mo</span>
            </div>

            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-center gap-3 text-zinc-200">
                <div className="w-6 h-6 rounded bg-[#00B386]/20 flex items-center justify-center text-[#33bb9a] border border-[#00B386]/30">
                  <Check size={14} />
                </div>
                Unlimited Resume Analysis
              </li>
              <li className="flex items-center gap-3 text-zinc-200">
                <div className="w-6 h-6 rounded bg-[#00B386]/20 flex items-center justify-center text-[#33bb9a] border border-[#00B386]/30">
                  <Check size={14} />
                </div>
                Premium Job Board Access
              </li>
              <li className="flex items-center gap-3 text-zinc-200">
                <div className="w-6 h-6 rounded bg-[#00B386]/20 flex items-center justify-center text-[#33bb9a] border border-[#00B386]/30">
                  <Check size={14} />
                </div>
                Unlimited Mock Interviews
              </li>
              <li className="flex items-center gap-3 text-zinc-200">
                <div className="w-6 h-6 rounded bg-[#00B386]/20 flex items-center justify-center text-[#33bb9a] border border-[#00B386]/30">
                  <Check size={14} />
                </div>
                Strategic Career Advisor Access
              </li>
            </ul>

            {user?.role === 'PRO' ? (
              <button disabled className="w-full py-4 rounded font-bold text-[#009973] bg-[#00B386]/10 border border-[#00B386]/30 text-center block cursor-default">
                Current Plan
              </button>
            ) : user ? (
              <button onClick={() => navigate('/resume')} className="w-full py-4 rounded font-bold text-white bg-[#009973] hover:bg-[#00B386] transition-all shadow-sm text-center block">
                Upgrade to Pro
              </button>
            ) : (
              <Link to="/register" className="w-full py-4 rounded font-bold text-white bg-[#009973] hover:bg-[#00B386] transition-all shadow-sm text-center block">
                Upgrade to Pro
              </Link>
            )}
          </motion.div>
        </div>
        </div>
      </div>
    </BackgroundPaths>
  );
};

export default Pricing;
