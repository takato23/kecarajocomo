/**
 * Price Tracker Service
 * Advanced price tracking and comparison engine
 */

import { PrismaClient, Store, Product, Price } from '@prisma/client';

import { normalizeIngredient } from '@/lib/parser';

const prisma = new PrismaClient();

// Temporarily disabled Prisma-based PriceTracker to keep TypeScript build green.
// A full Supabase migration will be implemented in V2.

export interface PriceComparison {
  product: unknown;
}

export interface StoreComparison {
  store: unknown;
  totalItems: number;
  totalPrice: number;
  savings: number;
  savingsPercentage: number;
  missingItems: string[];
  priceBreakdown: Array<{ productId: string; productName: string; price: number; unit: string }>;
}

export interface PriceAlert {
  id: string;
  productId: string;
  targetPrice: number;
  currentPrice: number;
  triggered: boolean;
  createdAt: Date;
}

export interface PriceTrend {
  productId: string;
  storeId: string;
  prices: { price: number; date: Date }[];
  trend: 'increasing' | 'decreasing' | 'stable';
  changePercentage: number;
  forecast?: { nextWeek: number; confidence: number };
}

export class PriceTracker {
  async compareProductPrices(): Promise<PriceComparison | null> {
    throw new Error('PriceTracker is archived pending Supabase migration');
  }
  async compareBasketPrices(): Promise<StoreComparison[]> {
    throw new Error('PriceTracker is archived pending Supabase migration');
  }
  async getProductPriceTrends(): Promise<PriceTrend[]> {
    throw new Error('PriceTracker is archived pending Supabase migration');
  }
  async createPriceAlert(): Promise<PriceAlert> {
    throw new Error('PriceTracker is archived pending Supabase migration');
  }
  async findDeals(): Promise<PriceComparison[]> {
    throw new Error('PriceTracker is archived pending Supabase migration');
  }
}