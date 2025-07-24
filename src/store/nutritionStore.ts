/**
 * Nutrition Store Export
 * Basic nutrition store for backward compatibility
 */

import { create } from 'zustand';

interface NutritionState {
  nutritionData: any[];
  goals: any;
  tracking: any;
}

interface NutritionActions {
  updateNutritionData: (data: any[]) => void;
  setGoals: (goals: any) => void;
  updateTracking: (tracking: any) => void;
}

type NutritionStore = NutritionState & NutritionActions;

export const useNutritionStore = create<NutritionStore>((set) => ({
  nutritionData: [],
  goals: {},
  tracking: {},
  
  updateNutritionData: (data) => set({ nutritionData: data }),
  setGoals: (goals) => set({ goals }),
  updateTracking: (tracking) => set({ tracking }),
}));