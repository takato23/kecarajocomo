-- Create shopping lists tables
CREATE TABLE IF NOT EXISTS shopping_lists (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Lista de Compras',
  budget DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shopping list items
CREATE TABLE IF NOT EXISTS shopping_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  list_id UUID REFERENCES shopping_lists(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit TEXT,
  category TEXT,
  store TEXT,
  price DECIMAL(10,2),
  checked BOOLEAN DEFAULT false,
  notes TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Price history for tracking
CREATE TABLE IF NOT EXISTS price_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  shopping_item_id UUID REFERENCES shopping_items(id) ON DELETE CASCADE,
  store TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  unit TEXT,
  found_at TIMESTAMPTZ DEFAULT NOW()
);

-- User shopping preferences
CREATE TABLE IF NOT EXISTS shopping_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  preferred_stores TEXT[] DEFAULT ARRAY[]::TEXT[],
  default_budget DECIMAL(10,2) DEFAULT 1000,
  currency TEXT DEFAULT 'ARS',
  auto_save BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_shopping_lists_user_id ON shopping_lists(user_id);
CREATE INDEX idx_shopping_lists_active ON shopping_lists(is_active);
CREATE INDEX idx_shopping_items_list_id ON shopping_items(list_id);
CREATE INDEX idx_shopping_items_checked ON shopping_items(checked);
CREATE INDEX idx_price_history_item_id ON price_history(shopping_item_id);
CREATE INDEX idx_price_history_store ON price_history(store);

-- Row Level Security (RLS)
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_preferences ENABLE ROW LEVEL SECURITY;

-- Policies for shopping_lists
CREATE POLICY "Users can view their own lists" ON shopping_lists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own lists" ON shopping_lists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lists" ON shopping_lists
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lists" ON shopping_lists
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for shopping_items
CREATE POLICY "Users can view items in their lists" ON shopping_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM shopping_lists 
      WHERE shopping_lists.id = shopping_items.list_id 
      AND shopping_lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create items in their lists" ON shopping_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM shopping_lists 
      WHERE shopping_lists.id = shopping_items.list_id 
      AND shopping_lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update items in their lists" ON shopping_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM shopping_lists 
      WHERE shopping_lists.id = shopping_items.list_id 
      AND shopping_lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete items from their lists" ON shopping_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM shopping_lists 
      WHERE shopping_lists.id = shopping_items.list_id 
      AND shopping_lists.user_id = auth.uid()
    )
  );

-- Policies for price_history
CREATE POLICY "Users can view price history for their items" ON price_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM shopping_items
      JOIN shopping_lists ON shopping_lists.id = shopping_items.list_id
      WHERE shopping_items.id = price_history.shopping_item_id
      AND shopping_lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add price history" ON price_history
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM shopping_items
      JOIN shopping_lists ON shopping_lists.id = shopping_items.list_id
      WHERE shopping_items.id = price_history.shopping_item_id
      AND shopping_lists.user_id = auth.uid()
    )
  );

-- Policies for shopping_preferences
CREATE POLICY "Users can view their own preferences" ON shopping_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own preferences" ON shopping_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON shopping_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_shopping_lists_updated_at BEFORE UPDATE ON shopping_lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shopping_items_updated_at BEFORE UPDATE ON shopping_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shopping_preferences_updated_at BEFORE UPDATE ON shopping_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();