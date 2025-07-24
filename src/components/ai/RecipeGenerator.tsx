'use client';

import { useState } from 'react';
import { Sparkles, ChefHat, Clock, Users, Leaf, Filter, X, Plus } from 'lucide-react';

import { Button } from '@/components/design-system/Button';
import { Input } from '@/components/design-system/Input';
import { Badge } from '@/components/design-system/Badge';
import { FadeIn, SlideIn, HoverGrow } from '@/components/ui/transitions';
import { AIGeneratingCard } from '@/components/ui/loading';
import { ErrorMessage } from '@/components/ui/error';
import { cn } from '@/lib/utils';
import { OptimizedImage } from '@/components/ui/optimized-image';

interface RecipeGeneratorProps {
  onRecipeGenerated?: (recipe: any) => void;
}

export function RecipeGenerator({ onRecipeGenerated }: RecipeGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [currentIngredient, setCurrentIngredient] = useState('');
  const [preferences, setPreferences] = useState({
    cuisine: '',
    dietary: [] as string[],
    cookingTime: 30,
    servings: 4,
    difficulty: 'medium',
  });
  const [error, setError] = useState<string | null>(null);
  const [generatedRecipe, setGeneratedRecipe] = useState<any>(null);

  const dietaryOptions = [
    'Vegetarian',
    'Vegan',
    'Gluten-Free',
    'Dairy-Free',
    'Keto',
    'Low-Carb',
    'Paleo',
    'Mediterranean',
  ];

  const cuisineOptions = [
    'Italian',
    'Mexican',
    'Asian',
    'Mediterranean',
    'American',
    'French',
    'Indian',
    'Thai',
  ];

  const handleAddIngredient = () => {
    if (currentIngredient.trim() && !ingredients.includes(currentIngredient.trim())) {
      setIngredients([...ingredients, currentIngredient.trim()]);
      setCurrentIngredient('');
    }
  };

  const handleRemoveIngredient = (ingredient: string) => {
    setIngredients(ingredients.filter(i => i !== ingredient));
  };

  const toggleDietaryOption = (option: string) => {
    setPreferences(prev => ({
      ...prev,
      dietary: prev.dietary.includes(option)
        ? prev.dietary.filter(d => d !== option)
        : [...prev.dietary, option],
    }));
  };

  const handleGenerateRecipe = async () => {
    if (ingredients.length === 0) {
      setError('Please add at least one ingredient');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock generated recipe
      const mockRecipe = {
        id: Date.now().toString(),
        name: 'AI-Generated Delicious Meal',
        description: 'A perfectly balanced meal created just for you',
        ingredients: ingredients.map(ing => ({
          name: ing,
          amount: '1',
          unit: 'cup',
        })),
        instructions: [
          'Prepare all ingredients',
          'Cook according to your preferences',
          'Season to taste',
          'Serve and enjoy!',
        ],
        cookTime: preferences.cookingTime,
        servings: preferences.servings,
        difficulty: preferences.difficulty,
        nutrition: {
          calories: 350,
          protein: 25,
          carbs: 40,
          fat: 15,
        },
        imageUrl: '/api/placeholder/400/300',
      };

      setGeneratedRecipe(mockRecipe);
      onRecipeGenerated?.(mockRecipe);
    } catch (err: unknown) {
      setError('Failed to generate recipe. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (isGenerating) {
    return <AIGeneratingCard />;
  }

  if (generatedRecipe) {
    return (
      <FadeIn>
        <div className="glass-interactive rounded-xl p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              {generatedRecipe.name}
            </h3>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setGeneratedRecipe(null)}
            >
              Generate Another
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <OptimizedImage
                src={generatedRecipe.imageUrl}
                alt={generatedRecipe.name}
                aspectRatio="4:3"
                className="rounded-lg mb-4"
              />
              
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {generatedRecipe.description}
              </p>

              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {generatedRecipe.cookTime} min
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {generatedRecipe.servings} servings
                </span>
                <Badge variant={generatedRecipe.difficulty === 'easy' ? 'success' : 'warning'}>
                  {generatedRecipe.difficulty}
                </Badge>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Ingredients</h4>
              <ul className="space-y-2 mb-6">
                {generatedRecipe.ingredients.map((ing: any, index: number) => (
                  <li key={index} className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <div className="w-2 h-2 bg-food-fresh rounded-full" />
                    {ing.amount} {ing.unit} {ing.name}
                  </li>
                ))}
              </ul>

              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Nutrition per serving</h4>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(generatedRecipe.nutrition).map(([key, value]) => (
                  <div key={key} className="glass rounded-lg p-3">
                    <div className="text-sm text-gray-500 capitalize">{key}</div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {value}{key === 'calories' ? '' : 'g'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <Button className="flex-1">
              Save Recipe
            </Button>
            <Button variant="secondary" className="flex-1">
              Add to Meal Plan
            </Button>
          </div>
        </div>
      </FadeIn>
    );
  }

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-food-fresh to-food-fresh-dark mb-4">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            AI Recipe Generator
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Tell us what you have, and we&apos;ll create something delicious
          </p>
        </div>
      </FadeIn>

      {error && (
        <ErrorMessage message={error} onRetry={() => setError(null)} />
      )}

      <SlideIn direction="up" delay={0.1}>
        <div className="glass-interactive rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Ingredients
          </h3>
          
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Add an ingredient..."
              value={currentIngredient}
              onChange={(e) => setCurrentIngredient(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddIngredient()}
              className="flex-1"
            />
            <Button onClick={handleAddIngredient} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {ingredients.map((ingredient) => (
              <Badge
                key={ingredient}
                variant="secondary"
                className="pl-3 pr-1 py-1 flex items-center gap-1"
              >
                {ingredient}
                <button
                  onClick={() => handleRemoveIngredient(ingredient)}
                  className="ml-1 p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>

          {ingredients.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Start by adding ingredients you have available
            </p>
          )}
        </div>
      </SlideIn>

      <SlideIn direction="up" delay={0.2}>
        <div className="glass-interactive rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <ChefHat className="h-5 w-5" />
            Preferences
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cuisine Type
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {cuisineOptions.map((cuisine) => (
                  <button
                    key={cuisine}
                    onClick={() => setPreferences(prev => ({ ...prev, cuisine }))}
                    className={cn(
                      'glass rounded-lg px-3 py-2 text-sm transition-all',
                      preferences.cuisine === cuisine
                        ? 'bg-food-fresh/20 border-food-fresh text-food-fresh-dark'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    )}
                  >
                    {cuisine}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Dietary Restrictions
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {dietaryOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => toggleDietaryOption(option)}
                    className={cn(
                      'glass rounded-lg px-3 py-2 text-sm transition-all flex items-center gap-2',
                      preferences.dietary.includes(option)
                        ? 'bg-food-fresh/20 border-food-fresh text-food-fresh-dark'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    )}
                  >
                    <Leaf className="h-3 w-3" />
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cooking Time
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="15"
                    max="120"
                    step="15"
                    value={preferences.cookingTime}
                    onChange={(e) => setPreferences(prev => ({ ...prev, cookingTime: parseInt(e.target.value) }))}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium w-16 text-right">
                    {preferences.cookingTime} min
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Servings
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPreferences(prev => ({ ...prev, servings: Math.max(1, prev.servings - 1) }))}
                    className="glass w-8 h-8 rounded flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-medium">{preferences.servings}</span>
                  <button
                    onClick={() => setPreferences(prev => ({ ...prev, servings: prev.servings + 1 }))}
                    className="glass w-8 h-8 rounded flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Difficulty
                </label>
                <div className="flex gap-2">
                  {['easy', 'medium', 'hard'].map((level) => (
                    <button
                      key={level}
                      onClick={() => setPreferences(prev => ({ ...prev, difficulty: level }))}
                      className={cn(
                        'glass rounded-lg px-3 py-1 text-sm capitalize transition-all flex-1',
                        preferences.difficulty === level
                          ? 'bg-food-fresh/20 border-food-fresh text-food-fresh-dark'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                      )}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </SlideIn>

      <HoverGrow>
        <Button
          onClick={handleGenerateRecipe}
          disabled={ingredients.length === 0}
          className="w-full py-4 text-lg font-semibold"
        >
          <Sparkles className="h-5 w-5 mr-2" />
          Generate Recipe with AI
        </Button>
      </HoverGrow>
    </div>
  );
}