-- This SQL creates a function to insert recipes
-- Run this in your Supabase SQL editor to create the function

CREATE OR REPLACE FUNCTION create_recipe(
  p_name TEXT,
  p_ingredients JSONB,
  p_user_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_preparation_time INTEGER DEFAULT NULL,
  p_cooking_time INTEGER DEFAULT NULL,
  p_servings INTEGER DEFAULT NULL,
  p_difficulty_level TEXT DEFAULT NULL,
  p_instructions TEXT[] DEFAULT NULL,
  p_tags TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  ingredients JSONB,
  user_id UUID,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  INSERT INTO recipes (
    name,
    ingredients,
    user_id,
    description,
    preparation_time,
    cooking_time,
    servings,
    difficulty_level,
    instructions,
    tags
  )
  VALUES (
    p_name,
    p_ingredients,
    p_user_id,
    p_description,
    p_preparation_time,
    p_cooking_time,
    p_servings,
    p_difficulty_level,
    p_instructions,
    p_tags
  )
  RETURNING 
    recipes.id,
    recipes.name,
    recipes.ingredients,
    recipes.user_id,
    recipes.created_at;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_recipe TO authenticated;