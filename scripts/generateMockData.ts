/**
 * Generate Mock Data - Creates JSON files with sample data for development
 * This creates data files that can be loaded directly into the stores
 */

import fs from 'fs/promises';
import path from 'path';

// Mock recipes data matching the Prisma schema
const MOCK_RECIPES = [
  {
    id: 'recipe-1',
    title: "Pollo al Limón",
    description: "Jugoso pollo al horno con hierbas y limón fresco, perfecto para una cena familiar",
    instructions: ["Precalentar horno a 180°C", "Sazonar el pollo con sal, pimienta y hierbas", "Hornear por 45 minutos", "Servir caliente"],
    prepTimeMinutes: 15,
    cookTimeMinutes: 45,
    servings: 4,
    difficulty: "medium",
    cuisine: "mediterranean",
    source: "ai-generated",
    tags: ["pollo", "limón", "fácil", "saludable"],
    imageUrl: null,
    videoUrl: null,
    isPublic: false,
    aiPrompt: null,
    authorId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    averageRating: 4.5,
    totalRatings: 12,
    totalFavorites: 8
  },
  {
    id: 'recipe-2',
    title: "Pasta Carbonara",
    description: "Clásica pasta italiana con panceta, huevo y queso parmesano",
    instructions: ["Hervir pasta al dente", "Freír panceta hasta dorar", "Mezclar huevos con queso", "Combinar todo fuera del fuego"],
    prepTimeMinutes: 10,
    cookTimeMinutes: 15,
    servings: 2,
    difficulty: "medium",
    cuisine: "italian",
    source: "ai-generated",
    tags: ["pasta", "italiana", "cremosa", "rápida"],
    imageUrl: null,
    videoUrl: null,
    isPublic: false,
    aiPrompt: null,
    authorId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    averageRating: 4.8,
    totalRatings: 24,
    totalFavorites: 18
  },
  {
    id: 'recipe-3',
    title: "Ensalada César",
    description: "Fresca ensalada con lechuga romana, crutones caseros y aderezo césar",
    instructions: ["Lavar y cortar lechuga", "Preparar aderezo césar", "Tostar pan para crutones", "Mezclar y servir"],
    prepTimeMinutes: 20,
    cookTimeMinutes: 0,
    servings: 2,
    difficulty: "easy",
    cuisine: "american",
    source: "ai-generated",
    tags: ["ensalada", "fresca", "sin cocción", "vegetariana"],
    imageUrl: null,
    videoUrl: null,
    isPublic: false,
    aiPrompt: null,
    authorId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    averageRating: 4.2,
    totalRatings: 8,
    totalFavorites: 5
  },
  {
    id: 'recipe-4',
    title: "Tacos de Pescado",
    description: "Deliciosos tacos con pescado a la plancha, salsa fresca y aguacate",
    instructions: ["Sazonar y cocinar pescado", "Preparar salsa pico de gallo", "Calentar tortillas", "Armar tacos con todos los ingredientes"],
    prepTimeMinutes: 25,
    cookTimeMinutes: 10,
    servings: 3,
    difficulty: "easy",
    cuisine: "mexican",
    source: "ai-generated",
    tags: ["tacos", "pescado", "mexicana", "saludable"],
    imageUrl: null,
    videoUrl: null,
    isPublic: false,
    aiPrompt: null,
    authorId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    averageRating: 4.6,
    totalRatings: 15,
    totalFavorites: 11
  },
  {
    id: 'recipe-5',
    title: "Risotto de Hongos",
    description: "Cremoso risotto italiano con hongos mixtos y parmesano",
    instructions: ["Saltear hongos y reservar", "Sofreír cebolla y arroz", "Agregar caldo de a poco", "Terminar con hongos y queso"],
    prepTimeMinutes: 15,
    cookTimeMinutes: 30,
    servings: 4,
    difficulty: "hard",
    cuisine: "italian",
    source: "ai-generated",
    tags: ["risotto", "hongos", "cremoso", "vegetariana"],
    imageUrl: null,
    videoUrl: null,
    isPublic: false,
    aiPrompt: null,
    authorId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    averageRating: 4.9,
    totalRatings: 31,
    totalFavorites: 25
  },
  {
    id: 'recipe-6',
    title: "Smoothie Verde",
    description: "Nutritivo smoothie con espinaca, manzana verde, plátano y jengibre",
    instructions: ["Lavar espinaca", "Pelar y cortar frutas", "Licuar con agua o leche vegetal", "Servir inmediatamente"],
    prepTimeMinutes: 5,
    cookTimeMinutes: 0,
    servings: 1,
    difficulty: "easy",
    cuisine: "international",
    source: "ai-generated",
    tags: ["smoothie", "verde", "saludable", "desayuno"],
    imageUrl: null,
    videoUrl: null,
    isPublic: false,
    aiPrompt: null,
    authorId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    averageRating: 4.3,
    totalRatings: 7,
    totalFavorites: 4
  },
  {
    id: 'recipe-7',
    title: "Hamburguesa Casera",
    description: "Jugosa hamburguesa de carne con vegetales frescos y papas fritas",
    instructions: ["Formar medallones de carne", "Cocinar a la plancha", "Tostar panes", "Armar con vegetales y salsas"],
    prepTimeMinutes: 20,
    cookTimeMinutes: 15,
    servings: 2,
    difficulty: "medium",
    cuisine: "american",
    source: "ai-generated",
    tags: ["hamburguesa", "carne", "casera", "comfort food"],
    imageUrl: null,
    videoUrl: null,
    isPublic: false,
    aiPrompt: null,
    authorId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    averageRating: 4.7,
    totalRatings: 19,
    totalFavorites: 14
  },
  {
    id: 'recipe-8',
    title: "Sushi California Roll",
    description: "Clásico roll de sushi con cangrejo, aguacate y pepino",
    instructions: ["Preparar arroz de sushi", "Extender nori y arroz", "Agregar relleno", "Enrollar y cortar"],
    prepTimeMinutes: 45,
    cookTimeMinutes: 20,
    servings: 2,
    difficulty: "hard",
    cuisine: "japanese",
    source: "ai-generated",
    tags: ["sushi", "japonesa", "mariscos", "roll"],
    imageUrl: null,
    videoUrl: null,
    isPublic: false,
    aiPrompt: null,
    authorId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    averageRating: 4.4,
    totalRatings: 11,
    totalFavorites: 9
  }
];

