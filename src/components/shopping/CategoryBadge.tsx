'use client';

import { IngredientCategory, INGREDIENT_CATEGORIES } from '@/types/pantry';

interface CategoryBadgeProps {
  category: IngredientCategory | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showLabel?: boolean;
}

const sizeClasses = {
  sm: 'text-xs px-2 py-1',
  md: 'text-sm px-3 py-1.5', 
  lg: 'text-base px-4 py-2'
};

const colorClasses: Record<string, string> = {
  green: 'bg-green-100 text-green-800 border-green-200',
  red: 'bg-red-100 text-red-800 border-red-200',
  blue: 'bg-blue-100 text-blue-800 border-blue-200',
  yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  gray: 'bg-gray-100 text-gray-800 border-gray-200',
  cyan: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  orange: 'bg-orange-100 text-orange-800 border-orange-200',
  purple: 'bg-purple-100 text-purple-800 border-purple-200'
};

export function CategoryBadge({ 
  category, 
  size = 'sm', 
  showIcon = true, 
  showLabel = false 
}: CategoryBadgeProps) {
  if (!category) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full border font-medium ${sizeClasses[size]} ${colorClasses.gray}`}>
        {showIcon && '📦'}
        {showLabel && 'Sin categoría'}
      </span>
    );
  }

  const categoryInfo = INGREDIENT_CATEGORIES[category];
  const colorClass = colorClasses[categoryInfo.color] || colorClasses.gray;

  return (
    <span 
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${sizeClasses[size]} ${colorClass}`}
      title={categoryInfo.description}
    >
      {showIcon && categoryInfo.icon}
      {showLabel && categoryInfo.label}
    </span>
  );
}