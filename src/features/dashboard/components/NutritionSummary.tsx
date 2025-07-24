import { BarChart3, Target, TrendingUp } from 'lucide-react';

import { DashboardCard } from '@/components/ui';

import { useDashboard } from '../hooks/useDashboard';

export function NutritionSummary() {
  const { metrics, weeklyNutritionProgress, isLoading } = useDashboard();

  if (!metrics.weeklyNutrition) {
    return (
      <DashboardCard
        title="Weekly Nutrition"
        subtitle="Track your nutritional goals"
        loading={isLoading}
      >
        <div className="text-center py-8">
          <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Start planning meals to see nutrition data</p>
        </div>
      </DashboardCard>
    );
  }

  const nutritionData = [
    {
      label: 'Calories',
      current: metrics.weeklyNutrition.calories.current,
      goal: metrics.weeklyNutrition.calories.goal,
      unit: 'kcal',
      color: 'bg-blue-500',
      progress: weeklyNutritionProgress?.calories || 0
    },
    {
      label: 'Protein',
      current: metrics.weeklyNutrition.protein.current,
      goal: metrics.weeklyNutrition.protein.goal,
      unit: 'g',
      color: 'bg-green-500',
      progress: weeklyNutritionProgress?.protein || 0
    },
    {
      label: 'Carbs',
      current: metrics.weeklyNutrition.carbs.current,
      goal: metrics.weeklyNutrition.carbs.goal,
      unit: 'g',
      color: 'bg-orange-500',
      progress: weeklyNutritionProgress?.carbs || 0
    },
    {
      label: 'Fat',
      current: metrics.weeklyNutrition.fat.current,
      goal: metrics.weeklyNutrition.fat.goal,
      unit: 'g',
      color: 'bg-purple-500',
      progress: weeklyNutritionProgress?.fat || 0
    }
  ];

  return (
    <DashboardCard
      title="Weekly Nutrition"
      subtitle="Progress toward your goals"
      loading={isLoading}
      action={
        <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
          View Details
        </button>
      }
    >
      <div className="space-y-4">
        {nutritionData.map((item) => (
          <div key={item.label} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">{item.label}</span>
              <span className="text-sm text-gray-500">
                {item.current.toLocaleString()}/{item.goal.toLocaleString()} {item.unit}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${item.color}`}
                style={{ width: `${Math.min(item.progress, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{item.progress.toFixed(0)}% complete</span>
              {item.progress >= 100 && (
                <div className="flex items-center text-green-600">
                  <Target className="h-3 w-3 mr-1" />
                  Goal reached!
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Weekly overview */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Week Progress</span>
          <div className="flex items-center text-green-600">
            <TrendingUp className="h-4 w-4 mr-1" />
            <span className="text-sm font-medium">On track</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          4 days remaining this week
        </p>
      </div>
    </DashboardCard>
  );
}