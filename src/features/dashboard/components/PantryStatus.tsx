import { 
  Package, 
  AlertTriangle, 
  TrendingDown, 
  Plus,
  Calendar,
  Archive
} from 'lucide-react';
import Link from 'next/link';

import { DashboardCard } from '@/components/ui';

import { useDashboard } from '../hooks/useDashboard';

export function PantryStatus() {
  const { metrics, hasPantryAlerts, totalPantryAlerts, isLoading } = useDashboard();

  return (
    <DashboardCard
      title="Pantry Status"
      subtitle="Inventory and alerts"
      loading={isLoading}
      action={
        <Link 
          href="/pantry" 
          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
        >
          Manage
        </Link>
      }
    >
      {/* Overview Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="flex items-center justify-center w-10 h-10 bg-blue-50 text-blue-600 rounded-lg mx-auto mb-2">
            <Package className="h-5 w-5" />
          </div>
          <div className="text-xl font-bold text-gray-900">
            {metrics.pantryStatus.totalItems}
          </div>
          <div className="text-xs text-gray-500">Total Items</div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center w-10 h-10 bg-orange-50 text-orange-600 rounded-lg mx-auto mb-2">
            <Calendar className="h-5 w-5" />
          </div>
          <div className="text-xl font-bold text-gray-900">
            {metrics.pantryStatus.expiringSoon}
          </div>
          <div className="text-xs text-gray-500">Expiring Soon</div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center w-10 h-10 bg-red-50 text-red-600 rounded-lg mx-auto mb-2">
            <TrendingDown className="h-5 w-5" />
          </div>
          <div className="text-xl font-bold text-gray-900">
            {metrics.pantryStatus.lowStock}
          </div>
          <div className="text-xs text-gray-500">Low Stock</div>
        </div>
      </div>

      {/* Alerts Section */}
      {hasPantryAlerts ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">Active Alerts</h4>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
              {totalPantryAlerts} alerts
            </span>
          </div>
          
          {metrics.pantryStatus.expiringSoon > 0 && (
            <div className="flex items-start space-x-3 p-3 bg-orange-50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-orange-900">
                  {metrics.pantryStatus.expiringSoon} items expiring soon
                </p>
                <p className="text-xs text-orange-700 mt-1">
                  Check your pantry for items expiring in the next 3 days
                </p>
              </div>
            </div>
          )}
          
          {metrics.pantryStatus.lowStock > 0 && (
            <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
              <TrendingDown className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">
                  {metrics.pantryStatus.lowStock} items low in stock
                </p>
                <p className="text-xs text-red-700 mt-1">
                  Consider adding these to your shopping list
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-6">
          <div className="flex items-center justify-center w-12 h-12 bg-green-50 text-green-600 rounded-lg mx-auto mb-3">
            <Package className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium text-gray-900 mb-1">Pantry looks good!</p>
          <p className="text-xs text-gray-500">No urgent alerts at this time</p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/pantry/add"
            className="flex items-center justify-center px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Items
          </Link>
          <Link
            href="/pantry/expired"
            className="flex items-center justify-center px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition-colors"
          >
            <Archive className="h-4 w-4 mr-2" />
            Clean Up
          </Link>
        </div>
      </div>
      
      {/* Health Score */}
      {metrics.pantryStatus.totalItems > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Pantry Health</span>
            <span className="text-sm font-bold text-green-600">
              {Math.round(((metrics.pantryStatus.totalItems - totalPantryAlerts) / metrics.pantryStatus.totalItems) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="h-2 bg-green-500 rounded-full transition-all duration-300"
              style={{ 
                width: `${Math.round(((metrics.pantryStatus.totalItems - totalPantryAlerts) / metrics.pantryStatus.totalItems) * 100)}%` 
              }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Based on expiration dates and stock levels
          </p>
        </div>
      )}
    </DashboardCard>
  );
}