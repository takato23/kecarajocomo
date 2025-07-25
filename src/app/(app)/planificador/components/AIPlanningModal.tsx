'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles,
  Calendar,
  Clock,
  Utensils,
  Settings,
  AlertCircle,
  Check,
  X,
  Loader2,
  Leaf,
  Fish,
  Beef,
  Egg,
  Apple,
  Cookie,
  Coffee,
  Sun,
  Moon,
  Heart,
  Shield,
  Zap,
  Target,
  Users,
  Info,
  ChevronRight
} from 'lucide-react';

import { Badge } from '@/components/design-system/Badge';
import { cn } from '@/lib/utils';

import type { 
  AIPlanningConfig,
  DietaryPreference,
  MealType,
  AIPlanningResult
} from '../types/planner';


// =============================================
// PROPS & INTERFACES
// =============================================

interface AIPlanningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (config: AIPlanningConfig) => Promise<AIPlanningResult>;
  currentWeek: Date;
  existingPreferences?: Partial<AIPlanningConfig>;
  isLoading?: boolean;
}

// =============================================
// CONSTANTS
// =============================================

const DIET_PREFERENCES: Array<{
  id: DietaryPreference;
  label: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}> = [
  {
    id: 'omnivore',
    label: 'Omnívoro',
    icon: <Utensils size={20} />,
    color: 'blue',
    description: 'Sin restricciones dietéticas'
  },
  {
    id: 'vegetarian',
    label: 'Vegetariano',
    icon: <Leaf size={20} />,
    color: 'green',
    description: 'Sin carne ni pescado'
  },
  {
    id: 'vegan',
    label: 'Vegano',
    icon: <Apple size={20} />,
    color: 'emerald',
    description: 'Sin productos animales'
  },
  {
    id: 'pescatarian',
    label: 'Pescetariano',
    icon: <Fish size={20} />,
    color: 'cyan',
    description: 'Vegetariano + pescado'
  },
  {
    id: 'keto',
    label: 'Keto',
    icon: <Egg size={20} />,
    color: 'purple',
    description: 'Bajo en carbohidratos'
  },
  {
    id: 'paleo',
    label: 'Paleo',
    icon: <Beef size={20} />,
    color: 'orange',
    description: 'Dieta paleolítica'
  },
  {
    id: 'glutenFree',
    label: 'Sin Gluten',
    icon: <Shield size={20} />,
    color: 'amber',
    description: 'Libre de gluten'
  },
  {
    id: 'dairyFree',
    label: 'Sin Lácteos',
    icon: <Coffee size={20} />,
    color: 'indigo',
    description: 'Sin productos lácteos'
  }
];

const MEAL_OPTIONS: Array<{
  type: MealType;
  label: string;
  icon: React.ReactNode;
  timeRange: string;
}> = [
  {
    type: 'desayuno',
    label: 'Desayuno',
    icon: <Sun size={18} />,
    timeRange: '6:00 - 10:00'
  },
  {
    type: 'almuerzo',
    label: 'Almuerzo',
    icon: <Sun size={18} className="rotate-45" />,
    timeRange: '12:00 - 15:00'
  },
  {
    type: 'merienda',
    label: 'Merienda',
    icon: <Cookie size={18} />,
    timeRange: '16:00 - 18:00'
  },
  {
    type: 'cena',
    label: 'Cena',
    icon: <Moon size={18} />,
    timeRange: '19:00 - 22:00'
  }
];

const GOAL_OPTIONS = [
  {
    id: 'balanced',
    label: 'Equilibrado',
    icon: <Target size={20} />,
    description: 'Nutrición balanceada'
  },
  {
    id: 'weightLoss',
    label: 'Pérdida de peso',
    icon: <Zap size={20} />,
    description: 'Déficit calórico'
  },
  {
    id: 'muscle',
    label: 'Ganancia muscular',
    icon: <Shield size={20} />,
    description: 'Alto en proteína'
  },
  {
    id: 'energy',
    label: 'Más energía',
    icon: <Sparkles size={20} />,
    description: 'Carbohidratos complejos'
  }
];

// =============================================
// MAIN COMPONENT
// =============================================

