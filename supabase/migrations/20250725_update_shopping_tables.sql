-- Update shopping_lists table to match ShoppingOptimizer interface
ALTER TABLE shopping_lists 
ADD COLUMN IF NOT EXISTS total_estimated DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS optimized_route JSONB DEFAULT '[]'::JSONB,
ADD COLUMN IF NOT EXISTS related_meal_plan TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived'));

-- Update shopping_items table to match ShoppingItem interface
ALTER TABLE shopping_items 
ADD COLUMN IF NOT EXISTS estimated_price DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'recommended' CHECK (priority IN ('essential', 'recommended', 'optional')),
ADD COLUMN IF NOT EXISTS aisle TEXT;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_shopping_lists_status ON shopping_lists(status);
CREATE INDEX IF NOT EXISTS idx_shopping_items_priority ON shopping_items(priority);

-- Create a table for item usage history
CREATE TABLE IF NOT EXISTS item_usage_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item_name TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit TEXT,
  used_at TIMESTAMPTZ DEFAULT NOW(),
  context TEXT, -- e.g., 'meal_plan', 'manual', 'pantry_update'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for item usage history
CREATE INDEX IF NOT EXISTS idx_item_usage_history_user_id ON item_usage_history(user_id);
CREATE INDEX IF NOT EXISTS idx_item_usage_history_item_name ON item_usage_history(item_name);

-- Enable RLS for item_usage_history
ALTER TABLE item_usage_history ENABLE ROW LEVEL SECURITY;

-- Create policies for item_usage_history
CREATE POLICY "Users can view their own item history" ON item_usage_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own item history" ON item_usage_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create a view for item savings calculations
CREATE OR REPLACE VIEW user_savings_summary AS
SELECT 
  sl.user_id,
  DATE_TRUNC('month', sl.created_at) as month,
  COUNT(DISTINCT sl.id) as lists_count,
  SUM(si.estimated_price - COALESCE(si.price, si.estimated_price)) as total_savings,
  AVG(si.estimated_price - COALESCE(si.price, si.estimated_price)) as avg_savings_per_item
FROM shopping_lists sl
JOIN shopping_items si ON si.list_id = sl.id
WHERE sl.status = 'completed'
GROUP BY sl.user_id, DATE_TRUNC('month', sl.created_at);

-- Grant permissions for the view
GRANT SELECT ON user_savings_summary TO authenticated;