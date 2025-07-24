'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Plus, X, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface RecipeGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  initialIngredients?: string[];
}

const DIETARY_RESTRICTIONS = [
  'Vegetarian',
  'Vegan',
  'Gluten-Free',
  'Dairy-Free',
  'Keto',
  'Paleo',
  'Low-Sodium',
  'Sugar-Free'
];

const CUISINE_TYPES = [
  'Italian',
  'Mexican',
  'Chinese',
  'Japanese',
  'Indian',
  'Thai',
  'Mediterranean',
  'American',
  'French',
  'Korean'
];

export function RecipeGenerator({ isOpen, onClose, initialIngredients = [] }: RecipeGeneratorProps) {
  const router = useRouter();
  const [ingredients, setIngredients] = useState<string[]>(initialIngredients);
  const [currentIngredient, setCurrentIngredient] = useState('');
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [cuisinePreference, setCuisinePreference] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [servings, setServings] = useState(4);
  const [maxTime, setMaxTime] = useState(60);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddIngredient = () => {
    if (currentIngredient.trim() && !ingredients.includes(currentIngredient.trim())) {
      setIngredients([...ingredients, currentIngredient.trim()]);
      setCurrentIngredient('');
    }
  };

  const handleRemoveIngredient = (ingredient: string) => {
    setIngredients(ingredients.filter(i => i !== ingredient));
  };

  const toggleDietaryRestriction = (restriction: string) => {
    setDietaryRestrictions(prev =>
      prev.includes(restriction)
        ? prev.filter(r => r !== restriction)
        : [...prev, restriction]
    );
  };

  const handleGenerate = async () => {
    if (ingredients.length === 0) {
      setError('Please add at least one ingredient');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/generate-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients,
          dietaryRestrictions,
          cuisinePreference: cuisinePreference || undefined,
          difficulty,
          servings,
          maxTime,
          save: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate recipe');
      }

      // Redirect to the generated recipe
      router.push(`/app/recipes/${data.recipe.id}`);
      onClose();
    } catch (err: unknown) {
      setError(err.message || 'Failed to generate recipe');
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">AI Recipe Generator</h2>
                <p className="text-purple-100">Create amazing recipes with AI magic</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            {/* Ingredients */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ingredients (add at least one)
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={currentIngredient}
                  onChange={(e) => setCurrentIngredient(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddIngredient())}
                  placeholder="e.g., chicken, tomatoes, pasta..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={handleAddIngredient}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {ingredients.map(ingredient => (
                  <span
                    key={ingredient}
                    className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm flex items-center gap-1"
                  >
                    {ingredient}
                    <button
                      onClick={() => handleRemoveIngredient(ingredient)}
                      className="hover:text-purple-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Dietary Restrictions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dietary Restrictions
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {DIETARY_RESTRICTIONS.map(restriction => (
                  <button
                    key={restriction}
                    onClick={() => toggleDietaryRestriction(restriction)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      dietaryRestrictions.includes(restriction)
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {restriction}
                  </button>
                ))}
              </div>
            </div>

            {/* Cuisine Preference */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cuisine Preference
              </label>
              <select
                value={cuisinePreference}
                onChange={(e) => setCuisinePreference(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Any cuisine</option>
                {CUISINE_TYPES.map(cuisine => (
                  <option key={cuisine} value={cuisine.toLowerCase()}>
                    {cuisine}
                  </option>
                ))}
              </select>
            </div>

            {/* Other Settings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Servings
                </label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={servings}
                  onChange={(e) => setServings(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Time (minutes)
                </label>
                <input
                  type="number"
                  min="15"
                  max="180"
                  step="15"
                  value={maxTime}
                  onChange={(e) => setMaxTime(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-between items-center">
          <p className="text-sm text-gray-500">
            AI will create a unique recipe based on your preferences
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <motion.button
              onClick={handleGenerate}
              disabled={isGenerating || ingredients.length === 0}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Recipe
                </>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}