import { AIRecipeRequest, AIRecipeResponse } from '../types';

export async function generateRecipeWithAI(request: AIRecipeRequest): Promise<AIRecipeResponse> {
  const endpoint = request.provider === 'claude' 
    ? '/api/recipes/generate/claude'
    : '/api/recipes/generate/gemini';

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Failed to generate recipe: ${response.statusText}`);
  }

  const data: AIRecipeResponse = await response.json();
  
  // Ensure all required fields are present
  if (!data.recipe) {
    throw new Error('Invalid response: missing recipe data');
  }

  // Add default values for any missing fields
  data.recipe = {
    ...data.recipe,
    meal_types: data.recipe.meal_types || [],
    dietary_tags: data.recipe.dietary_tags || [],
    ingredients: data.recipe.ingredients || [],
    instructions: data.recipe.instructions || [],
    nutritional_info: data.recipe.nutritional_info || {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
    },
  };

  return data;
}

export function estimateNutrition(ingredients: any[]): any {
  // Simple nutrition estimation based on common ingredients
  // In a real app, this would use a nutrition API
  
  const nutritionEstimate = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0,
  };

  // This is a simplified example - in production, use a proper nutrition database
  const nutritionDatabase: Record<string, any> = {
    chicken: { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
    rice: { calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
    tomato: { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
    olive_oil: { calories: 119, protein: 0, carbs: 0, fat: 13.5 },
    // Add more ingredients as needed
  };

  ingredients.forEach(ingredient => {
    const ingredientName = ingredient.name.toLowerCase();
    
    // Try to find a match in our simple database
    Object.keys(nutritionDatabase).forEach(key => {
      if (ingredientName.includes(key)) {
        const nutrition = nutritionDatabase[key];
        const multiplier = ingredient.quantity || 1;
        
        nutritionEstimate.calories += nutrition.calories * multiplier;
        nutritionEstimate.protein += nutrition.protein * multiplier;
        nutritionEstimate.carbs += nutrition.carbs * multiplier;
        nutritionEstimate.fat += nutrition.fat * multiplier;
      }
    });
  });

  return nutritionEstimate;
}