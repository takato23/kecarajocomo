import React from 'react';
import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';

import { IllustrationProps } from '../../types';

// Base illustration component
export function BaseIllustration({
  children,
  variant,
  size,
  animated = true,
  className,
  ...props
}: IllustrationProps & { children: React.ReactNode }) {
  const sizeClasses = {
    sm: 'w-32 h-32',
    md: 'w-48 h-48',
    lg: 'w-64 h-64',
    xl: 'w-80 h-80'
  };

  const illustrationElement = (
    <div className={cn('relative flex items-center justify-center', sizeClasses[size], className)}>
      {children}
    </div>
  );

  if (animated) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative"
      >
        {illustrationElement}
      </motion.div>
    );
  }

  return illustrationElement;
}

// Hero illustration - Recipe generation concept
export function HeroIllustration({ colors, size = 'xl', animated = true, className }: Omit<IllustrationProps, 'variant'>) {
  return (
    <BaseIllustration
      variant="hero"
      size={size}
      colors={colors}
      animated={animated}
      className={className}
    >
      <svg viewBox="0 0 400 400" className="w-full h-full">
        {/* Background circle */}
        <circle cx="200" cy="200" r="180" fill={colors.primary} opacity="0.1" />
        
        {/* Chef's hat */}
        <motion.g
          animate={animated ? { y: [0, -5, 0] } : {}}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ellipse cx="200" cy="120" rx="35" ry="15" fill={colors.secondary} />
          <rect x="165" y="105" width="70" height="40" rx="35" fill="white" />
          <rect x="180" y="90" width="10" height="15" rx="5" fill={colors.accent} />
          <rect x="200" y="95" width="8" height="12" rx="4" fill={colors.accent} />
          <rect x="215" y="88" width="12" height="17" rx="6" fill={colors.accent} />
        </motion.g>
        
        {/* Cooking pot */}
        <motion.g
          animate={animated ? { rotate: [0, 2, -2, 0] } : {}}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ellipse cx="200" cy="280" rx="60" ry="50" fill={colors.primary} />
          <ellipse cx="200" cy="250" rx="55" ry="8" fill={colors.secondary} />
          <rect x="145" y="230" width="10" height="20" rx="5" fill={colors.accent} />
          <rect x="245" y="230" width="10" height="20" rx="5" fill={colors.accent} />
        </motion.g>
        
        {/* Steam */}
        <motion.g
          animate={animated ? { opacity: [0.3, 0.7, 0.3] } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <path d="M190 220 Q185 200 190 180 Q195 160 190 140" stroke={colors.secondary} strokeWidth="3" fill="none" opacity="0.6" />
          <path d="M200 225 Q205 205 200 185 Q195 165 200 145" stroke={colors.secondary} strokeWidth="3" fill="none" opacity="0.6" />
          <path d="M210 220 Q215 200 210 180 Q205 160 210 140" stroke={colors.secondary} strokeWidth="3" fill="none" opacity="0.6" />
        </motion.g>
        
        {/* Ingredients floating around */}
        <motion.g
          animate={animated ? { rotate: 360 } : {}}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        >
          {/* Tomato */}
          <circle cx="100" cy="150" r="15" fill="#ff6b6b" />
          <path d="M95 140 Q100 135 105 140" stroke="#4ecdc4" strokeWidth="2" fill="none" />
          
          {/* Carrot */}
          <ellipse cx="320" cy="180" rx="8" ry="25" fill="#ffa726" />
          <path d="M320 155 L315 145 M320 155 L325 145" stroke="#4ecdc4" strokeWidth="2" />
          
          {/* Onion */}
          <ellipse cx="80" cy="320" rx="18" ry="20" fill="#f4e4c1" />
          <path d="M80 300 Q85 295 80 290" stroke="#d4a574" strokeWidth="2" fill="none" />
          
          {/* Pepper */}
          <ellipse cx="330" cy="320" rx="12" ry="30" fill="#4caf50" />
          <rect x="327" y="290" width="6" height="8" rx="3" fill="#8bc34a" />
        </motion.g>
        
        {/* AI sparkles */}
        <motion.g
          animate={animated ? { opacity: [0, 1, 0] } : {}}
          transition={{ duration: 1.5, repeat: Infinity, staggerChildren: 0.2 }}
        >
          <motion.circle cx="120" cy="200" r="3" fill={colors.accent} />
          <motion.circle cx="280" cy="220" r="2" fill={colors.accent} />
          <motion.circle cx="150" cy="280" r="2.5" fill={colors.accent} />
          <motion.circle cx="250" cy="160" r="2" fill={colors.accent} />
        </motion.g>
      </svg>
    </BaseIllustration>
  );
}

// Feature illustration - Meal planning
export function MealPlanningIllustration({ colors, size = 'lg', animated = true, className }: Omit<IllustrationProps, 'variant'>) {
  return (
    <BaseIllustration
      variant="feature"
      size={size}
      colors={colors}
      animated={animated}
      className={className}
    >
      <svg viewBox="0 0 300 300" className="w-full h-full">
        {/* Calendar background */}
        <rect x="50" y="50" width="200" height="200" rx="20" fill="white" stroke={colors.primary} strokeWidth="3" />
        
        {/* Calendar header */}
        <rect x="50" y="50" width="200" height="40" rx="20" fill={colors.primary} />
        <text x="150" y="75" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">Weekly Plan</text>
        
        {/* Calendar grid */}
        <g stroke={colors.primary} strokeWidth="1" opacity="0.3">
          <line x1="50" y1="120" x2="250" y2="120" />
          <line x1="50" y1="150" x2="250" y2="150" />
          <line x1="50" y1="180" x2="250" y2="180" />
          <line x1="50" y1="210" x2="250" y2="210" />
          <line x1="120" y1="90" x2="120" y2="250" />
          <line x1="180" y1="90" x2="180" y2="250" />
        </g>
        
        {/* Meal icons */}
        <motion.g
          animate={animated ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* Breakfast */}
          <circle cx="85" cy="105" r="8" fill={colors.secondary} />
          <circle cx="85" cy="135" r="8" fill={colors.accent} />
          <circle cx="85" cy="165" r="8" fill={colors.primary} />
          
          {/* Lunch */}
          <rect x="142" y="97" width="16" height="16" rx="3" fill={colors.secondary} />
          <rect x="142" y="127" width="16" height="16" rx="3" fill={colors.accent} />
          <rect x="142" y="157" width="16" height="16" rx="3" fill={colors.primary} />
          
          {/* Dinner */}
          <polygon points="210,105 218,113 210,121 202,113" fill={colors.secondary} />
          <polygon points="210,135 218,143 210,151 202,143" fill={colors.accent} />
          <polygon points="210,165 218,173 210,181 202,173" fill={colors.primary} />
        </motion.g>
        
        {/* Floating food items */}
        <motion.g
          animate={animated ? { y: [0, -10, 0] } : {}}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', staggerChildren: 0.5 }}
        >
          <circle cx="30" cy="120" r="12" fill="#ff6b6b" />
          <circle cx="270" cy="160" r="10" fill="#4ecdc4" />
          <circle cx="40" cy="200" r="8" fill="#ffa726" />
          <circle cx="260" cy="220" r="11" fill="#4caf50" />
        </motion.g>
      </svg>
    </BaseIllustration>
  );
}

// Feature illustration - Smart pantry
export function SmartPantryIllustration({ colors, size = 'lg', animated = true, className }: Omit<IllustrationProps, 'variant'>) {
  return (
    <BaseIllustration
      variant="feature"
      size={size}
      colors={colors}
      animated={animated}
      className={className}
    >
      <svg viewBox="0 0 300 300" className="w-full h-full">
        {/* Pantry shelves */}
        <rect x="50" y="50" width="200" height="200" rx="10" fill="white" stroke={colors.primary} strokeWidth="3" />
        
        {/* Shelves */}
        <rect x="50" y="120" width="200" height="8" fill={colors.primary} />
        <rect x="50" y="180" width="200" height="8" fill={colors.primary} />
        <rect x="50" y="240" width="200" height="8" fill={colors.primary} />
        
        {/* Items on shelves */}
        <motion.g
          animate={animated ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', staggerChildren: 0.3 }}
        >
          {/* Top shelf */}
          <rect x="70" y="80" width="30" height="35" rx="5" fill={colors.secondary} />
          <rect x="120" y="85" width="25" height="30" rx="5" fill={colors.accent} />
          <rect x="170" y="82" width="28" height="33" rx="5" fill={colors.primary} />
          <rect x="210" y="88" width="22" height="27" rx="5" fill={colors.secondary} />
          
          {/* Middle shelf */}
          <circle cx="80" cy="155" r="15" fill={colors.accent} />
          <circle cx="130" cy="155" r="12" fill={colors.primary} />
          <circle cx="180" cy="155" r="14" fill={colors.secondary} />
          <circle cx="220" cy="155" r="13" fill={colors.accent} />
          
          {/* Bottom shelf */}
          <ellipse cx="85" cy="215" rx="20" ry="15" fill={colors.primary} />
          <ellipse cx="140" cy="215" rx="18" ry="12" fill={colors.secondary} />
          <ellipse cx="195" cy="215" rx="22" ry="16" fill={colors.accent} />
        </motion.g>
        
        {/* Smart indicators */}
        <motion.g
          animate={animated ? { opacity: [0.5, 1, 0.5] } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <circle cx="90" cy="70" r="4" fill="#4caf50" />
          <circle cx="140" cy="75" r="4" fill="#ffa726" />
          <circle cx="190" cy="72" r="4" fill="#4caf50" />
          <circle cx="230" cy="78" r="4" fill="#ff6b6b" />
        </motion.g>
        
        {/* AI scan lines */}
        <motion.g
          animate={animated ? { y: [0, 200, 0] } : {}}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <line x1="50" y1="0" x2="250" y2="0" stroke={colors.accent} strokeWidth="2" opacity="0.6" />
          <line x1="50" y1="5" x2="250" y2="5" stroke={colors.accent} strokeWidth="1" opacity="0.4" />
          <line x1="50" y1="10" x2="250" y2="10" stroke={colors.accent} strokeWidth="1" opacity="0.2" />
        </motion.g>
      </svg>
    </BaseIllustration>
  );
}

// Feature illustration - Shopping optimization
export function ShoppingOptimizationIllustration({ colors, size = 'lg', animated = true, className }: Omit<IllustrationProps, 'variant'>) {
  return (
    <BaseIllustration
      variant="feature"
      size={size}
      colors={colors}
      animated={animated}
      className={className}
    >
      <svg viewBox="0 0 300 300" className="w-full h-full">
        {/* Shopping cart */}
        <motion.g
          animate={animated ? { x: [0, 20, 0] } : {}}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <rect x="100" y="150" width="80" height="60" rx="10" fill="white" stroke={colors.primary} strokeWidth="3" />
          <rect x="95" y="145" width="10" height="70" rx="5" fill={colors.primary} />
          <circle cx="120" cy="225" r="8" fill={colors.secondary} />
          <circle cx="160" cy="225" r="8" fill={colors.secondary} />
          
          {/* Cart items */}
          <circle cx="120" cy="170" r="8" fill={colors.accent} />
          <rect x="135" y="165" width="15" height="15" rx="3" fill={colors.secondary} />
          <circle cx="155" cy="185" r="6" fill={colors.primary} />
        </motion.g>
        
        {/* Optimization path */}
        <motion.path
          d="M50 100 Q100 80 150 100 Q200 120 250 100"
          stroke={colors.accent}
          strokeWidth="3"
          fill="none"
          strokeDasharray="10,5"
          animate={animated ? { strokeDashoffset: [0, -15] } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />
        
        {/* Store sections */}
        <g>
          {/* Produce */}
          <circle cx="70" cy="80" r="25" fill={colors.secondary} opacity="0.3" />
          <circle cx="70" cy="80" r="8" fill="#4caf50" />
          <text x="70" y="110" textAnchor="middle" fontSize="10" fill={colors.primary}>Produce</text>
          
          {/* Dairy */}
          <circle cx="230" cy="80" r="25" fill={colors.accent} opacity="0.3" />
          <circle cx="230" cy="80" r="8" fill="#2196f3" />
          <text x="230" y="110" textAnchor="middle" fontSize="10" fill={colors.primary}>Dairy</text>
          
          {/* Meat */}
          <circle cx="70" cy="220" r="25" fill={colors.primary} opacity="0.3" />
          <circle cx="70" cy="220" r="8" fill="#ff6b6b" />
          <text x="70" y="250" textAnchor="middle" fontSize="10" fill={colors.primary}>Meat</text>
          
          {/* Pantry */}
          <circle cx="230" cy="220" r="25" fill={colors.secondary} opacity="0.3" />
          <circle cx="230" cy="220" r="8" fill="#ffa726" />
          <text x="230" y="250" textAnchor="middle" fontSize="10" fill={colors.primary}>Pantry</text>
        </g>
        
        {/* AI optimization indicators */}
        <motion.g
          animate={animated ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', staggerChildren: 0.2 }}
        >
          <circle cx="120" cy="50" r="3" fill={colors.accent} />
          <circle cx="180" cy="60" r="3" fill={colors.accent} />
          <circle cx="150" cy="40" r="3" fill={colors.accent} />
        </motion.g>
      </svg>
    </BaseIllustration>
  );
}

// Testimonial illustration - Happy user
export function HappyUserIllustration({ colors, size = 'md', animated = true, className }: Omit<IllustrationProps, 'variant'>) {
  return (
    <BaseIllustration
      variant="testimonial"
      size={size}
      colors={colors}
      animated={animated}
      className={className}
    >
      <svg viewBox="0 0 200 200" className="w-full h-full">
        {/* Head */}
        <circle cx="100" cy="80" r="40" fill={colors.primary} />
        
        {/* Hair */}
        <path d="M60 60 Q80 40 100 45 Q120 40 140 60" fill={colors.secondary} />
        
        {/* Eyes */}
        <circle cx="90" cy="75" r="4" fill="white" />
        <circle cx="110" cy="75" r="4" fill="white" />
        <circle cx="90" cy="75" r="2" fill="black" />
        <circle cx="110" cy="75" r="2" fill="black" />
        
        {/* Smile */}
        <motion.path
          d="M85 90 Q100 100 115 90"
          stroke={colors.accent}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          animate={animated ? { pathLength: [0, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
        
        {/* Body */}
        <ellipse cx="100" cy="140" rx="30" ry="40" fill={colors.secondary} />
        
        {/* Arms */}
        <motion.ellipse
          cx="70" cy="130" rx="8" ry="25"
          fill={colors.primary}
          animate={animated ? { rotate: [0, 10, 0] } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.ellipse
          cx="130" cy="130" rx="8" ry="25"
          fill={colors.primary}
          animate={animated ? { rotate: [0, -10, 0] } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
        
        {/* Heart */}
        <motion.g
          animate={animated ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <path d="M100 50 C95 45, 85 45, 85 55 C85 65, 100 75, 100 75 C100 75, 115 65, 115 55 C115 45, 105 45, 100 50 Z" fill={colors.accent} />
        </motion.g>
      </svg>
    </BaseIllustration>
  );
}

// Pricing illustration - Value proposition
export function ValuePropositionIllustration({ colors, size = 'lg', animated = true, className }: Omit<IllustrationProps, 'variant'>) {
  return (
    <BaseIllustration
      variant="pricing"
      size={size}
      colors={colors}
      animated={animated}
      className={className}
    >
      <svg viewBox="0 0 300 300" className="w-full h-full">
        {/* Value scale */}
        <motion.g
          animate={animated ? { rotate: [0, 5, -5, 0] } : {}}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <rect x="140" y="140" width="20" height="80" rx="10" fill={colors.primary} />
          <ellipse cx="150" cy="130" rx="40" ry="10" fill={colors.secondary} />
          <ellipse cx="150" cy="230" rx="40" ry="10" fill={colors.secondary} />
          
          {/* Left side - Cost */}
          <circle cx="100" cy="130" r="25" fill={colors.accent} opacity="0.7" />
          <text x="100" y="135" textAnchor="middle" fontSize="12" fill="white">Cost</text>
          
          {/* Right side - Value */}
          <circle cx="200" cy="130" r="35" fill={colors.primary} />
          <text x="200" y="135" textAnchor="middle" fontSize="12" fill="white">Value</text>
        </motion.g>
        
        {/* Benefits floating around */}
        <motion.g
          animate={animated ? { rotate: 360 } : {}}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
        >
          <circle cx="50" cy="100" r="12" fill={colors.secondary} />
          <text x="50" y="105" textAnchor="middle" fontSize="8" fill="white">Save Time</text>
          
          <circle cx="250" cy="100" r="12" fill={colors.accent} />
          <text x="250" y="105" textAnchor="middle" fontSize="8" fill="white">Save Money</text>
          
          <circle cx="50" cy="200" r="12" fill={colors.primary} />
          <text x="50" y="205" textAnchor="middle" fontSize="8" fill="white">Eat Better</text>
          
          <circle cx="250" cy="200" r="12" fill={colors.secondary} />
          <text x="250" y="205" textAnchor="middle" fontSize="8" fill="white">Less Waste</text>
        </motion.g>
        
        {/* Sparkle effects */}
        <motion.g
          animate={animated ? { opacity: [0, 1, 0] } : {}}
          transition={{ duration: 2, repeat: Infinity, staggerChildren: 0.3 }}
        >
          <circle cx="120" cy="80" r="2" fill={colors.accent} />
          <circle cx="180" cy="90" r="2" fill={colors.accent} />
          <circle cx="160" cy="70" r="2" fill={colors.accent} />
          <circle cx="140" cy="100" r="2" fill={colors.accent} />
        </motion.g>
      </svg>
    </BaseIllustration>
  );
}