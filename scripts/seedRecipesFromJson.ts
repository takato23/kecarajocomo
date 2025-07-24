/**
 * Script to seed recipes from recipes_full.json file
 * This script loads the pre-generated AI recipes and seeds them into the database
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Interface for the JSON recipe structure
interface JsonRecipe {
  id: string;
  title: string;
  description: string;
  instructions: string[];
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  difficulty: string;
  cuisine: string;
  tags: string[];
  imageUrl: string;
  ingredients: {
    name: string;
    quantity: number;
    unit: string;
    notes?: string;
  }[];
  nutritionInfo: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
  };
  isPublic: boolean;
  source: string;
}

// Mapping functions
function mapDifficulty(difficulty: string): string {
  const difficultyMap: Record<string, string> = {
    'easy': 'facil',
    'medium': 'intermedio',
    'hard': 'dificil',
    'expert': 'experto'
  };
  return difficultyMap[difficulty.toLowerCase()] || 'intermedio';
}

function mapCuisine(cuisine: string): string {
  const cuisineMap: Record<string, string> = {
    'mexican': 'mexicana',
    'italian': 'italiana',
    'asian': 'asiatica',
    'mediterranean': 'mediterranea',
    'american': 'americana',
    'french': 'francesa',
    'indian': 'india',
    'japanese': 'japonesa',
    'chinese': 'china',
    'thai': 'tailandesa',
    'peruvian': 'peruana',
    'argentinian': 'argentina',
    'argentina': 'argentina',
    'fusion': 'fusion',
    'international': 'internacional'
  };
  return cuisineMap[cuisine.toLowerCase()] || 'internacional';
}

function mapCategory(tags: string[]): string {
  // Try to determine category from tags
  const categoryKeywords = {
    'desayuno': ['breakfast', 'desayuno', 'morning'],
    'almuerzo': ['lunch', 'almuerzo', 'mediodía'],
    'cena': ['dinner', 'cena', 'night'],
    'snack': ['snack', 'aperitivo', 'botana'],
    'postre': ['dessert', 'postre', 'dulce', 'sweet'],
    'bebida': ['drink', 'bebida', 'beverage'],
    'ensalada': ['salad', 'ensalada'],
    'sopa': ['soup', 'sopa', 'caldo'],
    'pasta': ['pasta', 'noodles'],
    'pizza': ['pizza'],
    'sandwich': ['sandwich', 'bocadillo', 'wrap'],
    'parrilla': ['grill', 'parrilla', 'asado', 'bbq'],
    'vegetariano': ['vegetarian', 'vegetariano'],
    'vegano': ['vegan', 'vegano']
  };

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (tags.some(tag => keywords.some(keyword => tag.toLowerCase().includes(keyword)))) {
      return category;
    }
  }

  // Default category based on time
  return 'almuerzo';
}

class RecipeJsonSeeder {
  private recipes: JsonRecipe[] = [];
  private ingredientIdMap = new Map<string, string>();
  private validationErrors: string[] = [];

  async loadRecipes(): Promise<void> {
    console.log('📚 Loading recipes from JSON file...');
    
    const recipesFile = path.join(process.cwd(), 'docs', 'recipes_full.json');
    
    try {
      const fileContent = await fs.readFile(recipesFile, 'utf-8');
      this.recipes = JSON.parse(fileContent);
      console.log(`✅ Loaded ${this.recipes.length} recipes from file`);
      
      // Validate recipes
      this.validateRecipes();
      
      if (this.validationErrors.length > 0) {
        console.warn('⚠️ Validation warnings:');
        this.validationErrors.forEach(error => console.warn(`   - ${error}`));
      }
    } catch (error: unknown) {
      console.error('❌ Failed to load recipes file:', error);
      throw error;
    }
  }

  private validateRecipes(): void {
    console.log('🔍 Validating recipes...');
    
    this.recipes.forEach((recipe, index) => {
      // Required fields validation
      if (!recipe.id) {
        this.validationErrors.push(`Recipe at index ${index} missing ID`);
      }
      if (!recipe.title || recipe.title.trim() === '') {
        this.validationErrors.push(`Recipe ${recipe.id || index} missing title`);
      }
      if (!recipe.description) {
        this.validationErrors.push(`Recipe ${recipe.title || index} missing description`);
      }
      if (!recipe.instructions || recipe.instructions.length === 0) {
        this.validationErrors.push(`Recipe ${recipe.title || index} has no instructions`);
      }
      if (!recipe.ingredients || recipe.ingredients.length === 0) {
        this.validationErrors.push(`Recipe ${recipe.title || index} has no ingredients`);
      }
      
      // Validate numeric fields
      if (recipe.prepTimeMinutes < 0 || recipe.cookTimeMinutes < 0) {
        this.validationErrors.push(`Recipe ${recipe.title} has negative time values`);
      }
      if (recipe.servings <= 0) {
        this.validationErrors.push(`Recipe ${recipe.title} has invalid servings count`);
      }
      
      // Validate ingredients
      recipe.ingredients.forEach((ingredient, i) => {
        if (!ingredient.name || ingredient.name.trim() === '') {
          this.validationErrors.push(`Recipe ${recipe.title} has ingredient ${i} without name`);
        }
        if (ingredient.quantity <= 0) {
          this.validationErrors.push(`Recipe ${recipe.title} has ingredient ${ingredient.name} with invalid quantity`);
        }
        if (!ingredient.unit || ingredient.unit.trim() === '') {
          this.validationErrors.push(`Recipe ${recipe.title} has ingredient ${ingredient.name} without unit`);
        }
      });
      
      // Validate nutrition info
      if (recipe.nutritionInfo) {
        const nutrition = recipe.nutritionInfo;
        if (nutrition.calories < 0 || nutrition.protein < 0 || nutrition.carbs < 0 || 
            nutrition.fat < 0 || nutrition.fiber < 0 || nutrition.sugar < 0 || nutrition.sodium < 0) {
          this.validationErrors.push(`Recipe ${recipe.title} has negative nutrition values`);
        }
      }
    });
    
    console.log(`✅ Validation complete. Found ${this.validationErrors.length} warnings`);
  }

  async seedIngredients(): Promise<void> {
    console.log('🥕 Extracting and seeding ingredients...');
    
    const uniqueIngredients = new Map<string, any>();
    
    // Extract all unique ingredients
    for (const recipe of this.recipes) {
      for (const ingredient of recipe.ingredients) {
        const key = ingredient.name.toLowerCase().trim();
        if (!uniqueIngredients.has(key)) {
          uniqueIngredients.set(key, {
            id: uuidv4(),
            name: ingredient.name,
            default_unit: ingredient.unit,
            category: this.categorizeIngredient(ingredient.name),
            common_units: this.getCommonUnits(ingredient.unit),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      }
    }
    
    console.log(`🔍 Found ${uniqueIngredients.size} unique ingredients`);
    
    // Insert ingredients in batches
    const ingredientArray = Array.from(uniqueIngredients.values());
    const batchSize = 100;
    
    for (let i = 0; i < ingredientArray.length; i += batchSize) {
      const batch = ingredientArray.slice(i, i + batchSize);
      console.log(`📦 Inserting ingredient batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(ingredientArray.length/batchSize)}`);
      
      const { data, error } = await supabase
        .from('ingredients')
        .upsert(batch, { 
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
          this.ingredientIdMap.set(ingredient.name.toLowerCase().trim(), ingredient.id);
        }
      }
    }
    
    console.log(`✅ Seeded ${this.ingredientIdMap.size} ingredients`);
  }

  async seedRecipes(): Promise<void> {
    console.log('🍽️ Seeding recipes...');
    
    const batchSize = 50;
    let totalInserted = 0;
    
    for (let i = 0; i < this.recipes.length; i += batchSize) {
      const batch = this.recipes.slice(i, i + batchSize);
      console.log(`📦 Inserting recipe batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(this.recipes.length/batchSize)}`);
      
      // Transform recipes to match database schema
      const recipeData = batch.map(recipe => ({
        id: recipe.id,
        name: recipe.title,
        description: recipe.description,
        image_url: recipe.imageUrl,
        instructions: recipe.instructions.map((instruction, index) => ({
          id: uuidv4(),
          recipe_id: recipe.id,
          step_number: index + 1,
          instruction: instruction,
          order: index + 1
        })),
        cook_time: recipe.cookTimeMinutes,
        prep_time: recipe.prepTimeMinutes,
        total_time: recipe.prepTimeMinutes + recipe.cookTimeMinutes,
        servings: recipe.servings,
        difficulty: mapDifficulty(recipe.difficulty),
        cuisine_type: mapCuisine(recipe.cuisine),
        category: mapCategory(recipe.tags),
        tags: recipe.tags,
        dietary_info: {
          vegetarian: recipe.tags.includes('vegetariano') || recipe.tags.includes('vegetarian'),
          vegan: recipe.tags.includes('vegano') || recipe.tags.includes('vegan'),
          gluten_free: recipe.tags.includes('sin-gluten') || recipe.tags.includes('gluten-free'),
          dairy_free: false,
          nut_free: false,
          low_carb: false,
          keto: false,
          paleo: false,
          allergies: []
        },
        ai_generated: recipe.source === 'ai-generated',
        source: {
          type: 'ai_generated',
          imported_at: new Date()
        },
        created_by: 'system',
        rating: null,
        rating_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
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
        await this.seedRecipeIngredients(batch);
        totalInserted += insertedRecipes.length;
      }
      
      // Insert recipe instructions
      await this.seedRecipeInstructions(batch);
      
      // Insert nutrition info
      await this.seedNutritionInfo(batch);
    }
    
    console.log(`✅ Seeded ${totalInserted} recipes`);
  }

  async seedRecipeIngredients(recipes: JsonRecipe[]): Promise<void> {
    const recipeIngredients: any[] = [];
    
    for (const recipe of recipes) {
      for (let i = 0; i < recipe.ingredients.length; i++) {
        const ingredient = recipe.ingredients[i];
        const ingredientKey = ingredient.name.toLowerCase().trim();
        const ingredientId = this.ingredientIdMap.get(ingredientKey);
        
        if (ingredientId) {
          recipeIngredients.push({
            id: uuidv4(),
            recipe_id: recipe.id,
            ingredient_id: ingredientId,
            quantity: ingredient.quantity,
            unit: ingredient.unit,
            preparation: ingredient.notes,
            optional: false,
            notes: ingredient.notes,
            order: i + 1
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

  async seedRecipeInstructions(recipes: JsonRecipe[]): Promise<void> {
    const instructions: any[] = [];
    
    for (const recipe of recipes) {
      recipe.instructions.forEach((instruction, index) => {
        instructions.push({
          id: uuidv4(),
          recipe_id: recipe.id,
          step_number: index + 1,
          instruction: instruction,
          duration: null,
          temperature: null,
          image_url: null,
          notes: null
        });
      });
    }
    
    if (instructions.length > 0) {
      const { error } = await supabase
        .from('recipe_instructions')
        .upsert(instructions, {
          onConflict: 'id',
          ignoreDuplicates: false
        });
      
      if (error) {
        console.error('❌ Error inserting recipe instructions:', error);
      }
    }
  }

  async seedNutritionInfo(recipes: JsonRecipe[]): Promise<void> {
    const nutritionData = recipes.map(recipe => ({
      id: uuidv4(),
      recipe_id: recipe.id,
      calories: recipe.nutritionInfo.calories,
      protein: recipe.nutritionInfo.protein,
      carbs: recipe.nutritionInfo.carbs,
      fat: recipe.nutritionInfo.fat,
      fiber: recipe.nutritionInfo.fiber,
      sugar: recipe.nutritionInfo.sugar,
      sodium: recipe.nutritionInfo.sodium,
      cholesterol: null,
      vitamins: {},
      minerals: {},
      calculated_at: new Date().toISOString()
    }));
    
    if (nutritionData.length > 0) {
      const { error } = await supabase
        .from('nutrition_info')
        .upsert(nutritionData, {
          onConflict: 'recipe_id',
          ignoreDuplicates: false
        });
      
      if (error) {
        console.error('❌ Error inserting nutrition info:', error);
      }
    }
  }

  private categorizeIngredient(name: string): string {
    const ingredient = name.toLowerCase();
    
    if (ingredient.includes('carne') || ingredient.includes('pollo') || ingredient.includes('pescado') || 
        ingredient.includes('huevo') || ingredient.includes('jamón')) {
      return 'proteina';
    }
    if (ingredient.includes('lechuga') || ingredient.includes('tomate') || ingredient.includes('cebolla') ||
        ingredient.includes('zanahoria') || ingredient.includes('papa') || ingredient.includes('pimiento')) {
      return 'verdura';
    }
    if (ingredient.includes('manzana') || ingredient.includes('naranja') || ingredient.includes('plátano') ||
        ingredient.includes('fresa') || ingredient.includes('limón')) {
      return 'fruta';
    }
    if (ingredient.includes('arroz') || ingredient.includes('pasta') || ingredient.includes('pan') ||
        ingredient.includes('harina') || ingredient.includes('avena')) {
      return 'grano';
    }
    if (ingredient.includes('leche') || ingredient.includes('queso') || ingredient.includes('yogur') ||
        ingredient.includes('mantequilla') || ingredient.includes('crema')) {
      return 'lácteo';
    }
    if (ingredient.includes('sal') || ingredient.includes('pimienta') || ingredient.includes('ajo') ||
        ingredient.includes('comino') || ingredient.includes('orégano')) {
      return 'especia';
    }
    
    return 'otro';
  }

  private getCommonUnits(defaultUnit: string): string[] {
    const unitMappings: Record<string, string[]> = {
      'g': ['g', 'kg', 'oz', 'lb'],
      'kg': ['kg', 'g', 'lb', 'oz'],
      'ml': ['ml', 'l', 'taza', 'oz'],
      'l': ['l', 'ml', 'taza', 'oz'],
      'taza': ['taza', 'ml', 'l'],
      'cucharada': ['cucharada', 'cucharadita', 'ml'],
      'cucharadita': ['cucharadita', 'cucharada', 'ml'],
      'u': ['u', 'unidad', 'pieza'],
      'pieza': ['pieza', 'unidad', 'u']
    };
    
    return unitMappings[defaultUnit] || [defaultUnit, 'unidad'];
  }

  async seedAll(): Promise<void> {
    console.log('🌱 Starting recipe seeding process from JSON...');
    console.log('📅 ' + new Date().toLocaleString());
    
    try {
      await this.loadRecipes();
      await this.seedIngredients();
      await this.seedRecipes();
      
      console.log('🎉 Recipe seeding completed successfully!');
      console.log('📊 Summary:');
      console.log(`   📚 Total recipes: ${this.recipes.length}`);
      console.log(`   🥕 Total ingredients: ${this.ingredientIdMap.size}`);
      
    } catch (error: unknown) {
      console.error('💥 Recipe seeding failed:', error);
      throw error;
    }
  }
}

// Main execution
async function main() {
  const seeder = new RecipeJsonSeeder();
  await seeder.seedAll();
}

// Run the script
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { RecipeJsonSeeder };