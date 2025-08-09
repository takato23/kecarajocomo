'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '@/services/logger';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Sparkles, Check, X, Clock, ChefHat, Heart, DollarSign, Apple, Globe, Utensils, Leaf, Star, Zap, Timer, Rocket, Diamond, Crown } from 'lucide-react';
import confetti from 'canvas-confetti';
import { FloatingParticles, GlowOrb, ShimmerEffect, PulseRing, SuccessAnimation, PremiumSpinner, GradientText } from './MealPlannerWizardEffects';

export interface WizardData {
  dietaryPreferences: string[];
  allergies: string[];
  cuisinePreferences: string[];
  cookingSkill: 'beginner' | 'intermediate' | 'advanced';
  budgetLevel: 'low' | 'medium' | 'high';
  maxCookingTime: number;
}

interface MealPlannerWizardModalProps {
  isOpen: boolean;
  onComplete: (data: WizardData) => void;
  onClose: () => void;
}

const steps = [
  { id: 'welcome', title: 'Bienvenido', description: 'Personaliza tu experiencia', icon: '🎉' },
  { id: 'dietary', title: 'Preferencias', description: 'Dieta y restricciones', icon: '🥗' },
  { id: 'cooking', title: 'Cocina', description: 'Tiempo y habilidad', icon: '👨‍🍳' },
  { id: 'summary', title: 'Resumen', description: 'Confirma tus datos', icon: '✨' }
];

// Glass Card Component
const GlassCard = ({ children, className = '', variant = 'default', style = {} }: { 
  children: React.ReactNode; 
  className?: string; 
  variant?: 'default' | 'highlight';
  style?: React.CSSProperties;
}) => {
  const variants = {
    default: 'bg-white/5 border-white/10',
    highlight: 'bg-purple-500/10 border-purple-400/20',
  };
  
  return (
    <div className={`backdrop-blur-xl ${variants[variant]} border rounded-3xl ${className}`} style={style}>
      {children}
    </div>
  );
};

