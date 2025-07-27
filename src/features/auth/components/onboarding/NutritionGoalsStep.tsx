'use client';

import { useState } from 'react';
import { Target, Activity, Heart, Apple, ArrowLeft, ArrowRight, Info, Sparkles, TrendingUp, Scale } from 'lucide-react';
import { motion } from 'framer-motion';
import { logger } from '@/services/logger';

import { useOnboardingStore } from '../../store/onboardingStore';
import { GlassCard, GlassButton } from './shared/GlassCard';

interface NutritionGoalsStepProps {
  onNext: () => void;
  onBack: () => void;
}

const NUTRITION_GOALS = [
  {
    id: 'weight_loss',
    label: 'Perder Peso',
    description: 'Reducir calorías y optimizar nutrientes',
    icon: Scale,
    color: 'from-blue-400 to-cyan-400',
    calories: 1800,
    protein: 30,
    carbs: 40,
    fat: 30
  },
  {
    id: 'muscle_gain',
    label: 'Ganar Músculo',
    description: 'Alto en proteínas para desarrollo muscular',
    icon: TrendingUp,
    color: 'from-purple-400 to-pink-400',
    calories: 2500,
    protein: 35,
    carbs: 45,
    fat: 20
  },
  {
    id: 'maintenance',
    label: 'Mantener Peso',
    description: 'Balance equilibrado de nutrientes',
    icon: Heart,
    color: 'from-green-400 to-emerald-400',
    calories: 2000,
    protein: 20,
    carbs: 50,
    fat: 30
  },
  {
    id: 'energy',
    label: 'Más Energía',
    description: 'Optimizado para rendimiento diario',
    icon: Activity,
    color: 'from-yellow-400 to-orange-400',
    calories: 2200,
    protein: 25,
    carbs: 55,
    fat: 20
  }
];

const ACTIVITY_LEVELS = [
  { id: 'sedentary', label: 'Sedentario', description: 'Poco o ningún ejercicio', multiplier: 1.2 },
  { id: 'light', label: 'Ligeramente Activo', description: 'Ejercicio 1-3 días/semana', multiplier: 1.375 },
  { id: 'moderate', label: 'Moderadamente Activo', description: 'Ejercicio 3-5 días/semana', multiplier: 1.55 },
  { id: 'very', label: 'Muy Activo', description: 'Ejercicio 6-7 días/semana', multiplier: 1.725 },
  { id: 'extra', label: 'Extra Activo', description: 'Ejercicio intenso diario', multiplier: 1.9 }
];

