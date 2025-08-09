'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { ChevronRight, ChevronLeft, Sparkles, Check, X, Clock, ChefHat, Heart, DollarSign, Apple, Globe, Utensils, Leaf, Star, Zap, Timer, Users, TrendingUp, Calendar, Salad, Fish, Pizza, Coffee, Flame, Snowflake, Sun, Moon, Rocket, Diamond, Crown, Trophy, Gift, PartyPopper, Music, Palette, Camera, Gamepad2, BookOpen, Brain, Dumbbell, Smile } from 'lucide-react';
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
  { id: 'welcome', title: 'Bienvenido', description: 'Personaliza tu experiencia' },
  { id: 'dietary', title: 'Preferencias', description: 'Dieta y restricciones' },
  { id: 'cooking', title: 'Cocina', description: 'Tiempo y habilidad' },
  { id: 'summary', title: 'Resumen', description: 'Confirma tus datos' }
];

// Glass components
const GlassCard = ({ children, className = '', variant = 'default', style }: { 
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
    <div 
      className={`backdrop-blur-xl ${variants[variant]} border rounded-2xl ${className}`}
      style={style}
    >
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
    primary: 'bg-gradient-to-r from-purple-500 to-pink-500 border-purple-400/50 text-white hover:from-purple-600 hover:to-pink-600',
    secondary: 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-6 py-3 rounded-xl border backdrop-blur-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {children}
    </button>
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
  const controls = useAnimation();

  // Particle effect on step change
  useEffect(() => {
    if (currentStep > 0 && currentStep < steps.length - 1) {
      const particles = confetti.create(undefined, {
        resize: true,
        useWorker: true,
      });
      particles({
        particleCount: 30,
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
      // Simulate processing with haptic feedback
      await controls.start({
        scale: [1, 1.02, 1],
        transition: { duration: 0.3 }
      });
      setCurrentStep(currentStep + 1);
      setIsLoading(false);
    } else {
      // Final step celebration
      setIsLoading(true);
      const count = 200;
      const defaults = {
        origin: { y: 0.7 },
        colors: ['#a855f7', '#ec4899', '#3b82f6', '#10b981', '#f59e0b'],
      };

      function fire(particleRatio: number, opts: any) {
        confetti(Object.assign({}, defaults, opts, {
          particleCount: Math.floor(count * particleRatio),
        }));
      }

      fire(0.25, {
        spread: 26,
        startVelocity: 55,
      });
      fire(0.2, {
        spread: 60,
      });
      fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8,
      });
      fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2,
      });
      fire(0.1, {
        spread: 120,
        startVelocity: 45,
      });
      
      setTimeout(() => {
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
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-indigo-900 to-pink-900 z-50 flex items-center justify-center p-4 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
        className="w-full max-w-3xl relative z-10"
      >
        <GlassCard className="overflow-hidden shadow-2xl" style={{
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        }}>
          {/* Header with progress */}
          <div className="px-8 py-6 border-b border-white/10 relative overflow-hidden">
            {/* Animated gradient bar */}
            <motion.div
              className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
            
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <motion.div 
                  animate={{ 
                    rotate: [0, 360],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                    scale: { duration: 2, repeat: Infinity }
                  }}
                  className="relative w-12 h-12"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl blur-md opacity-50"></div>
                  <div className="relative w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl flex items-center justify-center shadow-lg">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
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
              <button
                onClick={onSkip}
                className="text-sm text-white/60 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-white/10"
                aria-label="Omitir configuración del planificador de comidas"
              >
                Omitir
              </button>
            </div>
            
            {/* Progress bar */}
            <div className="flex gap-2">
              {steps.map((step, index) => (
                <motion.div
                  key={step.id}
                  initial={false}
                  animate={{ 
                    opacity: index <= currentStep ? 1 : 0.3,
                    scale: index === currentStep ? 1.05 : 1
                  }}
                  className={`relative flex-1 h-3 rounded-full overflow-hidden transition-all duration-300 ${
                    index <= currentStep 
                      ? '' 
                      : 'bg-white/10'
                  }`}
                >
                  {index <= currentStep && (
                    <motion.div
                      initial={{ x: '-100%' }}
                      animate={{ x: '0%' }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400"
                    />
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="px-8 py-10 min-h-[450px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {currentStep === 0 && (
                  <div className="text-center">
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.5, type: "spring" }}
                      className="w-32 h-32 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl"
                    >
                      <motion.div
                        animate={{ 
                          scale: [1, 1.2, 1],
                          rotate: [0, 180, 360]
                        }}
                        transition={{ duration: 3, repeat: Infinity }}
                      >
                        <ChefHat className="w-16 h-16 text-white" />
                      </motion.div>
                    </motion.div>
                    <h3 className="text-3xl font-bold text-white mb-4">
                      ¡Bienvenido al Planificador AI! 🚀
                    </h3>
                    <p className="text-white/80 mb-10 text-lg max-w-lg mx-auto">
                      Vamos a crear un plan de comidas perfecto para ti con la magia de la inteligencia artificial
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {[
                        {
                          icon: <Rocket className="w-6 h-6" />,
                          title: 'Personalizado',
                          description: 'Planes únicos para ti',
                          color: 'from-blue-400 to-cyan-400',
                          delay: 0
                        },
                        {
                          icon: <Diamond className="w-6 h-6" />,
                          title: 'Premium',
                          description: 'Experiencia gourmet',
                          color: 'from-purple-400 to-pink-400',
                          delay: 0.1
                        },
                        {
                          icon: <Crown className="w-6 h-6" />,
                          title: 'Exclusivo',
                          description: 'Recetas únicas',
                          color: 'from-amber-400 to-orange-400',
                          delay: 0.2
                        }
                      ].map((feature, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20, rotateY: -90 }}
                          animate={{ opacity: 1, y: 0, rotateY: 0 }}
                          transition={{ 
                            delay: 0.2 + feature.delay,
                            duration: 0.8,
                            type: "spring"
                          }}
                          whileHover={{ 
                            scale: 1.05,
                            rotateY: 5,
                            transition: { duration: 0.2 }
                          }}
                          className="relative group transform-gpu"
                          style={{ transformStyle: 'preserve-3d' }}
                        >
                          <motion.div 
                            className={`absolute inset-0 bg-gradient-to-br ${feature.color} rounded-2xl blur-xl opacity-50`}
                            animate={{ 
                              scale: [1, 1.2, 1],
                              opacity: [0.5, 0.7, 0.5]
                            }}
                            transition={{ 
                              duration: 3,
                              repeat: Infinity,
                              delay: feature.delay
                            }}
                          />
                          <GlassCard className="relative p-6 hover:bg-white/10 transition-all overflow-hidden">
                            <motion.div
                              className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-2xl"
                              animate={{ 
                                x: [0, 10, 0],
                                y: [0, -10, 0]
                              }}
                              transition={{ 
                                duration: 4,
                                repeat: Infinity,
                                delay: feature.delay
                              }}
                            />
                            <motion.div 
                              className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg`}
                              whileHover={{ rotate: 360 }}
                              transition={{ duration: 0.5 }}
                            >
                              {feature.icon}
                            </motion.div>
                            <p className="font-semibold text-white mb-1">{feature.title}</p>
                            <p className="text-white/60 text-sm">{feature.description}</p>
                          </GlassCard>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

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
                          { value: 'omnivora', label: 'Omnívora', icon: '🍖', color: 'from-red-400 to-orange-400' },
                          { value: 'vegetariana', label: 'Vegetariana', icon: '🥦', color: 'from-green-400 to-emerald-400' },
                          { value: 'vegana', label: 'Vegana', icon: '🌱', color: 'from-green-500 to-lime-400' },
                          { value: 'pescetariana', label: 'Pescetariana', icon: '🐟', color: 'from-blue-400 to-cyan-400' }
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
                            aria-label={`Seleccionar dieta ${diet.label}`}
                            aria-pressed={data.dietaryPreferences.includes(diet.value)}
                            className={`relative overflow-hidden p-4 rounded-xl border-2 backdrop-blur-xl transition-all ${
                              data.dietaryPreferences.includes(diet.value)
                                ? 'border-purple-400 bg-purple-500/20'
                                : 'border-white/20 bg-white/5 hover:bg-white/10'
                            }`}
                          >
                            {data.dietaryPreferences.includes(diet.value) && (
                              <motion.div 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className={`absolute inset-0 bg-gradient-to-br ${diet.color} opacity-20`}
                              />
                            )}
                            <div className="relative z-10">
                              <span className="text-2xl mb-2 block">{diet.icon}</span>
                              <p className="font-medium text-white">{diet.label}</p>
                            </div>
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
                          { value: 'italiana', label: 'Italiana', icon: <Pizza className="w-5 h-5" />, glow: 'shadow-red-500/50' },
                          { value: 'mexicana', label: 'Mexicana', icon: '🌮', glow: 'shadow-orange-500/50' },
                          { value: 'asiatica', label: 'Asiática', icon: '🥢', glow: 'shadow-yellow-500/50' },
                          { value: 'mediterranea', label: 'Mediterránea', icon: <Salad className="w-5 h-5" />, glow: 'shadow-green-500/50' },
                          { value: 'argentina', label: 'Argentina', icon: '🥩', glow: 'shadow-red-600/50' },
                          { value: 'japonesa', label: 'Japonesa', icon: <Fish className="w-5 h-5" />, glow: 'shadow-blue-500/50' }
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
                            className={`p-3 rounded-xl border backdrop-blur-xl transition-all transform hover:-translate-y-1 ${
                              data.cuisinePreferences.includes(cuisine.value)
                                ? `border-purple-400/50 bg-purple-500/20 shadow-lg ${cuisine.glow}`
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
                          { 
                            key: 'beginner', 
                            label: 'Principiante',
                            description: 'Recetas simples',
                            icon: '👶',
                            color: 'from-green-400 to-emerald-400'
                          },
                          { 
                            key: 'intermediate', 
                            label: 'Intermedio',
                            description: 'Platos elaborados',
                            icon: '🧑‍🍳',
                            color: 'from-blue-400 to-cyan-400'
                          },
                          { 
                            key: 'advanced', 
                            label: 'Avanzado',
                            description: 'Chef experto',
                            icon: '👨‍🍳',
                            color: 'from-purple-400 to-pink-400'
                          }
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
                            {data.cookingSkill === level.key && (
                              <motion.div 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className={`absolute inset-0 bg-gradient-to-br ${level.color} opacity-20`}
                              />
                            )}
                            <div className="relative z-10 text-center">
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
                      <GlassCard className="p-6 relative overflow-hidden">
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10"
                          animate={{ x: ['-100%', '100%'] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        />
                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-white/60 flex items-center gap-2">
                              <Timer className="w-4 h-4" />
                              Tiempo:
                            </span>
                            <motion.span 
                              key={data.maxCookingTime}
                              initial={{ scale: 1.5, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="text-2xl font-bold text-white"
                            >
                              {data.maxCookingTime} min
                            </motion.span>
                          </div>
                          <div className="relative">
                            <input
                              type="range"
                              min="15"
                              max="120"
                              step="15"
                              value={data.maxCookingTime}
                              onChange={(e) => setData(prev => ({ ...prev, maxCookingTime: parseInt(e.target.value) }))}
                              className="w-full h-3 bg-white/20 rounded-lg appearance-none cursor-pointer slider relative z-10"
                              style={{
                                background: `linear-gradient(to right, #a855f7 0%, #ec4899 ${((data.maxCookingTime - 15) / 105) * 100}%, #ffffff33 ${((data.maxCookingTime - 15) / 105) * 100}%, #ffffff33 100%)`
                              }}
                            />
                            <motion.div
                              className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full shadow-lg pointer-events-none"
                              style={{ left: `${((data.maxCookingTime - 15) / 105) * 100}%` }}
                              initial={false}
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                          <div className="flex justify-between mt-2 text-xs text-white/60">
                            <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Rápido</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Normal</span>
                            <span className="flex items-center gap-1"><ChefHat className="w-3 h-3" /> Gourmet</span>
                          </div>
                        </div>
                      </GlassCard>
                    </div>

                    {/* Budget Level */}
                    <div>
                      <p className="font-semibold text-white mb-4 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-green-400" />
                        Presupuesto
                      </p>
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { 
                            key: 'low', 
                            label: 'Económico',
                            icon: '💰',
                            description: 'Comidas baratas',
                            color: 'from-green-400 to-emerald-400'
                          },
                          { 
                            key: 'medium', 
                            label: 'Moderado',
                            icon: '💸',
                            description: 'Balance precio-calidad',
                            color: 'from-blue-400 to-cyan-400'
                          },
                          { 
                            key: 'high', 
                            label: 'Premium',
                            icon: '💎',
                            description: 'Ingredientes gourmet',
                            color: 'from-purple-400 to-pink-400'
                          }
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
                            {data.budgetLevel === budget.key && (
                              <motion.div 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className={`absolute inset-0 bg-gradient-to-br ${budget.color} opacity-20`}
                              />
                            )}
                            <div className="relative z-10 text-center">
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

                {currentStep === 3 && (
                  <div className="text-center">
                    <motion.div 
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", duration: 0.8, bounce: 0.5 }}
                      className="relative w-24 h-24 mx-auto mb-6"
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full blur-xl"
                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <div className="relative w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full flex items-center justify-center shadow-xl">
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ delay: 0.3, type: "spring" }}
                        >
                          <Check className="w-12 h-12 text-white" />
                        </motion.div>
                      </div>
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
                    
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="mt-8"
                    >
                      <p className="text-sm text-white/60 mb-4">¿Listo para generar tu plan?</p>
                      <div className="flex items-center justify-center gap-2 text-purple-300">
                        <Sparkles className="w-5 h-5 animate-pulse" />
                        <span className="font-medium">La IA está esperando...</span>
                        <Sparkles className="w-5 h-5 animate-pulse" />
                      </div>
                    </motion.div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-8 py-6 border-t border-white/10 flex justify-between items-center relative">
            {/* Loading overlay */}
            <AnimatePresence>
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-20 rounded-b-2xl"
                >
                  <PremiumSpinner />
                </motion.div>
              )}
            </AnimatePresence>
            
            <GlassButton
              onClick={handlePrev}
              disabled={currentStep === 0 || isLoading}
              variant="secondary"
              className="flex items-center gap-2 relative z-10"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </GlassButton>

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

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <GlassButton
                onClick={handleNext}
                disabled={isLoading}
                variant="primary"
                className="flex items-center gap-2 relative z-10 overflow-hidden"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{ x: ['-200%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                {currentStep === steps.length - 1 ? (
                  <>
                    <span className="relative z-10">Generar Plan</span>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Sparkles className="w-4 h-4 relative z-10" />
                    </motion.div>
                  </>
                ) : (
                  <>
                    <span className="relative z-10">Siguiente</span>
                    <ChevronRight className="w-4 h-4 relative z-10" />
                  </>
                )}
              </GlassButton>
            </motion.div>
          </div>
        </GlassCard>
      </motion.div>
      
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        /* Custom slider styles */
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          background: linear-gradient(to br, #a855f7, #ec4899);
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(168, 85, 247, 0.4);
          border: 2px solid rgba(255, 255, 255, 0.2);
          transition: all 0.2s;
        }
        
        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 6px 20px rgba(168, 85, 247, 0.6);
        }
        
        .slider::-moz-range-thumb {
          width: 24px;
          height: 24px;
          background: linear-gradient(to br, #a855f7, #ec4899);
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(168, 85, 247, 0.4);
          border: 2px solid rgba(255, 255, 255, 0.2);
          transition: all 0.2s;
        }
        
        .slider::-moz-range-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 6px 20px rgba(168, 85, 247, 0.6);
        }
      `}</style>
    </div>
  );
}