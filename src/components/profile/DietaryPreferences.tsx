'use client';

import { useState } from 'react';
import { 
  Heart,
  AlertCircle,
  Plus,
  X,
  Save,
  Utensils,
  Users
} from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { UserPreferences, DietaryRestriction, Allergy, HouseholdMember } from '@/types/profile';


interface DietaryPreferencesProps {
  preferences: UserPreferences;
  householdMembers: HouseholdMember[];
  onUpdate: (updates: Partial<UserPreferences>) => Promise<void>;
}

const DIETARY_RESTRICTIONS: { value: DietaryRestriction; label: string }[] = [
  { value: 'vegetarian', label: 'Vegetariano' },
  { value: 'vegan', label: 'Vegano' },
  { value: 'gluten_free', label: 'Sin gluten' },
  { value: 'dairy_free', label: 'Sin lácteos' },
  { value: 'nut_free', label: 'Sin frutos secos' },
  { value: 'shellfish_free', label: 'Sin mariscos' },
  { value: 'egg_free', label: 'Sin huevo' },
  { value: 'soy_free', label: 'Sin soja' },
  { value: 'pescatarian', label: 'Pescatariano' },
  { value: 'paleo', label: 'Paleo' },
  { value: 'keto', label: 'Keto' },
  { value: 'low_carb', label: 'Bajo en carbohidratos' },
  { value: 'low_sodium', label: 'Bajo en sodio' },
  { value: 'halal', label: 'Halal' },
  { value: 'kosher', label: 'Kosher' }
];

const COMMON_ALLERGIES: { value: Allergy; label: string }[] = [
  { value: 'peanuts', label: 'Cacahuetes' },
  { value: 'tree_nuts', label: 'Frutos secos' },
  { value: 'milk', label: 'Leche' },
  { value: 'eggs', label: 'Huevos' },
  { value: 'wheat', label: 'Trigo' },
  { value: 'soy', label: 'Soja' },
  { value: 'fish', label: 'Pescado' },
  { value: 'shellfish', label: 'Mariscos' },
  { value: 'sesame', label: 'Sésamo' }
];

const CUISINE_OPTIONS = [
  'Mexicana', 'Italiana', 'China', 'Japonesa', 'India', 
  'Mediterránea', 'Francesa', 'Tailandesa', 'Española', 
  'Griega', 'Coreana', 'Vietnamita', 'Peruana', 'Argentina'
];

