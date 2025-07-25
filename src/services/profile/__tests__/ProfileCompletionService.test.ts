/**
 * @jest-environment jsdom
 */

import {
  ProfileCompletionService,
  ACHIEVEMENTS,
  AchievementType
} from '../ProfileCompletionService';

import type {
  Achievement,
  CompletionMetrics
} from '../ProfileCompletionService';

import {
  mockUserProfile,
  mockUserPreferences,
  mockHouseholdMembers,
  ProfileTestDataBuilder,
  PreferencesTestDataBuilder
} from '@/__tests__/utils/profileTestUtils';

// Mock logger
jest.mock('@/services/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

describe('ProfileCompletionService', () => {
  describe('calculateCompletion', () => {
    it('should calculate completion metrics for complete profile', () => {
      const metrics = ProfileCompletionService.calculateCompletion(
        mockUserProfile,
        mockUserPreferences,
        mockHouseholdMembers
      );

      expect(metrics).toHaveProperty('overall');
      expect(metrics).toHaveProperty('sections');
      expect(metrics).toHaveProperty('achievements');
      expect(metrics).toHaveProperty('totalPoints');
      expect(metrics).toHaveProperty('level');
      expect(metrics).toHaveProperty('nextLevelPoints');
      expect(metrics).toHaveProperty('currentStreak');
      expect(metrics).toHaveProperty('longestStreak');
      expect(metrics).toHaveProperty('lastActiveDate');

      expect(metrics.overall).toBeGreaterThan(0);
      expect(metrics.overall).toBeLessThanOrEqual(100);
    });

    it('should handle null profile gracefully', () => {
      const metrics = ProfileCompletionService.calculateCompletion(
        null,
        mockUserPreferences,
        mockHouseholdMembers
      );

      expect(metrics.overall).toBeGreaterThan(0); // Should still have some completion from preferences
      expect(metrics.sections.basicInfo).toBe(0);
    });

    it('should handle null preferences gracefully', () => {
      const metrics = ProfileCompletionService.calculateCompletion(
        mockUserProfile,
        null,
        mockHouseholdMembers
      );

      expect(metrics.overall).toBeGreaterThan(0); // Should still have some completion from profile
      expect(metrics.sections.preferences).toBe(0);
    });

    it('should handle empty household members', () => {
      const metrics = ProfileCompletionService.calculateCompletion(
        mockUserProfile,
        mockUserPreferences,
        []
      );

      expect(metrics.sections.household).toBe(0);
    });

    it('should calculate weighted overall completion correctly', () => {
      const metrics = ProfileCompletionService.calculateCompletion(
        mockUserProfile,
        mockUserPreferences,
        mockHouseholdMembers
      );

      // Overall should be weighted average of sections
      const expectedOverall = Math.round(
        metrics.sections.basicInfo * 0.20 +
        metrics.sections.preferences * 0.15 +
        metrics.sections.household * 0.10 +
        metrics.sections.financial * 0.10 +
        metrics.sections.dietary * 0.15 +
        metrics.sections.cooking * 0.10 +
        metrics.sections.planning * 0.10 +
        metrics.sections.social * 0.10
      );

      expect(metrics.overall).toBe(expectedOverall);
    });
  });

  describe('Section completion calculations', () => {
    describe('calculateBasicInfoCompletion', () => {
      it('should calculate 100% for complete basic info', () => {
        const completion = ProfileCompletionService['calculateBasicInfoCompletion'](mockUserProfile);
        expect(completion).toBe(100);
      });

      it('should calculate partial completion for incomplete info', () => {
        const incompleteProfile = ProfileTestDataBuilder.create()
          .withoutAvatar()
          .build();
        
        incompleteProfile.bio = undefined;
        incompleteProfile.dateOfBirth = undefined;

        const completion = ProfileCompletionService['calculateBasicInfoCompletion'](incompleteProfile);
        expect(completion).toBeLessThan(100);
        expect(completion).toBeGreaterThan(0);
      });

      it('should return 0 for null profile', () => {
        const completion = ProfileCompletionService['calculateBasicInfoCompletion'](null);
        expect(completion).toBe(0);
      });

      it('should handle missing fields correctly', () => {
        const profileWithNulls = {
          ...mockUserProfile,
          avatarUrl: null,
          bio: null,
          dateOfBirth: null,
          gender: null,
          location: null
        };

        const completion = ProfileCompletionService['calculateBasicInfoCompletion'](profileWithNulls);
        expect(completion).toBeLessThan(100);
      });
    });

    describe('calculatePreferencesCompletion', () => {
      it('should calculate 100% for complete preferences', () => {
        const completion = ProfileCompletionService['calculatePreferencesCompletion'](mockUserPreferences);
        expect(completion).toBe(100);
      });

      it('should calculate partial completion for incomplete preferences', () => {
        const incompletePrefs = PreferencesTestDataBuilder.create()
          .minimal()
          .build();

        const completion = ProfileCompletionService['calculatePreferencesCompletion'](incompletePrefs);
        expect(completion).toBeLessThan(100);
      });

      it('should return 0 for null preferences', () => {
        const completion = ProfileCompletionService['calculatePreferencesCompletion'](null);
        expect(completion).toBe(0);
      });

      it('should handle missing notification settings', () => {
        const prefsWithoutNotifications = {
          ...mockUserPreferences,
          notificationSettings: {}
        };

        const completion = ProfileCompletionService['calculatePreferencesCompletion'](prefsWithoutNotifications);
        expect(completion).toBeLessThan(100);
      });

      it('should handle missing meal schedule', () => {
        const prefsWithoutSchedule = {
          ...mockUserPreferences,
          mealSchedule: {}
        };

        const completion = ProfileCompletionService['calculatePreferencesCompletion'](prefsWithoutSchedule);
        expect(completion).toBeLessThan(100);
      });
    });

    describe('calculateHouseholdCompletion', () => {
      it('should return 100% when household members exist', () => {
        const completion = ProfileCompletionService['calculateHouseholdCompletion'](mockHouseholdMembers);
        expect(completion).toBe(100);
      });

      it('should return 0% when no household members', () => {
        const completion = ProfileCompletionService['calculateHouseholdCompletion']([]);
        expect(completion).toBe(0);
      });
    });

    describe('calculateFinancialCompletion', () => {
      it('should calculate completion based on budget presence', () => {
        const completion = ProfileCompletionService['calculateFinancialCompletion'](
          mockUserProfile,
          mockUserPreferences
        );
        expect(completion).toBeGreaterThan(0);
      });

      it('should return 0 when no budget is set', () => {
        const profileWithoutBudget = {
          ...mockUserProfile,
          budget: { monthly: 0, weekly: 0, currency: 'ARS' }
        };

        const prefsWithoutBudget = {
          ...mockUserPreferences,
          budget: { monthly: 0, weekly: 0, currency: 'ARS' }
        };

        const completion = ProfileCompletionService['calculateFinancialCompletion'](
          profileWithoutBudget,
          prefsWithoutBudget
        );
        expect(completion).toBeLessThan(100);
      });

      it('should handle null profile and preferences', () => {
        const completion = ProfileCompletionService['calculateFinancialCompletion'](null, null);
        expect(completion).toBe(0);
      });
    });

    describe('calculateDietaryCompletion', () => {
      it('should calculate completion based on dietary info', () => {
        const completion = ProfileCompletionService['calculateDietaryCompletion'](
          mockUserProfile,
          mockUserPreferences
        );
        expect(completion).toBeGreaterThan(0);
      });

      it('should return 0 when no dietary info is provided', () => {
        const profileWithoutDietary = ProfileTestDataBuilder.create()
          .withDietaryRestrictions([])
          .withAllergies([])
          .build();
        
        profileWithoutDietary.tasteProfile = undefined;
        profileWithoutDietary.nutritionalGoals = undefined;

        const prefsWithoutDietary = PreferencesTestDataBuilder.create()
          .build();
        
        prefsWithoutDietary.dietaryRestrictions = [];
        prefsWithoutDietary.allergies = [];

        const completion = ProfileCompletionService['calculateDietaryCompletion'](
          profileWithoutDietary,
          prefsWithoutDietary
        );
        expect(completion).toBe(0);
      });
    });

    describe('calculateCookingCompletion', () => {
      it('should calculate completion based on cooking preferences', () => {
        const completion = ProfileCompletionService['calculateCookingCompletion'](mockUserPreferences);
        expect(completion).toBeGreaterThan(0);
      });

      it('should return 0 for null preferences', () => {
        const completion = ProfileCompletionService['calculateCookingCompletion'](null);
        expect(completion).toBe(0);
      });

      it('should handle missing cooking preferences', () => {
        const prefsWithoutCooking = {
          ...mockUserPreferences,
          cookingSkillLevel: undefined,
          cookingPreferences: undefined
        };

        const completion = ProfileCompletionService['calculateCookingCompletion'](prefsWithoutCooking);
        expect(completion).toBeLessThan(100);
      });
    });

    describe('calculatePlanningCompletion', () => {
      it('should calculate completion based on planning preferences', () => {
        const completion = ProfileCompletionService['calculatePlanningCompletion'](mockUserPreferences);
        expect(completion).toBeGreaterThan(0);
      });

      it('should return 0 for null preferences', () => {
        const completion = ProfileCompletionService['calculatePlanningCompletion'](null);
        expect(completion).toBe(0);
      });
    });

    describe('calculateSocialCompletion', () => {
      it('should calculate completion based on social features', () => {
        const completion = ProfileCompletionService['calculateSocialCompletion'](mockUserProfile);
        expect(completion).toBeGreaterThan(0);
      });

      it('should return 0 for null profile', () => {
        const completion = ProfileCompletionService['calculateSocialCompletion'](null);
        expect(completion).toBe(0);
      });

      it('should handle missing social data', () => {
        const profileWithoutSocial = {
          ...mockUserProfile,
          followers: undefined,
          following: undefined,
          privacy: undefined
        };

        const completion = ProfileCompletionService['calculateSocialCompletion'](profileWithoutSocial);
        expect(completion).toBe(0);
      });
    });
  });

  describe('Achievement calculations', () => {
    it('should calculate achievements for complete profile', () => {
      const achievements = ProfileCompletionService['calculateAchievements'](
        mockUserProfile,
        mockUserPreferences,
        mockHouseholdMembers
      );

      expect(achievements).toBeInstanceOf(Array);
      expect(achievements.length).toBeGreaterThan(0);

      achievements.forEach(achievement => {
        expect(achievement).toHaveProperty('id');
        expect(achievement).toHaveProperty('name');
        expect(achievement).toHaveProperty('description');
        expect(achievement).toHaveProperty('icon');
        expect(achievement).toHaveProperty('points');
        expect(achievement).toHaveProperty('category');
        expect(achievement).toHaveProperty('progress');
      });
    });

    describe('Individual achievement checks', () => {
      it('should unlock profile_photo achievement when avatar is present', () => {
        const unlockStatus = ProfileCompletionService['checkAchievementUnlocked'](
          'profile_photo',
          mockUserProfile,
          mockUserPreferences,
          mockHouseholdMembers
        );

        expect(unlockStatus.unlocked).toBe(true);
        expect(unlockStatus.progress).toBe(1);
        expect(unlockStatus.unlockedAt).toBeDefined();
      });

      it('should not unlock profile_photo achievement when avatar is missing', () => {
        const profileWithoutAvatar = ProfileTestDataBuilder.create()
          .withoutAvatar()
          .build();

        const unlockStatus = ProfileCompletionService['checkAchievementUnlocked'](
          'profile_photo',
          profileWithoutAvatar,
          mockUserPreferences,
          mockHouseholdMembers
        );

        expect(unlockStatus.unlocked).toBe(false);
        expect(unlockStatus.progress).toBe(0);
        expect(unlockStatus.unlockedAt).toBeUndefined();
      });

      it('should unlock basic_info achievement when all fields are complete', () => {
        const unlockStatus = ProfileCompletionService['checkAchievementUnlocked'](
          'basic_info',
          mockUserProfile,
          mockUserPreferences,
          mockHouseholdMembers
        );

        expect(unlockStatus.unlocked).toBe(true);
        expect(unlockStatus.progress).toBe(5);
      });

      it('should calculate partial progress for basic_info achievement', () => {
        const incompleteProfile = ProfileTestDataBuilder.create()
          .build();
        
        incompleteProfile.bio = undefined;
        incompleteProfile.dateOfBirth = undefined;
        incompleteProfile.gender = undefined;

        const unlockStatus = ProfileCompletionService['checkAchievementUnlocked'](
          'basic_info',
          incompleteProfile,
          mockUserPreferences,
          mockHouseholdMembers
        );

        expect(unlockStatus.unlocked).toBe(false);
        expect(unlockStatus.progress).toBeLessThan(5);
        expect(unlockStatus.progress).toBeGreaterThan(0);
      });

      it('should unlock dietary_preferences achievement', () => {
        const unlockStatus = ProfileCompletionService['checkAchievementUnlocked'](
          'dietary_preferences',
          mockUserProfile,
          mockUserPreferences,
          mockHouseholdMembers
        );

        expect(unlockStatus.unlocked).toBe(true);
      });

      it('should unlock household_setup achievement when members exist', () => {
        const unlockStatus = ProfileCompletionService['checkAchievementUnlocked'](
          'household_setup',
          mockUserProfile,
          mockUserPreferences,
          mockHouseholdMembers
        );

        expect(unlockStatus.unlocked).toBe(true);
        expect(unlockStatus.progress).toBe(1);
      });

      it('should not unlock household_setup achievement when no members', () => {
        const unlockStatus = ProfileCompletionService['checkAchievementUnlocked'](
          'household_setup',
          mockUserProfile,
          mockUserPreferences,
          []
        );

        expect(unlockStatus.unlocked).toBe(false);
        expect(unlockStatus.progress).toBe(0);
      });

      it('should unlock cooking_skills achievement', () => {
        const unlockStatus = ProfileCompletionService['checkAchievementUnlocked'](
          'cooking_skills',
          mockUserProfile,
          mockUserPreferences,
          mockHouseholdMembers
        );

        expect(unlockStatus.unlocked).toBe(true);
      });

      it('should unlock budget_planning achievement when budget is set', () => {
        const unlockStatus = ProfileCompletionService['checkAchievementUnlocked'](
          'budget_planning',
          mockUserProfile,
          mockUserPreferences,
          mockHouseholdMembers
        );

        expect(unlockStatus.unlocked).toBe(true);
      });

      it('should unlock first_recipe achievement when recipes created', () => {
        const profileWithRecipes = {
          ...mockUserProfile,
          stats: {
            ...mockUserProfile.stats!,
            recipesCreated: 1
          }
        };

        const unlockStatus = ProfileCompletionService['checkAchievementUnlocked'](
          'first_recipe',
          profileWithRecipes,
          mockUserPreferences,
          mockHouseholdMembers
        );

        expect(unlockStatus.unlocked).toBe(true);
      });

      it('should unlock week_streak achievement for 7+ day streak', () => {
        const profileWithStreak = {
          ...mockUserProfile,
          stats: {
            ...mockUserProfile.stats!,
            streakDays: 7
          }
        };

        const unlockStatus = ProfileCompletionService['checkAchievementUnlocked'](
          'week_streak',
          profileWithStreak,
          mockUserPreferences,
          mockHouseholdMembers
        );

        expect(unlockStatus.unlocked).toBe(true);
        expect(unlockStatus.progress).toBe(7);
      });

      it('should show partial progress for week_streak', () => {
        const profileWithPartialStreak = {
          ...mockUserProfile,
          stats: {
            ...mockUserProfile.stats!,
            streakDays: 3
          }
        };

        const unlockStatus = ProfileCompletionService['checkAchievementUnlocked'](
          'week_streak',
          profileWithPartialStreak,
          mockUserPreferences,
          mockHouseholdMembers
        );

        expect(unlockStatus.unlocked).toBe(false);
        expect(unlockStatus.progress).toBe(3);
      });

      it('should unlock social_butterfly achievement for 10+ following', () => {
        const profileWithFollowing = {
          ...mockUserProfile,
          following: new Array(10).fill('user-id')
        };

        const unlockStatus = ProfileCompletionService['checkAchievementUnlocked'](
          'social_butterfly',
          profileWithFollowing,
          mockUserPreferences,
          mockHouseholdMembers
        );

        expect(unlockStatus.unlocked).toBe(true);
        expect(unlockStatus.progress).toBe(10);
      });

      it('should not unlock unimplemented achievements', () => {
        const unlockStatus = ProfileCompletionService['checkAchievementUnlocked'](
          'budget_guru',
          mockUserProfile,
          mockUserPreferences,
          mockHouseholdMembers
        );

        expect(unlockStatus.unlocked).toBe(false);
        expect(unlockStatus.progress).toBe(0);
      });
    });
  });

  describe('Level calculations', () => {
    it('should calculate level based on total points', () => {
      const { level, nextLevelPoints } = ProfileCompletionService['calculateLevel'](150);
      
      expect(level).toBeGreaterThan(1);
      expect(nextLevelPoints).toBeGreaterThan(150);
    });

    it('should start at level 1 with 0 points', () => {
      const { level, nextLevelPoints } = ProfileCompletionService['calculateLevel'](0);
      
      expect(level).toBe(1);
      expect(nextLevelPoints).toBe(100);
    });

    it('should cap at level 10', () => {
      const { level } = ProfileCompletionService['calculateLevel'](99999);
      
      expect(level).toBe(10);
    });

    it('should calculate correct next level points', () => {
      const { level: level1, nextLevelPoints: next1 } = ProfileCompletionService['calculateLevel'](50);
      const { level: level2, nextLevelPoints: next2 } = ProfileCompletionService['calculateLevel'](150);
      
      expect(level1).toBe(1);
      expect(next1).toBe(100);
      expect(level2).toBe(2);
      expect(next2).toBe(250);
    });
  });

  describe('Streak calculations', () => {
    it('should return current streak from profile', () => {
      const { currentStreak } = ProfileCompletionService['calculateStreaks'](mockUserProfile);
      
      expect(currentStreak).toBe(mockUserProfile.stats!.streakDays);
    });

    it('should handle missing stats gracefully', () => {
      const profileWithoutStats = {
        ...mockUserProfile,
        stats: undefined
      };

      const { currentStreak, longestStreak } = ProfileCompletionService['calculateStreaks'](profileWithoutStats);
      
      expect(currentStreak).toBe(0);
      expect(longestStreak).toBe(0);
    });

    it('should return 0 for null profile', () => {
      const { currentStreak, longestStreak } = ProfileCompletionService['calculateStreaks'](null);
      
      expect(currentStreak).toBe(0);
      expect(longestStreak).toBe(0);
    });
  });

  describe('getSuggestions', () => {
    it('should generate suggestions based on incomplete sections', () => {
      const mockMetrics: CompletionMetrics = {
        overall: 60,
        sections: {
          basicInfo: 80,
          preferences: 40,
          household: 0,
          financial: 100,
          dietary: 60,
          cooking: 30,
          planning: 50,
          social: 20
        },
        achievements: [],
        totalPoints: 0,
        level: 1,
        nextLevelPoints: 100,
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: new Date()
      };

      const suggestions = ProfileCompletionService.getSuggestions(mockMetrics);

      expect(suggestions).toBeInstanceOf(Array);
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.length).toBeLessThanOrEqual(5); // 3 sections + 2 achievements max
    });

    it('should prioritize incomplete sections by completion percentage', () => {
      const mockMetrics: CompletionMetrics = {
        overall: 50,
        sections: {
          basicInfo: 100,
          preferences: 100,
          household: 0, // Least complete
          financial: 30, // Second least complete
          dietary: 50, // Third least complete
          cooking: 100,
          planning: 100,
          social: 100
        },
        achievements: [],
        totalPoints: 0,
        level: 1,
        nextLevelPoints: 100,
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: new Date()
      };

      const suggestions = ProfileCompletionService.getSuggestions(mockMetrics);

      // Should suggest the least complete sections first
      expect(suggestions[0]).toContain('household');
      expect(suggestions[1]).toContain('financial');
      expect(suggestions[2]).toContain('dietary');
    });

    it('should include achievement-based suggestions', () => {
      const mockAchievements: Achievement[] = [
        {
          id: 'profile_photo',
          name: 'Say Cheese!',
          description: 'Upload your first profile photo',
          icon: '📸',
          points: 10,
          category: 'profile',
          progress: 0,
          maxProgress: 1
        },
        {
          id: 'basic_info',
          name: 'Getting Started',
          description: 'Complete your basic profile information',
          icon: '✍️',
          points: 20,
          category: 'profile',
          progress: 3,
          maxProgress: 5
        }
      ];

      const mockMetrics: CompletionMetrics = {
        overall: 90,
        sections: {
          basicInfo: 100,
          preferences: 100,
          household: 100,
          financial: 100,
          dietary: 100,
          cooking: 100,
          planning: 100,
          social: 100
        },
        achievements: mockAchievements,
        totalPoints: 0,
        level: 1,
        nextLevelPoints: 100,
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: new Date()
      };

      const suggestions = ProfileCompletionService.getSuggestions(mockMetrics);

      // Should include achievement suggestions
      expect(suggestions.some(s => s.includes('Say Cheese!'))).toBe(true);
    });

    it('should prioritize achievements by progress', () => {
      const mockAchievements: Achievement[] = [
        {
          id: 'profile_photo',
          name: 'Say Cheese!',
          description: 'Upload your first profile photo',
          icon: '📸',
          points: 10,
          category: 'profile',
          progress: 0,
          maxProgress: 1
        },
        {
          id: 'basic_info',
          name: 'Getting Started',
          description: 'Complete your basic profile information',
          icon: '✍️',
          points: 20,
          category: 'profile',
          progress: 4,
          maxProgress: 5
        }
      ];

      const mockMetrics: CompletionMetrics = {
        overall: 90,
        sections: {
          basicInfo: 100,
          preferences: 100,
          household: 100,
          financial: 100,
          dietary: 100,
          cooking: 100,
          planning: 100,
          social: 100
        },
        achievements: mockAchievements,
        totalPoints: 0,
        level: 1,
        nextLevelPoints: 100,
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: new Date()
      };

      const suggestions = ProfileCompletionService.getSuggestions(mockMetrics);

      // Achievement with higher progress should come first
      const basicInfoIndex = suggestions.findIndex(s => s.includes('Getting Started'));
      const photoIndex = suggestions.findIndex(s => s.includes('Say Cheese!'));
      
      expect(basicInfoIndex).toBeLessThan(photoIndex);
    });
  });

  describe('getSuggestionForSection', () => {
    it('should return appropriate suggestions for each section', () => {
      const sections = [
        'basicInfo',
        'preferences',
        'household',
        'financial',
        'dietary',
        'cooking',
        'planning',
        'social'
      ];

      sections.forEach(section => {
        const suggestion = ProfileCompletionService['getSuggestionForSection'](section, 50);
        expect(suggestion).toBeDefined();
        expect(suggestion.length).toBeGreaterThan(0);
        expect(suggestion).toContain('50%');
      });
    });

    it('should handle unknown sections', () => {
      const suggestion = ProfileCompletionService['getSuggestionForSection']('unknown', 75);
      expect(suggestion).toBe('Complete the unknown section (75% done)');
    });
  });

  describe('Async methods', () => {
    const { logger } = require('@/services/logger');

    beforeEach(() => {
      jest.clearAllMocks();
    });

    describe('trackProgress', () => {
      it('should log achievement progress tracking', async () => {
        await ProfileCompletionService.trackProgress('user-123', 'profile_photo', 1);

        expect(logger.info).toHaveBeenCalledWith(
          'Tracking achievement progress',
          {
            userId: 'user-123',
            achievementId: 'profile_photo',
            progress: 1
          }
        );
      });

      it('should handle errors gracefully', async () => {
        // Mock console.error to avoid test noise
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        // Force an error by passing invalid arguments
        await ProfileCompletionService.trackProgress('' as any, null as any, NaN);

        expect(logger.error).toHaveBeenCalled();

        consoleSpy.mockRestore();
      });
    });

    describe('awardAchievement', () => {
      it('should log achievement awarding', async () => {
        await ProfileCompletionService.awardAchievement('user-123', 'profile_photo');

        expect(logger.info).toHaveBeenCalledWith(
          'Awarding achievement',
          {
            userId: 'user-123',
            achievementId: 'profile_photo'
          }
        );
      });

      it('should handle errors gracefully', async () => {
        // Mock console.error to avoid test noise
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        // Force an error by passing invalid arguments
        await ProfileCompletionService.awardAchievement('' as any, null as any);

        expect(logger.error).toHaveBeenCalled();

        consoleSpy.mockRestore();
      });
    });
  });

  describe('Achievement definitions', () => {
    it('should have all achievement types defined', () => {
      const achievementTypes: AchievementType[] = [
        'profile_photo',
        'basic_info',
        'dietary_preferences',
        'household_setup',
        'taste_profile',
        'cooking_skills',
        'budget_planning',
        'meal_schedule',
        'shopping_preferences',
        'nutrition_goals',
        'first_recipe',
        'first_meal_plan',
        'week_streak',
        'month_streak',
        'social_butterfly',
        'master_chef',
        'budget_guru',
        'health_conscious',
        'family_planner',
        'eco_warrior'
      ];

      achievementTypes.forEach(type => {
        expect(ACHIEVEMENTS[type]).toBeDefined();
        expect(ACHIEVEMENTS[type]).toHaveProperty('name');
        expect(ACHIEVEMENTS[type]).toHaveProperty('description');
        expect(ACHIEVEMENTS[type]).toHaveProperty('icon');
        expect(ACHIEVEMENTS[type]).toHaveProperty('points');
        expect(ACHIEVEMENTS[type]).toHaveProperty('category');
      });
    });

    it('should have valid point values for all achievements', () => {
      Object.values(ACHIEVEMENTS).forEach(achievement => {
        expect(achievement.points).toBeGreaterThan(0);
        expect(achievement.points).toBeLessThanOrEqual(1000);
      });
    });

    it('should have valid categories for all achievements', () => {
      const validCategories = ['profile', 'activity', 'social', 'mastery'];

      Object.values(ACHIEVEMENTS).forEach(achievement => {
        expect(validCategories).toContain(achievement.category);
      });
    });

    it('should have emojis for all achievement icons', () => {
      Object.values(ACHIEVEMENTS).forEach(achievement => {
        expect(achievement.icon).toBeDefined();
        expect(achievement.icon.length).toBeGreaterThan(0);
      });
    });
  });
});