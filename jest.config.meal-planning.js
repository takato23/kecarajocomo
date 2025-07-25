const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  
  // Only run meal planning tests
  testMatch: [
    '<rootDir>/tests/__tests__/features/meal-planning/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/tests/__tests__/api/meal-planning/**/*.test.{js,jsx,ts,tsx}'
  ],
  
  // Ignore other test files and training data
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/training-data/',
    '<rootDir>/tests/__tests__/(?!features/meal-planning|api/meal-planning)'
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/features/meal-planning/**/*.{js,jsx,ts,tsx}',
    'src/lib/services/geminiPlanner*.{js,jsx,ts,tsx}',
    'src/app/api/meal-planning/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  
  // Module name mapping
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  
  // Transform configuration
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  
  // Setup files for environment variables
  setupFiles: ['<rootDir>/tests/setup/meal-planning-env.js'],
  
  // Test timeout
  testTimeout: 30000,
  
  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,
  
  // Verbose output
  verbose: true,
  
  // Display individual test results
  displayName: {
    name: 'MEAL-PLANNING',
    color: 'blue',
  },
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);