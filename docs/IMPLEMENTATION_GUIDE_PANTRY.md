# Implementation Guide: Pantry Management System

## Step 1: Database Schema Updates

### 1.1 Create Prisma Schema Updates

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
  
  pantryItem      PantryItem      @relation(fields: [pantryItemId], references: [id])
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

### 1.2 Run Migration

```bash
npx prisma migrate dev --name add_pantry_extended_features
```

## Step 2: Core Services Implementation

### 2.1 Parser Utilities

Create `/src/lib/parser/parserUtils.ts`:

```typescript
// Common Spanish ingredient modifiers to remove
const MODIFIERS = [
  'fresco', 'fresca', 'frescos', 'frescas',
  'cocido', 'cocida', 'cocidos', 'cocidas',
  'crudo', 'cruda', 'crudos', 'crudas',
  'grande', 'grandes', 'pequeño', 'pequeña',
  'maduro', 'madura', 'verde', 'verdes'
];

// Category keywords mapping
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Lácteos': ['leche', 'yogur', 'queso', 'manteca', 'crema'],
  'Carnes': ['carne', 'pollo', 'cerdo', 'vaca', 'pescado'],
  'Verduras': ['lechuga', 'tomate', 'cebolla', 'papa', 'zanahoria'],
  'Frutas': ['manzana', 'banana', 'naranja', 'pera', 'uva'],
  'Panadería': ['pan', 'galletas', 'tostadas', 'facturas'],
  'Almacén': ['arroz', 'fideos', 'aceite', 'azúcar', 'sal'],
  'Bebidas': ['agua', 'jugo', 'gaseosa', 'cerveza', 'vino'],
  'Limpieza': ['detergente', 'jabón', 'lavandina', 'esponja'],
};

export const parserUtils = {
  // Extract base ingredient name by removing modifiers
  extractBaseIngredientName(query: string): string {
    let normalized = query.toLowerCase().trim();
    
    // Remove quantities and units
    normalized = normalized.replace(/\d+\s*(kg|g|l|ml|unidades?|paquetes?|bolsas?)/gi, '');
    
    // Remove modifiers
    MODIFIERS.forEach(modifier => {
      const regex = new RegExp(`\\b${modifier}\\b`, 'gi');
      normalized = normalized.replace(regex, '');
    });
    
    // Remove extra spaces
    return normalized.replace(/\s+/g, ' ').trim();
  },

  // Normalize product name for consistency
  normalizeProductName(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^\w\s]/g, ' ') // Remove special chars
      .replace(/\s+/g, ' ')
      .trim();
  },

  // Simplify ingredient query for search
  simplifyIngredientQuery(query: string): string {
    const base = this.extractBaseIngredientName(query);
    
    // Map to simpler terms
    const simplifications: Record<string, string> = {
      'mantequilla': 'manteca',
      'mantequilla de maní': 'mantequilla mani',
      'pasta de dientes': 'dentifrico',
      'papel higiénico': 'papel higienico',
    };
    
    return simplifications[base] || base;
  },

  // Categorize product based on name
  categorizeProduct(name: string): string {
    const normalized = this.normalizeProductName(name);
    
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (keywords.some(keyword => normalized.includes(keyword))) {
        return category;
      }
    }
    
    return 'Otros';
  },

  // Parse quantity from text
  parseQuantity(text: string): { amount: number; unit: string } {
    const match = text.match(/(\d+(?:\.\d+)?)\s*(kg|g|l|ml|unidades?)?/i);
    
    if (match) {
      return {
        amount: parseFloat(match[1]),
        unit: match[2] || 'unidad'
      };
    }
    
    return { amount: 1, unit: 'unidad' };
  }
};
```

### 2.2 Store Scraping Service

Create `/src/lib/services/storeScraper.ts`:

