'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  CalendarDays,
  Home,
  Sparkles,
  TrendingUp,
  Clock,
  Target,
  Zap
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { iOS26EnhancedCard } from '@/components/ios26';

interface UltraModernWeekNavigatorProps {
  currentWeek: Date;
  onWeekChange: (newWeek: Date) => void;
  onGoToToday?: () => void;
  totalMeals?: number;
  plannedMeals?: number;
  className?: string;
  minWeek?: Date;
  maxWeek?: Date;
  isLoading?: boolean;
}

export default function UltraModernWeekNavigator({
  currentWeek,
  onWeekChange,
  onGoToToday,
  totalMeals = 28,
  plannedMeals = 0,
  className,
  minWeek,
  maxWeek,
  isLoading = false
}: UltraModernWeekNavigatorProps) {
  
  const weekStart = useMemo(() => {
    const date = new Date(currentWeek);
    const day = date.getDay();
    const diff = date.getDate() - day;
    return new Date(date.setDate(diff));
  }, [currentWeek]);
  
  const weekEnd = useMemo(() => {
    const date = new Date(weekStart);
    return new Date(date.setDate(date.getDate() + 6));
  }, [weekStart]);
  
  const isCurrentWeek = useMemo(() => {
    const today = new Date();
    const todayWeekStart = new Date(today);
    const day = todayWeekStart.getDay();
    const diff = todayWeekStart.getDate() - day;
    todayWeekStart.setDate(diff);
    return weekStart.toDateString() === todayWeekStart.toDateString();
  }, [weekStart]);
  
  const completionPercentage = useMemo(() => 
    Math.round((plannedMeals / totalMeals) * 100),
    [plannedMeals, totalMeals]
  );
  
  const canGoPrevious = useMemo(() => {
    if (!minWeek) return true;
    const prevWeek = new Date(currentWeek);
    prevWeek.setDate(prevWeek.getDate() - 7);
    return prevWeek >= minWeek;
  }, [currentWeek, minWeek]);
  
  const canGoNext = useMemo(() => {
    if (!maxWeek) return true;
    const nextWeek = new Date(currentWeek);
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek <= maxWeek;
  }, [currentWeek, maxWeek]);
  
  const handlePreviousWeek = () => {
    if (!canGoPrevious || isLoading) return;
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() - 7);
    onWeekChange(newWeek);
  };
  
  const handleNextWeek = () => {
    if (!canGoNext || isLoading) return;
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() + 7);
    onWeekChange(newWeek);
  };
  
  const handleGoToToday = () => {
    if (isLoading) return;
    const today = new Date();
    onWeekChange(today);
    onGoToToday?.();
  };
  
  const dateTextVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0
    })
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={cn("w-full", className)}
    >
      <iOS26EnhancedCard
        variant="ocean"
        elevation="high"
        className="relative overflow-hidden"
      >
        {/* Animated background */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-pulse" />
        </div>
        
        <div className="relative z-10 p-4 md:p-6">
          {/* Main navigation row */}
          <div className="flex items-center justify-between mb-6">
            {/* Previous button - Ultra Glassy */}
            <motion.button
              whileHover={{ scale: canGoPrevious ? 1.05 : 1 }}
              whileTap={{ scale: canGoPrevious ? 0.95 : 1 }}
              onClick={handlePreviousWeek}
              disabled={!canGoPrevious || isLoading}
              className={cn(
                "relative p-3 rounded-2xl transition-all duration-300 group overflow-hidden",
                canGoPrevious 
                  ? "cursor-pointer" 
                  : "opacity-50 cursor-not-allowed"
              )}
              style={{
                background: canGoPrevious 
                  ? "rgba(255, 255, 255, 0.08)"
                  : "rgba(255, 255, 255, 0.02)",
                backdropFilter: "blur(20px) saturate(180%)",
                WebkitBackdropFilter: "blur(20px) saturate(180%)",
                border: "1px solid rgba(255, 255, 255, 0.18)",
                boxShadow: canGoPrevious ? `
                  0 4px 30px rgba(0, 0, 0, 0.1),
                  inset 0 1px 0 rgba(255, 255, 255, 0.6),
                  inset 0 -1px 0 rgba(0, 0, 0, 0.1),
                  0 0 0 1px rgba(255, 255, 255, 0.1)
                ` : "none"
              }}
            >
              {/* Glass shine effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-white/10 to-transparent" />
                <div className="absolute -inset-x-2 -top-2 h-[200%] bg-gradient-to-b from-white/30 via-transparent to-transparent blur-xl transform rotate-12" />
              </div>
              
              {/* Prismatic effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-50 transition-opacity duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 via-purple-400/20 to-pink-400/20 blur-md" />
              </div>
              
              {/* Icon with glow */}
              <div className="relative z-10">
                <ChevronLeft className={cn(
                  "w-5 h-5 transition-all duration-300",
                  canGoPrevious 
                    ? "text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white" 
                    : "text-gray-400"
                )} />
                {canGoPrevious && (
                  <div className="absolute inset-0 blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-300">
                    <ChevronLeft className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
            </motion.button>
            
            {/* Center content */}
            <div className="flex-1 px-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={weekStart.toISOString()}
                  variants={dateTextVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="text-center"
                >
                  {/* Week dates */}
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {(() => {
                      const startMonth = weekStart.toLocaleDateString('es-ES', { month: 'short' });
                      const endMonth = weekEnd.toLocaleDateString('es-ES', { month: 'short' });
                      const startDay = weekStart.getDate();
                      const endDay = weekEnd.getDate();
                      const year = weekEnd.getFullYear();
                      
                      const dateText = startMonth === endMonth
                        ? `${startDay} - ${endDay} ${startMonth}`
                        : `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
                      
                      return (
                        <>
                          <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                            {dateText}
                          </span>
                          <span className="text-base text-gray-600 dark:text-gray-400 ml-2">
                            {year}
                          </span>
                        </>
                      );
                    })()}
                  </h2>
                  
                  {/* Week number */}
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Semana {Math.ceil((weekStart.getTime() - new Date(weekStart.getFullYear(), 0, 1).getTime()) / 604800000)}
                  </p>
                  
                  {/* Current week indicator */}
                  {isCurrentWeek && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="inline-flex items-center gap-1 mt-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium"
                    >
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      Semana actual
                    </motion.div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
            
            {/* Next button - Ultra Glassy */}
            <motion.button
              whileHover={{ scale: canGoNext ? 1.05 : 1 }}
              whileTap={{ scale: canGoNext ? 0.95 : 1 }}
              onClick={handleNextWeek}
              disabled={!canGoNext || isLoading}
              className={cn(
                "relative p-3 rounded-2xl transition-all duration-300 group overflow-hidden",
                canGoNext 
                  ? "cursor-pointer" 
                  : "opacity-50 cursor-not-allowed"
              )}
              style={{
                background: canGoNext 
                  ? "rgba(255, 255, 255, 0.08)"
                  : "rgba(255, 255, 255, 0.02)",
                backdropFilter: "blur(20px) saturate(180%)",
                WebkitBackdropFilter: "blur(20px) saturate(180%)",
                border: "1px solid rgba(255, 255, 255, 0.18)",
                boxShadow: canGoNext ? `
                  0 4px 30px rgba(0, 0, 0, 0.1),
                  inset 0 1px 0 rgba(255, 255, 255, 0.6),
                  inset 0 -1px 0 rgba(0, 0, 0, 0.1),
                  0 0 0 1px rgba(255, 255, 255, 0.1)
                ` : "none"
              }}
            >
              {/* Glass shine effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-white/10 to-transparent" />
                <div className="absolute -inset-x-2 -top-2 h-[200%] bg-gradient-to-b from-white/30 via-transparent to-transparent blur-xl transform rotate-12" />
              </div>
              
              {/* Prismatic effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-50 transition-opacity duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 via-purple-400/20 to-pink-400/20 blur-md" />
              </div>
              
              {/* Icon with glow */}
              <div className="relative z-10">
                <ChevronRight className={cn(
                  "w-5 h-5 transition-all duration-300",
                  canGoNext 
                    ? "text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white" 
                    : "text-gray-400"
                )} />
                {canGoNext && (
                  <div className="absolute inset-0 blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-300">
                    <ChevronRight className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
            </motion.button>
          </div>
          
          {/* Progress section */}
          <div className="space-y-4">
            {/* Progress stats */}
            <div className="grid grid-cols-3 gap-4">
              {/* Planned meals - Ultra Glassy */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="relative rounded-2xl p-4 text-center group overflow-hidden"
                style={{
                  background: "rgba(255, 255, 255, 0.06)",
                  backdropFilter: "blur(30px) saturate(200%)",
                  WebkitBackdropFilter: "blur(30px) saturate(200%)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  boxShadow: `
                    0 8px 32px rgba(0, 0, 0, 0.08),
                    inset 0 2px 4px rgba(255, 255, 255, 0.5),
                    inset 0 -2px 4px rgba(0, 0, 0, 0.05),
                    0 0 0 1px rgba(255, 255, 255, 0.05)
                  `
                }}
              >
                {/* Glass reflection */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-50" />
                
                {/* Hover shine */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute -inset-x-4 -top-8 h-[200%] bg-gradient-to-b from-white/15 via-transparent to-transparent blur-3xl transform rotate-12" />
                </div>
                
                <div className="relative z-10">
                  <CalendarDays className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {plannedMeals}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Planificadas
                  </div>
                </div>
              </motion.div>
              
              {/* Total meals - Ultra Glassy */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="relative rounded-2xl p-4 text-center group overflow-hidden"
                style={{
                  background: "rgba(255, 255, 255, 0.06)",
                  backdropFilter: "blur(30px) saturate(200%)",
                  WebkitBackdropFilter: "blur(30px) saturate(200%)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  boxShadow: `
                    0 8px 32px rgba(0, 0, 0, 0.08),
                    inset 0 2px 4px rgba(255, 255, 255, 0.5),
                    inset 0 -2px 4px rgba(0, 0, 0, 0.05),
                    0 0 0 1px rgba(255, 255, 255, 0.05)
                  `
                }}
              >
                {/* Glass reflection */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-50" />
                
                {/* Hover shine */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute -inset-x-4 -top-8 h-[200%] bg-gradient-to-b from-white/15 via-transparent to-transparent blur-3xl transform rotate-12" />
                </div>
                
                <div className="relative z-10">
                  <Target className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {totalMeals}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Objetivo
                  </div>
                </div>
              </motion.div>
              
              {/* Completion - Ultra Glassy */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="relative rounded-2xl p-4 text-center group overflow-hidden"
                style={{
                  background: "rgba(255, 255, 255, 0.06)",
                  backdropFilter: "blur(30px) saturate(200%)",
                  WebkitBackdropFilter: "blur(30px) saturate(200%)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  boxShadow: `
                    0 8px 32px rgba(0, 0, 0, 0.08),
                    inset 0 2px 4px rgba(255, 255, 255, 0.5),
                    inset 0 -2px 4px rgba(0, 0, 0, 0.05),
                    0 0 0 1px rgba(255, 255, 255, 0.05)
                  `
                }}
              >
                {/* Glass reflection */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-50" />
                
                {/* Hover shine */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute -inset-x-4 -top-8 h-[200%] bg-gradient-to-b from-white/15 via-transparent to-transparent blur-3xl transform rotate-12" />
                </div>
                
                <div className="relative z-10">
                  <TrendingUp className="w-6 h-6 text-green-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {completionPercentage}%
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Completo
                  </div>
                </div>
              </motion.div>
            </div>
            
            {/* Progress bar */}
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Progreso semanal
                </span>
                <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                  {plannedMeals} / {totalMeals}
                </span>
              </div>
              <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    background: `linear-gradient(to right, ${
                      completionPercentage < 25 ? '#ef4444' :
                      completionPercentage < 50 ? '#f59e0b' :
                      completionPercentage < 75 ? '#eab308' :
                      '#22c55e'
                    }, ${
                      completionPercentage < 25 ? '#dc2626' :
                      completionPercentage < 50 ? '#f97316' :
                      completionPercentage < 75 ? '#fbbf24' :
                      '#16a34a'
                    })`
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${completionPercentage}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
                
                {/* Animated glow */}
                <motion.div
                  className="absolute inset-y-0 left-0 bg-white/30 blur-xl"
                  style={{ width: `${completionPercentage}%` }}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
            </div>
            
            {/* Quick actions - Ultra Glassy */}
            <div className="flex items-center justify-center gap-2 pt-2">
              {!isCurrentWeek && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleGoToToday}
                  disabled={isLoading}
                  className="relative flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 text-sm font-medium group overflow-hidden"
                  style={{
                    background: "rgba(59, 130, 246, 0.08)",
                    backdropFilter: "blur(24px) saturate(200%)",
                    WebkitBackdropFilter: "blur(24px) saturate(200%)",
                    border: "1px solid rgba(59, 130, 246, 0.2)",
                    boxShadow: `
                      0 8px 32px rgba(59, 130, 246, 0.12),
                      inset 0 1px 0 rgba(255, 255, 255, 0.4),
                      inset 0 -1px 0 rgba(59, 130, 246, 0.2),
                      0 0 0 1px rgba(255, 255, 255, 0.05)
                    `
                  }}
                >
                  {/* Multi-layer glass effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 via-transparent to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {/* Shine overlay */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/15 via-white/5 to-transparent" />
                    <div className="absolute -inset-x-4 -top-4 h-[200%] bg-gradient-to-b from-white/20 via-transparent to-transparent blur-2xl transform rotate-12 translate-x-1/2" />
                  </div>
                  
                  {/* Content with glow */}
                  <div className="relative z-10 flex items-center gap-2">
                    <Home className="w-4 h-4 text-blue-600 dark:text-blue-400 transition-colors group-hover:text-blue-700 dark:group-hover:text-blue-300" />
                    <span className="text-blue-600 dark:text-blue-400 transition-colors group-hover:text-blue-700 dark:group-hover:text-blue-300">
                      Semana actual
                    </span>
                  </div>
                  
                  {/* Icon glow */}
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none">
                    <div className="w-8 h-8 bg-blue-400 blur-xl rounded-full" />
                  </div>
                </motion.button>
              )}
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={isLoading}
                className="relative flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 text-sm font-medium group overflow-hidden"
                style={{
                  background: "rgba(147, 51, 234, 0.08)",
                  backdropFilter: "blur(24px) saturate(200%)",
                  WebkitBackdropFilter: "blur(24px) saturate(200%)",
                  border: "1px solid rgba(147, 51, 234, 0.2)",
                  boxShadow: `
                    0 8px 32px rgba(147, 51, 234, 0.12),
                    inset 0 1px 0 rgba(255, 255, 255, 0.4),
                    inset 0 -1px 0 rgba(147, 51, 234, 0.2),
                    0 0 0 1px rgba(255, 255, 255, 0.05)
                  `
                }}
              >
                {/* Multi-layer glass effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 via-transparent to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Shine overlay */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/15 via-white/5 to-transparent" />
                  <div className="absolute -inset-x-4 -top-4 h-[200%] bg-gradient-to-b from-white/20 via-transparent to-transparent blur-2xl transform rotate-12 translate-x-1/2" />
                </div>
                
                {/* Prismatic sparkle effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-700">
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-400/20 via-purple-400/20 to-blue-400/20 blur-lg animate-pulse" />
                </div>
                
                {/* Content with glow */}
                <div className="relative z-10 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 transition-colors group-hover:text-purple-700 dark:group-hover:text-purple-300" />
                  <span className="text-purple-600 dark:text-purple-400 transition-colors group-hover:text-purple-700 dark:group-hover:text-purple-300">
                    Sugerencias IA
                  </span>
                </div>
                
                {/* Icon glow */}
                <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none">
                  <div className="w-8 h-8 bg-purple-400 blur-xl rounded-full" />
                </div>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={isLoading}
                className="relative flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 text-sm font-medium group overflow-hidden"
                style={{
                  background: "rgba(107, 114, 128, 0.08)",
                  backdropFilter: "blur(24px) saturate(200%)",
                  WebkitBackdropFilter: "blur(24px) saturate(200%)",
                  border: "1px solid rgba(107, 114, 128, 0.2)",
                  boxShadow: `
                    0 8px 32px rgba(107, 114, 128, 0.12),
                    inset 0 1px 0 rgba(255, 255, 255, 0.4),
                    inset 0 -1px 0 rgba(107, 114, 128, 0.2),
                    0 0 0 1px rgba(255, 255, 255, 0.05)
                  `
                }}
              >
                {/* Multi-layer glass effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-400/10 via-transparent to-gray-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Shine overlay */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/15 via-white/5 to-transparent" />
                  <div className="absolute -inset-x-4 -top-4 h-[200%] bg-gradient-to-b from-white/20 via-transparent to-transparent blur-2xl transform rotate-12 translate-x-1/2" />
                </div>
                
                {/* Content with glow */}
                <div className="relative z-10 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-600 dark:text-gray-400 transition-colors group-hover:text-gray-700 dark:group-hover:text-gray-300" />
                  <span className="text-gray-600 dark:text-gray-400 transition-colors group-hover:text-gray-700 dark:group-hover:text-gray-300">
                    Historial
                  </span>
                </div>
                
                {/* Icon glow */}
                <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none">
                  <div className="w-8 h-8 bg-gray-400 blur-xl rounded-full" />
                </div>
              </motion.button>
            </div>
          </div>
        </div>
        
        {/* Loading overlay */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center z-20"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 rounded-full border-3 border-gray-300 border-t-blue-500"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </iOS26EnhancedCard>
    </motion.div>
  );
}