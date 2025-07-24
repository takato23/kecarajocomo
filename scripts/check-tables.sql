-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_profiles', 'user_preferences', 'pantry_categories', 'pantry_items', 'recipes', 'meal_plans', 'planned_meals')
ORDER BY table_name;