// Glass Button Component
const GlassButton = ({ children, onClick, variant = 'default', disabled = false, className = '' }: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  variant?: 'default' | 'primary' | 'secondary';
  disabled?: boolean;
  className?: string;
}) => {
  const variants = {
    default: 'bg-white/10 border-white/20 text-white hover:bg-white/20',
    primary: 'bg-gradient-to-r from-purple-500 to-pink-500 border-purple-400/50 text-white hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/25',
    secondary: 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
  };
  
  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={`px-6 py-3 rounded-xl border backdrop-blur-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {children}
    </motion.button>
  );
};

export function MealPlannerWizardModal({ isOpen, onComplete, onClose }: MealPlannerWizardModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<WizardData>({
    dietaryPreferences: [],
    allergies: [],
    cuisinePreferences: [],
    cookingSkill: 'intermediate',
    budgetLevel: 'medium',
    maxCookingTime: 60
  });
  const [isLoading, setIsLoading] = useState(false);

  // Load saved data
  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem('mealPlannerWizardData');
      if (saved) {
        try {
          setData(JSON.parse(saved));
        } catch (error) {
          logger.error('Error loading saved data:', error);
        }
      }
    }
  }, [isOpen]);

  // Save data
  useEffect(() => {
    if (isOpen) {
      localStorage.setItem('mealPlannerWizardData', JSON.stringify(data));
    }
  }, [data, isOpen]);

  // Particle effect on step change
  useEffect(() => {
    if (isOpen && currentStep > 0 && currentStep < steps.length - 1) {
      const particles = confetti.create(undefined, {
        resize: true,
        useWorker: true,
      });
      particles({
        particleCount: 20,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#a855f7', '#ec4899', '#3b82f6'],
        gravity: 0.5,
        ticks: 50,
        shapes: ['circle'],
        scalar: 0.7
      });
    }
  }, [currentStep, isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && currentStep < steps.length - 1 && canProceed()) {
        handleNext();
      } else if (e.key === 'ArrowLeft' && currentStep > 0) {
        handlePrev();
      } else if (e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, data, isOpen]);

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return data.dietaryPreferences.length > 0;
      case 2:
        return data.cookingSkill && data.budgetLevel && data.maxCookingTime;
      default:
        return true;
    }
  };

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 300));
      setCurrentStep(currentStep + 1);
      setIsLoading(false);
    } else {
      // Final step - complete wizard
      setIsLoading(true);
      
      // Celebration confetti
      const count = 200;
      const defaults = {
        origin: { y: 0.7 },
        colors: ['#a855f7', '#ec4899', '#3b82f6', '#10b981', '#f59e0b'],
      };

      function fire(particleRatio: number, opts: any) {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio),
        });
      }

      fire(0.25, { spread: 26, startVelocity: 55 });
      fire(0.2, { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      fire(0.1, { spread: 120, startVelocity: 45 });

      setTimeout(() => {
        localStorage.removeItem('mealPlannerWizardData');
        onComplete(data);
      }, 1500);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    localStorage.removeItem('mealPlannerWizardData');
    onClose();
  };

  const getStepNumber = () => {
    const stepsWithNumber = steps.slice(1, -1);
    const index = stepsWithNumber.findIndex(s => steps[currentStep].id === s.id);
    return index >= 0 ? index + 1 : 0;
  };

  const totalSteps = steps.length - 2;
  const currentStepNumber = getStepNumber();
  const progress = currentStepNumber > 0 ? (currentStepNumber / totalSteps) * 100 : 0;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        />
        
        {/* Modal */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 50 }}
          transition={{ duration: 0.4, type: "spring", stiffness: 120, damping: 20 }}
          className="w-full max-w-3xl relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Background effects */}
          <div className="absolute -inset-10 overflow-hidden rounded-3xl pointer-events-none">
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
          </div>
          
          <GlassCard className="relative overflow-hidden shadow-2xl" style={{
            boxShadow: '0 20px 50px 0 rgba(31, 38, 135, 0.5)',
          }}>
            {/* Close button */}
            <motion.button
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              onClick={handleClose}
              className="absolute top-4 right-4 z-50 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors group"
              aria-label="Cerrar wizard"
            >
              <X className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" />
            </motion.button>
            
            {/* Header */}
            <div className="px-8 py-6 border-b border-white/10 relative overflow-hidden">
              {/* Animated gradient bar */}
              <motion.div
                className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <motion.div 
                    animate={{ 
                      rotate: [0, 360],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ 
                      rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                      scale: { duration: 2, repeat: Infinity }
                    }}
                    className="relative w-12 h-12"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl blur-md opacity-50"></div>
                    <div className="relative w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl flex items-center justify-center shadow-lg">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                  </motion.div>
                  
                  <div>
                    <motion.h2 
                      key={steps[currentStep].title}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-2xl font-bold text-white"
                    >
                      {steps[currentStep].title}
                    </motion.h2>
                    <motion.p 
                      key={steps[currentStep].description}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      className="text-sm text-white/60"
                    >
                      {steps[currentStep].description}
                    </motion.p>
                  </div>
                </div>
                
                {/* Skip button - only on first steps */}
                {currentStep < steps.length - 1 && (
                  <button
                    onClick={handleClose}
                    className="group text-sm text-white/60 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-white/10 flex items-center gap-1"
                    aria-label="Omitir configuración"
                  >
                    <span>Omitir</span>
                    <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                )}
              </div>
              
              {/* Progress indicator */}
              {currentStep !== 0 && currentStep !== steps.length - 1 && (
                <div className="mt-6">
                  <div className="flex justify-between text-sm text-white/80 mb-3">
                    <span className="font-medium flex items-center gap-2">
                      <span className="text-lg">{steps[currentStep].icon}</span>
                      Paso {currentStepNumber} de {totalSteps}
                    </span>
                    <span className="font-medium">{Math.round(progress)}% Completado</span>
                  </div>
                  <div className="h-3 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Content */}
            <div className="px-8 py-10 min-h-[450px] max-h-[70vh] overflow-y-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Step content here - copy from original */}
                  {currentStep === 0 && (
                    <div className="text-center">
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.5, type: "spring" }}
                        className="w-32 h-32 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl"
                      >
                        <ChefHat className="w-16 h-16 text-white" />
                      </motion.div>
                      <h3 className="text-3xl font-bold mb-4">
                        ¡Bienvenido al <GradientText>Planificador AI</GradientText>! 🚀
                      </h3>
                      <p className="text-white/80 mb-10 text-lg max-w-lg mx-auto">
                        Vamos a crear un plan de comidas perfecto para ti con la magia de la inteligencia artificial
                      </p>
                    </div>
                  )}
                  
                  {/* Add other steps content here */}
                </motion.div>
              </AnimatePresence>
            </div>
            
            {/* Footer */}
            <div className="px-8 py-6 border-t border-white/10 flex justify-between items-center relative">
              {/* Loading overlay */}
              <AnimatePresence>
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-20 rounded-b-3xl"
                  >
                    <PremiumSpinner />
                  </motion.div>
                )}
              </AnimatePresence>
              
              <GlassButton
                onClick={handlePrev}
                disabled={currentStep === 0 || isLoading}
                variant="secondary"
                className="flex items-center gap-2 relative z-10"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </GlassButton>
              
              {/* Progress dots */}
              <div className="flex items-center gap-2">
                {steps.map((_, index) => (
                  <motion.div
                    key={index}
                    initial={false}
                    animate={{ 
                      scale: index === currentStep ? 1.2 : 1,
                      opacity: index === currentStep ? 1 : 0.3
                    }}
                    className={`w-2 h-2 rounded-full ${
                      index <= currentStep ? 'bg-purple-400' : 'bg-white/20'
                    }`}
                  />
                ))}
              </div>
              
              <GlassButton
                onClick={handleNext}
                disabled={isLoading || !canProceed()}
                variant="primary"
                className="flex items-center gap-2 relative z-10"
              >
                {currentStep === steps.length - 1 ? (
                  <>
                    <span>Generar Plan</span>
                    <Sparkles className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <span>Siguiente</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </GlassButton>
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>
      
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </AnimatePresence>
  );
}