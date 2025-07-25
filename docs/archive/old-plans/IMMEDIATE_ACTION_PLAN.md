# Immediate Action Plan: Pantry & Smart Shopping Implementation

## 🎯 Objective
Implement complete pantry management system with store scraping, price tracking, barcode scanning, and receipt OCR in the most efficient way possible.

## 📋 Execution Order (Priority-Based)

### Day 1: Database & Core Services (4-6 hours)

#### Task 1.1: Database Schema Update (30 min)
```bash
# 1. Update schema.prisma with new models
# 2. Run migration
npx prisma migrate dev --name add_pantry_features
# 3. Generate Prisma client
npx prisma generate
```

#### Task 1.2: Install Dependencies (15 min)
```bash
npm install @zxing/library @google/generative-ai zustand uuid decimal.js class-variance-authority
npm install --save-dev @types/uuid
```

#### Task 1.3: Create Core Services (2 hours)
1. Parser utilities - `/src/lib/parser/parserUtils.ts`
2. Store scraper - `/src/lib/services/storeScraper.ts`
3. Price tracker - `/src/lib/services/priceTracker.ts`
4. Cache service - `/src/lib/services/cacheService.ts`

#### Task 1.4: Environment Setup (15 min)
Add to `.env.local`:
```env
GOOGLE_GEMINI_API_KEY=your_key_here
NEXT_PUBLIC_BUSCAPRECIOS_API=https://buscaprecios.onrender.com
```

### Day 2: Pantry UI & Basic Features (4-6 hours)

#### Task 2.1: Pantry Pages (2 hours)
1. Pantry list page - `/src/app/pantry/page.tsx`
2. Add item page - `/src/app/pantry/add/page.tsx`
3. Edit item page - `/src/app/pantry/[id]/edit/page.tsx`

#### Task 2.2: Pantry Components (2 hours)
1. PantryList - `/src/components/pantry/PantryList.tsx`
2. PantryItemCard - `/src/components/pantry/PantryItemCard.tsx`
3. AddItemForm - `/src/components/pantry/AddItemForm.tsx`

#### Task 2.3: API Routes (1 hour)
1. CRUD operations - `/src/app/api/pantry/route.ts`
2. Item usage tracking - `/src/app/api/pantry/[id]/use/route.ts`

### Day 3: Scanning Features (4-6 hours)

#### Task 3.1: Barcode Scanner (2 hours)
1. Scanner component - `/src/components/scanner/BarcodeScanner.tsx`
2. Scanner modal - `/src/components/scanner/ScannerModal.tsx`
3. Integration with add item form

#### Task 3.2: Receipt Scanner (2 hours)
1. Receipt scanner - `/src/components/scanner/ReceiptScanner.tsx`
2. Smart scanner service - `/src/lib/services/smartScanner.ts`
3. Receipt parsing logic

#### Task 3.3: Scanner Integration (1 hour)
1. Add scan buttons to pantry
2. Process scanned items
3. Error handling

### Day 4: Shopping List & Prices (4-6 hours)

#### Task 4.1: Shopping List Enhancement (2 hours)
1. Shopping list page update
2. Price integration component
3. Store selector

#### Task 4.2: Price Display (2 hours)
1. Price comparison widget
2. Price history chart
3. Store optimization

#### Task 4.3: Integration (1 hour)
1. Connect to pantry items
2. Auto-generate from low stock
3. Manual adjustments

## 🚀 Immediate Actions (Next 30 minutes)

