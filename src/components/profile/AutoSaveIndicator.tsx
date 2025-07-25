'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Save, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  WifiOff, 
  RefreshCw,
  GitBranch,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type SaveState = 'idle' | 'saving' | 'saved' | 'error' | 'offline' | 'conflict';

export interface AutoSaveIndicatorProps {
  /** Current save state */
  state: SaveState;
  /** Show detailed status text */
  showText?: boolean;
  /** Custom className */
  className?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show last saved time */
  lastSaved?: Date | null;
  /** Enable compact mode */
  compact?: boolean;
  /** Show retry button on error */
  onRetry?: () => void;
  /** Show resolve button on conflict */
  onResolveConflict?: () => void;
  /** Progress indicator for long saves */
  progress?: number;
  /** Custom error message */
  errorMessage?: string;
}

const stateConfig = {
  idle: {
    icon: Clock,
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/20',
    text: 'Sin cambios',
    textColor: 'text-gray-400',
    pulse: false
  },
  saving: {
    icon: RefreshCw,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    text: 'Guardando...',
    textColor: 'text-blue-400',
    pulse: true
  },
  saved: {
    icon: CheckCircle,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
    text: 'Guardado',
    textColor: 'text-green-400',
    pulse: false
  },
  error: {
    icon: AlertCircle,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
    text: 'Error al guardar',
    textColor: 'text-red-400',
    pulse: false
  },
  offline: {
    icon: WifiOff,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/20',
    text: 'Guardado offline',
    textColor: 'text-orange-400',
    pulse: false
  },
  conflict: {
    icon: GitBranch,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
    text: 'Conflicto detectado',
    textColor: 'text-purple-400',
    pulse: true
  }
} as const;

const sizeConfig = {
  sm: {
    iconSize: 'w-3 h-3',
    padding: 'px-2 py-1',
    textSize: 'text-xs',
    height: 'h-6'
  },
  md: {
    iconSize: 'w-4 h-4',
    padding: 'px-3 py-1.5',
    textSize: 'text-sm',
    height: 'h-8'
  },
  lg: {
    iconSize: 'w-5 h-5',
    padding: 'px-4 py-2',
    textSize: 'text-base',
    height: 'h-10'
  }
} as const;

export function AutoSaveIndicator({
  state,
  showText = true,
  className,
  size = 'md',
  lastSaved,
  compact = false,
  onRetry,
  onResolveConflict,
  progress,
  errorMessage
}: AutoSaveIndicatorProps) {
  const config = stateConfig[state];
  const sizeStyles = sizeConfig[size];
  const Icon = config.icon;

  const formatLastSaved = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    if (minutes > 0) {
      return `hace ${minutes}m`;
    } else if (seconds > 5) {
      return `hace ${seconds}s`;
    } else {
      return 'ahora';
    }
  };

  if (compact) {
    return (
      <motion.div
        className={cn(
          'inline-flex items-center justify-center rounded-full border',
          sizeStyles.height,
          'aspect-square',
          config.bgColor,
          config.borderColor,
          config.pulse && 'animate-pulse',
          className
        )}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        title={config.text}
      >
        <Icon 
          className={cn(sizeStyles.iconSize, config.color)}
          {...(state === 'saving' && { style: { animation: 'spin 1s linear infinite' } })}
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      className={cn(
        'inline-flex items-center gap-2 rounded-lg border backdrop-blur-sm',
        sizeStyles.padding,
        config.bgColor,
        config.borderColor,
        config.pulse && 'animate-pulse',
        className
      )}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {/* Icon with loading animation */}
      <div className="relative">
        <Icon 
          className={cn(sizeStyles.iconSize, config.color)}
          {...(state === 'saving' && { style: { animation: 'spin 1s linear infinite' } })}
        />
        
        {/* Progress ring for saving state */}
        {state === 'saving' && progress !== undefined && (
          <svg
            className={cn('absolute inset-0', sizeStyles.iconSize)}
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="2"
              strokeOpacity="0.3"
              className={config.color}
            />
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray={`${2 * Math.PI * 10}`}
              strokeDashoffset={`${2 * Math.PI * 10 * (1 - progress / 100)}`}
              strokeLinecap="round"
              className={config.color}
              style={{
                transform: 'rotate(-90deg)',
                transformOrigin: 'center'
              }}
            />
          </svg>
        )}
      </div>

      {/* Status text */}
      {showText && (
        <div className="flex flex-col min-w-0">
          <span className={cn(sizeStyles.textSize, 'font-medium', config.textColor)}>
            {errorMessage && state === 'error' ? errorMessage : config.text}
          </span>
          
          {/* Last saved time */}
          {lastSaved && state === 'saved' && (
            <span className={cn(
              'text-xs text-gray-500',
              size === 'sm' && 'hidden'
            )}>
              {formatLastSaved(lastSaved)}
            </span>
          )}
        </div>
      )}

      {/* Action buttons */}
      <AnimatePresence>
        {state === 'error' && onRetry && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={onRetry}
            className={cn(
              'inline-flex items-center justify-center rounded-md transition-colors',
              'hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-red-500/50',
              size === 'sm' ? 'w-5 h-5' : size === 'md' ? 'w-6 h-6' : 'w-7 h-7'
            )}
            title="Reintentar guardado"
          >
            <RefreshCw className={cn(
              config.color,
              size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-3.5 h-3.5' : 'w-4 h-4'
            )} />
          </motion.button>
        )}

        {state === 'conflict' && onResolveConflict && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={onResolveConflict}
            className={cn(
              'inline-flex items-center justify-center rounded-md transition-colors',
              'hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/50',
              size === 'sm' ? 'w-5 h-5' : size === 'md' ? 'w-6 h-6' : 'w-7 h-7'
            )}
            title="Resolver conflicto"
          >
            <Shield className={cn(
              config.color,
              size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-3.5 h-3.5' : 'w-4 h-4'
            )} />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Variant for use in form headers
export function AutoSaveHeader({
  state,
  lastSaved,
  onRetry,
  onResolveConflict,
  errorMessage,
  className
}: Pick<AutoSaveIndicatorProps, 'state' | 'lastSaved' | 'onRetry' | 'onResolveConflict' | 'errorMessage' | 'className'>) {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-white">
          Mi Perfil
        </h2>
        <AutoSaveIndicator
          state={state}
          size="sm"
          lastSaved={lastSaved}
          onRetry={onRetry}
          onResolveConflict={onResolveConflict}
          errorMessage={errorMessage}
        />
      </div>
      
      {/* Connection status indicator */}
      <div className="flex items-center gap-2">
        <div className={cn(
          'w-2 h-2 rounded-full',
          navigator.onLine ? 'bg-green-400' : 'bg-red-400'
        )} />
        <span className="text-xs text-gray-400">
          {navigator.onLine ? 'En línea' : 'Sin conexión'}
        </span>
      </div>
    </div>
  );
}

// Progress bar variant for long operations
export function AutoSaveProgress({
  progress,
  state,
  className
}: {
  progress: number;
  state: SaveState;
  className?: string;
}) {
  const config = stateConfig[state];
  
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between text-sm">
        <span className={config.textColor}>
          {config.text}
        </span>
        <span className="text-gray-400">
          {Math.round(progress)}%
        </span>
      </div>
      
      <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
        <motion.div
          className={cn(
            'h-full rounded-full',
            state === 'saving' ? 'bg-blue-500' : 
            state === 'saved' ? 'bg-green-500' :
            state === 'error' ? 'bg-red-500' :
            'bg-gray-500'
          )}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}