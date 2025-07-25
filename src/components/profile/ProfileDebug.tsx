'use client';

import { useEffect, useState } from 'react';

import { useProfile } from '@/contexts/ProfileContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/store';
import { useAppStore } from '@/store';

export function ProfileDebug() {
  const user = useAppStore((state) => state.user.profile);
  const userStore = useUser();
  const { profile, preferences, isLoading, error } = userStore || {};
  const profileContext = useProfile();
  const [dbData, setDbData] = useState<any>({});

  useEffect(() => {
    const fetchDbData = async () => {
      if (!user?.id) return;
      
      // Fetch raw data from database
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      const { data: prefsData, error: prefsError } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      setDbData({
        profile: profileData,
        profileError,
        preferences: prefsData,
        prefsError
      });
    };
    
    fetchDbData();
  }, [user?.id]);

  return (
    <Card className="max-w-4xl mx-auto mt-8 border-orange-500">
      <CardHeader>
        <CardTitle className="text-orange-500">Profile Debug Info</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold mb-2">Auth User:</h3>
            <div className="bg-muted p-2 rounded text-xs">
              <p>ID: {user?.id || 'No user'}</p>
              <p>Email: {user?.email || 'No email'}</p>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">User Store State:</h3>
            <div className="bg-muted p-2 rounded text-xs">
              <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
              <p>Error: {error || 'None'}</p>
              <p>Profile: {profile ? 'Loaded' : 'Not loaded'}</p>
              <p>Preferences: {preferences ? 'Loaded' : 'Not loaded'}</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Raw Database Data:</h3>
          <div className="bg-muted p-2 rounded text-xs">
            <p>Profile exists: {dbData.profile ? 'Yes' : 'No'}</p>
            {dbData.profileError && <p className="text-red-500">Profile Error: {dbData.profileError.message}</p>}
            <p>Preferences exists: {dbData.preferences ? 'Yes' : 'No'}</p>
            {dbData.prefsError && <p className="text-red-500">Prefs Error: {dbData.prefsError.message}</p>}
            {dbData.preferences && (
              <div className="mt-2">
                <p>dietary_restrictions: {JSON.stringify(dbData.preferences.dietary_restrictions)}</p>
                <p>cooking_skill_level: {dbData.preferences.cooking_skill_level}</p>
                <p>household_size: {dbData.preferences.household_size}</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Transformed Store Data:</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium mb-1">Profile:</h4>
              <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-40">
                {JSON.stringify(profile, null, 2)}
              </pre>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-1">Preferences:</h4>
              <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-40">
                {JSON.stringify(preferences, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}