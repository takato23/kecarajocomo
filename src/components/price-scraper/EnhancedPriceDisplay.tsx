'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Store, Clock, AlertCircle, ChevronDown } from 'lucide-react';
import Image from 'next/image';

import { StoreProduct, ProductGroup } from '@/lib/services/enhancedStoreScraper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
// Removed collapsible import - will use simple state toggle

interface EnhancedPriceDisplayProps {
  products: StoreProduct[];
  productGroups?: ProductGroup[];
  isLoading: boolean;
  error?: string | null;
  progress?: string | null;
  isWarmingUp?: boolean;
  cacheHit?: boolean;
  responseTime?: number;
  onProductSelect?: (product: StoreProduct) => void;
  onRefresh?: () => void;
}

export function EnhancedPriceDisplay({
  products,
  productGroups,
  isLoading,
  error,
  progress,
  isWarmingUp,
  cacheHit,
  responseTime,
  onProductSelect,
  onRefresh
}: EnhancedPriceDisplayProps) {
  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(new Set());

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        {isWarmingUp && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              El servicio se está iniciando. La primera búsqueda puede tardar hasta 50 segundos.
            </AlertDescription>
          </Alert>
        )}
        
        {progress && (
          <div className="text-sm text-muted-foreground text-center py-2">
            {progress}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-8 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          {error}
        </AlertDescription>
        {onRefresh && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRefresh}
            className="mt-2"
          >
            Reintentar
          </Button>
        )}
      </Alert>
    );
  }

  // Empty state
  if (!products.length && !productGroups?.length) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            No se encontraron productos. Intenta con otra búsqueda.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Display grouped products if available
  if (productGroups && productGroups.length > 0) {
    return (
      <div className="space-y-4">
        {/* Performance metrics */}
        {responseTime && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{responseTime}ms</span>
            </div>
            {cacheHit && (
              <Badge variant="secondary" className="text-xs">
                Desde caché
              </Badge>
            )}
          </div>
        )}

        {/* Product groups */}
        <div className="space-y-3">
          {productGroups.map((group, index) => (
            <Card key={index} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {group.baseProduct.name}
                  </CardTitle>
                  <Badge variant="outline">
                    {group.variations.length + 1} variantes
                  </Badge>
                </div>
                
                {/* Price range */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Precio:</span>
                  <span className="font-semibold text-foreground">
                    ${group.priceRange.min.toFixed(2)}
                  </span>
                  {group.priceRange.min !== group.priceRange.max && (
                    <>
                      <span>-</span>
                      <span className="font-semibold text-foreground">
                        ${group.priceRange.max.toFixed(2)}
                      </span>
                    </>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                {/* Base product (cheapest) */}
                <ProductCard
                  product={group.baseProduct}
                  isCheapest
                  onSelect={onProductSelect}
                />

                {/* Variations */}
                {group.variations.length > 0 && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-between mt-2"
                      onClick={() => toggleGroup(`group-${index}`)}
                    >
                      <span>Ver más opciones</span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${
                        expandedGroups.has(`group-${index}`) ? 'rotate-180' : ''
                      }`} />
                    </Button>
                    {expandedGroups.has(`group-${index}`) && (
                      <div className="space-y-2 mt-2">
                        <AnimatePresence>
                          {group.variations.map((product, vIndex) => (
                            <motion.div
                              key={product.id}
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ delay: vIndex * 0.05 }}
                            >
                              <ProductCard
                                product={product}
                                onSelect={onProductSelect}
                              />
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Display individual products
  return (
    <div className="space-y-4">
      {/* Performance metrics */}
      {responseTime && (
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{responseTime}ms</span>
          </div>
          {cacheHit && (
            <Badge variant="secondary" className="text-xs">
              Desde caché
            </Badge>
          )}
        </div>
      )}

      {/* Product grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <ProductCard
              product={product}
              onSelect={onProductSelect}
              showFullDetails
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Individual product card component
interface ProductCardProps {
  product: StoreProduct;
  isCheapest?: boolean;
  showFullDetails?: boolean;
  onSelect?: (product: StoreProduct) => void;
}

function ProductCard({ 
  product, 
  isCheapest, 
  showFullDetails,
  onSelect 
}: ProductCardProps) {
  return (
    <Card 
      className={`overflow-hidden transition-all hover:shadow-md cursor-pointer ${
        isCheapest ? 'ring-2 ring-green-500' : ''
      }`}
      onClick={() => onSelect?.(product)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {showFullDetails && (
              <h3 className="font-medium text-sm mb-1 line-clamp-2">
                {product.name}
              </h3>
            )}
            
            <div className="flex items-center gap-2 mb-2">
              <Store className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {product.store}
              </span>
              {isCheapest && (
                <Badge variant="default" className="text-xs bg-green-500">
                  Más barato
                </Badge>
              )}
            </div>
            
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold">
                ${product.price.toFixed(2)}
              </span>
            </div>
          </div>
          
          {product.image && showFullDetails && (
            <img
              src={product.image}
              alt={product.name}
              className="w-16 h-16 object-cover rounded ml-3"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          )}
        </div>
        
        {product.url && product.url !== '#' && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-3"
            onClick={(e) => {
              e.stopPropagation();
              window.open(product.url, '_blank');
            }}
          >
            Ver en tienda
          </Button>
        )}
      </CardContent>
    </Card>
  );
}