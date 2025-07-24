'use client';

import { useState } from 'react';
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
import { ProfileOverview } from './ProfileOverview';
import { DietaryPreferences } from './DietaryPreferences';
import { HouseholdManager } from './HouseholdManager';
import { CookingPreferences } from './CookingPreferences';
import { ProfileSettings } from './ProfileSettings';


export function ProfileHub() {
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

  // Calculate profile completion
  const calculateCompletion = () => {
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
  };

  const completionPercentage = calculateCompletion();

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

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{getHouseholdSize()}</div>
            <p className="text-sm text-muted-foreground">Personas en el hogar</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{getDietaryRestrictions().length}</div>
            <p className="text-sm text-muted-foreground">Restricciones dietéticas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{preferences.cuisinePreferences?.length || 0}</div>
            <p className="text-sm text-muted-foreground">Cocinas favoritas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">${preferences.budget?.weekly || 0}</div>
            <p className="text-sm text-muted-foreground">Presupuesto semanal</p>
          </CardContent>
        </Card>
      </div>

      {/* Profile Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 gap-2">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span className="hidden md:inline">Resumen</span>
          </TabsTrigger>
          <TabsTrigger value="dietary" className="flex items-center gap-2">
            <Utensils className="w-4 h-4" />
            <span className="hidden md:inline">Dieta</span>
          </TabsTrigger>
          <TabsTrigger value="household" className="flex items-center gap-2">
            <Home className="w-4 h-4" />
            <span className="hidden md:inline">Hogar</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <span className="hidden md:inline">Preferencias</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            <span className="hidden md:inline">Configuración</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <ProfileOverview 
            profile={profile} 
            preferences={preferences}
            stats={profile.stats}
            householdSize={getHouseholdSize()}
          />
        </TabsContent>

        <TabsContent value="dietary" className="space-y-6">
          <DietaryPreferences 
            preferences={preferences}
            householdMembers={householdMembers}
            onUpdate={(updates) => updatePreferences(updates)}
          />
        </TabsContent>

        <TabsContent value="household" className="space-y-6">
          <HouseholdManager 
            householdMembers={householdMembers}
            preferences={preferences}
            onUpdatePreferences={updatePreferences}
          />
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <CookingPreferences 
            preferences={preferences}
            onUpdate={updatePreferences}
          />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <ProfileSettings 
            profile={profile}
            preferences={preferences}
            onUpdateProfile={updateProfile}
            onUpdatePreferences={updatePreferences}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}