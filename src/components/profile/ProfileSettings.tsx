'use client';

import { useState } from 'react';
import { 
  Bell,
  Moon,
  Sun,
  Globe,
  Shield,
  Eye,
  EyeOff,
  Save,
  Edit,
  Users
} from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { UserProfile, UserPreferences } from '@/types/profile';


interface ProfileSettingsProps {
  profile: UserProfile;
  preferences: UserPreferences;
  onUpdateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  onUpdatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
}

const LANGUAGES = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
  { value: 'pt', label: 'Português' },
  { value: 'fr', label: 'Français' }
];

const THEMES = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Oscuro', icon: Moon },
  { value: 'system', label: 'Sistema', icon: Globe }
];

export function ProfileSettings({ profile, preferences, onUpdateProfile, onUpdatePreferences }: ProfileSettingsProps) {
  const [isEditingNotifications, setIsEditingNotifications] = useState(false);
  const [isEditingPrivacy, setIsEditingPrivacy] = useState(false);
  const [editedNotifications, setEditedNotifications] = useState(
    preferences.notificationSettings || {
      mealReminders: true,
      shoppingReminders: true,
      expirationAlerts: true,
      recipeSuggestions: true,
      planningPrompts: true,
      notificationTimes: {}
    }
  );
  const [editedPrivacy, setEditedPrivacy] = useState(
    profile.privacy || {
      profileVisibility: 'private',
      shareStats: false,
      shareMealPlans: false,
      shareRecipes: false
    }
  );

  const handleSaveNotifications = async () => {
    try {
      await onUpdatePreferences({
        notificationSettings: editedNotifications
      });
      setIsEditingNotifications(false);
      toast.success('Notificaciones actualizadas');
    } catch (error: unknown) {
      toast.error('Error al guardar las notificaciones');
    }
  };

  const handleSavePrivacy = async () => {
    try {
      await onUpdateProfile({
        privacy: editedPrivacy
      });
      setIsEditingPrivacy(false);
      toast.success('Configuración de privacidad actualizada');
    } catch (error: unknown) {
      toast.error('Error al guardar la privacidad');
    }
  };

  const handleThemeChange = async (theme: string) => {
    try {
      await onUpdateProfile({ theme: theme as UserProfile['theme'] });
      // Apply theme to document
      if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      toast.success('Tema actualizado');
    } catch (error: unknown) {
      toast.error('Error al cambiar el tema');
    }
  };

  const handleLanguageChange = async (language: string) => {
    try {
      await onUpdateProfile({ language });
      toast.success('Idioma actualizado');
    } catch (error: unknown) {
      toast.error('Error al cambiar el idioma');
    }
  };

  return (
    <div className="space-y-6">
      {/* Appearance Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Apariencia</CardTitle>
          <CardDescription>
            Personaliza cómo se ve la aplicación
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Tema</Label>
            <div className="grid grid-cols-3 gap-2">
              {THEMES.map(theme => {
                const Icon = theme.icon;
                return (
                  <Button
                    key={theme.value}
                    variant={profile.theme === theme.value ? 'default' : 'outline'}
                    onClick={() => handleThemeChange(theme.value)}
                    className="flex items-center gap-2"
                  >
                    <Icon className="w-4 h-4" />
                    {theme.label}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Idioma</Label>
            <Select value={profile.language} onValueChange={handleLanguageChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map(lang => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notificaciones
              </CardTitle>
              <CardDescription>
                Configura cuándo y cómo recibir notificaciones
              </CardDescription>
            </div>
            {!isEditingNotifications && (
              <Button onClick={() => setIsEditingNotifications(true)} variant="outline">
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isEditingNotifications ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="meal-reminders">Recordatorios de Comidas</Label>
                  <p className="text-sm text-muted-foreground">
                    Recibe avisos antes de cada comida
                  </p>
                </div>
                <Switch
                  id="meal-reminders"
                  checked={editedNotifications.mealReminders}
                  onCheckedChange={(checked) => setEditedNotifications({
                    ...editedNotifications,
                    mealReminders: checked
                  })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="shopping-reminders">Recordatorios de Compras</Label>
                  <p className="text-sm text-muted-foreground">
                    Avisos para hacer las compras semanales
                  </p>
                </div>
                <Switch
                  id="shopping-reminders"
                  checked={editedNotifications.shoppingReminders}
                  onCheckedChange={(checked) => setEditedNotifications({
                    ...editedNotifications,
                    shoppingReminders: checked
                  })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="expiration-alerts">Alertas de Caducidad</Label>
                  <p className="text-sm text-muted-foreground">
                    Avisos sobre productos próximos a caducar
                  </p>
                </div>
                <Switch
                  id="expiration-alerts"
                  checked={editedNotifications.expirationAlerts}
                  onCheckedChange={(checked) => setEditedNotifications({
                    ...editedNotifications,
                    expirationAlerts: checked
                  })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="recipe-suggestions">Sugerencias de Recetas</Label>
                  <p className="text-sm text-muted-foreground">
                    Recibe recomendaciones personalizadas
                  </p>
                </div>
                <Switch
                  id="recipe-suggestions"
                  checked={editedNotifications.recipeSuggestions}
                  onCheckedChange={(checked) => setEditedNotifications({
                    ...editedNotifications,
                    recipeSuggestions: checked
                  })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="planning-prompts">Avisos de Planificación</Label>
                  <p className="text-sm text-muted-foreground">
                    Recordatorios para planificar tus comidas
                  </p>
                </div>
                <Switch
                  id="planning-prompts"
                  checked={editedNotifications.planningPrompts}
                  onCheckedChange={(checked) => setEditedNotifications({
                    ...editedNotifications,
                    planningPrompts: checked
                  })}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSaveNotifications}>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditedNotifications(preferences.notificationSettings || {
                      mealReminders: true,
                      shoppingReminders: true,
                      expirationAlerts: true,
                      recipeSuggestions: true,
                      planningPrompts: true,
                      notificationTimes: {}
                    });
                    setIsEditingNotifications(false);
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Recordatorios de Comidas</span>
                <Badge variant={preferences.notificationSettings?.mealReminders ? 'default' : 'secondary'}>
                  {preferences.notificationSettings?.mealReminders ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Recordatorios de Compras</span>
                <Badge variant={preferences.notificationSettings?.shoppingReminders ? 'default' : 'secondary'}>
                  {preferences.notificationSettings?.shoppingReminders ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Alertas de Caducidad</span>
                <Badge variant={preferences.notificationSettings?.expirationAlerts ? 'default' : 'secondary'}>
                  {preferences.notificationSettings?.expirationAlerts ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Sugerencias de Recetas</span>
                <Badge variant={preferences.notificationSettings?.recipeSuggestions ? 'default' : 'secondary'}>
                  {preferences.notificationSettings?.recipeSuggestions ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Avisos de Planificación</span>
                <Badge variant={preferences.notificationSettings?.planningPrompts ? 'default' : 'secondary'}>
                  {preferences.notificationSettings?.planningPrompts ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacidad
              </CardTitle>
              <CardDescription>
                Controla quién puede ver tu información
              </CardDescription>
            </div>
            {!isEditingPrivacy && (
              <Button onClick={() => setIsEditingPrivacy(true)} variant="outline">
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isEditingPrivacy ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Visibilidad del Perfil</Label>
                <Select
                  value={editedPrivacy.profileVisibility}
                  onValueChange={(value) => setEditedPrivacy({
                    ...editedPrivacy,
                    profileVisibility: value as any
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        Público
                      </div>
                    </SelectItem>
                    <SelectItem value="friends">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Solo amigos
                      </div>
                    </SelectItem>
                    <SelectItem value="private">
                      <div className="flex items-center gap-2">
                        <EyeOff className="w-4 h-4" />
                        Privado
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="share-stats">Compartir Estadísticas</Label>
                  <p className="text-sm text-muted-foreground">
                    Otros pueden ver tu actividad y logros
                  </p>
                </div>
                <Switch
                  id="share-stats"
                  checked={editedPrivacy.shareStats}
                  onCheckedChange={(checked) => setEditedPrivacy({
                    ...editedPrivacy,
                    shareStats: checked
                  })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="share-meal-plans">Compartir Planes de Comida</Label>
                  <p className="text-sm text-muted-foreground">
                    Otros pueden ver tus menús semanales
                  </p>
                </div>
                <Switch
                  id="share-meal-plans"
                  checked={editedPrivacy.shareMealPlans}
                  onCheckedChange={(checked) => setEditedPrivacy({
                    ...editedPrivacy,
                    shareMealPlans: checked
                  })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="share-recipes">Compartir Recetas</Label>
                  <p className="text-sm text-muted-foreground">
                    Tus recetas creadas son públicas
                  </p>
                </div>
                <Switch
                  id="share-recipes"
                  checked={editedPrivacy.shareRecipes}
                  onCheckedChange={(checked) => setEditedPrivacy({
                    ...editedPrivacy,
                    shareRecipes: checked
                  })}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSavePrivacy}>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditedPrivacy(profile.privacy || {
                      profileVisibility: 'private',
                      shareStats: false,
                      shareMealPlans: false,
                      shareRecipes: false
                    });
                    setIsEditingPrivacy(false);
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Visibilidad del Perfil</span>
                <Badge variant="secondary">
                  {profile.privacy?.profileVisibility === 'public' && 'Público'}
                  {profile.privacy?.profileVisibility === 'friends' && 'Solo amigos'}
                  {profile.privacy?.profileVisibility === 'private' && 'Privado'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Compartir Estadísticas</span>
                <Badge variant={profile.privacy?.shareStats ? 'default' : 'secondary'}>
                  {profile.privacy?.shareStats ? 'Sí' : 'No'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Compartir Planes de Comida</span>
                <Badge variant={profile.privacy?.shareMealPlans ? 'default' : 'secondary'}>
                  {profile.privacy?.shareMealPlans ? 'Sí' : 'No'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Compartir Recetas</span>
                <Badge variant={profile.privacy?.shareRecipes ? 'default' : 'secondary'}>
                  {profile.privacy?.shareRecipes ? 'Sí' : 'No'}
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}