import React, { useState, useEffect, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Moon, Sun, Briefcase } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import Logo from './Logo';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const [scrolled, setScrolled] = useState(false);
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
    { name: 'Mock Interviews', path: '/interviews' }
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ease-in-out ${scrolled ? 'bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/5 py-3' : 'bg-transparent py-5'}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between">
          
          {/* Logo */}
          <Link to="/" className="flex items-center group hover:opacity-90 transition-opacity">
            <Logo size="sm" />
          </Link>

          {/* Center Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link 
                  key={link.name} 
                  to={link.path}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${isActive ? 'text-white' : 'text-zinc-400 hover:text-white'}`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <button 
                  onClick={logout} 
                  className="px-4 py-2 rounded-full text-sm font-medium border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link 
                  to="/login" 
                  className="px-4 py-2 rounded-full text-sm font-medium text-zinc-300 hover:text-white transition-colors hidden sm:block"
                >
                  Log In
                </Link>
                <Link 
                  to="/register" 
                  className="px-4 py-2 rounded-full text-sm font-medium bg-[#009973] hover:bg-[#00B386] text-white transition-all"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
