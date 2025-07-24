/**
 * iOS26 Floating Action Menu Component
 * Animated floating action button with expandable menu items
 */

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X } from 'lucide-react';

import { cn } from '@/lib/utils';

import { useIOS26 } from './iOS26Provider';

export interface FloatingMenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  color?: string;
}

export interface iOS26FloatingActionMenuProps {
  items: FloatingMenuItem[];
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  direction?: 'up' | 'down' | 'left' | 'right' | 'radial';
  className?: string;
  mainButtonLabel?: string;
}

export const iOS26FloatingActionMenu: React.FC<iOS26FloatingActionMenuProps> = ({
  items,
  position = 'bottom-right',
  direction = 'up',
  className,
  mainButtonLabel = 'Menu'
}) => {
  const { reduceMotion, theme } = useIOS26();
  const [isOpen, setIsOpen] = useState(false);
  
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  };
  
  const getItemPosition = (index: number) => {
    const spacing = 70; // pixels between items
    const radialAngle = (Math.PI / 2) / (items.length - 1); // 90 degrees spread
    
    switch (direction) {
      case 'up':
        return { x: 0, y: -(index + 1) * spacing };
      case 'down':
        return { x: 0, y: (index + 1) * spacing };
      case 'left':
        return { x: -(index + 1) * spacing, y: 0 };
      case 'right':
        return { x: (index + 1) * spacing, y: 0 };
      case 'radial':
        const angle = radialAngle * index;
        return {
          x: Math.cos(angle) * spacing * 1.2,
          y: -Math.sin(angle) * spacing * 1.2
        };
      default:
        return { x: 0, y: 0 };
    }
  };
  
  const containerVariants = {
    open: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    },
    closed: {
      transition: {
        staggerChildren: 0.05,
        staggerDirection: -1
      }
    }
  };
  
  const itemVariants = {
    open: (position: { x: number; y: number }) => ({
      x: position.x,
      y: position.y,
      opacity: 1,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 20
      }
    }),
    closed: {
      x: 0,
      y: 0,
      opacity: 0,
      scale: 0.5,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 20
      }
    }
  };
  
  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
      
      {/* Menu Container */}
      <div className={cn(
        'fixed z-50',
        positionClasses[position],
        className
      )}>
        <motion.div
          className="relative"
          variants={containerVariants}
          initial="closed"
          animate={isOpen ? 'open' : 'closed'}
        >
          {/* Menu Items */}
          <AnimatePresence>
            {isOpen && items.map((item, index) => {
              const position = getItemPosition(index);
              
              return (
                <motion.div
                  key={item.id}
                  className="absolute inset-0 flex items-center justify-center"
                  custom={position}
                  variants={itemVariants}
                  initial="closed"
                  animate="open"
                  exit="closed"
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <iOS26LiquidButton
                      variant="secondary"
                      size="lg"
                      onClick={() => {
                        item.onClick();
                        setIsOpen(false);
                      }}
                      className="shadow-lg"
                      icon={item.icon}
                      aria-label={item.label}
                    >
                      <span className="sr-only md:not-sr-only">{item.label}</span>
                    </iOS26LiquidButton>
                  </motion.div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          
          {/* Main Button */}
          <motion.div
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <iOS26LiquidButton
              variant="primary"
              size="lg"
              onClick={() => setIsOpen(!isOpen)}
              className="shadow-xl relative z-10"
              glow
              aria-label={mainButtonLabel}
              aria-expanded={isOpen}
            >
              <motion.div
                animate={{ rotate: isOpen ? 45 : 0 }}
                transition={{ duration: 0.3 }}
              >
                {isOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
              </motion.div>
            </iOS26LiquidButton>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
};