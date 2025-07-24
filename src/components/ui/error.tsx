'use client';

import { AlertCircle, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { Button } from '@/components/design-system/Button';
import { cn } from '@/lib/utils';

interface ErrorBoundaryFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

export function ErrorBoundaryFallback({ error, resetErrorBoundary }: ErrorBoundaryFallbackProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-interactive rounded-xl p-8 max-w-lg w-full text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 10 }}
          className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center"
        >
          <AlertCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
        </motion.div>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Oops! Something went wrong
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          We apologize for the inconvenience. The error has been logged and we&apos;ll work on fixing it.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
          <Button
            onClick={resetErrorBoundary}
            className="inline-flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
          
          <Button
            variant="secondary"
            onClick={() => window.location.href = '/'}
            className="inline-flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            Go Home
          </Button>
        </div>

        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 inline-flex items-center gap-1 transition-colors"
        >
          {showDetails ? 'Hide' : 'Show'} technical details
          {showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>

        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-4 overflow-hidden"
            >
              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-left">
                <p className="text-xs font-mono text-gray-600 dark:text-gray-400 break-all">
                  {error.name}: {error.message}
                </p>
                {error.stack && (
                  <pre className="mt-2 text-xs text-gray-500 dark:text-gray-500 overflow-x-auto">
                    {error.stack}
                  </pre>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

interface ErrorMessageProps {
  title?: string;
  message: string;
  type?: 'error' | 'warning' | 'info';
  onRetry?: () => void;
  className?: string;
}

export function ErrorMessage({
  title,
  message,
  type = 'error',
  onRetry,
  className,
}: ErrorMessageProps) {
  const colors = {
    error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-400',
    info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400',
  };

  const icons = {
    error: AlertCircle,
    warning: AlertCircle,
    info: AlertCircle,
  };

  const Icon = icons[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-lg border p-4 flex items-start gap-3',
        colors[type],
        className
      )}
    >
      <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        {title && <h3 className="font-semibold mb-1">{title}</h3>}
        <p className="text-sm">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 text-sm font-medium underline hover:no-underline"
          >
            Try again
          </button>
        )}
      </div>
    </motion.div>
  );
}

interface InlineErrorProps {
  error: string | null;
  className?: string;
}

export function InlineError({ error, className }: InlineErrorProps) {
  if (!error) return null;

  return (
    <motion.p
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className={cn('text-sm text-red-600 dark:text-red-400 mt-1', className)}
    >
      {error}
    </motion.p>
  );
}

// Toast notification for errors
export function ErrorToast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      className="fixed bottom-4 right-4 z-50"
    >
      <div className="glass-interactive rounded-lg p-4 pr-12 shadow-lg max-w-sm">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-red-500" />
          </div>
          <p className="text-sm text-gray-900 dark:text-white">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </motion.div>
  );
}