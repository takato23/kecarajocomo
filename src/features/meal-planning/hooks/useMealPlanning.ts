'use client';

import { useEffect, useCallback } from 'react';
import { useMealPlanningStore } from '../store/useMealPlanningStore';
import { format, startOfWeek, addWeeks } from 'date-fns';
import { useSupabase } from '@/hooks/useSupabase';
import { logger } from '@/services/logger';
import type { MealSlot, Recipe, AIPlannerConfig, MealType } from '../types';

/**
 * Main hook for meal planning functionality
 * Provides all necessary methods and state for meal planning components
 */
export function useMealPlanning() {
  const supabase = useSupabase();
  const store = useMealPlanningStore();
  
  // Initialize real-time sync when component mounts
  useEffect(() => {
    const initializeSync = async () => {
      try {
        // Check if user is authenticated
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await store.setupRealtimeSync();
          
          // Load current week plan
          const startDate = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
          await store.loadWeekPlan(startDate);
        }
      } catch (error) {
        logger.error('Error initializing meal planning sync', 'useMealPlanning', error);
      }
    };
    
    initializeSync();
    
    // Cleanup on unmount
    return () => {
      store.cleanupRealtimeSync();
    };
  }, []);
  
  // Navigation handlers
  const navigateWeek = useCallback((direction: 'prev' | 'next' | 'today') => {
    const currentDate = store.currentDate;
    let newDate: Date;
    
    switch (direction) {
      case 'prev':
        newDate = addWeeks(currentDate, -1);
        break;
      case 'next':
        newDate = addWeeks(currentDate, 1);
        break;
      case 'today':
        newDate = new Date();
        break;
    }
    
    store.setCurrentDate(newDate);
  }, [store.currentDate]);
  
  // Meal slot handlers
  const handleSlotClick = useCallback((slot: MealSlot) => {
    store.setSelectedMeal(slot);
    store.setActiveModal('recipe-select');
  }, []);
  
  const handleRecipeSelect = useCallback(async (slot: MealSlot, recipe: Recipe) => {
    await store.addMealToSlot(slot, recipe);
    store.setActiveModal(null);
  }, []);
  
  const handleSlotClear = useCallback(async (slot: MealSlot) => {
    if (slot.id) {
      await store.removeMealFromSlot(slot.id);
    }
  }, []);
  
  const handleSlotLock = useCallback(async (slot: MealSlot) => {
    if (slot.id) {
      await store.toggleSlotLock(slot.id);
    }
  }, []);
  
  // AI generation handler
  const handleAIGenerate = useCallback(async (config?: Partial<AIPlannerConfig>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      store.error = 'Usuario no autenticado';
      return;
    }
    
    const defaultConfig: AIPlannerConfig = {
      userId: user.id,
      startDate: format(startOfWeek(store.currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
      numberOfDays: 7,
      mealsPerDay: ['desayuno', 'almuerzo', 'merienda', 'cena'],
      preferences: store.userPreferences || {
        dietaryPreferences: ['omnivore'],
        dietProfile: 'balanced',
        cuisinePreferences: [],
        excludedIngredients: [],
        preferredIngredients: [],
        allergies: [],
        cookingSkill: 'intermediate',
        maxCookingTime: 60,
        mealsPerDay: 4,
        servingsPerMeal: 2,
        budget: 'medium',
        preferVariety: true,
        useSeasonalIngredients: true,
        considerPantryItems: true
      },
      replaceExisting: false,
      lockExistingMeals: true
    };
    
    const finalConfig = { ...defaultConfig, ...config };
    
    try {
      store.setActiveModal('ai-planner');
      await store.generateWeekWithAI(finalConfig);
      store.setActiveModal(null);
    } catch (error) {
      logger.error('Error generating AI meal plan', 'useMealPlanning', error);
    }
  }, [store.currentDate, store.userPreferences]);
  
  // Batch operations
  const clearWeek = useCallback(async () => {
    if (window.confirm('¿Estás seguro de que deseas borrar toda la semana?')) {
      await store.clearWeek();
    }
  }, []);
  
  const duplicateWeek = useCallback(async (targetWeek?: Date) => {
    const targetStartDate = format(
      startOfWeek(targetWeek || addWeeks(store.currentDate, 1), { weekStartsOn: 1 }),
      'yyyy-MM-dd'
    );
    await store.duplicateWeek(targetStartDate);
  }, [store.currentDate]);
  
  // Export handlers
  const exportWeekPlan = useCallback((format: 'json' | 'csv' | 'pdf') => {
    store.downloadWeekPlan(format);
  }, []);
  
  return {
    // State
    currentWeekPlan: store.currentWeekPlan,
    recipes: store.recipes,
    userPreferences: store.userPreferences,
    currentDate: store.currentDate,
    isLoading: store.isLoading,
    error: store.error,
    selectedSlots: store.selectedSlots,
    activeModal: store.activeModal,
    selectedMeal: store.selectedMeal,
    isOnline: store.isOnline,
    isSyncing: store.isSyncing,
    lastSyncedAt: store.lastSyncedAt,
    realtimeStatus: store.realtimeStatus,
    
    // Navigation
    navigateWeek,
    setCurrentDate: store.setCurrentDate,
    
    // Meal slot handlers
    handleSlotClick,
    handleRecipeSelect,
    handleSlotClear,
    handleSlotLock,
    toggleSlotSelection: store.toggleSlotSelection,
    
    // AI generation
    handleAIGenerate,
    
    // Batch operations
    clearWeek,
    duplicateWeek,
    
    // Export
    exportWeekPlan,
    
    // Modal control
    setActiveModal: store.setActiveModal,
    setSelectedMeal: store.setSelectedMeal,
    
    // Selectors
    getSlotForDay: store.getSlotForDay,
    getWeekSummary: store.getWeekSummary,
    getDayPlan: store.getDayPlan,
    getShoppingList: store.getShoppingList
  };
}

