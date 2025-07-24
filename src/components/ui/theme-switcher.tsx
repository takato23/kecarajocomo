'use client';

import { useState, useEffect } from 'react';
import { Moon, Sun, Monitor, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { cn } from '@/lib/utils';

type Theme = 'light' | 'dark' | 'system';

interface ThemeSwitcherProps {
  className?: string;
  showLabel?: boolean;
  variant?: 'default' | 'minimal' | 'glass';
}

export function ThemeSwitcher({ 
  className, 
  showLabel = false,
  variant = 'default' 
}: ThemeSwitcherProps) {
  const [theme, setTheme] = useState<Theme>('system');
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Get initial theme from localStorage or system
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    }
  }, []);

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    
    if (newTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(newTheme);
    }
    
    localStorage.setItem('theme', newTheme);
  };

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    applyTheme(newTheme);
    setIsOpen(false);
  };

  const themes = [
    { value: 'light' as Theme, label: 'Light', icon: Sun },
    { value: 'dark' as Theme, label: 'Dark', icon: Moon },
    { value: 'system' as Theme, label: 'System', icon: Monitor },
  ];

  const currentIcon = themes.find(t => t.value === theme)?.icon || Sun;

  if (!mounted) return null;

  const buttonClasses = cn(
    'relative inline-flex items-center justify-center rounded-lg transition-all duration-300',
    {
      'default': 'p-2 hover:bg-gray-100 dark:hover:bg-gray-800',
      'minimal': 'p-1.5 hover:bg-gray-100/50 dark:hover:bg-gray-800/50',
      'glass': 'p-2 backdrop-blur-md bg-white/10 hover:bg-white/20 dark:bg-black/10 dark:hover:bg-black/20 border border-white/20 dark:border-white/10'
    }[variant],
    className
  );

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={buttonClasses}
        aria-label="Toggle theme"
      >
        <motion.div
          key={theme}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {currentIcon && <currentIcon className="h-5 w-5 text-gray-700 dark:text-gray-300" />}
        </motion.div>
        {showLabel && (
          <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            {themes.find(t => t.value === theme)?.label}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "absolute right-0 mt-2 w-36 origin-top-right rounded-xl shadow-lg ring-1 ring-black/5 z-50",
              variant === 'glass' 
                ? "backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border border-white/20 dark:border-white/10"
                : "bg-white dark:bg-gray-900"
            )}
          >
            <div className="p-1.5">
              {themes.map((item) => {
                const Icon = item.icon;
                const isActive = theme === item.value;
                
                return (
                  <button
                    key={item.value}
                    onClick={() => handleThemeChange(item.value)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all duration-200",
                      isActive
                        ? "bg-primary/10 text-primary dark:bg-primary/20"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="font-medium">{item.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="activeTheme"
                        className="ml-auto h-1.5 w-1.5 rounded-full bg-primary"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}

              <div className="my-1.5 h-px bg-gray-200 dark:bg-gray-700" />
              
              <button
                onClick={() => setIsOpen(false)}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Palette className="h-4 w-4" />
                <span className="font-medium">Customize</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Floating theme switcher for demo/standalone use
export function FloatingThemeSwitcher() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5, duration: 0.3 }}
      className="fixed bottom-4 right-4 z-50"
    >
      <ThemeSwitcher variant="glass" />
    </motion.div>
  );
}