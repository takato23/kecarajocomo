'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users,
  Edit2,
  Trash2,
  User,
  AlertCircle,
  Home,
  Heart,
  Baby,
  UserPlus,
  Save
} from 'lucide-react';

import { useProfile } from '@/contexts/ProfileContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Slider } from '@/components/ui/slider';
import type { HouseholdMember, UserPreferences, DietaryRestriction, Allergy } from '@/types/profile';

interface HouseholdManagerProps {
  householdMembers: HouseholdMember[];
  preferences: UserPreferences;
  onUpdatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
}

const RELATIONSHIPS = [
  { value: 'partner', label: 'Pareja', icon: Heart },
  { value: 'child', label: 'Hijo/a', icon: Baby },
  { value: 'parent', label: 'Padre/Madre', icon: User },
  { value: 'roommate', label: 'Compañero/a de piso', icon: Home },
  { value: 'other', label: 'Otro', icon: Users }
];

const DIETARY_RESTRICTIONS: { value: DietaryRestriction; label: string }[] = [
  { value: 'vegetarian', label: 'Vegetariano' },
  { value: 'vegan', label: 'Vegano' },
  { value: 'gluten_free', label: 'Sin gluten' },
  { value: 'dairy_free', label: 'Sin lácteos' },
  { value: 'nut_free', label: 'Sin frutos secos' },
  { value: 'pescatarian', label: 'Pescetariano' }
];

const COMMON_ALLERGIES: { value: Allergy; label: string }[] = [
  { value: 'peanuts', label: 'Cacahuetes' },
  { value: 'tree_nuts', label: 'Frutos secos' },
  { value: 'milk', label: 'Leche' },
  { value: 'eggs', label: 'Huevos' },
  { value: 'wheat', label: 'Trigo' },
  { value: 'soy', label: 'Soja' },
  { value: 'fish', label: 'Pescado' },
  { value: 'shellfish', label: 'Mariscos' }
];

// Loading skeleton component
const HouseholdManagerSkeleton = () => (
  <div className="space-y-6">
    <Skeleton className="h-32 w-full rounded-2xl" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-40 w-full rounded-xl" />
    </div>
  </div>
);

