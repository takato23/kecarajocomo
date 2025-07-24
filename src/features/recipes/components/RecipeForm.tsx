'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  GripVertical,
  ChefHat,
  Save,
  Sparkles,
} from 'lucide-react';

import { cn } from '@/lib/utils';

import {
  RecipeFormData,
  IngredientFormData,
  InstructionFormData,
  CuisineType,
  MealType,
  DietaryTag,
  DifficultyLevel,
  Recipe,
  RecipeIngredient,
} from '../types';
import { useRecipeStore } from '../store/recipeStore';

interface RecipeFormProps {
  recipe?: Recipe;
  onSubmit: (data: RecipeFormData) => void;
  onCancel: () => void;
  isAIGenerated?: boolean;
}

export const RecipeForm: React.FC<RecipeFormProps> = ({
  recipe,
  onSubmit,
  onCancel,
  isAIGenerated = false,
}) => {
  const { isCreating } = useRecipeStore();

  const [formData, setFormData] = useState<RecipeFormData>({
    title: '',
    description: '',
    ingredients: [],
    instructions: [],
    prep_time: 0,
    cook_time: 0,
    servings: 4,
    cuisine_type: 'other',
    meal_types: [],
    dietary_tags: [],
    difficulty: 'medium',
    is_public: false,
  });

  const [currentIngredient, setCurrentIngredient] = useState<IngredientFormData>({
    name: '',
    quantity: 0,
    unit: '',
    optional: false,
  });

  const [currentInstruction, setCurrentInstruction] = useState<InstructionFormData>({
    text: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (recipe) {
      setFormData({
        title: recipe.title,
        description: recipe.description,
        ingredients: recipe.ingredients.map(ing => ({
          ingredient_id: ing.ingredient_id,
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
          notes: ing.notes,
          optional: ing.optional,
          group: ing.group,
        })),
        instructions: recipe.instructions.map((inst, index) => ({
          step_number: inst.step_number || index + 1,
          text: inst.text,
          time_minutes: inst.time_minutes,
          temperature: inst.temperature,
          tips: inst.tips,
        })),
        prep_time: recipe.prep_time,
        cook_time: recipe.cook_time,
        servings: recipe.servings,
        cuisine_type: recipe.cuisine_type,
        meal_types: recipe.meal_types,
        dietary_tags: recipe.dietary_tags,
        difficulty: recipe.difficulty,
        image_url: recipe.image_url,
        video_url: recipe.video_url,
        source_url: recipe.source_url,
        is_public: recipe.is_public,
      });
    }
  }, [recipe]);

  const cuisineTypes: CuisineType[] = [
    'mexican', 'italian', 'chinese', 'japanese', 'indian',
    'french', 'mediterranean', 'american', 'thai', 'spanish', 'other'
  ];

  const mealTypes: MealType[] = [
    'breakfast', 'lunch', 'dinner', 'snack', 'dessert', 'appetizer'
  ];

  const dietaryTags: DietaryTag[] = [
    'vegetarian', 'vegan', 'gluten-free', 'dairy-free',
    'nut-free', 'low-carb', 'keto', 'paleo',
    'whole30', 'sugar-free', 'low-sodium', 'high-protein'
  ];

  const difficultyLevels: DifficultyLevel[] = ['easy', 'medium', 'hard'];

  const units = [
    'cup', 'cups', 'tbsp', 'tsp', 'oz', 'lb', 'g', 'kg',
    'ml', 'l', 'piece', 'pieces', 'clove', 'cloves',
    'can', 'package', 'bunch', 'handful', 'pinch', 'dash'
  ];

  const handleAddIngredient = () => {
    if (!currentIngredient.name || !currentIngredient.quantity || !currentIngredient.unit) {
      setErrors({ ingredient: 'Please fill all ingredient fields' });
      return;
    }

    const newIngredient: RecipeIngredient = {
      ingredient_id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: currentIngredient.name,
      quantity: currentIngredient.quantity,
      unit: currentIngredient.unit,
      notes: currentIngredient.notes,
      optional: currentIngredient.optional,
      group: currentIngredient.group,
    };
    setFormData({
      ...formData,
      ingredients: [...formData.ingredients, newIngredient],
    });
    setCurrentIngredient({
      name: '',
      quantity: 0,
      unit: '',
      optional: false,
    });
    setErrors({});
  };

  const handleRemoveIngredient = (index: number) => {
    setFormData({
      ...formData,
      ingredients: formData.ingredients.filter((_, i) => i !== index),
    });
  };

  const handleAddInstruction = () => {
    if (!currentInstruction.text) {
      setErrors({ instruction: 'Please enter instruction text' });
      return;
    }

    const newInstruction = {
      ...currentInstruction,
      step_number: formData.instructions.length + 1,
    };
    setFormData({
      ...formData,
      instructions: [...formData.instructions, newInstruction],
    });
    setCurrentInstruction({ text: '' });
    setErrors({});
  };

  const handleRemoveInstruction = (index: number) => {
    setFormData({
      ...formData,
      instructions: formData.instructions.filter((_, i) => i !== index),
    });
  };

  const handleMealTypeToggle = (type: MealType) => {
    setFormData({
      ...formData,
      meal_types: formData.meal_types.includes(type)
        ? formData.meal_types.filter(t => t !== type)
        : [...formData.meal_types, type],
    });
  };

  const handleDietaryTagToggle = (tag: DietaryTag) => {
    setFormData({
      ...formData,
      dietary_tags: formData.dietary_tags.includes(tag)
        ? formData.dietary_tags.filter(t => t !== tag)
        : [...formData.dietary_tags, tag],
    });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title) newErrors.title = 'Title is required';
    if (!formData.description) newErrors.description = 'Description is required';
    if (formData.ingredients.length === 0) newErrors.ingredients = 'At least one ingredient is required';
    if (formData.instructions.length === 0) newErrors.instructions = 'At least one instruction is required';
    if (formData.meal_types.length === 0) newErrors.meal_types = 'Select at least one meal type';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-4xl space-y-8">
      {/* Basic Information */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <ChefHat className="h-5 w-5" />
          Basic Information
          {isAIGenerated && (
            <span className="ml-auto flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-700">
              <Sparkles className="h-4 w-4" />
              AI Generated
            </span>
          )}
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Recipe Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={cn(
                'w-full rounded-lg border px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
                errors.title && 'border-red-500'
              )}
              placeholder="e.g., Classic Margherita Pizza"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className={cn(
                'w-full rounded-lg border px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
                errors.description && 'border-red-500'
              )}
              placeholder="A brief description of your recipe..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Prep Time (min) *
              </label>
              <input
                type="number"
                value={formData.prep_time}
                onChange={(e) => setFormData({ ...formData, prep_time: parseInt(e.target.value) || 0 })}
                className="w-full rounded-lg border px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                min="0"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Cook Time (min) *
              </label>
              <input
                type="number"
                value={formData.cook_time}
                onChange={(e) => setFormData({ ...formData, cook_time: parseInt(e.target.value) || 0 })}
                className="w-full rounded-lg border px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                min="0"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Servings *
              </label>
              <input
                type="number"
                value={formData.servings}
                onChange={(e) => setFormData({ ...formData, servings: parseInt(e.target.value) || 1 })}
                className="w-full rounded-lg border px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                min="1"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Difficulty *
              </label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as DifficultyLevel })}
                className="w-full rounded-lg border px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {difficultyLevels.map((level) => (
                  <option key={level} value={level}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Cuisine Type *
            </label>
            <select
              value={formData.cuisine_type}
              onChange={(e) => setFormData({ ...formData, cuisine_type: e.target.value as CuisineType })}
              className="w-full rounded-lg border px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {cuisineTypes.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Meal Types */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold">Meal Types *</h3>
        <div className="flex flex-wrap gap-2">
          {mealTypes.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => handleMealTypeToggle(type)}
              className={cn(
                'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                formData.meal_types.includes(type)
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
              )}
            >
              {type}
            </button>
          ))}
        </div>
        {errors.meal_types && (
          <p className="mt-2 text-sm text-red-600">{errors.meal_types}</p>
        )}
      </div>

      {/* Dietary Tags */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold">Dietary Tags</h3>
        <div className="flex flex-wrap gap-2">
          {dietaryTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleDietaryTagToggle(tag)}
              className={cn(
                'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                formData.dietary_tags.includes(tag)
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Ingredients */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold">Ingredients *</h3>
        
        <div className="mb-4 space-y-2">
          {formData.ingredients.map((ingredient, index) => (
            <div
              key={index}
              className="flex items-center gap-2 rounded-lg bg-gray-50 p-3"
            >
              <GripVertical className="h-5 w-5 text-gray-400" />
              <span className="flex-1">
                <strong>{ingredient.quantity} {ingredient.unit}</strong> {ingredient.name}
                {ingredient.notes && <span className="text-gray-600"> - {ingredient.notes}</span>}
                {ingredient.optional && <span className="text-gray-500"> (optional)</span>}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveIngredient(index)}
                className="rounded p-1 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        {errors.ingredients && (
          <p className="mb-2 text-sm text-red-600">{errors.ingredients}</p>
        )}

        <div className="space-y-3 rounded-lg border p-4">
          <div className="grid gap-3 sm:grid-cols-4">
            <div>
              <input
                type="number"
                value={currentIngredient.quantity || ''}
                onChange={(e) => setCurrentIngredient({ ...currentIngredient, quantity: parseFloat(e.target.value) || 0 })}
                placeholder="Quantity"
                className="w-full rounded-lg border px-3 py-2 text-sm focus:border-primary focus:outline-none"
                step="0.1"
              />
            </div>
            <div>
              <select
                value={currentIngredient.unit}
                onChange={(e) => setCurrentIngredient({ ...currentIngredient, unit: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:border-primary focus:outline-none"
              >
                <option value="">Unit</option>
                {units.map((unit) => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <input
                type="text"
                value={currentIngredient.name}
                onChange={(e) => setCurrentIngredient({ ...currentIngredient, name: e.target.value })}
                placeholder="Ingredient name"
                className="w-full rounded-lg border px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={currentIngredient.notes || ''}
              onChange={(e) => setCurrentIngredient({ ...currentIngredient, notes: e.target.value })}
              placeholder="Notes (e.g., finely chopped)"
              className="flex-1 rounded-lg border px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={currentIngredient.optional}
                onChange={(e) => setCurrentIngredient({ ...currentIngredient, optional: e.target.checked })}
                className="h-4 w-4 rounded text-primary focus:ring-primary"
              />
              <span className="text-sm">Optional</span>
            </label>
            <button
              type="button"
              onClick={handleAddIngredient}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>
          
          {errors.ingredient && (
            <p className="text-sm text-red-600">{errors.ingredient}</p>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold">Instructions *</h3>
        
        <div className="mb-4 space-y-2">
          {formData.instructions.map((instruction, index) => (
            <div
              key={index}
              className="flex items-start gap-2 rounded-lg bg-gray-50 p-3"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-sm font-medium">
                {index + 1}
              </span>
              <span className="flex-1">
                {instruction.text}
                {instruction.time_minutes && (
                  <span className="block text-sm text-gray-600">
                    ⏱️ {instruction.time_minutes} minutes
                  </span>
                )}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveInstruction(index)}
                className="rounded p-1 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        {errors.instructions && (
          <p className="mb-2 text-sm text-red-600">{errors.instructions}</p>
        )}

        <div className="space-y-3 rounded-lg border p-4">
          <textarea
            value={currentInstruction.text}
            onChange={(e) => setCurrentInstruction({ ...currentInstruction, text: e.target.value })}
            placeholder="Enter instruction step..."
            rows={3}
            className="w-full rounded-lg border px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
          
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={currentInstruction.time_minutes || ''}
              onChange={(e) => setCurrentInstruction({ ...currentInstruction, time_minutes: parseInt(e.target.value) || undefined })}
              placeholder="Time (min)"
              className="w-24 rounded-lg border px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddInstruction}
              className="ml-auto flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Add Step
            </button>
          </div>
          
          {errors.instruction && (
            <p className="text-sm text-red-600">{errors.instruction}</p>
          )}
        </div>
      </div>

      {/* Media & Links */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold">Media & Links</h3>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Image URL
            </label>
            <input
              type="url"
              value={formData.image_url || ''}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              className="w-full rounded-lg border px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Video URL
            </label>
            <input
              type="url"
              value={formData.video_url || ''}
              onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
              className="w-full rounded-lg border px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Source URL
            </label>
            <input
              type="url"
              value={formData.source_url || ''}
              onChange={(e) => setFormData({ ...formData, source_url: e.target.value })}
              className="w-full rounded-lg border px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="https://example.com/original-recipe"
            />
          </div>
        </div>
      </div>

      {/* Privacy */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={formData.is_public}
            onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
            className="h-5 w-5 rounded text-primary focus:ring-primary"
          />
          <div>
            <span className="font-medium">Make this recipe public</span>
            <p className="text-sm text-gray-600">
              Public recipes can be viewed and used by other users
            </p>
          </div>
        </label>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border border-gray-300 bg-white py-3 font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isCreating}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-3 font-medium text-white hover:bg-primary/90 disabled:bg-gray-300"
        >
          <Save className="h-5 w-5" />
          {recipe ? 'Update Recipe' : 'Save Recipe'}
        </button>
      </div>
    </form>
  );
};