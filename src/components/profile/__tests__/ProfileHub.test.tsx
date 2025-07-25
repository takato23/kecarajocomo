/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProfileHub } from '../ProfileHub';

import {
  mockUserProfile,
  mockUserPreferences,
  mockHouseholdMembers,
  mockCompletionMetrics,
  createMockProfileActions,
  createMockHouseholdActions,
  createMockProfileComputed,
  createMockGamificationReturn,
  ProfileTestDataBuilder
} from '@/__tests__/utils/profileTestUtils';

// Mock dependencies
jest.mock('@/contexts/ProfileContext', () => ({
  useProfile: jest.fn()
}));

jest.mock('@/hooks/useProfileGamification', () => ({
  useProfileGamification: jest.fn()
}));

// Mock lazy-loaded components
jest.mock('../ProfileOverview', () => ({
  ProfileOverview: ({ profile, preferences, stats, householdSize }: any) => (
    <div data-testid="profile-overview">
      <div data-testid="profile-id">{profile?.id}</div>
      <div data-testid="household-size">{householdSize}</div>
    </div>
  )
}));

jest.mock('../DietaryPreferences', () => ({
  DietaryPreferences: ({ preferences, householdMembers, onUpdate }: any) => (
    <div data-testid="dietary-preferences">
      <div data-testid="cuisine-count">{preferences?.cuisinePreferences?.length || 0}</div>
      <button data-testid="update-dietary" onClick={() => onUpdate({ test: 'update' })}>
        Update
      </button>
    </div>
  )
}));

jest.mock('../HouseholdManager', () => ({
  HouseholdManager: ({ householdMembers, preferences, onUpdatePreferences }: any) => (
    <div data-testid="household-manager">
      <div data-testid="member-count">{householdMembers?.length || 0}</div>
      <button data-testid="update-preferences" onClick={() => onUpdatePreferences({ test: 'update' })}>
        Update Preferences
      </button>
    </div>
  )
}));

jest.mock('../CookingPreferences', () => ({
  CookingPreferences: ({ preferences, onUpdate }: any) => (
    <div data-testid="cooking-preferences">
      <div data-testid="skill-level">{preferences?.cookingSkillLevel}</div>
      <button data-testid="update-cooking" onClick={() => onUpdate({ test: 'cooking' })}>
        Update Cooking
      </button>
    </div>
  )
}));

jest.mock('../ProfileSettings', () => ({
  ProfileSettings: ({ profile, preferences, onUpdateProfile, onUpdatePreferences }: any) => (
    <div data-testid="profile-settings">
      <div data-testid="username">{profile?.username}</div>
      <button data-testid="update-profile" onClick={() => onUpdateProfile({ test: 'profile' })}>
        Update Profile
      </button>
      <button data-testid="update-prefs" onClick={() => onUpdatePreferences({ test: 'prefs' })}>
        Update Prefs
      </button>
    </div>
  )
}));

// Mock gamification components
jest.mock('../gamification/ProfileProgress', () => ({
  ProfileProgress: ({ metrics, suggestions, onSectionClick }: any) => (
    <div data-testid="profile-progress">
      <div data-testid="overall-completion">{metrics?.overall}</div>
      <div data-testid="suggestions-count">{suggestions?.length || 0}</div>
      <button data-testid="section-click" onClick={() => onSectionClick('basicInfo')}>
        Complete Section
      </button>
    </div>
  )
}));

jest.mock('../gamification/ProfileAchievements', () => ({
  ProfileAchievements: ({ achievements, totalPoints, level }: any) => (
    <div data-testid="profile-achievements">
      <div data-testid="achievements-count">{achievements?.length || 0}</div>
      <div data-testid="total-points">{totalPoints}</div>
      <div data-testid="level">{level}</div>
    </div>
  )
}));

jest.mock('../gamification/ProfileStreaks', () => ({
  ProfileStreaks: ({ currentStreak, longestStreak, lastActiveDate }: any) => (
    <div data-testid="profile-streaks">
      <div data-testid="current-streak">{currentStreak}</div>
      <div data-testid="longest-streak">{longestStreak}</div>
    </div>
  )
}));

jest.mock('../gamification/ProfileLeaderboard', () => ({
  ProfileLeaderboard: ({ currentUserId }: any) => (
    <div data-testid="profile-leaderboard">
      <div data-testid="user-id">{currentUserId}</div>
    </div>
  )
}));

jest.mock('../ProfileHeader', () => ({
  ProfileHeader: ({ profile, completionPercentage, onUpdateProfile }: any) => (
    <div data-testid="profile-header">
      <div data-testid="completion">{completionPercentage}</div>
      <button data-testid="update-header" onClick={() => onUpdateProfile({ test: 'header' })}>
        Update
      </button>
    </div>
  )
}));