export function NutritionGoalsStep({ onNext, onBack }: NutritionGoalsStepProps) {
  const { data, savePreferences } = useOnboardingStore();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(data.preferences?.nutrition_goal || '');
  const [activityLevel, setActivityLevel] = useState(data.preferences?.activity_level || 'moderate');
  const [customizeNutrition, setCustomizeNutrition] = useState(false);
  const [customCalories, setCustomCalories] = useState(2000);
  const [macros, setMacros] = useState({
    protein: 20,
    carbs: 50,
    fat: 30
  });

  const handleGoalSelect = (goalId: string) => {
    setSelectedGoal(goalId);
    const goal = NUTRITION_GOALS.find(g => g.id === goalId);
    if (goal) {
      setCustomCalories(goal.calories);
      setMacros({
        protein: goal.protein,
        carbs: goal.carbs,
        fat: goal.fat
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const selectedGoalData = NUTRITION_GOALS.find(g => g.id === selectedGoal);
      const baseCalories = customizeNutrition ? customCalories : (selectedGoalData?.calories || 2000);
      const activityMultiplier = ACTIVITY_LEVELS.find(a => a.id === activityLevel)?.multiplier || 1.55;
      const adjustedCalories = Math.round(baseCalories * activityMultiplier);

      await savePreferences({
        nutrition_goal: selectedGoal,
        activity_level: activityLevel,
        nutrition_goals: {
          daily_calories: adjustedCalories,
          protein_percentage: macros.protein,
          carbs_percentage: macros.carbs,
          fat_percentage: macros.fat,
          fiber_grams: 25,
          sodium_mg: 2300,
        }
      });
      onNext();
    } catch (error: unknown) {
      logger.error('Error saving nutrition goals:', 'NutritionGoalsStep', error);
    } finally {
      setIsLoading(false);
    }
  };

  const adjustMacro = (macro: 'protein' | 'carbs' | 'fat', value: number) => {
    const newMacros = { ...macros, [macro]: value };
    const total = newMacros.protein + newMacros.carbs + newMacros.fat;
    
    if (total <= 100) {
      setMacros(newMacros);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-3xl font-bold text-white mb-2">
          Objetivos Nutricionales
        </h2>
        <p className="text-white/60">
          Personaliza tus metas nutricionales para alcanzar tus objetivos
        </p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Main Goals */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-400" />
            ¿Cuál es tu objetivo principal?
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {NUTRITION_GOALS.map((goal, index) => {
              const Icon = goal.icon;
              return (
                <motion.button
                  key={goal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.05 * index }}
                  type="button"
                  onClick={() => handleGoalSelect(goal.id)}
                  className={`p-4 rounded-xl border-2 transition-all backdrop-blur-xl ${
                    selectedGoal === goal.id
                      ? 'border-purple-400 bg-purple-500/20'
                      : 'border-white/20 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${goal.color} flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <h4 className="font-medium text-white">{goal.label}</h4>
                      <p className="text-sm text-white/60 mt-1">{goal.description}</p>
                      <div className="text-xs text-purple-300 mt-2">
                        ~{goal.calories} calorías/día base
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Activity Level */}
        <GlassCard>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-purple-400" />
            Nivel de Actividad Física
          </h3>
          <div className="space-y-2">
            {ACTIVITY_LEVELS.map((level, index) => (
              <motion.button
                key={level.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.05 * index }}
                type="button"
                onClick={() => setActivityLevel(level.id)}
                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                  activityLevel === level.id
                    ? 'border-purple-400 bg-purple-500/20'
                    : 'border-white/20 bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-white">{level.label}</div>
                    <div className="text-sm text-white/60">{level.description}</div>
                  </div>
                  {activityLevel === level.id && (
                    <div className="w-2 h-2 bg-purple-400 rounded-full" />
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        </GlassCard>

        {/* Macro Customization */}
        {selectedGoal && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
          >
            <GlassCard variant="highlight">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Apple className="h-5 w-5 text-purple-400" />
                  Distribución de Macronutrientes
                </h3>
                <button
                  type="button"
                  onClick={() => setCustomizeNutrition(!customizeNutrition)}
                  className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                >
                  {customizeNutrition ? 'Usar recomendados' : 'Personalizar'}
                </button>
              </div>
              
              <div className="space-y-4">
                {['protein', 'carbs', 'fat'].map((macro) => {
                  const labels = { protein: 'Proteínas', carbs: 'Carbohidratos', fat: 'Grasas' };
                  const colors = { 
                    protein: 'from-red-400 to-pink-400',
                    carbs: 'from-blue-400 to-cyan-400',
                    fat: 'from-yellow-400 to-orange-400'
                  };
                  
                  return (
                    <div key={macro}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-white">
                          {labels[macro as keyof typeof labels]}
                        </span>
                        <span className="text-sm text-purple-300">
                          {macros[macro as keyof typeof macros]}%
                        </span>
                      </div>
                      <div className="relative">
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${macros[macro as keyof typeof macros]}%` }}
                            transition={{ duration: 0.5 }}
                            className={`h-full bg-gradient-to-r ${colors[macro as keyof typeof colors]}`}
                          />
                        </div>
                        {customizeNutrition && (
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={macros[macro as keyof typeof macros]}
                            onChange={(e) => adjustMacro(macro as keyof typeof macros, parseInt(e.target.value))}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
                
                <div className="pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/60">Total</span>
                    <span className={`text-sm font-medium ${
                      macros.protein + macros.carbs + macros.fat === 100 
                        ? 'text-green-400' 
                        : 'text-red-400'
                    }`}>
                      {macros.protein + macros.carbs + macros.fat}%
                    </span>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Info Box */}
        <GlassCard className="flex gap-3">
          <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium mb-1 text-white">Ajustes Inteligentes</p>
            <p className="text-white/60">
              Ajustaremos automáticamente tus calorías según tu nivel de actividad. 
              Podrás modificar estos valores en cualquier momento desde tu perfil.
            </p>
          </div>
        </GlassCard>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6">
          <GlassButton
            onClick={onBack}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Atrás
          </GlassButton>
          
          <div className="flex gap-3">
            <GlassButton
              onClick={onNext}
              variant="ghost"
            >
              Omitir por ahora
            </GlassButton>
            
            <GlassButton
              type="submit"
              disabled={isLoading || !selectedGoal}
              variant="primary"
              className="flex items-center gap-2"
            >
              {isLoading ? 'Guardando...' : 'Continuar'}
              <ArrowRight className="w-4 h-4" />
            </GlassButton>
          </div>
        </div>
      </form>
    </div>
  );
}