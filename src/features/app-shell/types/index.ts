// App Shell types for navigation and layout
import { ReactNode } from 'react';

export interface Route {
  id: string;
  path: string;
  name: string;
  icon: ReactNode;
  component?: React.ComponentType;
  isActive?: boolean;
  badge?: string | number;
  children?: Route[];
}

export interface NavigationConfig {
  sidebar: Route[];
  bottomNav: Route[];
  header: HeaderConfig;
}

export interface HeaderConfig {
  showSearch: boolean;
  showNotifications: boolean;
  showProfile: boolean;
  showLogo: boolean;
  title?: string;
}

export interface SidebarProps {
  routes: Route[];
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
  variant?: 'desktop' | 'mobile';
}

export interface BottomNavProps {
  routes: Route[];
  currentRoute?: string;
  className?: string;
  variant?: 'default' | 'floating';
}

export interface HeaderProps {
  config: HeaderConfig;
  onMenuToggle?: () => void;
  onSearch?: (query: string) => void;
  onProfileClick?: () => void;
  className?: string;
  variant?: 'default' | 'glass' | 'transparent';
}

export interface AppShellProps {
  children: ReactNode;
  navigation: NavigationConfig;
  currentRoute?: string;
  sidebarOpen?: boolean;
  onSidebarToggle?: (open: boolean) => void;
  className?: string;
  variant?: 'default' | 'glass';
  responsive?: boolean;
}

export interface LayoutBreakpoints {
  showSidebar: boolean;
  showBottomNav: boolean;
  sidebarVariant: 'desktop' | 'mobile';
  headerVariant: 'default' | 'glass' | 'transparent';
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  mealReminders: boolean;
  shoppingReminders: boolean;
  expirationAlerts: boolean;
}

export interface PrivacySettings {
  shareRecipes: boolean;
  showActivity: boolean;
  allowAnalytics: boolean;
}

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionText?: string;
}

export interface SearchResult {
  id: string;
  type: 'recipe' | 'ingredient' | 'meal-plan' | 'user';
  title: string;
  subtitle?: string;
  thumbnail?: string;
  url: string;
  relevance: number;
}

export interface AppState {
  user: User | null;
  notifications: Notification[];
  isLoading: boolean;
  error: string | null;
  sidebarOpen: boolean;
  searchQuery: string;
  searchResults: SearchResult[];
}

// Layout responsive states
export type ViewportSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface ResponsiveConfig {
  viewport: ViewportSize;
  breakpoints: LayoutBreakpoints;
  adaptiveNavigation: boolean;
  collapsibleSidebar: boolean;
}

// Glass morphism configuration
export interface GlassConfig {
  blur: 'sm' | 'md' | 'lg' | 'xl';
  opacity: number;
  border: boolean;
  shadow: 'sm' | 'md' | 'lg' | 'xl' | 'none';
  background: string;
}

// Animation configurations
export interface AnimationConfig {
  enabled: boolean;
  duration: number;
  easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
  stagger: number;
  reducedMotion: boolean;
}

// Accessibility configurations
export interface AccessibilityConfig {
  announcements: boolean;
  keyboardNavigation: boolean;
  focusManagement: boolean;
  colorContrast: 'normal' | 'high';
  fontSize: 'small' | 'medium' | 'large';
}

// Performance monitoring
export interface PerformanceMetrics {
  navigationTime: number;
  renderTime: number;
  interactionLatency: number;
  memoryUsage: number;
  cacheHitRate: number;
}

export interface AppShellConfig {
  responsive: ResponsiveConfig;
  glass: GlassConfig;
  animations: AnimationConfig;
  accessibility: AccessibilityConfig;
  performance: {
    lazyLoading: boolean;
    virtualScrolling: boolean;
    caching: boolean;
    prefetching: boolean;
  };
}