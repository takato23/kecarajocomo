/**
 * Price Comparison Card Component
 * Display price comparisons with iOS26 design
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  MapPin, 
  Clock,
  DollarSign,
  AlertCircle
} from 'lucide-react';

import { PriceComparison, PriceTrend } from '@/services/pricing';
import { cn } from '@/lib/utils';

interface PriceComparisonCardProps {
  comparison: PriceComparison;
  trend?: PriceTrend;
  showActions?: boolean;
  onSelectStore?: (storeId: string) => void;
  onSetAlert?: (productId: string) => void;
  className?: string;
}

export const PriceComparisonCard: React.FC<PriceComparisonCardProps> = ({
  comparison,
  trend,
  showActions = true,
  onSelectStore,
  onSetAlert,
  className
}) => {
  const { product } = comparison;
  const savingsPercentage = product.savings.percentage;
  
  const getTrendIcon = () => {
    if (!trend) return <Minus className="w-4 h-4" />;
    
    switch (trend.trend) {
      case 'increasing':
        return <TrendingUp className="w-4 h-4 text-red-500" />;
      case 'decreasing':
        return <TrendingDown className="w-4 h-4 text-green-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(price);
  };
  
  return (
    <iOS26LiquidCard 
      variant="medium" 
      className={cn("p-6 hover:shadow-lg transition-all", className)}
      morph
    >
      <div className="space-y-4">
        {/* Product Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {product.name}
            </h3>
            {product.brand && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {product.brand}
              </p>
            )}
          </div>
          
          {/* Trend Indicator */}
          {trend && (
            <div className="flex items-center gap-2">
              {getTrendIcon()}
              <span className={cn(
                "text-sm font-medium",
                trend.trend === 'increasing' && "text-red-500",
                trend.trend === 'decreasing' && "text-green-500",
                trend.trend === 'stable' && "text-gray-500"
              )}>
                {Math.abs(trend.changePercentage).toFixed(1)}%
              </span>
            </div>
          )}
        </div>
        
        {/* Price Range Display */}
        <div className="grid grid-cols-2 gap-4">
          {/* Lowest Price */}
          {product.lowestPrice && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="space-y-1"
            >
              <p className="text-xs text-gray-500 dark:text-gray-400">Mejor precio</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatPrice(product.lowestPrice.price)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {product.lowestPrice.store.name}
              </p>
            </motion.div>
          )}
          
          {/* Highest Price */}
          {product.highestPrice && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="space-y-1"
            >
              <p className="text-xs text-gray-500 dark:text-gray-400">Precio más alto</p>
              <p className="text-2xl font-bold text-gray-600 dark:text-gray-400 line-through">
                {formatPrice(product.highestPrice.price)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {product.highestPrice.store.name}
              </p>
            </motion.div>
          )}
        </div>
        
        {/* Savings Indicator */}
        {savingsPercentage > 0 && (
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/20"
          >
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-700 dark:text-green-300">
                Ahorro potencial
              </span>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-green-700 dark:text-green-300">
                {formatPrice(product.savings.amount)}
              </p>
              <p className="text-sm text-green-600 dark:text-green-400">
                ({savingsPercentage.toFixed(1)}%)
              </p>
            </div>
          </motion.div>
        )}
        
        {/* All Store Prices */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Precios por tienda
          </p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {product.prices.map((price, index) => (
              <motion.div
                key={price.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg transition-all",
                  "bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800",
                  price.id === product.lowestPrice?.priceId && "ring-2 ring-green-500"
                )}
              >
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {price.store.name}
                    </p>
                    {price.store.address && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {price.store.address}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {formatPrice(price.price)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    /{price.unit}
                  </p>
                </div>
                {showActions && onSelectStore && (
                  <iOS26LiquidButton
                    variant="ghost"
                    size="sm"
                    onClick={() => onSelectStore(price.store.id)}
                  >
                    Seleccionar
                  </iOS26LiquidButton>
                )}
              </motion.div>
            ))}
          </div>
        </div>
        
        {/* Price Forecast */}
        {trend?.forecast && (
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Pronóstico próxima semana
              </span>
            </div>
            <p className="text-lg font-semibold text-blue-700 dark:text-blue-300">
              {formatPrice(trend.forecast.nextWeek)}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              Confianza: {(trend.forecast.confidence * 100).toFixed(0)}%
            </p>
          </div>
        )}
        
        {/* Actions */}
        {showActions && (
          <div className="flex gap-2 pt-2">
            {onSetAlert && (
              <iOS26LiquidButton
                variant="secondary"
                size="sm"
                onClick={() => onSetAlert(product.id)}
                icon={<AlertCircle className="w-4 h-4" />}
                fluid
              >
                Crear Alerta de Precio
              </iOS26LiquidButton>
            )}
          </div>
        )}
      </div>
    </iOS26LiquidCard>
  );
};