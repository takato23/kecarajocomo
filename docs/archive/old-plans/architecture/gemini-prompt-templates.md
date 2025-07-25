# Gemini Prompt Templates for Meal Planning

## Overview

This document contains optimized prompt templates for the AI meal planning feature. These templates are designed to be token-efficient while ensuring Gemini returns properly formatted JSON responses.

## Core Prompt Templates

### 1. Full Week Generation Prompt

```javascript
const FULL_WEEK_PROMPT = `You are a professional meal planning assistant. Generate a complete weekly meal plan following these specifications exactly.

USER PROFILE:
Diet type: {dietType}
Allergies: {allergies}
Daily calorie target: {caloriesTarget}
Cooking experience: {experienceLevel}
Nutritional goal: {nutritionalGoal}
Budget: {budgetRange}

AVAILABLE INGREDIENTS (prioritize using these):
{pantryItemsList}

PLANNING REQUIREMENTS:
- Days: {startDay} to {endDay}
- Meals per day: Desayuno, Almuerzo, Merienda, Cena
- Weekday meals (Mon-Fri lunch): Simple recipes, max 30 min prep
- Weekend meals: Can be more elaborate
- Variety: No ingredient repeated more than 3 times per week
- Respect ALL dietary restrictions and allergies strictly

LOCKED MEALS (DO NOT CHANGE):
{lockedMealsList}

CRITICAL: Return ONLY a valid JSON object with NO additional text, comments, or markdown. The response must start with { and end with }

EXACT FORMAT:
{
  "plan": [
    {
      "day": "Lunes",
      "slot": "Desayuno",
      "recipe": {
        "id": "unique_id",
        "name": "Recipe name",
        "ingredients": [
          {"name": "ingredient", "quantity": 100, "unit": "g"}
        ],
        "steps": ["Step 1", "Step 2"],
        "time": 15,
        "calories": 350,
        "tags": ["saludable", "rápido"],
        "usesPantry": true,
        "isFavorite": false
      },
      "locked": false,
      "needsManualAction": false
    }
  ]
}`;
```

### 2. Batch Generation Prompt (For Token Optimization)

```javascript
const BATCH_DAYS_PROMPT = `Generate meal plans for {dayCount} days. Previous context:
- User follows {dietType} diet with {caloriesTarget} cal/day
- Excluded: {allergies}
- Already planned meals: {previousMealsSummary}

Generate ONLY meals for: {targetDays}
Ensure variety from previous meals.

PANTRY PRIORITY:
{pantryFocus}

Return ONLY valid JSON starting with { and ending with }:
{
  "plan": [
    // Meals for requested days only
  ]
}`;
```

### 3. Single Slot Regeneration Prompt

```javascript
const SINGLE_SLOT_PROMPT = `Generate ONE meal for:
Day: {day}
Meal: {slotType}
Diet: {dietType}
Calories: {targetCalories} (±50)
Max time: {maxPrepTime} min
Avoid: {recentIngredients}

Use from pantry if possible:
{availableIngredients}

Return ONLY this JSON:
{
  "recipe": {
    "id": "unique_id",
    "name": "name",
    "ingredients": [{"name": "item", "quantity": 0, "unit": "unit"}],
    "steps": ["step"],
    "time": 0,
    "calories": 0,
    "tags": [],
    "usesPantry": true,
    "isFavorite": false
  }
}`;
```

### 4. Fallback Template Prompt

```javascript
const SIMPLE_FALLBACK_PROMPT = `List {mealCount} simple {dietType} recipes for {mealType}.
Each ~{caloriesTarget} calories.
Exclude: {allergies}

Format:
{
  "meals": [
    {
      "name": "Recipe",
      "mainIngredients": ["ing1", "ing2"],
      "time": 20,
      "calories": 300
    }
  ]
}`;
```

## Prompt Engineering Best Practices

### 1. Token Optimization Strategies

