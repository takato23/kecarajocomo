'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, Calendar, ShoppingCart, Download, Sparkles } from 'lucide-react';
import { format, startOfWeek, endOfWeek } from 'date-fns';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { MealPlannerWizard } from '@/components/meal-planner/MealPlannerWizard';
import type { WizardData } from '@/components/meal-planner/MealPlannerWizard';
import { iOS26EnhancedCard } from '@/components/ios26';

export default function MealPlanningPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [showNewPlanModal, setShowNewPlanModal] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [hasCompletedWizard, setHasCompletedWizard] = useState(false);
  const [userPreferences, setUserPreferences] = useState<WizardData | null>(null);

  useEffect(() => {
    if (user) {
      // Check if user has completed wizard (from localStorage)
      const wizardCompleted = localStorage.getItem(`meal-wizard-completed-${user.id}`);
      const preferencesStr = localStorage.getItem(`meal-preferences-${user.id}`);
      
      if (!wizardCompleted) {
        setShowWizard(true);
      } else {
        setHasCompletedWizard(true);
        if (preferencesStr) {
          setUserPreferences(JSON.parse(preferencesStr));
        }
      }
    }
  }, [user]);

  const handleWizardComplete = (data: WizardData) => {
    // Save preferences to localStorage (in production, save to database)
    if (user) {
      localStorage.setItem(`meal-wizard-completed-${user.id}`, 'true');
      localStorage.setItem(`meal-preferences-${user.id}`, JSON.stringify(data));
    }
    setHasCompletedWizard(true);
    setUserPreferences(data);
    setShowWizard(false);
  };

  const handleWizardSkip = () => {
    if (user) {
      localStorage.setItem(`meal-wizard-completed-${user.id}`, 'skipped');
    }
    setHasCompletedWizard(true);
    setShowWizard(false);
  };

  const handleCreatePlan = async () => {
    // Placeholder for creating a meal plan
    setShowNewPlanModal(false);
  };

  const handleGenerateShoppingList = async () => {
    router.push('/shopping');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Meal Planning
            </h1>
            <p className="text-white/60">
              Plan your weekly meals with AI-powered suggestions
            </p>
          </div>
          
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowWizard(true)}
              className="px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 text-white font-medium rounded-xl hover:bg-white/20 transition-all duration-300 flex items-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Update Preferences
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowNewPlanModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium rounded-xl hover:from-orange-600 hover:to-pink-600 shadow-lg transition-all duration-300 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              New Meal Plan
            </motion.button>
          </div>
        </div>

        {/* Content */}
        {hasCompletedWizard && userPreferences ? (
          <div className="space-y-8">
            {/* User Preferences Summary */}
            <iOS26EnhancedCard
              variant="glass"
              elevation="medium"
              glowEffect
              className="p-6"
            >
              <h3 className="text-xl font-semibold text-white mb-4">Your Preferences</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {userPreferences.dietaryPreferences.length > 0 && (
                  <div>
                    <p className="text-white/60 text-sm mb-2">Dietary Preferences</p>
                    <div className="flex flex-wrap gap-2">
                      {userPreferences.dietaryPreferences.map((pref) => (
                        <span
                          key={pref}
                          className="px-3 py-1 rounded-full bg-white/10 text-white text-sm"
                        >
                          {pref}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {userPreferences.cookingSkill && (
                  <div>
                    <p className="text-white/60 text-sm mb-2">Cooking Skill</p>
                    <span className="px-3 py-1 rounded-full bg-gradient-to-r from-orange-500/20 to-pink-500/20 text-white text-sm capitalize">
                      {userPreferences.cookingSkill}
                    </span>
                  </div>
                )}
                
                <div>
                  <p className="text-white/60 text-sm mb-2">Preferences</p>
                  <div className="space-y-1">
                    <p className="text-white text-sm">{userPreferences.maxCookingTime} min max cooking time</p>
                    <p className="text-white text-sm">{userPreferences.mealsPerDay} meals per day</p>
                  </div>
                </div>
              </div>
            </iOS26EnhancedCard>

            {/* Placeholder for meal calendar */}
            <iOS26EnhancedCard
              variant="glass"
              elevation="high"
              interactive
              className="p-8"
            >
              <div className="text-center py-16">
                <Calendar className="w-16 h-16 text-white/40 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  Your meal calendar will appear here
                </h3>
                <p className="text-white/60 mb-6">
                  Create your first meal plan to start organizing your weekly meals
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowNewPlanModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium rounded-xl hover:from-orange-600 hover:to-pink-600"
                >
                  Create Your First Meal Plan
                </motion.button>
              </div>
            </iOS26EnhancedCard>
          </div>
        ) : !showWizard ? (
          <div className="text-center py-16">
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
        ) : null}
      </div>

      {/* New Plan Modal */}
      {showNewPlanModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-bold text-white mb-4">
              Create New Meal Plan
            </h3>
            <p className="text-white/60 mb-6">
              This will create a meal plan for the current week. You can customize it after creation.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowNewPlanModal(false)}
                className="px-4 py-2 border border-white/20 text-white rounded-lg hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePlan}
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:from-orange-600 hover:to-pink-600"
              >
                Create Plan
              </button>
            </div>
          </motion.div>
        </div>
      )}

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