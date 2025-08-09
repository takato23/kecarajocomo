/**
 * GeminiService Tests
 * Verify the service handles missing API keys gracefully
 */

import { GeminiService, getGeminiService } from '../GeminiService';

describe('GeminiService', () => {
  let service: GeminiService;
  
  beforeEach(() => {
    // Clear any cached instance
    (global as any).geminiServiceInstance = null;
    service = getGeminiService();
  });

  describe('without API key', () => {
    beforeAll(() => {
      // Ensure no API key is set
      delete process.env.GOOGLE_GEMINI_API_KEY;
      delete process.env.GOOGLE_GEMINI_API_KEY;
    });

    it('should initialize without throwing errors', () => {
      expect(() => getGeminiService()).not.toThrow();
    });

    it('should report service as unavailable', () => {
      expect(service.checkAvailability()).toBe(false);
    });

    it('should return null from analyze when unavailable', async () => {
      const result = await service.analyze({ text: 'test data' });
      expect(result).toBeNull();
    });

    it('should return empty string from generateContent when unavailable', async () => {
      const result = await service.generateContent('test prompt');
      expect(result).toBe('');
    });

    it('should return empty string from streamContent when unavailable', async () => {
      const result = await service.streamContent('test prompt');
      expect(result).toBe('');
    });

    it('should return null from analyzeImage when unavailable', async () => {
      const result = await service.analyzeImage('fake-base64-data');
      expect(result).toBeNull();
    });
  });

  describe('with mock API key', () => {
    beforeAll(() => {
      // Set a mock API key that's too short to be valid
      process.env.GOOGLE_GEMINI_API_KEY = 'test';
    });

    afterAll(() => {
      delete process.env.GOOGLE_GEMINI_API_KEY;
    });

    it('should still be unavailable with invalid key', () => {
      const newService = new GeminiService();
      expect(newService.checkAvailability()).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle various input types in analyze', async () => {
      // String input
      const stringResult = await service.analyze('test string');
      expect(stringResult).toBeNull();

      // Object with text property
      const textObjResult = await service.analyze({ text: 'test' });
      expect(textObjResult).toBeNull();

      // Object with prompt property
      const promptObjResult = await service.analyze({ prompt: 'test' });
      expect(promptObjResult).toBeNull();

      // Generic object
      const objResult = await service.analyze({ data: 'test' });
      expect(objResult).toBeNull();
    });
  });
});