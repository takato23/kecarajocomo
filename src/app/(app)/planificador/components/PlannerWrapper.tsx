'use client';

import dynamic from 'next/dynamic';

// Dynamically import components to avoid SSR issues
export const DynamicEnhancedMealSlot = dynamic(
  () => import('./EnhancedMealSlot'),
  { 
    ssr: false,
    loading: () => <div className="h-32 animate-pulse bg-gray-100 rounded-lg" />
  }
);

export const DynamicEnhancedWeekNavigator = dynamic(
  () => import('./EnhancedWeekNavigator'),
  { 
    ssr: false,
    loading: () => <div className="h-48 animate-pulse bg-gray-100 rounded-lg" />
  }
);

export const DynamicEnhancedMealPlannerGrid = dynamic(
  () => import('./EnhancedMealPlannerGrid'),
  { 
    ssr: false,
    loading: () => <div className="h-96 animate-pulse bg-gray-100 rounded-lg" />
  }
);

export const DynamicAIPlanningModal = dynamic(
  () => import('./AIPlanningModal'),
  { ssr: false }
);

// Export iOS26 components with proper dynamic loading
export const DynamiciOS26EnhancedCard = dynamic(
  async () => {
    const { iOS26EnhancedCard } = await import('./iOS26ComponentsWrapper');
    return { default: iOS26EnhancedCard };
  },
  { 
    ssr: false,
    loading: () => <div className="h-32 animate-pulse bg-gray-100 rounded-lg" />
  }
);

export const DynamiciOS26LiquidButton = dynamic(
  async () => {
    const { iOS26LiquidButton } = await import('./iOS26ComponentsWrapper');
    return { default: iOS26LiquidButton };
  },
  { 
    ssr: false,
    loading: () => <div className="h-10 w-24 animate-pulse bg-gray-100 rounded-lg" />
  }
);

export const DynamiciOS26FloatingActionMenu = dynamic(
  async () => {
    const { iOS26FloatingActionMenu } = await import('./iOS26ComponentsWrapper');
    return { default: iOS26FloatingActionMenu };
  },
  { 
    ssr: false,
    loading: () => <div className="h-14 w-14 animate-pulse bg-gray-100 rounded-full" />
  }
);