// Mock ingredients
const MOCK_INGREDIENTS = [
  { id: 'ing-1', name: "Pollo", category: "carnes", unit: "g" },
  { id: 'ing-2', name: "Limón", category: "frutas", unit: "un" },
  { id: 'ing-3', name: "Pasta", category: "carbohidratos", unit: "g" },
  { id: 'ing-4', name: "Huevos", category: "proteínas", unit: "un" },
  { id: 'ing-5', name: "Queso Parmesano", category: "lácteos", unit: "g" },
  { id: 'ing-6', name: "Panceta", category: "carnes", unit: "g" },
  { id: 'ing-7', name: "Lechuga", category: "verduras", unit: "un" },
  { id: 'ing-8', name: "Pan", category: "carbohidratos", unit: "rebanadas" },
  { id: 'ing-9', name: "Pescado", category: "carnes", unit: "g" },
  { id: 'ing-10', name: "Tortillas", category: "carbohidratos", unit: "un" },
  { id: 'ing-11', name: "Aguacate", category: "frutas", unit: "un" },
  { id: 'ing-12', name: "Arroz", category: "carbohidratos", unit: "g" },
  { id: 'ing-13', name: "Hongos", category: "verduras", unit: "g" },
  { id: 'ing-14', name: "Espinaca", category: "verduras", unit: "g" },
  { id: 'ing-15', name: "Manzana", category: "frutas", unit: "un" },
  { id: 'ing-16', name: "Plátano", category: "frutas", unit: "un" },
  { id: 'ing-17', name: "Carne Molida", category: "carnes", unit: "g" },
  { id: 'ing-18', name: "Tomate", category: "verduras", unit: "un" },
  { id: 'ing-19', name: "Cebolla", category: "verduras", unit: "un" },
  { id: 'ing-20', name: "Ajo", category: "condimentos", unit: "dientes" }
];

// Generate meal plan entries for the current week
function generateMealPlanEntries() {
  const entries = [];
  const today = new Date();
  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateString = date.toISOString().split('T')[0];
    
    // Create 2-4 meals per day randomly
    const mealsPerDay = Math.floor(Math.random() * 3) + 2;
    const selectedMealTypes = shuffleArray([...mealTypes]).slice(0, mealsPerDay);
    
    selectedMealTypes.forEach((mealType, index) => {
      const randomRecipe = MOCK_RECIPES[Math.floor(Math.random() * MOCK_RECIPES.length)];
      
      entries.push({
        id: `meal-${i}-${index}`,
        plan_date: dateString,
        meal_type: mealType,
        recipe_id: randomRecipe.id,
        recipe: randomRecipe,
        servings: Math.floor(Math.random() * 3) + 1,
        notes: Math.random() > 0.7 ? "Comida deliciosa preparada en casa" : null,
        custom_meal_name: null
      });
    });
  }
  
  return entries;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

class MockDataGenerator {
  async generateMockData() {
    console.log('🌱 Generating mock data files...');

    try {
      // Create data directory
      const dataDir = path.join(process.cwd(), 'data');
      await fs.mkdir(dataDir, { recursive: true });
      
      // Generate meal plan entries
      console.log('📅 Generating meal plan entries...');
      const mealPlanEntries = generateMealPlanEntries();
      
      // Save all data files
      console.log('💾 Saving data files...');
      
      await fs.writeFile(
        path.join(dataDir, 'mock-recipes.json'),
        JSON.stringify(MOCK_RECIPES, null, 2)
      );
      
      await fs.writeFile(
        path.join(dataDir, 'mock-ingredients.json'),
        JSON.stringify(MOCK_INGREDIENTS, null, 2)
      );
      
      await fs.writeFile(
        path.join(dataDir, 'mock-meal-plans.json'),
        JSON.stringify(mealPlanEntries, null, 2)
      );
      
      // Generate summary
      const summary = {
        generated_at: new Date().toISOString(),
        recipes_count: MOCK_RECIPES.length,
        ingredients_count: MOCK_INGREDIENTS.length,
        meal_plans_count: mealPlanEntries.length,
        week_start: new Date().toISOString().split('T')[0],
        week_end: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      };
      
      await fs.writeFile(
        path.join(dataDir, 'mock-data-summary.json'),
        JSON.stringify(summary, null, 2)
      );
      
      console.log('✅ Mock data generation completed successfully!');
      console.log(`📊 Generated ${MOCK_RECIPES.length} recipes, ${MOCK_INGREDIENTS.length} ingredients, and ${mealPlanEntries.length} meal plan entries`);
      console.log(`📁 Files saved in: ${dataDir}`);
      
    } catch (error: unknown) {
      console.error('❌ Error generating mock data:', error);
      throw error;
    }
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting mock data generation...');
  
  const generator = new MockDataGenerator();
  
  try {
    await generator.generateMockData();
    console.log('✨ Mock data generation completed successfully!');
  } catch (error: unknown) {
    console.error('💥 Mock data generation failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

export { MockDataGenerator };