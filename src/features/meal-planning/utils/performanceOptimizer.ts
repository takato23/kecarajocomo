import { logger } from '@/services/logger';
import type { WeekPlan, MealSlot, Recipe } from '../types';

/**
 * Batch processor for multiple operations
 */
export class BatchProcessor {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private batchSize: number;
  private delayMs: number;
  
  constructor(batchSize = 5, delayMs = 100) {
    this.batchSize = batchSize;
    this.delayMs = delayMs;
  }
  
  /**
   * Add operation to queue
   */
  add<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await operation();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      if (!this.processing) {
        this.process();
      }
    });
  }
  
  /**
   * Process queued operations in batches
   */
  private async process() {
    this.processing = true;
    
    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.batchSize);
      
      try {
        await Promise.all(batch.map(op => op()));
      } catch (error) {
        logger.error('Batch processing error', 'BatchProcessor', error);
      }
      
      if (this.queue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, this.delayMs));
      }
    }
    
    this.processing = false;
  }
}

/**
 * Cache manager for meal planning data
 */
export class MealPlanCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private ttl: number;
  
  constructor(ttlMinutes = 60) {
    this.ttl = ttlMinutes * 60 * 1000;
  }
  
  /**
   * Get cached data
   */
  get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data as T;
  }
  
  /**
   * Set cached data
   */
  set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
  
  /**
   * Clear specific cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }
  
  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }
}

/**
 * Recipe index for fast lookups
 */
export class RecipeIndex {
  private byId = new Map<string, Recipe>();
  private byTag = new Map<string, Set<string>>();
  private byCuisine = new Map<string, Set<string>>();
  private byDietary = new Map<string, Set<string>>();
  private byIngredient = new Map<string, Set<string>>();
  
  /**
   * Build index from recipes
   */
  build(recipes: Record<string, Recipe>): void {
    this.clear();
    
    Object.values(recipes).forEach(recipe => {
      this.addRecipe(recipe);
    });
  }
  
  /**
   * Add single recipe to index
   */
  addRecipe(recipe: Recipe): void {
    this.byId.set(recipe.id, recipe);
    
    // Index by tags
    recipe.tags.forEach(tag => {
      if (!this.byTag.has(tag)) {
        this.byTag.set(tag, new Set());
      }
      this.byTag.get(tag)!.add(recipe.id);
    });
    
    // Index by cuisine
    if (recipe.cuisine) {
      if (!this.byCuisine.has(recipe.cuisine)) {
        this.byCuisine.set(recipe.cuisine, new Set());
      }
      this.byCuisine.get(recipe.cuisine)!.add(recipe.id);
    }
    
    // Index by dietary labels
    recipe.dietaryLabels.forEach(label => {
      if (!this.byDietary.has(label)) {
        this.byDietary.set(label, new Set());
      }
      this.byDietary.get(label)!.add(recipe.id);
    });
    
    // Index by main ingredients
    recipe.ingredients.slice(0, 5).forEach(ingredient => {
      const key = ingredient.name.toLowerCase();
      if (!this.byIngredient.has(key)) {
        this.byIngredient.set(key, new Set());
      }
      this.byIngredient.get(key)!.add(recipe.id);
    });
  }
  
  /**
   * Get recipe by ID
   */
  getById(id: string): Recipe | undefined {
    return this.byId.get(id);
  }
  
  /**
   * Find recipes by tag
   */
  findByTag(tag: string): Recipe[] {
    const ids = this.byTag.get(tag);
    if (!ids) return [];
    
    return Array.from(ids)
      .map(id => this.byId.get(id))
      .filter(Boolean) as Recipe[];
  }
  
  /**
   * Find recipes by cuisine
   */
  findByCuisine(cuisine: string): Recipe[] {
    const ids = this.byCuisine.get(cuisine);
    if (!ids) return [];
    
    return Array.from(ids)
      .map(id => this.byId.get(id))
      .filter(Boolean) as Recipe[];
  }
  
  /**
   * Find recipes by dietary label
   */
  findByDietary(label: string): Recipe[] {
    const ids = this.byDietary.get(label);
    if (!ids) return [];
    
    return Array.from(ids)
      .map(id => this.byId.get(id))
      .filter(Boolean) as Recipe[];
  }
  
  /**
   * Find recipes by ingredient
   */
  findByIngredient(ingredient: string): Recipe[] {
    const key = ingredient.toLowerCase();
    const ids = this.byIngredient.get(key);
    if (!ids) return [];
    
    return Array.from(ids)
      .map(id => this.byId.get(id))
      .filter(Boolean) as Recipe[];
  }
  
