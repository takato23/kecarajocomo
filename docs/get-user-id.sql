-- Run this query in Supabase SQL Editor to find your user ID

-- Get all users (you should see your email here)
SELECT 
  id as user_id,
  email,
  created_at,
  last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;

-- Once you have your user ID, check if profile exists
-- Replace 'YOUR_USER_ID' with the actual ID from above
SELECT * FROM user_profiles WHERE user_id = 'YOUR_USER_ID';
SELECT * FROM user_preferences WHERE user_id = 'YOUR_USER_ID';
SELECT * FROM household_members WHERE user_id = 'YOUR_USER_ID';