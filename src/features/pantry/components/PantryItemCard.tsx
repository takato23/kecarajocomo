'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Edit2, Trash2, AlertTriangle, Clock } from 'lucide-react';

import type { Database } from '@/lib/supabase/types';

type PantryItem = Database['public']['Tables']['pantry_items']['Row'] & {
  ingredient?: {
    name: string;
    category?: string;
  };
};

interface PantryItemCardProps {
  item: PantryItem;
  onUpdate: (id: string, updates: Partial<PantryItem>) => void;
  onDelete: (id: string) => void;
}

export function PantryItemCard({ item, onUpdate, onDelete }: PantryItemCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [quantity, setQuantity] = useState(item.quantity);

  const isLowStock = item.min_quantity && item.quantity <= item.min_quantity;
  const isExpiringSoon = item.expiration_date && (() => {
    const daysUntilExpiration = Math.ceil(
      (new Date(item.expiration_date).getTime() - new Date().getTime()) / 
      (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiration <= 7 && daysUntilExpiration > 0;
  })();
  const isExpired = item.expiration_date && new Date(item.expiration_date) < new Date();

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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`bg-white/80 backdrop-blur-md rounded-lg border shadow-sm p-4 ${
        isExpired ? 'border-red-300' : 
        isLowStock ? 'border-yellow-300' : 
        'border-white/20'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">
            {item.ingredient?.name || 'Unknown Item'}
          </h3>
          {item.ingredient?.category && (
            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
              getCategoryColor(item.ingredient.category)
            }`}>
              {item.ingredient.category}
            </span>
          )}
        </div>
        
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
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quantity */}
      <div className="flex items-center gap-2 mb-2">
        {isEditing ? (
          <>
            <input
              type="number"
              min="0"
              step="0.1"
              value={quantity}
              onChange={(e) => setQuantity(parseFloat(e.target.value))}
              className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-lime-500"
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
            <span className="text-lg font-semibold text-gray-900">
              {item.quantity}
            </span>
            <span className="text-sm text-gray-600">{item.unit}</span>
            {item.min_quantity && (
              <span className="text-xs text-gray-500">
                (min: {item.min_quantity})
              </span>
            )}
          </>
        )}
      </div>

      {/* Status Indicators */}
      <div className="flex flex-wrap gap-2">
        {isExpired && (
          <div className="flex items-center gap-1 text-xs text-red-600">
            <AlertTriangle className="w-3 h-3" />
            Expired
          </div>
        )}
        {isExpiringSoon && !isExpired && (
          <div className="flex items-center gap-1 text-xs text-yellow-600">
            <Clock className="w-3 h-3" />
            Expires soon
          </div>
        )}
        {isLowStock && (
          <div className="flex items-center gap-1 text-xs text-orange-600">
            <AlertTriangle className="w-3 h-3" />
            Low stock
          </div>
        )}
      </div>

      {/* Expiration Date */}
      {item.expiration_date && (
        <div className="mt-2 text-xs text-gray-500">
          Expires: {new Date(item.expiration_date).toLocaleDateString()}
        </div>
      )}

      {/* Location */}
      {item.location && (
        <div className="mt-1 text-xs text-gray-500">
          📍 {item.location}
        </div>
      )}
    </motion.div>
  );
}