-- Migration: Complete Prisma to Supabase Migration
-- Date: 2025-01-27
-- Purpose: Create missing tables and complete schema for full migration from Prisma

-- Create recipe_ingredients table if not exists
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients(id),
  quantity DECIMAL(10,2) NOT NULL,
  unit TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(recipe_id, ingredient_id)
);

-- Create nutrition_info table if not exists
CREATE TABLE IF NOT EXISTS nutrition_info (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id UUID UNIQUE REFERENCES recipes(id) ON DELETE CASCADE,
  calories DECIMAL(10,2),
  protein DECIMAL(10,2),
  carbs DECIMAL(10,2),
  fat DECIMAL(10,2),
  fiber DECIMAL(10,2),
  sugar DECIMAL(10,2),
  sodium DECIMAL(10,2),
  cholesterol DECIMAL(10,2),
  serving_size TEXT,
  servings_per_recipe INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create products table for price tracking
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  barcode TEXT,
  brand TEXT,
  category TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(barcode)
);

-- Create price_history table
CREATE TABLE IF NOT EXISTS price_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'ARS',
  is_promotion BOOLEAN DEFAULT false,
  promotion_details TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_price_history_product (product_id),
  INDEX idx_price_history_store (store_id),
  INDEX idx_price_history_date (recorded_at)
);

-- Add missing columns to existing tables if they don't exist
DO $$ 
BEGIN
  -- Add unit column to pantry_items if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='pantry_items' AND column_name='unit') THEN
    ALTER TABLE pantry_items ADD COLUMN unit TEXT DEFAULT 'unidad';
  END IF;

  -- Add barcode to pantry_items if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='pantry_items' AND column_name='barcode') THEN
    ALTER TABLE pantry_items ADD COLUMN barcode TEXT;
  END IF;

  -- Add nutrition columns to recipes if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='recipes' AND column_name='total_time') THEN
    ALTER TABLE recipes ADD COLUMN total_time INTEGER;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='recipes' AND column_name='difficulty') THEN
    ALTER TABLE recipes ADD COLUMN difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='recipes' AND column_name='cuisine') THEN
    ALTER TABLE recipes ADD COLUMN cuisine TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='recipes' AND column_name='diet_type') THEN
    ALTER TABLE recipes ADD COLUMN diet_type TEXT[];
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='recipes' AND column_name='tags') THEN
    ALTER TABLE recipes ADD COLUMN tags TEXT[];
  END IF;

  -- Add source info to recipes
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='recipes' AND column_name='source') THEN
    ALTER TABLE recipes ADD COLUMN source TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='recipes' AND column_name='source_url') THEN
    ALTER TABLE recipes ADD COLUMN source_url TEXT;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_recipes_user ON recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_recipes_created ON recipes(created_at);
CREATE INDEX IF NOT EXISTS idx_pantry_items_user ON pantry_items(user_id);
CREATE INDEX IF NOT EXISTS idx_pantry_items_expiry ON pantry_items(expiration_date);

-- Enable Row Level Security on new tables
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for recipe_ingredients
CREATE POLICY "Users can view recipe ingredients for their recipes" ON recipe_ingredients
  FOR SELECT USING (
    recipe_id IN (SELECT id FROM recipes WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage recipe ingredients for their recipes" ON recipe_ingredients
  FOR ALL USING (
    recipe_id IN (SELECT id FROM recipes WHERE user_id = auth.uid())
  );

-- Create RLS policies for nutrition_info
CREATE POLICY "Users can view nutrition info for their recipes" ON nutrition_info
  FOR SELECT USING (
    recipe_id IN (SELECT id FROM recipes WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage nutrition info for their recipes" ON nutrition_info
  FOR ALL USING (
    recipe_id IN (SELECT id FROM recipes WHERE user_id = auth.uid())
  );

-- Create RLS policies for products (public read, authenticated write)
CREATE POLICY "Anyone can view products" ON products
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create products" ON products
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update products" ON products
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Create RLS policies for price_history (public read, authenticated write)
CREATE POLICY "Anyone can view price history" ON price_history
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can add price history" ON price_history
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language plpgsql;

-- Apply updated_at triggers to new tables
CREATE TRIGGER update_recipe_ingredients_updated_at BEFORE UPDATE ON recipe_ingredients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nutrition_info_updated_at BEFORE UPDATE ON nutrition_info
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON recipe_ingredients TO authenticated;
GRANT ALL ON nutrition_info TO authenticated;
GRANT ALL ON products TO authenticated;
GRANT ALL ON price_history TO authenticated;
GRANT SELECT ON products TO anon;
GRANT SELECT ON price_history TO anon;