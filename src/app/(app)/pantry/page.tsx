'use client';

import { useState, useEffect, lazy, Suspense, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Plus, Search, Filter, AlertTriangle, ShoppingCart, Sparkles, Receipt, Loader2, X } from 'lucide-react';

import { usePantryStore } from '@/stores/pantry';
import { useAuthStore } from '@/stores/auth';
import { useShoppingStore } from '@/stores/shopping';
import { PantryItemCard } from '@/features/pantry/components/PantryItemCard';
import { AddPantryItemModal } from '@/features/pantry/components/AddPantryItemModal';
import { PantrySuggestions } from '@/features/ai/components/PantrySuggestions';
import { VoiceModal } from '@/components/voice/VoiceModal';
import { DiscreteVoiceButton } from '@/components/voice/DiscreteVoiceButton';
import { INGREDIENT_CATEGORIES } from '@/types/pantry';

// Lazy load the receipt scanner
const ReceiptScanner = lazy(() => 
  import('@/components/pantry/ReceiptScanner').then(module => ({ default: module.ReceiptScanner }))
);

export default function PantryPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    items,
    categories,
    filters,
    isLoading,
    fetchPantryItems,
    addItem,
    updateItem,
    deleteItem,
    checkExpiring,
    checkLowStock,
    suggestRestocking,
    setFilters,
  } = usePantryStore();
  const { createList, addMultipleItems } = useShoppingStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showReceiptScanner, setShowReceiptScanner] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      fetchPantryItems(user.id);
    }
  }, [user]);

  const handleAddItem = async (item: any) => {
    if (user) {
      await addItem(user.id, item);
    }
  };

  const handleVoiceItemsConfirmed = (items: any[]) => {
    // Add items from voice input
    items.forEach(item => {
      handleAddItem({
        ingredient: {
          name: item.name,
          category: item.category,
        },
        quantity: item.quantity,
        unit: item.unit,
        location: item.location,
      });
    });
  };

  const handleSimpleVoiceItems = useCallback(async (items: any[]) => {
    // Quick add items from simple voice button
    try {
      // Process items one by one to avoid overwhelming the system
      for (const item of items) {
        await handleAddItem({
          ingredient: {
            name: item.name,
            category: item.category || 'otros',
          },
          quantity: item.quantity || 1,
          unit: item.unit || 'pcs',
          location: item.location || 'despensa',
        });
        
        // Small delay between items to ensure proper processing
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error: unknown) {
      console.error('Error adding voice items:', error);
    }
  }, [handleAddItem]);

  const handleAddToShoppingList = async () => {
    if (!user) return;

    const itemsToRestock = suggestRestocking();
    if (itemsToRestock.length === 0) return;

    const list = await createList(user.id, 'Pantry Restock');
    if (list) {
      const shoppingItems = itemsToRestock.map(item => ({
        ingredient_id: item.ingredient_id,
        quantity: (item.min_quantity || 1) - item.quantity,
        unit: item.unit,
        is_checked: false,
      }));
      await addMultipleItems(list.id, shoppingItems);
    }
  };

  // Filter items
  const filteredItems = items.filter(item => {
    if (selectedCategory && item.ingredient?.category !== selectedCategory) {
      return false;
    }
    if (searchQuery && !item.ingredient?.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (filters.lowStock && !checkLowStock().includes(item)) {
      return false;
    }
    if (filters.expiringSoon && !checkExpiring().includes(item)) {
      return false;
    }
    return true;
  });

  // Stats
  const expiringCount = checkExpiring().length;
  const lowStockCount = checkLowStock().length;
  const suggestedCount = suggestRestocking().length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-lime-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6 mb-8">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Mi Despensa
            </h1>
            <p className="text-gray-600">
              Controlá tus ingredientes y nunca te quedes sin lo esencial
            </p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:flex gap-3 w-full lg:w-auto">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSuggestions(true)}
              className="px-4 sm:px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-2xl hover:from-purple-600 hover:to-pink-600 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all col-span-1"
            >
              <Sparkles className="w-5 h-5" />
              <span className="hidden sm:inline">Recetas IA</span>
              <span className="sm:hidden">IA</span>
            </motion.button>
            
            {suggestedCount > 0 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAddToShoppingList}
                className="px-4 sm:px-6 py-3 bg-white/90 backdrop-blur-sm border border-gray-200 text-gray-700 font-medium rounded-2xl hover:bg-gray-50 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all col-span-1"
              >
                <ShoppingCart className="w-5 h-5" />
                <span className="hidden sm:inline">Reabastecer ({suggestedCount})</span>
                <span className="sm:hidden">({suggestedCount})</span>
              </motion.button>
            )}
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.href = '/pantry/scan'}
              className="px-4 sm:px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-2xl hover:from-amber-600 hover:to-orange-600 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all col-span-1"
            >
              <Receipt className="w-5 h-5" />
              <span className="hidden sm:inline">Escanear Ticket</span>
              <span className="sm:hidden">Ticket</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddModal(true)}
              className="px-4 sm:px-6 py-3 bg-gradient-to-r from-lime-500 to-lime-600 text-white font-medium rounded-2xl hover:from-lime-600 hover:to-lime-700 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all col-span-1"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Agregar Producto</span>
              <span className="sm:hidden">Agregar</span>
            </motion.button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg p-4 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Productos</p>
                <p className="text-2xl font-bold text-gray-900">{items.length}</p>
              </div>
              <span className="text-2xl">📦</span>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg p-4 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Categorías</p>
                <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
              </div>
              <span className="text-2xl">🏷️</span>
            </div>
          </div>
          
          <div className={`bg-white/80 backdrop-blur-md rounded-2xl border shadow-lg p-4 hover:scale-105 transition-transform ${
            lowStockCount > 0 ? 'border-orange-300' : 'border-white/20'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Stock Bajo</p>
                <p className="text-2xl font-bold text-orange-600">{lowStockCount}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
          </div>
          
          <div className={`bg-white/80 backdrop-blur-md rounded-2xl border shadow-lg p-4 hover:scale-105 transition-transform ${
            expiringCount > 0 ? 'border-yellow-300' : 'border-white/20'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Por Vencer</p>
                <p className="text-2xl font-bold text-yellow-600">{expiringCount}</p>
              </div>
              <span className="text-2xl">⏰</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg p-6 mb-6">
          {/* Search with Voice */}
          <div className="flex gap-2 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar productos..."
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-lime-500 transition-all"
              />
            </div>
            
            {/* Voice Button - Simple version */}
            <div className="relative">
              <DiscreteVoiceButton onItemsDetected={handleSimpleVoiceItems} />
            </div>
          </div>

          {/* Category Filter Tags */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filtrar por categoría:</span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {/* All categories button */}
              <button
                onClick={() => setSelectedCategory('')}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === ''
                    ? 'bg-lime-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🏷️ Todas
              </button>

              {/* Category tags */}
              {Object.entries(INGREDIENT_CATEGORIES).map(([categoryKey, categoryData]) => (
                <button
                  key={categoryKey}
                  onClick={() => setSelectedCategory(categoryKey)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    selectedCategory === categoryKey
                      ? 'bg-lime-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {categoryData.icon} {categoryData.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-gray-200">
            <span className="text-sm font-medium text-gray-700 mr-2">Filtros rápidos:</span>
            <button
              onClick={() => setFilters({ ...filters, lowStock: !filters.lowStock })}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                filters.lowStock
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ⚠️ Stock Bajo
            </button>
            <button
              onClick={() => setFilters({ ...filters, expiringSoon: !filters.expiringSoon })}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                filters.expiringSoon
                  ? 'bg-yellow-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ⏰ Por Vencer
            </button>
            
            {/* Clear all filters */}
            {(selectedCategory || filters.lowStock || filters.expiringSoon || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedCategory('');
                  setFilters({ lowStock: false, expiringSoon: false });
                  setSearchQuery('');
                }}
                className="px-3 py-1.5 rounded-full text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-all"
              >
                <X className="w-3 h-3 inline mr-1" />
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {/* Items Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-500"></div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🥫</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {items.length === 0 ? 'Tu despensa está vacía' : 'No hay productos que coincidan con los filtros'}
            </h3>
            <p className="text-gray-600">
              {items.length === 0 
                ? 'Agregá tu primer producto para empezar a controlar tu despensa'
                : 'Probá ajustando los filtros o tu búsqueda'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence>
              {filteredItems.map(item => (
                <PantryItemCard
                  key={item.id}
                  item={item}
                  onUpdate={updateItem}
                  onDelete={deleteItem}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Add Item Modal */}
      <AddPantryItemModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddItem}
      />

      {/* AI Suggestions Modal */}
      <PantrySuggestions
        isOpen={showSuggestions}
        onClose={() => setShowSuggestions(false)}
      />

      {/* Receipt Scanner Modal */}
      <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-white" /></div>}>
        <ReceiptScanner
          isOpen={showReceiptScanner}
          onClose={() => setShowReceiptScanner(false)}
        />
      </Suspense>

      {/* Voice Modal */}
      <VoiceModal 
        isOpen={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        onItemsConfirmed={handleVoiceItemsConfirmed}
      />
    </div>
  );
}