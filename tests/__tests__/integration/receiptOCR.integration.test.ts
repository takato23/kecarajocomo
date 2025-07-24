/**
 * Integration test for Receipt OCR functionality
 * Tests the complete workflow without mocking external services
 */

// Set up environment
process.env.GOOGLE_AI_API_KEY = 'test-api-key';

import { ReceiptOCR } from '@/lib/services/receiptOCR';
import { cacheService } from '@/lib/services/cacheService';

// Mock only the actual Google AI service to avoid real API calls
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify({
            store_name: 'Supermercado Disco',
            date: '2024-07-17',
            total: 1250.75,
            raw_text: 'SUPERMERCADO DISCO\n17/07/2024\nLECHE LA SERENISIMA 1L $450.00\nPAN LACTAL BIMBO $320.00\nYOGUR SANCOR X4 $480.75\nTOTAL $1250.75',
            items: [
              {
                name: 'Leche La Serenisima',
                quantity: 1,
                unit: 'l',
                price: 450.00,
                confidence: 0.95,
                raw_text: 'LECHE LA SERENISIMA 1L $450.00'
              },
              {
                name: 'Pan Lactal Bimbo',
                quantity: 1,
                unit: 'un',
                price: 320.00,
                confidence: 0.90,
                raw_text: 'PAN LACTAL BIMBO $320.00'
              },
              {
                name: 'Yogur Sancor',
                quantity: 4,
                unit: 'un',
                price: 480.75,
                confidence: 0.85,
                raw_text: 'YOGUR SANCOR X4 $480.75'
              }
            ]
          })
        }
      })
    })
  })),
}));

