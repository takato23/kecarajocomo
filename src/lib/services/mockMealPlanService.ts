/**
 * Mock Meal Plan Service for Testing
 * Provides fallback meal plans when API quota is exceeded
 */

import { GeminiMealPlanResponse } from './geminiService';

export class MockMealPlanService {
  static generateMockMealPlan(): GeminiMealPlanResponse {
    return {
      daily_plans: [
        {
          day: 1,
          meals: {
            breakfast: {
              name: "Mediterranean Scrambled Eggs",
              ingredients: ["eggs", "olive oil", "tomatoes", "feta cheese", "herbs"],
              prep_time: 5,
              cook_time: 10,
              servings: 2,
              difficulty: "easy",
              nutrition: {
                calories: 320,
                protein: 18,
                carbs: 8,
                fat: 24
              },
              instructions: [
                "Heat olive oil in a pan",
                "Scramble eggs with diced tomatoes",
                "Add crumbled feta and fresh herbs",
                "Serve hot"
              ]
            },
            lunch: {
              name: "Greek Salad with Chickpeas",
              ingredients: ["chickpeas", "cucumber", "tomatoes", "olives", "feta", "olive oil"],
              prep_time: 15,
              cook_time: 0,
              servings: 2,
              difficulty: "easy",
              nutrition: {
                calories: 380,
                protein: 15,
                carbs: 32,
                fat: 22
              },
              instructions: [
                "Chop vegetables",
                "Mix with chickpeas and olives",
                "Add feta and dress with olive oil",
                "Season with herbs"
              ]
            },
            dinner: {
              name: "Herb-Crusted Salmon with Vegetables",
              ingredients: ["salmon fillets", "herbs", "zucchini", "bell peppers", "olive oil"],
              prep_time: 10,
              cook_time: 20,
              servings: 2,
              difficulty: "medium",
              nutrition: {
                calories: 450,
                protein: 35,
                carbs: 12,
                fat: 28
              },
              instructions: [
                "Season salmon with herbs",
                "Roast vegetables with olive oil",
                "Bake salmon until flaky",
                "Serve together"
              ]
            }
          }
        },
        {
          day: 2,
          meals: {
            breakfast: {
              name: "Greek Yogurt with Honey and Nuts",
              ingredients: ["greek yogurt", "honey", "walnuts", "berries"],
              prep_time: 5,
              cook_time: 0,
              servings: 2,
              difficulty: "easy",
              nutrition: {
                calories: 280,
                protein: 15,
                carbs: 25,
                fat: 14
              },
              instructions: [
                "Serve yogurt in bowls",
                "Drizzle with honey",
                "Top with nuts and berries"
              ]
            },
            lunch: {
              name: "Mediterranean Quinoa Bowl",
              ingredients: ["quinoa", "cucumber", "tomatoes", "olives", "hummus"],
              prep_time: 10,
              cook_time: 15,
              servings: 2,
              difficulty: "easy",
              nutrition: {
                calories: 420,
                protein: 16,
                carbs: 58,
                fat: 12
              },
              instructions: [
                "Cook quinoa according to package",
                "Chop vegetables",
                "Combine with olives and hummus",
                "Mix and serve"
              ]
            },
            dinner: {
              name: "Grilled Chicken with Lemon and Herbs",
              ingredients: ["chicken breast", "lemon", "rosemary", "thyme", "olive oil"],
              prep_time: 15,
              cook_time: 25,
              servings: 2,
              difficulty: "medium",
              nutrition: {
                calories: 350,
                protein: 42,
                carbs: 4,
                fat: 16
              },
              instructions: [
                "Marinate chicken with lemon and herbs",
                "Grill until cooked through",
                "Rest for 5 minutes",
                "Slice and serve"
              ]
            }
          }
        }
      ],
      shopping_list_preview: [
        { item: "eggs", quantity: "12", unit: "units" },
        { item: "olive oil", quantity: "500", unit: "ml" },
        { item: "tomatoes", quantity: "1", unit: "kg" },
        { item: "feta cheese", quantity: "200", unit: "g" },
        { item: "chickpeas", quantity: "400", unit: "g" },
        { item: "salmon fillets", quantity: "400", unit: "g" },
        { item: "greek yogurt", quantity: "500", unit: "g" },
        { item: "quinoa", quantity: "200", unit: "g" },
        { item: "chicken breast", quantity: "400", unit: "g" }
      ],
      nutritional_analysis: {
        average_daily_calories: 1750,
        protein_grams: 70,
        carbs_grams: 140,
        fat_grams: 78
      },
      optimization_summary: {
        total_estimated_cost: 45.50,
        prep_time_total_minutes: 180,
        variety_score: 0.85
      }
    };
  }
}