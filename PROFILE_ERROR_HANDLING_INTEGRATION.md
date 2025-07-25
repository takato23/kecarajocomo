# Profile Error Handling Integration Guide

## Overview

This guide shows how to integrate the comprehensive error handling system into your existing profile components. The error handling system provides:

1. **React Error Boundaries** for UI error catching
2. **Standardized Error Services** for consistent error processing
3. **User-friendly Spanish messages** for better UX
4. **Recovery Strategies** with exponential backoff
5. **Error Logging and Monitoring** for debugging
6. **Graceful Degradation** for missing features

## Files Created

### 1. ProfileErrorBoundary.tsx
- **Location**: `src/components/profile/error/ProfileErrorBoundary.tsx`
- **Purpose**: React error boundaries specialized for profile components
- **Features**: Intelligent error categorization, auto-retry, Spanish messages

### 2. ProfileErrorHandler.ts
- **Location**: `src/services/error/ProfileErrorHandler.ts`
- **Purpose**: Centralized error handling with Spanish user messages
- **Features**: Error classification, recovery strategies, user notifications

### 3. ErrorReporting.ts
- **Location**: `src/lib/error/ErrorReporting.ts`
- **Purpose**: Error logging and monitoring with multiple backends
- **Features**: Console, Sentry, and offline storage support

### 4. useErrorRecovery.ts
- **Location**: `src/hooks/useErrorRecovery.ts`
- **Purpose**: React hook for error recovery with retry mechanisms
- **Features**: Exponential backoff, specialized hooks for save/load/validation

## Quick Integration Examples

### Basic Error Boundary Wrapper

```tsx
import { ProfileSectionErrorBoundary } from '@/components/profile/error/ProfileErrorBoundary';

// Wrap any profile section
<ProfileSectionErrorBoundary context="UserPreferences">
  <UserPreferencesForm />
</ProfileSectionErrorBoundary>
```

### Error Recovery Hook Usage

```tsx
import { useErrorRecovery } from '@/hooks/useErrorRecovery';

function MyProfileComponent() {
  const errorRecovery = useErrorRecovery({
    maxRetries: 3,
    autoRetry: true,
    component: 'UserPreferences'
  });

  const handleSave = async () => {
    try {
      await saveProfile();
    } catch (error) {
      await errorRecovery.handleError(error);
    }
  };

  if (errorRecovery.hasError) {
    return (
      <div className="error-state">
        <p>{errorRecovery.error?.message}</p>
        {errorRecovery.canRetry && (
          <button onClick={() => errorRecovery.retry()}>
            Reintentar
          </button>
        )}
      </div>
    );
  }

  // Normal component render
}
```

### Specialized Save/Load Hooks

```tsx
import { useProfileSaveRecovery, useProfileLoadRecovery } from '@/hooks/useErrorRecovery';

function ProfileForm() {
  const saveRecovery = useProfileSaveRecovery(async () => {
    await profileService.save(formData);
  });

  const loadRecovery = useProfileLoadRecovery(async () => {
    const data = await profileService.load();
    setFormData(data);
  });

  // Use saveRecovery.saveWithRecovery() instead of direct save
  // Use loadRecovery.loadWithRecovery() instead of direct load
}
```

## Error Types and Messages

### Validation Errors
```tsx
import { useProfileValidationRecovery } from '@/hooks/useErrorRecovery';

const validationRecovery = useProfileValidationRecovery();

// Handle validation errors
const errors = { email: 'Email no válido', budget: 'Presupuesto requerido' };
await validationRecovery.handleValidationError(errors, formData);
```

### Network and Service Errors
```tsx
import { ProfileErrorFactory } from '@/services/error/ProfileErrorHandler';

// Create specific error types
const networkError = ProfileErrorFactory.networkError(originalError);
const authError = ProfileErrorFactory.authenticationRequired();
const saveError = ProfileErrorFactory.saveFailed('Connection timeout');
```

## Error Boundary Levels

### 1. Page Level - ProfilePageErrorBoundary
```tsx
import { ProfilePageErrorBoundary } from '@/components/profile/error/ProfileErrorBoundary';

function ProfilePage() {
  return (
    <ProfilePageErrorBoundary autoRetry={true} maxRetries={3}>
      <ProfileView />
    </ProfilePageErrorBoundary>
  );
}
```

### 2. Section Level - ProfileSectionErrorBoundary
```tsx
import { ProfileSectionErrorBoundary } from '@/components/profile/error/ProfileErrorBoundary';

function ProfileSettings() {
  return (
    <div>
      <ProfileSectionErrorBoundary context="BasicInfo">
        <BasicInfoForm />
      </ProfileSectionErrorBoundary>
      
      <ProfileSectionErrorBoundary context="Preferences">
        <PreferencesForm />
      </ProfileSectionErrorBoundary>
    </div>
  );
}
```

