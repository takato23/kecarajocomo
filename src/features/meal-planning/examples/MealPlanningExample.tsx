'use client';

import React, { useEffect } from 'react';
import { useMealPlanning, useMealSlot, useWeekSummary, useShoppingList } from '../hooks/useMealPlanning';
import { formatDateSpanish, getMealTypeInfo, getDayName, formatCookingTime } from '../utils';
import type { MealType } from '../types';

/**
 * Example component demonstrating meal planning state management
 */
export function MealPlanningExample() {
  const {
    currentWeekPlan,
    isLoading,
    error,
    isOnline,
    isSyncing,
    realtimeStatus,
    navigateWeek,
    handleAIGenerate,
    clearWeek,
    exportWeekPlan,
    getWeekSummary
  } = useMealPlanning();
  
  const weekSummary = useWeekSummary();
  
  // Example of using a specific meal slot
  const breakfastMonday = useMealSlot(1, 'desayuno');
  
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Meal Planning State Management Example</h1>
      
      {/* Connection Status */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
          <span>{isOnline ? 'Online' : 'Offline'}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${
            realtimeStatus === 'connected' ? 'bg-green-500' : 
            realtimeStatus === 'connecting' ? 'bg-yellow-500' : 
            'bg-gray-500'
          }`} />
          <span>Realtime: {realtimeStatus}</span>
        </div>
        
        {isSyncing && (
          <div className="flex items-center gap-2">
            <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
            <span>Syncing...</span>
          </div>
        )}
      </div>
      
      {/* Week Navigation */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => navigateWeek('prev')}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Previous Week
        </button>
        
        <button
          onClick={() => navigateWeek('today')}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Current Week
        </button>
        
        <button
          onClick={() => navigateWeek('next')}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Next Week
        </button>
      </div>
      
      {/* Week Summary */}
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-xl font-semibold mb-3">Week Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Total Meals</p>
            <p className="text-2xl font-bold">{weekSummary.totalMeals}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Completed</p>
            <p className="text-2xl font-bold">{weekSummary.completedMeals}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Unique Recipes</p>
            <p className="text-2xl font-bold">{weekSummary.uniqueRecipes}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Completion</p>
            <p className="text-2xl font-bold">{weekSummary.completionPercentage}%</p>
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="mb-6 flex flex-wrap gap-4">
        <button
          onClick={() => handleAIGenerate()}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          Generate with AI
        </button>
        
        <button
          onClick={clearWeek}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Clear Week
        </button>
        
        <button
          onClick={() => exportWeekPlan('json')}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Export JSON
        </button>
        
        <button
          onClick={() => exportWeekPlan('csv')}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Export CSV
        </button>
        
        <button
          onClick={() => exportWeekPlan('pdf')}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Export PDF
        </button>
      </div>
      
      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
          <p className="mt-2 text-gray-600">Loading meal plan...</p>
        </div>
      )}
      
      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">
          Error: {error}
        </div>
      )}
      
      {/* Week Plan Display */}
      {currentWeekPlan && !isLoading && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">
            Week of {formatDateSpanish(currentWeekPlan.startDate)}
          </h2>
          
          {/* Days Grid */}
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {[0, 1, 2, 3, 4, 5, 6].map(dayOfWeek => (
              <DayColumn key={dayOfWeek} dayOfWeek={dayOfWeek} />
            ))}
          </div>
        </div>
      )}
      
      {/* Example: Single Slot Usage */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Example: Monday Breakfast Slot</h3>
        {breakfastMonday.slot ? (
          <div>
            <p>Recipe: {breakfastMonday.slot.recipe?.name || 'Not assigned'}</p>
            <p>Servings: {breakfastMonday.slot.servings}</p>
            <p>Locked: {breakfastMonday.slot.isLocked ? 'Yes' : 'No'}</p>
            <button
              onClick={() => breakfastMonday.toggleLock()}
              className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm"
            >
              Toggle Lock
            </button>
          </div>
        ) : (
          <p>No slot data available</p>
        )}
      </div>
      
      {/* Shopping List Example */}
      <ShoppingListExample />
    </div>
  );
}

/**
 * Day column component
 */
function DayColumn({ dayOfWeek }: { dayOfWeek: number }) {
  const { currentWeekPlan, handleSlotClick } = useMealPlanning();
  const mealTypes: MealType[] = ['desayuno', 'almuerzo', 'merienda', 'cena'];
  
  if (!currentWeekPlan) return null;
  
  const daySlots = currentWeekPlan.slots.filter(slot => slot.dayOfWeek === dayOfWeek);
  
  return (
    <div className="border rounded-lg p-3">
      <h3 className="font-semibold mb-3 text-center">{getDayName(dayOfWeek)}</h3>
      
      <div className="space-y-2">
        {mealTypes.map(mealType => {
          const slot = daySlots.find(s => s.mealType === mealType);
          const mealInfo = getMealTypeInfo(mealType);
          
          return (
            <div
              key={mealType}
              onClick={() => slot && handleSlotClick(slot)}
              className="p-2 border rounded cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{mealInfo.icon} {mealInfo.label}</span>
                {slot?.isLocked && <span className="text-xs">🔒</span>}
              </div>
              
              {slot?.recipe ? (
                <div>
                  <p className="text-sm font-medium">{slot.recipe.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatCookingTime(slot.recipe.prepTime + slot.recipe.cookTime)}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-400">Empty</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Shopping list example component
 */
function ShoppingListExample() {
  const { generateShoppingList, isLoading } = useShoppingList();
  const [shoppingList, setShoppingList] = React.useState<any>(null);
  
  const handleGenerateList = async () => {
    const list = await generateShoppingList();
    setShoppingList(list);
  };
  
  return (
    <div className="mt-8 p-4 bg-green-50 rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Shopping List Example</h3>
      
      <button
        onClick={handleGenerateList}
        disabled={isLoading}
        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
      >
        Generate Shopping List
      </button>
      
      {shoppingList && (
        <div className="mt-4">
          <p className="font-medium">Total Items: {shoppingList.items.length}</p>
          <p className="text-sm text-gray-600">
            Estimated Total: ${shoppingList.estimatedTotal?.toFixed(2) || '0.00'}
          </p>
          
          <div className="mt-2 space-y-2">
            {shoppingList.categories.map((category: any) => (
              <div key={category.name}>
                <h4 className="font-medium capitalize">{category.name}</h4>
                <ul className="text-sm text-gray-600 ml-4">
                  {category.items.slice(0, 3).map((item: any) => (
                    <li key={item.id}>
                      {item.ingredientName} - {item.totalAmount} {item.unit}
                    </li>
                  ))}
                  {category.items.length > 3 && (
                    <li>...and {category.items.length - 3} more</li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}