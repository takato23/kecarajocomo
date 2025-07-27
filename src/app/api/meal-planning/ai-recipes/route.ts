import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { logger } from '@/lib/logger';

// GET /api/meal-planning/ai-recipes - Get AI-generated recipes
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const isPublic = searchParams.get('public');
    const mealType = searchParams.get('mealType');
    const cuisine = searchParams.get('cuisine');
    const tags = searchParams.get('tags')?.split(',');

    // Build query
    let query = supabase
      .from('ai_generated_recipes')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (isPublic === 'true') {
      query = query.eq('is_public', true);
    } else {
      // By default, show user's own recipes and public ones
      query = query.or(`user_id.eq.${user.id},is_public.eq.true`);
    }

    if (mealType) {
      query = query.eq('meal_type', mealType);
    }

    if (cuisine) {
      query = query.eq('cuisine', cuisine);
    }

    if (tags && tags.length > 0) {
      query = query.contains('dietary_tags', tags);
    }

    const { data: recipes, error } = await query;

    if (error) {
      logger.error('Failed to fetch AI recipes', 'meal-planning/ai-recipes/GET', error);
      return NextResponse.json(
        { error: 'Failed to fetch AI recipes' },
        { status: 500 }
      );
    }

    logger.info('Successfully fetched AI recipes', 'meal-planning/ai-recipes/GET', {
      userId: user.id,
      count: recipes?.length || 0,
      filters: { isPublic, mealType, cuisine, tags }
    });

    return NextResponse.json({
      success: true,
      data: recipes || []
    });

  } catch (error) {
    logger.error('Error in AI recipes GET endpoint', 'meal-planning/ai-recipes/GET', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/meal-planning/ai-recipes - Save AI-generated recipe
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      recipeData,
      name,
      description,
      mealType,
      dietaryTags,
      cuisine,
      prepTime,
      cookTime,
      servings,
      difficulty,
      nutritionalInfo,
      isPublic
    } = body;

    // Validate required fields
    if (!recipeData || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: recipeData and name' },
        { status: 400 }
      );
    }

    const { data: savedRecipe, error: insertError } = await supabase
      .from('ai_generated_recipes')
      .insert({
        user_id: user.id,
        recipe_data: recipeData,
        name,
        description: description || null,
        meal_type: mealType || null,
        dietary_tags: dietaryTags || [],
        cuisine: cuisine || null,
        prep_time: prepTime || null,
        cook_time: cookTime || null,
        servings: servings || 4,
        difficulty: difficulty || null,
        nutritional_info: nutritionalInfo || {},
        is_public: isPublic || false
      })
      .select()
      .single();

    if (insertError) {
      logger.error('Failed to save AI recipe', 'meal-planning/ai-recipes/POST', insertError);
      return NextResponse.json(
        { error: 'Failed to save AI recipe' },
        { status: 500 }
      );
    }

    logger.info('Successfully saved AI recipe', 'meal-planning/ai-recipes/POST', {
      userId: user.id,
      recipeId: savedRecipe.id,
      name: savedRecipe.name,
      isPublic: savedRecipe.is_public
    });

    return NextResponse.json({
      success: true,
      data: savedRecipe
    });

  } catch (error) {
    logger.error('Error in AI recipe save endpoint', 'meal-planning/ai-recipes/POST', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/meal-planning/ai-recipes/[id] - Update AI-generated recipe
export async function PUT(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing recipe ID' },
        { status: 400 }
      );
    }

    const body = await req.json();

    // Check if recipe exists and belongs to user
    const { data: existingRecipe, error: checkError } = await supabase
      .from('ai_generated_recipes')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (checkError || !existingRecipe) {
      return NextResponse.json(
        { error: 'Recipe not found' },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: any = {};
    const allowedFields = [
      'recipe_data', 'name', 'description', 'meal_type',
      'dietary_tags', 'cuisine', 'prep_time', 'cook_time',
      'servings', 'difficulty', 'nutritional_info', 'is_public',
      'rating'
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const { data: updatedRecipe, error: updateError } = await supabase
      .from('ai_generated_recipes')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      logger.error('Failed to update AI recipe', 'meal-planning/ai-recipes/PUT', updateError);
      return NextResponse.json(
        { error: 'Failed to update AI recipe' },
        { status: 500 }
      );
    }

    logger.info('Successfully updated AI recipe', 'meal-planning/ai-recipes/PUT', {
      userId: user.id,
      recipeId: id,
      updates: Object.keys(updateData)
    });

    return NextResponse.json({
      success: true,
      data: updatedRecipe
    });

  } catch (error) {
    logger.error('Error in AI recipe update endpoint', 'meal-planning/ai-recipes/PUT', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/meal-planning/ai-recipes/[id] - Delete AI-generated recipe
export async function DELETE(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing recipe ID' },
        { status: 400 }
      );
    }

    // Delete recipe (only if user owns it)
    const { error: deleteError } = await supabase
      .from('ai_generated_recipes')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      logger.error('Failed to delete AI recipe', 'meal-planning/ai-recipes/DELETE', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete AI recipe' },
        { status: 500 }
      );
    }

    logger.info('Successfully deleted AI recipe', 'meal-planning/ai-recipes/DELETE', {
      userId: user.id,
      recipeId: id
    });

    return NextResponse.json({
      success: true,
      message: 'AI recipe deleted successfully'
    });

  } catch (error) {
    logger.error('Error in AI recipe delete endpoint', 'meal-planning/ai-recipes/DELETE', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}