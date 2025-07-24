'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  X, 
  Camera, 
  BookOpen, 
  ShoppingCart, 
  Calendar,
  Sparkles,
  Timer
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import { cn } from '@/lib/utils';

interface ActionItem {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  href: string;
}

export const FloatingActionMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const actions: ActionItem[] = [
    {
      id: 'ai-recipe',
      label: 'Generar con IA',
      icon: Sparkles,
      color: 'from-purple-500 to-pink-500',
      href: '/recipes/generate'
    },
    {
      id: 'scan',
      label: 'Escanear',
      icon: Camera,
      color: 'from-blue-500 to-cyan-500',
      href: '/scanner'
    },
    {
      id: 'timer',
      label: 'Timer',
      icon: Timer,
      color: 'from-orange-500 to-red-500',
      href: '/timer'
    },
    {
      id: 'recipe',
      label: 'Nueva Receta',
      icon: BookOpen,
      color: 'from-green-500 to-emerald-500',
      href: '/recipes/new'
    },
    {
      id: 'shopping',
      label: 'Lista Rápida',
      icon: ShoppingCart,
      color: 'from-amber-500 to-orange-500',
      href: '/shopping/quick'
    },
    {
      id: 'meal',
      label: 'Planificar',
      icon: Calendar,
      color: 'from-indigo-500 to-purple-500',
      href: '/meal-planner/quick'
    }
  ];

  const handleAction = (action: ActionItem) => {
    setIsOpen(false);
    router.push(action.href);
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Action Items */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed bottom-24 right-6 z-50 space-y-3">
            {actions.map((action, index) => (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, scale: 0, y: 20 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1, 
                  y: 0,
                  transition: {
                    delay: index * 0.05,
                    type: 'spring',
                    stiffness: 500,
                    damping: 25
                  }
                }}
                exit={{ 
                  opacity: 0, 
                  scale: 0, 
                  y: 20,
                  transition: {
                    delay: (actions.length - index - 1) * 0.05
                  }
                }}
                className="flex items-center justify-end gap-3"
              >
                {/* Label */}
                <motion.span
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 + 0.1 }}
                  className="bg-gray-900 text-white text-sm px-3 py-1.5 rounded-lg whitespace-nowrap"
                >
                  {action.label}
                </motion.span>

                {/* Button */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleAction(action)}
                  className={cn(
                    "relative w-14 h-14 rounded-full shadow-lg",
                    "bg-gradient-to-br text-white",
                    "flex items-center justify-center",
                    "hover:shadow-xl transition-shadow",
                    action.color
                  )}
                >
                  <action.icon className="w-6 h-6" />
                  
                  {/* Ripple effect on hover */}
                  <motion.div
                    className="absolute inset-0 rounded-full bg-white/20"
                    initial={{ scale: 0.8, opacity: 0 }}
                    whileHover={{ scale: 1.2, opacity: 0 }}
                    transition={{ duration: 0.4 }}
                  />
                </motion.button>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ 
          type: 'spring',
          stiffness: 260,
          damping: 20,
          delay: 0.1
        }}
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "relative w-16 h-16 rounded-full shadow-2xl",
            "bg-gradient-to-br flex items-center justify-center",
            "hover:shadow-3xl transition-all duration-300",
            isOpen 
              ? "from-red-500 to-pink-500" 
              : "from-purple-500 to-pink-500"
          )}
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
          {isOpen ? (
            <X className="w-7 h-7 text-white" />
          ) : (
            <Plus className="w-7 h-7 text-white" />
          )}

          {/* Pulse animation when closed */}
          {!isOpen && (
            <>
              <motion.div
                className="absolute inset-0 rounded-full bg-purple-500/50"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.5, 0, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              <motion.div
                className="absolute inset-0 rounded-full bg-pink-500/50"
                animate={{
                  scale: [1, 1.4, 1],
                  opacity: [0.3, 0, 0.3],
                }}
                transition={{
                  duration: 2,
                  delay: 0.2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            </>
          )}
        </motion.button>

        {/* Sparkle decorations */}
        {!isOpen && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full"
                style={{
                  top: `${20 + i * 30}%`,
                  left: `${20 + i * 30}%`,
                }}
                animate={{
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 1.5,
                  delay: i * 0.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>
        )}
      </motion.div>
    </>
  );
};