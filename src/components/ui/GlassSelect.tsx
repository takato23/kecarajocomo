import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export interface GlassSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  glowColor?: string;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export const GlassSelect = forwardRef<HTMLSelectElement, GlassSelectProps>(
  ({ className, label, error, glowColor, options, placeholder, ...props }, ref) => {
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
          <select
            ref={ref}
            className={cn(
              "w-full px-4 py-3 pr-10 rounded-xl appearance-none",
              "bg-white/10 dark:bg-gray-900/10",
              "backdrop-blur-md",
              "border border-white/20 dark:border-gray-700/20",
              "text-gray-900 dark:text-gray-100",
              "transition-all duration-300",
              "focus:outline-none focus:ring-2 focus:ring-white/30 dark:focus:ring-gray-600/30",
              "hover:bg-white/20 dark:hover:bg-gray-900/20",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "cursor-pointer",
              error && "border-red-500/50",
              className
            )}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              >
                {option.label}
              </option>
            ))}
          </select>
          
          {/* Glass effect overlay */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
          
          {/* Custom dropdown arrow */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </div>
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

GlassSelect.displayName = 'GlassSelect';