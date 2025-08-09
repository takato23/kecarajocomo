# KeCarajoComer Meal Planning Architecture

## Table of Contents
1. [System Overview](#system-overview)
2. [Data Models & TypeScript Interfaces](#data-models--typescript-interfaces)
3. [API Architecture](#api-architecture)
4. [State Management Architecture](#state-management-architecture)
5. [Gemini AI Integration](#gemini-ai-integration)
6. [Component Architecture](#component-architecture)
7. [Performance Optimization](#performance-optimization)
8. [Implementation Guidelines](#implementation-guidelines)

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          KeCarajoComer Architecture                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────┐          │
│  │   Next.js   │    │   Supabase   │    │   Gemini AI    │          │
│  │  Frontend   │◄──►│   Backend    │◄──►│   Integration   │          │
│  └─────┬───────┘    └──────┬───────┘    └─────────────────┘          │
│        │                    │                                           │
│        ▼                    ▼                                           │
│  ┌─────────────┐    ┌──────────────┐                                  │
│  │   Zustand   │    │  PostgreSQL  │                                  │
│  │State Mgmt   │    │   Database   │                                  │
│  └─────────────┘    └──────────────┘                                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Core Architecture Principles

1. **Domain-Driven Design**: Clear separation between business logic and infrastructure
2. **Type Safety**: Full TypeScript coverage with strict typing
3. **Real-time Sync**: Supabase real-time subscriptions for collaborative planning
4. **Offline-First**: Local state management with background sync
5. **Performance**: Lazy loading, caching, and optimistic updates

## Data Models & TypeScript Interfaces

### Extended Core Types

```typescript
// Enhanced Recipe type with full metadata
export interface Recipe {
  id: string;
  name: string;
  description?: string;
  image?: string;
  imageUrls?: string[]; // Multiple images
  videoUrl?: string;
  prepTime: number;
  cookTime: number;
  totalTime: number;
  servings: number;
  difficulty: Difficulty;
  ingredients: Ingredient[];
  instructions: Instruction[];
  nutrition?: NutritionInfo;
  dietaryLabels: DietaryPreference[];
  cuisine?: string;
  category?: RecipeCategory;
  tags: string[];
  rating?: number;
  ratingCount?: number;
  isAiGenerated?: boolean;
  isFavorite?: boolean;
  author?: RecipeAuthor;
  cost?: RecipeCost;
  seasonality?: SeasonalityInfo;
  equipment?: Equipment[];
  substitutions?: Substitution[];
  pairings?: Pairing[];
  createdAt: string;
  updatedAt: string;
}

// Enhanced instruction with media support
export interface Instruction {
  id: string;
  stepNumber: number;
  text: string;
  imageUrl?: string;
  videoUrl?: string;
  duration?: number;
  tips?: string[];
  warnings?: string[];
}

// Recipe cost analysis
export interface RecipeCost {
  total: number;
  perServing: number;
  breakdown: CostBreakdown[];
  currency: string;
  lastUpdated: string;
}

export interface CostBreakdown {
  ingredientId: string;
  name: string;
  amount: number;
  unit: string;
  unitCost: number;
  totalCost: number;
}

// Seasonal availability
export interface SeasonalityInfo {
  bestMonths: number[]; // 1-12
  availability: 'year-round' | 'seasonal' | 'limited';
  alternativeIngredients?: Substitution[];
}

// Equipment requirements
export interface Equipment {
  id: string;
  name: string;
  isRequired: boolean;
  alternatives?: string[];
}

// Smart substitutions
export interface Substitution {
  originalIngredientId: string;
  substitutes: SubstituteOption[];
  reason?: string;
}

export interface SubstituteOption {
  ingredientId: string;
  name: string;
  ratio: number; // e.g., 0.75 means use 3/4 of the amount
  notes?: string;
  impact?: 'minimal' | 'moderate' | 'significant';
}

// Recipe pairings
export interface Pairing {
  type: 'wine' | 'beverage' | 'side-dish' | 'dessert';
  suggestions: string[];
  notes?: string;
}

// Extended meal plan with metadata
export interface MealPlan {
  id: string;
  userId: string;
  name?: string;
  description?: string;
  startDate: string;
  endDate: string;
  weeks: WeekPlan[];
  preferences: MealPlanPreferences;
  stats: MealPlanStats;
  shoppingLists: ShoppingList[];
  isActive: boolean;
  isShared: boolean;
  sharedWith?: string[]; // User IDs
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

// Meal plan preferences
export interface MealPlanPreferences {
  targetCalories?: CalorieTarget;
  macroTargets?: MacroTargets;
  budgetTarget?: BudgetTarget;
  varietyLevel: 'low' | 'medium' | 'high';
  leftoverStrategy: 'minimize' | 'batch-cook' | 'flexible';
  shoppingFrequency: 'daily' | 'twice-weekly' | 'weekly';
  mealPrepDay?: number; // 0-6
}

export interface CalorieTarget {
  daily: number;
  flexibility: number; // +/- percentage
}

export interface MacroTargets {
  protein: { min: number; max: number; };
  carbs: { min: number; max: number; };
  fat: { min: number; max: number; };
}

export interface BudgetTarget {
  weekly: number;
  flexibility: number; // +/- percentage
  currency: string;
}

// Meal plan statistics
export interface MealPlanStats {
  totalMeals: number;
  uniqueRecipes: number;
  avgCaloriesPerDay: number;
  avgCostPerDay: number;
  nutritionBreakdown: NutritionInfo;
  topIngredients: IngredientCount[];
  cuisineDistribution: CuisineCount[];
  difficultyDistribution: DifficultyCount[];
}

// Enhanced shopping list with smart features
export interface SmartShoppingList extends ShoppingList {
  optimizedRoute?: StoreRoute;
  deals?: Deal[];
  alternatives?: AlternativeProduct[];
  estimatedSavings?: number;
  carbonFootprint?: CarbonEstimate;
}

export interface StoreRoute {
  storeId: string;
  storeName: string;
  sections: StoreSection[];
  estimatedTime: number;
}

export interface StoreSection {
  name: string;
  items: ShoppingListItem[];
  order: number;
}

export interface Deal {
  itemId: string;
  originalPrice: number;
  dealPrice: number;
  dealType: 'sale' | 'coupon' | 'bulk' | 'combo';
  validUntil: string;
}

// User profile with detailed preferences
export interface UserProfile {
  id: string;
  userId: string;
  preferences: DetailedUserPreferences;
  healthProfile?: HealthProfile;
  pantryItems?: PantryItem[];
  favoriteRecipes: string[];
  dislikedRecipes: string[];
  mealHistory: MealHistoryEntry[];
  achievements?: Achievement[];
  settings: UserSettings;
}

export interface DetailedUserPreferences extends UserPreferences {
  flavorPreferences: FlavorProfile;
  texturePreferences: TexturePreference[];
  cookingMethods: CookingMethod[];
  kitchenTools: string[];
  timeConstraints: TimeConstraints;
  sustainabilityPreferences?: SustainabilityPreferences;
}

export interface HealthProfile {
  targetCalories?: number;
  medicalDietaryNeeds?: string[];
  fitnessGoals?: 'lose-weight' | 'maintain' | 'gain-muscle' | 'athletic-performance';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very-active';
}

export interface PantryItem {
  ingredientId: string;
  name: string;
  quantity: number;
  unit: string;
  expirationDate?: string;
  location?: 'fridge' | 'freezer' | 'pantry';
  isStaple: boolean;
}
```

### Database Schema (Supabase)

```sql
-- Core tables
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  prep_time INTEGER NOT NULL,
  cook_time INTEGER NOT NULL,
  servings INTEGER NOT NULL,
  difficulty TEXT NOT NULL,
  cuisine TEXT,
  category TEXT,
  is_ai_generated BOOLEAN DEFAULT false,
  author_id UUID REFERENCES users(id),
  rating DECIMAL(2,1),
  rating_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  default_unit TEXT,
  calories_per_100g DECIMAL(6,2),
  protein_per_100g DECIMAL(5,2),
  carbs_per_100g DECIMAL(5,2),
  fat_per_100g DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients(id),
  amount DECIMAL(10,2) NOT NULL,
  unit TEXT NOT NULL,
  notes TEXT,
  is_optional BOOLEAN DEFAULT false,
  sort_order INTEGER
);

CREATE TABLE meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  preferences JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE meal_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_id UUID REFERENCES meal_plans(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  meal_type TEXT NOT NULL,
  recipe_id UUID REFERENCES recipes(id),
  custom_meal_name TEXT,
  servings INTEGER NOT NULL DEFAULT 1,
  is_locked BOOLEAN DEFAULT false,
  is_completed BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  meal_plan_id UUID REFERENCES meal_plans(id) ON DELETE CASCADE,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE shopping_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shopping_list_id UUID REFERENCES shopping_lists(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients(id),
  ingredient_name TEXT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  unit TEXT NOT NULL,
  category TEXT NOT NULL,
  is_purchased BOOLEAN DEFAULT false,
  estimated_price DECIMAL(10,2),
  notes TEXT
);

-- Indexes for performance
CREATE INDEX idx_meal_slots_date ON meal_slots(date);
CREATE INDEX idx_meal_slots_meal_plan ON meal_slots(meal_plan_id);
CREATE INDEX idx_recipes_cuisine ON recipes(cuisine);
CREATE INDEX idx_recipes_category ON recipes(category);
CREATE INDEX idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);

-- Row Level Security
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own meal plans"
  ON meal_plans FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own meal slots"
  ON meal_slots FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM meal_plans
      WHERE meal_plans.id = meal_slots.meal_plan_id
      AND meal_plans.user_id = auth.uid()
    )
  );
```

## API Architecture

### RESTful Endpoints

```typescript
// API Route Structure
/api/
├── meal-plans/
│   ├── GET    /                     # List user's meal plans
│   ├── POST   /                     # Create new meal plan
│   ├── GET    /[id]                 # Get specific meal plan
│   ├── PUT    /[id]                 # Update meal plan
│   ├── DELETE /[id]                 # Delete meal plan
│   ├── POST   /[id]/generate        # Generate with AI
│   ├── POST   /[id]/duplicate       # Duplicate meal plan
│   └── GET    /[id]/stats           # Get meal plan statistics
│
├── meal-slots/
│   ├── GET    /                     # List meal slots (with filters)
│   ├── POST   /                     # Create meal slot
│   ├── PUT    /[id]                 # Update meal slot
│   ├── DELETE /[id]                 # Delete meal slot
│   ├── POST   /[id]/complete        # Mark as completed
│   └── POST   /batch                # Batch operations
│
├── recipes/
│   ├── GET    /                     # List recipes (with filters)
│   ├── POST   /                     # Create recipe
│   ├── GET    /[id]                 # Get recipe details
│   ├── PUT    /[id]                 # Update recipe
│   ├── DELETE /[id]                 # Delete recipe
│   ├── POST   /[id]/favorite        # Toggle favorite
│   ├── POST   /[id]/rate            # Rate recipe
│   └── GET    /[id]/nutrition       # Get nutrition details
│
├── ai/
│   ├── POST   /generate-meal-plan   # Generate complete meal plan
│   ├── POST   /suggest-recipe       # Suggest single recipe
│   ├── POST   /optimize-nutrition   # Optimize for nutrition
│   ├── POST   /optimize-budget      # Optimize for budget
│   └── POST   /parse-recipe         # Parse recipe from text/URL
│
├── shopping-lists/
│   ├── GET    /                     # List shopping lists
│   ├── POST   /                     # Create shopping list
│   ├── GET    /[id]                 # Get shopping list
│   ├── PUT    /[id]                 # Update shopping list
│   ├── POST   /[id]/optimize        # Optimize route/deals
│   └── POST   /[id]/export          # Export (PDF/CSV)
│
└── user/
    ├── GET    /preferences          # Get user preferences
    ├── PUT    /preferences          # Update preferences
    ├── GET    /pantry               # Get pantry items
    ├── PUT    /pantry               # Update pantry
    └── GET    /stats                # Get user statistics
```

### API Implementation Example

```typescript
// /app/api/meal-plans/[id]/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { GeminiMealPlannerService } from '@/services/ai/GeminiMealPlannerService';
import { MealPlanRepository } from '@/repositories/MealPlanRepository';

const generateMealPlanSchema = z.object({
  startDate: z.string(),
  numberOfDays: z.number().min(1).max(30),
  preferences: z.object({
    dietaryPreferences: z.array(z.string()),
    cuisinePreferences: z.array(z.string()).optional(),
    budgetLevel: z.enum(['low', 'medium', 'high']),
    timeConstraints: z.object({
      maxPrepTime: z.number().optional(),
      maxCookTime: z.number().optional(),
    }).optional(),
  }),
  replaceExisting: z.boolean().default(false),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Authentication
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Validate request body
    const body = await request.json();
    const validatedData = generateMealPlanSchema.parse(body);

    // 3. Check meal plan ownership
    const mealPlanRepo = new MealPlanRepository(supabase);
    const mealPlan = await mealPlanRepo.getById(params.id);
    
    if (!mealPlan || mealPlan.userId !== user.id) {
      return NextResponse.json(
        { error: 'Meal plan not found' },
        { status: 404 }
      );
    }

    // 4. Generate with AI
    const aiService = new GeminiMealPlannerService();
    const generatedPlan = await aiService.generateMealPlan({
      userId: user.id,
      mealPlanId: params.id,
      ...validatedData,
    });

    // 5. Save to database
    const updatedPlan = await mealPlanRepo.updateWithAIPlan(
      params.id,
      generatedPlan,
      validatedData.replaceExisting
    );

    // 6. Return response
    return NextResponse.json({
      success: true,
      data: updatedPlan,
      message: 'Meal plan generated successfully',
    });
  } catch (error) {
    console.error('Error generating meal plan:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate meal plan' },
      { status: 500 }
    );
  }
}
```

## State Management Architecture

### Zustand Store with Supabase Integration

```typescript
// /stores/mealPlanningStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { MealPlan, MealSlot, Recipe, ShoppingList } from '@/types';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { RealtimeChannel } from '@supabase/supabase-js';

interface MealPlanningState {
  // Core State
  currentMealPlan: MealPlan | null;
  mealSlots: Record<string, MealSlot>;
  recipes: Record<string, Recipe>;
  shoppingList: ShoppingList | null;
  
  // UI State
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
  selectedDate: Date;
  viewMode: 'week' | 'month';
  
  // Optimistic Update Queue
  pendingUpdates: Set<string>;
  
  // Real-time
  realtimeChannel: RealtimeChannel | null;
}

interface MealPlanningActions {
  // Initialization
  initializeMealPlan: (mealPlanId: string) => Promise<void>;
  subscribeToRealtime: (mealPlanId: string) => void;
  unsubscribeFromRealtime: () => void;
  
  // Meal Slot Management
  addMealSlot: (slot: Partial<MealSlot>) => Promise<void>;
  updateMealSlot: (slotId: string, updates: Partial<MealSlot>) => Promise<void>;
  deleteMealSlot: (slotId: string) => Promise<void>;
  moveMealSlot: (slotId: string, newDate: string, newMealType: string) => Promise<void>;
  
  // Batch Operations
  generateWeekWithAI: (options: GenerateOptions) => Promise<void>;
  clearWeek: (weekStart: Date) => Promise<void>;
  duplicateWeek: (sourceWeek: Date, targetWeek: Date) => Promise<void>;
  
  // Shopping List
  generateShoppingList: () => Promise<void>;
  updateShoppingItem: (itemId: string, updates: Partial<ShoppingListItem>) => Promise<void>;
  
  // UI Actions
  setSelectedDate: (date: Date) => void;
  setViewMode: (mode: 'week' | 'month') => void;
  
  // Utilities
  getSlotsByDate: (date: Date) => MealSlot[];
  getWeekSlots: (weekStart: Date) => MealSlot[];
  getNutritionSummary: (date: Date) => NutritionInfo;
}

export const useMealPlanningStore = create<MealPlanningState & MealPlanningActions>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial State
        currentMealPlan: null,
        mealSlots: {},
        recipes: {},
        shoppingList: null,
        isLoading: false,
        isSyncing: false,
        error: null,
        selectedDate: new Date(),
        viewMode: 'week',
        pendingUpdates: new Set(),
        realtimeChannel: null,

        // Initialize meal plan
        initializeMealPlan: async (mealPlanId: string) => {
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          try {
            const supabase = createClientComponentClient();
            
            // Fetch meal plan with related data
            const { data: mealPlan, error } = await supabase
              .from('meal_plans')
              .select(`
                *,
                meal_slots (
                  *,
                  recipe:recipes (*)
                )
              `)
              .eq('id', mealPlanId)
              .single();

            if (error) throw error;

            // Normalize data
            const slots: Record<string, MealSlot> = {};
            const recipes: Record<string, Recipe> = {};

            mealPlan.meal_slots.forEach((slot: any) => {
              slots[slot.id] = slot;
              if (slot.recipe) {
                recipes[slot.recipe.id] = slot.recipe;
              }
            });

            set((state) => {
              state.currentMealPlan = mealPlan;
              state.mealSlots = slots;
              state.recipes = recipes;
              state.isLoading = false;
            });

            // Subscribe to real-time updates
            get().subscribeToRealtime(mealPlanId);
          } catch (error) {
            set((state) => {
              state.error = error.message;
              state.isLoading = false;
            });
          }
        },

        // Real-time subscription
        subscribeToRealtime: (mealPlanId: string) => {
          const supabase = createClientComponentClient();
          
          const channel = supabase
            .channel(`meal-plan-${mealPlanId}`)
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'meal_slots',
                filter: `meal_plan_id=eq.${mealPlanId}`,
              },
              (payload) => {
                // Handle real-time updates
                if (payload.eventType === 'INSERT') {
                  set((state) => {
                    state.mealSlots[payload.new.id] = payload.new;
                  });
                } else if (payload.eventType === 'UPDATE') {
                  set((state) => {
                    state.mealSlots[payload.new.id] = {
                      ...state.mealSlots[payload.new.id],
                      ...payload.new,
                    };
                  });
                } else if (payload.eventType === 'DELETE') {
                  set((state) => {
                    delete state.mealSlots[payload.old.id];
                  });
                }
              }
            )
            .subscribe();

          set((state) => {
            state.realtimeChannel = channel;
          });
        },

        // Optimistic update pattern
        updateMealSlot: async (slotId: string, updates: Partial<MealSlot>) => {
          // 1. Optimistic update
          set((state) => {
            state.mealSlots[slotId] = {
              ...state.mealSlots[slotId],
              ...updates,
            };
            state.pendingUpdates.add(slotId);
            state.isSyncing = true;
          });

          try {
            // 2. Sync with backend
            const supabase = createClientComponentClient();
            const { error } = await supabase
              .from('meal_slots')
              .update(updates)
              .eq('id', slotId);

            if (error) throw error;

            // 3. Confirm update
            set((state) => {
              state.pendingUpdates.delete(slotId);
              state.isSyncing = state.pendingUpdates.size > 0;
            });
          } catch (error) {
            // 4. Rollback on error
            set((state) => {
              // Fetch fresh data or implement rollback logic
              state.error = error.message;
              state.pendingUpdates.delete(slotId);
              state.isSyncing = state.pendingUpdates.size > 0;
            });
          }
        },

        // AI Generation
        generateWeekWithAI: async (options: GenerateOptions) => {
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          try {
            const response = await fetch(
              `/api/meal-plans/${get().currentMealPlan?.id}/generate`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(options),
              }
            );

            if (!response.ok) throw new Error('Generation failed');

            const result = await response.json();
            
            // Refresh meal plan data
            await get().initializeMealPlan(get().currentMealPlan?.id!);
          } catch (error) {
            set((state) => {
              state.error = error.message;
              state.isLoading = false;
            });
          }
        },

        // Helper functions
        getSlotsByDate: (date: Date) => {
          const dateStr = date.toISOString().split('T')[0];
          return Object.values(get().mealSlots).filter(
            (slot) => slot.date === dateStr
          );
        },

        getNutritionSummary: (date: Date) => {
          const slots = get().getSlotsByDate(date);
          const summary: NutritionInfo = {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            fiber: 0,
            sugar: 0,
            sodium: 0,
          };

          slots.forEach((slot) => {
            if (slot.recipe?.nutrition) {
              const servingMultiplier = slot.servings / slot.recipe.servings;
              summary.calories += slot.recipe.nutrition.calories * servingMultiplier;
              summary.protein += slot.recipe.nutrition.protein * servingMultiplier;
              summary.carbs += slot.recipe.nutrition.carbs * servingMultiplier;
              summary.fat += slot.recipe.nutrition.fat * servingMultiplier;
              summary.fiber += (slot.recipe.nutrition.fiber || 0) * servingMultiplier;
              summary.sugar += (slot.recipe.nutrition.sugar || 0) * servingMultiplier;
              summary.sodium += (slot.recipe.nutrition.sodium || 0) * servingMultiplier;
            }
          });

          return summary;
        },
      })),
      {
        name: 'meal-planning-store',
        // Only persist UI state, not data
        partialize: (state) => ({
          selectedDate: state.selectedDate,
          viewMode: state.viewMode,
        }),
      }
    )
  )
);
```

## Gemini AI Integration

### Structured Prompt Engineering

```typescript
// /services/ai/GeminiMealPlannerService.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { 
  MealPlan, 
  UserPreferences, 
  Recipe,
  NutritionInfo 
} from '@/types';

export class GeminiMealPlannerService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    this.model = this.genAI.getGenerativeModel({ 
      model: 'gemini-pro',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
    });
  }

  async generateMealPlan(config: GenerateMealPlanConfig): Promise<MealPlan> {
    const prompt = this.buildStructuredPrompt(config);
    
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse JSON response
      const mealPlan = this.parseMealPlanResponse(text);
      
      // Validate and enhance
      return this.validateAndEnhanceMealPlan(mealPlan, config);
    } catch (error) {
      console.error('Gemini AI Error:', error);
      throw new Error('Failed to generate meal plan');
    }
  }

  private buildStructuredPrompt(config: GenerateMealPlanConfig): string {
    return `
Generate a detailed meal plan with the following requirements:

USER PREFERENCES:
- Dietary Restrictions: ${config.preferences.dietaryPreferences.join(', ')}
- Cuisine Preferences: ${config.preferences.cuisinePreferences?.join(', ') || 'Any'}
- Budget Level: ${config.preferences.budgetLevel}
- Cooking Skill: ${config.preferences.cookingSkill}
- Max Cooking Time: ${config.preferences.maxCookingTime} minutes
- Excluded Ingredients: ${config.preferences.excludedIngredients?.join(', ') || 'None'}
- Health Goals: ${config.preferences.healthGoals || 'Balanced nutrition'}

MEAL PLAN REQUIREMENTS:
- Start Date: ${config.startDate}
- Number of Days: ${config.numberOfDays}
- Meals per Day: ${config.mealsPerDay.join(', ')}
- Servings per Meal: ${config.preferences.servingsPerMeal}
- Variety Level: ${config.preferences.preferVariety ? 'High' : 'Moderate'}
- Use Seasonal Ingredients: ${config.preferences.useSeasonalIngredients ? 'Yes' : 'No'}

NUTRITIONAL TARGETS (per day):
- Calories: ${config.preferences.targetCalories?.daily || '2000'} ± ${config.preferences.targetCalories?.flexibility || '10'}%
- Protein: ${config.preferences.macroTargets?.protein.min || '50'}g - ${config.preferences.macroTargets?.protein.max || '150'}g
- Carbs: ${config.preferences.macroTargets?.carbs.min || '200'}g - ${config.preferences.macroTargets?.carbs.max || '300'}g
- Fat: ${config.preferences.macroTargets?.fat.min || '50'}g - ${config.preferences.macroTargets?.fat.max || '100'}g

OPTIMIZATION PRIORITIES:
1. Nutritional balance and variety
2. Budget optimization (${config.preferences.budgetLevel} budget)
3. Time efficiency (batch cooking opportunities)
4. Minimal food waste
5. Seasonal ingredient usage

RESPONSE FORMAT:
Return a JSON object with this exact structure:
{
  "mealPlan": {
    "days": [
      {
        "date": "YYYY-MM-DD",
        "meals": {
          "desayuno": {
            "recipe": {
              "name": "Recipe Name",
              "description": "Brief description",
              "prepTime": 15,
              "cookTime": 20,
              "servings": 4,
              "difficulty": "easy|medium|hard",
              "ingredients": [
                {
                  "name": "Ingredient",
                  "amount": 2,
                  "unit": "cups",
                  "category": "produce|meat|dairy|grains|pantry|spices",
                  "notes": "Optional notes"
                }
              ],
              "instructions": [
                "Step 1 instruction",
                "Step 2 instruction"
              ],
              "nutrition": {
                "calories": 350,
                "protein": 25,
                "carbs": 40,
                "fat": 15,
                "fiber": 5,
                "sugar": 8,
                "sodium": 400
              },
              "dietaryLabels": ["vegetarian", "glutenFree"],
              "cuisine": "Mediterranean",
              "tags": ["quick", "healthy", "meal-prep"]
            },
            "servings": ${config.preferences.servingsPerMeal}
          },
          // ... other meals
        }
      }
      // ... other days
    ],
    "shoppingList": {
      "categories": {
        "produce": [
          {
            "name": "Tomatoes",
            "totalAmount": 2,
            "unit": "kg",
            "estimatedCost": 5.00
          }
        ],
        // ... other categories
      },
      "estimatedTotal": 150.00
    },
    "nutritionSummary": {
      "dailyAverage": {
        "calories": 2000,
        "protein": 80,
        "carbs": 250,
        "fat": 70
      }
    },
    "suggestions": [
      "Prep vegetables on Sunday for the week",
      "Cook double batch of quinoa for multiple meals",
      "Freeze extra portions for next week"
    ]
  }
}

IMPORTANT RULES:
1. Ensure nutritional balance across each day
2. Reuse ingredients across meals to minimize waste
3. Include a variety of cuisines and flavors
4. Consider seasonal availability (current month: ${new Date().getMonth() + 1})
5. Provide realistic cooking times
6. Include at least 2-3 vegetables per day
7. Balance cooking complexity throughout the week
8. Suggest batch cooking opportunities

Generate the meal plan now:`;
  }

  private parseMealPlanResponse(text: string): any {
    try {
      // Extract JSON from response (Gemini might add explanatory text)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Failed to parse Gemini response:', error);
      throw new Error('Invalid response format from AI');
    }
  }

  private async validateAndEnhanceMealPlan(
    mealPlan: any,
    config: GenerateMealPlanConfig
  ): Promise<MealPlan> {
    // Validate structure
    if (!mealPlan.mealPlan?.days || !Array.isArray(mealPlan.mealPlan.days)) {
      throw new Error('Invalid meal plan structure');
    }

    // Enhance with additional data
    const enhanced = {
      ...mealPlan.mealPlan,
      id: generateId(),
      userId: config.userId,
      startDate: config.startDate,
      endDate: this.calculateEndDate(config.startDate, config.numberOfDays),
      preferences: config.preferences,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Calculate additional statistics
    enhanced.stats = this.calculateMealPlanStats(enhanced);

    return enhanced;
  }

  // Retry mechanism with exponential backoff
  async generateWithRetry(
    config: GenerateMealPlanConfig,
    maxRetries: number = 3
  ): Promise<MealPlan> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await this.generateMealPlan(config);
      } catch (error) {
        lastError = error as Error;
        console.error(`Attempt ${attempt + 1} failed:`, error);
        
        if (attempt < maxRetries - 1) {
          // Exponential backoff: 1s, 2s, 4s
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }
    
    throw lastError || new Error('Failed to generate meal plan after retries');
  }

  // Generate single recipe suggestion
  async suggestRecipe(context: RecipeSuggestionContext): Promise<Recipe> {
    const prompt = `
Suggest a single recipe based on:
- Meal Type: ${context.mealType}
- Dietary Preferences: ${context.dietaryPreferences.join(', ')}
- Available Ingredients: ${context.availableIngredients?.join(', ') || 'Any'}
- Max Time: ${context.maxTime || 60} minutes
- Serving Size: ${context.servings}

Return a JSON recipe object with the same structure as before.
`;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return this.parseRecipeResponse(text);
  }

  // Optimize meal plan for specific goals
  async optimizeMealPlan(
    mealPlan: MealPlan,
    optimizationGoal: 'nutrition' | 'budget' | 'time' | 'variety'
  ): Promise<MealPlan> {
    const prompt = this.buildOptimizationPrompt(mealPlan, optimizationGoal);
    
    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return this.parseOptimizedMealPlan(text, mealPlan);
  }
}

// Rate limiting decorator
export function rateLimited(requestsPerMinute: number = 10) {
  const queue: Array<() => void> = [];
  let processing = false;
  
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      return new Promise((resolve, reject) => {
        queue.push(async () => {
          try {
            const result = await originalMethod.apply(this, args);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        });
        
        if (!processing) {
          processing = true;
          processQueue();
        }
      });
    };
    
    async function processQueue() {
      while (queue.length > 0) {
        const task = queue.shift();
        if (task) {
          await task();
          await new Promise(resolve => 
            setTimeout(resolve, 60000 / requestsPerMinute)
          );
        }
      }
      processing = false;
    }
    
    return descriptor;
  };
}
```

## Component Architecture

### Modular Component Structure

```typescript
// Component hierarchy
src/components/meal-planning/
├── MealPlannerPage.tsx          // Main container
├── layout/
│   ├── MealPlannerHeader.tsx   // Navigation & actions
│   ├── WeekNavigator.tsx       // Week selection
│   └── ViewModeToggle.tsx      // Week/Month view
│
├── calendar/
│   ├── WeekView.tsx            // Weekly grid
│   ├── MonthView.tsx           // Monthly calendar
│   ├── DayColumn.tsx           // Single day
│   └── MealSlot.tsx            // Individual meal
│
├── modals/
│   ├── RecipeSelectModal.tsx   // Recipe browser
│   ├── AIGenerateModal.tsx     // AI generation
│   ├── RecipeDetailModal.tsx   // Recipe view
│   └── PreferencesModal.tsx    // User preferences
│
├── cards/
│   ├── RecipeCard.tsx          // Recipe display
│   ├── NutritionCard.tsx       // Nutrition info
│   └── ShoppingListCard.tsx    // Shopping preview
│
├── forms/
│   ├── MealPlanForm.tsx        // Plan creation
│   ├── RecipeForm.tsx          // Recipe editor
│   └── PreferencesForm.tsx     // Preferences
│
└── utils/
    ├── DragDropContext.tsx     // Drag & drop
    ├── ErrorBoundary.tsx       // Error handling
    └── LoadingStates.tsx       // Skeletons
```

### Example Component Implementation

```tsx
// /components/meal-planning/calendar/MealSlot.tsx
import React, { useState } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Lock, Unlock, Plus, X } from 'lucide-react';
import { MealSlot as MealSlotType, MealType } from '@/types';
import { useMealPlanningStore } from '@/stores/mealPlanningStore';
import { cn } from '@/lib/utils';
import { MEAL_CONFIG } from '@/config/meals';

interface MealSlotProps {
  slot?: MealSlotType;
  date: string;
  mealType: MealType;
  isToday?: boolean;
  isEditable?: boolean;
}

export const MealSlot: React.FC<MealSlotProps> = ({
  slot,
  date,
  mealType,
  isToday = false,
  isEditable = true,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const { updateMealSlot, deleteMealSlot } = useMealPlanningStore();
  
  const config = MEAL_CONFIG[mealType];
  
  // Drag & Drop setup
  const {
    attributes: dragAttributes,
    listeners: dragListeners,
    setNodeRef: setDragRef,
    isDragging,
  } = useDraggable({
    id: slot?.id || `empty-${date}-${mealType}`,
    data: { slot, date, mealType },
    disabled: !isEditable || slot?.isLocked,
  });

  const {
    setNodeRef: setDropRef,
    isOver,
  } = useDroppable({
    id: `drop-${date}-${mealType}`,
    data: { date, mealType },
    disabled: !isEditable || slot?.isLocked,
  });

  const handleLockToggle = async () => {
    if (!slot) return;
    await updateMealSlot(slot.id, { isLocked: !slot.isLocked });
  };

  const handleDelete = async () => {
    if (!slot || !confirm('Remove this meal?')) return;
    await deleteMealSlot(slot.id);
  };

  const handleAddMeal = () => {
    // Open recipe selection modal
    useMealPlanningStore.setState({
      activeModal: 'recipe-select',
      selectedMealContext: { date, mealType },
    });
  };

  return (
    <motion.div
      ref={(el) => {
        setDragRef(el);
        setDropRef(el);
      }}
      className={cn(
        'relative rounded-xl border-2 transition-all duration-200',
        'min-h-[120px] p-3 cursor-pointer',
        {
          'border-dashed border-gray-300 dark:border-gray-700': !slot,
          'border-solid bg-white dark:bg-gray-800 shadow-sm': slot,
          'ring-2 ring-blue-400 ring-offset-2': isOver,
          'opacity-50': isDragging,
          'border-blue-500 shadow-lg': isToday,
        }
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => !slot && handleAddMeal()}
      {...dragAttributes}
      {...dragListeners}
    >
      {/* Meal Type Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{config.emoji}</span>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {config.label}
          </span>
        </div>
        {slot && (
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleLockToggle();
              }}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {slot.isLocked ? (
                <Lock className="w-4 h-4 text-gray-500" />
              ) : (
                <Unlock className="w-4 h-4 text-gray-400" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {slot ? (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
            {slot.recipe?.name || slot.customMealName}
          </h4>
          
          {slot.recipe && (
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{slot.recipe.prepTime + slot.recipe.cookTime}min</span>
              </div>
              <span>•</span>
              <span>{slot.recipe.difficulty}</span>
              {slot.recipe.nutrition && (
                <>
                  <span>•</span>
                  <span>{Math.round(slot.recipe.nutrition.calories)}cal</span>
                </>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <AnimatePresence>
            {isHovered && isEditable && !slot.isLocked && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-2 right-2 flex gap-1"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete();
                  }}
                  className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full">
          <Plus className="w-6 h-6 text-gray-400" />
        </div>
      )}

      {/* Visual feedback for today */}
      {isToday && (
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl opacity-20 pointer-events-none" />
      )}
    </motion.div>
  );
};

// Week View Component
export const WeekView: React.FC<{ weekStart: Date }> = ({ weekStart }) => {
  const { mealSlots, getWeekSlots } = useMealPlanningStore();
  const weekSlots = getWeekSlots(weekStart);
  
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    return date;
  });

  const mealTypes: MealType[] = ['desayuno', 'almuerzo', 'merienda', 'cena'];

  return (
    <div className="grid grid-cols-8 gap-4 p-4">
      {/* Time labels */}
      <div className="space-y-4 pt-12">
        {mealTypes.map((mealType) => (
          <div
            key={mealType}
            className="h-[120px] flex items-center justify-end pr-4"
          >
            <span className="text-sm text-gray-500">
              {MEAL_CONFIG[mealType].time}
            </span>
          </div>
        ))}
      </div>

      {/* Day columns */}
      {days.map((day) => (
        <div key={day.toISOString()} className="space-y-4">
          <div className="text-center">
            <div className="text-sm text-gray-500">
              {day.toLocaleDateString('es', { weekday: 'short' })}
            </div>
            <div className="text-lg font-semibold">
              {day.getDate()}
            </div>
          </div>
          
          {mealTypes.map((mealType) => {
            const dateStr = day.toISOString().split('T')[0];
            const slot = weekSlots.find(
              (s) => s.date === dateStr && s.mealType === mealType
            );
            
            return (
              <MealSlot
                key={`${dateStr}-${mealType}`}
                slot={slot}
                date={dateStr}
                mealType={mealType}
                isToday={isToday(day)}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
};
```

## Performance Optimization

### 1. Code Splitting & Lazy Loading

```typescript
// Dynamic imports for heavy components
const AIGenerateModal = dynamic(
  () => import('@/components/meal-planning/modals/AIGenerateModal'),
  { 
    loading: () => <ModalSkeleton />,
    ssr: false 
  }
);

const RecipeDetailModal = dynamic(
  () => import('@/components/meal-planning/modals/RecipeDetailModal'),
  { 
    loading: () => <ModalSkeleton />,
    ssr: false 
  }
);

// Route-based code splitting
const MealPlannerPage = dynamic(
  () => import('@/app/meal-planner/page'),
  { 
    loading: () => <PageLoader />,
  }
);
```

### 2. Data Fetching Optimization

```typescript
// Parallel data fetching with React Query
export const useMealPlanData = (mealPlanId: string) => {
  const queries = useQueries({
    queries: [
      {
        queryKey: ['mealPlan', mealPlanId],
        queryFn: () => fetchMealPlan(mealPlanId),
        staleTime: 5 * 60 * 1000, // 5 minutes
      },
      {
        queryKey: ['recipes', 'featured'],
        queryFn: fetchFeaturedRecipes,
        staleTime: 30 * 60 * 1000, // 30 minutes
      },
      {
        queryKey: ['userPreferences'],
        queryFn: fetchUserPreferences,
        staleTime: 60 * 60 * 1000, // 1 hour
      },
    ],
  });

  return {
    mealPlan: queries[0].data,
    recipes: queries[1].data,
    preferences: queries[2].data,
    isLoading: queries.some(q => q.isLoading),
    error: queries.find(q => q.error)?.error,
  };
};

// Infinite scroll for recipe browser
export const useInfiniteRecipes = (filters: RecipeFilters) => {
  return useInfiniteQuery({
    queryKey: ['recipes', 'infinite', filters],
    queryFn: ({ pageParam = 0 }) => 
      fetchRecipes({ ...filters, offset: pageParam, limit: 20 }),
    getNextPageParam: (lastPage, pages) => 
      lastPage.hasMore ? pages.length * 20 : undefined,
  });
};
```

### 3. Image Optimization

```typescript
// Custom image component with optimization
export const OptimizedRecipeImage: React.FC<{
  src: string;
  alt: string;
  priority?: boolean;
}> = ({ src, alt, priority = false }) => {
  return (
    <div className="relative aspect-video overflow-hidden rounded-lg">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        className="object-cover"
        priority={priority}
        placeholder="blur"
        blurDataURL={generateBlurDataURL(src)}
      />
    </div>
  );
};

// Generate blur placeholders
const generateBlurDataURL = (src: string): string => {
  // Use thumbhash or similar for efficient placeholders
  return 'data:image/jpeg;base64,...';
};
```

### 4. Virtualization for Large Lists

```typescript
import { VirtualList } from '@tanstack/react-virtual';

export const VirtualRecipeList: React.FC<{
  recipes: Recipe[];
}> = ({ recipes }) => {
  const parentRef = React.useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: recipes.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200, // Recipe card height
    overscan: 5,
  });

  return (
    <div ref={parentRef} className="h-full overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <RecipeCard recipe={recipes[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
};
```

### 5. Bundle Optimization

```javascript
// next.config.js
module.exports = {
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@heroicons/react', 'lucide-react'],
  },
  
  webpack: (config, { isServer }) => {
    // Tree-shake unused locales
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^\.\/locale$/,
        contextRegExp: /moment$/,
      })
    );

    // Optimize bundle splitting
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          framework: {
            name: 'framework',
            chunks: 'all',
            test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
            priority: 40,
          },
          lib: {
            test: /[\\/]node_modules[\\/]/,
            name(module) {
              const packageName = module.context.match(
                /[\\/]node_modules[\\/](.*?)([\\/]|$)/
              )[1];
              return `npm.${packageName.replace('@', '')}`;
            },
            priority: 10,
          },
        },
      };
    }

    return config;
  },
};
```

## Implementation Guidelines

### 1. Project Structure

```
src/
├── app/                      # Next.js 13+ app directory
│   ├── api/                 # API routes
│   └── meal-planner/        # Meal planner pages
│
├── components/              # React components
│   └── meal-planning/       # Feature-specific components
│
├── services/                # Business logic
│   ├── ai/                 # AI services
│   ├── api/                # API clients
│   └── data/               # Data services
│
├── repositories/            # Data access layer
│   ├── MealPlanRepository.ts
│   ├── RecipeRepository.ts
│   └── ShoppingListRepository.ts
│
├── stores/                  # Zustand stores
│   └── mealPlanningStore.ts
│
├── hooks/                   # Custom hooks
│   ├── useMealPlanning.ts
│   └── useRecipes.ts
│
├── types/                   # TypeScript types
│   └── meal-planning.ts
│
├── utils/                   # Utilities
│   ├── dates.ts
│   ├── nutrition.ts
│   └── validation.ts
│
└── config/                  # Configuration
    ├── meals.ts
    └── nutrition.ts
```

### 2. Development Workflow

1. **Type-First Development**: Define interfaces before implementation
2. **Test-Driven**: Write tests for critical business logic
3. **Component Library**: Use Storybook for component development
4. **API Mocking**: Use MSW for development and testing
5. **Performance Monitoring**: Use Web Vitals and custom metrics

### 3. Testing Strategy

```typescript
// Example test for meal planning service
describe('MealPlanningService', () => {
  it('should generate valid meal plan', async () => {
    const config = {
      startDate: '2024-01-01',
      numberOfDays: 7,
      preferences: mockUserPreferences,
    };
    
    const mealPlan = await service.generateMealPlan(config);
    
    expect(mealPlan).toMatchObject({
      days: expect.arrayContaining([
        expect.objectContaining({
          date: expect.any(String),
          meals: expect.objectContaining({
            desayuno: expect.any(Object),
            almuerzo: expect.any(Object),
            cena: expect.any(Object),
          }),
        }),
      ]),
    });
    
    // Validate nutrition targets
    const dailyNutrition = mealPlan.nutritionSummary.dailyAverage;
    expect(dailyNutrition.calories).toBeGreaterThan(1800);
    expect(dailyNutrition.calories).toBeLessThan(2200);
  });
});
```

### 4. Deployment Considerations

1. **Environment Variables**:
   - `GEMINI_API_KEY`: Gemini AI API key
   - `NEXT_PUBLIC_SUPABASE_URL`: Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon key
   - `SUPABASE_SERVICE_KEY`: Server-side service key

2. **Database Migrations**: Use Supabase migrations for schema changes

3. **Monitoring**: Implement error tracking and performance monitoring

4. **Caching Strategy**:
   - CDN for static assets
   - Redis for API response caching
   - Browser caching for user preferences

5. **Security**:
   - Rate limiting on AI endpoints
   - Input validation on all endpoints
   - RLS policies in Supabase

This architecture provides a scalable, performant foundation for the KeCarajoComer meal planning system with excellent developer experience and user experience.