```typescript
import { parserUtils } from '@/lib/parser/parserUtils';

export interface StoreProduct {
  id: string;
  name: string;
  price: number;
  image?: string;
  store: string;
  url: string;
  barcode?: string;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class StoreScraper {
  private static instance: StoreScraper;
  private cache = new Map<string, CacheEntry<StoreProduct[]>>();
  private readonly CACHE_TTL = 15 * 60 * 1000; // 15 minutes
  private readonly API_URL = process.env.NEXT_PUBLIC_BUSCAPRECIOS_API || 'https://buscaprecios.onrender.com';

  private constructor() {}

  static getInstance(): StoreScraper {
    if (!StoreScraper.instance) {
      StoreScraper.instance = new StoreScraper();
    }
    return StoreScraper.instance;
  }

  async searchProducts(query: string): Promise<StoreProduct[]> {
    const normalizedQuery = parserUtils.simplifyIngredientQuery(query);
    const cacheKey = `search:${normalizedQuery}`;
    
    // Check cache
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;
    
    try {
      const response = await fetch(`${this.API_URL}/?q=${encodeURIComponent(normalizedQuery)}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      const products = this.normalizeProducts(data);
      
      this.saveToCache(cacheKey, products);
      return products;
    } catch (error) {
      console.error('Store scraping error:', error);
      return this.getMockProducts(normalizedQuery);
    }
  }

  async getProductByBarcode(barcode: string): Promise<StoreProduct | null> {
    const cacheKey = `barcode:${barcode}`;
    const cached = this.getFromCache(cacheKey);
    
    if (cached && cached.length > 0) {
      return cached[0];
    }
    
    // In real implementation, would call barcode API
    // For now, return null
    return null;
  }

  private normalizeProducts(data: any[]): StoreProduct[] {
    return data.map(item => ({
      id: item.id || crypto.randomUUID(),
      name: item.nombre || item.name,
      price: parseFloat(item.precio || item.price || 0),
      image: item.imagen || item.image || null,
      store: this.normalizeStoreName(item.tienda || item.store),
      url: item.url || '',
      barcode: item.barcode
    }));
  }

  private normalizeStoreName(store: string): string {
    const normalizations: Record<string, string> = {
      'disco': 'Disco',
      'jumbo': 'Jumbo',
      'carrefour': 'Carrefour',
      'coto': 'Coto',
      'dia': 'Día',
      'vea': 'Vea'
    };
    
    const lower = store.toLowerCase();
    return normalizations[lower] || store;
  }

  private getFromCache(key: string): StoreProduct[] | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  private saveToCache(key: string, data: StoreProduct[]) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: this.CACHE_TTL
    });
  }

  private getMockProducts(query: string): StoreProduct[] {
    // Fallback mock data for development/errors
    return [
      {
        id: '1',
        name: query,
        price: 100,
        store: 'Disco',
        url: '#'
      }
    ];
  }
}

export const storeScraper = StoreScraper.getInstance();
```

### 2.3 Price Tracking Service

Create `/src/lib/services/priceTracker.ts`:

```typescript
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

export interface PriceInfo {
  productId: string;
  storeId: string;
  price: number;
  recordedAt: Date;
}

export interface PriceTrend {
  average: number;
  min: number;
  max: number;
  trend: 'up' | 'down' | 'stable';
  percentageChange: number;
}

export class PriceTracker {
  private static instance: PriceTracker;
  
  private constructor() {}
  
  static getInstance(): PriceTracker {
    if (!PriceTracker.instance) {
      PriceTracker.instance = new PriceTracker();
    }
    return PriceTracker.instance;
  }

  async trackPrice(
    productId: string, 
    storeId: string, 
    price: number,
    source: 'scraper' | 'manual' | 'receipt' = 'scraper'
  ): Promise<void> {
    await prisma.priceHistory.create({
      data: {
        productId,
        storeId,
        price: new Decimal(price),
        source
      }
    });
  }

  async getPriceHistory(productId: string, days: number = 30): Promise<PriceInfo[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);
    
    const history = await prisma.priceHistory.findMany({
      where: {
        productId,
        recordedAt: { gte: since }
      },
      orderBy: { recordedAt: 'desc' },
      include: {
        store: true
      }
    });
    
    return history.map(h => ({
      productId: h.productId,
      storeId: h.storeId,
      price: h.price.toNumber(),
      recordedAt: h.recordedAt
    }));
  }

  async getLowestPrice(productId: string): Promise<PriceInfo | null> {
    const recent = await this.getPriceHistory(productId, 7);
    
    if (recent.length === 0) return null;
    
    return recent.reduce((lowest, current) => 
      current.price < lowest.price ? current : lowest
    );
  }

  async getPriceTrends(productId: string, days: number = 30): Promise<PriceTrend> {
    const history = await this.getPriceHistory(productId, days);
    
    if (history.length === 0) {
      return {
        average: 0,
        min: 0,
        max: 0,
        trend: 'stable',
        percentageChange: 0
      };
    }
    
    const prices = history.map(h => h.price);
    const average = prices.reduce((a, b) => a + b, 0) / prices.length;
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    
    // Calculate trend
    const recentPrices = history.slice(0, Math.ceil(history.length / 3));
    const olderPrices = history.slice(-Math.ceil(history.length / 3));
    
    const recentAvg = recentPrices.reduce((a, b) => a + b.price, 0) / recentPrices.length;
    const olderAvg = olderPrices.reduce((a, b) => a + b.price, 0) / olderPrices.length;
    
    const percentageChange = ((recentAvg - olderAvg) / olderAvg) * 100;
    
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (percentageChange > 5) trend = 'up';
    else if (percentageChange < -5) trend = 'down';
    
    return {
      average,
      min,
      max,
      trend,
      percentageChange
    };
  }
}

export const priceTracker = PriceTracker.getInstance();
```

## Step 3: Pantry Management UI

### 3.1 Pantry Page

Create `/src/app/pantry/page.tsx`:

```typescript
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PantryList from "@/components/pantry/PantryList";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, Package } from "lucide-react";