  /**
   * Clear index
   */
  clear(): void {
    this.byId.clear();
    this.byTag.clear();
    this.byCuisine.clear();
    this.byDietary.clear();
    this.byIngredient.clear();
  }
}

/**
 * Optimized week plan operations
 */
export class WeekPlanOptimizer {
  /**
   * Get changed slots between two week plans
   */
  static getChangedSlots(oldPlan: WeekPlan, newPlan: WeekPlan): MealSlot[] {
    const changes: MealSlot[] = [];
    
    const oldSlotMap = new Map(oldPlan.slots.map(s => [s.id, s]));
    const newSlotMap = new Map(newPlan.slots.map(s => [s.id, s]));
    
    // Check for changes and additions
    newPlan.slots.forEach(newSlot => {
      const oldSlot = oldSlotMap.get(newSlot.id);
      
      if (!oldSlot || !this.slotsEqual(oldSlot, newSlot)) {
        changes.push(newSlot);
      }
    });
    
    return changes;
  }
  
  /**
   * Check if two slots are equal
   */
  private static slotsEqual(slot1: MealSlot, slot2: MealSlot): boolean {
    return (
      slot1.recipeId === slot2.recipeId &&
      slot1.customMealName === slot2.customMealName &&
      slot1.servings === slot2.servings &&
      slot1.isLocked === slot2.isLocked &&
      slot1.isCompleted === slot2.isCompleted &&
      slot1.notes === slot2.notes
    );
  }
  
  /**
   * Merge week plans (for conflict resolution)
   */
  static mergePlans(localPlan: WeekPlan, remotePlan: WeekPlan): WeekPlan {
    // Use remote plan as base (server wins)
    const mergedPlan = { ...remotePlan };
    
    // Preserve local locks if they're newer
    const localSlotMap = new Map(localPlan.slots.map(s => [s.id, s]));
    
    mergedPlan.slots = remotePlan.slots.map(remoteSlot => {
      const localSlot = localSlotMap.get(remoteSlot.id);
      
      if (localSlot && localSlot.isLocked && !remoteSlot.isLocked) {
        // Preserve local lock
        return { ...remoteSlot, isLocked: true };
      }
      
      return remoteSlot;
    });
    
    return mergedPlan;
  }
  
  /**
   * Validate week plan integrity
   */
  static validatePlan(plan: WeekPlan): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check required fields
    if (!plan.id) errors.push('Plan ID is required');
    if (!plan.userId) errors.push('User ID is required');
    if (!plan.startDate) errors.push('Start date is required');
    if (!plan.endDate) errors.push('End date is required');
    
    // Check slots
    if (!plan.slots || plan.slots.length === 0) {
      errors.push('Plan must have slots');
    } else {
      // Check for duplicate slots
      const slotIds = new Set<string>();
      plan.slots.forEach(slot => {
        if (slotIds.has(slot.id)) {
          errors.push(`Duplicate slot ID: ${slot.id}`);
        }
        slotIds.add(slot.id);
        
        // Validate slot
        if (!slot.date) errors.push(`Slot ${slot.id} missing date`);
        if (!slot.mealType) errors.push(`Slot ${slot.id} missing meal type`);
        if (slot.servings < 1) errors.push(`Slot ${slot.id} has invalid servings`);
      });
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

/**
 * Performance monitoring
 */
export class PerformanceMonitor {
  private metrics = new Map<string, number[]>();
  
  /**
   * Start timing an operation
   */
  startTimer(operation: string): () => void {
    const start = performance.now();
    
    return () => {
      const duration = performance.now() - start;
      this.recordMetric(operation, duration);
    };
  }
  
  /**
   * Record a metric
   */
  recordMetric(operation: string, value: number): void {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    
    const values = this.metrics.get(operation)!;
    values.push(value);
    
    // Keep last 100 values
    if (values.length > 100) {
      values.shift();
    }
  }
  
  /**
   * Get average metric value
   */
  getAverage(operation: string): number {
    const values = this.metrics.get(operation);
    if (!values || values.length === 0) return 0;
    
    const sum = values.reduce((a, b) => a + b, 0);
    return sum / values.length;
  }
  
  /**
   * Get all metrics
   */
  getAllMetrics(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const result: Record<string, any> = {};
    
    this.metrics.forEach((values, operation) => {
      if (values.length > 0) {
        result[operation] = {
          avg: this.getAverage(operation),
          min: Math.min(...values),
          max: Math.max(...values),
          count: values.length
        };
      }
    });
    
    return result;
  }
  
  /**
   * Clear metrics
   */
  clear(): void {
    this.metrics.clear();
  }
}