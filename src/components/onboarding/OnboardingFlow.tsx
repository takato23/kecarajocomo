'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChefHat, 
  Package, 
  Mic, 
  Trophy,
  ArrowRight,
  Check
} from 'lucide-react';

import { cn } from '@/lib/utils';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  action: string;
  color: string;
}

const steps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Kecarajocomer',
    description: 'Your personal AI-powered food assistant',
    icon: ChefHat,
    action: 'Get Started',
    color: 'from-orange-500 to-red-500'
  },
  {
    id: 'pantry',
    title: 'Scan your pantry',
    description: 'Take photos of your ingredients and let AI identify them',
    icon: Package,
    action: 'Scan Items',
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 'voice',
    title: 'Voice Assistant Cooking Mode',
    description: 'Cook hands-free with our AI voice assistant',
    icon: Mic,
    action: 'Enable Voice',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'gamification',
    title: 'Gamification Progress',
    description: 'Level up your cooking skills and earn rewards',
    icon: Trophy,
    action: 'Start Journey',
    color: 'from-yellow-500 to-orange-500'
  }
];

interface OnboardingFlowProps {
  onComplete?: () => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCompletedSteps([...completedSteps, steps[currentStep].id]);
      setCurrentStep(currentStep + 1);
    } else {
      onComplete?.();
    }
  };

  const handleSkip = () => {
    onComplete?.();
  };

  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
      {/* Background pattern */}
      <div className="fixed inset-0 bg-[url('/grid.svg')] opacity-5" />

      {/* Skip button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={handleSkip}
        className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors"
      >
        Skip
      </motion.button>

      {/* Progress dots */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-2">
        {steps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-300",
              index === currentStep 
                ? "w-8 bg-white" 
                : index < currentStep
                ? "bg-white/60"
                : "bg-white/20"
            )}
          />
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStepData.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="relative z-10 max-w-md mx-auto px-6"
        >
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mb-8 flex justify-center"
          >
            <div className={cn(
              "w-32 h-32 rounded-full bg-gradient-to-br flex items-center justify-center",
              currentStepData.color
            )}>
              <Icon className="w-16 h-16 text-white" />
            </div>
          </motion.div>

          {/* Text content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-white mb-3">
              {currentStepData.title}
            </h2>
            <p className="text-gray-400 text-lg">
              {currentStepData.description}
            </p>
          </motion.div>

          {/* Action button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleNext}
            className={cn(
              "w-full py-4 px-6 rounded-2xl bg-gradient-to-r text-white font-semibold",
              "flex items-center justify-center gap-3 group",
              "hover:shadow-lg transition-all duration-300",
              currentStepData.color
            )}
          >
            {currentStepData.action}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </motion.button>

          {/* Features list for gamification step */}
          {currentStepData.id === 'gamification' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-8 space-y-3"
            >
              {[
                'Level up as you cook',
                'Earn XP and rewards',
                'Unlock new recipes',
                'Track your progress'
              ].map((feature, index) => (
                <motion.div
                  key={feature}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="flex items-center gap-3 text-gray-300"
                >
                  <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check className="w-3 h-3 text-green-400" />
                  </div>
                  {feature}
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Decorative elements */}
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-[100px]" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px]" />
    </div>
  );
}