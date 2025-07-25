# Profile System Testing Instructions

## Current Status
The profile management system has been implemented with the following components:
- ProfileContext for global state management
- User store with data transformation (snake_case ↔ camelCase)
- Automatic profile creation for new users
- Debug component to troubleshoot issues

## To Test the Profile System:

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Navigate to the profile page:**
   - Go to http://localhost:3000/profile
   - You should see the ProfileDebug component with orange border at the top

3. **Check the Debug Info:**
   The debug component shows:
   - Auth User: Your user ID and email
   - User Store State: Loading status and any errors
   - Raw Database Data: What's actually in the database
   - Transformed Store Data: How the data looks after transformation

4. **If you see "No profile" or "No preferences":**
   - The system should automatically create default records
   - Refresh the page once to trigger the creation
   - Check the "Raw Database Data" section for any errors

5. **To manually insert test data:**
   - First, get your user ID from the debug info
   - Open Supabase SQL Editor
   - Update the user ID in `/docs/insert-test-profile.sql`
   - Run the SQL commands

6. **Expected Behavior:**
   - On first visit, the system creates default profile/preferences
   - The ProfileHub should load and display your profile
   - You should see stats, preferences, and be able to edit them

## Troubleshooting:

- **"Cargando perfil..." stuck:** Check Raw Database Data for errors
- **TypeError in console:** Data transformation is working correctly now
- **No data showing:** Refresh the page to trigger profile creation

## What's Working:
✅ Database tables created
✅ Data transformation (snake_case ↔ camelCase)
✅ Automatic profile creation
✅ Profile and preferences fetching
✅ Debug component for troubleshooting

## Next Steps:
- Remove ProfileDebug component once everything works
- Test editing profile information
- Test household member management