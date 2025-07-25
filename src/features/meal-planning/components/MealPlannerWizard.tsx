'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';



export interface WizardData {
  dietaryPreferences: string[];
  cookingSkill: 'beginner' | 'intermediate' | 'advanced';
  maxCookingTime: number;
  mealsPerDay: number;
  allergies: string[];
  cuisinePreferences: string[];
  budgetLevel: 'low' | 'medium' | 'high';
}

interface MealPlannerWizardProps {
  onComplete: (data: WizardData) => void;
  onSkip: () => void;
}

export function MealPlannerWizard({ onComplete, onSkip }: MealPlannerWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<WizardData>({
    dietaryPreferences: [],
    cookingSkill: 'intermediate',
    maxCookingTime: 30,
    mealsPerDay: 3,
    allergies: [],
    cuisinePreferences: [],
    budgetLevel: 'medium'
  });

  const steps = [
    {
      title: 'Preferencias Dietéticas',
      description: 'Selecciona tus restricciones alimentarias',
      component: DietaryPreferencesStep
    },
    {
      title: 'Habilidad Culinaria',
      description: 'Cuéntanos sobre tu experiencia cocinando',
      component: CookingSkillStep
    },
    {
      title: 'Tiempo y Comidas',
      description: 'Configura tu disponibilidad',
      component: TimeAndMealsStep
    },
    {
      title: 'Alergias y Cocinas',
      description: 'Personaliza tus preferencias',
      component: AllergiesAndCuisineStep
    },
    {
      title: 'Presupuesto',
      description: 'Establece tu rango de presupuesto',
      component: BudgetStep
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    onComplete(formData);
  };

  const handleSkip = () => {
    onSkip();
  };

  const updateFormData = (updates: Partial<WizardData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const StepComponent = steps[currentStep].component;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/20 rounded-xl">
                <Sparkles className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Configuración Inicial
                </h2>
                <p className="text-white/60 text-sm">
                  Paso {currentStep + 1} de {steps.length}
                </p>
              </div>
            </div>
            <button
              onClick={handleSkip}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-white">
                {steps[currentStep].title}
              </span>
              <span className="text-sm text-white/60">
                {Math.round(((currentStep + 1) / steps.length) * 100)}%
              </span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <motion.div
                className="h-2 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          <p className="text-white/60 text-sm">
            {steps[currentStep].description}
          </p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-96">
          <StepComponent
            formData={formData}
            updateFormData={updateFormData}
          />
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10">
          <div className="flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex items-center gap-2 px-4 py-2 text-white/60 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </button>

            <div className="flex gap-3">
              <button
                onClick={handleSkip}
                className="px-4 py-2 text-white/60 hover:text-white transition-colors"
              >
                Omitir
              </button>
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium rounded-xl hover:from-orange-600 hover:to-pink-600"
              >
                {currentStep === steps.length - 1 ? 'Finalizar' : 'Siguiente'}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Step Components
function DietaryPreferencesStep({ formData, updateFormData }: any) {
  const options = ['vegetarian', 'vegan', 'keto', 'paleo', 'glutenFree', 'dairyFree'];
  
  const handleToggle = (option: string) => {
    const current = formData.dietaryPreferences;
    const updated = current.includes(option)
      ? current.filter((p: string) => p !== option)
      : [...current, option];
    updateFormData({ dietaryPreferences: updated });
  };

  return (
    <div className="space-y-4">
      <p className="text-white/80 text-sm">
        Selecciona las restricciones dietéticas que apliquen a ti:
      </p>
      <div className="grid grid-cols-2 gap-3">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => handleToggle(option)}
            className={`p-3 rounded-xl text-sm font-medium transition-colors ${
              formData.dietaryPreferences.includes(option)
                ? 'bg-orange-500 text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function CookingSkillStep({ formData, updateFormData }: any) {
  const options = [
    { value: 'beginner', label: 'Principiante', description: 'Recetas simples y rápidas' },
    { value: 'intermediate', label: 'Intermedio', description: 'Recetas moderadamente complejas' },
    { value: 'advanced', label: 'Avanzado', description: 'Recetas de cualquier complejidad' }
  ];

  return (
    <div className="space-y-4">
      <p className="text-white/80 text-sm">
        ¿Cuál es tu nivel de habilidad culinaria?
      </p>
      <div className="space-y-3">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => updateFormData({ cookingSkill: option.value })}
            className={`w-full p-4 rounded-xl text-left transition-colors ${
              formData.cookingSkill === option.value
                ? 'bg-orange-500 text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            <div className="font-medium">{option.label}</div>
            <div className="text-sm opacity-80">{option.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function TimeAndMealsStep({ formData, updateFormData }: any) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-white/80 text-sm mb-3">
          Tiempo máximo de cocina (minutos)
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="15"
            max="120"
            step="15"
            value={formData.maxCookingTime}
            onChange={(e) => updateFormData({ maxCookingTime: parseInt(e.target.value) })}
            className="flex-1"
          />
          <span className="text-white font-medium min-w-[3rem]">
            {formData.maxCookingTime}m
          </span>
        </div>
      </div>

      <div>
        <label className="block text-white/80 text-sm mb-3">
          Comidas por día
        </label>
        <div className="flex gap-3">
          {[2, 3, 4, 5].map((num) => (
            <button
              key={num}
              onClick={() => updateFormData({ mealsPerDay: num })}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                formData.mealsPerDay === num
                  ? 'bg-orange-500 text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              {num}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function AllergiesAndCuisineStep({ formData, updateFormData }: any) {
  const allergies = ['nuts', 'shellfish', 'eggs', 'dairy', 'soy', 'fish'];
  const cuisines = ['italiana', 'mexicana', 'asiática', 'mediterránea', 'argentina', 'francesa'];

  const handleAllergyToggle = (allergy: string) => {
    const current = formData.allergies;
    const updated = current.includes(allergy)
      ? current.filter((a: string) => a !== allergy)
      : [...current, allergy];
    updateFormData({ allergies: updated });
  };

  const handleCuisineToggle = (cuisine: string) => {
    const current = formData.cuisinePreferences;
    const updated = current.includes(cuisine)
      ? current.filter((c: string) => c !== cuisine)
      : [...current, cuisine];
    updateFormData({ cuisinePreferences: updated });
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-white/80 text-sm mb-3">Alergias alimentarias:</p>
        <div className="grid grid-cols-2 gap-2">
          {allergies.map((allergy) => (
            <button
              key={allergy}
              onClick={() => handleAllergyToggle(allergy)}
              className={`p-2 rounded-lg text-sm transition-colors ${
                formData.allergies.includes(allergy)
                  ? 'bg-red-500 text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              {allergy}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-white/80 text-sm mb-3">Cocinas preferidas:</p>
        <div className="grid grid-cols-2 gap-2">
          {cuisines.map((cuisine) => (
            <button
              key={cuisine}
              onClick={() => handleCuisineToggle(cuisine)}
              className={`p-2 rounded-lg text-sm capitalize transition-colors ${
                formData.cuisinePreferences.includes(cuisine)
                  ? 'bg-orange-500 text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              {cuisine}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function BudgetStep({ formData, updateFormData }: any) {
  const budgets = [
    { value: 'low', label: 'Económico', description: 'Hasta $15,000/mes' },
    { value: 'medium', label: 'Moderado', description: '$15,000 - $30,000/mes' },
    { value: 'high', label: 'Premium', description: 'Más de $30,000/mes' }
  ];

  return (
    <div className="space-y-4">
      <p className="text-white/80 text-sm">
        ¿Cuál es tu presupuesto mensual para alimentación?
      </p>
      <div className="space-y-3">
        {budgets.map((budget) => (
          <button
            key={budget.value}
            onClick={() => updateFormData({ budgetLevel: budget.value })}
            className={`w-full p-4 rounded-xl text-left transition-colors ${
              formData.budgetLevel === budget.value
                ? 'bg-orange-500 text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            <div className="font-medium">{budget.label}</div>
            <div className="text-sm opacity-80">{budget.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}