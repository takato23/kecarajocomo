/**
 * Store Comparison Table Component
 * Compare basket prices across multiple stores
 */

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  ShoppingCart, 
  Navigation,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  X
} from 'lucide-react';

import { StoreComparison } from '@/services/pricing';
import { cn } from '@/lib/utils';

interface StoreComparisonTableProps {
  comparisons: StoreComparison[];
  totalPotentialSavings: number;
  onSelectStore?: (storeId: string) => void;
  onOptimizeRoute?: () => void;
  className?: string;
}

export const StoreComparisonTable: React.FC<StoreComparisonTableProps> = ({
  comparisons,
  totalPotentialSavings,
  onSelectStore,
  onOptimizeRoute,
  className
}) => {
  const [selectedStores, setSelectedStores] = useState<Set<string>>(new Set());
  const [showBreakdown, setShowBreakdown] = useState<string | null>(null);
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(price);
  };
  
  const toggleStoreSelection = (storeId: string) => {
    const newSelection = new Set(selectedStores);
    if (newSelection.has(storeId)) {
      newSelection.delete(storeId);
    } else {
      newSelection.add(storeId);
    }
    setSelectedStores(newSelection);
  };
  
  const getCompletionPercentage = (comparison: StoreComparison) => {
    const totalItems = comparison.totalItems + comparison.missingItems.length;
    return totalItems > 0 ? (comparison.totalItems / totalItems) * 100 : 0;
  };
  
  const getBestValueStore = () => {
    if (comparisons.length === 0) return null;
    
    // Score based on price (50%), completion (30%), savings (20%)
    return comparisons.reduce((best, current) => {
      const currentCompletion = getCompletionPercentage(current);
      const bestCompletion = getCompletionPercentage(best);
      
      const currentScore = 
        (1 - current.totalPrice / Math.max(...comparisons.map(c => c.totalPrice))) * 0.5 +
        (currentCompletion / 100) * 0.3 +
        (current.savingsPercentage / 100) * 0.2;
        
      const bestScore = 
        (1 - best.totalPrice / Math.max(...comparisons.map(c => c.totalPrice))) * 0.5 +
        (bestCompletion / 100) * 0.3 +
        (best.savingsPercentage / 100) * 0.2;
      
      return currentScore > bestScore ? current : best;
    });
  };
  
  const bestValueStore = getBestValueStore();
  
  return (
    <div className={cn("space-y-6", className)}>
      {/* Summary Header */}
      <iOS26LiquidCard variant="medium" glow className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Comparación de Tiendas
          </h2>
          {totalPotentialSavings > 0 && (
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400">Ahorro máximo</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatPrice(totalPotentialSavings)}
              </p>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
            <ShoppingCart className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {comparisons.length}
            </p>
            <p className="text-sm text-blue-600 dark:text-blue-400">Tiendas comparadas</p>
          </div>
          
          <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
            <TrendingDown className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">
              {comparisons[0]?.savingsPercentage.toFixed(1) || 0}%
            </p>
            <p className="text-sm text-green-600 dark:text-green-400">Mejor ahorro</p>
          </div>
          
          <div className="text-center p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20">
            <Navigation className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              {selectedStores.size}
            </p>
            <p className="text-sm text-purple-600 dark:text-purple-400">Tiendas seleccionadas</p>
          </div>
        </div>
        
        {onOptimizeRoute && selectedStores.size > 0 && (
          <div className="mt-4">
            <iOS26LiquidButton
              variant="primary"
              onClick={onOptimizeRoute}
              icon={<Navigation className="w-4 h-4" />}
              glow
            >
              Optimizar Ruta de Compras
            </iOS26LiquidButton>
          </div>
        )}
      </iOS26LiquidCard>
      
      {/* Store Comparison Cards */}
      <div className="space-y-4">
        {comparisons.map((comparison, index) => {
          const completion = getCompletionPercentage(comparison);
          const isBestValue = bestValueStore?.store.id === comparison.store.id;
          const isSelected = selectedStores.has(comparison.store.id);
          
          return (
            <motion.div
              key={comparison.store.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <iOS26LiquidCard 
                variant={isBestValue ? "medium" : "subtle"} 
                glow={isBestValue}
                className={cn(
                  "p-6 transition-all cursor-pointer",
                  isSelected && "ring-2 ring-purple-500",
                  isBestValue && "border-2 border-green-500"
                )}
                onClick={() => toggleStoreSelection(comparison.store.id)}
              >
                <div className="space-y-4">
                  {/* Store Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            {comparison.store.name}
                          </h3>
                          {isBestValue && (
                            <span className="px-2 py-1 text-xs font-semibold text-green-700 bg-green-100 dark:bg-green-900 dark:text-green-300 rounded-full">
                              Mejor Opción
                            </span>
                          )}
                        </div>
                        {comparison.store.address && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1 mt-1">
                            <MapPin className="w-4 h-4" />
                            {comparison.store.address}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {formatPrice(comparison.totalPrice)}
                      </p>
                      {comparison.savingsPercentage > 0 && (
                        <p className="text-sm text-green-600 dark:text-green-400">
                          -{comparison.savingsPercentage.toFixed(1)}% ahorro
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Completion Status */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        Productos disponibles
                      </span>
                      <span className="font-medium">
                        {comparison.totalItems} / {comparison.totalItems + comparison.missingItems.length}
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <motion.div
                        className={cn(
                          "h-2 rounded-full",
                          completion === 100 ? "bg-green-500" : 
                          completion >= 80 ? "bg-yellow-500" : "bg-red-500"
                        )}
                        initial={{ width: 0 }}
                        animate={{ width: `${completion}%` }}
                        transition={{ delay: index * 0.1 + 0.2, duration: 0.8 }}
                      />
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                        <CheckCircle className="w-4 h-4" />
                        <span>{comparison.totalItems} disponibles</span>
                      </div>
                      {comparison.missingItems.length > 0 && (
                        <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                          <X className="w-4 h-4" />
                          <span>{comparison.missingItems.length} faltantes</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Missing Items Alert */}
                  {comparison.missingItems.length > 0 && (
                    <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                        <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                          Productos no disponibles
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {comparison.missingItems.slice(0, 3).map((item, idx) => (
                          <span key={idx} className="px-2 py-1 text-xs bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded">
                            {item}
                          </span>
                        ))}
                        {comparison.missingItems.length > 3 && (
                          <span className="px-2 py-1 text-xs bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded">
                            +{comparison.missingItems.length - 3} más
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <iOS26LiquidButton
                      variant={showBreakdown === comparison.store.id ? "secondary" : "ghost"}
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowBreakdown(
                          showBreakdown === comparison.store.id ? null : comparison.store.id
                        );
                      }}
                    >
                      Ver Desglose
                    </iOS26LiquidButton>
                    
                    {onSelectStore && (
                      <iOS26LiquidButton
                        variant="primary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectStore(comparison.store.id);
                        }}
                      >
                        Seleccionar Tienda
                      </iOS26LiquidButton>
                    )}
                  </div>
                  
                  {/* Price Breakdown */}
                  <AnimatePresence>
                    {showBreakdown === comparison.store.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-4 space-y-2">
                          <h4 className="font-medium text-gray-700 dark:text-gray-300">
                            Desglose de precios
                          </h4>
                          <div className="space-y-1 max-h-48 overflow-y-auto">
                            {comparison.priceBreakdown.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-sm p-2 rounded bg-gray-50 dark:bg-gray-800">
                                <span className="text-gray-700 dark:text-gray-300">
                                  {item.productName}
                                </span>
                                <span className="font-medium">
                                  {formatPrice(item.price)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </iOS26LiquidCard>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};