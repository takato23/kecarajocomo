-- =====================================================
-- RECIPE MODULE SCHEMA EXTENSIONS
-- =====================================================
-- Version: 1.0.0
-- Description: Enhanced recipe schema for KeCaraJoComer

-- =====================================================
-- RECIPE EXTENSIONS & IMPROVEMENTS
-- =====================================================

-- Update recipes table with enhanced fields
ALTER TABLE recipes 
ADD COLUMN IF NOT EXISTS 
  category TEXT DEFAULT 'otros' CHECK (category IN (
    'desayuno', 'almuerzo', 'cena', 'snack', 'postre', 'bebida', 
    'aperitivo', 'ensalada', 'sopa', 'pasta', 'pizza', 'sandwich', 
    'parrilla', 'vegetariano', 'vegano', 'sin_gluten', 'otros'
  )),
ADD COLUMN IF NOT EXISTS
  cuisine_type TEXT CHECK (cuisine_type IN (
    'mexicana', 'italiana', 'asiatica', 'mediterranea', 'americana',
    'francesa', 'india', 'japonesa', 'china', 'tailandesa', 'peruana',
    'argentina', 'fusion', 'internacional'
  )),
ADD COLUMN IF NOT EXISTS
  dietary_flags JSONB DEFAULT '{}', -- {vegetarian: true, gluten_free: false, etc}
ADD COLUMN IF NOT EXISTS
  allergens TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS
  kitchen_equipment TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS
  recipe_yield TEXT, -- "4 porciones", "1 pastel", etc
ADD COLUMN IF NOT EXISTS
  cost_estimate TEXT CHECK (cost_estimate IN ('bajo', 'medio', 'alto')),
ADD COLUMN IF NOT EXISTS
  recipe_images TEXT[] DEFAULT '{}', -- Multiple images support
ADD COLUMN IF NOT EXISTS
  last_cooked_by UUID[] DEFAULT '{}', -- Track who cooked this
ADD COLUMN IF NOT EXISTS
  cooking_notes JSONB DEFAULT '{}', -- User cooking experiences
ADD COLUMN IF NOT EXISTS
  recipe_type TEXT DEFAULT 'recipe' CHECK (recipe_type IN ('recipe', 'technique', 'template'));

-- Recipe ingredients detailed table
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients(id),
  custom_ingredient_name TEXT,
  
  -- Quantity and units
  quantity DECIMAL(10,3) NOT NULL,
  unit TEXT NOT NULL,
  
  -- Preparation details
  preparation TEXT, -- 'picado', 'rallado', 'cocido al vapor', etc
  size_specification TEXT, -- 'mediano', 'grande', '2cm cubos', etc
  
  -- Recipe organization
  section TEXT DEFAULT 'main', -- 'marinade', 'sauce', 'garnish', etc
  order_index INTEGER DEFAULT 0,
  
  -- Flexibility
  is_optional BOOLEAN DEFAULT FALSE,
  substitution_notes TEXT,
  
  -- Metadata
  notes TEXT,
  allergen_info TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CHECK (ingredient_id IS NOT NULL OR custom_ingredient_name IS NOT NULL)
);

-- Recipe instructions detailed table
CREATE TABLE IF NOT EXISTS recipe_instructions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  
  -- Step details
  step_number INTEGER NOT NULL,
  title TEXT, -- Optional step title
  instruction TEXT NOT NULL,
  
  -- Timing
  duration_minutes INTEGER,
  temperature_celsius INTEGER,
  temperature_fahrenheit INTEGER,
  
  -- Media
  image_url TEXT,
  video_url TEXT,
  
  -- Equipment and techniques
  required_equipment TEXT[],
  cooking_method TEXT, -- 'sauté', 'boil', 'roast', etc
  
  -- Organization
  section TEXT DEFAULT 'main', -- 'prep', 'cooking', 'finishing', 'plating'
  is_critical BOOLEAN DEFAULT FALSE, -- Critical timing/technique steps
  
  -- Tips and warnings
  tips TEXT[],
  warnings TEXT[],
  
  -- Metadata
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(recipe_id, step_number)
);

