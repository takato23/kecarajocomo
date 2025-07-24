import { createMocks } from 'node-mocks-http';
import { GET } from '@/app/api/pantry/analysis/route';

// Mock the Gemini AI service
jest.mock('@/features/pantry/services/geminiPantryService', () => ({
  analyzeConsumptionPatterns: jest.fn(),
  generateWasteReductionSuggestions: jest.fn(),
  predictInventoryNeeds: jest.fn(),
}));

describe('/api/pantry/analysis', () => {
  const mockAnalyzeConsumptionPatterns = require('@/features/pantry/services/geminiPantryService').analyzeConsumptionPatterns;
  const mockGenerateWasteReductionSuggestions = require('@/features/pantry/services/geminiPantryService').generateWasteReductionSuggestions;
  const mockPredictInventoryNeeds = require('@/features/pantry/services/geminiPantryService').predictInventoryNeeds;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/pantry/analysis', () => {
    it('should return comprehensive pantry analysis', async () => {
      const mockConsumptionPatterns = {
        frequentItems: ['bread', 'milk', 'eggs'],
        peakConsumptionDays: ['Monday', 'Friday'],
        averageConsumption: { bread: 2, milk: 1, eggs: 6 }
      };

      const mockWasteReductionSuggestions = [
        { item: 'bananas', suggestion: 'Use ripe bananas for smoothies' },
        { item: 'lettuce', suggestion: 'Store in airtight container' }
      ];

      const mockInventoryPredictions = {
        needsRestocking: ['milk', 'bread'],
        optimalQuantities: { milk: 2, bread: 1 }
      };

      mockAnalyzeConsumptionPatterns.mockResolvedValue(mockConsumptionPatterns);
      mockGenerateWasteReductionSuggestions.mockResolvedValue(mockWasteReductionSuggestions);
      mockPredictInventoryNeeds.mockResolvedValue(mockInventoryPredictions);

      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/pantry/analysis',
      });

      const response = await GET(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        consumptionPatterns: mockConsumptionPatterns,
        wasteReductionSuggestions: mockWasteReductionSuggestions,
        inventoryPredictions: mockInventoryPredictions,
      });

      expect(mockAnalyzeConsumptionPatterns).toHaveBeenCalledTimes(1);
      expect(mockGenerateWasteReductionSuggestions).toHaveBeenCalledTimes(1);
      expect(mockPredictInventoryNeeds).toHaveBeenCalledTimes(1);
    });

    it('should handle service errors gracefully', async () => {
      mockAnalyzeConsumptionPatterns.mockRejectedValue(new Error('AI service error'));

      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/pantry/analysis',
      });

      const response = await GET(req as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: 'Failed to analyze pantry data',
      });
    });

    it('should handle empty pantry data', async () => {
      mockAnalyzeConsumptionPatterns.mockResolvedValue({ frequentItems: [], peakConsumptionDays: [], averageConsumption: {} });
      mockGenerateWasteReductionSuggestions.mockResolvedValue([]);
      mockPredictInventoryNeeds.mockResolvedValue({ needsRestocking: [], optimalQuantities: {} });

      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/pantry/analysis',
      });

      const response = await GET(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.consumptionPatterns.frequentItems).toEqual([]);
      expect(data.wasteReductionSuggestions).toEqual([]);
      expect(data.inventoryPredictions.needsRestocking).toEqual([]);
    });
  });
});