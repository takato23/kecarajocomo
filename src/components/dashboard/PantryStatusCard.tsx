'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Package, AlertTriangle, TrendingDown, ArrowRight } from 'lucide-react';

import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';

interface PantryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  daysUntilExpiry?: number;
  status: 'good' | 'low' | 'expiring';
}

interface PantryStatusCardProps {
  items?: PantryItem[];
  onViewAll?: () => void;
  onItemClick?: (item: PantryItem) => void;
}

const defaultItems: PantryItem[] = [
  { id: '1', name: 'Milk', quantity: 2, unit: 'liters', daysUntilExpiry: 3, status: 'expiring' },
  { id: '2', name: 'Eggs', quantity: 6, unit: 'pieces', status: 'low' },
  { id: '3', name: 'Olive Oil', quantity: 500, unit: 'ml', status: 'good' },
];

export function PantryStatusCard({ 
  items = defaultItems, 
  onViewAll,
  onItemClick 
}: PantryStatusCardProps) {
  const expiringCount = items.filter(item => item.status === 'expiring').length;
  const lowStockCount = items.filter(item => item.status === 'low').length;

  const getStatusIcon = (status: PantryItem['status']) => {
    switch (status) {
      case 'expiring':
        return <AlertTriangle className="w-4 h-4 text-orange-400" />;
      case 'low':
        return <TrendingDown className="w-4 h-4 text-yellow-400" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: PantryItem['status']) => {
    switch (status) {
      case 'expiring':
        return 'bg-orange-500/20 text-orange-400';
      case 'low':
        return 'bg-yellow-500/20 text-yellow-400';
      default:
        return 'bg-green-500/20 text-green-400';
    }
  };

  return (
    <GlassCard className="h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-500/20">
            <Package className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Pantry Status</h3>
            <p className="text-sm text-gray-400">Your inventory</p>
          </div>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onViewAll}
          className="flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300"
        >
          View all
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Alert Summary */}
      {(expiringCount > 0 || lowStockCount > 0) && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          {expiringCount > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              <div>
                <p className="text-sm font-medium text-white">{expiringCount}</p>
                <p className="text-xs text-gray-400">Expiring soon</p>
              </div>
            </div>
          )}
          
          {lowStockCount > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <TrendingDown className="w-5 h-5 text-yellow-400" />
              <div>
                <p className="text-sm font-medium text-white">{lowStockCount}</p>
                <p className="text-xs text-gray-400">Low stock</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Items List */}
      <div className="space-y-3">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onItemClick?.(item)}
            className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/10 cursor-pointer transition-all"
          >
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              getStatusColor(item.status).split(' ')[0]
            )}>
              {getStatusIcon(item.status) || <Package className="w-5 h-5 text-green-400" />}
            </div>
            
            <div className="flex-1">
              <p className="text-white font-medium">{item.name}</p>
              <p className="text-sm text-gray-400">
                {item.quantity} {item.unit}
              </p>
            </div>
            
            {item.daysUntilExpiry !== undefined && (
              <div className={cn(
                "px-2 py-1 rounded-full text-xs font-medium",
                getStatusColor(item.status)
              )}>
                {item.daysUntilExpiry}d
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </GlassCard>
  );
}