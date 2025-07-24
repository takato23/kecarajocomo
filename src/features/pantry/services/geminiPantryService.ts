/**
 * Gemini-powered Pantry Intelligence Service
 * AI-driven pantry management with smart insights and recommendations
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

import { 
  PantryItem,
  PantryStats 
} from '../types';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

export interface PantryInsight {
  type: 'waste_reduction' | 'usage_optimization' | 'storage_improvement' | 'recipe_suggestion' | 'shopping_optimization';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionable_steps: string[];
  estimated_savings?: number;
  confidence_score: number;
}

export interface SmartExpirationPrediction {
  item_id: string;
  predicted_expiration_date: Date;
  confidence: number;
  factors: string[];
  storage_recommendations: string[];
  usage_suggestions: string[];
}

export interface PantryOptimizationPlan {
  immediate_actions: Array<{
    priority: 'critical' | 'high' | 'medium' | 'low';
    action: string;
    reason: string;
    estimated_time: number;
  }>;
  weekly_plan: Array<{
    week: number;
    focus_area: string;
    recommendations: string[];
  }>;
  long_term_strategy: {
    storage_optimization: string[];
    shopping_pattern_improvements: string[];
    waste_reduction_targets: number;
  };
}

export interface IngredientSubstitution {
  original_ingredient: string;
  substitutes: Array<{
    name: string;
    ratio: number;
    notes: string;
    nutritional_impact: string;
    availability_score: number;
  }>;
  recipe_compatibility: string;
}

export class GeminiPantryService {
  
  /**
   * Generate comprehensive pantry insights using Gemini AI
   */
  static async generatePantryInsights(
    pantryItems: PantryItem[],
    pantryStats: PantryStats,
    userPreferences?: {
      dietary_restrictions?: string[];
      cooking_skill?: 'beginner' | 'intermediate' | 'advanced';
      household_size?: number;
      budget_conscious?: boolean;
    }
  ): Promise<PantryInsight[]> {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `
As a pantry management expert, analyze this pantry inventory and provide actionable insights.

PANTRY DATA:
${JSON.stringify({
  total_items: pantryStats.totalItems,
  expiring_items: pantryStats.expiringItems,
  expired_items: pantryStats.expiredItems,
  categories: pantryStats.categories,
  sample_items: pantryItems.slice(0, 20).map(item => ({
    name: item.ingredient_name,
    quantity: item.quantity,
    unit: item.unit,
    category: item.category,
    expiration_date: item.expiration_date,
    location: item.location
  }))
}, null, 2)}

USER PREFERENCES:
${JSON.stringify(userPreferences || {}, null, 2)}

Provide insights in the following JSON format:
{
  "insights": [
    {
      "type": "waste_reduction|usage_optimization|storage_improvement|recipe_suggestion|shopping_optimization",
      "title": "Brief title",
      "description": "Detailed description",
      "impact": "high|medium|low",
      "actionable_steps": ["step1", "step2", "step3"],
      "estimated_savings": optional number (in dollars),
      "confidence_score": number between 0 and 1
    }
  ]
}

Focus on:
1. Waste reduction strategies
2. Usage optimization for expiring items
3. Storage improvements for longevity
4. Recipe suggestions using available ingredients
5. Shopping optimization based on patterns

Provide 5-8 most impactful insights.`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const content = response.text();
      
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.insights || [];
    } catch (error: unknown) {
      console.error('Error generating pantry insights:', error);
      return this.getFallbackInsights(pantryItems, pantryStats);
    }
  }

  /**
   * Predict expiration dates using AI analysis
   */
  static async predictExpirationDates(
    pantryItems: PantryItem[]
  ): Promise<SmartExpirationPrediction[]> {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const itemsWithoutExpiration = pantryItems.filter(item => !item.expiration_date);
    
    if (itemsWithoutExpiration.length === 0) {
      return [];
    }

    const prompt = `
As a food science expert, predict expiration dates for pantry items without known expiration dates.

ITEMS TO ANALYZE:
${JSON.stringify(itemsWithoutExpiration.map(item => ({
  id: item.id,
  name: item.ingredient_name,
  category: item.category,
  quantity: item.quantity,
  unit: item.unit,
  location: item.location,
  purchase_date: item.purchase_date
})), null, 2)}

For each item, provide predictions in this JSON format:
{
  "predictions": [
    {
      "item_id": "item_id",
      "predicted_expiration_date": "YYYY-MM-DD",
      "confidence": number between 0 and 1,
      "factors": ["factor1", "factor2"],
      "storage_recommendations": ["recommendation1", "recommendation2"],
      "usage_suggestions": ["suggestion1", "suggestion2"]
    }
  ]
}

Consider:
- Food category and typical shelf life
- Storage location (pantry vs refrigerator vs freezer)
- Package size and type
- Seasonal factors
- Purchase date if available

Provide realistic predictions based on food science principles.`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const content = response.text();
      
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.predictions?.map((pred: any) => ({
        ...pred,
        predicted_expiration_date: new Date(pred.predicted_expiration_date)
      })) || [];
    } catch (error: unknown) {
      console.error('Error predicting expiration dates:', error);
      return [];
    }
  }

  /**
   * Generate intelligent substitution suggestions
   */
  static async generateIngredientSubstitutions(
    missingIngredients: string[],
    availablePantryItems: PantryItem[]
  ): Promise<IngredientSubstitution[]> {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `
As a culinary expert, suggest ingredient substitutions using available pantry items.

MISSING INGREDIENTS:
${JSON.stringify(missingIngredients)}

AVAILABLE PANTRY ITEMS:
${JSON.stringify(availablePantryItems.map(item => ({
  name: item.ingredient_name,
  quantity: item.quantity,
  unit: item.unit,
  category: item.category
})), null, 2)}

For each missing ingredient, suggest substitutions in this JSON format:
{
  "substitutions": [
    {
      "original_ingredient": "missing ingredient name",
      "substitutes": [
        {
          "name": "substitute ingredient name",
          "ratio": number (how much to use, e.g., 1.5 means 1.5x the amount),
          "notes": "preparation or usage notes",
          "nutritional_impact": "how this affects nutrition",
          "availability_score": number between 0 and 1 (based on pantry availability)
        }
      ],
      "recipe_compatibility": "how well this works in recipes"
    }
  ]
}

Only suggest substitutes that are actually available in the pantry.
Consider flavor profiles, cooking properties, and nutritional impact.`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const content = response.text();
      
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.substitutions || [];
    } catch (error: unknown) {
      console.error('Error generating substitutions:', error);
      return [];
    }
  }

  /**
   * Create a comprehensive pantry optimization plan
   */
  static async createOptimizationPlan(
    pantryItems: PantryItem[],
    pantryStats: PantryStats,
    usageHistory?: Array<{
      ingredient: string;
      date: Date;
      amount_used: number;
    }>
  ): Promise<PantryOptimizationPlan> {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `
Create a comprehensive pantry optimization plan based on current inventory and usage patterns.

CURRENT PANTRY STATE:
${JSON.stringify({
  total_items: pantryStats.totalItems,
  expiring_items: pantryStats.expiringItems,
  expired_items: pantryStats.expiredItems,
  categories: pantryStats.categories,
  recent_items: pantryItems.slice(0, 15).map(item => ({
    name: item.ingredient_name,
    quantity: item.quantity,
    unit: item.unit,
    category: item.category,
    expiration_date: item.expiration_date,
    location: item.location
  }))
}, null, 2)}

USAGE HISTORY:
${JSON.stringify(usageHistory?.slice(0, 20) || [], null, 2)}

Create an optimization plan in this JSON format:
{
  "immediate_actions": [
    {
      "priority": "critical|high|medium|low",
      "action": "specific action to take",
      "reason": "why this is important",
      "estimated_time": number (minutes)
    }
  ],
  "weekly_plan": [
    {
      "week": number,
      "focus_area": "area to focus on",
      "recommendations": ["recommendation1", "recommendation2"]
    }
  ],
  "long_term_strategy": {
    "storage_optimization": ["strategy1", "strategy2"],
    "shopping_pattern_improvements": ["improvement1", "improvement2"],
    "waste_reduction_targets": number (percentage reduction goal)
  }
}

Focus on:
1. Immediate critical actions (expired/expiring items)
2. Medium-term organization improvements
3. Long-term efficiency strategies
4. Waste reduction and cost savings

Provide 3-5 immediate actions, 4-week plan, and long-term strategy.`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const content = response.text();
      
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed;
    } catch (error: unknown) {
      console.error('Error creating optimization plan:', error);
      return this.getFallbackOptimizationPlan(pantryItems, pantryStats);
    }
  }

  /**
   * Generate smart shopping recommendations based on pantry state
   */
  static async generateShoppingRecommendations(
    pantryItems: PantryItem[],
    upcomingMeals?: Array<{
      recipe_name: string;
      ingredients: Array<{ name: string; quantity: number; unit: string }>;
      date: Date;
    }>
  ): Promise<Array<{
    ingredient: string;
    reason: string;
    urgency: 'high' | 'medium' | 'low';
    quantity_suggestion: string;
    cost_estimate?: number;
  }>> {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `
Analyze pantry inventory and upcoming meals to generate smart shopping recommendations.

CURRENT PANTRY:
${JSON.stringify(pantryItems.map(item => ({
  name: item.ingredient_name,
  quantity: item.quantity,
  unit: item.unit,
  category: item.category,
  expiration_date: item.expiration_date
})), null, 2)}

UPCOMING MEALS:
${JSON.stringify(upcomingMeals || [], null, 2)}

Generate shopping recommendations in this JSON format:
{
  "recommendations": [
    {
      "ingredient": "ingredient name",
      "reason": "why this should be purchased",
      "urgency": "high|medium|low",
      "quantity_suggestion": "suggested amount to buy",
      "cost_estimate": optional number
    }
  ]
}

Consider:
1. Items running low or expired
2. Ingredients needed for upcoming meals
3. Staples that should always be stocked
4. Seasonal availability and pricing
5. Bulk buying opportunities

Provide 8-12 most important recommendations.`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const content = response.text();
      
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.recommendations || [];
    } catch (error: unknown) {
      console.error('Error generating shopping recommendations:', error);
      return [];
    }
  }

  /**
   * Fallback insights when AI fails
   */
  private static getFallbackInsights(pantryItems: PantryItem[], pantryStats: PantryStats): PantryInsight[] {
    const insights: PantryInsight[] = [];
    
    if (pantryStats.expiredItems > 0) {
      insights.push({
        type: 'waste_reduction',
        title: 'Remove Expired Items',
        description: `You have ${pantryStats.expiredItems} expired items that should be removed immediately.`,
        impact: 'high',
        actionable_steps: [
          'Check expiration dates on all items',
          'Remove expired items safely',
          'Clean storage areas'
        ],
        confidence_score: 1.0
      });
    }

    if (pantryStats.expiringItems > 3) {
      insights.push({
        type: 'usage_optimization',
        title: 'Use Expiring Items Soon',
        description: `${pantryStats.expiringItems} items are expiring soon and should be used first.`,
        impact: 'medium',
        actionable_steps: [
          'Plan meals using expiring ingredients',
          'Move expiring items to front of storage',
          'Consider freezing items if possible'
        ],
        confidence_score: 0.9
      });
    }

    return insights;
  }

  /**
   * Fallback optimization plan when AI fails
   */
  private static getFallbackOptimizationPlan(pantryItems: PantryItem[], pantryStats: PantryStats): PantryOptimizationPlan {
    return {
      immediate_actions: [
        {
          priority: 'critical',
          action: 'Remove all expired items',
          reason: 'Expired items can contaminate other food',
          estimated_time: 15
        },
        {
          priority: 'high',
          action: 'Use items expiring within 3 days',
          reason: 'Prevent food waste',
          estimated_time: 30
        }
      ],
      weekly_plan: [
        {
          week: 1,
          focus_area: 'Expiration management',
          recommendations: ['Check all expiration dates', 'Plan meals around expiring items']
        },
        {
          week: 2,
          focus_area: 'Organization',
          recommendations: ['Group similar items together', 'Label storage containers']
        }
      ],
      long_term_strategy: {
        storage_optimization: ['Use clear containers', 'Implement FIFO system'],
        shopping_pattern_improvements: ['Buy smaller quantities more frequently', 'Check pantry before shopping'],
        waste_reduction_targets: 25
      }
    };
  }
}