export const AIPlanningModal: React.FC<AIPlanningModalProps> = ({
  isOpen,
  onClose,
  onGenerate,
  currentWeek,
  existingPreferences,
  isLoading = false
}) => {
  // =============================================
  // STATE MANAGEMENT
  // =============================================
  
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [selectedMeals, setSelectedMeals] = useState<MealType[]>(['desayuno', 'almuerzo', 'merienda', 'cena']);
  const [dietPreferences, setDietPreferences] = useState<DietaryPreference[]>(
    existingPreferences?.dietaryPreferences || []
  );
  const [excludedIngredients, setExcludedIngredients] = useState<string[]>(
    existingPreferences?.excludedIngredients || []
  );
  const [servings, setServings] = useState(existingPreferences?.defaultServings || 4);
  const [budgetLevel, setBudgetLevel] = useState(existingPreferences?.budget || 'medium');
  const [prepTimeMax, setPrepTimeMax] = useState(existingPreferences?.maxPrepTime || 60);
  const [goal, setGoal] = useState(existingPreferences?.goal || 'balanced');
  const [variety, setVariety] = useState(existingPreferences?.preferVariety || true);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<string[]>([]);
  
  // =============================================
  // COMPUTED VALUES
  // =============================================
  
  const totalSlotsToGenerate = useMemo(() => {
    return selectedDays.length * selectedMeals.length;
  }, [selectedDays, selectedMeals]);
  
  const isValidConfig = useMemo(() => {
    return selectedDays.length > 0 && selectedMeals.length > 0;
  }, [selectedDays, selectedMeals]);
  
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  
  // =============================================
  // EVENT HANDLERS
  // =============================================
  
  const handleDayToggle = useCallback((day: number) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day].sort((a, b) => a - b)
    );
  }, []);
  
  const handleMealToggle = useCallback((meal: MealType) => {
    setSelectedMeals(prev => 
      prev.includes(meal)
        ? prev.filter(m => m !== meal)
        : [...prev, meal]
    );
  }, []);
  
  const handleDietToggle = useCallback((diet: DietaryPreference) => {
    setDietPreferences(prev => 
      prev.includes(diet)
        ? prev.filter(d => d !== diet)
        : [...prev, diet]
    );
  }, []);
  
  const handleAddExclusion = useCallback((ingredient: string) => {
    if (ingredient.trim() && !excludedIngredients.includes(ingredient.trim())) {
      setExcludedIngredients(prev => [...prev, ingredient.trim()]);
    }
  }, [excludedIngredients]);
  
  const handleRemoveExclusion = useCallback((ingredient: string) => {
    setExcludedIngredients(prev => prev.filter(i => i !== ingredient));
  }, []);
  
  const handleGenerate = useCallback(async () => {
    if (!isValidConfig) {
      setErrors(['Debes seleccionar al menos un día y una comida']);
      return;
    }
    
    const config: AIPlanningConfig = {
      selectedDays,
      selectedMeals,
      dietaryPreferences: dietPreferences,
      excludedIngredients,
      defaultServings: servings,
      budget: budgetLevel as any,
      maxPrepTime: prepTimeMax,
      preferVariety: variety,
      goal: goal as any,
      useSeasonalIngredients: true,
      considerPantryItems: true
    };
    
    try {
      await onGenerate(config);
      onClose();
    } catch (error) {
      setErrors(['Error al generar el plan. Por favor intenta de nuevo.']);
    }
  }, [
    isValidConfig,
    selectedDays,
    selectedMeals,
    dietPreferences,
    excludedIngredients,
    servings,
    budgetLevel,
    prepTimeMax,
    variety,
    goal,
    onGenerate,
    onClose
  ]);
  
  const handleNextStep = useCallback(() => {
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep]);
  
  const handlePrevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);
  
  // =============================================
  // RENDER HELPERS
  // =============================================
  
  const renderStep1 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar size={20} className="text-food-warm-600" />
          Selecciona los días
        </h4>
        <div className="grid grid-cols-7 gap-2">
          {dayNames.map((day, index) => {
            const isSelected = selectedDays.includes(index);
            return (
              <motion.button
                key={index}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleDayToggle(index)}
                className="relative"
              >
                <iOS26EnhancedCard
                  variant={isSelected ? 'aurora' : 'glass'}
                  elevation={isSelected ? 'medium' : 'low'}
                  interactive
                  gradient={isSelected}
                  className={cn(
                    "py-3 px-2 text-center cursor-pointer transition-all",
                    isSelected && "ring-2 ring-food-warm-400"
                  )}
                >
                  <div className={cn(
                    "text-sm font-medium",
                    isSelected ? "text-gray-800" : "text-gray-600"
                  )}>
                    {day}
                  </div>
                </iOS26EnhancedCard>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-food-warm-500 rounded-full flex items-center justify-center"
                  >
                    <Check size={12} className="text-white" />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>
        <p className="text-sm text-gray-600 mt-3">
          {selectedDays.length === 7 
            ? 'Toda la semana seleccionada' 
            : `${selectedDays.length} días seleccionados`}
        </p>
      </div>
      
      <div>
        <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Utensils size={20} className="text-food-fresh-600" />
          Selecciona las comidas
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {MEAL_OPTIONS.map((meal) => {
            const isSelected = selectedMeals.includes(meal.type);
            return (
              <motion.button
                key={meal.type}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleMealToggle(meal.type)}
                className="relative"
              >
                <iOS26EnhancedCard
                  variant={isSelected ? 'sunset' : 'glass'}
                  elevation={isSelected ? 'medium' : 'low'}
                  interactive
                  gradient={isSelected}
                  className={cn(
                    "p-4 cursor-pointer transition-all",
                    isSelected && "ring-2 ring-food-fresh-400"
                  )}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      isSelected 
                        ? "bg-white/20 text-white" 
                        : "bg-gray-100 text-gray-600"
                    )}>
                      {meal.icon}
                    </div>
                    <div>
                      <div className={cn(
                        "font-medium text-sm",
                        isSelected ? "text-gray-800" : "text-gray-700"
                      )}>
                        {meal.label}
                      </div>
                      <div className="text-xs text-gray-500">
                        {meal.timeRange}
                      </div>
                    </div>
                  </div>
                </iOS26EnhancedCard>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-food-fresh-500 rounded-full flex items-center justify-center"
                  >
                    <Check size={12} className="text-white" />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>
        
        <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100">
          <div className="flex items-center gap-2 text-sm">
            <Info size={16} className="text-blue-600" />
            <span className="text-gray-700">
              Se generarán <strong className="text-food-rich-600">{totalSlotsToGenerate} recetas</strong> en total
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
  
  const renderStep2 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Heart size={20} className="text-red-500" />
          Preferencias alimentarias
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {DIET_PREFERENCES.map((diet) => {
            const isSelected = dietPreferences.includes(diet.id);
            return (
              <motion.button
                key={diet.id}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleDietToggle(diet.id)}
                className="relative"
              >
                <iOS26EnhancedCard
                  variant={isSelected ? 'forest' : 'glass'}
                  elevation={isSelected ? 'medium' : 'low'}
                  interactive
                  gradient={isSelected}
                  className={cn(
                    "p-3 cursor-pointer transition-all",
                    isSelected && "ring-2 ring-green-400"
                  )}
                >
                  <div className="flex flex-col items-center gap-2 text-center">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      isSelected 
                        ? "bg-white/20 text-white" 
                        : "bg-gray-100 text-gray-600"
                    )}>
                      {diet.icon}
                    </div>
                    <div>
                      <div className={cn(
                        "font-medium text-sm",
                        isSelected ? "text-gray-800" : "text-gray-700"
                      )}>
                        {diet.label}
                      </div>
                      <div className="text-xs text-gray-500 line-clamp-1">
                        {diet.description}
                      </div>
                    </div>
                  </div>
                </iOS26EnhancedCard>
              </motion.button>
            );
          })}
        </div>
      </div>
      
      <div>
        <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Target size={20} className="text-purple-600" />
          Objetivo nutricional
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {GOAL_OPTIONS.map((option) => {
            const isSelected = goal === option.id;
            return (
              <motion.button
                key={option.id}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setGoal(option.id)}
                className="relative"
              >
                <iOS26EnhancedCard
                  variant={isSelected ? 'aurora' : 'glass'}
                  elevation={isSelected ? 'medium' : 'low'}
                  interactive
                  gradient={isSelected}
                  className={cn(
                    "p-3 cursor-pointer transition-all",
                    isSelected && "ring-2 ring-purple-400"
                  )}
                >
                  <div className="flex flex-col items-center gap-2 text-center">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      isSelected 
                        ? "bg-white/20 text-white" 
                        : "bg-gray-100 text-gray-600"
                    )}>
                      {option.icon}
                    </div>
                    <div>
                      <div className={cn(
                        "font-medium text-sm",
                        isSelected ? "text-gray-800" : "text-gray-700"
                      )}>
                        {option.label}
                      </div>
                      <div className="text-xs text-gray-500 line-clamp-1">
                        {option.description}
                      </div>
                    </div>
                  </div>
                </iOS26EnhancedCard>
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
  
  const renderStep3 = () => {
    const [ingredientInput, setIngredientInput] = useState('');
    
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-6"
      >
        <div>
          <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Settings size={20} className="text-gray-600" />
            Configuración adicional
          </h4>
          
          <div className="space-y-6">
            {/* Servings */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                <Users size={16} className="inline mr-1" />
                Porciones por receta
              </label>
              <div className="flex items-center gap-3">
                <iOS26LiquidButton
                  variant="glass"
                  size="sm"
                  onClick={() => setServings(Math.max(1, servings - 1))}
                  disabled={servings <= 1}
                >
                  -
                </iOS26LiquidButton>
                <iOS26EnhancedCard
                  variant="liquid"
                  elevation="low"
                  className="px-6 py-2 min-w-[80px] text-center"
                >
                  <span className="text-lg font-semibold">{servings}</span>
                </iOS26EnhancedCard>
                <iOS26LiquidButton
                  variant="glass"
                  size="sm"
                  onClick={() => setServings(Math.min(12, servings + 1))}
                  disabled={servings >= 12}
                >
                  +
                </iOS26LiquidButton>
              </div>
            </div>
            
            {/* Budget */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                💰 Presupuesto
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['low', 'medium', 'high'].map((level) => (
                  <iOS26LiquidButton
                    key={level}
                    variant={budgetLevel === level ? 'warm' : 'glass'}
                    size="sm"
                    onClick={() => setBudgetLevel(level)}
                    className="capitalize"
                  >
                    {level === 'low' ? 'Económico' : level === 'medium' ? 'Moderado' : 'Premium'}
                  </iOS26LiquidButton>
                ))}
              </div>
            </div>
            
            {/* Prep Time */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                <Clock size={16} className="inline mr-1" />
                Tiempo máximo de preparación
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="15"
                  max="120"
                  step="15"
                  value={prepTimeMax}
                  onChange={(e) => setPrepTimeMax(Number(e.target.value))}
                  className="flex-1"
                />
                <iOS26EnhancedCard
                  variant="glass"
                  elevation="low"
                  className="px-4 py-2 min-w-[100px] text-center"
                >
                  <span className="font-medium">{prepTimeMax} min</span>
                </iOS26EnhancedCard>
              </div>
            </div>
            
            {/* Variety */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <iOS26LiquidButton
                  variant={variety ? 'fresh' : 'glass'}
                  size="sm"
                  onClick={() => setVariety(!variety)}
                  className="w-12 h-6 p-0.5"
                >
                  <motion.div
                    className="w-5 h-5 bg-white rounded-full shadow-md"
                    animate={{ x: variety ? 24 : 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  />
                </iOS26LiquidButton>
                <span className="text-sm font-medium text-gray-700">
                  Preferir variedad en las recetas
                </span>
              </label>
              <p className="text-xs text-gray-500 ml-16 mt-1">
                {variety ? 'Se evitarán repeticiones' : 'Se pueden repetir recetas'}
              </p>
            </div>
            
            {/* Excluded Ingredients */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                <X size={16} className="inline mr-1" />
                Ingredientes a excluir
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={ingredientInput}
                  onChange={(e) => setIngredientInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddExclusion(ingredientInput);
                      setIngredientInput('');
                    }
                  }}
                  placeholder="Ej: nueces, mariscos..."
                  className="flex-1 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 
                           focus:outline-none focus:ring-2 focus:ring-food-warm-400 text-sm"
                />
                <iOS26LiquidButton
                  variant="glass"
                  size="sm"
                  onClick={() => {
                    handleAddExclusion(ingredientInput);
                    setIngredientInput('');
                  }}
                  disabled={!ingredientInput.trim()}
                >
                  Agregar
                </iOS26LiquidButton>
              </div>
              {excludedIngredients.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {excludedIngredients.map((ingredient) => (
                    <Badge
                      key={ingredient}
                      variant="error"
                      size="sm"
                      className="cursor-pointer"
                      onClick={() => handleRemoveExclusion(ingredient)}
                    >
                      {ingredient}
                      <X size={12} className="ml-1" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };
  
  const renderStep4 = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6"
    >
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-food-warm-400 to-food-rich-500 
                     flex items-center justify-center shadow-xl"
        >
          <Sparkles size={48} className="text-white" />
        </motion.div>
        
        <h4 className="text-2xl font-bold mb-2 bg-gradient-to-r from-food-warm-600 to-food-rich-600 
                       bg-clip-text text-transparent">
          ¡Todo listo!
        </h4>
        <p className="text-gray-600 mb-8">
          Tu plan de comidas será generado con las siguientes preferencias:
        </p>
      </div>
      
      <iOS26EnhancedCard
        variant="glass"
        elevation="low"
        className="p-6 space-y-4"
      >
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Días:</span>
            <p className="font-medium">
              {selectedDays.length === 7 
                ? 'Toda la semana' 
                : selectedDays.map(d => dayNames[d]).join(', ')}
            </p>
          </div>
          <div>
            <span className="text-gray-500">Comidas:</span>
            <p className="font-medium">
              {selectedMeals.length === 4 
                ? 'Todas las comidas'
                : selectedMeals.map(m => MEAL_OPTIONS.find(o => o.type === m)?.label).join(', ')}
            </p>
          </div>
          <div>
            <span className="text-gray-500">Total de recetas:</span>
            <p className="font-medium text-food-rich-600">{totalSlotsToGenerate}</p>
          </div>
          <div>
            <span className="text-gray-500">Porciones:</span>
            <p className="font-medium">{servings} por receta</p>
          </div>
          {dietPreferences.length > 0 && (
            <div className="col-span-2">
              <span className="text-gray-500">Preferencias:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {dietPreferences.map(pref => (
                  <Badge key={pref} variant="success" size="xs">
                    {DIET_PREFERENCES.find(d => d.id === pref)?.label}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {excludedIngredients.length > 0 && (
            <div className="col-span-2">
              <span className="text-gray-500">Excluidos:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {excludedIngredients.map(ing => (
                  <Badge key={ing} variant="error" size="xs">
                    {ing}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </iOS26EnhancedCard>
      
      {errors.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-red-50 border border-red-200"
        >
          {errors.map((error, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-red-700">
              <AlertCircle size={16} />
              {error}
            </div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
  
  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {[1, 2, 3, 4].map((step) => (
        <motion.div
          key={step}
          className={cn(
            "w-2 h-2 rounded-full transition-all",
            currentStep === step 
              ? "w-8 bg-food-warm-500" 
              : currentStep > step 
                ? "bg-food-warm-400" 
                : "bg-gray-300"
          )}
          animate={{
            scale: currentStep === step ? 1.2 : 1
          }}
        />
      ))}
    </div>
  );
  
  // =============================================
  // MAIN RENDER
  // =============================================
  
  if (!isOpen) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-4xl max-h-[90vh] overflow-hidden"
        >
          <iOS26EnhancedCard
            variant="aurora"
            elevation="floating"
            liquidEffect={true}
            morphEffect={true}
            gradient={true}
            className="p-0"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-food-warm-400 to-food-rich-500 
                                  flex items-center justify-center shadow-lg">
                    <Sparkles size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-food-warm-600 to-food-rich-600 
                                   bg-clip-text text-transparent">
                      Generar Plan con IA
                    </h3>
                    <p className="text-sm text-gray-600">
                      Paso {currentStep} de 4
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 
                           flex items-center justify-center transition-colors"
                >
                  <X size={20} className="text-gray-600" />
                </motion.button>
              </div>
              
              {renderStepIndicator()}
            </div>
            
            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <AnimatePresence mode="wait">
                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {currentStep === 3 && renderStep3()}
                {currentStep === 4 && renderStep4()}
              </AnimatePresence>
            </div>
            
            {/* Footer */}
            <div className="p-6 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <iOS26LiquidButton
                  variant="glass"
                  onClick={currentStep === 1 ? onClose : handlePrevStep}
                  disabled={isLoading}
                >
                  {currentStep === 1 ? 'Cancelar' : 'Anterior'}
                </iOS26LiquidButton>
                
                <div className="flex items-center gap-3">
                  {currentStep < 4 ? (
                    <iOS26LiquidButton
                      variant="fresh"
                      onClick={handleNextStep}
                      disabled={!isValidConfig || isLoading}
                      rightIcon={<ChevronRight size={16} />}
                      glow
                    >
                      Siguiente
                    </iOS26LiquidButton>
                  ) : (
                    <iOS26LiquidButton
                      variant="warm"
                      onClick={handleGenerate}
                      disabled={isLoading}
                      leftIcon={isLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                      glow
                      className="min-w-[150px]"
                    >
                      {isLoading ? 'Generando...' : 'Generar Plan'}
                    </iOS26LiquidButton>
                  )}
                </div>
              </div>
            </div>
          </iOS26EnhancedCard>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AIPlanningModal;