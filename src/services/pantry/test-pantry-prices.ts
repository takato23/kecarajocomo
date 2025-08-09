/**
 * Test script for PantryManager price integration
 * Run with: npx tsx src/services/pantry/test-pantry-prices.ts
 */

import { HolisticFoodSystem } from '../core/HolisticSystem';
import { getIngredientPriceService } from '../pricing/ingredientPriceService';
import { logger } from '@/services/logger';

import { getPantryManager } from './PantryManager';

async function testPantryPrices() {
  logger.info('🧪 Testing PantryManager price integration...\n', 'test-pantry-prices');
  
  try {
    // Initialize system
    const system = HolisticFoodSystem.getInstance();
    const pantryManager = getPantryManager(system);
    const priceService = getIngredientPriceService();
    
    // Test user ID (you'll need to replace with a real user ID)
    const testUserId = 'test-user-123';
    
    // Test 1: Get pantry stats with real prices
    logger.info('📊 Test 1: Getting pantry stats with real prices...', 'test-pantry-prices');
    try {
      const stats = await pantryManager.getPantryStats(testUserId);
      logger.info('✅ Pantry Stats:', 'test-pantry-prices', {
        totalItems: stats.totalItems,
        estimatedValue: `$${stats.estimatedValue.toFixed(2)}`,
        expiringItems: stats.expiringItems,
        expiredItems: stats.expiredItems,
        lowStockItems: stats.lowStockItems
      });
    } catch (error) {
      logger.info('❌ Error getting pantry stats:', 'test-pantry-prices', error);
    }
    
    // Test 2: Get shopping suggestions with prices
    logger.info('\n🛒 Test 2: Getting shopping suggestions with estimated prices...', 'test-pantry-prices');
    try {
      const suggestions = await pantryManager.getShoppingSuggestions(testUserId);
      logger.info('✅ Shopping Suggestions:', 'test-pantry-prices');
      suggestions.forEach(suggestion => {
        logger.info(`  - ${suggestion.name}:`, 'test-pantry-prices');
        logger.info(`    Reason: ${suggestion.reason}`, 'test-pantry-prices');
        logger.info(`    Priority: ${suggestion.priority}`, 'test-pantry-prices');
        logger.info(`    Quantity: ${suggestion.estimatedQuantity}`, 'test-pantry-prices');
        logger.info(`    Estimated Price: $${(suggestion.estimatedPrice || 0).toFixed(2, 'test-pantry-prices')}`);
      });
    } catch (error) {
      logger.info('❌ Error getting shopping suggestions:', 'test-pantry-prices', error);
    }
    
    // Test 3: Get pantry value trend
    logger.info('\n📈 Test 3: Getting pantry value trend...', 'test-pantry-prices');
    try {
      const trend = await pantryManager.getPantryValueTrend(testUserId, 7);
      logger.info('✅ Pantry Value Trend:', 'test-pantry-prices');
      logger.info(`  Trend: ${trend.trend}`, 'test-pantry-prices');
      logger.info(`  Change: ${trend.percentageChange.toFixed(2, 'test-pantry-prices')}%`);
      logger.info(`  Last 7 days values:`, 'test-pantry-prices', trend.values.map(v => `$${v.toFixed(2)}`).join(', '));
    } catch (error) {
      logger.info('❌ Error getting pantry value trend:', 'test-pantry-prices', error);
    }
    
    // Test 4: Test ingredient price service directly
    logger.info('\n💰 Test 4: Testing ingredient price service...', 'test-pantry-prices');
    try {
      // Test with some common ingredient categories
      const testIngredientId = 'test-ingredient-123';
      const price = await priceService.getIngredientPrice(testIngredientId);
      logger.info(`✅ Single ingredient price: $${price.toFixed(2, 'test-pantry-prices')}`);
      
      // Test batch pricing
      const testIds = ['id1', 'id2', 'id3'];
      const batchPrices = await priceService.getBatchPrices(testIds);
      logger.info('✅ Batch prices retrieved:', 'test-pantry-prices', batchPrices.size, 'items');
    } catch (error) {
      logger.info('❌ Error testing price service:', 'test-pantry-prices', error);
    }
    
    logger.info('\n✨ Price integration testing complete!', 'test-pantry-prices');
    
  } catch (error) {
    logger.error('❌ Test failed:', 'test-pantry-prices', error);
  }
}

// Run the test
testPantryPrices().catch(console.error);