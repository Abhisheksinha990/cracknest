import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, FileText, Target, Zap, Mail, MapPin, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import AnimatedShaderBackground from '../components/ui/animated-shader-background';
import { BackgroundPaths } from '../components/ui/background-paths';
import { DotGlobeHero } from '../components/ui/globe-hero';
import { HandwritingSvg } from '../components/ui/handwriting-svg';
import Logo from '../components/Logo';
import './Landing.css';

const HowItWorksSection = () => (
  <section className="container mx-auto px-4 py-24 relative z-10 border-t border-white/5">
    <div className="text-center mb-16">
      <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Your Path to Success</h2>
      <p className="text-zinc-400 text-lg max-w-2xl mx-auto">A proven step-by-step framework to land your dream job.</p>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative max-w-5xl mx-auto">
      {/* Connecting Line (visible on desktop) */}
      <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-[2px] bg-gradient-to-r from-transparent via-[#00B386]/30 to-transparent z-0"></div>
      
      <div className="relative z-10 flex flex-col items-center text-center group">
        <div className="w-24 h-24 rounded-full bg-[#111] border-2 border-white/10 flex items-center justify-center text-3xl font-bold text-zinc-500 mb-6 group-hover:border-[#00B386] group-hover:text-[#33bb9a] transition-colors shadow-[0_0_30px_rgba(0,0,0,0.5)]">
          1
        </div>
        <h3 className="text-xl font-bold text-white mb-3">Upload Resume</h3>
        <p className="text-zinc-400 leading-relaxed">
          Get an instant ATS compatibility score and actionable feedback to bypass automated screening.
        </p>
      </div>
      
      <div className="relative z-10 flex flex-col items-center text-center group">
        <div className="w-24 h-24 rounded-full bg-[#111] border-2 border-white/10 flex items-center justify-center text-3xl font-bold text-zinc-500 mb-6 group-hover:border-[#00B386] group-hover:text-[#33bb9a] transition-colors shadow-[0_0_30px_rgba(0,0,0,0.5)]">
          2
        </div>
        <h3 className="text-xl font-bold text-white mb-3">Follow Roadmaps</h3>
        <p className="text-zinc-400 leading-relaxed">
          Access tailored study plans based on your target companies and current skill gaps.
        </p>
      </div>
      
      <div className="relative z-10 flex flex-col items-center text-center group">
        <div className="w-24 h-24 rounded-full bg-[#111] border-2 border-white/10 flex items-center justify-center text-3xl font-bold text-zinc-500 mb-6 group-hover:border-[#00B386] group-hover:text-[#33bb9a] transition-colors shadow-[0_0_30px_rgba(0,0,0,0.5)]">
          3
        </div>
        <h3 className="text-xl font-bold text-white mb-3">Mock Interviews</h3>
        <p className="text-zinc-400 leading-relaxed">
          Practice in a simulated environment and receive AI-driven insights on your performance.
        </p>
      </div>
    </div>
  </section>
);

const ProCTASection = () => (
  <section className="container mx-auto px-4 pt-16 pb-32 mb-24 relative z-10 text-center flex flex-col items-center">
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg h-64 bg-[#00B386]/5 rounded-full blur-3xl pointer-events-none"></div>
    
    <div className="relative z-10">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00B386]/10 border border-[#00B386]/20 text-[#00B386] font-medium text-xs mb-5">
        <Star size={14} fill="currentColor" />
        CrackNest Pro
      </div>
      
      <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">Unlock Your Full Potential</h2>
      <p className="text-zinc-400 text-base md:text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
        Get unlimited mock interviews, advanced ATS resume analysis, and premium company roadmaps. Join thousands of students landing their dream jobs.
      </p>
      
      <Link to="/pricing" className="inline-flex items-center gap-2 px-8 py-4 bg-[#00B386] hover:bg-[#009973] text-white rounded-full font-semibold transition-all shadow-lg shadow-[#00B386]/20">
        Upgrade to Pro <ArrowRight size={18} />
      </Link>
    </div>
  </section>
);

const Footer = () => (
  <footer className="border-t border-white/10 bg-[#0a0a0a] relative z-10 overflow-hidden">
    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-24 bg-[#00B386]/10 blur-3xl rounded-t-full"></div>
    
    <div className="container mx-auto px-4 py-10 relative z-10">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="md:col-span-2">
          <Link to="/" className="inline-block mb-4 hover:opacity-90 transition-opacity">
            <Logo size="md" />
          </Link>
          <p className="text-zinc-400 max-w-sm leading-relaxed mb-4 text-sm">
            Empowering students to achieve their career goals through smart preparation and personalized guidance.
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-zinc-400 text-sm">
              <Mail size={16} className="text-[#33bb9a]" />
              <a href="mailto:support@cracknest.com" className="hover:text-[#33bb9a] transition-colors">support@cracknest.com</a>
            </div>
            <div className="flex items-center gap-2 text-zinc-400 text-sm">
              <MapPin size={16} className="text-[#33bb9a]" />
              <span>123 Placement Drive, Tech Park, Bangalore 560001</span>
            </div>
          </div>
        </div>
        
        <div>
          <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Features</h4>
          <ul className="space-y-2 text-sm text-zinc-400">
            <li><Link to="/resume" className="hover:text-white transition-colors">Resume Analyzer</Link></li>
            <li><Link to="/companies" className="hover:text-white transition-colors">Company Roadmaps</Link></li>
            <li><Link to="/interviews" className="hover:text-white transition-colors">Mock Interviews</Link></li>
            <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing Plans</Link></li>
          </ul>
        </div>
        
        <div>
          <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Company</h4>
          <ul className="space-y-2 text-sm text-zinc-400">
            <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
          </ul>
        </div>
      </div>
      
      <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-zinc-500 text-sm">© {new Date().getFullYear()} CrackNest. All rights reserved.</p>
        <div className="flex gap-4">
          <a href="#" className="hover:text-white transition-colors text-sm font-medium">Twitter</a>
          <a href="#" className="hover:text-white transition-colors text-sm font-medium">LinkedIn</a>
          <a href="#" className="hover:text-white transition-colors text-sm font-medium">GitHub</a>
        </div>
      </div>
    </div>
  </footer>
);

const Landing = () => {
  const { user } = useContext(AuthContext);
  const displayName = user?.name || "Public Guest User";
  
  return (
    <div className="landing-page flex flex-col min-h-screen w-full relative bg-zinc-950 overflow-x-hidden">
      
      {/* Hero-1 Top Gradient Background */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80 min-h-screen pointer-events-none"
      >
        <div
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            background: 'linear-gradient(to top right, #00B386, #33bb9a)'
          }}
          className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] max-w-none -translate-x-1/2 rotate-[30deg] opacity-25 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem] min-h-screen"
        />
      </div>

      {/* Hero Section with Interactive 3D DotGlobeHero Background */}
      <DotGlobeHero rotationSpeed={0.004} globeRadius={1.2} className="bg-transparent border-b border-white/5">
        <div className="pt-24 pb-16 px-4 flex flex-col items-center justify-center text-center max-w-4xl mx-auto z-10">
      
          {/* Badge with Red Pulsing Live Dot */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 font-semibold text-xs uppercase tracking-widest mb-6 shadow-xl backdrop-blur-md"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 shadow-[0_0_8px_#EF4444]"></span>
            </span>
            <span>Career Preparation Platform</span>
          </motion.div>

          {/* Heading matching design prompt */}
          <motion.div
            initial={{ opacity: 0.5, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8, ease: "easeInOut" }}
            className="flex flex-col items-center text-center"
          >
            <h1 className="text-5xl font-extrabold tracking-tight text-white md:text-7xl leading-none mb-2 font-sans">
              Welcome Back,
            </h1>

            <div className="flex justify-center items-center overflow-visible py-1 w-full">
              <HandwritingSvg
                text={displayName}
                fontSize={48}
                strokeWidth={2.5}
                duration={2.5}
                delay={0.3}
                className="text-[#00B386]"
              />
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mt-6 text-sm md:text-base font-semibold text-[#00B386] tracking-widest uppercase text-center"
          >
            From Resume to Offer Letter
          </motion.div>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="mt-4 max-w-2xl text-center text-zinc-400 text-base md:text-lg font-medium leading-relaxed"
          >
            {user ? "Ready to continue your placement preparation journey? Head over to your dashboard tools." : "CrackNest analyzes your resume, builds personalized roadmaps, and prepares you for top tech companies with interactive mock interviews and coding challenges."}
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="mt-10 flex gap-4 z-50 relative"
          >
            <Link to={user ? "/resume" : "/register"} className="btn btn-primary px-8 py-4 bg-[#009973] hover:bg-[#00B386] text-white rounded-full font-semibold transition-all shadow-lg shadow-[#009973]/20 flex items-center gap-2 cursor-pointer">
              {user ? "Go to Tools" : "Start for Free"} <ArrowRight size={18} />
            </Link>
            <Link to="/pricing" className="btn btn-secondary px-8 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-full font-semibold transition-all cursor-pointer">
              View Pricing
            </Link>
          </motion.div>

        </div>
      </DotGlobeHero>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-24 relative z-10 bg-transparent">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">Everything You Need</h2>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">A comprehensive toolkit designed to help you ace your interviews and land offers.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          
          <motion.div 
            whileHover={{ y: -14, scale: 1.03 }}
            transition={{ type: "spring", stiffness: 350, damping: 22 }}
            className="bg-zinc-900/60 border border-white/15 rounded-3xl p-8 hover:border-[#00B386] hover:bg-zinc-900/90 hover:shadow-[0_25px_60px_rgba(0,179,134,0.35)] group flex flex-col relative overflow-hidden cursor-pointer backdrop-blur-md"
          >
            <div className="absolute top-0 right-0 w-36 h-36 bg-[#00B386]/10 rounded-bl-full -mr-8 -mt-8 transition-all duration-500 group-hover:scale-150 group-hover:bg-[#00B386]/30 pointer-events-none"></div>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-zinc-200 group-hover:text-white bg-white/10 mb-8 group-hover:bg-[#00B386] group-hover:shadow-[0_0_25px_rgba(0,179,134,0.6)] transition-all duration-300 transform group-hover:scale-110">
              <FileText size={28} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-[#33bb9a] transition-colors">Resume ATS Scoring</h3>
            <p className="text-zinc-400 leading-relaxed mb-8 flex-1 group-hover:text-zinc-200 transition-colors">
              Upload your resume and get detailed ATS compatibility analysis, keyword optimization recommendations, and industry benchmarks.
            </p>
            <Link to="/resume" className="inline-flex items-center gap-2 text-[#00B386] font-bold group-hover:gap-3 transition-all text-sm group-hover:text-[#33bb9a]">
              <span>Analyze Resume</span>
              <ArrowRight size={16} className="transform group-hover:translate-x-1.5 transition-transform" />
            </Link>
          </motion.div>

          <motion.div 
            whileHover={{ y: -14, scale: 1.03 }}
            transition={{ type: "spring", stiffness: 350, damping: 22 }}
            className="bg-zinc-900/60 border border-white/15 rounded-3xl p-8 hover:border-[#00B386] hover:bg-zinc-900/90 hover:shadow-[0_25px_60px_rgba(0,179,134,0.35)] group flex flex-col relative overflow-hidden cursor-pointer backdrop-blur-md"
          >
            <div className="absolute top-0 right-0 w-36 h-36 bg-[#00B386]/10 rounded-bl-full -mr-8 -mt-8 transition-all duration-500 group-hover:scale-150 group-hover:bg-[#00B386]/30 pointer-events-none"></div>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-zinc-200 group-hover:text-white bg-white/10 mb-8 group-hover:bg-[#00B386] group-hover:shadow-[0_0_25px_rgba(0,179,134,0.6)] transition-all duration-300 transform group-hover:scale-110">
              <Target size={28} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-[#33bb9a] transition-colors">Company Roadmaps</h3>
            <p className="text-zinc-400 leading-relaxed mb-8 flex-1 group-hover:text-zinc-200 transition-colors">
              Access company-specific interview preparation guides for top tech companies. Know what to expect and study efficiently.
            </p>
            <Link to="/companies" className="inline-flex items-center gap-2 text-[#00B386] font-bold group-hover:gap-3 transition-all text-sm group-hover:text-[#33bb9a]">
              <span>Explore Roadmaps</span>
              <ArrowRight size={16} className="transform group-hover:translate-x-1.5 transition-transform" />
            </Link>
          </motion.div>

          <motion.div 
            whileHover={{ y: -14, scale: 1.03 }}
            transition={{ type: "spring", stiffness: 350, damping: 22 }}
            className="bg-zinc-900/60 border border-white/15 rounded-3xl p-8 hover:border-[#00B386] hover:bg-zinc-900/90 hover:shadow-[0_25px_60px_rgba(0,179,134,0.35)] group flex flex-col relative overflow-hidden cursor-pointer backdrop-blur-md"
          >
            <div className="absolute top-0 right-0 w-36 h-36 bg-[#00B386]/10 rounded-bl-full -mr-8 -mt-8 transition-all duration-500 group-hover:scale-150 group-hover:bg-[#00B386]/30 pointer-events-none"></div>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-zinc-200 group-hover:text-white bg-white/10 mb-8 group-hover:bg-[#00B386] group-hover:shadow-[0_0_25px_rgba(0,179,134,0.6)] transition-all duration-300 transform group-hover:scale-110">
              <Zap size={28} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-[#33bb9a] transition-colors">AI Mock Interviews</h3>
            <p className="text-zinc-400 leading-relaxed mb-8 flex-1 group-hover:text-zinc-200 transition-colors">
              Practice 8-question structured mock interviews with AI. Get realistic feedback on your technical and behavioral responses.
            </p>
            <Link to="/interviews" className="inline-flex items-center gap-2 text-[#00B386] font-bold group-hover:gap-3 transition-all text-sm group-hover:text-[#33bb9a]">
              <span>Start Interview</span>
              <ArrowRight size={16} className="transform group-hover:translate-x-1.5 transition-transform" />
            </Link>
          </motion.div>

        </div>
      </section>

      <HowItWorksSection />
      <ProCTASection />
      
      {/* Hero-1 Bottom Gradient Background */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 -z-10 transform-gpu overflow-hidden blur-3xl pointer-events-none"
      >
        <div
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            background: 'linear-gradient(to top right, #00B386, #005540)'
          }}
          className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] max-w-none -translate-x-1/2 opacity-25 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
        />
      </div>

      <Footer />
    </div>
  );
};

export default Landing;
