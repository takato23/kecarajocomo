import { 
  Lightbulb, 
  TrendingUp, 
  AlertCircle, 
  Sparkles,
  ChefHat,
  Calendar,
  ShoppingCart
} from 'lucide-react';
import Link from 'next/link';

import { DashboardCard } from '@/components/ui';

import { useDashboard } from '../hooks/useDashboard';

interface Insight {
  id: string;
  type: 'suggestion' | 'warning' | 'opportunity' | 'achievement';
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
  };
  icon: React.ReactNode;
  priority: 'high' | 'medium' | 'low';
}

export function AiInsights() {
  const { metrics, hasUpcomingMeals, hasPantryAlerts, isLoading } = useDashboard();

  // Generate AI insights based on user data
  const generateInsights = (): Insight[] => {
    const insights: Insight[] = [];

    // No meals planned
    if (metrics.mealsPlannedThisWeek === 0) {
      insights.push({
        id: 'no-meals-planned',
        type: 'suggestion',
        title: 'Start your meal planning journey',
        description: 'Plan your first week to unlock personalized nutrition tracking and shopping list optimization.',
        // action: {
        //   label: 'Plan Week',
        //   href: '/meal-planner'
        // },
        icon: <Calendar className="h-4 w-4" />,
        priority: 'high'
      });
    }

    // Low meal variety
    if (metrics.mealsPlannedThisWeek > 0 && metrics.recipesTriedThisMonth < 5) {
      insights.push({
        id: 'low-variety',
        type: 'opportunity',
        title: 'Expand your culinary horizons',
        description: 'Try exploring new cuisines and ingredients to keep your meals exciting and nutritionally diverse.',
        action: {
          label: 'Browse Recipes',
          href: '/recipes'
        },
        icon: <ChefHat className="h-4 w-4" />,
        priority: 'medium'
      });
    }

    // Pantry optimization
    if (hasPantryAlerts) {
      insights.push({
        id: 'pantry-optimization',
        type: 'warning',
        title: 'Optimize your pantry',
        description: 'You have items expiring soon or running low. Consider planning meals around these ingredients.',
        action: {
          label: 'View Pantry',
          href: '/pantry'
        },
        icon: <AlertCircle className="h-4 w-4" />,
        priority: 'high'
      });
    }

    // Nutrition balance (if data available)
    if (metrics.weeklyNutrition) {
      const proteinProgress = (metrics.weeklyNutrition.protein.current / metrics.weeklyNutrition.protein.goal) * 100;
      if (proteinProgress < 60) {
        insights.push({
          id: 'protein-boost',
          type: 'suggestion',
          title: 'Boost your protein intake',
          description: 'Your protein goals are behind target. Consider adding more lean meats, legumes, or plant-based proteins.',
          action: {
            label: 'Find Protein Recipes',
            href: '/recipes?filter=high-protein'
          },
          icon: <TrendingUp className="h-4 w-4" />,
          priority: 'medium'
        });
      }
    }

    // Shopping efficiency
    if (metrics.mealsPlannedThisWeek > 5 && metrics.pantryStatus.totalItems > 0) {
      insights.push({
        id: 'shopping-efficiency',
        type: 'opportunity',
        title: 'Maximize shopping efficiency',
        description: 'Generate a smart shopping list that considers your pantry inventory and meal plans.',
        action: {
          label: 'Generate List',
          href: '/shopping'
        },
        icon: <ShoppingCart className="h-4 w-4" />,
        priority: 'low'
      });
    }

    // Achievement for consistent planning
    if (metrics.mealsPlannedThisWeek >= 10) {
      insights.push({
        id: 'planning-achievement',
        type: 'achievement',
        title: 'Meal planning pro! 🎉',
        description: 'You\'ve planned an impressive number of meals this week. Your future self will thank you!',
        icon: <Sparkles className="h-4 w-4" />,
        priority: 'low'
      });
    }

    return insights.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  };

  const insights = generateInsights();

  const getInsightStyle = (type: Insight['type']) => {
    switch (type) {
      case 'warning':
        return 'border-l-red-500 bg-red-50';
      case 'suggestion':
        return 'border-l-blue-500 bg-blue-50';
      case 'opportunity':
        return 'border-l-purple-500 bg-purple-50';
      case 'achievement':
        return 'border-l-green-500 bg-green-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const getInsightIconColor = (type: Insight['type']) => {
    switch (type) {
      case 'warning':
        return 'text-red-600';
      case 'suggestion':
        return 'text-blue-600';
      case 'opportunity':
        return 'text-purple-600';
      case 'achievement':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <DashboardCard
      title="AI Insights"
      subtitle="Personalized recommendations"
      loading={isLoading}
      action={
        <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
          View All
        </button>
      }
    >
      {insights.length === 0 ? (
        <div className="text-center py-8">
          <Lightbulb className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-sm">No insights available yet</p>
          <p className="text-gray-400 text-xs mt-1">
            Start using the app to get personalized recommendations
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {insights.slice(0, 3).map((insight) => (
            <div
              key={insight.id}
              className={`border-l-4 pl-4 pr-3 py-3 rounded-r-lg ${getInsightStyle(insight.type)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className={`flex-shrink-0 ${getInsightIconColor(insight.type)}`}>
                    {insight.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 mb-1">
                      {insight.title}
                    </h4>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {insight.description}
                    </p>
                    {insight.action && (
                      <Link
                        href={insight.action.href}
                        className="inline-flex items-center mt-2 text-xs font-medium text-primary-600 hover:text-primary-700"
                      >
                        {insight.action.label} →
                      </Link>
                    )}
                  </div>
                </div>
                {insight.priority === 'high' && (
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Priority
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {insights.length > 3 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <button className="w-full text-center text-sm text-primary-600 hover:text-primary-700 font-medium">
                Show {insights.length - 3} more insights
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* AI disclaimer */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <Sparkles className="h-3 w-3" />
          <span>Powered by AI • Recommendations update daily</span>
        </div>
      </div>
    </DashboardCard>
  );
}