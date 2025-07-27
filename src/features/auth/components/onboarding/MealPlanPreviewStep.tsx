'use client';

import { useState, useEffect } from 'react'
import geminiConfig from '@/lib/config/gemini.config';;
import { Calendar, Clock, Users, RefreshCw, CheckCircle, ChefHat, Sparkles, Heart, Utensils, ArrowLeft, ArrowRight, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { logger } from '@/services/logger';
import { getAIService } from '@/services/ai/UnifiedAIService';

import { useOnboardingStore } from '../../store/onboardingStore';
import { GlassCard, GlassButton } from './shared/GlassCard';

interface MealPlanPreviewStepProps {
  onNext: () => void;
  onBack: () => void;
}

interface MealDay {
  day: string;
  meals: {
    breakfast?: { name: string; time: number; calories: number };
    lunch?: { name: string; time: number; calories: number };
    dinner?: { name: string; time: number; calories: number };
    snack?: { name: string; time: number; calories: number };
  };
  totalCalories: number;
  totalTime: number;
}

const COOKING_PERSONAS_MAP = {
  beginner: { label: 'Principiante Entusiasta', icon: Heart },
  home_cook: { label: 'Cocinero Casero', icon: Utensils },
  foodie: { label: 'Foodie Aventurero', icon: ChefHat },
  health_conscious: { label: 'Saludable y Consciente', icon: Heart },
};

export function MealPlanPreviewStep({ onNext, onBack }: MealPlanPreviewStepProps) {
  const { data } = useOnboardingStore();
  const [mealPlan, setMealPlan] = useState<MealDay[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);

  useEffect(() => {
    if (!hasGenerated && !isLoading) {
      handleGenerateMealPlan();
    }
  }, []);

  const handleGenerateMealPlan = async () => {
    setHasGenerated(true);
    setIsLoading(true);
    setError(null);
    
    try {
      const apiKey = geminiConfig.getApiKey();
      if (!apiKey) throw new Error('Gemini API key not configured');

      const aiService = getAIService();

      const persona = COOKING_PERSONAS_MAP[data.profile?.cooking_persona || 'beginner'];
      const dietaryRestrictions = data.preferences?.dietary_restrictions || [];
      const allergies = data.preferences?.allergies || [];
      const pantryItems = data.pantryItems || [];
      
      const prompt = `Genera un plan de comidas personalizado para 5 días basándote en esta información:
      
      Perfil del usuario:
      - Nombre: ${data.profile?.display_name || 'Usuario'}
      - Estilo de cocina: ${persona.label}
      - Restricciones dietéticas: ${dietaryRestrictions.length > 0 ? dietaryRestrictions.join(', ') : 'Ninguna'}
      - Alergias: ${allergies.length > 0 ? allergies.join(', ') : 'Ninguna'}
      - Ingredientes en despensa: ${pantryItems.length > 0 ? pantryItems.slice(0, 10).map(i => i.name).join(', ') + (pantryItems.length > 10 ? '...' : '') : 'Despensa vacía'}
      
      Genera un plan que:
      - Sea apropiado para el estilo de cocina del usuario
      - Respete todas las restricciones y alergias
      - Use ingredientes de la despensa cuando sea posible
      - Incluya desayuno, almuerzo y cena para cada día
      - Tenga tiempos de preparación realistas
      - Sea variado y nutritivo
      
      Responde SOLO con un JSON array siguiendo este formato exacto:
      [
        {
          "day": "Lunes",
          "meals": {
            "breakfast": { "name": "nombre del plato", "time": minutos, "calories": calorías },
            "lunch": { "name": "nombre del plato", "time": minutos, "calories": calorías },
            "dinner": { "name": "nombre del plato", "time": minutos, "calories": calorías }
          }
        }
      ]
      
      5 días en total, sin markdown ni explicaciones adicionales.`;

      const result = await aiService.generateText({ prompt: prompt);
      const response = await result.response;
      let text = response.text().trim();
      
      // Clean markdown if present
      if (text.startsWith('```json')) text = text.slice(7);
      if (text.startsWith('```')) text = text.slice(3);
      if (text.endsWith('```')) text = text.slice(0, -3);
      
      const generatedPlan = JSON.parse(text.trim());
      
      // Process and calculate totals
      const processedPlan = generatedPlan.map((day: any) => ({
        ...day,
        totalCalories: Object.values(day.meals).reduce((sum: number, meal: any) => 
          sum + (meal?.calories || 0), 0
        ),
        totalTime: Object.values(day.meals).reduce((sum: number, meal: any) => 
          sum + (meal?.time || 0), 0
        )
      }));
      
      setMealPlan(processedPlan);
    } catch (error) {
      logger.error('Failed to generate meal plan:', 'MealPlanPreviewStep', error);
      setError('No pudimos generar tu plan de comidas. Por favor, intenta de nuevo.');
      
      // Fallback plan
      setMealPlan([
        {
          day: 'Lunes',
          meals: {
            breakfast: { name: 'Avena con frutas y miel', time: 10, calories: 350 },
            lunch: { name: 'Ensalada mediterránea con pollo', time: 15, calories: 450 },
            dinner: { name: 'Salmón al horno con verduras', time: 25, calories: 520 }
          },
          totalCalories: 1320,
          totalTime: 50
        },
        {
          day: 'Martes',
          meals: {
            breakfast: { name: 'Tostadas integrales con aguacate', time: 8, calories: 380 },
            lunch: { name: 'Bowl de quinoa y vegetales', time: 20, calories: 420 },
            dinner: { name: 'Pasta primavera con albahaca', time: 18, calories: 490 }
          },
          totalCalories: 1290,
          totalTime: 46
        },
        {
          day: 'Miércoles',
          meals: {
            breakfast: { name: 'Smoothie de frutas y yogurt', time: 5, calories: 320 },
            lunch: { name: 'Wrap de pollo y vegetales', time: 12, calories: 460 },
            dinner: { name: 'Curry de garbanzos y arroz', time: 30, calories: 510 }
          },
          totalCalories: 1290,
          totalTime: 47
        },
        {
          day: 'Jueves',
          meals: {
            breakfast: { name: 'Huevos revueltos con espinacas', time: 12, calories: 340 },
            lunch: { name: 'Sopa de lentejas y verduras', time: 25, calories: 380 },
            dinner: { name: 'Tacos de pescado con pico de gallo', time: 20, calories: 480 }
          },
          totalCalories: 1200,
          totalTime: 57
        },
        {
          day: 'Viernes',
          meals: {
            breakfast: { name: 'Pancakes de avena y plátano', time: 15, calories: 400 },
            lunch: { name: 'Ensalada césar con pollo', time: 10, calories: 440 },
            dinner: { name: 'Pizza casera de vegetales', time: 35, calories: 550 }
          },
          totalCalories: 1390,
          totalTime: 60
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  const preferences = data.preferences;
  const profile = data.profile;
  const persona = COOKING_PERSONAS_MAP[profile?.cooking_persona || 'beginner'];
  const PersonaIcon = persona.icon;

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-3xl font-bold text-white mb-2">
          Vista Previa de tu Plan de Comidas Personalizado
        </h2>
        <p className="text-white/60">
          Aquí tienes una muestra de lo que nuestra IA puede crear para ti
        </p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* User Summary */}
        <GlassCard variant="highlight">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Tu Perfil Culinario</h3>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                <PersonaIcon className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-medium text-purple-300">{persona.label}</span>
            </div>
          </div>
          
          <div className="space-y-3">
            {profile?.display_name && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white">Chef:</span>
                <span className="text-sm text-purple-200">{profile.display_name}</span>
              </div>
            )}
            
            {preferences?.dietary_restrictions && preferences.dietary_restrictions.length > 0 && (
              <div>
                <span className="text-sm font-medium text-white">Restricciones dietéticas: </span>
                <div className="mt-1 flex flex-wrap gap-2">
                  {preferences.dietary_restrictions.map((restriction, idx) => (
                    <span key={idx} className="px-2 py-1 bg-white/20 backdrop-blur-xl rounded-full text-xs text-white">
                      {restriction}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {preferences?.allergies && preferences.allergies.length > 0 && (
              <div>
                <span className="text-sm font-medium text-white">Alergias: </span>
                <div className="mt-1 flex flex-wrap gap-2">
                  {preferences.allergies.map((allergy, idx) => (
                    <span key={idx} className="px-2 py-1 bg-red-500/20 backdrop-blur-xl rounded-full text-xs text-red-300">
                      {allergy}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {data.pantryItems && data.pantryItems.length > 0 && (
              <div>
                <span className="text-sm font-medium text-white">Ingredientes en despensa: </span>
                <span className="text-sm text-purple-200">{data.pantryItems.length} items disponibles</span>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Meal Plan Generation */}
        <GlassCard>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-400" />
              Plan de Comidas Semanal Personalizado
            </h3>
            <GlassButton
              onClick={handleGenerateMealPlan}
              disabled={isLoading}
              variant="secondary"
              className="text-sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Generando...' : 'Regenerar'}
            </GlassButton>
          </div>

          <AnimatePresence mode="wait">
            {isLoading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-12"
              >
                <div className="inline-flex items-center gap-3">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="relative w-8 h-8"
                  >
                    <div className="absolute inset-0 rounded-full border-2 border-purple-400/30"></div>
                    <div className="absolute inset-0 rounded-full border-2 border-purple-400 border-t-transparent"></div>
                  </motion.div>
                  <div>
                    <p className="text-white font-medium">Generando tu plan de comidas personalizado...</p>
                    <p className="text-sm text-white/60">Esto puede tomar unos momentos</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-500/10 border border-red-400/30 rounded-xl p-4 backdrop-blur-xl"
            >
              <p className="text-red-300 text-sm">
                <span className="font-medium">Error:</span> {error}
              </p>
              <button
                type="button"
                onClick={handleGenerateMealPlan}
                className="mt-2 text-sm text-red-400 hover:text-red-300 underline transition-colors"
              >
                Intentar de nuevo
              </button>
            </motion.div>
          )}

          {mealPlan.length > 0 && !isLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {mealPlan.map((day, index) => (
                <motion.div 
                  key={index} 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/5 border border-white/10 rounded-xl overflow-hidden backdrop-blur-xl"
                >
                  <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 px-4 py-3 flex items-center justify-between">
                    <h4 className="font-semibold text-white">{day.day}</h4>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1 text-purple-300">
                        <Clock className="h-4 w-4" />
                        {day.totalTime} min
                      </span>
                      <span className="flex items-center gap-1 text-purple-300">
                        <Sparkles className="h-4 w-4" />
                        {day.totalCalories} cal
                      </span>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    {day.meals.breakfast && (
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-medium text-purple-400 uppercase">Desayuno</span>
                          <p className="text-white">{day.meals.breakfast.name}</p>
                        </div>
                        <div className="text-right text-sm text-white/60">
                          <p>{day.meals.breakfast.time} min</p>
                          <p>{day.meals.breakfast.calories} cal</p>
                        </div>
                      </div>
                    )}
                    {day.meals.lunch && (
                      <div className="flex items-center justify-between pt-3 border-t border-white/10">
                        <div>
                          <span className="text-xs font-medium text-purple-400 uppercase">Almuerzo</span>
                          <p className="text-white">{day.meals.lunch.name}</p>
                        </div>
                        <div className="text-right text-sm text-white/60">
                          <p>{day.meals.lunch.time} min</p>
                          <p>{day.meals.lunch.calories} cal</p>
                        </div>
                      </div>
                    )}
                    {day.meals.dinner && (
                      <div className="flex items-center justify-between pt-3 border-t border-white/10">
                        <div>
                          <span className="text-xs font-medium text-purple-400 uppercase">Cena</span>
                          <p className="text-white">{day.meals.dinner.name}</p>
                        </div>
                        <div className="text-right text-sm text-white/60">
                          <p>{day.meals.dinner.time} min</p>
                          <p>{day.meals.dinner.calories} cal</p>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <GlassCard variant="success" className="mt-6">
                  <p className="text-sm flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-green-200">
                      <span className="font-medium">¡Esto es solo una vista previa!</span> Una vez que completes la configuración, 
                      tendrás acceso a planes completos con recetas detalladas, listas de compras, información nutricional 
                      y la posibilidad de personalizar cada comida según tus gustos.
                    </span>
                  </p>
                </GlassCard>
              </motion.div>
            </motion.div>
          )}
        </GlassCard>

        {/* Features Preview */}
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: Calendar,
              color: 'from-blue-400 to-cyan-400',
              title: 'Planificación Inteligente',
              description: 'La IA considera tus preferencias, despensa y objetivos nutricionales'
            },
            {
              icon: CheckCircle,
              color: 'from-green-400 to-emerald-400',
              title: 'Ajustes Fáciles',
              description: 'Cambia comidas, ajusta porciones o regenera con un clic'
            },
            {
              icon: Clock,
              color: 'from-purple-400 to-pink-400',
              title: 'Ahorro de Tiempo',
              description: 'Menos tiempo planeando, más tiempo disfrutando buena comida'
            }
          ].map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <GlassCard className="text-center h-full">
                  <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-lg flex items-center justify-center mx-auto mb-3`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="font-medium text-white mb-2">{feature.title}</h4>
                  <p className="text-sm text-white/60">
                    {feature.description}
                  </p>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>

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
          
          <GlassButton
            type="submit"
            variant="primary"
            className="flex items-center gap-2"
          >
            Completar Configuración
            <ArrowRight className="w-4 h-4" />
          </GlassButton>
        </div>
      </form>
    </div>
  );
}