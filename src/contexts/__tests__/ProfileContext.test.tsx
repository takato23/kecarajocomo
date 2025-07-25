/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { toast } from 'sonner';

import {
  ProfileProvider,
  useProfile,
  useProfileData,
  useHouseholdContext,
  useProfileActions,
  useProfileComputed
} from '../ProfileContext';

import {
  mockUserProfile,
  mockUserPreferences,
  mockHouseholdMembers,
  ProfileTestDataBuilder,
  PreferencesTestDataBuilder,
  createMockLocalStorage
} from '@/__tests__/utils/profileTestUtils';

// Mock dependencies
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn()
  }
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            data: mockHouseholdMembers,
            error: null
          }))
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => ({
            data: mockHouseholdMembers[0],
            error: null
          }))
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: mockHouseholdMembers[0],
          error: null
        }))
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: null,
          error: null
        }))
      }))
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(() => ({
          data: { path: 'avatars/test-user-id/avatar.jpg' },
          error: null
        })),
        getPublicUrl: jest.fn(() => ({
          data: { publicUrl: 'https://example.com/avatar.jpg' }
        }))
      }))
    }
  }
}));

jest.mock('@/lib/profile/ensure-profile', () => ({
  ensureUserProfile: jest.fn().mockResolvedValue(mockUserProfile)
}));

