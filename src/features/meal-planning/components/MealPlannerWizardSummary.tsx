'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, ChefHat, Clock, DollarSign, Globe, Leaf, X, Sparkles } from 'lucide-react';
import { WizardData } from './MealPlannerWizard';

interface MealPlannerWizardSummaryProps {
  data: WizardData;
}

export function MealPlannerWizardSummary({ data }: MealPlannerWizardSummaryProps) {
  const dietLabels: Record<string, string> = {
    omnivora: 'Omnívora',
    vegetariana: 'Vegetariana',
    vegana: 'Vegana',
    pescetariana: 'Pescetariana'
  };

  const skillLabels: Record<string, string> = {
    beginner: 'Principiante',
    intermediate: 'Intermedio',
    advanced: 'Avanzado'
  };

  const budgetLabels: Record<string, string> = {
    low: 'Económico',
    medium: 'Moderado',
    high: 'Premium'
  };

  const cuisineLabels: Record<string, string> = {
    italiana: 'Italiana',
    mexicana: 'Mexicana',
    asiatica: 'Asiática',
    mediterranea: 'Mediterránea',
    argentina: 'Argentina',
    japonesa: 'Japonesa'
  };

  const allergyLabels: Record<string, string> = {
    gluten: 'Gluten',
    lactosa: 'Lactosa',
    'frutos-secos': 'Frutos Secos',
    mariscos: 'Mariscos',
    huevos: 'Huevos',
    soja: 'Soja'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl"
        >
          <Check className="w-10 h-10 text-white" />
        </motion.div>
        <h3 className="text-2xl font-bold text-white mb-2">
          ¡Configuración Completa!
        </h3>
        <p className="text-white/80">
          Aquí está el resumen de tus preferencias
        </p>
      </div>

      <div className="grid gap-4">
        {/* Dietary Preferences */}
        {data.dietaryPreferences.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20"
          >
            <div className="flex items-start gap-3">
              <Leaf className="w-5 h-5 text-green-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-white/60 mb-1">Tipo de dieta</p>
                <div className="flex flex-wrap gap-2">
                  {data.dietaryPreferences.map(diet => (
                    <span key={diet} className="px-3 py-1 bg-green-500/20 rounded-full text-sm text-green-200">
                      {dietLabels[diet] || diet}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Allergies */}
        {data.allergies.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20"
          >
            <div className="flex items-start gap-3">
              <X className="w-5 h-5 text-red-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-white/60 mb-1">Alergias e intolerancias</p>
                <div className="flex flex-wrap gap-2">
                  {data.allergies.map(allergy => (
                    <span key={allergy} className="px-3 py-1 bg-red-500/20 rounded-full text-sm text-red-200">
                      {allergyLabels[allergy] || allergy}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Cuisine Preferences */}
        {data.cuisinePreferences.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20"
          >
            <div className="flex items-start gap-3">
              <Globe className="w-5 h-5 text-purple-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-white/60 mb-1">Cocinas favoritas</p>
                <div className="flex flex-wrap gap-2">
                  {data.cuisinePreferences.map(cuisine => (
                    <span key={cuisine} className="px-3 py-1 bg-purple-500/20 rounded-full text-sm text-purple-200">
                      {cuisineLabels[cuisine] || cuisine}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Cooking Details */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20">
            <ChefHat className="w-5 h-5 text-purple-400 mb-2" />
            <p className="text-sm text-white/60">Nivel</p>
            <p className="text-white font-medium">{skillLabels[data.cookingSkill]}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20">
            <Clock className="w-5 h-5 text-blue-400 mb-2" />
            <p className="text-sm text-white/60">Tiempo máximo</p>
            <p className="text-white font-medium">{data.maxCookingTime} min</p>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20">
            <DollarSign className="w-5 h-5 text-green-400 mb-2" />
            <p className="text-sm text-white/60">Presupuesto</p>
            <p className="text-white font-medium">{budgetLabels[data.budgetLevel]}</p>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-xl rounded-xl p-4 border border-purple-400/20 text-center"
      >
        <div className="flex items-center justify-center gap-2 text-purple-300">
          <Sparkles className="w-5 h-5" />
          <p className="font-medium">¡Todo listo para crear tu plan personalizado!</p>
          <Sparkles className="w-5 h-5" />
        </div>
      </motion.div>
    </motion.div>
  );
}