'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'highlight' | 'error' | 'success';
}

export function GlassCard({ children, className, variant = 'default' }: GlassCardProps) {
  const variants = {
    default: 'bg-white/5 border-white/10',
    highlight: 'bg-purple-500/10 border-purple-400/20',
    error: 'bg-red-500/10 border-red-400/20',
    success: 'bg-green-500/10 border-green-400/20',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'backdrop-blur-xl rounded-2xl border p-6',
        variants[variant],
        className
      )}
      style={{
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      {children}
    </motion.div>
  );
}

export function GlassButton({
  children,
  onClick,
  disabled,
  variant = 'primary',
  className,
  type = 'button',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
  className?: string;
  type?: 'button' | 'submit';
}) {
  const variants = {
    primary: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600',
    secondary: 'bg-white/10 text-white hover:bg-white/20 border border-white/20',
    ghost: 'text-white/80 hover:text-white hover:bg-white/10',
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'px-6 py-3 font-medium rounded-xl transition-all duration-200',
        'focus:outline-none focus:ring-4 focus:ring-purple-500/50',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        className
      )}
    >
      {children}
    </motion.button>
  );
}