jest.mock('@/services/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

jest.mock('@/store', () => ({
  useUser: jest.fn(),
  useUserActions: jest.fn()
}));

const { useUser, useUserActions } = require('@/store');

describe('ProfileContext', () => {
  const mockUpdateProfile = jest.fn();
  const mockSetPreferences = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    useUser.mockReturnValue(mockUserProfile);
    useUserActions.mockReturnValue({
      updateProfile: mockUpdateProfile,
      setPreferences: mockSetPreferences
    });

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: createMockLocalStorage(),
      writable: true
    });
  });

  describe('ProfileProvider', () => {
    it('should render children without crashing', () => {
      render(
        <ProfileProvider>
          <div data-testid="test-child">Test Content</div>
        </ProfileProvider>
      );

      expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });

    it('should initialize profile when user is present', async () => {
      const { ensureUserProfile } = require('@/lib/profile/ensure-profile');
      
      render(
        <ProfileProvider>
          <div>Test</div>
        </ProfileProvider>
      );

      await waitFor(() => {
        expect(ensureUserProfile).toHaveBeenCalledWith(mockUserProfile);
      });
    });

    it('should not initialize profile when user is null', () => {
      useUser.mockReturnValue(null);
      const { ensureUserProfile } = require('@/lib/profile/ensure-profile');
      
      render(
        <ProfileProvider>
          <div>Test</div>
        </ProfileProvider>
      );

      expect(ensureUserProfile).not.toHaveBeenCalled();
    });
  });

  describe('useProfileData', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ProfileProvider>{children}</ProfileProvider>
    );

    it('should return profile data correctly', () => {
      const { result } = renderHook(() => useProfileData(), { wrapper });

      expect(result.current.profile).toEqual(mockUserProfile);
      expect(result.current.preferences).toEqual(mockUserProfile.preferences);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle null user gracefully', () => {
      useUser.mockReturnValue(null);
      
      const { result } = renderHook(() => useProfileData(), { wrapper });

      expect(result.current.profile).toBeNull();
      expect(result.current.preferences).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useProfileData());
      }).toThrow('useProfileData must be used within ProfileProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('useHouseholdContext', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ProfileProvider>{children}</ProfileProvider>
    );

    it('should load household members on mount', async () => {
      const { result } = renderHook(() => useHouseholdContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.householdMembers).toEqual(mockHouseholdMembers);
      });
    });

    it('should add household member successfully', async () => {
      const { result } = renderHook(() => useHouseholdContext(), { wrapper });

      const newMember = {
        name: 'New Member',
        age: 25,
        relationship: 'sibling' as const,
        dietaryRestrictions: [],
        allergies: [],
        preferences: {
          spiceLevel: 'medium' as const,
          favoriteIngredients: [],
          dislikedIngredients: []
        }
      };

      await act(async () => {
        await result.current.addHouseholdMember(newMember);
      });

      expect(toast.success).toHaveBeenCalledWith('Miembro del hogar agregado');
    });

    it('should update household member successfully', async () => {
      const { result } = renderHook(() => useHouseholdContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.householdMembers).toEqual(mockHouseholdMembers);
      });

      const updates = { name: 'Updated Name' };

      await act(async () => {
        await result.current.updateHouseholdMember('member-1', updates);
      });

      expect(toast.success).toHaveBeenCalledWith('Miembro actualizado');
    });

    it('should remove household member successfully', async () => {
      const { result } = renderHook(() => useHouseholdContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.householdMembers).toEqual(mockHouseholdMembers);
      });

      await act(async () => {
        await result.current.removeHouseholdMember('member-1');
      });

      expect(toast.success).toHaveBeenCalledWith('Miembro eliminado');
    });

    it('should handle household operations when user is null', async () => {
      useUser.mockReturnValue(null);
      
      const { result } = renderHook(() => useHouseholdContext(), { wrapper });

      const newMember = {
        name: 'New Member',
        age: 25,
        relationship: 'sibling' as const,
        dietaryRestrictions: [],
        allergies: [],
        preferences: {
          spiceLevel: 'medium' as const,
          favoriteIngredients: [],
          dislikedIngredients: []
        }
      };

      await act(async () => {
        await result.current.addHouseholdMember(newMember);
      });

      // Should not call toast.success when user is null
      expect(toast.success).not.toHaveBeenCalled();
    });
  });

  describe('useProfileActions', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ProfileProvider>{children}</ProfileProvider>
    );

    it('should update profile successfully', async () => {
      const { result } = renderHook(() => useProfileActions(), { wrapper });

      const updates = { bio: 'Updated bio' };

      await act(async () => {
        await result.current.updateProfile(updates);
      });

      expect(mockUpdateProfile).toHaveBeenCalledWith(updates);
      expect(toast.success).toHaveBeenCalledWith('Perfil actualizado correctamente');
    });

    it('should update preferences successfully', async () => {
      const { result } = renderHook(() => useProfileActions(), { wrapper });

      const updates = { cookingSkillLevel: 'advanced' as const };

      await act(async () => {
        await result.current.updatePreferences(updates);
      });

      expect(mockSetPreferences).toHaveBeenCalledWith(updates);
      expect(toast.success).toHaveBeenCalledWith('Preferencias actualizadas');
    });

    it('should upload avatar successfully', async () => {
      const { result } = renderHook(() => useProfileActions(), { wrapper });

      const file = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' });

      let avatarUrl: string;
      await act(async () => {
        avatarUrl = await result.current.uploadAvatar(file);
      });

      expect(avatarUrl!).toBe('https://example.com/avatar.jpg');
      expect(mockUpdateProfile).toHaveBeenCalledWith({
        avatarUrl: 'https://example.com/avatar.jpg'
      });
    });

    it('should handle upload avatar when user is null', async () => {
      useUser.mockReturnValue(null);
      
      const { result } = renderHook(() => useProfileActions(), { wrapper });

      const file = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' });

      await expect(async () => {
        await act(async () => {
          await result.current.uploadAvatar(file);
        });
      }).rejects.toThrow('Usuario no autenticado');
    });

    it('should refresh profile successfully', async () => {
      const { result } = renderHook(() => useProfileActions(), { wrapper });

      await act(async () => {
        await result.current.refreshProfile();
      });

      expect(toast.success).toHaveBeenCalledWith('Perfil actualizado');
    });

    it('should clear cache successfully', () => {
      const { result } = renderHook(() => useProfileActions(), { wrapper });

      act(() => {
        result.current.clearCache();
      });

      expect(localStorage.removeItem).toHaveBeenCalledWith('user-profile-cache');
      expect(localStorage.removeItem).toHaveBeenCalledWith('user-preferences-cache');
    });
  });

  describe('useProfileComputed', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ProfileProvider>{children}</ProfileProvider>
    );

    beforeEach(() => {
      useUser.mockReturnValue({
        ...mockUserProfile,
        preferences: mockUserPreferences
      });
    });

    it('should calculate dietary restrictions correctly', () => {
      const { result } = renderHook(() => useProfileComputed(), { wrapper });

      const restrictions = result.current.getDietaryRestrictions();
      expect(restrictions).toContain('vegetarian');
      expect(restrictions).toContain('gluten_free');
    });

    it('should calculate allergies correctly', () => {
      const { result } = renderHook(() => useProfileComputed(), { wrapper });

      const allergies = result.current.getAllergies();
      expect(allergies).toContain('nuts');
      expect(allergies).toContain('dairy');
      expect(allergies).toContain('shellfish');
    });

    it('should calculate household size correctly', async () => {
      const { result } = renderHook(() => useProfileComputed(), { wrapper });

      // Wait for household members to load
      await waitFor(() => {
        const householdSize = result.current.getHouseholdSize();
        expect(householdSize).toBe(3); // 1 user + 2 household members
      });
    });

    it('should get budget correctly', () => {
      const { result } = renderHook(() => useProfileComputed(), { wrapper });

      expect(result.current.getBudget('weekly')).toBe(100);
      expect(result.current.getBudget('monthly')).toBe(400);
    });

    it('should get meal schedule correctly', () => {
      const { result } = renderHook(() => useProfileComputed(), { wrapper });

      const schedule = result.current.getMealSchedule();
      expect(schedule).toEqual(mockUserPreferences.mealSchedule);
    });

    it('should get cooking time available correctly', () => {
      const { result } = renderHook(() => useProfileComputed(), { wrapper });

      expect(result.current.getCookingTimeAvailable('weekday')).toBe(30);
      expect(result.current.getCookingTimeAvailable('weekend')).toBe(60);
    });

    it('should get personalization data correctly', () => {
      const { result } = renderHook(() => useProfileComputed(), { wrapper });

      const data = result.current.getPersonalizationData();
      
      expect(data.dietaryRestrictions).toContain('vegetarian');
      expect(data.allergies).toContain('nuts');
      expect(data.cuisinePreferences).toContain('mediterranean');
      expect(data.cookingSkillLevel).toBe('intermediate');
      expect(data.budget).toBe(100);
      expect(data.timeConstraints.weekday).toBe(30);
      expect(data.timeConstraints.weekend).toBe(60);
    });

    it('should get recommendation profile correctly', () => {
      const { result } = renderHook(() => useProfileComputed(), { wrapper });

      const profile = result.current.getRecommendationProfile();
      
      expect(profile.preferences).toBeDefined();
      expect(profile.history).toBeDefined();
      expect(profile.goals).toEqual([]);
    });

    it('should get planning constraints correctly', () => {
      const { result } = renderHook(() => useProfileComputed(), { wrapper });

      const constraints = result.current.getPlanningConstraints();
      
      expect(constraints.dietary).toContain('vegetarian');
      expect(constraints.allergies).toContain('nuts');
      expect(constraints.budget).toBe(100);
      expect(constraints.timeConstraints.weekday).toBe(30);
      expect(constraints.batchCookingEnabled).toBe(true);
      expect(constraints.leftoverStrategy).toBe('incorporate');
    });
  });

  describe('useProfile (backward compatibility)', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ProfileProvider>{children}</ProfileProvider>
    );

    it('should combine all contexts correctly', async () => {
      const { result } = renderHook(() => useProfile(), { wrapper });

      // Profile data
      expect(result.current.profile).toEqual(mockUserProfile);
      expect(result.current.preferences).toBeDefined();

      // Household context
      await waitFor(() => {
        expect(result.current.householdMembers).toEqual(mockHouseholdMembers);
      });

      // Actions
      expect(typeof result.current.updateProfile).toBe('function');
      expect(typeof result.current.updatePreferences).toBe('function');

      // Computed values
      expect(typeof result.current.getDietaryRestrictions).toBe('function');
      expect(typeof result.current.getAllergies).toBe('function');
    });
  });

  describe('Memoization and performance', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ProfileProvider>{children}</ProfileProvider>
    );

    it('should memoize computed values correctly', () => {
      const { result, rerender } = renderHook(() => useProfileComputed(), { wrapper });

      const firstCall = result.current.getDietaryRestrictions();
      
      // Rerender should return the same function reference (memoized)
      rerender();
      const secondCall = result.current.getDietaryRestrictions();

      expect(firstCall).toBe(secondCall);
    });

    it('should recalculate when dependencies change', () => {
      const profile1 = ProfileTestDataBuilder.create()
        .withDietaryRestrictions(['vegetarian'])
        .build();

      const profile2 = ProfileTestDataBuilder.create()
        .withDietaryRestrictions(['vegan'])
        .build();

      useUser.mockReturnValue(profile1);
      
      const { result, rerender } = renderHook(() => useProfileComputed(), { wrapper });

      const firstRestrictions = result.current.getDietaryRestrictions();

      // Change user data
      useUser.mockReturnValue(profile2);
      rerender();

      const secondRestrictions = result.current.getDietaryRestrictions();

      expect(firstRestrictions).not.toEqual(secondRestrictions);
    });
  });

  describe('Error handling', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ProfileProvider>{children}</ProfileProvider>
    );

    it('should handle profile update errors gracefully', async () => {
      const error = new Error('Update failed');
      mockUpdateProfile.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useProfileActions(), { wrapper });

      await expect(async () => {
        await act(async () => {
          await result.current.updateProfile({ bio: 'test' });
        });
      }).rejects.toThrow('Update failed');
    });

    it('should handle household member addition errors', async () => {
      const { supabase } = require('@/lib/supabase');
      supabase.from.mockReturnValueOnce({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => ({
              data: null,
              error: { message: 'Insert failed' }
            }))
          }))
        }))
      });

      const { result } = renderHook(() => useHouseholdContext(), { wrapper });

      const newMember = {
        name: 'Test Member',
        age: 30,
        relationship: 'friend' as const,
        dietaryRestrictions: [],
        allergies: [],
        preferences: {
          spiceLevel: 'medium' as const,
          favoriteIngredients: [],
          dislikedIngredients: []
        }
      };

      await expect(async () => {
        await act(async () => {
          await result.current.addHouseholdMember(newMember);
        });
      }).rejects.toThrow();
    });
  });
});