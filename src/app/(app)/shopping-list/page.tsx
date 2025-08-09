/**
 * Enhanced Shopping List Page
 * Complete shopping list experience with automatic generation, scanning, and optimization
 */

'use client';

import React, { Suspense } from 'react';
import { logger } from '@/services/logger';
import EnhancedShoppingList from '@/components/shopping/EnhancedShoppingList';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Loader2, ShoppingCart } from 'lucide-react';

export default function ShoppingListPage() {
  const { user, isLoading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold mb-2">Acceso Requerido</h2>
          <p className="text-gray-600">Inicia sesión para acceder a tu lista de compras</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Lista de Compras Inteligente
        </h1>
        <p className="text-gray-600">
          Genera automáticamente tu lista desde tu plan de comidas, escanea productos y optimiza tus compras
        </p>
      </div>

      <Suspense fallback={<ShoppingListSkeleton />}>
        <EnhancedShoppingList userId={user.id} />
      </Suspense>
    </div>
  );
}

/**
 * Loading skeleton for shopping list
 */
function ShoppingListSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
        <div className="flex space-x-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
          ))}
        </div>
      </div>

      {/* Summary cards skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 bg-white rounded-lg border">
            <div className="flex items-center space-x-2">
              <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="space-y-4">
        <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
        
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-6 bg-white rounded-lg border">
            <div className="flex items-center justify-between mb-4">
              <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
              <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
            </div>
            
            <div className="space-y-3">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="flex items-center space-x-3 p-3 bg-gray-50 rounded">
                  <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
                  <div className="flex-1 space-y-1">
                    <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-32 animate-pulse"></div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}