### Step 1: Update Prisma Schema
```prisma
// Add to schema.prisma

model Store {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  logoUrl   String?  @map("logo_url")
  createdAt DateTime @default(now()) @map("created_at")
  
  prices    PriceHistory[]
  receipts  ScannedReceipt[]
  
  @@map("stores")
}

model Product {
  id             String   @id @default(cuid())
  name           String
  normalizedName String   @map("normalized_name")
  barcode        String?  @unique
  category       String?
  brand          String?
  imageUrl       String?  @map("image_url")
  createdAt      DateTime @default(now()) @map("created_at")
  
  prices         PriceHistory[]
  pantryItems    PantryItemExtended[]
  
  @@index([normalizedName])
  @@index([barcode])
  @@map("products")
}

model PriceHistory {
  id         String   @id @default(cuid())
  productId  String   @map("product_id")
  storeId    String   @map("store_id")
  price      Decimal  @db.Decimal(10, 2)
  currency   String   @default("ARS")
  recordedAt DateTime @default(now()) @map("recorded_at")
  source     String   // 'scraper', 'manual', 'receipt'
  
  product    Product  @relation(fields: [productId], references: [id])
  store      Store    @relation(fields: [storeId], references: [id])
  
  @@index([productId, storeId])
  @@index([recordedAt])
  @@map("price_history")
}

model PantryItemExtended {
  id              String    @id @default(cuid())
  pantryItemId    String    @unique @map("pantry_item_id")
  productId       String?   @map("product_id")
  purchasePrice   Decimal?  @db.Decimal(10, 2) @map("purchase_price")
  purchaseDate    DateTime? @map("purchase_date")
  scannedBarcode  String?   @map("scanned_barcode")
  scannedReceiptId String?  @map("scanned_receipt_id")
  
  pantryItem      PantryItem      @relation(fields: [pantryItemId], references: [id], onDelete: Cascade)
  product         Product?        @relation(fields: [productId], references: [id])
  scannedReceipt  ScannedReceipt? @relation(fields: [scannedReceiptId], references: [id])
  
  @@map("pantry_items_extended")
}

model ScannedReceipt {
  id          String   @id @default(cuid())
  userId      String   @map("user_id")
  imageUrl    String?  @map("image_url")
  rawText     String?  @map("raw_text") @db.Text
  parsedData  Json?    @map("parsed_data")
  storeId     String?  @map("store_id")
  totalAmount Decimal? @db.Decimal(10, 2) @map("total_amount")
  scannedAt   DateTime @default(now()) @map("scanned_at")
  
  user        User     @relation(fields: [userId], references: [id])
  store       Store?   @relation(fields: [storeId], references: [id])
  pantryItems PantryItemExtended[]
  
  @@map("scanned_receipts")
}

// Update existing models
model PantryItem {
  // ... existing fields ...
  extended PantryItemExtended?
}

model User {
  // ... existing fields ...
  scannedReceipts ScannedReceipt[]
}
```

### Step 2: Create Core Services Structure
```
src/
├── lib/
│   ├── parser/
│   │   └── parserUtils.ts
│   └── services/
│       ├── storeScraper.ts
│       ├── priceTracker.ts
│       ├── cacheService.ts
│       └── smartScanner.ts
├── components/
│   ├── pantry/
│   │   ├── PantryList.tsx
│   │   ├── PantryItemCard.tsx
│   │   └── AddItemForm.tsx
│   └── scanner/
│       ├── BarcodeScanner.tsx
│       ├── ReceiptScanner.tsx
│       └── ScannerModal.tsx
└── app/
    ├── pantry/
    │   ├── page.tsx
    │   ├── add/
    │   │   └── page.tsx
    │   └── [id]/
    │       └── edit/
    │           └── page.tsx
    └── api/
        └── pantry/
            ├── route.ts
            └── [id]/
                └── use/
                    └── route.ts
```

## 🎯 Success Metrics
- Database migration successful
- Core services operational
- Basic pantry CRUD working
- Barcode scanner functional
- Price scraping active
- UI responsive and clean

## 🔄 Continuous Actions
1. Test each component after creation
2. Commit after each major milestone
3. Update progress tracking
4. Handle errors gracefully
5. Optimize for performance

## 📱 Mobile-First Approach
- All UIs responsive by default
- Touch-friendly interfaces
- Optimized for scanning on mobile
- Progressive enhancement

This plan prioritizes getting a working system quickly while maintaining quality and extensibility.