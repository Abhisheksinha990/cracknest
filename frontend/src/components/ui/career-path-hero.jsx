import React from 'react';

export function CareerPathHero({ children, className = '' }) {
  return (
    <div className={`relative min-h-screen w-full flex flex-col justify-center items-center overflow-hidden ${className}`}>
      
      {/* Background Soft Layered Gradient Blobs */}
      <div aria-hidden="true" className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Top-center emerald glow blob */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[450px] bg-gradient-to-tr from-[#10b981]/20 via-[#0d9488]/15 to-transparent rounded-full blur-[130px] opacity-75" />
        
        {/* Soft mint accent glow */}
        <div className="absolute top-1/3 left-1/3 w-[380px] h-[380px] bg-[#e0fff4]/10 rounded-full blur-[110px] opacity-40" />

        {/* Bottom soft teal glow */}
        <div className="absolute bottom-10 right-1/4 w-[550px] h-[320px] bg-[#0d9488]/15 rounded-full blur-[140px] opacity-60" />
      </div>

      {/* Upward Growth & Trajectory Path Motif Overlay */}
      <div aria-hidden="true" className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center opacity-40">
        <svg className="w-full max-w-5xl h-[480px]" viewBox="0 0 1000 500" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Faint document / resume background grid lines */}
          <line x1="150" y1="100" x2="850" y2="100" stroke="rgba(255,255,255,0.04)" strokeDasharray="6 6" />
          <line x1="150" y1="200" x2="850" y2="200" stroke="rgba(255,255,255,0.04)" strokeDasharray="6 6" />
          <line x1="150" y1="300" x2="850" y2="300" stroke="rgba(255,255,255,0.04)" strokeDasharray="6 6" />
          <line x1="150" y1="400" x2="850" y2="400" stroke="rgba(255,255,255,0.04)" strokeDasharray="6 6" />
          
          {/* Main Upward Career Trajectory Path */}
          <path
            d="M 150 420 Q 350 400 450 280 T 850 100"
            stroke="url(#upward-gradient)"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          
          {/* Secondary Parallel Flow Line */}
          <path
            d="M 180 440 Q 370 420 470 300 T 870 120"
            stroke="url(#upward-gradient-secondary)"
            strokeWidth="1.5"
            strokeDasharray="4 8"
            strokeLinecap="round"
          />

          {/* Milestone Checkpoint Nodes */}
          <circle cx="270" cy="385" r="6" fill="#10b981" />
          <circle cx="450" cy="280" r="7" fill="#10b981" />
          <circle cx="630" cy="190" r="7" fill="#34d399" />
          <circle cx="850" cy="100" r="8" fill="#10b981" />

          {/* Gradients */}
          <defs>
            <linearGradient id="upward-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0d9488" stopOpacity="0.1" />
              <stop offset="50%" stopColor="#10b981" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#e0fff4" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="upward-gradient-secondary" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#5eead4" stopOpacity="0.5" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Foreground Content */}
      <div className="relative z-10 w-full">
        {children}
      </div>
    </div>
  );
}

export default CareerPathHero;
