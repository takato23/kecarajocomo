'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Calendar,
  Clock,
  BarChart3,
  Heart,
  Users,
  Utensils,
  Flame,
  Target,
  Award,
  Activity,
  Zap,
  Coffee,
  Apple,
  Sandwich,
  Moon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { iOS26EnhancedCard } from '@/components/ios26';

interface ModernPlannerStatsProps {
  weekStats: {
    totalRecipes: number;
    uniqueRecipes: number;
    totalServings: number;
    totalTime: number;
    avgCalories: number;
    completionPercentage: number;
  };
  currentWeek: Date;
}

export default function ModernPlannerStats({
  weekStats,
  currentWeek
}: ModernPlannerStatsProps) {
  const CircularProgress = ({ 
    percentage, 
    size = 80, 
    strokeWidth = 6, 
    label, 
    value, 
    color = "#3b82f6",
    icon
  }: {
    percentage: number;
    size?: number;
    strokeWidth?: number;
    label: string;
    value: string;
    color?: string;
    icon?: React.ReactNode;
  }) => {
    const center = size / 2;
    const radius = center - strokeWidth / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative flex flex-col items-center">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
        </svg>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {icon && (
            <div className="mb-1">{icon}</div>
          )}
          <div className="text-lg font-bold text-gray-900 dark:text-white">{value}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400 text-center px-2">{label}</div>
        </div>
      </div>
    );
  };

  const mealDistribution = {
    desayuno: { count: 5, icon: Coffee, color: 'from-amber-400 to-orange-400' },
    almuerzo: { count: 7, icon: Apple, color: 'from-blue-400 to-cyan-400' },
    cena: { count: 6, icon: Moon, color: 'from-purple-400 to-pink-400' },
    snack: { count: 3, icon: Sandwich, color: 'from-green-400 to-emerald-400' }
  };

  const nutritionGoals = [
    { name: 'Proteínas', current: 85, target: 100, unit: 'g', color: '#ef4444' },
    { name: 'Carbohidratos', current: 230, target: 250, unit: 'g', color: '#f59e0b' },
    { name: 'Grasas', current: 65, target: 70, unit: 'g', color: '#22c55e' },
    { name: 'Fibra', current: 25, target: 30, unit: 'g', color: '#8b5cf6' }
  ];

  return (
    <div className="space-y-4">
      {/* Progress Overview */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        <iOS26EnhancedCard
          variant="aurora"
          elevation="high"
          className="relative overflow-hidden"
        >
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              Progreso Semanal
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <CircularProgress
                percentage={weekStats.completionPercentage}
                label="Planificado"
                value={`${weekStats.totalRecipes}/28`}
                color="#10b981"
                size={70}
                icon={<Target className="w-4 h-4 text-green-500" />}
              />
              <CircularProgress
                percentage={Math.min((weekStats.uniqueRecipes / 15) * 100, 100)}
                label="Variedad"
                value={`${weekStats.uniqueRecipes}`}
                color="#8b5cf6"
                size={70}
                icon={<Award className="w-4 h-4 text-purple-500" />}
              />
            </div>
            
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600 dark:text-gray-400">Meta semanal</span>
                <span className="text-xs font-semibold text-gray-900 dark:text-white">
                  {weekStats.totalRecipes} / 28 comidas
                </span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${weekStats.completionPercentage}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
            </div>
          </div>
        </iOS26EnhancedCard>
      </motion.div>

      {/* Meal Distribution */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <iOS26EnhancedCard
          variant="sunset"
          elevation="high"
          className="relative overflow-hidden"
        >
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Utensils className="w-4 h-4 text-orange-500" />
              Distribución de Comidas
            </h3>
            
            <div className="space-y-3">
              {Object.entries(mealDistribution).map(([meal, data]) => {
                const Icon = data.icon;
                const percentage = (data.count / weekStats.totalRecipes) * 100;
                
                return (
                  <div key={meal} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-6 h-6 rounded-lg bg-gradient-to-br flex items-center justify-center",
                          data.color
                        )}>
                          <Icon className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 capitalize">
                          {meal}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-gray-900 dark:text-white">
                        {data.count}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        className={cn("h-full bg-gradient-to-r rounded-full", data.color)}
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.8, delay: 0.1 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </iOS26EnhancedCard>
      </motion.div>

      {/* Nutrition Goals */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <iOS26EnhancedCard
          variant="forest"
          elevation="high"
          className="relative overflow-hidden"
        >
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-green-500" />
              Objetivos Nutricionales
            </h3>
            
            <div className="space-y-3">
              {nutritionGoals.map((goal) => {
                const percentage = (goal.current / goal.target) * 100;
                
                return (
                  <div key={goal.name} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {goal.name}
                      </span>
                      <span className="text-xs font-bold text-gray-900 dark:text-white">
                        {goal.current}{goal.unit} / {goal.target}{goal.unit}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: goal.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(percentage, 100)}%` }}
                        transition={{ duration: 0.8, delay: 0.1 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </iOS26EnhancedCard>
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <iOS26EnhancedCard
          variant="ocean"
          elevation="high"
          className="relative overflow-hidden"
        >
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-purple-500" />
              Estadísticas Rápidas
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span className="text-xs text-gray-700 dark:text-gray-300">Tiempo total</span>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {Math.round(weekStats.totalTime / 60)}h {weekStats.totalTime % 60}m
                </span>
              </div>
              
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-gray-700 dark:text-gray-300">Porciones totales</span>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {weekStats.totalServings}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span className="text-xs text-gray-700 dark:text-gray-300">Calorías promedio</span>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {weekStats.avgCalories} kcal
                </span>
              </div>
              
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-500" />
                  <span className="text-xs text-gray-700 dark:text-gray-300">Favoritos</span>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  12
                </span>
              </div>
            </div>
          </div>
        </iOS26EnhancedCard>
      </motion.div>

      {/* Achievement */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <iOS26EnhancedCard
          variant="aurora"
          elevation="high"
          className="relative overflow-hidden"
        >
          <div className="p-4 text-center">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="inline-block mb-3"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Zap className="w-8 h-8 text-white" />
              </div>
            </motion.div>
            
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              ¡Racha de 5 días!
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Sigue así para desbloquear nuevas recetas
            </p>
          </div>
        </iOS26EnhancedCard>
      </motion.div>
    </div>
  );
}