# AI Integration Patterns - kecarajocomer

## Overview

Comprehensive AI integration design supporting both Claude (Anthropic) and Gemini (Google) for recipe generation, meal planning, and intelligent food management. The system emphasizes flexibility, performance, and cost optimization.

## AI Provider Strategy

### Multi-Provider Architecture

```typescript
// lib/ai/providers/types.ts
export interface AIProvider {
  name: 'claude' | 'gemini';
  generateRecipe(params: RecipeGenerationParams): Promise<Recipe>;
  generateMealPlan(params: MealPlanParams): Promise<MealPlan>;
  analyzeNutrition(params: NutritionParams): Promise<NutritionAnalysis>;
  suggestSubstitutions(params: SubstitutionParams): Promise<Substitution[]>;
}

export interface AIResponse<T> {
  data: T;
  metadata: {
    provider: string;
    model: string;
    tokensUsed: number;
    latencyMs: number;
    cost: number;
  };
}
```

### Provider Selection Logic

```typescript
// lib/ai/provider-selector.ts
export class AIProviderSelector {
  private providers: Map<string, AIProvider>;
  private metrics: ProviderMetrics;

  async selectProvider(task: AITask): Promise<AIProvider> {
    // Consider multiple factors for provider selection
    const factors = {
      taskComplexity: this.assessComplexity(task),
      providerLoad: await this.getProviderLoad(),
      costBudget: task.budget || Infinity,
      latencyRequirement: task.maxLatency || 5000,
      providerSpecialization: this.getSpecialization(task.type),
    };

    // Score each provider
    const scores = await Promise.all(
      Array.from(this.providers.entries()).map(async ([name, provider]) => {
        const score = await this.scoreProvider(provider, factors);
        return { name, provider, score };
      })
    );

    // Select highest scoring provider
    const selected = scores.reduce((best, current) => 
      current.score > best.score ? current : best
    );

    return selected.provider;
  }

  private getSpecialization(taskType: string): Record<string, number> {
    // Claude excels at creative and complex recipes
    // Gemini excels at traditional recipes and large-scale analysis
    const specializations = {
      'creative-recipe': { claude: 0.9, gemini: 0.6 },
      'traditional-recipe': { claude: 0.7, gemini: 0.9 },
      'meal-planning': { claude: 0.8, gemini: 0.8 },
      'nutrition-analysis': { claude: 0.7, gemini: 0.9 },
      'bulk-operations': { claude: 0.6, gemini: 0.9 },
    };

    return specializations[taskType] || { claude: 0.8, gemini: 0.8 };
  }
}
```

## Recipe Generation

### Intelligent Recipe Creation

```typescript
// lib/ai/features/recipe-generation.ts
export class RecipeGenerator {
  constructor(
    private providerSelector: AIProviderSelector,
    private recipeValidator: RecipeValidator,
    private nutritionCalculator: NutritionCalculator
  ) {}

  async generateRecipe(params: RecipeGenerationParams): Promise<AIResponse<Recipe>> {
    // Select optimal provider
    const provider = await this.providerSelector.selectProvider({
      type: params.style === 'creative' ? 'creative-recipe' : 'traditional-recipe',
      complexity: this.assessComplexity(params),
      budget: params.costLimit,
    });

    // Build structured prompt
    const prompt = await this.buildRecipePrompt(params);

    // Generate recipe with streaming support
    const startTime = Date.now();
    const stream = await provider.generateRecipeStream(prompt);
    
    // Process streaming response
    let recipe: Partial<Recipe> = {};
    let tokensUsed = 0;

    for await (const chunk of stream) {
      recipe = this.parseRecipeChunk(chunk, recipe);
      tokensUsed += chunk.tokens;
      
      // Emit progress events
      this.emitProgress({
        stage: this.determineStage(recipe),
        partial: recipe,
      });
    }

    // Validate and enhance recipe
    const validated = await this.recipeValidator.validate(recipe as Recipe);
    const enhanced = await this.enhanceRecipe(validated);

    return {
      data: enhanced,
      metadata: {
        provider: provider.name,
        model: provider.model,
        tokensUsed,
        latencyMs: Date.now() - startTime,
        cost: this.calculateCost(tokensUsed, provider),
      },
    };
  }

  private async buildRecipePrompt(params: RecipeGenerationParams): Promise<string> {
    const context = await this.gatherContext(params);
    
    return `You are a professional chef and nutritionist creating a recipe.