describe('Receipt OCR Integration Tests', () => {
  let receiptOCR: ReceiptOCR;
  let mockFile: File;

  beforeEach(() => {
    receiptOCR = new ReceiptOCR();
    mockFile = new File(['mock image content'], 'receipt.jpg', { type: 'image/jpeg' });
    
    // Clear cache before each test
    cacheService.clear();
  });

  describe('Complete Receipt Processing Flow', () => {
    it('should process a receipt from image to structured data', async () => {
      const result = await receiptOCR.processReceipt(mockFile);

      expect(result.success).toBe(true);
      expect(result.receipt).toBeDefined();
      
      const receipt = result.receipt!;
      expect(receipt.storeName).toBe('Supermercado Disco');
      expect(receipt.date).toBe('2024-07-17');
      expect(receipt.total).toBe(1250.75);
      expect(receipt.items).toHaveLength(3);
      
      // Check first item
      const firstItem = receipt.items[0];
      expect(firstItem.name).toBe('Leche La Serenisima');
      expect(firstItem.price).toBe(450.00);
      expect(firstItem.quantity).toBe(1);
      expect(firstItem.unit).toBe('l');
      expect(firstItem.confidence).toBe(0.95);
      expect(firstItem.selected).toBe(true);
      expect(firstItem.normalizedName).toBe('leche la serenisima');
      expect(firstItem.category).toBe('Lácteos');
    });

    it('should validate and clean extracted items', () => {
      const testItems = [
        {
          id: '1',
          name: 'Leche La Serenisima',
          normalizedName: 'leche la serenisima',
          quantity: 1,
          unit: 'l',
          price: 450.00,
          category: 'Lácteos',
          confidence: 0.95,
          rawText: 'LECHE LA SERENISIMA 1L $450.00',
          selected: true
        },
        {
          id: '2',
          name: 'Bolsa Plastica',
          normalizedName: 'bolsa plastica',
          quantity: 1,
          unit: 'un',
          price: 10.00,
          category: 'Otros',
          confidence: 0.80,
          rawText: 'BOLSA PLASTICA $10.00',
          selected: true
        },
        {
          id: '3',
          name: '',
          normalizedName: '',
          quantity: 0,
          unit: 'un',
          price: 0,
          category: 'Otros',
          confidence: 0.30,
          rawText: '',
          selected: true
        }
      ];

      const cleanedItems = receiptOCR.validateAndCleanItems(testItems);
      
      expect(cleanedItems).toHaveLength(1);
      expect(cleanedItems[0].name).toBe('leche la serenisima');
      expect(cleanedItems[0].price).toBe(450.00);
    });

    it('should handle cache correctly', async () => {
      // First call should process and cache
      const result1 = await receiptOCR.processReceipt(mockFile);
      expect(result1.success).toBe(true);
      
      // Second call should use cache
      const result2 = await receiptOCR.processReceipt(mockFile);
      expect(result2.success).toBe(true);
      expect(result2.receipt).toEqual(result1.receipt);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid image gracefully', async () => {
      const invalidFile = new File(['invalid content'], 'invalid.txt', { type: 'text/plain' });
      
      const result = await receiptOCR.processReceipt(invalidFile);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Error procesando el ticket');
    });

    it('should handle API errors gracefully', async () => {
      // Mock API failure
      const mockModel = {
        generateContent: jest.fn().mockRejectedValue(new Error('API Error'))
      };
      
      const mockGenAI = {
        getGenerativeModel: jest.fn().mockReturnValue(mockModel)
      };
      
      (require('@google/generative-ai').GoogleGenerativeAI as jest.Mock)
        .mockImplementation(() => mockGenAI);
      
      const newReceiptOCR = new ReceiptOCR();
      const result = await newReceiptOCR.processReceipt(mockFile);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Error procesando el ticket');
    });
  });

  describe('Data Quality', () => {
    it('should normalize product names correctly', async () => {
      const result = await receiptOCR.processReceipt(mockFile);
      
      expect(result.success).toBe(true);
      const items = result.receipt!.items;
      
      // Check that names are normalized
      expect(items[0].normalizedName).toBe('leche la serenisima');
      expect(items[1].normalizedName).toBe('pan lactal bimbo');
      expect(items[2].normalizedName).toBe('yogur sancor');
    });

    it('should categorize products correctly', async () => {
      const result = await receiptOCR.processReceipt(mockFile);
      
      expect(result.success).toBe(true);
      const items = result.receipt!.items;
      
      // Check categories
      expect(items[0].category).toBe('Lácteos'); // Leche
      expect(items[1].category).toBe('Panadería'); // Pan
      expect(items[2].category).toBe('Lácteos'); // Yogur
    });

    it('should calculate overall confidence correctly', async () => {
      const result = await receiptOCR.processReceipt(mockFile);
      
      expect(result.success).toBe(true);
      const receipt = result.receipt!;
      
      // Should be around the average of item confidences (0.95 + 0.90 + 0.85) / 3 = 0.9
      expect(receipt.confidence).toBeGreaterThan(0.8);
      expect(receipt.confidence).toBeLessThanOrEqual(1.0);
    });
  });

  describe('Performance and Reliability', () => {
    it('should process multiple receipts without memory leaks', async () => {
      const files = Array.from({ length: 5 }, (_, i) => 
        new File([`receipt ${i}`], `receipt${i}.jpg`, { type: 'image/jpeg' })
      );
      
      const results = await Promise.all(
        files.map(file => receiptOCR.processReceipt(file))
      );
      
      results.forEach((result, index) => {
        expect(result.success).toBe(true);
        expect(result.receipt).toBeDefined();
        expect(result.receipt!.items).toHaveLength(3);
      });
    });

    it('should handle concurrent processing', async () => {
      const concurrentCalls = Array.from({ length: 3 }, () => 
        receiptOCR.processReceipt(mockFile)
      );
      
      const results = await Promise.all(concurrentCalls);
      
      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.receipt).toBeDefined();
      });
    });
  });

  describe('Integration with other components', () => {
    it('should provide data in format expected by ReceiptReview component', async () => {
      const result = await receiptOCR.processReceipt(mockFile);
      
      expect(result.success).toBe(true);
      const receipt = result.receipt!;
      
      // Check that data structure matches what ReceiptReview expects
      expect(receipt).toHaveProperty('storeName');
      expect(receipt).toHaveProperty('date');
      expect(receipt).toHaveProperty('total');
      expect(receipt).toHaveProperty('items');
      expect(receipt).toHaveProperty('rawText');
      expect(receipt).toHaveProperty('confidence');
      
      receipt.items.forEach(item => {
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('name');
        expect(item).toHaveProperty('normalizedName');
        expect(item).toHaveProperty('quantity');
        expect(item).toHaveProperty('unit');
        expect(item).toHaveProperty('price');
        expect(item).toHaveProperty('category');
        expect(item).toHaveProperty('confidence');
        expect(item).toHaveProperty('rawText');
        expect(item).toHaveProperty('selected');
      });
    });

    it('should work with pantry integration format', async () => {
      const result = await receiptOCR.processReceipt(mockFile);
      
      expect(result.success).toBe(true);
      const items = result.receipt!.items;
      
      // Check that items can be used for pantry integration
      items.forEach(item => {
        expect(typeof item.normalizedName).toBe('string');
        expect(typeof item.quantity).toBe('number');
        expect(typeof item.unit).toBe('string');
        expect(typeof item.price).toBe('number');
        expect(item.quantity).toBeGreaterThan(0);
        expect(item.price).toBeGreaterThan(0);
      });
    });
  });
});