```typescript
class PromptOptimizer {
  // Compress pantry items to essential info
  compressPantryList(items: PantryItem[]): string {
    return items
      .filter(item => item.stockLevel !== 'low')
      .map(item => `${item.ingredient.name}:${item.quantity}${item.unit}`)
      .join(', ');
  }
  
  // Summarize locked meals efficiently
  summarizeLockedMeals(locked: MealSlot[]): string {
    return locked
      .map(slot => `${slot.day}-${slot.slotType}:${slot.recipe?.name}`)
      .join('; ');
  }
  
  // Create compact previous meals summary
  createMealHistory(previous: Recipe[]): string {
    const ingredients = new Set<string>();
    previous.forEach(recipe => {
      recipe.ingredients.forEach(ing => ingredients.add(ing.name));
    });
    return Array.from(ingredients).slice(0, 20).join(',');
  }
}
```

### 2. Dynamic Prompt Building

```typescript
class DynamicPromptBuilder {
  buildPrompt(template: string, context: MealPlanContext): string {
    const replacements = {
      dietType: this.formatDietType(context.userProfile.dietaryPreferences.type),
      allergies: this.formatList(context.userProfile.dietaryPreferences.allergies),
      caloriesTarget: context.userProfile.nutritionalGoals.dailyCalories,
      experienceLevel: this.translateExperience(context.userProfile.cookingPreferences.experienceLevel),
      pantryItemsList: this.formatPantryItems(context.pantryItems),
      lockedMealsList: this.formatLockedMeals(context.lockedSlots),
      startDay: this.getDayName(context.dateRange.start),
      endDay: this.getDayName(context.dateRange.end)
    };
    
    return this.replaceTokens(template, replacements);
  }
  
  private formatDietType(type: DietType): string {
    const translations = {
      'vegan': 'vegano (sin productos animales)',
      'vegetarian': 'vegetariano (sin carne)',
      'keto': 'keto (alta grasa, baja carbohidratos)',
      'omnivore': 'omnívoro (todo tipo de alimentos)'
    };
    return translations[type] || type;
  }
}
```

### 3. Response Validation Prompts

```javascript
const VALIDATION_PROMPT = `Validate and fix this JSON meal plan:
{invalidJson}

Rules:
1. Ensure all days have 4 meals
2. Each recipe must have all required fields
3. Calories must be realistic (100-1000 per meal)
4. Fix any JSON syntax errors

Return ONLY the corrected JSON.`;
```

## Contextual Prompt Variations

### 1. Budget-Conscious Prompt Addition

```javascript
const BUDGET_CONTEXT = `
BUDGET CONSTRAINTS:
- Prefer economical ingredients
- Suggest bulk cooking when possible
- Use seasonal produce
- Minimize expensive proteins
- One elaborate meal per week maximum`;
```

### 2. Quick Prep Focus

```javascript
const QUICK_PREP_CONTEXT = `
TIME CONSTRAINTS:
- All weekday meals: max 20 min active prep
- Batch cooking suggestions welcome
- Prefer one-pot meals
- Include make-ahead options
- No complex techniques`;
```

### 3. Family-Friendly Context

```javascript
const FAMILY_CONTEXT = `
FAMILY PREFERENCES:
- Kid-friendly options
- Easily customizable recipes
- Familiar flavors
- Hidden vegetables welcome
- Portion sizes for {familySize} people`;
```

## Error Handling Prompts

### 1. JSON Correction Prompt

```javascript
const FIX_JSON_PROMPT = `The following response has JSON errors:
{brokenResponse}

Fix ONLY the JSON syntax. Return valid JSON that:
1. Starts with { and ends with }
2. Has proper quotes around all strings
3. Uses correct comma placement
4. Follows the exact schema provided

Return ONLY the fixed JSON.`;
```

### 2. Incomplete Response Handler

```javascript
const COMPLETE_PLAN_PROMPT = `Complete this partial meal plan:
{partialPlan}

Missing slots: {missingSlots}
Continue with same dietary restrictions and style.
Return ONLY the missing meals in the same JSON format.`;
```

## Prompt Chaining Strategy

