'use client';

import { useEffect, useRef } from 'react';

interface LiveRegionProps {
  message: string;
  politeness?: 'polite' | 'assertive';
  clearOnUnmount?: boolean;
}

export function LiveRegion({ 
  message, 
  politeness = 'polite',
  clearOnUnmount = true 
}: LiveRegionProps) {
  const regionRef = useRef<HTMLDivElement>(null);
  const previousMessage = useRef<string>('');

  useEffect(() => {
    // Only announce if message has changed
    if (message && message !== previousMessage.current && regionRef.current) {
      // Clear and re-set the content to ensure screen readers announce it
      regionRef.current.textContent = '';
      setTimeout(() => {
        if (regionRef.current) {
          regionRef.current.textContent = message;
        }
      }, 100);
      previousMessage.current = message;
    }
  }, [message]);

  useEffect(() => {
    return () => {
      if (clearOnUnmount && regionRef.current) {
        regionRef.current.textContent = '';
      }
    };
  }, [clearOnUnmount]);

  return (
    <div 
      ref={regionRef}
      role="status" 
      aria-live={politeness} 
      aria-atomic="true"
      className="sr-only"
    />
  );
}

// Hook for using live regions
export function useLiveRegion() {
  const regionRef = useRef<HTMLDivElement | null>(null);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      // Create a live region element and append it to the body
      const liveRegion = document.createElement('div');
      liveRegion.setAttribute('role', 'status');
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      document.body.appendChild(liveRegion);
      regionRef.current = liveRegion;
      mounted.current = true;
    }

    return () => {
      if (regionRef.current && regionRef.current.parentNode) {
        regionRef.current.parentNode.removeChild(regionRef.current);
      }
    };
  }, []);

  const announce = (message: string, politeness: 'polite' | 'assertive' = 'polite') => {
    if (regionRef.current) {
      regionRef.current.setAttribute('aria-live', politeness);
      regionRef.current.textContent = '';
      setTimeout(() => {
        if (regionRef.current) {
          regionRef.current.textContent = message;
        }
      }, 100);
    }
  };

  return { announce };
}