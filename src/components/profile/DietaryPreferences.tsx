'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { logger } from '@/services/logger';
import { 
  Apple, 
  Cookie, 
  Wheat, 
  Fish, 
  Leaf, 
  AlertCircle,
  X,
  Check,
  ChevronRight
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import type { 
  UserPreferences, 
  DietaryRestriction, 
  Allergy,
  HouseholdMember 
} from '@/types/profile';

interface DietaryPreferencesProps {
  preferences: UserPreferences;
  householdMembers: HouseholdMember[];
  onUpdate: (updates: Partial<UserPreferences>) => Promise<void>;
}

// Dietary restriction options with icons
const DIETARY_OPTIONS: Array<{
  value: DietaryRestriction;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}> = [
  { value: 'vegetarian', label: 'Vegetariano', icon: Leaf, description: 'Sin carne ni pescado' },
  { value: 'vegan', label: 'Vegano', icon: Leaf, description: 'Sin productos animales' },
  { value: 'gluten_free', label: 'Sin gluten', icon: Wheat, description: 'Apto para celíacos' },
  { value: 'dairy_free', label: 'Sin lácteos', icon: Cookie, description: 'Sin leche ni derivados' },
  { value: 'pescatarian', label: 'Pescetariano', icon: Fish, description: 'Vegetariano + pescado' },
  { value: 'keto', label: 'Keto', icon: Apple, description: 'Baja en carbohidratos' },
  { value: 'paleo', label: 'Paleo', icon: Apple, description: 'Dieta paleolítica' },
  { value: 'low_carb', label: 'Bajo en carbohidratos', icon: Wheat, description: 'Reducido en carbohidratos' },
  { value: 'low_sodium', label: 'Bajo en sodio', icon: Check, description: 'Reducido en sal' },
  { value: 'halal', label: 'Halal', icon: Check, description: 'Certificado halal' },
  { value: 'kosher', label: 'Kosher', icon: Check, description: 'Certificado kosher' },
];

// Allergy options
const ALLERGY_OPTIONS: Array<{
  value: Allergy;
  label: string;
  severity?: 'low' | 'medium' | 'high';
}> = [
  { value: 'peanuts', label: 'Cacahuetes', severity: 'high' },
  { value: 'tree_nuts', label: 'Frutos secos', severity: 'high' },
  { value: 'milk', label: 'Leche', severity: 'medium' },
  { value: 'eggs', label: 'Huevos', severity: 'medium' },
  { value: 'wheat', label: 'Trigo', severity: 'medium' },
  { value: 'soy', label: 'Soja', severity: 'low' },
  { value: 'fish', label: 'Pescado', severity: 'high' },
  { value: 'shellfish', label: 'Mariscos', severity: 'high' },
  { value: 'sesame', label: 'Sésamo', severity: 'low' },
];

// Cuisine preferences
const CUISINE_OPTIONS = [
  'Mediterránea', 'Italiana', 'Mexicana', 'Asiática', 'India',
  'Japonesa', 'China', 'Tailandesa', 'Española', 'Francesa',
  'Griega', 'Árabe', 'Peruana', 'Argentina', 'Brasileña'
];

// Loading skeleton component
const DietaryPreferencesSkeleton = () => (
  <div className="space-y-6">
    <Skeleton className="h-32 w-full rounded-2xl" />
    <Skeleton className="h-64 w-full rounded-2xl" />
    <Skeleton className="h-48 w-full rounded-2xl" />
    <Skeleton className="h-56 w-full rounded-2xl" />
  </div>
);

export const DietaryPreferences: React.FC<DietaryPreferencesProps> = ({
  preferences,
  householdMembers,
  onUpdate
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showAllCuisines, setShowAllCuisines] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate completion percentage
  const completionPercentage = useMemo(() => {
    let completed = 0;
    const total = 4;
    
    if (preferences.dietaryRestrictions?.length > 0) completed++;
    if (preferences.allergies?.length > 0) completed++;
    if (preferences.cuisinePreferences?.length > 0) completed++;
    if (preferences.nutritionGoals?.length > 0) completed++;
    
    return Math.round((completed / total) * 100);
  }, [preferences]);

  // Aggregate household dietary needs
  const householdDietaryNeeds = useMemo(() => {
    const allRestrictions = new Set(preferences.dietaryRestrictions || []);
    const allAllergies = new Set(preferences.allergies || []);
    
    householdMembers.forEach(member => {
      member.dietaryRestrictions?.forEach(r => allRestrictions.add(r));
      member.allergies?.forEach(a => allAllergies.add(a));
    });
    
    return {
      restrictions: Array.from(allRestrictions),
      allergies: Array.from(allAllergies)
    };
  }, [preferences, householdMembers]);

  // Handle dietary restriction toggle
  const handleRestrictionToggle = useCallback(async (restriction: DietaryRestriction) => {
    setIsUpdating(true);
    setError(null);
    try {
      const current = preferences.dietaryRestrictions || [];
      const updated = current.includes(restriction)
        ? current.filter(r => r !== restriction)
        : [...current, restriction];
      
      await onUpdate({ dietaryRestrictions: updated });
    } catch (err) {
      setError('Error al actualizar restricciones dietéticas');
      logger.error(err, 'DietaryPreferences');
    } finally {
      setIsUpdating(false);
    }
  }, [preferences.dietaryRestrictions, onUpdate]);

  // Handle allergy toggle
  const handleAllergyToggle = useCallback(async (allergy: Allergy) => {
    setIsUpdating(true);
    setError(null);
    try {
      const current = preferences.allergies || [];
      const updated = current.includes(allergy)
        ? current.filter(a => a !== allergy)
        : [...current, allergy];
      
      await onUpdate({ allergies: updated });
    } catch (err) {
      setError('Error al actualizar alergias');
      logger.error(err, 'DietaryPreferences');
    } finally {
      setIsUpdating(false);
    }
  }, [preferences.allergies, onUpdate]);

  // Handle cuisine preference toggle
  const handleCuisineToggle = useCallback(async (cuisine: string) => {
    setIsUpdating(true);
    setError(null);
    try {
      const current = preferences.cuisinePreferences || [];
      const updated = current.includes(cuisine)
        ? current.filter(c => c !== cuisine)
        : [...current, cuisine];
      
      await onUpdate({ cuisinePreferences: updated });
    } catch (err) {
      setError('Error al actualizar preferencias de cocina');
      logger.error(err, 'DietaryPreferences');
    } finally {
      setIsUpdating(false);
    }
  }, [preferences.cuisinePreferences, onUpdate]);

  // Handle nutrition goal toggle
  const handleNutritionGoalToggle = useCallback(async (goal: string) => {
    setIsUpdating(true);
    setError(null);
    try {
      const current = preferences.nutritionGoals || [];
      const updated = current.includes(goal)
        ? current.filter(g => g !== goal)
        : [...current, goal];
      
      await onUpdate({ nutritionGoals: updated });
    } catch (err) {
      setError('Error al actualizar objetivos nutricionales');
      logger.error(err, 'DietaryPreferences');
    } finally {
      setIsUpdating(false);
    }
  }, [preferences.nutritionGoals, onUpdate]);

  if (isLoading) {
    return <DietaryPreferencesSkeleton />;
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

      {/* Progress Overview */}
      <iOS26LiquidCard variant="medium" glow shimmer>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Preferencias Dietéticas</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Personaliza tu experiencia culinaria según tus necesidades
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Completado</span>
              <span className="font-medium">{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>

          {householdDietaryNeeds.restrictions.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Tu hogar tiene {householdDietaryNeeds.restrictions.length} restricciones dietéticas
                y {householdDietaryNeeds.allergies.length} alergias combinadas.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </iOS26LiquidCard>

      {/* Dietary Restrictions */}
      <iOS26LiquidCard variant="subtle" morph>
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <Leaf className="w-5 h-5 text-green-600" />
            Restricciones Dietéticas
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {DIETARY_OPTIONS.map(({ value, label, icon: Icon, description }) => {
              const isActive = preferences.dietaryRestrictions?.includes(value);
              const isHouseholdNeed = householdDietaryNeeds.restrictions.includes(value);
              
              return (
                <motion.div
                  key={value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <button
                    onClick={() => handleRestrictionToggle(value)}
                    disabled={isUpdating}
                    className={`
                      w-full p-4 rounded-xl border-2 transition-all
                      ${isActive 
                        ? 'border-green-500 bg-green-50 dark:bg-green-950' 
                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                      }
                      ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={`w-5 h-5 mt-0.5 ${isActive ? 'text-green-600' : 'text-gray-500'}`} />
                      <div className="flex-1 text-left">
                        <div className="font-medium flex items-center gap-2">
                          {label}
                          {isHouseholdNeed && !isActive && (
                            <Badge variant="outline" className="text-xs">
                              Familiar
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {description}
                        </p>
                      </div>
                      {isActive && (
                        <Check className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </iOS26LiquidCard>

      {/* Allergies */}
      <iOS26LiquidCard variant="subtle" morph>
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            Alergias
          </h4>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {ALLERGY_OPTIONS.map(({ value, label, severity }) => {
              const isActive = preferences.allergies?.includes(value);
              const isHouseholdNeed = householdDietaryNeeds.allergies.includes(value);
              
              return (
                <motion.div
                  key={value}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <button
                    onClick={() => handleAllergyToggle(value)}
                    disabled={isUpdating}
                    className={`
                      w-full p-3 rounded-lg border transition-all
                      ${isActive 
                        ? 'border-red-500 bg-red-50 dark:bg-red-950' 
                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                      }
                      ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${isActive ? 'text-red-700 dark:text-red-300' : ''}`}>
                        {label}
                      </span>
                      {(isActive || isHouseholdNeed) && (
                        <Badge 
                          variant={isActive ? "destructive" : "outline"} 
                          className="text-xs"
                        >
                          {isActive ? '✓' : 'Familiar'}
                        </Badge>
                      )}
                    </div>
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </iOS26LiquidCard>

      {/* Cuisine Preferences */}
      <iOS26LiquidCard variant="subtle" morph>
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <Cookie className="w-5 h-5 text-orange-600" />
            Cocinas Favoritas
          </h4>
          
          <div className="flex flex-wrap gap-2">
            <AnimatePresence mode="popLayout">
              {(showAllCuisines ? CUISINE_OPTIONS : CUISINE_OPTIONS.slice(0, 8)).map((cuisine) => {
                const isActive = preferences.cuisinePreferences?.includes(cuisine);
                
                return (
                  <motion.div
                    key={cuisine}
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
                        ${isActive ? 'bg-orange-500 hover:bg-orange-600' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}
                        ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                      onClick={() => !isUpdating && handleCuisineToggle(cuisine)}
                    >
                      {cuisine}
                      {isActive && <X className="w-3 h-3 ml-1" />}
                    </Badge>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            
            {!showAllCuisines && CUISINE_OPTIONS.length > 8 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => setShowAllCuisines(true)}
                >
                  +{CUISINE_OPTIONS.length - 8} más
                  <ChevronRight className="w-3 h-3 ml-1" />
                </Badge>
              </motion.div>
            )}
          </div>
        </div>
      </iOS26LiquidCard>

      {/* Nutrition Goals */}
      <iOS26LiquidCard variant="subtle" morph>
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <Apple className="w-5 h-5 text-purple-600" />
            Objetivos Nutricionales
          </h4>
          
          <div className="space-y-3">
            {[
              { id: 'high_protein', label: 'Alto en proteína', description: 'Para desarrollo muscular' },
              { id: 'low_calorie', label: 'Bajo en calorías', description: 'Control de peso' },
              { id: 'high_fiber', label: 'Alto en fibra', description: 'Salud digestiva' },
              { id: 'balanced', label: 'Balanceado', description: 'Nutrición equilibrada' },
              { id: 'heart_healthy', label: 'Saludable para el corazón', description: 'Bajo en grasas saturadas' },
            ].map(({ id, label, description }) => {
              const isActive = preferences.nutritionGoals?.includes(id);
              
              return (
                <motion.div 
                  key={id}
                  whileHover={{ x: 4 }}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex-1">
                    <Label htmlFor={id} className="font-medium cursor-pointer">
                      {label}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {description}
                    </p>
                  </div>
                  <Switch
                    id={id}
                    checked={isActive}
                    onCheckedChange={() => handleNutritionGoalToggle(id)}
                    disabled={isUpdating}
                  />
                </motion.div>
              );
            })}
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

DietaryPreferences.displayName = 'DietaryPreferences';