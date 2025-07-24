// Mock environment variables first
process.env.GOOGLE_AI_API_KEY = 'test-api-key';

import { ReceiptOCR } from '@/lib/services/receiptOCR';
import { parserUtils } from '@/lib/parser/parserUtils';
import { cacheService } from '@/lib/services/cacheService';

// Mock the external dependencies
jest.mock('@/lib/services/cacheService', () => ({
  cacheService: {
    get: jest.fn(),
    set: jest.fn(),
  },
}));

jest.mock('@/lib/parser/parserUtils', () => ({
  parserUtils: {
    normalizeProductName: jest.fn((name) => name.toLowerCase()),
    categorizeProduct: jest.fn(() => 'otros'),
    parseQuantity: jest.fn(() => ({ unit: 'un' })),
  },
}));

// Mock Google Generative AI
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify({
            store_name: 'Supermercado Test',
            date: '2024-07-17',
            total: 150.50,
            raw_text: 'Test receipt content',
            items: [
              {
                name: 'Leche',
                quantity: 1,
                unit: 'un',
                price: 25.50,
                confidence: 0.9,
                raw_text: 'LECHE DESCR 1L $25.50'
              },
              {
                name: 'Pan',
                quantity: 2,
                unit: 'un',
                price: 15.00,
                confidence: 0.8,
                raw_text: 'PAN LACTAL $15.00'
              }
            ]
          })
        }
      })
    })
  })),
}));

