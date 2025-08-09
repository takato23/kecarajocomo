/**
 * Thompson Sampling bandit for meal preference learning
 * Learns from user acceptance/rejection to rank future alternatives
 */

import { Recipe, MealType } from '@/types/meal-planning/argentine';
import { logger } from '@/lib/logger';

interface BanditArm {
  recipeId: string;
  recipeName: string;
  features: RecipeFeatures;
  alpha: number; // Beta distribution parameter (successes + 1)
  beta: number;  // Beta distribution parameter (failures + 1)
  pulls: number;
  successes: number;
  lastPulled?: Date;
}

interface RecipeFeatures {
  // Categorical features
  mealType: MealType;
  cuisine: string;
  mainProtein?: string;
  cookingMethod?: string;
  
  // Numerical features (normalized 0-1)
  preparationTime: number;
  cost: number;
  healthScore: number;
  spiciness: number;
  complexity: number;
  
  // Boolean features
  isVegetarian: boolean;
  isGlutenFree: boolean;
  isDairyFree: boolean;
  isTraditional: boolean;
  isQuick: boolean; // < 30 min
  isBudget: boolean; // < $300 ARS per serving
}

interface UserContext {
  userId: string;
  preferences: {
    dietaryRestrictions: string[];
    dislikedIngredients: string[];
    favoriteIngredients: string[];
    spicePreference: 'mild' | 'medium' | 'hot';
    budgetLevel: 'economico' | 'normal' | 'premium';
  };
  currentSeason: string;
  dayOfWeek: number;
  mealType: MealType;
  recentMeals: string[]; // Last 7 days to avoid repetition
}

export class ThompsonSamplingBandit {
  private arms: Map<string, BanditArm> = new Map();
  private userArms: Map<string, Map<string, BanditArm>> = new Map();
  private globalPrior = { alpha: 1, beta: 1 }; // Uninformative prior
  
  constructor() {
    this.loadState();
  }

  /**
   * Select best recipes using Thompson Sampling
   */
  async selectRecipes(
    candidates: Recipe[],
    context: UserContext,
    count: number = 5
  ): Promise<Recipe[]> {
    const startTime = Date.now();
    
    // Get or create user-specific arms
    const userArms = this.getUserArms(context.userId);
    
    // Initialize arms for new recipes
    for (const recipe of candidates) {
      if (!userArms.has(recipe.id)) {
        const features = this.extractFeatures(recipe, context);
        userArms.set(recipe.id, {
          recipeId: recipe.id,
          recipeName: recipe.name,
          features,
          alpha: this.globalPrior.alpha,
          beta: this.globalPrior.beta,
          pulls: 0,
          successes: 0,
        });
      }
    }
    
    // Sample from posterior for each arm
    const samples: Array<{ recipe: Recipe; sample: number; arm: BanditArm }> = [];
    
    for (const recipe of candidates) {
      const arm = userArms.get(recipe.id)!;
      
      // Thompson sampling: sample from Beta(alpha, beta)
      const sample = this.sampleBeta(arm.alpha, arm.beta);
      
      // Apply contextual adjustments
      const adjustedSample = this.applyContextualBoost(sample, arm.features, context);
      
      samples.push({ recipe, sample: adjustedSample, arm });
    }
    
    // Sort by sample value and select top K
    samples.sort((a, b) => b.sample - a.sample);
    const selected = samples.slice(0, count).map(s => s.recipe);
    
    logger.info('[Bandit] Recipe selection complete', {
      userId: context.userId,
      candidateCount: candidates.length,
      selectedCount: selected.length,
      duration: Date.now() - startTime,
      topSample: samples[0]?.sample,
    });
    
    return selected;
  }

