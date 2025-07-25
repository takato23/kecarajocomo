// Auth Feature Module Exports

// Types
export * from './types';

// Services
export { AuthService } from './services/authService';

// Stores - Using centralized store now
export { useAppStore, useUser, useUserActions } from '@/store';
export { useOnboardingStore, selectIsStepCompleted, selectCanNavigateToStep, selectOnboardingProgress } from './store/onboardingStore';

// Backward compatibility selectors
export const selectIsAuthenticated = (state: any) => state.user?.isAuthenticated || false;
export const selectIsOnboarded = (state: any) => !!state.user?.profile;
export const selectNeedsOnboarding = (state: any) => !state.user?.profile && state.user?.isAuthenticated;

// Components
export { SignInForm } from './components/SignInForm';
export { SignUpForm } from './components/SignUpForm';
export { OnboardingWizard } from './components/OnboardingWizard';

// Onboarding Steps
export { WelcomeStep } from './components/onboarding/WelcomeStep';
export { ProfileSetupStep } from './components/onboarding/ProfileSetupStep';
export { DietaryPreferencesStep } from './components/onboarding/DietaryPreferencesStep';
export { CookingPreferencesStep } from './components/onboarding/CookingPreferencesStep';
export { NutritionGoalsStep } from './components/onboarding/NutritionGoalsStep';
export { PantrySetupStep } from './components/onboarding/PantrySetupStep';
export { MealPlanPreviewStep } from './components/onboarding/MealPlanPreviewStep';
export { CompletionStep } from './components/onboarding/CompletionStep';

// Middleware
export { authMiddleware, getAuthenticatedUser, requireAuth, checkPermission, rateLimit, addSecurityHeaders } from './middleware/authMiddleware';