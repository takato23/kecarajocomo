# Pantry Pricing System

## Overview

The pantry pricing system provides real-time and historical pricing data for ingredients in the pantry management system. It replaces placeholder values with actual prices derived from multiple sources.

## Components

### 1. IngredientPriceService
Main service for getting ingredient prices with the following features:
- **Cache Management**: 30-minute cache for price data to reduce database queries
- **Multiple Data Sources**: Pulls prices from receipts, stored averages, and category estimates
- **Batch Operations**: Efficient batch pricing for multiple ingredients
- **Price History**: Analyzes recent receipt data for accurate pricing

### 2. PantryManager Integration
The PantryManager now uses real prices for:
- **Pantry Value Calculation**: Total estimated value of all pantry items
- **Shopping Suggestions**: Estimated costs for repurchase recommendations
- **Value Trends**: Historical tracking of pantry value over time
- **Item Price Info**: Detailed pricing information for individual items

### 3. Data Sources

#### Primary Sources:
1. **Scanned Receipts**: Actual prices from user receipts (most accurate)
2. **Ingredient Average Price**: Stored average prices in the database
3. **Category Estimates**: Fallback prices based on ingredient categories

#### Price Update Strategy:
- New prices from receipts update the average using a weighted calculation (70% new, 30% existing)
- Prices are normalized per unit for consistent comparisons
- Premium/budget indicators adjust base category prices

## Usage Examples

### Get Pantry Statistics with Real Values
```typescript
const stats = await pantryManager.getPantryStats(userId);
console.log(`Total pantry value: $${stats.estimatedValue}`);
```

### Get Shopping Suggestions with Price Estimates
```typescript
const suggestions = await pantryManager.getShoppingSuggestions(userId);
suggestions.forEach(item => {
  console.log(`${item.name}: ${item.estimatedQuantity} units @ $${item.estimatedPrice}`);
});
```

### Track Pantry Value Over Time
```typescript
const trend = await pantryManager.getPantryValueTrend(userId, 30);
console.log(`30-day trend: ${trend.trend} (${trend.percentageChange}%)`);
```

### Get Individual Item Price Info
```typescript
const priceInfo = await pantryManager.getItemPriceInfo(itemId);
console.log(`Current price: $${priceInfo.currentPrice}`);
console.log(`Total value: $${priceInfo.totalValue}`);
```

## Price Categories

Default price estimates by category (in local currency units):
- **Dairy (lácteos)**: 150
- **Meat (carnes)**: 500
- **Seafood (pescados)**: 600
- **Vegetables (verduras)**: 80
- **Fruits (frutas)**: 100
- **Bakery (panadería)**: 120
- **Canned goods (enlatados)**: 180
- **Beverages (bebidas)**: 150
- **Frozen (congelados)**: 250
- **Condiments (condimentos)**: 200
- **Cereals (cereales)**: 220
- **Pasta**: 180
- **Snacks**: 150

## Testing

Run the test script to verify the pricing integration:
```bash
npx tsx src/services/pantry/test-pantry-prices.ts
```

## Future Enhancements

1. **Store-Specific Pricing**: Track prices by store for comparison shopping
2. **Price Alerts**: Notify users when prices drop below thresholds
3. **Seasonal Adjustments**: Factor in seasonal price variations
4. **Bulk Discount Calculation**: Consider quantity-based pricing
5. **Price Prediction**: ML-based price forecasting for budget planning