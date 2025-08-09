/**
 * KeModal - Modal principal del design system KeCarajoComer
 * Mobile-first, full-screen en móvil, glassmorphism en desktop
 */

'use client';

import { forwardRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { KeButton } from './KeButton';

interface KeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  variant?: 'default' | 'recipe' | 'pantry' | 'shopping';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  children: React.ReactNode;
  className?: string;
}

const KeModal = forwardRef<HTMLDivElement, KeModalProps>(({
  isOpen,
  onClose,
  title,
  description,
  size = 'md',
  variant = 'default',
  showCloseButton = true,
  closeOnOverlayClick = true,
  children,
  className,
}, ref) => {

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll on mobile
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
    full: 'max-w-full'
  };

  const variants = {
    default: `
      bg-white/95 dark:bg-gray-900/95 border-gray-200/50 dark:border-gray-700/50
    `,
    recipe: `
      bg-white/95 dark:bg-gray-900/95 border-orange-200/50 dark:border-orange-700/50
      bg-gradient-to-br from-white/95 to-orange-50/80
      dark:from-gray-900/95 dark:to-orange-900/20
    `,
    pantry: `
      bg-white/95 dark:bg-gray-900/95 border-green-200/50 dark:border-green-700/50
      bg-gradient-to-br from-white/95 to-green-50/80
      dark:from-gray-900/95 dark:to-green-900/20
    `,
    shopping: `
      bg-white/95 dark:bg-gray-900/95 border-blue-200/50 dark:border-blue-700/50
      bg-gradient-to-br from-white/95 to-blue-50/80
      dark:from-gray-900/95 dark:to-blue-900/20
    `
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Overlay */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeOnOverlayClick ? onClose : undefined}
          />

          {/* Modal */}
          <motion.div
            ref={ref}
            className={cn(
              `relative w-full backdrop-blur-xl border shadow-2xl
              rounded-t-3xl sm:rounded-3xl
              h-[85vh] sm:h-auto sm:max-h-[85vh]
              flex flex-col overflow-hidden`,
              sizes[size],
              variants[variant],
              className
            )}
            initial={{ 
              opacity: 0, 
              y: '100%',
              scale: 0.95 
            }}
            animate={{ 
              opacity: 1, 
              y: 0,
              scale: 1 
            }}
            exit={{ 
              opacity: 0, 
              y: '100%',
              scale: 0.95 
            }}
            transition={{ 
              type: 'spring',
              damping: 25,
              stiffness: 300
            }}
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-center justify-between p-4 border-b border-gray-200/50 dark:border-gray-700/50 shrink-0">
                <div className="flex-1 mr-4">
                  {title && (
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {description}
                    </p>
                  )}
                </div>
                
                {showCloseButton && (
                  <KeButton
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="shrink-0 p-2 h-auto min-h-0"
                  >
                    <X className="w-5 h-5" />
                  </KeButton>
                )}
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <div className="p-4">
                {children}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

KeModal.displayName = 'KeModal';

// Hook para manejar modales
export const useKeModal = (initialState = false) => {
  const [isOpen, setIsOpen] = useState(initialState);
  
  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen(prev => !prev);
  
  return {
    isOpen,
    open,
    close,
    toggle,
    setIsOpen
  };
};

export { KeModal };
export type { KeModalProps };