Context:
- Dietary restrictions: ${params.dietaryRestrictions.join(', ') || 'None'}
- Cuisine preference: ${params.cuisineType || 'Any'}
- Available ingredients: ${params.availableIngredients.join(', ')}
- Must avoid: ${params.avoidIngredients.join(', ') || 'None'}
- Cooking time limit: ${params.maxCookingTime} minutes
- Servings: ${params.servings}
- Skill level: ${params.skillLevel}
- Season: ${context.season}
- Time of day: ${context.mealTime}

Requirements:
1. Create a recipe that uses primarily the available ingredients
2. Ensure it can be completed within the time limit
3. Provide clear, step-by-step instructions suitable for the skill level
4. Include exact measurements and temperatures
5. Calculate accurate nutritional information per serving
6. Suggest optional garnishes or variations
7. Include tips for meal prep or storage

Format your response as JSON with this structure:
{
  "name": "Recipe name",
  "description": "Brief appetizing description",
  "ingredients": [
    {
      "name": "Ingredient name",
      "amount": 100,
      "unit": "grams",
      "preparation": "diced" // optional
    }
  ],
  "instructions": [
    {
      "step": 1,
      "text": "Detailed instruction",
      "duration": 5, // minutes
      "temperature": 180, // Celsius, if applicable
      "tips": ["Optional tip"] // optional
    }
  ],
  "nutrition": {
    "calories": 350,
    "protein": 25,
    "carbs": 30,
    "fat": 15,
    "fiber": 5,
    "sugar": 8,
    "sodium": 400
  },
  "tags": ["healthy", "quick", "vegetarian"],
  "prepTime": 15,
  "cookTime": 25,
  "difficulty": "easy",
  "tips": {
    "storage": "Store in airtight container for up to 3 days",
    "mealPrep": "Can be prepped ahead and frozen",
    "variations": ["Add chili for spice", "Substitute tofu for chicken"]
  }
}`;
  }

  private async enhanceRecipe(recipe: Recipe): Promise<Recipe> {
    // Add complementary features
    const enhancements = await Promise.all([
      this.generatePlatingInstructions(recipe),
      this.suggestWinePairings(recipe),
      this.calculateCostEstimate(recipe),
      this.generateShoppingTips(recipe),
      this.createScalingInstructions(recipe),
    ]);

    return {
      ...recipe,
      plating: enhancements[0],
      pairings: enhancements[1],
      estimatedCost: enhancements[2],
      shoppingTips: enhancements[3],
      scalingGuide: enhancements[4],
    };
  }
}
```

### Streaming Response Handler

```typescript
// lib/ai/streaming/recipe-stream.ts
export class RecipeStreamHandler {
  private buffer: string = '';
  private recipe: Partial<Recipe> = {};

  async *processStream(
    stream: ReadableStream<Uint8Array>
  ): AsyncGenerator<RecipeChunk> {
    const reader = stream.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        this.buffer += decoder.decode(value, { stream: true });
        const chunks = this.extractChunks();

        for (const chunk of chunks) {
          const parsed = this.parseChunk(chunk);
          this.updateRecipe(parsed);
          
          yield {
            type: parsed.type,
            content: parsed.content,
            recipe: { ...this.recipe },
            progress: this.calculateProgress(),
          };
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  private extractChunks(): string[] {
    const chunks: string[] = [];
    let start = 0;
    
    // Look for complete JSON objects or meaningful segments
    while (start < this.buffer.length) {
      const end = this.findChunkEnd(start);
      if (end === -1) break;
      
      chunks.push(this.buffer.substring(start, end));
      start = end;
    }
    
    this.buffer = this.buffer.substring(start);
    return chunks;
  }

  private calculateProgress(): number {
    const fields = [
      'name', 'description', 'ingredients', 
      'instructions', 'nutrition', 'tags'
    ];
    
    const completed = fields.filter(field => 
      this.recipe[field] && 
      (Array.isArray(this.recipe[field]) ? this.recipe[field].length > 0 : true)
    ).length;
    
    return (completed / fields.length) * 100;
  }
}
```

## Meal Planning AI

### Weekly Meal Plan Generation

