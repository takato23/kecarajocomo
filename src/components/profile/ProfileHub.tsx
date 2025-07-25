'use client';

import React, { useState, useMemo, useCallback, lazy, Suspense } from 'react';
import { 
  User, 
  Settings, 
  Home, 
  Utensils, 
  Bell
} from 'lucide-react';

import { useProfile } from '@/contexts/ProfileContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

import { ProfileHeader } from './ProfileHeader';

// Lazy load tab content components for better initial load performance
const ProfileOverview = lazy(() => import('./ProfileOverview').then(module => ({ default: module.ProfileOverview })));
const DietaryPreferences = lazy(() => import('./DietaryPreferences').then(module => ({ default: module.DietaryPreferences })));
const HouseholdManager = lazy(() => import('./HouseholdManager').then(module => ({ default: module.HouseholdManager })));
const CookingPreferences = lazy(() => import('./CookingPreferences').then(module => ({ default: module.CookingPreferences })));
const ProfileSettings = lazy(() => import('./ProfileSettings').then(module => ({ default: module.ProfileSettings })));

// Loading fallback component
const TabContentSkeleton = React.memo(() => (
  <div className="space-y-6 animate-pulse">
    <div className="h-32 bg-gray-200 rounded-md"></div>
    <div className="h-24 bg-gray-200 rounded-md"></div>
    <div className="h-16 bg-gray-200 rounded-md"></div>
  </div>
));

// Stats card component for better memoization
const StatsCard = React.memo(({ 
  value, 
  label, 
  prefix = '' 
}: { 
  value: number | string; 
  label: string; 
  prefix?: string;
}) => (
  <Card>
    <CardContent className="p-4">
      <div className="text-2xl font-bold">{prefix}{value}</div>
      <p className="text-sm text-muted-foreground">{label}</p>
    </CardContent>
  </Card>
));

// Tab trigger component for better memoization
const ProfileTabTrigger = React.memo(({ 
  value, 
  icon: Icon, 
  label 
}: { 
  value: string; 
  icon: React.ComponentType<{ className?: string }>; 
  label: string;
}) => (
  <TabsTrigger value={value} className="flex items-center gap-2">
    <Icon className="w-4 h-4" />
    <span className="hidden md:inline">{label}</span>
  </TabsTrigger>
));

// Comparison function for React.memo
const ProfileHubComparison = (prevProps: {}, nextProps: {}) => {
  // Since this component has no props, it should only re-render when internal state changes
  return true;
};

export const ProfileHub = React.memo(() => {
  const { 
    profile, 
    preferences, 
    householdMembers,
    isLoading,
    updateProfile, 
    updatePreferences,
    getDietaryRestrictions,
    getAllergies,
    getHouseholdSize
  } = useProfile();
  
  const [activeTab, setActiveTab] = useState('overview');

  // Memoize expensive calculations
  const completionPercentage = useMemo(() => {
    if (!profile || !preferences) return 0;
    
    let completed = 0;
    const total = 10;
    
    // Basic profile
    if (profile.fullName) completed++;
    if (profile.bio) completed++;
    if (profile.avatarUrl) completed++;
    
    // Preferences
    if (preferences.dietaryRestrictions?.length > 0) completed++;
    if (preferences.cuisinePreferences?.length > 0) completed++;
    if (preferences.cookingSkillLevel) completed++;
    if (preferences.budget?.weekly > 0) completed++;
    if (preferences.cookingPreferences?.timeAvailable) completed++;
    if (preferences.mealSchedule) completed++;
    if (householdMembers.length > 0 || preferences.householdSize > 1) completed++;
    
    return Math.round((completed / total) * 100);
  }, [profile, preferences, householdMembers]);

  // Memoize derived stats data
  const statsData = useMemo(() => {
    if (!preferences) return null;
    
    return {
      householdSize: getHouseholdSize(),
      dietaryRestrictions: getDietaryRestrictions().length,
      cuisinePreferences: preferences.cuisinePreferences?.length || 0,
      weeklyBudget: preferences.budget?.weekly || 0
    };
  }, [preferences, householdMembers, getHouseholdSize, getDietaryRestrictions]);

  // Memoize event handlers
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
  }, []);

  const handleDietaryUpdate = useCallback((updates: any) => {
    updatePreferences(updates);
  }, [updatePreferences]);

  // Early return for loading state
  if (!profile || !preferences) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Cargando perfil...</h2>
          <Progress value={33} className="w-48 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-6xl">
      {/* Profile Header */}
      <ProfileHeader 
        profile={profile} 
        completionPercentage={completionPercentage}
        onUpdateProfile={updateProfile}
      />

      {/* Quick Stats - Memoized */}
      {statsData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatsCard 
            value={statsData.householdSize}
            label="Personas en el hogar"
          />
          <StatsCard 
            value={statsData.dietaryRestrictions}
            label="Restricciones dietéticas"
          />
          <StatsCard 
            value={statsData.cuisinePreferences}
            label="Cocinas favoritas"
          />
          <StatsCard 
            value={statsData.weeklyBudget}
            label="Presupuesto semanal"
            prefix="$"
          />
        </div>
      )}

      {/* Profile Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 gap-2">
          <ProfileTabTrigger value="overview" icon={User} label="Resumen" />
          <ProfileTabTrigger value="dietary" icon={Utensils} label="Dieta" />
          <ProfileTabTrigger value="household" icon={Home} label="Hogar" />
          <ProfileTabTrigger value="preferences" icon={Settings} label="Preferencias" />
          <ProfileTabTrigger value="settings" icon={Bell} label="Configuración" />
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Suspense fallback={<TabContentSkeleton />}>
            <ProfileOverview 
              profile={profile} 
              preferences={preferences}
              stats={profile.stats}
              householdSize={statsData?.householdSize || 0}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="dietary" className="space-y-6">
          <Suspense fallback={<TabContentSkeleton />}>
            <DietaryPreferences 
              preferences={preferences}
              householdMembers={householdMembers}
              onUpdate={handleDietaryUpdate}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="household" className="space-y-6">
          <Suspense fallback={<TabContentSkeleton />}>
            <HouseholdManager 
              householdMembers={householdMembers}
              preferences={preferences}
              onUpdatePreferences={updatePreferences}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <Suspense fallback={<TabContentSkeleton />}>
            <CookingPreferences 
              preferences={preferences}
              onUpdate={updatePreferences}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Suspense fallback={<TabContentSkeleton />}>
            <ProfileSettings 
              profile={profile}
              preferences={preferences}
              onUpdateProfile={updateProfile}
              onUpdatePreferences={updatePreferences}
            />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}, ProfileHubComparison);