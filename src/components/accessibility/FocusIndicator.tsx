'use client';

import { useEffect, useState } from 'react';

export function FocusIndicator() {
  const [isKeyboardUser, setIsKeyboardUser] = useState(false);

  useEffect(() => {
    // Detect keyboard navigation
    const handleMouseDown = () => setIsKeyboardUser(false);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setIsKeyboardUser(true);
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);

    // Add focus-visible class to body when keyboard navigation is detected
    if (isKeyboardUser) {
      document.body.classList.add('keyboard-navigation');
    } else {
      document.body.classList.remove('keyboard-navigation');
    }

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isKeyboardUser]);

  return null;
}