```typescript
// lib/ai/features/meal-planning.ts
export class MealPlanGenerator {
  async generateWeeklyPlan(
    params: MealPlanParams
  ): Promise<AIResponse<MealPlan>> {
    // Analyze user's nutritional needs
    const nutritionProfile = await this.analyzeNutritionNeeds(params.user);
    
    // Get pantry inventory and preferences
    const context = {
      pantryItems: await this.getPantryItems(params.userId),
      recentMeals: await this.getRecentMeals(params.userId, 14), // 2 weeks
      preferences: params.preferences,
      budget: params.weeklyBudget,
      season: this.getCurrentSeason(),
    };

    // Select provider based on complexity
    const provider = await this.providerSelector.selectProvider({
      type: 'meal-planning',
      complexity: 'high',
      dataVolume: context.pantryItems.length + context.recentMeals.length,
    });

    // Generate plan with constraints
    const prompt = this.buildMealPlanPrompt(nutritionProfile, context);
    const plan = await provider.generateMealPlan(prompt);

    // Optimize and validate
    const optimized = await this.optimizeMealPlan(plan, context);
    const validated = await this.validateMealPlan(optimized, nutritionProfile);

    return {
      data: validated,
      metadata: await this.collectMetadata(provider, startTime),
    };
  }

  private buildMealPlanPrompt(
    nutrition: NutritionProfile,
    context: MealPlanContext
  ): string {
    return `Create a balanced weekly meal plan with these requirements:

Nutritional Goals (Daily):
- Calories: ${nutrition.targetCalories} (±10%)
- Protein: ${nutrition.targetProtein}g minimum
- Carbs: ${nutrition.targetCarbs}g (±15%)
- Fat: ${nutrition.targetFat}g (±15%)
- Fiber: ${nutrition.targetFiber}g minimum

Context:
- Household size: ${context.preferences.householdSize}
- Budget: $${context.budget} per week
- Dietary restrictions: ${context.preferences.restrictions.join(', ')}
- Cooking time preference: ${context.preferences.maxCookingTime} minutes
- Meal prep preference: ${context.preferences.mealPrepFriendly ? 'Yes' : 'No'}

Pantry Items Available:
${context.pantryItems.map(item => `- ${item.name}: ${item.quantity} ${item.unit}`).join('\n')}

Recent Meals (avoid repetition):
${context.recentMeals.map(meal => `- ${meal.recipeName} (${meal.daysAgo} days ago)`).join('\n')}

Requirements:
1. Maximize use of pantry items to minimize waste
2. Ensure variety - no recipe more than once per week
3. Balance cooking effort throughout the week
4. Include batch cooking opportunities
5. Suggest prep-ahead tasks for busy days
6. Account for leftovers in meal planning
7. Include shopping list for missing ingredients
8. Optimize for seasonal ingredients (${context.season})

Provide a structured meal plan with recipes, prep tasks, and shopping list.`;
  }

  private async optimizeMealPlan(
    plan: MealPlan,
    context: MealPlanContext
  ): Promise<MealPlan> {
    // Minimize food waste
    const wasteOptimized = await this.minimizeFoodWaste(plan, context);
    
    // Optimize shopping trips
    const shoppingOptimized = this.consolidateShoppingTrips(wasteOptimized);
    
    // Balance meal prep time
    const timeBalanced = this.balancePrepTime(shoppingOptimized);
    
    // Maximize nutritional variety
    const nutritionVaried = await this.maximizeNutritionalVariety(timeBalanced);
    
    return nutritionVaried;
  }

  private async minimizeFoodWaste(
    plan: MealPlan,
    context: MealPlanContext
  ): Promise<MealPlan> {
    // Identify ingredients used across multiple recipes
    const ingredientUsage = new Map<string, Set<string>>();
    
    for (const meal of plan.meals) {
      for (const ingredient of meal.recipe.ingredients) {
        if (!ingredientUsage.has(ingredient.name)) {
          ingredientUsage.set(ingredient.name, new Set());
        }
        ingredientUsage.get(ingredient.name)!.add(meal.id);
      }
    }

    // Find ingredients used only once
    const singleUseIngredients = Array.from(ingredientUsage.entries())
      .filter(([_, meals]) => meals.size === 1)
      .map(([ingredient]) => ingredient);

    // Suggest recipe modifications or additions to use up ingredients
    if (singleUseIngredients.length > 0) {
      const suggestions = await this.suggestRecipesForIngredients(
        singleUseIngredients,
        plan
      );
      
      // Apply suggestions to plan
      return this.applyWasteReductionSuggestions(plan, suggestions);
    }

    return plan;
  }
}
```