-- Recipe variations and substitutions
CREATE TABLE IF NOT EXISTS recipe_variations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  
  -- Variation details
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  variation_type TEXT CHECK (variation_type IN (
    'ingredient_swap', 'cooking_method', 'dietary', 'seasonal', 'difficulty', 'size'
  )),
  
  -- Changes
  ingredient_changes JSONB DEFAULT '{}',
  instruction_changes JSONB DEFAULT '{}',
  time_adjustments JSONB DEFAULT '{}',
  
  -- Metadata
  difficulty_change INTEGER DEFAULT 0, -- -2 to +2
  time_change_minutes INTEGER DEFAULT 0,
  cost_impact TEXT CHECK (cost_impact IN ('cheaper', 'same', 'more_expensive')),
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recipe collections and user organization
CREATE TABLE IF NOT EXISTS recipe_collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Collection details
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  
  -- Visual
  cover_image_url TEXT,
  color_theme TEXT,
  
  -- Organization
  sort_order TEXT DEFAULT 'manual' CHECK (sort_order IN (
    'manual', 'alphabetical', 'difficulty', 'cook_time', 'recently_added'
  )),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, name)
);

-- Junction table for recipes in collections
CREATE TABLE IF NOT EXISTS collection_recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id UUID NOT NULL REFERENCES recipe_collections(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  
  -- Organization
  order_index INTEGER DEFAULT 0,
  notes TEXT, -- Personal notes about why this recipe is in this collection
  
  added_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(collection_id, recipe_id)
);

-- Recipe cooking sessions (for cooking assistant)
CREATE TABLE IF NOT EXISTS cooking_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Session details
  servings_made INTEGER,
  start_time TIMESTAMPTZ DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  
  -- Progress tracking
  current_step INTEGER DEFAULT 1,
  completed_steps INTEGER[] DEFAULT '{}',
  
  -- Session data
  session_notes TEXT[],
  voice_commands_used BOOLEAN DEFAULT FALSE,
  timers_data JSONB DEFAULT '{}',
  
  -- Results
  success_rating INTEGER CHECK (success_rating >= 1 AND success_rating <= 5),
  taste_rating INTEGER CHECK (taste_rating >= 1 AND taste_rating <= 5),
  difficulty_experienced TEXT CHECK (difficulty_experienced IN (
    'much_easier', 'easier', 'as_expected', 'harder', 'much_harder'
  )),
  
  -- Feedback
  what_worked TEXT,
  what_struggled TEXT,
  modifications_made TEXT,
  would_make_again BOOLEAN,
  
  -- Time tracking
  actual_prep_time INTEGER, -- minutes
  actual_cook_time INTEGER, -- minutes
  
  -- Status
  status TEXT DEFAULT 'in_progress' CHECK (status IN (
    'not_started', 'in_progress', 'paused', 'completed', 'abandoned'
  )),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recipe import/parsing history
CREATE TABLE IF NOT EXISTS recipe_imports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
  
  -- Import details
  source_type TEXT NOT NULL CHECK (source_type IN (
    'url', 'text_paste', 'image_ocr', 'voice_transcription', 'pdf', 'manual_entry'
  )),
  source_data TEXT NOT NULL,
  source_url TEXT,
  
  -- Processing
  parsing_confidence DECIMAL(3,2), -- 0.00 to 1.00
  parsing_warnings TEXT[],
  parsing_errors TEXT[],
  ai_processing_used BOOLEAN DEFAULT FALSE,
  
  -- Results
  parsed_data JSONB NOT NULL,
  success BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recipe tags system
CREATE TABLE IF NOT EXISTS recipe_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  category TEXT CHECK (category IN (
    'cooking_method', 'ingredient', 'diet', 'occasion', 'difficulty', 
    'time', 'equipment', 'season', 'custom'
  )),
  color TEXT,
  description TEXT,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Junction table for recipe tags
