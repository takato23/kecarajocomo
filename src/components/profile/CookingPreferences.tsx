'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { logger } from '@/services/logger';
import { 
  ChefHat,
  Clock,
  Calendar,
  Utensils,
  DollarSign,
  Gauge,
  Timer,
  Package,
  Zap,
  Flame,
  Droplet,
  Wind,
  AlertCircle,
  Check
} from 'lucide-react';

import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { UserPreferences, MealType } from '@/types/profile';

interface CookingPreferencesProps {
  preferences: UserPreferences;
  onUpdate: (updates: Partial<UserPreferences>) => Promise<void>;
}

const COOKING_METHODS = [
  { value: 'Hornear', icon: Flame, color: 'text-orange-600' },
  { value: 'Asar', icon: Flame, color: 'text-red-600' },
  { value: 'Hervir', icon: Droplet, color: 'text-blue-600' },
  { value: 'Freír', icon: Zap, color: 'text-yellow-600' },
  { value: 'Vapor', icon: Wind, color: 'text-cyan-600' },
  { value: 'Plancha', icon: Flame, color: 'text-gray-600' },
  { value: 'Microondas', icon: Zap, color: 'text-purple-600' },
  { value: 'Olla de presión', icon: Gauge, color: 'text-green-600' },
  { value: 'Slow cooker', icon: Timer, color: 'text-amber-600' }
];

const KITCHEN_TOOLS = [
  'Horno', 'Estufa', 'Microondas', 'Licuadora', 'Procesador de alimentos',
  'Batidora', 'Olla de presión', 'Freidora de aire', 'Plancha',
  'Tostadora', 'Slow cooker', 'Thermomix'
];

const MEAL_TYPES: Array<{ value: MealType; label: string }> = [
  { value: 'breakfast', label: 'Desayuno' },
  { value: 'lunch', label: 'Almuerzo' },
  { value: 'dinner', label: 'Cena' },
  { value: 'snack', label: 'Snack' },
  { value: 'dessert', label: 'Postre' }
];

const SKILL_LEVELS = [
  { value: 'beginner', label: 'Principiante', description: 'Recetas simples y básicas' },
  { value: 'intermediate', label: 'Intermedio', description: 'Técnicas moderadas' },
  { value: 'advanced', label: 'Avanzado', description: 'Platos complejos' },
  { value: 'expert', label: 'Experto', description: 'Alta cocina' }
];

// Loading skeleton component
const CookingPreferencesSkeleton = () => (
  <div className="space-y-6">
    <Skeleton className="h-48 w-full rounded-2xl" />
    <Skeleton className="h-32 w-full rounded-2xl" />
    <Skeleton className="h-64 w-full rounded-2xl" />
    <Skeleton className="h-40 w-full rounded-2xl" />
  </div>
);

