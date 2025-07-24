'use client';

import { useState } from 'react';
import { Check, Info, Plus, X } from 'lucide-react';

import { useOnboardingStore } from '../../store/onboardingStore';
import { DietaryRestriction } from '../../types';

interface DietaryPreferencesStepProps {
  onNext: () => void;
  onBack: () => void;
}

const DIETARY_OPTIONS = [
  {
    value: DietaryRestriction.VEGETARIAN,
    label: 'Vegetarian',
    description: 'No meat or fish',
    icon: '🥗'
  },
  {
    value: DietaryRestriction.VEGAN,
    label: 'Vegan',
    description: 'No animal products',
    icon: '🌱'
  },
  {
    value: DietaryRestriction.GLUTEN_FREE,
    label: 'Gluten-Free',
    description: 'No wheat, barley, or rye',
    icon: '🌾'
  },
  {
    value: DietaryRestriction.DAIRY_FREE,
    label: 'Dairy-Free',
    description: 'No milk products',
    icon: '🥛'
  },
  {
    value: DietaryRestriction.NUT_FREE,
    label: 'Nut-Free',
    description: 'No tree nuts or peanuts',
    icon: '🥜'
  },
  {
    value: DietaryRestriction.KOSHER,
    label: 'Kosher',
    description: 'Following Jewish dietary laws',
    icon: '✡️'
  },
  {
    value: DietaryRestriction.HALAL,
    label: 'Halal',
    description: 'Following Islamic dietary laws',
    icon: '☪️'
  },
  {
    value: DietaryRestriction.LOW_CARB,
    label: 'Low-Carb',
    description: 'Reduced carbohydrates',
    icon: '🍞'
  },
  {
    value: DietaryRestriction.KETO,
    label: 'Keto',
    description: 'Very low-carb, high-fat',
    icon: '🥑'
  },
  {
    value: DietaryRestriction.PALEO,
    label: 'Paleo',
    description: 'Whole foods, no grains',
    icon: '🥩'
  },
  {
    value: DietaryRestriction.PESCATARIAN,
    label: 'Pescatarian',
    description: 'Vegetarian plus fish',
    icon: '🐟'
  }
];

export function DietaryPreferencesStep({ onNext, onBack }: DietaryPreferencesStepProps) {
  const { data, savePreferences } = useOnboardingStore();
  
  const [selectedRestrictions, setSelectedRestrictions] = useState<DietaryRestriction[]>(
    data.preferences?.dietary_restrictions || []
  );
  const [allergies, setAllergies] = useState<string[]>(
    data.preferences?.allergies || []
  );
  const [newAllergy, setNewAllergy] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const toggleRestriction = (restriction: DietaryRestriction) => {
    setSelectedRestrictions(prev =>
      prev.includes(restriction)
        ? prev.filter(r => r !== restriction)
        : [...prev, restriction]
    );
  };

  const addAllergy = () => {
    if (newAllergy.trim() && !allergies.includes(newAllergy.trim())) {
      setAllergies([...allergies, newAllergy.trim()]);
      setNewAllergy('');
    }
  };

  const removeAllergy = (allergy: string) => {
    setAllergies(allergies.filter(a => a !== allergy));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);
    try {
      await savePreferences({
        dietary_restrictions: selectedRestrictions,
        allergies
      });
      onNext();
    } catch (error: unknown) {
      console.error('Failed to save preferences:', error);
      // Log error but don't show modal - user can continue
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Dietary Preferences & Restrictions
        </h2>
        <p className="text-gray-600">
          Select any dietary preferences or restrictions you follow
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Dietary Restrictions */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Dietary Restrictions
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {DIETARY_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => toggleRestriction(option.value)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedRestrictions.includes(option.value)
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{option.icon}</span>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-gray-900 flex items-center gap-2">
                      {option.label}
                      {selectedRestrictions.includes(option.value) && (
                        <Check className="h-4 w-4 text-indigo-600" />
                      )}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {option.description}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Allergies */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Allergies & Intolerances
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Add any specific ingredients you need to avoid
          </p>
          
          <div className="space-y-3">
            {/* Allergy Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newAllergy}
                onChange={(e) => setNewAllergy(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAllergy())}
                placeholder="e.g., shellfish, soy, eggs"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={addAllergy}
                disabled={!newAllergy.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>

            {/* Allergy List */}
            {allergies.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {allergies.map((allergy) => (
                  <span
                    key={allergy}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm"
                  >
                    {allergy}
                    <button
                      type="button"
                      onClick={() => removeAllergy(allergy)}
                      className="hover:text-red-900"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Your preferences are private</p>
            <p>
              We use this information solely to provide you with suitable meal suggestions 
              and ensure your safety. You can update these preferences at any time.
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
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onNext}
              className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              Skip for now
            </button>
            
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : 'Save & Continue'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}