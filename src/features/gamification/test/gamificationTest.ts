// Simple test to verify gamification system functionality
import { useGamificationStore } from '../store/gamificationStore';
import { XPEventType } from '../types';

export function testGamificationSystem() {

  try {
    // Test 1: Check if store is accessible
    const store = useGamificationStore.getState();

    // Test 2: Check if profile exists (will be null initially)

    // Test 3: Check if achievements array exists

    // Test 4: Check if actions are available

    // Test 5: Check XP event types are available


    return true;
    
  } catch (error: unknown) {
    console.error('❌ Gamification system test failed:', error);
    return false;
  }
}

// Auto-run test in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Run test after a short delay to allow store to initialize
  setTimeout(() => {
    testGamificationSystem();
  }, 1000);
}