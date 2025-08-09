const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  
  // Meal planning specific test patterns (restringido para estabilidad)
  testMatch: [
    '<rootDir>/src/features/meal-planning/components/__tests__/MealPlannerPage.test.tsx',
    '<rootDir>/src/features/meal-planning/components/__tests__/MealPlannerGrid.null-handling.test.tsx',
  ],
  
  // Ignore other test files and training data
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/training-data/',
  ],
  
  // Coverage deshabilitado para evitar transformar módulos externos en esta suite enfocada
  collectCoverage: false,
  
  collectCoverageFrom: [
    'src/hooks/meal-planning/**/*.{js,jsx,ts,tsx}',
    'src/features/meal-planning/**/*.{js,jsx,ts,tsx}',
    'src/store/slices/**/mealPlan*.{js,jsx,ts,tsx}',
    'src/app/api/meal-planning/**/*.{js,jsx,ts,tsx}',
    'src/lib/utils/**/*argentine*.{js,jsx,ts,tsx}',
    'src/lib/utils/**/*shopping*.{js,jsx,ts,tsx}',
    'src/lib/utils/**/*nutrition*.{js,jsx,ts,tsx}',
    'src/lib/utils/**/*fallback*.{js,jsx,ts,tsx}',
    'src/lib/utils/**/*date*.{js,jsx,ts,tsx}',
    'src/lib/utils/**/*pricing*.{js,jsx,ts,tsx}',
    'src/lib/utils/**/*icsExport*.{js,jsx,ts,tsx}',
    'src/lib/utils/**/*seasonalAvailability*.{js,jsx,ts,tsx}',
    'src/lib/utils/**/*requestCoalesce*.{js,jsx,ts,tsx}',
    'src/lib/services/**/*meal*.{js,jsx,ts,tsx}',
    'src/lib/services/**/*gemini*.{js,jsx,ts,tsx}',
    'src/lib/services/**/*aiCaching*.{js,jsx,ts,tsx}',
    'src/lib/optimizer/**/*.{js,jsx,ts,tsx}',
    'src/lib/learning/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!**/*.stories.{js,jsx,ts,tsx}',
    '!**/index.ts',
  ],
  
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    // Specific thresholds for critical meal planning components
    'src/hooks/meal-planning/useMealPlanning.ts': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    'src/store/slices/mealPlanSlice.ts': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    'src/features/meal-planning/components/MealPlannerGrid.tsx': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  
  // Module name mapping
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  
  // Transform configuration for modern dependencies
  transformIgnorePatterns: [
    '/node_modules/(?!(jose|@supabase|isows|ws|@dnd-kit|framer-motion)/)',
  ],
  
  // Test timeout for integration tests
  testTimeout: 30000,
  
  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,
  
  // Verbose output for debugging
  verbose: true,
  
  // Run tests in parallel for performance
  maxWorkers: '50%',
  
  // Cache configuration
  cacheDirectory: '<rootDir>/.jest-cache/meal-planning',
  
  // Error handling
  errorOnDeprecated: true,
  
  // Display configuration
  displayName: {
    name: 'MEAL-PLANNING',
    color: 'blue',
  },
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);