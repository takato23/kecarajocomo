# Authentication & Onboarding System

A comprehensive authentication and onboarding system built with Supabase, featuring secure session management, progressive user onboarding, and privacy-first design.

## Features

### 🔐 Authentication
- **Email/Password Authentication** with secure password validation
- **OAuth Integration** (Google, GitHub) with automatic profile creation
- **Password Reset** with secure email verification
- **Session Management** with HTTP-only cookies for enhanced security
- **Multi-Factor Authentication** support (future enhancement)

### 🚀 Onboarding Flow
- **Progressive Wizard** with 6 comprehensive steps
- **Profile Setup** with avatar upload and bio
- **Dietary Preferences** with restrictions and allergies tracking
- **Cooking Preferences** including skill level and time preferences
- **Nutrition Goals** with customizable targets
- **Pantry Setup** with categorized inventory management
- **AI Meal Plan Preview** showing personalized suggestions

### 🛡️ Security
- **Row Level Security (RLS)** ensuring data isolation
- **Secure Session Storage** with HTTP-only cookies
- **Rate Limiting** on authentication endpoints
- **CSRF Protection** with SameSite cookies
- **Security Headers** including CSP and X-Frame-Options
- **Input Validation** and sanitization

### 📱 User Experience
- **Responsive Design** optimized for mobile and desktop
- **Real-time Validation** with immediate feedback
- **Progress Tracking** with visual completion indicators
- **Graceful Error Handling** with user-friendly messages
- **Offline Support** for core authentication features

## Architecture

### Tech Stack
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Authentication**: Supabase Auth with custom session management
- **State Management**: Zustand with persistence
- **Database**: PostgreSQL with RLS policies
- **Security**: Edge middleware with comprehensive protection

### Component Structure
```
features/auth/
├── components/
│   ├── SignInForm.tsx          # Email/password sign in
│   ├── SignUpForm.tsx          # Registration with validation
│   ├── OnboardingWizard.tsx    # Multi-step onboarding
│   └── onboarding/
│       ├── WelcomeStep.tsx     # Introduction and overview
│       ├── ProfileSetupStep.tsx # Basic profile information
│       ├── DietaryPreferencesStep.tsx # Diet restrictions/allergies
│       └── CookingPreferencesStep.tsx # Cooking skill/preferences
├── services/
│   └── authService.ts          # Authentication business logic
├── store/
│   ├── authStore.ts           # Authentication state management
│   └── onboardingStore.ts     # Onboarding flow state
├── middleware/
│   └── authMiddleware.ts      # Route protection and security
├── api/
│   └── session/route.ts       # Secure session management
├── types/
│   └── index.ts              # TypeScript definitions
└── supabase/
    └── auth-schema.sql       # Database schema and policies
```

## Database Schema

### Core Tables
- **user_profiles** - Extended user information beyond Supabase auth
- **user_preferences** - Dietary, cooking, and nutrition preferences
- **pantry_items** - User's pantry inventory with expiration tracking
- **meal_plans** - Weekly meal plans with AI generation tracking
- **planned_meals** - Individual meals within meal plans

### Security Features
- **Row Level Security** on all user data tables
- **Automatic triggers** for updated_at timestamps
- **User isolation** preventing cross-user data access
- **Audit logging** for security monitoring

## Usage

### Basic Implementation

```tsx
import { useAuthStore, OnboardingWizard } from '@/features/auth';

function App() {
  const { user, isLoading } = useAuthStore();
  
  if (isLoading) return <LoadingSpinner />;
  
  return user ? <Dashboard /> : <SignInForm />;
}
```

### Protecting Routes

```tsx
// middleware.ts
import { authMiddleware } from '@/features/auth';

export async function middleware(request: NextRequest) {
  return authMiddleware(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
```

### Custom Onboarding Integration

```tsx
import { useOnboardingStore, selectOnboardingProgress } from '@/features/auth';

function CustomOnboarding() {
  const { currentStep, nextStep, data } = useOnboardingStore();
  const progress = useOnboardingStore(selectOnboardingProgress);
  
  return (
    <div>
      <ProgressBar value={progress} />
      <OnboardingStep step={currentStep} onNext={nextStep} />
    </div>
  );
}
```

