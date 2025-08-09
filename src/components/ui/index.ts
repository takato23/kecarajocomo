// KeCarajoComer Design System - Mobile-First UI Components
export { KeButton } from './KeButton';
export type { KeButtonProps } from './KeButton';

export { KeInput } from './KeInput';
export type { KeInputProps } from './KeInput';

export { 
  KeCard, 
  KeCardHeader,
  KeCardTitle,
  KeCardDescription, 
  KeCardContent, 
  KeCardFooter 
} from './KeCard';
export type { KeCardProps } from './KeCard';

export { KeModal, useKeModal } from './KeModal';
export type { KeModalProps } from './KeModal';

export { 
  KeBadge, 
  KeNotificationBadge, 
  KeFoodCategoryBadge, 
  KeExpiryBadge 
} from './KeBadge';
export type { KeBadgeProps } from './KeBadge';

// Dashboard components
export { DashboardCard } from './DashboardCard';
export { MetricDisplay } from './MetricDisplay';
export { QuickActionCard } from './QuickActionCard';

// shadcn/ui components (legacy compatibility)
export * from './alert';
export * from './badge';
export { Button, buttonVariants } from './button';
export * from './card';
export * from './dialog';
export * from './dropdown-menu';
export * from './input';
export * from './label';
export * from './scroll-area';
export * from './select';
export * from './separator';
export * from './skeleton';
export * from './slider';
export * from './switch';
export * from './tabs';
export * from './textarea';