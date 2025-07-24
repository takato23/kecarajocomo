# Supabase Setup Guide

## Prerequisites

1. Install the Supabase CLI:
```bash
npm install -g @supabase/cli
```

2. Create a Supabase account at https://supabase.com

## Local Development Setup

### 1. Initialize Supabase locally

```bash
# Start the Supabase development environment
supabase start

# This will start:
# - PostgreSQL database
# - Supabase Studio (dashboard)
# - Authentication service
# - Realtime service
# - Storage service
```

### 2. Apply database migrations

```bash
# Run the initial schema migration
supabase db reset

# Or apply specific migrations
supabase db push
```

### 3. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in the values:

```bash
cp .env.local.example .env.local
```

For local development, get the values from the Supabase CLI output:

```bash
supabase status
```

Example output:
```
API URL: http://localhost:54321
DB URL: postgresql://postgres:postgres@localhost:54322/postgres
Studio URL: http://localhost:54323
Inbucket URL: http://localhost:54324
anon key: your_anon_key_here
service_role key: your_service_role_key_here
```

### 4. Access Supabase Studio

Visit http://localhost:54323 to access the Supabase Studio dashboard where you can:
- View and edit data
- Run SQL queries
- Manage authentication
- Monitor real-time subscriptions

## Production Setup

### 1. Create a new project

1. Go to https://supabase.com/dashboard
2. Create a new project
3. Choose a region close to your users
4. Set a strong database password

### 2. Run migrations

```bash
# Link your local project to the remote project
supabase link --project-ref your-project-ref

# Push the database schema to production
supabase db push
```

### 3. Set production environment variables

Update your production environment (Vercel, Netlify, etc.) with:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Database Schema Overview

The database includes the following main tables:

### Core Tables
- **users**: User profiles (extends Supabase auth)
- **user_profiles**: User preferences and settings
- **recipes**: Recipe data with ingredients and instructions
- **recipe_categories**: Recipe categorization

### Pantry Management
- **pantry_items**: User's pantry inventory
- **ingredients**: Master ingredient database

### Meal Planning
- **planned_meals**: Scheduled meals by date and type
- **shopping_lists**: Shopping lists with items
- **shopping_list_items**: Individual items in shopping lists

### OCR and Scanning
- **scanned_receipts**: Receipt images and parsed data

### Notifications
- **notifications**: System notifications and reminders

## Row Level Security (RLS)

All tables have RLS enabled to ensure users can only access their own data. The policies are automatically applied based on the authenticated user's ID.

## Real-time Features

The app uses Supabase's real-time capabilities for:
- Live updates to meal plans
- Shopping list synchronization
- Notification delivery

## Testing

To test the database setup:

1. Start the local development server:
```bash
npm run dev
```

2. Try creating a meal plan or adding pantry items
3. Check the data in Supabase Studio
4. Test real-time updates by opening multiple browser tabs

## Troubleshooting

### Common Issues

1. **Connection refused**: Make sure Supabase is running (`supabase start`)
2. **Migration failed**: Check the migration files for syntax errors
3. **RLS blocking queries**: Ensure you're authenticated when testing
4. **Missing environment variables**: Double-check your `.env.local` file

### Reset Database

If you need to reset the database:

```bash
supabase db reset
```

This will drop all data and reapply migrations.

### View Logs

```bash
supabase logs
```

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [Next.js with Supabase](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)