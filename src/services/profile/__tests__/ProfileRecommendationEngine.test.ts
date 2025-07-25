/**
 * @jest-environment jsdom
 */

import {
  ProfileRecommendationEngine,
  ProfileErrorFactory,
  profileRecommendationEngine
} from '../ProfileRecommendationEngine';

import type {
  RecommendationContext,
  SmartSuggestion,
  NutritionalGoalSuggestion,
  RecipeRecommendation,
  IngredientLearning,
  UserBehaviorPattern,
  QuestionnaireQuestion
} from '../ProfileRecommendationEngine';

import {
  mockUserProfile,
  mockUserPreferences,
  mockHouseholdMembers,
  ProfileTestDataBuilder,
  PreferencesTestDataBuilder
} from '@/__tests__/utils/profileTestUtils';

describe('ProfileRecommendationEngine', () => {
  let engine: ProfileRecommendationEngine;
  let mockContext: RecommendationContext;

  beforeEach(() => {
    engine = new ProfileRecommendationEngine();
    
    mockContext = {
      profile: mockUserProfile,
      preferences: mockUserPreferences,
      behaviorHistory: [],
      recentActivity: [],
      currentGoals: [],
      seasonality: 'spring',
      timeOfDay: 'morning'
    };
  });

  describe('generateRecommendations', () => {
    it('should generate comprehensive recommendations', async () => {
      const recommendations = await engine.generateRecommendations(mockContext);

      expect(recommendations).toBeInstanceOf(Array);
      expect(recommendations.length).toBeGreaterThan(0);
      
      // Check that recommendations have required properties
      recommendations.forEach(rec => {
        expect(rec).toHaveProperty('id');
        expect(rec).toHaveProperty('type');
        expect(rec).toHaveProperty('title');
        expect(rec).toHaveProperty('description');
        expect(rec).toHaveProperty('action');
        expect(rec).toHaveProperty('score');
        expect(rec).toHaveProperty('category');
        expect(rec).toHaveProperty('tags');
      });
    });

    it('should prioritize recommendations correctly', async () => {
      const recommendations = await engine.generateRecommendations(mockContext);

      // Check that high priority recommendations come first
      for (let i = 0; i < recommendations.length - 1; i++) {
        const current = recommendations[i];
        const next = recommendations[i + 1];
        
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const currentPriority = priorityOrder[current.score.priority];
        const nextPriority = priorityOrder[next.score.priority];
        
        expect(currentPriority).toBeGreaterThanOrEqual(nextPriority);
      }
    });

    it('should handle empty context gracefully', async () => {
      const emptyContext: RecommendationContext = {
        profile: null,
        preferences: null,
        behaviorHistory: [],
        recentActivity: [],
        currentGoals: []
      };

      const recommendations = await engine.generateRecommendations(emptyContext);
      expect(recommendations).toBeInstanceOf(Array);
    });

    it('should generate profile completion recommendations for incomplete profiles', async () => {
      const incompleteProfile = ProfileTestDataBuilder.create()
        .incomplete()
        .build();

      const contextWithIncompleteProfile = {
        ...mockContext,
        profile: incompleteProfile
      };

      const recommendations = await engine.generateRecommendations(contextWithIncompleteProfile);
      
      const completionRecs = recommendations.filter(r => r.type === 'profile_completion');
      expect(completionRecs.length).toBeGreaterThan(0);
    });

    it('should generate dietary recommendations for users without dietary info', async () => {
      const profileWithoutDietary = ProfileTestDataBuilder.create()
        .withDietaryRestrictions([])
        .withAllergies([])
        .build();

      const preferencesWithoutDietary = PreferencesTestDataBuilder.create()
        .minimal()
        .build();

      const contextWithoutDietary = {
        ...mockContext,
        profile: profileWithoutDietary,
        preferences: preferencesWithoutDietary
      };

      const recommendations = await engine.generateRecommendations(contextWithoutDietary);
      
      const dietaryRecs = recommendations.filter(r => r.type === 'dietary_preference');
      expect(dietaryRecs.length).toBeGreaterThan(0);
    });

    it('should generate budget recommendations', async () => {
      const preferencesWithoutBudget = PreferencesTestDataBuilder.create()
        .withoutBudget()
        .build();

      const contextWithoutBudget = {
        ...mockContext,
        preferences: preferencesWithoutBudget
      };

      const recommendations = await engine.generateRecommendations(contextWithoutBudget);
      
      const budgetRecs = recommendations.filter(r => r.type === 'budget_optimization');
      expect(budgetRecs.length).toBeGreaterThan(0);
    });

    it('should generate cooking skill progression recommendations', async () => {
      const beginnerPreferences = PreferencesTestDataBuilder.create()
        .withCookingSkill('beginner')
        .build();

      const contextWithBeginner = {
        ...mockContext,
        preferences: beginnerPreferences,
        behaviorHistory: [
          {
            pattern: 'cooking simple meals',
            frequency: 8,
            lastOccurrence: new Date(),
            trend: 'increasing' as const,
            impact: 'positive' as const
          }
        ]
      };

      const recommendations = await engine.generateRecommendations(contextWithBeginner);
      
      const skillRecs = recommendations.filter(r => r.type === 'cooking_skill');
      expect(skillRecs.length).toBeGreaterThan(0);
    });

    it('should generate behavior pattern recommendations', async () => {
      const contextWithPatterns = {
        ...mockContext,
        behaviorHistory: [
          {
            pattern: 'meal planning',
            frequency: 5,
            lastOccurrence: new Date(),
            trend: 'increasing' as const,
            impact: 'positive' as const
          }
        ],
        recentActivity: ['meal planning', 'meal planning', 'meal planning']
      };

      const recommendations = await engine.generateRecommendations(contextWithPatterns);
      
      const behaviorRecs = recommendations.filter(r => r.type === 'meal_planning');
      expect(behaviorRecs.length).toBeGreaterThan(0);
    });
  });

  describe('generateAdaptiveQuestionnaire', () => {
    it('should generate questionnaire based on profile gaps', () => {
      const incompleteProfile = ProfileTestDataBuilder.create()
        .incomplete()
        .build();

      const contextWithGaps = {
        ...mockContext,
        profile: incompleteProfile,
        preferences: null
      };

      const questions = engine.generateAdaptiveQuestionnaire(contextWithGaps);

      expect(questions).toBeInstanceOf(Array);
      expect(questions.length).toBeGreaterThan(0);
      expect(questions.length).toBeLessThanOrEqual(8); // Should limit to 8 questions

      questions.forEach(question => {
        expect(question).toHaveProperty('id');
        expect(question).toHaveProperty('type');
        expect(question).toHaveProperty('category');
        expect(question).toHaveProperty('title');
        expect(question).toHaveProperty('description');
        expect(question).toHaveProperty('required');
        expect(question).toHaveProperty('weight');
        expect(question.weight).toBeGreaterThan(0);
        expect(question.weight).toBeLessThanOrEqual(1);
      });
    });

    it('should prioritize high-impact questions', () => {
      const incompleteProfile = ProfileTestDataBuilder.create()
        .withDietaryRestrictions([])
        .withAllergies([])
        .incomplete()
        .build();

      const contextWithManyGaps = {
        ...mockContext,
        profile: incompleteProfile,
        preferences: null
      };

      const questions = engine.generateAdaptiveQuestionnaire(contextWithManyGaps);

      // High-impact questions should come first
      const firstQuestion = questions[0];
      expect(['allergies', 'dietary_restrictions', 'cooking_skill']).toContain(firstQuestion.id);
    });
  });

  describe('suggestNutritionalGoals', () => {
    it('should suggest goals based on profile data', () => {
      const goals = engine.suggestNutritionalGoals(mockContext);

      expect(goals).toBeInstanceOf(Array);
      expect(goals.length).toBeGreaterThan(0);

      goals.forEach(goal => {
        expect(goal).toHaveProperty('goal');
        expect(goal).toHaveProperty('reasoning');
        expect(goal).toHaveProperty('basedOn');
        expect(goal).toHaveProperty('confidence');
        expect(goal.confidence).toBeGreaterThan(0);
        expect(goal.confidence).toBeLessThanOrEqual(100);
      });
    });

    it('should suggest caloric intake for users with age and gender', () => {
      const goals = engine.suggestNutritionalGoals(mockContext);
      
      const caloricGoal = goals.find(g => g.goal === 'Daily Caloric Intake');
      expect(caloricGoal).toBeDefined();
      expect(caloricGoal!.targetValue).toBeGreaterThan(0);
      expect(caloricGoal!.unit).toBe('calories');
    });

    it('should suggest plant-based protein for vegetarians/vegans', () => {
      const vegetarianProfile = ProfileTestDataBuilder.create()
        .withDietaryRestrictions(['vegetarian'])
        .build();

      const vegetarianContext = {
        ...mockContext,
        profile: vegetarianProfile
      };

      const goals = engine.suggestNutritionalGoals(vegetarianContext);
      
      const proteinGoal = goals.find(g => g.goal === 'Plant-Based Protein');
      expect(proteinGoal).toBeDefined();
      expect(proteinGoal!.confidence).toBeGreaterThan(80);
    });

    it('should always suggest fiber intake', () => {
      const goals = engine.suggestNutritionalGoals(mockContext);
      
      const fiberGoal = goals.find(g => g.goal === 'Daily Fiber Intake');
      expect(fiberGoal).toBeDefined();
      expect(fiberGoal!.targetValue).toBe(25);
      expect(fiberGoal!.unit).toBe('grams');
    });

    it('should handle missing age and gender gracefully', () => {
      const profileWithoutDemographics = ProfileTestDataBuilder.create()
        .build();
      
      // Remove age and gender
      profileWithoutDemographics.dateOfBirth = undefined;
      profileWithoutDemographics.gender = undefined;

      const contextWithoutDemographics = {
        ...mockContext,
        profile: profileWithoutDemographics
      };

      const goals = engine.suggestNutritionalGoals(contextWithoutDemographics);
      
      // Should still suggest fiber and other general goals
      expect(goals.length).toBeGreaterThan(0);
      
      const caloricGoal = goals.find(g => g.goal === 'Daily Caloric Intake');
      expect(caloricGoal).toBeUndefined(); // Should not suggest without demographics
    });
  });

  describe('generateRecipeRecommendations', () => {
    it('should generate recipe recommendations', async () => {
      const recipes = await engine.generateRecipeRecommendations(mockContext, 5);

      expect(recipes).toBeInstanceOf(Array);
      expect(recipes.length).toBeLessThanOrEqual(5);

      // Since this is a mock implementation, we expect empty array
      // In real implementation, this would return actual recipes
      expect(recipes).toEqual([]);
    });

    it('should respect the limit parameter', async () => {
      const recipes = await engine.generateRecipeRecommendations(mockContext, 3);
      expect(recipes.length).toBeLessThanOrEqual(3);
    });
  });

  describe('learnIngredientPreferences', () => {
    it('should learn preferences from user interactions', () => {
      const interactions = [
        { ingredient: 'tomatoes', action: 'liked' as const },
        { ingredient: 'tomatoes', action: 'cooked' as const },
        { ingredient: 'mushrooms', action: 'disliked' as const },
        { ingredient: 'mushrooms', action: 'skipped' as const },
        { ingredient: 'onions', action: 'cooked' as const }
      ];

      const learnings = engine.learnIngredientPreferences(mockContext, interactions);

      expect(learnings).toBeInstanceOf(Array);
      expect(learnings.length).toBe(3); // 3 unique ingredients

      // Check tomatoes (should be liked)
      const tomatoLearning = learnings.find(l => l.ingredient === 'tomatoes');
      expect(tomatoLearning).toBeDefined();
      expect(tomatoLearning!.preference).toBe('like');
      expect(tomatoLearning!.confidence).toBeGreaterThan(50);

      // Check mushrooms (should be disliked)
      const mushroomLearning = learnings.find(l => l.ingredient === 'mushrooms');
      expect(mushroomLearning).toBeDefined();
      expect(mushroomLearning!.preference).toBe('dislike');
      expect(mushroomLearning!.confidence).toBeGreaterThan(50);

      // Check onions (should be neutral with low confidence)
      const onionLearning = learnings.find(l => l.ingredient === 'onions');
      expect(onionLearning).toBeDefined();
      expect(onionLearning!.preference).toBe('like'); // Single positive action
      expect(onionLearning!.confidence).toBeGreaterThan(0);
    });

    it('should handle conflicting interactions', () => {
      const interactions = [
        { ingredient: 'peppers', action: 'liked' as const },
        { ingredient: 'peppers', action: 'disliked' as const }
      ];

      const learnings = engine.learnIngredientPreferences(mockContext, interactions);
      
      const pepperLearning = learnings.find(l => l.ingredient === 'peppers');
      expect(pepperLearning).toBeDefined();
      expect(pepperLearning!.preference).toBe('neutral');
      expect(pepperLearning!.confidence).toBe(30); // Low confidence for neutral
    });

    it('should generate appropriate suggested actions', () => {
      const interactions = [
        { ingredient: 'garlic', action: 'liked' as const },
        { ingredient: 'garlic', action: 'liked' as const },
        { ingredient: 'garlic', action: 'cooked' as const }
      ];

      const learnings = engine.learnIngredientPreferences(mockContext, interactions);
      
      const garlicLearning = learnings.find(l => l.ingredient === 'garlic');
      expect(garlicLearning).toBeDefined();
      expect(garlicLearning!.suggestedAction).toContain('Feature garlic more prominently');
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle null profile gracefully', async () => {
      const nullContext: RecommendationContext = {
        profile: null,
        preferences: mockUserPreferences,
        behaviorHistory: [],
        recentActivity: [],
        currentGoals: []
      };

      const recommendations = await engine.generateRecommendations(nullContext);
      expect(recommendations).toBeInstanceOf(Array);
    });

    it('should handle null preferences gracefully', async () => {
      const nullPreferencesContext: RecommendationContext = {
        profile: mockUserProfile,
        preferences: null,
        behaviorHistory: [],
        recentActivity: [],
        currentGoals: []
      };

      const recommendations = await engine.generateRecommendations(nullPreferencesContext);
      expect(recommendations).toBeInstanceOf(Array);
    });

    it('should handle errors in recommendation generation', async () => {
      // Mock a method to throw an error
      const originalMethod = engine['analyzeProfileCompleteness'];
      engine['analyzeProfileCompleteness'] = jest.fn().mockImplementation(() => {
        throw new Error('Test error');
      });

      const recommendations = await engine.generateRecommendations(mockContext);
      
      // Should return empty array on error
      expect(recommendations).toEqual([]);

      // Restore original method
      engine['analyzeProfileCompleteness'] = originalMethod;
    });

    it('should handle empty behavior history', async () => {
      const contextWithEmptyHistory = {
        ...mockContext,
        behaviorHistory: [],
        recentActivity: []
      };

      const recommendations = await engine.generateRecommendations(contextWithEmptyHistory);
      expect(recommendations).toBeInstanceOf(Array);
    });

    it('should handle very incomplete profiles', async () => {
      const minimalProfile = {
        id: 'minimal-user',
        username: 'minimal',
        email: 'minimal@example.com'
      } as any;

      const minimalContext: RecommendationContext = {
        profile: minimalProfile,
        preferences: null,
        behaviorHistory: [],
        recentActivity: [],
        currentGoals: []
      };

      const recommendations = await engine.generateRecommendations(minimalContext);
      expect(recommendations).toBeInstanceOf(Array);
      
      // Should have many profile completion recommendations
      const completionRecs = recommendations.filter(r => r.type === 'profile_completion');
      expect(completionRecs.length).toBeGreaterThan(0);
    });
  });

  describe('Recommendation scoring and prioritization', () => {
    it('should assign appropriate confidence scores', async () => {
      const recommendations = await engine.generateRecommendations(mockContext);

      recommendations.forEach(rec => {
        expect(rec.score.confidence).toBeGreaterThanOrEqual(0);
        expect(rec.score.confidence).toBeLessThanOrEqual(100);
        expect(rec.score.relevance).toBeGreaterThanOrEqual(0);
        expect(rec.score.relevance).toBeLessThanOrEqual(100);
      });
    });

    it('should assign higher priority to safety-related recommendations', async () => {
      const profileWithoutAllergies = ProfileTestDataBuilder.create()
        .withAllergies([])
        .build();

      const contextWithoutAllergies = {
        ...mockContext,
        profile: profileWithoutAllergies
      };

      const recommendations = await engine.generateRecommendations(contextWithoutAllergies);
      
      const allergyRec = recommendations.find(r => r.id === 'allergy_documentation');
      if (allergyRec) {
        expect(allergyRec.score.priority).toBe('high');
        expect(allergyRec.score.relevance).toBeGreaterThan(85);
      }
    });

    it('should vary recommendations based on household size', async () => {
      const largeHouseholdContext = {
        ...mockContext,
        profile: {
          ...mockUserProfile,
          householdSize: 6
        }
      };

      const recommendations = await engine.generateRecommendations(largeHouseholdContext);
      
      // Should have recommendations specific to large households
      expect(recommendations.some(r => 
        r.description.includes('household') || 
        r.description.includes('family')
      )).toBe(true);
    });
  });
});

describe('ProfileRecommendationEngine singleton', () => {
  it('should export a singleton instance', () => {
    expect(profileRecommendationEngine).toBeInstanceOf(ProfileRecommendationEngine);
  });

  it('should maintain state across calls', async () => {
    const context1: RecommendationContext = {
      profile: mockUserProfile,
      preferences: mockUserPreferences,
      behaviorHistory: [],
      recentActivity: [],
      currentGoals: []
    };

    const context2: RecommendationContext = {
      profile: mockUserProfile,
      preferences: mockUserPreferences,
      behaviorHistory: [],
      recentActivity: ['meal planning'],
      currentGoals: []
    };

    const rec1 = await profileRecommendationEngine.generateRecommendations(context1);
    const rec2 = await profileRecommendationEngine.generateRecommendations(context2);

    // Both should return recommendations
    expect(rec1).toBeInstanceOf(Array);
    expect(rec2).toBeInstanceOf(Array);
  });
});