import { cva, type VariantProps } from 'class-variance-authority';

export const glassVariants = cva(
  'backdrop-blur-md transition-all duration-300',
  {
    variants: {
      variant: {
        subtle: [
          'bg-white/10 dark:bg-black/20',
          'backdrop-blur-sm dark:backdrop-blur-md',
          'border border-white/20 dark:border-white/10',
          'shadow-sm dark:shadow-lg dark:shadow-black/20',
        ],
        medium: [
          'bg-white/20 dark:bg-black/30', 
          'backdrop-blur-md dark:backdrop-blur-lg',
          'border border-white/30 dark:border-white/15',
          'shadow-md dark:shadow-xl dark:shadow-black/30',
        ],
        strong: [
          'bg-white/30 dark:bg-black/40',
          'backdrop-blur-lg dark:backdrop-blur-xl', 
          'border border-white/40 dark:border-white/20',
          'shadow-lg dark:shadow-2xl dark:shadow-black/40',
        ],
      },
      interactive: {
        true: [
          'cursor-pointer',
          'hover:bg-white/25 dark:hover:bg-black/35',
          'hover:border-white/35 dark:hover:border-white/25',
          'hover:shadow-xl dark:hover:shadow-2xl',
          'hover:scale-[1.02] active:scale-[0.98]',
        ],
      },
      glow: {
        true: [
          'dark:shadow-[0_0_20px_rgba(147,51,234,0.3)]',
          'dark:hover:shadow-[0_0_30px_rgba(147,51,234,0.4)]',
        ],
      },
    },
    defaultVariants: {
      variant: 'medium',
      interactive: false,
      glow: false,
    },
  }
);

export type GlassVariantsProps = VariantProps<typeof glassVariants>;

// Button specific glass variants
export const glassButtonVariants = cva(
  'backdrop-blur-md transition-all duration-300 font-medium rounded-xl px-4 py-2.5',
  {
    variants: {
      variant: {
        primary: [
          'bg-gradient-to-r from-orange-500/80 to-pink-500/80',
          'dark:from-orange-600/60 dark:to-pink-600/60',
          'backdrop-blur-md',
          'border border-white/20 dark:border-white/10',
          'text-white',
          'shadow-lg hover:shadow-xl',
          'hover:from-orange-500 hover:to-pink-500',
          'dark:hover:from-orange-600/80 dark:hover:to-pink-600/80',
        ],
        secondary: [
          'bg-white/20 dark:bg-white/10',
          'backdrop-blur-md',
          'border border-white/30 dark:border-white/15',
          'text-gray-900 dark:text-white',
          'hover:bg-white/30 dark:hover:bg-white/20',
          'hover:border-white/40 dark:hover:border-white/25',
        ],
        ghost: [
          'bg-transparent',
          'border border-white/20 dark:border-white/10',
          'text-gray-700 dark:text-gray-300',
          'hover:bg-white/10 dark:hover:bg-white/5',
          'hover:border-white/30 dark:hover:border-white/20',
        ],
      },
      size: {
        sm: 'text-sm px-3 py-1.5',
        md: 'text-base px-4 py-2.5',
        lg: 'text-lg px-6 py-3',
      },
    },
    defaultVariants: {
      variant: 'secondary',
      size: 'md',
    },
  }
);

export type GlassButtonVariantsProps = VariantProps<typeof glassButtonVariants>;