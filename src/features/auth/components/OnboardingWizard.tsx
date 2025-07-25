'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-8">
          {/* Progress Bar */}
          {currentStep !== OnboardingStep.WELCOME && currentStep !== OnboardingStep.COMPLETION && (
            <div className="mb-8">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Step {currentStepNumber} of {totalSteps}</span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-600 transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Step Content */}
          <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
            {renderStep()}
          </div>

          {/* Loading Overlay */}
          {isLoading && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 flex items-center space-x-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <span className="text-gray-700">Processing...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}