  /**
   * Update bandit with user feedback
   */
  async updateFeedback(
    userId: string,
    recipeId: string,
    accepted: boolean,
    metadata?: {
      rating?: number; // 1-5
      cookingTime?: number;
      wouldRepeat?: boolean;
      tags?: string[];
    }
  ): Promise<void> {
    const userArms = this.getUserArms(userId);
    const arm = userArms.get(recipeId);
    
    if (!arm) {
      logger.warn('[Bandit] Arm not found for feedback', { userId, recipeId });
      return;
    }
    
    // Update arm statistics
    arm.pulls++;
    arm.lastPulled = new Date();
    
    // Convert feedback to success/failure
    let success = accepted;
    
    // Incorporate additional signals if available
    if (metadata?.rating !== undefined) {
      success = metadata.rating >= 4;
    } else if (metadata?.wouldRepeat !== undefined) {
      success = metadata.wouldRepeat;
    }
    
    if (success) {
      arm.successes++;
      arm.alpha++;
    } else {
      arm.beta++;
    }
    
    // Update global prior with decay
    this.updateGlobalPrior(arm, success);
    
    logger.info('[Bandit] Feedback recorded', {
      userId,
      recipeId,
      recipeName: arm.recipeName,
      accepted,
      success,
      newAlpha: arm.alpha,
      newBeta: arm.beta,
      pulls: arm.pulls,
      successRate: arm.successes / arm.pulls,
    });
    
    // Persist state
    this.saveState();
  }

  /**
   * Get recipe recommendations with uncertainty estimates
   */
  async getRecommendations(
    userId: string,
    context: UserContext,
    candidates: Recipe[]
  ): Promise<Array<{
    recipe: Recipe;
    expectedReward: number;
    uncertainty: number;
    explorationValue: number;
  }>> {
    const userArms = this.getUserArms(userId);
    const recommendations = [];
    
    for (const recipe of candidates) {
      let arm = userArms.get(recipe.id);
      
      if (!arm) {
        // Initialize with global prior
        const features = this.extractFeatures(recipe, context);
        arm = {
          recipeId: recipe.id,
          recipeName: recipe.name,
          features,
          alpha: this.globalPrior.alpha,
          beta: this.globalPrior.beta,
          pulls: 0,
          successes: 0,
        };
      }
      
      // Calculate statistics
      const expectedReward = arm.alpha / (arm.alpha + arm.beta);
      const variance = (arm.alpha * arm.beta) / 
        ((arm.alpha + arm.beta) ** 2 * (arm.alpha + arm.beta + 1));
      const uncertainty = Math.sqrt(variance);
      
      // Exploration bonus for rarely tried recipes
      const explorationValue = 1 / Math.sqrt(arm.pulls + 1);
      
      recommendations.push({
        recipe,
        expectedReward,
        uncertainty,
        explorationValue,
      });
    }
    
    // Sort by expected reward + exploration bonus
    recommendations.sort((a, b) => {
      const scoreA = a.expectedReward + 0.1 * a.explorationValue;
      const scoreB = b.expectedReward + 0.1 * b.explorationValue;
      return scoreB - scoreA;
    });
    
    return recommendations;
  }

