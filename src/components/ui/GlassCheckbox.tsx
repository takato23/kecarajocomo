import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';

export interface GlassCheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
  error?: string;
  glowColor?: string;
}

export const GlassCheckbox = forwardRef<HTMLInputElement, GlassCheckboxProps>(
  ({ className, label, description, error, glowColor = 'rgba(34, 197, 94, 0.5)', ...props }, ref) => {
    const [isChecked, setIsChecked] = React.useState(props.checked || false);
    const [isFocused, setIsFocused] = React.useState(false);

    React.useEffect(() => {
      setIsChecked(props.checked || false);
    }, [props.checked]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setIsChecked(e.target.checked);
      props.onChange?.(e);
    };

    return (
      <div className="space-y-2">
        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="relative mt-0.5">
            <motion.div
              animate={{
                boxShadow: isFocused && glowColor
                  ? `0 0 15px ${glowColor}`
                  : '0 0 0px rgba(0,0,0,0)'
              }}
              transition={{ duration: 0.3 }}
              className="relative rounded-lg"
            >
              <input
                ref={ref}
                type="checkbox"
                className="sr-only"
                checked={isChecked}
                onChange={handleChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                {...props}
              />
              
              <div
                className={cn(
                  "w-5 h-5 rounded-lg",
                  "bg-white/10 dark:bg-gray-900/10",
                  "backdrop-blur-md",
                  "border-2 border-white/20 dark:border-gray-700/20",
                  "transition-all duration-300",
                  "group-hover:bg-white/20 dark:group-hover:bg-gray-900/20",
                  "relative overflow-hidden",
                  isChecked && "bg-green-500/20 border-green-500/50",
                  error && "border-red-500/50",
                  props.disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                {/* Glass effect overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                
                {/* Check mark */}
                <AnimatePresence>
                  {isChecked && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <Check className="w-3 h-3 text-green-600 dark:text-green-400" strokeWidth={3} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
          
          {(label || description) && (
            <div className="flex-1">
              {label && (
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {label}
                </span>
              )}
              {description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                  {description}
                </p>
              )}
            </div>
          )}
        </label>
        
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-500 dark:text-red-400 ml-8"
          >
            {error}
          </motion.p>
        )}
      </div>
    );
  }
);

GlassCheckbox.displayName = 'GlassCheckbox';