export const HouseholdManager: React.FC<HouseholdManagerProps> = ({ 
  householdMembers, 
  preferences, 
  onUpdatePreferences 
}) => {
  const { addHouseholdMember, updateHouseholdMember, removeHouseholdMember, getHouseholdSize } = useProfile();
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [editingMember, setEditingMember] = useState<HouseholdMember | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  
  const [memberForm, setMemberForm] = useState<Partial<HouseholdMember>>({
    name: '',
    relationship: 'partner',
    age: undefined,
    dietaryRestrictions: [],
    allergies: [],
    preferences: []
  });

  // Calculate household stats
  const householdStats = useMemo(() => {
    const totalMembers = householdMembers.length + 1; // Include self
    const children = householdMembers.filter(m => m.relationship === 'child').length;
    const adults = totalMembers - children;
    
    const allDietaryRestrictions = new Set<DietaryRestriction>();
    const allAllergies = new Set<Allergy>();
    
    // Add user's own restrictions
    preferences.dietaryRestrictions?.forEach(r => allDietaryRestrictions.add(r));
    preferences.allergies?.forEach(a => allAllergies.add(a));
    
    // Add household members' restrictions
    householdMembers.forEach(member => {
      member.dietaryRestrictions?.forEach(r => allDietaryRestrictions.add(r));
      member.allergies?.forEach(a => allAllergies.add(a));
    });
    
    return {
      totalMembers,
      adults,
      children,
      dietaryRestrictions: allDietaryRestrictions.size,
      allergies: allAllergies.size
    };
  }, [householdMembers, preferences]);

  // Handle form submission
  const handleAddMember = useCallback(async () => {
    if (!memberForm.name) {
      setError('Por favor ingresa un nombre');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      if (editingMember) {
        await updateHouseholdMember(editingMember.id, {
          name: memberForm.name!,
          relationship: memberForm.relationship as HouseholdMember['relationship'],
          age: memberForm.age,
          dietaryRestrictions: memberForm.dietaryRestrictions,
          allergies: memberForm.allergies,
          preferences: memberForm.preferences
        });
      } else {
        await addHouseholdMember({
          name: memberForm.name!,
          relationship: memberForm.relationship as HouseholdMember['relationship'],
          age: memberForm.age,
          dietaryRestrictions: memberForm.dietaryRestrictions,
          allergies: memberForm.allergies,
          preferences: memberForm.preferences
        });
      }
      
      setIsAddingMember(false);
      setEditingMember(null);
      setMemberForm({
        name: '',
        relationship: 'partner',
        age: undefined,
        dietaryRestrictions: [],
        allergies: [],
        preferences: []
      });
    } catch (err) {
      setError(editingMember ? 'Error al actualizar miembro' : 'Error al agregar miembro');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [memberForm, editingMember, addHouseholdMember, updateHouseholdMember]);

  // Handle member deletion
  const handleDeleteMember = useCallback(async (memberId: string) => {
    setIsDeleting(memberId);
    setError(null);
    
    try {
      await removeHouseholdMember(memberId);
    } catch (err) {
      setError('Error al eliminar miembro');
      console.error(err);
    } finally {
      setIsDeleting(null);
    }
  }, [removeHouseholdMember]);

  // Handle edit member
  const handleEditMember = useCallback((member: HouseholdMember) => {
    setEditingMember(member);
    setMemberForm({
      name: member.name,
      relationship: member.relationship,
      age: member.age,
      dietaryRestrictions: member.dietaryRestrictions || [],
      allergies: member.allergies || [],
      preferences: member.preferences || []
    });
    setIsAddingMember(true);
  }, []);

  // Toggle dietary restriction
  const toggleDietaryRestriction = useCallback((restriction: DietaryRestriction) => {
    setMemberForm(prev => ({
      ...prev,
      dietaryRestrictions: prev.dietaryRestrictions?.includes(restriction)
        ? prev.dietaryRestrictions.filter(r => r !== restriction)
        : [...(prev.dietaryRestrictions || []), restriction]
    }));
  }, []);

  // Toggle allergy
  const toggleAllergy = useCallback((allergy: Allergy) => {
    setMemberForm(prev => ({
      ...prev,
      allergies: prev.allergies?.includes(allergy)
        ? prev.allergies.filter(a => a !== allergy)
        : [...(prev.allergies || []), allergy]
    }));
  }, []);

  // Get relationship icon
  const getRelationshipIcon = (relationship: string) => {
    const rel = RELATIONSHIPS.find(r => r.value === relationship);
    return rel?.icon || User;
  };

  if (isLoading && !isAddingMember) {
    return <HouseholdManagerSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Household Overview */}
      <iOS26LiquidCard variant="medium" glow shimmer>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Home className="w-5 h-5" />
                Mi Hogar
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Gestiona los miembros de tu hogar
              </p>
            </div>
            <Button
              onClick={() => setIsAddingMember(true)}
              size="sm"
              className="gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Agregar
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <div className="text-2xl font-bold">{householdStats.totalMembers}</div>
              <div className="text-xs text-muted-foreground">Total personas</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <div className="text-2xl font-bold">{householdStats.adults}</div>
              <div className="text-xs text-muted-foreground">Adultos</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <div className="text-2xl font-bold">{householdStats.children}</div>
              <div className="text-xs text-muted-foreground">Niños</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <div className="text-2xl font-bold">{householdStats.allergies}</div>
              <div className="text-xs text-muted-foreground">Alergias totales</div>
            </div>
          </div>
        </div>
      </iOS26LiquidCard>

      {/* Household Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Current User Card */}
        <iOS26LiquidCard variant="subtle" morph>
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">Tú</h4>
                  <p className="text-sm text-muted-foreground">Cuenta principal</p>
                </div>
              </div>
              <Badge variant="default">Principal</Badge>
            </div>
            
            {(preferences.dietaryRestrictions?.length > 0 || preferences.allergies?.length > 0) && (
              <div className="space-y-2 pt-2 border-t">
                {preferences.dietaryRestrictions?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {preferences.dietaryRestrictions.map(restriction => (
                      <Badge key={restriction} variant="secondary" className="text-xs">
                        {DIETARY_RESTRICTIONS.find(d => d.value === restriction)?.label}
                      </Badge>
                    ))}
                  </div>
                )}
                {preferences.allergies?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {preferences.allergies.map(allergy => (
                      <Badge key={allergy} variant="destructive" className="text-xs">
                        {COMMON_ALLERGIES.find(a => a.value === allergy)?.label}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </iOS26LiquidCard>

        {/* Household Members */}
        <AnimatePresence mode="popLayout">
          {householdMembers.map((member) => {
            const Icon = getRelationshipIcon(member.relationship);
            const isDeleting = isDeleting === member.id;
            
            return (
              <motion.div
                key={member.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <iOS26LiquidCard variant="subtle" morph>
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                          <Icon className="w-6 h-6 text-secondary-foreground" />
                        </div>
                        <div>
                          <h4 className="font-medium">{member.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {RELATIONSHIPS.find(r => r.value === member.relationship)?.label}
                            {member.age && ` • ${member.age} años`}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEditMember(member)}
                          disabled={isDeleting}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteMember(member.id)}
                          disabled={isDeleting}
                        >
                          {isDeleting ? (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            >
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                            </motion.div>
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    {((member.dietaryRestrictions && member.dietaryRestrictions.length > 0) || 
                      (member.allergies && member.allergies.length > 0)) && (
                      <div className="space-y-2 pt-2 border-t">
                        {member.dietaryRestrictions && member.dietaryRestrictions.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {member.dietaryRestrictions.map(restriction => (
                              <Badge key={restriction} variant="secondary" className="text-xs">
                                {DIETARY_RESTRICTIONS.find(d => d.value === restriction)?.label}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {member.allergies && member.allergies.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {member.allergies.map(allergy => (
                              <Badge key={allergy} variant="destructive" className="text-xs">
                                {COMMON_ALLERGIES.find(a => a.value === allergy)?.label}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </iOS26LiquidCard>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Add/Edit Member Dialog */}
      <Dialog open={isAddingMember} onOpenChange={setIsAddingMember}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingMember ? 'Editar Miembro del Hogar' : 'Agregar Miembro del Hogar'}
            </DialogTitle>
            <DialogDescription>
              {editingMember 
                ? 'Actualiza la información del miembro del hogar'
                : 'Agrega un nuevo miembro a tu hogar para personalizar las recetas'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={memberForm.name}
                  onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                  placeholder="Ej: María"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="relationship">Relación</Label>
                <Select
                  value={memberForm.relationship}
                  onValueChange={(value) => setMemberForm({ ...memberForm, relationship: value as HouseholdMember['relationship'] })}
                >
                  <SelectTrigger id="relationship">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RELATIONSHIPS.map(rel => (
                      <SelectItem key={rel.value} value={rel.value}>
                        <div className="flex items-center gap-2">
                          <rel.icon className="w-4 h-4" />
                          {rel.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Age */}
            <div className="space-y-2">
              <Label htmlFor="age">Edad</Label>
              <div className="flex items-center gap-4">
                <Slider
                  id="age"
                  min={1}
                  max={100}
                  step={1}
                  value={[memberForm.age || 30]}
                  onValueChange={([value]) => setMemberForm({ ...memberForm, age: value })}
                  className="flex-1"
                />
                <span className="w-12 text-center font-medium">
                  {memberForm.age || 30}
                </span>
              </div>
            </div>

            {/* Dietary Restrictions */}
            <div className="space-y-2">
              <Label>Restricciones Dietéticas</Label>
              <div className="grid grid-cols-2 gap-3">
                {DIETARY_RESTRICTIONS.map(({ value, label }) => (
                  <div key={value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`diet-${value}`}
                      checked={memberForm.dietaryRestrictions?.includes(value) || false}
                      onCheckedChange={() => toggleDietaryRestriction(value)}
                    />
                    <Label
                      htmlFor={`diet-${value}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Allergies */}
            <div className="space-y-2">
              <Label>Alergias</Label>
              <div className="grid grid-cols-2 gap-3">
                {COMMON_ALLERGIES.map(({ value, label }) => (
                  <div key={value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`allergy-${value}`}
                      checked={memberForm.allergies?.includes(value) || false}
                      onCheckedChange={() => toggleAllergy(value)}
                    />
                    <Label
                      htmlFor={`allergy-${value}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddingMember(false);
                setEditingMember(null);
                setMemberForm({
                  name: '',
                  relationship: 'partner',
                  age: undefined,
                  dietaryRestrictions: [],
                  allergies: [],
                  preferences: []
                });
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddMember}
              disabled={isLoading || !memberForm.name}
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                  </motion.div>
                  {editingMember ? 'Actualizando...' : 'Agregando...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {editingMember ? 'Actualizar' : 'Agregar'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

HouseholdManager.displayName = 'HouseholdManager';

