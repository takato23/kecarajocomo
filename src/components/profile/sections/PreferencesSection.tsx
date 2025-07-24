'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { 
  Heart, 
  Clock,
  Check,
  AlertCircle,
  Utensils
} from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { useProfileContext } from '@/contexts/ProfileContext';
import { dietaryRestrictionsSchema, cuisinePreferencesSchema } from '@/lib/schemas/profile';


const commonRestrictions = [
  'Vegetarian',
  'Vegan',
  'Gluten-free',
  'Dairy-free',
  'Nut-free',
  'Halal',
  'Kosher',
  'Low-carb',
  'Keto',
  'Paleo',
];

const commonAllergies = [
  'Peanuts',
  'Tree nuts',
  'Milk',
  'Eggs',
  'Wheat',
  'Soy',
  'Fish',
  'Shellfish',
  'Sesame',
];

const cuisineOptions = [
  { id: 'italian', name: 'Italian', flag: '🇮🇹' },
  { id: 'mexican', name: 'Mexican', flag: '🇲🇽' },
  { id: 'japanese', name: 'Japanese', flag: '🇯🇵' },
  { id: 'chinese', name: 'Chinese', flag: '🇨🇳' },
  { id: 'indian', name: 'Indian', flag: '🇮🇳' },
  { id: 'mediterranean', name: 'Mediterranean', flag: '🌊' },
  { id: 'thai', name: 'Thai', flag: '🇹🇭' },
  { id: 'french', name: 'French', flag: '🇫🇷' },
  { id: 'greek', name: 'Greek', flag: '🇬🇷' },
  { id: 'spanish', name: 'Spanish', flag: '🇪🇸' },
];

const cookingEquipment = [
  'Oven',
  'Microwave',
  'Air Fryer',
  'Instant Pot',
  'Slow Cooker',
  'Grill',
  'Blender',
  'Food Processor',
];

