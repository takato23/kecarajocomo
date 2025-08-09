import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/supabase/types';

import { 
  validateQuery, 
  validateAuthAndBody,
  createSuccessResponse 
} from '@/lib/validation/middleware';
import { 
  RecipeCreateSchema, 
  RecipeQuerySchema 
} from '@/lib/validation/schemas';

export const GET = validateQuery(RecipeQuerySchema, async (request) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnon) {
    return NextResponse.json([], { status: 200 });
  }

  const supabase = createRouteHandlerClient<Database>({ cookies });

  const query = request.validatedQuery!;

  const page = query.page;
  const limit = query.limit;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const tags = query.tags ? query.tags.split(',') : [];

  let select = supabase
    .from('recipes')
    .select('*', { count: 'exact' });

  // Public or own recipes; if authenticated, include own
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.id) {
    select = select.or(`is_public.eq.true,created_by.eq.${user.id}`);
  } else {
    select = select.eq('is_public', true);
  }

  if (query.search) {
    select = select.ilike('name', `%${query.search}%`);
  }
  if (query.cuisine) {
    select = select.contains('cuisine_types', [query.cuisine]);
  }
  if (query.difficulty) {
    select = select.eq('difficulty', query.difficulty);
  }
  if (tags.length > 0) {
    select = select.contains('tags', tags);
  }
  if (query.authorId) {
    select = select.eq('created_by', query.authorId);
  }
  if (typeof query.isPublic === 'boolean') {
    select = select.eq('is_public', query.isPublic);
  }
  if (query.maxPrepTime) {
    select = select.lte('prep_time', query.maxPrepTime);
  }
  if (query.maxCookTime) {
    select = select.lte('cook_time', query.maxCookTime);
  }
  if (query.hasNutrition) {
    select = select.not('nutrition_per_serving', 'is', null);
  }

  const orderBy = query.sortBy ?? 'created_at';
  const orderDir = query.sortOrder ?? 'desc';
  select = select.order(orderBy, { ascending: orderDir === 'asc' });

  const { data, error, count } = await select.range(from, to);
  if (error) {
    throw new Error(error.message);
  }

  return NextResponse.json(data ?? [], { status: 200 });
});

export const POST = validateAuthAndBody(RecipeCreateSchema, async (request) => {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient<Database>({ cookies });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) {
    return createSuccessResponse({ error: 'Unauthorized' } as any, 401);
  }

  const body = request.validatedBody!;

  // Map body to Supabase schema
  const recipeInsert = {
    name: body.title,
    slug: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    description: body.description ?? null,
    image_url: body.imageUrl ?? null,
    prep_time: body.prepTimeMinutes,
    cook_time: body.cookTimeMinutes,
    total_time: body.prepTimeMinutes + body.cookTimeMinutes,
    difficulty: body.difficulty,
    servings: body.servings,
    ingredients: body.ingredients.map(i => ({
      name: i.name,
      quantity: i.quantity,
      unit: i.unit,
      preparation: i.preparation ?? null,
      notes: i.notes ?? null,
      optional: !!i.optional,
    })),
    instructions: body.instructions.map(i => ({
      stepNumber: i.stepNumber,
      instruction: i.instruction,
      duration: i.duration ?? null,
      temperature: i.temperature ?? null,
      notes: i.notes ?? null,
    })),
    nutrition_per_serving: body.nutrition ? {
      calories: body.nutrition.calories,
      protein: body.nutrition.protein,
      carbs: body.nutrition.carbs,
      fat: body.nutrition.fat,
      fiber: body.nutrition.fiber ?? null,
      sugar: body.nutrition.sugar ?? null,
      sodium: body.nutrition.sodium ?? null,
      cholesterol: body.nutrition.cholesterol ?? null,
    } : null,
    tags: body.tags ?? [],
    cuisine_types: body.cuisine ? [body.cuisine] : [],
    is_public: body.isPublic,
    created_by: user.id,
  };

  const { data, error } = await supabase
    .from('recipes')
    .insert(recipeInsert)
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return createSuccessResponse(data, 201);
});