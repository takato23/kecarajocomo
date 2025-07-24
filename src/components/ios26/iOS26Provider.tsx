/**
 * iOS26 Provider
 * Context provider for the iOS26 design system
 */

'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

import { iOS26Tokens, Theme } from '@/styles/ios26/tokens';

interface iOS26ContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isGlassEnabled: boolean;
  setGlassEnabled: (enabled: boolean) => void;
  reduceMotion: boolean;
}

const iOS26Context = createContext<iOS26ContextValue | undefined>(undefined);

export const useIOS26 = () => {
  const context = useContext(iOS26Context);
  if (!context) {
    throw new Error('useIOS26 must be used within iOS26Provider');
  }
  return context;
};

interface iOS26ProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

export const IOS26Provider: React.FC<iOS26ProviderProps> = ({
  children,
  defaultTheme = 'elegant',
  storageKey = 'ios26-theme'
}) => {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [isGlassEnabled, setGlassEnabled] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);
  
  // Load theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem(storageKey);
    if (savedTheme && savedTheme in iOS26Tokens.themes) {
      setThemeState(savedTheme as Theme);
    }
  }, [storageKey]);
  
  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setReduceMotion(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  // Apply theme to CSS variables
  useEffect(() => {
    const root = document.documentElement;
    const themeConfig = iOS26Tokens.themes[theme];
    
    // Set CSS variables
    root.style.setProperty('--ios26-primary', themeConfig.primary);
    root.style.setProperty('--ios26-secondary', themeConfig.secondary);
    root.style.setProperty('--ios26-accent', themeConfig.accent);
    root.style.setProperty('--ios26-gradient-primary', themeConfig.gradient.primary);
    root.style.setProperty('--ios26-gradient-secondary', themeConfig.gradient.secondary);
    root.style.setProperty('--ios26-gradient-accent', themeConfig.gradient.accent);
    root.style.setProperty('--ios26-gradient-mesh', themeConfig.gradient.mesh);
    
    // Apply theme class
    root.classList.remove(...Object.keys(iOS26Tokens.themes).map(t => `ios26-theme-${t}`));
    root.classList.add(`ios26-theme-${theme}`);
    
    // Handle dark mode
    const isDark = theme === 'cinema' || 
      (theme === 'modern' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDark) {
      root.classList.add('dark');
      root.style.setProperty('--ios26-background', themeConfig.background.dark);
      root.style.setProperty('--ios26-surface', themeConfig.surface.dark);
      root.style.setProperty('--ios26-text', themeConfig.text.dark);
    } else {
      root.classList.remove('dark');
      root.style.setProperty('--ios26-background', themeConfig.background.light);
      root.style.setProperty('--ios26-surface', themeConfig.surface.light);
      root.style.setProperty('--ios26-text', themeConfig.text.light);
    }
  }, [theme]);
  
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(storageKey, newTheme);
  };
  
  const value: iOS26ContextValue = {
    theme,
    setTheme,
    isGlassEnabled,
    setGlassEnabled,
    reduceMotion
  };
  
  return (
    <iOS26Context.Provider value={value}>
      {children}
    </iOS26Context.Provider>
  );
};