-- Enhanced recipe management schema
-- This extends the existing recipe table with additional features

-- Update recipes table with new columns
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS title VARCHAR(255);
UPDATE recipes SET title = name WHERE title IS NULL;
ALTER TABLE recipes ALTER COLUMN title SET NOT NULL;

ALTER TABLE recipes ADD COLUMN IF NOT EXISTS cuisine_type VARCHAR(50);
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS meal_types TEXT[] DEFAULT '{}';
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS dietary_tags TEXT[] DEFAULT '{}';
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS difficulty VARCHAR(20) DEFAULT 'medium';
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT FALSE;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS ai_provider VARCHAR(20);
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2);
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS times_cooked INTEGER DEFAULT 0;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS total_time INTEGER GENERATED ALWAYS AS (prep_time + cook_time) STORED;

-- Update recipe_ingredients table with additional fields
ALTER TABLE recipe_ingredients ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE recipe_ingredients ADD COLUMN IF NOT EXISTS optional BOOLEAN DEFAULT FALSE;
ALTER TABLE recipe_ingredients ADD COLUMN IF NOT EXISTS ingredient_group VARCHAR(100);

-- Create recipe instructions table
CREATE TABLE IF NOT EXISTS recipe_instructions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  text TEXT NOT NULL,
  time_minutes INTEGER,
  temperature_value DECIMAL(5,1),
  temperature_unit VARCHAR(20),
  tips TEXT[],
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(recipe_id, step_number)
);

-- Create recipe ratings table
CREATE TABLE IF NOT EXISTS recipe_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(recipe_id, user_id)
);

-- Create cooking sessions table
CREATE TABLE IF NOT EXISTS cooking_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  modifications TEXT[],
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create recipe collections table
CREATE TABLE IF NOT EXISTS recipe_collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create recipe collection items junction table
CREATE TABLE IF NOT EXISTS recipe_collection_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id UUID REFERENCES recipe_collections(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  position INTEGER,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(collection_id, recipe_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_recipes_cuisine ON recipes(cuisine_type);
CREATE INDEX IF NOT EXISTS idx_recipes_difficulty ON recipes(difficulty);
CREATE INDEX IF NOT EXISTS idx_recipes_ai_generated ON recipes(ai_generated);
CREATE INDEX IF NOT EXISTS idx_recipes_is_public ON recipes(is_public);
CREATE INDEX IF NOT EXISTS idx_recipes_rating ON recipes(rating);
CREATE INDEX IF NOT EXISTS idx_recipes_meal_types ON recipes USING GIN(meal_types);
CREATE INDEX IF NOT EXISTS idx_recipes_dietary_tags ON recipes USING GIN(dietary_tags);
CREATE INDEX IF NOT EXISTS idx_recipe_instructions_recipe ON recipe_instructions(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ratings_recipe ON recipe_ratings(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ratings_user ON recipe_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_cooking_sessions_recipe ON cooking_sessions(recipe_id);
CREATE INDEX IF NOT EXISTS idx_cooking_sessions_user ON cooking_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_recipe_collections_user ON recipe_collections(user_id);

-- Enable RLS for new tables
ALTER TABLE recipe_instructions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cooking_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_collection_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for recipe instructions
CREATE POLICY "Recipe instructions are viewable with recipe" ON recipe_instructions
  FOR SELECT USING (
    recipe_id IN (
      SELECT id FROM recipes WHERE 
      is_public = true OR 
      created_by = auth.uid()
    )
  );

CREATE POLICY "Users can manage instructions for their recipes" ON recipe_instructions
  FOR ALL USING (
    recipe_id IN (
      SELECT id FROM recipes WHERE created_by = auth.uid()
    )
  );

-- RLS Policies for recipe ratings
CREATE POLICY "Ratings are viewable for accessible recipes" ON recipe_ratings
  FOR SELECT USING (
    recipe_id IN (
      SELECT id FROM recipes WHERE 
      is_public = true OR 
      created_by = auth.uid()
    )
  );

CREATE POLICY "Users can create one rating per recipe" ON recipe_ratings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings" ON recipe_ratings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ratings" ON recipe_ratings
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for cooking sessions
CREATE POLICY "Users can view their own cooking sessions" ON cooking_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cooking sessions" ON cooking_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cooking sessions" ON cooking_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for recipe collections
CREATE POLICY "Public collections are viewable by everyone" ON recipe_collections
  FOR SELECT USING (is_public = true OR user_id = auth.uid());

CREATE POLICY "Users can create their own collections" ON recipe_collections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collections" ON recipe_collections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collections" ON recipe_collections
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for collection items
CREATE POLICY "Collection items follow collection visibility" ON recipe_collection_items
  FOR SELECT USING (
    collection_id IN (
      SELECT id FROM recipe_collections WHERE 
      is_public = true OR 
      user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage items in their collections" ON recipe_collection_items
  FOR ALL USING (
    collection_id IN (
      SELECT id FROM recipe_collections WHERE user_id = auth.uid()
    )
  );

-- Update triggers for new tables
CREATE TRIGGER update_recipe_ratings_updated_at BEFORE UPDATE ON recipe_ratings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipe_collections_updated_at BEFORE UPDATE ON recipe_collections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update recipe rating average
CREATE OR REPLACE FUNCTION update_recipe_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE recipes
  SET rating = (
    SELECT AVG(rating)::DECIMAL(3,2)
    FROM recipe_ratings
    WHERE recipe_id = COALESCE(NEW.recipe_id, OLD.recipe_id)
  )
  WHERE id = COALESCE(NEW.recipe_id, OLD.recipe_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update recipe rating on rating changes
CREATE TRIGGER update_recipe_rating_on_change
AFTER INSERT OR UPDATE OR DELETE ON recipe_ratings
FOR EACH ROW EXECUTE FUNCTION update_recipe_rating();

-- Function to increment times_cooked
CREATE OR REPLACE FUNCTION increment_times_cooked()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed_at IS NOT NULL AND OLD.completed_at IS NULL THEN
    UPDATE recipes
    SET times_cooked = times_cooked + 1
    WHERE id = NEW.recipe_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to increment times_cooked when session is completed
CREATE TRIGGER increment_times_cooked_on_complete
AFTER UPDATE ON cooking_sessions
FOR EACH ROW EXECUTE FUNCTION increment_times_cooked();