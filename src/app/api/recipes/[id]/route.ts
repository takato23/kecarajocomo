import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { logger } from '@/lib/logger';

// authOptions removed - using Supabase Auth;
import { db } from '@/lib/supabase/database.service';
import { 
  MealPlanningError 
} from '@/lib/errors/MealPlanningError';
import { enhancedCache, CacheKeyGenerator } from '@/lib/services/enhancedCacheService';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check cache first
    const cacheKey = CacheKeyGenerator.recipe(params.id);
    const cached = await enhancedCache.get(cacheKey);
    
    if (cached) {
      return NextResponse.json(cached);
    }

    // Fetch recipe with ingredients and instructions
    const recipe = await db.getRecipeById(params.id, {
      // includes handled by Supabase service
      instructions: {
        orderBy: {
          stepNumber: 'asc'
        }
      }
    });

    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    // Check access permissions
    if (!recipe.isPublic && recipe.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Cache the result
    await enhancedCache.set(cacheKey, recipe, 1000 * 60 * 60 * 2); // 2 hours

    return NextResponse.json(recipe);
  } catch (error: unknown) {
    logger.error('Error fetching recipe:', 'API:route', error);
    
    if (error instanceof MealPlanningError) {
      return NextResponse.json(
        { error: error.userMessage || error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check ownership
    const existingRecipe = await db.getRecipeById(params.id, {
      select: { userId: true }
    });

    if (!existingRecipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    if (existingRecipe.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    
    // Update recipe with transaction
    // TODO: Convert transaction to Supabase
    const updatedRecipe = null; // Placeholder
    /* await prisma.$transaction(async (tx) => {
      // Update recipe
      const recipe = await tx.recipe.update({
        where: { id: params.id },
        data: { title: body.title,
          description: body.description,
          prepTimeMinutes: body.prepTimeMinutes,
          cookTimeMinutes: body.cookTimeMinutes,
          servings: body.servings,
          difficulty: body.difficulty,
          imageUrl: body.imageUrl,
          isPublic: body.isPublic,
          updatedAt: new Date()
        }
      });

      // Update ingredients if provided
      if (body.ingredients) {
        // Delete existing ingredients
        await tx.recipeIngredient.deleteMany({
          where: { recipeId: params.id });

        // Insert new ingredients
        if (body.ingredients.length > 0) {
          const ingredientData = await Promise.all(
            body.ingredients.map(async (ing: any) => {
              // Find or create ingredient
              const ingredient = await tx.ingredient.upsert({
                where: { name: ing.name },
                update: {},
                create: { 
                  name: ing.name,
                  category: 'other'
                });

              return {
                recipeId: params.id,
                ingredientId: ingredient.id,
                quantity: ing.quantity,
                unit: ing.unit,
                preparation: ing.preparation,
                notes: ing.notes,
                optional: ing.optional
              };
            })
          );

          await tx.recipeIngredient.createMany({
            data: ingredientData
          });
        }
      }

      // Update instructions if provided
      if (body.instructions) {
        // Delete existing instructions
        await tx.recipeInstruction.deleteMany({
          where: { recipeId: params.id });

        // Insert new instructions
        if (body.instructions.length > 0) {
          const instructionData = body.instructions.map((inst: any) => ({
            recipeId: params.id,
            stepNumber: inst.stepNumber,
            instruction: inst.instruction,
            duration: inst.duration,
            temperature: inst.temperature,
            notes: inst.notes
          }));

          await tx.recipeInstruction.createMany({
            data: instructionData
          });
        }
      }

      return recipe;
    }); */

    // Invalidate cache
    await enhancedCache.invalidatePattern(`recipe:${params.id}:*`);

    return NextResponse.json(updatedRecipe);
  } catch (error: unknown) {
    logger.error('Error updating recipe:', 'API:route', error);
    
    if (error instanceof MealPlanningError) {
      return NextResponse.json(
        { error: error.userMessage || error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check ownership
    const recipe = await db.getRecipeById(params.id, {
      select: { userId: true, title: true }
    });

    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    if (recipe.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // TODO: Convert transaction to Supabase  
    // Delete recipe with transaction (cascade will handle related records)
    /* await prisma.$transaction(async (tx) => {
      // Delete related records first
      await tx.recipeIngredient.deleteMany({
        where: { recipeId: params.id }
      });

      await tx.recipeInstruction.deleteMany({
        where: { recipeId: params.id }
      });

      await tx.favoriteRecipe.deleteMany({
        where: { recipeId: params.id }
      });

      // Delete the recipe itself
      await tx.recipe.delete({
        where: { id: params.id }
      });
    }); */
    
    // Placeholder - implement Supabase version
    await db.deleteRecipe(params.id);

    // Invalidate cache
    await enhancedCache.invalidatePattern(`recipe:${params.id}:*`);
    await enhancedCache.invalidatePattern(`recipe:list:*`);

    return NextResponse.json({ 
      success: true,
      message: 'Recipe deleted successfully' 
    });
  } catch (error: unknown) {
    logger.error('Error deleting recipe:', 'API:route', error);
    
    if (error instanceof MealPlanningError) {
      return NextResponse.json(
        { error: error.userMessage || error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}