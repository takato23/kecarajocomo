// Onboarding Store

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { AuthService } from '../services/authService';
import { 
  OnboardingState, 
  OnboardingStep, 
  OnboardingData,
  UserProfile,
  UserPreferences,
  PantryItem,
  WeeklyMealPlan
} from '../types';

import { useAppStore } from '@/store';

interface OnboardingStore extends OnboardingState {
  // Actions
  setCurrentStep: (step: OnboardingStep) => void;
  nextStep: () => void;
  previousStep: () => void;
  updateData: <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => void;
  saveProfile: (profile: Partial<UserProfile>) => Promise<void>;
  savePreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
  savePantryItems: (items: PantryItem[]) => Promise<void>;
  generateInitialMealPlan: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  reset: () => void;
}

const authService = AuthService.getInstance();

const STEP_ORDER: OnboardingStep[] = [
  OnboardingStep.WELCOME,
  OnboardingStep.PROFILE_SETUP,
  OnboardingStep.DIETARY_PREFERENCES,
  OnboardingStep.COOKING_PREFERENCES,
  OnboardingStep.NUTRITION_GOALS,
  OnboardingStep.PANTRY_SETUP,
  OnboardingStep.MEAL_PLAN_PREVIEW,
  OnboardingStep.COMPLETION
];

const initialState: OnboardingState = {
  currentStep: OnboardingStep.WELCOME,
  completedSteps: [],
  data: {
    profile: {},
    preferences: {},
    pantryItems: []
  },
  isLoading: false,
  error: undefined
};

export const useOnboardingStore = create<OnboardingStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Set Current Step
      setCurrentStep: (step: OnboardingStep) => {
        set({ currentStep: step });
      },

      // Next Step
      nextStep: () => {
        const { currentStep, completedSteps } = get();
        const currentIndex = STEP_ORDER.indexOf(currentStep);
        
        if (currentIndex < STEP_ORDER.length - 1) {
          const nextStep = STEP_ORDER[currentIndex + 1];
          
          // Mark current step as completed
          if (!completedSteps.includes(currentStep)) {
            set({ 
              completedSteps: [...completedSteps, currentStep],
              currentStep: nextStep 
            });
          } else {
            set({ currentStep: nextStep });
          }
        }
      },

      // Previous Step
      previousStep: () => {
        const { currentStep } = get();
        const currentIndex = STEP_ORDER.indexOf(currentStep);
        
        if (currentIndex > 0) {
          set({ currentStep: STEP_ORDER[currentIndex - 1] });
        }
      },

      // Update Data
      updateData: <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => {
        const { data } = get();
        set({
          data: {
            ...data,
            [key]: value
          }
        });
      },

      // Save Profile
      saveProfile: async (profile: Partial<UserProfile>) => {
        const user = useAppStore.getState().user.profile;
        if (!user) throw new Error('User not authenticated');

        set({ isLoading: true, error: undefined });

        try {
          // Update local state
          const { data } = get();
          set({
            data: {
              ...data,
              profile: { ...data.profile, ...profile }
            }
          });

          // Save to database
          await authService.updateUserProfile(user.id, profile);
          
          // Update auth store
          // User data updated through centralized store
        } catch (error: unknown) {
          set({ error: error.message || 'Failed to save profile' });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      // Save Preferences
      savePreferences: async (preferences: Partial<UserPreferences>) => {
        const user = useAppStore.getState().user.profile;
        if (!user) throw new Error('User not authenticated');

        set({ isLoading: true, error: undefined });

        try {
          // Update local state
          const { data } = get();
          set({
            data: {
              ...data,
              preferences: { ...data.preferences, ...preferences }
            }
          });

          // Save to database
          await authService.saveUserPreferences(user.id, preferences);
          
          // Update auth store
          // User data updated through centralized store
        } catch (error: unknown) {
          set({ error: error.message || 'Failed to save preferences' });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      // Save Pantry Items
      savePantryItems: async (items: PantryItem[]) => {
        const user = useAppStore.getState().user.profile;
        if (!user) throw new Error('User not authenticated');

        set({ isLoading: true, error: undefined });

        try {
          // Update local state
          const { data } = get();
          set({
            data: {
              ...data,
              pantryItems: items
            }
          });

          // Save to database
          const supabase = authService.getSupabaseClient();
          
          // Delete existing pantry items
          await supabase
            .from('pantry_items')
            .delete()
            .eq('user_id', user.id);

          // Insert new items
          if (items.length > 0) {
            const { error } = await supabase
              .from('pantry_items')
              .insert(
                items.map(item => ({
                  ...item,
                  user_id: user.id
                }))
              );

            if (error) throw error;
          }
        } catch (error: unknown) {
          set({ error: error.message || 'Failed to save pantry items' });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      // Generate Initial Meal Plan
      generateInitialMealPlan: async () => {
        const user = useAppStore.getState().user.profile;
        if (!user) throw new Error('User not authenticated');

        const { data } = get();
        if (!data.preferences || !data.pantryItems) {
          throw new Error('Missing preferences or pantry data');
        }

        set({ isLoading: true, error: undefined });

        try {
          // Call AI to generate meal plan
          const response = await fetch('/api/ai/generate-meal-plan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              preferences: data.preferences,
              pantryItems: data.pantryItems,
              generateFor: 'week'
            })
          });

          if (!response.ok) {
            throw new Error('Failed to generate meal plan');
          }

          const mealPlan: WeeklyMealPlan = await response.json();

          // Update local state
          set({
            data: {
              ...data,
              initialMealPlan: mealPlan
            }
          });
        } catch (error: unknown) {
          set({ error: error.message || 'Failed to generate meal plan' });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      // Complete Onboarding
      completeOnboarding: async () => {
        const user = useAppStore.getState().user.profile;
        if (!user) throw new Error('User not authenticated');

        set({ isLoading: true, error: undefined });

        try {
          // Mark onboarding as completed
          await authService.updateUserProfile(user.id, {
            onboarding_completed: true,
            onboarding_step: OnboardingStep.COMPLETION
          });

          // Update auth store
          // User data updated through centralized store

          // Mark all steps as completed
          set({
            completedSteps: STEP_ORDER,
            currentStep: OnboardingStep.COMPLETION
          });
        } catch (error: unknown) {
          set({ error: error.message || 'Failed to complete onboarding' });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      // Reset
      reset: () => {
        set(initialState);
      }
    }),
    {
      name: 'onboarding-store'
    }
  )
);

// Selectors
export const selectIsStepCompleted = (step: OnboardingStep) => 
  (state: OnboardingStore) => state.completedSteps.includes(step);

export const selectCanNavigateToStep = (step: OnboardingStep) => 
  (state: OnboardingStore) => {
    const stepIndex = STEP_ORDER.indexOf(step);
    if (stepIndex === 0) return true; // Can always go to welcome
    
    const previousStep = STEP_ORDER[stepIndex - 1];
    return state.completedSteps.includes(previousStep);
  };

export const selectOnboardingProgress = (state: OnboardingStore) => {
  const totalSteps = STEP_ORDER.length - 2; // Exclude welcome and completion
  const completedCount = state.completedSteps.filter(
    step => step !== OnboardingStep.WELCOME && step !== OnboardingStep.COMPLETION
  ).length;
  
  return Math.round((completedCount / totalSteps) * 100);
};