/**
 * @fileoverview Profile type definitions - Re-export from consolidated module
 * @module types/profile
 * 
 * This file maintains backward compatibility by re-exporting from the new
 * consolidated profile types module.
 */

// Re-export everything from the consolidated module
export * from './profile/index';

// Re-export utilities and migration helpers
export * from './profile/utils';
export * from './profile/migration';