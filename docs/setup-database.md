# Database Setup Instructions

## 1. Access Supabase Dashboard
1. Go to https://zuzhocubyiicgdvyyhky.supabase.co
2. Login to your Supabase dashboard
3. Navigate to the SQL Editor

## 2. Execute Database Script
Copy and paste the content from `scripts/init-database.sql` into the SQL Editor and execute it.

This will create:
- User profiles table
- User preferences table  
- Pantry categories and items tables
- Recipes table
- Meal plans and planned meals tables
- All necessary indexes
- Row Level Security policies
- Trigger functions

## 3. Verify Setup
After running the script, you should see these tables in your database:
- `user_profiles`
- `user_preferences` 
- `pantry_categories`
- `pantry_items`
- `recipes`
- `meal_plans`
- `planned_meals`

## 4. Test the Application
1. Open http://localhost:3000
2. Click "Sign Up" to create a new account
3. Complete the onboarding flow
4. Verify that your profile is created in the database

## Next Steps
Once the database is set up and you've tested the authentication flow, we can:
1. Add AI provider API keys to generate meal plans
2. Implement the meal planning features
3. Add recipe recommendations