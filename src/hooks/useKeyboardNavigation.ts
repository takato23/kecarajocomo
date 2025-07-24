'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface UseKeyboardNavigationOptions {
  items: any[];
  onSelect?: (item: any, index: number) => void;
  onEscape?: () => void;
  orientation?: 'vertical' | 'horizontal' | 'grid';
  loop?: boolean;
  cols?: number; // For grid navigation
}

export function useKeyboardNavigation({
  items,
  onSelect,
  onEscape,
  orientation = 'vertical',
  loop = true,
  cols = 1,
}: UseKeyboardNavigationOptions) {
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);

  const focusItem = useCallback((index: number) => {
    if (index >= 0 && index < items.length) {
      setFocusedIndex(index);
      itemRefs.current[index]?.focus();
    }
  }, [items.length]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!items.length) return;

    const key = e.key;
    const currentIndex = focusedIndex;
    let nextIndex = currentIndex;

    switch (key) {
      case 'ArrowDown':
        if (orientation === 'vertical' || orientation === 'grid') {
          e.preventDefault();
          if (orientation === 'grid') {
            nextIndex = currentIndex === -1 ? 0 : Math.min(currentIndex + cols, items.length - 1);
          } else {
            nextIndex = currentIndex === -1 ? 0 : currentIndex + 1;
          }
        }
        break;

      case 'ArrowUp':
        if (orientation === 'vertical' || orientation === 'grid') {
          e.preventDefault();
          if (orientation === 'grid') {
            nextIndex = currentIndex === -1 ? items.length - 1 : Math.max(currentIndex - cols, 0);
          } else {
            nextIndex = currentIndex === -1 ? items.length - 1 : currentIndex - 1;
          }
        }
        break;

      case 'ArrowRight':
        if (orientation === 'horizontal' || orientation === 'grid') {
          e.preventDefault();
          nextIndex = currentIndex === -1 ? 0 : currentIndex + 1;
        }
        break;

      case 'ArrowLeft':
        if (orientation === 'horizontal' || orientation === 'grid') {
          e.preventDefault();
          nextIndex = currentIndex === -1 ? items.length - 1 : currentIndex - 1;
        }
        break;

      case 'Home':
        e.preventDefault();
        nextIndex = 0;
        break;

      case 'End':
        e.preventDefault();
        nextIndex = items.length - 1;
        break;

      case 'Enter':
      case ' ':
        e.preventDefault();
        if (onSelect && focusedIndex >= 0) {
          onSelect(items[focusedIndex], focusedIndex);
        }
        break;

      case 'Escape':
        if (onEscape) {
          e.preventDefault();
          onEscape();
        }
        break;

      default:
        return;
    }

    // Handle looping
    if (loop) {
      if (nextIndex < 0) {
        nextIndex = items.length - 1;
      } else if (nextIndex >= items.length) {
        nextIndex = 0;
      }
    } else {
      nextIndex = Math.max(0, Math.min(nextIndex, items.length - 1));
    }

    if (nextIndex !== currentIndex) {
      focusItem(nextIndex);
    }
  }, [focusedIndex, items, orientation, loop, cols, focusItem, onSelect, onEscape]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const setItemRef = useCallback((index: number) => (ref: HTMLElement | null) => {
    itemRefs.current[index] = ref;
  }, []);

  return {
    focusedIndex,
    setFocusedIndex,
    focusItem,
    setItemRef,
    itemRefs,
  };
}