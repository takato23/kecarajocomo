// Auth Feature Module Exports

// Types
export * from './types';

// Services
export { AuthService } from './services/authService';

// Stores
export { useAuthStore, selectIsAuthenticated, selectIsOnboarded, selectNeedsOnboarding } from './store/authStore';
export { useOnboardingStore, selectIsStepCompleted, selectCanNavigateToStep, selectOnboardingProgress } from './store/onboardingStore';

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