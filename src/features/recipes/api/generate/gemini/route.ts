import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

import { AIRecipeRequest, AIRecipeResponse } from '../../../types';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const body: AIRecipeRequest = await request.json();
    
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = buildGeminiPrompt(body);
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text();
    
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      const aiResponse: AIRecipeResponse = JSON.parse(jsonMatch[0]);
      return NextResponse.json(aiResponse);
    } catch (parseError: unknown) {
      console.error('Failed to parse Gemini response:', parseError);
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error('Error calling Gemini API:', error);
    return NextResponse.json(
      { error: 'Failed to generate recipe' },
      { status: 500 }
    );
  }
}

function buildGeminiPrompt(request: AIRecipeRequest): string {
  let prompt = `You are an expert chef and recipe creator. Generate a creative, delicious, and practical recipe based on the following requirements:\n\n`;
  
  if (request.prompt) {
    prompt += `Description: ${request.prompt}\n`;
  }
  
  if (request.cuisine_type) {
    prompt += `Cuisine Type: ${request.cuisine_type}\n`;
  }
  
  if (request.meal_type) {
    prompt += `Meal Type: ${request.meal_type}\n`;
  }
  
  if (request.dietary_tags && request.dietary_tags.length > 0) {
    prompt += `Dietary Requirements: ${request.dietary_tags.join(', ')}\n`;
  }
  
  if (request.available_ingredients && request.available_ingredients.length > 0) {
    prompt += `Use these ingredients: ${request.available_ingredients.join(', ')}\n`;
  }
  
  if (request.exclude_ingredients && request.exclude_ingredients.length > 0) {
    prompt += `Exclude these ingredients: ${request.exclude_ingredients.join(', ')}\n`;
  }
  
  prompt += `Servings: ${request.servings || 4}\n`;
  
  if (request.max_cook_time) {
    prompt += `Maximum cooking time: ${request.max_cook_time} minutes\n`;
  }
  
  prompt += `Difficulty: ${request.difficulty || 'medium'}\n`;
  
  if (request.style) {
    prompt += `Style: ${request.style}\n`;
  }
  
  prompt += `
IMPORTANT: Respond ONLY with a valid JSON object, no additional text before or after.

Generate a recipe in this exact JSON format:
{
  "recipe": {
    "title": "Recipe name",
    "description": "Brief description",
    "ingredients": [
      {
        "name": "Ingredient name",
        "quantity": number,
        "unit": "unit of measurement",
        "notes": "optional preparation notes",
        "optional": boolean
      }
    ],
    "instructions": [
      {
        "step_number": 1,
        "text": "Step description",
        "time_minutes": optional number,
        "temperature": optional { "value": number, "unit": "celsius" or "fahrenheit" },
        "tips": optional ["tip1", "tip2"]
      }
    ],
    "prep_time": number (minutes),
    "cook_time": number (minutes),
    "servings": number,
    "cuisine_type": "${request.cuisine_type || 'other'}",
    "meal_types": ["appropriate meal types"],
    "dietary_tags": ["matching dietary tags"],
    "difficulty": "${request.difficulty || 'medium'}",
    "nutritional_info": {
      "calories": number,
      "protein": number,
      "carbs": number,
      "fat": number,
      "fiber": number,
      "sugar": number,
      "sodium": number
    }
  },
  "confidence_score": number between 0 and 1,
  "suggestions": ["optional suggestions for variations or improvements"],
  "alternatives": ["optional alternative ingredients or methods"]
}

Ensure the recipe is creative, practical, and matches all requirements. Calculate realistic nutritional information per serving.`;
  
  return prompt;
}