```typescript
class PromptChainManager {
  async generateWithChaining(context: MealPlanContext): Promise<MealPlan> {
    // Step 1: Generate meal ideas
    const ideas = await this.generateMealIdeas(context);
    
    // Step 2: Expand ideas into full recipes
    const recipes = await this.expandToRecipes(ideas, context);
    
    // Step 3: Organize into weekly plan
    const plan = await this.organizeWeeklyPlan(recipes, context);
    
    // Step 4: Validate and adjust
    return await this.validateAndAdjust(plan, context);
  }
  
  private async generateMealIdeas(context: MealPlanContext): Promise<string> {
    const prompt = `List 30 ${context.dietType} meal ideas:
    - Breakfast: 8 ideas
    - Lunch: 8 ideas  
    - Snack: 6 ideas
    - Dinner: 8 ideas
    
    Format: meal_type|name|main_ingredients|prep_time`;
    
    return await this.callGemini(prompt);
  }
}
```

## Localization Templates

### Spanish (Default)

```javascript
const SPANISH_TERMS = {
  days: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
  slots: ['Desayuno', 'Almuerzo', 'Merienda', 'Cena'],
  tags: ['saludable', 'rápido', 'económico', 'alto_proteína', 'bajo_carb'],
  units: ['g', 'kg', 'ml', 'l', 'unidad', 'taza', 'cucharada']
};
```

### English Support

```javascript
const ENGLISH_TERMS = {
  days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  slots: ['Breakfast', 'Lunch', 'Snack', 'Dinner'],
  tags: ['healthy', 'quick', 'budget', 'high_protein', 'low_carb'],
  units: ['g', 'kg', 'ml', 'l', 'unit', 'cup', 'tbsp']
};
```

## Testing Prompts

### 1. Edge Case Test Prompt

```javascript
const EDGE_CASE_TEST = `Generate meal plan for:
- Vegan + nut allergy + gluten-free
- 1200 calories/day
- No cooking experience
- $50/week budget
- Must use: rice, beans, vegetables

Ensure all constraints are met.`;
```

### 2. Variety Test Prompt

```javascript
const VARIETY_TEST = `Generate 7 unique breakfast options.
No repeated main ingredients.
Each 300-400 calories.
All different cooking methods.`;
```

## Usage Examples

```typescript
// Example 1: Full week generation
const fullWeekPrompt = promptBuilder.buildPrompt(
  FULL_WEEK_PROMPT,
  {
    userProfile: currentUser,
    pantryItems: pantryInventory,
    dateRange: { start: monday, end: sunday },
    lockedSlots: []
  }
);

// Example 2: Regenerate weekend meals only
const weekendPrompt = promptBuilder.buildPrompt(
  BATCH_DAYS_PROMPT,
  {
    dayCount: 2,
    targetDays: ['Sábado', 'Domingo'],
    previousMealsSummary: weekdayMeals.getSummary()
  }
);

// Example 3: Quick lunch replacement
const lunchPrompt = promptBuilder.buildPrompt(
  SINGLE_SLOT_PROMPT,
  {
    day: 'Martes',
    slotType: 'Almuerzo',
    maxPrepTime: 20,
    targetCalories: 500
  }
);
```

## Performance Monitoring

```typescript
interface PromptMetrics {
  promptTemplate: string;
  tokenCount: number;
  responseTime: number;
  successRate: number;
  avgQualityScore: number;
}

class PromptPerformanceTracker {
  async trackPromptPerformance(
    template: string,
    response: any,
    startTime: number
  ): Promise<void> {
    const metrics: PromptMetrics = {
      promptTemplate: template.substring(0, 50),
      tokenCount: this.countTokens(template),
      responseTime: Date.now() - startTime,
      successRate: this.calculateSuccess(response),
      avgQualityScore: await this.assessQuality(response)
    };
    
    await this.logMetrics(metrics);
  }
}
```

## Conclusion

These prompt templates provide a comprehensive foundation for generating high-quality meal plans with Gemini. The token-efficient design and clear formatting instructions ensure reliable JSON responses while maintaining flexibility for various user needs and constraints.