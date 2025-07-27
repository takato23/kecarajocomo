/**
 * Enhanced Shopping List Component
 * Complete shopping list with automatic generation, barcode scanning, and receipt processing
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Plus, 
  Scan, 
  Receipt, 
  Download, 
  Filter, 
  MapPin,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Package,
  Settings
} from 'lucide-react';
import { logger } from '@/services/logger';
import { useEnhancedShoppingList } from '@/hooks/useEnhancedShoppingList';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import BarcodeScanner from '@/components/scanner/BarcodeScanner';
import ReceiptScanner from '@/components/scanner/ReceiptScanner';

interface EnhancedShoppingListProps {
  userId: string;
  className?: string;
}

export default function EnhancedShoppingList({ userId, className }: EnhancedShoppingListProps) {
  const [activeTab, setActiveTab] = useState('list');
  const [showBarcode, setShowBarcode] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStore, setSelectedStore] = useState<string>('');

  const {
    currentList,
    isLoading,
    isGenerating,
    isScanningBarcode,
    isProcessingReceipt,
    error,
    filters,
    generateFromMealPlan,
    processBarcodeScan,
    processReceiptScan,
    addItemToList,
    toggleItemPurchased,
    applyFilters,
    exportShoppingList,
    getFilteredItems,
    getOptimizedRoute,
    getPriceRecommendations,
    clearError
  } = useEnhancedShoppingList();

  // Generate initial shopping list
  useEffect(() => {
    if (!currentList && !isLoading) {
      generateFromMealPlan(userId);
    }
  }, [userId, currentList, isLoading, generateFromMealPlan]);

  const handleGenerateList = async () => {
    try {
      await generateFromMealPlan(userId);
    } catch (error) {
      logger.error('Error generating shopping list', 'EnhancedShoppingList', error);
    }
  };

  const handleBarcodeScan = async (barcode: string) => {
    try {
      const productInfo = await processBarcodeScan(barcode);
      if (productInfo) {
        setShowBarcode(false);
        // Show success notification
      }
    } catch (error) {
      logger.error('Error processing barcode', 'EnhancedShoppingList', error);
    }
  };

  const handleReceiptScan = async (items: any[]) => {
    try {
      // Convert receipt items format
      const result = await processReceiptScan(items as any);
      if (result) {
        setShowReceipt(false);
        // Show success notification
      }
    } catch (error) {
      logger.error('Error processing receipt', 'EnhancedShoppingList', error);
    }
  };

  const handleExport = (format: 'pdf' | 'txt' | 'json') => {
    try {
      const content = exportShoppingList(format);
      
      // Create download
      const blob = new Blob([content || ''], { 
        type: format === 'json' ? 'application/json' : 'text/plain' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lista-compras-${new Date().toISOString().split('T')[0]}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      logger.error('Error exporting shopping list', 'EnhancedShoppingList', error);
    }
  };

  const filteredItems = getFilteredItems();
  const priceRecommendations = getPriceRecommendations();

  if (isLoading && !currentList) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando lista de compras...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <ShoppingCart className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Lista de Compras Inteligente</h2>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            onClick={handleGenerateList}
            disabled={isGenerating}
            size="sm"
            variant="outline"
          >
            {isGenerating ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Regenerar
          </Button>
          
          <Dialog open={showFilters} onOpenChange={setShowFilters}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Filtros de Lista</DialogTitle>
              </DialogHeader>
              <FilterControls filters={filters} onFiltersChange={applyFilters} />
            </DialogContent>
          </Dialog>

          <Button
            onClick={() => setShowBarcode(true)}
            size="sm"
            variant="outline"
          >
            <Scan className="h-4 w-4 mr-2" />
            Escanear
          </Button>

          <Button
            onClick={() => setShowReceipt(true)}
            size="sm"
            variant="outline"
          >
            <Receipt className="h-4 w-4 mr-2" />
            Ticket
          </Button>

          <Select value="" onValueChange={handleExport}>
            <SelectTrigger className="w-32">
              <Download className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Exportar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="txt">Texto</SelectItem>
              <SelectItem value="json">JSON</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            {error}
            <Button onClick={clearError} size="sm" variant="outline">
              Cerrar
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      {currentList && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Total Items</p>
                  <p className="text-xl font-bold">{currentList.summary.totalItems}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Costo Estimado</p>
                  <p className="text-xl font-bold">${currentList.summary.estimatedCost.toFixed(0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Uso Despensa</p>
                  <p className="text-xl font-bold">{currentList.summary.pantryUsage}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingDown className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm text-gray-600">Ahorros</p>
                  <p className="text-xl font-bold">
                    {currentList.optimizations.bulkBuyOpportunities.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="list">Lista</TabsTrigger>
          <TabsTrigger value="stores">Tiendas</TabsTrigger>
          <TabsTrigger value="optimizations">Optimizaciones</TabsTrigger>
          <TabsTrigger value="route">Ruta</TabsTrigger>
        </TabsList>

        {/* Shopping List Tab */}
        <TabsContent value="list" className="space-y-4">
          {currentList && (
            <div className="space-y-4">
              {currentList.shoppingList.categories.map((category) => (
                <Card key={category.name}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg capitalize">
                        {category.name}
                      </CardTitle>
                      <Badge variant="secondary">
                        {category.items.filter(item => !item.isPurchased).length} items
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {category.items
                      .filter(item => filters.showPurchased || !item.isPurchased)
                      .map((item) => (
                        <ShoppingListItemCard
                          key={item.id}
                          item={item}
                          onTogglePurchased={(purchased) => 
                            toggleItemPurchased(item.ingredientName, purchased)
                          }
                        />
                      ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Store Comparisons Tab */}
        <TabsContent value="stores" className="space-y-4">
          {currentList && (
            <div className="space-y-4">
              <div className="text-sm text-gray-600 mb-4">
                Comparación de precios entre tiendas para tu lista
              </div>
              
              {currentList.summary.priceComparisons.map((store) => (
                <Card key={store.storeId} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <MapPin className="h-5 w-5 text-gray-500" />
                        <div>
                          <h3 className="font-semibold">{store.storeName}</h3>
                          <p className="text-sm text-gray-600">
                            {store.availableItems} de {currentList.summary.totalItems} items disponibles
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-xl font-bold">${store.totalCost.toFixed(0)}</div>
                        {store.estimatedSavings > 0 && (
                          <div className="text-sm text-green-600">
                            Ahorro: ${store.estimatedSavings.toFixed(0)}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {store.missingItems.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm text-gray-600 mb-2">Items no disponibles:</p>
                        <div className="flex flex-wrap gap-1">
                          {store.missingItems.slice(0, 5).map((item) => (
                            <Badge key={item} variant="outline" className="text-xs">
                              {item}
                            </Badge>
                          ))}
                          {store.missingItems.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{store.missingItems.length - 5} más
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Optimizations Tab */}
        <TabsContent value="optimizations" className="space-y-4">
          {currentList && (
            <div className="space-y-6">
              {/* Bulk Buy Opportunities */}
              {currentList.optimizations.bulkBuyOpportunities.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Package className="h-5 w-5" />
                      <span>Oportunidades de Compra en Cantidad</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {currentList.optimizations.bulkBuyOpportunities.map((opportunity, index) => (
                      <div key={index} className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">{opportunity.ingredientName}</h4>
                            <p className="text-sm text-gray-600">{opportunity.reason}</p>
                            <p className="text-sm">
                              Comprar {opportunity.suggestedQuantity} en lugar de {opportunity.currentQuantity}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-600">
                              ${opportunity.savings.toFixed(0)}
                            </div>
                            <div className="text-sm text-gray-600">ahorro</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Substitution Suggestions */}
              {currentList.optimizations.substitutionSuggestions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingDown className="h-5 w-5" />
                      <span>Sugerencias de Sustitución</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {currentList.optimizations.substitutionSuggestions.map((suggestion, index) => (
                      <div key={index} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">
                              {suggestion.originalIngredient} → {suggestion.substitute}
                            </h4>
                            <p className="text-sm text-gray-600">{suggestion.reason}</p>
                          </div>
                          {suggestion.costDifference < 0 && (
                            <div className="text-right">
                              <div className="text-lg font-bold text-green-600">
                                ${Math.abs(suggestion.costDifference).toFixed(0)}
                              </div>
                              <div className="text-sm text-gray-600">ahorro</div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Seasonal Recommendations */}
              {currentList.optimizations.seasonalRecommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Clock className="h-5 w-5" />
                      <span>Recomendaciones Estacionales</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {currentList.optimizations.seasonalRecommendations.map((recommendation, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{recommendation}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        {/* Shopping Route Tab */}
        <TabsContent value="route" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ruta Optimizada de Compras</CardTitle>
              <div className="flex items-center space-x-2">
                <Select value={selectedStore} onValueChange={setSelectedStore}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Selecciona una tienda" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentList?.summary.priceComparisons.map((store) => (
                      <SelectItem key={store.storeId} value={store.storeId}>
                        {store.storeName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {selectedStore && currentList && (
                <OptimizedRoute 
                  storeId={selectedStore}
                  items={filteredItems}
                  getOptimizedRoute={getOptimizedRoute}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        isOpen={showBarcode}
        onClose={() => setShowBarcode(false)}
        onScan={handleBarcodeScan}
      />

      {/* Receipt Scanner Modal */}
      <ReceiptScanner
        isOpen={showReceipt}
        onClose={() => setShowReceipt(false)}
        onItemsConfirmed={handleReceiptScan}
      />
    </div>
  );
}

/**
 * Shopping List Item Component
 */
interface ShoppingListItemCardProps {
  item: any;
  onTogglePurchased: (purchased: boolean) => void;
}

function ShoppingListItemCard({ item, onTogglePurchased }: ShoppingListItemCardProps) {
  return (
    <div className={`flex items-center space-x-3 p-3 rounded-lg border ${
      item.isPurchased ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
    }`}>
      <Checkbox
        checked={item.isPurchased}
        onCheckedChange={onTogglePurchased}
      />
      
      <div className="flex-1">
        <div className={`font-medium ${item.isPurchased ? 'line-through text-gray-500' : ''}`}>
          {item.ingredientName}
        </div>
        <div className="text-sm text-gray-600">
          {item.totalAmount} {item.unit}
          {item.estimatedPrice && (
            <span className="ml-2">• ${item.estimatedPrice.toFixed(0)}</span>
          )}
        </div>
        {item.notes && (
          <div className="text-xs text-gray-500 mt-1">{item.notes}</div>
        )}
      </div>

      {item.recipeNames.length > 0 && (
        <div className="text-xs text-gray-500 max-w-32 truncate">
          Para: {item.recipeNames.join(', ')}
        </div>
      )}
    </div>
  );
}

/**
 * Filter Controls Component
 */
interface FilterControlsProps {
  filters: any;
  onFiltersChange: (filters: any) => void;
}

function FilterControls({ filters, onFiltersChange }: FilterControlsProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Categoría</label>
        <Select 
          value={filters.category || ''} 
          onValueChange={(value) => onFiltersChange({ category: value || undefined })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Todas las categorías" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas</SelectItem>
            <SelectItem value="produce">Verduras</SelectItem>
            <SelectItem value="meat">Carnes</SelectItem>
            <SelectItem value="dairy">Lácteos</SelectItem>
            <SelectItem value="grains">Granos</SelectItem>
            <SelectItem value="pantry">Despensa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          checked={filters.showPurchased}
          onCheckedChange={(checked) => onFiltersChange({ showPurchased: checked })}
        />
        <label className="text-sm">Mostrar items comprados</label>
      </div>

      {filters.priceRange && (
        <div>
          <label className="text-sm font-medium">Rango de precios</label>
          <Slider
            value={[filters.priceRange.min, filters.priceRange.max]}
            onValueChange={([min, max]) => onFiltersChange({ priceRange: { min, max } })}
            max={1000}
            step={10}
            className="mt-2"
          />
        </div>
      )}
    </div>
  );
}

/**
 * Optimized Route Component
 */
interface OptimizedRouteProps {
  storeId: string;
  items: any[];
  getOptimizedRoute: (storeId: string) => Promise<string[]>;
}

function OptimizedRoute({ storeId, items, getOptimizedRoute }: OptimizedRouteProps) {
  const [route, setRoute] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadRoute = async () => {
      setIsLoading(true);
      try {
        const optimizedRoute = await getOptimizedRoute(storeId);
        setRoute(optimizedRoute);
      } catch (error) {
        logger.error('Error loading optimized route', 'OptimizedRoute', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRoute();
  }, [storeId, getOptimizedRoute]);

  if (isLoading) {
    return <div className="text-center py-4">Calculando ruta óptima...</div>;
  }

  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-600 mb-4">
        Orden sugerido para tu recorrido en la tienda:
      </div>
      
      {route.map((item, index) => (
        <div key={item} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
          <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
            {index + 1}
          </div>
          <span>{item}</span>
        </div>
      ))}
    </div>
  );
}