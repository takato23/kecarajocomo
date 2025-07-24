'use client';

import { createContext, useContext, useEffect, useState } from 'react';

import { prefersHighContrast, getPreferredColorScheme } from '@/lib/accessibility';

type Theme = 'light' | 'dark' | 'system';
type ContrastMode = 'normal' | 'high';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  contrastMode: ContrastMode;
  setContrastMode: (mode: ContrastMode) => void;
  effectiveTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  defaultContrastMode?: ContrastMode;
  storageKey?: string;
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  defaultContrastMode = 'normal',
  storageKey = 'theme-preference',
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [contrastMode, setContrastMode] = useState<ContrastMode>(defaultContrastMode);
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('light');

  // Load preferences from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const { theme: storedTheme, contrast } = JSON.parse(stored);
        if (storedTheme) setTheme(storedTheme);
        if (contrast) setContrastMode(contrast);
      } catch {}
    } else {
      // Check system preferences
      if (prefersHighContrast()) {
        setContrastMode('high');
      }
    }
  }, [storageKey]);

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem(
      storageKey,
      JSON.stringify({ theme, contrast: contrastMode })
    );
  }, [theme, contrastMode, storageKey]);

  // Apply theme classes to document
  useEffect(() => {
    const root = document.documentElement;
    let appliedTheme: 'light' | 'dark' = 'light';

    // Remove existing theme classes
    root.classList.remove('light', 'dark', 'high-contrast');

    if (theme === 'system') {
      const systemTheme = getPreferredColorScheme();
      appliedTheme = systemTheme === 'dark' ? 'dark' : 'light';
    } else {
      appliedTheme = theme;
    }

    // Apply theme class
    root.classList.add(appliedTheme);
    setEffectiveTheme(appliedTheme);

    // Apply contrast mode
    if (contrastMode === 'high') {
      root.classList.add('high-contrast');
    }

    // Update meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content',
        appliedTheme === 'dark' ? '#030712' : '#ffffff'
      );
    }
  }, [theme, contrastMode]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      setEffectiveTheme(mediaQuery.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        contrastMode,
        setContrastMode,
        effectiveTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}