'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Timer, 
  Scale, 
  Settings,
  X,
  Volume2,
  ChefHat,
  Clock,
  Thermometer,
  AlertCircle,
  CheckCircle,
  Calculator
} from 'lucide-react';

import { cn } from '@/lib/utils';

import { useRecipeStore } from '../../recipes/store/recipeStore';
import { useCookingAssistantStore } from '../store/cookingAssistantStore';

import { StepCard } from './StepCard';
import { TimerPanel } from './TimerPanel';
import { MeasurementConverter } from './MeasurementConverter';
import { VoiceControls } from './VoiceControls';
import { NavigationControls } from './NavigationControls';
import { ProgressBar } from './ProgressBar';
import { InsightPanel } from './InsightPanel';

import { GlassCard } from '@/components/dashboard/DashboardLayout';

interface CookingAssistantProps {
  recipeId: string;
  onClose?: () => void;
}

export function CookingAssistant({ recipeId, onClose }: CookingAssistantProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [showConverter, setShowConverter] = useState(false);
  const [showTimers, setShowTimers] = useState(false);
  
  const {
    currentSession,
    isSessionActive,
    currentStepIndex,
    steps,
    isVoiceEnabled,
    isListening,
    isSpeaking,
    timers,
    activeTimers,
    insights,
    error,
    startSession,
    endSession,
    pauseSession,
    resumeSession,
    nextStep,
    previousStep,
    speakCurrentStep,
    startListening,
    stopListening,
    clearErrors,
    cleanup
  } = useCookingAssistantStore();

  const { getRecipeById } = useRecipeStore();
  const recipe = getRecipeById(recipeId);

  // Initialize session when component mounts
  useEffect(() => {
    if (recipe && !isSessionActive) {
      startSession({
        recipe_id: recipeId,
        mode: 'guided',
        voice_enabled: false,
        voice_lang: 'en-US',
        preferences: {}
      });
    }

    return () => {
      if (isSessionActive) {
        cleanup();
      }
    };
  }, [recipe, isSessionActive, recipeId, startSession, cleanup]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case 'ArrowRight':
        case ' ':
          e.preventDefault();
          nextStep();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          previousStep();
          break;
        case 'r':
          e.preventDefault();
          if (isVoiceEnabled) {
            speakCurrentStep();
          }
          break;
        case 'v':
          e.preventDefault();
          if (isVoiceEnabled) {
            isListening ? stopListening() : startListening();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose?.();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isVoiceEnabled, isListening, nextStep, previousStep, speakCurrentStep, startListening, stopListening, onClose]);

  if (!recipe) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <GlassCard className="max-w-md">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Recipe Not Found</h2>
            <p className="text-gray-300 mb-4">The selected recipe could not be loaded.</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </GlassCard>
      </div>
    );
  }

  const currentStep = steps[currentStepIndex];
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 z-50 overflow-hidden">
      {/* Header */}
      <div className="sticky top-0 bg-black/20 backdrop-blur-md border-b border-white/10 z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <ChefHat className="w-6 h-6 text-purple-400" />
            <div>
              <h1 className="text-lg font-semibold text-white truncate max-w-xs">
                {recipe.title}
              </h1>
              <p className="text-sm text-gray-400">
                Step {currentStepIndex + 1} of {steps.length}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Timer indicator */}
            {activeTimers.length > 0 && (
              <button
                onClick={() => setShowTimers(!showTimers)}
                className="p-2 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 transition-colors relative"
              >
                <Timer className="w-5 h-5 text-orange-400" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center">
                  {activeTimers.length}
                </span>
              </button>
            )}
            
            {/* Voice status */}
            {isVoiceEnabled && (
              <div className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-lg text-sm",
                isListening ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"
              )}>
                {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                {isSpeaking && <Volume2 className="w-4 h-4 text-blue-400" />}
              </div>
            )}
            
            {/* Settings */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <Settings className="w-5 h-5 text-gray-400" />
            </button>
            
            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
        
        {/* Progress bar */}
        <ProgressBar progress={progress} />
      </div>

      {/* Error display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="absolute top-20 left-4 right-4 z-20"
          >
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-red-400 font-medium">{error.message}</p>
                  {error.details && (
                    <p className="text-red-300 text-sm mt-1">{error.details}</p>
                  )}
                </div>
                <button
                  onClick={clearErrors}
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto pb-32">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          {/* Current step */}
          {currentStep && (
            <motion.div
              key={currentStep.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="mb-6"
            >
              <StepCard
                step={currentStep}
                isActive={true}
                onComplete={() => {
                  // Complete step logic
                }}
                onSkip={() => {
                  // Skip step logic
                }}
              />
            </motion.div>
          )}

          {/* Recipe info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <GlassCard className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-gray-400">Total Time</span>
              </div>
              <p className="text-lg font-semibold text-white">
                {recipe.prep_time + recipe.cook_time} min
              </p>
            </GlassCard>
            
            <GlassCard className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Scale className="w-4 h-4 text-green-400" />
                <span className="text-sm text-gray-400">Servings</span>
              </div>
              <p className="text-lg font-semibold text-white">{recipe.servings}</p>
            </GlassCard>
            
            <GlassCard className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Thermometer className="w-4 h-4 text-orange-400" />
                <span className="text-sm text-gray-400">Difficulty</span>
              </div>
              <p className="text-lg font-semibold text-white capitalize">
                {recipe.difficulty}
              </p>
            </GlassCard>
          </div>

          {/* Insights */}
          <InsightPanel insights={insights} />

          {/* Step list preview */}
          <div className="grid grid-cols-1 gap-2 opacity-60">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  "p-3 rounded-lg border transition-all cursor-pointer",
                  index === currentStepIndex 
                    ? "border-purple-500/50 bg-purple-500/10" 
                    : "border-white/10 bg-white/5 hover:bg-white/10",
                  index < currentStepIndex && "opacity-50"
                )}
                onClick={() => {
                  // Navigate to step
                }}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                    step.status === 'completed' ? "bg-green-500 text-white" :
                    step.status === 'active' ? "bg-purple-500 text-white" :
                    "bg-gray-500 text-white"
                  )}>
                    {step.status === 'completed' ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      step.step_number
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white leading-relaxed">
                      {step.instruction}
                    </p>
                    {step.time_minutes && (
                      <p className="text-xs text-gray-400 mt-1">
                        {step.time_minutes} minutes
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/20 backdrop-blur-md border-t border-white/10">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowConverter(!showConverter)}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                <Calculator className="w-5 h-5 text-gray-400" />
              </button>
              
              {isVoiceEnabled && (
                <VoiceControls
                  isListening={isListening}
                  isSpeaking={isSpeaking}
                  onStartListening={startListening}
                  onStopListening={stopListening}
                  onSpeakStep={speakCurrentStep}
                />
              )}
            </div>
            
            <NavigationControls
              currentStep={currentStepIndex}
              totalSteps={steps.length}
              onPrevious={previousStep}
              onNext={nextStep}
              onPause={pauseSession}
              onResume={resumeSession}
              onEnd={endSession}
            />
          </div>
        </div>
      </div>

      {/* Overlays */}
      <AnimatePresence>
        {showTimers && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-4 z-30 flex items-center justify-center"
          >
            <div className="w-full max-w-md">
              <TimerPanel onClose={() => setShowTimers(false)} />
            </div>
          </motion.div>
        )}
        
        {showConverter && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-4 z-30 flex items-center justify-center"
          >
            <div className="w-full max-w-md">
              <MeasurementConverter onClose={() => setShowConverter(false)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default CookingAssistant;