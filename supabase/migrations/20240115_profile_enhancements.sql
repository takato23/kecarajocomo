-- Enhanced user profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS gender VARCHAR(20),
ADD COLUMN IF NOT EXISTS location JSONB,
ADD COLUMN IF NOT EXISTS theme VARCHAR(10) DEFAULT 'system',
ADD COLUMN IF NOT EXISTS stats JSONB DEFAULT '{"recipesCreated": 0, "mealsPlanned": 0, "recipesRated": 0, "streakDays": 0}',
ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{"profileVisibility": "private", "shareStats": false, "shareMealPlans": false, "shareRecipes": false}',
ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'es',
ADD COLUMN IF NOT EXISTS following TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS followers TEXT[] DEFAULT '{}';

-- Update user_preferences table with new columns
ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS cooking_preferences JSONB DEFAULT '{"timeAvailable": {"weekday": 30, "weekend": 60}, "cookingMethods": [], "kitchenTools": []}',
ADD COLUMN IF NOT EXISTS planning_preferences JSONB DEFAULT '{"planningHorizon": "weekly", "mealTypes": ["breakfast", "lunch", "dinner"], "batchCooking": false, "leftoverStrategy": "incorporate", "varietyPreference": "medium"}',
ADD COLUMN IF NOT EXISTS shopping_preferences JSONB DEFAULT '{"preferredStores": [], "shoppingDay": 6, "deliveryPreferences": []}',
ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{"mealReminders": true, "shoppingReminders": true, "expirationAlerts": true, "recipeSuggestions": true, "planningPrompts": true, "notificationTimes": {}}',
ADD COLUMN IF NOT EXISTS meal_schedule JSONB;

-- Household members table
CREATE TABLE IF NOT EXISTS household_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(100) NOT NULL,
  relationship VARCHAR(20),
  age INTEGER,
  dietary_restrictions TEXT[],
  allergies TEXT[],
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_household_members_user_id ON household_members(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);

-- Update existing RLS policies
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can manage their household members" ON household_members;

-- Create new policy
CREATE POLICY "Users can manage their household members" ON household_members
  FOR ALL USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_household_members_updated_at ON household_members;
CREATE TRIGGER update_household_members_updated_at BEFORE UPDATE ON household_members
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Update stats jsonb when certain actions happen (example trigger)
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- This is a placeholder - implement based on your needs
  -- For example, increment recipesCreated when a recipe is created
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Grant permissions
GRANT ALL ON household_members TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;