### 3. Component Level - ProfileComponentErrorBoundary
```tsx
import { ProfileComponentErrorBoundary } from '@/components/profile/error/ProfileErrorBoundary';

function DietaryRestrictions() {
  return (
    <div>
      {restrictions.map(restriction => (
        <ProfileComponentErrorBoundary 
          key={restriction.id} 
          context={`Restriction-${restriction.id}`}
        >
          <RestrictionToggle restriction={restriction} />
        </ProfileComponentErrorBoundary>
      ))}
    </div>
  );
}
```

## Error Recovery Actions

The system provides intelligent recovery actions based on error type:

### Network Errors
- **Strategy**: `retry_with_backoff`
- **Actions**: Retry button, reload page
- **Auto-retry**: Yes (up to 3 times)

### Validation Errors
- **Strategy**: `manual_intervention`
- **Actions**: Review data button
- **Auto-retry**: No

### Authentication Errors
- **Strategy**: `redirect_login`
- **Actions**: Login button
- **Auto-retry**: No

### Service Unavailable
- **Strategy**: `retry_with_backoff`
- **Actions**: Retry button, try later
- **Auto-retry**: Yes

## Error Monitoring Integration

### Development
```tsx
// Automatic console logging
console.error('[ProfileErrorBoundary]', errorData);
```

### Production
```tsx
// Integrate with Sentry (optional)
// Set NEXT_PUBLIC_SENTRY_DSN environment variable

// Or implement custom monitoring
const errorReportingService = ErrorReportingService.getInstance();
await errorReportingService.reportError(error, context);
```

### Offline Support
```tsx
// Automatic offline storage
// Syncs when connection restored
window.addEventListener('online', () => {
  errorReportingService.syncOfflineReports();
});
```

## Integration Checklist

### ✅ Step 1: Wrap Components with Error Boundaries
- [ ] Page level: `ProfilePageErrorBoundary`
- [ ] Section level: `ProfileSectionErrorBoundary`  
- [ ] Component level: `ProfileComponentErrorBoundary`

### ✅ Step 2: Add Error Recovery Hooks
- [ ] General: `useErrorRecovery`
- [ ] Save operations: `useProfileSaveRecovery`
- [ ] Load operations: `useProfileLoadRecovery`
- [ ] Validation: `useProfileValidationRecovery`

### ✅ Step 3: Update Existing Error Handling
- [ ] Replace try-catch with error recovery hooks
- [ ] Use `ProfileErrorFactory` for creating errors
- [ ] Add context information to errors

### ✅ Step 4: Configure Monitoring
- [ ] Set up console logging (development)
- [ ] Configure Sentry DSN (production)
- [ ] Test offline error storage

### ✅ Step 5: Test Error Scenarios
- [ ] Network failures
- [ ] Validation errors
- [ ] Service unavailable
- [ ] Authentication failures
- [ ] Auto-save conflicts

## Error Message Examples

All error messages are in Spanish for better user experience:

- **Network**: "Error de conexión. Verifica tu internet e intenta nuevamente."
- **Validation**: "Los datos del perfil contienen información inválida. Por favor, revisa los campos marcados."
- **Auth**: "Tu sesión ha expirado. Por favor, inicia sesión nuevamente."
- **Save Failed**: "No se pudieron guardar los cambios del perfil. Intenta nuevamente."
- **Service Unavailable**: "El servicio no está disponible temporalmente. Intenta en unos minutos."

## Best Practices

### 1. Context Information
Always provide context when handling errors:
```tsx
await errorRecovery.handleError(error, {
  operation: 'save_profile',
  component: 'DietaryRestrictions',
  userId: user.id,
  formData: sanitizedFormData
});
```

### 2. Graceful Degradation
Handle partial failures gracefully:
```tsx
if (autoSaveError) {
  // Show manual save button
  // Continue with form functionality
}
```

### 3. User Feedback
Provide clear, actionable feedback:
```tsx
// Good: Specific and actionable
"No se pudo guardar el presupuesto. Verifica que sea un número positivo."

// Bad: Generic and unhelpful
"Error"
```

### 4. Recovery Options
Always provide recovery options:
```tsx
const recoveryActions = [
  { label: 'Reintentar', action: retry, primary: true },
  { label: 'Ir al Inicio', action: goHome, variant: 'ghost' }
];
```

This comprehensive error handling system ensures your profile components are robust, user-friendly, and provide excellent error recovery capabilities with Spanish language support.