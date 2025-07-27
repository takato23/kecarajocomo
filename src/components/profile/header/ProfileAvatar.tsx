'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { logger } from '@/services/logger';

import { cn } from '@/lib/utils';

interface AchievementBadge {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface ProfileAvatarProps {
  src?: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
  badge?: AchievementBadge;
  isEditing?: boolean;
  onUpload?: (file: File) => Promise<void>;
  className?: string;
}

const sizeMap = {
  sm: { container: 'w-16 h-16', badge: 'w-6 h-6', icon: 'w-3 h-3' },
  md: { container: 'w-24 h-24', badge: 'w-8 h-8', icon: 'w-4 h-4' },
  lg: { container: 'w-32 h-32', badge: 'w-10 h-10', icon: 'w-5 h-5' },
};

export function ProfileAvatar({
  src,
  alt,
  size = 'md',
  badge,
  isEditing = false,
  onUpload,
  className,
}: ProfileAvatarProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sizes = sizeMap[size];

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpload) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      await onUpload(file);
      toast.success('Avatar updated successfully');
    } catch (error: unknown) {
      toast.error('Failed to upload avatar');
      logger.error('Avatar upload error:', 'ProfileAvatar', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={cn('relative', sizes.container, className)}>
      {/* Avatar Image */}
      <div className={cn(
        'relative overflow-hidden rounded-full',
        'bg-glass-medium backdrop-blur-md',
        'border border-white/10',
        sizes.container
      )}>
        {src ? (
          <Image
            src={src}
            alt={alt}
            fill
            className="object-cover"
            sizes={`(max-width: 768px) ${size === 'lg' ? '128px' : size === 'md' ? '96px' : '64px'}, ${size === 'lg' ? '128px' : size === 'md' ? '96px' : '64px'}`}
            priority
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-glass-strong">
            <span className={cn(
              'font-semibold uppercase',
              size === 'lg' ? 'text-3xl' : size === 'md' ? 'text-2xl' : 'text-lg'
            )}>
              {alt.slice(0, 2)}
            </span>
          </div>
        )}

        {/* Upload Overlay */}
        <AnimatePresence>
          {isEditing && onUpload && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={cn(
                'absolute inset-0 flex items-center justify-center',
                'bg-black/60 backdrop-blur-sm cursor-pointer',
                'hover:bg-black/70 transition-colors'
              )}
              onClick={() => fileInputRef.current?.click()}
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="text-white"
              >
                {isUploading ? (
                  <div className="animate-spin rounded-full border-2 border-white border-t-transparent w-6 h-6" />
                ) : (
                  <Camera className={sizes.icon} />
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Achievement Badge */}
      {badge && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          className={cn(
            'absolute -bottom-1 -right-1',
            'flex items-center justify-center',
            'rounded-full shadow-lg',
            'border-2 border-background',
            sizes.badge
          )}
          style={{ backgroundColor: badge.color }}
        >
          <span className="text-white text-xs">{badge.icon}</span>
        </motion.div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />
    </div>
  );
}