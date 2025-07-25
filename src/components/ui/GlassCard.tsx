'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { cn } from '@/lib/utils';
import { glassVariants, glassButtonVariants, type GlassVariantsProps, type GlassButtonVariantsProps } from '@/lib/glass-variants';

interface GlassCardProps extends GlassVariantsProps {
  children: React.ReactNode;
  particles?: boolean;
  spotlight?: boolean;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  variant = 'medium',
  interactive = false,
  glow = false,
  particles = false,
  spotlight = false,
  className,
  as: Component = 'div',
  onClick
}) => {
  return (
    <Component
      className={cn(
        'rounded-2xl',
        glassVariants({ variant, interactive, glow }),
        className
      )}
      onClick={onClick}
    >
      {particles && (
        <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
          <div className="absolute -top-4 -left-4 w-24 h-24 bg-purple-500/20 rounded-full blur-2xl animate-pulse" />
          <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl animate-pulse delay-700" />
        </div>
      )}
      
      {spotlight && (
        <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gradient-radial from-white/20 dark:from-white/10 to-transparent rounded-full blur-xl" />
        </div>
      )}
      
      <div className="relative z-10">
        {children}
      </div>
    </Component>
  );
};

interface GlassRecipeCardProps {
  title: string;
  description?: string;
  imageUrl?: string;
  prepTime?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  rating?: number;
  tags?: string[];
  onClick?: () => void;
  className?: string;
}

export const GlassRecipeCard: React.FC<GlassRecipeCardProps> = ({
  title,
  description,
  imageUrl,
  prepTime,
  difficulty,
  rating,
  tags = [],
  onClick,
  className
}) => {
  const difficultyColors = {
    easy: 'bg-green-500/20 text-green-300 border-green-500/30',
    medium: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    hard: 'bg-red-500/20 text-red-300 border-red-500/30'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={cn('glass-card-recipe glass-container glass-interactive', className)}
      onClick={onClick}
    >
      {/* Image Section */}
      {imageUrl && (
        <div className="glass-image-overlay">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="glass-overlay">
            <div className="flex items-center justify-between">
              {rating && (
                <div className="flex items-center space-x-1">
                  <span className="text-yellow-300 dark:text-yellow-400">★</span>
                  <span className="text-sm font-medium dark:text-white">{rating.toFixed(1)}</span>
                </div>
              )}
              {prepTime && (
                <div className="flex items-center space-x-1 text-sm dark:text-white">
                  <span>🕐</span>
                  <span>{prepTime} min</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Content Section */}
      <div className="glass-content space-y-3">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
            {title}
          </h3>
          {difficulty && (
            <span className={cn(
              'px-2 py-1 rounded-full text-xs font-medium border',
              difficultyColors[difficulty]
            )}>
              {difficulty}
            </span>
          )}
        </div>

        {description && (
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
            {description}
          </p>
        )}

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs rounded-full bg-white/10 text-gray-700 dark:text-gray-300 border border-white/20"
              >
                {tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="px-2 py-1 text-xs rounded-full bg-white/10 text-gray-500 dark:text-gray-400 border border-white/20">
                +{tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Particles Effect */}
      <div className="glass-particles" />
    </motion.div>
  );
};

interface GlassModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  blur?: boolean;
}

export const GlassModal: React.FC<GlassModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  blur = true
}) => {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              'absolute inset-0 bg-black/20',
              blur && 'backdrop-blur-sm'
            )}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'relative w-full glass-container glass-strong',
              sizeClasses[size]
            )}
          >
            {title && (
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            
            <div className="p-6">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

interface GlassButtonProps extends GlassButtonVariantsProps {
  children: React.ReactNode;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  children,
  variant = 'secondary',
  size = 'md',
  icon,
  iconPosition = 'left',
  disabled = false,
  loading = false,
  onClick,
  className,
  type = 'button'
}) => {
  return (
    <motion.button
      type={type}
      whileHover={{ 
        scale: disabled ? 1 : 1.02, 
        y: disabled ? 0 : -1,
      }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      transition={{ 
        type: "spring", 
        stiffness: 400, 
        damping: 25 
      }}
      className={cn(
        glassButtonVariants({ variant, size }),
        'flex items-center justify-center space-x-2 transition-all duration-300 ease-out',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      onClick={disabled ? undefined : onClick}
      disabled={disabled || loading}
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          <span>{children}</span>
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </motion.button>
  );
};

interface GlassInputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  icon?: React.ReactNode;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export const GlassInput: React.FC<GlassInputProps> = ({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  icon,
  error,
  disabled = false,
  className
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
            {icon}
          </div>
        )}
        
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'glass-input w-full',
            icon && 'pl-10',
            error && 'border-red-500/50 focus:border-red-500/70',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        />
      </div>
      
      {error && (
        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
};