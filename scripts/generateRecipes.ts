/**
 * Recipe Generation Script using Gemini AI
 * Generates 1000 diverse recipes and seeds the database
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs/promises';
import path from 'path';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

// Recipe categories and cuisines for diverse generation
const RECIPE_CATEGORIES = [
  'breakfast', 'lunch', 'dinner', 'snack', 'dessert', 'appetizer', 'soup', 'salad', 'beverage'
];

const CUISINE_TYPES = [
  'american', 'italian', 'mexican', 'chinese', 'japanese', 'indian', 'thai', 'french', 
  'mediterranean', 'korean', 'vietnamese', 'spanish', 'german', 'greek', 'moroccan', 
  'brazilian', 'peruvian', 'lebanese', 'turkish', 'ethiopian'
];

const DIETARY_TAGS = [
  'vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'keto', 'paleo', 'low-carb', 
  'high-protein', 'pescatarian', 'nut-free', 'soy-free', 'sugar-free'
];

const DIFFICULTY_LEVELS = ['easy', 'medium', 'hard'];

const COOKING_METHODS = [
  'baking', 'grilling', 'roasting', 'sautéing', 'steaming', 'boiling', 'frying', 
  'slow-cooking', 'pressure-cooking', 'no-cook', 'one-pot', 'sheet-pan'
];

interface GeneratedRecipe {
  id: string;
  title: string;
  description: string;
  cuisine_type: string;
  meal_types: string[];
  dietary_tags: string[];
  difficulty: string;
  prep_time: number;
  cook_time: number;
  servings: number;
  ingredients: Array<{
    name: string;
    quantity: number;
    unit: string;
    notes?: string;
    optional: boolean;
  }>;
  instructions: Array<{
    step_number: number;
    text: string;
    time_minutes?: number;
    temperature?: { value: number; unit: string };
    tips?: string[];
  }>;
  nutritional_info: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
  };
  tags: string[];
  image_url?: string;
  source: string;
  created_at: string;
}

class RecipeGenerator {
  private model: any;
  private recipes: GeneratedRecipe[] = [];
  private generationCount = 0;

  constructor() {
    this.model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  /**
   * Generate a batch of diverse recipes
   */
  async generateRecipeBatch(batchSize: number = 10): Promise<GeneratedRecipe[]> {
    const batch: GeneratedRecipe[] = [];
    const batchPromises: Promise<GeneratedRecipe | null>[] = [];

    for (let i = 0; i < batchSize; i++) {
      const recipeParams = this.generateRandomRecipeParams();
      batchPromises.push(this.generateSingleRecipe(recipeParams));
    }

    const results = await Promise.allSettled(batchPromises);
    
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        batch.push(result.value);
      }
    }

    return batch;
  }

  /**
   * Generate random recipe parameters for diversity
   */
  private generateRandomRecipeParams() {
    return {
      category: RECIPE_CATEGORIES[Math.floor(Math.random() * RECIPE_CATEGORIES.length)],
      cuisine: CUISINE_TYPES[Math.floor(Math.random() * CUISINE_TYPES.length)],
      dietary: DIETARY_TAGS.slice(0, Math.floor(Math.random() * 3) + 1),
      difficulty: DIFFICULTY_LEVELS[Math.floor(Math.random() * DIFFICULTY_LEVELS.length)],
      method: COOKING_METHODS[Math.floor(Math.random() * COOKING_METHODS.length)],
      servings: Math.floor(Math.random() * 6) + 2, // 2-8 servings
      maxTime: Math.floor(Math.random() * 90) + 15 // 15-105 minutes
    };
  }

  /**
   * Generate a single recipe using Gemini AI
   */
  private async generateSingleRecipe(params: any): Promise<GeneratedRecipe | null> {
    const prompt = this.buildRecipePrompt(params);
    
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const content = response.text();
      
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No JSON found in Gemini response');
        return null;
      }
      
      const parsedRecipe = JSON.parse(jsonMatch[0]);
      
      // Enhance with additional metadata
      const recipe: GeneratedRecipe = {
        id: `gemini-${this.generationCount++}-${Date.now()}`,
        title: parsedRecipe.recipe.title,
        description: parsedRecipe.recipe.description,
        cuisine_type: parsedRecipe.recipe.cuisine_type,
        meal_types: Array.isArray(parsedRecipe.recipe.meal_types) 
          ? parsedRecipe.recipe.meal_types 
          : [params.category],
        dietary_tags: parsedRecipe.recipe.dietary_tags || params.dietary,
        difficulty: parsedRecipe.recipe.difficulty,
        prep_time: parsedRecipe.recipe.prep_time,
        cook_time: parsedRecipe.recipe.cook_time,
        servings: parsedRecipe.recipe.servings,
        ingredients: parsedRecipe.recipe.ingredients,
        instructions: parsedRecipe.recipe.instructions,
        nutritional_info: parsedRecipe.recipe.nutritional_info,
        tags: this.generateTags(parsedRecipe.recipe, params),
        source: 'gemini-ai-generated',
        created_at: new Date().toISOString()
      };

      return recipe;
      
    } catch (error: unknown) {
      console.error('Error generating recipe:', error);
      return null;
    }
  }

  /**
   * Build comprehensive prompt for recipe generation
   */
  private buildRecipePrompt(params: any): string {
    return `You are a world-class chef and cookbook author. Create an authentic, delicious, and practical recipe with the following specifications:

REQUIREMENTS:
- Category: ${params.category}
- Cuisine: ${params.cuisine}
- Dietary requirements: ${params.dietary.join(', ')}
- Difficulty: ${params.difficulty}
- Cooking method: ${params.method}
- Servings: ${params.servings}
- Maximum total time: ${params.maxTime} minutes

Create a recipe that is:
1. Authentic to the cuisine style
2. Practical for home cooking
3. Nutritionally balanced
4. Detailed with clear instructions
5. Includes cooking tips and variations

Respond ONLY with valid JSON in this exact format:
{
  "recipe": {
    "title": "Authentic recipe name",
    "description": "Appetizing 2-3 sentence description",
    "ingredients": [
      {
        "name": "ingredient name",
        "quantity": number,
        "unit": "measurement unit",
        "notes": "preparation notes (optional)",
        "optional": boolean
      }
    ],
    "instructions": [
      {
        "step_number": 1,
        "text": "Detailed step instruction",
        "time_minutes": optional number,
        "temperature": optional {"value": number, "unit": "celsius"},
        "tips": optional ["cooking tip"]
      }
    ],
    "prep_time": number (minutes),
    "cook_time": number (minutes),
    "servings": ${params.servings},
    "cuisine_type": "${params.cuisine}",
    "meal_types": ["${params.category}"],
    "dietary_tags": ${JSON.stringify(params.dietary)},
    "difficulty": "${params.difficulty}",
    "nutritional_info": {
      "calories": number (per serving),
      "protein": number (grams),
      "carbs": number (grams),
      "fat": number (grams),
      "fiber": number (grams),
      "sugar": number (grams),
      "sodium": number (mg)
    }
  }
}

Make the recipe authentic, detailed, and delicious. Include cultural context in the description.`;
  }

  /**
   * Generate relevant tags for the recipe
   */
  private generateTags(recipe: any, params: any): string[] {
    const tags = new Set<string>();
    
    // Add basic tags
    tags.add(params.cuisine);
    tags.add(params.category);
    tags.add(params.difficulty);
    tags.add(params.method);
    
    // Add dietary tags
    params.dietary.forEach((tag: string) => tags.add(tag));
    
    // Add time-based tags
    const totalTime = recipe.prep_time + recipe.cook_time;
    if (totalTime <= 30) tags.add('quick');
    if (totalTime <= 15) tags.add('express');
    if (totalTime >= 120) tags.add('slow');
    
    // Add ingredient-based tags
    const ingredientText = recipe.ingredients.map((ing: any) => ing.name.toLowerCase()).join(' ');
    if (ingredientText.includes('chicken')) tags.add('chicken');
    if (ingredientText.includes('beef')) tags.add('beef');
    if (ingredientText.includes('fish') || ingredientText.includes('salmon') || ingredientText.includes('tuna')) tags.add('seafood');
    if (ingredientText.includes('pasta')) tags.add('pasta');
    if (ingredientText.includes('rice')) tags.add('rice');
    if (ingredientText.includes('cheese')) tags.add('cheese');
    
    // Add method-based tags
    if (params.method === 'one-pot') tags.add('one-pot');
    if (params.method === 'no-cook') tags.add('no-cook');
    if (params.method === 'sheet-pan') tags.add('sheet-pan');
    
    return Array.from(tags);
  }

  /**
   * Generate all 1000 recipes
   */
  async generateAllRecipes(): Promise<void> {
    console.log('🚀 Starting recipe generation with Gemini AI...');
    
    const totalBatches = 100; // 10 recipes per batch = 1000 total
    const batchSize = 10;
    
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      console.log(`📦 Generating batch ${batchIndex + 1}/${totalBatches}...`);
      
      try {
        const batch = await this.generateRecipeBatch(batchSize);
        this.recipes.push(...batch);
        
        console.log(`✅ Batch ${batchIndex + 1} complete: ${batch.length} recipes generated`);
        console.log(`📊 Total recipes so far: ${this.recipes.length}`);
        
        // Save progress every 10 batches
        if ((batchIndex + 1) % 10 === 0) {
          await this.saveProgress();
        }
        
        // Rate limiting to avoid API limits
        await this.delay(2000); // 2 second delay between batches
        
      } catch (error: unknown) {
        console.error(`❌ Error in batch ${batchIndex + 1}:`, error);
        // Continue with next batch
      }
    }
    
    console.log(`🎉 Recipe generation complete! Generated ${this.recipes.length} recipes.`);
    await this.saveAllRecipes();
  }

  /**
   * Save progress to file
   */
  private async saveProgress(): Promise<void> {
    const progressFile = path.join(process.cwd(), 'data/recipes-progress.json');
    await fs.mkdir(path.dirname(progressFile), { recursive: true });
    await fs.writeFile(progressFile, JSON.stringify(this.recipes, null, 2));
    console.log(`💾 Progress saved: ${this.recipes.length} recipes`);
  }

  /**
   * Save all recipes to final file
   */
  private async saveAllRecipes(): Promise<void> {
    const dataDir = path.join(process.cwd(), 'data');
    await fs.mkdir(dataDir, { recursive: true });
    
    // Save complete dataset
    const allRecipesFile = path.join(dataDir, 'gemini-recipes-1000.json');
    await fs.writeFile(allRecipesFile, JSON.stringify(this.recipes, null, 2));
    
    // Save by cuisine for easier loading
    const cuisineGroups = this.groupRecipesByCuisine();
    for (const [cuisine, recipes] of Object.entries(cuisineGroups)) {
      const cuisineFile = path.join(dataDir, `recipes-${cuisine}.json`);
      await fs.writeFile(cuisineFile, JSON.stringify(recipes, null, 2));
    }
    
    // Generate summary statistics
    const stats = this.generateStatistics();
    const statsFile = path.join(dataDir, 'recipe-statistics.json');
    await fs.writeFile(statsFile, JSON.stringify(stats, null, 2));
    
    console.log(`📚 All recipes saved to ${dataDir}`);
    console.log(`📈 Statistics saved to ${statsFile}`);
  }

  /**
   * Group recipes by cuisine
   */
  private groupRecipesByCuisine(): Record<string, GeneratedRecipe[]> {
    const groups: Record<string, GeneratedRecipe[]> = {};
    
    for (const recipe of this.recipes) {
      const cuisine = recipe.cuisine_type;
      if (!groups[cuisine]) {
        groups[cuisine] = [];
      }
      groups[cuisine].push(recipe);
    }
    
    return groups;
  }

  /**
   * Generate summary statistics
   */
  private generateStatistics() {
    const stats = {
      total_recipes: this.recipes.length,
      by_cuisine: {} as Record<string, number>,
      by_difficulty: {} as Record<string, number>,
      by_meal_type: {} as Record<string, number>,
      by_dietary_tags: {} as Record<string, number>,
      avg_prep_time: 0,
      avg_cook_time: 0,
      avg_servings: 0,
      avg_calories: 0,
      generated_at: new Date().toISOString()
    };
    
    let totalPrepTime = 0;
    let totalCookTime = 0;
    let totalServings = 0;
    let totalCalories = 0;
    
    for (const recipe of this.recipes) {
      // Cuisine stats
      stats.by_cuisine[recipe.cuisine_type] = (stats.by_cuisine[recipe.cuisine_type] || 0) + 1;
      
      // Difficulty stats
      stats.by_difficulty[recipe.difficulty] = (stats.by_difficulty[recipe.difficulty] || 0) + 1;
      
      // Meal type stats
      recipe.meal_types.forEach(mealType => {
        stats.by_meal_type[mealType] = (stats.by_meal_type[mealType] || 0) + 1;
      });
      
      // Dietary tags stats
      recipe.dietary_tags.forEach(tag => {
        stats.by_dietary_tags[tag] = (stats.by_dietary_tags[tag] || 0) + 1;
      });
      
      // Averages
      totalPrepTime += recipe.prep_time;
      totalCookTime += recipe.cook_time;
      totalServings += recipe.servings;
      totalCalories += recipe.nutritional_info.calories;
    }
    
    stats.avg_prep_time = Math.round(totalPrepTime / this.recipes.length);
    stats.avg_cook_time = Math.round(totalCookTime / this.recipes.length);
    stats.avg_servings = Math.round(totalServings / this.recipes.length);
    stats.avg_calories = Math.round(totalCalories / this.recipes.length);
    
    return stats;
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Main execution
async function main() {
  if (!process.env.GOOGLE_GEMINI_API_KEY) {
    console.error('❌ GOOGLE_GEMINI_API_KEY environment variable is required');
    process.exit(1);
  }
  
  console.log('🤖 Initializing Gemini AI Recipe Generator...');
  
  const generator = new RecipeGenerator();
  
  try {
    await generator.generateAllRecipes();
    console.log('✨ Recipe generation completed successfully!');
  } catch (error: unknown) {
    console.error('💥 Recipe generation failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

export { RecipeGenerator };
export type { GeneratedRecipe };