'use client';

import React from 'react';

import { cn } from '@/lib/utils';

import { Card, CardHeader, CardBody, CardFooter } from './Card';
import { Badge } from './Badge';
import { Heading, Text } from './Typography';
import { Button } from './Button';
import { Icons } from './icons';

export interface RecipeCardProps {
  id: string;
  name: string;
  description?: string;
  image?: string;
  cookTime: number;
  prepTime: number;
  servings: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  rating?: number;
  tags?: string[];
  calories?: number;
  isAiGenerated?: boolean;
  isFavorite?: boolean;
  className?: string;
  variant?: 'default' | 'glass' | 'compact';
  onFavoriteToggle?: (id: string) => void;
  onShare?: (id: string) => void;
  onClick?: (id: string) => void;
}

const RecipeCard = React.forwardRef<HTMLDivElement, RecipeCardProps>(
  (
    {
      id,
      name,
      description,
      image,
      cookTime,
      prepTime,
      servings,
      difficulty = 'medium',
      rating,
      tags = [],
      calories,
      isAiGenerated = false,
      isFavorite = false,
      className,
      variant = 'default',
      onFavoriteToggle,
      onShare,
      onClick,
      ...props
    },
    ref
  ) => {
    const totalTime = cookTime + prepTime;

    const difficultyColors = {
      easy: 'fresh',
      medium: 'golden',
      hard: 'warm',
    } as const;

    const cardVariant = variant === 'glass' ? 'glass-interactive' : 'default';
    const isInteractive = !!onClick;

    const handleCardClick = () => {
      if (onClick) onClick(id);
    };

    const handleFavoriteClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onFavoriteToggle) onFavoriteToggle(id);
    };

    const handleShareClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onShare) onShare(id);
    };

    return (
      <Card
        ref={ref}
        variant={cardVariant}
        padding="none"
        hover={isInteractive}
        className={cn(
          'overflow-hidden group',
          isInteractive && 'cursor-pointer',
          variant === 'compact' && 'max-w-sm',
          className
        )}
        onClick={handleCardClick}
        {...props}
      >
        {/* Image Section */}
        <div className="relative aspect-video overflow-hidden">
          {image ? (
            <img
              src={image}
              alt={name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-food-fresh-100 to-food-warm-100 dark:from-food-fresh-900/20 dark:to-food-warm-900/20 flex items-center justify-center">
              <Icons.ChefHat size="xl" className="text-food-fresh-400 dark:text-food-fresh-600" />
            </div>
          )}

          {/* Overlay Actions */}
          <div className="absolute top-3 right-3 flex gap-2">
            {isAiGenerated && (
              <Badge
                size="sm"
                variant="rich"
                className="glass-rich backdrop-blur-md"
                leftIcon={<Icons.Star size="xs" />}
              >
                AI
              </Badge>
            )}
            
            <button
              onClick={handleFavoriteClick}
              className={cn(
                'p-2 rounded-full glass-interactive backdrop-blur-md transition-all duration-200',
                'hover:scale-110 focus:outline-none focus:ring-2 focus:ring-food-fresh-300',
                isFavorite
                  ? 'text-error-500 glow-warm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-error-500'
              )}
            >
              <Icons.Heart
                size="sm"
                className={isFavorite ? 'fill-current' : ''}
              />
            </button>
          </div>

          {/* Difficulty Badge */}
          <div className="absolute bottom-3 left-3">
            <Badge
              size="sm"
              variant={difficultyColors[difficulty]}
              className="glass backdrop-blur-md capitalize"
            >
              {difficulty}
            </Badge>
          </div>

          {/* Rating */}
          {rating && (
            <div className="absolute bottom-3 right-3 flex items-center gap-1 glass-interactive backdrop-blur-md rounded-lg px-2 py-1">
              <Icons.Star size="xs" className="text-food-golden-500 fill-current" />
              <Text size="xs" weight="medium" color="default">
                {rating.toFixed(1)}
              </Text>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-4">
          <CardHeader className="mb-3">
            <div>
              <Heading
                size={variant === 'compact' ? 'md' : 'lg'}
                weight="semibold"
                truncate
                className="group-hover:text-food-fresh-600 dark:group-hover:text-food-fresh-400 transition-colors"
              >
                {name}
              </Heading>
              {description && variant !== 'compact' && (
                <Text
                  size="sm"
                  color="muted"
                  className="mt-1 line-clamp-2"
                >
                  {description}
                </Text>
              )}
            </div>
          </CardHeader>

          {/* Recipe Stats */}
          <CardBody className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Icons.Clock size="sm" className="text-food-golden-500" />
                  <Text size="sm" color="muted">
                    {totalTime}m
                  </Text>
                </div>
                
                <div className="flex items-center gap-1">
                  <Icons.Users size="sm" className="text-food-fresh-500" />
                  <Text size="sm" color="muted">
                    {servings}
                  </Text>
                </div>

                {calories && (
                  <div className="flex items-center gap-1">
                    <Icons.Flame size="sm" className="text-food-warm-500" />
                    <Text size="sm" color="muted">
                      {calories}
                    </Text>
                  </div>
                )}
              </div>
              
              {onShare && (
                <button
                  onClick={handleShareClick}
                  className="p-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <Icons.Share size="sm" className="text-neutral-500" />
                </button>
              )}
            </div>

            {/* Tags */}
            {tags.length > 0 && variant !== 'compact' && (
              <div className="flex flex-wrap gap-1">
                {tags.slice(0, 3).map((tag, index) => (
                  <Badge
                    key={index}
                    size="sm"
                    variant="neutral"
                    className="text-xs"
                  >
                    {tag}
                  </Badge>
                ))}
                {tags.length > 3 && (
                  <Badge size="sm" variant="neutral" className="text-xs">
                    +{tags.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </CardBody>

          {/* Action Footer */}
          {variant !== 'compact' && (
            <CardFooter className="pt-4 mt-4">
              <Button
                variant="glass"
                size="sm"
                fullWidth
                className="group-hover:bg-food-fresh-50 dark:group-hover:bg-food-fresh-900/20"
              >
                View Recipe
              </Button>
            </CardFooter>
          )}
        </div>
      </Card>
    );
  }
);

RecipeCard.displayName = 'RecipeCard';

export { RecipeCard };