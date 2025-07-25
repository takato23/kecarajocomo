'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar,
  Settings,
  ShoppingCart,
  BarChart3,
  Sparkles,
  Download,
  Share2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { format, startOfWeek, addWeeks } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

import { useUser } from '@/store';
import { LoadingSpinner } from '@/components/ui/enhanced-loading';
import { UserPreferences } from '@/lib/types/mealPlanning';

import { useMealPlanningStore } from '../store/useMealPlanningStore';
import { useGeminiMealPlanner } from '../hooks/useGeminiMealPlanner';
import type { MealType } from '../types';

import { MealPlannerWizard, type WizardData } from './MealPlannerWizard';
import MealPlannerGrid from './MealPlannerGrid';
import { RecipeSelectionModal } from './RecipeSelectionModal';
import { UserPreferencesModal } from './UserPreferencesModal';
import { ShoppingListModal } from './ShoppingListModal';



type ViewMode = 'calendar' | 'shopping' | 'nutrition';

export default function MealPlannerPage() {
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
  const [showWizard, setShowWizard] = useState(false);
  const [hasCompletedWizard, setHasCompletedWizard] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ dayOfWeek: number; mealType: MealType } | null>(null);

  // Initialize
  useEffect(() => {
    if (user) {
      // Check if user has completed wizard
      const wizardCompleted = localStorage.getItem(`meal-wizard-completed-${user.id}`);
      
      if (!wizardCompleted) {
        setShowWizard(true);
      } else {
        setHasCompletedWizard(true);
        // Load current week plan
        const startDate = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
        loadWeekPlan(startDate);
      }
    }
  }, [user, loadWeekPlan]);

  const handleWizardComplete = async (data: WizardData) => {
    if (user) {
      localStorage.setItem(`meal-wizard-completed-${user.id}`, 'true');
      localStorage.setItem(`meal-preferences-${user.id}`, JSON.stringify(data));
    }
    setHasCompletedWizard(true);
    setShowWizard(false);
    
    // Load current week plan after completing wizard
    const startDate = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
    await loadWeekPlan(startDate);

    // Convert wizard data to UserPreferences format
    const preferences: Partial<UserPreferences> = {
      userId: user?.id || '',
      dietaryRestrictions: data.dietaryPreferences as any[],
      allergies: data.allergies as any[],
      favoriteCuisines: data.cuisinePreferences as any[],
      cookingSkillLevel: data.cookingSkill,
      householdSize: 2, // Default value
      weeklyBudget: data.budgetLevel === 'low' ? 300 : data.budgetLevel === 'medium' ? 500 : 800,
      maxPrepTimePerMeal: data.maxCookingTime,
      preferredMealTypes: ['breakfast', 'lunch', 'dinner']
    };

    // Generate initial meal plan with AI
    toast.promise(
      generateWeeklyPlan(preferences),
      {
        loading: 'Generando tu plan de comidas personalizado con IA...',
        success: async (result) => {
          if (result.success && result.data) {
            await applyGeneratedPlan(result.data);
            return 'Plan de comidas generado exitosamente!';
          }
          throw new Error('No se pudo generar el plan');
        },
        error: 'Error al generar el plan de comidas'
      }
    );
  };

  const handleWizardSkip = () => {
    if (user) {
      localStorage.setItem(`meal-wizard-completed-${user.id}`, 'skipped');
    }
    setHasCompletedWizard(true);
    setShowWizard(false);
    
    // Load current week plan after skipping wizard
    const startDate = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
    loadWeekPlan(startDate);
  };

  const handleWeekNavigation = (direction: 'prev' | 'next' | 'today') => {
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
  };

  const handleRecipeSelect = (slot: { dayOfWeek: number; mealType: MealType }) => {
    setSelectedSlot(slot);
    setActiveModal('recipe-select');
  };

  const handleShoppingList = () => {
    setActiveModal('shopping-list');
  };

  const handleExportWeek = async () => {
    // TODO: Implement week export functionality
    console.log('Export week');
  };

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

  if (isLoading && !hasCompletedWizard) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
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

  // Show wizard if not completed
  if (!hasCompletedWizard && !showWizard) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">📅</div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Welcome to Meal Planning!
          </h3>
          <p className="text-white/60 mb-6">
            Let's personalize your meal planning experience
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowWizard(true)}
            className="px-8 py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium text-lg rounded-xl hover:from-orange-600 hover:to-pink-600 shadow-lg"
          >
            Get Started
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
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
                onClick={() => setActiveModal('preferences')}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
                title="Preferences"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={handleExportWeek}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
                title="Export"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
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
                onClick={() => handleWeekNavigation('prev')}
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
                onClick={() => handleWeekNavigation('next')}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </motion.button>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleWeekNavigation('today')}
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium rounded-xl hover:from-orange-600 hover:to-pink-600"
            >
              Hoy
            </motion.button>
          </div>

          {/* View Tabs */}
          <div className="flex gap-2 p-1 bg-white/10 backdrop-blur-xl rounded-lg">
            {views.map((view) => {
              const Icon = view.icon;
              return (
                <button
                  key={view.id}
                  onClick={() => setViewMode(view.id)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md",
                    "font-medium transition-all",
                    viewMode === view.id
                      ? "bg-white/20 text-white shadow-sm"
                      : "hover:bg-white/10 text-white/60 hover:text-white"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{view.label}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {viewMode === 'calendar' && (
            <motion.div
              key="calendar"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <MealPlannerGrid
                onRecipeSelect={handleRecipeSelect}
                onShoppingList={handleShoppingList}
                onExportWeek={handleExportWeek}
              />
            </motion.div>
          )}

          {viewMode === 'shopping' && (
            <motion.div
              key="shopping"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <iOS26EnhancedCard
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
              </iOS26EnhancedCard>
            </motion.div>
          )}

          {viewMode === 'nutrition' && (
            <motion.div
              key="nutrition"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <iOS26EnhancedCard
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
              </iOS26EnhancedCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {activeModal === 'recipe-select' && selectedSlot && (
          <RecipeSelectionModal
            slot={selectedSlot}
            onClose={() => {
              setActiveModal(null);
              setSelectedSlot(null);
            }}
          />
        )}

        {activeModal === 'preferences' && (
          <UserPreferencesModal
            onClose={() => setActiveModal(null)}
          />
        )}

        {activeModal === 'shopping-list' && (
          <ShoppingListModal
            onClose={() => setActiveModal(null)}
          />
        )}
      </AnimatePresence>

      {/* Meal Planner Wizard */}
      {showWizard && (
        <MealPlannerWizard
          onComplete={handleWizardComplete}
          onSkip={handleWizardSkip}
        />
      )}
    </div>
  );
}

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}