import { supabase } from '@/lib/supabase/client';
import { PantryItem, Ingredient, IngredientCategory } from '@/types/pantry';

// Database operations for pantry items and ingredients

/**
 * Fetch all pantry items for a user with ingredient details
 */
export async function fetchUserPantryItems(userId: string): Promise<PantryItem[]> {
  const { data, error } = await supabase
    .from('pantry_items')
    .select(`
      *,
      ingredient:ingredients(*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch pantry items: ${error.message}`);
  }

  return data || [];
}

/**
 * Add a new pantry item to the database
 */
export async function addPantryItem(
  userId: string, 
  item: Omit<PantryItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<PantryItem> {
  const { data, error } = await supabase
    .from('pantry_items')
    .insert({
      ...item,
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select(`
      *,
      ingredient:ingredients(*)
    `)
    .single();

  if (error) {
    throw new Error(`Failed to add pantry item: ${error.message}`);
  }

  return data;
}

/**
 * Update an existing pantry item
 */
export async function updatePantryItem(
  id: string, 
  updates: Partial<PantryItem>
): Promise<PantryItem> {
  const { data, error } = await supabase
    .from('pantry_items')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select(`
      *,
      ingredient:ingredients(*)
    `)
    .single();

  if (error) {
    throw new Error(`Failed to update pantry item: ${error.message}`);
  }

  return data;
}

/**
 * Delete a pantry item
 */
export async function deletePantryItem(id: string): Promise<void> {
  const { error } = await supabase
    .from('pantry_items')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete pantry item: ${error.message}`);
  }
}

/**
 * Add multiple pantry items in batch
 */
export async function addMultiplePantryItems(
  userId: string,
  items: Omit<PantryItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>[]
): Promise<PantryItem[]> {
  const now = new Date().toISOString();
  const itemsWithUser = items.map(item => ({
    ...item,
    user_id: userId,
    created_at: now,
    updated_at: now
  }));

  const { data, error } = await supabase
    .from('pantry_items')
    .insert(itemsWithUser)
    .select(`
      *,
      ingredient:ingredients(*)
    `);

  if (error) {
    throw new Error(`Failed to add multiple pantry items: ${error.message}`);
  }

  return data || [];
}

/**
 * Fetch all ingredients
 */
export async function fetchIngredients(): Promise<Ingredient[]> {
  const { data, error } = await supabase
    .from('ingredients')
    .select('*')
    .order('name');

  if (error) {
    throw new Error(`Failed to fetch ingredients: ${error.message}`);
  }

  return data || [];
}

/**
 * Find ingredient by normalized name
 */
export async function findIngredientByName(normalizedName: string): Promise<Ingredient | null> {
  const { data, error } = await supabase
    .from('ingredients')
    .select('*')
    .eq('normalized_name', normalizedName)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
    throw new Error(`Failed to find ingredient: ${error.message}`);
  }

  return data || null;
}

/**
 * Create a new ingredient
 */
export async function createIngredient(ingredient: Omit<Ingredient, 'id' | 'created_at' | 'updated_at'>): Promise<Ingredient> {
  const { data, error } = await supabase
    .from('ingredients')
    .insert({
      ...ingredient,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to create ingredient: ${error.message}`);
  }

  return data;
}

/**
 * Get or create an ingredient by name
 */
export async function getOrCreateIngredient(
  name: string, 
  category?: IngredientCategory
): Promise<Ingredient> {
  const normalizedName = name.toLowerCase().trim();
  
  // Try to find existing ingredient
  let ingredient = await findIngredientByName(normalizedName);
  
  if (!ingredient) {
    // Create new ingredient
    ingredient = await createIngredient({
      name: name.trim(),
      normalized_name: normalizedName,
      category: category || 'otros',
      common_names: [name.trim()]
    });
  }
  
  return ingredient;
}

/**
 * Search ingredients by name
 */
export async function searchIngredients(query: string, limit = 10): Promise<Ingredient[]> {
  const { data, error } = await supabase
    .from('ingredients')
    .select('*')
    .or(`name.ilike.%${query}%,normalized_name.ilike.%${query}%`)
    .limit(limit)
    .order('name');

  if (error) {
    throw new Error(`Failed to search ingredients: ${error.message}`);
  }

  return data || [];
}

/**
 * Get pantry items expiring within specified days
 */
export async function getExpiringItems(userId: string, days = 7): Promise<PantryItem[]> {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  const { data, error } = await supabase
    .from('pantry_items')
    .select(`
      *,
      ingredient:ingredients(*)
    `)
    .eq('user_id', userId)
    .not('expiration_date', 'is', null)
    .lte('expiration_date', futureDate.toISOString().split('T')[0])
    .gte('expiration_date', new Date().toISOString().split('T')[0])
    .order('expiration_date');

  if (error) {
    throw new Error(`Failed to get expiring items: ${error.message}`);
  }

  return data || [];
}

/**
 * Get low stock items
 */
export async function getLowStockItems(userId: string): Promise<PantryItem[]> {
  const { data, error } = await supabase
    .from('pantry_items')
    .select(`
      *,
      ingredient:ingredients(*)
    `)
    .eq('user_id', userId)
    .not('low_stock_threshold', 'is', null)
    .filter('quantity', 'lte', 'low_stock_threshold')
    .order('quantity');

  if (error) {
    throw new Error(`Failed to get low stock items: ${error.message}`);
  }

  return data || [];
}

/**
 * Update pantry item quantity (quick stock update)
 */
export async function updateItemQuantity(id: string, quantity: number): Promise<PantryItem> {
  return updatePantryItem(id, { quantity });
}

/**
 * Realtime subscription for pantry items
 */
export function subscribeToPantryChanges(
  userId: string,
  callback: (payload: any) => void
) {
  return supabase
    .channel('pantry_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'pantry_items',
        filter: `user_id=eq.${userId}`
      },
      callback
    )
    .subscribe();
}

/**
 * Database schema initialization (run this once)
 */
export const PANTRY_SCHEMA = `
-- Create ingredients table
CREATE TABLE IF NOT EXISTS ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT 'otros',
  common_names TEXT[] DEFAULT '{}',
  default_unit TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create pantry_items table
CREATE TABLE IF NOT EXISTS pantry_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'pcs',
  expiration_date DATE,
  purchase_date DATE,
  location TEXT DEFAULT 'despensa',
  notes TEXT,
  photo_url TEXT,
  low_stock_threshold DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, ingredient_id, location)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pantry_items_user_id ON pantry_items(user_id);
CREATE INDEX IF NOT EXISTS idx_pantry_items_expiration ON pantry_items(expiration_date) WHERE expiration_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pantry_items_low_stock ON pantry_items(user_id, quantity, low_stock_threshold) WHERE low_stock_threshold IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ingredients_normalized_name ON ingredients(normalized_name);
CREATE INDEX IF NOT EXISTS idx_ingredients_category ON ingredients(category);

-- Enable RLS
ALTER TABLE pantry_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pantry_items
CREATE POLICY "Users can view own pantry items" ON pantry_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pantry items" ON pantry_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pantry items" ON pantry_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own pantry items" ON pantry_items
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for ingredients (read-only for users, admin can manage)
CREATE POLICY "Anyone can read ingredients" ON ingredients
  FOR SELECT USING (true);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ingredients_updated_at BEFORE UPDATE ON ingredients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pantry_items_updated_at BEFORE UPDATE ON pantry_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;