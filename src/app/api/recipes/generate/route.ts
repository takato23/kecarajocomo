import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { logger } from '@/lib/logger';

// authOptions removed - using Supabase Auth;
import { UnifiedAIService } from "@/services/ai";
import type { RecipeGenerationParams } from "@/services/ai/types";
import { db } from '@/lib/supabase/database.service';

export async function POST(req: Request) {
  try {
    const user = await getUser();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user has available AI generations (implement limits later)
    const user = await db.getUserProfile(user.id, {
      select: { 
        id: true,
        name: true,
        preferences: true 
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const params: RecipeGenerationParams = await req.json();
    
    // Add user preferences to generation params if not specified
    if (user.preferences && typeof user.preferences === 'object') {
      const prefs = user.preferences as any;
      if (!params.dietary && prefs.dietaryRestrictions) {
        params.dietary = prefs.dietaryRestrictions;
      }
    }

    // Generate recipe using AI
    const aiService = new UnifiedAIService();
    const generatedRecipe = await aiService.generateRecipe(params);

    // Save the generated recipe to database
    const ingredientPromises = generatedRecipe.ingredients.map(async (ing) => {
      const ingredient = await prisma.ingredient.upsert({
        where: { name: ing.name.toLowerCase() },
        update: {},
        create: { 
          name: ing.name.toLowerCase(),
          unit: ing.unit || "g"
        }
      });
      return {
        ingredientId: ingredient.id,
        quantity: parseFloat(ing.quantity) || 0,
        unit: ing.unit || "",
        notes: ing.notes || null
      };
    });

    const ingredientData = await Promise.all(ingredientPromises);

    // Create the recipe
    const recipe = await db.createRecipe({
      title: generatedRecipe.title,
        description: generatedRecipe.description,
        instructions: generatedRecipe.instructions,
        prepTimeMinutes: generatedRecipe.prepTimeMinutes,
        cookTimeMinutes: generatedRecipe.cookTimeMinutes,
        servings: generatedRecipe.servings,
        difficulty: generatedRecipe.difficulty,
        cuisine: generatedRecipe.cuisine,
        tags: generatedRecipe.tags,
        isPublic: true,
        source: "ai",
        authorId: user.id,
        ingredients: {
          create: ingredientData
        },
        ...(generatedRecipe.nutritionInfo ? {
          nutritionInfo: {
            create: {
              calories: generatedRecipe.nutritionInfo.calories,
              protein: generatedRecipe.nutritionInfo.protein,
              carbs: generatedRecipe.nutritionInfo.carbs,
              fat: generatedRecipe.nutritionInfo.fat,
              fiber: generatedRecipe.nutritionInfo.fiber || null,
              sugar: generatedRecipe.nutritionInfo.sugar || null,
              sodium: generatedRecipe.nutritionInfo.sodium || null,
            }
          }
        } : {})
      },
      // includes handled by Supabase service
        },
        nutritionInfo: true,
        author: {
          select: {
            name: true,
            image: true
          }
        }
      });

    return NextResponse.json(recipe, { status: 201 });
  } catch (error: unknown) {
    logger.error("Error generating recipe:", 'API:route', error);
    return NextResponse.json(
      { error: "Failed to generate recipe" },
      { status: 500 }
    );
  }
}