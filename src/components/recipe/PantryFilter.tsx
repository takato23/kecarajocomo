'use client';

import React from 'react';

import { cn } from '@/lib/utils';

import { Card, CardBody } from '../design-system/Card';
import { Badge } from '../design-system/Badge';
import { Button } from '../design-system/Button';
import { Text } from '../design-system/Typography';
import { Icons } from '../design-system/icons';

export interface PantryFilterProps {
  showOnlyCanMake: boolean;
  pantryItemsCount: number;
  canMakeCount: number;
  totalRecipes: number;
  onToggleCanMake: () => void;
  onViewPantry?: () => void;
  className?: string;
  // Enhanced information
  averageCompatibilityScore?: number;
  totalEstimatedCost?: number;
  mostMissingIngredient?: string;
}

export const PantryFilter: React.FC<PantryFilterProps> = ({
  showOnlyCanMake,
  pantryItemsCount,
  canMakeCount,
  totalRecipes,
  onToggleCanMake,
  onViewPantry,
  className,
  averageCompatibilityScore,
  totalEstimatedCost,
  mostMissingIngredient
}) => {
  if (pantryItemsCount === 0) {
    return (
      <Card className={cn('border-dashed', className)}>
        <CardBody className="text-center py-6">
          <div className="text-4xl mb-2">🥫</div>
          <Text weight="medium" className="mb-1">
            Tu despensa está vacía
          </Text>
          <Text size="sm" color="muted" className="mb-4">
            Agrega ingredientes para ver qué puedes cocinar
          </Text>
          {onViewPantry && (
            <Button
              variant="fresh"
              size="sm"
              onClick={onViewPantry}
              leftIcon={<Icons.Plus />}
            >
              Gestionar Despensa
            </Button>
          )}
        </CardBody>
      </Card>
    );
  }

  return (
    <Card 
      className={cn(
        'border-2 transition-all duration-200',
        showOnlyCanMake 
          ? 'border-food-fresh-300 bg-food-fresh-50 dark:bg-food-fresh-900/20' 
          : 'border-neutral-200 dark:border-neutral-700',
        className
      )}
    >
      <CardBody className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-food-fresh-100 dark:bg-food-fresh-900/30">
              <Icons.ChefHat className="w-5 h-5 text-food-fresh-600" />
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Text weight="medium">
                  Filtro de Despensa
                </Text>
                <Badge
                  size="sm"
                  variant="fresh"
                  className="opacity-90"
                >
                  {pantryItemsCount} ingredientes
                </Badge>
              </div>
              
              <div className="flex items-center gap-4 text-sm flex-wrap">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-food-fresh-500" />
                  <Text size="sm" color="muted">
                    {canMakeCount} recetas disponibles
                  </Text>
                </div>
                
                {!showOnlyCanMake && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-neutral-400" />
                    <Text size="sm" color="muted">
                      {totalRecipes - canMakeCount} con ingredientes faltantes
                    </Text>
                  </div>
                )}

                {/* Enhanced information */}
                {averageCompatibilityScore !== undefined && (
                  <div className="flex items-center gap-1">
                    <Icons.Target size="xs" className="text-food-golden-500" />
                    <Text size="sm" color="muted">
                      {Math.round(averageCompatibilityScore * 100)}% compatibilidad
                    </Text>
                  </div>
                )}

                {totalEstimatedCost && totalEstimatedCost > 0 && (
                  <div className="flex items-center gap-1">
                    <Icons.DollarSign size="xs" className="text-food-warm-500" />
                    <Text size="sm" color="muted">
                      ~${Math.round(totalEstimatedCost / 1000)}k faltantes
                    </Text>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onViewPantry && (
              <Button
                variant="neutral"
                size="sm"
                onClick={onViewPantry}
                leftIcon={<Icons.Package />}
              >
                Ver Despensa
              </Button>
            )}
            
            <Button
              variant={showOnlyCanMake ? "fresh" : "neutral"}
              size="sm"
              onClick={onToggleCanMake}
              leftIcon={
                showOnlyCanMake ? 
                  <Icons.CheckCircle className="text-food-fresh-600" /> : 
                  <Icons.Filter />
              }
              className={cn(
                "transition-all duration-200",
                showOnlyCanMake && "ring-2 ring-food-fresh-200 dark:ring-food-fresh-700"
              )}
            >
              {showOnlyCanMake ? 'Solo lo que puedo cocinar' : 'Mostrar todo'}
            </Button>
          </div>
        </div>

        {/* Mobile layout */}
        <div className="md:hidden mt-4 space-y-3">
          <div className="flex justify-between items-center">
            <Text size="sm" color="muted">
              {canMakeCount} de {totalRecipes} recetas disponibles
            </Text>
            <Badge
              size="sm"
              variant={canMakeCount > 0 ? "fresh" : "neutral"}
            >
              {Math.round((canMakeCount / totalRecipes) * 100)}% disponible
            </Badge>
          </div>
          
          <div className="flex gap-2">
            {onViewPantry && (
              <Button
                variant="neutral"
                size="sm"
                fullWidth
                onClick={onViewPantry}
                leftIcon={<Icons.Package />}
              >
                Gestionar Despensa
              </Button>
            )}
            
            <Button
              variant={showOnlyCanMake ? "fresh" : "neutral"}
              size="sm"
              fullWidth
              onClick={onToggleCanMake}
              leftIcon={
                showOnlyCanMake ? 
                  <Icons.CheckCircle /> : 
                  <Icons.Filter />
              }
            >
              {showOnlyCanMake ? 'Mostrando disponibles' : 'Mostrar solo disponibles'}
            </Button>
          </div>
        </div>

        {/* Progress bar for visual representation */}
        {canMakeCount > 0 && (
          <div className="mt-4 hidden md:block">
            <div className="flex items-center justify-between mb-2">
              <Text size="xs" color="muted">Compatibilidad con tu despensa</Text>
              <Text size="xs" weight="medium" color="fresh">
                {Math.round((canMakeCount / totalRecipes) * 100)}%
              </Text>
            </div>
            <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-food-fresh-400 to-food-fresh-600 h-2 rounded-full transition-all duration-500"
                style={{ 
                  width: `${Math.min((canMakeCount / totalRecipes) * 100, 100)}%` 
                }}
              />
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
};

// Alternative compact version for smaller spaces
export const PantryFilterCompact: React.FC<PantryFilterProps> = ({
  showOnlyCanMake,
  pantryItemsCount,
  canMakeCount,
  totalRecipes,
  onToggleCanMake,
  onViewPantry,
  className
}) => {
  if (pantryItemsCount === 0) {
    return (
      <div className={cn('flex items-center gap-2 p-2 rounded-lg border border-dashed', className)}>
        <Icons.ChefHat className="w-4 h-4 text-neutral-400" />
        <Text size="sm" color="muted">
          Despensa vacía
        </Text>
        {onViewPantry && (
          <Button variant="neutral" size="xs" onClick={onViewPantry}>
            Agregar
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Badge
        size="sm"
        variant="fresh"
        className="cursor-pointer"
        onClick={onViewPantry}
      >
        🥫 {pantryItemsCount}
      </Badge>
      
      <Button
        variant={showOnlyCanMake ? "fresh" : "neutral"}
        size="sm"
        onClick={onToggleCanMake}
        leftIcon={
          showOnlyCanMake ? 
            <Icons.CheckCircle size="xs" /> : 
            <Icons.Filter size="xs" />
        }
      >
        {showOnlyCanMake ? `${canMakeCount} disponibles` : 'Filtrar disponibles'}
      </Button>
      
      {!showOnlyCanMake && (
        <Text size="xs" color="muted">
          {canMakeCount}/{totalRecipes}
        </Text>
      )}
    </div>
  );
};