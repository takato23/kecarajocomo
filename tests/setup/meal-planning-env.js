/**
 * Environment setup for meal planning tests
 */

// Mock environment variables for meal planning
process.env.GOOGLE_AI_API_KEY = 'test-gemini-api-key';
process.env.NEXTAUTH_SECRET = 'test-secret';
process.env.NEXTAUTH_URL = 'http://localhost:3000';

// Mock additional APIs that meal planning might use
process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY = 'test-gemini-public-key';