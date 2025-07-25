/**
 * @fileoverview Hook for Profile Recommendations
 * @module hooks/useProfileRecommendations
 * 
 * React hook that provides access to the AI-powered profile recommendation system
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  profileRecommendationEngine,
  SmartSuggestion,
  RecommendationContext,
  UserBehaviorPattern,
  QuestionnaireQuestion,
  NutritionalGoalSuggestion,
  BudgetOptimizationSuggestion,
  RecipeRecommendation,
  IngredientLearning
} from '@/services/profile/ProfileRecommendationEngine';
import { useProfileData, useProfileComputed } from '@/contexts/ProfileContext';
import { logger } from '@/services/logger';

// ============================================================================
// Types
// ============================================================================

interface UseProfileRecommendationsOptions {
  includeRecipes?: boolean;
  includeBudgetOptimization?: boolean;
  includeNutritionalGoals?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface ProfileRecommendationsState {
  suggestions: SmartSuggestion[];
  questionnaire: QuestionnaireQuestion[];
  nutritionalGoals: NutritionalGoalSuggestion[];
  budgetOptimization: BudgetOptimizationSuggestion | null;
  recipeRecommendations: RecipeRecommendation[];
  ingredientLearnings: IngredientLearning[];
  isLoading: boolean;
  error: Error | null;
  lastUpdated: Date | null;
}

interface ProfileRecommendationsActions {
  refreshRecommendations: () => Promise<void>;
  generateQuestionnaire: () => Promise<void>;
  updateBehaviorPattern: (pattern: UserBehaviorPattern) => void;
  trackIngredientInteraction: (ingredient: string, action: 'liked' | 'disliked' | 'cooked' | 'skipped') => void;
  applySuggestion: (suggestionId: string) => Promise<void>;
  dismissSuggestion: (suggestionId: string) => void;
  getRecommendationsByCategory: (category: string) => SmartSuggestion[];
  getHighPriorityRecommendations: () => SmartSuggestion[];
}

// ============================================================================
// Main Hook
// ============================================================================

export function useProfileRecommendations(
  options: UseProfileRecommendationsOptions = {}
): ProfileRecommendationsState & ProfileRecommendationsActions {
  const {
    includeRecipes = false,
    includeBudgetOptimization = true,
    includeNutritionalGoals = true,
    autoRefresh = false,
    refreshInterval = 300000 // 5 minutes
  } = options;

  // Profile data
  const { profile, preferences, isLoading: profileLoading } = useProfileData();
  const profileComputed = useProfileComputed();

  // State
  const [state, setState] = useState<ProfileRecommendationsState>({
    suggestions: [],
    questionnaire: [],
    nutritionalGoals: [],
    budgetOptimization: null,
    recipeRecommendations: [],
    ingredientLearnings: [],
    isLoading: false,
    error: null,
    lastUpdated: null
  });

  // Behavior tracking
  const [behaviorHistory, setBehaviorHistory] = useState<UserBehaviorPattern[]>([]);
  const [recentActivity, setRecentActivity] = useState<string[]>([]);
  const [ingredientInteractions, setIngredientInteractions] = useState<Array<{
    ingredient: string;
    action: 'liked' | 'disliked' | 'cooked' | 'skipped';
  }>>([]);

  // Dismissed suggestions tracking
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());

  // ========================================================================
  // Memoized Recommendation Context
  // ========================================================================

  const recommendationContext = useMemo<RecommendationContext>(() => {
    const currentSeason = getCurrentSeason();
    const currentTimeOfDay = getCurrentTimeOfDay();
    
    return {
      profile,
      preferences,
      behaviorHistory,
      recentActivity,
      currentGoals: preferences?.nutritionGoals || [],
      seasonality: currentSeason,
      timeOfDay: currentTimeOfDay
    };
  }, [profile, preferences, behaviorHistory, recentActivity]);

  // ========================================================================
  // Core Recommendation Generation
  // ========================================================================

  const generateRecommendations = useCallback(async () => {
    if (profileLoading || (!profile && !preferences)) {
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Generate core suggestions
      const suggestions = await profileRecommendationEngine.generateRecommendations(recommendationContext);
      
      // Filter out dismissed suggestions
      const activeSuggestions = suggestions.filter(s => !dismissedSuggestions.has(s.id));

      // Generate questionnaire
      const questionnaire = profileRecommendationEngine.generateAdaptiveQuestionnaire(recommendationContext);

      // Generate nutritional goals if requested
      let nutritionalGoals: NutritionalGoalSuggestion[] = [];
      if (includeNutritionalGoals) {
        nutritionalGoals = profileRecommendationEngine.suggestNutritionalGoals(recommendationContext);
      }

      // Generate recipe recommendations if requested
      let recipeRecommendations: RecipeRecommendation[] = [];
      if (includeRecipes) {
        recipeRecommendations = await profileRecommendationEngine.generateRecipeRecommendations(
          recommendationContext,
          10
        );
      }

      // Learn from ingredient interactions
      const ingredientLearnings = ingredientInteractions.length > 0 
        ? profileRecommendationEngine.learnIngredientPreferences(recommendationContext, ingredientInteractions)
        : [];

      setState(prev => ({
        ...prev,
        suggestions: activeSuggestions,
        questionnaire,
        nutritionalGoals,
        recipeRecommendations,
        ingredientLearnings,
        isLoading: false,
        lastUpdated: new Date()
      }));

      logger.info('Profile recommendations generated', 'useProfileRecommendations', {
        suggestionsCount: activeSuggestions.length,
        questionnaireLength: questionnaire.length,
        nutritionalGoalsCount: nutritionalGoals.length
      });

    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error as Error
      }));

      logger.error('Error generating profile recommendations', 'useProfileRecommendations', error);
    }
  }, [
    profileLoading,
    profile,
    preferences,
    recommendationContext,
    dismissedSuggestions,
    includeNutritionalGoals,
    includeRecipes,
    ingredientInteractions
  ]);

  // ========================================================================
  // Auto-refresh Effect
  // ========================================================================

  useEffect(() => {
    if (!profileLoading && (profile || preferences)) {
      generateRecommendations();
    }
  }, [generateRecommendations, profileLoading, profile, preferences]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      generateRecommendations();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, generateRecommendations]);

  // ========================================================================
  // Action Handlers
  // ========================================================================

  const refreshRecommendations = useCallback(async () => {
    await generateRecommendations();
  }, [generateRecommendations]);

  const generateQuestionnaire = useCallback(async () => {
    if (!recommendationContext.profile && !recommendationContext.preferences) return;

    try {
      const questionnaire = profileRecommendationEngine.generateAdaptiveQuestionnaire(recommendationContext);
      setState(prev => ({ ...prev, questionnaire }));
    } catch (error) {
      logger.error('Error generating questionnaire', 'useProfileRecommendations', error);
    }
  }, [recommendationContext]);

  const updateBehaviorPattern = useCallback((pattern: UserBehaviorPattern) => {
    setBehaviorHistory(prev => {
      const existingIndex = prev.findIndex(p => p.pattern === pattern.pattern);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = pattern;
        return updated;
      } else {
        return [...prev, pattern];
      }
    });

    // Track recent activity
    setRecentActivity(prev => [pattern.pattern, ...prev.slice(0, 49)]); // Keep last 50
  }, []);

  const trackIngredientInteraction = useCallback((
    ingredient: string, 
    action: 'liked' | 'disliked' | 'cooked' | 'skipped'
  ) => {
    setIngredientInteractions(prev => [...prev, { ingredient, action }]);
    
    // Also update recent activity
    setRecentActivity(prev => [`${action} ${ingredient}`, ...prev.slice(0, 49)]);
  }, []);

  const applySuggestion = useCallback(async (suggestionId: string) => {
    const suggestion = state.suggestions.find(s => s.id === suggestionId);
    if (!suggestion) return;

    try {
      // Here you would implement the actual application logic
      // For example, navigating to a specific page, opening a modal, etc.
      
      logger.info('Applied suggestion', 'useProfileRecommendations', { suggestionId, suggestion });

      // Track the application as a behavior pattern
      updateBehaviorPattern({
        pattern: `applied_suggestion_${suggestion.type}`,
        frequency: 1,
        lastOccurrence: new Date(),
        trend: 'increasing',
        impact: 'positive'
      });

      // Remove the applied suggestion
      setState(prev => ({
        ...prev,
        suggestions: prev.suggestions.filter(s => s.id !== suggestionId)
      }));

    } catch (error) {
      logger.error('Error applying suggestion', 'useProfileRecommendations', error);
    }
  }, [state.suggestions, updateBehaviorPattern]);

  const dismissSuggestion = useCallback((suggestionId: string) => {
    setDismissedSuggestions(prev => new Set([...prev, suggestionId]));
    setState(prev => ({
      ...prev,
      suggestions: prev.suggestions.filter(s => s.id !== suggestionId)
    }));

    logger.info('Dismissed suggestion', 'useProfileRecommendations', { suggestionId });
  }, []);

  const getRecommendationsByCategory = useCallback((category: string) => {
    return state.suggestions.filter(s => s.category === category);
  }, [state.suggestions]);

  const getHighPriorityRecommendations = useCallback(() => {
    return state.suggestions.filter(s => s.score.priority === 'high' || s.score.priority === 'critical');
  }, [state.suggestions]);

  // ========================================================================
  // Return Hook Interface
  // ========================================================================

  return {
    // State
    ...state,
    isLoading: state.isLoading || profileLoading,

    // Actions
    refreshRecommendations,
    generateQuestionnaire,
    updateBehaviorPattern,
    trackIngredientInteraction,
    applySuggestion,
    dismissSuggestion,
    getRecommendationsByCategory,
    getHighPriorityRecommendations
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function getCurrentSeason(): 'spring' | 'summer' | 'fall' | 'winter' {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'fall';
  return 'winter';
}

function getCurrentTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}

// ============================================================================
// Additional Specialized Hooks
// ============================================================================

/**
 * Hook for recipe recommendations specifically
 */
