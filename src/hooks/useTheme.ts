'use client';

import { useEffect } from 'react';

import { useTheme as useThemeContext } from '@/contexts/ThemeContext';

export function useThemeClass() {
  const { effectiveTheme } = useThemeContext();

  useEffect(() => {
    // Ensure html element has the correct class
    const root = document.documentElement;
    if (effectiveTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [effectiveTheme]);

  return effectiveTheme;
}

// Export the original hook for convenience
export { useTheme } from '@/contexts/ThemeContext';