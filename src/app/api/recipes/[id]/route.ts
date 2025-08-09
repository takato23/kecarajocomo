import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/supabase/types';

import { simpleCache, SimpleCacheKey } from '@/lib/services/simpleCache';

type MinimalRecipe = { is_public: boolean; created_by: string };

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnon) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }
    const supabase = createRouteHandlerClient<Database>({ cookies });

    const { data: { user } } = await supabase.auth.getUser();

    // Check cache first
    const cacheKey = SimpleCacheKey.recipe(params.id);
    const cached = await simpleCache.get<MinimalRecipe & Record<string, unknown>>(cacheKey);
    
    if (cached) {
      // For access control, ensure either public or owner when user authenticated; otherwise return public cached only
      if (cached.is_public || (user?.id && cached.created_by === user.id)) {
        return NextResponse.json(cached);
      }
    }

    const { data: recipeRaw, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
      }
      throw new Error(error.message);
    }

    if (!recipeRaw) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    const recipe = recipeRaw as MinimalRecipe & Record<string, unknown>;

    // Check access permissions
    if (!recipe.is_public) {
      if (!user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (recipe.created_by !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Cache the result
    await simpleCache.set(cacheKey, recipeRaw, 1000 * 60 * 60 * 2); // 2 hours

    return NextResponse.json(recipeRaw);
  } catch (error: any) {
    console.error('Error fetching recipe:', error);
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
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnon) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const supabase = createRouteHandlerClient<Database>({ cookies });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check ownership
    const { data: existingRecipe, error: fetchErr } = await supabase
      .from('recipes')
      .select('created_by')
      .eq('id', params.id)
      .single();

    if (fetchErr || !existingRecipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    if (existingRecipe.created_by !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    const update = {
      name: body.title,
      description: body.description ?? null,
      prep_time: body.prepTimeMinutes,
      cook_time: body.cookTimeMinutes,
      total_time: (body.prepTimeMinutes ?? 0) + (body.cookTimeMinutes ?? 0),
      servings: body.servings,
      difficulty: body.difficulty,
      image_url: body.imageUrl ?? null,
      is_public: typeof body.isPublic === 'boolean' ? body.isPublic : undefined,
      ingredients: Array.isArray(body.ingredients) ? body.ingredients : undefined,
      instructions: Array.isArray(body.instructions) ? body.instructions : undefined,
      cuisine_types: body.cuisine ? [body.cuisine] : undefined,
      tags: Array.isArray(body.tags) ? body.tags : undefined,
      updated_at: new Date().toISOString(),
    } as const;

    const { data: updatedRecipe, error: updateErr } = await supabase
      .from('recipes')
      .update(update)
      .eq('id', params.id)
      .select('*')
      .single();

    if (updateErr) {
      throw new Error(updateErr.message);
    }

    await simpleCache.invalidatePattern(`recipe:${params.id}:*`);

    return NextResponse.json(updatedRecipe);
  } catch (error: any) {
    console.error('Error updating recipe:', error);
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
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnon) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const supabase = createRouteHandlerClient<Database>({ cookies });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: recipe, error: fetchErr } = await supabase
      .from('recipes')
      .select('created_by')
      .eq('id', params.id)
      .single();

    if (fetchErr || !recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    if (recipe.created_by !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error: delErr } = await supabase
      .from('recipes')
      .delete()
      .eq('id', params.id);

    if (delErr) {
      throw new Error(delErr.message);
    }

    await simpleCache.invalidatePattern(`recipe:${params.id}:*`);
    await simpleCache.invalidatePattern(`recipe:list:*`);

    return NextResponse.json({ 
      success: true,
      message: 'Recipe deleted successfully' 
    });
  } catch (error: any) {
    console.error('Error deleting recipe:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}