## Smart Shopping List

### Intelligent Shopping Optimization

```typescript
// lib/ai/features/shopping-optimization.ts
export class ShoppingOptimizer {
  async optimizeShoppingList(
    mealPlanId: string,
    preferences: ShoppingPreferences
  ): Promise<OptimizedShoppingList> {
    // Gather all required ingredients
    const requiredIngredients = await this.gatherRequiredIngredients(mealPlanId);
    
    // Check pantry inventory
    const pantryItems = await this.getPantryInventory(preferences.userId);
    
    // Calculate what needs to be purchased
    const toBuy = this.calculateShoppingNeeds(requiredIngredients, pantryItems);
    
    // Optimize with AI
    const provider = await this.selectProvider('shopping-optimization');
    
    const optimized = await provider.optimizeShoppingList({
      items: toBuy,
      storeLayout: preferences.storeLayout,
      budget: preferences.budget,
      preferences: {
        bulkBuying: preferences.preferBulk,
        organic: preferences.preferOrganic,
        local: preferences.preferLocal,
        brandPreferences: preferences.brands,
      },
    });

    // Group by store sections
    const grouped = this.groupByStoreSection(optimized.items);
    
    // Add cost estimates and alternatives
    const enhanced = await this.enhanceWithPricing(grouped);
    
    // Generate shopping route
    const route = this.generateOptimalRoute(enhanced, preferences.storeLayout);

    return {
      id: generateId(),
      mealPlanId,
      sections: enhanced,
      route,
      estimatedTotal: this.calculateTotal(enhanced),
      estimatedTime: this.estimateShoppingTime(enhanced),
      savings: optimized.savingSuggestions,
      alternatives: optimized.alternatives,
    };
  }

  private async enhanceWithPricing(
    sections: ShoppingSection[]
  ): Promise<ShoppingSection[]> {
    const enhancedSections = await Promise.all(
      sections.map(async (section) => ({
        ...section,
        items: await Promise.all(
          section.items.map(async (item) => {
            const pricing = await this.getPricing(item);
            const alternatives = await this.findAlternatives(item);
            
            return {
              ...item,
              estimatedPrice: pricing.average,
              priceRange: pricing.range,
              unit: this.optimizeUnit(item, pricing),
              alternatives: alternatives.slice(0, 3),
              savings: this.calculatePotentialSavings(item, alternatives),
            };
          })
        ),
      }))
    );

    return enhancedSections;
  }

  private findAlternatives(
    item: ShoppingItem
  ): Promise<AlternativeItem[]> {
    // Use AI to find suitable alternatives
    return this.provider.findAlternatives({
      item: item.name,
      purpose: item.recipeContext,
      constraints: {
        dietary: item.dietaryFlags,
        budget: item.maxPrice,
        quality: item.qualityPreference,
      },
      criteria: [
        'similar taste profile',
        'same cooking properties',
        'better value',
        'longer shelf life',
      ],
    });
  }
}
```

## Nutrition Intelligence

### Advanced Nutrition Analysis

