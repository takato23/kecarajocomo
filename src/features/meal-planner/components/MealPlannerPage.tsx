'use client';

import React, { useState } from 'react';
import { 
  Calendar,
  Settings,
  ShoppingCart,
  BarChart3,
  Sparkles,
  Download,
  Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MealPlannerCalendar } from './MealPlannerCalendar';
import { UserPreferencesForm } from './UserPreferencesForm';
import { ShoppingListView } from './ShoppingListView';
import { NutritionDashboard } from './NutritionDashboard';
import { useMealPlannerStore } from '../store/mealPlannerStore';
import { cn } from '@/lib/utils';

type ViewMode = 'calendar' | 'shopping' | 'nutrition';

export const MealPlannerPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [showPreferences, setShowPreferences] = useState(false);
  const { userPreferences, currentWeekPlan } = useMealPlannerStore();

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

  // Show preferences form if not set
  if (!userPreferences && !showPreferences) {
    return (
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Welcome to Meal Planner</h1>
            <p className="text-muted-foreground">
              Let's set up your preferences to create personalized meal plans
            </p>
          </div>
          <UserPreferencesForm 
            onClose={() => setShowPreferences(false)}
            className="max-w-full"
          />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-primary" />
              AI Meal Planner
            </h1>
            <p className="text-muted-foreground mt-1">
              Plan your meals with AI-powered suggestions
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPreferences(true)}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
              title="Preferences"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              className="p-2 hover:bg-accent rounded-lg transition-colors"
              title="Export"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              className="p-2 hover:bg-accent rounded-lg transition-colors"
              title="Share"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex gap-2 p-1 bg-accent rounded-lg">
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
                    ? "bg-background shadow-sm"
                    : "hover:bg-background/50"
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
            <MealPlannerCalendar />
          </motion.div>
        )}

        {viewMode === 'shopping' && (
          <motion.div
            key="shopping"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <ShoppingListView />
          </motion.div>
        )}

        {viewMode === 'nutrition' && (
          <motion.div
            key="nutrition"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <NutritionDashboard />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preferences Modal */}
      <AnimatePresence>
        {showPreferences && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowPreferences(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl"
            >
              <UserPreferencesForm onClose={() => setShowPreferences(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};