'use client';

import { useState } from 'react';
import { Clock, ChefHat, Users, Check } from 'lucide-react';

import { useOnboardingStore } from '../../store/onboardingStore';
import { CookingSkillLevel, CookingTimePreference, CuisineType } from '../../types';

interface CookingPreferencesStepProps {
  onNext: () => void;
  onBack: () => void;
}

const SKILL_LEVELS = [
  {
    value: CookingSkillLevel.BEGINNER,
    label: 'Beginner',
    description: 'I can follow simple recipes',
    icon: '👶'
  },
  {
    value: CookingSkillLevel.INTERMEDIATE,
    label: 'Intermediate',
    description: 'I\'m comfortable with most recipes',
    icon: '👨‍🍳'
  },
  {
    value: CookingSkillLevel.ADVANCED,
    label: 'Advanced',
    description: 'I enjoy complex cooking techniques',
    icon: '👨‍🍳'
  },
  {
    value: CookingSkillLevel.EXPERT,
    label: 'Expert',
    description: 'I can improvise and create recipes',
    icon: '⭐'
  }
];

const TIME_PREFERENCES = [
  {
    value: CookingTimePreference.QUICK,
    label: 'Quick & Easy',
    description: 'Under 30 minutes',
    icon: '⚡'
  },
  {
    value: CookingTimePreference.MODERATE,
    label: 'Moderate',
    description: '30-60 minutes',
    icon: '⏱️'
  },
  {
    value: CookingTimePreference.LEISURELY,
    label: 'Leisurely',
    description: 'I enjoy spending time cooking',
    icon: '🍲'
  }
];

const CUISINE_OPTIONS = [
  { value: CuisineType.ITALIAN, label: 'Italian', icon: '🇮🇹' },
  { value: CuisineType.MEXICAN, label: 'Mexican', icon: '🇲🇽' },
  { value: CuisineType.CHINESE, label: 'Chinese', icon: '🇨🇳' },
  { value: CuisineType.JAPANESE, label: 'Japanese', icon: '🇯🇵' },
  { value: CuisineType.INDIAN, label: 'Indian', icon: '🇮🇳' },
  { value: CuisineType.THAI, label: 'Thai', icon: '🇹🇭' },
  { value: CuisineType.GREEK, label: 'Greek', icon: '🇬🇷' },
  { value: CuisineType.AMERICAN, label: 'American', icon: '🇺🇸' },
  { value: CuisineType.MEDITERRANEAN, label: 'Mediterranean', icon: '🌊' },
  { value: CuisineType.FRENCH, label: 'French', icon: '🇫🇷' },
  { value: CuisineType.KOREAN, label: 'Korean', icon: '🇰🇷' },
  { value: CuisineType.VIETNAMESE, label: 'Vietnamese', icon: '🇻🇳' }
];

export function CookingPreferencesStep({ onNext, onBack }: CookingPreferencesStepProps) {
  const { data, savePreferences } = useOnboardingStore();
  
  const [skillLevel, setSkillLevel] = useState<CookingSkillLevel>(
    data.preferences?.cooking_skill_level || CookingSkillLevel.INTERMEDIATE
  );
  const [timePreference, setTimePreference] = useState<CookingTimePreference>(
    data.preferences?.cooking_time_preference || CookingTimePreference.MODERATE
  );
  const [cuisinePreferences, setCuisinePreferences] = useState<CuisineType[]>(
    data.preferences?.cuisine_preferences || []
  );
  const [householdSize, setHouseholdSize] = useState(
    data.preferences?.household_size || 2
  );
  const [isLoading, setIsLoading] = useState(false);

  const toggleCuisine = (cuisine: CuisineType) => {
    setCuisinePreferences(prev =>
      prev.includes(cuisine)
        ? prev.filter(c => c !== cuisine)
        : [...prev, cuisine]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);
    try {
      await savePreferences({
        cooking_skill_level: skillLevel,
        cooking_time_preference: timePreference,
        cuisine_preferences: cuisinePreferences,
        household_size: householdSize
      });
      onNext();
    } catch (error: unknown) {
      console.error('Failed to save preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Cooking Preferences
        </h2>
        <p className="text-gray-600">
          Help us understand your cooking style and preferences
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Skill Level */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ChefHat className="h-5 w-5" />
            Cooking Skill Level
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {SKILL_LEVELS.map((level) => (
              <button
                key={level.value}
                type="button"
                onClick={() => setSkillLevel(level.value)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  skillLevel === level.value
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{level.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 flex items-center gap-2">
                      {level.label}
                      {skillLevel === level.value && (
                        <Check className="h-4 w-4 text-indigo-600" />
                      )}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {level.description}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Time Preference */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Cooking Time Preference
          </h3>
          <div className="grid sm:grid-cols-3 gap-3">
            {TIME_PREFERENCES.map((pref) => (
              <button
                key={pref.value}
                type="button"
                onClick={() => setTimePreference(pref.value)}
                className={`p-4 rounded-lg border-2 transition-all text-center ${
                  timePreference === pref.value
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-2xl mb-2 block">{pref.icon}</span>
                <div className="font-medium text-gray-900">
                  {pref.label}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {pref.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Household Size */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Household Size
          </h3>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setHouseholdSize(Math.max(1, householdSize - 1))}
              className="w-10 h-10 rounded-full border-2 border-gray-300 hover:border-gray-400 flex items-center justify-center"
            >
              -
            </button>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">{householdSize}</div>
              <div className="text-sm text-gray-500">
                {householdSize === 1 ? 'person' : 'people'}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setHouseholdSize(householdSize + 1)}
              className="w-10 h-10 rounded-full border-2 border-gray-300 hover:border-gray-400 flex items-center justify-center"
            >
              +
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            We'll adjust portion sizes based on your household
          </p>
        </div>

        {/* Cuisine Preferences */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Favorite Cuisines
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Select all that appeal to you (we'll mix it up!)
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {CUISINE_OPTIONS.map((cuisine) => (
              <button
                key={cuisine.value}
                type="button"
                onClick={() => toggleCuisine(cuisine.value)}
                className={`p-3 rounded-lg border-2 transition-all text-center ${
                  cuisinePreferences.includes(cuisine.value)
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-2xl mb-1 block">{cuisine.icon}</span>
                <div className="text-sm font-medium text-gray-900">
                  {cuisine.label}
                </div>
              </button>
            ))}
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
            disabled={isLoading || cuisinePreferences.length === 0}
            className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : 'Continue'}
          </button>
        </div>
      </form>
    </div>
  );
}