```typescript
// lib/ai/features/nutrition-intelligence.ts
export class NutritionIntelligence {
  async analyzeAndRecommend(
    userId: string,
    dateRange: DateRange
  ): Promise<NutritionInsights> {
    // Gather meal history
    const meals = await this.getMealHistory(userId, dateRange);
    
    // Calculate comprehensive nutrition data
    const nutritionData = await this.calculateNutrition(meals);
    
    // Get user's goals and health profile
    const profile = await this.getUserHealthProfile(userId);
    
    // AI analysis
    const provider = await this.selectProvider('nutrition-analysis');
    
    const analysis = await provider.analyzeNutrition({
      actualIntake: nutritionData,
      goals: profile.nutritionGoals,
      healthConditions: profile.conditions,
      medications: profile.medications,
      activityLevel: profile.activityLevel,
      preferences: profile.dietaryPreferences,
    });

    // Generate personalized recommendations
    const recommendations = await this.generateRecommendations(
      analysis,
      profile
    );

    // Suggest recipes to address deficiencies
    const recipeSuggestions = await this.suggestCorrectiveRecipes(
      analysis.deficiencies,
      profile.preferences
    );

    return {
      summary: analysis.summary,
      dailyAverages: nutritionData.averages,
      trends: analysis.trends,
      deficiencies: analysis.deficiencies,
      excesses: analysis.excesses,
      recommendations: recommendations,
      recipeSuggestions: recipeSuggestions,
      healthScore: analysis.healthScore,
      improvements: analysis.suggestedImprovements,
    };
  }

  private async generateRecommendations(
    analysis: NutritionAnalysis,
    profile: HealthProfile
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    // Address deficiencies
    for (const deficiency of analysis.deficiencies) {
      const foods = await this.findFoodsRichIn(deficiency.nutrient);
      const recipes = await this.findRecipesRichIn(deficiency.nutrient);
      
      recommendations.push({
        type: 'increase',
        nutrient: deficiency.nutrient,
        currentIntake: deficiency.current,
        targetIntake: deficiency.target,
        foods: foods.slice(0, 5),
        recipes: recipes.slice(0, 3),
        priority: this.calculatePriority(deficiency, profile),
        explanation: this.explainImportance(deficiency.nutrient, profile),
      });
    }

    // Address excesses
    for (const excess of analysis.excesses) {
      const alternatives = await this.findLowerAlternatives(excess.nutrient);
      
      recommendations.push({
        type: 'reduce',
        nutrient: excess.nutrient,
        currentIntake: excess.current,
        targetIntake: excess.target,
        alternatives: alternatives,
        priority: this.calculatePriority(excess, profile),
        explanation: this.explainRisks(excess.nutrient, excess.level, profile),
      });
    }

    // Sort by priority
    return recommendations.sort((a, b) => b.priority - a.priority);
  }
}
```

## Pantry Intelligence

### Smart Inventory Management

```typescript
// lib/ai/features/pantry-intelligence.ts
export class PantryIntelligence {
  async analyzePantry(userId: string): Promise<PantryInsights> {
    const inventory = await this.getPantryInventory(userId);
    const usageHistory = await this.getUsageHistory(userId, 90); // 3 months
    
    // Analyze patterns with AI
    const provider = await this.selectProvider('pantry-analysis');
    
    const analysis = await provider.analyzePantry({
      currentInventory: inventory,
      usagePatterns: usageHistory,
      seasonality: this.getCurrentSeason(),
      householdSize: await this.getHouseholdSize(userId),
    });

    // Generate insights
    const insights = {
      expirationAlerts: this.getExpirationAlerts(inventory),
      usagePatterns: analysis.patterns,
      wastageAnalysis: await this.analyzeWastage(usageHistory),
      stockingSuggestions: analysis.stockingSuggestions,
      seasonalRecommendations: analysis.seasonalItems,
      costOptimization: await this.analyzeCostSavings(analysis),
      recipeSuggestions: await this.suggestRecipesFromPantry(inventory),
    };

    // Predictive restocking
    const restockPredictions = await this.predictRestocking(
      inventory,
      usageHistory,
      analysis.patterns
    );

    return {
      ...insights,
      restockPredictions,
      automationSuggestions: this.generateAutomationSuggestions(analysis),
    };
  }

  private async predictRestocking(
    inventory: PantryItem[],
    history: UsageHistory[],
    patterns: UsagePattern[]
  ): Promise<RestockPrediction[]> {
    const predictions: RestockPrediction[] = [];

    for (const item of inventory) {
      const usage = patterns.find(p => p.ingredientId === item.ingredientId);
      if (!usage) continue;

      const daysRemaining = this.calculateDaysRemaining(
        item.quantity,
        usage.averageDailyUsage
      );

      if (daysRemaining < 14) { // 2 weeks threshold
        const optimalQuantity = await this.calculateOptimalPurchaseQuantity(
          item,
          usage,
          history
        );

        predictions.push({
          ingredient: item.ingredient,
          daysRemaining,
          suggestedPurchaseDate: addDays(new Date(), daysRemaining - 3),
          suggestedQuantity: optimalQuantity,
          estimatedCost: await this.estimateCost(item.ingredient, optimalQuantity),
          confidence: usage.confidence,
        });
      }
    }

    return predictions.sort((a, b) => a.daysRemaining - b.daysRemaining);
  }
}
```

## Cost Management

