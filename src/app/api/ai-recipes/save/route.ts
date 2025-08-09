import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/services/logger';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Obtener datos del request
    const body = await request.json();
    const { 
      recipeData,
      makePublic = false 
    } = body;

    // Validar que se proporcione la receta
    if (!recipeData || !recipeData.name) {
      return NextResponse.json(
        { error: 'Recipe data is required' },
        { status: 400 }
      );
    }

    // Extraer información de la receta
    const {
      name,
      description,
      ingredients,
      instructions,
      prepTime,
      cookTime,
      servings,
      nutritionalInfo,
      tags,
      mealType,
      difficulty,
      cuisine
    } = recipeData;

    // Guardar en la tabla ai_generated_recipes
    const { data: savedRecipe, error: saveError } = await supabase
      .from('ai_generated_recipes')
      .insert({
        user_id: user.id,
        recipe_data: recipeData,
        name,
        description,
        meal_type: mealType,
        dietary_tags: tags || [],
        cuisine,
        prep_time: prepTime,
        cook_time: cookTime,
        servings: servings || 4,
        difficulty,
        nutritional_info: nutritionalInfo || {},
        is_public: makePublic,
        usage_count: 1
      })
      .select()
      .single();

    if (saveError) {
      logger.error('Error saving AI recipe:', saveError);
      return NextResponse.json(
        { error: 'Failed to save recipe' },
        { status: 500 }
      );
    }

    // Si el usuario quiere hacer la receta pública, también la guardamos en la tabla de recetas principales
    if (makePublic) {
      const { data: publicRecipe, error: publicError } = await supabase
        .from('recipes')
        .insert({
          user_id: user.id,
          name,
          description,
          ingredients,
          instructions,
          prep_time: prepTime,
          cook_time: cookTime,
          servings: servings || 4,
          difficulty,
          cuisine,
          meal_types: mealType ? [mealType] : [],
          dietary_tags: tags || [],
          nutrition: nutritionalInfo || {},
          is_public: true,
          source: 'ai_generated',
          ai_recipe_id: savedRecipe.id
        })
        .select()
        .single();

      if (publicError) {
        logger.error('Error creating public recipe:', publicError);
        // No fallar la operación completa si esto falla
      } else {
        // Actualizar la receta AI con el ID de la receta pública
        await supabase
          .from('ai_generated_recipes')
          .update({ recipe_data: { ...recipeData, public_recipe_id: publicRecipe.id } })
          .eq('id', savedRecipe.id);
      }
    }

    return NextResponse.json({
      success: true,
      recipe: savedRecipe,
      message: makePublic 
        ? 'Receta guardada y compartida con la comunidad' 
        : 'Receta guardada en tu colección privada'
    });

  } catch (error) {
    logger.error('Error in save AI recipe:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint para obtener las recetas AI del usuario
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Obtener parámetros de query
    const { searchParams } = new URL(request.url);
    const includePublic = searchParams.get('includePublic') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Construir query
    let query = supabase
      .from('ai_generated_recipes')
      .select('*', { count: 'exact' });

    if (includePublic) {
      // Incluir recetas públicas de otros usuarios
      query = query.or(`user_id.eq.${user.id},is_public.eq.true`);
    } else {
      // Solo recetas del usuario
      query = query.eq('user_id', user.id);
    }

    // Aplicar paginación
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: recipes, count, error } = await query;

    if (error) {
      logger.error('Error fetching AI recipes:', error);
      return NextResponse.json(
        { error: 'Failed to fetch recipes' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      recipes: recipes || [],
      total: count || 0,
      pagination: {
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    });

  } catch (error) {
    logger.error('Error fetching AI recipes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}