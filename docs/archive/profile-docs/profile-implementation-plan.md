# Profile Management Implementation Plan

## Quick Start Implementation Guide

### Step 1: Create Enhanced Profile Context

```typescript
// src/contexts/ProfileContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useUserStore } from '@/stores/user-store';
import { supabase } from '@/lib/supabase';

const ProfileContext = createContext<ProfileContextValue | null>(null);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuthStore();
  const { profile, preferences, setProfile, setPreferences } = useUserStore();
  
  // Implement all context methods
  const getDietaryRestrictions = () => preferences?.dietaryRestrictions || [];
  const getAllergies = () => preferences?.allergies || [];
  const getHouseholdSize = () => preferences?.householdSize || 1;
  
  const value = {
    profile,
    preferences,
    getDietaryRestrictions,
    getAllergies,
    getHouseholdSize,
    // ... other methods
  };
  
  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) throw new Error('useProfile must be used within ProfileProvider');
  return context;
};
```

### Step 2: Update App Layout to Include Profile Provider

```typescript
// src/app/layout.tsx
import { ProfileProvider } from '@/contexts/ProfileContext';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Providers>
          <ProfileProvider>
            <Navigation />
            {children}
          </ProfileProvider>
        </Providers>
      </body>
    </html>
  );
}
```

### Step 3: Create Profile Hub Component

```typescript
// src/components/profile/ProfileHub.tsx
import { useProfile } from '@/contexts/ProfileContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function ProfileHub() {
  const { profile, preferences, updateProfile, updatePreferences } = useProfile();
  
  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <ProfileHeader profile={profile} onUpdate={updateProfile} />
        
        {/* Profile Tabs */}
        <Tabs defaultValue="overview" className="mt-8">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="dietary">Dieta</TabsTrigger>
            <TabsTrigger value="household">Hogar</TabsTrigger>
            <TabsTrigger value="preferences">Preferencias</TabsTrigger>
            <TabsTrigger value="settings">Configuración</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <ProfileOverview profile={profile} stats={profile?.stats} />
          </TabsContent>
          
          <TabsContent value="dietary">
            <DietaryPreferences 
              preferences={preferences?.dietary} 
              onUpdate={(dietary) => updatePreferences({ dietary })}
            />
          </TabsContent>
          
          <TabsContent value="household">
            <HouseholdManager 
              household={preferences?.household}
              onUpdate={(household) => updatePreferences({ household })}
            />
          </TabsContent>
          
          <TabsContent value="preferences">
            <CookingPreferences 
              cooking={preferences?.cooking}
              planning={preferences?.planning}
              onUpdate={updatePreferences}
            />
          </TabsContent>
          
          <TabsContent value="settings">
            <ProfileSettings 
              notifications={preferences?.notifications}
              privacy={profile?.privacy}
              onUpdate={updatePreferences}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
```

### Step 4: Create Mini Profile Widget

```typescript
// src/components/profile/MiniProfileWidget.tsx
import { useProfile } from '@/contexts/ProfileContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export function MiniProfileWidget() {
  const { profile, getDietaryRestrictions, getHouseholdSize } = useProfile();
  
  return (
    <div className="flex items-center gap-4 p-4 bg-card rounded-lg border">
      <Avatar>
        <AvatarImage src={profile?.avatarUrl} />
        <AvatarFallback>{profile?.fullName?.[0]}</AvatarFallback>
      </Avatar>
      
      <div className="flex-1">
        <h4 className="font-medium">{profile?.fullName}</h4>
        <div className="flex gap-2 mt-1">
          <Badge variant="secondary">
            {getHouseholdSize()} personas
          </Badge>
          {getDietaryRestrictions().map(restriction => (
            <Badge key={restriction} variant="outline">
              {restriction}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### Step 5: Integrate with Meal Planner

```typescript
// src/stores/meal-planner-store.ts
// Update the store to use profile context
import { useProfile } from '@/contexts/ProfileContext';

