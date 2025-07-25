"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import Image from "next/image";
import { Clock, Users, Flame, Heart, Plus, MoreVertical, Sparkles, ChefHat, Timer } from "lucide-react";

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

interface GlassMealCardProps {
  meal?: MealData;
  mealType: "desayuno" | "almuerzo" | "cena" | "snack";
  isEmpty?: boolean;
  onAdd?: () => void;
  onEdit?: () => void;
  onRemove?: () => void;
  onFavorite?: () => void;
}

const mealTypeConfig = {
  desayuno: {
    gradient: "from-amber-400/20 to-orange-400/20",
    icon: "🌅",
    time: "7:00 - 9:00",
    bgGlow: "bg-gradient-to-br from-amber-200/10 to-orange-200/10"
  },
  almuerzo: {
    gradient: "from-blue-400/20 to-cyan-400/20",
    icon: "☀️",
    time: "13:00 - 15:00",
    bgGlow: "bg-gradient-to-br from-blue-200/10 to-cyan-200/10"
  },
  cena: {
    gradient: "from-purple-400/20 to-pink-400/20",
    icon: "🌙",
    time: "20:00 - 22:00",
    bgGlow: "bg-gradient-to-br from-purple-200/10 to-pink-200/10"
  },
  snack: {
    gradient: "from-green-400/20 to-emerald-400/20",
    icon: "🍃",
    time: "A cualquier hora",
    bgGlow: "bg-gradient-to-br from-green-200/10 to-emerald-200/10"
  }
};

export default function GlassMealCard({ 
  meal, 
  mealType, 
  isEmpty = false,
  onAdd,
  onEdit,
  onRemove,
  onFavorite
}: GlassMealCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const config = mealTypeConfig[mealType];

  if (isEmpty) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onAdd}
        className="relative h-full min-h-[280px] cursor-pointer overflow-hidden rounded-3xl"
      >
        {/* Fondo glass transparente */}
        <div className="absolute inset-0 bg-white/5 backdrop-blur-xl" />
        
        {/* Borde gradiente sutil */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/20 via-white/5 to-transparent p-[1px]">
          <div className="h-full w-full rounded-3xl bg-black/20 backdrop-blur-xl" />
        </div>

        {/* Contenido */}
        <div className="relative z-10 flex h-full flex-col items-center justify-center p-8 text-center">
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className={`mb-4 rounded-2xl bg-gradient-to-br ${config.gradient} p-4`}
          >
            <Plus className="h-8 w-8 text-white" />
          </motion.div>
          
          <h3 className="mb-2 text-lg font-medium text-white/80">
            Agregar {mealType}
          </h3>
          <p className="text-sm text-white/50">{config.time}</p>
          
          <motion.div
            className="mt-4 flex items-center gap-2 text-white/40"
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles className="h-4 w-4" />
            <span className="text-xs">Generar con IA</span>
          </motion.div>
        </div>

        {/* Partículas flotantes */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-1 w-1 rounded-full bg-white/30"
              initial={{ 
                x: Math.random() * 300,
                y: Math.random() * 300
              }}
              animate={{
                x: Math.random() * 300,
                y: Math.random() * 300,
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
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -5 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative h-full min-h-[320px] overflow-hidden rounded-3xl"
    >
      {/* Fondo glass ultra transparente */}
      <div className="absolute inset-0 bg-white/[0.03] backdrop-blur-2xl" />
      
      {/* Glow de fondo */}
      <div className={`absolute inset-0 ${config.bgGlow} opacity-50`} />
      
      {/* Borde iridiscente */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/10 via-white/5 to-transparent p-[1px]">
        <div className="h-full w-full rounded-3xl bg-black/10 backdrop-blur-2xl" />
      </div>

      {/* Imagen con overlay */}
      {meal?.image && (
        <div className="absolute inset-0">
          <Image
            src={meal.image}
            alt={meal.name}
            fill
            className="object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        </div>
      )}

      {/* Contenido */}
      <div className="relative z-10 flex h-full flex-col p-6">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={isHovered ? { rotate: [0, -10, 10, 0] } : {}}
              className={`rounded-xl bg-gradient-to-br ${config.gradient} p-2`}
            >
              <span className="text-xl">{config.icon}</span>
            </motion.div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-white/50">
                {mealType}
              </p>
              <p className="text-xs text-white/30">{config.time}</p>
            </div>
          </div>
          
          {/* Menu y favorito */}
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onFavorite}
              className="rounded-full bg-white/10 p-2 backdrop-blur-sm transition-colors hover:bg-white/20"
            >
              <Heart 
                className={`h-4 w-4 ${meal?.isFavorite ? 'fill-red-500 text-red-500' : 'text-white/60'}`} 
              />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowMenu(!showMenu)}
              className="rounded-full bg-white/10 p-2 backdrop-blur-sm transition-colors hover:bg-white/20"
            >
              <MoreVertical className="h-4 w-4 text-white/60" />
            </motion.button>
          </div>
        </div>

        {/* Nombre del plato */}
        <h3 className="mb-3 text-xl font-semibold text-white">
          {meal?.name}
        </h3>

        {/* Tags */}
        {meal?.tags && (
          <div className="mb-4 flex flex-wrap gap-2">
            {meal.tags.slice(0, 3).map((tag, i) => (
              <span
                key={i}
                className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70 backdrop-blur-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Stats */}
        <div className="space-y-3">
          {/* Calorías principales */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-400" />
              <span className="text-2xl font-bold text-white">{meal?.calories}</span>
              <span className="text-sm text-white/50">kcal</span>
            </div>
            <div className="rounded-full bg-white/10 px-3 py-1 backdrop-blur-sm">
              <span className="text-xs font-medium text-white/70">
                {meal?.difficulty || "Medio"}
              </span>
            </div>
          </div>

          {/* Info adicional */}
          <div className="grid grid-cols-3 gap-3 rounded-2xl bg-white/5 p-3 backdrop-blur-sm">
            <div className="text-center">
              <Timer className="mx-auto mb-1 h-4 w-4 text-white/40" />
              <p className="text-xs font-medium text-white/80">{meal?.prepTime}'</p>
            </div>
            <div className="text-center">
              <Users className="mx-auto mb-1 h-4 w-4 text-white/40" />
              <p className="text-xs font-medium text-white/80">{meal?.servings}</p>
            </div>
            <div className="text-center">
              <ChefHat className="mx-auto mb-1 h-4 w-4 text-white/40" />
              <p className="text-xs font-medium text-white/80">{meal?.protein}g</p>
            </div>
          </div>

          {/* Macros */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/50">Proteína</span>
              <span className="text-white/80">{meal?.protein}g</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/50">Carbos</span>
              <span className="text-white/80">{meal?.carbs}g</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/50">Grasa</span>
              <span className="text-white/80">{meal?.fat}g</span>
            </div>
          </div>
        </div>
      </div>

      {/* Efecto liquid hover */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 pointer-events-none"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Menu contextual */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            className="absolute right-6 top-16 z-20 overflow-hidden rounded-2xl bg-black/80 backdrop-blur-xl"
          >
            <button
              onClick={() => { onEdit?.(); setShowMenu(false); }}
              className="flex w-full items-center gap-3 px-4 py-3 text-sm text-white/80 transition-colors hover:bg-white/10"
            >
              Editar
            </button>
            <button
              onClick={() => { onRemove?.(); setShowMenu(false); }}
              className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-400 transition-colors hover:bg-white/10"
            >
              Eliminar
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}