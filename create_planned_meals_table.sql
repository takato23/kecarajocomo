-- Create ingredients table if it doesn't exist (referenced by recipe_ingredients)
CREATE TABLE IF NOT EXISTS ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    category TEXT,
    default_unit TEXT,
    nutritional_info JSONB,
    common_names TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for ingredients
CREATE INDEX IF NOT EXISTS idx_ingredients_name ON ingredients(name);
CREATE INDEX IF NOT EXISTS idx_ingredients_category ON ingredients(category);

-- Create recipes table if it doesn't exist
CREATE TABLE IF NOT EXISTS recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    preparation_time INTEGER, -- in minutes
    servings INTEGER DEFAULT 2,
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
    image_url TEXT,
    ingredients JSONB,
    instructions JSONB,
    macronutrients JSONB,
    is_ai_generated BOOLEAN DEFAULT FALSE,
    is_favorite BOOLEAN DEFAULT FALSE,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for recipes
CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_recipes_name ON recipes(name);
CREATE INDEX IF NOT EXISTS idx_recipes_tags ON recipes USING GIN(tags);

-- Enable RLS for recipes
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for recipes
CREATE POLICY "Users can view their own recipes" ON recipes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recipes" ON recipes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recipes" ON recipes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recipes" ON recipes
    FOR DELETE USING (auth.uid() = user_id);

-- Create recipe_ingredients table for better normalization (optional)
CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    ingredient_id UUID REFERENCES ingredients(id) ON DELETE SET NULL,
    ingredient_name TEXT NOT NULL,
    quantity NUMERIC,
    unit TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for recipe_ingredients
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_ingredient_id ON recipe_ingredients(ingredient_id);

-- Enable RLS for recipe_ingredients
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for recipe_ingredients
CREATE POLICY "Users can view recipe ingredients" ON recipe_ingredients
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM recipes 
            WHERE recipes.id = recipe_ingredients.recipe_id 
            AND recipes.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage recipe ingredients" ON recipe_ingredients
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM recipes 
            WHERE recipes.id = recipe_ingredients.recipe_id 
            AND recipes.user_id = auth.uid()
        )
    );

-- Create planned_meals table if it doesn't exist
CREATE TABLE IF NOT EXISTS planned_meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
    custom_meal_name TEXT,
    plan_date DATE NOT NULL,
    meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    servings INTEGER,
    notes TEXT,
    is_prepared BOOLEAN DEFAULT FALSE,
    preparation_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_planned_meals_user_id ON planned_meals(user_id);
CREATE INDEX IF NOT EXISTS idx_planned_meals_plan_date ON planned_meals(plan_date);
CREATE INDEX IF NOT EXISTS idx_planned_meals_user_date ON planned_meals(user_id, plan_date);

-- Enable RLS (Row Level Security)
ALTER TABLE planned_meals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own planned meals" ON planned_meals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own planned meals" ON planned_meals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own planned meals" ON planned_meals
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own planned meals" ON planned_meals
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at for planned_meals
CREATE TRIGGER update_planned_meals_updated_at BEFORE UPDATE ON planned_meals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to automatically update updated_at for recipes
CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON recipes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();