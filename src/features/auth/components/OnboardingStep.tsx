'use client';

import { motion } from 'framer-motion';

interface OnboardingStepProps {
  step: string;
  data: any;
  onUpdate: (updates: any) => void;
}

const DIETARY_RESTRICTIONS = [
  { id: 'vegetarian', label: 'Vegetarian', icon: '🥗' },
  { id: 'vegan', label: 'Vegan', icon: '🌱' },
  { id: 'gluten_free', label: 'Gluten-Free', icon: '🌾' },
  { id: 'dairy_free', label: 'Dairy-Free', icon: '🥛' },
  { id: 'keto', label: 'Keto', icon: '🥑' },
  { id: 'paleo', label: 'Paleo', icon: '🍖' },
];

const COMMON_ALLERGIES = [
  { id: 'nuts', label: 'Nuts', icon: '🥜' },
  { id: 'shellfish', label: 'Shellfish', icon: '🦐' },
  { id: 'eggs', label: 'Eggs', icon: '🥚' },
  { id: 'soy', label: 'Soy', icon: '🫘' },
  { id: 'fish', label: 'Fish', icon: '🐟' },
  { id: 'sesame', label: 'Sesame', icon: '🌰' },
];

const CUISINE_TYPES = [
  { id: 'italian', label: 'Italian', icon: '🇮🇹' },
  { id: 'mexican', label: 'Mexican', icon: '🇲🇽' },
  { id: 'chinese', label: 'Chinese', icon: '🇨🇳' },
  { id: 'japanese', label: 'Japanese', icon: '🇯🇵' },
  { id: 'indian', label: 'Indian', icon: '🇮🇳' },
  { id: 'thai', label: 'Thai', icon: '🇹🇭' },
  { id: 'mediterranean', label: 'Mediterranean', icon: '🌊' },
  { id: 'american', label: 'American', icon: '🇺🇸' },
];

const SKILL_LEVELS = [
  { id: 'novice', label: 'Novice', description: 'Just starting out' },
  { id: 'beginner', label: 'Beginner', description: 'Know the basics' },
  { id: 'intermediate', label: 'Intermediate', description: 'Comfortable cooking' },
  { id: 'advanced', label: 'Advanced', description: 'Love experimenting' },
  { id: 'expert', label: 'Expert', description: 'Professional level' },
];

const NUTRITION_GOALS = [
  { id: 'balanced', label: 'Balanced Diet', icon: '⚖️' },
  { id: 'weight_loss', label: 'Weight Loss', icon: '📉' },
  { id: 'muscle_gain', label: 'Muscle Gain', icon: '💪' },
  { id: 'heart_healthy', label: 'Heart Healthy', icon: '❤️' },
  { id: 'low_sodium', label: 'Low Sodium', icon: '🧂' },
  { id: 'high_protein', label: 'High Protein', icon: '🥩' },
];

export function OnboardingStep({ step, data, onUpdate }: OnboardingStepProps) {
  const toggleArrayItem = (array: string[], item: string) => {
    if (array.includes(item)) {
      return array.filter(i => i !== item);
    }
    return [...array, item];
  };

  switch (step) {
    case 'profile':
      return (
        <div className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={data.username}
              onChange={(e) => onUpdate({ username: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
              placeholder="johndoe"
              required
            />
            <p className="mt-1 text-xs text-gray-500">This will be your unique identifier</p>
          </div>

          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              value={data.fullName}
              onChange={(e) => onUpdate({ fullName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <label htmlFor="householdSize" className="block text-sm font-medium text-gray-700 mb-1">
              Household Size
            </label>
            <select
              id="householdSize"
              value={data.householdSize}
              onChange={(e) => onUpdate({ householdSize: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map(size => (
                <option key={size} value={size}>{size} {size === 1 ? 'person' : 'people'}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">Helps us suggest appropriate serving sizes</p>
          </div>
        </div>
      );

    case 'preferences':
      return (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Dietary Restrictions</h3>
            <div className="grid grid-cols-2 gap-3">
              {DIETARY_RESTRICTIONS.map(restriction => (
                <motion.button
                  key={restriction.id}
                  type="button"
                  onClick={() => onUpdate({
                    dietaryRestrictions: toggleArrayItem(data.dietaryRestrictions, restriction.id)
                  })}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    data.dietaryRestrictions.includes(restriction.id)
                      ? 'border-lime-500 bg-lime-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{restriction.icon}</span>
                    <span className="font-medium">{restriction.label}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Allergies</h3>
            <div className="grid grid-cols-2 gap-3">
              {COMMON_ALLERGIES.map(allergy => (
                <motion.button
                  key={allergy.id}
                  type="button"
                  onClick={() => onUpdate({
                    allergies: toggleArrayItem(data.allergies, allergy.id)
                  })}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    data.allergies.includes(allergy.id)
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{allergy.icon}</span>
                    <span className="font-medium">{allergy.label}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Favorite Cuisines</h3>
            <div className="grid grid-cols-2 gap-3">
              {CUISINE_TYPES.map(cuisine => (
                <motion.button
                  key={cuisine.id}
                  type="button"
                  onClick={() => onUpdate({
                    cuisinePreferences: toggleArrayItem(data.cuisinePreferences, cuisine.id)
                  })}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    data.cuisinePreferences.includes(cuisine.id)
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{cuisine.icon}</span>
                    <span className="font-medium">{cuisine.label}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      );

    case 'goals':
      return (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Cooking Skill Level</h3>
            <div className="space-y-2">
              {SKILL_LEVELS.map(level => (
                <motion.button
                  key={level.id}
                  type="button"
                  onClick={() => onUpdate({ cookingSkillLevel: level.id })}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    data.cookingSkillLevel === level.id
                      ? 'border-lime-500 bg-lime-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">{level.label}</div>
                  <div className="text-sm text-gray-500">{level.description}</div>
                </motion.button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Nutrition Goals</h3>
            <div className="grid grid-cols-2 gap-3">
              {NUTRITION_GOALS.map(goal => (
                <motion.button
                  key={goal.id}
                  type="button"
                  onClick={() => onUpdate({
                    nutritionGoals: { ...data.nutritionGoals, type: goal.id }
                  })}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    data.nutritionGoals.type === goal.id
                      ? 'border-lime-500 bg-lime-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{goal.icon}</span>
                    <span className="font-medium">{goal.label}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Daily Calorie Target</h3>
            <input
              type="range"
              min="1200"
              max="4000"
              step="100"
              value={data.nutritionGoals.dailyCalories}
              onChange={(e) => onUpdate({
                nutritionGoals: { ...data.nutritionGoals, dailyCalories: parseInt(e.target.value) }
              })}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-600 mt-1">
              <span>1200</span>
              <span className="font-medium text-lime-600">{data.nutritionGoals.dailyCalories} calories</span>
              <span>4000</span>
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
}