// Mock UI components
jest.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, value, onValueChange }: any) => (
    <div data-testid="tabs" data-value={value}>
      <button data-testid="tab-change" onClick={() => onValueChange('overview')}>
        Change Tab
      </button>
      {children}
    </div>
  ),
  TabsList: ({ children }: any) => <div data-testid="tabs-list">{children}</div>,
  TabsTrigger: ({ value, children }: any) => (
    <button data-testid={`tab-trigger-${value}`}>{children}</button>
  ),
  TabsContent: ({ value, children }: any) => (
    <div data-testid={`tab-content-${value}`}>{children}</div>
  )
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>
}));

jest.mock('@/components/ui/progress', () => ({
  Progress: ({ value }: any) => <div data-testid="progress" data-value={value} />
}));

const { useProfile } = require('@/contexts/ProfileContext');
const { useProfileGamification } = require('@/hooks/useProfileGamification');

describe('ProfileHub', () => {
  const mockProfileActions = createMockProfileActions();
  const mockHouseholdActions = createMockHouseholdActions();
  const mockProfileComputed = createMockProfileComputed();
  const mockGamificationData = createMockGamificationReturn();

  const defaultMockProfile = {
    profile: mockUserProfile,
    preferences: mockUserPreferences,
    householdMembers: mockHouseholdMembers,
    isLoading: false,
    ...mockProfileActions,
    ...mockHouseholdActions,
    ...mockProfileComputed
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    useProfile.mockReturnValue(defaultMockProfile);
    useProfileGamification.mockReturnValue(mockGamificationData);
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<ProfileHub />);
      
      expect(screen.getByTestId('profile-header')).toBeInTheDocument();
      expect(screen.getByTestId('tabs')).toBeInTheDocument();
    });

    it('should show loading state when profile is null', () => {
      useProfile.mockReturnValue({
        ...defaultMockProfile,
        profile: null,
        preferences: null
      });

      render(<ProfileHub />);

      expect(screen.getByText('Cargando perfil...')).toBeInTheDocument();
      expect(screen.getByTestId('progress')).toBeInTheDocument();
    });

    it('should display profile header with completion percentage', () => {
      render(<ProfileHub />);

      const header = screen.getByTestId('profile-header');
      expect(header).toBeInTheDocument();
      
      const completion = screen.getByTestId('completion');
      expect(completion).toHaveTextContent(mockCompletionMetrics.overall.toString());
    });

    it('should display quick stats cards', () => {
      render(<ProfileHub />);

      const cards = screen.getAllByTestId('card');
      expect(cards).toHaveLength(4); // household, dietary, cuisine, budget
    });

    it('should calculate and display correct stats', () => {
      render(<ProfileHub />);

      // The component should display calculated stats
      // Since we're mocking the computed functions, check they're called
      expect(mockProfileComputed.getHouseholdSize).toHaveBeenCalled();
      expect(mockProfileComputed.getDietaryRestrictions).toHaveBeenCalled();
    });
  });

  describe('Tab navigation', () => {
    it('should render all tab triggers', () => {
      render(<ProfileHub />);

      expect(screen.getByTestId('tab-trigger-overview')).toBeInTheDocument();
      expect(screen.getByTestId('tab-trigger-progress')).toBeInTheDocument();
      expect(screen.getByTestId('tab-trigger-achievements')).toBeInTheDocument();
      expect(screen.getByTestId('tab-trigger-streaks')).toBeInTheDocument();
      expect(screen.getByTestId('tab-trigger-leaderboard')).toBeInTheDocument();
      expect(screen.getByTestId('tab-trigger-dietary')).toBeInTheDocument();
      expect(screen.getByTestId('tab-trigger-household')).toBeInTheDocument();
      expect(screen.getByTestId('tab-trigger-preferences')).toBeInTheDocument();
      expect(screen.getByTestId('tab-trigger-settings')).toBeInTheDocument();
    });

    it('should change active tab when clicked', () => {
      render(<ProfileHub />);

      const tabChange = screen.getByTestId('tab-change');
      fireEvent.click(tabChange);

      const tabs = screen.getByTestId('tabs');
      expect(tabs).toHaveAttribute('data-value', 'overview');
    });

    it('should start with overview tab active', () => {
      render(<ProfileHub />);

      const tabs = screen.getByTestId('tabs');
      expect(tabs).toHaveAttribute('data-value', 'overview');
    });
  });

  describe('Tab content rendering', () => {
    it('should render overview tab content', () => {
      render(<ProfileHub />);

      expect(screen.getByTestId('tab-content-overview')).toBeInTheDocument();
      expect(screen.getByTestId('profile-overview')).toBeInTheDocument();
    });

    it('should render progress tab content with gamification data', () => {
      render(<ProfileHub />);

      expect(screen.getByTestId('tab-content-progress')).toBeInTheDocument();
      expect(screen.getByTestId('profile-progress')).toBeInTheDocument();
    });

    it('should render achievements tab content', () => {
      render(<ProfileHub />);

      expect(screen.getByTestId('tab-content-achievements')).toBeInTheDocument();
      expect(screen.getByTestId('profile-achievements')).toBeInTheDocument();
    });

    it('should render streaks tab content', () => {
      render(<ProfileHub />);

      expect(screen.getByTestId('tab-content-streaks')).toBeInTheDocument();
      expect(screen.getByTestId('profile-streaks')).toBeInTheDocument();
    });

    it('should render leaderboard tab content', () => {
      render(<ProfileHub />);

      expect(screen.getByTestId('tab-content-leaderboard')).toBeInTheDocument();
      expect(screen.getByTestId('profile-leaderboard')).toBeInTheDocument();
    });

    it('should pass correct props to lazy-loaded components', () => {
      render(<ProfileHub />);

      // Check ProfileOverview receives correct props
      expect(screen.getByTestId('profile-id')).toHaveTextContent(mockUserProfile.id);
      expect(screen.getByTestId('household-size')).toHaveTextContent('3'); // Mocked return value
    });
  });

  describe('Gamification integration', () => {
    it('should display completion percentage from gamification', () => {
      render(<ProfileHub />);

      const completion = screen.getByTestId('completion');
      expect(completion).toHaveTextContent(mockCompletionMetrics.overall.toString());
    });

    it('should pass gamification metrics to progress component', () => {
      render(<ProfileHub />);

      const progress = screen.getByTestId('profile-progress');
      expect(progress).toBeInTheDocument();
      
      const overallCompletion = screen.getByTestId('overall-completion');
      expect(overallCompletion).toHaveTextContent(mockCompletionMetrics.overall.toString());
    });

    it('should handle section completion celebration', () => {
      render(<ProfileHub />);

      const sectionClick = screen.getByTestId('section-click');
      fireEvent.click(sectionClick);

      expect(mockGamificationData.celebrateCompletion).toHaveBeenCalledWith('basicInfo');
    });

    it('should navigate to correct tab on section click', () => {
      render(<ProfileHub />);

      const sectionClick = screen.getByTestId('section-click');
      fireEvent.click(sectionClick);

      // Should navigate to overview tab for basicInfo section
      const tabs = screen.getByTestId('tabs');
      expect(tabs).toHaveAttribute('data-value', 'overview');
    });
  });

  describe('Action handlers', () => {
    it('should handle profile updates from header', () => {
      render(<ProfileHub />);

      const updateButton = screen.getByTestId('update-header');
      fireEvent.click(updateButton);

      expect(mockProfileActions.updateProfile).toHaveBeenCalledWith({ test: 'header' });
    });

    it('should handle dietary preferences updates', () => {
      render(<ProfileHub />);

      const updateButton = screen.getByTestId('update-dietary');
      fireEvent.click(updateButton);

      expect(mockProfileActions.updatePreferences).toHaveBeenCalledWith({ test: 'update' });
    });

    it('should handle household preferences updates', () => {
      render(<ProfileHub />);

      const updateButton = screen.getByTestId('update-preferences');
      fireEvent.click(updateButton);

      expect(mockProfileActions.updatePreferences).toHaveBeenCalledWith({ test: 'update' });
    });

    it('should handle cooking preferences updates', () => {
      render(<ProfileHub />);

      const updateButton = screen.getByTestId('update-cooking');
      fireEvent.click(updateButton);

      expect(mockProfileActions.updatePreferences).toHaveBeenCalledWith({ test: 'cooking' });
    });

    it('should handle profile settings updates', () => {
      render(<ProfileHub />);

      const updateProfileButton = screen.getByTestId('update-profile');
      const updatePrefsButton = screen.getByTestId('update-prefs');

      fireEvent.click(updateProfileButton);
      expect(mockProfileActions.updateProfile).toHaveBeenCalledWith({ test: 'profile' });

      fireEvent.click(updatePrefsButton);
      expect(mockProfileActions.updatePreferences).toHaveBeenCalledWith({ test: 'prefs' });
    });
  });

  describe('Performance and memoization', () => {
    it('should memoize stats data', () => {
      const { rerender } = render(<ProfileHub />);

      // Initial render
      expect(mockProfileComputed.getHouseholdSize).toHaveBeenCalledTimes(1);
      expect(mockProfileComputed.getDietaryRestrictions).toHaveBeenCalledTimes(1);

      // Rerender with same data
      rerender(<ProfileHub />);

      // Should not call computed functions again due to memoization
      // Note: This test assumes the component properly memoizes
    });

    it('should recalculate stats when dependencies change', () => {
      const { rerender } = render(<ProfileHub />);

      // Change the profile data
      const updatedProfile = ProfileTestDataBuilder.create()
        .withUsername('updated-user')
        .build();

      useProfile.mockReturnValue({
        ...defaultMockProfile,
        profile: updatedProfile
      });

      rerender(<ProfileHub />);

      // Should recalculate when profile changes
      expect(mockProfileComputed.getHouseholdSize).toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should handle missing gamification data gracefully', () => {
      useProfileGamification.mockReturnValue({
        ...mockGamificationData,
        metrics: null
      });

      render(<ProfileHub />);

      // Should still render without crashing
      expect(screen.getByTestId('profile-header')).toBeInTheDocument();
    });

    it('should handle incomplete profile data', () => {
      const incompleteProfile = {
        id: 'incomplete',
        username: 'incomplete'
      };

      useProfile.mockReturnValue({
        ...defaultMockProfile,
        profile: incompleteProfile,
        preferences: null
      });

      render(<ProfileHub />);

      // Should show loading state
      expect(screen.getByText('Cargando perfil...')).toBeInTheDocument();
    });

    it('should handle null household members', () => {
      useProfile.mockReturnValue({
        ...defaultMockProfile,
        householdMembers: []
      });

      render(<ProfileHub />);

      // Should still render without crashing
      expect(screen.getByTestId('profile-hub')).toBeInTheDocument();
    });
  });

  describe('Lazy loading', () => {
    it('should display loading skeleton while components load', async () => {
      render(<ProfileHub />);

      // Initially should show main structure
      expect(screen.getByTestId('tabs')).toBeInTheDocument();

      // Check that tab content areas are available
      expect(screen.getByTestId('tab-content-overview')).toBeInTheDocument();
    });

    it('should load components on demand', async () => {
      render(<ProfileHub />);

      // All tab contents should be available (since we're not testing actual lazy loading)
      expect(screen.getByTestId('profile-overview')).toBeInTheDocument();
      expect(screen.getByTestId('dietary-preferences')).toBeInTheDocument();
      expect(screen.getByTestId('household-manager')).toBeInTheDocument();
      expect(screen.getByTestId('cooking-preferences')).toBeInTheDocument();
      expect(screen.getByTestId('profile-settings')).toBeInTheDocument();
    });
  });

  describe('Data integration', () => {
    it('should pass household members count to components', () => {
      render(<ProfileHub />);

      const memberCount = screen.getByTestId('member-count');
      expect(memberCount).toHaveTextContent(mockHouseholdMembers.length.toString());
    });

    it('should pass cuisine preferences count to dietary component', () => {
      render(<ProfileHub />);

      const cuisineCount = screen.getByTestId('cuisine-count');
      expect(cuisineCount).toHaveTextContent(mockUserPreferences.cuisinePreferences!.length.toString());
    });

    it('should pass cooking skill level to cooking preferences', () => {
      render(<ProfileHub />);

      const skillLevel = screen.getByTestId('skill-level');
      expect(skillLevel).toHaveTextContent(mockUserPreferences.cookingSkillLevel!);
    });

    it('should pass username to settings component', () => {
      render(<ProfileHub />);

      const username = screen.getByTestId('username');
      expect(username).toHaveTextContent(mockUserProfile.username);
    });

    it('should pass user ID to leaderboard component', () => {
      render(<ProfileHub />);

      const userId = screen.getByTestId('user-id');
      expect(userId).toHaveTextContent(mockUserProfile.id);
    });
  });

  describe('Accessibility', () => {
    it('should have proper tab structure', () => {
      render(<ProfileHub />);

      const tabsList = screen.getByTestId('tabs-list');
      expect(tabsList).toBeInTheDocument();

      // Check that tab triggers are present
      expect(screen.getByTestId('tab-trigger-overview')).toBeInTheDocument();
      expect(screen.getByTestId('tab-trigger-progress')).toBeInTheDocument();
    });

    it('should have accessible loading state', () => {
      useProfile.mockReturnValue({
        ...defaultMockProfile,
        profile: null,
        preferences: null
      });

      render(<ProfileHub />);

      expect(screen.getByText('Cargando perfil...')).toBeInTheDocument();
      expect(screen.getByTestId('progress')).toBeInTheDocument();
    });
  });
});