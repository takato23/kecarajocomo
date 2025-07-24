'use client';

import { useState } from 'react';

import { useOnboardingStore } from '../../store/onboardingStore';

interface NutritionGoalsStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function NutritionGoalsStep({ onNext, onBack }: NutritionGoalsStepProps) {
  const { savePreferences } = useOnboardingStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await savePreferences({
        nutrition_goals: {
          daily_calories: 2000,
          protein_percentage: 20,
          carbs_percentage: 50,
          fat_percentage: 30,
          fiber_grams: 25,
          sodium_mg: 2300,
        }
      });
      onNext();
    } catch (error: unknown) {
      console.error('Error saving nutrition goals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Nutrition Goals
        </h2>
        <p className="text-gray-600">
          Set your nutritional targets (or skip for now)
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">
            We'll set up basic nutrition goals for you. You can customize these later in your profile.
          </p>
        </div>

        <div className="flex justify-between">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
          >
            Back
          </button>
          
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Continue'}
          </button>
        </div>
      </form>
    </div>
  );
}