'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '@/services/logger';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, ChevronLeft, Sparkles, Check, X, Clock, ChefHat, Heart, 
  DollarSign, Apple, Globe, Utensils, Leaf, Star, Zap, Timer, Rocket, 
  Diamond, Crown, Pizza, Fish, Salad
} from 'lucide-react';
import confetti from 'canvas-confetti';

export interface WizardData {
  dietaryPreferences: string[];
  allergies: string[];
  cuisinePreferences: string[];
  cookingSkill: 'beginner' | 'intermediate' | 'advanced';
  budgetLevel: 'low' | 'medium' | 'high';
  maxCookingTime: number;
}

interface MealPlannerWizardProps {
  onComplete: (data: WizardData) => void;
  onSkip: () => void;
}

const steps = [
  { id: 'welcome', title: 'Bienvenido', description: 'Personaliza tu experiencia', icon: '🎉' },
  { id: 'dietary', title: 'Preferencias', description: 'Dieta y restricciones', icon: '🥗' },
  { id: 'cooking', title: 'Cocina', description: 'Tiempo y habilidad', icon: '👨‍🍳' },
  { id: 'summary', title: 'Resumen', description: 'Confirma tus datos', icon: '✨' }
];

// Glass components
const GlassCard = ({ children, className = '', variant = 'default', style = {} }: { 
  children: React.ReactNode; 
  className?: string; 
  variant?: 'default' | 'highlight';
  style?: React.CSSProperties;
}) => {
  const variants = {
    default: 'bg-white/5 border-white/10',
    highlight: 'bg-purple-500/10 border-purple-400/20',
  };
  
  return (
    <div className={`backdrop-blur-xl ${variants[variant]} border rounded-3xl ${className}`} style={style}>
      {children}
    </div>
  );
};

