'use client';

import { useState, useRef } from 'react';
import { 
  Camera, 
  Edit, 
  Save, 
  X,
  Trophy,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';

import { useProfile } from '@/contexts/ProfileContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { UserProfile } from '@/types/profile';


interface ProfileHeaderProps {
  profile: UserProfile;
  completionPercentage: number;
  onUpdateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

export function ProfileHeader({ profile, completionPercentage, onUpdateProfile }: ProfileHeaderProps) {
  const { uploadAvatar } = useProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    fullName: profile.fullName,
    username: profile.username,
    bio: profile.bio || ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    try {
      await onUpdateProfile(editedProfile);
      setIsEditing(false);
    } catch (error: unknown) {
      toast.error('Error al actualizar el perfil');
    }
  };

  const handleCancel = () => {
    setEditedProfile({
      fullName: profile.fullName,
      username: profile.username,
      bio: profile.bio || ''
    });
    setIsEditing(false);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await uploadAvatar(file);
      toast.success('Foto de perfil actualizada');
    } catch (error: unknown) {
      toast.error('Error al subir la imagen');
    }
  };

  return (
    <div className="bg-card rounded-lg p-6 md:p-8 mb-8">
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Avatar Section */}
        <div className="relative">
          <Avatar className="w-24 h-24 md:w-32 md:h-32">
            <AvatarImage src={profile.avatarUrl} />
            <AvatarFallback className="text-2xl md:text-3xl">
              {profile.fullName?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <Button
            size="icon"
            variant="secondary"
            className="absolute bottom-0 right-0 rounded-full"
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera className="w-4 h-4" />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>

        {/* Profile Info */}
        <div className="flex-1 space-y-4">
          {isEditing ? (
            <div className="space-y-4">
              <Input
                value={editedProfile.fullName}
                onChange={(e) => setEditedProfile({ ...editedProfile, fullName: e.target.value })}
                placeholder="Nombre completo"
                className="text-2xl font-bold"
              />
              <Input
                value={editedProfile.username}
                onChange={(e) => setEditedProfile({ ...editedProfile, username: e.target.value })}
                placeholder="Nombre de usuario"
              />
              <Textarea
                value={editedProfile.bio}
                onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })}
                placeholder="Cuéntanos sobre ti..."
                rows={3}
              />
              <div className="flex gap-2">
                <Button onClick={handleSave} size="sm">
                  <Save className="w-4 h-4 mr-2" />
                  Guardar
                </Button>
                <Button onClick={handleCancel} variant="outline" size="sm">
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">{profile.fullName}</h1>
                  <p className="text-muted-foreground">@{profile.username}</p>
                  {profile.bio && (
                    <p className="mt-2 text-sm md:text-base">{profile.bio}</p>
                  )}
                </div>
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  size="sm"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              </div>

              {/* Achievement Badges */}
              <div className="flex flex-wrap gap-2">
                {profile.stats?.streakDays > 7 && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Trophy className="w-3 h-3" />
                    {profile.stats.streakDays} días de racha
                  </Badge>
                )}
                {profile.stats?.recipesCreated > 10 && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Chef creativo
                  </Badge>
                )}
                {completionPercentage === 100 && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Trophy className="w-3 h-3" />
                    Perfil completo
                  </Badge>
                )}
              </div>
            </>
          )}
        </div>

        {/* Profile Completion */}
        {!isEditing && (
          <div className="w-full md:w-48">
            <div className="text-sm text-muted-foreground mb-2">
              Perfil completado
            </div>
            <Progress value={completionPercentage} className="mb-2" />
            <p className="text-sm font-medium">{completionPercentage}%</p>
          </div>
        )}
      </div>
    </div>
  );
}