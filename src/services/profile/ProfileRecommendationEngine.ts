/**
 * @fileoverview AI-Powered Profile Recommendation Engine
 * @module services/profile/ProfileRecommendationEngine
 * 
 * Intelligent recommendation system that provides personalized suggestions
 * based on user behavior, profile completeness, and preferences.
 */

import { 
  UserProfile, 
  UserPreferences, 
  DietaryRestriction, 
  Allergy, 
  CookingSkillLevel,
  PersonalizationData,
  PlanningConstraints,
  calculateProfileCompletion,
  DIETARY_RESTRICTIONS,
  ALLERGIES,
  COOKING_SKILL_LEVELS
} from '@/types/profile';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface RecommendationScore {
  confidence: number; // 0-100
  relevance: number;  // 0-100
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface ProfileGap {
  field: keyof UserProfile | keyof UserPreferences;
  displayName: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  category: 'dietary' | 'lifestyle' | 'cooking' | 'budget' | 'household' | 'goals';
  score: RecommendationScore;
}

export interface SmartSuggestion {
  id: string;
  type: 'profile_completion' | 'dietary_preference' | 'budget_optimization' | 'cooking_skill' | 'meal_planning' | 'ingredient_preference';
  title: string;
  description: string;
  action: string;
  data?: any;
  score: RecommendationScore;
  category: string;
  tags: string[];
}

export interface NutritionalGoalSuggestion {
  goal: string;
  reasoning: string;
  targetValue?: number;
  unit?: string;
  basedOn: string[];
  confidence: number;
}

export interface BudgetOptimizationSuggestion {
  currentSpending?: number;
  suggestedBudget: number;
  savings: number;
  strategies: string[];
  reasoning: string;
}

export interface RecipeRecommendation {
  id: string;
  title: string;
  cuisine: string;
  difficulty: CookingSkillLevel;
  prepTime: number;
  matchScore: number;
  matchReasons: string[];
  adaptations?: string[];
}

export interface IngredientLearning {
  ingredient: string;
  preference: 'like' | 'dislike' | 'neutral';
  confidence: number;
  basedOn: string[];
  suggestedAction: string;
}

export interface UserBehaviorPattern {
  pattern: string;
  frequency: number;
  lastOccurrence: Date;
  trend: 'increasing' | 'decreasing' | 'stable';
  impact: 'positive' | 'negative' | 'neutral';
}

export interface RecommendationContext {
  profile: UserProfile | null;
  preferences: UserPreferences | null;
  behaviorHistory: UserBehaviorPattern[];
  recentActivity: string[];
  currentGoals: string[];
  seasonality?: 'spring' | 'summer' | 'fall' | 'winter';
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
}

// ============================================================================
// Profile Recommendation Engine
// ============================================================================

export class ProfileRecommendationEngine {
  private readonly WEIGHTS = {
    profile_completion: 0.3,
    behavior_analysis: 0.25,
    preference_matching: 0.2,
    goal_alignment: 0.15,
    temporal_factors: 0.1
  };

  private readonly CONFIDENCE_THRESHOLDS = {
    high: 80,
    medium: 60,
    low: 40
  };

  // ========================================================================
  // Core Recommendation Methods
  // ========================================================================

  /**
   * Generate comprehensive profile recommendations
   */
  async generateRecommendations(context: RecommendationContext): Promise<SmartSuggestion[]> {
    const recommendations: SmartSuggestion[] = [];

    try {
      // Profile completion recommendations
      const completionSuggestions = this.analyzeProfileCompleteness(context);
      recommendations.push(...completionSuggestions);

      // Dietary and preference recommendations
      const dietarySuggestions = this.analyzeDietaryNeeds(context);
      recommendations.push(...dietarySuggestions);

      // Budget optimization recommendations
      const budgetSuggestions = this.analyzeBudgetOptimization(context);
      recommendations.push(...budgetSuggestions);

      // Cooking skill progression
      const skillSuggestions = this.analyzeCookingSkillProgression(context);
      recommendations.push(...skillSuggestions);

      // Behavioral pattern recommendations
      const behaviorSuggestions = this.analyzeBehaviorPatterns(context);
      recommendations.push(...behaviorSuggestions);

      // Sort by priority and confidence
      return this.prioritizeRecommendations(recommendations);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return [];
    }
  }

  /**
   * Analyze profile completion gaps
   */
  private analyzeProfileCompleteness(context: RecommendationContext): SmartSuggestion[] {
    const { profile, preferences } = context;
    const suggestions: SmartSuggestion[] = [];

    if (!profile && !preferences) return suggestions;

    const completionPercentage = profile ? calculateProfileCompletion(profile) : 0;
    const gaps = this.identifyProfileGaps(profile, preferences);

    // High-impact gaps first
    const highImpactGaps = gaps.filter(gap => gap.impact === 'high');
    
    for (const gap of highImpactGaps) {
      suggestions.push({
        id: `completion_${gap.field}`,
        type: 'profile_completion',
        title: `Complete ${gap.displayName}`,
        description: gap.description,
        action: `Add ${gap.displayName.toLowerCase()} to improve recommendations by ${this.calculateImprovementPotential(gap)}%`,
        score: gap.score,
        category: gap.category,
        tags: ['profile', 'completion', gap.category]
      });
    }

    // Overall completion incentive
    if (completionPercentage < 80) {
      suggestions.push({
        id: 'profile_completion_overall',
        type: 'profile_completion',
        title: 'Complete Your Profile',
        description: `Your profile is ${completionPercentage}% complete. Complete it to get better recommendations.`,
        action: 'Complete remaining profile sections',
        score: {
          confidence: 90,
          relevance: 85,
          priority: completionPercentage < 50 ? 'high' : 'medium'
        },
        category: 'profile',
        tags: ['profile', 'completion', 'overall']
      });
    }

    return suggestions;
  }

  /**
   * Analyze dietary needs and suggest improvements
   */
  private analyzeDietaryNeeds(context: RecommendationContext): SmartSuggestion[] {
    const { profile, preferences } = context;
    const suggestions: SmartSuggestion[] = [];

    if (!profile && !preferences) return suggestions;

    const dietaryRestrictions = preferences?.dietaryRestrictions || profile?.dietaryRestrictions || [];
    const allergies = preferences?.allergies || profile?.allergies || [];
    const cookingSkill = preferences?.cookingSkillLevel || profile?.cookingSkillLevel || 'intermediate';

    // Suggest dietary restrictions based on patterns
    if (dietaryRestrictions.length === 0) {
      suggestions.push({
        id: 'dietary_restrictions_suggestion',
        type: 'dietary_preference',
        title: 'Set Dietary Preferences',
        description: 'Adding dietary preferences helps us suggest meals that match your lifestyle.',
        action: 'Explore dietary restriction options',
        score: {
          confidence: 75,
          relevance: 80,
          priority: 'medium'
        },
        category: 'dietary',
        tags: ['dietary', 'restrictions', 'lifestyle']
      });
    }

    // Suggest allergy documentation
    if (allergies.length === 0) {
      suggestions.push({
        id: 'allergy_documentation',
        type: 'dietary_preference',
        title: 'Document Food Allergies',
        description: 'Even if you have no allergies, confirming this helps us provide safer meal suggestions.',
        action: 'Review and confirm allergy information',
        score: {
          confidence: 70,
          relevance: 90,
          priority: 'high'
        },
        category: 'dietary',
        tags: ['allergies', 'safety', 'health']
      });
    }

    // Cooking skill progression suggestions
    if (cookingSkill === 'beginner') {
      suggestions.push({
        id: 'beginner_cooking_tips',
        type: 'cooking_skill',
        title: 'Start with Simple Recipes',
        description: 'We\'ll suggest beginner-friendly recipes to build your confidence in the kitchen.',
        action: 'Explore beginner recipe collection',
        score: {
          confidence: 85,
          relevance: 95,
          priority: 'high'
        },
        category: 'cooking',
        tags: ['beginner', 'skills', 'learning']
      });
    }

    return suggestions;
  }

  /**
   * Analyze budget optimization opportunities
   */
  private analyzeBudgetOptimization(context: RecommendationContext): SmartSuggestion[] {
    const { profile, preferences } = context;
    const suggestions: SmartSuggestion[] = [];

    const budget = preferences?.budget || profile?.budget;
    const householdSize = preferences?.householdSize || profile?.householdSize || 1;

    if (!budget || (budget.weekly === 0 && budget.monthly === 0)) {
      suggestions.push({
        id: 'budget_setup',
        type: 'budget_optimization',
        title: 'Set Your Food Budget',
        description: 'Setting a budget helps us suggest cost-effective meals and shopping strategies.',
        action: 'Configure your weekly/monthly food budget',
        score: {
          confidence: 80,
          relevance: 85,
          priority: 'medium'
        },
        category: 'budget',
        tags: ['budget', 'planning', 'savings']
      });
    } else {
      // Budget optimization based on household size
      const weeklyBudget = budget.weekly || (budget.monthly / 4);
      const perPersonBudget = weeklyBudget / householdSize;
      
      if (perPersonBudget > 100) { // High budget
        suggestions.push({
          id: 'budget_optimization_high',
          type: 'budget_optimization',
          title: 'Optimize Premium Budget',
          description: `With $${perPersonBudget.toFixed(0)}/person/week, explore premium ingredients and meal prep strategies.`,
          action: 'Explore premium meal planning strategies',
          data: { budgetLevel: 'premium', perPersonBudget },
          score: {
            confidence: 75,
            relevance: 70,
            priority: 'low'
          },
          category: 'budget',
          tags: ['premium', 'optimization', 'quality']
        });
      } else if (perPersonBudget < 30) { // Low budget
        suggestions.push({
          id: 'budget_optimization_low',
          type: 'budget_optimization',
          title: 'Maximize Budget Value',
          description: `With $${perPersonBudget.toFixed(0)}/person/week, we'll help you find nutritious, affordable meals.`,
          action: 'Explore budget-friendly meal strategies',
          data: { budgetLevel: 'budget', perPersonBudget },
          score: {
            confidence: 90,
            relevance: 95,
            priority: 'high'
          },
          category: 'budget',
          tags: ['budget', 'savings', 'value']
        });
      }
    }

    return suggestions;
  }

  /**
   * Analyze cooking skill progression opportunities
   */
  private analyzeCookingSkillProgression(context: RecommendationContext): SmartSuggestion[] {
    const { profile, preferences, behaviorHistory } = context;
    const suggestions: SmartSuggestion[] = [];

    const cookingSkill = preferences?.cookingSkillLevel || profile?.cookingSkillLevel || 'intermediate';
    const cookingPrefs = preferences?.cookingPreferences;

    // Skill progression suggestions
    const skillProgression = {
      beginner: 'intermediate',
      intermediate: 'advanced',
      advanced: 'expert'
    };

    if (cookingSkill !== 'expert') {
      const nextLevel = skillProgression[cookingSkill as keyof typeof skillProgression];
      
      suggestions.push({
        id: `skill_progression_${nextLevel}`,
        type: 'cooking_skill',
        title: `Ready for ${nextLevel} recipes?`,
        description: `Based on your cooking activity, you might be ready to try ${nextLevel}-level recipes.`,
        action: `Explore ${nextLevel} recipe challenges`,
        data: { currentSkill: cookingSkill, nextSkill: nextLevel },
        score: {
          confidence: this.calculateSkillProgressionConfidence(behaviorHistory),
          relevance: 80,
          priority: 'medium'
        },
        category: 'cooking',
        tags: ['skills', 'progression', nextLevel]
      });
    }

    // Time-based suggestions
    if (cookingPrefs?.timeAvailable) {
      const avgTime = (cookingPrefs.timeAvailable.weekday + cookingPrefs.timeAvailable.weekend) / 2;
      
      if (avgTime < 20) {
        suggestions.push({
          id: 'quick_cooking_focus',
          type: 'cooking_skill',
          title: 'Master Quick Cooking',
          description: `With ${avgTime} minutes average cooking time, focus on efficient techniques.`,
          action: 'Explore 15-minute meal mastery',
          data: { timeConstraint: avgTime },
          score: {
            confidence: 85,
            relevance: 90,
            priority: 'high'
          },
          category: 'cooking',
          tags: ['quick', 'efficiency', 'time-management']
        });
      } else if (avgTime > 90) {
        suggestions.push({
          id: 'elaborate_cooking_opportunity',
          type: 'cooking_skill',
          title: 'Try Elaborate Recipes',
          description: `With ${avgTime} minutes available, you can explore complex, rewarding recipes.`,
          action: 'Discover slow-cooking and elaborate meal techniques',
          data: { timeAvailable: avgTime },
          score: {
            confidence: 75,
            relevance: 70,
            priority: 'medium'
          },
          category: 'cooking',
          tags: ['elaborate', 'slow-cooking', 'mastery']
        });
      }
    }

    return suggestions;
  }

  /**
   * Analyze behavior patterns for recommendations
   */
  private analyzeBehaviorPatterns(context: RecommendationContext): SmartSuggestion[] {
    const { behaviorHistory, recentActivity } = context;
    const suggestions: SmartSuggestion[] = [];

    // Analyze recent activity patterns
    const activityPatterns = this.identifyActivityPatterns(recentActivity);
    
    for (const pattern of activityPatterns) {
      if (pattern.trend === 'increasing' && pattern.impact === 'positive') {
        suggestions.push({
          id: `pattern_${pattern.pattern.replace(/\s+/g, '_')}`,
          type: 'meal_planning',
          title: `Continue ${pattern.pattern}`,
          description: `You've been ${pattern.pattern} more frequently. This is having a positive impact!`,
          action: `Get more suggestions for ${pattern.pattern.toLowerCase()}`,
          score: {
            confidence: Math.min(90, pattern.frequency * 10 + 50),
            relevance: 85,
            priority: 'medium'
          },
          category: 'behavior',
          tags: ['pattern', 'positive', pattern.pattern.toLowerCase()]
        });
      }
    }

    return suggestions;
  }

  // ========================================================================
  // Questionnaire Generation
  // ========================================================================

  /**
   * Generate adaptive questionnaire based on profile gaps
   */
  generateAdaptiveQuestionnaire(context: RecommendationContext): QuestionnaireQuestion[] {
    const gaps = this.identifyProfileGaps(context.profile, context.preferences);
    const questions: QuestionnaireQuestion[] = [];

    // Prioritize questions based on impact and missing data
    const prioritizedGaps = gaps
      .filter(gap => gap.impact === 'high' || gap.impact === 'medium')
      .sort((a, b) => this.calculateQuestionPriority(b) - this.calculateQuestionPriority(a))
      .slice(0, 8); // Limit to 8 questions to avoid fatigue

    for (const gap of prioritizedGaps) {
      const question = this.generateQuestionForGap(gap, context);
      if (question) {
        questions.push(question);
      }
    }

    return questions;
  }

  // ========================================================================
  // Nutritional Goal Suggestions
  // ========================================================================

  /**
   * Suggest nutritional goals based on profile data
   */
  suggestNutritionalGoals(context: RecommendationContext): NutritionalGoalSuggestion[] {
    const { profile, preferences } = context;
    const suggestions: NutritionalGoalSuggestion[] = [];

    const age = profile?.dateOfBirth 
      ? new Date().getFullYear() - new Date(profile.dateOfBirth).getFullYear()
      : null;
    const gender = profile?.gender;
    const cookingSkill = preferences?.cookingSkillLevel || profile?.cookingSkillLevel;
    const dietaryRestrictions = preferences?.dietaryRestrictions || profile?.dietaryRestrictions || [];

    // Base caloric needs
    if (age && gender) {
      const basalMetabolicRate = this.calculateBMR(age, gender);
      suggestions.push({
        goal: 'Daily Caloric Intake',
        reasoning: `Based on your age and gender, a balanced daily caloric intake would support your health goals.`,
        targetValue: Math.round(basalMetabolicRate * 1.6), // Moderate activity level
        unit: 'calories',
        basedOn: ['age', 'gender', 'activity_level'],
        confidence: 75
      });
    }

    // Protein recommendations
    if (dietaryRestrictions.includes('vegetarian') || dietaryRestrictions.includes('vegan')) {
      suggestions.push({
        goal: 'Plant-Based Protein',
        reasoning: 'As a vegetarian/vegan, ensuring adequate protein intake is important for muscle health.',
        targetValue: 1.2, // grams per kg body weight
        unit: 'g/kg body weight',
        basedOn: ['dietary_restrictions'],
        confidence: 85
      });
    }

    // Fiber recommendations
    suggestions.push({
      goal: 'Daily Fiber Intake',
      reasoning: 'Adequate fiber supports digestive health and helps maintain stable blood sugar levels.',
      targetValue: 25,
      unit: 'grams',
      basedOn: ['general_health'],
      confidence: 80
    });

    return suggestions;
  }

  // ========================================================================
  // Recipe Recommendations
  // ========================================================================

  /**
   * Generate personalized recipe recommendations
   */
  async generateRecipeRecommendations(
    context: RecommendationContext, 
    limit: number = 10
  ): Promise<RecipeRecommendation[]> {
    const { profile, preferences } = context;
    
    // This would integrate with your recipe database
    // For now, return mock recommendations based on profile data
    const mockRecipes: RecipeRecommendation[] = [];
    
    const cookingSkill = preferences?.cookingSkillLevel || profile?.cookingSkillLevel || 'intermediate';
    const dietaryRestrictions = preferences?.dietaryRestrictions || profile?.dietaryRestrictions || [];
    const cuisinePrefs = preferences?.cuisinePreferences || profile?.preferredCuisines || [];
    
    // Generate recommendations based on preferences
    // This is where you'd integrate with your actual recipe database
    
    return mockRecipes.slice(0, limit);
  }

  // ========================================================================
  // Ingredient Learning
  // ========================================================================

  /**
   * Learn ingredient preferences from user behavior
   */
  learnIngredientPreferences(
    context: RecommendationContext,
    interactions: Array<{ ingredient: string; action: 'liked' | 'disliked' | 'cooked' | 'skipped' }>
  ): IngredientLearning[] {
    const learnings: IngredientLearning[] = [];
    
    // Group interactions by ingredient
    const ingredientInteractions = interactions.reduce((acc, interaction) => {
      if (!acc[interaction.ingredient]) {
        acc[interaction.ingredient] = [];
      }
      acc[interaction.ingredient].push(interaction.action);
      return acc;
    }, {} as Record<string, string[]>);

    // Analyze each ingredient
    for (const [ingredient, actions] of Object.entries(ingredientInteractions)) {
      const positiveActions = actions.filter(a => a === 'liked' || a === 'cooked').length;
      const negativeActions = actions.filter(a => a === 'disliked' || a === 'skipped').length;
      const totalActions = actions.length;

      let preference: 'like' | 'dislike' | 'neutral' = 'neutral';
      let confidence = 0;

      if (positiveActions > negativeActions) {
        preference = 'like';
        confidence = Math.min(90, (positiveActions / totalActions) * 100);
      } else if (negativeActions > positiveActions) {
        preference = 'dislike';
        confidence = Math.min(90, (negativeActions / totalActions) * 100);
      } else {
        confidence = 30; // Low confidence for neutral
      }

      learnings.push({
        ingredient,
        preference,
        confidence,
        basedOn: actions,
        suggestedAction: this.generateIngredientAction(ingredient, preference, confidence)
      });
    }

    return learnings;
  }

  // ========================================================================
  // Helper Methods
  // ========================================================================

  private identifyProfileGaps(
    profile: UserProfile | null,
    preferences: UserPreferences | null
  ): ProfileGap[] {
    const gaps: ProfileGap[] = [];

    const essentialFields = [
      { 
        field: 'dietaryRestrictions' as const, 
        displayName: 'Dietary Restrictions',
        description: 'Help us understand your dietary needs and restrictions',
        category: 'dietary' as const,
        impact: 'high' as const
      },
      { 
        field: 'allergies' as const, 
        displayName: 'Food Allergies',
        description: 'Ensure safe meal recommendations by documenting allergies',
        category: 'dietary' as const,
        impact: 'high' as const
      },
      { 
        field: 'budget' as const, 
        displayName: 'Food Budget',
        description: 'Set your budget to get cost-effective meal suggestions',
        category: 'budget' as const,
        impact: 'medium' as const
      },
      { 
        field: 'cookingSkillLevel' as const, 
        displayName: 'Cooking Skill Level',
        description: 'Match recipes to your cooking experience level',
        category: 'cooking' as const,
        impact: 'medium' as const
      },
      { 
        field: 'householdSize' as const, 
        displayName: 'Household Size',
        description: 'Right-size meal portions and shopping lists',
        category: 'household' as const,
        impact: 'medium' as const
      }
    ];

    for (const fieldInfo of essentialFields) {
      const profileValue = profile?.[fieldInfo.field as keyof UserProfile];
      const prefValue = preferences?.[fieldInfo.field as keyof UserPreferences];
      
      let isEmpty = false;
      if (Array.isArray(profileValue) || Array.isArray(prefValue)) {
        isEmpty = (!profileValue || profileValue.length === 0) && 
                 (!prefValue || (prefValue as any[]).length === 0);
      } else {
        isEmpty = !profileValue && !prefValue;
      }

      if (isEmpty) {
        gaps.push({
          ...fieldInfo,
          score: {
            confidence: 85,
            relevance: fieldInfo.impact === 'high' ? 95 : fieldInfo.impact === 'medium' ? 80 : 65,
            priority: fieldInfo.impact === 'high' ? 'high' : 'medium'
          }
        });
      }
    }

    return gaps;
  }

  private calculateImprovementPotential(gap: ProfileGap): number {
    const baseImprovement = {
      'high': 25,
      'medium': 15,
      'low': 8
    };
    
    return baseImprovement[gap.impact];
  }

  private calculateSkillProgressionConfidence(behaviorHistory: UserBehaviorPattern[]): number {
    const cookingPatterns = behaviorHistory.filter(p => 
      p.pattern.includes('cooking') || p.pattern.includes('recipe')
    );
    
    if (cookingPatterns.length === 0) return 50;
    
    const avgFrequency = cookingPatterns.reduce((sum, p) => sum + p.frequency, 0) / cookingPatterns.length;
    return Math.min(90, avgFrequency * 10 + 40);
  }

  private identifyActivityPatterns(recentActivity: string[]): UserBehaviorPattern[] {
    // Mock implementation - in reality, you'd analyze actual user activity
    const patterns: UserBehaviorPattern[] = [];
    
    const activityCounts = recentActivity.reduce((acc, activity) => {
      acc[activity] = (acc[activity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    for (const [activity, count] of Object.entries(activityCounts)) {
      if (count >= 3) { // Significant pattern
        patterns.push({
          pattern: activity,
          frequency: count,
          lastOccurrence: new Date(), // Mock - would be actual date
          trend: count > 5 ? 'increasing' : 'stable',
          impact: this.determineActivityImpact(activity)
        });
      }
    }

    return patterns;
  }

  private determineActivityImpact(activity: string): 'positive' | 'negative' | 'neutral' {
    const positiveActivities = ['meal planning', 'recipe saving', 'cooking', 'nutritional tracking'];
    const negativeActivities = ['skipping meals', 'ordering takeout', 'food waste'];
    
    if (positiveActivities.some(p => activity.toLowerCase().includes(p))) return 'positive';
    if (negativeActivities.some(n => activity.toLowerCase().includes(n))) return 'negative';
    return 'neutral';
  }

  private calculateQuestionPriority(gap: ProfileGap): number {
    const impactWeight = { high: 3, medium: 2, low: 1 };
    return gap.score.confidence * 0.4 + gap.score.relevance * 0.4 + impactWeight[gap.impact] * 20;
  }

  private generateQuestionForGap(gap: ProfileGap, context: RecommendationContext): QuestionnaireQuestion | null {
    const questionMap: Record<string, QuestionnaireQuestion> = {
      'dietaryRestrictions': {
        id: 'dietary_restrictions',
        type: 'multi_select',
        category: 'dietary',
        title: 'Do you follow any dietary restrictions?',
        description: 'Select all that apply to help us suggest appropriate meals',
        options: DIETARY_RESTRICTIONS.map(r => ({
          value: r,
          label: this.formatDietaryRestriction(r),
          description: this.getDietaryRestrictionDescription(r)
        })),
        required: false,
        weight: 0.3
      },
      'allergies': {
        id: 'allergies',
        type: 'multi_select',
        category: 'dietary',
        title: 'Do you have any food allergies?',
        description: 'This helps us ensure your safety when suggesting meals',
        options: ALLERGIES.map(a => ({
          value: a,
          label: this.formatAllergy(a),
          description: `Avoid ${a} in all recommendations`
        })),
        required: false,
        weight: 0.4
      },
      'cookingSkillLevel': {
        id: 'cooking_skill',
        type: 'single_select',
        category: 'cooking',
        title: 'What\'s your cooking skill level?',
        description: 'This helps us suggest recipes that match your experience',
        options: COOKING_SKILL_LEVELS.map(level => ({
          value: level,
          label: this.formatSkillLevel(level),
          description: this.getSkillLevelDescription(level)
        })),
        required: true,
        weight: 0.25
      },
      'budget': {
        id: 'budget',
        type: 'range',
        category: 'budget',
        title: 'What\'s your weekly food budget?',
        description: 'Help us suggest cost-effective meal options',
        min: 20,
        max: 500,
        defaultValue: 100,
        unit: 'USD',
        required: false,
        weight: 0.2
      },
      'householdSize': {
        id: 'household_size',
        type: 'number',
        category: 'household',
        title: 'How many people are in your household?',
        description: 'This helps us right-size portions and shopping lists',
        min: 1,
        max: 12,
        defaultValue: 1,
        required: true,
        weight: 0.15
      }
    };

    return questionMap[gap.field] || null;
  }

  private calculateBMR(age: number, gender: string): number {
    // Simplified BMR calculation (would need weight/height for accuracy)
    const baseBMR = gender === 'male' ? 1800 : 1500;
    const ageAdjustment = Math.max(0, (30 - age) * 10);
    return baseBMR + ageAdjustment;
  }

  private generateIngredientAction(ingredient: string, preference: string, confidence: number): string {
    if (preference === 'like' && confidence > 70) {
      return `Feature ${ingredient} more prominently in recipe suggestions`;
    } else if (preference === 'dislike' && confidence > 70) {
      return `Avoid ${ingredient} in future recommendations`;
    } else {
      return `Continue monitoring ${ingredient} preferences`;
    }
  }

  private prioritizeRecommendations(recommendations: SmartSuggestion[]): SmartSuggestion[] {
    return recommendations.sort((a, b) => {
      // Priority first
      const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityWeight[b.score.priority] - priorityWeight[a.score.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then confidence
      const confidenceDiff = b.score.confidence - a.score.confidence;
      if (confidenceDiff !== 0) return confidenceDiff;
      
      // Finally relevance
      return b.score.relevance - a.score.relevance;
    });
  }

  // Format helper methods
  private formatDietaryRestriction(restriction: string): string {
    return restriction.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  private formatAllergy(allergy: string): string {
    return allergy.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  private formatSkillLevel(level: string): string {
    return level.charAt(0).toUpperCase() + level.slice(1);
  }

  private getDietaryRestrictionDescription(restriction: string): string {
    const descriptions: Record<string, string> = {
      vegetarian: 'No meat, but dairy and eggs are okay',
      vegan: 'No animal products whatsoever',
      gluten_free: 'Avoid wheat, barley, rye, and related grains',
      dairy_free: 'No milk or dairy products',
      keto: 'Very low carb, high fat diet',
      paleo: 'Whole foods, no processed items',
      // Add more as needed
    };
    return descriptions[restriction] || 'Dietary preference';
  }

  private getSkillLevelDescription(level: string): string {
    const descriptions: Record<string, string> = {
      beginner: 'New to cooking, prefer simple recipes',
      intermediate: 'Comfortable with basic techniques',
      advanced: 'Experienced with complex recipes',
      expert: 'Master chef level skills'
    };
    return descriptions[level] || 'Cooking experience level';
  }
}

// ============================================================================
// Questionnaire Types
// ============================================================================

export interface QuestionnaireOption {
  value: string;
  label: string;
  description?: string;
}

export interface QuestionnaireQuestion {
  id: string;
  type: 'single_select' | 'multi_select' | 'range' | 'number' | 'text' | 'yes_no';
  category: string;
  title: string;
  description: string;
  options?: QuestionnaireOption[];
  min?: number;
  max?: number;
  defaultValue?: any;
  unit?: string;
  required: boolean;
  weight: number; // 0-1, importance of this question
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const profileRecommendationEngine = new ProfileRecommendationEngine();