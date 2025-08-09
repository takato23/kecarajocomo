/**
 * Test utility for Gemini Service
 * Run this to verify the integration is working properly
 */

import { getGeminiService } from '../geminiService';
import { UserPreferences, PlanningConstraints } from '../../types/mealPlanning';

// Test configuration
const testPreferences: UserPreferences = {
  userId: 'test-user-123',
  dietaryRestrictions: ['vegetarian'],
  allergies: ['nuts'],
  favoriteCuisines: ['italian', 'mexican'],
  cookingSkillLevel: 'intermediate',
  householdSize: 2,
  weeklyBudget: 150,
  preferredMealTypes: ['breakfast', 'lunch', 'dinner'],
  avoidIngredients: ['mushrooms'],
  nutritionalGoals: {
    calories: 2000,
    protein: 60,
    carbs: 250,
    fat: 65
  },
  planningStrategy: 'nutrition-focused',
  maxPrepTimePerMeal: 45,
  batchCookingPreference: true,
  leftoverTolerance: 0.7
};

const testConstraints: PlanningConstraints = {
  startDate: new Date(),
  endDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 7 days from now
  mealTypes: ['breakfast', 'lunch', 'dinner'],
  servings: 2,
  maxPrepTime: 60,
  budgetLimit: 150,
  pantryItems: ['rice', 'pasta', 'olive oil', 'garlic', 'onions'],
  excludeRecipes: [],
  preferredShoppingDays: [0, 3], // Sunday and Wednesday
  maxShoppingTrips: 2
};

const testPantryItems = [
  { name: 'rice', quantity: 2, unit: 'kg', category: 'grains' },
  { name: 'pasta', quantity: 1, unit: 'kg', category: 'grains' },
  { name: 'olive oil', quantity: 500, unit: 'ml', category: 'oils' },
  { name: 'garlic', quantity: 5, unit: 'cloves', category: 'produce' },
  { name: 'onions', quantity: 3, unit: 'units', category: 'produce' },
  { name: 'canned tomatoes', quantity: 4, unit: 'cans', category: 'pantry' },
  { name: 'black beans', quantity: 2, unit: 'cans', category: 'pantry' },
  { name: 'lentils', quantity: 500, unit: 'g', category: 'legumes' }
];

/**
 * Test meal plan generation
 */
export async function testMealPlanGeneration() {
  console.log('🧪 Testing Meal Plan Generation...\n');
  
  try {
    const geminiService = getGeminiService();
    
    console.log('📋 Test Configuration:');
    console.log('- Dietary Restrictions:', testPreferences.dietaryRestrictions);
    console.log('- Household Size:', testPreferences.householdSize);
    console.log('- Budget:', testPreferences.weeklyBudget);
    console.log('- Duration:', '7 days\n');
    
    const startTime = Date.now();
    
    const result = await geminiService.generateMealPlan(
      testPreferences,
      testConstraints,
      {
        pantryItems: testPantryItems,
        timeout: 30000
      }
    );
    
    const duration = Date.now() - startTime;
    
    console.log('✅ Meal Plan Generated Successfully!');
    console.log(`⏱️  Duration: ${duration}ms\n`);
    
    console.log('📊 Results:');
    console.log('- Days Planned:', result.daily_plans.length);
    console.log('- Total Cost:', `$${result.optimization_summary.total_estimated_cost}`);
    console.log('- Total Prep Time:', `${result.optimization_summary.prep_time_total_minutes} minutes`);
    console.log('- Variety Score:', result.optimization_summary.variety_score);
    console.log('- Shopping Items:', result.shopping_list_preview.length);
    
    console.log('\n🍽️  Sample Meals:');
    result.daily_plans.slice(0, 2).forEach((day, index) => {
      console.log(`\nDay ${day.day}:`);
      if (day.meals.breakfast) {
        console.log(`  Breakfast: ${day.meals.breakfast.name} (${day.meals.breakfast.prep_time}min prep)`);
      }
      if (day.meals.lunch) {
        console.log(`  Lunch: ${day.meals.lunch.name} (${day.meals.lunch.prep_time}min prep)`);
      }
      if (day.meals.dinner) {
        console.log(`  Dinner: ${day.meals.dinner.name} (${day.meals.dinner.prep_time}min prep)`);
      }
    });
    
    console.log('\n🥗 Nutritional Analysis:');
    console.log('- Average Daily Calories:', result.nutritional_analysis.average_daily_calories);
    console.log('- Protein:', `${result.nutritional_analysis.protein_grams}g`);
    console.log('- Carbs:', `${result.nutritional_analysis.carbs_grams}g`);
    console.log('- Fat:', `${result.nutritional_analysis.fat_grams}g`);
    
    return true;
  } catch (error) {
    console.error('❌ Test Failed:', error);
    return false;
  }
}

