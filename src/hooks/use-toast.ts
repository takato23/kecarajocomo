'use client';

import { toast as sonnerToast } from 'sonner';

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
}

export function useToast() {
  const toast = (options: ToastOptions) => {
    if (options.variant === 'destructive') {
      sonnerToast.error(options.title || 'Error', {
        description: options.description,
        duration: options.duration || 4000,
      });
    } else {
      sonnerToast.success(options.title || 'Éxito', {
        description: options.description,
        duration: options.duration || 3000,
      });
    }
  };

  return { toast };
}