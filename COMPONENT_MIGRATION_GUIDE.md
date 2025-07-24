# Component Migration Guide: Priority Components to Port

## 1. iOS26 Design System Foundation

### Step 1: Port Core CSS Variables
Create `/src/styles/ios26/foundation.css`:
```css
/* Copy from reference app:
   - Glass effects variables
   - Blur levels
   - Motion & animation timings
   - Spacing system
   - Gradients
*/
```

### Step 2: Create iOS26ThemeProvider
Location: `/src/context/iOS26ThemeProvider.tsx`
```typescript
// Key features to port:
// - Dynamic theme switching
// - Glass effect intensity control
// - Motion preferences
// - Color scheme management
```

### Step 3: Base Components
1. **iOS26Button** - Glass morphism buttons with haptic feedback
2. **iOS26Card** - Elevated glass cards with inner shadows
3. **iOS26Modal** - Blurred background modals with smooth transitions
4. **iOS26Input** - Floating label inputs with glass effects

## 2. Voice Recognition System

### Enhanced Voice Input Component
Port from: `/src/features/pantry/components/voice/EnhancedVoiceInput.tsx`

**Key Features:**
- Continuous listening mode
- Visual feedback (waveform animation)
- Multi-language support
- Error recovery
- Transcript editing

### useSpeechRecognition Hook
Enhance existing hook with:
```typescript
interface EnhancedSpeechRecognition {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  confidence: number;
  language: string;
  setLanguage: (lang: string) => void;
  startContinuousListening: () => void;
  stopListening: () => void;
  pauseListening: () => void;
  resumeListening: () => void;
}
```

## 3. Price Tracking System (BuscaPrecios)

### Core Service Architecture
```typescript
// /src/services/priceTracking/buscaPreciosService.ts
export interface PriceService {
  searchProducts(query: string): Promise<Product[]>;
  comparePrices(productId: string): Promise<PriceComparison>;
  trackPrice(productId: string): Promise<void>;
  getHistoricalPrices(productId: string): Promise<PriceHistory[]>;
}
```

### Components to Create:
1. **PriceComparisonModal** - Display price comparisons across stores
2. **PriceHistoryChart** - Visualize price trends
3. **StoreSelector** - Choose preferred stores
4. **PriceAlerts** - Set price drop notifications

## 4. Smart Scanner Enhancement

### Features to Add:
```typescript
interface SmartScannerFeatures {
  // Barcode scanning
  scanBarcode(): Promise<Product>;
  
  // Receipt OCR
  scanReceipt(): Promise<ReceiptItems[]>;
  
  // Product recognition
  recognizeProduct(image: Blob): Promise<Product>;
  
  // Batch scanning
  batchScan(images: Blob[]): Promise<Product[]>;
}
```

## 5. Shopping List V2

### Key Components:
1. **ShoppingListDashboard**
   - Overview of all lists
   - Quick add functionality
   - Store optimization view

2. **IntelligentSearch**
   - Auto-complete with price info
   - Category suggestions
   - Frequent items

3. **ListTemplates**
   - Save/load shopping lists
   - Share lists
   - Recurring lists

## 6. Advanced Pantry Features

### MagicalUnifiedInput
Combines:
- Voice input
- Camera scanning
- Text input with smart parsing
- Quick actions toolbar

### Implementation Priority:
```typescript
interface UnifiedInput {
  mode: 'voice' | 'camera' | 'text' | 'auto';
  onItemAdd: (items: PantryItem[]) => void;
  smartParsing: boolean;
  suggestions: boolean;
}
```

## 7. AI/ML Integration

### Services to Implement:
1. **Recipe Recommendation Engine**
   ```typescript
   interface RecipeAI {
     suggestRecipes(pantryItems: Item[]): Recipe[];
     adaptRecipe(recipe: Recipe, constraints: Constraints): Recipe;
     predictCookingTime(recipe: Recipe): number;
   }
   ```

2. **Smart Shopping Predictions**
   ```typescript
   interface ShoppingAI {
     predictNextPurchase(history: Purchase[]): Item[];
     suggestAlternatives(item: Item): Item[];
     optimizeRoute(items: Item[], store: Store): Route;
   }
   ```

## 8. PWA Enhancements

### Service Worker Features:
1. **Offline Recipe Access**
2. **Background Sync for Shopping Lists**
3. **Push Notifications for:**
   - Expiration alerts
   - Price drops
   - Meal reminders

### Implementation:
```typescript
// /src/service-worker.ts
self.addEventListener('install', (event) => {
  // Cache critical assets
});

self.addEventListener('sync', (event) => {
  // Sync shopping lists and pantry items
});
```

## Migration Order (Recommended)

### Week 1:
1. iOS26 Foundation CSS
2. iOS26ThemeProvider
3. Basic iOS26 components (Button, Card, Modal)

### Week 2:
1. Enhanced Voice Recognition
2. Voice Input Components
3. useSpeechRecognition improvements

### Week 3:
1. BuscaPrecios Service setup
2. Price Comparison UI
3. Basic price tracking

### Week 4:
1. Smart Scanner enhancements
2. Shopping List V2 foundation
3. Unified Input system

### Week 5-6:
1. AI services integration
2. PWA features
3. Performance optimizations

## Testing Strategy

### Unit Tests:
- All new services
- Custom hooks
- Utility functions

### Integration Tests:
- Voice recognition flow
- Price tracking flow
- Scanner workflows

### E2E Tests:
- Complete user journeys
- Cross-browser compatibility
- Mobile responsiveness

## Performance Considerations

1. **Code Splitting:**
   - Lazy load iOS26 styles
   - Dynamic imports for AI services
   - Route-based splitting

2. **Caching Strategy:**
   - Price data: 15 minutes
   - Product images: 1 week
   - User preferences: localStorage

3. **Bundle Size:**
   - Monitor with bundle analyzer
   - Tree shake unused components
   - Optimize images and assets

## Common Pitfalls to Avoid

1. **Don't port everything at once** - Incremental migration
2. **Maintain backwards compatibility** - Support existing features
3. **Test on real devices** - Especially voice and camera features
4. **Consider bundle size** - iOS26 styles can be heavy
5. **Respect API rate limits** - For price tracking services