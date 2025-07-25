/**
 * Test script for PantryManager price integration
 * Run with: npx tsx src/services/pantry/test-pantry-prices.ts
 */

import { getPantryManager } from './PantryManager';
import { HolisticFoodSystem } from '../core/HolisticSystem';
import { getIngredientPriceService } from '../pricing/ingredientPriceService';

async function testPantryPrices() {
  console.log('🧪 Testing PantryManager price integration...\n');
  
  try {
    // Initialize system
    const system = HolisticFoodSystem.getInstance();
    const pantryManager = getPantryManager(system);
    const priceService = getIngredientPriceService();
    
    // Test user ID (you'll need to replace with a real user ID)
    const testUserId = 'test-user-123';
    
    // Test 1: Get pantry stats with real prices
    console.log('📊 Test 1: Getting pantry stats with real prices...');
    try {
      const stats = await pantryManager.getPantryStats(testUserId);
      console.log('✅ Pantry Stats:', {
        totalItems: stats.totalItems,
        estimatedValue: `$${stats.estimatedValue.toFixed(2)}`,
        expiringItems: stats.expiringItems,
        expiredItems: stats.expiredItems,
        lowStockItems: stats.lowStockItems
      });
    } catch (error) {
      console.log('❌ Error getting pantry stats:', error);
    }
    
    // Test 2: Get shopping suggestions with prices
    console.log('\n🛒 Test 2: Getting shopping suggestions with estimated prices...');
    try {
      const suggestions = await pantryManager.getShoppingSuggestions(testUserId);
      console.log('✅ Shopping Suggestions:');
      suggestions.forEach(suggestion => {
        console.log(`  - ${suggestion.name}:`);
        console.log(`    Reason: ${suggestion.reason}`);
        console.log(`    Priority: ${suggestion.priority}`);
        console.log(`    Quantity: ${suggestion.estimatedQuantity}`);
        console.log(`    Estimated Price: $${(suggestion.estimatedPrice || 0).toFixed(2)}`);
      });
    } catch (error) {
      console.log('❌ Error getting shopping suggestions:', error);
    }
    
    // Test 3: Get pantry value trend
    console.log('\n📈 Test 3: Getting pantry value trend...');
    try {
      const trend = await pantryManager.getPantryValueTrend(testUserId, 7);
      console.log('✅ Pantry Value Trend:');
      console.log(`  Trend: ${trend.trend}`);
      console.log(`  Change: ${trend.percentageChange.toFixed(2)}%`);
      console.log(`  Last 7 days values:`, trend.values.map(v => `$${v.toFixed(2)}`).join(', '));
    } catch (error) {
      console.log('❌ Error getting pantry value trend:', error);
    }
    
    // Test 4: Test ingredient price service directly
    console.log('\n💰 Test 4: Testing ingredient price service...');
    try {
      // Test with some common ingredient categories
      const testIngredientId = 'test-ingredient-123';
      const price = await priceService.getIngredientPrice(testIngredientId);
      console.log(`✅ Single ingredient price: $${price.toFixed(2)}`);
      
      // Test batch pricing
      const testIds = ['id1', 'id2', 'id3'];
      const batchPrices = await priceService.getBatchPrices(testIds);
      console.log('✅ Batch prices retrieved:', batchPrices.size, 'items');
    } catch (error) {
      console.log('❌ Error testing price service:', error);
    }
    
    console.log('\n✨ Price integration testing complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testPantryPrices().catch(console.error);