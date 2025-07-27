/**
 * Settings Slice - Application settings management
 */

import { StateCreator } from 'zustand';
import { logger } from '@/services/logger';

export interface AppSettings {
  version: number;
  general: {
    autoSave: boolean;
    autoSync: boolean;
    syncInterval: number; // in minutes
    offlineMode: boolean;
    dataCompression: boolean;
    maxCacheSize: number; // in MB
  };
  notifications: {
    enabled: boolean;
    types: {
      lowStock: boolean;
      expiration: boolean;
      mealReminders: boolean;
      priceAlerts: boolean;
      newRecipes: boolean;
      shoppingReminders: boolean;
      systemUpdates: boolean;
    };
    timing: {
      lowStock: number; // days before
      expiration: number; // days before
      mealPrep: string; // time of day
      shopping: string; // day of week
    };
    delivery: {
      push: boolean;
      email: boolean;
      sms: boolean;
    };
  };
  privacy: {
    analytics: boolean;
    crashReporting: boolean;
    usageData: boolean;
    personalizedAds: boolean;
    dataSharing: boolean;
    locationTracking: boolean;
  };
  security: {
    biometricAuth: boolean;
    autoLock: boolean;
    lockTimeout: number; // in minutes
    encryptData: boolean;
    sessionTimeout: number; // in hours
    requireAuthForSensitive: boolean;
  };
  voice: {
    enabled: boolean;
    language: string;
    voiceModel: 'standard' | 'premium';
    wakeWord: boolean;
    noiseReduction: boolean;
    confidenceThreshold: number; // 0-1
  };
  scanning: {
    enabled: boolean;
    autoEnhance: boolean;
    multipleFormats: boolean;
    saveImages: boolean;
    ocrLanguage: string;
    quality: 'low' | 'medium' | 'high';
  };
  ai: {
    enabled: boolean;
    model: 'standard' | 'premium';
    creativity: number; // 0-1, how creative AI suggestions should be
    dietary: string[]; // dietary preferences for AI
    allergies: string[];
    cuisinePreference: string[];
    maxSuggestions: number;
    learningEnabled: boolean;
  };
  storage: {
    cloudSync: boolean;
    localBackup: boolean;
    backupFrequency: 'daily' | 'weekly' | 'monthly';
    retentionPeriod: number; // in days
    autoCleanup: boolean;
    exportFormat: 'json' | 'csv' | 'pdf';
  };
  performance: {
    animations: boolean;
    backgroundSync: boolean;
    preloadImages: boolean;
    cacheStrategy: 'aggressive' | 'balanced' | 'minimal';
    batchOperations: boolean;
    optimizeForBattery: boolean;
  };
  accessibility: {
    screenReader: boolean;
    highContrast: boolean;
    largeText: boolean;
    reduceMotion: boolean;
    voiceNavigation: boolean;
    keyboardNavigation: boolean;
  };
  developer: {
    debugMode: boolean;
    showMetrics: boolean;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
    enableDevTools: boolean;
    apiLogging: boolean;
  };
}

export interface SettingsSlice {
  settings: AppSettings;
  
  // Actions
  updateSettings: (path: string, value: any) => void;
  resetSettings: () => void;
  resetSection: (section: keyof AppSettings) => void;
  exportData: () => Promise<string>;
  importData: (data: string) => Promise<boolean>;
  validateSettings: () => boolean;
  migrateSettings: (fromVersion: number, toVersion: number) => void;
}

const defaultSettings: AppSettings = {
  version: 1,
  general: {
    autoSave: true,
    autoSync: true,
    syncInterval: 15,
    offlineMode: false,
    dataCompression: true,
    maxCacheSize: 100
  },
  notifications: {
    enabled: true,
    types: {
      lowStock: true,
      expiration: true,
      mealReminders: true,
      priceAlerts: true,
      newRecipes: false,
      shoppingReminders: true,
      systemUpdates: true
    },
    timing: {
      lowStock: 3,
      expiration: 2,
      mealPrep: '18:00',
      shopping: 'sunday'
    },
    delivery: {
      push: true,
      email: false,
      sms: false
    }
  },
  privacy: {
    analytics: true,
    crashReporting: true,
    usageData: false,
    personalizedAds: false,
    dataSharing: false,
    locationTracking: false
  },
  security: {
    biometricAuth: false,
    autoLock: false,
    lockTimeout: 5,
    encryptData: true,
    sessionTimeout: 24,
    requireAuthForSensitive: true
  },
  voice: {
    enabled: true,
    language: 'es-ES',
    voiceModel: 'standard',
    wakeWord: false,
    noiseReduction: true,
    confidenceThreshold: 0.7
  },
  scanning: {
    enabled: true,
    autoEnhance: true,
    multipleFormats: true,
    saveImages: false,
    ocrLanguage: 'es',
    quality: 'medium'
  },
  ai: {
    enabled: true,
    model: 'standard',
    creativity: 0.7,
    dietary: [],
    allergies: [],
    cuisinePreference: ['argentina', 'italiana'],
    maxSuggestions: 5,
    learningEnabled: true
  },
  storage: {
    cloudSync: true,
    localBackup: true,
    backupFrequency: 'weekly',
    retentionPeriod: 90,
    autoCleanup: true,
    exportFormat: 'json'
  },
  performance: {
    animations: true,
    backgroundSync: true,
    preloadImages: true,
    cacheStrategy: 'balanced',
    batchOperations: true,
    optimizeForBattery: false
  },
  accessibility: {
    screenReader: false,
    highContrast: false,
    largeText: false,
    reduceMotion: false,
    voiceNavigation: false,
    keyboardNavigation: true
  },
  developer: {
    debugMode: false,
    showMetrics: false,
    logLevel: 'error',
    enableDevTools: false,
    apiLogging: false
  }
};

