/**
 * Meal Plan Slice - Meal planning state management
 */

import { StateCreator } from 'zustand';

import { Recipe } from './recipeSlice';

export interface PlannedMeal {
  id: string;
  recipe?: Recipe;
  customMeal?: {
    name: string;
    description?: string;
    image?: string;
  };
  servings: number;
  notes?: string;
  isCooked: boolean;
  cookedAt?: Date;
}

export interface DayMeals {
  breakfast: PlannedMeal[];
  lunch: PlannedMeal[];
  dinner: PlannedMeal[];
  snacks: PlannedMeal[];
}

export interface MealPlanSlice {
  mealPlan: {
    weeklyPlan: Record<string, DayMeals>; // date string -> meals
    currentWeek: Date;
    preferences: {
      mealsPerDay: number;
      cookingDays: string[]; // days of week when user prefers to cook
      prepDay?: string; // meal prep day
      repetitionLimit: number; // max times same recipe can appear in a week
      balanceNutrition: boolean;
      considerPantry: boolean;
      budgetLimit?: number;
    };
    templates: {
      id: string;
      name: string;
      description?: string;
      weekPlan: Record<string, DayMeals>;
      createdAt: Date;
    }[];
    shoppingLists: {
      weekOf: string;
      items: {
        name: string;
        quantity: number;
        unit: string;
        category: string;
        obtained: boolean;
      }[];
      generatedAt: Date;
    }[];
    isLoading: boolean;
    lastGenerated?: Date;
  };
  
  // Actions
  updateMealPlan: (date: string, meals: Partial<DayMeals>) => void;
  addMealToDate: (date: string, mealType: keyof DayMeals, meal: PlannedMeal) => void;
  removeMealFromDate: (date: string, mealType: keyof DayMeals, mealId: string) => void;
  markMealAsCooked: (date: string, mealType: keyof DayMeals, mealId: string) => void;
  generateWeeklyPlan: (startDate: Date, preferences?: any) => void;
  duplicateWeek: (sourceWeek: Date, targetWeek: Date) => void;
  savePlanAsTemplate: (name: string, description?: string) => void;
  applyTemplate: (templateId: string, startDate: Date) => void;
  deleteTemplate: (templateId: string) => void;
  generateShoppingList: (weekOf: Date) => void;
  updateMealPlanPreferences: (preferences: Partial<typeof mealPlan.preferences>) => void;
  clearWeek: (weekOf: Date) => void;
  setCurrentWeek: (date: Date) => void;
  setMealPlanLoading: (loading: boolean) => void;
}

const defaultPreferences = {
  mealsPerDay: 3,
  cookingDays: ['monday', 'wednesday', 'friday', 'sunday'],
  prepDay: 'sunday',
  repetitionLimit: 2,
  balanceNutrition: true,
  considerPantry: true,
  budgetLimit: undefined
};

const emptyDayMeals = (): DayMeals => ({
  breakfast: [],
  lunch: [],
  dinner: [],
  snacks: []
});

const getWeekKey = (date: Date): string => {
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - date.getDay());
  return startOfWeek.toISOString().split('T')[0];
};

