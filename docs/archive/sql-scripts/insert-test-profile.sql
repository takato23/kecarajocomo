-- Insert test user profile and preferences
-- Replace 'YOUR_USER_ID' with your actual Supabase auth user ID

-- First, get your user ID by running this query:
-- SELECT id, email FROM auth.users;

-- Then use that ID in the following inserts:

-- Insert user profile
INSERT INTO user_profiles (
  user_id,
  username,
  full_name,
  email,
  bio,
  language,
  theme,
  stats
) VALUES (
  'YOUR_USER_ID', -- Replace with your actual user ID
  'testuser',
  'Test User',
  'test@example.com', -- Replace with your actual email
  'Apasionado por la cocina saludable',
  'es',
  'light',
  jsonb_build_object(
    'recipesCreated', 5,
    'mealsPlanned', 23,
    'recipesRated', 12,
    'streakDays', 7,
    'joinedDate', NOW(),
    'lastActive', NOW()
  )
) ON CONFLICT (user_id) DO UPDATE SET
  updated_at = NOW();

-- Insert user preferences
INSERT INTO user_preferences (
  user_id,
  dietary_restrictions,
  allergies,
  cuisine_preferences,
  cooking_skill_level,
  household_size,
  budget,
  nutrition_goals,
  cooking_preferences,
  planning_preferences,
  shopping_preferences,
  notification_settings
) VALUES (
  'YOUR_USER_ID', -- Replace with your actual user ID
  ARRAY['vegetarian'],
  ARRAY['nuts'],
  ARRAY['mediterranean', 'italian', 'mexican'],
  'intermediate',
  4,
  jsonb_build_object(
    'weekly', 150,
    'monthly', 600,
    'currency', 'USD'
  ),
  ARRAY['high-protein', 'low-sugar'],
  jsonb_build_object(
    'timeAvailable', jsonb_build_object('weekday', 30, 'weekend', 60),
    'cookingMethods', ARRAY['oven', 'stovetop', 'slow-cooker'],
    'kitchenTools', ARRAY['basic', 'food-processor', 'instant-pot']
  ),
  jsonb_build_object(
    'planningHorizon', 'weekly',
    'mealTypes', ARRAY['breakfast', 'lunch', 'dinner'],
    'batchCooking', true,
    'leftoverStrategy', 'incorporate',
    'varietyPreference', 'high'
  ),
  jsonb_build_object(
    'preferredStores', ARRAY['Whole Foods', 'Trader Joes'],
    'shoppingDay', 6,
    'deliveryPreferences', ARRAY['curbside']
  ),
  jsonb_build_object(
    'mealReminders', true,
    'shoppingReminders', true,
    'expirationAlerts', true,
    'recipeSuggestions', true,
    'planningPrompts', true,
    'notificationTimes', jsonb_build_object()
  )
) ON CONFLICT (user_id) DO UPDATE SET
  updated_at = NOW();

-- Insert some household members
INSERT INTO household_members (
  user_id,
  name,
  relationship,
  age_group,
  dietary_restrictions,
  preferences
) VALUES 
  (
    'YOUR_USER_ID',
    'María',
    'partner',
    'adult',
    ARRAY['gluten-free'],
    jsonb_build_object(
      'favoriteIngredients', ARRAY['tomatoes', 'cheese', 'pasta'],
      'dislikedIngredients', ARRAY['mushrooms', 'olives']
    )
  ),
  (
    'YOUR_USER_ID',
    'Carlos',
    'child',
    'child',
    ARRAY[]::text[],
    jsonb_build_object(
      'favoriteIngredients', ARRAY['chicken', 'rice', 'fruit'],
      'dislikedIngredients', ARRAY['broccoli', 'fish']
    )
  ),
  (
    'YOUR_USER_ID',
    'Sofia',
    'child',
    'teen',
    ARRAY[]::text[],
    jsonb_build_object(
      'favoriteIngredients', ARRAY['pizza', 'pasta', 'chocolate'],
      'dislikedIngredients', ARRAY['spicy-food']
    )
  );