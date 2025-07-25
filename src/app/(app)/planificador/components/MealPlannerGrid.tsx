'use client';

import React, { useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, startOfWeek, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/useMediaQuery';

import type { 
  MealSlot as MealSlotType, 
  MealType, 
  RecipeInfo, 
  WeekPlan,
  SlotPosition,
  ResponsiveLayout
} from '../types/planner';

import MealSlot from './MealSlot';

// =============================================
// PROPS & INTERFACES
// =============================================

interface MealPlannerGridProps {
  weekPlan: WeekPlan;
  recipes: Record<string, RecipeInfo>;
  currentWeek: Date;
  
  // Selection state
  selectedSlots: string[];
  
  // Drag state
  draggedSlot?: MealSlotType;
  dropTarget?: SlotPosition;
  
  // View options
  showHeaders?: boolean;
  compact?: boolean;
  
  // Callbacks
  onSlotClick?: (slot: MealSlotType) => void;
  onSlotSelect?: (slotId: string, multi?: boolean) => void;
  onRecipeSelect?: (slot: MealSlotType) => void;
  onSlotClear?: (slot: MealSlotType) => void;
  onSlotLock?: (slot: MealSlotType, locked: boolean) => void;
  
  // Drag & Drop
  onDragStart?: (slot: MealSlotType, event: React.DragEvent) => void;
  onDragEnd?: (event: React.DragEvent) => void;
  onDragOver?: (position: SlotPosition, event: React.DragEvent) => void;
  onDrop?: (position: SlotPosition, event: React.DragEvent) => void;
}

// =============================================
// CONSTANTS
// =============================================

const MEAL_TYPES: MealType[] = ['desayuno', 'almuerzo', 'merienda', 'cena'];

const DAY_NAMES = [
  'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
];

const DAY_NAMES_SHORT = [
  'Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'
];

const MEAL_LABELS = {
  desayuno: 'Desayuno',
  almuerzo: 'Almuerzo',
  merienda: 'Merienda',
  cena: 'Cena'
};

// =============================================
// RESPONSIVE LAYOUTS
// =============================================

const LAYOUTS: Record<string, ResponsiveLayout> = {
  mobile: {
    columns: 2,      // Mañana (desayuno+almuerzo) | Tarde (merienda+cena)
    rows: 14,        // 7 días × 2 grupos
    orientation: 'vertical',
    slotSize: { width: 160, height: 120 },
    gaps: { horizontal: 8, vertical: 8 }
  },
  tablet: {
    columns: 4,      // Una columna por tipo de comida
    rows: 7,         // Una fila por día
    orientation: 'horizontal',
    slotSize: { width: 180, height: 140 },
    gaps: { horizontal: 12, vertical: 12 }
  },
  desktop: {
    columns: 7,      // Una columna por día
    rows: 4,         // Una fila por tipo de comida
    orientation: 'horizontal',
    slotSize: { width: 200, height: 160 },
    gaps: { horizontal: 16, vertical: 16 }
  }
};

// =============================================
// MAIN COMPONENT
// =============================================

export const MealPlannerGrid: React.FC<MealPlannerGridProps> = ({
  weekPlan,
  recipes,
  currentWeek,
  selectedSlots = [],
  draggedSlot,
  dropTarget,
  showHeaders = true,
  compact = false,
  onSlotClick,
  onSlotSelect,
  onRecipeSelect,
  onSlotClear,
  onSlotLock,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop
}) => {
  
  // =============================================
  // RESPONSIVE LAYOUT
  // =============================================
  
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1024px)');
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  
  const currentLayout = useMemo(() => {
    if (isMobile) return LAYOUTS.mobile;
    if (isTablet) return LAYOUTS.tablet;
    return LAYOUTS.desktop;
  }, [isMobile, isTablet, isDesktop]);
  
  // =============================================
  // SLOT ORGANIZATION
  // =============================================
  
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentWeek, { weekStartsOn: 0 }); // Domingo = 0
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentWeek]);
  
  // Crear matriz de slots organizados
  const slotMatrix = useMemo(() => {
    const matrix: (MealSlotType | null)[][] = [];
    
    if (currentLayout.orientation === 'horizontal') {
      // Desktop/Tablet: filas = tipos de comida, columnas = días
      MEAL_TYPES.forEach((mealType, row) => {
        const rowSlots: (MealSlotType | null)[] = [];
        
        weekDays.forEach((date, col) => {
          const slot = weekPlan.slots.find(s => 
            s.dayOfWeek === date.getDay() && 
            s.mealType === mealType
          );
          rowSlots.push(slot || createEmptySlot(row, col, date.getDay(), mealType));
        });
        
        matrix.push(rowSlots);
      });
    } else {
      // Mobile: agrupado por día, 2 columnas (mañana/tarde)
      weekDays.forEach((date, dayIndex) => {
        // Mañana: desayuno + almuerzo
        const morningSlots: (MealSlotType | null)[] = [];
        ['desayuno', 'almuerzo'].forEach((mealType, col) => {
          const slot = weekPlan.slots.find(s => 
            s.dayOfWeek === date.getDay() && 
            s.mealType === mealType
          );
          morningSlots.push(slot || createEmptySlot(dayIndex * 2, col, date.getDay(), mealType as MealType));
        });
        matrix.push(morningSlots);
        
        // Tarde: merienda + cena
        const eveningSlots: (MealSlotType | null)[] = [];
        ['merienda', 'cena'].forEach((mealType, col) => {
          const slot = weekPlan.slots.find(s => 
            s.dayOfWeek === date.getDay() && 
            s.mealType === mealType
          );
          eveningSlots.push(slot || createEmptySlot(dayIndex * 2 + 1, col, date.getDay(), mealType as MealType));
        });
        matrix.push(eveningSlots);
      });
    }
    
    return matrix;
  }, [weekPlan.slots, weekDays, currentLayout.orientation]);
  
  // Helper para crear slots vacíos
  function createEmptySlot(row: number, col: number, dayOfWeek: number, mealType: MealType): MealSlotType {
    return {
      id: `empty-${dayOfWeek}-${mealType}`,
      weekId: weekPlan.id,
      dayOfWeek: dayOfWeek as any,
      mealType,
      servings: 4,
      position: { row, col },
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
  
  // =============================================
  // EVENT HANDLERS
  // =============================================
  
  const handleSlotClick = useCallback((slot: MealSlotType) => {
    onSlotClick?.(slot);
    onSlotSelect?.(slot.id);
  }, [onSlotClick, onSlotSelect]);
  
  const handleDragOver = useCallback((position: SlotPosition, event: React.DragEvent) => {
    onDragOver?.(position, event);
  }, [onDragOver]);
  
  const handleDrop = useCallback((position: SlotPosition, event: React.DragEvent) => {
    onDrop?.(position, event);
  }, [onDrop]);
  
  // =============================================
  // RENDER HELPERS
  // =============================================
  
  const renderDesktopHeaders = () => {
    if (!showHeaders || !isDesktop) return null;
    
    return (
      <div className="grid grid-cols-7 gap-4 mb-4">
        {weekDays.map((date, index) => (
          <div key={index} className="text-center">
            <div className="text-sm font-medium text-gray-900">
              {DAY_NAMES[date.getDay()]}
            </div>
            <div className="text-xs text-gray-500">
              {format(date, 'd MMM', { locale: es })}
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  const renderTabletHeaders = () => {
    if (!showHeaders || !isTablet) return null;
    
    return (
      <div className="grid grid-cols-4 gap-3 mb-4">
        {MEAL_TYPES.map((mealType) => (
          <div key={mealType} className="text-center">
            <div className="text-sm font-medium text-gray-900">
              {MEAL_LABELS[mealType]}
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  const renderMobileHeaders = () => {
    if (!showHeaders || !isMobile) return null;
    
    return (
      <div className="text-center mb-4">
        <div className="text-lg font-semibold text-gray-900">
          Semana del {format(weekDays[0], 'd', { locale: es })} al {format(weekDays[6], 'd MMM', { locale: es })}
        </div>
      </div>
    );
  };
  
  const renderRowHeaders = () => {
    if (!showHeaders || currentLayout.orientation !== 'horizontal') return null;
    
    if (isDesktop) {
      return (
        <div className="flex flex-col gap-4 mr-4">
          {MEAL_TYPES.map((mealType, index) => (
            <div 
              key={mealType}
              className="flex items-center justify-center h-40 w-24"
            >
              <div className="text-center">
                <div className="text-sm font-medium text-gray-900">
                  {MEAL_LABELS[mealType]}
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }
    
    return null;
  };
  
  const renderGrid = () => {
    const gridClass = cn(
      "grid gap-3",
      {
        // Desktop
        "grid-cols-7 grid-rows-4": isDesktop,
        // Tablet
        "grid-cols-4 grid-rows-7": isTablet,
        // Mobile
        "grid-cols-2": isMobile,
      }
    );
    
    return (
      <div className={gridClass}>
        {slotMatrix.map((row, rowIndex) =>
          row.map((slot, colIndex) => {
            if (!slot) return null;
            
            const recipe = slot.recipeId ? recipes[slot.recipeId] : undefined;
            const isSelected = selectedSlots.includes(slot.id);
            const isDragTarget = draggedSlot?.id === slot.id;
            const isDropTarget = dropTarget && 
              dropTarget.row === slot.position.row && 
              dropTarget.col === slot.position.col;
            
            return (
              <motion.div
                key={`${rowIndex}-${colIndex}-${slot.id}`}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 25,
                  delay: (rowIndex * currentLayout.columns + colIndex) * 0.02
                }}
              >
                <MealSlot
                  slot={slot}
                  recipe={recipe}
                  isSelected={isSelected}
                  isDragTarget={isDragTarget}
                  isDropTarget={isDropTarget}
                  showMealType={isMobile || isTablet}
                  compact={compact || isMobile}
                  onClick={handleSlotClick}
                  onRecipeSelect={onRecipeSelect}
                  onClear={onSlotClear}
                  onLock={onSlotLock}
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                  onDragOver={(e) => handleDragOver(slot.position, e)}
                  onDrop={(e) => handleDrop(slot.position, e)}
                />
              </motion.div>
            );
          })
        )}
      </div>
    );
  };
  
  const renderMobileDayHeaders = () => {
    if (!isMobile) return null;
    
    return slotMatrix.map((row, index) => {
      if (index % 2 !== 0) return null; // Solo mostrar en filas pares (mañana)
      
      const dayIndex = Math.floor(index / 2);
      const date = weekDays[dayIndex];
      
      return (
        <div key={`day-header-${dayIndex}`} className="col-span-2 text-center py-2">
          <div className="text-sm font-medium text-gray-900">
            {DAY_NAMES[date.getDay()]}
          </div>
          <div className="text-xs text-gray-500">
            {format(date, 'd MMM', { locale: es })}
          </div>
        </div>
      );
    });
  };
  
  // =============================================
  // MAIN RENDER
  // =============================================
  
  return (
    <div className="meal-planner-grid">
      {/* Headers */}
      {renderMobileHeaders()}
      {renderDesktopHeaders()}
      {renderTabletHeaders()}
      
      {/* Main grid container */}
      <div className="flex">
        {/* Row headers (desktop only) */}
        {renderRowHeaders()}
        
        {/* Grid content */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            {renderGrid()}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Mobile day separators */}
      {isMobile && (
        <style jsx>{`
          .grid > *:nth-child(4n-3)::before {
            content: '';
            position: absolute;
            top: -20px;
            left: 0;
            right: 0;
            height: 1px;
            background: #e5e7eb;
          }
        `}</style>
      )}
    </div>
  );
};

export default MealPlannerGrid;