'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';

import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface DarkModeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function DarkModeToggle({ className, size = 'md' }: DarkModeToggleProps) {
  const { effectiveTheme, toggleTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  const sizes = {
    sm: {
      wrapper: 'w-12 h-6',
      ball: 'w-4 h-4',
      icon: 'w-2.5 h-2.5',
      translate: 'translate-x-6'
    },
    md: {
      wrapper: 'w-16 h-8',
      ball: 'w-6 h-6',
      icon: 'w-3.5 h-3.5',
      translate: 'translate-x-8'
    },
    lg: {
      wrapper: 'w-20 h-10',
      ball: 'w-8 h-8',
      icon: 'w-5 h-5',
      translate: 'translate-x-10'
    }
  };

  const sizeConfig = sizes[size];

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "relative inline-flex items-center rounded-full p-1 transition-all duration-500",
        "bg-gradient-to-r",
        isDark 
          ? "from-purple-600 to-blue-600 shadow-lg shadow-blue-500/25" 
          : "from-yellow-400 to-orange-500 shadow-lg shadow-orange-500/25",
        "hover:scale-105 active:scale-95",
        sizeConfig.wrapper,
        className
      )}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {/* Background gradient animation */}
      <div className="absolute inset-0 rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-0 opacity-75"
          animate={{
            background: isDark 
              ? ['linear-gradient(45deg, #1e3a8a, #7c3aed)', 'linear-gradient(405deg, #7c3aed, #1e3a8a)']
              : ['linear-gradient(45deg, #fbbf24, #f97316)', 'linear-gradient(405deg, #f97316, #fbbf24)']
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatType: 'reverse'
          }}
        />
      </div>

      {/* Stars/Sparkles for dark mode */}
      {isDark && (
        <div className="absolute inset-0 rounded-full overflow-hidden">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-0.5 h-0.5 bg-white rounded-full"
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1.5, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.4,
              }}
              style={{
                left: `${20 + i * 25}%`,
                top: `${30 + i * 15}%`,
              }}
            />
          ))}
        </div>
      )}

      {/* Clouds for light mode */}
      {!isDark && (
        <div className="absolute inset-0 rounded-full overflow-hidden">
          <motion.div
            className="absolute w-3 h-2 bg-white/40 rounded-full blur-sm"
            animate={{
              x: [-10, 10, -10],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
            }}
            style={{ left: '20%', top: '30%' }}
          />
          <motion.div
            className="absolute w-2 h-1.5 bg-white/30 rounded-full blur-sm"
            animate={{
              x: [10, -10, 10],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
            }}
            style={{ left: '60%', top: '50%' }}
          />
        </div>
      )}

      {/* Toggle ball */}
      <motion.div
        className={cn(
          "relative z-10 rounded-full bg-white shadow-lg",
          "flex items-center justify-center",
          sizeConfig.ball
        )}
        animate={{
          x: isDark ? sizeConfig.translate.split('-')[1] : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 380,
          damping: 30,
        }}
      >
        <motion.div
          animate={{ rotate: isDark ? 180 : 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          {isDark ? (
            <Moon className={cn("text-purple-600", sizeConfig.icon)} />
          ) : (
            <Sun className={cn("text-orange-500", sizeConfig.icon)} />
          )}
        </motion.div>
      </motion.div>

      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 rounded-full"
        animate={{
          boxShadow: isDark
            ? ['0 0 20px rgba(147, 51, 234, 0.5)', '0 0 40px rgba(147, 51, 234, 0.3)']
            : ['0 0 20px rgba(251, 191, 36, 0.5)', '0 0 40px rgba(251, 191, 36, 0.3)']
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatType: 'reverse'
        }}
      />
    </button>
  );
}

// Compact toggle for navbar
export function CompactDarkModeToggle({ className }: { className?: string }) {
  const { effectiveTheme, toggleTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  return (
    <motion.button
      onClick={toggleTheme}
      className={cn(
        "relative p-2 rounded-xl transition-all duration-300",
        "bg-white/10 backdrop-blur-sm border border-white/20",
        "hover:bg-white/20 hover:border-white/30",
        "dark:bg-white/5 dark:border-white/10",
        "dark:hover:bg-white/10 dark:hover:border-white/20",
        className
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <motion.div
        animate={{ rotate: isDark ? 180 : 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      >
        {isDark ? (
          <Moon className="w-5 h-5 text-purple-400" />
        ) : (
          <Sun className="w-5 h-5 text-orange-500" />
        )}
      </motion.div>

      {/* Subtle glow */}
      <motion.div
        className="absolute inset-0 rounded-xl pointer-events-none"
        animate={{
          opacity: [0.5, 0.8, 0.5]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
        }}
        style={{
          background: isDark
            ? 'radial-gradient(circle, rgba(147, 51, 234, 0.2) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(251, 191, 36, 0.2) 0%, transparent 70%)',
        }}
      />
    </motion.button>
  );
}