export function PreferencesSection() {
  const { profile, updateProfile } = useProfileContext();
  const [isEditingRestrictions, setIsEditingRestrictions] = useState(false);
  const [isEditingCuisines, setIsEditingCuisines] = useState(false);

  const restrictionsForm = useForm<DietaryRestrictionsFormData>({
    resolver: zodResolver(dietaryRestrictionsSchema),
    defaultValues: {
      restrictions: profile?.dietaryRestrictions || [],
      allergies: profile?.allergies || [],
    },
  });

  const cuisinesForm = useForm<CuisinePreferencesFormData>({
    resolver: zodResolver(cuisinePreferencesSchema),
    defaultValues: {
      cuisines: profile?.cuisinePreferences || [],
      cookingSkillLevel: profile?.cookingSkillLevel || 'intermediate',
      cookingTime: profile?.preferredCookingTime || 'balanced',
      equipment: profile?.availableEquipment || [],
    },
  });

  const handleSaveRestrictions = async (data: DietaryRestrictionsFormData) => {
    try {
      await updateProfile({
        dietaryRestrictions: data.restrictions,
        allergies: data.allergies,
      });
      setIsEditingRestrictions(false);
      toast.success('Dietary preferences updated');
    } catch (error: unknown) {
      toast.error('Failed to update preferences');
    }
  };

  const handleSaveCuisines = async (data: CuisinePreferencesFormData) => {
    try {
      await updateProfile({
        cuisinePreferences: data.cuisines,
        cookingSkillLevel: data.cookingSkillLevel,
        preferredCookingTime: data.cookingTime,
        availableEquipment: data.equipment,
      });
      setIsEditingCuisines(false);
      toast.success('Cuisine preferences updated');
    } catch (error: unknown) {
      toast.error('Failed to update preferences');
    }
  };

  // Calculate cuisine preference percentages (mock data)
  const cuisineStats = profile?.cuisinePreferences?.map(cuisine => ({
    id: cuisine,
    name: cuisineOptions.find(c => c.id === cuisine)?.name || cuisine,
    flag: cuisineOptions.find(c => c.id === cuisine)?.flag || '🍽️',
    percentage: Math.floor(Math.random() * 60) + 40,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Dietary Restrictions & Allergies */}
      <Card className="glass-subtle backdrop-blur-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-glass-strong flex items-center gap-2">
            <Heart className="w-5 h-5" />
            Dietary Preferences
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditingRestrictions(!isEditingRestrictions)}
            className="text-glass-medium"
          >
            {isEditingRestrictions ? 'Cancel' : 'Edit'}
          </Button>
        </div>

        {isEditingRestrictions ? (
          <form onSubmit={restrictionsForm.handleSubmit(handleSaveRestrictions)} className="space-y-6">
            {/* Restrictions */}
            <div>
              <Label className="text-sm font-medium text-glass-strong mb-3 block">
                Dietary Restrictions
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {commonRestrictions.map(restriction => (
                  <label
                    key={restriction}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={restrictionsForm.watch('restrictions').includes(restriction)}
                      onCheckedChange={(checked) => {
                        const current = restrictionsForm.getValues('restrictions');
                        if (checked) {
                          restrictionsForm.setValue('restrictions', [...current, restriction]);
                        } else {
                          restrictionsForm.setValue('restrictions', current.filter(r => r !== restriction));
                        }
                      }}
                    />
                    <span className="text-sm text-glass-strong">{restriction}</span>
                  </label>
                ))}
              </div>
              {restrictionsForm.formState.errors.restrictions && (
                <p className="text-error-500 text-xs mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {restrictionsForm.formState.errors.restrictions.message}
                </p>
              )}
            </div>

            {/* Allergies */}
            <div>
              <Label className="text-sm font-medium text-glass-strong mb-3 block">
                Allergies
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {commonAllergies.map(allergy => (
                  <label
                    key={allergy}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={restrictionsForm.watch('allergies').includes(allergy)}
                      onCheckedChange={(checked) => {
                        const current = restrictionsForm.getValues('allergies');
                        if (checked) {
                          restrictionsForm.setValue('allergies', [...current, allergy]);
                        } else {
                          restrictionsForm.setValue('allergies', current.filter(a => a !== allergy));
                        }
                      }}
                    />
                    <span className="text-sm text-glass-strong">{allergy}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  restrictionsForm.reset();
                  setIsEditingRestrictions(false);
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                Save Changes
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-glass-medium mb-2">
                Restrictions & Allergies
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile?.dietaryRestrictions?.map(restriction => (
                  <Badge key={restriction} variant="secondary" className="bg-glass-medium">
                    <Heart className="w-3 h-3 mr-1" />
                    {restriction}
                  </Badge>
                ))}
                {profile?.allergies?.map(allergy => (
                  <Badge key={allergy} variant="secondary" className="bg-error-500/20 text-error-600">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {allergy}
                  </Badge>
                ))}
                {!profile?.dietaryRestrictions?.length && !profile?.allergies?.length && (
                  <p className="text-sm text-glass-medium">
                    No dietary restrictions or allergies set
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Favorite Cuisines */}
      <Card className="glass-subtle backdrop-blur-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-glass-strong flex items-center gap-2">
            <Utensils className="w-5 h-5" />
            Cuisine Preferences
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditingCuisines(!isEditingCuisines)}
            className="text-glass-medium"
          >
            {isEditingCuisines ? 'Cancel' : 'Edit'}
          </Button>
        </div>

        {isEditingCuisines ? (
          <form onSubmit={cuisinesForm.handleSubmit(handleSaveCuisines)} className="space-y-6">
            {/* Favorite Cuisines */}
            <div>
              <Label className="text-sm font-medium text-glass-strong mb-3 block">
                Favorite Cuisines
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {cuisineOptions.map(cuisine => (
                  <label
                    key={cuisine.id}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={cuisinesForm.watch('cuisines').includes(cuisine.id)}
                      onCheckedChange={(checked) => {
                        const current = cuisinesForm.getValues('cuisines');
                        if (checked) {
                          cuisinesForm.setValue('cuisines', [...current, cuisine.id]);
                        } else {
                          cuisinesForm.setValue('cuisines', current.filter(c => c !== cuisine.id));
                        }
                      }}
                    />
                    <span className="text-sm text-glass-strong">
                      {cuisine.flag} {cuisine.name}
                    </span>
                  </label>
                ))}
              </div>
              {cuisinesForm.formState.errors.cuisines && (
                <p className="text-error-500 text-xs mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {cuisinesForm.formState.errors.cuisines.message}
                </p>
              )}
            </div>

            {/* Cooking Style */}
            <div>
              <Label className="text-sm font-medium text-glass-strong mb-3 block">
                Cooking Style
              </Label>
              <RadioGroup
                value={cuisinesForm.watch('cookingTime')}
                onValueChange={(value) => cuisinesForm.setValue('cookingTime', value as any)}
              >
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <RadioGroupItem value="quick" />
                    <div>
                      <div className="text-sm font-medium text-glass-strong">
                        Quick & Easy
                      </div>
                      <div className="text-xs text-glass-medium">
                        Less than 30 minutes
                      </div>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <RadioGroupItem value="balanced" />
                    <div>
                      <div className="text-sm font-medium text-glass-strong">
                        Balanced
                      </div>
                      <div className="text-xs text-glass-medium">
                        30-60 minutes
                      </div>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <RadioGroupItem value="gourmet" />
                    <div>
                      <div className="text-sm font-medium text-glass-strong">
                        Gourmet
                      </div>
                      <div className="text-xs text-glass-medium">
                        More than 60 minutes
                      </div>
                    </div>
                  </label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  cuisinesForm.reset();
                  setIsEditingCuisines(false);
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                Save Changes
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            {/* Cuisine Stats */}
            {cuisineStats.length > 0 && (
              <div className="space-y-3">
                {cuisineStats.map((cuisine, index) => (
                  <motion.div
                    key={cuisine.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-glass-strong">
                        {cuisine.flag} {cuisine.name}
                      </span>
                      <span className="text-glass-medium">
                        {cuisine.percentage}%
                      </span>
                    </div>
                    <Progress value={cuisine.percentage} className="h-2" />
                  </motion.div>
                ))}
              </div>
            )}

            {/* Cooking Style */}
            <div>
              <h3 className="text-sm font-medium text-glass-medium mb-2">
                Cooking Style
              </h3>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-glass-medium" />
                <span className="text-sm text-glass-strong">
                  {profile?.preferredCookingTime === 'quick' && 'Quick & Easy (< 30 min)'}
                  {profile?.preferredCookingTime === 'balanced' && 'Balanced (30-60 min)'}
                  {profile?.preferredCookingTime === 'gourmet' && 'Gourmet (> 60 min)'}
                  {!profile?.preferredCookingTime && 'Not set'}
                </span>
              </div>
            </div>

            {/* Equipment */}
            <div>
              <h3 className="text-sm font-medium text-glass-medium mb-2">
                Available Equipment
              </h3>
              <div className="flex flex-wrap gap-2">
                {cookingEquipment.map(equipment => {
                  const isAvailable = profile?.availableEquipment?.includes(equipment);
                  return (
                    <Badge
                      key={equipment}
                      variant="secondary"
                      className={cn(
                        'transition-all',
                        isAvailable
                          ? 'bg-glass-medium'
                          : 'bg-glass-subtle opacity-50'
                      )}
                    >
                      {isAvailable && <Check className="w-3 h-3 mr-1" />}
                      {equipment}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}