  /**
   * Extract features from recipe
   */
  private extractFeatures(recipe: Recipe, context: UserContext): RecipeFeatures {
    // Extract main protein
    const proteins = ['carne', 'pollo', 'cerdo', 'pescado', 'tofu', 'huevo'];
    const mainProtein = proteins.find(p => 
      recipe.name.toLowerCase().includes(p) ||
      recipe.ingredients.some(i => i.name.toLowerCase().includes(p))
    );
    
    // Estimate cooking time
    const preparationTime = recipe.time?.prep && recipe.time?.cook
      ? (recipe.time.prep + recipe.time.cook) / 60 // Convert to 0-1 scale (0-60 min)
      : 0.5; // Default to medium
    
    // Estimate cost per serving
    const costPerServing = recipe.estimatedCost 
      ? recipe.estimatedCost / (recipe.servings || 2) / 500 // Normalize by 500 ARS
      : 0.5;
    
    // Health score based on nutrition
    let healthScore = 0.5;
    if (recipe.nutrition) {
      const caloriesPerServing = recipe.nutrition.calories / (recipe.servings || 2);
      healthScore = Math.max(0, Math.min(1, 1 - (caloriesPerServing - 400) / 400));
    }
    
    // Detect features
    const isVegetarian = !mainProtein || mainProtein === 'tofu' || mainProtein === 'huevo';
    const isTraditional = ['milanesa', 'asado', 'empanada', 'locro', 'ñoquis'].some(
      t => recipe.name.toLowerCase().includes(t)
    );
    
    return {
      mealType: context.mealType,
      cuisine: recipe.cuisine || 'argentina',
      mainProtein,
      cookingMethod: recipe.cookingMethod,
      preparationTime: Math.min(1, preparationTime),
      cost: Math.min(1, costPerServing),
      healthScore,
      spiciness: this.estimateSpiciness(recipe),
      complexity: this.estimateComplexity(recipe),
      isVegetarian,
      isGlutenFree: recipe.tags?.includes('sin-gluten') || false,
      isDairyFree: recipe.tags?.includes('sin-lacteos') || false,
      isTraditional,
      isQuick: (recipe.time?.total || 60) < 30,
      isBudget: costPerServing < 0.6, // < 300 ARS
    };
  }

  /**
   * Apply contextual adjustments to Thompson sample
   */
  private applyContextualBoost(
    baseSample: number,
    features: RecipeFeatures,
    context: UserContext
  ): number {
    let boost = 1.0;
    
    // Dietary restriction compliance
    if (context.preferences.dietaryRestrictions.includes('vegetarian') && features.isVegetarian) {
      boost *= 1.5;
    }
    if (context.preferences.dietaryRestrictions.includes('gluten-free') && features.isGlutenFree) {
      boost *= 1.5;
    }
    
    // Budget preference
    if (context.preferences.budgetLevel === 'economico' && features.isBudget) {
      boost *= 1.3;
    }
    
    // Avoid recent meals
    if (context.recentMeals.includes(features.mainProtein || '')) {
      boost *= 0.7;
    }
    
    // Traditional boost on Sundays
    if (context.dayOfWeek === 0 && features.isTraditional) {
      boost *= 1.2;
    }
    
    // Quick meals for weekdays lunch
    if (context.dayOfWeek >= 1 && context.dayOfWeek <= 5 && 
        context.mealType === 'almuerzo' && features.isQuick) {
      boost *= 1.2;
    }
    
    return Math.min(1, baseSample * boost);
  }

  /**
   * Sample from Beta distribution
   */
  private sampleBeta(alpha: number, beta: number): number {
    // Using inverse transform sampling for Beta distribution
    // For production, use a proper Beta distribution sampler
    const x = Math.random();
    
    // Approximation for small alpha/beta
    if (alpha === 1 && beta === 1) {
      return x;
    }
    
    // Use mean for stable estimates when we have enough data
    if (alpha + beta > 30) {
      // Add small noise for exploration
      const mean = alpha / (alpha + beta);
      const noise = (Math.random() - 0.5) * 0.1;
      return Math.max(0, Math.min(1, mean + noise));
    }
    
    // Simplified Beta sampling using Gamma approximation
    const gammaA = this.sampleGamma(alpha);
    const gammaB = this.sampleGamma(beta);
    
    return gammaA / (gammaA + gammaB);
  }

  /**
   * Sample from Gamma distribution (helper for Beta sampling)
   */
  private sampleGamma(shape: number): number {
    // Marsaglia and Tsang method approximation
    if (shape < 1) {
      return this.sampleGamma(shape + 1) * Math.pow(Math.random(), 1 / shape);
    }
    
    const d = shape - 1/3;
    const c = 1 / Math.sqrt(9 * d);
    
    while (true) {
      const x = this.normalRandom();
      const v = Math.pow(1 + c * x, 3);
      
      if (v > 0 && Math.log(Math.random()) < 0.5 * x * x + d - d * v + d * Math.log(v)) {
        return d * v;
      }
    }
  }