## Environment Variables

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Security Configuration
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Optional: OAuth Provider Keys
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

## Security Considerations

### Authentication Security
- **Password Strength** validation with visual feedback
- **Session Security** with HTTP-only cookies and SameSite protection
- **Rate Limiting** to prevent brute force attacks
- **Email Verification** for account activation
- **Secure Password Reset** with time-limited tokens

### Data Protection
- **Row Level Security** isolating user data
- **Input Sanitization** preventing XSS attacks
- **CSRF Protection** with secure cookie settings
- **Encryption at Rest** for sensitive user data
- **Audit Logging** for security monitoring

### Privacy Features
- **Minimal Data Collection** - only necessary information
- **User Control** over data sharing and preferences
- **GDPR Compliance** with data export and deletion
- **Transparent Privacy Policy** with clear explanations
- **Opt-in Analytics** with user consent

## Performance Optimizations

### Client-Side Performance
- **Code Splitting** for onboarding components
- **Lazy Loading** of non-critical components
- **Optimized Images** with Next.js Image component
- **State Persistence** with efficient storage
- **Debounced Validation** reducing API calls

### Server-Side Performance
- **Database Indexing** on frequently queried fields
- **Connection Pooling** for optimal database usage
- **Caching Strategies** for static and user data
- **Edge Middleware** for minimal latency
- **Optimized Queries** with minimal data transfer

## Testing Strategy

### Unit Tests
- Authentication service methods
- Store state management logic
- Form validation functions
- Utility helper functions

### Integration Tests
- Complete authentication flows
- Onboarding step progression
- Database operations with RLS
- API endpoint functionality

### E2E Tests
- User registration and login
- Complete onboarding journey
- Session persistence across visits
- Password reset flow

## Future Enhancements

### Authentication Features
- [ ] Multi-factor authentication (SMS, TOTP)
- [ ] Social login expansion (Apple, Microsoft)
- [ ] Passwordless authentication (magic links)
- [ ] Device management and trusted devices
- [ ] Advanced session management

### Onboarding Improvements
- [ ] Adaptive onboarding based on user type
- [ ] Skip options for experienced users
- [ ] Integration with external health apps
- [ ] Voice-guided onboarding
- [ ] Accessibility enhancements

### Security Enhancements
- [ ] Advanced fraud detection
- [ ] Biometric authentication support
- [ ] Zero-knowledge architecture
- [ ] Enhanced audit logging
- [ ] Security key support (WebAuthn)

## Monitoring & Analytics

### Security Monitoring
- Failed authentication attempts
- Suspicious session patterns
- Rate limiting triggers
- Data access patterns

### User Experience Analytics
- Onboarding completion rates
- Step abandonment analysis
- Authentication method preferences
- Performance metrics

### Business Metrics
- User registration rates
- Onboarding conversion
- Feature adoption tracking
- User engagement patterns

## Support & Troubleshooting

### Common Issues
1. **Session Persistence** - Check cookie settings and HTTPS configuration
2. **OAuth Redirects** - Verify callback URLs in provider settings
3. **RLS Policies** - Ensure proper user context in database queries
4. **Rate Limiting** - Adjust limits based on legitimate usage patterns

### Debug Mode
Enable debug logging by setting `NEXT_PUBLIC_DEBUG_AUTH=true` in development:

```tsx
// Enable detailed authentication logging
if (process.env.NEXT_PUBLIC_DEBUG_AUTH === 'true') {
  authService.enableDebugMode();
}
```

### Error Handling
The system includes comprehensive error handling with user-friendly messages and detailed logging for debugging.

## Contributing

When contributing to the authentication system:

1. **Security First** - All changes must maintain or improve security
2. **Privacy by Design** - Consider privacy implications of new features
3. **Backward Compatibility** - Ensure existing users aren't affected
4. **Testing Required** - Include tests for authentication flows
5. **Documentation** - Update relevant documentation

For detailed contribution guidelines, see the main project README.