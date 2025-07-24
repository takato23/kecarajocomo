'use client';

import { useState } from 'react';
import { Edit2, Save, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useProfileContext } from '@/contexts/ProfileContext';

import { ProfileAvatar } from './ProfileAvatar';
import { ProfileStats } from './ProfileStats';
import { ProfileProgress, ProfileSegment } from './ProfileProgress';

interface ProfileHeaderProps {
  className?: string;
}

export function ProfileHeader({ className }: ProfileHeaderProps) {
  const { profile, updateProfile, uploadAvatar } = useProfileContext();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: profile?.name || '',
    username: profile?.username || '',
    bio: profile?.bio || '',
  });

  if (!profile) return null;

  // Calculate profile completion
  const calculateProfileCompletion = () => {
    const segments: ProfileSegment[] = [
      {
        id: 'basic',
        label: 'Basic Info',
        completed: !!(profile.name && profile.username && profile.avatarUrl),
        weight: 30,
      },
      {
        id: 'preferences',
        label: 'Preferences',
        completed: !!(
          profile.dietaryRestrictions?.length ||
          profile.cuisinePreferences?.length ||
          profile.cookingSkillLevel
        ),
        weight: 30,
      },
      {
        id: 'household',
        label: 'Household',
        completed: !!profile.householdSize && profile.householdSize > 0,
        weight: 20,
      },
      {
        id: 'settings',
        label: 'Settings',
        completed: !!(
          profile.weeklyBudget ||
          profile.defaultServingSize ||
          profile.mealPlanningEnabled !== undefined
        ),
        weight: 20,
      },
    ];

    const completedWeight = segments
      .filter(s => s.completed)
      .reduce((sum, s) => sum + s.weight, 0);
    const percentage = Math.round(completedWeight);

    return { percentage, segments };
  };

  const { percentage, segments } = calculateProfileCompletion();

  // Calculate user level based on activity (mock data for now)
  const userLevel = Math.min(5, Math.floor((percentage / 100) * 5) + 1);
  const levelProgress = (percentage % 20) * 5;

  const handleSave = async () => {
    try {
      await updateProfile(editData);
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error: unknown) {
      toast.error('Failed to update profile');
      console.error('Profile update error:', error);
    }
  };

  const handleCancel = () => {
    setEditData({
      name: profile.name || '',
      username: profile.username || '',
      bio: profile.bio || '',
    });
    setIsEditing(false);
  };

  const mockBadge = percentage >= 60 ? {
    id: 'verified',
    name: 'Verified Chef',
    icon: '✓',
    color: '#10b981',
  } : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative overflow-hidden',
        'bg-glass-subtle backdrop-blur-lg',
        'border border-white/10 rounded-2xl',
        'p-6 md:p-8',
        className
      )}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-food-warm/5 to-food-golden/5" />

      <div className="relative flex flex-col md:flex-row gap-6">
        {/* Avatar Section */}
        <ProfileAvatar
          src={profile.avatarUrl}
          alt={profile.name || profile.username || 'User'}
          size="lg"
          badge={mockBadge}
          isEditing={isEditing}
          onUpload={uploadAvatar}
        />

        {/* Info Section */}
        <div className="flex-1 space-y-4">
          {/* Name and Username */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <AnimatePresence mode="wait">
                {isEditing ? (
                  <motion.div
                    key="editing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-3"
                  >
                    <Input
                      value={editData.name}
                      onChange={(e) =>
                        setEditData({ ...editData, name: e.target.value })
                      }
                      placeholder="Your name"
                      className="text-xl font-semibold"
                    />
                    <Input
                      value={editData.username}
                      onChange={(e) =>
                        setEditData({ ...editData, username: e.target.value })
                      }
                      placeholder="Username"
                      className="text-sm"
                    />
                    <Textarea
                      value={editData.bio}
                      onChange={(e) =>
                        setEditData({ ...editData, bio: e.target.value })
                      }
                      placeholder="Tell us about yourself..."
                      className="text-sm resize-none"
                      rows={2}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="display"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <h1 className="text-2xl font-semibold text-glass-strong">
                      {profile.name || 'Add your name'}
                    </h1>
                    <p className="text-sm text-glass-medium">
                      @{profile.username || 'username'}
                    </p>
                    {profile.bio && (
                      <p className="mt-2 text-sm text-glass-medium line-clamp-2">
                        {profile.bio}
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Edit Actions */}
            <div className="ml-4">
              <AnimatePresence mode="wait">
                {isEditing ? (
                  <motion.div
                    key="save-cancel"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex gap-2"
                  >
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCancel}
                      className="text-glass-medium"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      className="bg-food-warm hover:bg-food-warm/90"
                    >
                      <Save className="w-4 h-4" />
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="edit"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsEditing(true)}
                      className="text-glass-medium"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Stats and Progress */}
          <ProfileStats
            level={userLevel}
            levelProgress={levelProgress}
            completionPercentage={percentage}
            quickStats={{
              location: profile.location,
              householdSize: profile.householdSize || 1,
              primaryCuisine: profile.cuisinePreferences?.[0],
            }}
          />

          {/* Progress Bar */}
          <ProfileProgress
            percentage={percentage}
            segments={segments}
          />
        </div>
      </div>
    </motion.div>
  );
}