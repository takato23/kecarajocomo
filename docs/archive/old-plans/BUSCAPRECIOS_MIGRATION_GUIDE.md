# BuscaPrecios Migration Guide

This guide helps you migrate from the basic `storeScraper.ts` to the enhanced `enhancedStoreScraper.ts` with all v2 optimizations.

## 🚀 Key Improvements

### 1. **Enhanced Caching System**
- ✅ LocalStorage persistence (survives page reloads)
- ✅ Automatic cache cleanup for expired entries
- ✅ Better cache hit rates with query normalization
- ✅ Cache statistics and management

### 2. **Intelligent Retry Mechanism**
- ✅ Exponential backoff with jitter
- ✅ Configurable retry settings
- ✅ Progress updates during retries
- ✅ Timeout handling

### 3. **Service Status Monitoring**
- ✅ Cold start detection
- ✅ Performance metrics tracking
- ✅ Response time averaging
- ✅ Failure count monitoring

### 4. **Advanced Features**
- ✅ Product grouping by variations
- ✅ Query normalization for consistency
- ✅ Flexible field mapping
- ✅ Comprehensive error handling

## 📦 Migration Steps

### Step 1: Update Import

```typescript
// Old
import { storeScraper } from '@/lib/services/storeScraper';

// New
import { enhancedStoreScraper } from '@/lib/services/enhancedStoreScraper';
```

### Step 2: Update Search Calls

```typescript
// Old
const products = await storeScraper.searchProducts(query);

// New - with options
const products = await enhancedStoreScraper.searchProducts(query, {
  useCache: true,
  onProgress: (status) => console.log(status),
  timeout: 30000
});
```

### Step 3: Use the React Hook

```typescript
// New - React Hook approach
import { useEnhancedPriceScraper } from '@/hooks/useEnhancedPriceScraper';

function MyComponent() {
  const {
    products,
    productGroups,
    isLoading,
    error,
    progress,
    searchProducts,
    getCacheStats,
    clearCache
  } = useEnhancedPriceScraper({
    useCache: true,
    groupProducts: true,
    showNotifications: true
  });

  // Use the hook
  const handleSearch = (query: string) => {
    searchProducts(query);
  };
}
```

### Step 4: Update UI Components

Replace basic product displays with the enhanced components:

```typescript
import { EnhancedPriceDisplay } from '@/components/price-scraper/EnhancedPriceDisplay';
import { PriceSearchComponent } from '@/components/price-scraper/PriceSearchComponent';

// Full search component
<PriceSearchComponent
  initialQuery="leche"
  onProductSelect={(product) => console.log(product)}
/>

// Or just the display
<EnhancedPriceDisplay
  products={products}
  productGroups={productGroups}
  isLoading={isLoading}
  error={error}
  progress={progress}
/>
```

## 🔄 API Compatibility

The enhanced scraper maintains backward compatibility:

```typescript
// These methods work the same way
searchProducts(query: string)
getProductByBarcode(barcode: string)
searchMultipleProducts(queries: string[])
clearCache()
getCacheStats()
```

## 🆕 New Features

### Product Grouping

```typescript
// Group similar products
const groups = enhancedStoreScraper.groupProductsByVariation(products);

// Each group contains:
// - baseProduct (cheapest option)
// - variations (other options)
// - priceRange (min, max, avg)
```

### Service Status

```typescript
// Get real-time service status
const status = enhancedStoreScraper.getServiceStatus();
console.log({
  isWarmingUp: status.isWarmingUp,
  avgResponseTime: status.averageResponseTime,
  failureCount: status.failureCount
});
```

### Progress Tracking

```typescript
// Track operation progress
await enhancedStoreScraper.searchProducts(query, {
  onProgress: (status) => {
    // "Using cached results"
    // "Service is warming up..."
    // "Retrying in 2s... (attempt 1/3)"
    console.log(status);
  }
});
```

## 🏗️ Architecture Changes

### Old Architecture
```
storeScraper.ts
  ↓
In-memory cache only
  ↓
Basic error handling
  ↓
Simple retry
```

### New Architecture
```
enhancedStoreScraper.ts
  ↓
LocalStorage + Memory cache
  ↓
Intelligent retry with backoff
  ↓
Service status monitoring
  ↓
Query normalization
  ↓
Product grouping
```

## 🎯 Best Practices

### 1. Use the React Hook
```typescript
// Preferred approach for React components
const scraper = useEnhancedPriceScraper({
  useCache: true,
  groupProducts: true
});
```

### 2. Handle Loading States
```typescript
if (scraper.isWarmingUp) {
  // Show warming up message
}

if (scraper.progress) {
  // Show progress updates
}
```

### 3. Monitor Cache Usage
```typescript
const stats = scraper.getCacheStats();
if (stats.size > 100) {
  scraper.clearCache();
}
```

### 4. Implement Error Handling
```typescript
const scraper = useEnhancedPriceScraper({
  onError: (error) => {
    // Log to error tracking service
    console.error('Price scraping failed:', error);
  }
});
```

## 🔧 Configuration

### Environment Variables
```env
NEXT_PUBLIC_BUSCAPRECIOS_API=https://buscaprecios.onrender.com
```

### Default Settings
```typescript
// Cache TTL: 15 minutes
// Max retries: 3
// Initial delay: 2000ms
// Max delay: 10000ms
// Timeout: 30000ms
```

## 📊 Performance Comparison

| Feature | Old | New |
|---------|-----|-----|
| Cache persistence | ❌ | ✅ |
| Retry mechanism | Basic | Exponential backoff |
| Query normalization | ❌ | ✅ |
| Product grouping | ❌ | ✅ |
| Progress tracking | ❌ | ✅ |
| Service monitoring | ❌ | ✅ |
| Response time | ~2-5s | <2s (cached: <100ms) |

## 🐛 Troubleshooting

### Cache Issues
```typescript
// Clear cache if having issues
enhancedStoreScraper.clearCache();

// Check cache stats
const stats = enhancedStoreScraper.getCacheStats();
console.log(`Cache entries: ${stats.size}, Size: ${stats.totalSize}`);
```

### Slow Performance
```typescript
// Check service status
const status = enhancedStoreScraper.getServiceStatus();
if (status.isWarmingUp) {
  // Service is cold starting
}
```

### Network Errors
```typescript
// Increase timeout for slow connections
await enhancedStoreScraper.searchProducts(query, {
  timeout: 60000, // 60 seconds
  retryConfig: {
    maxRetries: 5,
    initialDelay: 3000
  }
});
```

## 🚀 Next Steps

1. **Update all components** using the old scraper
2. **Test caching behavior** in your application
3. **Monitor performance** using service status
4. **Implement error tracking** for production
5. **Consider adding** price history tracking
6. **Set up monitoring** for scraper health

## 📝 Example Implementation

```typescript
// pages/products/search.tsx
import { PriceSearchComponent } from '@/components/price-scraper/PriceSearchComponent';
import { useRouter } from 'next/navigation';

export default function ProductSearchPage() {
  const router = useRouter();

  const handleProductSelect = (product) => {
    // Navigate to product detail page
    router.push(`/products/${product.id}`);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">
        Buscar Precios
      </h1>
      
      <PriceSearchComponent
        onProductSelect={handleProductSelect}
        showHistory={true}
      />
    </div>
  );
}
```

## 🎉 Conclusion

The enhanced scraper provides a robust, production-ready solution for price scraping with:
- Better performance through intelligent caching
- Improved reliability with retry mechanisms
- Enhanced user experience with progress tracking
- Comprehensive monitoring and statistics

Start migrating today to take advantage of these improvements!