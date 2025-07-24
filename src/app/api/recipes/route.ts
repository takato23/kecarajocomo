import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { 
  validateQuery, 
  validateAuthAndBody,
  createSuccessResponse, 
  createPaginatedResponse 
} from "@/lib/validation/middleware";
import { 
  RecipeCreateSchema, 
  RecipeQuerySchema 
} from "@/lib/validation/schemas";

export const GET = validateQuery(RecipeQuerySchema, async (request) => {
  try {
    const session = await getServerSession(authOptions);
    const query = request.validatedQuery!;
    
    const skip = (query.page - 1) * query.limit;
    const tags = query.tags ? query.tags.split(",") : [];

    const where: any = {
      AND: [
        {
          OR: [
            { isPublic: true },
            ...(session?.user?.id ? [{ authorId: session.user.id }] : [])
          ]
        },
        ...(query.search ? [{
          OR: [
            { title: { contains: query.search, mode: "insensitive" } },
            { description: { contains: query.search, mode: "insensitive" } }
          ]
        }] : []),
        ...(query.cuisine ? [{ cuisine: { equals: query.cuisine, mode: "insensitive" } }] : []),
        ...(query.difficulty ? [{ difficulty: query.difficulty }] : []),
        ...(tags.length > 0 ? [{ tags: { hasSome: tags } }] : []),
        ...(query.authorId ? [{ authorId: query.authorId }] : []),
        ...(query.isPublic !== undefined ? [{ isPublic: query.isPublic }] : []),
        ...(query.maxPrepTime ? [{ prepTimeMinutes: { lte: query.maxPrepTime } }] : []),
        ...(query.maxCookTime ? [{ cookTimeMinutes: { lte: query.maxCookTime } }] : []),
        ...(query.hasNutrition ? [{ nutritionInfo: { isNot: null } }] : [])
      ]
    };

    const [recipes, total] = await Promise.all([
      prisma.recipe.findMany({
        where,
        include: {
          author: {
            select: {
              name: true,
              image: true
            }
          },
          ingredients: {
            include: {
              ingredient: true
            }
          },
          nutritionInfo: true,
          _count: {
            select: {
              favorites: true,
              ratings: true
            }
          }
        },
        orderBy: {
          [query.sortBy || 'createdAt']: query.sortOrder
        },
        skip,
        take: query.limit
      }),
      prisma.recipe.count({ where })
    ]);

    return createPaginatedResponse(recipes, {
      page: query.page,
      limit: query.limit,
      total
    });
  } catch (error: unknown) {
    console.error("Error fetching recipes:", error);
    throw new Error("Failed to fetch recipes");
  }
});

export const POST = validateAuthAndBody(RecipeCreateSchema, async (request) => {
  try {
    const data = request.validatedBody!;
    const userId = request.user!.id;
    
    // Process ingredients - create or find them
    const ingredientPromises = data.ingredients.map(async (ing) => {
      const ingredient = await prisma.ingredient.upsert({
        where: { name: ing.name.toLowerCase() },
        update: {},
        create: { 
          name: ing.name.toLowerCase(),
          category: 'other',
          unit: ing.unit
        }
      });
      return {
        ingredientId: ingredient.id,
        quantity: ing.quantity,
        unit: ing.unit,
        preparation: ing.preparation || null,
        notes: ing.notes || null,
        optional: ing.optional
      };
    });

    const ingredientData = await Promise.all(ingredientPromises);

    // Process instructions - ensure proper ordering
    const instructionData = data.instructions.map((inst, index) => ({
      stepNumber: inst.stepNumber || index + 1,
      instruction: inst.instruction,
      duration: inst.duration || null,
      temperature: inst.temperature || null,
      notes: inst.notes || null
    }));

    // Create the recipe with transaction
    const recipe = await prisma.$transaction(async (tx) => {
      const newRecipe = await tx.recipe.create({
        data: {
          title: data.title,
          description: data.description || null,
          prepTimeMinutes: data.prepTimeMinutes,
          cookTimeMinutes: data.cookTimeMinutes,
          servings: data.servings,
          difficulty: data.difficulty,
          cuisine: data.cuisine || null,
          tags: data.tags,
          imageUrl: data.imageUrl || null,
          isPublic: data.isPublic,
          source: "user",
          authorId: userId,
          ingredients: {
            create: ingredientData
          },
          instructions: {
            create: instructionData
          },
          ...(data.nutrition ? {
            nutritionInfo: {
              create: {
                calories: data.nutrition.calories,
                protein: data.nutrition.protein,
                carbs: data.nutrition.carbs,
                fat: data.nutrition.fat,
                fiber: data.nutrition.fiber || null,
                sugar: data.nutrition.sugar || null,
                sodium: data.nutrition.sodium || null,
                cholesterol: data.nutrition.cholesterol || null
              }
            }
          } : {})
        },
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
          },
          nutritionInfo: true,
          author: {
            select: {
              name: true,
              image: true
            }
          }
        }
      });

      return newRecipe;
    });

    return createSuccessResponse(recipe, 201);
  } catch (error: unknown) {
    console.error("Error creating recipe:", error);
    throw new Error("Failed to create recipe");
  }
});