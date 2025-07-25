'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Sparkles, Check } from 'lucide-react';

import { iOS26EnhancedCard } from '@/components/ios26/iOS26EnhancedCard';
import { iOS26LiquidButton } from '@/components/ios26/iOS26LiquidButton';

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

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(data);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <iOS26EnhancedCard
          variant="aurora"
          elevation="floating"
          className="overflow-hidden"
        >
          {/* Header with progress */}
          <div className="px-6 py-4 border-b border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {steps[currentStep].title}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {steps[currentStep].description}
                  </p>
                </div>
              </div>
              <button
                onClick={onSkip}
                className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                Omitir
              </button>
            </div>
            
            {/* Progress bar */}
            <div className="flex gap-2">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex-1 h-2 rounded-full transition-all duration-300 ${
                    index <= currentStep 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-8 min-h-[400px]">
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
                    <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                      <Sparkles className="w-12 h-12 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                      ¡Bienvenido al Planificador AI!
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-8">
                      Vamos a personalizar tu experiencia de planificación de comidas 
                      con inteligencia artificial para crear planes perfectos para ti.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="p-4 bg-white/5 rounded-xl">
                        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                        <p className="font-medium text-gray-900 dark:text-white">Personalizado</p>
                        <p className="text-gray-600 dark:text-gray-400">Planes únicos para ti</p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-xl">
                        <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                        <p className="font-medium text-gray-900 dark:text-white">Inteligente</p>
                        <p className="text-gray-600 dark:text-gray-400">IA avanzada</p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-xl">
                        <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                        <p className="font-medium text-gray-900 dark:text-white">Fácil</p>
                        <p className="text-gray-600 dark:text-gray-400">Solo unos clics</p>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 1 && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                      Preferencias alimentarias
                    </h3>
                    <div className="space-y-4">
                      <div className="p-4 bg-white/5 rounded-xl">
                        <p className="font-medium text-gray-900 dark:text-white mb-2">Tipo de dieta</p>
                        <div className="grid grid-cols-2 gap-2">
                          {['Omnívora', 'Vegetariana', 'Vegana', 'Pescetariana'].map((diet) => (
                            <button
                              key={diet}
                              className="p-3 text-left bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-gray-900 dark:text-white"
                            >
                              {diet}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                      Tiempo y habilidad
                    </h3>
                    <div className="space-y-4">
                      <div className="p-4 bg-white/5 rounded-xl">
                        <p className="font-medium text-gray-900 dark:text-white mb-2">Nivel de cocina</p>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { key: 'beginner', label: 'Principiante' },
                            { key: 'intermediate', label: 'Intermedio' },
                            { key: 'advanced', label: 'Avanzado' }
                          ].map((level) => (
                            <button
                              key={level.key}
                              onClick={() => setData(prev => ({ ...prev, cookingSkill: level.key as any }))}
                              className={`p-3 text-center rounded-lg transition-colors ${
                                data.cookingSkill === level.key
                                  ? 'bg-purple-500 text-white'
                                  : 'bg-white/10 hover:bg-white/20 text-gray-900 dark:text-white'
                              }`}
                            >
                              {level.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                      <Check className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                      ¡Todo listo!
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-8">
                      Hemos configurado tu perfil. Ahora generaremos tu primer plan de comidas personalizado.
                    </p>
                    <div className="p-4 bg-white/5 rounded-xl text-left">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Resumen:</p>
                      <ul className="space-y-1 text-sm text-gray-900 dark:text-white">
                        <li>• Nivel: {data.cookingSkill}</li>
                        <li>• Presupuesto: {data.budgetLevel}</li>
                        <li>• Tiempo máximo: {data.maxCookingTime} min</li>
                      </ul>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/10 flex justify-between">
            <iOS26LiquidButton
              variant="glass"
              leftIcon={<ChevronLeft className="w-4 h-4" />}
              onClick={handlePrev}
              disabled={currentStep === 0}
            >
              Anterior
            </iOS26LiquidButton>

            <iOS26LiquidButton
              variant="solid"
              rightIcon={currentStep === steps.length - 1 ? <Check className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              onClick={handleNext}
              className="bg-gradient-to-r from-purple-500 to-pink-500"
            >
              {currentStep === steps.length - 1 ? 'Completar' : 'Siguiente'}
            </iOS26LiquidButton>
          </div>
        </iOS26EnhancedCard>
      </div>
    </div>
  );
}