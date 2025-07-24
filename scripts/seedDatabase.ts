/**
 * Database Seeding Script
 * Seeds the database with generated recipes and sample data
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { GeneratedRecipe } from './generateRecipes';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

class DatabaseSeeder {
  private recipes: GeneratedRecipe[] = [];

  /**
   * Load recipes from generated files
   */
  async loadRecipes(): Promise<void> {
    console.log('📚 Loading generated recipes...');
    
    const dataDir = path.join(process.cwd(), 'data');
    const recipesFile = path.join(dataDir, 'gemini-recipes-1000.json');
    
    try {
      const fileContent = await fs.readFile(recipesFile, 'utf-8');
      this.recipes = JSON.parse(fileContent);
      console.log(`✅ Loaded ${this.recipes.length} recipes from file`);
    } catch (error: unknown) {
      console.error('❌ Failed to load recipes file:', error);
      throw error;
    }
  }

  /**
   * Setup database schema
   */
  async setupSchema(): Promise<void> {
    console.log('🏗️ Setting up database schema...');
    
    // Create recipes table
    const { error: recipeError } = await supabase.rpc('create_recipes_table');
    if (recipeError && !recipeError.message.includes('already exists')) {
      console.error('❌ Failed to create recipes table:', recipeError);
      // Don't throw - table might already exist
    }
    
    // Create ingredients table
    const { error: ingredientError } = await supabase.rpc('create_ingredients_table');
    if (ingredientError && !ingredientError.message.includes('already exists')) {
      console.error('❌ Failed to create ingredients table:', ingredientError);
    }
    
    console.log('✅ Database schema setup complete');
  }

  /**
   * Extract and seed unique ingredients
   */
  async seedIngredients(): Promise<Map<string, string>> {
    console.log('🥕 Extracting and seeding ingredients...');
    
    const uniqueIngredients = new Map<string, any>();
    
    // Extract all unique ingredients from recipes
    for (const recipe of this.recipes) {
      for (const ingredient of recipe.ingredients) {
        const key = ingredient.name.toLowerCase().trim();
        if (!uniqueIngredients.has(key)) {
          uniqueIngredients.set(key, {
            name: ingredient.name,
            default_unit: ingredient.unit,
            category: this.categorizeIngredient(ingredient.name),
            common_units: this.getCommonUnits(ingredient.unit)
          });
        }
      }
    }
    
    console.log(`🔍 Found ${uniqueIngredients.size} unique ingredients`);
    
    // Batch insert ingredients
    const ingredientBatches = this.chunkArray(Array.from(uniqueIngredients.values()), 100);
    const ingredientIdMap = new Map<string, string>();
    
    for (let i = 0; i < ingredientBatches.length; i++) {
      console.log(`📦 Inserting ingredient batch ${i + 1}/${ingredientBatches.length}`);
      
      const { data, error } = await supabase
        .from('ingredients')
        .upsert(ingredientBatches[i], { 
          onConflict: 'name',
          ignoreDuplicates: false 
        })
        .select('id, name');
      
      if (error) {
        console.error('❌ Error inserting ingredients:', error);
        continue;
      }
      
      // Map ingredient names to IDs
      if (data) {
        for (const ingredient of data) {
          ingredientIdMap.set(ingredient.name.toLowerCase().trim(), ingredient.id);
        }
      }
    }
    
    console.log(`✅ Seeded ${ingredientIdMap.size} ingredients`);
    return ingredientIdMap;
  }

  /**
   * Seed recipes with proper relationships
   */
  async seedRecipes(ingredientIdMap: Map<string, string>): Promise<void> {
    console.log('🍽️ Seeding recipes...');
    
    const recipeBatches = this.chunkArray(this.recipes, 50);
    let totalInserted = 0;
    
    for (let i = 0; i < recipeBatches.length; i++) {
      console.log(`📦 Inserting recipe batch ${i + 1}/${recipeBatches.length}`);
      
      const batch = recipeBatches[i];
      const recipeData = batch.map(recipe => ({
        id: recipe.id,
        title: recipe.title,
        description: recipe.description,
        cuisine_type: recipe.cuisine_type,
        meal_types: recipe.meal_types,
        dietary_tags: recipe.dietary_tags,
        difficulty: recipe.difficulty,
        prep_time: recipe.prep_time,
        cook_time: recipe.cook_time,
        servings: recipe.servings,
        instructions: recipe.instructions,
        nutritional_info: recipe.nutritional_info,
        tags: recipe.tags,
        source: recipe.source,
        image_url: recipe.image_url,
        created_at: recipe.created_at,
        updated_at: recipe.created_at
      }));
      
      // Insert recipes
      const { data: insertedRecipes, error: recipeError } = await supabase
        .from('recipes')
        .upsert(recipeData, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        })
        .select('id');
      
      if (recipeError) {
        console.error('❌ Error inserting recipes:', recipeError);
        continue;
      }
      
      // Insert recipe ingredients
      if (insertedRecipes) {
        await this.seedRecipeIngredients(batch, ingredientIdMap);
        totalInserted += insertedRecipes.length;
      }
    }
    
    console.log(`✅ Seeded ${totalInserted} recipes`);
  }

  /**
   * Seed recipe ingredients relationships
   */
  async seedRecipeIngredients(
    recipes: GeneratedRecipe[], 
    ingredientIdMap: Map<string, string>
  ): Promise<void> {
    const recipeIngredients: any[] = [];
    
    for (const recipe of recipes) {
      for (let i = 0; i < recipe.ingredients.length; i++) {
        const ingredient = recipe.ingredients[i];
        const ingredientKey = ingredient.name.toLowerCase().trim();
        const ingredientId = ingredientIdMap.get(ingredientKey);
        
        if (ingredientId) {
          recipeIngredients.push({
            recipe_id: recipe.id,
            ingredient_id: ingredientId,
            quantity: ingredient.quantity,
            unit: ingredient.unit,
            preparation: ingredient.notes,
            optional: ingredient.optional,
            order_index: i + 1
          });
        }
      }
    }
    
    if (recipeIngredients.length > 0) {
      const { error } = await supabase
        .from('recipe_ingredients')
        .upsert(recipeIngredients, {
          onConflict: 'recipe_id,ingredient_id',
          ignoreDuplicates: false
        });
      
      if (error) {
        console.error('❌ Error inserting recipe ingredients:', error);
      }
    }
  }

  /**
   * Create sample users and data
   */
  async seedSampleData(): Promise<void> {
    console.log('👥 Creating sample user data...');
    
    // Sample pantry items
    const samplePantryItems = [
      { ingredient_name: 'olive oil', quantity: 1, unit: 'bottle', location: 'pantry' },
      { ingredient_name: 'salt', quantity: 1, unit: 'container', location: 'pantry' },
      { ingredient_name: 'black pepper', quantity: 1, unit: 'container', location: 'pantry' },
      { ingredient_name: 'garlic', quantity: 2, unit: 'bulbs', location: 'pantry' },
      { ingredient_name: 'onion', quantity: 3, unit: 'pieces', location: 'pantry' },
      { ingredient_name: 'rice', quantity: 2, unit: 'kg', location: 'pantry' },
      { ingredient_name: 'pasta', quantity: 500, unit: 'g', location: 'pantry' },
      { ingredient_name: 'canned tomatoes', quantity: 4, unit: 'cans', location: 'pantry' },
      { ingredient_name: 'chicken breast', quantity: 1, unit: 'kg', location: 'refrigerator', expiration_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      { ingredient_name: 'eggs', quantity: 12, unit: 'pieces', location: 'refrigerator', expiration_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) }
    ];
    
    console.log('✅ Sample data creation complete');
  }

  /**
   * Generate comprehensive statistics
   */
  async generateStatistics(): Promise<void> {
    console.log('📊 Generating database statistics...');
    
    // Count recipes by cuisine
    const { data: cuisineStats } = await supabase
      .from('recipes')
      .select('cuisine_type')
      .then(result => {
        if (result.data) {
          const counts: Record<string, number> = {};
          result.data.forEach(recipe => {
            counts[recipe.cuisine_type] = (counts[recipe.cuisine_type] || 0) + 1;
          });
          return { data: counts };
        }
        return { data: {} };
      });
    
    // Count recipes by difficulty
    const { data: difficultyStats } = await supabase
      .from('recipes')
      .select('difficulty')
      .then(result => {
        if (result.data) {
          const counts: Record<string, number> = {};
          result.data.forEach(recipe => {
            counts[recipe.difficulty] = (counts[recipe.difficulty] || 0) + 1;
          });
          return { data: counts };
        }
        return { data: {} };
      });
    
    const stats = {
      total_recipes: this.recipes.length,
      by_cuisine: cuisineStats,
      by_difficulty: difficultyStats,
      seeded_at: new Date().toISOString()
    };
    
    // Save stats to file
    const statsFile = path.join(process.cwd(), 'data', 'database-seed-stats.json');
    await fs.writeFile(statsFile, JSON.stringify(stats, null, 2));
    
    console.log('📈 Statistics generated and saved');
    console.log('🎯 Seeding Summary:');
    console.log(`   📚 Total recipes: ${stats.total_recipes}`);
    console.log(`   🌍 Cuisines: ${Object.keys(stats.by_cuisine).length}`);
    console.log(`   📊 Difficulties: ${Object.keys(stats.by_difficulty).length}`);
  }

  /**
   * Utility functions
   */
  private categorizeIngredient(name: string): string {
    const ingredient = name.toLowerCase();
    
    if (ingredient.includes('chicken') || ingredient.includes('beef') || ingredient.includes('pork') || 
        ingredient.includes('fish') || ingredient.includes('salmon') || ingredient.includes('meat')) {
      return 'protein';
    }
    if (ingredient.includes('lettuce') || ingredient.includes('spinach') || ingredient.includes('broccoli') ||
        ingredient.includes('carrot') || ingredient.includes('onion') || ingredient.includes('tomato')) {
      return 'vegetable';
    }
    if (ingredient.includes('apple') || ingredient.includes('banana') || ingredient.includes('orange') ||
        ingredient.includes('berry') || ingredient.includes('lemon') || ingredient.includes('lime')) {
      return 'fruit';
    }
    if (ingredient.includes('rice') || ingredient.includes('pasta') || ingredient.includes('bread') ||
        ingredient.includes('flour') || ingredient.includes('oats') || ingredient.includes('quinoa')) {
      return 'grain';
    }
    if (ingredient.includes('milk') || ingredient.includes('cheese') || ingredient.includes('yogurt') ||
        ingredient.includes('butter') || ingredient.includes('cream')) {
      return 'dairy';
    }
    if (ingredient.includes('salt') || ingredient.includes('pepper') || ingredient.includes('garlic') ||
        ingredient.includes('basil') || ingredient.includes('oregano') || ingredient.includes('cumin')) {
      return 'spice';
    }
    
    return 'other';
  }

  private getCommonUnits(defaultUnit: string): string[] {
    const unitMappings: Record<string, string[]> = {
      'g': ['g', 'kg', 'oz', 'lb'],
      'kg': ['kg', 'g', 'lb', 'oz'],
      'ml': ['ml', 'l', 'cup', 'fl oz'],
      'l': ['l', 'ml', 'cup', 'fl oz'],
      'cup': ['cup', 'ml', 'l', 'fl oz'],
      'tbsp': ['tbsp', 'tsp', 'ml'],
      'tsp': ['tsp', 'tbsp', 'ml'],
      'piece': ['piece', 'item', 'whole'],
      'slice': ['slice', 'piece', 'serving']
    };
    
    return unitMappings[defaultUnit] || [defaultUnit, 'piece', 'serving'];
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Run complete seeding process
   */
  async seedAll(): Promise<void> {
    console.log('🌱 Starting database seeding process...');
    
    try {
      await this.loadRecipes();
      await this.setupSchema();
      const ingredientIdMap = await this.seedIngredients();
      await this.seedRecipes(ingredientIdMap);
      await this.seedSampleData();
      await this.generateStatistics();
      
      console.log('🎉 Database seeding completed successfully!');
      
    } catch (error: unknown) {
      console.error('💥 Database seeding failed:', error);
      throw error;
    }
  }
}

// Main execution
async function main() {
  const seeder = new DatabaseSeeder();
  await seeder.seedAll();
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

export { DatabaseSeeder };