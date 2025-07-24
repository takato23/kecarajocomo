'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Check, Plus, Sparkles } from 'lucide-react';

import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';

interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  checked?: boolean;
}

interface ShoppingListCardProps {
  items?: ShoppingItem[];
  onAddItem?: () => void;
  onToggleItem?: (item: ShoppingItem) => void;
  onGenerateList?: () => void;
}

const defaultItems: ShoppingItem[] = [
  { id: '1', name: 'Tomatoes', quantity: 4, unit: 'pieces', category: 'Produce', checked: true },
  { id: '2', name: 'Chicken Breast', quantity: 500, unit: 'g', category: 'Meat' },
  { id: '3', name: 'Olive Oil', quantity: 1, unit: 'bottle', category: 'Pantry' },
  { id: '4', name: 'Bell Peppers', quantity: 3, unit: 'pieces', category: 'Produce' },
];

export function ShoppingListCard({ 
  items = defaultItems, 
  onAddItem,
  onToggleItem,
  onGenerateList
}: ShoppingListCardProps) {
  const completedCount = items.filter(item => item.checked).length;
  const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0;

  // Group items by category
  const groupedItems = items.reduce((groups, item) => {
    const category = item.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(item);
    return groups;
  }, {} as Record<string, ShoppingItem[]>);

  return (
    <GlassCard className="h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/20">
            <ShoppingCart className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Shopping List</h3>
            <p className="text-sm text-gray-400">{items.length} items</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onGenerateList}
            className="p-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 transition-colors"
            title="Generate AI shopping list"
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onAddItem}
            className="p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 transition-colors"
          >
            <Plus className="w-4 h-4 text-blue-400" />
          </motion.button>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-400">Shopping Progress</span>
          <span className="text-sm text-white font-medium">{completedCount}/{items.length}</span>
        </div>
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
          />
        </div>
      </div>

      {/* Items by Category */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {Object.entries(groupedItems).map(([category, categoryItems]) => (
          <div key={category}>
            <h4 className="text-sm font-medium text-gray-400 mb-2">{category}</h4>
            <div className="space-y-2">
              {categoryItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => onToggleItem?.(item)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all",
                    "hover:bg-white/10",
                    item.checked && "opacity-60"
                  )}
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className={cn(
                      "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                      item.checked 
                        ? "bg-green-500 border-green-500" 
                        : "border-gray-400 hover:border-white"
                    )}
                  >
                    {item.checked && (
                      <Check className="w-4 h-4 text-white" />
                    )}
                  </motion.div>
                  
                  <div className="flex-1">
                    <p className={cn(
                      "text-white",
                      item.checked && "line-through"
                    )}>
                      {item.name}
                    </p>
                  </div>
                  
                  <span className="text-sm text-gray-400">
                    {item.quantity} {item.unit}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}