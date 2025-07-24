import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { format } from 'date-fns';

interface DashboardMetrics {
  mealsPlannedThisWeek: number;
  mealsPlannedThisMonth: number;
  recipesTriedThisMonth: number;
  pantryItemsExpiringSoon: number;
  upcomingMeals: Array<{
    id: string;
    date: string;
    mealType: string;
    recipeName: string;
    isToday: boolean;
    isTomorrow: boolean;
  }>;
  recentActivity: Array<{
    id: string;
    type: 'meal_planned' | 'recipe_added' | 'shopping_completed' | 'pantry_updated';
    message: string;
    timestamp: string;
    relativeTime: string;
  }>;
  weeklyNutrition: {
    calories: { current: number; goal: number };
    protein: { current: number; goal: number };
    carbs: { current: number; goal: number };
    fat: { current: number; goal: number };
  } | null;
  pantryStatus: {
    totalItems: number;
    expiringSoon: number;
    lowStock: number;
  };
}

interface DashboardState {
  // Data
  metrics: DashboardMetrics;
  isLoading: boolean;
  lastUpdated: string | null;
  error: string | null;
  
  // Actions
  loadDashboardData: () => Promise<void>;
  refreshMetrics: () => Promise<void>;
  setError: (error: string | null) => void;
  
  // Real-time updates
  addRecentActivity: (activity: Omit<DashboardMetrics['recentActivity'][0], 'id' | 'relativeTime'>) => void;
  updateMetric: (key: keyof DashboardMetrics, value: any) => void;
}

const initialMetrics: DashboardMetrics = {
  mealsPlannedThisWeek: 0,
  mealsPlannedThisMonth: 0,
  recipesTriedThisMonth: 0,
  pantryItemsExpiringSoon: 0,
  upcomingMeals: [],
  recentActivity: [],
  weeklyNutrition: null,
  pantryStatus: {
    totalItems: 0,
    expiringSoon: 0,
    lowStock: 0
  }
};

export const useDashboardStore = create<DashboardState>()(
  devtools(
    (set, get) => ({
      metrics: initialMetrics,
      isLoading: false,
      lastUpdated: null,
      error: null,
      
      loadDashboardData: async () => {
        set({ isLoading: true, error: null });
        
        try {
          // TODO: Replace with actual API calls
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Mock data for demonstration
          const mockMetrics: DashboardMetrics = {
            mealsPlannedThisWeek: 12,
            mealsPlannedThisMonth: 45,
            recipesTriedThisMonth: 8,
            pantryItemsExpiringSoon: 3,
            upcomingMeals: [
              {
                id: '1',
                date: format(new Date(), 'yyyy-MM-dd'),
                mealType: 'dinner',
                recipeName: 'Grilled Salmon with Vegetables',
                isToday: true,
                isTomorrow: false
              },
              {
                id: '2',
                date: format(new Date(Date.now() + 86400000), 'yyyy-MM-dd'),
                mealType: 'breakfast',
                recipeName: 'Overnight Oats with Berries',
                isToday: false,
                isTomorrow: true
              }
            ],
            recentActivity: [
              {
                id: '1',
                type: 'meal_planned',
                message: 'Added dinner plan for today',
                timestamp: new Date(Date.now() - 3600000).toISOString(),
                relativeTime: '1h ago'
              },
              {
                id: '2',
                type: 'recipe_added',
                message: 'Saved new recipe: Mediterranean Quinoa Bowl',
                timestamp: new Date(Date.now() - 7200000).toISOString(),
                relativeTime: '2h ago'
              },
              {
                id: '3',
                type: 'pantry_updated',
                message: 'Updated pantry inventory',
                timestamp: new Date(Date.now() - 14400000).toISOString(),
                relativeTime: '4h ago'
              }
            ],
            weeklyNutrition: {
              calories: { current: 8500, goal: 14000 },
              protein: { current: 420, goal: 700 },
              carbs: { current: 850, goal: 1400 },
              fat: { current: 280, goal: 467 }
            },
            pantryStatus: {
              totalItems: 45,
              expiringSoon: 3,
              lowStock: 7
            }
          };
          
          set({
            metrics: mockMetrics,
            isLoading: false,
            lastUpdated: new Date().toISOString()
          });
        } catch (error: unknown) {
          set({
            error: error instanceof Error ? error.message : 'Failed to load dashboard data',
            isLoading: false
          });
        }
      },
      
      refreshMetrics: async () => {
        const state = get();
        await state.loadDashboardData();
      },
      
      setError: (error) => set({ error }),
      
      addRecentActivity: (activity) => {
        const newActivity = {
          ...activity,
          id: Date.now().toString(),
          relativeTime: 'just now'
        };
        
        set((state) => ({
          metrics: {
            ...state.metrics,
            recentActivity: [newActivity, ...state.metrics.recentActivity].slice(0, 10)
          }
        }));
      },
      
      updateMetric: (key, value) => {
        set((state) => ({
          metrics: {
            ...state.metrics,
            [key]: value
          }
        }));
      }
    }),
    {
      name: 'dashboard-store'
    }
  )
);