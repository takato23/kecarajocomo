"use client";

import { motion } from "framer-motion";
import GlassMealCard from "./GlassMealCard";
import { useState } from "react";
import { Sparkles, ChefHat, Zap, Clock } from "lucide-react";

interface MealData {
  id: string;
  name: string;
  image?: string;
  calories: number;
  prepTime: number;
  servings: number;
  protein: number;
  carbs: number;
  fat: number;
  tags?: string[];
  isFavorite?: boolean;
  difficulty?: "Fácil" | "Medio" | "Difícil";
}

interface GlassMealListProps {
  date: Date;
  meals: {
    desayuno?: MealData;
    almuerzo?: MealData;
    cena?: MealData;
    snack?: MealData;
  };
  onGenerateAI?: (mealType: string) => void;
  onEditMeal?: (mealType: string, meal: MealData) => void;
}

const quickSuggestions = [
  {
    icon: <Sparkles className="h-4 w-4" />,
    text: "Generar día completo con IA",
    gradient: "from-purple-500 to-pink-500",
    action: "generate-full-day"
  },
  {
    icon: <ChefHat className="h-4 w-4" />,
    text: "Recetas rápidas (< 15 min)",
    gradient: "from-blue-500 to-cyan-500",
    action: "quick-recipes"
  },
  {
    icon: <Zap className="h-4 w-4" />,
    text: "Comidas saludables",
    gradient: "from-green-500 to-emerald-500",
    action: "healthy-meals"
  },
  {
    icon: <Clock className="h-4 w-4" />,
    text: "Meal prep para la semana",
    gradient: "from-orange-500 to-red-500",
    action: "meal-prep"
  }
];

export default function GlassMealList({ 
  date, 
  meals,
  onGenerateAI,
  onEditMeal 
}: GlassMealListProps) {
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  
  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) return "Hoy";
    if (date.toDateString() === tomorrow.toDateString()) return "Mañana";
    
    return date.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
  };

  const totalCalories = Object.values(meals).reduce((sum, meal) => 
    sum + (meal?.calories || 0), 0
  );

  const hasAnyMeal = Object.values(meals).some(meal => meal);

  return (
    <div className="space-y-6">
      {/* Header del día */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl"
      >
        {/* Fondo glass */}
        <div className="absolute inset-0 bg-white/5 backdrop-blur-xl" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent" />
        
        <div className="relative p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">
                {formatDate(date)}
              </h2>
              <p className="text-white/60">
                {date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            
            {hasAnyMeal && (
              <div className="text-right">
                <p className="text-3xl font-bold text-white">{totalCalories}</p>
                <p className="text-sm text-white/60">kcal totales</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Partículas de fondo */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-1 w-1 rounded-full bg-white/20"
              initial={{ 
                x: Math.random() * 400,
                y: Math.random() * 100
              }}
              animate={{
                x: Math.random() * 400,
                y: Math.random() * 100,
              }}
              transition={{
                duration: 15 + i * 3,
                repeat: Infinity,
                ease: "linear"
              }}
            />
          ))}
        </div>
      </motion.div>

      {/* Sugerencias rápidas - solo si no hay comidas */}
      {!hasAnyMeal && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <h3 className="text-lg font-semibold text-white/80 mb-4">
            Sugerencias rápidas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {quickSuggestions.map((suggestion, i) => (
              <motion.button
                key={suggestion.action}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSelectedSuggestion(suggestion.action);
                  onGenerateAI?.(suggestion.action);
                }}
                className="relative overflow-hidden rounded-2xl p-4 text-left transition-all duration-300"
              >
                {/* Fondo glass */}
                <div className="absolute inset-0 bg-white/5 backdrop-blur-xl" />
                <div className={`absolute inset-0 bg-gradient-to-br ${suggestion.gradient} opacity-10`} />
                
                {/* Borde */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 via-white/5 to-transparent p-[1px]">
                  <div className="h-full w-full rounded-2xl bg-black/20" />
                </div>
                
                <div className="relative flex items-center gap-3">
                  <div className={`rounded-xl bg-gradient-to-br ${suggestion.gradient} p-2 text-white`}>
                    {suggestion.icon}
                  </div>
                  <span className="text-sm font-medium text-white/80">
                    {suggestion.text}
                  </span>
                </div>
                
                {selectedSuggestion === suggestion.action && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute right-3 top-3"
                  >
                    <div className="h-2 w-2 rounded-full bg-green-400" />
                  </motion.div>
                )}
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Grid de comidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Desayuno */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlassMealCard
            meal={meals.desayuno}
            mealType="desayuno"
            isEmpty={!meals.desayuno}
            onAdd={() => onGenerateAI?.("desayuno")}
            onEdit={() => meals.desayuno && onEditMeal?.("desayuno", meals.desayuno)}
          />
        </motion.div>

        {/* Almuerzo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GlassMealCard
            meal={meals.almuerzo}
            mealType="almuerzo"
            isEmpty={!meals.almuerzo}
            onAdd={() => onGenerateAI?.("almuerzo")}
            onEdit={() => meals.almuerzo && onEditMeal?.("almuerzo", meals.almuerzo)}
          />
        </motion.div>

        {/* Cena */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <GlassMealCard
            meal={meals.cena}
            mealType="cena"
            isEmpty={!meals.cena}
            onAdd={() => onGenerateAI?.("cena")}
            onEdit={() => meals.cena && onEditMeal?.("cena", meals.cena)}
          />
        </motion.div>

        {/* Snack */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <GlassMealCard
            meal={meals.snack}
            mealType="snack"
            isEmpty={!meals.snack}
            onAdd={() => onGenerateAI?.("snack")}
            onEdit={() => meals.snack && onEditMeal?.("snack", meals.snack)}
          />
        </motion.div>
      </div>

      {/* Resumen nutricional - solo si hay comidas */}
      {hasAnyMeal && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="relative overflow-hidden rounded-3xl"
        >
          {/* Fondo glass */}
          <div className="absolute inset-0 bg-white/5 backdrop-blur-xl" />
          <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 to-blue-400/10" />
          
          <div className="relative p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">
              Resumen nutricional del día
            </h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">
                  {Object.values(meals).reduce((sum, meal) => sum + (meal?.protein || 0), 0)}g
                </p>
                <p className="text-sm text-white/60">Proteína</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-400">
                  {Object.values(meals).reduce((sum, meal) => sum + (meal?.carbs || 0), 0)}g
                </p>
                <p className="text-sm text-white/60">Carbohidratos</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-400">
                  {Object.values(meals).reduce((sum, meal) => sum + (meal?.fat || 0), 0)}g
                </p>
                <p className="text-sm text-white/60">Grasas</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}