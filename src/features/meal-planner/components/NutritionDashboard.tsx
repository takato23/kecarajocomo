'use client';

import React, { useMemo, useState } from 'react';
import { 
  BarChart3,
  TrendingUp,
  Target,
  Calendar,
  Info
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useMealPlannerStore } from '../store/mealPlannerStore';
import { NutritionalInfo } from '../types';
import { cn } from '@/lib/utils';

interface NutrientData {
  name: string;
  current: number;
  goal: { min?: number; max?: number };
  unit: string;
  color: string;
}

export const NutritionDashboard: React.FC = () => {
  const { currentWeekPlan, userPreferences } = useMealPlannerStore();
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Calculate daily nutrition
  const dailyNutrition = useMemo(() => {
    if (!currentWeekPlan) return null;

    const dateStr = selectedDate.toISOString().split('T')[0];
    const dayPlan = currentWeekPlan.dailyPlans.find(
      (plan) => new Date(plan.date).toISOString().split('T')[0] === dateStr
    );

    if (!dayPlan) return null;

    const totals: NutritionalInfo = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
    };

    dayPlan.meals.forEach((meal) => {
      if (meal.recipe?.nutritionalInfo) {
        const nutrition = meal.recipe.nutritionalInfo;
        const servingMultiplier = meal.servings / (meal.recipe.servings || 1);

        totals.calories! += (nutrition.calories || 0) * servingMultiplier;
        totals.protein! += (nutrition.protein || 0) * servingMultiplier;
        totals.carbs! += (nutrition.carbs || 0) * servingMultiplier;
        totals.fat! += (nutrition.fat || 0) * servingMultiplier;
        totals.fiber! += (nutrition.fiber || 0) * servingMultiplier;
        totals.sugar! += (nutrition.sugar || 0) * servingMultiplier;
        totals.sodium! += (nutrition.sodium || 0) * servingMultiplier;
      }
    });

    return totals;
  }, [currentWeekPlan, selectedDate]);

  // Prepare nutrient data with goals
  const nutrientData: NutrientData[] = useMemo(() => {
    if (!dailyNutrition) return [];

    const goals = userPreferences?.nutritionalGoals;

    return [
      {
        name: 'Calories',
        current: Math.round(dailyNutrition.calories || 0),
        goal: goals?.dailyCalories || { min: 1800, max: 2200 },
        unit: 'kcal',
        color: 'bg-blue-500',
      },
      {
        name: 'Protein',
        current: Math.round(dailyNutrition.protein || 0),
        goal: goals?.dailyProtein || { min: 50, max: 150 },
        unit: 'g',
        color: 'bg-red-500',
      },
      {
        name: 'Carbs',
        current: Math.round(dailyNutrition.carbs || 0),
        goal: goals?.dailyCarbs || { min: 225, max: 325 },
        unit: 'g',
        color: 'bg-yellow-500',
      },
      {
        name: 'Fat',
        current: Math.round(dailyNutrition.fat || 0),
        goal: goals?.dailyFat || { min: 44, max: 78 },
        unit: 'g',
        color: 'bg-green-500',
      },
    ];
  }, [dailyNutrition, userPreferences]);

  // Calculate weekly averages
  const weeklyAverages = useMemo(() => {
    if (!currentWeekPlan) return null;

    const totals: NutritionalInfo = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
    };

    let mealCount = 0;

    currentWeekPlan.dailyPlans.forEach((plan) => {
      plan.meals.forEach((meal) => {
        if (meal.recipe?.nutritionalInfo) {
          const nutrition = meal.recipe.nutritionalInfo;
          const servingMultiplier = meal.servings / (meal.recipe.servings || 1);

          totals.calories! += (nutrition.calories || 0) * servingMultiplier;
          totals.protein! += (nutrition.protein || 0) * servingMultiplier;
          totals.carbs! += (nutrition.carbs || 0) * servingMultiplier;
          totals.fat! += (nutrition.fat || 0) * servingMultiplier;
          totals.fiber! += (nutrition.fiber || 0) * servingMultiplier;
          totals.sugar! += (nutrition.sugar || 0) * servingMultiplier;
          totals.sodium! += (nutrition.sodium || 0) * servingMultiplier;
          mealCount++;
        }
      });
    });

    if (mealCount === 0) return null;

    const days = currentWeekPlan.dailyPlans.length || 1;
    
    return {
      calories: Math.round((totals.calories || 0) / days),
      protein: Math.round((totals.protein || 0) / days),
      carbs: Math.round((totals.carbs || 0) / days),
      fat: Math.round((totals.fat || 0) / days),
      fiber: Math.round((totals.fiber || 0) / days),
      sugar: Math.round((totals.sugar || 0) / days),
      sodium: Math.round((totals.sodium || 0) / days),
    };
  }, [currentWeekPlan]);

  const getProgressPercentage = (current: number, goal: { min?: number; max?: number }) => {
    if (goal.min && goal.max) {
      const range = goal.max - goal.min;
      const progress = ((current - goal.min) / range) * 100;
      return Math.max(0, Math.min(100, progress));
    }
    return 0;
  };

  const getProgressStatus = (current: number, goal: { min?: number; max?: number }) => {
    if (goal.min && current < goal.min) return 'below';
    if (goal.max && current > goal.max) return 'above';
    return 'within';
  };

  if (!currentWeekPlan) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">
          No meal plan available. Generate a meal plan to see nutrition analytics.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <BarChart3 className="w-6 h-6" />
          Nutrition Analytics
        </h2>
        
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <input
            type="date"
            value={selectedDate.toISOString().split('T')[0]}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            className="px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Daily Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {nutrientData.map((nutrient, index) => {
          const progress = getProgressPercentage(nutrient.current, nutrient.goal);
          const status = getProgressStatus(nutrient.current, nutrient.goal);

          return (
            <motion.div
              key={nutrient.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-card border rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">{nutrient.name}</h3>
                <Target className={cn(
                  "w-4 h-4",
                  status === 'within' && "text-green-500",
                  status === 'below' && "text-yellow-500",
                  status === 'above' && "text-red-500"
                )} />
              </div>

              <div className="space-y-2">
                <div className="text-2xl font-bold">
                  {nutrient.current}
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    {nutrient.unit}
                  </span>
                </div>

                <div className="text-sm text-muted-foreground">
                  Goal: {nutrient.goal.min}-{nutrient.goal.max} {nutrient.unit}
                </div>

                <div className="relative h-2 bg-accent rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className={cn(
                      "absolute h-full rounded-full",
                      nutrient.color
                    )}
                  />
                </div>

                <div className="text-xs text-muted-foreground">
                  {status === 'within' && '✓ Within goal range'}
                  {status === 'below' && '↓ Below minimum goal'}
                  {status === 'above' && '↑ Above maximum goal'}
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Weekly Summary */}
      {weeklyAverages && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card border rounded-lg p-6"
        >
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Weekly Averages
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Avg. Calories</p>
              <p className="text-xl font-semibold">{weeklyAverages.calories} kcal</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg. Protein</p>
              <p className="text-xl font-semibold">{weeklyAverages.protein}g</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg. Carbs</p>
              <p className="text-xl font-semibold">{weeklyAverages.carbs}g</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg. Fat</p>
              <p className="text-xl font-semibold">{weeklyAverages.fat}g</p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-accent rounded-lg flex items-start gap-2">
            <Info className="w-4 h-4 text-muted-foreground mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p>
                These averages are calculated based on your planned meals for the week.
                Actual nutrition may vary based on portion sizes and preparation methods.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Macro Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-card border rounded-lg p-6"
      >
        <h3 className="font-semibold mb-4">Macronutrient Distribution</h3>
        
        {dailyNutrition ? (
          <MacroDistributionChart nutrition={dailyNutrition} />
        ) : (
          <p className="text-center text-muted-foreground py-8">
            No data available for selected date
          </p>
        )}
      </motion.div>
    </div>
  );
};