CREATE TABLE IF NOT EXISTS recipe_tag_assignments (
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES recipe_tags(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (recipe_id, tag_id)
);

-- Recipe sharing and collaboration
CREATE TABLE IF NOT EXISTS recipe_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Share details
  share_type TEXT CHECK (share_type IN ('public_link', 'user_direct', 'email', 'social')),
  permission_level TEXT DEFAULT 'view' CHECK (permission_level IN ('view', 'cook', 'modify')),
  
  -- Link sharing
  share_token TEXT UNIQUE,
  expires_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  
  -- Message
  message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed TIMESTAMPTZ
);

-- =====================================================
-- INDEXES FOR RECIPE MODULE
-- =====================================================

-- Recipe ingredients
CREATE INDEX idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);
CREATE INDEX idx_recipe_ingredients_ingredient ON recipe_ingredients(ingredient_id);
CREATE INDEX idx_recipe_ingredients_order ON recipe_ingredients(recipe_id, section, order_index);

-- Recipe instructions
CREATE INDEX idx_recipe_instructions_recipe ON recipe_instructions(recipe_id);
CREATE INDEX idx_recipe_instructions_step ON recipe_instructions(recipe_id, step_number);

-- Recipe collections
CREATE INDEX idx_recipe_collections_user ON recipe_collections(user_id);
CREATE INDEX idx_recipe_collections_public ON recipe_collections(is_public) WHERE is_public = true;
CREATE INDEX idx_collection_recipes_collection ON collection_recipes(collection_id, order_index);

-- Cooking sessions
CREATE INDEX idx_cooking_sessions_user ON cooking_sessions(user_id, start_time DESC);
CREATE INDEX idx_cooking_sessions_recipe ON cooking_sessions(recipe_id);
CREATE INDEX idx_cooking_sessions_status ON cooking_sessions(user_id, status);

-- Recipe imports
CREATE INDEX idx_recipe_imports_user ON recipe_imports(user_id, created_at DESC);
CREATE INDEX idx_recipe_imports_success ON recipe_imports(success, created_at DESC);

-- Recipe tags
CREATE INDEX idx_recipe_tags_category ON recipe_tags(category);
CREATE INDEX idx_recipe_tags_usage ON recipe_tags(usage_count DESC);
CREATE INDEX idx_recipe_tag_assignments_recipe ON recipe_tag_assignments(recipe_id);
CREATE INDEX idx_recipe_tag_assignments_tag ON recipe_tag_assignments(tag_id);

-- Recipe shares
CREATE INDEX idx_recipe_shares_recipe ON recipe_shares(recipe_id);
CREATE INDEX idx_recipe_shares_shared_by ON recipe_shares(shared_by);
CREATE INDEX idx_recipe_shares_token ON recipe_shares(share_token) WHERE share_token IS NOT NULL;

-- Enhanced search indexes
CREATE INDEX idx_recipes_category_cuisine ON recipes(category, cuisine_type);
CREATE INDEX idx_recipes_difficulty_time ON recipes(difficulty, total_time);
CREATE INDEX idx_recipes_dietary_flags ON recipes USING GIN(dietary_flags);
CREATE INDEX idx_recipes_allergens ON recipes USING GIN(allergens);
CREATE INDEX idx_recipes_equipment ON recipes USING GIN(kitchen_equipment);

-- Full-text search for recipe content
CREATE INDEX idx_recipe_instructions_search ON recipe_instructions USING GIN(
  to_tsvector('spanish', title || ' ' || instruction || ' ' || COALESCE(notes, ''))
);

-- =====================================================
-- ROW LEVEL SECURITY FOR RECIPE MODULE
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_instructions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cooking_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_tag_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_shares ENABLE ROW LEVEL SECURITY;

-- Recipe ingredients policies
CREATE POLICY "Anyone can view public recipe ingredients" ON recipe_ingredients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_ingredients.recipe_id
      AND (recipes.is_public = true OR recipes.created_by = auth.uid())
    )
  );

