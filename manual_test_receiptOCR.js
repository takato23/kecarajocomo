/**
 * Manual test script for Receipt OCR functionality
 * Run with: node manual_test_receiptOCR.js
 */

// Mock environment setup
process.env.GOOGLE_AI_API_KEY = 'test-api-key';

// Mock dependencies to avoid real API calls
const mockGoogleAI = {
  GoogleGenerativeAI: function() {
    return {
      getGenerativeModel: () => ({
        generateContent: async () => ({
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
    };
  }
};

// Mock file system
const fs = {
  readFileSync: () => Buffer.from('mock file content'),
  writeFileSync: () => {},
  existsSync: () => true
};

// Mock fetch for Node.js
global.fetch = async (url, options) => {
  return {
    ok: true,
    json: async () => ({ success: true })
  };
};

// Mock File API
global.File = class {
  constructor(content, name, options) {
    this.content = content;
    this.name = name;
    this.type = options?.type || 'text/plain';
    this.size = content.length;
  }
  
  arrayBuffer() {
    return Promise.resolve(new ArrayBuffer(this.size));
  }
};

// Mock FileReader
global.FileReader = class {
  constructor() {
    this.result = null;
    this.onload = null;
    this.onerror = null;
  }
  
  readAsDataURL(file) {
    setTimeout(() => {
      this.result = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...';
      if (this.onload) {
        this.onload();
      }
    }, 10);
  }
};

// Mock IndexedDB
global.indexedDB = {
  open: () => ({
    onsuccess: null,
    onerror: null,
    onupgradeneeded: null,
    result: {
      createObjectStore: () => ({
        createIndex: () => {}
      })
    }
  })
};

// Mock window object
global.window = {
  indexedDB: global.indexedDB
};

// Manual test functions
function testReceiptOCRService() {

  try {
    // Import after mocking
    const { ReceiptOCR } = require('./src/lib/services/receiptOCR');
    
    const receiptOCR = new ReceiptOCR();

    // Test with mock file
    const mockFile = new File(['test content'], 'receipt.jpg', { type: 'image/jpeg' });
    
    receiptOCR.processReceipt(mockFile)
      .then(result => {

        if (result.success) {




        } else {

        }
      })
      .catch(error => {

      });
    
  } catch (error) {

  }
}

function testParserUtils() {

  try {
    const { parserUtils } = require('./src/lib/parser/parserUtils');
    
    // Test normalization
    const testName = 'LECHE LA SERENÍSIMA 1L';
    const normalized = parserUtils.normalizeProductName(testName);

    // Test categorization
    const category = parserUtils.categorizeProduct('leche');

    // Test quantity parsing
    const quantity = parserUtils.parseQuantity('2 kg');

    // Test price parsing
    const price = parserUtils.parsePrice('$25,50');

  } catch (error) {

  }
}

function testCacheService() {

  try {
    const { cacheService } = require('./src/lib/services/cacheService');
    
    // Test cache operations
    const testKey = 'test-key';
    const testData = { message: 'test data' };
    
    cacheService.set(testKey, testData)
      .then(() => {

        return cacheService.get(testKey);
      })
      .then(result => {
        if (result && result.message === testData.message) {

        } else {

        }
      })
      .catch(error => {

      });
    
  } catch (error) {

  }
}

function testItemValidation() {

  try {
    const { ReceiptOCR } = require('./src/lib/services/receiptOCR');
    const receiptOCR = new ReceiptOCR();
    
    const testItems = [
      {
        id: '1',
        name: 'Leche',
        normalizedName: 'leche',
        quantity: 1,
        unit: 'l',
        price: 25.50,
        category: 'lacteos',
        confidence: 0.9,
        rawText: 'LECHE 1L $25.50',
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
        rawText: 'BOLSA $5.00',
        selected: true
      },
      {
        id: '3',
        name: '',
        normalizedName: '',
        quantity: 0,
        unit: 'un',
        price: 0,
        category: 'otros',
        confidence: 0.3,
        rawText: '',
        selected: true
      }
    ];
    
    const cleanedItems = receiptOCR.validateAndCleanItems(testItems);




  } catch (error) {

  }
}

// Run all tests

testReceiptOCRService();
testParserUtils();
testCacheService();
testItemValidation();
