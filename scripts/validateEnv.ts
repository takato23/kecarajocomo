#!/usr/bin/env node

/**
 * Environment Variable Validation Script
 * Ensures all required environment variables are set before deployment
 */

import { z } from 'zod';

// Define the environment schema
const envSchema = z.object({
  // Required: Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().startsWith('https://'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // Required: AI (at least one)
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  GOOGLE_GEMINI_API_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_GEMINI_API_KEY: z.string().min(1).optional(),

  // Required: Security
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url(),

  // Required: App
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_APP_NAME: z.string().min(1),

  // Optional: OAuth
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),

  // Optional: Monitoring
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_VERCEL_ANALYTICS_ID: z.string().optional(),

  // Optional: Features
  NEXT_PUBLIC_FEATURE_VOICE_INPUT: z.enum(['true', 'false']).optional(),
  NEXT_PUBLIC_FEATURE_BARCODE_SCANNER: z.enum(['true', 'false']).optional(),
  NEXT_PUBLIC_FEATURE_OCR: z.enum(['true', 'false']).optional(),
  NEXT_PUBLIC_FEATURE_MEAL_PLANNING: z.enum(['true', 'false']).optional(),
  NEXT_PUBLIC_FEATURE_PRICE_TRACKING: z.enum(['true', 'false']).optional(),
  NEXT_PUBLIC_FEATURE_NOTIFICATIONS: z.enum(['true', 'false']).optional(),
  NEXT_PUBLIC_FEATURE_OFFLINE_MODE: z.enum(['true', 'false']).optional(),

  // Environment
  NODE_ENV: z.enum(['development', 'test', 'production']).optional(),
}).refine(
  (data) => data.ANTHROPIC_API_KEY || data.GOOGLE_GEMINI_API_KEY,
  {
    message: "At least one AI provider API key must be configured (ANTHROPIC_API_KEY or GOOGLE_GEMINI_API_KEY)",
  }
);

type EnvSchema = z.infer<typeof envSchema>;

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function validateEnvironment(): { 
  valid: boolean; 
  errors: string[]; 
  warnings: string[];
  info: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const info: string[] = [];

  try {
    // Parse environment variables
    const env = envSchema.parse(process.env);

    // Additional validations
    if (process.env.NODE_ENV === 'production') {
      // Production-specific checks
      if (!env.NEXT_PUBLIC_SENTRY_DSN) {
        warnings.push('NEXT_PUBLIC_SENTRY_DSN not set - Error tracking disabled');
      }

      if (!env.NEXT_PUBLIC_GA_MEASUREMENT_ID && !env.NEXT_PUBLIC_POSTHOG_KEY) {
        warnings.push('No analytics configured - Consider adding GA or PostHog');
      }

      if (env.NEXT_PUBLIC_DEBUG_AUTH === 'true' || env.NEXT_PUBLIC_DEBUG_AI === 'true') {
        errors.push('Debug mode must be disabled in production');
      }

      if (!env.GOOGLE_CLIENT_ID && !env.GITHUB_CLIENT_ID) {
        warnings.push('No OAuth providers configured - Only email login available');
      }

      // Check for localhost URLs
      if (env.NEXTAUTH_URL.includes('localhost') || env.NEXT_PUBLIC_APP_URL.includes('localhost')) {
        errors.push('Production URLs cannot contain localhost');
      }
    }

    // Feature flag info
    const features = {
      'Voice Input': env.NEXT_PUBLIC_FEATURE_VOICE_INPUT,
      'Barcode Scanner': env.NEXT_PUBLIC_FEATURE_BARCODE_SCANNER,
      'OCR': env.NEXT_PUBLIC_FEATURE_OCR,
      'Meal Planning': env.NEXT_PUBLIC_FEATURE_MEAL_PLANNING,
      'Price Tracking': env.NEXT_PUBLIC_FEATURE_PRICE_TRACKING,
      'Notifications': env.NEXT_PUBLIC_FEATURE_NOTIFICATIONS,
      'Offline Mode': env.NEXT_PUBLIC_FEATURE_OFFLINE_MODE,
    };

    const enabledFeatures = Object.entries(features)
      .filter(([_, value]) => value === 'true')
      .map(([key]) => key);

    if (enabledFeatures.length > 0) {
      info.push(`Enabled features: ${enabledFeatures.join(', ')}`);
    }

    // AI Provider info
    const aiProviders = [];
    if (env.ANTHROPIC_API_KEY) aiProviders.push('Claude (Anthropic)');
    if (env.GOOGLE_GEMINI_API_KEY) aiProviders.push('Gemini (Google)');
    info.push(`AI Providers: ${aiProviders.join(', ')}`);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      info,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      errors.push(...error.errors.map(err => `${err.path.join('.')}: ${err.message}`));
    } else {
      errors.push(`Unexpected error: ${error}`);
    }

    return {
      valid: false,
      errors,
      warnings,
      info,
    };
  }
}

// Run validation
console.log(`${colors.cyan}🔍 Validating environment variables...${colors.reset}\n`);

const { valid, errors, warnings, info } = validateEnvironment();

// Display results
if (info.length > 0) {
  console.log(`${colors.blue}ℹ️  Info:${colors.reset}`);
  info.forEach(msg => console.log(`   ${msg}`));
  console.log();
}

if (warnings.length > 0) {
  console.log(`${colors.yellow}⚠️  Warnings:${colors.reset}`);
  warnings.forEach(warning => console.log(`   ${warning}`));
  console.log();
}

if (errors.length > 0) {
  console.log(`${colors.red}❌ Errors:${colors.reset}`);
  errors.forEach(error => console.log(`   ${error}`));
  console.log();
}

if (valid) {
  console.log(`${colors.green}✅ Environment validation passed!${colors.reset}`);
  console.log(`${colors.green}   Ready for deployment.${colors.reset}\n`);
  process.exit(0);
} else {
  console.log(`${colors.red}❌ Environment validation failed!${colors.reset}`);
  console.log(`${colors.red}   Please fix the errors above before deploying.${colors.reset}\n`);
  process.exit(1);
}

export { envSchema, validateEnvironment };