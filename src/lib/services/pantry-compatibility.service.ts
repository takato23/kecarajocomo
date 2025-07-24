import type { Recipe, RecipeIngredient, PantryCompatibility } from '@/types/recipes';
import type { PantryItem } from '@/types/pantry';

export interface IngredientMatch {
  recipe_ingredient: RecipeIngredient;
  pantry_item?: PantryItem;
  match_type: 'exact' | 'partial' | 'substitute' | 'missing';
  match_confidence: number; // 0-1
  available_quantity: number;
  required_quantity: number;
  missing_quantity: number;
  unit_compatible: boolean;
}

export interface DetailedPantryCompatibility extends PantryCompatibility {
  ingredient_matches: IngredientMatch[];
  substitution_suggestions: {
    missing_ingredient: string;
    suggested_substitutes: {
      pantry_item: PantryItem;
      substitution_ratio: number;
      confidence: number;
    }[];
  }[];
  shopping_list_items: {
    ingredient_name: string;
    quantity: number;
    unit: string;
    category?: string;
    estimated_price?: number;
  }[];
  recipe_difficulty_adjustment?: number; // Factor by which difficulty increases due to missing ingredients
  estimated_cost?: number; // Total estimated cost of missing ingredients
  preparation_impact?: {
    can_prepare_now: boolean;
    estimated_prep_delay: number; // Minutes of additional prep time needed
    missing_essential_tools?: string[];
  };
  nutritional_impact?: {
    calories_missing: number;
    protein_missing: number;
    carbs_missing: number;
    fat_missing: number;
  };
}

class PantryCompatibilityService {
  /**
   * Check if a recipe can be made with current pantry items
   */
  checkRecipeCompatibility(
    recipe: Recipe, 
    pantryItems: PantryItem[]
  ): DetailedPantryCompatibility {
    const ingredientMatches: IngredientMatch[] = [];
    const missingIngredients: RecipeIngredient[] = [];
    const substitutionSuggestions: DetailedPantryCompatibility['substitution_suggestions'] = [];

    // Check each recipe ingredient against pantry
    recipe.ingredients.forEach(recipeIngredient => {
      const match = this.findBestMatch(recipeIngredient, pantryItems);
      ingredientMatches.push(match);
      
      if (match.match_type === 'missing') {
        missingIngredients.push(recipeIngredient);
        
        // Look for possible substitutions
        const substitutes = this.findSubstitutes(recipeIngredient, pantryItems);
        if (substitutes.length > 0) {
          substitutionSuggestions.push({
            missing_ingredient: recipeIngredient.ingredient_name,
            suggested_substitutes: substitutes
          });
        }
      }
    });

    // Calculate compatibility metrics
    const totalIngredients = recipe.ingredients.length;
    const requiredIngredients = recipe.ingredients.filter(ing => !ing.optional);
    const availableRequired = ingredientMatches.filter(match => 
      !match.recipe_ingredient.optional && 
      (match.match_type === 'exact' || match.match_type === 'partial')
    );

    const canMake = requiredIngredients.every(reqIngredient => {
      const match = ingredientMatches.find(m => m.recipe_ingredient === reqIngredient);
      return match && (match.match_type === 'exact' || match.match_type === 'partial');
    });

    const compatibilityScore = totalIngredients > 0 
      ? (availableRequired.length / requiredIngredients.length) 
      : 1;

    // Generate shopping list for missing items
    const shoppingListItems = missingIngredients
      .filter(ing => !ing.optional) // Only required ingredients
      .map(ing => ({
        ingredient_name: ing.ingredient_name,
        quantity: ing.quantity,
        unit: ing.unit,
        category: this.categorizeIngredient(ing.ingredient_name),
        estimated_price: this.estimatePrice(ing.ingredient_name, ing.quantity, ing.unit)
      }));

    // Calculate additional metrics
    const estimatedCost = shoppingListItems.reduce((total, item) => total + (item.estimated_price || 0), 0);
    const difficultyAdjustment = this.calculateDifficultyAdjustment(missingIngredients, recipe);
    const preparationImpact = this.calculatePreparationImpact(missingIngredients, substitutionSuggestions);
    const nutritionalImpact = this.calculateNutritionalImpact(missingIngredients);

    return {
      can_make: canMake,
      missing_ingredients: missingIngredients.length,
      compatibility_score: compatibilityScore,
      ingredient_matches: ingredientMatches,
      substitution_suggestions: substitutionSuggestions,
      shopping_list_items: shoppingListItems,
      recipe_difficulty_adjustment: difficultyAdjustment,
      estimated_cost: estimatedCost,
      preparation_impact: preparationImpact,
      nutritional_impact: nutritionalImpact
    };
  }