describe('ReceiptOCR', () => {
  let receiptOCR: ReceiptOCR;
  let mockFile: File;

  beforeEach(() => {
    // Create mock file
    mockFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
    
    receiptOCR = new ReceiptOCR();
    
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should throw error if no API key is provided', () => {
      const originalApiKey = process.env.GOOGLE_AI_API_KEY;
      delete process.env.GOOGLE_AI_API_KEY;
      
      expect(() => new ReceiptOCR()).toThrow('GOOGLE_AI_API_KEY is required for receipt OCR');
      
      // Restore API key
      process.env.GOOGLE_AI_API_KEY = originalApiKey;
    });

    it('should initialize with API key', () => {
      expect(() => new ReceiptOCR()).not.toThrow();
    });
  });

  describe('processReceipt', () => {
    it('should return cached result if available', async () => {
      const cachedResult = {
        storeName: 'Cached Store',
        items: [],
        rawText: 'cached',
        confidence: 0.8
      };

      (cacheService.get as jest.Mock).mockResolvedValue(cachedResult);

      const result = await receiptOCR.processReceipt(mockFile);

      expect(result.success).toBe(true);
      expect(result.receipt).toEqual(cachedResult);
      expect(cacheService.get).toHaveBeenCalledWith(expect.stringContaining('receipt:'));
    });

    it('should process receipt successfully', async () => {
      (cacheService.get as jest.Mock).mockResolvedValue(null);

      const result = await receiptOCR.processReceipt(mockFile);

      expect(result.success).toBe(true);
      expect(result.receipt).toBeDefined();
      expect(result.receipt!.storeName).toBe('Supermercado Test');
      expect(result.receipt!.items).toHaveLength(2);
      expect(result.receipt!.items[0].name).toBe('Leche');
      expect(result.receipt!.items[0].price).toBe(25.50);
      expect(cacheService.set).toHaveBeenCalled();
    });

    it('should handle processing errors gracefully', async () => {
      (cacheService.get as jest.Mock).mockRejectedValue(new Error('Cache error'));

      const result = await receiptOCR.processReceipt(mockFile);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Error procesando el ticket');
    });
  });

  describe('validateAndCleanItems', () => {
    it('should filter out invalid items', () => {
      const items = [
        {
          id: '1',
          name: 'Leche',
          normalizedName: 'leche',
          quantity: 1,
          unit: 'un',
          price: 25.50,
          category: 'lacteos',
          confidence: 0.9,
          rawText: 'LECHE',
          selected: true
        },
        {
          id: '2',
          name: 'Bolsa',
          normalizedName: 'bolsa',
          quantity: 1,
          unit: 'un',
          price: 5.00,
          category: 'otros',
          confidence: 0.8,
          rawText: 'BOLSA',
          selected: true
        },
        {
          id: '3',
          name: '',
          normalizedName: '',
          quantity: 1,
          unit: 'un',
          price: 0,
          category: 'otros',
          confidence: 0.5,
          rawText: '',
          selected: true
        }
      ];

      const result = receiptOCR.validateAndCleanItems(items);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('leche'); // Should be normalized
    });

    it('should filter out items with invalid prices', () => {
      const items = [
        {
          id: '1',
          name: 'Leche',
          normalizedName: 'leche',
          quantity: 1,
          unit: 'un',
          price: 0,
          category: 'lacteos',
          confidence: 0.9,
          rawText: 'LECHE',
          selected: true
        },
        {
          id: '2',
          name: 'Pan',
          normalizedName: 'pan',
          quantity: 1,
          unit: 'un',
          price: 15.00,
          category: 'panaderia',
          confidence: 0.8,
          rawText: 'PAN',
          selected: true
        }
      ];

      const result = receiptOCR.validateAndCleanItems(items);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('pan');
    });

    it('should filter out non-food items', () => {
      const items = [
        {
          id: '1',
          name: 'Leche',
          normalizedName: 'leche',
          quantity: 1,
          unit: 'un',
          price: 25.50,
          category: 'lacteos',
          confidence: 0.9,
          rawText: 'LECHE',
          selected: true
        },
        {
          id: '2',
          name: 'Bolsa Plastica',
          normalizedName: 'bolsa plastica',
          quantity: 1,
          unit: 'un',
          price: 5.00,
          category: 'otros',
          confidence: 0.8,
          rawText: 'BOLSA',
          selected: true
        }
      ];

      const result = receiptOCR.validateAndCleanItems(items);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('leche');
    });
  });

  describe('Error handling', () => {
    it('should handle invalid JSON response', async () => {
      const mockModel = {
        generateContent: jest.fn().mockResolvedValue({
          response: {
            text: () => 'Invalid JSON response'
          }
        })
      };

      const mockGenAI = {
        getGenerativeModel: jest.fn().mockReturnValue(mockModel)
      };

      // Mock the Google AI constructor
      (require('@google/generative-ai').GoogleGenerativeAI as jest.Mock)
        .mockImplementation(() => mockGenAI);

      receiptOCR = new ReceiptOCR();
      (cacheService.get as jest.Mock).mockResolvedValue(null);

      const result = await receiptOCR.processReceipt(mockFile);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Error procesando la respuesta del OCR');
    });

    it('should handle API errors', async () => {
      const mockModel = {
        generateContent: jest.fn().mockRejectedValue(new Error('API Error'))
      };

      const mockGenAI = {
        getGenerativeModel: jest.fn().mockReturnValue(mockModel)
      };

      (require('@google/generative-ai').GoogleGenerativeAI as jest.Mock)
        .mockImplementation(() => mockGenAI);

      receiptOCR = new ReceiptOCR();
      (cacheService.get as jest.Mock).mockResolvedValue(null);

      const result = await receiptOCR.processReceipt(mockFile);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Error extrayendo texto del ticket');
    });
  });

  describe('Image processing', () => {
    it('should handle file reading errors', async () => {
      // Create a mock file that will cause reading to fail
      const failingFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      
      // Mock FileReader to fail
      const mockFileReader = {
        readAsDataURL: jest.fn(),
        onerror: null as any,
        onload: null as any,
        result: null
      };

      (global as any).FileReader = jest.fn(() => mockFileReader);

      (cacheService.get as jest.Mock).mockResolvedValue(null);

      // Simulate file reading error
      setTimeout(() => {
        if (mockFileReader.onerror) {
          mockFileReader.onerror(new Error('File reading failed'));
        }
      }, 0);

      const result = await receiptOCR.processReceipt(failingFile);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Error procesando el ticket');
    });
  });

  describe('Cache integration', () => {
    it('should generate consistent cache keys for same file', async () => {
      const file1 = new File(['same content'], 'test1.jpg', { type: 'image/jpeg' });
      const file2 = new File(['same content'], 'test2.jpg', { type: 'image/jpeg' });

      (cacheService.get as jest.Mock).mockResolvedValue(null);

      await receiptOCR.processReceipt(file1);
      await receiptOCR.processReceipt(file2);

      // Should use same cache key for same content
      const calls = (cacheService.get as jest.Mock).mock.calls;
      expect(calls[0][0]).toBe(calls[1][0]);
    });

    it('should generate different cache keys for different files', async () => {
      const file1 = new File(['content1'], 'test1.jpg', { type: 'image/jpeg' });
      const file2 = new File(['content2'], 'test2.jpg', { type: 'image/jpeg' });

      (cacheService.get as jest.Mock).mockResolvedValue(null);

      await receiptOCR.processReceipt(file1);
      await receiptOCR.processReceipt(file2);

      // Should use different cache keys for different content
      const calls = (cacheService.get as jest.Mock).mock.calls;
      expect(calls[0][0]).not.toBe(calls[1][0]);
    });
  });

  describe('Integration with parser utilities', () => {
    it('should use parser utilities for normalization', async () => {
      (cacheService.get as jest.Mock).mockResolvedValue(null);

      await receiptOCR.processReceipt(mockFile);

      expect(parserUtils.normalizeProductName).toHaveBeenCalledWith('Leche');
      expect(parserUtils.normalizeProductName).toHaveBeenCalledWith('Pan');
      expect(parserUtils.categorizeProduct).toHaveBeenCalledWith('Leche');
      expect(parserUtils.categorizeProduct).toHaveBeenCalledWith('Pan');
    });
  });
});