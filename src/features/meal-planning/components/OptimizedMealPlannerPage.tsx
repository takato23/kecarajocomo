'use client';

import React, { useState, useEffect, lazy, Suspense, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { logger } from '@/services/logger';
import { 
  Calendar,
  Settings,
  ShoppingCart,
  BarChart3,
  Sparkles,
  Download,
  Share2,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { format, startOfWeek, addWeeks } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

import { useUser } from '@/store';
import { UserPreferences } from '@/lib/types/mealPlanning';

import { useMealPlanningStore } from '../store/useMealPlanningStore';
import { useGeminiMealPlanner } from '../hooks/useGeminiMealPlanner';
import type { MealType } from '../types';

// Lazy loaded components for better performance
const MealPlannerGrid = lazy(() => import('./MealPlannerGrid'));
const RecipeSelectionModal = lazy(() => import('./RecipeSelectionModal').then(module => ({ default: module.RecipeSelectionModal })));
const UserPreferencesModal = lazy(() => import('./UserPreferencesModal').then(module => ({ default: module.UserPreferencesModal })));
const ShoppingListModal = lazy(() => import('./ShoppingListModal').then(module => ({ default: module.ShoppingListModal })));
const LazyIOS26EnhancedCard = lazy(() => import('@/components/ios26').then(module => ({ default: module.iOS26EnhancedCard })));

// Loading components
const LoadingSpinner = memo(() => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
  </div>
));

const ModalLoadingFallback = memo(() => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-xl">
      <LoadingSpinner />
      <p className="text-gray-600 dark:text-gray-300 mt-2">Cargando...</p>
    </div>
  </div>
));

const GridLoadingFallback = memo(() => (
  <div className="space-y-6">
    <div className="animate-pulse">
      <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg mb-6"></div>
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {Array.from({ length: 28 }).map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        ))}
      </div>
    </div>
  </div>
));

type ViewMode = 'calendar' | 'shopping' | 'nutrition';

// Memoized header component to prevent unnecessary re-renders
const MealPlannerHeader = memo(({ 
  onSettingsClick, 
  onExportClick, 
  onShareClick,
  currentDate,
  onWeekNavigation
}: {
  onSettingsClick: () => void;
  onExportClick: () => void;
  onShareClick: () => void;
  currentDate: Date;
  onWeekNavigation: (direction: 'prev' | 'next' | 'today') => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    className="mb-8"
  >
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3 text-white">
          <Sparkles className="w-8 h-8 text-orange-500" />
          AI Meal Planner
        </h1>
        <p className="text-white/60 mt-1">
          Plan your meals with AI-powered suggestions
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onSettingsClick}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
          title="Preferences"
        >
          <Settings className="w-5 h-5" />
        </button>
        <button
          onClick={onExportClick}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
          title="Export"
        >
          <Download className="w-5 h-5" />
        </button>
        <button
          onClick={onShareClick}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
          title="Share"
        >
          <Share2 className="w-5 h-5" />
        </button>
      </div>
    </div>

    {/* Week Navigation */}
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onWeekNavigation('prev')}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </motion.button>
        
        <div className="text-center">
          <h2 className="text-xl font-bold text-white">
            Semana del {format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'd MMM', { locale: es })}
          </h2>
          <p className="text-sm text-white/60">
            {format(currentDate, 'MMMM yyyy', { locale: es })}
          </p>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onWeekNavigation('next')}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-white" />
        </motion.button>
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onWeekNavigation('today')}
        className="px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium rounded-xl hover:from-orange-600 hover:to-pink-600"
      >
        Hoy
      </motion.button>
    </div>
  </motion.div>
));

MealPlannerHeader.displayName = 'MealPlannerHeader';