export const createSettingsSlice: StateCreator<SettingsSlice> = (set, get) => ({
  settings: defaultSettings,
  
  updateSettings: (path, value) => set((state) => {
    const keys = path.split('.');
    let current: any = state.settings;
    
    // Navigate to the parent object
    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in current)) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    // Set the value
    const lastKey = keys[keys.length - 1];
    current[lastKey] = value;
    
    // Validate settings after update
    get().validateSettings();
  }),
  
  resetSettings: () => set((state) => {
    state.settings = { ...defaultSettings };
  }),
  
  resetSection: (section) => set((state) => {
    state.settings[section] = { ...defaultSettings[section] };
  }),
  
  exportData: async () => {
    const state = get();
    const exportData = {
      settings: state.settings,
      exportedAt: new Date().toISOString(),
      version: state.settings.version
    };
    
    return JSON.stringify(exportData, null, 2);
  },
  
  importData: async (data) => {
    try {
      const importedData = JSON.parse(data);
      
      // Validate imported data structure
      if (!importedData.settings || !importedData.version) {
        throw new Error('Invalid data format');
      }
      
      // Check version compatibility
      if (importedData.version > defaultSettings.version) {
        throw new Error('Data from newer version not supported');
      }
      
      set((state) => {
        // Merge imported settings with defaults to ensure all fields exist
        state.settings = { ...defaultSettings, ...importedData.settings };
        
        // Migrate if necessary
        if (importedData.version < defaultSettings.version) {
          get().migrateSettings(importedData.version, defaultSettings.version);
        }
      });
      
      return true;
    } catch (error: unknown) {
      logger.error('Failed to import settings:', 'Store:settingsSlice', error);
      return false;
    }
  },
  
  validateSettings: () => {
    const settings = get().settings;
    let isValid = true;
    
    // Validate ranges and constraints
    if (settings.general.syncInterval < 1 || settings.general.syncInterval > 1440) {
      set((state) => { state.settings.general.syncInterval = 15; });
      isValid = false;
    }
    
    if (settings.general.maxCacheSize < 10 || settings.general.maxCacheSize > 1000) {
      set((state) => { state.settings.general.maxCacheSize = 100; });
      isValid = false;
    }
    
    if (settings.security.lockTimeout < 1 || settings.security.lockTimeout > 60) {
      set((state) => { state.settings.security.lockTimeout = 5; });
      isValid = false;
    }
    
    if (settings.security.sessionTimeout < 1 || settings.security.sessionTimeout > 168) {
      set((state) => { state.settings.security.sessionTimeout = 24; });
      isValid = false;
    }
    
    if (settings.voice.confidenceThreshold < 0 || settings.voice.confidenceThreshold > 1) {
      set((state) => { state.settings.voice.confidenceThreshold = 0.7; });
      isValid = false;
    }
    
    if (settings.ai.creativity < 0 || settings.ai.creativity > 1) {
      set((state) => { state.settings.ai.creativity = 0.7; });
      isValid = false;
    }
    
    if (settings.ai.maxSuggestions < 1 || settings.ai.maxSuggestions > 20) {
      set((state) => { state.settings.ai.maxSuggestions = 5; });
      isValid = false;
    }
    
    if (settings.storage.retentionPeriod < 7 || settings.storage.retentionPeriod > 365) {
      set((state) => { state.settings.storage.retentionPeriod = 90; });
      isValid = false;
    }
    
    return isValid;
  },
  
  migrateSettings: (fromVersion, toVersion) => {
    const settings = get().settings;
    
    // Migration logic for different versions
    if (fromVersion < 1 && toVersion >= 1) {
      // Add new fields that didn't exist in version 0
      set((state) => {
        // Example migration: add new accessibility settings
        if (!state.settings.accessibility) {
          state.settings.accessibility = defaultSettings.accessibility;
        }
        
        // Update version
        state.settings.version = toVersion;
      });
    }
    
    // Future migrations would go here
    // if (fromVersion < 2 && toVersion >= 2) { ... }
  }
});