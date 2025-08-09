'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

import { useOnboardingStore } from '../store/onboardingStore';
import { useAppStore } from '@/store';
import { OnboardingStep } from '../types';

// Import step components
import { WelcomeStep } from './onboarding/WelcomeStep';
import { ProfileSetupStep } from './onboarding/ProfileSetupStep';
import { DietaryPreferencesStep } from './onboarding/DietaryPreferencesStep';
import { CookingPreferencesStep } from './onboarding/CookingPreferencesStep';
import { NutritionGoalsStep } from './onboarding/NutritionGoalsStep';
import { PantrySetupStep } from './onboarding/PantrySetupStep';
import { MealPlanPreviewStep } from './onboarding/MealPlanPreviewStep';
import { CompletionStep } from './onboarding/CompletionStep';

export function OnboardingWizard() {
  const router = useRouter();
  const isAuthenticated = useAppStore((state) => state.user.isAuthenticated);
  const { currentStep, nextStep, previousStep, isLoading } = useOnboardingStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  const renderStep = () => {
    switch (currentStep) {
      case OnboardingStep.WELCOME:
        return <WelcomeStep onNext={nextStep} />;
      case OnboardingStep.PROFILE_SETUP:
        return <ProfileSetupStep onNext={nextStep} onBack={previousStep} />;
      case OnboardingStep.DIETARY_PREFERENCES:
        return <DietaryPreferencesStep onNext={nextStep} onBack={previousStep} />;
      case OnboardingStep.COOKING_PREFERENCES:
        return <CookingPreferencesStep onNext={nextStep} onBack={previousStep} />;
      case OnboardingStep.NUTRITION_GOALS:
        return <NutritionGoalsStep onNext={nextStep} onBack={previousStep} />;
      case OnboardingStep.PANTRY_SETUP:
        return <PantrySetupStep onNext={nextStep} onBack={previousStep} />;
      case OnboardingStep.MEAL_PLAN_PREVIEW:
        return <MealPlanPreviewStep onNext={nextStep} onBack={previousStep} />;
      case OnboardingStep.COMPLETION:
        return <CompletionStep />;
      default:
        return null;
    }
  };

  const getStepNumber = () => {
    const steps = [
      OnboardingStep.PROFILE_SETUP,
      OnboardingStep.DIETARY_PREFERENCES,
      OnboardingStep.COOKING_PREFERENCES,
      OnboardingStep.NUTRITION_GOALS,
      OnboardingStep.PANTRY_SETUP,
      OnboardingStep.MEAL_PLAN_PREVIEW
    ];
    const index = steps.indexOf(currentStep);
    return index >= 0 ? index + 1 : 0;
  };

  const totalSteps = 6;
  const currentStepNumber = getStepNumber();
  const progress = (currentStepNumber / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-pink-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="py-8">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="w-8 h-8 text-yellow-400" />
              <h1 className="text-3xl font-bold text-white">Ke Carajo Comer</h1>
              <Sparkles className="w-8 h-8 text-yellow-400" />
            </div>
            <p className="text-white/60">Tu asistente culinario personalizado</p>
          </motion.div>

          {/* Progress Bar */}
          {currentStep !== OnboardingStep.WELCOME && currentStep !== OnboardingStep.COMPLETION && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-8 backdrop-blur-xl bg-white/10 rounded-2xl p-4 border border-white/20"
            >
              <div className="flex justify-between text-sm text-white/80 mb-3">
                <span className="font-medium">Paso {currentStepNumber} de {totalSteps}</span>
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
            </motion.div>
          )}

          {/* Step Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="backdrop-blur-xl bg-white/10 rounded-3xl shadow-2xl border border-white/20 p-8 md:p-10"
              style={{
                boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
              }}
            >
              <div className="relative">
                {renderStep()}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Loading Overlay */}
          <AnimatePresence>
            {isLoading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
              >
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="backdrop-blur-xl bg-white/10 rounded-2xl p-8 flex items-center space-x-4 border border-white/20"
                >
                  <div className="relative">
                    <div className="animate-spin rounded-full h-10 w-10 border-3 border-white/20"></div>
                    <div className="absolute inset-0 animate-spin rounded-full h-10 w-10 border-3 border-purple-400 border-t-transparent"></div>
                  </div>
                  <span className="text-white font-medium">Procesando...</span>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

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
    </div>
  );
}