  /**
   * Find the best matching pantry item for a recipe ingredient
   */
  private findBestMatch(
    recipeIngredient: RecipeIngredient, 
    pantryItems: PantryItem[]
  ): IngredientMatch {
    const ingredientName = recipeIngredient.ingredient_name.toLowerCase().trim();
    
    // First try exact matches
    const exactMatch = pantryItems.find(item => 
      item.ingredient?.name.toLowerCase() === ingredientName ||
      item.ingredient?.normalized_name?.toLowerCase() === ingredientName
    );

    if (exactMatch) {
      // Convert to standard units for accurate comparison
      const recipeStandard = this.convertToStandardUnit(recipeIngredient.quantity, recipeIngredient.unit);
      const pantryStandard = this.convertToStandardUnit(exactMatch.quantity, exactMatch.unit);
      
      const unitCompatible = recipeStandard.unit === pantryStandard.unit;
      
      if (unitCompatible) {
        const hasEnough = pantryStandard.quantity >= recipeStandard.quantity;
        
        return {
          recipe_ingredient: recipeIngredient,
          pantry_item: exactMatch,
          match_type: hasEnough ? 'exact' : 'partial',
          match_confidence: 1.0,
          available_quantity: pantryStandard.quantity,
          required_quantity: recipeStandard.quantity,
          missing_quantity: Math.max(0, recipeStandard.quantity - pantryStandard.quantity),
          unit_compatible: true
        };
      } else {
        // Units are not compatible, treat as partial match with lower confidence
        return {
          recipe_ingredient: recipeIngredient,
          pantry_item: exactMatch,
          match_type: 'partial',
          match_confidence: 0.7,
          available_quantity: exactMatch.quantity,
          required_quantity: recipeIngredient.quantity,
          missing_quantity: recipeIngredient.quantity, // Can't calculate accurately
          unit_compatible: false
        };
      }
    }

    // Try partial matches using common names
    const partialMatch = pantryItems.find(item => {
      if (!item.ingredient) return false;
      
      const commonNames = item.ingredient.common_names || [];
      return commonNames.some(name => 
        name.toLowerCase().includes(ingredientName) ||
        ingredientName.includes(name.toLowerCase())
      );
    });

    if (partialMatch) {
      // Convert to standard units for partial matches too
      const recipeStandard = this.convertToStandardUnit(recipeIngredient.quantity, recipeIngredient.unit);
      const pantryStandard = this.convertToStandardUnit(partialMatch.quantity, partialMatch.unit);
      
      const unitCompatible = recipeStandard.unit === pantryStandard.unit;
      
      if (unitCompatible) {
        const hasEnough = pantryStandard.quantity >= recipeStandard.quantity;
        
        return {
          recipe_ingredient: recipeIngredient,
          pantry_item: partialMatch,
          match_type: hasEnough ? 'partial' : 'partial',
          match_confidence: 0.7,
          available_quantity: pantryStandard.quantity,
          required_quantity: recipeStandard.quantity,
          missing_quantity: Math.max(0, recipeStandard.quantity - pantryStandard.quantity),
          unit_compatible: true
        };
      } else {
        return {
          recipe_ingredient: recipeIngredient,
          pantry_item: partialMatch,
          match_type: 'partial',
          match_confidence: 0.5, // Lower confidence for unit incompatibility
          available_quantity: partialMatch.quantity,
          required_quantity: recipeIngredient.quantity,
          missing_quantity: recipeIngredient.quantity,
          unit_compatible: false
        };
      }
    }

    // No match found
    return {
      recipe_ingredient: recipeIngredient,
      pantry_item: undefined,
      match_type: 'missing',
      match_confidence: 0,
      available_quantity: 0,
      required_quantity: recipeIngredient.quantity,
      missing_quantity: recipeIngredient.quantity,
      unit_compatible: false
    };
  }

