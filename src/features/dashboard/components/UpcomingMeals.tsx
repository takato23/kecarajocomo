import { Calendar, Clock, ChefHat, Plus } from 'lucide-react';
import Link from 'next/link';

import { DashboardCard } from '@/components/ui';

import { useDashboard } from '../hooks/useDashboard';

export function UpcomingMeals() {
  const { metrics, hasUpcomingMeals, isLoading } = useDashboard();

  const getMealTimeIcon = (mealType: string) => {
    switch (mealType) {
      case 'breakfast':
        return '🌅';
      case 'lunch':
        return '☀️';
      case 'dinner':
        return '🌙';
      case 'snack':
        return '🍎';
      default:
        return '🍽️';
    }
  };

  const getMealBadgeColor = (isToday: boolean, isTomorrow: boolean) => {
    if (isToday) return 'bg-green-100 text-green-800';
    if (isTomorrow) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getMealBadgeText = (isToday: boolean, isTomorrow: boolean) => {
    if (isToday) return 'Today';
    if (isTomorrow) return 'Tomorrow';
    return 'Upcoming';
  };

  return (
    <DashboardCard
      title="Upcoming Meals"
      subtitle="Your next planned meals"
      loading={isLoading}
      action={
        <Link 
          href="/meal-planner" 
          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
        >
          Plan More
        </Link>
      }
    >
      {!hasUpcomingMeals ? (
        <div className="text-center py-8">
          <ChefHat className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-sm mb-3">No upcoming meals planned</p>
          <Link
            href="/meal-planner"
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Plan Your Week
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {metrics.upcomingMeals.slice(0, 4).map((meal) => (
            <div key={meal.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex-shrink-0 text-2xl">
                {getMealTimeIcon(meal.mealType)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {meal.recipeName}
                  </h4>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getMealBadgeColor(meal.isToday, meal.isTomorrow)}`}>
                    {getMealBadgeText(meal.isToday, meal.isTomorrow)}
                  </span>
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  <Calendar className="h-3 w-3 mr-1" />
                  <span className="capitalize">{meal.mealType}</span>
                  {meal.isToday && (
                    <>
                      <span className="mx-1">•</span>
                      <Clock className="h-3 w-3 mr-1" />
                      <span>Today</span>
                    </>
                  )}
                </div>
              </div>
              <button className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600">
                <ChefHat className="h-4 w-4" />
              </button>
            </div>
          ))}
          
          {metrics.upcomingMeals.length > 4 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <Link
                href="/meal-planner"
                className="w-full text-center text-sm text-primary-600 hover:text-primary-700 font-medium block"
              >
                View {metrics.upcomingMeals.length - 4} more meals
              </Link>
            </div>
          )}
        </div>
      )}
      
      {/* Quick actions */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/meal-planner"
            className="flex items-center justify-center px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition-colors"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Plan Week
          </Link>
          <Link
            href="/recipes"
            className="flex items-center justify-center px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition-colors"
          >
            <ChefHat className="h-4 w-4 mr-2" />
            Browse Recipes
          </Link>
        </div>
      </div>
    </DashboardCard>
  );
}