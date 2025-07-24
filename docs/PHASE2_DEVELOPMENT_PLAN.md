# Phase 2 Development Plan: Pantry & Smart Shopping Features

## Overview
This plan outlines the implementation of advanced pantry management and smart shopping features, incorporating store scraping, price tracking, barcode scanning, and receipt OCR capabilities based on the reference app architecture.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Components                       │
├─────────────────┬─────────────────┬─────────────────────────┤
│  Pantry Manager │ Shopping List   │  Scanner Components     │
├─────────────────┴─────────────────┴─────────────────────────┤
│                     Service Layer                             │
├──────────┬──────────┬──────────┬──────────┬────────────────┤
│  Store   │  Price   │  Parser  │  Scanner │  Cache          │
│  Scraper │  Tracker │  Utils   │  Service │  Service        │
├──────────┴──────────┴──────────┴──────────┴────────────────┤
│                  External APIs & Database                     │
├──────────┬──────────┬──────────┬──────────┬────────────────┤
│BuscaPrec │PreciosCl │  Gemini  │  ZXing   │  Supabase      │
└──────────┴──────────┴──────────┴──────────┴────────────────┘
```

## Implementation Phases

### Phase 2.1: Core Pantry Management (Week 1)

#### 1. Database Schema Updates
```sql
-- Add new tables for pantry and price tracking
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  barcode TEXT,
  category TEXT,
  brand TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  store_id UUID REFERENCES stores(id),
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'ARS',
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  source TEXT -- 'scraper', 'manual', 'receipt'
);

CREATE TABLE pantry_items_extended (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pantry_item_id UUID REFERENCES pantry_items(id),
  product_id UUID REFERENCES products(id),
  purchase_price DECIMAL(10,2),
  purchase_date DATE,
  scanned_barcode TEXT,
  scanned_receipt_id UUID
);

CREATE TABLE scanned_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  image_url TEXT,
  raw_text TEXT,
  parsed_data JSONB,
  store_id UUID REFERENCES stores(id),
  total_amount DECIMAL(10,2),
  scanned_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2. Core Services Implementation

**a) Parser Utils** (`/src/lib/parser/parserUtils.ts`)
```typescript
export const parserUtils = {
  extractBaseIngredientName(query: string): string,
  normalizeProductName(name: string): string,
  simplifyIngredientQuery(query: string): string,
  categorizeProduct(name: string): string,
  parseQuantity(text: string): { amount: number; unit: string }
};
```

**b) Store Scraping Service** (`/src/lib/services/storeScraper.ts`)
```typescript
interface StoreProduct {
  id: string;
  name: string;
  price: number;
  image?: string;
  store: string;
  url: string;
  barcode?: string;
}

export class StoreScraper {
  async searchProducts(query: string): Promise<StoreProduct[]>
  async getProductByBarcode(barcode: string): Promise<StoreProduct | null>
  private normalizeStoreName(store: string): string
  private cacheResults(key: string, results: StoreProduct[]): void
}
```

**c) Price Tracking Service** (`/src/lib/services/priceTracker.ts`)
```typescript
export class PriceTracker {
  async trackPrice(productId: string, storeId: string, price: number): Promise<void>
  async getPriceHistory(productId: string): Promise<PriceHistory[]>
  async getLowestPrice(productId: string): Promise<PriceInfo | null>
  async getPriceTrends(productId: string, days: number): Promise<PriceTrend>
}
```

### Phase 2.2: Smart Shopping List (Week 1-2)

#### 1. Shopping List Enhancement
- Integrate with store scraping for real-time prices
- Add price comparison across stores
- Implement smart categorization
- Add quantity suggestions based on household size

#### 2. Components to Build

**a) Shopping List with Prices** (`/src/components/shopping/ShoppingListWithPrices.tsx`)
- Display items with current prices
- Show price comparisons
- Store selection optimization
- Total cost estimation

**b) Store Selector** (`/src/components/shopping/StoreSelector.tsx`)
- Choose preferred stores
- Set store priorities
- View store-specific totals

### Phase 2.3: Scanning Features (Week 2)

#### 1. Barcode Scanner Integration

**a) Scanner Component** (`/src/components/scanner/BarcodeScanner.tsx`)
```typescript
interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onError: (error: Error) => void;
}
```