export const CookingPreferences: React.FC<CookingPreferencesProps> = ({ 
  preferences, 
  onUpdate 
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate completion percentage
  const completionPercentage = useMemo(() => {
    let completed = 0;
    const total = 6;
    
    if (preferences.cookingSkillLevel) completed++;
    if (preferences.cookingPreferences?.timeAvailable?.weekday) completed++;
    if (preferences.cookingPreferences?.cookingMethods?.length > 0) completed++;
    if (preferences.cookingPreferences?.kitchenTools?.length > 0) completed++;
    if (preferences.planningPreferences?.mealTypes?.length > 0) completed++;
    if (preferences.budget?.weekly > 0) completed++;
    
    return Math.round((completed / total) * 100);
  }, [preferences]);

  // Handle skill level update
  const handleSkillLevelUpdate = useCallback(async (skillLevel: string) => {
    setIsUpdating(true);
    setError(null);
    try {
      await onUpdate({ 
        cookingSkillLevel: skillLevel as UserPreferences['cookingSkillLevel'] 
      });
    } catch (err) {
      setError('Error al actualizar nivel de habilidad');
      logger.error(err, 'CookingPreferences');
    } finally {
      setIsUpdating(false);
    }
  }, [onUpdate]);

  // Handle time available update
  const handleTimeUpdate = useCallback(async (timeType: 'weekday' | 'weekend', minutes: number) => {
    setIsUpdating(true);
    setError(null);
    try {
      await onUpdate({
        cookingPreferences: {
          ...preferences.cookingPreferences,
          timeAvailable: {
            ...preferences.cookingPreferences?.timeAvailable,
            [timeType]: minutes
          }
        }
      });
    } catch (err) {
      setError('Error al actualizar tiempo disponible');
      logger.error(err, 'CookingPreferences');
    } finally {
      setIsUpdating(false);
    }
  }, [preferences.cookingPreferences, onUpdate]);

  // Toggle cooking method
  const toggleCookingMethod = useCallback(async (method: string) => {
    setIsUpdating(true);
    setError(null);
    try {
      const current = preferences.cookingPreferences?.cookingMethods || [];
      const updated = current.includes(method)
        ? current.filter(m => m !== method)
        : [...current, method];
      
      await onUpdate({
        cookingPreferences: {
          ...preferences.cookingPreferences,
          cookingMethods: updated
        }
      });
    } catch (err) {
      setError('Error al actualizar métodos de cocina');
      logger.error(err, 'CookingPreferences');
    } finally {
      setIsUpdating(false);
    }
  }, [preferences.cookingPreferences, onUpdate]);

  // Toggle kitchen tool
  const toggleKitchenTool = useCallback(async (tool: string) => {
    setIsUpdating(true);
    setError(null);
    try {
      const current = preferences.cookingPreferences?.kitchenTools || [];
      const updated = current.includes(tool)
        ? current.filter(t => t !== tool)
        : [...current, tool];
      
      await onUpdate({
        cookingPreferences: {
          ...preferences.cookingPreferences,
          kitchenTools: updated
        }
      });
    } catch (err) {
      setError('Error al actualizar herramientas de cocina');
      logger.error(err, 'CookingPreferences');
    } finally {
      setIsUpdating(false);
    }
  }, [preferences.cookingPreferences, onUpdate]);

  // Toggle meal type
  const toggleMealType = useCallback(async (mealType: MealType) => {
    setIsUpdating(true);
    setError(null);
    try {
      const current = preferences.planningPreferences?.mealTypes || [];
      const updated = current.includes(mealType)
        ? current.filter(m => m !== mealType)
        : [...current, mealType];
      
      await onUpdate({
        planningPreferences: {
          ...preferences.planningPreferences,
          mealTypes: updated
        }
      });
    } catch (err) {
      setError('Error al actualizar tipos de comida');
      logger.error(err, 'CookingPreferences');
    } finally {
      setIsUpdating(false);
    }
  }, [preferences.planningPreferences, onUpdate]);

  // Update budget
  const handleBudgetUpdate = useCallback(async (amount: number) => {
    setIsUpdating(true);
    setError(null);
    try {
      await onUpdate({
        budget: {
          ...preferences.budget,
          weekly: amount,
          monthly: amount * 4
        }
      });
    } catch (err) {
      setError('Error al actualizar presupuesto');
      logger.error(err, 'CookingPreferences');
    } finally {
      setIsUpdating(false);
    }
  }, [preferences.budget, onUpdate]);

  // Update planning preferences
  const handlePlanningUpdate = useCallback(async (field: string, value: any) => {
    setIsUpdating(true);
    setError(null);
    try {
      await onUpdate({
        planningPreferences: {
          ...preferences.planningPreferences,
          [field]: value
        }
      });
    } catch (err) {
      setError('Error al actualizar preferencias de planificación');
      logger.error(err, 'CookingPreferences');
    } finally {
      setIsUpdating(false);
    }
  }, [preferences.planningPreferences, onUpdate]);

  if (isLoading) {
    return <CookingPreferencesSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cooking Skill Level */}
      <iOS26LiquidCard variant="medium" glow shimmer>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Nivel de Habilidad</h3>
          </div>
          
          <RadioGroup
            value={preferences.cookingSkillLevel || 'intermediate'}
            onValueChange={handleSkillLevelUpdate}
            disabled={isUpdating}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {SKILL_LEVELS.map(({ value, label, description }) => {
                const isActive = preferences.cookingSkillLevel === value;
                
                return (
                  <motion.div
                    key={value}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Label
                      htmlFor={value}
                      className={`
                        block p-4 rounded-xl border-2 cursor-pointer transition-all
                        ${isActive 
                          ? 'border-primary bg-primary/5' 
                          : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                        }
                        ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                    >
                      <div className="flex items-start gap-3">
                        <RadioGroupItem value={value} id={value} className="mt-1" />
                        <div className="flex-1">
                          <div className="font-medium">{label}</div>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {description}
                          </p>
                        </div>
                        {isActive && (
                          <Check className="w-5 h-5 text-primary" />
                        )}
                      </div>
                    </Label>
                  </motion.div>
                );
              })}
            </div>
          </RadioGroup>
        </div>
      </iOS26LiquidCard>

      {/* Time Available */}
      <iOS26LiquidCard variant="subtle" morph>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <h4 className="font-medium">Tiempo Disponible para Cocinar</h4>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Entre semana</Label>
                <span className="text-sm font-medium">
                  {preferences.cookingPreferences?.timeAvailable?.weekday || 30} min
                </span>
              </div>
              <Slider
                value={[preferences.cookingPreferences?.timeAvailable?.weekday || 30]}
                onValueChange={([value]) => handleTimeUpdate('weekday', value)}
                min={15}
                max={120}
                step={15}
                disabled={isUpdating}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>15 min</span>
                <span>2 horas</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Fin de semana</Label>
                <span className="text-sm font-medium">
                  {preferences.cookingPreferences?.timeAvailable?.weekend || 60} min
                </span>
              </div>
              <Slider
                value={[preferences.cookingPreferences?.timeAvailable?.weekend || 60]}
                onValueChange={([value]) => handleTimeUpdate('weekend', value)}
                min={15}
                max={180}
                step={15}
                disabled={isUpdating}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>15 min</span>
                <span>3 horas</span>
              </div>
            </div>
          </div>
        </div>
      </iOS26LiquidCard>

      {/* Cooking Methods */}
      <iOS26LiquidCard variant="subtle" morph>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Utensils className="w-5 h-5 text-green-600" />
            <h4 className="font-medium">Métodos de Cocina Preferidos</h4>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {COOKING_METHODS.map(({ value, icon: Icon, color }) => {
              const isActive = preferences.cookingPreferences?.cookingMethods?.includes(value);
              
              return (
                <motion.button
                  key={value}
                  onClick={() => toggleCookingMethod(value)}
                  disabled={isUpdating}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`
                    p-3 rounded-lg border transition-all flex items-center gap-2
                    ${isActive 
                      ? 'border-primary bg-primary/10' 
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                    }
                    ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : color}`} />
                  <span className={`text-sm font-medium ${isActive ? 'text-primary' : ''}`}>
                    {value}
                  </span>
                  {isActive && <Check className="w-4 h-4 text-primary ml-auto" />}
                </motion.button>
              );
            })}
          </div>
        </div>
      </iOS26LiquidCard>

      {/* Kitchen Tools */}
      <iOS26LiquidCard variant="subtle" morph>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-purple-600" />
            <h4 className="font-medium">Herramientas de Cocina</h4>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <AnimatePresence mode="popLayout">
              {KITCHEN_TOOLS.map((tool) => {
                const isActive = preferences.cookingPreferences?.kitchenTools?.includes(tool);
                
                return (
                  <motion.div
                    key={tool}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Badge
                      variant={isActive ? "default" : "outline"}
                      className={`
                        cursor-pointer transition-all
                        ${isActive ? 'bg-purple-500 hover:bg-purple-600' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}
                        ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                      onClick={() => !isUpdating && toggleKitchenTool(tool)}
                    >
                      {tool}
                      {isActive && <Check className="w-3 h-3 ml-1" />}
                    </Badge>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </iOS26LiquidCard>

      {/* Budget */}
      <iOS26LiquidCard variant="subtle" morph>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <h4 className="font-medium">Presupuesto Semanal</h4>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Presupuesto para comida</Label>
              <span className="text-lg font-semibold">
                ${preferences.budget?.weekly || 100}
              </span>
            </div>
            <Slider
              value={[preferences.budget?.weekly || 100]}
              onValueChange={([value]) => handleBudgetUpdate(value)}
              min={50}
              max={500}
              step={10}
              disabled={isUpdating}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>$50</span>
              <span>$500</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Aproximadamente ${Math.round((preferences.budget?.weekly || 100) / 7)} por día
            </p>
          </div>
        </div>
      </iOS26LiquidCard>

      {/* Planning Preferences */}
      <iOS26LiquidCard variant="subtle" morph>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-600" />
            <h4 className="font-medium">Preferencias de Planificación</h4>
          </div>
          
          {/* Planning Horizon */}
          <div className="space-y-2">
            <Label>Horizonte de planificación</Label>
            <Select
              value={preferences.planningPreferences?.planningHorizon || 'weekly'}
              onValueChange={(value) => handlePlanningUpdate('planningHorizon', value)}
              disabled={isUpdating}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Diario</SelectItem>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="biweekly">Quincenal</SelectItem>
                <SelectItem value="monthly">Mensual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Meal Types */}
          <div className="space-y-2">
            <Label>Tipos de comida a planificar</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {MEAL_TYPES.map(({ value, label }) => {
                const isActive = preferences.planningPreferences?.mealTypes?.includes(value);
                
                return (
                  <motion.button
                    key={value}
                    onClick={() => toggleMealType(value)}
                    disabled={isUpdating}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`
                      p-2 rounded border text-sm transition-all
                      ${isActive 
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300' 
                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                      }
                      ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    {label}
                  </motion.button>
                );
              })}
            </div>
          </div>
          
          {/* Additional Options */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="batch">Cocina por lotes</Label>
                <p className="text-sm text-muted-foreground">
                  Preparar varias porciones a la vez
                </p>
              </div>
              <Switch
                id="batch"
                checked={preferences.planningPreferences?.batchCooking || false}
                onCheckedChange={(checked) => handlePlanningUpdate('batchCooking', checked)}
                disabled={isUpdating}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Estrategia para sobras</Label>
              <Select
                value={preferences.planningPreferences?.leftoverStrategy || 'incorporate'}
                onValueChange={(value) => handlePlanningUpdate('leftoverStrategy', value)}
                disabled={isUpdating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="incorporate">Incorporar en próximas comidas</SelectItem>
                  <SelectItem value="freeze">Congelar para después</SelectItem>
                  <SelectItem value="avoid">Evitar sobras</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Preferencia de variedad</Label>
              <Select
                value={preferences.planningPreferences?.varietyPreference || 'medium'}
                onValueChange={(value) => handlePlanningUpdate('varietyPreference', value)}
                disabled={isUpdating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">Alta - Muchas recetas diferentes</SelectItem>
                  <SelectItem value="medium">Media - Balance entre variedad y repetición</SelectItem>
                  <SelectItem value="low">Baja - Preferir repetir favoritos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </iOS26LiquidCard>

      {/* Save Indicator */}
      <AnimatePresence>
        {isUpdating && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
            </motion.div>
            Guardando cambios...
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

CookingPreferences.displayName = 'CookingPreferences';

