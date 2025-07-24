'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

import { cn } from '@/lib/utils';

export interface iOS26LiquidModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  variant?: 'default' | 'elevated' | 'fullscreen' | 'drawer' | 'spotlight';
  animationType?: 'scale' | 'slide' | 'fade' | 'liquid' | 'zoom';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  className?: string;
  backdropClassName?: string;
}

const FloatingParticle = ({ delay = 0 }: { delay?: number }) => {
  const randomX = Math.random() * 100;
  const randomDuration = 10 + Math.random() * 20;
  
  return (
    <motion.div
      className="absolute w-1 h-1 bg-white/20 rounded-full"
      initial={{ x: `${randomX}%`, y: '100%' }}
      animate={{
        y: '-100%',
        x: [`${randomX}%`, `${randomX + (Math.random() - 0.5) * 50}%`],
      }}
      transition={{
        duration: randomDuration,
        delay,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
  );
};

export const iOS26LiquidModal: React.FC<iOS26LiquidModalProps> = ({
  isOpen,
  onClose,
  children,
  title,
  variant = 'default',
  animationType = 'scale',
  size = 'md',
  showCloseButton = true,
  closeOnBackdrop = true,
  className,
  backdropClassName,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const modalVariants = {
    scale: {
      hidden: { scale: 0.8, opacity: 0 },
      visible: { scale: 1, opacity: 1 },
      exit: { scale: 0.8, opacity: 0 },
    },
    slide: {
      hidden: { y: 100, opacity: 0 },
      visible: { y: 0, opacity: 1 },
      exit: { y: 100, opacity: 0 },
    },
    fade: {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
      exit: { opacity: 0 },
    },
    liquid: {
      hidden: { scale: 0, rotate: -180, borderRadius: '100%' },
      visible: { scale: 1, rotate: 0, borderRadius: '1rem' },
      exit: { scale: 0, rotate: 180, borderRadius: '100%' },
    },
    zoom: {
      hidden: { scale: 0, opacity: 0, rotate: -10 },
      visible: { scale: 1, opacity: 1, rotate: 0 },
      exit: { scale: 1.2, opacity: 0, rotate: 10 },
    },
  };

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full mx-4',
  };

  const variantClasses = {
    default: 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl border border-white/30',
    elevated: 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-3xl shadow-[0_20px_70px_rgba(0,0,0,0.2)] border border-white/40',
    fullscreen: 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl w-full h-full max-w-none rounded-none',
    drawer: 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-3xl fixed bottom-0 left-0 right-0 rounded-t-3xl border-t border-white/40',
    spotlight: 'bg-gradient-to-br from-purple-900/80 via-pink-900/80 to-orange-900/80 backdrop-blur-3xl text-white border border-white/20',
  };

  if (!mounted) return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            className={cn(
              'fixed inset-0 z-50',
              variant === 'spotlight' 
                ? 'bg-black/80' 
                : 'bg-black/60 backdrop-blur-sm',
              backdropClassName
            )}
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={closeOnBackdrop ? onClose : undefined}
          >
            {/* Floating particles for spotlight variant */}
            {variant === 'spotlight' && (
              <div className="absolute inset-0 overflow-hidden">
                {[...Array(20)].map((_, i) => (
                  <FloatingParticle key={i} delay={i * 0.5} />
                ))}
              </div>
            )}
          </motion.div>

          {/* Modal */}
          <motion.div
            key="modal"
            ref={modalRef}
            className={cn(
              'fixed z-50',
              variant === 'drawer' 
                ? 'bottom-0 left-0 right-0' 
                : 'inset-0 flex items-center justify-center p-4',
            )}
            variants={modalVariants[animationType]}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{
              type: animationType === 'liquid' ? 'spring' : 'tween',
              duration: animationType === 'liquid' ? 0.8 : 0.3,
              bounce: animationType === 'liquid' ? 0.3 : 0,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={cn(
                'relative w-full',
                sizeClasses[size],
                variantClasses[variant],
                'rounded-2xl overflow-hidden',
                variant !== 'fullscreen' && variant !== 'drawer' && 'shadow-2xl',
                variant === 'spotlight' && 'ring-2 ring-white/20',
                className
              )}
            >
              {/* Glow effect for spotlight variant */}
              {variant === 'spotlight' && (
                <>
                  <div className="absolute -inset-10 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 opacity-20 blur-3xl animate-pulse" />
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent" />
                </>
              )}

              {/* Header */}
              {(title || showCloseButton) && (
                <div className={cn(
                  'relative flex items-center justify-between p-6',
                  variant === 'spotlight' && 'border-b border-white/10'
                )}>
                  {title && (
                    <h2 className={cn(
                      'text-2xl font-bold',
                      variant === 'spotlight' 
                        ? 'text-white' 
                        : 'text-gray-900 dark:text-white'
                    )}>
                      {title}
                    </h2>
                  )}
                  {showCloseButton && (
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={onClose}
                      className={cn(
                        'ml-auto p-2 rounded-full transition-colors',
                        variant === 'spotlight'
                          ? 'hover:bg-white/10 text-white'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400'
                      )}
                    >
                      <X className="w-5 h-5" />
                    </motion.button>
                  )}
                </div>
              )}

              {/* Content */}
              <div className={cn(
                'relative',
                !title && !showCloseButton && 'pt-6'
              )}>
                {children}
              </div>

              {/* Animated border for liquid variant */}
              {animationType === 'liquid' && (
                <motion.div
                  className="absolute inset-0 rounded-2xl pointer-events-none"
                  style={{
                    background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.5), transparent 70%)',
                    backgroundSize: '200% 200%',
                  }}
                  animate={{
                    backgroundPosition: ['0% 0%', '100% 100%'],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    repeatType: 'reverse',
                  }}
                />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};