export function useRecipeRecommendations(limit: number = 10) {
  const { profile, preferences } = useProfileData();
  const [recipes, setRecipes] = useState<RecipeRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const generateRecipes = useCallback(async () => {
    if (!profile && !preferences) return;

    setIsLoading(true);
    try {
      const context: RecommendationContext = {
        profile,
        preferences,
        behaviorHistory: [],
        recentActivity: [],
        currentGoals: preferences?.nutritionGoals || []
      };

      const recommendations = await profileRecommendationEngine.generateRecipeRecommendations(context, limit);
      setRecipes(recommendations);
    } catch (error) {
      logger.error('Error generating recipe recommendations', 'useRecipeRecommendations', error);
    } finally {
      setIsLoading(false);
    }
  }, [profile, preferences, limit]);

  useEffect(() => {
    generateRecipes();
  }, [generateRecipes]);

  return {
    recipes,
    isLoading,
    refreshRecipes: generateRecipes
  };
}

/**
 * Hook for nutritional goal suggestions
 */
export function useNutritionalGoalSuggestions() {
  const { profile, preferences } = useProfileData();
  const [goals, setGoals] = useState<NutritionalGoalSuggestion[]>([]);

  const generateGoals = useCallback(() => {
    if (!profile && !preferences) return;

    const context: RecommendationContext = {
      profile,
      preferences,
      behaviorHistory: [],
      recentActivity: [],
      currentGoals: preferences?.nutritionGoals || []
    };

    const suggestions = profileRecommendationEngine.suggestNutritionalGoals(context);
    setGoals(suggestions);
  }, [profile, preferences]);

  useEffect(() => {
    generateGoals();
  }, [generateGoals]);

  return {
    goals,
    refreshGoals: generateGoals
  };
}

/**
 * Hook for profile completion tracking
 */
export function useProfileCompletion() {
  const { profile } = useProfileData();
  
  const completionPercentage = useMemo(() => {
    if (!profile) return 0;
    return Math.round(
      Object.values(profile).filter(value => 
        value !== null && 
        value !== undefined && 
        value !== '' && 
        !(Array.isArray(value) && value.length === 0)
      ).length / Object.keys(profile).length * 100
    );
  }, [profile]);

  const isComplete = completionPercentage >= 80;
  const needsAttention = completionPercentage < 50;

  return {
    completionPercentage,
    isComplete,
    needsAttention
  };
}