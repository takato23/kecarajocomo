'use client';

import { motion, AnimatePresence } from 'framer-motion';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface FABProps {
  icon: React.ReactNode;
  onClick: () => void;
  position?: 'bottom-right' | 'bottom-center';
  visible?: boolean;
  className?: string;
  ariaLabel?: string;
}

export function FloatingActionButton({
  icon,
  onClick,
  position = 'bottom-right',
  visible = true,
  className,
  ariaLabel,
}: FABProps) {
  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 25,
          }}
          className={cn(
            'fixed z-50',
            positionClasses[position],
            'md:hidden' // Only show on mobile
          )}
        >
          <Button
            onClick={onClick}
            size="icon"
            aria-label={ariaLabel}
            className={cn(
              'w-14 h-14 rounded-full shadow-lg',
              'bg-food-warm hover:bg-food-warm/90',
              'active:scale-95 transition-transform',
              className
            )}
          >
            <motion.div
              whileTap={{ scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              {icon}
            </motion.div>
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}