export function DietaryPreferences({ preferences, householdMembers, onUpdate }: DietaryPreferencesProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedPreferences, setEditedPreferences] = useState({
    dietaryRestrictions: preferences.dietaryRestrictions || [],
    allergies: preferences.allergies || [],
    cuisinePreferences: preferences.cuisinePreferences || [],
    nutritionGoals: preferences.nutritionGoals || []
  });
  const [newGoal, setNewGoal] = useState('');

  const handleSave = async () => {
    try {
      await onUpdate(editedPreferences);
      setIsEditing(false);
      toast.success('Preferencias dietéticas actualizadas');
    } catch (error: unknown) {
      toast.error('Error al guardar las preferencias');
    }
  };

  const toggleDietaryRestriction = (restriction: DietaryRestriction) => {
    const current = editedPreferences.dietaryRestrictions;
    const updated = current.includes(restriction)
      ? current.filter(r => r !== restriction)
      : [...current, restriction];
    
    setEditedPreferences({
      ...editedPreferences,
      dietaryRestrictions: updated
    });
  };

  const toggleAllergy = (allergy: Allergy) => {
    const current = editedPreferences.allergies;
    const updated = current.includes(allergy)
      ? current.filter(a => a !== allergy)
      : [...current, allergy];
    
    setEditedPreferences({
      ...editedPreferences,
      allergies: updated
    });
  };

  const toggleCuisine = (cuisine: string) => {
    const current = editedPreferences.cuisinePreferences;
    const updated = current.includes(cuisine)
      ? current.filter(c => c !== cuisine)
      : [...current, cuisine];
    
    setEditedPreferences({
      ...editedPreferences,
      cuisinePreferences: updated
    });
  };

  const addNutritionGoal = () => {
    if (newGoal.trim()) {
      setEditedPreferences({
        ...editedPreferences,
        nutritionGoals: [...editedPreferences.nutritionGoals, newGoal.trim()]
      });
      setNewGoal('');
    }
  };

  const removeNutritionGoal = (goal: string) => {
    setEditedPreferences({
      ...editedPreferences,
      nutritionGoals: editedPreferences.nutritionGoals.filter(g => g !== goal)
    });
  };

  // Get all dietary restrictions including household members
  const allDietaryRestrictions = new Set([
    ...preferences.dietaryRestrictions,
    ...householdMembers.flatMap(m => m.dietaryRestrictions || [])
  ]);

  const allAllergies = new Set([
    ...preferences.allergies,
    ...householdMembers.flatMap(m => m.allergies || [])
  ]);

  return (
    <div className="space-y-6">
      {/* Combined Household Summary */}
      {householdMembers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Resumen del Hogar
            </CardTitle>
            <CardDescription>
              Restricciones y alergias combinadas de todos los miembros
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm text-muted-foreground">Todas las restricciones dietéticas</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {Array.from(allDietaryRestrictions).map(restriction => (
                  <Badge key={restriction} variant="secondary">
                    {DIETARY_RESTRICTIONS.find(r => r.value === restriction)?.label || restriction}
                  </Badge>
                ))}
                {allDietaryRestrictions.size === 0 && (
                  <p className="text-sm text-muted-foreground">No hay restricciones dietéticas</p>
                )}
              </div>
            </div>
            
            <div>
              <Label className="text-sm text-muted-foreground">Todas las alergias</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {Array.from(allAllergies).map(allergy => (
                  <Badge key={allergy} variant="destructive" className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {COMMON_ALLERGIES.find(a => a.value === allergy)?.label || allergy}
                  </Badge>
                ))}
                {allAllergies.size === 0 && (
                  <p className="text-sm text-muted-foreground">No hay alergias registradas</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Personal Dietary Preferences */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Preferencias Dietéticas Personales
              </CardTitle>
              <CardDescription>
                Tus restricciones dietéticas y alergias personales
              </CardDescription>
            </div>
            {!isEditing && (
              <Button onClick={() => setIsEditing(true)} variant="outline">
                Editar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {isEditing ? (
            <>
              {/* Dietary Restrictions */}
              <div>
                <Label>Restricciones Dietéticas</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                  {DIETARY_RESTRICTIONS.map(restriction => (
                    <div key={restriction.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={restriction.value}
                        checked={editedPreferences.dietaryRestrictions.includes(restriction.value)}
                        onCheckedChange={() => toggleDietaryRestriction(restriction.value)}
                      />
                      <Label
                        htmlFor={restriction.value}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {restriction.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Allergies */}
              <div>
                <Label>Alergias</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                  {COMMON_ALLERGIES.map(allergy => (
                    <div key={allergy.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={allergy.value}
                        checked={editedPreferences.allergies.includes(allergy.value)}
                        onCheckedChange={() => toggleAllergy(allergy.value)}
                      />
                      <Label
                        htmlFor={allergy.value}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {allergy.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Save/Cancel buttons */}
              <div className="flex gap-2">
                <Button onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditedPreferences({
                      dietaryRestrictions: preferences.dietaryRestrictions || [],
                      allergies: preferences.allergies || [],
                      cuisinePreferences: preferences.cuisinePreferences || [],
                      nutritionGoals: preferences.nutritionGoals || []
                    });
                    setIsEditing(false);
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Display current preferences */}
              <div>
                <Label className="text-sm text-muted-foreground">Restricciones Dietéticas</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {preferences.dietaryRestrictions.map(restriction => (
                    <Badge key={restriction} variant="secondary">
                      {DIETARY_RESTRICTIONS.find(r => r.value === restriction)?.label || restriction}
                    </Badge>
                  ))}
                  {preferences.dietaryRestrictions.length === 0 && (
                    <p className="text-sm text-muted-foreground">No tienes restricciones dietéticas</p>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-sm text-muted-foreground">Alergias</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {preferences.allergies.map(allergy => (
                    <Badge key={allergy} variant="destructive" className="flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {COMMON_ALLERGIES.find(a => a.value === allergy)?.label || allergy}
                    </Badge>
                  ))}
                  {preferences.allergies.length === 0 && (
                    <p className="text-sm text-muted-foreground">No tienes alergias registradas</p>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Cuisine Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Utensils className="h-5 w-5" />
            Cocinas Favoritas
          </CardTitle>
          <CardDescription>
            Selecciona tus tipos de cocina preferidos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {CUISINE_OPTIONS.map(cuisine => (
                  <div key={cuisine} className="flex items-center space-x-2">
                    <Checkbox
                      id={cuisine}
                      checked={editedPreferences.cuisinePreferences.includes(cuisine)}
                      onCheckedChange={() => toggleCuisine(cuisine)}
                    />
                    <Label
                      htmlFor={cuisine}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {cuisine}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {preferences.cuisinePreferences.map(cuisine => (
                <Badge key={cuisine} variant="outline">
                  {cuisine}
                </Badge>
              ))}
              {preferences.cuisinePreferences.length === 0 && (
                <p className="text-sm text-muted-foreground">No has seleccionado cocinas favoritas</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Nutrition Goals */}
      <Card>
        <CardHeader>
          <CardTitle>Objetivos Nutricionales</CardTitle>
          <CardDescription>
            Define tus objetivos de salud y nutrición
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {editedPreferences.nutritionGoals.map(goal => (
                  <Badge key={goal} variant="secondary" className="flex items-center gap-1">
                    {goal}
                    <button
                      onClick={() => removeNutritionGoal(goal)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Agregar objetivo nutricional..."
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addNutritionGoal()}
                />
                <Button onClick={addNutritionGoal} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {preferences.nutritionGoals?.map(goal => (
                <Badge key={goal} variant="secondary">
                  {goal}
                </Badge>
              ))}
              {(!preferences.nutritionGoals || preferences.nutritionGoals.length === 0) && (
                <p className="text-sm text-muted-foreground">No has definido objetivos nutricionales</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}