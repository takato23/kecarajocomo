'use client';

import React from 'react';

import { cn } from '@/lib/utils';
import type { DetailedPantryCompatibility } from '@/lib/services/pantry-compatibility.service';

import { Card, CardBody, CardHeader } from '../design-system/Card';
import { Badge } from '../design-system/Badge';
import { Button } from '../design-system/Button';
import { Text, Heading } from '../design-system/Typography';
import { Icons } from '../design-system/icons';

export interface PantryInsightsProps {
  compatibility: DetailedPantryCompatibility;
  recipeName: string;
  onAddToShoppingList?: () => void;
  onViewSubstitutes?: () => void;
  className?: string;
}

export const PantryInsights: React.FC<PantryInsightsProps> = ({
  compatibility,
  recipeName,
  onAddToShoppingList,
  onViewSubstitutes,
  className
}) => {
  const {
    can_make,
    compatibility_score,
    estimated_cost,
    recipe_difficulty_adjustment,
    preparation_impact,
    nutritional_impact,
    substitution_suggestions,
    missing_ingredients
  } = compatibility;

  if (can_make) {
    return (
      <Card className={cn('border-food-fresh-200 bg-food-fresh-50 dark:bg-food-fresh-900/20', className)}>
        <CardBody className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-food-fresh-100 dark:bg-food-fresh-900/30">
              <Icons.CheckCircle className="w-5 h-5 text-food-fresh-600" />
            </div>
            <div>
              <Text weight="medium" color="fresh">
                ¡Tienes todo para hacer esta receta!
              </Text>
              <Text size="sm" color="muted">
                Puedes empezar a cocinar inmediatamente
              </Text>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className={cn('border-food-warm-200 bg-food-warm-50 dark:bg-food-warm-900/20', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Heading size="sm">Análisis de Despensa</Heading>
          <Badge 
            variant="warm" 
            size="sm"
          >
            {Math.round(compatibility_score * 100)}% Compatible
          </Badge>
        </div>
      </CardHeader>

      <CardBody className="space-y-4">
        {/* Missing Ingredients Summary */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Icons.AlertCircle size="sm" className="text-food-warm-500" />
            <Text weight="medium">Te faltan {missing_ingredients} ingredientes</Text>
          </div>
          
          {estimated_cost && estimated_cost > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Icons.DollarSign size="xs" className="text-food-golden-500" />
              <Text size="sm" color="muted">
                Costo estimado: ${Math.round(estimated_cost / 1000)}k COP
              </Text>
            </div>
          )}
        </div>

        {/* Difficulty Impact */}
        {recipe_difficulty_adjustment && recipe_difficulty_adjustment > 1.2 && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-food-golden-50 dark:bg-food-golden-900/20">
            <Icons.TrendingUp size="sm" className="text-food-golden-600" />
            <div>
              <Text size="sm" weight="medium">
                Dificultad aumentada en {Math.round((recipe_difficulty_adjustment - 1) * 100)}%
              </Text>
              <Text size="xs" color="muted">
                Debido a ingredientes faltantes
              </Text>
            </div>
          </div>
        )}

        {/* Preparation Impact */}
        {preparation_impact && !preparation_impact.can_prepare_now && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Icons.Clock size="sm" className="text-food-warm-500" />
              <Text size="sm" weight="medium">
                Tiempo adicional necesario: {preparation_impact.estimated_prep_delay} min
              </Text>
            </div>
            
            {preparation_impact.missing_essential_tools && preparation_impact.missing_essential_tools.length > 0 && (
              <div className="flex items-center gap-2">
                <Icons.Tool size="sm" className="text-error-500" />
                <Text size="sm" color="error">
                  Herramientas faltantes: {preparation_impact.missing_essential_tools.join(', ')}
                </Text>
              </div>
            )}
          </div>
        )}

        {/* Nutritional Impact */}
        {nutritional_impact && nutritional_impact.calories_missing > 0 && (
          <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
            <Text size="sm" weight="medium" className="mb-2">Impacto Nutricional</Text>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span>Calorías:</span>
                <span>-{nutritional_impact.calories_missing} kcal</span>
              </div>
              <div className="flex justify-between">
                <span>Proteína:</span>
                <span>-{nutritional_impact.protein_missing}g</span>
              </div>
              <div className="flex justify-between">
                <span>Carbohidratos:</span>
                <span>-{nutritional_impact.carbs_missing}g</span>
              </div>
              <div className="flex justify-between">
                <span>Grasa:</span>
                <span>-{nutritional_impact.fat_missing}g</span>
              </div>
            </div>
          </div>
        )}

        {/* Substitution Suggestions */}
        {substitution_suggestions.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Icons.RefreshCw size="sm" className="text-food-fresh-500" />
              <Text size="sm" weight="medium">
                {substitution_suggestions.length} sustitutos disponibles
              </Text>
            </div>
            <div className="space-y-1">
              {substitution_suggestions.slice(0, 2).map((suggestion, index) => (
                <div key={index} className="text-xs p-2 rounded bg-food-fresh-50 dark:bg-food-fresh-900/20">
                  <Text size="xs">
                    <span className="font-medium">{suggestion.missing_ingredient}</span>
                    {' → '}
                    <span className="text-food-fresh-600">
                      {suggestion.suggested_substitutes[0]?.pantry_item.ingredient?.name}
                    </span>
                    <span className="text-neutral-500 ml-1">
                      ({Math.round(suggestion.suggested_substitutes[0]?.confidence * 100)}% confianza)
                    </span>
                  </Text>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-700">
          {onAddToShoppingList && (
            <Button
              variant="warm"
              size="sm"
              className="flex-1"
              onClick={onAddToShoppingList}
              leftIcon={<Icons.ShoppingCart size="xs" />}
            >
              Agregar a Lista
            </Button>
          )}
          
          {substitution_suggestions.length > 0 && onViewSubstitutes && (
            <Button
              variant="neutral"
              size="sm"
              className="flex-1"
              onClick={onViewSubstitutes}
              leftIcon={<Icons.RefreshCw size="xs" />}
            >
              Ver Sustitutos
            </Button>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

export default PantryInsights;