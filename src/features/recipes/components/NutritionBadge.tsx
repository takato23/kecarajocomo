'use client';

import React from 'react';

import { cn } from '@/lib/utils';

import { DetailedNutritionalInfo } from '../types';

interface NutritionBadgeProps {
  nutrition: DetailedNutritionalInfo;
  servings?: number;
  variant?: 'full' | 'compact' | 'minimal';
  className?: string;
}

export const NutritionBadge: React.FC<NutritionBadgeProps> = ({
  nutrition,
  servings = 1,
  variant = 'compact',
  className,
}) => {
  const perServing = servings > 1;
  
  const calculatePerServing = (value: number) => {
    return perServing ? Math.round(value / servings) : value;
  };

  const getNutrientColor = (nutrient: string, value: number): string => {
    switch (nutrient) {
      case 'calories':
        if (value < 200) return 'text-green-600';
        if (value < 400) return 'text-yellow-600';
        return 'text-red-600';
      case 'protein':
        if (value >= 20) return 'text-green-600';
        if (value >= 10) return 'text-yellow-600';
        return 'text-gray-600';
      case 'fiber':
        if (value >= 5) return 'text-green-600';
        if (value >= 2) return 'text-yellow-600';
        return 'text-gray-600';
      case 'sugar':
        if (value <= 5) return 'text-green-600';
        if (value <= 10) return 'text-yellow-600';
        return 'text-red-600';
      case 'sodium':
        if (value <= 140) return 'text-green-600';
        if (value <= 400) return 'text-yellow-600';
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (variant === 'minimal') {
    return (
      <div className={cn('flex items-center gap-3 text-sm', className)}>
        <span className="font-medium">
          {calculatePerServing(nutrition.calories)} cal
        </span>
        <span className="text-gray-400">•</span>
        <span>{calculatePerServing(nutrition.protein)}g protein</span>
        <span className="text-gray-400">•</span>
        <span>{calculatePerServing(nutrition.carbs)}g carbs</span>
        <span className="text-gray-400">•</span>
        <span>{calculatePerServing(nutrition.fat)}g fat</span>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn('rounded-lg bg-gray-50 p-4', className)}>
        <h4 className="mb-3 text-sm font-semibold text-gray-700">
          Nutrition {perServing && `(per serving)`}
        </h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Calories</span>
            <span className={cn('font-medium', getNutrientColor('calories', calculatePerServing(nutrition.calories)))}>
              {calculatePerServing(nutrition.calories)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Protein</span>
            <span className={cn('font-medium', getNutrientColor('protein', calculatePerServing(nutrition.protein)))}>
              {calculatePerServing(nutrition.protein)}g
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Carbs</span>
            <span className="font-medium text-gray-900">
              {calculatePerServing(nutrition.carbs)}g
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Fat</span>
            <span className="font-medium text-gray-900">
              {calculatePerServing(nutrition.fat)}g
            </span>
          </div>
          {nutrition.fiber !== undefined && (
            <div className="flex justify-between">
              <span className="text-gray-600">Fiber</span>
              <span className={cn('font-medium', getNutrientColor('fiber', calculatePerServing(nutrition.fiber)))}>
                {calculatePerServing(nutrition.fiber)}g
              </span>
            </div>
          )}
          {nutrition.sodium !== undefined && (
            <div className="flex justify-between">
              <span className="text-gray-600">Sodium</span>
              <span className={cn('font-medium', getNutrientColor('sodium', calculatePerServing(nutrition.sodium)))}>
                {calculatePerServing(nutrition.sodium)}mg
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Full variant
  return (
    <div className={cn('rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200', className)}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Nutrition Facts</h3>
        {perServing && (
          <span className="text-sm text-gray-500">Per serving</span>
        )}
      </div>
      
      <div className="space-y-3">
        {/* Calories - prominently displayed */}
        <div className="border-b pb-3">
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-semibold">Calories</span>
            <span className={cn('text-2xl font-bold', getNutrientColor('calories', calculatePerServing(nutrition.calories)))}>
              {calculatePerServing(nutrition.calories)}
            </span>
          </div>
        </div>

        {/* Macronutrients */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Macronutrients</h4>
          <div className="space-y-1">
            <NutrientRow
              label="Total Fat"
              value={calculatePerServing(nutrition.fat)}
              unit="g"
              color={getNutrientColor('fat', calculatePerServing(nutrition.fat))}
            />
            {nutrition.saturated_fat !== undefined && (
              <NutrientRow
                label="Saturated Fat"
                value={calculatePerServing(nutrition.saturated_fat)}
                unit="g"
                indent
              />
            )}
            {nutrition.trans_fat !== undefined && (
              <NutrientRow
                label="Trans Fat"
                value={calculatePerServing(nutrition.trans_fat)}
                unit="g"
                indent
              />
            )}
            <NutrientRow
              label="Carbohydrates"
              value={calculatePerServing(nutrition.carbs)}
              unit="g"
            />
            {nutrition.fiber !== undefined && (
              <NutrientRow
                label="Dietary Fiber"
                value={calculatePerServing(nutrition.fiber)}
                unit="g"
                color={getNutrientColor('fiber', calculatePerServing(nutrition.fiber))}
                indent
              />
            )}
            {nutrition.sugar !== undefined && (
              <NutrientRow
                label="Total Sugars"
                value={calculatePerServing(nutrition.sugar)}
                unit="g"
                color={getNutrientColor('sugar', calculatePerServing(nutrition.sugar))}
                indent
              />
            )}
            <NutrientRow
              label="Protein"
              value={calculatePerServing(nutrition.protein)}
              unit="g"
              color={getNutrientColor('protein', calculatePerServing(nutrition.protein))}
            />
          </div>
        </div>

        {/* Micronutrients */}
        {(nutrition.sodium !== undefined ||
          nutrition.cholesterol !== undefined ||
          nutrition.vitamin_a !== undefined ||
          nutrition.vitamin_c !== undefined ||
          nutrition.calcium !== undefined ||
          nutrition.iron !== undefined) && (
          <div className="space-y-2 border-t pt-3">
            <h4 className="text-sm font-medium text-gray-700">Other Nutrients</h4>
            <div className="space-y-1">
              {nutrition.cholesterol !== undefined && (
                <NutrientRow
                  label="Cholesterol"
                  value={calculatePerServing(nutrition.cholesterol)}
                  unit="mg"
                />
              )}
              {nutrition.sodium !== undefined && (
                <NutrientRow
                  label="Sodium"
                  value={calculatePerServing(nutrition.sodium)}
                  unit="mg"
                  color={getNutrientColor('sodium', calculatePerServing(nutrition.sodium))}
                />
              )}
              {nutrition.vitamin_a !== undefined && (
                <NutrientRow
                  label="Vitamin A"
                  value={calculatePerServing(nutrition.vitamin_a)}
                  unit="%"
                />
              )}
              {nutrition.vitamin_c !== undefined && (
                <NutrientRow
                  label="Vitamin C"
                  value={calculatePerServing(nutrition.vitamin_c)}
                  unit="%"
                />
              )}
              {nutrition.calcium !== undefined && (
                <NutrientRow
                  label="Calcium"
                  value={calculatePerServing(nutrition.calcium)}
                  unit="%"
                />
              )}
              {nutrition.iron !== undefined && (
                <NutrientRow
                  label="Iron"
                  value={calculatePerServing(nutrition.iron)}
                  unit="%"
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Daily value disclaimer */}
      <p className="mt-4 text-xs text-gray-500">
        * Percent Daily Values are based on a 2,000 calorie diet
      </p>
    </div>
  );
};

interface NutrientRowProps {
  label: string;
  value: number;
  unit: string;
  color?: string;
  indent?: boolean;
}

const NutrientRow: React.FC<NutrientRowProps> = ({
  label,
  value,
  unit,
  color = 'text-gray-900',
  indent = false,
}) => {
  return (
    <div className={cn('flex justify-between text-sm', indent && 'ml-4')}>
      <span className="text-gray-600">{label}</span>
      <span className={cn('font-medium', color)}>
        {value}{unit}
      </span>
    </div>
  );
};