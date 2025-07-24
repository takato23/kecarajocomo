'use client';

import React, { useState, useEffect } from 'react';
import { 
  Check, 
  X, 
  ShoppingCart, 
  Clock, 
  AlertTriangle, 
  Package,
  ChefHat,
  Calculator,
  Zap,
} from 'lucide-react';

import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import { Heading, Text } from '@/components/design-system/Typography';
import { Badge } from '@/components/design-system/Badge';

import type { 
  RecipeIngredient, 
  PantryAvailability, 
  ShoppingListItem 
} from '../types';

interface RecipeAvailabilityCheckProps {
  recipeId?: string;
  recipeName: string;
  ingredients: RecipeIngredient[];
  servings?: number;
  onShoppingListGenerated?: (items: ShoppingListItem[]) => void;
  onCookRecipe?: () => void;
  className?: string;
}

interface AvailabilityData {
  availability: PantryAvailability[];
  shopping_list?: ShoppingListItem[];
  summary: {
    total_ingredients: number;
    available_ingredients: number;
    missing_ingredients: number;
    availability_percentage: number;
  };
}

export function RecipeAvailabilityCheck({
  recipeId,
  recipeName,
  ingredients,
  servings = 1,
  onShoppingListGenerated,
  onCookRecipe,
  className = '',
}: RecipeAvailabilityCheckProps) {
  const [availabilityData, setAvailabilityData] = useState<AvailabilityData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isGeneratingShoppingList, setIsGeneratingShoppingList] = useState(false);

  useEffect(() => {
    checkAvailability();
  }, [ingredients, servings]);

  const checkAvailability = async () => {
    if (!ingredients || ingredients.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const adjustedIngredients = ingredients.map(ingredient => ({
        ...ingredient,
        quantity: ingredient.quantity * servings,
      }));

      const response = await fetch('/api/pantry/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipe_ingredients: adjustedIngredients,
          generate_shopping_list: false,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to check availability');
      }

      const data = await response.json();
      setAvailabilityData(data.data);
    } catch (error: unknown) {
      console.error('Error checking availability:', error);
      setError('Failed to check ingredient availability');
    } finally {
      setIsLoading(false);
    }
  };

  const generateShoppingList = async () => {
    if (!availabilityData) return;

    setIsGeneratingShoppingList(true);

    try {
      const adjustedIngredients = ingredients.map(ingredient => ({
        ...ingredient,
        quantity: ingredient.quantity * servings,
      }));

      const response = await fetch('/api/pantry/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipe_ingredients: adjustedIngredients,
          generate_shopping_list: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate shopping list');
      }

      const data = await response.json();
      if (data.data.shopping_list) {
        onShoppingListGenerated?.(data.data.shopping_list);
      }
    } catch (error: unknown) {
      console.error('Error generating shopping list:', error);
      setError('Failed to generate shopping list');
    } finally {
      setIsGeneratingShoppingList(false);
    }
  };

  const cookRecipe = async () => {
    if (!availabilityData || availabilityData.summary.availability_percentage < 100) {
      return;
    }

    try {
      const adjustedIngredients = ingredients.map(ingredient => ({
        ...ingredient,
        quantity: ingredient.quantity * servings,
      }));

      const response = await fetch('/api/pantry/consume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipe_ingredients: adjustedIngredients,
          servings,
          recipe_id: recipeId,
          recipe_name: recipeName,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to consume ingredients');
      }

      onCookRecipe?.();
      // Refresh availability after consumption
      checkAvailability();
    } catch (error: unknown) {
      console.error('Error cooking recipe:', error);
      setError('Failed to consume ingredients from pantry');
    }
  };

  if (isLoading && !availabilityData) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-4 w-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`p-4 border-red-200 bg-red-50 ${className}`}>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <Text size="sm" className="text-red-700">
            {error}
          </Text>
          <Button
            variant="ghost"
            size="sm"
            onClick={checkAvailability}
            className="ml-auto text-red-600"
          >
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  if (!availabilityData) {
    return null;
  }

  const { summary, availability } = availabilityData;
  const canCook = summary.availability_percentage === 100;
  const needsShopping = summary.missing_ingredients > 0;

  const getAvailabilityColor = (percentage: number) => {
    if (percentage === 100) return 'text-green-600 bg-green-100';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getAvailabilityIcon = (percentage: number) => {
    if (percentage === 100) return <Check className="h-4 w-4" />;
    if (percentage >= 70) return <Clock className="h-4 w-4" />;
    return <X className="h-4 w-4" />;
  };

  return (
    <Card className={`p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${getAvailabilityColor(summary.availability_percentage)}`}>
            {getAvailabilityIcon(summary.availability_percentage)}
          </div>
          <div>
            <Heading as="h3" size="lg" className="font-medium text-gray-900">
              Ingredient Availability
            </Heading>
            <Text size="sm" className="text-gray-600">
              {summary.available_ingredients} of {summary.total_ingredients} ingredients available
            </Text>
          </div>
        </div>
        
        <Badge 
          variant={
            summary.availability_percentage === 100 ? 'success' :
            summary.availability_percentage >= 70 ? 'warning' : 'error'
          }
          className="text-sm"
        >
          {summary.availability_percentage}%
        </Badge>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              summary.availability_percentage === 100 ? 'bg-green-500' :
              summary.availability_percentage >= 70 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${summary.availability_percentage}%` }}
          />
        </div>
      </div>

      {/* Status Message */}
      <div className="mb-4">
        {canCook ? (
          <div className="flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded-md">
            <Check className="h-4 w-4" />
            <Text size="sm">
              Great! You have all ingredients needed to cook this recipe.
            </Text>
          </div>
        ) : needsShopping ? (
          <div className="flex items-center gap-2 text-amber-700 bg-amber-50 p-3 rounded-md">
            <ShoppingCart className="h-4 w-4" />
            <Text size="sm">
              You're missing {summary.missing_ingredients} ingredient{summary.missing_ingredients !== 1 ? 's' : ''}. 
              Add them to your shopping list!
            </Text>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-red-700 bg-red-50 p-3 rounded-md">
            <Package className="h-4 w-4" />
            <Text size="sm">
              You'll need to shop for most ingredients to make this recipe.
            </Text>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mb-4">
        {canCook && (
          <Button
            variant="primary"
            onClick={cookRecipe}
            className="flex items-center gap-2"
          >
            <ChefHat className="h-4 w-4" />
            Cook Recipe
          </Button>
        )}
        
        {needsShopping && (
          <Button
            variant="secondary"
            onClick={generateShoppingList}
            disabled={isGeneratingShoppingList}
            className="flex items-center gap-2"
          >
            <ShoppingCart className="h-4 w-4" />
            {isGeneratingShoppingList ? 'Generating...' : 'Add to Shopping List'}
          </Button>
        )}
        
        <Button
          variant="ghost"
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-2"
        >
          <Calculator className="h-4 w-4" />
          {showDetails ? 'Hide' : 'Show'} Details
        </Button>
      </div>

      {/* Detailed Breakdown */}
      {showDetails && (
        <div className="border-t pt-4">
          <Heading as="h3" size="lg" className="font-medium text-gray-900 mb-3">
            Ingredient Breakdown
          </Heading>
          
          <div className="space-y-2">
            {availability.map((item, index) => (
              <div
                key={index}
                className={`p-3 rounded-md border ${
                  item.sufficient 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    {item.sufficient ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 text-red-600" />
                    )}
                    <Text size="sm" className="font-medium text-gray-900">
                      {item.ingredient_name}
                    </Text>
                  </div>
                  
                  <div className="text-right">
                    <Text size="sm" className="text-gray-600">
                      Need: {item.required_quantity} {item.required_unit}
                    </Text>
                    <Text size="sm" className={item.sufficient ? 'text-green-600' : 'text-red-600'}>
                      Have: {item.available_quantity.toFixed(1)} {item.available_unit}
                    </Text>
                  </div>
                </div>
                
                {!item.sufficient && (
                  <Text size="xs" className="text-red-600 mt-1 block">
                    Missing: {(item.required_quantity - item.available_quantity).toFixed(1)} {item.required_unit}
                  </Text>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Servings Info */}
      {servings !== 1 && (
        <div className="mt-4 p-2 bg-blue-50 border border-blue-200 rounded-md">
          <Text size="xs" className="text-blue-700 flex items-center gap-1">
            <Zap className="h-3 w-3" />
            Quantities adjusted for {servings} serving{servings !== 1 ? 's' : ''}
          </Text>
        </div>
      )}
    </Card>
  );
}