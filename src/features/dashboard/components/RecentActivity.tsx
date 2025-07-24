import { 
  Calendar, 
  BookOpen, 
  ShoppingCart, 
  Package, 
  Clock,
  ExternalLink 
} from 'lucide-react';

import { DashboardCard } from '@/components/ui';

import { useDashboard } from '../hooks/useDashboard';

const activityIcons = {
  meal_planned: Calendar,
  recipe_added: BookOpen,
  shopping_completed: ShoppingCart,
  pantry_updated: Package
};

const activityColors = {
  meal_planned: 'text-blue-600 bg-blue-50',
  recipe_added: 'text-green-600 bg-green-50',
  shopping_completed: 'text-purple-600 bg-purple-50',
  pantry_updated: 'text-orange-600 bg-orange-50'
};

export function RecentActivity() {
  const { metrics, isLoading } = useDashboard();

  return (
    <DashboardCard
      title="Recent Activity"
      subtitle="Your latest actions"
      loading={isLoading}
      action={
        <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
          View All
        </button>
      }
    >
      {metrics.recentActivity.length === 0 ? (
        <div className="text-center py-8">
          <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-sm">No recent activity</p>
          <p className="text-gray-400 text-xs mt-1">
            Start planning meals to see your activity here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {metrics.recentActivity.slice(0, 5).map((activity) => {
            const Icon = activityIcons[activity.type];
            const colorClass = activityColors[activity.type];
            
            return (
              <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className={`flex-shrink-0 p-2 rounded-lg ${colorClass}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 font-medium">
                    {activity.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {activity.relativeTime}
                  </p>
                </div>
                <button className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600">
                  <ExternalLink className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
      
      {metrics.recentActivity.length > 5 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <button className="w-full text-center text-sm text-primary-600 hover:text-primary-700 font-medium">
            Show {metrics.recentActivity.length - 5} more activities
          </button>
        </div>
      )}
    </DashboardCard>
  );
}