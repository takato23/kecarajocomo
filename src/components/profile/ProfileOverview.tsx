'use client';

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

export function ProfileOverview({ profile, preferences, stats, householdSize }: ProfileOverviewProps) {
  const memberSince = stats?.joinedDate ? format(new Date(stats.joinedDate), 'MMMM yyyy', { locale: es }) : 'Unknown';
  
  return (
    <div className="space-y-6">
      {/* Activity Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comidas Planificadas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.mealsPlanned || 0}</div>
            <p className="text-xs text-muted-foreground">
              +12% desde el mes pasado
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recetas Creadas</CardTitle>
            <ChefHat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.recipesCreated || 0}</div>
            <p className="text-xs text-muted-foreground">
              Tu contribución a la comunidad
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Racha Actual</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.streakDays || 0} días</div>
            <p className="text-xs text-muted-foreground">
              ¡Sigue así!
            </p>
          </CardContent>
        </Card>
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Tamaño del hogar</span>
            </div>
            <Badge variant="secondary">{householdSize} {householdSize === 1 ? 'persona' : 'personas'}</Badge>
          </div>

          {/* Dietary Restrictions */}
          {preferences.dietaryRestrictions.length > 0 && (
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Restricciones dietéticas</span>
              </div>
              <div className="flex flex-wrap gap-1 justify-end">
                {preferences.dietaryRestrictions.map(restriction => (
                  <Badge key={restriction} variant="outline" className="text-xs">
                    {restriction}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Budget */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Presupuesto semanal</span>
            </div>
            <Badge variant="secondary">
              ${preferences.budget?.weekly || 0} {preferences.budget?.currency || 'USD'}
            </Badge>
          </div>

          {/* Cooking Time */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Tiempo para cocinar</span>
            </div>
            <div className="text-sm text-right">
              <div>Entre semana: {preferences.cookingPreferences?.timeAvailable?.weekday || 30} min</div>
              <div>Fin de semana: {preferences.cookingPreferences?.timeAvailable?.weekend || 60} min</div>
            </div>
          </div>

          {/* Skill Level */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Nivel de cocina</span>
            </div>
            <Badge>
              {preferences.cookingSkillLevel === 'beginner' && 'Principiante'}
              {preferences.cookingSkillLevel === 'intermediate' && 'Intermedio'}
              {preferences.cookingSkillLevel === 'advanced' && 'Avanzado'}
              {preferences.cookingSkillLevel === 'expert' && 'Experto'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Nutrition Goals */}
      {preferences.nutritionGoals && preferences.nutritionGoals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Objetivos Nutricionales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {preferences.nutritionGoals.map(goal => (
                <Badge key={goal} variant="secondary">
                  {goal}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cuisine Preferences */}
      {preferences.cuisinePreferences && preferences.cuisinePreferences.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Cocinas Favoritas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {preferences.cuisinePreferences.map(cuisine => (
                <Badge key={cuisine} variant="outline">
                  {cuisine}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}