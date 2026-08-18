import React, { useState, useEffect, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import Logo from './Logo';
import { User as UserIcon, LogOut, Sparkles } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const [scrolled, setScrolled] = useState(false);
  const [hoveredPath, setHoveredPath] = useState(null);
  const location = useLocation();

  useEffect(() => {
    // Force dark mode always
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Resume Analyzer', path: '/resume' },
    { name: 'Company Roadmap', path: '/companies' },
    { name: 'Mock Interviews', path: '/interviews' }
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ease-in-out ${
      scrolled 
        ? 'bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-800/80 py-3 shadow-2xl shadow-black/50' 
        : 'bg-transparent py-5'
    }`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between">
          
          {/* Logo with Hover Animation */}
          <Link to="/" className="flex items-center group transition-transform duration-300 transform hover:scale-105">
            <Logo size="sm" />
          </Link>

          {/* Center Links with Floating Hover Pill */}
          <div 
            className="hidden md:flex items-center gap-1 bg-zinc-900/60 p-1.5 rounded-full border border-zinc-800/60 backdrop-blur-md relative"
            onMouseLeave={() => setHoveredPath(null)}
          >
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              const isHovered = hoveredPath === link.path;

              return (
                <Link 
                  key={link.name} 
                  to={link.path}
                  onMouseEnter={() => setHoveredPath(link.path)}
                  className="relative px-4 py-2 rounded-full text-xs font-semibold transition-colors duration-200 flex items-center gap-2 cursor-pointer select-none"
                >
                  {/* Sliding Hover Pill Background */}
                  {isHovered && (
                    <motion.div
                      layoutId="navbar-hover-pill"
                      className="absolute inset-0 bg-[#00B386]/15 border border-[#00B386]/40 rounded-full shadow-[0_0_15px_rgba(0,179,134,0.2)]"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}

                  {/* Active Indicator Background */}
                  {isActive && !isHovered && (
                    <div className="absolute inset-0 bg-white/10 rounded-full border border-white/15" />
                  )}

                  <span className={`relative z-10 transition-colors duration-200 ${
                    isActive || isHovered ? 'text-white' : 'text-zinc-400'
                  }`}>
                    {link.name}
                  </span>

                  {/* Active Green Glowing Dot */}
                  {isActive && (
                    <span className="relative z-10 w-1.5 h-1.5 rounded-full bg-[#00B386] shadow-[0_0_8px_#00B386] animate-pulse" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right Actions with Micro-animations */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-full text-xs text-zinc-300 font-medium shadow-inner">
                  <UserIcon size={14} className="text-[#33bb9a]" />
                  <span className="max-w-[120px] truncate text-white font-semibold">{user.name}</span>
                </div>

                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={logout} 
                  className="px-4 py-2 rounded-full text-xs font-semibold border border-zinc-800 text-zinc-300 hover:text-white hover:bg-red-950/40 hover:border-red-900/50 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <LogOut size={14} className="text-zinc-400 group-hover:text-red-400" />
                  <span>Logout</span>
                </motion.button>
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link 
                  to="/login" 
                  className="px-4 py-2 rounded-full text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/5 transition-all hidden sm:block cursor-pointer"
                >
                  Log In
                </Link>

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link 
                    to="/register" 
                    className="relative inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold bg-gradient-to-r from-[#009973] to-[#00B386] hover:from-[#00B386] hover:to-[#33bb9a] text-white shadow-[0_0_20px_rgba(0,179,134,0.3)] transition-all cursor-pointer overflow-hidden group"
                  >
                    <Sparkles size={14} className="group-hover:rotate-12 transition-transform" />
                    <span>Get Started</span>
                  </Link>
                </motion.div>
              </div>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;
