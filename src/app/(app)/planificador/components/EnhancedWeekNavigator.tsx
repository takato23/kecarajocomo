'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Home,
  CalendarDays,
  Clock,
  Sparkles
} from 'lucide-react';

import { cn } from '@/lib/utils';

import { SimpleCard, SimpleButton } from './SimplifiedComponents';

// =============================================
// PROPS & INTERFACES
// =============================================

interface EnhancedWeekNavigatorProps {
  currentWeek: Date;
  onWeekChange: (newWeek: Date) => void;
  onGoToToday?: () => void;
  
  // Stats
  totalMeals?: number;
  plannedMeals?: number;
  
  // UI Options
  className?: string;
  
  // Constraints
  minWeek?: Date;
  maxWeek?: Date;
  
  // Loading state
  isLoading?: boolean;
}

// =============================================
// MAIN COMPONENT
// =============================================

export const EnhancedWeekNavigator: React.FC<EnhancedWeekNavigatorProps> = ({
  currentWeek,
  onWeekChange,
  onGoToToday,
  totalMeals = 28,
  plannedMeals = 0,
  className,
  minWeek,
  maxWeek,
  isLoading = false
}) => {
  
  // =============================================
  // COMPUTED VALUES
  // =============================================
  
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
  
  // =============================================
  // EVENT HANDLERS
  // =============================================
  
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
  
  // =============================================
  // ANIMATIONS
  // =============================================
  
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
  
  // =============================================
  // RENDER HELPERS
  // =============================================
  
  const renderDateRange = () => {
    const startMonth = weekStart.toLocaleDateString('es-ES', { month: 'short' });
    const endMonth = weekEnd.toLocaleDateString('es-ES', { month: 'short' });
    const startDay = weekStart.getDate();
    const endDay = weekEnd.getDate();
    const year = weekEnd.getFullYear();
    
    const dateText = startMonth === endMonth
      ? `${startDay} - ${endDay} ${startMonth}`
      : `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
    
    return (
      <div className="text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={weekStart.toISOString()}
            variants={dateTextVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {dateText}
            </h2>
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{year}</p>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  };
  
  const renderWeekStats = () => (
    <div className="flex items-center justify-center gap-6 mb-6">
      {/* Planned meals */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="text-center"
      >
        <div className="text-2xl font-bold text-gray-800">
          {plannedMeals}
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-300">Planificadas</div>
      </motion.div>
      
      {/* Progress bar */}
      <div className="relative w-32 h-32">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r="56"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-gray-200"
          />
          <motion.circle
            cx="64"
            cy="64"
            r="56"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 56}`}
            strokeDashoffset={`${2 * Math.PI * 56 * (1 - completionPercentage / 100)}`}
            className="text-green-500"
            initial={{ strokeDashoffset: 2 * Math.PI * 56 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 56 * (1 - completionPercentage / 100) }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">
              {completionPercentage}%
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-300">Completo</div>
          </div>
        </div>
      </div>
      
      {/* Total meals */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="text-center"
      >
        <div className="text-2xl font-bold text-gray-800">
          {totalMeals}
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-300">Total</div>
      </motion.div>
    </div>
  );
  
  const renderNavigationControls = () => (
    <div className="flex items-center justify-between gap-4">
      {/* Previous week button */}
      <motion.button
        whileHover={{ scale: canGoPrevious ? 1.05 : 1, x: canGoPrevious ? -5 : 0 }}
        whileTap={{ scale: canGoPrevious ? 0.95 : 1 }}
        onClick={handlePreviousWeek}
        disabled={!canGoPrevious || isLoading}
        className={cn(
          "relative group"
        )}
      >
        <SimpleCard
          className={cn(
            "p-3 transition-all duration-200",
            canGoPrevious 
              ? "cursor-pointer" 
              : "opacity-50 cursor-not-allowed"
          )}
        >
          <ChevronLeft size={24} className={cn(
            "transition-colors",
            canGoPrevious ? "text-gray-700 group-hover:text-gray-900" : "text-gray-400"
          )} />
        </SimpleCard>
      </motion.button>
      
      {/* Center content */}
      <div className="flex-1 max-w-md">
        <SimpleCard
          className="px-6 py-4"
        >
          <div className="flex items-center justify-center gap-4">
            <CalendarDays size={20} className="text-blue-600" />
            
            <div className="text-center">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Semana del año
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-300">
                {weekStart.toLocaleDateString('es-ES', { weekday: 'long' })} - {weekEnd.toLocaleDateString('es-ES', { weekday: 'long' })}
              </div>
            </div>
            
            {isCurrentWeek && (
              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full animate-pulse">
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse" />
                  Actual
                </div>
              </span>
            )}
          </div>
        </SimpleCard>
      </div>
      
      {/* Next week button */}
      <motion.button
        whileHover={{ scale: canGoNext ? 1.05 : 1, x: canGoNext ? 5 : 0 }}
        whileTap={{ scale: canGoNext ? 0.95 : 1 }}
        onClick={handleNextWeek}
        disabled={!canGoNext || isLoading}
        className={cn(
          "relative group"
        )}
      >
        <SimpleCard
          className={cn(
            "p-3 transition-all duration-200",
            canGoNext 
              ? "cursor-pointer" 
              : "opacity-50 cursor-not-allowed"
          )}
        >
          <ChevronRight size={24} className={cn(
            "transition-colors",
            canGoNext ? "text-gray-700 group-hover:text-gray-900" : "text-gray-400"
          )} />
        </SimpleCard>
      </motion.button>
    </div>
  );
  
  const renderQuickActions = () => (
    <div className="flex items-center justify-center gap-3 mt-6">
      {!isCurrentWeek && (
        <SimpleButton
          leftIcon={<Home size={16} />}
          onClick={handleGoToToday}
          disabled={isLoading}
          className="text-sm"
        >
          Semana Actual
        </SimpleButton>
      )}
      
      <SimpleButton
        leftIcon={<Sparkles size={16} />}
        disabled={isLoading}
        className="text-sm animate-pulse"
      >
        Sugerencias IA
      </SimpleButton>
      
      <SimpleButton
        leftIcon={<Clock size={16} />}
        disabled={isLoading}
        className="text-sm"
      >
        Historial
      </SimpleButton>
    </div>
  );
  
  // =============================================
  // LOADING STATE
  // =============================================
  
  if (isLoading) {
    return (
      <SimpleCard
        className={cn("p-8", className)}
      >
        <div className="flex items-center justify-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Calendar className="w-6 h-6 text-green-500" />
          </motion.div>
          <span className="text-sm text-gray-700 dark:text-gray-300">Cargando semana...</span>
        </div>
      </SimpleCard>
    );
  }
  
  // =============================================
  // MAIN RENDER
  // =============================================
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={cn("enhanced-week-navigator", className)}
    >
      <div className="rounded-3xl p-3 md:p-5"
           style={{
             background: 'rgba(255, 255, 255, 0.15)',
             backdropFilter: 'blur(25px)',
             WebkitBackdropFilter: 'blur(25px)',
             border: '1px solid rgba(255, 255, 255, 0.2)',
             boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)'
           }}>
        <div className="flex items-center justify-between">
          {/* Navigation Controls - Left */}
          <button
            onClick={handlePreviousWeek}
            disabled={!canGoPrevious || isLoading}
            className={cn(
              "p-3 rounded-2xl",
              canGoPrevious ? "text-gray-700" : "text-gray-400 opacity-50"
            )}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(15px)',
              WebkitBackdropFilter: 'blur(15px)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              boxShadow: '0 4px 16px 0 rgba(31, 38, 135, 0.1)'
            }}
          >
            <ChevronLeft size={20} />
          </button>

          {/* Center Content */}
          <div className="flex-1 px-2 md:px-6">
            <div className="text-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={weekStart.toISOString()}
                  variants={dateTextVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  {(() => {
                    const startMonth = weekStart.toLocaleDateString('es-ES', { month: 'short' });
                    const endMonth = weekEnd.toLocaleDateString('es-ES', { month: 'short' });
                    const startDay = weekStart.getDate();
                    const endDay = weekEnd.getDate();
                    
                    const dateText = startMonth === endMonth
                      ? `${startDay} - ${endDay} ${startMonth}`
                      : `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
                    
                    return (
                      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {dateText}
                      </h2>
                    );
                  })()}
                  <div className="flex items-center justify-center gap-4 mt-2">
                    <div className="text-xs text-gray-700 dark:text-gray-200 font-medium">
                      {plannedMeals} de {totalMeals} comidas
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className={cn(
                            "h-2 rounded-full transition-all duration-500",
                            completionPercentage === 0 && "bg-gray-300",
                            completionPercentage > 0 && completionPercentage < 25 && "bg-gradient-to-r from-red-400 to-red-500",
                            completionPercentage >= 25 && completionPercentage < 50 && "bg-gradient-to-r from-orange-400 to-orange-500",
                            completionPercentage >= 50 && completionPercentage < 75 && "bg-gradient-to-r from-yellow-400 to-yellow-500",
                            completionPercentage >= 75 && "bg-gradient-to-r from-green-400 to-green-500"
                          )}
                          style={{ 
                            width: `${completionPercentage}%`
                          }}
                        />
                      </div>
                      <span className="text-sm font-bold text-gray-800 dark:text-gray-100">
                        {completionPercentage}%
                      </span>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Navigation Controls - Right */}
          <button
            onClick={handleNextWeek}
            disabled={!canGoNext || isLoading}
            className={cn(
              "p-3 rounded-2xl",
              canGoNext ? "text-gray-700" : "text-gray-400 opacity-50"
            )}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(15px)',
              WebkitBackdropFilter: 'blur(15px)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              boxShadow: '0 4px 16px 0 rgba(31, 38, 135, 0.1)'
            }}
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Quick Actions Row */}
        <div className="flex items-center justify-center gap-2 mt-2 md:mt-3">
          {!isCurrentWeek && (
            <button
              onClick={handleGoToToday}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-bold text-blue-700 rounded-2xl"
              style={{
                background: 'rgba(59, 130, 246, 0.1)',
                backdropFilter: 'blur(15px)',
                WebkitBackdropFilter: 'blur(15px)',
                border: '1px solid rgba(59, 130, 246, 0.15)',
                boxShadow: '0 4px 16px 0 rgba(59, 130, 246, 0.1)'
              }}
            >
              Hoy
            </button>
          )}
          
          <button
            disabled={isLoading}
            className="px-4 py-2 text-xs font-bold text-purple-700 rounded-2xl"
            style={{
              background: 'rgba(147, 51, 234, 0.1)',
              backdropFilter: 'blur(15px)',
              WebkitBackdropFilter: 'blur(15px)',
              border: '1px solid rgba(147, 51, 234, 0.15)',
              boxShadow: '0 4px 16px 0 rgba(147, 51, 234, 0.1)'
            }}
          >
            IA
          </button>
          
          <button
            disabled={isLoading}
            className="px-4 py-2 text-xs font-bold text-gray-700 dark:text-gray-200 rounded-2xl"
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(15px)',
              WebkitBackdropFilter: 'blur(15px)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              boxShadow: '0 4px 16px 0 rgba(31, 38, 135, 0.1)'
            }}
          >
            Historial
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default EnhancedWeekNavigator;