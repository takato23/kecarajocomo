/**
 * Pricing Slice - Price tracking state management
 */

import { StateCreator } from 'zustand';

export interface PriceData {
  id: string;
  productId: string;
  storeId: string;
  price: number;
  unit: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Store {
  id: string;
  name: string;
  address?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  name: string;
  normalizedName: string;
  category?: string;
  brand?: string;
  barcode?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PriceAlert {
  id: string;
  productId: string;
  targetPrice: number;
  currentPrice: number;
  triggered: boolean;
  userId: string;
  createdAt: Date;
  triggeredAt?: Date;
}

export interface PriceComparison {
  productId: string;
  product: Product;
  prices: (PriceData & { store: Store })[];
  lowestPrice?: {
    price: number;
    store: Store;
    priceId: string;
  };
  highestPrice?: {
    price: number;
    store: Store;
    priceId: string;
  };
  averagePrice: number;
  savings: {
    amount: number;
    percentage: number;
  };
  lastUpdated: Date;
}

export interface StoreComparison {
  store: Store;
  totalItems: number;
  totalPrice: number;
  savings: number;
  savingsPercentage: number;
  missingItems: string[];
  priceBreakdown: {
    productId: string;
    productName: string;
    price: number;
    unit: string;
  }[];
}

export interface PricingSlice {
  pricing: {
    prices: PriceData[];
    products: Product[];
    stores: Store[];
    alerts: PriceAlert[];
    comparisons: PriceComparison[];
    storeComparisons: StoreComparison[];
    deals: {
      id: string;
      productId: string;
      storeId: string;
      originalPrice: number;
      salePrice: number;
      discount: number;
      validUntil?: Date;
      createdAt: Date;
    }[];
    settings: {
      autoUpdatePrices: boolean;
      alertsEnabled: boolean;
      trackingEnabled: boolean;
      maxPriceAge: number; // in hours
      defaultStore?: string;
      priceThreshold: number; // minimum price difference to alert
    };
    isLoading: boolean;
    lastUpdate?: Date;
    lastSync?: Date;
  };
  
  // Actions
  updatePrices: (prices: Omit<PriceData, 'id' | 'createdAt' | 'updatedAt'>[]) => void;
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  
  addStore: (store: Omit<Store, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateStore: (id: string, updates: Partial<Store>) => void;
  deleteStore: (id: string) => void;
  
  addPriceAlert: (alert: Omit<PriceAlert, 'id' | 'createdAt'>) => void;
  updatePriceAlert: (id: string, updates: Partial<PriceAlert>) => void;
  deletePriceAlert: (id: string) => void;
  triggerPriceAlert: (id: string) => void;
  
  compareProductPrices: (productId: string) => void;
  updateStoreComparisons: (items: { name: string; quantity: number; unit?: string }[]) => void;
  
  findDeals: (category?: string, minDiscount?: number) => void;
  trackPriceTrends: (productId: string, days?: number) => void;
  
  updatePricingSettings: (settings: Partial<typeof pricing.settings>) => void;
  setPricingLoading: (loading: boolean) => void;
  syncPrices: () => void;
}

const defaultSettings = {
  autoUpdatePrices: true,
  alertsEnabled: true,
  trackingEnabled: true,
  maxPriceAge: 24, // 24 hours
  defaultStore: undefined,
  priceThreshold: 50 // 50 ARS minimum difference
};

export const createPricingSlice: StateCreator<PricingSlice> = (set, get) => ({
  pricing: {
    prices: [],
    products: [],
    stores: [],
    alerts: [],
    comparisons: [],
    storeComparisons: [],
    deals: [],
    settings: defaultSettings,
    isLoading: false,
    lastUpdate: undefined,
    lastSync: undefined
  },
  
  updatePrices: (newPrices) => set((state) => {
    newPrices.forEach(priceData => {
      // Check if price already exists
      const existingIndex = state.pricing.prices.findIndex(p => 
        p.productId === priceData.productId && p.storeId === priceData.storeId
      );
      
      if (existingIndex !== -1) {
        // Update existing price
        const existing = state.pricing.prices[existingIndex];
        existing.price = priceData.price;
        existing.unit = priceData.unit;
        existing.active = priceData.active;
        existing.updatedAt = new Date();
      } else {
        // Add new price
        const newPrice: PriceData = {
          ...priceData,
          id: Date.now().toString() + Math.random(),
          createdAt: new Date(),
          updatedAt: new Date()
        };
        state.pricing.prices.push(newPrice);
      }
    });
    
    state.pricing.lastUpdate = new Date();
    
    // Check for triggered alerts
    get().checkPriceAlerts();
  }),
  
  addProduct: (product) => set((state) => {
    const newProduct: Product = {
      ...product,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    state.pricing.products.push(newProduct);
  }),
  
  updateProduct: (id, updates) => set((state) => {
    const index = state.pricing.products.findIndex(p => p.id === id);
    if (index !== -1) {
      Object.assign(state.pricing.products[index], updates, { updatedAt: new Date() });
    }
  }),
  
  deleteProduct: (id) => set((state) => {
    state.pricing.products = state.pricing.products.filter(p => p.id !== id);
    state.pricing.prices = state.pricing.prices.filter(p => p.productId !== id);
    state.pricing.alerts = state.pricing.alerts.filter(a => a.productId !== id);
    state.pricing.comparisons = state.pricing.comparisons.filter(c => c.productId !== id);
  }),
  
  addStore: (store) => set((state) => {
    const newStore: Store = {
      ...store,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    state.pricing.stores.push(newStore);
  }),
  
  updateStore: (id, updates) => set((state) => {
    const index = state.pricing.stores.findIndex(s => s.id === id);
    if (index !== -1) {
      Object.assign(state.pricing.stores[index], updates, { updatedAt: new Date() });
    }
  }),
  
  deleteStore: (id) => set((state) => {
    state.pricing.stores = state.pricing.stores.filter(s => s.id !== id);
    state.pricing.prices = state.pricing.prices.filter(p => p.storeId !== id);
  }),
  
  addPriceAlert: (alert) => set((state) => {
    const newAlert: PriceAlert = {
      ...alert,
      id: Date.now().toString(),
      createdAt: new Date()
    };
    state.pricing.alerts.push(newAlert);
  }),
  
  updatePriceAlert: (id, updates) => set((state) => {
    const index = state.pricing.alerts.findIndex(a => a.id === id);
    if (index !== -1) {
      Object.assign(state.pricing.alerts[index], updates);
    }
  }),
  
  deletePriceAlert: (id) => set((state) => {
    state.pricing.alerts = state.pricing.alerts.filter(a => a.id !== id);
  }),
  
  triggerPriceAlert: (id) => set((state) => {
    const alert = state.pricing.alerts.find(a => a.id === id);
    if (alert) {
      alert.triggered = true;
      alert.triggeredAt = new Date();
    }
  }),
  
  compareProductPrices: (productId) => set((state) => {
    const product = state.pricing.products.find(p => p.id === productId);
    if (!product) return;
    
    const productPrices = state.pricing.prices
      .filter(p => p.productId === productId && p.active)
      .map(price => ({
        ...price,
        store: state.pricing.stores.find(s => s.id === price.storeId)!
      }))
      .filter(p => p.store);
    
    if (productPrices.length === 0) return;
    
    // Calculate comparison data
    const sortedPrices = productPrices.sort((a, b) => a.price - b.price);
    const lowestPrice = sortedPrices[0];
    const highestPrice = sortedPrices[sortedPrices.length - 1];
    const averagePrice = productPrices.reduce((sum, p) => sum + p.price, 0) / productPrices.length;
    
    const savings = {
      amount: highestPrice.price - lowestPrice.price,
      percentage: ((highestPrice.price - lowestPrice.price) / highestPrice.price) * 100
    };
    
    const comparison: PriceComparison = {
      productId,
      product,
      prices: productPrices,
      lowestPrice: {
        price: lowestPrice.price,
        store: lowestPrice.store,
        priceId: lowestPrice.id
      },
      highestPrice: {
        price: highestPrice.price,
        store: highestPrice.store,
        priceId: highestPrice.id
      },
      averagePrice,
      savings,
      lastUpdated: new Date()
    };
    
    // Update or add comparison
    const existingIndex = state.pricing.comparisons.findIndex(c => c.productId === productId);
    if (existingIndex !== -1) {
      state.pricing.comparisons[existingIndex] = comparison;
    } else {
      state.pricing.comparisons.push(comparison);
    }
  }),
  
  updateStoreComparisons: (items) => set((state) => {
    const storeComparisons: StoreComparison[] = [];
    
    state.pricing.stores.filter(store => store.active).forEach(store => {
      let totalPrice = 0;
      let totalItems = 0;
      const priceBreakdown: StoreComparison['priceBreakdown'] = [];
      const missingItems: string[] = [];
      
      items.forEach(item => {
        const product = state.pricing.products.find(p => 
          p.normalizedName.includes(item.name.toLowerCase()) ||
          p.name.toLowerCase().includes(item.name.toLowerCase())
        );
        
        if (product) {
          const price = state.pricing.prices.find(p => 
            p.productId === product.id && p.storeId === store.id && p.active
          );
          
          if (price) {
            const itemTotal = price.price * item.quantity;
            totalPrice += itemTotal;
            totalItems++;
            
            priceBreakdown.push({
              productId: product.id,
              productName: product.name,
              price: itemTotal,
              unit: price.unit
            });
          } else {
            missingItems.push(item.name);
          }
        } else {
          missingItems.push(item.name);
        }
      });
      
      storeComparisons.push({
        store,
        totalItems,
        totalPrice,
        savings: 0, // Will be calculated after all stores
        savingsPercentage: 0,
        missingItems,
        priceBreakdown
      });
    });
    
    // Calculate savings relative to most expensive option
    if (storeComparisons.length > 0) {
      const maxPrice = Math.max(...storeComparisons.map(c => c.totalPrice));
      
      storeComparisons.forEach(comparison => {
        comparison.savings = maxPrice - comparison.totalPrice;
        comparison.savingsPercentage = (comparison.savings / maxPrice) * 100;
      });
      
      // Sort by total price (cheapest first)
      storeComparisons.sort((a, b) => a.totalPrice - b.totalPrice);
    }
    
    state.pricing.storeComparisons = storeComparisons;
  }),
  
  findDeals: (category, minDiscount = 10) => set((state) => {
    const deals: typeof state.pricing.deals = [];
    
    // Find products with significant price variations
    state.pricing.products.forEach(product => {
      if (category && product.category !== category) return;
      
      const productPrices = state.pricing.prices
        .filter(p => p.productId === product.id && p.active);
      
      if (productPrices.length < 2) return;
      
      const prices = productPrices.map(p => p.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const discount = ((maxPrice - minPrice) / maxPrice) * 100;
      
      if (discount >= minDiscount) {
        const bestPriceData = productPrices.find(p => p.price === minPrice);
        if (bestPriceData) {
          deals.push({
            id: `deal-${product.id}-${bestPriceData.storeId}`,
            productId: product.id,
            storeId: bestPriceData.storeId,
            originalPrice: maxPrice,
            salePrice: minPrice,
            discount,
            createdAt: new Date()
          });
        }
      }
    });
    
    // Sort by discount percentage
    deals.sort((a, b) => b.discount - a.discount);
    
    state.pricing.deals = deals;
  }),
  
  trackPriceTrends: (productId, days = 30) => {
    // This would analyze price history and trends
    // Implementation would depend on historical price data

  },
  
  updatePricingSettings: (settings) => set((state) => {
    Object.assign(state.pricing.settings, settings);
  }),
  
  setPricingLoading: (loading) => set((state) => {
    state.pricing.isLoading = loading;
  }),
  
  syncPrices: () => set((state) => {
    // This would sync with external price data sources
    state.pricing.lastSync = new Date();
    
    // Trigger price comparisons for tracked products
    state.pricing.products.forEach(product => {
      get().compareProductPrices(product.id);
    });
  }),
  
  // Helper method to check price alerts
  checkPriceAlerts: () => {
    const state = get();
    
    state.pricing.alerts.forEach(alert => {
      if (alert.triggered) return;
      
      const currentPrices = state.pricing.prices
        .filter(p => p.productId === alert.productId && p.active)
        .map(p => p.price);
      
      if (currentPrices.length > 0) {
        const lowestCurrentPrice = Math.min(...currentPrices);
        
        if (lowestCurrentPrice <= alert.targetPrice) {
          get().triggerPriceAlert(alert.id);
        }
      }
    });
  }
});