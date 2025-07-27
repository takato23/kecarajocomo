import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export interface GlassInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  glowColor?: string;
}

export const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  ({ className, label, error, icon, rightIcon, glowColor, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);

    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400">
              {icon}
            </div>
          )}
          
          <div className="relative">
            <input
              ref={ref}
              className={cn(
                "w-full px-4 py-3 rounded-lg",
                "bg-white/12 dark:bg-gray-900/12",
                "backdrop-blur-sm",
                "border border-white/15 dark:border-gray-700/15",
                "text-slate-900 dark:text-slate-100",
                "placeholder-slate-500 dark:placeholder-slate-400",
                "transition-all duration-200",
                "focus:outline-none focus:ring-2 focus:ring-slate-400/30 dark:focus:ring-slate-600/30 focus:border-slate-400/40 dark:focus:border-slate-600/40",
                "hover:bg-white/18 dark:hover:bg-gray-900/18 hover:border-white/20 dark:hover:border-gray-700/20",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                icon && "pl-10",
                rightIcon && "pr-10",
                error && "border-red-400/50 dark:border-red-500/50",
                className
              )}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              {...props}
            />
            
            {/* Subtle glass effect overlay */}
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
          </div>
          
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400">
              {rightIcon}
            </div>
          )}
        </div>
        
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="text-sm text-red-600 dark:text-red-400"
          >
            {error}
          </motion.p>
        )}
      </div>
    );
  }
);

GlassInput.displayName = 'GlassInput';