const GlassButton = ({ children, onClick, variant = 'default', disabled = false, className = '' }: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  variant?: 'default' | 'primary' | 'secondary';
  disabled?: boolean;
  className?: string;
}) => {
  const variants = {
    default: 'bg-white/10 border-white/20 text-white hover:bg-white/20',
    primary: 'bg-gradient-to-r from-purple-500 to-pink-500 border-purple-400/50 text-white hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/25',
    secondary: 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
  };
  
  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={`px-6 py-3 rounded-xl border backdrop-blur-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {children}
    </motion.button>
  );
};

export function MealPlannerWizard({ onComplete, onSkip }: MealPlannerWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<WizardData>({
    dietaryPreferences: [],
    allergies: [],
    cuisinePreferences: [],
    cookingSkill: 'intermediate',
    budgetLevel: 'medium',
    maxCookingTime: 60
  });
  const [isLoading, setIsLoading] = useState(false);

  // Validation
  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return data.dietaryPreferences.length > 0;
      case 2:
        return data.cookingSkill && data.budgetLevel && data.maxCookingTime;
      default:
        return true;
    }
  };

  // Load saved data
  useEffect(() => {
    const saved = localStorage.getItem('mealPlannerWizardData');
    if (saved) {
      try {
        setData(JSON.parse(saved));
      } catch (error) {
        logger.error('Error loading saved data:', error);
      }
    }
  }, []);

  // Save data
  useEffect(() => {
    localStorage.setItem('mealPlannerWizardData', JSON.stringify(data));
  }, [data]);

  // Particle effect
  useEffect(() => {
    if (currentStep > 0 && currentStep < steps.length - 1) {
      confetti({
        particleCount: 20,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#a855f7', '#ec4899', '#3b82f6'],
        gravity: 0.5,
        ticks: 50,
        shapes: ['circle'],
        scalar: 0.7
      });
    }
  }, [currentStep]);

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 300));
      setCurrentStep(currentStep + 1);
      setIsLoading(false);
    } else {
      // Final step
      setIsLoading(true);
      
      // Celebration
      const count = 200;
      const defaults = {
        origin: { y: 0.7 },
        colors: ['#a855f7', '#ec4899', '#3b82f6', '#10b981', '#f59e0b'],
      };

      function fire(particleRatio: number, opts: any) {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio),
        });
      }

      fire(0.25, { spread: 26, startVelocity: 55 });
      fire(0.2, { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      fire(0.1, { spread: 120, startVelocity: 45 });

      setTimeout(() => {
        localStorage.removeItem('mealPlannerWizardData');
        onComplete(data);
      }, 1500);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onSkip}
        />
        
        {/* Modal */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
          className="w-full max-w-2xl relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Background effects - reduced size */}
          <div className="absolute -inset-6 overflow-hidden rounded-2xl pointer-events-none">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-purple-500 rounded-full mix-blend-multiply filter blur-lg opacity-20 animate-blob"></div>
            <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-pink-500 rounded-full mix-blend-multiply filter blur-lg opacity-20 animate-blob animation-delay-2000"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-indigo-500 rounded-full mix-blend-multiply filter blur-lg opacity-20 animate-blob animation-delay-4000"></div>
          </div>
          
          <GlassCard className="relative overflow-hidden shadow-xl" style={{
            boxShadow: '0 10px 25px 0 rgba(31, 38, 135, 0.3)',
          }}>
            {/* Close button */}
            <motion.button
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              onClick={onSkip}
              className="absolute top-4 right-4 z-50 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors group"
              aria-label="Cerrar wizard"
            >
              <X className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" />
            </motion.button>
            
            {/* Header */}
            <div className="px-6 py-5 border-b border-white/10 relative overflow-hidden">
              <motion.div
                className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl flex items-center justify-center shadow-lg"
                  >
                    <Sparkles className="w-6 h-6 text-white" />
                  </motion.div>
                  
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {steps[currentStep].title}
                    </h2>
                    <p className="text-sm text-white/60">
                      {steps[currentStep].description}
                    </p>
                  </div>
                </div>
                
                {currentStep < steps.length - 1 && (
                  <button
                    onClick={onSkip}
                    className="text-sm text-white/60 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-white/10"
                  >
                    Omitir
                  </button>
                )}
              </div>
              
              {/* Progress */}
              {currentStep !== 0 && currentStep !== steps.length - 1 && (
                <div className="mt-6">
                  <div className="flex justify-between text-sm text-white/80 mb-3">
                    <span>Paso {currentStep} de {steps.length - 2}</span>
                    <span>{Math.round((currentStep / (steps.length - 2)) * 100)}% Completado</span>
                  </div>
                  <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-purple-400 to-pink-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${(currentStep / (steps.length - 2)) * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Content */}
            <div className="px-6 py-6 min-h-[400px] max-h-[60vh] overflow-y-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Welcome Step */}
                  {currentStep === 0 && (
                    <div className="text-center">
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.5, type: "spring" }}
                        className="w-32 h-32 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl"
                      >
                        <ChefHat className="w-16 h-16 text-white" />
                      </motion.div>
                      <h3 className="text-3xl font-bold text-white mb-4">
                        ¡Bienvenido al Planificador AI! 🚀
                      </h3>
                      <p className="text-white/80 mb-10 text-lg max-w-lg mx-auto">
                        Vamos a crear un plan de comidas perfecto para ti con la magia de la inteligencia artificial
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                          { 
                            icon: <Rocket className="w-5 h-5" />, 
                            title: 'Personalizado', 
                            description: 'Planes únicos basados en tus preferencias', 
                            color: 'from-blue-400 to-cyan-400',
                            emoji: '🎯'
                          },
                          { 
                            icon: <Diamond className="w-5 h-5" />, 
                            title: 'Inteligente', 
                            description: 'IA avanzada que aprende de ti', 
                            color: 'from-purple-400 to-pink-400',
                            emoji: '🤖'
                          },
                          { 
                            icon: <Crown className="w-5 h-5" />, 
                            title: 'Eficiente', 
                            description: 'Ahorra tiempo y reduce desperdicios', 
                            color: 'from-amber-400 to-orange-400',
                            emoji: '⚡'
                          }
                        ].map((feature, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + index * 0.1 }}
                            whileHover={{ scale: 1.02 }}
                            className="relative cursor-default"
                          >
                            <GlassCard className="p-4 hover:bg-white/5 transition-all">
                              <div className="text-center">
                                <div className="text-2xl mb-2">{feature.emoji}</div>
                                <p className="font-semibold text-white text-sm mb-1">{feature.title}</p>
                                <p className="text-white/60 text-xs leading-relaxed">{feature.description}</p>
                              </div>
                            </GlassCard>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Dietary Preferences Step */}
                  {currentStep === 1 && (
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-8 text-center">
                        ¿Cuáles son tus preferencias alimentarias? 🥗
                      </h3>
                      
                      {/* Diet Type */}
                      <div className="mb-8">
                        <p className="font-semibold text-white mb-4 flex items-center gap-2">
                          <Leaf className="w-5 h-5 text-green-400" />
                          Tipo de dieta
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { value: 'omnivora', label: 'Omnívora', icon: '🍖' },
                            { value: 'vegetariana', label: 'Vegetariana', icon: '🥦' },
                            { value: 'vegana', label: 'Vegana', icon: '🌱' },
                            { value: 'pescetariana', label: 'Pescetariana', icon: '🐟' }
                          ].map((diet) => (
                            <motion.button
                              key={diet.value}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setData(prev => ({ 
                                ...prev, 
                                dietaryPreferences: prev.dietaryPreferences.includes(diet.value)
                                  ? prev.dietaryPreferences.filter(d => d !== diet.value)
                                  : [diet.value]
                              }))}
                              className={`relative overflow-hidden p-4 rounded-xl border-2 backdrop-blur-xl transition-all ${
                                data.dietaryPreferences.includes(diet.value)
                                  ? 'border-purple-400 bg-purple-500/20'
                                  : 'border-white/20 bg-white/5 hover:bg-white/10'
                              }`}
                            >
                              <span className="text-2xl mb-2 block">{diet.icon}</span>
                              <p className="font-medium text-white">{diet.label}</p>
                            </motion.button>
                          ))}
                        </div>
                      </div>

                      {/* Allergies */}
                      <div className="mb-8">
                        <p className="font-semibold text-white mb-4 flex items-center gap-2">
                          <X className="w-5 h-5 text-red-400" />
                          Alergias e intolerancias
                        </p>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { value: 'gluten', label: 'Gluten', icon: '🌾' },
                            { value: 'lactosa', label: 'Lactosa', icon: '🥛' },
                            { value: 'frutos-secos', label: 'Frutos Secos', icon: '🥜' },
                            { value: 'mariscos', label: 'Mariscos', icon: '🦐' },
                            { value: 'huevos', label: 'Huevos', icon: '🥚' },
                            { value: 'soja', label: 'Soja', icon: '🫘' }
                          ].map((allergy) => (
                            <motion.button
                              key={allergy.value}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setData(prev => ({ 
                                ...prev, 
                                allergies: prev.allergies.includes(allergy.value)
                                  ? prev.allergies.filter(a => a !== allergy.value)
                                  : [...prev.allergies, allergy.value]
                              }))}
                              className={`p-3 rounded-xl border backdrop-blur-xl transition-all ${
                                data.allergies.includes(allergy.value)
                                  ? 'border-red-400/50 bg-red-500/20'
                                  : 'border-white/20 bg-white/5 hover:bg-white/10'
                              }`}
                            >
                              <span className="text-xl mb-1 block">{allergy.icon}</span>
                              <p className="text-sm text-white/80">{allergy.label}</p>
                            </motion.button>
                          ))}
                        </div>
                      </div>

                      {/* Cuisine Preferences */}
                      <div>
                        <p className="font-semibold text-white mb-4 flex items-center gap-2">
                          <Globe className="w-5 h-5 text-purple-400" />
                          Cocinas favoritas
                        </p>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { value: 'italiana', label: 'Italiana', icon: <Pizza className="w-5 h-5" /> },
                            { value: 'mexicana', label: 'Mexicana', icon: '🌮' },
                            { value: 'asiatica', label: 'Asiática', icon: '🥢' },
                            { value: 'mediterranea', label: 'Mediterránea', icon: <Salad className="w-5 h-5" /> },
                            { value: 'argentina', label: 'Argentina', icon: '🥩' },
                            { value: 'japonesa', label: 'Japonesa', icon: <Fish className="w-5 h-5" /> }
                          ].map((cuisine) => (
                            <motion.button
                              key={cuisine.value}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setData(prev => ({ 
                                ...prev, 
                                cuisinePreferences: prev.cuisinePreferences.includes(cuisine.value)
                                  ? prev.cuisinePreferences.filter(c => c !== cuisine.value)
                                  : [...prev.cuisinePreferences, cuisine.value]
                              }))}
                              className={`p-3 rounded-xl border backdrop-blur-xl transition-all ${
                                data.cuisinePreferences.includes(cuisine.value)
                                  ? 'border-purple-400/50 bg-purple-500/20'
                                  : 'border-white/20 bg-white/5 hover:bg-white/10'
                              }`}
                            >
                              <div className="flex flex-col items-center gap-1">
                                {typeof cuisine.icon === 'string' ? (
                                  <span className="text-xl">{cuisine.icon}</span>
                                ) : (
                                  <div className="text-white/80">{cuisine.icon}</div>
                                )}
                                <p className="text-sm text-white/80">{cuisine.label}</p>
                              </div>
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Cooking Skills Step */}
                  {currentStep === 2 && (
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-8 text-center">
                        ¿Cuánto tiempo tienes para cocinar? ⏰
                      </h3>
                      
                      {/* Cooking Skill */}
                      <div className="mb-8">
                        <p className="font-semibold text-white mb-4 flex items-center gap-2">
                          <ChefHat className="w-5 h-5 text-purple-400" />
                          Nivel de habilidad
                        </p>
                        <div className="grid grid-cols-3 gap-4">
                          {[
                            { key: 'beginner', label: 'Principiante', description: 'Recetas simples', icon: '👶' },
                            { key: 'intermediate', label: 'Intermedio', description: 'Platos elaborados', icon: '🧑‍🍳' },
                            { key: 'advanced', label: 'Avanzado', description: 'Chef experto', icon: '👨‍🍳' }
                          ].map((level) => (
                            <motion.button
                              key={level.key}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setData(prev => ({ ...prev, cookingSkill: level.key as WizardData['cookingSkill'] }))}
                              className={`relative overflow-hidden p-6 rounded-xl border-2 backdrop-blur-xl transition-all ${
                                data.cookingSkill === level.key
                                  ? 'border-purple-400 bg-purple-500/20'
                                  : 'border-white/20 bg-white/5 hover:bg-white/10'
                              }`}
                            >
                              <div className="text-center">
                                <span className="text-3xl mb-2 block">{level.icon}</span>
                                <p className="font-semibold text-white mb-1">{level.label}</p>
                                <p className="text-xs text-white/60">{level.description}</p>
                              </div>
                            </motion.button>
                          ))}
                        </div>
                      </div>

                      {/* Cooking Time */}
                      <div className="mb-8">
                        <p className="font-semibold text-white mb-4 flex items-center gap-2">
                          <Timer className="w-5 h-5 text-blue-400" />
                          Tiempo máximo para cocinar
                        </p>
                        <GlassCard className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-white/60">Minutos:</span>
                            <span className="text-2xl font-bold text-white">{data.maxCookingTime} min</span>
                          </div>
                          <input
                            type="range"
                            min="15"
                            max="120"
                            step="15"
                            value={data.maxCookingTime}
                            onChange={(e) => setData(prev => ({ ...prev, maxCookingTime: parseInt(e.target.value) }))}
                            className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                            style={{
                              background: `linear-gradient(to right, #a855f7 0%, #ec4899 ${((data.maxCookingTime - 15) / 105) * 100}%, #ffffff33 ${((data.maxCookingTime - 15) / 105) * 100}%, #ffffff33 100%)`
                            }}
                          />
                          <div className="flex justify-between mt-2 text-xs text-white/60">
                            <span>15 min</span>
                            <span>60 min</span>
                            <span>120 min</span>
                          </div>
                        </GlassCard>
                      </div>

                      {/* Budget */}
                      <div>
                        <p className="font-semibold text-white mb-4 flex items-center gap-2">
                          <DollarSign className="w-5 h-5 text-green-400" />
                          Presupuesto
                        </p>
                        <div className="grid grid-cols-3 gap-4">
                          {[
                            { key: 'low', label: 'Económico', icon: '💰', description: 'Comidas baratas' },
                            { key: 'medium', label: 'Moderado', icon: '💸', description: 'Balance precio-calidad' },
                            { key: 'high', label: 'Premium', icon: '💎', description: 'Ingredientes gourmet' }
                          ].map((budget) => (
                            <motion.button
                              key={budget.key}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setData(prev => ({ ...prev, budgetLevel: budget.key as WizardData['budgetLevel'] }))}
                              className={`relative overflow-hidden p-4 rounded-xl border-2 backdrop-blur-xl transition-all ${
                                data.budgetLevel === budget.key
                                  ? 'border-purple-400 bg-purple-500/20'
                                  : 'border-white/20 bg-white/5 hover:bg-white/10'
                              }`}
                            >
                              <div className="text-center">
                                <span className="text-2xl mb-2 block">{budget.icon}</span>
                                <p className="font-semibold text-white text-sm mb-1">{budget.label}</p>
                                <p className="text-xs text-white/60">{budget.description}</p>
                              </div>
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Summary Step */}
                  {currentStep === 3 && (
                    <div className="text-center">
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", duration: 0.5 }}
                        className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl"
                      >
                        <Check className="w-10 h-10 text-white" />
                      </motion.div>
                      <h3 className="text-2xl font-bold text-white mb-4">
                        ¡Perfecto! Todo listo 🎉
                      </h3>
                      <p className="text-white/80 mb-8 text-lg">
                        Tu perfil está configurado. Ahora crearemos un plan de comidas increíble para ti.
                      </p>
                      
                      <GlassCard variant="highlight" className="p-6 text-left max-w-md mx-auto">
                        <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-yellow-400" />
                          Tu configuración:
                        </h4>
                        <div className="space-y-3">
                          {data.dietaryPreferences.length > 0 && (
                            <div className="flex items-start gap-3">
                              <Leaf className="w-5 h-5 text-green-400 mt-0.5" />
                              <div>
                                <p className="text-sm text-white/60">Dieta:</p>
                                <p className="text-white capitalize">{data.dietaryPreferences.join(', ')}</p>
                              </div>
                            </div>
                          )}
                          {data.allergies.length > 0 && (
                            <div className="flex items-start gap-3">
                              <X className="w-5 h-5 text-red-400 mt-0.5" />
                              <div>
                                <p className="text-sm text-white/60">Alergias:</p>
                                <p className="text-white capitalize">{data.allergies.join(', ')}</p>
                              </div>
                            </div>
                          )}
                          <div className="flex items-start gap-3">
                            <ChefHat className="w-5 h-5 text-purple-400 mt-0.5" />
                            <div>
                              <p className="text-sm text-white/60">Nivel:</p>
                              <p className="text-white capitalize">{data.cookingSkill}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <Timer className="w-5 h-5 text-blue-400 mt-0.5" />
                            <div>
                              <p className="text-sm text-white/60">Tiempo máximo:</p>
                              <p className="text-white">{data.maxCookingTime} minutos</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <DollarSign className="w-5 h-5 text-green-400 mt-0.5" />
                            <div>
                              <p className="text-sm text-white/60">Presupuesto:</p>
                              <p className="text-white capitalize">{data.budgetLevel}</p>
                            </div>
                          </div>
                        </div>
                      </GlassCard>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
            
            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/10 flex justify-between items-center">
              <GlassButton
                onClick={handlePrev}
                disabled={currentStep === 0 || isLoading}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </GlassButton>
              
              {/* Progress dots */}
              <div className="flex items-center gap-2">
                {steps.map((_, index) => (
                  <motion.div
                    key={index}
                    initial={false}
                    animate={{ 
                      scale: index === currentStep ? 1.2 : 1,
                      opacity: index === currentStep ? 1 : 0.3
                    }}
                    className={`w-2 h-2 rounded-full ${
                      index <= currentStep ? 'bg-purple-400' : 'bg-white/20'
                    }`}
                  />
                ))}
              </div>
              
              <GlassButton
                onClick={handleNext}
                disabled={isLoading || !canProceed()}
                variant="primary"
                className="flex items-center gap-2"
              >
                {currentStep === steps.length - 1 ? (
                  <>
                    <span>Generar Plan</span>
                    <Sparkles className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <span>Siguiente</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </GlassButton>
            </div>
            
            {/* Loading overlay */}
            <AnimatePresence>
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-20 rounded-3xl"
                >
                  <div className="w-12 h-12 border-3 border-purple-400 border-t-transparent rounded-full animate-spin" />
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>
        </motion.div>
      </motion.div>
      
      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
    </AnimatePresence>
  );
}