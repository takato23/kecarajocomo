-- Complete Profile Tables Creation
-- Run this SQL in your Supabase SQL Editor

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  username VARCHAR(50) UNIQUE,
  full_name VARCHAR(100),
  email VARCHAR(255),
  avatar_url TEXT,
  bio TEXT,
  date_of_birth DATE,
  gender VARCHAR(20),
  location JSONB,
  theme VARCHAR(10) DEFAULT 'system',
  stats JSONB DEFAULT '{"recipesCreated": 0, "mealsPlanned": 0, "recipesRated": 0, "streakDays": 0, "joinedDate": "2024-01-01", "lastActive": "2024-01-01"}',
  privacy_settings JSONB DEFAULT '{"profileVisibility": "private", "shareStats": false, "shareMealPlans": false, "shareRecipes": false}',
  language VARCHAR(10) DEFAULT 'es',
  following TEXT[] DEFAULT '{}',
  followers TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  dietary_restrictions TEXT[] DEFAULT '{}',
  allergies TEXT[] DEFAULT '{}',
  cuisine_preferences TEXT[] DEFAULT '{}',
  cooking_skill_level VARCHAR(20) DEFAULT 'intermediate',
  household_size INTEGER DEFAULT 1,
  budget JSONB DEFAULT '{"weekly": 0, "monthly": 0, "currency": "USD"}',
  nutrition_goals TEXT[] DEFAULT '{}',
  cooking_preferences JSONB DEFAULT '{"timeAvailable": {"weekday": 30, "weekend": 60}, "cookingMethods": [], "kitchenTools": []}',
  planning_preferences JSONB DEFAULT '{"planningHorizon": "weekly", "mealTypes": ["breakfast", "lunch", "dinner"], "batchCooking": false, "leftoverStrategy": "incorporate", "varietyPreference": "medium"}',
  shopping_preferences JSONB DEFAULT '{"preferredStores": [], "shoppingDay": 6, "deliveryPreferences": []}',
  notification_settings JSONB DEFAULT '{"mealReminders": true, "shoppingReminders": true, "expirationAlerts": true, "recipeSuggestions": true, "planningPrompts": true, "notificationTimes": {}}',
  meal_schedule JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create household_members table
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_household_members_user_id ON household_members(user_id);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for user_preferences
CREATE POLICY "Users can view their own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for household_members
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
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_household_members_updated_at BEFORE UPDATE ON household_members
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS trigger AS $$
BEGIN
  -- Create profile entry
  INSERT INTO public.user_profiles (user_id, email, full_name, stats)
  VALUES (
    new.id, 
    new.email,
    new.raw_user_meta_data->>'full_name',
    jsonb_build_object(
      'recipesCreated', 0,
      'mealsPlanned', 0,
      'recipesRated', 0,
      'streakDays', 0,
      'joinedDate', NOW(),
      'lastActive', NOW()
    )
  );
  
  -- Create preferences entry
  INSERT INTO public.user_preferences (user_id)
  VALUES (new.id);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- Grant permissions
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON user_preferences TO authenticated;
GRANT ALL ON household_members TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Create storage bucket for user uploads if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('user-uploads', 'user-uploads', true, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for user uploads
CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'user-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (bucket_id = 'user-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE USING (bucket_id = 'user-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'user-uploads');

-- Insert data for existing users (if any)
INSERT INTO user_profiles (user_id, email)
SELECT id, email FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_profiles)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO user_preferences (user_id)
SELECT id FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_preferences)
ON CONFLICT (user_id) DO NOTHING;