CREATE POLICY "Users can manage own recipe ingredients" ON recipe_ingredients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_ingredients.recipe_id
      AND recipes.created_by = auth.uid()
    )
  );

-- Recipe instructions policies
CREATE POLICY "Anyone can view public recipe instructions" ON recipe_instructions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_instructions.recipe_id
      AND (recipes.is_public = true OR recipes.created_by = auth.uid())
    )
  );

CREATE POLICY "Users can manage own recipe instructions" ON recipe_instructions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_instructions.recipe_id
      AND recipes.created_by = auth.uid()
    )
  );

-- Recipe variations policies
CREATE POLICY "Anyone can view public recipe variations" ON recipe_variations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_variations.recipe_id
      AND (recipes.is_public = true OR recipes.created_by = auth.uid())
    )
  );

CREATE POLICY "Users can create variations" ON recipe_variations
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can manage own variations" ON recipe_variations
  FOR UPDATE USING (auth.uid() = created_by);

-- Recipe collections policies
CREATE POLICY "Users can view own and public collections" ON recipe_collections
  FOR SELECT USING (user_id = auth.uid() OR is_public = true);

CREATE POLICY "Users can manage own collections" ON recipe_collections
  FOR ALL USING (user_id = auth.uid());

-- Collection recipes policies
CREATE POLICY "Users can view collection recipes" ON collection_recipes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM recipe_collections
      WHERE recipe_collections.id = collection_recipes.collection_id
      AND (recipe_collections.user_id = auth.uid() OR recipe_collections.is_public = true)
    )
  );

CREATE POLICY "Users can manage own collection recipes" ON collection_recipes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM recipe_collections
      WHERE recipe_collections.id = collection_recipes.collection_id
      AND recipe_collections.user_id = auth.uid()
    )
  );

-- Cooking sessions policies
CREATE POLICY "Users can manage own cooking sessions" ON cooking_sessions
  FOR ALL USING (user_id = auth.uid());

-- Recipe imports policies
CREATE POLICY "Users can manage own recipe imports" ON recipe_imports
  FOR ALL USING (user_id = auth.uid());

-- Recipe tag assignments policies
CREATE POLICY "Anyone can view recipe tags" ON recipe_tag_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_tag_assignments.recipe_id
      AND (recipes.is_public = true OR recipes.created_by = auth.uid())
    )
  );

CREATE POLICY "Users can manage recipe tags" ON recipe_tag_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_tag_assignments.recipe_id
      AND recipes.created_by = auth.uid()
    )
    OR auth.uid() = assigned_by
  );

-- Recipe shares policies
CREATE POLICY "Users can view shares involving them" ON recipe_shares
  FOR SELECT USING (
    shared_by = auth.uid() OR 
    shared_with = auth.uid() OR
    share_type = 'public_link'
  );

CREATE POLICY "Users can create shares for own recipes" ON recipe_shares
  FOR INSERT WITH CHECK (
    shared_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_shares.recipe_id
      AND recipes.created_by = auth.uid()
    )
  );

-- =====================================================
-- ENHANCED TRIGGERS AND FUNCTIONS
-- =====================================================

-- Apply update triggers to new tables
CREATE TRIGGER update_recipe_ingredients_updated_at BEFORE UPDATE ON recipe_ingredients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipe_instructions_updated_at BEFORE UPDATE ON recipe_instructions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipe_variations_updated_at BEFORE UPDATE ON recipe_variations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipe_collections_updated_at BEFORE UPDATE ON recipe_collections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cooking_sessions_updated_at BEFORE UPDATE ON cooking_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update tag usage count
CREATE OR REPLACE FUNCTION update_tag_usage_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE recipe_tags
    SET usage_count = usage_count + 1
    WHERE id = NEW.tag_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE recipe_tags
    SET usage_count = GREATEST(0, usage_count - 1)
    WHERE id = OLD.tag_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tag_usage_on_assignment
  AFTER INSERT OR DELETE ON recipe_tag_assignments
  FOR EACH ROW EXECUTE FUNCTION update_tag_usage_count();