### Provider Cost Optimization

```typescript
// lib/ai/cost-management.ts
export class AICostManager {
  private budgets: Map<string, Budget> = new Map();
  private usage: Map<string, UsageMetrics> = new Map();

  async executeWithBudget<T>(
    task: AITask,
    budget: Budget
  ): Promise<T> {
    // Check budget availability
    const currentUsage = await this.getCurrentUsage(budget.id);
    if (currentUsage.cost >= budget.limit) {
      throw new BudgetExceededError(budget);
    }

    // Estimate task cost
    const estimate = await this.estimateTaskCost(task);
    
    // Select provider based on cost-performance ratio
    const provider = await this.selectCostOptimalProvider(task, budget);
    
    // Execute with monitoring
    const result = await this.executeWithMonitoring(task, provider, budget);
    
    // Update usage
    await this.updateUsage(budget.id, result.metadata);
    
    return result.data;
  }

  private async selectCostOptimalProvider(
    task: AITask,
    budget: Budget
  ): Promise<AIProvider> {
    const providers = await this.getAvailableProviders();
    
    // Calculate cost-performance score for each provider
    const scores = await Promise.all(
      providers.map(async (provider) => {
        const estimate = await provider.estimateCost(task);
        const performance = await this.getProviderPerformance(provider, task.type);
        
        // Balance cost and performance
        const score = this.calculateCostPerformanceScore(
          estimate,
          performance,
          budget.optimization
        );
        
        return { provider, score, estimate };
      })
    );

    // Select best provider within budget
    const eligible = scores.filter(s => s.estimate.cost <= budget.remaining);
    if (eligible.length === 0) {
      throw new NoBudgetProviderError(task, budget);
    }

    return eligible.reduce((best, current) => 
      current.score > best.score ? current : best
    ).provider;
  }

  private calculateCostPerformanceScore(
    estimate: CostEstimate,
    performance: PerformanceMetrics,
    optimization: 'cost' | 'balanced' | 'performance'
  ): number {
    const weights = {
      cost: { cost: 0.8, performance: 0.2 },
      balanced: { cost: 0.5, performance: 0.5 },
      performance: { cost: 0.2, performance: 0.8 },
    };

    const w = weights[optimization];
    
    // Normalize scores to 0-1 range
    const costScore = 1 - (estimate.cost / estimate.maxCost);
    const perfScore = performance.successRate * performance.qualityScore;
    
    return w.cost * costScore + w.performance * perfScore;
  }
}
```

## Caching Strategy

### Intelligent Response Caching

```typescript
// lib/ai/caching/response-cache.ts
export class AIResponseCache {
  private cache: Map<string, CachedResponse> = new Map();
  private semanticIndex: SemanticIndex;

  async get(
    task: AITask,
    similarity_threshold: number = 0.95
  ): Promise<CachedResponse | null> {
    // Try exact match first
    const exactKey = this.generateCacheKey(task);
    const exact = this.cache.get(exactKey);
    
    if (exact && !this.isExpired(exact)) {
      return exact;
    }

    // Try semantic similarity match
    const similar = await this.findSemanticMatch(task, similarity_threshold);
    if (similar && !this.isExpired(similar)) {
      // Adapt the similar response to current task
      return this.adaptResponse(similar, task);
    }

    return null;
  }

  async set(
    task: AITask,
    response: AIResponse<any>,
    ttl: number = 3600000 // 1 hour default
  ): Promise<void> {
    const key = this.generateCacheKey(task);
    
    const cached: CachedResponse = {
      key,
      task,
      response,
      timestamp: Date.now(),
      expiry: Date.now() + ttl,
      hits: 0,
      semanticEmbedding: await this.generateEmbedding(task),
    };

    this.cache.set(key, cached);
    await this.semanticIndex.add(cached);
    
    // Cleanup old entries
    this.cleanup();
  }

  private async findSemanticMatch(
    task: AITask,
    threshold: number
  ): Promise<CachedResponse | null> {
    const embedding = await this.generateEmbedding(task);
    const matches = await this.semanticIndex.search(embedding, 5);
    
    for (const match of matches) {
      if (match.similarity >= threshold) {
        const cached = this.cache.get(match.key);
        if (cached && this.isCompatible(cached.task, task)) {
          cached.hits++;
          return cached;
        }
      }
    }

    return null;
  }

  private isCompatible(
    cachedTask: AITask,
    newTask: AITask
  ): boolean {
    // Check if tasks are compatible for response reuse
    return (
      cachedTask.type === newTask.type &&
      this.areConstraintsCompatible(cachedTask.constraints, newTask.constraints) &&
      this.arePreferencesCompatible(cachedTask.preferences, newTask.preferences)
    );
  }

  private generateCacheKey(task: AITask): string {
    // Generate deterministic key from task parameters
    const normalized = this.normalizeTask(task);
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(normalized))
      .digest('hex');
  }
}
```

