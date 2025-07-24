'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

import { useAuthStore } from '@/stores/auth';
import { supabase } from '@/lib/supabase/client';
import { OnboardingStep } from '@/features/auth/components/OnboardingStep';

const ONBOARDING_STEPS = [
  {
    id: 'profile',
    title: 'Complete Your Profile',
    description: 'Tell us a bit about yourself',
  },
  {
    id: 'preferences',
    title: 'Dietary Preferences',
    description: 'Help us personalize your experience',
  },
  {
    id: 'goals',
    title: 'Your Cooking Goals',
    description: 'What would you like to achieve?',
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    // Profile
    username: '',
    fullName: '',
    
    // Preferences
    dietaryRestrictions: [] as string[],
    allergies: [] as string[],
    cuisinePreferences: [] as string[],
    cookingSkillLevel: 'intermediate',
    householdSize: 2,
    
    // Goals
    nutritionGoals: {
      type: 'balanced',
      dailyCalories: 2000,
    },
    preferredMealTimes: {
      breakfast: '08:00',
      lunch: '12:30',
      dinner: '19:00',
    },
  });

  const handleNext = async () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      await handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      // Create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: user.id,
          username: formData.username,
          full_name: formData.fullName,
        });

      if (profileError) throw profileError;

      // Create user preferences
      const { error: prefsError } = await supabase
        .from('user_preferences')
        .insert({
          user_id: user.id,
          dietary_restrictions: formData.dietaryRestrictions,
          allergies: formData.allergies,
          cuisine_preferences: formData.cuisinePreferences,
          cooking_skill_level: formData.cookingSkillLevel,
          household_size: formData.householdSize,
          nutrition_goals: formData.nutritionGoals,
          preferred_meal_times: formData.preferredMealTimes,
        });

      if (prefsError) throw prefsError;

      // Redirect to app
      router.push('/app');
    } catch (err: unknown) {
      setError(err.message || 'Failed to complete onboarding');
      setIsLoading(false);
    }
  };

  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-lime-50 via-white to-purple-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-medium text-gray-600">
              Step {currentStep + 1} of {ONBOARDING_STEPS.length}
            </h2>
            <button
              onClick={() => router.push('/app')}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Skip for now
            </button>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-lime-500 to-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / ONBOARDING_STEPS.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Step Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-white/80 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl p-8"
        >
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {ONBOARDING_STEPS[currentStep].title}
          </h1>
          <p className="text-gray-600 mb-6">
            {ONBOARDING_STEPS[currentStep].description}
          </p>

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <OnboardingStep
            step={ONBOARDING_STEPS[currentStep].id}
            data={formData}
            onUpdate={updateFormData}
          />

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className="px-4 py-2 text-gray-600 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lime-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Back
            </button>

            <motion.button
              onClick={handleNext}
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-2 text-white font-medium rounded-lg bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-600 hover:to-lime-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lime-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Loading...
                </span>
              ) : currentStep === ONBOARDING_STEPS.length - 1 ? (
                'Complete Setup'
              ) : (
                'Next'
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}