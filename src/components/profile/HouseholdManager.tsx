'use client';

import { useState } from 'react';
import { 
  Users,
  Plus,
  Edit,
  Trash2,
  User,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

import { useProfile } from '@/contexts/ProfileContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { HouseholdMember, UserPreferences, DietaryRestriction, Allergy } from '@/types/profile';


interface HouseholdManagerProps {
  householdMembers: HouseholdMember[];
  preferences: UserPreferences;
  onUpdatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
}

const RELATIONSHIPS = [
  { value: 'partner', label: 'Pareja' },
  { value: 'child', label: 'Hijo/a' },
  { value: 'parent', label: 'Padre/Madre' },
  { value: 'roommate', label: 'Compañero/a de piso' },
  { value: 'other', label: 'Otro' }
];

const DIETARY_RESTRICTIONS: { value: DietaryRestriction; label: string }[] = [
  { value: 'vegetarian', label: 'Vegetariano' },
  { value: 'vegan', label: 'Vegano' },
  { value: 'gluten_free', label: 'Sin gluten' },
  { value: 'dairy_free', label: 'Sin lácteos' },
  { value: 'nut_free', label: 'Sin frutos secos' },
  { value: 'pescatarian', label: 'Pescatariano' }
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

export function HouseholdManager({ householdMembers, preferences, onUpdatePreferences }: HouseholdManagerProps) {
  const { addHouseholdMember, updateHouseholdMember, removeHouseholdMember, getHouseholdSize } = useProfile();
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [editingMember, setEditingMember] = useState<HouseholdMember | null>(null);
  const [memberForm, setMemberForm] = useState<Partial<HouseholdMember>>({
    name: '',
    relationship: 'partner',
    age: undefined,
    dietaryRestrictions: [],
    allergies: [],
    preferences: []
  });

  const handleAddMember = async () => {
    if (!memberForm.name) {
      toast.error('Por favor ingresa un nombre');
      return;
    }

    try {
      await addHouseholdMember({
        name: memberForm.name,
        relationship: memberForm.relationship as HouseholdMember['relationship'],
        age: memberForm.age,
        dietaryRestrictions: memberForm.dietaryRestrictions,
        allergies: memberForm.allergies,
        preferences: memberForm.preferences
      });
      
      setIsAddingMember(false);
      setMemberForm({
        name: '',
        relationship: 'partner',
        age: undefined,
        dietaryRestrictions: [],
        allergies: [],
        preferences: []
      });
    } catch (error: unknown) {
      toast.error('Error al agregar miembro');
    }
  };

  const handleUpdateMember = async () => {
    if (!editingMember) return;

    try {
      await updateHouseholdMember(editingMember.id, memberForm);
      setEditingMember(null);
      setMemberForm({
        name: '',
        relationship: 'partner',
        age: undefined,
        dietaryRestrictions: [],
        allergies: [],
        preferences: []
      });
    } catch (error: unknown) {
      toast.error('Error al actualizar miembro');
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este miembro del hogar?')) {
      try {
        await removeHouseholdMember(id);
      } catch (error: unknown) {
        toast.error('Error al eliminar miembro');
      }
    }
  };

  const toggleDietaryRestriction = (restriction: DietaryRestriction) => {
    const current = memberForm.dietaryRestrictions || [];
    const updated = current.includes(restriction)
      ? current.filter(r => r !== restriction)
      : [...current, restriction];
    
    setMemberForm({ ...memberForm, dietaryRestrictions: updated });
  };

  const toggleAllergy = (allergy: Allergy) => {
    const current = memberForm.allergies || [];
    const updated = current.includes(allergy)
      ? current.filter(a => a !== allergy)
      : [...current, allergy];
    
    setMemberForm({ ...memberForm, allergies: updated });
  };

  return (
    <div className="space-y-6">
      {/* Household Overview */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Mi Hogar
              </CardTitle>
              <CardDescription>
                {getHouseholdSize()} {getHouseholdSize() === 1 ? 'persona' : 'personas'} en total
              </CardDescription>
            </div>
            <Dialog open={isAddingMember} onOpenChange={setIsAddingMember}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Miembro
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Agregar Miembro del Hogar</DialogTitle>
                  <DialogDescription>
                    Agrega información sobre las personas con las que compartes comidas
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nombre</Label>
                    <Input
                      id="name"
                      value={memberForm.name}
                      onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                      placeholder="Ej: María"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="relationship">Relación</Label>
                    <Select
                      value={memberForm.relationship}
                      onValueChange={(value) => setMemberForm({ ...memberForm, relationship: value as HouseholdMember['relationship'] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RELATIONSHIPS.map(rel => (
                          <SelectItem key={rel.value} value={rel.value}>
                            {rel.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="age">Edad (opcional)</Label>
                    <Input
                      id="age"
                      type="number"
                      value={memberForm.age || ''}
                      onChange={(e) => setMemberForm({ ...memberForm, age: e.target.value ? parseInt(e.target.value) : undefined })}
                      placeholder="Ej: 25"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Restricciones Dietéticas</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {DIETARY_RESTRICTIONS.map(restriction => (
                        <div key={restriction.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`new-${restriction.value}`}
                            checked={memberForm.dietaryRestrictions?.includes(restriction.value)}
                            onCheckedChange={() => toggleDietaryRestriction(restriction.value)}
                          />
                          <Label
                            htmlFor={`new-${restriction.value}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {restriction.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Alergias</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {COMMON_ALLERGIES.map(allergy => (
                        <div key={allergy.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`new-allergy-${allergy.value}`}
                            checked={memberForm.allergies?.includes(allergy.value)}
                            onCheckedChange={() => toggleAllergy(allergy.value)}
                          />
                          <Label
                            htmlFor={`new-allergy-${allergy.value}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {allergy.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddingMember(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAddMember}>
                    Agregar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Current User */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-medium">Tú</p>
                  <p className="text-sm text-muted-foreground">Usuario principal</p>
                </div>
              </div>
              <Badge variant="secondary">Principal</Badge>
            </div>

            {/* Household Members */}
            {householdMembers.map(member => (
              <div key={member.id} className="flex items-start justify-between p-4 border rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {RELATIONSHIPS.find(r => r.value === member.relationship)?.label}
                      {member.age && ` • ${member.age} años`}
                    </p>
                    
                    {/* Member's dietary info */}
                    <div className="mt-2 space-y-1">
                      {member.dietaryRestrictions && member.dietaryRestrictions.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {member.dietaryRestrictions.map(restriction => (
                            <Badge key={restriction} variant="secondary" className="text-xs">
                              {DIETARY_RESTRICTIONS.find(r => r.value === restriction)?.label || restriction}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      {member.allergies && member.allergies.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {member.allergies.map(allergy => (
                            <Badge key={allergy} variant="destructive" className="text-xs flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {COMMON_ALLERGIES.find(a => a.value === allergy)?.label || allergy}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setMemberForm({
                        name: member.name,
                        relationship: member.relationship,
                        age: member.age,
                        dietaryRestrictions: member.dietaryRestrictions || [],
                        allergies: member.allergies || [],
                        preferences: member.preferences || []
                      });
                      setEditingMember(member);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDeleteMember(member.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit Member Dialog */}
      <Dialog open={!!editingMember} onOpenChange={(open) => !open && setEditingMember(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Miembro del Hogar</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Same form fields as add member */}
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nombre</Label>
              <Input
                id="edit-name"
                value={memberForm.name}
                onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="edit-relationship">Relación</Label>
              <Select
                value={memberForm.relationship}
                onValueChange={(value) => setMemberForm({ ...memberForm, relationship: value as HouseholdMember['relationship'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONSHIPS.map(rel => (
                    <SelectItem key={rel.value} value={rel.value}>
                      {rel.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="edit-age">Edad</Label>
              <Input
                id="edit-age"
                type="number"
                value={memberForm.age || ''}
                onChange={(e) => setMemberForm({ ...memberForm, age: e.target.value ? parseInt(e.target.value) : undefined })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Restricciones Dietéticas</Label>
              <div className="grid grid-cols-2 gap-2">
                {DIETARY_RESTRICTIONS.map(restriction => (
                  <div key={restriction.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-${restriction.value}`}
                      checked={memberForm.dietaryRestrictions?.includes(restriction.value)}
                      onCheckedChange={() => toggleDietaryRestriction(restriction.value)}
                    />
                    <Label
                      htmlFor={`edit-${restriction.value}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {restriction.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Alergias</Label>
              <div className="grid grid-cols-2 gap-2">
                {COMMON_ALLERGIES.map(allergy => (
                  <div key={allergy.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-allergy-${allergy.value}`}
                      checked={memberForm.allergies?.includes(allergy.value)}
                      onCheckedChange={() => toggleAllergy(allergy.value)}
                    />
                    <Label
                      htmlFor={`edit-allergy-${allergy.value}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {allergy.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMember(null)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateMember}>
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}