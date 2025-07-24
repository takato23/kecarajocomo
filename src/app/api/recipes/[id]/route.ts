import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { 
  MealPlanningError 
} from '@/lib/errors/MealPlanningError';
import { enhancedCache, CacheKeyGenerator } from '@/lib/services/enhancedCacheService';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
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
    const recipe = await prisma.recipe.findUnique({
      where: { id: params.id },
      include: {
        ingredients: {
          include: {
            ingredient: true
          }
        },
        instructions: {
          orderBy: {
            stepNumber: 'asc'
          }
        }
      }
    });

    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    // Check access permissions
    if (!recipe.isPublic && recipe.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Cache the result
    await enhancedCache.set(cacheKey, recipe, 1000 * 60 * 60 * 2); // 2 hours

    return NextResponse.json(recipe);
  } catch (error: unknown) {
    console.error('Error fetching recipe:', error);
    
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
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check ownership
    const existingRecipe = await prisma.recipe.findUnique({
      where: { id: params.id },
      select: { userId: true }
    });

    if (!existingRecipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    if (existingRecipe.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    
    // Update recipe with transaction
    const updatedRecipe = await prisma.$transaction(async (tx) => {
      // Update recipe
      const recipe = await tx.recipe.update({
        where: { id: params.id },
        data: {
          title: body.title,
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
          where: { recipeId: params.id }
        });

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
                }
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
          where: { recipeId: params.id }
        });

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
    });

    // Invalidate cache
    await enhancedCache.invalidatePattern(`recipe:${params.id}:*`);

    return NextResponse.json(updatedRecipe);
  } catch (error: unknown) {
    console.error('Error updating recipe:', error);
    
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
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check ownership
    const recipe = await prisma.recipe.findUnique({
      where: { id: params.id },
      select: { userId: true, title: true }
    });

    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    if (recipe.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete recipe with transaction (cascade will handle related records)
    await prisma.$transaction(async (tx) => {
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
    });

    // Invalidate cache
    await enhancedCache.invalidatePattern(`recipe:${params.id}:*`);
    await enhancedCache.invalidatePattern(`recipe:list:*`);

    return NextResponse.json({ 
      success: true,
      message: 'Recipe deleted successfully' 
    });
  } catch (error: unknown) {
    console.error('Error deleting recipe:', error);
    
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