-- Function to generate unique share tokens
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.share_type = 'public_link' AND NEW.share_token IS NULL THEN
    NEW.share_token = encode(gen_random_bytes(16), 'base64url');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_share_token_trigger
  BEFORE INSERT ON recipe_shares
  FOR EACH ROW EXECUTE FUNCTION generate_share_token();

-- Function to auto-categorize recipes based on content
CREATE OR REPLACE FUNCTION auto_categorize_recipe()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-detect dietary flags based on ingredients
  IF NEW.dietary_flags IS NULL OR NEW.dietary_flags = '{}' THEN
    NEW.dietary_flags = jsonb_build_object(
      'vegetarian', NOT EXISTS (
        SELECT 1 FROM recipe_ingredients ri
        JOIN ingredients i ON i.id = ri.ingredient_id
        WHERE ri.recipe_id = NEW.id
        AND 'meat' = ANY(i.dietary_flags)
      ),
      'vegan', NOT EXISTS (
        SELECT 1 FROM recipe_ingredients ri
        JOIN ingredients i ON i.id = ri.ingredient_id
        WHERE ri.recipe_id = NEW.id
        AND ('meat' = ANY(i.dietary_flags) OR 'dairy' = ANY(i.dietary_flags))
      ),
      'gluten_free', NOT EXISTS (
        SELECT 1 FROM recipe_ingredients ri
        JOIN ingredients i ON i.id = ri.ingredient_id
        WHERE ri.recipe_id = NEW.id
        AND 'gluten' = ANY(i.allergens)
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_categorize_recipe_trigger
  BEFORE UPDATE ON recipes
  FOR EACH ROW 
  WHEN (OLD.ingredients IS DISTINCT FROM NEW.ingredients)
  EXECUTE FUNCTION auto_categorize_recipe();

-- =====================================================
-- RECIPE MODULE SEED DATA
-- =====================================================

-- Insert common recipe tags
INSERT INTO recipe_tags (name, category, color, description) VALUES
  ('Rápido', 'time', 'green', 'Recetas de menos de 30 minutos'),
  ('Fácil', 'difficulty', 'blue', 'Recetas para principiantes'),
  ('Saludable', 'diet', 'green', 'Recetas nutritivas y balanceadas'),
  ('Vegetariano', 'diet', 'green', 'Sin carne'),
  ('Vegano', 'diet', 'green', 'Sin productos animales'),
  ('Sin Gluten', 'diet', 'orange', 'Libre de gluten'),
  ('Una Olla', 'cooking_method', 'purple', 'Cocinar todo en una sola olla'),
  ('Horno', 'cooking_method', 'red', 'Cocinado al horno'),
  ('Parrilla', 'cooking_method', 'orange', 'A la parrilla o plancha'),
  ('Crudo', 'cooking_method', 'blue', 'Sin cocción'),
  ('Familiar', 'occasion', 'yellow', 'Perfecto para familias'),
  ('Romántico', 'occasion', 'pink', 'Ideal para cenas románticas'),
  ('Fiesta', 'occasion', 'purple', 'Para celebraciones'),
  ('Económico', 'ingredient', 'green', 'Ingredientes accesibles'),
  ('Gourmet', 'ingredient', 'gold', 'Ingredientes premium'),
  ('Verano', 'season', 'yellow', 'Perfecto para el verano'),
  ('Invierno', 'season', 'blue', 'Reconfortante para el invierno'),
  ('Navidad', 'season', 'red', 'Especial para navidad'),
  ('Picante', 'ingredient', 'red', 'Con chile o especias picantes'),
  ('Dulce', 'ingredient', 'pink', 'Sabores dulces predominantes')
ON CONFLICT (name) DO NOTHING;

-- Create system collections for all users (via trigger or manual process)
-- These would be created when a user signs up