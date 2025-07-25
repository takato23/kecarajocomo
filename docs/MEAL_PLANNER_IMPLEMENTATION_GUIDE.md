# Meal Planner Implementation Guide

## Immediate Action Items

### 1. Create Unified Type System

Create `/src/features/meal-planner/types/index.ts`:

```typescript
// Meal type enum supporting multiple languages
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type MealTypeES = 'desayuno' | 'almuerzo' | 'cena' | 'merienda';

// Unified meal plan interface
export interface MealPlan {
  id: string;
  userId: string;
  name: string;
  weekStartDate: Date;
  weekEndDate: Date;
  meals: PlannedMeal[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Optional enhanced features
  nutritionSummary?: NutritionSummary;
  shoppingList?: ShoppingList;
  aiMetadata?: AIMetadata;
}

export interface PlannedMeal {
  id: string;
  planId: string;
  date: string; // ISO format
  mealType: MealType;
  
  // Recipe or custom meal
  recipeId?: string;
  recipe?: Recipe;
  customMeal?: CustomMeal;
  
  // Details
  servings: number;
  notes?: string;
  
  // Status
  isCompleted: boolean;
  completedAt?: Date;
  isLocked: boolean;
  
  // UI state
  position?: { dayIndex: number; slotIndex: number };
}
```

### 2. Build Unified Store

Create `/src/features/meal-planner/store/mealPlannerStore.ts`:

```typescript
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface MealPlannerStore {
  // State
  plans: MealPlan[];
  currentPlanId: string | null;
  currentWeek: Date;
  
  // UI State
  draggedMeal: PlannedMeal | null;
  selectedMealIds: string[];
  viewMode: 'week' | 'month' | 'list';
  
  // Actions
  fetchPlans: (userId: string) => Promise<void>;
  createPlan: (plan: Partial<MealPlan>) => Promise<MealPlan>;
  updatePlan: (planId: string, updates: Partial<MealPlan>) => Promise<void>;
  deletePlan: (planId: string) => Promise<void>;
  
  // Meal Actions
  addMeal: (meal: Omit<PlannedMeal, 'id'>) => Promise<void>;
  updateMeal: (mealId: string, updates: Partial<PlannedMeal>) => Promise<void>;
  deleteMeal: (mealId: string) => Promise<void>;
  moveMeal: (mealId: string, newDate: string, newMealType: MealType) => Promise<void>;
  
  // Batch Actions
  generateWeekPlan: (options: GenerateOptions) => Promise<void>;
  clearWeek: (weekStart: Date) => Promise<void>;
  copyWeek: (sourceWeek: Date, targetWeek: Date) => Promise<void>;
  
  // UI Actions
  setCurrentWeek: (date: Date) => void;
  setDraggedMeal: (meal: PlannedMeal | null) => void;
  toggleMealSelection: (mealId: string) => void;
  setViewMode: (mode: 'week' | 'month' | 'list') => void;
  
  // Computed Getters
  getCurrentPlan: () => MealPlan | null;
  getMealsForWeek: (weekStart: Date) => PlannedMeal[];
  getMealBySlot: (date: string, mealType: MealType) => PlannedMeal | undefined;
}
```

### 3. Create Core Components

#### MealSlot Component
Create `/src/features/meal-planner/components/core/MealSlot.tsx`:

```typescript
import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Clock, Users, Utensils } from 'lucide-react';
import { PlannedMeal, MealType } from '../../types';

interface MealSlotProps {
  date: string;
  mealType: MealType;
  meal?: PlannedMeal;
  isDropTarget?: boolean;
  onDragStart?: (meal: PlannedMeal) => void;
  onDragEnd?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onClick?: () => void;
}

export const MealSlot: React.FC<MealSlotProps> = ({
  date,
  mealType,
  meal,
  isDropTarget,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onClick
}) => {
  if (!meal) {
    return (
      <motion.div
        className={`
          meal-slot-empty group relative h-32 
          bg-white/50 backdrop-blur-sm rounded-xl 
          border-2 border-dashed border-gray-300
          hover:border-gray-400 hover:bg-white/70
          transition-all cursor-pointer
          ${isDropTarget ? 'border-blue-400 bg-blue-50/50' : ''}
        `}
        onClick={onClick}
        onDragOver={onDragOver}
        onDrop={onDrop}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center justify-center h-full">
          <Plus className="w-6 h-6 text-gray-400 group-hover:text-gray-600" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      draggable
      onDragStart={() => onDragStart?.(meal)}
      onDragEnd={onDragEnd}
      className="meal-slot-filled relative h-32 bg-white rounded-xl shadow-sm 
                 hover:shadow-md transition-all cursor-move border border-gray-200"
      whileHover={{ scale: 1.02 }}
      whileDrag={{ scale: 1.05, opacity: 0.8 }}
    >
      <div className="p-4 h-full flex flex-col justify-between">
        <div>
          <h4 className="font-medium text-gray-900 line-clamp-1">
            {meal.recipe?.title || meal.customMeal?.name}
          </h4>
          {meal.recipe && (
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {meal.recipe.prepTime + meal.recipe.cookTime}min
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {meal.servings}
              </span>
            </div>
          )}
        </div>
        
        {meal.isCompleted && (
          <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 
                          rounded-full flex items-center justify-center">
            <Utensils className="w-3 h-3 text-white" />
          </div>
        )}
      </div>
    </motion.div>
  );
};
```

