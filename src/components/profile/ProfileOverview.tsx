'use client';

import React, { useMemo } from 'react';
import { 
  Calendar,
  ChefHat,
  Heart,
  ShoppingCart,
  Users,
  Clock,
  TrendingUp,
  Award
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserProfile, UserPreferences } from '@/types/profile';

interface ProfileOverviewProps {
  profile: UserProfile;
  preferences: UserPreferences;
  stats: UserProfile['stats'];
  householdSize: number;
}

// Memoized StatCard component
const StatCard = React.memo<{
  title: string;
  value: number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}>(({ title, value, description, icon: Icon }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
));

StatCard.displayName = 'StatCard';

// Memoized ProfileRow component
const ProfileRow = React.memo<{
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}>(({ icon: Icon, label, children }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm">{label}</span>
    </div>
    {children}
  </div>
));

ProfileRow.displayName = 'ProfileRow';

// Memoized BadgeList component
const BadgeList = React.memo<{
  items: string[] | undefined;
  variant?: 'default' | 'secondary' | 'outline';
  className?: string;
}>(({ items, variant = 'secondary', className }) => {
  if (!items || items.length === 0) return null;
  
  return (
    <div className="flex flex-wrap gap-1 justify-end">
      {items.map(item => (
        <Badge key={item} variant={variant} className={className}>
          {item}
        </Badge>
      ))}
    </div>
  );
});

BadgeList.displayName = 'BadgeList';

// Memoized BadgeCard component for nutrition goals and cuisine preferences
const BadgeCard = React.memo<{
  title: string;
  items: string[] | undefined;
  variant?: 'default' | 'secondary' | 'outline';
}>(({ title, items, variant = 'secondary' }) => {
  if (!items || items.length === 0) return null;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {items.map(item => (
            <Badge key={item} variant={variant}>
              {item}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

BadgeCard.displayName = 'BadgeCard';

// Custom comparison function for React.memo
const arePropsEqual = (
  prevProps: ProfileOverviewProps,
  nextProps: ProfileOverviewProps
): boolean => {
  return (
    prevProps.householdSize === nextProps.householdSize &&
    prevProps.stats?.mealsPlanned === nextProps.stats?.mealsPlanned &&
    prevProps.stats?.recipesCreated === nextProps.stats?.recipesCreated &&
    prevProps.stats?.streakDays === nextProps.stats?.streakDays &&
    prevProps.stats?.joinedDate === nextProps.stats?.joinedDate &&
    prevProps.preferences.dietaryRestrictions === nextProps.preferences.dietaryRestrictions &&
    prevProps.preferences.nutritionGoals === nextProps.preferences.nutritionGoals &&
    prevProps.preferences.cuisinePreferences === nextProps.preferences.cuisinePreferences &&
    prevProps.preferences.budget?.weekly === nextProps.preferences.budget?.weekly &&
    prevProps.preferences.budget?.currency === nextProps.preferences.budget?.currency &&
    prevProps.preferences.cookingSkillLevel === nextProps.preferences.cookingSkillLevel &&
    prevProps.preferences.cookingPreferences?.timeAvailable?.weekday === nextProps.preferences.cookingPreferences?.timeAvailable?.weekday &&
    prevProps.preferences.cookingPreferences?.timeAvailable?.weekend === nextProps.preferences.cookingPreferences?.timeAvailable?.weekend
  );
};

export const ProfileOverview = React.memo<ProfileOverviewProps>(({ 
  profile, 
  preferences, 
  stats, 
  householdSize 
}) => {
  // Memoized date formatting
  const memberSince = useMemo(() => {
    if (!stats?.joinedDate) return 'Unknown';
    return format(new Date(stats.joinedDate), 'MMMM yyyy', { locale: es });
  }, [stats?.joinedDate]);

  // Memoized skill level translation
  const skillLevelText = useMemo(() => {
    const skillMap = {
      beginner: 'Principiante',
      intermediate: 'Intermedio',
      advanced: 'Avanzado',
      expert: 'Experto'
    } as const;
    
    return skillMap[preferences.cookingSkillLevel] || '';
  }, [preferences.cookingSkillLevel]);

  // Memoized household text
  const householdText = useMemo(() => 
    `${householdSize} ${householdSize === 1 ? 'persona' : 'personas'}`,
    [householdSize]
  );

  // Memoized budget text
  const budgetText = useMemo(() => 
    `$${preferences.budget?.weekly || 0} ${preferences.budget?.currency || 'USD'}`,
    [preferences.budget?.weekly, preferences.budget?.currency]
  );

  // Memoized time availability text
  const timeAvailabilityText = useMemo(() => ({
    weekday: `Entre semana: ${preferences.cookingPreferences?.timeAvailable?.weekday || 30} min`,
    weekend: `Fin de semana: ${preferences.cookingPreferences?.timeAvailable?.weekend || 60} min`
  }), [
    preferences.cookingPreferences?.timeAvailable?.weekday,
    preferences.cookingPreferences?.timeAvailable?.weekend
  ]);

  // Memoized stats data
  const statsData = useMemo(() => [
    {
      title: 'Comidas Planificadas',
      value: stats?.mealsPlanned || 0,
      description: '+12% desde el mes pasado',
      icon: Calendar
    },
    {
      title: 'Recetas Creadas',
      value: stats?.recipesCreated || 0,
      description: 'Tu contribución a la comunidad',
      icon: ChefHat
    },
    {
      title: 'Racha Actual',
      value: stats?.streakDays || 0,
      description: '¡Sigue así!',
      icon: TrendingUp
    }
  ], [stats?.mealsPlanned, stats?.recipesCreated, stats?.streakDays]);

  // Check if dietary restrictions should be shown
  const showDietaryRestrictions = useMemo(() => 
    preferences.dietaryRestrictions && preferences.dietaryRestrictions.length > 0,
    [preferences.dietaryRestrictions]
  );

  return (
    <div className="space-y-6">
      {/* Activity Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statsData.map((stat) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            description={stat.description}
            icon={stat.icon}
          />
        ))}
      </div>

      {/* Profile Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen de tu Perfil</CardTitle>
          <CardDescription>
            Miembro desde {memberSince}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Household */}
          <ProfileRow icon={Users} label="Tamaño del hogar">
            <Badge variant="secondary">{householdText}</Badge>
          </ProfileRow>

          {/* Dietary Restrictions */}
          {showDietaryRestrictions && (
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Restricciones dietéticas</span>
              </div>
              <BadgeList 
                items={preferences.dietaryRestrictions} 
                variant="outline" 
                className="text-xs"
              />
            </div>
          )}

          {/* Budget */}
          <ProfileRow icon={ShoppingCart} label="Presupuesto semanal">
            <Badge variant="secondary">{budgetText}</Badge>
          </ProfileRow>

          {/* Cooking Time */}
          <ProfileRow icon={Clock} label="Tiempo para cocinar">
            <div className="text-sm text-right">
              <div>{timeAvailabilityText.weekday}</div>
              <div>{timeAvailabilityText.weekend}</div>
            </div>
          </ProfileRow>

          {/* Skill Level */}
          <ProfileRow icon={Award} label="Nivel de cocina">
            <Badge>{skillLevelText}</Badge>
          </ProfileRow>
        </CardContent>
      </Card>

      {/* Nutrition Goals */}
      <BadgeCard 
        title="Objetivos Nutricionales"
        items={preferences.nutritionGoals}
        variant="secondary"
      />

      {/* Cuisine Preferences */}
      <BadgeCard 
        title="Cocinas Favoritas"
        items={preferences.cuisinePreferences}
        variant="outline"
      />
    </div>
  );
}, arePropsEqual);