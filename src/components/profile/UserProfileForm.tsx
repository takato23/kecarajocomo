/**
 * User Profile Form Component
 * Handles all profile sections with enhanced validation and UX
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Save, 
  AlertCircle, 
  Check
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { EnhancedLoading, useEnhancedLoading } from '@/components/ui/enhanced-loading';
import { 
  MealPlanningError, 
  MealPlanningErrorCodes 
} from '@/lib/errors/MealPlanningError';
import { 
  UserPreferences, 
  UserPreferencesSchema,
  DietaryRestrictions,
  Allergies,
  Cuisines,
  CookingSkillLevel
} from '@/lib/types/mealPlanning';

interface UserProfileFormProps {
  user: any;
  preferences: UserPreferences;
  section: 'general' | 'preferences' | 'notifications' | 'privacy';
}

interface FormErrors {
  [key: string]: string[];
}

const VALIDATION_STAGES = [
  {
    id: 'validation',
    name: 'Validando datos',
    description: 'Verificando información del perfil',
    icon: AlertCircle,
    estimatedDuration: 1000,
    progress: 0,
    status: 'pending' as const
  },
  {
    id: 'saving',
    name: 'Guardando cambios',
    description: 'Actualizando perfil de usuario',
    icon: Save,
    estimatedDuration: 2000,
    progress: 0,
    status: 'pending' as const
  },
  {
    id: 'completion',
    name: 'Completando',
    description: 'Finalizando actualización',
    icon: Check,
    estimatedDuration: 500,
    progress: 0,
    status: 'pending' as const
  }
];

export function UserProfileForm({ user, preferences, section }: UserProfileFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<any>({});
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  // Enhanced loading state
  const {
    loadingState,
    startLoading,
    updateStageProgress,
    completeStage,
    setError: setLoadingError,
    finishLoading,
    cancelLoading
  } = useEnhancedLoading(VALIDATION_STAGES);

  // Initialize form data based on section
  useEffect(() => {
    const initializeFormData = () => {
      switch (section) {
        case 'general':
          setFormData({
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            bio: user.bio || '',
            location: user.location || '',
            dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
            gender: user.gender || '',
            occupation: user.occupation || ''
          });
          break;
        case 'preferences':
          setFormData({
            dietaryRestrictions: preferences.dietaryRestrictions || [],
            allergies: preferences.allergies || [],
            favoriteCuisines: preferences.favoriteCuisines || [],
            cookingSkillLevel: preferences.cookingSkillLevel || 'intermediate',
            householdSize: preferences.householdSize || 2,
            weeklyBudget: preferences.weeklyBudget || 1000,
            nutritionalGoals: preferences.nutritionalGoals || {
              calories: 2000,
              protein: 150,
              carbs: 250,
              fat: 67
            }
          });
          break;
        case 'notifications':
          setFormData({
            notifications: preferences.notifications || {
              mealReminders: true,
              shoppingReminders: true,
              recipeRecommendations: true,
              weeklyPlanning: true,
              emailUpdates: false,
              pushNotifications: true,
              marketingEmails: false
            }
          });
          break;
        case 'privacy':
          setFormData({
            privacy: {
              profileVisibility: user.profileVisibility || 'private',
              shareRecipes: user.shareRecipes || false,
              dataSharing: user.dataSharing || false,
              analytics: user.analytics || false,
              thirdPartyIntegrations: user.thirdPartyIntegrations || false
            }
          });
          break;
      }
    };

    initializeFormData();
  }, [section, user, preferences]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }));
    setIsDirty(true);
    
    // Clear field-specific errors
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: []
      }));
    }
  };

  const handleNestedInputChange = (parent: string, field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
    setIsDirty(true);
  };

  const toggleArrayItem = (array: string[], item: string) => {
    return array.includes(item) 
      ? array.filter(i => i !== item)
      : [...array, item];
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    try {
      switch (section) {
        case 'general':
          // Basic validation for general info
          if (!formData.name?.trim()) {
            newErrors.name = ['El nombre es requerido'];
          }
          
          if (!formData.email?.trim()) {
            newErrors.email = ['El email es requerido'];
          } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = ['El email no es válido'];
          }

          if (formData.phone && !/^\+?[\d\s\-\(\)]+$/.test(formData.phone)) {
            newErrors.phone = ['El teléfono no es válido'];
          }
          break;

        case 'preferences':
          // Validate preferences using Zod schema
          try {
            const preferencesData = {
              userId: user.id,
              dietaryRestrictions: formData.dietaryRestrictions,
              allergies: formData.allergies,
              favoriteCuisines: formData.favoriteCuisines,
              cookingSkillLevel: formData.cookingSkillLevel,
              householdSize: formData.householdSize,
              weeklyBudget: formData.weeklyBudget,
              nutritionalGoals: formData.nutritionalGoals
            };

            UserPreferencesSchema.parse(preferencesData);
          } catch (error: unknown) {
            if (error.errors) {
              error.errors.forEach((err: any) => {
                const field = err.path.join('.');
                newErrors[field] = newErrors[field] || [];
                newErrors[field].push(err.message);
              });
            }
          }
          break;

        case 'notifications':
          // Notifications validation is minimal since they're boolean switches
          break;

        case 'privacy':
          // Privacy validation is minimal since they're boolean switches
          break;
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    } catch (error: unknown) {
      console.error('Form validation error:', error);
      setErrors({ form: ['Error de validación del formulario'] });
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isDirty) {
      setSuccessMessage('No hay cambios para guardar');
      return;
    }

    setIsSubmitting(true);
    setSuccessMessage('');
    setErrors({});

    // Start enhanced loading
    startLoading('Guardando cambios del perfil...', true);

    try {
      // Stage 1: Validation
      updateStageProgress('validation', 50, 'Validando datos del formulario...');
      const isValid = validateForm();
      
      if (!isValid) {
        throw new MealPlanningError(
          'Validation failed',
          MealPlanningErrorCodes.VALIDATION_FAILED,
          { errors },
          'Por favor corrige los errores en el formulario'
        );
      }

      updateStageProgress('validation', 100, 'Datos validados correctamente');
      completeStage('validation');

      // Stage 2: Saving
      updateStageProgress('saving', 30, 'Preparando datos para guardar...');
      
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          section,
          data: formData
        })
      });

      updateStageProgress('saving', 80, 'Enviando datos al servidor...');

      if (!response.ok) {
        const errorData = await response.json();
        throw new MealPlanningError(
          'Failed to save profile',
          MealPlanningErrorCodes.DATABASE_ERROR,
          { response: errorData },
          errorData.message || 'Error al guardar el perfil'
        );
      }

      updateStageProgress('saving', 100, 'Datos guardados exitosamente');
      completeStage('saving');

      // Stage 3: Completion
      updateStageProgress('completion', 50, 'Finalizando actualización...');
      
      const result = await response.json();
      
      updateStageProgress('completion', 100, 'Perfil actualizado correctamente');
      completeStage('completion');

      // Complete loading
      finishLoading();

      setSuccessMessage('Perfil actualizado exitosamente');
      setIsDirty(false);

      // Refresh the page to show updated data
      setTimeout(() => {
        router.refresh();
      }, 1000);

    } catch (error: unknown) {
      console.error('Error saving profile:', error);
      
      let errorMessage = 'Error al guardar el perfil';
      if (error instanceof MealPlanningError) {
        errorMessage = error.userMessage || error.message;
      }
      
      setLoadingError(errorMessage);
      setErrors({ form: [errorMessage] });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelOperation = () => {
    cancelLoading();
    setIsSubmitting(false);
  };

  const renderGeneralSection = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Nombre completo *</Label>
          <Input
            id="name"
            value={formData.name || ''}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className={errors.name ? 'border-red-500' : ''}
            placeholder="Tu nombre completo"
          />
          {errors.name && (
            <p className="text-sm text-red-600 mt-1">{errors.name[0]}</p>
          )}
        </div>

        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email || ''}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className={errors.email ? 'border-red-500' : ''}
            placeholder="tu@email.com"
          />
          {errors.email && (
            <p className="text-sm text-red-600 mt-1">{errors.email[0]}</p>
          )}
        </div>

        <div>
          <Label htmlFor="phone">Teléfono</Label>
          <Input
            id="phone"
            value={formData.phone || ''}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            className={errors.phone ? 'border-red-500' : ''}
            placeholder="+54 9 11 xxxx-xxxx"
          />
          {errors.phone && (
            <p className="text-sm text-red-600 mt-1">{errors.phone[0]}</p>
          )}
        </div>

        <div>
          <Label htmlFor="location">Ubicación</Label>
          <Input
            id="location"
            value={formData.location || ''}
            onChange={(e) => handleInputChange('location', e.target.value)}
            placeholder="Ciudad, País"
          />
        </div>

        <div>
          <Label htmlFor="dateOfBirth">Fecha de nacimiento</Label>
          <Input
            id="dateOfBirth"
            type="date"
            value={formData.dateOfBirth || ''}
            onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="gender">Género</Label>
          <Select value={formData.gender || ''} onValueChange={(value) => handleInputChange('gender', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona género" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Masculino</SelectItem>
              <SelectItem value="female">Femenino</SelectItem>
              <SelectItem value="other">Otro</SelectItem>
              <SelectItem value="prefer-not-to-say">Prefiero no decir</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="occupation">Ocupación</Label>
        <Input
          id="occupation"
          value={formData.occupation || ''}
          onChange={(e) => handleInputChange('occupation', e.target.value)}
          placeholder="Tu profesión u ocupación"
        />
      </div>

      <div>
        <Label htmlFor="bio">Biografía</Label>
        <Textarea
          id="bio"
          value={formData.bio || ''}
          onChange={(e) => handleInputChange('bio', e.target.value)}
          placeholder="Cuéntanos un poco sobre ti..."
          className="min-h-[100px]"
        />
      </div>
    </div>
  );

  const renderPreferencesSection = () => (
    <div className="space-y-6">
      {/* Dietary Restrictions */}
      <div>
        <Label className="text-base font-medium mb-3 block">Restricciones Dietarias</Label>
        <div className="flex flex-wrap gap-2">
          {Object.values(DietaryRestrictions).map(restriction => (
            <Badge
              key={restriction}
              variant={formData.dietaryRestrictions?.includes(restriction) ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => handleInputChange('dietaryRestrictions', 
                toggleArrayItem(formData.dietaryRestrictions || [], restriction))}
            >
              {restriction}
            </Badge>
          ))}
        </div>
      </div>

      {/* Allergies */}
      <div>
        <Label className="text-base font-medium mb-3 block">Alergias</Label>
        <div className="flex flex-wrap gap-2">
          {Object.values(Allergies).map(allergy => (
            <Badge
              key={allergy}
              variant={formData.allergies?.includes(allergy) ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => handleInputChange('allergies', 
                toggleArrayItem(formData.allergies || [], allergy))}
            >
              {allergy}
            </Badge>
          ))}
        </div>
      </div>

      {/* Favorite Cuisines */}
      <div>
        <Label className="text-base font-medium mb-3 block">Cocinas Favoritas</Label>
        <div className="flex flex-wrap gap-2">
          {Object.values(Cuisines).map(cuisine => (
            <Badge
              key={cuisine}
              variant={formData.favoriteCuisines?.includes(cuisine) ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => handleInputChange('favoriteCuisines', 
                toggleArrayItem(formData.favoriteCuisines || [], cuisine))}
            >
              {cuisine}
            </Badge>
          ))}
        </div>
      </div>

      {/* Cooking Skill Level */}
      <div>
        <Label className="text-base font-medium mb-3 block">Nivel de Cocina</Label>
        <div className="space-y-2">
          {Object.entries(CookingSkillLevel).map(([key, value]) => (
            <div
              key={key}
              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                formData.cookingSkillLevel === value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleInputChange('cookingSkillLevel', value)}
            >
              <div className="font-medium">
                {value === 'beginner' ? 'Principiante' : 
                 value === 'intermediate' ? 'Intermedio' : 'Avanzado'}
              </div>
              <div className="text-sm text-gray-600">
                {value === 'beginner' ? 'Recetas simples de 30 min o menos' : 
                 value === 'intermediate' ? 'Recetas variadas hasta 60 min' : 
                 'Recetas complejas, técnicas avanzadas'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Household Size */}
      <div>
        <Label className="text-base font-medium mb-3 block">Tamaño del Hogar</Label>
        <div className="space-y-2">
          <Slider
            value={[formData.householdSize || 2]}
            onValueChange={(value) => handleInputChange('householdSize', value[0])}
            min={1}
            max={10}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-gray-600">
            <span>1 persona</span>
            <span className="font-medium">{formData.householdSize || 2} personas</span>
            <span>10+ personas</span>
          </div>
        </div>
      </div>

      {/* Weekly Budget */}
      <div>
        <Label className="text-base font-medium mb-3 block">Presupuesto Semanal</Label>
        <div className="space-y-2">
          <Slider
            value={[formData.weeklyBudget || 1000]}
            onValueChange={(value) => handleInputChange('weeklyBudget', value[0])}
            min={500}
            max={5000}
            step={100}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-gray-600">
            <span>$500</span>
            <span className="font-medium">${formData.weeklyBudget || 1000}</span>
            <span>$5000+</span>
          </div>
        </div>
      </div>

      {/* Nutritional Goals */}
      <div>
        <Label className="text-base font-medium mb-3 block">Metas Nutricionales</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="calories">Calorías diarias</Label>
            <Input
              id="calories"
              type="number"
              min="1200"
              max="4000"
              value={formData.nutritionalGoals?.calories || 2000}
              onChange={(e) => handleNestedInputChange('nutritionalGoals', 'calories', parseInt(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="protein">Proteína (g)</Label>
            <Input
              id="protein"
              type="number"
              min="50"
              max="300"
              value={formData.nutritionalGoals?.protein || 150}
              onChange={(e) => handleNestedInputChange('nutritionalGoals', 'protein', parseInt(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="carbs">Carbohidratos (g)</Label>
            <Input
              id="carbs"
              type="number"
              min="50"
              max="500"
              value={formData.nutritionalGoals?.carbs || 250}
              onChange={(e) => handleNestedInputChange('nutritionalGoals', 'carbs', parseInt(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="fat">Grasas (g)</Label>
            <Input
              id="fat"
              type="number"
              min="20"
              max="200"
              value={formData.nutritionalGoals?.fat || 67}
              onChange={(e) => handleNestedInputChange('nutritionalGoals', 'fat', parseInt(e.target.value))}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotificationsSection = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base font-medium">Recordatorios de comidas</Label>
            <p className="text-sm text-gray-600">Recibe notificaciones sobre tus comidas planificadas</p>
          </div>
          <Switch
            checked={formData.notifications?.mealReminders || false}
            onCheckedChange={(checked) => handleNestedInputChange('notifications', 'mealReminders', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base font-medium">Recordatorios de compras</Label>
            <p className="text-sm text-gray-600">Notificaciones sobre listas de compras</p>
          </div>
          <Switch
            checked={formData.notifications?.shoppingReminders || false}
            onCheckedChange={(checked) => handleNestedInputChange('notifications', 'shoppingReminders', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base font-medium">Recomendaciones de recetas</Label>
            <p className="text-sm text-gray-600">Sugerencias personalizadas de recetas</p>
          </div>
          <Switch
            checked={formData.notifications?.recipeRecommendations || false}
            onCheckedChange={(checked) => handleNestedInputChange('notifications', 'recipeRecommendations', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base font-medium">Planificación semanal</Label>
            <p className="text-sm text-gray-600">Recordatorios para planificar la semana</p>
          </div>
          <Switch
            checked={formData.notifications?.weeklyPlanning || false}
            onCheckedChange={(checked) => handleNestedInputChange('notifications', 'weeklyPlanning', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base font-medium">Actualizaciones por email</Label>
            <p className="text-sm text-gray-600">Recibe novedades y actualizaciones</p>
          </div>
          <Switch
            checked={formData.notifications?.emailUpdates || false}
            onCheckedChange={(checked) => handleNestedInputChange('notifications', 'emailUpdates', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base font-medium">Notificaciones push</Label>
            <p className="text-sm text-gray-600">Notificaciones en tiempo real</p>
          </div>
          <Switch
            checked={formData.notifications?.pushNotifications || false}
            onCheckedChange={(checked) => handleNestedInputChange('notifications', 'pushNotifications', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base font-medium">Emails de marketing</Label>
            <p className="text-sm text-gray-600">Promociones y ofertas especiales</p>
          </div>
          <Switch
            checked={formData.notifications?.marketingEmails || false}
            onCheckedChange={(checked) => handleNestedInputChange('notifications', 'marketingEmails', checked)}
          />
        </div>
      </div>
    </div>
  );

  const renderPrivacySection = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label className="text-base font-medium mb-3 block">Visibilidad del perfil</Label>
          <Select 
            value={formData.privacy?.profileVisibility || 'private'} 
            onValueChange={(value) => handleNestedInputChange('privacy', 'profileVisibility', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona visibilidad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="private">Privado</SelectItem>
              <SelectItem value="friends">Solo amigos</SelectItem>
              <SelectItem value="public">Público</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base font-medium">Compartir recetas</Label>
            <p className="text-sm text-gray-600">Permite que otros vean tus recetas</p>
          </div>
          <Switch
            checked={formData.privacy?.shareRecipes || false}
            onCheckedChange={(checked) => handleNestedInputChange('privacy', 'shareRecipes', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base font-medium">Compartir datos</Label>
            <p className="text-sm text-gray-600">Compartir datos anónimos para mejoras</p>
          </div>
          <Switch
            checked={formData.privacy?.dataSharing || false}
            onCheckedChange={(checked) => handleNestedInputChange('privacy', 'dataSharing', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base font-medium">Analytics</Label>
            <p className="text-sm text-gray-600">Permitir análisis de uso para mejoras</p>
          </div>
          <Switch
            checked={formData.privacy?.analytics || false}
            onCheckedChange={(checked) => handleNestedInputChange('privacy', 'analytics', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base font-medium">Integraciones de terceros</Label>
            <p className="text-sm text-gray-600">Conectar con apps y servicios externos</p>
          </div>
          <Switch
            checked={formData.privacy?.thirdPartyIntegrations || false}
            onCheckedChange={(checked) => handleNestedInputChange('privacy', 'thirdPartyIntegrations', checked)}
          />
        </div>
      </div>
    </div>
  );

  const renderSectionContent = () => {
    switch (section) {
      case 'general':
        return renderGeneralSection();
      case 'preferences':
        return renderPreferencesSection();
      case 'notifications':
        return renderNotificationsSection();
      case 'privacy':
        return renderPrivacySection();
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit}>
        {renderSectionContent()}

        {/* Error Messages */}
        {Object.keys(errors).length > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {Object.entries(errors).map(([field, fieldErrors]) => (
                <div key={field}>
                  {fieldErrors.map((error, index) => (
                    <p key={index} className="text-sm">{error}</p>
                  ))}
                </div>
              ))}
            </AlertDescription>
          </Alert>
        )}

        {/* Success Message */}
        {successMessage && (
          <Alert className="border-green-200 bg-green-50">
            <Check className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.refresh()}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !isDirty}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>

      {/* Enhanced Loading State */}
      <EnhancedLoading
        loadingState={loadingState}
        onCancel={handleCancelOperation}
        variant="modal"
      />
    </div>
  );
}