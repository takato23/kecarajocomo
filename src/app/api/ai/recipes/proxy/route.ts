import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/services/logger';
import { createClient } from '@/lib/supabase/server';

// Specific proxy for recipe generation
interface RecipeRequest {
  prompt: string;
  ingredients?: string[];
  dietaryRestrictions?: string[];
  cuisine?: string;
  mealType?: string;
  servings?: number;
  maxPrepTime?: number;
  provider?: 'gemini' | 'openai' | 'anthropic';
}

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const requestData: RecipeRequest = await req.json();
    const { 
      prompt, 
      ingredients = [], 
      dietaryRestrictions = [],
      cuisine,
      mealType,
      servings = 4,
      maxPrepTime,
      provider = 'gemini'
    } = requestData;

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Build enhanced prompt for recipe generation
    const enhancedPrompt = buildRecipePrompt({
      prompt,
      ingredients,
      dietaryRestrictions,
      cuisine,
      mealType,
      servings,
      maxPrepTime
    });

    let recipe;

    switch (provider) {
      case 'gemini':
        recipe = await generateRecipeWithGemini(enhancedPrompt);
        break;
      case 'openai':
        recipe = await generateRecipeWithOpenAI(enhancedPrompt);
        break;
      case 'anthropic':
        recipe = await generateRecipeWithAnthropic(enhancedPrompt);
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Unsupported provider' },
          { status: 400 }
        );
    }

    // Log recipe generation for analytics
    await logRecipeGeneration(user.id, provider, {
      ingredients: ingredients.length,
      dietary_restrictions: dietaryRestrictions.length,
      cuisine,
      meal_type: mealType
    });

    return NextResponse.json({
      success: true,
      data: recipe,
      metadata: {
        provider,
        generated_at: new Date().toISOString(),
        user_id: user.id
      }
    });

  } catch (error) {
    logger.error('Recipe Generation Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate recipe' },
      { status: 500 }
    );
  }
}

function buildRecipePrompt(params: Omit<RecipeRequest, 'provider'>): string {
  const {
    prompt,
    ingredients,
    dietaryRestrictions,
    cuisine,
    mealType,
    servings,
    maxPrepTime
  } = params;

  let enhancedPrompt = `Generate a detailed recipe based on the following requirements:\n\n`;
  enhancedPrompt += `User Request: ${prompt}\n\n`;

  if (ingredients && ingredients.length > 0) {
    enhancedPrompt += `Available Ingredients: ${ingredients.join(', ')}\n`;
  }

  if (dietaryRestrictions && dietaryRestrictions.length > 0) {
    enhancedPrompt += `Dietary Restrictions: ${dietaryRestrictions.join(', ')}\n`;
  }

  if (cuisine) {
    enhancedPrompt += `Cuisine Type: ${cuisine}\n`;
  }

  if (mealType) {
    enhancedPrompt += `Meal Type: ${mealType}\n`;
  }

  enhancedPrompt += `Servings: ${servings}\n`;

  if (maxPrepTime) {
    enhancedPrompt += `Maximum Preparation Time: ${maxPrepTime} minutes\n`;
  }

  enhancedPrompt += `\nPlease provide the recipe in the following JSON format:
{
  "title": "Recipe Title",
  "description": "Brief description",
  "prepTime": number_in_minutes,
  "cookTime": number_in_minutes,
  "totalTime": number_in_minutes,
  "servings": ${servings},
  "difficulty": "easy|medium|hard",
  "cuisine": "cuisine_type",
  "mealType": "breakfast|lunch|dinner|snack",
  "ingredients": [
    {
      "name": "ingredient_name",
      "amount": "amount",
      "unit": "unit",
      "category": "protein|vegetable|grain|dairy|spice|other"
    }
  ],
  "instructions": [
    {
      "step": 1,
      "instruction": "Step by step instruction",
      "time": optional_time_in_minutes
    }
  ],
  "nutrition": {
    "calories": estimated_calories_per_serving,
    "protein": "protein_in_grams",
    "carbs": "carbs_in_grams",
    "fat": "fat_in_grams",
    "fiber": "fiber_in_grams"
  },
  "tags": ["tag1", "tag2"],
  "tips": ["cooking tip 1", "cooking tip 2"]
}`;

  return enhancedPrompt;
}

async function generateRecipeWithGemini(prompt: string) {
  const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Google AI API key not configured');
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048
        }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!content) {
    throw new Error('No content generated from Gemini');
  }

  // Try to parse JSON from the response
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    // If no JSON found, return structured text
    return { content, raw: true };
  } catch {
    return { content, raw: true };
  }
}

async function generateRecipeWithOpenAI(prompt: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a professional chef and recipe developer. Always respond with valid JSON format as requested.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  
  if (!content) {
    throw new Error('No content generated from OpenAI');
  }

  try {
    return JSON.parse(content);
  } catch {
    return { content, raw: true };
  }
}

async function generateRecipeWithAnthropic(prompt: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('Anthropic API key not configured');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.content?.[0]?.text;
  
  if (!content) {
    throw new Error('No content generated from Anthropic');
  }

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return { content, raw: true };
  } catch {
    return { content, raw: true };
  }
}

async function logRecipeGeneration(userId: string, provider: string, metadata: any) {
  try {
    const supabase = createClient();
    await supabase.from('ai_usage_logs').insert({
      user_id: userId,
      service: 'recipe_generation',
      provider,
      metadata,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to log recipe generation:', error);
    // Don't throw - logging failure shouldn't break recipe generation
  }
}