  /**
   * Find possible substitutes for missing ingredients
   */
  private findSubstitutes(
    missingIngredient: RecipeIngredient,
    pantryItems: PantryItem[]
  ): DetailedPantryCompatibility['substitution_suggestions'][0]['suggested_substitutes'] {
    const substitutes: DetailedPantryCompatibility['substitution_suggestions'][0]['suggested_substitutes'] = [];
    
    // Common substitution rules (this would be much more comprehensive in a real app)
    const substitutionRules: Record<string, { substitute: string; ratio: number; confidence: number }[]> = {
      'leche': [
        { substitute: 'leche de almendra', ratio: 1, confidence: 0.9 },
        { substitute: 'leche de coco', ratio: 1, confidence: 0.8 }
      ],
      'mantequilla': [
        { substitute: 'aceite', ratio: 0.75, confidence: 0.8 },
        { substitute: 'margarina', ratio: 1, confidence: 0.9 }
      ],
      'azúcar': [
        { substitute: 'miel', ratio: 0.75, confidence: 0.8 },
        { substitute: 'azúcar morena', ratio: 1, confidence: 0.95 }
      ],
      'cebolla': [
        { substitute: 'chalote', ratio: 1, confidence: 0.9 },
        { substitute: 'cebollín', ratio: 1.5, confidence: 0.7 }
      ]
    };

    const ingredientName = missingIngredient.ingredient_name.toLowerCase();
    const rules = substitutionRules[ingredientName] || [];

    rules.forEach(rule => {
      const substitute = pantryItems.find(item => 
        item.ingredient?.name.toLowerCase().includes(rule.substitute.toLowerCase())
      );

      if (substitute && substitute.quantity > 0) {
        substitutes.push({
          pantry_item: substitute,
          substitution_ratio: rule.ratio,
          confidence: rule.confidence
        });
      }
    });

    return substitutes.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Check if two units are compatible (can be converted)
   */
  private areUnitsCompatible(unit1: string, unit2: string): boolean {
    if (unit1 === unit2) return true;
    
    // Define unit groups
    const weightUnits = ['g', 'kg', 'gr', 'gramos', 'kilogramos', 'lb', 'oz'];
    const volumeUnits = ['ml', 'l', 'mililitros', 'litros', 'cup', 'taza', 'tbsp', 'tsp'];
    const countUnits = ['pcs', 'piezas', 'unidades', 'und', 'pack'];

    const isWeight1 = weightUnits.includes(unit1.toLowerCase());
    const isWeight2 = weightUnits.includes(unit2.toLowerCase());
    
    const isVolume1 = volumeUnits.includes(unit1.toLowerCase());
    const isVolume2 = volumeUnits.includes(unit2.toLowerCase());
    
    const isCount1 = countUnits.includes(unit1.toLowerCase());
    const isCount2 = countUnits.includes(unit2.toLowerCase());

    return (isWeight1 && isWeight2) || (isVolume1 && isVolume2) || (isCount1 && isCount2);
  }

  /**
   * Categorize ingredient for shopping list organization
   */
  private categorizeIngredient(ingredientName: string): string {
    const name = ingredientName.toLowerCase();
    
    if (name.includes('carne') || name.includes('pollo') || name.includes('pescado')) {
      return 'carnes';
    }
    if (name.includes('leche') || name.includes('queso') || name.includes('yogur')) {
      return 'lacteos';
    }
    if (name.includes('tomate') || name.includes('cebolla') || name.includes('ajo')) {
      return 'verduras';
    }
    if (name.includes('manzana') || name.includes('banana') || name.includes('limón')) {
      return 'frutas';
    }
    if (name.includes('arroz') || name.includes('pasta') || name.includes('pan')) {
      return 'granos';
    }
    
    return 'otros';
  }

  /**
   * Estimate price for missing ingredients (mock implementation)
   */
  private estimatePrice(ingredientName: string, quantity: number, unit: string): number {
    // This would connect to a real price database
    const basePrices: Record<string, number> = {
      'carne': 15000, // per kg
      'pollo': 8000,
      'pescado': 12000,
      'leche': 3000, // per liter
      'queso': 20000, // per kg
      'tomate': 2000,
      'cebolla': 1500,
      'arroz': 3000,
      'pasta': 4000
    };

    const name = ingredientName.toLowerCase();
    let basePrice = 5000; // default price

    Object.keys(basePrices).forEach(key => {
      if (name.includes(key)) {
        basePrice = basePrices[key];
      }
    });

    // Simple quantity calculation (this would be more sophisticated)
    const multiplier = this.getQuantityMultiplier(quantity, unit);
    return Math.round(basePrice * multiplier);
  }

  /**
   * Convert quantity to a standard multiplier for pricing
   */
  private getQuantityMultiplier(quantity: number, unit: string): number {
    const unitLower = unit.toLowerCase();
    
    if (unitLower.includes('kg') || unitLower.includes('kilogram')) {
      return quantity;
    }
    if (unitLower.includes('g') || unitLower.includes('gram')) {
      return quantity / 1000;
    }
    if (unitLower.includes('l') || unitLower.includes('liter')) {
      return quantity;
    }
    if (unitLower.includes('ml')) {
      return quantity / 1000;
    }
    
    // For count units, assume a reasonable portion
    return quantity * 0.1;
  }

  /**
   * Get recipes that can be made with current pantry
   */
  getRecipesCanMake(recipes: Recipe[], pantryItems: PantryItem[]): Recipe[] {
    return recipes.filter(recipe => {
      const compatibility = this.checkRecipeCompatibility(recipe, pantryItems);
      return compatibility.can_make;
    });
  }

  /**
   * Get recipes sorted by how many ingredients are available
   */
  getRecipesByCompatibility(recipes: Recipe[], pantryItems: PantryItem[]): Array<Recipe & { compatibility: DetailedPantryCompatibility }> {
    return recipes
      .map(recipe => ({
        ...recipe,
        compatibility: this.checkRecipeCompatibility(recipe, pantryItems)
      }))
      .sort((a, b) => {
        // Sort by compatibility score, then by missing ingredients count
        if (a.compatibility.compatibility_score !== b.compatibility.compatibility_score) {
          return b.compatibility.compatibility_score - a.compatibility.compatibility_score;
        }
        return a.compatibility.missing_ingredients - b.compatibility.missing_ingredients;
      });
  }

  /**
   * Calculate how missing ingredients affect recipe difficulty
   */
  private calculateDifficultyAdjustment(missingIngredients: RecipeIngredient[], recipe: Recipe): number {
    if (missingIngredients.length === 0) return 1.0;
    
    // Essential ingredients add more difficulty than optional ones
    const essentialMissing = missingIngredients.filter(ing => !ing.optional).length;
    const optionalMissing = missingIngredients.filter(ing => ing.optional).length;
    
    // Base difficulty multiplier
    let adjustment = 1.0;
    
    // Add 0.2 for each essential missing ingredient
    adjustment += (essentialMissing * 0.2);
    
    // Add 0.1 for each optional missing ingredient
    adjustment += (optionalMissing * 0.1);
    
    // Cap at 3.0 (300% increase)
    return Math.min(adjustment, 3.0);
  }

  /**
   * Calculate preparation impact of missing ingredients
   */
  private calculatePreparationImpact(
    missingIngredients: RecipeIngredient[], 
    substitutionSuggestions: DetailedPantryCompatibility['substitution_suggestions']
  ): DetailedPantryCompatibility['preparation_impact'] {
    const canPrepareNow = missingIngredients.filter(ing => !ing.optional).length === 0;
    
    // Estimate additional prep time based on missing ingredients
    let estimatedPrepDelay = 0;
    
    // Each missing essential ingredient adds prep time
    missingIngredients.forEach(ingredient => {
      if (!ingredient.optional) {
        // Common prep time additions based on ingredient type
        const ingredientName = ingredient.ingredient_name.toLowerCase();
        
        if (ingredientName.includes('carne') || ingredientName.includes('pollo')) {
          estimatedPrepDelay += 30; // Need to go buy and potentially marinate
        } else if (ingredientName.includes('verdura') || ingredientName.includes('fruta')) {
          estimatedPrepDelay += 15; // Quick shopping trip
        } else {
          estimatedPrepDelay += 10; // Basic ingredient
        }
      }
    });
    
    // Check for essential cooking tools that might be missing
    const missingEssentialTools: string[] = [];
    missingIngredients.forEach(ingredient => {
      const name = ingredient.ingredient_name.toLowerCase();
      if (name.includes('horno') && !missingEssentialTools.includes('horno')) {
        missingEssentialTools.push('horno');
      }
      if (name.includes('licuadora') && !missingEssentialTools.includes('licuadora')) {
        missingEssentialTools.push('licuadora');
      }
    });

    return {
      can_prepare_now: canPrepareNow,
      estimated_prep_delay: estimatedPrepDelay,
      missing_essential_tools: missingEssentialTools.length > 0 ? missingEssentialTools : undefined
    };
  }

  /**
   * Calculate nutritional impact of missing ingredients
   */
  private calculateNutritionalImpact(missingIngredients: RecipeIngredient[]): DetailedPantryCompatibility['nutritional_impact'] {
    let caloriesMissing = 0;
    let proteinMissing = 0;
    let carbsMissing = 0;
    let fatMissing = 0;

    // Basic nutritional estimates per 100g of common ingredients
    const nutritionalData: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
      'carne': { calories: 250, protein: 26, carbs: 0, fat: 15 },
      'pollo': { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
      'pescado': { calories: 206, protein: 22, carbs: 0, fat: 12 },
      'arroz': { calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
      'pasta': { calories: 131, protein: 5, carbs: 25, fat: 1.1 },
      'leche': { calories: 42, protein: 3.4, carbs: 5, fat: 1 },
      'queso': { calories: 113, protein: 7, carbs: 1, fat: 9 },
      'huevo': { calories: 155, protein: 13, carbs: 1.1, fat: 11 },
      'aceite': { calories: 884, protein: 0, carbs: 0, fat: 100 },
      'mantequilla': { calories: 717, protein: 0.9, carbs: 0.1, fat: 81 }
    };

    missingIngredients.forEach(ingredient => {
      if (ingredient.optional) return; // Skip optional ingredients
      
      const name = ingredient.ingredient_name.toLowerCase();
      let nutritionalMatch = null;
      
      // Find matching nutritional data
      Object.keys(nutritionalData).forEach(key => {
        if (name.includes(key)) {
          nutritionalMatch = nutritionalData[key];
        }
      });

      if (nutritionalMatch) {
        // Convert quantity to approximate grams (rough estimation)
        let estimatedGrams = 100; // default
        
        if (ingredient.unit.toLowerCase().includes('g')) {
          estimatedGrams = ingredient.quantity;
        } else if (ingredient.unit.toLowerCase().includes('kg')) {
          estimatedGrams = ingredient.quantity * 1000;
        } else if (ingredient.unit.toLowerCase().includes('ml') || ingredient.unit.toLowerCase().includes('l')) {
          estimatedGrams = ingredient.quantity; // Rough approximation for liquids
        }
        
        const factor = estimatedGrams / 100;
        
        caloriesMissing += nutritionalMatch.calories * factor;
        proteinMissing += nutritionalMatch.protein * factor;
        carbsMissing += nutritionalMatch.carbs * factor;
        fatMissing += nutritionalMatch.fat * factor;
      }
    });

    return {
      calories_missing: Math.round(caloriesMissing),
      protein_missing: Math.round(proteinMissing * 10) / 10,
      carbs_missing: Math.round(carbsMissing * 10) / 10,
      fat_missing: Math.round(fatMissing * 10) / 10
    };
  }

  /**
   * Enhanced ingredient matching with fuzzy search
   */
  findIngredientByFuzzyMatch(searchTerm: string, pantryItems: PantryItem[]): PantryItem[] {
    const normalizedSearch = searchTerm.toLowerCase().trim();
    const matches: Array<{ item: PantryItem; score: number }> = [];

    pantryItems.forEach(item => {
      if (!item.ingredient) return;
      
      let score = 0;
      const ingredientName = item.ingredient.name.toLowerCase();
      const normalizedName = item.ingredient.normalized_name?.toLowerCase() || '';
      const commonNames = item.ingredient.common_names || [];

      // Exact match
      if (ingredientName === normalizedSearch || normalizedName === normalizedSearch) {
        score = 1.0;
      }
      // Starts with
      else if (ingredientName.startsWith(normalizedSearch) || normalizedName.startsWith(normalizedSearch)) {
        score = 0.9;
      }
      // Contains
      else if (ingredientName.includes(normalizedSearch) || normalizedName.includes(normalizedSearch)) {
        score = 0.7;
      }
      // Common names match
      else if (commonNames.some(name => name.toLowerCase().includes(normalizedSearch))) {
        score = 0.6;
      }
      // Partial word match
      else {
        const searchWords = normalizedSearch.split(' ');
        const ingredientWords = ingredientName.split(' ');
        const matchingWords = searchWords.filter(word => 
          ingredientWords.some(iWord => iWord.includes(word) || word.includes(iWord))
        );
        if (matchingWords.length > 0) {
          score = (matchingWords.length / searchWords.length) * 0.5;
        }
      }

      if (score > 0) {
        matches.push({ item, score });
      }
    });

    return matches
      .sort((a, b) => b.score - a.score)
      .map(match => match.item);
  }

  /**
   * Enhanced unit conversion system
   */
  private convertToStandardUnit(quantity: number, unit: string): { quantity: number; unit: string } {
    const unitLower = unit.toLowerCase().trim();
    
    // Weight conversions to grams
    if (unitLower.match(/^(kg|kilogram|kilogramo)s?$/)) {
      return { quantity: quantity * 1000, unit: 'g' };
    }
    if (unitLower.match(/^(g|gram|gramo)s?$/)) {
      return { quantity, unit: 'g' };
    }
    if (unitLower.match(/^(lb|libra)s?$/)) {
      return { quantity: quantity * 453.592, unit: 'g' };
    }
    if (unitLower.match(/^(oz|onza)s?$/)) {
      return { quantity: quantity * 28.3495, unit: 'g' };
    }

    // Volume conversions to ml
    if (unitLower.match(/^(l|liter|litro)s?$/)) {
      return { quantity: quantity * 1000, unit: 'ml' };
    }
    if (unitLower.match(/^(ml|mililitro)s?$/)) {
      return { quantity, unit: 'ml' };
    }
    if (unitLower.match(/^(cup|taza)s?$/)) {
      return { quantity: quantity * 240, unit: 'ml' };
    }
    if (unitLower.match(/^(tbsp|tablespoon|cucharada)s?$/)) {
      return { quantity: quantity * 15, unit: 'ml' };
    }
    if (unitLower.match(/^(tsp|teaspoon|cucharadita)s?$/)) {
      return { quantity: quantity * 5, unit: 'ml' };
    }

    // Count units remain as is
    if (unitLower.match(/^(pcs|pieces|piezas|unidades?|und)$/)) {
      return { quantity, unit: 'pcs' };
    }

    // Default: return as is
    return { quantity, unit: unitLower };
  }

  /**
   * Advanced recipe scoring based on multiple factors
   */
  calculateAdvancedCompatibilityScore(recipe: Recipe, pantryItems: PantryItem[]): number {
    const compatibility = this.checkRecipeCompatibility(recipe, pantryItems);
    
    let score = compatibility.compatibility_score;
    
    // Bonus for recipes that can be made completely
    if (compatibility.can_make) {
      score += 0.2;
    }
    
    // Bonus for recipes with good substitutions available
    if (compatibility.substitution_suggestions.length > 0) {
      const avgSubstitutionConfidence = compatibility.substitution_suggestions
        .reduce((sum, sub) => sum + (sub.suggested_substitutes[0]?.confidence || 0), 0) / 
        compatibility.substitution_suggestions.length;
      score += avgSubstitutionConfidence * 0.1;
    }
    
    // Penalty for high estimated cost
    if (compatibility.estimated_cost && compatibility.estimated_cost > 50000) { // > $50k COP
      score -= 0.1;
    }
    
    // Penalty for very high difficulty adjustment
    if (compatibility.recipe_difficulty_adjustment && compatibility.recipe_difficulty_adjustment > 2.0) {
      score -= 0.15;
    }
    
    return Math.max(0, Math.min(1, score));
  }
}

export const pantryCompatibilityService = new PantryCompatibilityService();