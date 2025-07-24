'use client';

import { useState } from 'react';
import { 
  ChefHat,
  Utensils,
  Calendar,
  Save,
  Edit
} from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { UserPreferences } from '@/types/profile';


interface CookingPreferencesProps {
  preferences: UserPreferences;
  onUpdate: (updates: Partial<UserPreferences>) => Promise<void>;
}

const COOKING_METHODS = [
  'Hornear', 'Asar', 'Hervir', 'Freír', 'Vapor', 
  'Plancha', 'Microondas', 'Olla de presión', 'Slow cooker'
];

const KITCHEN_TOOLS = [
  'Horno', 'Estufa', 'Microondas', 'Licuadora', 'Procesador de alimentos',
  'Batidora', 'Olla de presión', 'Freidora de aire', 'Plancha',
  'Tostadora', 'Slow cooker', 'Thermomix'
];

const MEAL_TYPES = [
  { value: 'breakfast', label: 'Desayuno' },
  { value: 'lunch', label: 'Almuerzo' },
  { value: 'dinner', label: 'Cena' },
  { value: 'snack', label: 'Snack' },
  { value: 'dessert', label: 'Postre' }
];

export function CookingPreferences({ preferences, onUpdate }: CookingPreferencesProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedPreferences, setEditedPreferences] = useState({
    cookingSkillLevel: preferences.cookingSkillLevel || 'intermediate',
    cookingPreferences: {
      timeAvailable: preferences.cookingPreferences?.timeAvailable || {
        weekday: 30,
        weekend: 60
      },
      cookingMethods: preferences.cookingPreferences?.cookingMethods || [],
      kitchenTools: preferences.cookingPreferences?.kitchenTools || []
    },
    planningPreferences: {
      planningHorizon: preferences.planningPreferences?.planningHorizon || 'weekly',
      mealTypes: preferences.planningPreferences?.mealTypes || ['breakfast', 'lunch', 'dinner'],
      batchCooking: preferences.planningPreferences?.batchCooking || false,
      leftoverStrategy: preferences.planningPreferences?.leftoverStrategy || 'incorporate',
      varietyPreference: preferences.planningPreferences?.varietyPreference || 'medium'
    },
    budget: preferences.budget || {
      weekly: 0,
      monthly: 0,
      currency: 'USD'
    }
  });

  const handleSave = async () => {
    try {
      await onUpdate(editedPreferences);
      setIsEditing(false);
      toast.success('Preferencias de cocina actualizadas');
    } catch (error: unknown) {
      toast.error('Error al guardar las preferencias');
    }
  };

  const toggleCookingMethod = (method: string) => {
    const current = editedPreferences.cookingPreferences.cookingMethods;
    const updated = current.includes(method)
      ? current.filter(m => m !== method)
      : [...current, method];
    
    setEditedPreferences({
      ...editedPreferences,
      cookingPreferences: {
        ...editedPreferences.cookingPreferences,
        cookingMethods: updated
      }
    });
  };

  const toggleKitchenTool = (tool: string) => {
    const current = editedPreferences.cookingPreferences.kitchenTools;
    const updated = current.includes(tool)
      ? current.filter(t => t !== tool)
      : [...current, tool];
    
    setEditedPreferences({
      ...editedPreferences,
      cookingPreferences: {
        ...editedPreferences.cookingPreferences,
        kitchenTools: updated
      }
    });
  };

  const toggleMealType = (mealType: string) => {
    const current = editedPreferences.planningPreferences.mealTypes;
    const updated = current.includes(mealType as any)
      ? current.filter(t => t !== mealType)
      : [...current, mealType as any];
    
    setEditedPreferences({
      ...editedPreferences,
      planningPreferences: {
        ...editedPreferences.planningPreferences,
        mealTypes: updated
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Cooking Skill & Time */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ChefHat className="h-5 w-5" />
                Habilidades y Tiempo
              </CardTitle>
              <CardDescription>
                Tu nivel de cocina y tiempo disponible
              </CardDescription>
            </div>
            {!isEditing && (
              <Button onClick={() => setIsEditing(true)} variant="outline">
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {isEditing ? (
            <>
              <div className="space-y-2">
                <Label>Nivel de Cocina</Label>
                <Select
                  value={editedPreferences.cookingSkillLevel}
                  onValueChange={(value) => setEditedPreferences({
                    ...editedPreferences,
                    cookingSkillLevel: value as UserPreferences['cookingSkillLevel']
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Principiante</SelectItem>
                    <SelectItem value="intermediate">Intermedio</SelectItem>
                    <SelectItem value="advanced">Avanzado</SelectItem>
                    <SelectItem value="expert">Experto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Tiempo disponible entre semana</Label>
                  <div className="flex items-center gap-4 mt-2">
                    <Slider
                      value={[editedPreferences.cookingPreferences.timeAvailable.weekday]}
                      onValueChange={([value]) => setEditedPreferences({
                        ...editedPreferences,
                        cookingPreferences: {
                          ...editedPreferences.cookingPreferences,
                          timeAvailable: {
                            ...editedPreferences.cookingPreferences.timeAvailable,
                            weekday: value
                          }
                        }
                      })}
                      min={15}
                      max={120}
                      step={15}
                      className="flex-1"
                    />
                    <span className="w-20 text-right font-medium">
                      {editedPreferences.cookingPreferences.timeAvailable.weekday} min
                    </span>
                  </div>
                </div>

                <div>
                  <Label>Tiempo disponible fin de semana</Label>
                  <div className="flex items-center gap-4 mt-2">
                    <Slider
                      value={[editedPreferences.cookingPreferences.timeAvailable.weekend]}
                      onValueChange={([value]) => setEditedPreferences({
                        ...editedPreferences,
                        cookingPreferences: {
                          ...editedPreferences.cookingPreferences,
                          timeAvailable: {
                            ...editedPreferences.cookingPreferences.timeAvailable,
                            weekend: value
                          }
                        }
                      })}
                      min={15}
                      max={180}
                      step={15}
                      className="flex-1"
                    />
                    <span className="w-20 text-right font-medium">
                      {editedPreferences.cookingPreferences.timeAvailable.weekend} min
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditedPreferences({
                      cookingSkillLevel: preferences.cookingSkillLevel || 'intermediate',
                      cookingPreferences: preferences.cookingPreferences || {
                        timeAvailable: { weekday: 30, weekend: 60 },
                        cookingMethods: [],
                        kitchenTools: []
                      },
                      planningPreferences: preferences.planningPreferences || {
                        planningHorizon: 'weekly',
                        mealTypes: ['breakfast', 'lunch', 'dinner'],
                        batchCooking: false,
                        leftoverStrategy: 'incorporate',
                        varietyPreference: 'medium'
                      },
                      budget: preferences.budget || {
                        weekly: 0,
                        monthly: 0,
                        currency: 'USD'
                      }
                    });
                    setIsEditing(false);
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Nivel de cocina</span>
                <Badge>
                  {preferences.cookingSkillLevel === 'beginner' && 'Principiante'}
                  {preferences.cookingSkillLevel === 'intermediate' && 'Intermedio'}
                  {preferences.cookingSkillLevel === 'advanced' && 'Avanzado'}
                  {preferences.cookingSkillLevel === 'expert' && 'Experto'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tiempo entre semana</span>
                <span className="font-medium">{preferences.cookingPreferences?.timeAvailable?.weekday || 30} min</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tiempo fin de semana</span>
                <span className="font-medium">{preferences.cookingPreferences?.timeAvailable?.weekend || 60} min</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cooking Methods & Tools */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Utensils className="h-5 w-5" />
            Métodos y Herramientas
          </CardTitle>
          <CardDescription>
            Tus métodos de cocina preferidos y herramientas disponibles
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="space-y-6">
              <div>
                <Label>Métodos de Cocina Preferidos</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                  {COOKING_METHODS.map(method => (
                    <div key={method} className="flex items-center space-x-2">
                      <Checkbox
                        id={method}
                        checked={editedPreferences.cookingPreferences.cookingMethods.includes(method)}
                        onCheckedChange={() => toggleCookingMethod(method)}
                      />
                      <Label
                        htmlFor={method}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {method}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Herramientas de Cocina Disponibles</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                  {KITCHEN_TOOLS.map(tool => (
                    <div key={tool} className="flex items-center space-x-2">
                      <Checkbox
                        id={tool}
                        checked={editedPreferences.cookingPreferences.kitchenTools.includes(tool)}
                        onCheckedChange={() => toggleKitchenTool(tool)}
                      />
                      <Label
                        htmlFor={tool}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {tool}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label className="text-sm text-muted-foreground">Métodos de cocina</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {preferences.cookingPreferences?.cookingMethods?.map(method => (
                    <Badge key={method} variant="secondary">
                      {method}
                    </Badge>
                  ))}
                  {(!preferences.cookingPreferences?.cookingMethods || preferences.cookingPreferences.cookingMethods.length === 0) && (
                    <p className="text-sm text-muted-foreground">No has seleccionado métodos de cocina</p>
                  )}
                </div>
              </div>
              
              <div>
                <Label className="text-sm text-muted-foreground">Herramientas disponibles</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {preferences.cookingPreferences?.kitchenTools?.map(tool => (
                    <Badge key={tool} variant="outline">
                      {tool}
                    </Badge>
                  ))}
                  {(!preferences.cookingPreferences?.kitchenTools || preferences.cookingPreferences.kitchenTools.length === 0) && (
                    <p className="text-sm text-muted-foreground">No has indicado herramientas de cocina</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Planning Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Preferencias de Planificación
          </CardTitle>
          <CardDescription>
            Cómo prefieres planificar tus comidas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>Horizonte de Planificación</Label>
                <Select
                  value={editedPreferences.planningPreferences.planningHorizon}
                  onValueChange={(value) => setEditedPreferences({
                    ...editedPreferences,
                    planningPreferences: {
                      ...editedPreferences.planningPreferences,
                      planningHorizon: value as any
                    }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Diario</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="biweekly">Quincenal</SelectItem>
                    <SelectItem value="monthly">Mensual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Tipos de Comida a Planificar</Label>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  {MEAL_TYPES.map(mealType => (
                    <div key={mealType.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={mealType.value}
                        checked={editedPreferences.planningPreferences.mealTypes.includes(mealType.value as any)}
                        onCheckedChange={() => toggleMealType(mealType.value)}
                      />
                      <Label
                        htmlFor={mealType.value}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {mealType.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="batch-cooking"
                  checked={editedPreferences.planningPreferences.batchCooking}
                  onCheckedChange={(checked) => setEditedPreferences({
                    ...editedPreferences,
                    planningPreferences: {
                      ...editedPreferences.planningPreferences,
                      batchCooking: !!checked
                    }
                  })}
                />
                <Label htmlFor="batch-cooking" className="cursor-pointer">
                  Me gusta cocinar en lotes (batch cooking)
                </Label>
              </div>

              <div className="grid gap-2">
                <Label>Estrategia con Sobras</Label>
                <Select
                  value={editedPreferences.planningPreferences.leftoverStrategy}
                  onValueChange={(value) => setEditedPreferences({
                    ...editedPreferences,
                    planningPreferences: {
                      ...editedPreferences.planningPreferences,
                      leftoverStrategy: value as any
                    }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="incorporate">Incorporar en otras comidas</SelectItem>
                    <SelectItem value="freeze">Congelar para después</SelectItem>
                    <SelectItem value="avoid">Evitar sobras</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Preferencia de Variedad</Label>
                <Select
                  value={editedPreferences.planningPreferences.varietyPreference}
                  onValueChange={(value) => setEditedPreferences({
                    ...editedPreferences,
                    planningPreferences: {
                      ...editedPreferences.planningPreferences,
                      varietyPreference: value as any
                    }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">Alta - Me gusta probar cosas nuevas</SelectItem>
                    <SelectItem value="medium">Media - Balance entre nuevo y conocido</SelectItem>
                    <SelectItem value="low">Baja - Prefiero lo conocido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Planificación</span>
                <Badge variant="secondary">
                  {preferences.planningPreferences?.planningHorizon === 'daily' && 'Diaria'}
                  {preferences.planningPreferences?.planningHorizon === 'weekly' && 'Semanal'}
                  {preferences.planningPreferences?.planningHorizon === 'biweekly' && 'Quincenal'}
                  {preferences.planningPreferences?.planningHorizon === 'monthly' && 'Mensual'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Batch cooking</span>
                <span className="font-medium">
                  {preferences.planningPreferences?.batchCooking ? 'Sí' : 'No'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Estrategia con sobras</span>
                <Badge variant="outline">
                  {preferences.planningPreferences?.leftoverStrategy === 'incorporate' && 'Incorporar'}
                  {preferences.planningPreferences?.leftoverStrategy === 'freeze' && 'Congelar'}
                  {preferences.planningPreferences?.leftoverStrategy === 'avoid' && 'Evitar'}
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Budget */}
      <Card>
        <CardHeader>
          <CardTitle>Presupuesto</CardTitle>
          <CardDescription>
            Tu presupuesto para comidas y compras
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>Presupuesto Semanal</Label>
                <div className="flex gap-2">
                  <span className="flex items-center px-3 text-sm text-muted-foreground">$</span>
                  <Input
                    type="number"
                    value={editedPreferences.budget.weekly}
                    onChange={(e) => setEditedPreferences({
                      ...editedPreferences,
                      budget: {
                        ...editedPreferences.budget,
                        weekly: parseFloat(e.target.value) || 0
                      }
                    })}
                  />
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label>Presupuesto Mensual</Label>
                <div className="flex gap-2">
                  <span className="flex items-center px-3 text-sm text-muted-foreground">$</span>
                  <Input
                    type="number"
                    value={editedPreferences.budget.monthly}
                    onChange={(e) => setEditedPreferences({
                      ...editedPreferences,
                      budget: {
                        ...editedPreferences.budget,
                        monthly: parseFloat(e.target.value) || 0
                      }
                    })}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Presupuesto semanal</span>
                <span className="font-medium">${preferences.budget?.weekly || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Presupuesto mensual</span>
                <span className="font-medium">${preferences.budget?.monthly || 0}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}