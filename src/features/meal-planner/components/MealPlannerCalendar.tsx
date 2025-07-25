'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShoppingCart,
  BarChart3,
  Filter,
  X
} from 'lucide-react';
import { useMealPlannerStore } from '../store/mealPlannerStore';
import { cn } from '@/lib/utils';
import GlassMealList from '@/components/meal-planner/GlassMealList';

// Mock data para las comidas
const mockMeals = {
  desayuno: {
    id: '1',
    name: 'Avena con Frutas y Miel',
    image: '/images/breakfast.jpg',
    calories: 320,
    prepTime: 10,
    servings: 1,
    protein: 12,
    carbs: 58,
    fat: 6,
    tags: ['Saludable', 'Rápido', 'Vegetariano'],
    isFavorite: true,
    difficulty: 'Fácil' as const
  },
  almuerzo: {
    id: '2',
    name: 'Salmón Grillado con Quinoa',
    image: '/images/salmon.jpg',
    calories: 480,
    prepTime: 25,
    servings: 1,
    protein: 35,
    carbs: 42,
    fat: 18,
    tags: ['Alto en proteína', 'Omega-3', 'Sin gluten'],
    isFavorite: false,
    difficulty: 'Medio' as const
  },
  cena: {
    id: '3',
    name: 'Pollo al Curry con Arroz Integral',
    image: '/images/curry.jpg',
    calories: 420,
    prepTime: 30,
    servings: 2,
    protein: 28,
    carbs: 48,
    fat: 12,
    tags: ['Especiado', 'Integral', 'Rico en fibra'],
    isFavorite: true,
    difficulty: 'Medio' as const
  }
};

// View types
type ViewType = 'month' | 'week' | 'day';

// Main Calendar Component
export const MealPlannerCalendar: React.FC = () => {
  const {
    isGenerating,
    generateWeeklyPlan,
    userPreferences,
  } = useMealPlannerStore();

  const [viewType, setViewType] = useState<ViewType>('day');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showFilters, setShowFilters] = useState(false);

  // Navigation
  const navigate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  // Generar plan AI
  const handleGenerateAI = (mealType: string) => {
    console.log('Generando con IA:', mealType);
    // TODO: Implementar generación AI
  };

  // Editar comida
  const handleEditMeal = (mealType: string, meal: any) => {
    console.log('Editando comida:', mealType, meal);
    // TODO: Implementar edición
  };

  // Format date for display
  const formatDate = (): string => {
    return currentDate.toLocaleDateString('es-ES', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen">
      {/* Glass Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mb-8 overflow-hidden rounded-3xl"
      >
        {/* Fondo glass ultra transparente */}
        <div className="absolute inset-0 bg-white/[0.02] backdrop-blur-3xl" />
        
        {/* Borde iridiscente */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/20 via-white/5 to-transparent p-[1px]">
          <div className="h-full w-full rounded-3xl bg-black/5 backdrop-blur-3xl" />
        </div>

        <div className="relative p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Title and Date */}
            <div className="flex items-center gap-4">
              <motion.div
                animate={{ 
                  boxShadow: [
                    "0 0 20px rgba(139, 92, 246, 0.3)",
                    "0 0 40px rgba(59, 130, 246, 0.4)",
                    "0 0 20px rgba(139, 92, 246, 0.3)"
                  ]
                }}
                transition={{ duration: 3, repeat: Infinity }}
                className="p-4 rounded-2xl bg-gradient-to-br from-purple-500 via-blue-500 to-pink-500"
              >
                <Calendar className="w-8 h-8 text-white" />
              </motion.div>
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                  Planificador de Comidas
                </h2>
                <p className="text-white/60 text-lg">{formatDate()}</p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Navigation */}
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => navigate('prev')}
                  className="p-3 rounded-xl bg-white/10 backdrop-blur-sm transition-all hover:bg-white/20"
                >
                  <ChevronLeft className="w-5 h-5 text-white" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentDate(new Date())}
                  className="px-4 py-3 text-sm font-medium rounded-xl bg-white/10 backdrop-blur-sm transition-all hover:bg-white/20 text-white"
                >
                  Hoy
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => navigate('next')}
                  className="p-3 rounded-xl bg-white/10 backdrop-blur-sm transition-all hover:bg-white/20"
                >
                  <ChevronRight className="w-5 h-5 text-white" />
                </motion.button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={isGenerating}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg hover:shadow-xl transition-all"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="w-5 h-5" />
                  </motion.div>
                  {isGenerating ? 'Generando...' : 'Generar con IA'}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-3 rounded-xl bg-white/10 backdrop-blur-sm transition-all hover:bg-white/20"
                >
                  <BarChart3 className="w-5 h-5 text-white" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-3 rounded-xl bg-white/10 backdrop-blur-sm transition-all hover:bg-white/20"
                >
                  <ShoppingCart className="w-5 h-5 text-white" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowFilters(!showFilters)}
                  className="p-3 rounded-xl bg-white/10 backdrop-blur-sm transition-all hover:bg-white/20"
                >
                  <Filter className="w-5 h-5 text-white" />
                </motion.button>
              </div>
            </div>
          </div>

          {/* Filters (when visible) */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-6 pt-6 border-t border-white/20"
              >
                <div className="flex flex-wrap gap-2">
                  {['Todas', 'Desayuno', 'Almuerzo', 'Cena', 'Snacks', 'Vegetariano', 'Rápido (<30m)', 'Bajo en calorías'].map(filter => (
                    <motion.button
                      key={filter}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-4 py-2 text-sm rounded-xl bg-white/10 backdrop-blur-sm text-white/80 hover:bg-white/20 hover:text-white transition-all"
                    >
                      {filter}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Partículas de fondo */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-white/20"
              initial={{ 
                x: Math.random() * 800,
                y: Math.random() * 200
              }}
              animate={{
                x: Math.random() * 800,
                y: Math.random() * 200,
              }}
              transition={{
                duration: 20 + i * 5,
                repeat: Infinity,
                ease: "linear"
              }}
            />
          ))}
        </div>
      </motion.div>

      {/* Content */}
      <div className="px-4">
        <GlassMealList
          date={currentDate}
          meals={mockMeals}
          onGenerateAI={handleGenerateAI}
          onEditMeal={handleEditMeal}
        />
      </div>
    </div>
  );
};