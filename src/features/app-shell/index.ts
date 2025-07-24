// App Shell main exports

// Main Components
export { AppShell, GlassAppShell, ResponsiveAppShell, CompactAppShell } from './components/AppShell';

// Navigation Components
export { Header } from './components/navigation/Header';
export { Sidebar, CollapsibleSidebar } from './components/navigation/Sidebar';
export { BottomNav, FloatingBottomNav, AdaptiveBottomNav } from './components/navigation/BottomNav';

// Page Components
export * from './components/pages';

// Configuration
export * from './config/routes';

// Types
export * from './types';

// Default exports for easy usage
export { defaultNavigationConfig } from './config/routes';