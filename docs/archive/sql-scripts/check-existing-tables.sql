-- Check what tables exist in your database
-- Run this first to see current state

-- List all tables in public schema
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check if auth.users has any users
SELECT COUNT(*) as user_count FROM auth.users;

-- If you have different table names, check them:
-- For example, if you have 'profiles' instead of 'user_profiles'
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name IN ('user_profiles', 'profiles', 'user_preferences', 'preferences')
ORDER BY table_name, ordinal_position;