## Error Handling and Fallbacks

### Robust Error Recovery

```typescript
// lib/ai/error-handling.ts
export class AIErrorHandler {
  async executeWithFallback<T>(
    primaryTask: () => Promise<T>,
    fallbacks: FallbackStrategy[]
  ): Promise<T> {
    const errors: Error[] = [];

    // Try primary task
    try {
      return await this.executeWithRetry(primaryTask);
    } catch (error) {
      errors.push(error);
      
      // Try fallback strategies in order
      for (const fallback of fallbacks) {
        try {
          return await this.executeFallback(fallback, error);
        } catch (fallbackError) {
          errors.push(fallbackError);
        }
      }
    }

    // All strategies failed
    throw new AIExecutionError('All strategies failed', errors);
  }

  private async executeFallback<T>(
    strategy: FallbackStrategy,
    originalError: Error
  ): Promise<T> {
    switch (strategy.type) {
      case 'alternative-provider':
        return this.tryAlternativeProvider(strategy.provider, strategy.task);
        
      case 'degraded-mode':
        return this.executeDegradedMode(strategy.degradation);
        
      case 'cached-response':
        return this.useCachedResponse(strategy.cacheKey);
        
      case 'simplified-task':
        return this.executeSimplifiedTask(strategy.simplification);
        
      case 'manual-fallback':
        return strategy.manualHandler(originalError);
        
      default:
        throw new Error(`Unknown fallback strategy: ${strategy.type}`);
    }
  }

  private async tryAlternativeProvider<T>(
    provider: AIProvider,
    task: AITask
  ): Promise<T> {
    // Adapt task for alternative provider if needed
    const adapted = this.adaptTaskForProvider(task, provider);
    
    // Execute with monitoring
    const result = await provider.execute(adapted);
    
    // Log provider switch for analytics
    this.logProviderSwitch(task.originalProvider, provider, 'fallback');
    
    return result;
  }
}
```

## Performance Monitoring

### AI Performance Analytics

```typescript
// lib/ai/monitoring/performance-monitor.ts
export class AIPerformanceMonitor {
  private metrics: MetricsCollector;
  private alerts: AlertManager;

  async trackExecution(
    task: AITask,
    execution: () => Promise<AIResponse<any>>
  ): Promise<AIResponse<any>> {
    const startTime = Date.now();
    const startMemory = process.memoryUsage();

    try {
      const result = await execution();
      
      // Collect metrics
      const metrics = {
        taskType: task.type,
        provider: result.metadata.provider,
        latency: Date.now() - startTime,
        tokensUsed: result.metadata.tokensUsed,
        cost: result.metadata.cost,
        memoryDelta: this.calculateMemoryDelta(startMemory),
        success: true,
        timestamp: new Date(),
      };

      await this.metrics.record(metrics);
      
      // Check for anomalies
      await this.checkAnomalies(metrics);
      
      return result;
    } catch (error) {
      // Record failure metrics
      await this.metrics.record({
        taskType: task.type,
        provider: task.provider,
        latency: Date.now() - startTime,
        success: false,
        error: error.message,
        timestamp: new Date(),
      });

      throw error;
    }
  }

  private async checkAnomalies(metrics: ExecutionMetrics): Promise<void> {
    // Check latency anomaly
    if (metrics.latency > this.getLatencyThreshold(metrics.taskType)) {
      await this.alerts.send({
        type: 'high-latency',
        severity: 'warning',
        data: metrics,
        message: `High latency detected: ${metrics.latency}ms for ${metrics.taskType}`,
      });
    }

    // Check cost anomaly
    if (metrics.cost > this.getCostThreshold(metrics.taskType)) {
      await this.alerts.send({
        type: 'high-cost',
        severity: 'warning',
        data: metrics,
        message: `High cost detected: $${metrics.cost} for ${metrics.taskType}`,
      });
    }

    // Check token usage anomaly
    const avgTokens = await this.metrics.getAverage('tokensUsed', metrics.taskType);
    if (metrics.tokensUsed > avgTokens * 2) {
      await this.alerts.send({
        type: 'excessive-tokens',
        severity: 'info',
        data: metrics,
        message: `Excessive token usage: ${metrics.tokensUsed} tokens (avg: ${avgTokens})`,
      });
    }
  }

  async generateReport(period: DateRange): Promise<PerformanceReport> {
    const metrics = await this.metrics.query(period);
    
    return {
      period,
      summary: {
        totalRequests: metrics.length,
        successRate: this.calculateSuccessRate(metrics),
        avgLatency: this.calculateAverage(metrics, 'latency'),
        totalCost: this.calculateSum(metrics, 'cost'),
        totalTokens: this.calculateSum(metrics, 'tokensUsed'),
      },
      byProvider: this.groupByProvider(metrics),
      byTaskType: this.groupByTaskType(metrics),
      trends: await this.analyzeTrends(metrics),
      recommendations: await this.generateRecommendations(metrics),
    };
  }
}
```