export default async function PantryPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/auth/login");
  }

  const pantryItems = await prisma.pantryItem.findMany({
    where: {
      userId: session.user.id
    },
    include: {
      ingredient: true,
      extended: {
        include: {
          product: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="flex items-center space-x-2">
                <Package className="h-8 w-8 text-primary" />
                <span className="text-xl font-semibold">Mi Despensa</span>
              </Link>
            </div>
            <nav className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                Dashboard
              </Link>
              <Link href="/recipes" className="text-gray-600 hover:text-gray-900">
                Recetas
              </Link>
              <Link href="/meal-planner" className="text-gray-600 hover:text-gray-900">
                Planificador
              </Link>
              <Link href="/pantry" className="text-primary font-medium">
                Despensa
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mi Despensa</h1>
            <p className="text-gray-600 mt-1">
              Gestiona los ingredientes de tu cocina
            </p>
          </div>
          <div className="flex gap-3">
            <Button asChild>
              <Link href="/pantry/add">
                <Plus className="mr-2 h-4 w-4" />
                Agregar Item
              </Link>
            </Button>
          </div>
        </div>

        <PantryList items={pantryItems} />
      </main>
    </div>
  );
}
```

### 3.2 Pantry List Component

Create `/src/components/pantry/PantryList.tsx`:

```typescript
"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Filter, 
  Calendar,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Package,
  Barcode
} from "lucide-react";

export default function PantryList({ items }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");

  const filteredItems = items.filter(item => {
    const matchesSearch = item.ingredient.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    
    if (filter === "expiring") {
      const daysUntilExpiry = item.expirationDate 
        ? Math.ceil((new Date(item.expirationDate) - new Date()) / (1000 * 60 * 60 * 24))
        : null;
      return matchesSearch && daysUntilExpiry !== null && daysUntilExpiry <= 7;
    }
    
    if (filter === "low") {
      return matchesSearch && item.quantity <= (item.minimumQuantity || 1);
    }
    
    return matchesSearch;
  });

  const getExpiryStatus = (expirationDate) => {
    if (!expirationDate) return null;
    
    const days = Math.ceil((new Date(expirationDate) - new Date()) / (1000 * 60 * 60 * 24));
    
    if (days < 0) return { text: "Vencido", color: "bg-red-100 text-red-800" };
    if (days <= 3) return { text: `${days} días`, color: "bg-red-100 text-red-800" };
    if (days <= 7) return { text: `${days} días`, color: "bg-yellow-100 text-yellow-800" };
    if (days <= 14) return { text: `${days} días`, color: "bg-green-100 text-green-800" };
    
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            type="text"
            placeholder="Buscar en la despensa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
          >
            Todos
          </Button>
          <Button
            variant={filter === "expiring" ? "default" : "outline"}
            onClick={() => setFilter("expiring")}
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            Por vencer
          </Button>
          <Button
            variant={filter === "low" ? "default" : "outline"}
            onClick={() => setFilter("low")}
          >
            <Package className="mr-2 h-4 w-4" />
            Stock bajo
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Items</p>
                <p className="text-2xl font-bold">{items.length}</p>
              </div>
              <Package className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Por vencer</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {items.filter(item => {
                    const days = item.expirationDate 
                      ? Math.ceil((new Date(item.expirationDate) - new Date()) / (1000 * 60 * 60 * 24))
                      : null;
                    return days !== null && days <= 7 && days >= 0;
                  }).length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Stock bajo</p>
                <p className="text-2xl font-bold text-red-600">
                  {items.filter(item => item.quantity <= (item.minimumQuantity || 1)).length}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No se encontraron items
          </h3>
          <p className="text-gray-500">
            Intenta con otros filtros o agrega items a tu despensa
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map(item => {
            const expiryStatus = getExpiryStatus(item.expirationDate);
            const isLowStock = item.quantity <= (item.minimumQuantity || 1);
            
            return (
              <Card key={item.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-lg">
                      {item.ingredient.name}
                    </h3>
                    <div className="flex gap-2">
                      {expiryStatus && (
                        <Badge className={expiryStatus.color}>
                          <Calendar className="mr-1 h-3 w-3" />
                          {expiryStatus.text}
                        </Badge>
                      )}
                      {isLowStock && (
                        <Badge className="bg-red-100 text-red-800">
                          Stock bajo
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cantidad:</span>
                      <span className="font-medium">
                        {item.quantity} {item.unit || 'unidad'}
                      </span>
                    </div>
                    
                    {item.extended?.purchasePrice && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Precio compra:</span>
                        <span className="font-medium">
                          ${item.extended.purchasePrice.toFixed(2)}
                        </span>
                      </div>
                    )}
                    
                    {item.extended?.product?.barcode && (
                      <div className="flex items-center text-gray-500">
                        <Barcode className="mr-1 h-3 w-3" />
                        <span className="text-xs">{item.extended.product.barcode}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      Editar
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      Usar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

## Next Implementation Steps

1. **Run database migration** to add new tables
2. **Install required dependencies**:
   ```bash
   npm install @zxing/library @google/generative-ai zustand uuid decimal.js
   npm install --save-dev @types/uuid
   ```
3. **Add environment variables** for external APIs
4. **Create the pantry add page** with barcode scanning
5. **Implement receipt scanning** functionality
6. **Add shopping list with price integration**

This provides a solid foundation for the pantry management system with all the advanced features from the reference app.