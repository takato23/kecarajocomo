# Meal Planning Types Migration Guide

## Overview
This guide helps transition from the old meal planning types to the new unified type system.

## Key Changes

### 1. MealType Enum
**Old:**
```typescript
type MealType = 'desayuno' | 'almuerzo' | 'merienda' | 'cena';
```

**New:**
```typescript
enum MealType {
  BREAKFAST = 'breakfast',
  LUNCH = 'lunch',
  DINNER = 'dinner',
  SNACK = 'snack'
}
```

**Migration:**
```typescript
// Map old values to new
const mealTypeMap = {
  'desayuno': MealType.BREAKFAST,
  'almuerzo': MealType.LUNCH,
  'merienda': MealType.SNACK,
  'cena': MealType.DINNER
};
```

### 2. Recipe Structure
**Old:**
```typescript
interface Recipe {
  prepTime: number;
  cookTime: number;
  dietaryLabels: DietaryPreference[];
  isAiGenerated?: boolean;
  isFavorite?: boolean;
}
```

**New:**
```typescript
interface Recipe {
  prep_time: number;
  cook_time: number;
  dietary_tags: DietaryPreference[];
  is_ai_generated?: boolean;
  is_favorite?: boolean;
  video_url?: string;
  source_url?: string;
}
```

### 3. MealSlot → MealPlanItem
**Old:**
```typescript
interface MealSlot {
  dayOfWeek: number;
  mealType: MealType;
  date: string;
  recipeId?: string;
  customMealName?: string;
  isLocked: boolean;
  isCompleted: boolean;
}
```

**New:**
```typescript
interface MealPlanItem {
  meal_plan_id: string;
  date: string;
  meal_type: MealType;
  recipe_id?: string;
  recipe?: Recipe;
  custom_meal?: CustomMeal;
  is_completed: boolean;
  is_locked: boolean;
  nutrition?: NutritionInfo;
}
```

### 4. WeekPlan → MealPlan
**Old:**
```typescript
interface WeekPlan {
  startDate: string;
  endDate: string;
  slots: MealSlot[];
  isActive: boolean;
}
```

**New:**
```typescript
interface MealPlan {
  name: string;
  start_date: string;
  end_date: string;
  status: PlanStatus;
  items: MealPlanItem[];
  preferences?: MealPlanPreferences;
  nutrition_targets?: NutritionTarget;
  shopping_list?: ShoppingList;
  statistics?: MealPlanStatistics;
}
```

## Migration Functions

```typescript
// Convert old MealSlot to new MealPlanItem
export function migrateMealSlot(
  slot: OldMealSlot,
  mealPlanId: string
): MealPlanItem {
  return {
    id: slot.id,
    meal_plan_id: mealPlanId,
    date: slot.date,
    meal_type: mealTypeMap[slot.mealType],
    recipe_id: slot.recipeId,
    recipe: slot.recipe ? migrateRecipe(slot.recipe) : undefined,
    custom_meal: slot.customMealName ? {
      name: slot.customMealName,
      description: slot.notes
    } : undefined,
    servings: slot.servings,
    notes: slot.notes,
    is_completed: slot.isCompleted,
    is_locked: slot.isLocked,
    created_at: slot.createdAt,
    updated_at: slot.updatedAt
  };
}

// Convert old WeekPlan to new MealPlan
export function migrateWeekPlan(weekPlan: OldWeekPlan): MealPlan {
  return {
    id: weekPlan.id,
    user_id: weekPlan.userId,
    name: `Week of ${weekPlan.startDate}`,
    start_date: weekPlan.startDate,
    end_date: weekPlan.endDate,
    status: weekPlan.isActive ? PlanStatus.ACTIVE : PlanStatus.DRAFT,
    items: weekPlan.slots.map(slot => migrateMealSlot(slot, weekPlan.id)),
    created_at: weekPlan.createdAt,
    updated_at: weekPlan.updatedAt
  };
}

// Convert old Recipe format
export function migrateRecipe(recipe: OldRecipe): Recipe {
  return {
    ...recipe,
    prep_time: recipe.prepTime,
    cook_time: recipe.cookTime,
    dietary_tags: recipe.dietaryLabels,
    is_ai_generated: recipe.isAiGenerated,
    is_favorite: recipe.isFavorite,
    image_url: recipe.image,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}
```

## Component Updates

### Before:
```typescript
<MealSlot
  slot={slot}
  dayOfWeek={0}
  mealType="desayuno"
  onSlotClick={handleClick}
/>
```

### After:
```typescript
<MealSlotComponent
  item={item}
  date="2024-01-01"
  mealType={MealType.BREAKFAST}
  onSelect={handleSelect}
  onUpdate={handleUpdate}
/>
```

## Store Migration

### Old Store Actions:
```typescript
addMealToSlot(slot: Partial<MealSlot>, recipe: Recipe)
updateMealSlot(slotId: string, updates: Partial<MealSlot>)
removeMealFromSlot(slotId: string)
```

### New Store Actions:
```typescript
updatePlanItem(itemId: string, updates: Partial<MealPlanItem>)
deletePlanItem(itemId: string)
regenerateMeal(itemId: string)
```

## API Response Updates

### Old Format:
```typescript
{
  data: WeekPlan,
  error?: string
}
```

### New Format:
```typescript
{
  data?: MealPlan,
  error?: {
    code: string,
    message: string,
    details?: any
  },
  metadata?: {
    timestamp: string,
    version: string
  }
}
```

## Database Column Mapping

| Old Column | New Column | Notes |
|------------|------------|-------|
| isActive | status | Use PlanStatus enum |
| isCompleted | is_completed | Snake case |
| isLocked | is_locked | Snake case |
| recipeId | recipe_id | Snake case |
| mealType | meal_type | Use MealType enum |
| customMealName | custom_meal | Now an object |

## Best Practices

1. **Use Type Guards**: Always use the provided type guards when working with unknown data
2. **Snake Case**: Database fields use snake_case, convert at API boundaries
3. **Enums**: Use enums instead of string literals for better type safety
4. **Nutrition Data**: Always include nutrition info when available
5. **Timestamps**: Include created_at and updated_at for all entities