/**
 * Test meal regeneration
 */
export async function testMealRegeneration() {
  console.log('\n🧪 Testing Meal Regeneration...\n');
  
  try {
    const geminiService = getGeminiService();
    
    const meal = await geminiService.regenerateMeal(
      'dinner',
      testPreferences,
      testConstraints,
      {
        avoidRecipes: ['Pasta Primavera', 'Veggie Stir Fry']
      }
    );
    
    console.log('✅ Meal Regenerated Successfully!');
    console.log('\n🍽️  New Dinner Recipe:');
    console.log('- Name:', meal.name);
    console.log('- Difficulty:', meal.difficulty);
    console.log('- Prep Time:', `${meal.prep_time} minutes`);
    console.log('- Cook Time:', `${meal.cook_time} minutes`);
    console.log('- Servings:', meal.servings);
    console.log('- Ingredients:', meal.ingredients.join(', '));
    
    if (meal.nutrition) {
      console.log('\n📊 Nutrition:');
      console.log('- Calories:', meal.nutrition.calories);
      console.log('- Protein:', `${meal.nutrition.protein}g`);
      console.log('- Carbs:', `${meal.nutrition.carbs}g`);
      console.log('- Fat:', `${meal.nutrition.fat}g`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Test Failed:', error);
    return false;
  }
}

/**
 * Test pantry recipe suggestions
 */
export async function testPantrySuggestions() {
  console.log('\n🧪 Testing Pantry Recipe Suggestions...\n');
  
  try {
    const geminiService = getGeminiService();
    
    const recipes = await geminiService.suggestFromPantry(
      testPantryItems,
      testPreferences,
      {
        mealTypes: ['lunch', 'dinner']
      }
    );
    
    console.log('✅ Pantry Recipes Suggested Successfully!');
    console.log(`\n📚 Found ${recipes.length} recipes using pantry items:\n`);
    
    recipes.forEach((recipe, index) => {
      console.log(`${index + 1}. ${recipe.name}`);
      console.log(`   - Difficulty: ${recipe.difficulty}`);
      console.log(`   - Total Time: ${recipe.prep_time + recipe.cook_time} minutes`);
      console.log(`   - Main Ingredients: ${recipe.ingredients.slice(0, 3).join(', ')}...`);
    });
    
    return true;
  } catch (error) {
    console.error('❌ Test Failed:', error);
    return false;
  }
}

/**
 * Run all tests
 */
export async function runAllTests() {
  console.log('🚀 Starting Gemini Service Tests\n');
  console.log('================================\n');
  
  const results = {
    mealPlan: false,
    regeneration: false,
    pantry: false
  };
  
  // Test meal plan generation
  results.mealPlan = await testMealPlanGeneration();
  
  // Small delay between tests
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test meal regeneration
  results.regeneration = await testMealRegeneration();
  
  // Small delay between tests
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test pantry suggestions
  results.pantry = await testPantrySuggestions();
  
  console.log('\n================================');
  console.log('📊 Test Results Summary:\n');
  console.log(`Meal Plan Generation: ${results.mealPlan ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Meal Regeneration: ${results.regeneration ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Pantry Suggestions: ${results.pantry ? '✅ PASSED' : '❌ FAILED'}`);
  
  const allPassed = Object.values(results).every(r => r);
  console.log(`\nOverall: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  return allPassed;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}