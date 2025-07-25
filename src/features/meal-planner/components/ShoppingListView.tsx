'use client';

import React, { useState, useMemo } from 'react';
import { 
  ShoppingCart,
  Check,
  Download,
  Share2,
  Calendar,
  Filter,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMealPlannerStore } from '../store/mealPlannerStore';
import { ShoppingListItem } from '../types';
import { cn } from '@/lib/utils';

export const ShoppingListView: React.FC = () => {
  const { generateShoppingList, markIngredientPurchased } = useMealPlannerStore();
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>(() => {
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + 6);
    return { start, end };
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showOnlyUnpurchased, setShowOnlyUnpurchased] = useState(false);

  // Generate shopping list
  const shoppingList = useMemo(
    () => generateShoppingList(dateRange.start, dateRange.end),
    [dateRange, generateShoppingList]
  );

  // Group items by category
  const groupedItems = useMemo(() => {
    const filtered = shoppingList.filter((item) => {
      const matchesSearch = item.ingredient.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesCategory =
        filterCategory === 'all' || item.ingredient.category === filterCategory;
      const matchesPurchased = !showOnlyUnpurchased || !item.purchased;
      
      return matchesSearch && matchesCategory && matchesPurchased;
    });

    const groups: Record<string, ShoppingListItem[]> = {};
    filtered.forEach((item) => {
      const category = item.ingredient.category || 'Other';
      if (!groups[category]) groups[category] = [];
      groups[category].push(item);
    });

    return groups;
  }, [shoppingList, searchQuery, filterCategory, showOnlyUnpurchased]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    shoppingList.forEach((item) => {
      cats.add(item.ingredient.category || 'Other');
    });
    return Array.from(cats).sort();
  }, [shoppingList]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = shoppingList.length;
    const purchased = shoppingList.filter((item) => item.purchased).length;
    const remaining = total - purchased;
    
    return { total, purchased, remaining };
  }, [shoppingList]);

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export shopping list');
  };

  const handleShare = () => {
    // TODO: Implement share functionality
    console.log('Share shopping list');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <ShoppingCart className="w-6 h-6" />
            Shopping List
          </h2>
          <p className="text-muted-foreground mt-1">
            {stats.total} items • {stats.purchased} purchased • {stats.remaining} remaining
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="px-4 py-2 text-sm font-medium hover:bg-accent rounded-lg transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={handleShare}
            className="px-4 py-2 text-sm font-medium hover:bg-accent rounded-lg transition-colors flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search ingredients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Show only unpurchased */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showOnlyUnpurchased}
            onChange={(e) => setShowOnlyUnpurchased(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">Show only unpurchased</span>
        </label>
      </div>

      {/* Shopping List */}
      <div className="space-y-6">
        {Object.entries(groupedItems).length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No items match your filters
            </p>
          </div>
        ) : (
          Object.entries(groupedItems).map(([category, items]) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <h3 className="font-medium text-lg sticky top-0 bg-background py-2">
                {category}
              </h3>
              <div className="space-y-2">
                {items.map((item) => (
                  <ShoppingListItemCard
                    key={item.ingredientId}
                    item={item}
                    onTogglePurchased={(purchased) =>
                      markIngredientPurchased(item.ingredientId, purchased)
                    }
                  />
                ))}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

// Shopping List Item Component
const ShoppingListItemCard: React.FC<{
  item: ShoppingListItem;
  onTogglePurchased: (purchased: boolean) => void;
}> = ({ item, onTogglePurchased }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "p-4 border rounded-lg transition-all",
        item.purchased && "opacity-60 bg-accent"
      )}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={() => onTogglePurchased(!item.purchased)}
          className={cn(
            "mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
            item.purchased
              ? "bg-primary border-primary"
              : "border-muted-foreground hover:border-primary"
          )}
        >
          {item.purchased && <Check className="w-3 h-3 text-primary-foreground" />}
        </button>

        <div className="flex-1">
          <div className="flex items-baseline justify-between">
            <h4 className={cn(
              "font-medium",
              item.purchased && "line-through"
            )}>
              {item.ingredient.name}
            </h4>
            <span className="text-sm font-medium">
              {item.totalAmount} {item.unit}
            </span>
          </div>
          
          <div className="mt-1 text-sm text-muted-foreground">
            <p>Used in: {item.recipes.join(', ')}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};