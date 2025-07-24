'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Search } from 'lucide-react';

import type { Database } from '@/lib/supabase/types';

type ShoppingListItem = Omit<
  Database['public']['Tables']['shopping_list_items']['Row'],
  'id' | 'shopping_list_id' | 'created_at'
>;

interface AddShoppingItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: ShoppingListItem) => void;
}

const UNITS = ['piece', 'cup', 'tbsp', 'tsp', 'oz', 'lb', 'g', 'kg', 'ml', 'l', 'can', 'jar', 'box', 'bag'];

// Common shopping items for quick add
const COMMON_ITEMS = [
  { name: 'Milk', unit: 'l', category: 'dairy' },
  { name: 'Eggs', unit: 'piece', category: 'dairy' },
  { name: 'Bread', unit: 'piece', category: 'grains' },
  { name: 'Chicken Breast', unit: 'lb', category: 'protein' },
  { name: 'Ground Beef', unit: 'lb', category: 'protein' },
  { name: 'Tomatoes', unit: 'piece', category: 'produce' },
  { name: 'Lettuce', unit: 'piece', category: 'produce' },
  { name: 'Bananas', unit: 'piece', category: 'produce' },
  { name: 'Apples', unit: 'piece', category: 'produce' },
  { name: 'Rice', unit: 'bag', category: 'grains' },
  { name: 'Pasta', unit: 'box', category: 'grains' },
  { name: 'Olive Oil', unit: 'ml', category: 'pantry' },
];

export function AddShoppingItemModal({ isOpen, onClose, onAdd }: AddShoppingItemModalProps) {
  const [formData, setFormData] = useState<ShoppingListItem>({
    ingredient_id: '',
    quantity: 1,
    unit: 'piece',
    is_checked: false,
    notes: null,
  });
  const [ingredientName, setIngredientName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingredientName.trim()) return;

    // In a real app, we'd look up or create the ingredient
    // For now, we'll use a temporary ID
    onAdd({
      ...formData,
      ingredient_id: `temp-${Date.now()}`,
    });

    // Reset form
    setFormData({
      ingredient_id: '',
      quantity: 1,
      unit: 'piece',
      is_checked: false,
      notes: null,
    });
    setIngredientName('');
    setSearchQuery('');
    onClose();
  };

  const handleQuickAdd = (item: typeof COMMON_ITEMS[0]) => {
    setIngredientName(item.name);
    setFormData(prev => ({
      ...prev,
      unit: item.unit,
    }));
  };

  const filteredItems = COMMON_ITEMS.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Add Shopping Item</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Quick Search */}
          <div className="mb-6">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search common items..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
              />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {filteredItems.map((item, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleQuickAdd(item)}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors text-left"
                >
                  <div>{item.name}</div>
                  <div className="text-xs text-gray-500">{item.category}</div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Item Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Item Name *
              </label>
              <input
                type="text"
                value={ingredientName}
                onChange={(e) => setIngredientName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
                placeholder="e.g., Tomatoes"
                required
              />
            </div>

            {/* Quantity and Unit */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit *
                </label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
                  required
                >
                  {UNITS.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <input
                type="text"
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value || null })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
                placeholder="e.g., Organic, ripe, specific brand..."
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-gradient-to-r from-lime-500 to-lime-600 text-white rounded-lg hover:from-lime-600 hover:to-lime-700 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Item
          </button>
        </div>
      </motion.div>
    </div>
  );
}