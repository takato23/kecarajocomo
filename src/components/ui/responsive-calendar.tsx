/**
 * Responsive Calendar Component
 * Fully responsive calendar with mobile-first design, touch support, and accessibility
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  format, 
  addDays, 
  startOfWeek, 
  endOfWeek, 
  isSameDay,
  addWeeks,
  isToday,
  startOfMonth,
  endOfMonth,
  addMonths,
  eachDayOfInterval,
  isSameMonth
} from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Plus,
  Smartphone,
  Tablet,
  Monitor
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/useMediaQuery';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export type CalendarView = 'day' | 'week' | 'month';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface CalendarEvent {
  id: string;
  date: Date;
  mealType: MealType;
  title: string;
  description?: string;
  color?: string;
  duration?: number;
  servings?: number;
  isCompleted?: boolean;
  category?: string;
}

export interface ResponsiveCalendarProps {
  events: CalendarEvent[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onEventAdd?: (date: Date, mealType: MealType) => void;
  onEventEdit?: (event: CalendarEvent) => void;
  onEventDelete?: (eventId: string) => void;
  onViewChange?: (view: CalendarView) => void;
  defaultView?: CalendarView;
  className?: string;
  showWeekNumbers?: boolean;
  showMealTypes?: boolean;
  enableTouch?: boolean;
  enableDragDrop?: boolean;
  maxEventsPerSlot?: number;
  compactMode?: boolean;
}

// =============================================================================
// MEAL TYPE CONFIGURATION
// =============================================================================

export const MEAL_TYPES = {
  breakfast: {
    label: 'Desayuno',
    icon: '🌅',
    color: 'bg-amber-50 border-amber-200 text-amber-800',
    darkColor: 'dark:bg-amber-900/20 dark:border-amber-700 dark:text-amber-300',
    time: '07:00',
    order: 1
  },
  lunch: {
    label: 'Almuerzo',
    icon: '☀️',
    color: 'bg-blue-50 border-blue-200 text-blue-800',
    darkColor: 'dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-300',
    time: '13:00',
    order: 2
  },
  dinner: {
    label: 'Cena',
    icon: '🌙',
    color: 'bg-purple-50 border-purple-200 text-purple-800',
    darkColor: 'dark:bg-purple-900/20 dark:border-purple-700 dark:text-purple-300',
    time: '20:00',
    order: 3
  },
  snack: {
    label: 'Snack',
    icon: '🍿',
    color: 'bg-green-50 border-green-200 text-green-800',
    darkColor: 'dark:bg-green-900/20 dark:border-green-700 dark:text-green-300',
    time: '16:00',
    order: 4
  }
} as const;

// =============================================================================
// RESPONSIVE HOOKS
// =============================================================================

const useResponsiveCalendar = () => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(max-width: 1024px)');
  const isDesktop = useMediaQuery('(min-width: 1025px)');
  
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [touchSupported, setTouchSupported] = useState(false);
  
  useEffect(() => {
    const checkOrientation = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };
    
    const checkTouch = () => {
      setTouchSupported('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    
    checkOrientation();
    checkTouch();
    
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);
  
  return {
    isMobile,
    isTablet,
    isDesktop,
    orientation,
    touchSupported
  };
};

// =============================================================================
// EVENT COMPONENT
// =============================================================================

interface EventCardProps {
  event: CalendarEvent;
  compact?: boolean;
  onClick?: (event: CalendarEvent) => void;
  onEdit?: (event: CalendarEvent) => void;
  onDelete?: (eventId: string) => void;
  className?: string;
}

const EventCard: React.FC<EventCardProps> = ({
  event,
  compact = false,
  onClick,
  onEdit,
  onDelete,
  className
}) => {
  const mealConfig = MEAL_TYPES[event.mealType];
  const [showActions, setShowActions] = useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'relative group cursor-pointer rounded-lg border transition-all duration-200',
        mealConfig.color,
        mealConfig.darkColor,
        compact ? 'p-2' : 'p-3',
        event.isCompleted && 'opacity-60',
        className
      )}
      onClick={() => onClick?.(event)}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm">{mealConfig.icon}</span>
            {!compact && (
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {mealConfig.label}
              </span>
            )}
          </div>
          
          <h4 className={cn(
            'font-medium text-gray-900 dark:text-white truncate',
            compact ? 'text-xs mt-1' : 'text-sm mt-2'
          )}>
            {event.title}
          </h4>
          
          {!compact && (
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-600 dark:text-gray-400">
              {event.duration && (
                <span className="flex items-center gap-1">
                  ⏱️ {event.duration}min
                </span>
              )}
              {event.servings && (
                <span className="flex items-center gap-1">
                  🍽️ {event.servings}
                </span>
              )}
            </div>
          )}
        </div>
        
        <AnimatePresence>
          {showActions && (onEdit || onDelete) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-1"
            >
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(event);
                  }}
                  className="p-1 rounded hover:bg-white/50 transition-colors"
                  title="Editar"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}
              
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(event.id);
                  }}
                  className="p-1 rounded hover:bg-white/50 transition-colors text-red-600"
                  title="Eliminar"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {event.isCompleted && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
          <div className="bg-green-500 text-white rounded-full p-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      )}
    </motion.div>
  );
};

// =============================================================================
// DAY CELL COMPONENT
// =============================================================================

interface DayCellProps {
  date: Date;
  events: CalendarEvent[];
  isSelected: boolean;
  isToday: boolean;
  isOtherMonth?: boolean;
  onDateSelect: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onEventAdd?: (date: Date, mealType: MealType) => void;
  onEventEdit?: (event: CalendarEvent) => void;
  onEventDelete?: (eventId: string) => void;
  showMealTypes?: boolean;
  maxEventsPerSlot?: number;
  compact?: boolean;
  className?: string;
}

const DayCell: React.FC<DayCellProps> = ({
  date,
  events,
  isSelected,
  isToday,
  isOtherMonth,
  onDateSelect,
  onEventClick,
  onEventAdd,
  onEventEdit,
  onEventDelete,
  showMealTypes = true,
  maxEventsPerSlot = 3,
  compact = false,
  className
}) => {
  const { isMobile } = useResponsiveCalendar();
  const dayEvents = events.filter(event => isSameDay(event.date, date));
  const visibleEvents = dayEvents.slice(0, maxEventsPerSlot);
  const hiddenCount = dayEvents.length - visibleEvents.length;
  
  const getMealTypeEvents = (mealType: MealType) => {
    return dayEvents.filter(event => event.mealType === mealType);
  };
  
  return (
    <div
      className={cn(
        'relative group border-r border-b border-gray-200 dark:border-gray-700',
        'hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer',
        isSelected && 'bg-blue-50 dark:bg-blue-900/20',
        isToday && 'bg-yellow-50 dark:bg-yellow-900/20',
        isOtherMonth && 'text-gray-400 dark:text-gray-600',
        compact ? 'min-h-[80px] p-1' : 'min-h-[120px] p-2',
        className
      )}
      onClick={() => onDateSelect(date)}
    >
      {/* Date Header */}
      <div className="flex items-center justify-between mb-1">
        <span className={cn(
          'text-sm font-medium',
          isToday && 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs',
          isSelected && !isToday && 'bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs'
        )}>
          {format(date, 'd')}
        </span>
        
        {onEventAdd && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEventAdd(date, 'breakfast');
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            title="Agregar comida"
          >
            <Plus className="w-3 h-3" />
          </button>
        )}
      </div>
      
      {/* Events */}
      <div className="space-y-1">
        {showMealTypes && !compact ? (
          // Meal type sections
          Object.entries(MEAL_TYPES).map(([mealType, config]) => {
            const mealEvents = getMealTypeEvents(mealType as MealType);
            const showEmpty = mealEvents.length === 0 && onEventAdd;
            
            return (
              <div key={mealType} className="min-h-[24px]">
                {mealEvents.map((event, index) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    compact={compact}
                    onClick={onEventClick}
                    onEdit={onEventEdit}
                    onDelete={onEventDelete}
                    className="mb-1"
                  />
                ))}
                
                {showEmpty && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventAdd(date, mealType as MealType);
                    }}
                    className={cn(
                      'w-full h-6 border-2 border-dashed rounded transition-colors opacity-0 group-hover:opacity-100',
                      config.color.replace('bg-', 'border-').replace('-50', '-300')
                    )}
                    title={`Agregar ${config.label.toLowerCase()}`}
                  >
                    <Plus className="w-3 h-3 mx-auto" />
                  </button>
                )}
              </div>
            );
          })
        ) : (
          // Simple event list
          <>
            {visibleEvents.map((event, index) => (
              <EventCard
                key={event.id}
                event={event}
                compact={compact}
                onClick={onEventClick}
                onEdit={onEventEdit}
                onDelete={onEventDelete}
                className="mb-1"
              />
            ))}
            
            {hiddenCount > 0 && (
              <div className="text-xs text-gray-500 text-center py-1">
                +{hiddenCount} más
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// MAIN CALENDAR COMPONENT
// =============================================================================

export const ResponsiveCalendar: React.FC<ResponsiveCalendarProps> = ({
  events,
  selectedDate,
  onDateSelect,
  onEventClick,
  onEventAdd,
  onEventEdit,
  onEventDelete,
  onViewChange,
  defaultView = 'week',
  className,
  showWeekNumbers = false,
  showMealTypes = true,
  enableTouch = true,
  enableDragDrop = false,
  maxEventsPerSlot = 3,
  compactMode = false
}) => {
  const { isMobile, isTablet, isDesktop, orientation, touchSupported } = useResponsiveCalendar();
  
  const [currentDate, setCurrentDate] = useState(selectedDate);
  const [view, setView] = useState<CalendarView>(
    isMobile ? 'day' : defaultView
  );
  const [showViewSwitcher, setShowViewSwitcher] = useState(false);
  
  // Auto-adjust view based on screen size
  useEffect(() => {
    if (isMobile && view === 'month') {
      setView('week');
    } else if (isMobile && orientation === 'portrait' && view === 'week') {
      setView('day');
    }
  }, [isMobile, orientation, view]);
  
  // Navigation functions
  const navigateDate = (direction: 'prev' | 'next') => {
    const amount = direction === 'next' ? 1 : -1;
    
    switch (view) {
      case 'day':
        setCurrentDate(prev => addDays(prev, amount));
        break;
      case 'week':
        setCurrentDate(prev => addWeeks(prev, amount));
        break;
      case 'month':
        setCurrentDate(prev => addMonths(prev, amount));
        break;
    }
  };
  
  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    onDateSelect(today);
  };
  
  const handleViewChange = (newView: CalendarView) => {
    setView(newView);
    setShowViewSwitcher(false);
    onViewChange?.(newView);
  };
  
  // Get dates for current view
  const getViewDates = () => {
    switch (view) {
      case 'day':
        return [currentDate];
      case 'week':
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
      case 'month':
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
        const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
        return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    }
  };
  
  const viewDates = getViewDates();
  
  // Format period display
  const getPeriodDisplay = () => {
    switch (view) {
      case 'day':
        return format(currentDate, 'EEEE, d MMMM yyyy', { locale: es });
      case 'week':
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
        return `${format(weekStart, 'd MMM')} - ${format(weekEnd, 'd MMM yyyy', { locale: es })}`;
      case 'month':
        return format(currentDate, 'MMMM yyyy', { locale: es });
    }
  };
  
  // Get responsive grid classes
  const getGridClasses = () => {
    switch (view) {
      case 'day':
        return 'grid-cols-1';
      case 'week':
        return isMobile ? 'grid-cols-1 gap-2' : 'grid-cols-7';
      case 'month':
        return 'grid-cols-7';
    }
  };
  
  const compact = compactMode || isMobile;
  
  return (
    <div className={cn(
      'flex flex-col bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <CalendarIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {getPeriodDisplay()}
          </h2>
        </div>
        
        <div className="flex items-center gap-2">
          {/* View Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowViewSwitcher(!showViewSwitcher)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {view === 'day' && <Smartphone className="w-4 h-4" />}
              {view === 'week' && <Tablet className="w-4 h-4" />}
              {view === 'month' && <Monitor className="w-4 h-4" />}
              {view === 'day' && 'Día'}
              {view === 'week' && 'Semana'}
              {view === 'month' && 'Mes'}
            </button>
            
            <AnimatePresence>
              {showViewSwitcher && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute right-0 top-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10"
                >
                  {['day', 'week', 'month'].map((viewOption) => (
                    <button
                      key={viewOption}
                      onClick={() => handleViewChange(viewOption as CalendarView)}
                      className={cn(
                        'w-full px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
                        view === viewOption && 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      )}
                    >
                      {viewOption === 'day' && 'Día'}
                      {viewOption === 'week' && 'Semana'}
                      {viewOption === 'month' && 'Mes'}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Navigation */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigateDate('prev')}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Período anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <button
              onClick={goToToday}
              className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              Hoy
            </button>
            
            <button
              onClick={() => navigateDate('next')}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Siguiente período"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Week days header (for week and month views) */}
      {(view === 'week' || view === 'month') && !isMobile && (
        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
            <div
              key={day}
              className="p-3 text-sm font-medium text-gray-600 dark:text-gray-400 text-center border-r border-gray-200 dark:border-gray-700 last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>
      )}
      
      {/* Calendar Body */}
      <div className={cn(
        'flex-1 grid',
        getGridClasses()
      )}>
        {viewDates.map((date, index) => (
          <DayCell
            key={date.toISOString()}
            date={date}
            events={events}
            isSelected={isSameDay(date, selectedDate)}
            isToday={isToday(date)}
            isOtherMonth={view === 'month' && !isSameMonth(date, currentDate)}
            onDateSelect={onDateSelect}
            onEventClick={onEventClick}
            onEventAdd={onEventAdd}
            onEventEdit={onEventEdit}
            onEventDelete={onEventDelete}
            showMealTypes={showMealTypes && view !== 'month'}
            maxEventsPerSlot={maxEventsPerSlot}
            compact={compact}
            className={cn(
              view === 'week' && isMobile && 'border-b border-gray-200 dark:border-gray-700 last:border-b-0',
              view === 'month' && index % 7 === 6 && 'border-r-0'
            )}
          />
        ))}
      </div>
      
      {/* Stats Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-4">
            <span>Total: {events.length} comidas</span>
            <span>Completadas: {events.filter(e => e.isCompleted).length}</span>
          </div>
          
          <div className="flex items-center gap-2">
            {Object.entries(MEAL_TYPES).map(([type, config]) => (
              <div key={type} className="flex items-center gap-1">
                <span>{config.icon}</span>
                <span className="text-xs">{config.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};