/**
 * Hook for managing a single meal slot
 */
export function useMealSlot(dayOfWeek: number, mealType: MealType) {
  const store = useMealPlanningStore();
  const slot = store.getSlotForDay(dayOfWeek, mealType);
  
  const updateSlot = useCallback(async (updates: Partial<MealSlot>) => {
    if (slot?.id) {
      await store.updateMealSlot(slot.id, updates);
    }
  }, [slot?.id]);
  
  const addRecipe = useCallback(async (recipe: Recipe) => {
    await store.addMealToSlot({ dayOfWeek, mealType }, recipe);
  }, [dayOfWeek, mealType]);
  
  const removeRecipe = useCallback(async () => {
    if (slot?.id) {
      await store.removeMealFromSlot(slot.id);
    }
  }, [slot?.id]);
  
  const toggleLock = useCallback(async () => {
    if (slot?.id) {
      await store.toggleSlotLock(slot.id);
    }
  }, [slot?.id]);
  
  return {
    slot,
    updateSlot,
    addRecipe,
    removeRecipe,
    toggleLock,
    isSelected: slot ? store.selectedSlots.includes(slot.id) : false
  };
}

/**
 * Hook for batch operations on multiple slots
 */
export function useBatchMealOperations() {
  const store = useMealPlanningStore();
  
  const batchUpdate = useCallback(async (
    slotIds: string[],
    updates: Partial<MealSlot>
  ) => {
    const batchUpdates = slotIds.map(slotId => ({
      slotId,
      changes: updates
    }));
    
    await store.batchUpdateSlots(batchUpdates);
  }, []);
  
  const batchAddRecipe = useCallback(async (
    slots: Array<{ dayOfWeek: number; mealType: MealType }>,
    recipe: Recipe
  ) => {
    for (const slot of slots) {
      await store.addMealToSlot(slot, recipe);
    }
  }, []);
  
  const batchRemove = useCallback(async (slotIds: string[]) => {
    for (const slotId of slotIds) {
      await store.removeMealFromSlot(slotId);
    }
  }, []);
  
  const batchToggleLock = useCallback(async (slotIds: string[]) => {
    for (const slotId of slotIds) {
      await store.toggleSlotLock(slotId);
    }
  }, []);
  
  return {
    selectedSlots: store.selectedSlots,
    batchUpdate,
    batchAddRecipe,
    batchRemove,
    batchToggleLock,
    clearSelection: () => store.toggleSlotSelection('', false)
  };
}

/**
 * Hook for shopping list functionality
 */
export function useShoppingList() {
  const store = useMealPlanningStore();
  
  const generateShoppingList = useCallback(async () => {
    return await store.getShoppingList();
  }, []);
  
  return {
    generateShoppingList,
    isLoading: store.isLoading,
    error: store.error
  };
}

/**
 * Hook for week summary statistics
 */
export function useWeekSummary() {
  const store = useMealPlanningStore();
  return store.getWeekSummary();
}