// In generateMealPlan function:
const generateMealPlan = async () => {
  const profile = useProfile.getState();
  const dietaryRestrictions = profile.getDietaryRestrictions();
  const householdSize = profile.getHouseholdSize();
  const budget = profile.getBudget('weekly');
  
  // Use profile data in meal plan generation
  const plan = await createPersonalizedMealPlan({
    dietaryRestrictions,
    householdSize,
    budget,
    preferences: profile.preferences,
  });
  
  return plan;
};
```

### Step 6: Create Database Migrations

```sql
-- migrations/add_profile_enhancements.sql

-- Enhanced user profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS gender VARCHAR(20),
ADD COLUMN IF NOT EXISTS location JSONB,
ADD COLUMN IF NOT EXISTS theme VARCHAR(10) DEFAULT 'system',
ADD COLUMN IF NOT EXISTS stats JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'es';

-- Household members table
CREATE TABLE IF NOT EXISTS household_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- RLS policies
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their household members" ON household_members
  FOR ALL USING (auth.uid() = user_id);
```

### Step 7: Update API Routes

```typescript
// src/app/api/profile/complete/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });
  
  // Fetch complete profile with all related data
  const [profileResult, preferencesResult, householdResult] = await Promise.all([
    supabase.from('user_profiles').select('*').eq('user_id', user.id).single(),
    supabase.from('user_preferences').select('*').eq('user_id', user.id).single(),
    supabase.from('household_members').select('*').eq('user_id', user.id)
  ]);
  
  return Response.json({
    profile: profileResult.data,
    preferences: preferencesResult.data,
    household: householdResult.data
  });
}
```

## Implementation Checklist

### Week 1: Core Infrastructure
- [ ] Create ProfileContext with all methods
- [ ] Update database schema with migrations
- [ ] Create API endpoints for profile management
- [ ] Set up caching layer with React Query
- [ ] Implement profile data validation

### Week 2: UI Components
- [ ] Build ProfileHub main page
- [ ] Create all preference editor components
- [ ] Implement MiniProfileWidget
- [ ] Update navigation to include profile link
- [ ] Add profile completion indicator

### Week 3: Feature Integration
- [ ] Update MealPlannerStore to use profile
- [ ] Integrate with recipe filtering
- [ ] Update shopping list generation
- [ ] Connect pantry management
- [ ] Add profile-based notifications

### Week 4: Advanced Features
- [ ] Implement household member management
- [ ] Create profile analytics dashboard
- [ ] Add recommendation engine
- [ ] Build profile sharing features
- [ ] Implement data export

### Week 5: Polish & Launch
- [ ] Performance optimization
- [ ] Comprehensive testing
- [ ] Security audit
- [ ] Documentation
- [ ] User onboarding updates

## Key Integration Points

### 1. Meal Planner
```typescript
// Use profile for:
- Household size scaling
- Dietary restriction filtering
- Budget constraints
- Meal schedule preferences
- Cooking time limits
```

### 2. Recipe Discovery
```typescript
// Use profile for:
- Allergy filtering
- Cuisine preference ranking
- Skill level matching
- Kitchen equipment checks
- Nutrition goal alignment
```

### 3. Shopping Lists
```typescript
// Use profile for:
- Budget tracking
- Store preferences
- Household quantity scaling
- Delivery preferences
- Shopping schedule
```

### 4. Pantry Management
```typescript
// Use profile for:
- Expiration preferences
- Storage organization
- Restock thresholds
- Waste tracking
```

## Testing Strategy

### Unit Tests
```typescript
// __tests__/profile-context.test.tsx
describe('ProfileContext', () => {
  it('provides dietary restrictions', () => {
    // Test getDietaryRestrictions
  });
  
  it('calculates household size correctly', () => {
    // Test getHouseholdSize with members
  });
  
  it('handles profile updates optimistically', () => {
    // Test updateProfile with optimistic updates
  });
});
```

### Integration Tests
```typescript
// __tests__/profile-integration.test.tsx
describe('Profile Integration', () => {
  it('meal planner uses profile preferences', () => {
    // Test meal plan generation with profile
  });
  
  it('recipes filter by dietary restrictions', () => {
    // Test recipe filtering
  });
});
```

This implementation plan provides a clear path to creating a holistic profile management system that integrates seamlessly with all features of your application.