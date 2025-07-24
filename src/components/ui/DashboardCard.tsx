import { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface DashboardCardProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
  loading?: boolean;
  error?: string;
}

export function DashboardCard({
  title,
  subtitle,
  children,
  className,
  action,
  loading = false,
  error
}: DashboardCardProps) {
  return (
    <div className={cn(
      "bg-white rounded-lg shadow-sm border border-gray-200 p-6",
      "hover:shadow-md transition-shadow duration-200",
      className
    )}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            )}
            {subtitle && (
              <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
            )}
          </div>
          {action && (
            <div className="flex-shrink-0">
              {action}
            </div>
          )}
        </div>
      )}
      
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <p className="text-red-600 text-sm font-medium">Error loading data</p>
            <p className="text-gray-500 text-xs mt-1">{error}</p>
          </div>
        </div>
      ) : (
        children
      )}
    </div>
  );
}