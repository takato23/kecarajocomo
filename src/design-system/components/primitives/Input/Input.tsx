import { forwardRef, InputHTMLAttributes, useState, useRef, useEffect } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion, AnimatePresence } from 'framer-motion';
import { MicrophoneIcon, XMarkIcon } from '@heroicons/react/24/solid';

import { cn } from '@/lib/utils';
import { useVoiceService } from '@/hooks/useVoiceService';

import { Button } from '../Button';


const inputVariants = cva(
  'w-full rounded-lg border bg-white px-3 py-2 text-base transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20',
        error: 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20',
        success: 'border-green-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/20',
      },
      size: {
        sm: 'h-8 text-sm',
        md: 'h-10',
        lg: 'h-12 text-lg',
      },
      withIcon: {
        left: 'pl-10',
        right: 'pr-10',
        both: 'pl-10 pr-10',
        none: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      withIcon: 'none',
    },
  }
);

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  label?: string;
  error?: string;
  success?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  withVoice?: boolean;
  onVoiceResult?: (text: string) => void;
  clearable?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      variant,
      size,
      label,
      error,
      success,
      hint,
      leftIcon,
      rightIcon,
      withVoice = false,
      onVoiceResult,
      clearable = false,
      disabled,
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const [localValue, setLocalValue] = useState(value || '');
    const inputRef = useRef<HTMLInputElement>(null);
    
    // Voice service integration
    const voice = useVoiceService({
      onCommand: (command) => {
        const text = command.transcript;
        setLocalValue(text);
        const event = {
          target: { value: text },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange?.(event);
        onVoiceResult?.(text);
      },
      onInterim: (transcript) => {
        // Optionally show interim results
        if (transcript) {
          setLocalValue(transcript);
        }
      },
      onError: (error) => {
        console.error('Voice input error:', error);
      },
    });
    
    // Merge refs
    useEffect(() => {
      if (ref) {
        if (typeof ref === 'function') {
          ref(inputRef.current);
        } else {
          ref.current = inputRef.current;
        }
      }
    }, [ref]);

    // Update local value when prop changes
    useEffect(() => {
      setLocalValue(value || '');
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setLocalValue(e.target.value);
      onChange?.(e);
    };

    const handleClear = () => {
      const event = {
        target: { value: '' },
      } as React.ChangeEvent<HTMLInputElement>;
      setLocalValue('');
      onChange?.(event);
      inputRef.current?.focus();
    };

    const handleVoiceClick = async () => {
      if (voice.isListening) {
        voice.stopListening();
      } else {
        // Clear any previous error
        voice.clearTranscript();
        // Start listening
        await voice.startListening({
          language: 'es-MX',
          interimResults: true,
          enableFeedback: true,
        });
      }
    };

    // Determine variant based on error/success
    const computedVariant = error ? 'error' : success ? 'success' : variant;
    
    // Determine icon positioning
    const iconPosition = leftIcon && rightIcon ? 'both' : leftIcon ? 'left' : rightIcon || withVoice || clearable ? 'right' : 'none';

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              {leftIcon}
            </div>
          )}
          
          <input
            ref={inputRef}
            type="text"
            className={cn(
              inputVariants({ variant: computedVariant, size, withIcon: iconPosition, className }),
              (withVoice || clearable) && !rightIcon && 'pr-20'
            )}
            disabled={disabled || voice.isListening}
            value={localValue}
            onChange={handleChange}
            {...props}
          />
          
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {rightIcon && !withVoice && !clearable && (
              <div className="text-gray-400">
                {rightIcon}
              </div>
            )}
            
            <AnimatePresence>
              {clearable && localValue && !disabled && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.1 }}
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 p-0"
                    onClick={handleClear}
                    aria-label="Limpiar campo"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
            
            {withVoice && (
              <Button
                type="button"
                variant={voice.isListening ? 'primary' : 'ghost'}
                size="icon"
                className="h-6 w-6 p-0"
                onClick={handleVoiceClick}
                disabled={disabled || !voice.isAvailable}
                aria-label={voice.isListening ? 'Detener grabación' : 'Activar entrada de voz'}
              >
                <AnimatePresence mode="wait">
                  {voice.isListening ? (
                    <motion.div
                      key="listening"
                      className="relative"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <motion.div
                        className="absolute inset-0 bg-orange-500 rounded-full"
                        animate={{ scale: [1, 1.5, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        style={{ opacity: 0.3 }}
                      />
                      <MicrophoneIcon className="h-4 w-4 text-orange-500 relative z-10" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="idle"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <MicrophoneIcon className="h-4 w-4 text-gray-400 hover:text-orange-500 transition-colors" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            )}
          </div>
        </div>
        
        {(error || success || hint) && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'mt-1 text-sm',
              error && 'text-red-500',
              success && 'text-green-500',
              !error && !success && 'text-gray-500'
            )}
          >
            {error || success || hint}
          </motion.p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';