'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { 
  Users,
  Edit2,
  Trash2,
  UserPlus,
  Baby,
  User,
  ChefHat,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useProfileContext } from '@/contexts/ProfileContext';
import { householdMemberSchema } from '@/lib/schemas/profile';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface HouseholdMember {
  id: string;
  name: string;
  age?: number;
  dietaryRestrictions?: string[];
  preferences?: string;
  isAdmin?: boolean;
}

export function HouseholdSection() {
  const { profile, updateProfile } = useProfileContext();
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [deletingMember, setDeletingMember] = useState<string | null>(null);

  // Mock household members data
  const [householdMembers, setHouseholdMembers] = useState<HouseholdMember[]>([
    {
      id: '1',
      name: profile?.name || 'You',
      isAdmin: true,
      dietaryRestrictions: profile?.dietaryRestrictions,
      preferences: 'Admin of household',
    },
    {
      id: '2',
      name: 'Partner',
      age: 28,
      dietaryRestrictions: ['Vegetarian'],
      preferences: 'Loves spicy food',
    },
    {
      id: '3',
      name: 'Child',
      age: 8,
      dietaryRestrictions: [],
      preferences: 'No spicy food, loves pasta',
    },
  ]);

  const form = useForm<HouseholdMemberFormData>({
    resolver: zodResolver(householdMemberSchema),
    defaultValues: {
      name: '',
      age: undefined,
      dietaryRestrictions: [],
      preferences: '',
    },
  });

  const handleAddMember = async (data: HouseholdMemberFormData) => {
    try {
      const newMember: HouseholdMember = {
        id: Date.now().toString(),
        ...data,
      };
      setHouseholdMembers([...householdMembers, newMember]);
      
      // Update profile household size
      await updateProfile({
        householdSize: householdMembers.length + 1,
      });
      
      setIsAddingMember(false);
      form.reset();
      toast.success('Family member added');
    } catch (error: unknown) {
      toast.error('Failed to add family member');
    }
  };

  const handleUpdateMember = async (memberId: string, data: HouseholdMemberFormData) => {
    try {
      setHouseholdMembers(members =>
        members.map(member =>
          member.id === memberId ? { ...member, ...data } : member
        )
      );
      setEditingMember(null);
      toast.success('Member updated');
    } catch (error: unknown) {
      toast.error('Failed to update member');
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    try {
      setHouseholdMembers(members => members.filter(m => m.id !== memberId));
      
      // Update profile household size
      await updateProfile({
        householdSize: householdMembers.length - 1,
      });
      
      setDeletingMember(null);
      toast.success('Member removed');
    } catch (error: unknown) {
      toast.error('Failed to remove member');
    }
  };

  const getMemberIcon = (member: HouseholdMember) => {
    if (member.isAdmin) return <ChefHat className="w-5 h-5" />;
    if (member.age && member.age < 18) return <Baby className="w-5 h-5" />;
    return <User className="w-5 h-5" />;
  };

  return (
    <div className="space-y-6">
      {/* Household Overview */}
      <Card className="glass-subtle backdrop-blur-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-glass-strong flex items-center gap-2">
            <Users className="w-5 h-5" />
            Your Household
          </h2>
          <Button
            onClick={() => setIsAddingMember(true)}
            size="sm"
            className="bg-food-warm hover:bg-food-warm/90"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add Member
          </Button>
        </div>

        {/* Household Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-semibold text-glass-strong">
              {householdMembers.length}
            </div>
            <div className="text-xs text-glass-medium">Total Members</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-glass-strong">
              {householdMembers.filter(m => m.dietaryRestrictions?.length).length}
            </div>
            <div className="text-xs text-glass-medium">With Restrictions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-glass-strong">
              {householdMembers.filter(m => m.age && m.age < 18).length}
            </div>
            <div className="text-xs text-glass-medium">Children</div>
          </div>
        </div>

        {/* Members List */}
        <div className="space-y-3">
          <AnimatePresence>
            {householdMembers.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  'relative overflow-hidden',
                  'bg-glass-medium backdrop-blur-sm rounded-xl',
                  'border border-white/10',
                  'p-4',
                  member.isAdmin && 'ring-2 ring-food-warm/30'
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      'p-2 rounded-lg',
                      'bg-glass-medium',
                      member.isAdmin && 'bg-food-warm/20'
                    )}>
                      {getMemberIcon(member)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-glass-strong">
                          {member.name}
                        </h3>
                        {member.isAdmin && (
                          <Badge variant="secondary" className="bg-food-warm/20 text-food-warm">
                            Admin
                          </Badge>
                        )}
                      </div>
                      {member.age && (
                        <p className="text-xs text-glass-medium mt-1">
                          Age: {member.age}
                        </p>
                      )}
                      {member.preferences && (
                        <p className="text-sm text-glass-medium mt-2">
                          {member.preferences}
                        </p>
                      )}
                      {member.dietaryRestrictions && member.dietaryRestrictions.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {member.dietaryRestrictions.map(restriction => (
                            <Badge
                              key={restriction}
                              variant="secondary"
                              className="bg-glass-medium text-xs"
                            >
                              {restriction}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {!member.isAdmin && (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          form.reset({
                            name: member.name,
                            age: member.age,
                            dietaryRestrictions: member.dietaryRestrictions || [],
                            preferences: member.preferences || '',
                          });
                          setEditingMember(member.id);
                        }}
                        className="text-glass-medium"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingMember(member.id)}
                        className="text-error-500 hover:text-error-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </Card>

      {/* Add/Edit Member Dialog */}
      <Dialog
        open={isAddingMember || !!editingMember}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddingMember(false);
            setEditingMember(null);
            form.reset();
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={form.handleSubmit(
            editingMember
              ? (data) => handleUpdateMember(editingMember, data)
              : handleAddMember
          )}>
            <DialogHeader>
              <DialogTitle>
                {editingMember ? 'Edit Family Member' : 'Add Family Member'}
              </DialogTitle>
              <DialogDescription>
                {editingMember
                  ? 'Update the information for this family member.'
                  : 'Add a new member to your household.'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  {...form.register('name')}
                  placeholder="Family member's name"
                />
                {form.formState.errors.name && (
                  <p className="text-error-500 text-xs flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">Age (optional)</Label>
                <Input
                  id="age"
                  type="number"
                  {...form.register('age', { valueAsNumber: true })}
                  placeholder="Age"
                />
                {form.formState.errors.age && (
                  <p className="text-error-500 text-xs flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {form.formState.errors.age.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferences">
                  Preferences & Notes (optional)
                </Label>
                <Input
                  id="preferences"
                  {...form.register('preferences')}
                  placeholder="e.g., Loves spicy food, allergic to nuts"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsAddingMember(false);
                  setEditingMember(null);
                  form.reset();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingMember ? 'Update' : 'Add'} Member
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deletingMember}
        onOpenChange={(open) => !open && setDeletingMember(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Remove Family Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this member from your household?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDeletingMember(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletingMember && handleDeleteMember(deletingMember)}
            >
              Remove Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}