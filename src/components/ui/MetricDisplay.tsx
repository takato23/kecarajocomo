import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

import { cn } from '@/lib/utils';

interface MetricDisplayProps {
  label: string;
  value: string | number;
  change?: {
    value: number;
    period: string;
  };
  icon?: ReactNode;
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'gray';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const colorVariants = {
  blue: 'text-blue-600 bg-blue-50',
  green: 'text-green-600 bg-green-50',
  orange: 'text-orange-600 bg-orange-50',
  red: 'text-red-600 bg-red-50',
  purple: 'text-purple-600 bg-purple-50',
  gray: 'text-gray-600 bg-gray-50'
};

const sizeVariants = {
  sm: {
    container: 'p-3',
    value: 'text-lg font-bold',
    label: 'text-xs',
    icon: 'h-4 w-4'
  },
  md: {
    container: 'p-4',
    value: 'text-2xl font-bold',
    label: 'text-sm',
    icon: 'h-5 w-5'
  },
  lg: {
    container: 'p-6',
    value: 'text-3xl font-bold',
    label: 'text-base',
    icon: 'h-6 w-6'
  }
};

export function MetricDisplay({
  label,
  value,
  change,
  icon,
  color = 'blue',
  size = 'md',
  loading = false
}: MetricDisplayProps) {
  const getTrendIcon = () => {
    if (!change) return null;
    
    if (change.value > 0) return <TrendingUp className="h-3 w-3" />;
    if (change.value < 0) return <TrendingDown className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  const getTrendColor = () => {
    if (!change) return '';
    
    if (change.value > 0) return 'text-green-600';
    if (change.value < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  if (loading) {
    return (
      <div className={cn(sizeVariants[size].container, "animate-pulse")}>
        <div className="flex items-center justify-between mb-2">
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="h-4 w-4 bg-gray-200 rounded"></div>
        </div>
        <div className="h-8 bg-gray-200 rounded w-1/2 mb-1"></div>
        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
      </div>
    );
  }

  return (
    <div className={cn(sizeVariants[size].container)}>
      <div className="flex items-center justify-between mb-2">
        <span className={cn(
          "font-medium text-gray-600",
          sizeVariants[size].label
        )}>
          {label}
        </span>
        {icon && (
          <div className={cn(
            "rounded-lg p-2",
            colorVariants[color]
          )}>
            <div className={sizeVariants[size].icon}>
              {icon}
            </div>
          </div>
        )}
      </div>
      
      <div className={cn(
        "text-gray-900",
        sizeVariants[size].value
      )}>
        {value}
      </div>
      
      {change && (
        <div className={cn(
          "flex items-center space-x-1 mt-1",
          getTrendColor()
        )}>
          {getTrendIcon()}
          <span className="text-xs font-medium">
            {Math.abs(change.value)}% vs {change.period}
          </span>
        </div>
      )}
    </div>
  );
}