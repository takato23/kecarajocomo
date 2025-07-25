# Profile Management Troubleshooting Guide

## Issues Fixed

### 1. Duplicate Profile Page Error ✅
**Problem**: Two pages resolving to `/profile`
- `/src/app/profile/page.tsx` 
- `/src/app/(app)/profile/page.tsx`

**Solution**: 
- Removed `/src/app/profile/page.tsx`
- Updated `/src/app/(app)/profile/page.tsx` to use `ProfileHub` component

### 2. Supabase Migration Error ✅
**Problem**: Invalid keys in `supabase/config.toml`
- `edge_functions` section
- `auth.jwt` section
- `jwt_expiry` and `refresh_token_rotation_enabled`

**Solution**: Commented out incompatible configuration sections

### 3. Import Path Errors ✅
**Problem**: Wrong import paths in ProfileContext
- Was importing from `@/stores/auth` instead of `@/stores/auth-store`

**Solution**: Updated import paths

## Manual Setup Steps

### 1. Run Database Migration
Since `npx supabase migration up` isn't working, use the manual approach:

1. Open your Supabase Dashboard
2. Go to SQL Editor
3. Copy the entire contents of `/docs/manual-profile-migration.sql`
4. Run the SQL script

### 2. Verify Storage Bucket
The migration creates a `user-uploads` bucket for avatars. Verify it exists:
1. Go to Supabase Dashboard > Storage
2. Check for `user-uploads` bucket
3. If missing, the SQL script will create it

### 3. Test the Profile Page
1. Start your development server: `npm run dev`
2. Navigate to `/profile`
3. You should see the ProfileHub component

## Common Issues & Solutions

### Profile Page Not Loading
1. **Check Authentication**: Make sure you're logged in
2. **Check Console**: Look for any JavaScript errors
3. **Verify Providers**: Ensure ProfileProvider is wrapping your app

### Database Errors
1. **Missing Tables**: Run the manual migration SQL
2. **Permission Errors**: Check RLS policies are enabled
3. **Connection Issues**: Verify Supabase is running locally

### Component Errors
If you see TypeScript errors:
1. Restart your dev server
2. Clear Next.js cache: `rm -rf .next`
3. Reinstall dependencies: `npm install`

## File Structure
```
src/
├── contexts/
│   └── ProfileContext.tsx (global profile state)
├── components/
│   └── profile/
│       ├── ProfileHub.tsx (main component)
│       ├── ProfileHeader.tsx
│       ├── ProfileOverview.tsx
│       ├── DietaryPreferences.tsx
│       ├── HouseholdManager.tsx
│       ├── CookingPreferences.tsx
│       ├── ProfileSettings.tsx
│       └── MiniProfileWidget.tsx
├── types/
│   └── profile.ts (TypeScript types)
└── app/
    └── (app)/
        └── profile/
            └── page.tsx (profile page)
```

## Next Steps
1. Run the manual migration
2. Test profile creation and editing
3. Add profile data for your test user
4. Verify integration with meal planner works