// Macro Distribution Chart Component
const MacroDistributionChart: React.FC<{ nutrition: NutritionalInfo }> = ({ nutrition }) => {
  const totalCalories = (nutrition.calories || 0);
  const proteinCalories = (nutrition.protein || 0) * 4;
  const carbCalories = (nutrition.carbs || 0) * 4;
  const fatCalories = (nutrition.fat || 0) * 9;

  const proteinPercentage = totalCalories > 0 ? (proteinCalories / totalCalories) * 100 : 0;
  const carbPercentage = totalCalories > 0 ? (carbCalories / totalCalories) * 100 : 0;
  const fatPercentage = totalCalories > 0 ? (fatCalories / totalCalories) * 100 : 0;

  const macros = [
    { name: 'Protein', percentage: Math.round(proteinPercentage), color: 'bg-red-500' },
    { name: 'Carbs', percentage: Math.round(carbPercentage), color: 'bg-yellow-500' },
    { name: 'Fat', percentage: Math.round(fatPercentage), color: 'bg-green-500' },
  ];

  return (
    <div className="space-y-4">
      <div className="relative h-8 bg-accent rounded-full overflow-hidden flex">
        {macros.map((macro, index) => (
          <motion.div
            key={macro.name}
            initial={{ width: 0 }}
            animate={{ width: `${macro.percentage}%` }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className={cn("h-full", macro.color)}
            title={`${macro.name}: ${macro.percentage}%`}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {macros.map((macro) => (
          <div key={macro.name} className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className={cn("w-3 h-3 rounded-full", macro.color)} />
              <span className="text-sm font-medium">{macro.name}</span>
            </div>
            <p className="text-xl font-semibold">{macro.percentage}%</p>
          </div>
        ))}
      </div>
    </div>
  );
};