**b) Scanner Service** (`/src/lib/services/scannerService.ts`)
- Integrate @zxing/library
- Handle multiple barcode formats
- Camera permission management
- Real-time decoding

#### 2. Receipt OCR Scanner

**a) Receipt Scanner** (`/src/components/scanner/ReceiptScanner.tsx`)
- Image capture/upload
- Pre-processing for OCR
- Progress indication
- Result review UI

**b) Smart Scanner Service** (`/src/lib/services/smartScanner.ts`)
```typescript
export class SmartScannerService {
  async analyzeReceipt(image: File): Promise<ReceiptData>
  async recognizeFood(image: File): Promise<FoodItem[]>
  private optimizeImageForOCR(image: File): Promise<File>
  private parseReceiptText(text: string): ReceiptData
}
```

### Phase 2.4: Caching & Performance (Week 2-3)

#### 1. Multi-Level Cache Implementation

**a) Cache Service** (`/src/lib/services/cacheService.ts`)
```typescript
export class CacheService {
  // Memory cache for current session
  private memoryCache: Map<string, CacheEntry>;
  
  // IndexedDB for persistent storage
  async getFromIndexedDB(key: string): Promise<any>
  async saveToIndexedDB(key: string, data: any): Promise<void>
  
  // Cache statistics
  getCacheStats(): CacheStats
  clearExpired(): Promise<void>
}
```

**b) Scanner Cache** (`/src/lib/services/scannerCache.ts`)
- Image hash generation
- Duplicate detection
- Result caching
- LRU eviction

## Technical Implementation Details

### 1. External API Integration

**BuscaPrecios API**
```typescript
const BUSCAPRECIOS_API = 'https://buscaprecios.onrender.com';

interface BuscaPreciosParams {
  q: string;
  limit?: number;
}
```

**Gemini AI Integration**
```typescript
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
```

### 2. State Management

**Zustand Stores**
```typescript
// Pantry Store
interface PantryStore {
  items: PantryItem[];
  loading: boolean;
  addItem: (item: PantryItem) => void;
  updateItem: (id: string, updates: Partial<PantryItem>) => void;
  scanBarcode: (barcode: string) => Promise<void>;
}

// Shopping Store
interface ShoppingStore {
  lists: ShoppingList[];
  prices: Map<string, PriceInfo>;
  selectedStores: string[];
  updatePrices: () => Promise<void>;
  optimizeByPrice: () => ShoppingList;
}
```

### 3. Error Handling Strategy

- Retry logic with exponential backoff
- Fallback to cached data
- User-friendly error messages
- Offline capability for core features

### 4. Performance Optimizations

- Lazy loading for scanner components
- Image compression before upload
- Batch API calls
- Progressive enhancement
- Service worker for offline support

## Migration Steps

1. **Database Migration**
   - Run Prisma migrations for new schema
   - Seed initial store data
   - Create indexes for performance

2. **Environment Variables**
   ```env
   # Add to .env.local
   GOOGLE_GEMINI_API_KEY=your_key
   BUSCAPRECIOS_API_URL=https://buscaprecios.onrender.com
   PRECIOSCAROS_API_URL=https://api.preciosclaros.gob.ar
   ```

3. **Dependencies to Install**
   ```bash
   npm install @zxing/library @google/generative-ai zustand uuid
   npm install --save-dev @types/uuid
   ```

## Timeline

### Week 1
- [ ] Database schema updates
- [ ] Core services implementation
- [ ] Basic pantry CRUD operations
- [ ] Parser utilities

### Week 2
- [ ] Store scraping integration
- [ ] Price tracking system
- [ ] Shopping list enhancement
- [ ] Barcode scanner

### Week 3
- [ ] Receipt OCR scanner
- [ ] Caching system
- [ ] Performance optimizations
- [ ] Testing and refinement

## Success Metrics

1. **Performance**
   - Page load time < 3s
   - Scanner response < 2s
   - Cache hit rate > 70%

2. **Accuracy**
   - Product match rate > 85%
   - Receipt parsing accuracy > 90%
   - Price update frequency < 24h

3. **User Experience**
   - Successful scan rate > 95%
   - Error recovery without data loss
   - Offline capability for core features

## Next Steps

1. Begin with database schema updates
2. Implement core parser utilities
3. Set up external API integrations
4. Build basic pantry management UI
5. Gradually add scanning features

This plan provides a structured approach to implementing advanced pantry and shopping features while maintaining code quality and performance.