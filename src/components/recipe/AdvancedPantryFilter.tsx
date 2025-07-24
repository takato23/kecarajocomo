'use client';

import React, { useState } from 'react';

import { cn } from '@/lib/utils';

import { Card, CardBody, CardHeader } from '../design-system/Card';
import { Badge } from '../design-system/Badge';
import { Button } from '../design-system/Button';
import { Text, Heading } from '../design-system/Typography';
import { Icons } from '../design-system/icons';

export interface AdvancedPantryFilterProps {
  showOnlyCanMake: boolean;
  pantryItemsCount: number;
  canMakeCount: number;
  totalRecipes: number;
  onToggleCanMake: () => void;
  onViewPantry?: () => void;
  // Enhanced information
  averageCompatibilityScore?: number;
  totalEstimatedCost?: number;
  mostMissingIngredient?: string;
  // Advanced filter options
  onFilterByCompatibility?: (minScore: number) => void;
  onFilterByMaxCost?: (maxCost: number) => void;
  onFilterByMaxMissingIngredients?: (maxMissing: number) => void;
  className?: string;
}

export const AdvancedPantryFilter: React.FC<AdvancedPantryFilterProps> = ({
  showOnlyCanMake,
  pantryItemsCount,
  canMakeCount,
  totalRecipes,
  onToggleCanMake,
  onViewPantry,
  averageCompatibilityScore,
  totalEstimatedCost,
  mostMissingIngredient,
  onFilterByCompatibility,
  onFilterByMaxCost,
  onFilterByMaxMissingIngredients,
  className
}) => {
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [compatibilityThreshold, setCompatibilityThreshold] = useState(70);
  const [maxCostThreshold, setMaxCostThreshold] = useState(50000);
  const [maxMissingIngredients, setMaxMissingIngredients] = useState(3);

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

  const compatibilityPercentage = Math.round((canMakeCount / totalRecipes) * 100);

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
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-food-fresh-100 dark:bg-food-fresh-900/30">
              <Icons.ChefHat className="w-5 h-5 text-food-fresh-600" />
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Heading size="sm">Filtro Inteligente de Despensa</Heading>
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
                    {canMakeCount} recetas disponibles ({compatibilityPercentage}%)
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
                      {Math.round(averageCompatibilityScore * 100)}% compatibilidad promedio
                    </Text>
                  </div>
                )}

                {totalEstimatedCost && totalEstimatedCost > 0 && (
                  <div className="flex items-center gap-1">
                    <Icons.DollarSign size="xs" className="text-food-warm-500" />
                    <Text size="sm" color="muted">
                      ~${Math.round(totalEstimatedCost / 1000)}k costo total faltante
                    </Text>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="neutral"
              size="sm"
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              leftIcon={<Icons.Settings size="xs" />}
              rightIcon={showAdvancedOptions ? <Icons.ChevronUp size="xs" /> : <Icons.ChevronDown size="xs" />}
            >
              Avanzado
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardBody className="space-y-4">
        {/* Quick Actions */}
        <div className="flex gap-2 flex-wrap">
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

          {/* Quick filter buttons */}
          {onFilterByCompatibility && (
            <Button
              variant="neutral"
              size="sm"
              onClick={() => onFilterByCompatibility(0.8)}
              leftIcon={<Icons.Target size="xs" />}
            >
              80%+ Compatible
            </Button>
          )}

          {onFilterByMaxCost && totalEstimatedCost && totalEstimatedCost > 0 && (
            <Button
              variant="neutral"
              size="sm"
              onClick={() => onFilterByMaxCost(25000)}
              leftIcon={<Icons.DollarSign size="xs" />}
            >
              Bajo Costo
            </Button>
          )}
        </div>

        {/* Advanced Options */}
        {showAdvancedOptions && (
          <div className="space-y-4 p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700">
            <Heading size="xs" className="text-neutral-600 dark:text-neutral-400">
              Filtros Avanzados
            </Heading>

            {/* Compatibility Score Filter */}
            {onFilterByCompatibility && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Text size="sm" weight="medium">Compatibilidad Mínima</Text>
                  <Text size="sm" color="muted">{compatibilityThreshold}%</Text>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={compatibilityThreshold}
                    onChange={(e) => setCompatibilityThreshold(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer dark:bg-neutral-700"
                  />
                  <Button
                    variant="fresh"
                    size="xs"
                    onClick={() => onFilterByCompatibility(compatibilityThreshold / 100)}
                  >
                    Aplicar
                  </Button>
                </div>
              </div>
            )}

            {/* Cost Filter */}
            {onFilterByMaxCost && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Text size="sm" weight="medium">Costo Máximo</Text>
                  <Text size="sm" color="muted">${Math.round(maxCostThreshold / 1000)}k</Text>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100000"
                    step="5000"
                    value={maxCostThreshold}
                    onChange={(e) => setMaxCostThreshold(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer dark:bg-neutral-700"
                  />
                  <Button
                    variant="warm"
                    size="xs"
                    onClick={() => onFilterByMaxCost(maxCostThreshold)}
                  >
                    Aplicar
                  </Button>
                </div>
              </div>
            )}

            {/* Missing Ingredients Filter */}
            {onFilterByMaxMissingIngredients && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Text size="sm" weight="medium">Máximo Ingredientes Faltantes</Text>
                  <Text size="sm" color="muted">{maxMissingIngredients}</Text>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={maxMissingIngredients}
                    onChange={(e) => setMaxMissingIngredients(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer dark:bg-neutral-700"
                  />
                  <Button
                    variant="golden"
                    size="xs"
                    onClick={() => onFilterByMaxMissingIngredients(maxMissingIngredients)}
                  >
                    Aplicar
                  </Button>
                </div>
              </div>
            )}

            {/* Quick Reset */}
            <div className="flex justify-end pt-2 border-t border-neutral-200 dark:border-neutral-700">
              <Button
                variant="neutral"
                size="xs"
                onClick={() => {
                  setCompatibilityThreshold(70);
                  setMaxCostThreshold(50000);
                  setMaxMissingIngredients(3);
                }}
                leftIcon={<Icons.RotateCcw size="xs" />}
              >
                Resetear Filtros
              </Button>
            </div>
          </div>
        )}

        {/* Progress bar for visual representation */}
        {canMakeCount > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <Text size="xs" color="muted">Compatibilidad con tu despensa</Text>
              <Text size="xs" weight="medium" color="fresh">
                {compatibilityPercentage}%
              </Text>
            </div>
            <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-food-fresh-400 to-food-fresh-600 h-2 rounded-full transition-all duration-500"
                style={{ 
                  width: `${Math.min(compatibilityPercentage, 100)}%` 
                }}
              />
            </div>
          </div>
        )}

        {/* Insights */}
        {mostMissingIngredient && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-food-warm-50 dark:bg-food-warm-900/20">
            <Icons.TrendingUp size="sm" className="text-food-warm-600" />
            <div>
              <Text size="sm" weight="medium">Ingrediente más solicitado</Text>
              <Text size="xs" color="muted">
                <strong>{mostMissingIngredient}</strong> está en la mayoría de recetas faltantes
              </Text>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default AdvancedPantryFilter;