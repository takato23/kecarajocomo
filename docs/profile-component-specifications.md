# Profile Component Specifications

## Overview
This document provides detailed technical specifications for implementing the modernized profile UI components, maintaining consistency with the existing glassmorphism design system.

## 1. ProfileHeader Component

### Component Structure
```tsx
interface ProfileHeaderProps {
  user: UserProfile;
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}
```

### Visual Specifications
```
Height: 200px (desktop), 160px (mobile)
Padding: 32px (desktop), 16px (mobile)
Background: glass-subtle with backdrop-blur-lg
Border: 1px solid rgba(255,255,255,0.1)
```

### Sub-components

#### ProfileAvatar
```tsx
interface ProfileAvatarProps {
  src?: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
  badge?: AchievementBadge;
  onUpload?: (file: File) => void;
}

// Sizes
sm: 64x64px
md: 96x96px (default)
lg: 128x128px

// Badge position: bottom-right overlap
// Upload overlay on hover with camera icon
```

#### ProfileStats
```tsx
interface ProfileStatsProps {
  level: number;
  levelProgress: number;
  completionPercentage: number;
  quickStats: {
    location?: string;
    householdSize: number;
    primaryCuisine?: string;
  };
}

// Progress bar: iOS26 liquid animation
// Stats pills: glass-medium with 8px padding
```

#### ProfileProgress
```tsx
interface ProfileProgressProps {
  percentage: number;
  segments: ProfileSegment[];
}

interface ProfileSegment {
  id: string;
  label: string;
  completed: boolean;
  weight: number;
}

// Segmented progress bar with tooltips
// Animated fill on mount
```

## 2. ProfileTabs Component

### TabNavigation
```tsx
interface TabNavigationProps {
  tabs: ProfileTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  variant?: 'desktop' | 'mobile';
}

interface ProfileTab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number;
}

// Desktop: Horizontal tabs with liquid morph active indicator
// Mobile: Swipeable with gesture support
// Transition: 300ms ease-out
```

### Mobile Swipe Implementation
```tsx
// Use react-swipeable
const swipeHandlers = useSwipeable({
  onSwipedLeft: () => navigateToNextTab(),
  onSwipedRight: () => navigateToPreviousTab(),
  threshold: 50,
  trackMouse: false
});

// Visual feedback: slide animation
// Haptic feedback on tab change (mobile)
```

## 3. Loading States

### ProfileSkeleton
```tsx
interface SkeletonProps {
  variant: 'header' | 'content' | 'card' | 'list-item';
  lines?: number;
  animate?: boolean;
}

// Animation: shimmer effect
// Colors: bg-glass-subtle with animated gradient
// Timing: 1.5s infinite ease-in-out
```

### Implementation Example
```tsx
const ProfileHeaderSkeleton = () => (
  <div className="glass-subtle rounded-2xl p-8 space-y-4">
    <div className="flex items-center gap-6">
      <Skeleton variant="header" className="w-24 h-24 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton variant="content" className="h-8 w-48" />
        <Skeleton variant="content" className="h-6 w-32" />
        <Skeleton variant="content" className="h-4 w-64" />
      </div>
    </div>
  </div>
);
```

## 4. Form Validation System

### Validation Schema
```tsx
import { z } from 'zod';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  bio: z.string().max(160, 'Bio must be less than 160 characters').optional(),
  email: z.string().email('Invalid email address'),
  householdSize: z.number().min(1).max(20),
  weeklyBudget: z.number().min(0).max(10000),
});

// Real-time validation with debounce (300ms)
// Error messages appear below inputs
// Success checkmarks on valid fields
```

### Error Display Component
```tsx
interface FieldErrorProps {
  error?: string;
  touched?: boolean;
}

const FieldError: React.FC<FieldErrorProps> = ({ error, touched }) => {
  if (!touched || !error) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-error-default text-sm mt-1 flex items-center gap-1"
    >
      <AlertCircle className="w-3 h-3" />
      {error}
    </motion.div>
  );
};
```

## 5. Activity Dashboard

### Analytics Card
```tsx
interface AnalyticsCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
  chart?: ChartData;
}

// Card: glass-medium with hover state
// Charts: Using recharts with glass theme
// Animation: Fade in with stagger
```

