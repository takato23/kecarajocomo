'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, Users, RefreshCw, CheckCircle } from 'lucide-react';

import { useOnboardingStore } from '../../store/onboardingStore';

interface MealPlanPreviewStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function MealPlanPreviewStep({ onNext, onBack }: MealPlanPreviewStepProps) {
  const { data, generateInitialMealPlan, isLoading, error } = useOnboardingStore();
  const [hasGenerated, setHasGenerated] = useState(false);

  useEffect(() => {
    if (!data.initialMealPlan && !hasGenerated && !isLoading) {
      handleGenerateMealPlan();
    }
  }, []);

  const handleGenerateMealPlan = async () => {
    setHasGenerated(true);
    try {
      await generateInitialMealPlan();
    } catch (error: unknown) {
      console.error('Failed to generate meal plan:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  const mealPlan = data.initialMealPlan;
  const preferences = data.preferences;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Your Personalized Meal Plan Preview
        </h2>
        <p className="text-gray-600">
          Here's a sample of what our AI can create for you based on your preferences
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* User Summary */}
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Preferences Summary</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-600" />
              <span>Household: {preferences?.household_size || 2} people</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-indigo-600" />
              <span>Cooking time: {preferences?.cooking_time_preference || 'moderate'}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-indigo-600" />
              <span>Skill level: {preferences?.cooking_skill_level || 'intermediate'}</span>
            </div>
          </div>
          {preferences?.dietary_restrictions && preferences.dietary_restrictions.length > 0 && (
            <div className="mt-3">
              <span className="text-sm font-medium text-gray-700">Dietary restrictions: </span>
              <span className="text-sm text-gray-600">
                {preferences.dietary_restrictions.join(', ')}
              </span>
            </div>
          )}
          {preferences?.cuisine_preferences && preferences.cuisine_preferences.length > 0 && (
            <div className="mt-2">
              <span className="text-sm font-medium text-gray-700">Favorite cuisines: </span>
              <span className="text-sm text-gray-600">
                {preferences.cuisine_preferences.join(', ')}
              </span>
            </div>
          )}
        </div>

        {/* Meal Plan Generation */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Sample Weekly Meal Plan
            </h3>
            <button
              type="button"
              onClick={handleGenerateMealPlan}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Generating...' : 'Regenerate'}
            </button>
          </div>

          {isLoading && (
            <div className="text-center py-12">
              <div className="inline-flex items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <div>
                  <p className="text-gray-700 font-medium">Generating your personalized meal plan...</p>
                  <p className="text-sm text-gray-500">This may take a few moments</p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">
                <span className="font-medium">Error:</span> {error}
              </p>
              <button
                type="button"
                onClick={handleGenerateMealPlan}
                className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
              >
                Try again
              </button>
            </div>
          )}

          {mealPlan && !isLoading && (
            <div className="space-y-4">
              {/* Mock meal plan since we don't have the API yet */}
              <div className="grid gap-4">
                {[
                  { day: 'Monday', meal: 'Mediterranean Chickpea Bowl', time: '25 min' },
                  { day: 'Tuesday', meal: 'Honey Garlic Salmon with Vegetables', time: '30 min' },
                  { day: 'Wednesday', meal: 'Vegetarian Pasta Primavera', time: '20 min' },
                  { day: 'Thursday', meal: 'Thai Chicken Curry', time: '35 min' },
                  { day: 'Friday', meal: 'Quinoa Stuffed Bell Peppers', time: '40 min' },
                ].map((meal, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium text-gray-900">{meal.day}</span>
                      <p className="text-gray-600">{meal.meal}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-gray-500">{meal.time}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
                <p className="text-green-800 text-sm">
                  <span className="font-medium">✨ This is just a preview!</span> Once you complete onboarding, 
                  you'll get access to full meal plans with recipes, shopping lists, and nutritional information.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Features Preview */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-white border border-gray-200 rounded-lg">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <h4 className="font-medium text-gray-900 mb-2">Smart Planning</h4>
            <p className="text-sm text-gray-600">
              AI considers your preferences, pantry, and nutrition goals
            </p>
          </div>

          <div className="text-center p-4 bg-white border border-gray-200 rounded-lg">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h4 className="font-medium text-gray-900 mb-2">Easy Adjustments</h4>
            <p className="text-sm text-gray-600">
              Swap meals, adjust portions, or regenerate with one click
            </p>
          </div>

          <div className="text-center p-4 bg-white border border-gray-200 rounded-lg">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
            <h4 className="font-medium text-gray-900 mb-2">Time Saving</h4>
            <p className="text-sm text-gray-600">
              Spend less time planning, more time enjoying great food
            </p>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            Back
          </button>
          
          <button
            type="submit"
            className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
          >
            Complete Setup
          </button>
        </div>
      </form>
    </div>
  );
}