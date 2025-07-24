'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  ShoppingCart, 
  TrendingDown, 
  Store, 
  Package, 
  AlertCircle,
  MapPin,
  DollarSign,
  Check
} from 'lucide-react';

import { PriceOptimizationResult } from '@/hooks/usePriceIntegration';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface PriceOptimizationViewProps {
  optimization: PriceOptimizationResult;
  onAddToCart?: (items: Array<{ name: string; quantity?: number; unit?: string }>) => void;
  onGenerateRoute?: () => void;
}

export function PriceOptimizationView({ 
  optimization, 
  onAddToCart,
  onGenerateRoute 
}: PriceOptimizationViewProps) {
  const savingsPercentage = optimization.totalPrice > 0
    ? (optimization.totalSavings / (optimization.totalPrice + optimization.totalSavings)) * 100
    : 0;

  const handleAddAllToCart = () => {
    if (onAddToCart) {
      const items = optimization.itemsWithPrices.map(item => ({
        name: item.ingredient.productName,
        quantity: item.ingredient.quantity,
        unit: item.ingredient.unit
      }));
      onAddToCart(items);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-600">Total</p>
                  <p className="text-2xl font-bold text-emerald-900">
                    ${optimization.totalPrice.toFixed(2)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Ahorro</p>
                  <p className="text-2xl font-bold text-blue-900">
                    ${optimization.totalSavings.toFixed(2)}
                  </p>
                  <p className="text-xs text-blue-600">
                    {savingsPercentage.toFixed(1)}% menos
                  </p>
                </div>
                <TrendingDown className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Productos</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {optimization.itemsWithPrices.length}
                  </p>
                  {optimization.missingItems.length > 0 && (
                    <p className="text-xs text-purple-600">
                      {optimization.missingItems.length} sin precio
                    </p>
                  )}
                </div>
                <Package className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">Tiendas</p>
                  <p className="text-2xl font-bold text-orange-900">
                    {optimization.storeBreakdown.length}
                  </p>
                </div>
                <Store className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Missing Items Alert */}
      {optimization.missingItems.length > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            No se encontraron precios para: {optimization.missingItems.map(item => item.productName).join(', ')}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="products">Productos</TabsTrigger>
          <TabsTrigger value="stores">Por Tienda</TabsTrigger>
          <TabsTrigger value="savings">Ahorros</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Lista de Productos Optimizada</h3>
            {onAddToCart && (
              <Button onClick={handleAddAllToCart} size="sm">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Agregar todo al carrito
              </Button>
            )}
          </div>

          <Accordion type="single" collapsible className="w-full">
            {optimization.itemsWithPrices.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center gap-3">
                      <Package className="h-4 w-4 text-gray-500" />
                      <div className="text-left">
                        <p className="font-medium">
                          {item.ingredient.productName}
                          {item.ingredient.quantity && (
                            <span className="text-sm text-gray-500 ml-2">
                              {item.ingredient.quantity} {item.ingredient.unit}
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-gray-500">
                          Mejor precio en {item.cheapestOption?.store}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        ${item.cheapestOption?.price.toFixed(2)}
                      </p>
                      {item.savings > 0 && (
                        <p className="text-xs text-green-600">
                          Ahorras ${item.savings.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 pt-2">
                    <p className="text-sm text-gray-600 mb-2">
                      Opciones disponibles ({item.allOptions.length}):
                    </p>
                    {item.allOptions
                      .sort((a, b) => a.price - b.price)
                      .map((option, optionIndex) => (
                        <div 
                          key={optionIndex}
                          className={`flex justify-between items-center p-2 rounded ${
                            option.id === item.cheapestOption?.id
                              ? 'bg-green-50 border border-green-200'
                              : 'bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {option.id === item.cheapestOption?.id && (
                              <Check className="h-4 w-4 text-green-600" />
                            )}
                            <span className="text-sm">{option.store}</span>
                          </div>
                          <span className="font-medium">
                            ${option.price.toFixed(2)}
                          </span>
                        </div>
                      ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </TabsContent>

        <TabsContent value="stores" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Distribución por Tienda</h3>
            {onGenerateRoute && (
              <Button onClick={onGenerateRoute} variant="outline" size="sm">
                <MapPin className="h-4 w-4 mr-2" />
                Generar ruta
              </Button>
            )}
          </div>

          {optimization.storeBreakdown.map((store, index) => (
            <motion.div
              key={store.store}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Store className="h-4 w-4" />
                      {store.store}
                    </CardTitle>
                    <Badge variant="secondary">
                      {store.items} producto{store.items > 1 ? 's' : ''}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Subtotal</p>
                      <p className="text-xl font-bold">${store.total.toFixed(2)}</p>
                    </div>
                    <Progress 
                      value={(store.total / optimization.totalPrice) * 100} 
                      className="w-24 h-2"
                    />
                  </div>
                  <div className="mt-3 space-y-1">
                    {optimization.itemsWithPrices
                      .filter(item => item.cheapestOption?.store === store.store)
                      .map((item, itemIndex) => (
                        <div 
                          key={itemIndex}
                          className="text-sm text-gray-600 flex justify-between"
                        >
                          <span>{item.ingredient.productName}</span>
                          <span>${item.cheapestOption?.price.toFixed(2)}</span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </TabsContent>

        <TabsContent value="savings" className="space-y-4">
          <h3 className="text-lg font-semibold mb-4">Análisis de Ahorros</h3>
          
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <TrendingDown className="h-12 w-12 text-green-600 mx-auto mb-3" />
                <p className="text-3xl font-bold text-green-700">
                  ${optimization.totalSavings.toFixed(2)}
                </p>
                <p className="text-sm text-green-600 mt-1">
                  Ahorro total con precios optimizados
                </p>
                <p className="text-xs text-gray-600 mt-2">
                  Equivalente a un {savingsPercentage.toFixed(1)}% menos
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <h4 className="font-medium text-sm text-gray-700">
              Productos con mayor ahorro:
            </h4>
            {optimization.itemsWithPrices
              .filter(item => item.savings > 0)
              .sort((a, b) => b.savings - a.savings)
              .slice(0, 5)
              .map((item, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border"
                >
                  <div>
                    <p className="font-medium">{item.ingredient.productName}</p>
                    <p className="text-sm text-gray-500">
                      En {item.cheapestOption?.store}
                    </p>
                  </div>
                  <Badge variant="default" className="bg-green-500">
                    -${item.savings.toFixed(2)}
                  </Badge>
                </div>
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}