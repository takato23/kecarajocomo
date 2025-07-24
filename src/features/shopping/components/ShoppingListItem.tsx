'use client';

import { motion } from 'framer-motion';
import { Check, X, Edit2 } from 'lucide-react';
import { useState } from 'react';

import type { Database } from '@/lib/supabase/types';

type ShoppingListItem = Database['public']['Tables']['shopping_list_items']['Row'] & {
  ingredient?: {
    name: string;
    category?: string;
  };
};

interface ShoppingListItemProps {
  item: ShoppingListItem;
  onToggle: (id: string) => void;
  onUpdate: (id: string, updates: Partial<ShoppingListItem>) => void;
  onDelete: (id: string) => void;
}

export function ShoppingListItem({ item, onToggle, onUpdate, onDelete }: ShoppingListItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [quantity, setQuantity] = useState(item.quantity);

  const handleSave = () => {
    onUpdate(item.id, { quantity });
    setIsEditing(false);
  };

  const getCategoryColor = (category?: string) => {
    const colors: Record<string, string> = {
      produce: 'bg-green-100 text-green-800',
      dairy: 'bg-blue-100 text-blue-800',
      protein: 'bg-red-100 text-red-800',
      grains: 'bg-yellow-100 text-yellow-800',
      pantry: 'bg-purple-100 text-purple-800',
      spices: 'bg-orange-100 text-orange-800',
    };
    return colors[category || ''] || 'bg-gray-100 text-gray-800';
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={`flex items-center gap-3 p-3 bg-white/80 backdrop-blur-sm rounded-lg border border-white/20 shadow-sm transition-all ${
        item.is_checked ? 'opacity-60' : ''
      }`}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle(item.id)}
        className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
          item.is_checked
            ? 'bg-lime-500 border-lime-500'
            : 'border-gray-300 hover:border-lime-500'
        }`}
      >
        {item.is_checked && <Check className="w-4 h-4 text-white" />}
      </button>

      {/* Item Details */}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className={`font-medium ${item.is_checked ? 'line-through text-gray-500' : 'text-gray-900'}`}>
            {item.ingredient?.name || 'Unknown Item'}
          </span>
          {item.ingredient?.category && (
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
              getCategoryColor(item.ingredient.category)
            }`}>
              {item.ingredient.category}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2 mt-1">
          {isEditing ? (
            <>
              <input
                type="number"
                min="0"
                step="0.1"
                value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value))}
                className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-lime-500"
              />
              <span className="text-sm text-gray-600">{item.unit}</span>
              <button
                onClick={handleSave}
                className="px-2 py-1 text-xs bg-lime-500 text-white rounded hover:bg-lime-600"
              >
                Save
              </button>
            </>
          ) : (
            <>
              <span className="text-sm text-gray-600">
                {item.quantity} {item.unit}
              </span>
              {item.notes && (
                <span className="text-sm text-gray-500 italic">• {item.notes}</span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-1">
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(item.id)}
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}