// Memoized view tabs component
const ViewTabs = memo(({ 
  viewMode, 
  onViewChange 
}: { 
  viewMode: ViewMode; 
  onViewChange: (mode: ViewMode) => void; 
}) => {
  const views = [
    { 
      id: 'calendar' as const, 
      label: 'Calendar', 
      icon: Calendar,
      description: 'Plan your weekly meals'
    },
    { 
      id: 'shopping' as const, 
      label: 'Shopping List', 
      icon: ShoppingCart,
      description: 'Generate shopping lists'
    },
    { 
      id: 'nutrition' as const, 
      label: 'Nutrition', 
      icon: BarChart3,
      description: 'Track nutritional goals'
    },
  ];

  return (
    <div className="flex gap-2 p-1 bg-white/10 backdrop-blur-xl rounded-lg mb-8">
      {views.map((view) => {
        const Icon = view.icon;
        return (
          <button
            key={view.id}
            onClick={() => onViewChange(view.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
              viewMode === view.id
                ? "bg-white/20 text-white shadow-sm"
                : "hover:bg-white/10 text-white/60 hover:text-white"
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{view.label}</span>
          </button>
        );
      })}
    </div>
  );
});

ViewTabs.displayName = 'ViewTabs';

export default function OptimizedMealPlannerPage() {
  const { user } = useUser();
  
  const {
    currentDate,
    userPreferences,
    activeModal,
    isLoading,
    error,
    setCurrentDate,
    setActiveModal,
    loadWeekPlan
  } = useMealPlanningStore();

  const {
    generateWeeklyPlan,
    isGenerating,
    applyGeneratedPlan,
    lastGeneratedPlan,
    confidence
  } = useGeminiMealPlanner();
  
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [hasCompletedWizard, setHasCompletedWizard] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<{ dayOfWeek: number; mealType: MealType } | null>(null);

  // Initialize - always load the current week plan since wizard is handled in /planificador
  useEffect(() => {
    if (user) {
      const startDate = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
      loadWeekPlan(startDate);
    }
  }, [user, loadWeekPlan]);

  // Memoized handlers to prevent unnecessary re-renders
  const handleWeekNavigation = useCallback((direction: 'prev' | 'next' | 'today') => {
    let newDate: Date;
    
    if (direction === 'today') {
      newDate = new Date();
    } else if (direction === 'prev') {
      newDate = addWeeks(currentDate, -1);
    } else {
      newDate = addWeeks(currentDate, 1);
    }
    
    setCurrentDate(newDate);
    const startDate = format(startOfWeek(newDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    loadWeekPlan(startDate);
  }, [currentDate, setCurrentDate, loadWeekPlan]);

  const handleRecipeSelect = useCallback((slot: { dayOfWeek: number; mealType: MealType }) => {
    setSelectedSlot(slot);
    setActiveModal('recipe-select');
  }, [setActiveModal]);

  const handleShoppingList = useCallback(() => {
    setActiveModal('shopping-list');
  }, [setActiveModal]);

  const handleExportWeek = useCallback(async () => {
    logger.info('Export week', 'OptimizedMealPlannerPage');
    toast.info('Función de exportación en desarrollo');
  }, []);

  const handleShareWeek = useCallback(async () => {
    logger.info('Share week', 'OptimizedMealPlannerPage');
    toast.info('Función de compartir en desarrollo');
  }, []);

  const handleModalClose = useCallback(() => {
    setActiveModal(null);
    setSelectedSlot(null);
  }, [setActiveModal]);

  if (isLoading && !hasCompletedWizard) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-500">
          <p>Error: {error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <MealPlannerHeader
          onSettingsClick={() => setActiveModal('preferences')}
          onExportClick={handleExportWeek}
          onShareClick={handleShareWeek}
          currentDate={currentDate}
          onWeekNavigation={handleWeekNavigation}
        />

        {/* View Tabs */}
        <ViewTabs viewMode={viewMode} onViewChange={setViewMode} />

        {/* Content */}
        <AnimatePresence mode="wait">
          {viewMode === 'calendar' && (
            <motion.div
              key="calendar"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <Suspense fallback={<GridLoadingFallback />}>
                <MealPlannerGrid
                  onRecipeSelect={handleRecipeSelect}
                  onShoppingList={handleShoppingList}
                  onExportWeek={handleExportWeek}
                />
              </Suspense>
            </motion.div>
          )}

          {viewMode === 'shopping' && (
            <motion.div
              key="shopping"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <Suspense fallback={<LoadingSpinner />}>
                <LazyIOS26EnhancedCard
                  variant="glass"
                  elevation="high"
                  className="p-8 text-center"
                >
                  <ShoppingCart className="w-16 h-16 text-white/40 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Shopping List View
                  </h3>
                  <p className="text-white/60 mb-6">
                    Generate and manage your shopping lists from your meal plans
                  </p>
                  <button
                    onClick={handleShoppingList}
                    className="px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium rounded-xl hover:from-orange-600 hover:to-pink-600"
                  >
                    Open Shopping List
                  </button>
                </LazyIOS26EnhancedCard>
              </Suspense>
            </motion.div>
          )}

          {viewMode === 'nutrition' && (
            <motion.div
              key="nutrition"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <Suspense fallback={<LoadingSpinner />}>
                <LazyIOS26EnhancedCard
                  variant="glass"
                  elevation="high"
                  className="p-8 text-center"
                >
                  <BarChart3 className="w-16 h-16 text-white/40 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Nutrition Dashboard
                  </h3>
                  <p className="text-white/60 mb-6">
                    Track your nutritional goals and analyze your meal plans
                  </p>
                  <button className="px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium rounded-xl hover:from-orange-600 hover:to-pink-600">
                    View Nutrition Stats
                  </button>
                </LazyIOS26EnhancedCard>
              </Suspense>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {activeModal === 'recipe-select' && selectedSlot && (
          <Suspense fallback={<ModalLoadingFallback />}>
            <RecipeSelectionModal
              slot={selectedSlot}
              onClose={handleModalClose}
            />
          </Suspense>
        )}

        {activeModal === 'preferences' && (
          <Suspense fallback={<ModalLoadingFallback />}>
            <UserPreferencesModal
              onClose={handleModalClose}
            />
          </Suspense>
        )}

        {activeModal === 'shopping-list' && (
          <Suspense fallback={<ModalLoadingFallback />}>
            <ShoppingListModal
              onClose={handleModalClose}
            />
          </Suspense>
        )}
      </AnimatePresence>
    </div>
  );
}