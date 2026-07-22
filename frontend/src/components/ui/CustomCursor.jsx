import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const CustomCursor = () => {
  const [mousePosition, setMousePosition] = useState({ x: -100, y: -100 });
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateMousePosition = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseOver = (e) => {
      const target = e.target;
      if (
        target.tagName.toLowerCase() === 'button' ||
        target.tagName.toLowerCase() === 'a' ||
        target.closest('button') ||
        target.closest('a') ||
        target.classList.contains('cursor-pointer') ||
        window.getComputedStyle(target).cursor === 'pointer'
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    window.addEventListener('mousemove', updateMousePosition);
    window.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
      window.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <>
      {/* Main cursor dot */}
      <motion.div
        className="fixed top-0 left-0 w-4 h-4 bg-[#00B386] rounded-full pointer-events-none z-[9999] mix-blend-screen shadow-[0_0_10px_rgba(99,102,241,0.8)]"
        animate={{
          x: mousePosition.x - 8,
          y: mousePosition.y - 8,
          scale: isHovering ? 1.5 : 1,
        }}
        transition={{
          type: 'spring',
          stiffness: 1000,
          damping: 50,
          mass: 0.1,
        }}
      />
      {/* Trailing ring */}
      <motion.div
        className="fixed top-0 left-0 w-12 h-12 border border-[#33bb9a] rounded-full pointer-events-none z-[9998] mix-blend-screen"
        animate={{
          x: mousePosition.x - 24,
          y: mousePosition.y - 24,
          scale: isHovering ? 1.5 : 1,
          opacity: isHovering ? 0 : 0.5,
        }}
        transition={{
          type: 'spring',
          stiffness: 150,
          damping: 20,
          mass: 0.5,
        }}
      />
      {/* Soft background aura */}
      <motion.div
        className="fixed top-0 left-0 w-64 h-64 bg-[#009973]/10 rounded-full pointer-events-none z-[9997] blur-3xl mix-blend-screen"
        animate={{
          x: mousePosition.x - 128,
          y: mousePosition.y - 128,
        }}
        transition={{
          type: 'tween',
          ease: 'linear',
          duration: 0.1,
        }}
      />
    </>
  );
};

export default CustomCursor;
