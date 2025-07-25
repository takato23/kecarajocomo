'use client';

import React, { useState } from 'react';
import { 
  Settings, 
  Save, 
  ChefHat, 
  Clock, 
  Users,
  Heart,
  Shield,
  Target,
  X,
  Plus
} from 'lucide-react';
import { motion } from 'framer-motion';
import { UserPreferences } from '../types';
import { useMealPlannerStore } from '../store/mealPlannerStore';
import { cn } from '@/lib/utils';

const CUISINES = [
  'Italian', 'Mexican', 'Chinese', 'Japanese', 'Indian', 
  'Thai', 'Greek', 'French', 'Spanish', 'American',
  'Mediterranean', 'Korean', 'Vietnamese', 'Brazilian'
];

const DIETARY_RESTRICTIONS = [
  'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free',
  'Keto', 'Paleo', 'Low-Carb', 'Low-Fat', 'Halal', 'Kosher'
];

const COMMON_ALLERGIES = [
  'Peanuts', 'Tree Nuts', 'Milk', 'Eggs', 'Wheat',
  'Soy', 'Fish', 'Shellfish', 'Sesame'
];

interface UserPreferencesFormProps {
  onClose?: () => void;
  className?: string;
}

export const UserPreferencesForm: React.FC<UserPreferencesFormProps> = ({
  onClose,
  className
}) => {
  const { userPreferences, updateUserPreferences } = useMealPlannerStore();
  
  const [preferences, setPreferences] = useState<UserPreferences>(
    userPreferences || {
      dietaryRestrictions: [],
      allergies: [],
      dislikedIngredients: [],
      preferredCuisines: [],
      cookingSkillLevel: 'intermediate',
      servingSize: 2,
      maxCookingTime: 60,
      nutritionalGoals: {
        dailyCalories: { min: 1800, max: 2200 },
        dailyProtein: { min: 50, max: 150 },
        dailyCarbs: { min: 225, max: 325 },
        dailyFat: { min: 44, max: 78 }
      }
    }
  );

  const [newDislikedIngredient, setNewDislikedIngredient] = useState('');

  const handleSave = () => {
    updateUserPreferences(preferences);
    onClose?.();
  };

  const toggleArrayItem = (
    array: string[],
    item: string,
    field: keyof UserPreferences
  ) => {
    const newArray = array.includes(item)
      ? array.filter((i) => i !== item)
      : [...array, item];
    
    setPreferences({ ...preferences, [field]: newArray });
  };

  const addDislikedIngredient = () => {
    if (newDislikedIngredient.trim()) {
      setPreferences({
        ...preferences,
        dislikedIngredients: [
          ...preferences.dislikedIngredients,
          newDislikedIngredient.trim()
        ]
      });
      setNewDislikedIngredient('');
    }
  };

  const removeDislikedIngredient = (ingredient: string) => {
    setPreferences({
      ...preferences,
      dislikedIngredients: preferences.dislikedIngredients.filter(
        (i) => i !== ingredient
      )
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "bg-card border rounded-lg shadow-lg overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Settings className="w-6 h-6" />
            Meal Planning Preferences
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
        {/* Dietary Restrictions */}
        <div>
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Dietary Restrictions
          </h3>
          <div className="flex flex-wrap gap-2">
            {DIETARY_RESTRICTIONS.map((restriction) => (
              <button
                key={restriction}
                onClick={() =>
                  toggleArrayItem(
                    preferences.dietaryRestrictions,
                    restriction,
                    'dietaryRestrictions'
                  )
                }
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                  preferences.dietaryRestrictions.includes(restriction)
                    ? "bg-primary text-primary-foreground"
                    : "bg-accent hover:bg-accent/80"
                )}
              >
                {restriction}
              </button>
            ))}
          </div>
        </div>

        {/* Allergies */}
        <div>
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <Heart className="w-4 h-4 text-red-500" />
            Allergies
          </h3>
          <div className="flex flex-wrap gap-2">
            {COMMON_ALLERGIES.map((allergy) => (
              <button
                key={allergy}
                onClick={() =>
                  toggleArrayItem(preferences.allergies, allergy, 'allergies')
                }
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                  preferences.allergies.includes(allergy)
                    ? "bg-red-500 text-white"
                    : "bg-accent hover:bg-accent/80"
                )}
              >
                {allergy}
              </button>
            ))}
          </div>
        </div>

        {/* Preferred Cuisines */}
        <div>
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <ChefHat className="w-4 h-4" />
            Preferred Cuisines
          </h3>
          <div className="flex flex-wrap gap-2">
            {CUISINES.map((cuisine) => (
              <button
                key={cuisine}
                onClick={() =>
                  toggleArrayItem(
                    preferences.preferredCuisines,
                    cuisine,
                    'preferredCuisines'
                  )
                }
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                  preferences.preferredCuisines.includes(cuisine)
                    ? "bg-primary text-primary-foreground"
                    : "bg-accent hover:bg-accent/80"
                )}
              >
                {cuisine}
              </button>
            ))}
          </div>
        </div>

        {/* Disliked Ingredients */}
        <div>
          <h3 className="font-medium mb-3">Disliked Ingredients</h3>
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={newDislikedIngredient}
                onChange={(e) => setNewDislikedIngredient(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addDislikedIngredient()}
                placeholder="Add ingredient to avoid..."
                className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                onClick={addDislikedIngredient}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {preferences.dislikedIngredients.map((ingredient) => (
                <span
                  key={ingredient}
                  className="px-3 py-1.5 bg-accent rounded-lg text-sm flex items-center gap-1"
                >
                  {ingredient}
                  <button
                    onClick={() => removeDislikedIngredient(ingredient)}
                    className="ml-1 hover:text-destructive transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Cooking Settings */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <ChefHat className="w-4 h-4" />
              Cooking Skill Level
            </label>
            <select
              value={preferences.cookingSkillLevel}
              onChange={(e) =>
                setPreferences({
                  ...preferences,
                  cookingSkillLevel: e.target.value as any
                })
              }
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Default Serving Size
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={preferences.servingSize}
              onChange={(e) =>
                setPreferences({
                  ...preferences,
                  servingSize: parseInt(e.target.value) || 2
                })
              }
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Max Cooking Time */}
        <div>
          <label className="block text-sm font-medium mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Maximum Cooking Time (minutes)
          </label>
          <input
            type="range"
            min="15"
            max="180"
            step="15"
            value={preferences.maxCookingTime || 60}
            onChange={(e) =>
              setPreferences({
                ...preferences,
                maxCookingTime: parseInt(e.target.value)
              })
            }
            className="w-full"
          />
          <div className="flex justify-between text-sm text-muted-foreground mt-1">
            <span>15 min</span>
            <span className="font-medium text-foreground">
              {preferences.maxCookingTime || 60} minutes
            </span>
            <span>3 hours</span>
          </div>
        </div>

        {/* Nutritional Goals */}
        <div>
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <Target className="w-4 h-4" />
            Daily Nutritional Goals
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Calories</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={preferences.nutritionalGoals?.dailyCalories?.min || ''}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      nutritionalGoals: {
                        ...preferences.nutritionalGoals,
                        dailyCalories: {
                          ...preferences.nutritionalGoals?.dailyCalories,
                          min: parseInt(e.target.value) || undefined
                        }
                      }
                    })
                  }
                  className="flex-1 px-2 py-1 border rounded text-sm"
                />
                <span className="self-center">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={preferences.nutritionalGoals?.dailyCalories?.max || ''}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      nutritionalGoals: {
                        ...preferences.nutritionalGoals,
                        dailyCalories: {
                          ...preferences.nutritionalGoals?.dailyCalories,
                          max: parseInt(e.target.value) || undefined
                        }
                      }
                    })
                  }
                  className="flex-1 px-2 py-1 border rounded text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1">Protein (g)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={preferences.nutritionalGoals?.dailyProtein?.min || ''}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      nutritionalGoals: {
                        ...preferences.nutritionalGoals,
                        dailyProtein: {
                          ...preferences.nutritionalGoals?.dailyProtein,
                          min: parseInt(e.target.value) || undefined
                        }
                      }
                    })
                  }
                  className="flex-1 px-2 py-1 border rounded text-sm"
                />
                <span className="self-center">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={preferences.nutritionalGoals?.dailyProtein?.max || ''}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      nutritionalGoals: {
                        ...preferences.nutritionalGoals,
                        dailyProtein: {
                          ...preferences.nutritionalGoals?.dailyProtein,
                          max: parseInt(e.target.value) || undefined
                        }
                      }
                    })
                  }
                  className="flex-1 px-2 py-1 border rounded text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 border-t bg-accent/50">
        <button
          onClick={handleSave}
          className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          Save Preferences
        </button>
      </div>
    </motion.div>
  );
};