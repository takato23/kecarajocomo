/**
 * Mock Data Seeder - Populate database with sample data
 * Creates recipes, ingredients, and sample meal plans without external APIs
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

// Mock recipes data
const MOCK_RECIPES = [
  {
    title: "Pollo al Limón",
    description: "Jugoso pollo al horno con hierbas y limón fresco, perfecto para una cena familiar",
    instructions: ["Precalentar horno a 180°C", "Sazonar el pollo con sal, pimienta y hierbas", "Hornear por 45 minutos", "Servir caliente"],
    prepTimeMinutes: 15,
    cookTimeMinutes: 45,
    servings: 4,
    difficulty: "medium",
    cuisine: "mediterranean",
    source: "ai-generated",
    tags: ["pollo", "limón", "fácil", "saludable"]
  },
  {
    title: "Pasta Carbonara",
    description: "Clásica pasta italiana con panceta, huevo y queso parmesano",
    instructions: ["Hervir pasta al dente", "Freír panceta hasta dorar", "Mezclar huevos con queso", "Combinar todo fuera del fuego"],
    prepTimeMinutes: 10,
    cookTimeMinutes: 15,
    servings: 2,
    difficulty: "medium",
    cuisine: "italian",
    source: "ai-generated",
    tags: ["pasta", "italiana", "cremosa", "rápida"]
  },
  {
    title: "Ensalada César",
    description: "Fresca ensalada con lechuga romana, crutones caseros y aderezo césar",
    instructions: ["Lavar y cortar lechuga", "Preparar aderezo césar", "Tostar pan para crutones", "Mezclar y servir"],
    prepTimeMinutes: 20,
    cookTimeMinutes: 0,
    servings: 2,
    difficulty: "easy",
    cuisine: "american",
    source: "ai-generated",
    tags: ["ensalada", "fresca", "sin cocción", "vegetariana"]
  },
  {
    title: "Tacos de Pescado",
    description: "Deliciosos tacos con pescado a la plancha, salsa fresca y aguacate",
    instructions: ["Sazonar y cocinar pescado", "Preparar salsa pico de gallo", "Calentar tortillas", "Armar tacos con todos los ingredientes"],
    prepTimeMinutes: 25,
    cookTimeMinutes: 10,
    servings: 3,
    difficulty: "easy",
    cuisine: "mexican",
    source: "ai-generated",
    tags: ["tacos", "pescado", "mexicana", "saludable"]
  },
  {
    title: "Risotto de Hongos",
    description: "Cremoso risotto italiano con hongos mixtos y parmesano",
    instructions: ["Saltear hongos y reservar", "Sofreír cebolla y arroz", "Agregar caldo de a poco", "Terminar con hongos y queso"],
    prepTimeMinutes: 15,
    cookTimeMinutes: 30,
    servings: 4,
    difficulty: "hard",
    cuisine: "italian",
    source: "ai-generated",
    tags: ["risotto", "hongos", "cremoso", "vegetariana"]
  },
  {
    title: "Smoothie Verde",
    description: "Nutritivo smoothie con espinaca, manzana verde, plátano y jengibre",
    instructions: ["Lavar espinaca", "Pelar y cortar frutas", "Licuar con agua o leche vegetal", "Servir inmediatamente"],
    prepTimeMinutes: 5,
    cookTimeMinutes: 0,
    servings: 1,
    difficulty: "easy",
    cuisine: "international",
    source: "ai-generated",
    tags: ["smoothie", "verde", "saludable", "desayuno"]
  },
  {
    title: "Hamburguesa Casera",
    description: "Jugosa hamburguesa de carne con vegetales frescos y papas fritas",
    instructions: ["Formar medallones de carne", "Cocinar a la plancha", "Tostar panes", "Armar con vegetales y salsas"],
    prepTimeMinutes: 20,
    cookTimeMinutes: 15,
    servings: 2,
    difficulty: "medium",
    cuisine: "american",
    source: "ai-generated",
    tags: ["hamburguesa", "carne", "casera", "comfort food"]
  },
  {
    title: "Sushi California Roll",
    description: "Clásico roll de sushi con cangrejo, aguacate y pepino",
    instructions: ["Preparar arroz de sushi", "Extender nori y arroz", "Agregar relleno", "Enrollar y cortar"],
    prepTimeMinutes: 45,
    cookTimeMinutes: 20,
    servings: 2,
    difficulty: "hard",
    cuisine: "japanese",
    source: "ai-generated",
    tags: ["sushi", "japonesa", "mariscos", "roll"]
  }
];

// Mock ingredients
const MOCK_INGREDIENTS = [
  { name: "Pollo", category: "carnes", unit: "g" },
  { name: "Limón", category: "frutas", unit: "un" },
  { name: "Pasta", category: "carbohidratos", unit: "g" },
  { name: "Huevos", category: "proteínas", unit: "un" },
  { name: "Queso Parmesano", category: "lácteos", unit: "g" },
  { name: "Panceta", category: "carnes", unit: "g" },
  { name: "Lechuga", category: "verduras", unit: "un" },
  { name: "Pan", category: "carbohidratos", unit: "rebanadas" },
  { name: "Pescado", category: "carnes", unit: "g" },
  { name: "Tortillas", category: "carbohidratos", unit: "un" },
  { name: "Aguacate", category: "frutas", unit: "un" },
  { name: "Arroz", category: "carbohidratos", unit: "g" },
  { name: "Hongos", category: "verduras", unit: "g" },
  { name: "Espinaca", category: "verduras", unit: "g" },
  { name: "Manzana", category: "frutas", unit: "un" },
  { name: "Plátano", category: "frutas", unit: "un" },
  { name: "Carne Molida", category: "carnes", unit: "g" },
  { name: "Tomate", category: "verduras", unit: "un" },
  { name: "Cebolla", category: "verduras", unit: "un" },
  { name: "Ajo", category: "condimentos", unit: "dientes" }
];

class MockDataSeeder {
  async seedDatabase() {
    console.log('🌱 Starting mock data seeding...');

    try {
      // Clear existing data
      await this.clearDatabase();
      
      // Create or get test user
      console.log('👤 Creating test user...');
      const user = await this.createTestUser();
      
      // Seed ingredients
      console.log('📦 Seeding ingredients...');
      const ingredients = await this.seedIngredients();
      
      // Seed recipes
      console.log('🍳 Seeding recipes...');
      const recipes = await this.seedRecipes(ingredients);
      
      // Create sample meal plans
      console.log('📅 Creating sample meal plans...');
      await this.createSampleMealPlans(user, recipes);
      
      console.log('✅ Mock data seeding completed successfully!');
      console.log(`📊 Created ${ingredients.length} ingredients and ${recipes.length} recipes`);
      
    } catch (error: unknown) {
      console.error('❌ Error seeding database:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }

  private async createTestUser() {
    // Try to find existing test user
    let user = await prisma.user.findUnique({
      where: { email: 'test@example.com' }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Usuario de Prueba',
          onboardingCompleted: true
        }
      });
    }

    return user;
  }

  private async clearDatabase() {
    console.log('🧹 Clearing existing data...');
    
    await prisma.mealPlanEntry.deleteMany();
    await prisma.mealPlan.deleteMany();
    await prisma.nutritionInfo.deleteMany();
    await prisma.recipeIngredient.deleteMany();
    await prisma.recipe.deleteMany();
    await prisma.ingredient.deleteMany();
    
    console.log('✨ Database cleared');
  }

  private async seedIngredients() {
    const ingredients = [];
    
    for (const ingredient of MOCK_INGREDIENTS) {
      const created = await prisma.ingredient.create({
        data: {
          name: ingredient.name,
          category: ingredient.category,
          unit: ingredient.unit
        }
      });
      ingredients.push(created);
    }
    
    return ingredients;
  }

  private async seedRecipes(ingredients: any[]) {
    const recipes = [];
    
    for (const recipe of MOCK_RECIPES) {
      const created = await prisma.recipe.create({
        data: {
          title: recipe.title,
          description: recipe.description,
          instructions: recipe.instructions,
          prepTimeMinutes: recipe.prepTimeMinutes,
          cookTimeMinutes: recipe.cookTimeMinutes,
          servings: recipe.servings,
          difficulty: recipe.difficulty,
          cuisine: recipe.cuisine,
          source: recipe.source,
          tags: recipe.tags
        }
      });

      // Add nutrition info
      await prisma.nutritionInfo.create({
        data: {
          recipeId: created.id,
          calories: Math.floor(Math.random() * 600) + 150,
          protein: Math.floor(Math.random() * 40) + 10,
          carbs: Math.floor(Math.random() * 60) + 10,
          fat: Math.floor(Math.random() * 30) + 5,
          fiber: Math.floor(Math.random() * 15) + 2,
          sugar: Math.floor(Math.random() * 20) + 2,
          sodium: Math.floor(Math.random() * 1500) + 200
        }
      });

      // Add random ingredients to each recipe
      const recipeIngredients = this.getRandomIngredients(ingredients, 4, 8);
      for (const ingredient of recipeIngredients) {
        await prisma.recipeIngredient.create({
          data: {
            recipeId: created.id,
            ingredientId: ingredient.id,
            quantity: Math.floor(Math.random() * 500) + 50,
            unit: ingredient.unit,
            notes: Math.random() > 0.7 ? "al gusto" : null
          }
        });
      }

      recipes.push(created);
    }
    
    return recipes;
  }

  private async createSampleMealPlans(user: any, recipes: any[]) {
    const today = new Date();
    const daysToCreate = 7; // Create for next week
    
    for (let i = 0; i < daysToCreate; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Create or get meal plan for this date
      const mealPlan = await prisma.mealPlan.upsert({
        where: {
          userId_date: {
            userId: user.id,
            date: date
          }
        },
        create: {
          userId: user.id,
          date: date
        },
        update: {}
      });
      
      // Create 2-4 meals per day randomly
      const mealsPerDay = Math.floor(Math.random() * 3) + 2;
      const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
      const selectedMealTypes = this.shuffleArray([...mealTypes]).slice(0, mealsPerDay);
      
      for (let order = 0; order < selectedMealTypes.length; order++) {
        const mealType = selectedMealTypes[order];
        const randomRecipe = recipes[Math.floor(Math.random() * recipes.length)];
        
        await prisma.mealPlanEntry.create({
          data: {
            mealPlanId: mealPlan.id,
            recipeId: randomRecipe.id,
            mealType: mealType,
            servings: Math.floor(Math.random() * 3) + 1,
            notes: Math.random() > 0.7 ? "Comida deliciosa preparada en casa" : null,
            order: order
          }
        });
      }
    }
  }

  private getRandomIngredients(ingredients: any[], min: number, max: number) {
    const count = Math.floor(Math.random() * (max - min + 1)) + min;
    const shuffled = this.shuffleArray([...ingredients]);
    return shuffled.slice(0, count);
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting mock data seeding...');
  
  const seeder = new MockDataSeeder();
  
  try {
    await seeder.seedDatabase();
    console.log('✨ Mock data seeding completed successfully!');
  } catch (error: unknown) {
    console.error('💥 Mock data seeding failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

export { MockDataSeeder };