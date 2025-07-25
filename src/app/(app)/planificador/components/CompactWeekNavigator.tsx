'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Sparkles,
  Clock,
  Home
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { iOS26EnhancedCard } from '@/components/ios26';

interface CompactWeekNavigatorProps {
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

export default function CompactWeekNavigator({
  currentWeek,
  onWeekChange,
  onGoToToday,
  totalMeals = 28,
  plannedMeals = 0,
  className,
  minWeek,
  maxWeek,
  isLoading = false
}: CompactWeekNavigatorProps) {
  
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
        
        <div className="relative z-10 p-3 md:p-4">
          {/* Main navigation row */}
          <div className="flex items-center justify-between">
            {/* Previous button - Ultra Glassy but smaller */}
            <motion.button
              whileHover={{ scale: canGoPrevious ? 1.05 : 1 }}
              whileTap={{ scale: canGoPrevious ? 0.95 : 1 }}
              onClick={handlePreviousWeek}
              disabled={!canGoPrevious || isLoading}
              className={cn(
                "relative p-2 rounded-xl transition-all duration-300 group overflow-hidden",
                canGoPrevious 
                  ? "cursor-pointer" 
                  : "opacity-50 cursor-not-allowed"
              )}
              style={{
                background: "rgba(255, 255, 255, 0.08)",
                backdropFilter: "blur(20px) saturate(180%)",
                WebkitBackdropFilter: "blur(20px) saturate(180%)",
                border: "1px solid rgba(255, 255, 255, 0.18)",
                boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)"
              }}
            >
              {/* Glass shine effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-white/10 to-transparent" />
              </div>
              
              {/* Icon */}
              <div className="relative z-10">
                <ChevronLeft className={cn(
                  "w-4 h-4 transition-all duration-300",
                  canGoPrevious 
                    ? "text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white" 
                    : "text-gray-400"
                )} />
              </div>
            </motion.button>
            
            {/* Center content - More compact and responsive */}
            <div className="flex-1 px-2 md:px-3">
              <AnimatePresence mode="wait">
                <motion.div
                  key={weekStart.toISOString()}
                  variants={dateTextVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="flex flex-col md:flex-row md:items-center md:justify-between gap-2"
                >
                  {/* Week dates and indicator */}
                  <div className="flex items-center gap-2 md:gap-3">
                    {/* Week dates */}
                    <div className="flex items-baseline gap-1.5">
                      <h2 className="text-base md:text-lg font-bold text-gray-900 dark:text-gray-100">
                        {(() => {
                          const startMonth = weekStart.toLocaleDateString('es-ES', { month: 'short' });
                          const endMonth = weekEnd.toLocaleDateString('es-ES', { month: 'short' });
                          const startDay = weekStart.getDate();
                          const endDay = weekEnd.getDate();
                          
                          const dateText = startMonth === endMonth
                            ? `${startDay} - ${endDay} ${startMonth}`
                            : `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
                          
                          return (
                            <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                              {dateText}
                            </span>
                          );
                        })()}
                      </h2>
                      <span className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                        {weekEnd.getFullYear()}
                      </span>
                    </div>
                    
                    {/* Current week indicator */}
                    {isCurrentWeek && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium whitespace-nowrap"
                      >
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        Actual
                      </motion.div>
                    )}
                  </div>
                  
                  {/* Progress section - Hidden on mobile, shown on tablet+ */}
                  <div className="hidden md:flex items-center gap-2">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Progreso:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                        {plannedMeals}/{totalMeals}
                      </span>
                      <div className="relative w-20 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                          className="absolute inset-y-0 left-0 rounded-full"
                          style={{
                            background: `linear-gradient(to right, ${
                              completionPercentage < 50 ? '#f59e0b' : '#22c55e'
                            }, ${
                              completionPercentage < 50 ? '#f97316' : '#16a34a'
                            })`
                          }}
                          initial={{ width: 0 }}
                          animate={{ width: `${completionPercentage}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                        {completionPercentage}%
                      </span>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
            
            {/* Next button - Ultra Glassy but smaller */}
            <motion.button
              whileHover={{ scale: canGoNext ? 1.05 : 1 }}
              whileTap={{ scale: canGoNext ? 0.95 : 1 }}
              onClick={handleNextWeek}
              disabled={!canGoNext || isLoading}
              className={cn(
                "relative p-2 rounded-xl transition-all duration-300 group overflow-hidden",
                canGoNext 
                  ? "cursor-pointer" 
                  : "opacity-50 cursor-not-allowed"
              )}
              style={{
                background: "rgba(255, 255, 255, 0.08)",
                backdropFilter: "blur(20px) saturate(180%)",
                WebkitBackdropFilter: "blur(20px) saturate(180%)",
                border: "1px solid rgba(255, 255, 255, 0.18)",
                boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)"
              }}
            >
              {/* Glass shine effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-white/10 to-transparent" />
              </div>
              
              {/* Icon */}
              <div className="relative z-10">
                <ChevronRight className={cn(
                  "w-4 h-4 transition-all duration-300",
                  canGoNext 
                    ? "text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white" 
                    : "text-gray-400"
                )} />
              </div>
            </motion.button>
          </div>
          
          {/* Mobile progress bar - Only visible on mobile */}
          <div className="md:hidden mt-2 px-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1">
                <span className="text-xs text-gray-600 dark:text-gray-400">Progreso:</span>
                <div className="relative flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                      background: `linear-gradient(to right, ${
                        completionPercentage < 50 ? '#f59e0b' : '#22c55e'
                      }, ${
                        completionPercentage < 50 ? '#f97316' : '#16a34a'
                      })`
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${completionPercentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
              </div>
              <span className="text-xs font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                {plannedMeals}/{totalMeals} ({completionPercentage}%)
              </span>
            </div>
          </div>
          
          {/* Quick actions - Compact row */}
          <div className="flex items-center justify-center gap-2 mt-3">
            {!isCurrentWeek && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleGoToToday}
                disabled={isLoading}
                className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-300 text-xs font-medium group overflow-hidden"
                style={{
                  background: "rgba(59, 130, 246, 0.08)",
                  backdropFilter: "blur(24px) saturate(200%)",
                  WebkitBackdropFilter: "blur(24px) saturate(200%)",
                  border: "1px solid rgba(59, 130, 246, 0.2)"
                }}
              >
                <Home className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span className="text-blue-600 dark:text-blue-400">Hoy</span>
              </motion.button>
            )}
            
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              disabled={isLoading}
              className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-300 text-xs font-medium group overflow-hidden"
              style={{
                background: "rgba(147, 51, 234, 0.08)",
                backdropFilter: "blur(24px) saturate(200%)",
                WebkitBackdropFilter: "blur(24px) saturate(200%)",
                border: "1px solid rgba(147, 51, 234, 0.2)"
              }}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span className="text-purple-600 dark:text-purple-400">IA</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              disabled={isLoading}
              className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-300 text-xs font-medium group overflow-hidden"
              style={{
                background: "rgba(107, 114, 128, 0.08)",
                backdropFilter: "blur(24px) saturate(200%)",
                WebkitBackdropFilter: "blur(24px) saturate(200%)",
                border: "1px solid rgba(107, 114, 128, 0.2)"
              }}
            >
              <Clock className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">Historial</span>
            </motion.button>
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
                className="w-8 h-8 rounded-full border-2 border-gray-300 border-t-blue-500"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </iOS26EnhancedCard>
    </motion.div>
  );
}