### 4. Service Layer Integration

Create `/src/features/meal-planner/services/mealPlannerService.ts`:

```typescript
import { supabase } from '@/lib/supabase/client';
import { MealPlan, PlannedMeal } from '../types';

export class MealPlannerService {
  // Plan CRUD
  async getPlans(userId: string): Promise<MealPlan[]> {
    const { data, error } = await supabase
      .from('meal_plans')
      .select(`
        *,
        meals:planned_meals(
          *,
          recipe:recipes(*)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async createPlan(plan: Partial<MealPlan>): Promise<MealPlan> {
    const { data, error } = await supabase
      .from('meal_plans')
      .insert(plan)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updatePlan(planId: string, updates: Partial<MealPlan>): Promise<void> {
    const { error } = await supabase
      .from('meal_plans')
      .update(updates)
      .eq('id', planId);

    if (error) throw error;
  }

  // Meal CRUD
  async addMeal(meal: Omit<PlannedMeal, 'id'>): Promise<PlannedMeal> {
    const { data, error } = await supabase
      .from('planned_meals')
      .insert(meal)
      .select(`
        *,
        recipe:recipes(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  async updateMeal(mealId: string, updates: Partial<PlannedMeal>): Promise<void> {
    const { error } = await supabase
      .from('planned_meals')
      .update(updates)
      .eq('id', mealId);

    if (error) throw error;
  }

  async deleteMeal(mealId: string): Promise<void> {
    const { error } = await supabase
      .from('planned_meals')
      .delete()
      .eq('id', mealId);

    if (error) throw error;
  }

  // Batch operations
  async copyWeek(userId: string, sourceWeek: Date, targetWeek: Date): Promise<void> {
    // Implementation for copying a week's meals
  }

  async generateShoppingList(planId: string): Promise<any> {
    // Implementation for generating shopping list
  }
}

export const mealPlannerService = new MealPlannerService();
```

### 5. Database Schema

```sql
-- Meal plans table
CREATE TABLE meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Planned meals table
CREATE TABLE planned_meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES meal_plans(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  meal_type VARCHAR(20) NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  
  -- Custom meal fields
  custom_meal_name VARCHAR(255),
  custom_meal_description TEXT,
  
  -- Details
  servings INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  
  -- Status
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  is_locked BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(plan_id, date, meal_type),
  CHECK (recipe_id IS NOT NULL OR custom_meal_name IS NOT NULL)
);

-- Indexes for performance
CREATE INDEX idx_meal_plans_user_id ON meal_plans(user_id);
CREATE INDEX idx_meal_plans_week_dates ON meal_plans(week_start_date, week_end_date);
CREATE INDEX idx_planned_meals_plan_id ON planned_meals(plan_id);
CREATE INDEX idx_planned_meals_date ON planned_meals(date);
CREATE INDEX idx_planned_meals_recipe_id ON planned_meals(recipe_id);

-- RLS Policies
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE planned_meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meal plans" ON meal_plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own meal plans" ON meal_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal plans" ON meal_plans
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal plans" ON meal_plans
  FOR DELETE USING (auth.uid() = user_id);

-- Similar policies for planned_meals...
```

### 6. Migration Steps

1. **Create Feature Flag**
   ```typescript
   // In environment config
   export const FEATURES = {
     USE_NEW_MEAL_PLANNER: process.env.NEXT_PUBLIC_NEW_MEAL_PLANNER === 'true'
   };
   ```

2. **Update Routes**
   ```typescript
   // In routing configuration
   const mealPlannerRoute = FEATURES.USE_NEW_MEAL_PLANNER 
     ? '/meal-planner' 
     : '/meal-planning';
   ```

3. **Gradual Component Migration**
   - Start with read-only views
   - Add editing capabilities
   - Enable drag-and-drop
   - Add AI features

4. **Data Migration Script**
   ```typescript
   // Script to migrate existing data to new schema
   async function migrateMealPlans() {
     // Fetch old format data
     // Transform to new format
     // Insert into new tables
     // Verify integrity
   }
   ```

## Testing Strategy

1. **Unit Tests**: Components, hooks, utilities
2. **Integration Tests**: Store actions, service layer
3. **E2E Tests**: User workflows
4. **Performance Tests**: Load time, interaction responsiveness
5. **Accessibility Tests**: Keyboard navigation, screen readers

## Monitoring & Analytics

1. **Performance Metrics**
   - Page load time
   - Time to interactive
   - API response times

2. **User Metrics**
   - Feature adoption rate
   - Error rates
   - User engagement

3. **Business Metrics**
   - Plans created per user
   - AI usage rate
   - Shopping list generation

## Rollback Plan

1. Keep feature flag for instant rollback
2. Maintain data sync between old and new systems during migration
3. Monitor error rates and user feedback
4. Have database rollback scripts ready

---

**Next Steps:**
1. Review and approve implementation plan
2. Set up development environment
3. Create feature branch
4. Start with type definitions and store
5. Build core components incrementally