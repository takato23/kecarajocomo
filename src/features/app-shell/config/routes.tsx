import React from 'react';

import { Route } from '../types';

// Route definitions based on architecture requirements
export const APP_ROUTES = {
  HOME: '/app',
  RECIPES: '/recetas',
  PANTRY: '/despensa',
  SHOPPING: '/lista-compras',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  NOTIFICATIONS: '/notifications',
  SEARCH: '/search',
} as const;

// Icon components for routes
const HomeIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);


const RecipesIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const PantryIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const ShoppingIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
  </svg>
);

const ProfileIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const SettingsIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const NotificationsIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM11 17H6l5 5v-5z" />
  </svg>
);

// Main navigation routes
export const sidebarRoutes: Route[] = [
  {
    id: 'home',
    path: APP_ROUTES.HOME,
    name: 'Dashboard',
    icon: <HomeIcon />,
  },
  {
    id: 'recipes',
    path: APP_ROUTES.RECIPES,
    name: 'Recetas',
    icon: <RecipesIcon />,
  },
  {
    id: 'pantry',
    path: APP_ROUTES.PANTRY,
    name: 'Despensa',
    icon: <PantryIcon />,
  },
  {
    id: 'shopping',
    path: APP_ROUTES.SHOPPING,
    name: 'Compras',
    icon: <ShoppingIcon />,
  },
  {
    id: 'profile',
    path: APP_ROUTES.PROFILE,
    name: 'Profile',
    icon: <ProfileIcon />,
  },
];

// Bottom navigation routes (mobile)
export const bottomNavRoutes: Route[] = [
  {
    id: 'home',
    path: APP_ROUTES.HOME,
    name: 'Home',
    icon: <HomeIcon />,
  },
  {
    id: 'recipes',
    path: APP_ROUTES.RECIPES,
    name: 'Recetas',
    icon: <RecipesIcon />,
  },
  {
    id: 'pantry',
    path: APP_ROUTES.PANTRY,
    name: 'Despensa',
    icon: <PantryIcon />,
  },
  {
    id: 'shopping',
    path: APP_ROUTES.SHOPPING,
    name: 'Compras',
    icon: <ShoppingIcon />,
  },
];

// Secondary routes for sidebar
export const secondaryRoutes: Route[] = [
  {
    id: 'settings',
    path: APP_ROUTES.SETTINGS,
    name: 'Settings',
    icon: <SettingsIcon />,
  },
  {
    id: 'notifications',
    path: APP_ROUTES.NOTIFICATIONS,
    name: 'Notifications',
    icon: <NotificationsIcon />,
    badge: 3, // Example notification count
  },
];

// Default navigation configuration
export const defaultNavigationConfig = {
  sidebar: [...sidebarRoutes, ...secondaryRoutes],
  bottomNav: bottomNavRoutes,
  header: {
    showSearch: true,
    showNotifications: true,
    showProfile: true,
    showLogo: true,
    title: 'KeCaraJoComer',
  },
};

// Route metadata for page titles and descriptions
export const routeMetadata = {
  [APP_ROUTES.HOME]: {
    title: 'Dashboard',
    description: 'Your personalized cooking dashboard',
    keywords: ['dashboard', 'overview', 'meals', 'cooking'],
  },
  [APP_ROUTES.RECIPES]: {
    title: 'Recipes',
    description: 'Discover and manage your recipes',
    keywords: ['recipes', 'cooking', 'ingredients', 'ai generated'],
  },
  [APP_ROUTES.PANTRY]: {
    title: 'Pantry',
    description: 'Manage your pantry inventory',
    keywords: ['pantry', 'inventory', 'ingredients', 'expiration'],
  },
  [APP_ROUTES.SHOPPING]: {
    title: 'Shopping',
    description: 'Your smart shopping lists',
    keywords: ['shopping', 'grocery', 'lists', 'optimization'],
  },
  [APP_ROUTES.PROFILE]: {
    title: 'Profile',
    description: 'Manage your profile and preferences',
    keywords: ['profile', 'settings', 'preferences', 'account'],
  },
  [APP_ROUTES.SEARCH]: {
    title: 'Search',
    description: 'Search recipes, ingredients, and meal plans',
    keywords: ['search', 'find', 'recipes', 'ingredients', 'meal plans'],
  },
};

// Utility functions
export const getRouteById = (id: string, routes: Route[]): Route | undefined => {
  return routes.find(route => route.id === id);
};

export const getRouteByPath = (path: string, routes: Route[]): Route | undefined => {
  return routes.find(route => route.path === path);
};

export const isRouteActive = (routePath: string, currentPath: string): boolean => {
  if (routePath === APP_ROUTES.HOME) {
    return currentPath === routePath;
  }
  return currentPath.startsWith(routePath);
};

export const getActiveRoute = (currentPath: string, routes: Route[]): Route | undefined => {
  return routes.find(route => isRouteActive(route.path, currentPath));
};