'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  SkipBack, 
  SkipForward, 
  Play, 
  Pause, 
  Square
} from 'lucide-react';

import { cn } from '@/lib/utils';

interface NavigationControlsProps {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
  onPause: () => void;
  onResume: () => void;
  onEnd: () => void;
  isPaused?: boolean;
}

export function NavigationControls({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  onPause,
  onResume,
  onEnd,
  isPaused = false
}: NavigationControlsProps) {
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <div className="flex items-center gap-2">
      {/* Previous button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onPrevious}
        disabled={isFirstStep}
        className={cn(
          "p-2 rounded-lg transition-all duration-200",
          isFirstStep 
            ? "bg-gray-500/20 text-gray-500 cursor-not-allowed" 
            : "bg-white/10 hover:bg-white/20 text-white"
        )}
      >
        <SkipBack className="w-5 h-5" />
      </motion.button>

      {/* Pause/Resume button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={isPaused ? onResume : onPause}
        className="p-2 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 transition-all duration-200"
      >
        {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
      </motion.button>

      {/* Next button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onNext}
        disabled={isLastStep}
        className={cn(
          "p-3 rounded-lg transition-all duration-200 font-medium",
          isLastStep 
            ? "bg-gray-500/20 text-gray-500 cursor-not-allowed" 
            : "bg-purple-500/20 hover:bg-purple-500/30 text-purple-400"
        )}
      >
        <SkipForward className="w-5 h-5" />
      </motion.button>

      {/* End session button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onEnd}
        className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-all duration-200"
      >
        <Square className="w-5 h-5" />
      </motion.button>
    </div>
  );
}

export default NavigationControls;