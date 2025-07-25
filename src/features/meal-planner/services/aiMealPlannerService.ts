import { GoogleGenerativeAI } from '@google/generative-ai';
import { 
  Recipe, 
  AIGenerationParams, 
  AIGenerationResult,
  WeeklyPlan,
  MealPlan,
  PlannedMeal,
  MealType,
  NutritionalInfo
} from '../types';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

export class AIMealPlannerService {
  private model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  async generateRecipe(params: AIGenerationParams): Promise<AIGenerationResult> {
    const prompt = this.buildRecipePrompt(params);
    
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return this.parseRecipeResponse(text);
    } catch (error) {
      console.error('Error generating recipe:', error);
      throw new Error('Failed to generate recipe');
    }
  }

  async generateWeeklyMealPlan(
    params: AIGenerationParams,
    startDate: Date
  ): Promise<WeeklyPlan> {
    const prompt = this.buildWeeklyPlanPrompt(params, startDate);
    
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return this.parseWeeklyPlanResponse(text, startDate);
    } catch (error) {
      console.error('Error generating weekly meal plan:', error);
      throw new Error('Failed to generate weekly meal plan');
    }
  }

  async suggestMealCustomizations(
    recipe: Recipe,
    params: AIGenerationParams
  ): Promise<string[]> {
    const prompt = `
      Given this recipe: ${JSON.stringify(recipe)}
      And these preferences: ${JSON.stringify(params.preferences)}
      
      Suggest customizations to better match the user's preferences.
      Consider dietary restrictions, allergies, and nutritional goals.
      
      Return suggestions as a JSON array of strings.
    `;
    
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return JSON.parse(text);
    } catch (error) {
      console.error('Error suggesting customizations:', error);
      return [];
    }
  }

  async analyzeNutritionalBalance(meals: PlannedMeal[]): Promise<string> {
    const prompt = `
      Analyze the nutritional balance of these meals: ${JSON.stringify(meals)}
      
      Provide insights on:
      1. Overall nutritional balance
      2. Macro distribution
      3. Potential deficiencies
      4. Suggestions for improvement
      
      Return as a markdown formatted analysis.
    `;
    
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error analyzing nutrition:', error);
      return 'Unable to analyze nutritional balance at this time.';
    }
  }

  private buildRecipePrompt(params: AIGenerationParams): string {
    const { preferences, mealType, specificRequirements, pantryItems } = params;
    
    let prompt = `Generate a recipe with the following requirements:
    
    User Preferences:
    - Dietary Restrictions: ${preferences.dietaryRestrictions.join(', ') || 'None'}
    - Allergies: ${preferences.allergies.join(', ') || 'None'}
    - Disliked Ingredients: ${preferences.dislikedIngredients.join(', ') || 'None'}
    - Preferred Cuisines: ${preferences.preferredCuisines.join(', ') || 'Any'}
    - Cooking Skill Level: ${preferences.cookingSkillLevel}
    - Serving Size: ${preferences.servingSize}
    `;

    if (mealType) {
      prompt += `\nMeal Type: ${mealType}`;
    }

    if (specificRequirements) {
      prompt += `\nSpecific Requirements: ${specificRequirements}`;
    }

    if (pantryItems && pantryItems.length > 0) {
      prompt += `\nAvailable Pantry Items: ${pantryItems.map(i => i.name).join(', ')}`;
    }

    if (params.maxPrepTime) {
      prompt += `\nMaximum Preparation Time: ${params.maxPrepTime} minutes`;
    }

    if (params.includeIngredients?.length) {
      prompt += `\nMust Include: ${params.includeIngredients.join(', ')}`;
    }

    if (params.excludeIngredients?.length) {
      prompt += `\nMust Exclude: ${params.excludeIngredients.join(', ')}`;
    }

    prompt += `
    
    Return the recipe in the following JSON format:
    {
      "name": "Recipe Name",
      "description": "Brief description",
      "ingredients": [
        {
          "id": "unique-id",
          "name": "Ingredient name",
          "amount": 1,
          "unit": "cup",
          "category": "produce"
        }
      ],
      "instructions": ["Step 1", "Step 2"],
      "prepTime": 15,
      "cookTime": 30,
      "servings": 4,
      "difficulty": "easy|medium|hard",
      "category": "main course",
      "tags": ["tag1", "tag2"],
      "nutritionalInfo": {
        "calories": 350,
        "protein": 25,
        "carbs": 30,
        "fat": 15,
        "fiber": 5,
        "sugar": 5,
        "sodium": 500
      },
      "reasoning": "Why this recipe was chosen",
      "substitutionSuggestions": ["suggestion1", "suggestion2"]
    }`;

    return prompt;
  }

  private buildWeeklyPlanPrompt(params: AIGenerationParams, startDate: Date): string {
    const { preferences } = params;
    
    return `Generate a 7-day meal plan starting from ${startDate.toDateString()}.
    
    User Preferences:
    - Dietary Restrictions: ${preferences.dietaryRestrictions.join(', ') || 'None'}
    - Allergies: ${preferences.allergies.join(', ') || 'None'}
    - Disliked Ingredients: ${preferences.dislikedIngredients.join(', ') || 'None'}
    - Preferred Cuisines: ${preferences.preferredCuisines.join(', ') || 'Any'}
    - Cooking Skill Level: ${preferences.cookingSkillLevel}
    - Serving Size: ${preferences.servingSize}
    
    Requirements:
    1. Include breakfast, lunch, and dinner for each day
    2. Ensure variety across the week
    3. Consider prep time and cooking complexity
    4. Balance nutrition throughout the week
    5. Minimize ingredient waste by reusing ingredients
    
    Return the meal plan as a JSON array of daily plans, where each day includes:
    {
      "date": "2024-01-01",
      "meals": [
        {
          "mealType": "breakfast|lunch|dinner",
          "recipe": { ... full recipe object ... }
        }
      ]
    }`;
  }

  private parseRecipeResponse(text: string): AIGenerationResult {
    try {
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const data = JSON.parse(jsonMatch[0]);
      
      const recipe: Recipe = {
        id: `recipe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: data.name,
        description: data.description,
        ingredients: data.ingredients.map((ing: any, index: number) => ({
          id: ing.id || `ing-${index}`,
          name: ing.name,
          amount: ing.amount,
          unit: ing.unit,
          category: ing.category,
        })),
        instructions: data.instructions,
        prepTime: data.prepTime,
        cookTime: data.cookTime,
        servings: data.servings,
        difficulty: data.difficulty,
        category: data.category,
        tags: data.tags,
        nutritionalInfo: data.nutritionalInfo,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return {
        recipe,
        reasoning: data.reasoning,
        substitutionSuggestions: data.substitutionSuggestions?.map((s: string) => ({
          ingredientId: '',
          action: 'substitute' as const,
          substituteIngredient: { id: '', name: s, amount: 0, unit: '' },
        })),
      };
    } catch (error) {
      console.error('Error parsing recipe response:', error);
      throw new Error('Failed to parse recipe response');
    }
  }

  private parseWeeklyPlanResponse(text: string, startDate: Date): WeeklyPlan {
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }

      const dailyPlansData = JSON.parse(jsonMatch[0]);
      
      const dailyPlans: MealPlan[] = dailyPlansData.map((dayData: any, index: number) => {
        const date = new Date(startDate);
        date.setDate(date.getDate() + index);

        const meals: PlannedMeal[] = dayData.meals.map((mealData: any) => ({
          id: `meal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          recipeId: `recipe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          recipe: {
            ...mealData.recipe,
            id: `recipe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          mealType: mealData.mealType as MealType,
          servings: mealData.recipe.servings || 2,
        }));

        return {
          id: `plan-${Date.now()}-${index}`,
          userId: 'current-user',
          date,
          meals,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      });

      const weekEnd = new Date(startDate);
      weekEnd.setDate(weekEnd.getDate() + 6);

      return {
        id: `week-${Date.now()}`,
        userId: 'current-user',
        weekStart: startDate,
        weekEnd,
        dailyPlans,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error('Error parsing weekly plan response:', error);
      throw new Error('Failed to parse weekly plan response');
    }
  }
}

export const aiMealPlannerService = new AIMealPlannerService();