  /**
   * Generate normal random variable (Box-Muller transform)
   */
  private normalRandom(): number {
    const u1 = Math.random();
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }

  /**
   * Update global prior based on user feedback
   */
  private updateGlobalPrior(arm: BanditArm, success: boolean): void {
    const decay = 0.99; // Decay factor for global prior
    
    this.globalPrior.alpha = decay * this.globalPrior.alpha;
    this.globalPrior.beta = decay * this.globalPrior.beta;
    
    if (success) {
      this.globalPrior.alpha += 0.01;
    } else {
      this.globalPrior.beta += 0.01;
    }
  }

  /**
   * Get user-specific arms
   */
  private getUserArms(userId: string): Map<string, BanditArm> {
    if (!this.userArms.has(userId)) {
      this.userArms.set(userId, new Map());
    }
    return this.userArms.get(userId)!;
  }

  /**
   * Estimate spiciness level from ingredients
   */
  private estimateSpiciness(recipe: Recipe): number {
    const spicyIngredients = ['ají', 'pimienta', 'pimentón', 'chile', 'picante'];
    const spicyCount = recipe.ingredients.filter(i => 
      spicyIngredients.some(s => i.name.toLowerCase().includes(s))
    ).length;
    
    return Math.min(1, spicyCount * 0.3);
  }

  /**
   * Estimate recipe complexity
   */
  private estimateComplexity(recipe: Recipe): number {
    const steps = recipe.instructions?.split('\n').length || 5;
    const ingredients = recipe.ingredients.length;
    const time = recipe.time?.total || 45;
    
    // Normalize and combine
    const stepsScore = Math.min(1, steps / 10);
    const ingredientsScore = Math.min(1, ingredients / 15);
    const timeScore = Math.min(1, time / 120);
    
    return (stepsScore + ingredientsScore + timeScore) / 3;
  }

  /**
   * Save bandit state to storage
   */
  private async saveState(): Promise<void> {
    // In production, save to database
    // For now, we'll use localStorage in browser or file system on server
    if (typeof window !== 'undefined') {
      const state = {
        globalPrior: this.globalPrior,
        userArms: Array.from(this.userArms.entries()).map(([userId, arms]) => ({
          userId,
          arms: Array.from(arms.entries()),
        })),
      };
      localStorage.setItem('thompson-bandit-state', JSON.stringify(state));
    }
  }

  /**
   * Load bandit state from storage
   */
  private async loadState(): Promise<void> {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('thompson-bandit-state');
      if (saved) {
        try {
          const state = JSON.parse(saved);
          this.globalPrior = state.globalPrior || { alpha: 1, beta: 1 };
          
          for (const userState of state.userArms || []) {
            const arms = new Map(userState.arms);
            this.userArms.set(userState.userId, arms);
          }
        } catch (error) {
          logger.error('[Bandit] Failed to load state', error);
        }
      }
    }
  }

  /**
   * Get statistics for monitoring
   */
  getStats(userId?: string): any {
    if (userId) {
      const arms = this.getUserArms(userId);
      const armStats = Array.from(arms.values()).map(arm => ({
        recipeName: arm.recipeName,
        pulls: arm.pulls,
        successes: arm.successes,
        successRate: arm.pulls > 0 ? arm.successes / arm.pulls : 0,
        expectedReward: arm.alpha / (arm.alpha + arm.beta),
      }));
      
      return {
        userId,
        totalArms: arms.size,
        totalPulls: armStats.reduce((sum, a) => sum + a.pulls, 0),
        topPerformers: armStats
          .sort((a, b) => b.expectedReward - a.expectedReward)
          .slice(0, 10),
      };
    }
    
    return {
      totalUsers: this.userArms.size,
      globalPrior: this.globalPrior,
    };
  }
}

// Singleton instance
export const bandit = new ThompsonSamplingBandit();