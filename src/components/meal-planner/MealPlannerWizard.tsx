'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

// Import wizard steps
import { WelcomeStep } from './wizard-steps/WelcomeStep';
import { DietaryPreferencesStep } from './wizard-steps/DietaryPreferencesStep';
import { AllergiesStep } from './wizard-steps/AllergiesStep';
import { CookingSkillStep } from './wizard-steps/CookingSkillStep';
import { NutritionalGoalsStep } from './wizard-steps/NutritionalGoalsStep';
import { MealPreferencesStep } from './wizard-steps/MealPreferencesStep';
import { SummaryStep } from './wizard-steps/SummaryStep';

export interface WizardData {
  dietaryPreferences: string[];
  allergies: string[];
  cookingSkill: 'beginner' | 'intermediate' | 'advanced' | '';
  nutritionalGoals: string[];
  cuisineTypes: string[];
  maxCookingTime: number;
  mealsPerDay: number;
}

interface MealPlannerWizardProps {
  onComplete: (data: WizardData) => void;
  onSkip?: () => void;
}

const STEPS = [
  { id: 'welcome', title: 'Welcome', component: WelcomeStep },
  { id: 'dietary', title: 'Dietary Preferences', component: DietaryPreferencesStep },
  { id: 'allergies', title: 'Allergies', component: AllergiesStep },
  { id: 'skill', title: 'Cooking Skill', component: CookingSkillStep },
  { id: 'nutrition', title: 'Nutritional Goals', component: NutritionalGoalsStep },
  { id: 'preferences', title: 'Meal Preferences', component: MealPreferencesStep },
  { id: 'summary', title: 'Summary', component: SummaryStep },
];

export const MealPlannerWizard: React.FC<MealPlannerWizardProps> = ({
  onComplete,
  onSkip,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [wizardData, setWizardData] = useState<WizardData>({
    dietaryPreferences: [],
    allergies: [],
    cookingSkill: '',
    nutritionalGoals: [],
    cuisineTypes: [],
    maxCookingTime: 30,
    mealsPerDay: 3,
  });

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(wizardData);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateData = (data: Partial<WizardData>) => {
    setWizardData((prev) => ({ ...prev, ...data }));
  };

  const CurrentStepComponent = STEPS[currentStep].component;
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-2xl"
      >
        {/* Glass Card Container */}
        <div className="relative overflow-hidden rounded-3xl bg-white/10 dark:bg-black/20 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-2xl">
          {/* Animated gradient background */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-pink-500/20 to-purple-500/20 animate-gradient-shift" />
          </div>

          {/* Progress bar */}
          <div className="relative h-1 bg-white/10">
            <motion.div
              className="h-full bg-gradient-to-r from-orange-500 to-pink-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>

          {/* Step indicator */}
          <div className="relative px-8 pt-6 pb-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {STEPS[currentStep].title}
                </h2>
                <p className="text-sm text-white/60 mt-1">
                  Step {currentStep + 1} of {STEPS.length}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {STEPS.map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      'w-2 h-2 rounded-full transition-all duration-300',
                      index === currentStep
                        ? 'w-8 bg-gradient-to-r from-orange-500 to-pink-500'
                        : index < currentStep
                        ? 'bg-white/60'
                        : 'bg-white/20'
                    )}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="relative p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <CurrentStepComponent
                  data={wizardData}
                  updateData={updateData}
                  onNext={handleNext}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="relative px-8 pb-8">
            <div className="flex items-center justify-between">
              {currentStep > 0 ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleBack}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all duration-300"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Back
                </motion.button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-3">
                {currentStep === 0 && onSkip && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onSkip}
                    className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white/80 transition-all duration-300"
                  >
                    Skip for now
                  </motion.button>
                )}

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleNext}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-medium shadow-lg transition-all duration-300"
                >
                  {currentStep === STEPS.length - 1 ? (
                    <>
                      Complete Setup
                      <Check className="w-5 h-5" />
                    </>
                  ) : (
                    <>
                      Continue
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/10 to-transparent blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-purple-500/10 to-transparent blur-3xl" />
        </div>
      </motion.div>
    </div>
  );
};