### Cooking Streak Component
```tsx
interface CookingStreakProps {
  currentStreak: number;
  longestStreak: number;
  weeklyProgress: boolean[];
}

// Visual: Flame icon with number
// Progress: Dots for each day, filled when cooked
// Animation: Flame flicker on active streak
```

## 6. Gamification Components

### Achievement Badge
```tsx
interface AchievementBadgeProps {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
  progress?: number;
  maxProgress?: number;
}

// Locked state: Grayscale with lock icon
// Unlocked: Full color with shine animation
// Size: 64x64px with 8px padding
```

### Level Progress
```tsx
interface LevelProgressProps {
  currentLevel: number;
  currentXP: number;
  requiredXP: number;
  nextLevelReward?: string;
}

// Progress bar with liquid fill animation
// Level badge with number
// XP text: "1,250 / 2,000 XP"
```

## 7. Mobile-Specific Components

### FloatingActionButton
```tsx
interface FABProps {
  icon: React.ReactNode;
  onClick: () => void;
  position?: 'bottom-right' | 'bottom-center';
}

// Size: 56x56px
// Background: glass-strong with shadow
// Animation: Scale on press
// Position: Fixed, 16px from edges
```

### PullToRefresh
```tsx
interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

// Threshold: 80px pull distance
// Indicator: Spinning loader with glass effect
// Haptic: Feedback on trigger
```

## 8. Accessibility Specifications

### ARIA Labels
```tsx
// Tab Navigation
<nav role="tablist" aria-label="Profile sections">
  <button
    role="tab"
    aria-selected={isActive}
    aria-controls={`panel-${tab.id}`}
    id={`tab-${tab.id}`}
  >
    {tab.label}
  </button>
</nav>

// Form Fields
<input
  aria-label="Profile name"
  aria-describedby="name-error"
  aria-invalid={!!errors.name}
/>

// Progress Indicators
<div
  role="progressbar"
  aria-valuenow={percentage}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-label="Profile completion"
>
```

### Keyboard Navigation
```tsx
// Tab navigation with arrow keys
const handleKeyDown = (e: KeyboardEvent) => {
  switch(e.key) {
    case 'ArrowLeft':
      navigateToPreviousTab();
      break;
    case 'ArrowRight':
      navigateToNextTab();
      break;
    case 'Home':
      navigateToFirstTab();
      break;
    case 'End':
      navigateToLastTab();
      break;
  }
};

// Focus management
// Trap focus in modals
// Return focus on close
```

## 9. Animation Specifications

### Micro-interactions
```tsx
// Button press
transform: scale(0.95);
transition: transform 100ms ease;

// Card hover
transform: translateY(-2px);
box-shadow: 0 8px 32px rgba(0,0,0,0.1);
transition: all 200ms ease;

// Tab switch
animation: liquidMorph 300ms ease-out;

// Achievement unlock
animation: shine 600ms ease-out,
          scale 300ms ease-out;
```

### Page Transitions
```tsx
// Tab content change
const tabVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 100 : -100,
    opacity: 0
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 100 : -100,
    opacity: 0
  })
};
```

## 10. Performance Guidelines

### Image Optimization
```tsx
// Avatar images
<Image
  src={avatarUrl}
  alt={user.name}
  width={96}
  height={96}
  quality={85}
  placeholder="blur"
  blurDataURL={blurDataUrl}
  priority={isAboveFold}
/>

// Max file size: 500KB
// Formats: WebP with JPEG fallback
// Lazy load below fold
```

### Component Optimization
```tsx
// Memoize expensive computations
const profileStats = useMemo(() => 
  calculateProfileStats(user, activities),
  [user, activities]
);

// Virtualize long lists
<VirtualList
  height={400}
  itemCount={items.length}
  itemSize={72}
  renderItem={renderItem}
/>

// Debounce search/filter
const debouncedSearch = useDebouncedCallback(
  (value) => handleSearch(value),
  300
);
```

## Implementation Checklist

- [ ] Set up component file structure
- [ ] Implement base components with TypeScript
- [ ] Add loading states and skeletons
- [ ] Implement form validation with Zod
- [ ] Add mobile gesture support
- [ ] Implement gamification logic
- [ ] Add comprehensive ARIA labels
- [ ] Set up keyboard navigation
- [ ] Add micro-interactions and animations
- [ ] Optimize images and performance
- [ ] Write unit tests for components
- [ ] Add Storybook stories
- [ ] Document component APIs
- [ ] Perform accessibility audit
- [ ] Test on multiple devices