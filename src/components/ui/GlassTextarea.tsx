import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export interface GlassTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  glowColor?: string;
}

export const GlassTextarea = forwardRef<HTMLTextAreaElement, GlassTextareaProps>(
  ({ className, label, error, glowColor, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);

    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
        )}
        
        <motion.div
          animate={{
            boxShadow: isFocused && glowColor
              ? `0 0 20px ${glowColor}`
              : '0 0 0px rgba(0,0,0,0)'
          }}
          transition={{ duration: 0.3 }}
          className="relative rounded-xl"
        >
          <textarea
            ref={ref}
            className={cn(
              "w-full px-4 py-3 rounded-xl",
              "bg-white/10 dark:bg-gray-900/10",
              "backdrop-blur-md",
              "border border-white/20 dark:border-gray-700/20",
              "text-gray-900 dark:text-gray-100",
              "placeholder-gray-500 dark:placeholder-gray-400",
              "transition-all duration-300",
              "focus:outline-none focus:ring-2 focus:ring-white/30 dark:focus:ring-gray-600/30",
              "hover:bg-white/20 dark:hover:bg-gray-900/20",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "resize-none",
              "scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent",
              error && "border-red-500/50",
              className
            )}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />
          
          {/* Glass effect overlay */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
        </motion.div>
        
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-500 dark:text-red-400"
          >
            {error}
          </motion.p>
        )}
      </div>
    );
  }
);

GlassTextarea.displayName = 'GlassTextarea';