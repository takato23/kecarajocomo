import { NextRequest, NextResponse } from 'next/server';

import { NutritionAnalysisRequest, NutritionAnalysisResponse } from '../../types';

// This is a simplified nutrition calculation
// In production, you would use a proper nutrition API like USDA or Edamam
export async function POST(request: NextRequest) {
  try {
    const body: NutritionAnalysisRequest = await request.json();
    
    // Basic nutrition database (per 100g)
    const nutritionDb: Record<string, any> = {
      // Proteins
      'chicken breast': { calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, sodium: 74 },
      'beef': { calories: 250, protein: 26, carbs: 0, fat: 15, fiber: 0, sodium: 72 },
      'salmon': { calories: 208, protein: 20, carbs: 0, fat: 13, fiber: 0, sodium: 59 },
      'eggs': { calories: 155, protein: 13, carbs: 1.1, fat: 11, fiber: 0, sodium: 124 },
      'tofu': { calories: 76, protein: 8, carbs: 1.9, fat: 4.8, fiber: 0.3, sodium: 7 },
      
      // Grains
      'rice': { calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4, sodium: 1 },
      'pasta': { calories: 131, protein: 5, carbs: 25, fat: 1.1, fiber: 1.8, sodium: 6 },
      'bread': { calories: 265, protein: 9, carbs: 49, fat: 3.2, fiber: 2.7, sodium: 491 },
      'quinoa': { calories: 120, protein: 4.4, carbs: 21, fat: 1.9, fiber: 2.8, sodium: 7 },
      
      // Vegetables
      'tomato': { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2, sodium: 5 },
      'onion': { calories: 40, protein: 1.1, carbs: 9.3, fat: 0.1, fiber: 1.7, sodium: 4 },
      'garlic': { calories: 149, protein: 6.4, carbs: 33, fat: 0.5, fiber: 2.1, sodium: 17 },
      'spinach': { calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2, sodium: 79 },
      'broccoli': { calories: 34, protein: 2.8, carbs: 7, fat: 0.4, fiber: 2.6, sodium: 33 },
      
      // Fats & Oils
      'olive oil': { calories: 884, protein: 0, carbs: 0, fat: 100, fiber: 0, sodium: 2 },
      'butter': { calories: 717, protein: 0.9, carbs: 0.1, fat: 81, fiber: 0, sodium: 643 },
      
      // Default
      'default': { calories: 100, protein: 2, carbs: 20, fat: 2, fiber: 1, sodium: 50 },
    };
    
    // Calculate total nutrition
    const totalNutrition = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      saturated_fat: 0,
      trans_fat: 0,
      cholesterol: 0,
      sodium: 0,
      fiber: 0,
      sugar: 0,
      vitamin_a: 0,
      vitamin_c: 0,
      calcium: 0,
      iron: 0,
    };
    
    body.ingredients.forEach(ingredient => {
      const normalizedName = ingredient.name.toLowerCase();
      let nutritionData = nutritionDb.default;
      
      // Find best match in database
      for (const [key, value] of Object.entries(nutritionDb)) {
        if (normalizedName.includes(key) || key.includes(normalizedName)) {
          nutritionData = value;
          break;
        }
      }
      
      // Convert quantity to grams (simplified)
      let grams = 100; // default
      if (ingredient.unit === 'g') {
        grams = ingredient.quantity;
      } else if (ingredient.unit === 'kg') {
        grams = ingredient.quantity * 1000;
      } else if (ingredient.unit === 'cup') {
        grams = ingredient.quantity * 250; // approximate
      } else if (ingredient.unit === 'tbsp') {
        grams = ingredient.quantity * 15;
      } else if (ingredient.unit === 'tsp') {
        grams = ingredient.quantity * 5;
      }
      
      // Calculate nutrition based on quantity
      const multiplier = grams / 100;
      totalNutrition.calories += (nutritionData.calories || 0) * multiplier;
      totalNutrition.protein += (nutritionData.protein || 0) * multiplier;
      totalNutrition.carbs += (nutritionData.carbs || 0) * multiplier;
      totalNutrition.fat += (nutritionData.fat || 0) * multiplier;
      totalNutrition.fiber += (nutritionData.fiber || 0) * multiplier;
      totalNutrition.sodium += (nutritionData.sodium || 0) * multiplier;
      
      // Estimate other nutrients (simplified)
      totalNutrition.saturated_fat += (nutritionData.fat || 0) * 0.3 * multiplier;
      totalNutrition.sugar += (nutritionData.carbs || 0) * 0.1 * multiplier;
    });
    
    // Calculate per serving
    const perServing = {
      calories: Math.round(totalNutrition.calories / body.servings),
      protein: Math.round(totalNutrition.protein / body.servings * 10) / 10,
      carbs: Math.round(totalNutrition.carbs / body.servings * 10) / 10,
      fat: Math.round(totalNutrition.fat / body.servings * 10) / 10,
      saturated_fat: Math.round(totalNutrition.saturated_fat / body.servings * 10) / 10,
      trans_fat: 0,
      cholesterol: Math.round(totalNutrition.cholesterol / body.servings),
      sodium: Math.round(totalNutrition.sodium / body.servings),
      fiber: Math.round(totalNutrition.fiber / body.servings * 10) / 10,
      sugar: Math.round(totalNutrition.sugar / body.servings * 10) / 10,
      vitamin_a: 0,
      vitamin_c: 0,
      calcium: 0,
      iron: 0,
    };
    
    // Generate warnings
    const warnings: string[] = [];
    if (perServing.calories > 800) warnings.push('High in calories');
    if (perServing.sodium > 600) warnings.push('High in sodium');
    if (perServing.saturated_fat > 7) warnings.push('High in saturated fat');
    if (perServing.sugar > 15) warnings.push('High in sugar');
    
    // Calculate health score (0-100)
    let healthScore = 100;
    if (perServing.calories > 600) healthScore -= 10;
    if (perServing.sodium > 500) healthScore -= 15;
    if (perServing.saturated_fat > 5) healthScore -= 10;
    if (perServing.sugar > 10) healthScore -= 10;
    if (perServing.fiber < 3) healthScore -= 5;
    if (perServing.protein < 10) healthScore -= 5;
    healthScore = Math.max(0, healthScore);
    
    const response: NutritionAnalysisResponse = {
      nutritional_info: perServing,
      warnings,
      health_score: healthScore,
    };
    
    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error('Error analyzing nutrition:', error);
    return NextResponse.json(
      { error: 'Failed to analyze nutrition' },
      { status: 500 }
    );
  }
}