const getDateKey = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const createMealPlanSlice: StateCreator<MealPlanSlice> = (set, get) => ({
  mealPlan: {
    weeklyPlan: {},
    currentWeek: new Date(),
    preferences: defaultPreferences,
    templates: [],
    shoppingLists: [],
    isLoading: false,
    lastGenerated: undefined
  },
  
  updateMealPlan: (date, meals) => set((state) => {
    if (!state.mealPlan.weeklyPlan[date]) {
      state.mealPlan.weeklyPlan[date] = emptyDayMeals();
    }
    Object.assign(state.mealPlan.weeklyPlan[date], meals);
  }),
  
  addMealToDate: (date, mealType, meal) => set((state) => {
    if (!state.mealPlan.weeklyPlan[date]) {
      state.mealPlan.weeklyPlan[date] = emptyDayMeals();
    }
    state.mealPlan.weeklyPlan[date][mealType].push(meal);
  }),
  
  removeMealFromDate: (date, mealType, mealId) => set((state) => {
    if (state.mealPlan.weeklyPlan[date]) {
      state.mealPlan.weeklyPlan[date][mealType] = state.mealPlan.weeklyPlan[date][mealType]
        .filter(meal => meal.id !== mealId);
    }
  }),
  
  markMealAsCooked: (date, mealType, mealId) => set((state) => {
    if (state.mealPlan.weeklyPlan[date]) {
      const meal = state.mealPlan.weeklyPlan[date][mealType]
        .find(meal => meal.id === mealId);
      if (meal) {
        meal.isCooked = true;
        meal.cookedAt = new Date();
      }
    }
  }),
  
  generateWeeklyPlan: (startDate, preferences) => set((state) => {
    // This would integrate with the AI service to generate a meal plan
    // For now, we'll create a placeholder implementation
    
    state.mealPlan.isLoading = true;
    
    // Generate 7 days of meals starting from startDate
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateKey = getDateKey(currentDate);
      
      state.mealPlan.weeklyPlan[dateKey] = emptyDayMeals();
      
      // This would be replaced with actual AI-generated meal planning
      // For now, just create placeholder meals
    }
    
    state.mealPlan.lastGenerated = new Date();
    state.mealPlan.isLoading = false;
  }),
  
  duplicateWeek: (sourceWeek, targetWeek) => set((state) => {
    const sourceWeekKey = getWeekKey(sourceWeek);
    const targetWeekKey = getWeekKey(targetWeek);
    
    // Copy all meals from source week to target week
    Object.entries(state.mealPlan.weeklyPlan).forEach(([date, meals]) => {
      const mealDate = new Date(date);
      const weekKey = getWeekKey(mealDate);
      
      if (weekKey === sourceWeekKey) {
        // Calculate the corresponding date in target week
        const daysDiff = Math.floor((mealDate.getTime() - sourceWeek.getTime()) / (1000 * 60 * 60 * 24));
        const targetDate = new Date(targetWeek);
        targetDate.setDate(targetWeek.getDate() + daysDiff);
        const targetDateKey = getDateKey(targetDate);
        
        // Deep copy the meals with new IDs
        state.mealPlan.weeklyPlan[targetDateKey] = {
          breakfast: meals.breakfast.map(meal => ({ ...meal, id: Date.now().toString() + Math.random() })),
          lunch: meals.lunch.map(meal => ({ ...meal, id: Date.now().toString() + Math.random() })),
          dinner: meals.dinner.map(meal => ({ ...meal, id: Date.now().toString() + Math.random() })),
          snacks: meals.snacks.map(meal => ({ ...meal, id: Date.now().toString() + Math.random() }))
        };
      }
    });
  }),
  
  savePlanAsTemplate: (name, description) => set((state) => {
    const currentWeekKey = getWeekKey(state.mealPlan.currentWeek);
    const weekPlan: Record<string, DayMeals> = {};
    
    // Get all meals for current week
    Object.entries(state.mealPlan.weeklyPlan).forEach(([date, meals]) => {
      const mealDate = new Date(date);
      const weekKey = getWeekKey(mealDate);
      
      if (weekKey === currentWeekKey) {
        weekPlan[date] = meals;
      }
    });
    
    const template = {
      id: Date.now().toString(),
      name,
      description,
      weekPlan,
      createdAt: new Date()
    };
    
    state.mealPlan.templates.push(template);
  }),
  
  applyTemplate: (templateId, startDate) => set((state) => {
    const template = state.mealPlan.templates.find(t => t.id === templateId);
    if (!template) return;
    
    // Apply template to the week starting from startDate
    const templateDates = Object.keys(template.weekPlan).sort();
    const templateStartDate = new Date(templateDates[0]);
    
    templateDates.forEach(templateDate => {
      const templateMealDate = new Date(templateDate);
      const daysDiff = Math.floor((templateMealDate.getTime() - templateStartDate.getTime()) / (1000 * 60 * 60 * 24));
      
      const targetDate = new Date(startDate);
      targetDate.setDate(startDate.getDate() + daysDiff);
      const targetDateKey = getDateKey(targetDate);
      
      const meals = template.weekPlan[templateDate];
      state.mealPlan.weeklyPlan[targetDateKey] = {
        breakfast: meals.breakfast.map(meal => ({ ...meal, id: Date.now().toString() + Math.random(), isCooked: false, cookedAt: undefined })),
        lunch: meals.lunch.map(meal => ({ ...meal, id: Date.now().toString() + Math.random(), isCooked: false, cookedAt: undefined })),
        dinner: meals.dinner.map(meal => ({ ...meal, id: Date.now().toString() + Math.random(), isCooked: false, cookedAt: undefined })),
        snacks: meals.snacks.map(meal => ({ ...meal, id: Date.now().toString() + Math.random(), isCooked: false, cookedAt: undefined }))
      };
    });
  }),
  
  deleteTemplate: (templateId) => set((state) => {
    state.mealPlan.templates = state.mealPlan.templates.filter(t => t.id !== templateId);
  }),
  
  generateShoppingList: (weekOf) => set((state) => {
    const weekKey = getWeekKey(weekOf);
    const ingredients = new Map<string, { quantity: number; unit: string; category: string }>();
    
    // Collect all ingredients from the week's meals
    Object.entries(state.mealPlan.weeklyPlan).forEach(([date, meals]) => {
      const mealDate = new Date(date);
      const mealWeekKey = getWeekKey(mealDate);
      
      if (mealWeekKey === weekKey) {
        const allMeals = [...meals.breakfast, ...meals.lunch, ...meals.dinner, ...meals.snacks];
        
        allMeals.forEach(meal => {
          if (meal.recipe) {
            meal.recipe.ingredients.forEach(ingredient => {
              const key = ingredient.name.toLowerCase();
              const existing = ingredients.get(key);
              
              if (existing) {
                existing.quantity += ingredient.quantity * meal.servings;
              } else {
                ingredients.set(key, {
                  quantity: ingredient.quantity * meal.servings,
                  unit: ingredient.unit,
                  category: ingredient.category || 'otros'
                });
              }
            });
          }
        });
      }
    });
    
    // Create shopping list
    const shoppingList = {
      weekOf: weekKey,
      items: Array.from(ingredients.entries()).map(([name, details]) => ({
        name,
        quantity: details.quantity,
        unit: details.unit,
        category: details.category,
        obtained: false
      })),
      generatedAt: new Date()
    };
    
    // Remove existing shopping list for this week and add new one
    state.mealPlan.shoppingLists = state.mealPlan.shoppingLists.filter(list => list.weekOf !== weekKey);
    state.mealPlan.shoppingLists.push(shoppingList);
  }),
  
  updateMealPlanPreferences: (preferences) => set((state) => {
    Object.assign(state.mealPlan.preferences, preferences);
  }),
  
  clearWeek: (weekOf) => set((state) => {
    const weekKey = getWeekKey(weekOf);
    
    // Remove all meals for this week
    Object.keys(state.mealPlan.weeklyPlan).forEach(date => {
      const mealDate = new Date(date);
      const mealWeekKey = getWeekKey(mealDate);
      
      if (mealWeekKey === weekKey) {
        delete state.mealPlan.weeklyPlan[date];
      }
    });
  }),
  
  setCurrentWeek: (date) => set((state) => {
    state.mealPlan.currentWeek = date;
  }),
  
  setMealPlanLoading: (loading) => set((state) => {
    state.mealPlan.isLoading = loading;
  })
});