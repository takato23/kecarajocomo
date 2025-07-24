'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, Calendar, ShoppingCart, Download } from 'lucide-react';
import { format, startOfWeek, endOfWeek } from 'date-fns';

import { useMealPlansStore } from '@/stores/meal-plans';
import { useAuthStore } from '@/stores/auth';
import { MealPlanCalendar } from '@/features/meal-planning/components/MealPlanCalendar';
import { RecipeSelector } from '@/features/meal-planning/components/RecipeSelector';

export default function MealPlanningPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    mealPlans,
    currentMealPlan,
    isLoading,
    fetchMealPlans,
    fetchMealPlan,
    createMealPlan,
    addRecipeToMealPlan,
    removeRecipeFromMealPlan,
    generateShoppingList,
  } = useMealPlansStore();

  const [showNewPlanModal, setShowNewPlanModal] = useState(false);
  const [showRecipeSelector, setShowRecipeSelector] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<string>('');

  useEffect(() => {
    if (user) {
      fetchMealPlans(user.id);
    }
  }, [user]);

  const handleCreatePlan = async () => {
    if (!user) return;

    const startDate = startOfWeek(new Date());
    const endDate = endOfWeek(new Date());

    const newPlan = await createMealPlan(user.id, {
      name: `Week of ${format(startDate, 'MMM d')}`,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
    });

    if (newPlan) {
      fetchMealPlan(newPlan.id);
    }
    setShowNewPlanModal(false);
  };

  const handleAddRecipe = (date: Date, mealType: string) => {
    setSelectedDate(date);
    setSelectedMealType(mealType);
    setShowRecipeSelector(true);
  };

  const handleRecipeSelect = async (recipe: any, servings: number) => {
    if (!currentMealPlan || !selectedDate) return;

    await addRecipeToMealPlan(currentMealPlan.id, {
      recipe_id: recipe.id,
      date: selectedDate.toISOString(),
      meal_type: selectedMealType,
      servings,
    });

    setShowRecipeSelector(false);
    setSelectedDate(null);
    setSelectedMealType('');
  };

  const handleRemoveRecipe = async (mealPlanRecipe: any) => {
    if (!currentMealPlan) return;

    await removeRecipeFromMealPlan(
      currentMealPlan.id,
      mealPlanRecipe.recipe_id,
      mealPlanRecipe.date,
      mealPlanRecipe.meal_type
    );
  };

  const handleGenerateShoppingList = async () => {
    if (!currentMealPlan) return;

    await generateShoppingList(currentMealPlan.id);
    router.push('/app/shopping');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-lime-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Meal Planning
            </h1>
            <p className="text-gray-600">
              Plan your weekly meals and generate shopping lists
            </p>
          </div>
          
          <div className="flex gap-3">
            {currentMealPlan && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleGenerateShoppingList}
                className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lime-500 flex items-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" />
                Generate Shopping List
              </motion.button>
            )}
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowNewPlanModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-lime-500 to-lime-600 text-white font-medium rounded-lg hover:from-lime-600 hover:to-lime-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lime-500 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              New Meal Plan
            </motion.button>
          </div>
        </div>

        {/* Meal Plan Selector */}
        {mealPlans.length > 0 && (
          <div className="mb-6">
            <select
              value={currentMealPlan?.id || ''}
              onChange={(e) => fetchMealPlan(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
            >
              <option value="">Select a meal plan</option>
              {mealPlans.map(plan => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} ({format(new Date(plan.start_date), 'MMM d')} - {format(new Date(plan.end_date), 'MMM d')})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-500"></div>
          </div>
        ) : currentMealPlan ? (
          <div className="space-y-8">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white/80 backdrop-blur-md rounded-lg border border-white/20 shadow-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Meals</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {currentMealPlan.recipes?.length || 0}
                    </p>
                  </div>
                  <Calendar className="w-8 h-8 text-lime-500" />
                </div>
              </div>
              
              <div className="bg-white/80 backdrop-blur-md rounded-lg border border-white/20 shadow-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Unique Recipes</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {new Set(currentMealPlan.recipes?.map(r => r.recipe_id)).size}
                    </p>
                  </div>
                  <span className="text-2xl">📖</span>
                </div>
              </div>
              
              <div className="bg-white/80 backdrop-blur-md rounded-lg border border-white/20 shadow-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Servings</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {currentMealPlan.recipes?.reduce((sum, r) => sum + (r.servings || 0), 0) || 0}
                    </p>
                  </div>
                  <span className="text-2xl">🍽️</span>
                </div>
              </div>
              
              <div className="bg-white/80 backdrop-blur-md rounded-lg border border-white/20 shadow-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Prep Time</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {Math.round((currentMealPlan.recipes?.reduce((sum, r) => sum + (r.recipe?.prep_time || 0), 0) || 0) / 60)}h
                    </p>
                  </div>
                  <span className="text-2xl">⏱️</span>
                </div>
              </div>
            </div>

            {/* Calendar */}
            <MealPlanCalendar
              startDate={new Date(currentMealPlan.start_date)}
              endDate={new Date(currentMealPlan.end_date)}
              recipes={currentMealPlan.recipes || []}
              onDateChange={setSelectedDate}
              onAddRecipe={handleAddRecipe}
              onRemoveRecipe={handleRemoveRecipe}
            />

            {/* Actions */}
            <div className="flex justify-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                Export PDF
              </motion.button>
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No meal plans yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first meal plan to start organizing your weekly meals
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowNewPlanModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-lime-500 to-lime-600 text-white font-medium rounded-lg hover:from-lime-600 hover:to-lime-700"
            >
              Create Your First Meal Plan
            </motion.button>
          </div>
        )}
      </div>

      {/* New Plan Modal */}
      {showNewPlanModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Create New Meal Plan
            </h3>
            <p className="text-gray-600 mb-6">
              This will create a meal plan for the current week. You can customize it after creation.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowNewPlanModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePlan}
                className="px-4 py-2 bg-lime-500 text-white rounded-lg hover:bg-lime-600"
              >
                Create Plan
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Recipe Selector */}
      <RecipeSelector
        isOpen={showRecipeSelector}
        onClose={() => setShowRecipeSelector(false)}
        onSelect={handleRecipeSelect}
        date={selectedDate || new Date()}
        mealType={selectedMealType}
      />
    </div>
  );
}