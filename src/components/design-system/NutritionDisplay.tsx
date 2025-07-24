'use client';

import React from 'react';

import { cn } from '@/lib/utils';

import { Card, CardHeader, CardBody } from './Card';
import { Heading, Text } from './Typography';
import { Badge } from './Badge';

export interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  cholesterol?: number;
}

export interface NutritionDisplayProps {
  nutrition: NutritionInfo;
  servings?: number;
  variant?: 'card' | 'compact' | 'inline';
  showPercentages?: boolean;
  dailyValues?: Partial<NutritionInfo>;
  className?: string;
}

// Default daily values (based on 2000 calorie diet)
const DEFAULT_DAILY_VALUES: NutritionInfo = {
  calories: 2000,
  protein: 50,
  carbs: 300,
  fat: 65,
  fiber: 25,
  sugar: 50,
  sodium: 2300,
  cholesterol: 300,
};

const NutritionDisplay = React.forwardRef<HTMLDivElement, NutritionDisplayProps>(
  (
    {
      nutrition,
      servings = 1,
      variant = 'card',
      showPercentages = false,
      dailyValues = DEFAULT_DAILY_VALUES,
      className,
      ...props
    },
    ref
  ) => {
    const adjustedNutrition = {
      calories: Math.round(nutrition.calories * servings),
      protein: Math.round(nutrition.protein * servings * 10) / 10,
      carbs: Math.round(nutrition.carbs * servings * 10) / 10,
      fat: Math.round(nutrition.fat * servings * 10) / 10,
      fiber: nutrition.fiber ? Math.round(nutrition.fiber * servings * 10) / 10 : undefined,
      sugar: nutrition.sugar ? Math.round(nutrition.sugar * servings * 10) / 10 : undefined,
      sodium: nutrition.sodium ? Math.round(nutrition.sodium * servings) : undefined,
      cholesterol: nutrition.cholesterol ? Math.round(nutrition.cholesterol * servings) : undefined,
    };

    const getPercentage = (value: number, dailyValue: number) => {
      return Math.round((value / dailyValue) * 100);
    };

    const getColorByPercentage = (percentage: number) => {
      if (percentage < 10) return 'fresh';
      if (percentage < 25) return 'golden';
      if (percentage < 50) return 'warm';
      return 'rich';
    };

    const MacroBar: React.FC<{
      label: string;
      value: number;
      unit: string;
      dailyValue?: number;
      color: 'fresh' | 'warm' | 'rich' | 'golden';
    }> = ({ label, value, unit, dailyValue, color }) => {
      const percentage = dailyValue ? getPercentage(value, dailyValue) : 0;
      const percentageColor = dailyValue ? getColorByPercentage(percentage) : color;

      return (
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3 flex-1">
            <Text size="sm" weight="medium" className="min-w-0 flex-1">
              {label}
            </Text>
            <div className="flex items-center gap-2">
              <Text size="sm" weight="semibold">
                {value}
                <Text as="span" size="xs" color="muted" className="ml-0.5">
                  {unit}
                </Text>
              </Text>
              {showPercentages && dailyValue && (
                <Badge size="sm" variant={percentageColor} className="text-xs">
                  {percentage}%
                </Badge>
              )}
            </div>
          </div>
          {dailyValue && (
            <div className="w-16 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full ml-3 overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-300',
                  {
                    'bg-food-fresh-500': percentageColor === 'fresh',
                    'bg-food-golden-500': percentageColor === 'golden',
                    'bg-food-warm-500': percentageColor === 'warm',
                    'bg-food-rich-500': percentageColor === 'rich',
                  }
                )}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
          )}
        </div>
      );
    };

    if (variant === 'inline') {
      return (
        <div ref={ref} className={cn('flex items-center gap-4', className)} {...props}>
          <div className="flex items-center gap-1">
            <Text size="sm" weight="medium">
              {adjustedNutrition.calories}
            </Text>
            <Text size="xs" color="muted">
              cal
            </Text>
          </div>
          <div className="flex items-center gap-1">
            <Text size="sm" weight="medium">
              {adjustedNutrition.protein}g
            </Text>
            <Text size="xs" color="muted">
              protein
            </Text>
          </div>
          <div className="flex items-center gap-1">
            <Text size="sm" weight="medium">
              {adjustedNutrition.carbs}g
            </Text>
            <Text size="xs" color="muted">
              carbs
            </Text>
          </div>
          <div className="flex items-center gap-1">
            <Text size="sm" weight="medium">
              {adjustedNutrition.fat}g
            </Text>
            <Text size="xs" color="muted">
              fat
            </Text>
          </div>
        </div>
      );
    }

    if (variant === 'compact') {
      return (
        <div ref={ref} className={cn('space-y-3', className)} {...props}>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <Text size="xl" weight="bold" color="fresh">
                {adjustedNutrition.calories}
              </Text>
              <Text size="xs" color="muted">
                Calories
              </Text>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <Text size="sm">Protein</Text>
                <Text size="sm" weight="medium">
                  {adjustedNutrition.protein}g
                </Text>
              </div>
              <div className="flex justify-between">
                <Text size="sm">Carbs</Text>
                <Text size="sm" weight="medium">
                  {adjustedNutrition.carbs}g
                </Text>
              </div>
              <div className="flex justify-between">
                <Text size="sm">Fat</Text>
                <Text size="sm" weight="medium">
                  {adjustedNutrition.fat}g
                </Text>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <Card ref={ref} variant="glass" className={className} {...props}>
        <CardHeader>
          <Heading size="lg" weight="semibold">
            Nutrition Facts
          </Heading>
          {servings > 1 && (
            <Text size="sm" color="muted">
              Per {servings} serving{servings > 1 ? 's' : ''}
            </Text>
          )}
        </CardHeader>

        <CardBody className="space-y-4">
          {/* Calories - Featured */}
          <div className="glass-fresh rounded-xl p-4 text-center">
            <Text size="xl" weight="bold" color="fresh">
              {adjustedNutrition.calories}
            </Text>
            <Text size="sm" color="muted" className="mt-1">
              Calories
            </Text>
            {showPercentages && dailyValues.calories && (
              <Badge
                size="sm"
                variant={getColorByPercentage(getPercentage(adjustedNutrition.calories, dailyValues.calories))}
                className="mt-2"
              >
                {getPercentage(adjustedNutrition.calories, dailyValues.calories)}% DV
              </Badge>
            )}
          </div>

          {/* Macronutrients */}
          <div className="space-y-1">
            <Text size="sm" weight="semibold" color="default" className="mb-2">
              Macronutrients
            </Text>
            
            <MacroBar
              label="Protein"
              value={adjustedNutrition.protein}
              unit="g"
              dailyValue={dailyValues.protein}
              color="fresh"
            />
            
            <MacroBar
              label="Carbohydrates"
              value={adjustedNutrition.carbs}
              unit="g"
              dailyValue={dailyValues.carbs}
              color="golden"
            />
            
            <MacroBar
              label="Fat"
              value={adjustedNutrition.fat}
              unit="g"
              dailyValue={dailyValues.fat}
              color="warm"
            />
          </div>

          {/* Additional Nutrients */}
          {(adjustedNutrition.fiber || adjustedNutrition.sugar || adjustedNutrition.sodium) && (
            <div className="space-y-1 pt-2 border-t border-neutral-200 dark:border-neutral-700">
              <Text size="sm" weight="semibold" color="default" className="mb-2">
                Other Nutrients
              </Text>
              
              {adjustedNutrition.fiber && (
                <MacroBar
                  label="Fiber"
                  value={adjustedNutrition.fiber}
                  unit="g"
                  dailyValue={dailyValues.fiber}
                  color="fresh"
                />
              )}
              
              {adjustedNutrition.sugar && (
                <MacroBar
                  label="Sugar"
                  value={adjustedNutrition.sugar}
                  unit="g"
                  dailyValue={dailyValues.sugar}
                  color="warm"
                />
              )}
              
              {adjustedNutrition.sodium && (
                <MacroBar
                  label="Sodium"
                  value={adjustedNutrition.sodium}
                  unit="mg"
                  dailyValue={dailyValues.sodium}
                  color="rich"
                />
              )}
            </div>
          )}

          {showPercentages && (
            <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700">
              <Text size="xs" color="muted" className="italic">
                % Daily Value (DV) tells you how much a nutrient in a serving of food contributes to a daily diet.
                2,000 calories a day is used for general nutrition advice.
              </Text>
            </div>
          )}
        </CardBody>
      </Card>
    );
  }
);

NutritionDisplay.displayName = 'NutritionDisplay';

export { NutritionDisplay };