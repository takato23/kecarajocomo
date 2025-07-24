import { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight, ExternalLink } from 'lucide-react';

import { cn } from '@/lib/utils';

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  href: string;
  external?: boolean;
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'indigo';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  badge?: string;
  onClick?: () => void;
}

const colorVariants = {
  blue: 'bg-blue-500 group-hover:bg-blue-600',
  green: 'bg-green-500 group-hover:bg-green-600',
  orange: 'bg-orange-500 group-hover:bg-orange-600',
  red: 'bg-red-500 group-hover:bg-red-600',
  purple: 'bg-purple-500 group-hover:bg-purple-600',
  indigo: 'bg-indigo-500 group-hover:bg-indigo-600'
};

const sizeVariants = {
  sm: {
    container: 'p-4',
    icon: 'w-8 h-8',
    iconContainer: 'w-10 h-10',
    title: 'text-base font-semibold',
    description: 'text-xs'
  },
  md: {
    container: 'p-6',
    icon: 'w-8 h-8',
    iconContainer: 'w-12 h-12',
    title: 'text-lg font-semibold',
    description: 'text-sm'
  },
  lg: {
    container: 'p-8',
    icon: 'w-10 h-10',
    iconContainer: 'w-14 h-14',
    title: 'text-xl font-semibold',
    description: 'text-base'
  }
};

export function QuickActionCard({
  title,
  description,
  icon,
  href,
  external = false,
  color = 'blue',
  size = 'md',
  disabled = false,
  badge,
  onClick
}: QuickActionCardProps) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const cardContent = (
    <div className={cn(
      "bg-white rounded-lg shadow-sm border border-gray-200",
      "hover:shadow-md hover:border-gray-300 transition-all duration-200",
      "group cursor-pointer",
      disabled && "opacity-50 cursor-not-allowed hover:shadow-sm hover:border-gray-200",
      sizeVariants[size].container
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className={cn(
            "rounded-lg flex items-center justify-center text-white mb-4",
            "group-hover:scale-110 transition-transform duration-200",
            disabled && "group-hover:scale-100",
            colorVariants[color],
            sizeVariants[size].iconContainer
          )}>
            <div className={sizeVariants[size].icon}>
              {icon}
            </div>
          </div>
          
          <div className="flex items-center justify-between mb-2">
            <h3 className={cn(
              "text-gray-900",
              sizeVariants[size].title
            )}>
              {title}
            </h3>
            {badge && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                {badge}
              </span>
            )}
          </div>
          
          <p className={cn(
            "text-gray-600",
            sizeVariants[size].description
          )}>
            {description}
          </p>
        </div>
        
        <div className={cn(
          "ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200",
          disabled && "group-hover:opacity-0"
        )}>
          {external ? (
            <ExternalLink className="h-4 w-4 text-gray-400" />
          ) : (
            <ArrowRight className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </div>
    </div>
  );

  if (disabled) {
    return (
      <div onClick={handleClick}>
        {cardContent}
      </div>
    );
  }

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
      >
        {cardContent}
      </a>
    );
  }

  return (
    <Link href={href} onClick={handleClick}>
      {cardContent}
    </Link>
  );
}