## Testing AI Features

### AI Integration Testing

```typescript
// lib/ai/testing/ai-test-utils.ts
export class AITestUtils {
  static createMockProvider(
    responses: Map<string, any>
  ): AIProvider {
    return {
      name: 'mock' as any,
      generateRecipe: async (params) => {
        const key = JSON.stringify(params);
        return responses.get(key) || this.generateMockRecipe(params);
      },
      generateMealPlan: async (params) => {
        const key = JSON.stringify(params);
        return responses.get(key) || this.generateMockMealPlan(params);
      },
      estimateCost: async (task) => ({
        cost: 0.01,
        tokens: 100,
      }),
    };
  }

  static async testRecipeGeneration() {
    const generator = new RecipeGenerator(
      mockProviderSelector,
      mockValidator,
      mockCalculator
    );

    const params: RecipeGenerationParams = {
      dietaryRestrictions: ['vegetarian'],
      cuisineType: 'Italian',
      availableIngredients: ['pasta', 'tomatoes', 'basil'],
      maxCookingTime: 30,
      servings: 4,
    };

    const result = await generator.generateRecipe(params);
    
    // Assertions
    expect(result.data).toBeDefined();
    expect(result.data.ingredients).toContainEqual(
      expect.objectContaining({ name: 'pasta' })
    );
    expect(result.data.nutrition).toBeDefined();
    expect(result.metadata.latencyMs).toBeLessThan(5000);
  }
}

// Integration test example
describe('AI Recipe Generation', () => {
  it('should generate recipe with streaming', async () => {
    const stream = new RecipeStreamHandler();
    const mockStream = createMockStream(mockRecipeChunks);
    
    const chunks: RecipeChunk[] = [];
    for await (const chunk of stream.processStream(mockStream)) {
      chunks.push(chunk);
    }
    
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[chunks.length - 1].progress).toBe(100);
    expect(chunks[chunks.length - 1].recipe).toMatchObject({
      name: expect.any(String),
      ingredients: expect.any(Array),
      instructions: expect.any(Array),
    });
  });
});
```

## Deployment Configuration

### AI Service Configuration

```yaml
# ai-config.yaml
providers:
  claude:
    enabled: true
    api_key: ${CLAUDE_API_KEY}
    model: claude-3-sonnet-20241022
    max_tokens: 4000
    temperature: 0.7
    rate_limits:
      requests_per_minute: 50
      tokens_per_minute: 100000
    
  gemini:
    enabled: true
    api_key: ${GEMINI_API_KEY}
    model: gemini-pro
    max_tokens: 8192
    temperature: 0.8
    rate_limits:
      requests_per_minute: 60
      tokens_per_minute: 1000000

caching:
  enabled: true
  ttl: 3600
  max_size: 1000
  semantic_matching: true
  similarity_threshold: 0.95

cost_management:
  monthly_budget: 500
  alerts:
    - threshold: 80
      action: notify
    - threshold: 90
      action: throttle
    - threshold: 100
      action: block
  
monitoring:
  enabled: true
  metrics_retention: 30d
  anomaly_detection: true
  performance_alerts: true
```