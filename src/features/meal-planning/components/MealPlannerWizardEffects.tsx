'use client';

import React from 'react';
import { motion } from 'framer-motion';

// Floating particles component
export const FloatingParticles = () => {
  const [dimensions, setDimensions] = React.useState({ width: 1000, height: 800 });
  const [mounted, setMounted] = React.useState(false);
  
  React.useEffect(() => {
    setMounted(true);
    setDimensions({
      width: window.innerWidth,
      height: window.innerHeight
    });
    
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  if (!mounted) return null;
  
  const isMobile = dimensions.width < 768;
  const particleCount = isMobile ? 10 : 20;
  const particles = Array.from({ length: particleCount });
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white/20 rounded-full"
          initial={{
            x: Math.random() * dimensions.width,
            y: Math.random() * dimensions.height,
          }}
          animate={{
            x: Math.random() * dimensions.width,
            y: -20,
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            repeatDelay: Math.random() * 5,
            ease: "linear"
          }}
        />
      ))}
    </div>
  );
};

// Glow orb effect
export const GlowOrb = ({ color = "purple", size = "large", position }: { 
  color?: string; 
  size?: "small" | "medium" | "large";
  position: { x: string; y: string };
}) => {
  const sizes = {
    small: "w-32 h-32",
    medium: "w-48 h-48",
    large: "w-64 h-64"
  };
  
  const colors = {
    purple: "from-purple-600/30 to-pink-600/30",
    blue: "from-blue-600/30 to-cyan-600/30",
    green: "from-green-600/30 to-emerald-600/30"
  };
  
  return (
    <motion.div
      className={`absolute ${sizes[size]} bg-gradient-radial ${colors[color as keyof typeof colors]} rounded-full filter blur-3xl`}
      style={{ left: position.x, top: position.y }}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.3, 0.5, 0.3],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
  );
};

// Shimmer effect for buttons
export const ShimmerEffect = () => (
  <motion.div
    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
    animate={{
      x: ['-200%', '200%'],
    }}
    transition={{
      duration: 2,
      repeat: Infinity,
      repeatDelay: 3,
      ease: "easeInOut"
    }}
  />
);

// Pulse ring effect
export const PulseRing = ({ delay = 0 }: { delay?: number }) => (
  <motion.div
    className="absolute inset-0 rounded-full border-2 border-white/30"
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{
      scale: [0.8, 1.2],
      opacity: [0, 0.5, 0],
    }}
    transition={{
      duration: 2,
      repeat: Infinity,
      delay,
      ease: "easeOut"
    }}
  />
);

// Success animation component
export const SuccessAnimation = () => (
  <svg className="w-full h-full" viewBox="0 0 100 100">
    <motion.circle
      cx="50"
      cy="50"
      r="45"
      fill="none"
      stroke="url(#gradient)"
      strokeWidth="4"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 1, ease: "easeOut" }}
    />
    <motion.path
      d="M 30 50 L 45 65 L 70 35"
      fill="none"
      stroke="white"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" }}
    />
    <defs>
      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#a855f7" />
        <stop offset="100%" stopColor="#ec4899" />
      </linearGradient>
    </defs>
  </svg>
);

// Magnetic hover effect hook
export const useMagneticHover = () => {
  const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });
  
  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setMousePosition({ x: x * 0.1, y: y * 0.1 });
  };
  
  const handleMouseLeave = () => {
    setMousePosition({ x: 0, y: 0 });
  };
  
  return {
    onMouseMove: handleMouseMove,
    onMouseLeave: handleMouseLeave,
    style: {
      transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`,
      transition: 'transform 0.2s ease-out'
    }
  };
};

// Premium loading spinner
export const PremiumSpinner = () => (
  <div className="relative w-12 h-12">
    <motion.div
      className="absolute inset-0 rounded-full border-3 border-purple-400/30"
      animate={{ rotate: 360 }}
      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
    />
    <motion.div
      className="absolute inset-0 rounded-full border-3 border-transparent border-t-purple-400 border-r-pink-400"
      animate={{ rotate: -360 }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
    />
    <motion.div
      className="absolute inset-2 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 opacity-20"
      animate={{ scale: [0.8, 1, 0.8], opacity: [0.2, 0.4, 0.2] }}
      transition={{ duration: 2, repeat: Infinity }}
    />
  </div>
);

// Animated gradient text
export const GradientText = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <motion.span
    className={`bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent bg-[length:200%_auto] ${className}`}
    animate={{
      backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
    }}
    transition={{
      duration: 5,
      repeat: Infinity,
      ease: "linear"
    }}
  >
    {children}
  </motion.span>
);