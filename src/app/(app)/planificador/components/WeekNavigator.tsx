'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar, Home } from 'lucide-react';
import { format, startOfWeek, endOfWeek, isSameWeek, addWeeks, subWeeks } from 'date-fns';
import { es } from 'date-fns/locale';

import { cn } from '@/lib/utils';

// =============================================
// PROPS & INTERFACES
// =============================================

interface WeekNavigatorProps {
  currentWeek: Date;
  onWeekChange: (newWeek: Date) => void;
  onGoToToday?: () => void;
  
  // UI Options
  showDateRange?: boolean;
  showTodayButton?: boolean;
  compact?: boolean;
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

export const WeekNavigator: React.FC<WeekNavigatorProps> = ({
  currentWeek,
  onWeekChange,
  onGoToToday,
  showDateRange = true,
  showTodayButton = true,
  compact = false,
  className,
  minWeek,
  maxWeek,
  isLoading = false
}) => {
  
  // =============================================
  // COMPUTED VALUES
  // =============================================
  
  const weekStart = useMemo(() => 
    startOfWeek(currentWeek, { weekStartsOn: 0 }), // Domingo = 0
    [currentWeek]
  );
  
  const weekEnd = useMemo(() => 
    endOfWeek(currentWeek, { weekStartsOn: 0 }),
    [currentWeek]
  );
  
  const isCurrentWeek = useMemo(() => 
    isSameWeek(currentWeek, new Date(), { weekStartsOn: 0 }),
    [currentWeek]
  );
  
  const canGoPrevious = useMemo(() => {
    if (!minWeek) return true;
    const prevWeek = subWeeks(currentWeek, 1);
    return prevWeek >= minWeek;
  }, [currentWeek, minWeek]);
  
  const canGoNext = useMemo(() => {
    if (!maxWeek) return true;
    const nextWeek = addWeeks(currentWeek, 1);
    return nextWeek <= maxWeek;
  }, [currentWeek, maxWeek]);
  
  // =============================================
  // EVENT HANDLERS
  // =============================================
  
  const handlePreviousWeek = () => {
    if (!canGoPrevious || isLoading) return;
    const newWeek = subWeeks(currentWeek, 1);
    onWeekChange(newWeek);
  };
  
  const handleNextWeek = () => {
    if (!canGoNext || isLoading) return;
    const newWeek = addWeeks(currentWeek, 1);
    onWeekChange(newWeek);
  };
  
  const handleGoToToday = () => {
    if (isLoading) return;
    const today = new Date();
    onWeekChange(today);
    onGoToToday?.();
  };
  
  // =============================================
  // RENDER HELPERS
  // =============================================
  
  const renderDateRange = () => {
    if (!showDateRange) return null;
    
    const startMonth = format(weekStart, 'MMM', { locale: es });
    const endMonth = format(weekEnd, 'MMM', { locale: es });
    const startDay = format(weekStart, 'd');
    const endDay = format(weekEnd, 'd');
    const year = format(weekEnd, 'yyyy');
    
    const dateText = startMonth === endMonth
      ? `${startDay} - ${endDay} ${startMonth} ${year}`
      : `${startDay} ${startMonth} - ${endDay} ${endMonth} ${year}`;
    
    return (
      <div className="text-center">
        <div className={cn(
          "font-semibold text-gray-900",
          compact ? "text-sm" : "text-lg"
        )}>
          Semana del {dateText}
        </div>
        {!compact && (
          <div className="text-xs text-gray-500 mt-1">
            {format(weekStart, 'EEEE', { locale: es })} a {format(weekEnd, 'EEEE', { locale: es })}
          </div>
        )}
      </div>
    );
  };
  
  const renderTodayButton = () => {
    if (!showTodayButton || isCurrentWeek) return null;
    
    return (
      <iOS26LiquidButton
        variant="glass"
        size={compact ? "sm" : "md"}
        leftIcon={<Home size={16} />}
        onClick={handleGoToToday}
        disabled={isLoading}
        className="whitespace-nowrap"
      >
        {compact ? "Hoy" : "Esta Semana"}
      </iOS26LiquidButton>
    );
  };
  
  const renderNavigationButtons = () => {
    return (
      <div className="flex items-center gap-2">
        {/* Previous Week Button */}
        <motion.button
          whileHover={{ scale: canGoPrevious ? 1.05 : 1 }}
          whileTap={{ scale: canGoPrevious ? 0.95 : 1 }}
          onClick={handlePreviousWeek}
          disabled={!canGoPrevious || isLoading}
          className={cn(
            "p-2 rounded-xl transition-all duration-200",
            "ios26-glass ios26-glass-medium",
            canGoPrevious 
              ? "hover:ios26-glow text-gray-700 hover:text-gray-900" 
              : "opacity-50 cursor-not-allowed text-gray-400",
            compact ? "p-1.5" : "p-2"
          )}
          aria-label="Semana anterior"
        >
          <ChevronLeft size={compact ? 16 : 20} />
        </motion.button>
        
        {/* Week Indicator */}
        <div className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-xl",
          "ios26-glass ios26-glass-medium",
          compact ? "px-3 py-1.5" : "px-4 py-2"
        )}>
          <Calendar size={compact ? 14 : 16} className="text-gray-500" />
          <span className={cn(
            "font-medium text-gray-700",
            compact ? "text-sm" : "text-base"
          )}>
            {isCurrentWeek ? "Esta semana" : `Semana ${format(currentWeek, 'w', { locale: es })}`}
          </span>
        </div>
        
        {/* Next Week Button */}
        <motion.button
          whileHover={{ scale: canGoNext ? 1.05 : 1 }}
          whileTap={{ scale: canGoNext ? 0.95 : 1 }}
          onClick={handleNextWeek}
          disabled={!canGoNext || isLoading}
          className={cn(
            "p-2 rounded-xl transition-all duration-200",
            "ios26-glass ios26-glass-medium",
            canGoNext 
              ? "hover:ios26-glow text-gray-700 hover:text-gray-900" 
              : "opacity-50 cursor-not-allowed text-gray-400",
            compact ? "p-1.5" : "p-2"
          )}
          aria-label="Semana siguiente"
        >
          <ChevronRight size={compact ? 16 : 20} />
        </motion.button>
      </div>
    );
  };
  
  // =============================================
  // LOADING STATE
  // =============================================
  
  if (isLoading) {
    return (
      <div className={cn(
        "flex items-center justify-center gap-4",
        compact ? "py-2" : "py-4",
        className
      )}>
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-food-fresh-500 border-t-transparent" />
        <span className="text-sm text-gray-500">Cargando...</span>
      </div>
    );
  }
  
  // =============================================
  // MAIN RENDER
  // =============================================
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "week-navigator",
        compact ? "space-y-2" : "space-y-4",
        className
      )}
    >
      {/* Date Range Display */}
      {renderDateRange()}
      
      {/* Navigation Controls */}
      <div className={cn(
        "flex items-center justify-between",
        compact ? "gap-2" : "gap-4"
      )}>
        {/* Left side - Today button (if not current week) */}
        <div className="flex-shrink-0">
          {renderTodayButton()}
        </div>
        
        {/* Center - Navigation buttons */}
        <div className="flex-1 flex justify-center">
          {renderNavigationButtons()}
        </div>
        
        {/* Right side - Spacer for alignment */}
        <div className="flex-shrink-0 w-20">
          {/* Empty space for visual balance */}
        </div>
      </div>
      
      {/* Current week indicator */}
      {isCurrentWeek && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className={cn(
            "inline-flex items-center gap-2 px-3 py-1 rounded-full",
            "bg-food-fresh-100 text-food-fresh-700 text-xs font-medium",
            "ios26-glass ios26-glass-subtle"
          )}>
            <div className="w-2 h-2 rounded-full bg-food-fresh-500 animate-pulse" />
            Semana actual
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default WeekNavigator;