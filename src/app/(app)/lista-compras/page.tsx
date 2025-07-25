'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  ShoppingCart,
  Plus,
  Search,
  Store,
  Sparkles,
  Download,
  Share2,
  Edit2,
  Trash2,
  Package,
  AlertCircle,
  ShoppingBag,
  Receipt,
  TrendingDown,
  DollarSign,
  MapPin,
  ChevronRight,
  ChevronDown,
  Grid3X3,
  List,
  Apple,
  Carrot,
  Milk,
  Beef,
  Cookie,
  Coffee,
  Wheat,
  CheckCircle2,
  Circle,
  RefreshCw,
  Copy,
  Zap,
  Loader2
} from 'lucide-react';

import { GlassCard, GlassButton, GlassInput, GlassModal } from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/features/auth';
import { useShoppingList } from '@/hooks/useShoppingList';
import { PriceSearchComponent } from '@/components/price-scraper/PriceSearchComponent';
import { useEnhancedPriceScraper } from '@/hooks/useEnhancedPriceScraper';
import type { Database } from '@/lib/supabase/database.types';

type ShoppingItem = Database['public']['Tables']['shopping_items']['Row'];

const categoryIcons = {
  dairy: { icon: Milk, color: 'from-blue-400 to-blue-500' },
  vegetables: { icon: Carrot, color: 'from-green-400 to-green-500' },
  fruits: { icon: Apple, color: 'from-orange-400 to-orange-500' },
  grains: { icon: Wheat, color: 'from-yellow-400 to-yellow-500' },
  proteins: { icon: Beef, color: 'from-red-400 to-red-500' },
  beverages: { icon: Coffee, color: 'from-amber-400 to-amber-500' },
  snacks: { icon: Cookie, color: 'from-purple-400 to-purple-500' },
  otros: { icon: Package, color: 'from-gray-400 to-gray-500' }
};

const stores = [
  { id: 'all', name: 'Todas las tiendas', icon: Store },
  { id: 'carrefour', name: 'Carrefour', icon: ShoppingCart },
  { id: 'dia', name: 'Día', icon: ShoppingBag },
  { id: 'coto', name: 'Coto', icon: Store },
  { id: 'jumbo', name: 'Jumbo', icon: ShoppingCart }
];

export default function ListaComprasPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    lists,
    activeList,
    isLoading,
    error,
    createList,
    updateList,
    deleteList,
    addItem,
    updateItem,
    deleteItem,
    toggleItem,
    setActiveListById,
    refresh
  } = useShoppingList();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStore, setSelectedStore] = useState('all');
  const [viewMode, setViewMode] = useState<'categories' | 'list'>('categories');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showPriceSearch, setShowPriceSearch] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['dairy', 'vegetables', 'fruits']);
  
  // Form states
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState(1);
  const [newItemUnit, setNewItemUnit] = useState('unidades');
  const [newItemCategory, setNewItemCategory] = useState('otros');
  const [newListName, setNewListName] = useState('');
  const [showNewListModal, setShowNewListModal] = useState(false);

  // Price scraping for all items
  const { searchMultipleProducts, isLoading: isPriceLoading } = useEnhancedPriceScraper();

  // Calculate statistics
  const calculateStats = () => {
    if (!activeList?.shopping_items) {
      return {
        totalItems: 0,
        checkedItems: 0,
        totalPrice: 0,
        checkedPrice: 0,
        progress: 0,
        savings: 0
      };
    }

    let totalItems = 0;
    let checkedItems = 0;
    let totalPrice = 0;
    let checkedPrice = 0;

    activeList.shopping_items.forEach(item => {
      totalItems++;
      totalPrice += item.price || 0;
      if (item.checked) {
        checkedItems++;
        checkedPrice += item.price || 0;
      }
    });

    return {
      totalItems,
      checkedItems,
      totalPrice,
      checkedPrice,
      progress: totalItems > 0 ? (checkedItems / totalItems) * 100 : 0,
      savings: totalPrice * 0.15 // 15% estimated savings
    };
  };

  const stats = calculateStats();

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(cat => cat !== category)
        : [...prev, category]
    );
  };

  // Filter items based on search and store
  const getFilteredItems = () => {
    if (!activeList?.shopping_items) return {};

    const filtered = activeList.shopping_items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStore = selectedStore === 'all' || item.store?.toLowerCase() === selectedStore;
      return matchesSearch && matchesStore;
    });

    // Group by category
    return filtered.reduce((acc, item) => {
      const category = item.category || 'otros';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {} as Record<string, ShoppingItem[]>);
  };

  const filteredAndGroupedItems = getFilteredItems();

  // Handle add item
  const handleAddItem = async () => {
    if (!newItemName.trim()) return;

    await addItem({
      name: newItemName,
      quantity: newItemQuantity,
      unit: newItemUnit,
      category: newItemCategory,
      checked: false,
      price: null,
      store: null,
      notes: null
    });

    setNewItemName('');
    setNewItemQuantity(1);
    setNewItemCategory('otros');
    setShowAddModal(false);
  };

  // Handle create list
  const handleCreateList = async () => {
    if (!newListName.trim()) return;

    await createList(newListName, true);
    setNewListName('');
    setShowNewListModal(false);
  };

  // Handle price search for all items
  const handleSearchAllPrices = async () => {
    if (!activeList?.shopping_items) return;

    const uncheckedItems = activeList.shopping_items
      .filter(item => !item.checked)
      .map(item => item.name);

    if (uncheckedItems.length === 0) {
      return;
    }

    try {
      const results = await searchMultipleProducts(uncheckedItems);
      // Could update item prices here if desired
    } catch (error) {
      console.error('Error searching prices:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <GlassCard variant="medium" className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Inicia sesión</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Debes iniciar sesión para ver tu lista de compras
          </p>
          <GlassButton
            variant="primary"
            onClick={() => router.push('/login')}
          >
            Iniciar Sesión
          </GlassButton>
        </GlassCard>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-lg text-gray-600 dark:text-gray-300">Cargando tu lista...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-800">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-60 -left-40 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-700" />
        <div className="absolute bottom-40 right-40 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 dark:from-purple-400 dark:via-pink-400 dark:to-orange-400 bg-clip-text text-transparent mb-2">
                Lista de Compras
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                {stats.totalItems} items • ${stats.totalPrice.toFixed(2)} estimado
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <GlassButton
                variant="primary"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => setShowAddModal(true)}
              >
                Añadir Item
              </GlassButton>
              <GlassButton
                variant="secondary"
                icon={<DollarSign className="w-4 h-4" />}
                onClick={() => setShowPriceSearch(true)}
              >
                Buscar Precios
              </GlassButton>
              <GlassButton
                variant="ghost"
                icon={<RefreshCw className="w-4 h-4" />}
                onClick={refresh}
              >
                Actualizar
              </GlassButton>
            </div>
          </div>

          {/* List Selector */}
          {lists.length > 0 && (
            <div className="flex items-center gap-4 mb-6">
              <select
                value={activeList?.id || ''}
                onChange={(e) => setActiveListById(e.target.value)}
                className="glass-input dark:bg-gray-800 dark:text-white"
              >
                {lists.map(list => (
                  <option key={list.id} value={list.id}>
                    {list.name}
                  </option>
                ))}
              </select>
              <GlassButton
                variant="ghost"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => setShowNewListModal(true)}
              >
                Nueva Lista
              </GlassButton>
            </div>
          )}

          {/* Progress Bar */}
          {activeList && (
            <GlassCard variant="subtle" className="p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium dark:text-white">
                  Progreso de compra
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {stats.checkedItems} de {stats.totalItems} items
                </span>
              </div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </GlassCard>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
            >
              <GlassCard variant="medium" className="p-4" interactive>
                <div className="flex items-center justify-between mb-2">
                  <ShoppingCart className="w-8 h-8 text-purple-500" />
                  <span className="text-2xl font-bold">{stats.totalItems}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Items Total</p>
              </GlassCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              whileHover={{ scale: 1.05 }}
            >
              <GlassCard variant="medium" className="p-4" interactive>
                <div className="flex items-center justify-between mb-2">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                  <span className="text-2xl font-bold">{stats.checkedItems}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Completados</p>
              </GlassCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => setShowStatsModal(true)}
              className="cursor-pointer"
            >
              <GlassCard variant="medium" className="p-4" interactive>
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="w-8 h-8 text-blue-500" />
                  <span className="text-2xl font-bold">${stats.totalPrice.toFixed(0)}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Presupuesto</p>
              </GlassCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.05 }}
            >
              <GlassCard variant="medium" className="p-4" interactive>
                <div className="flex items-center justify-between mb-2">
                  <TrendingDown className="w-8 h-8 text-orange-500" />
                  <span className="text-2xl font-bold text-green-600">
                    ${stats.savings.toFixed(0)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Ahorro Est.</p>
              </GlassCard>
            </motion.div>
          </div>

          {/* Search and Filters */}
          <GlassCard variant="medium" className="p-4 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <GlassInput
                  placeholder="Buscar items..."
                  icon={<Search className="w-5 h-5" />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <div className="flex gap-3">
                <select
                  value={selectedStore}
                  onChange={(e) => setSelectedStore(e.target.value)}
                  className="glass-input dark:bg-gray-800 dark:text-white"
                >
                  {stores.map(store => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>

                <div className="flex items-center bg-white/10 rounded-lg p-1">
                  <GlassButton
                    variant={viewMode === 'categories' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('categories')}
                    className="p-2"
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </GlassButton>
                  <GlassButton
                    variant={viewMode === 'list' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="p-2"
                  >
                    <List className="w-4 h-4" />
                  </GlassButton>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Shopping List */}
        <AnimatePresence mode="wait">
          {!activeList ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <GlassCard variant="subtle" className="p-8 max-w-md mx-auto">
                <ShoppingCart className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No tienes listas de compras
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Crea tu primera lista para comenzar.
                </p>
                <GlassButton
                  variant="primary"
                  icon={<Plus className="w-4 h-4" />}
                  onClick={() => setShowNewListModal(true)}
                >
                  Crear Lista
                </GlassButton>
              </GlassCard>
            </motion.div>
          ) : viewMode === 'categories' ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {Object.entries(filteredAndGroupedItems).map(([category, items], categoryIndex) => {
                const CategoryIcon = categoryIcons[category as keyof typeof categoryIcons]?.icon || Package;
                const categoryColor = categoryIcons[category as keyof typeof categoryIcons]?.color || 'from-gray-400 to-gray-500';
                const isExpanded = expandedCategories.includes(category);
                const completedCount = items.filter(item => item.checked).length;

                return (
                  <motion.div
                    key={category}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: categoryIndex * 0.1 }}
                  >
                    <GlassCard variant="medium" className="overflow-hidden">
                      {/* Category Header */}
                      <motion.div
                        className="p-4 cursor-pointer"
                        onClick={() => toggleCategory(category)}
                        whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "p-2.5 rounded-xl bg-gradient-to-br text-white",
                              categoryColor
                            )}>
                              <CategoryIcon className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg dark:text-white capitalize">{category}</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                {completedCount} de {items.length} items
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="font-semibold dark:text-white">
                                ${items.reduce((sum, item) => sum + (item.price || 0), 0).toFixed(2)}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                            </div>
                            {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                          </div>
                        </div>
                      </motion.div>

                      {/* Category Items */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-gray-200 dark:border-gray-700"
                          >
                            <div className="p-4 space-y-2">
                              {items.map((item, itemIndex) => (
                                <motion.div
                                  key={item.id}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: itemIndex * 0.05 }}
                                  whileHover={{ x: 5 }}
                                  className={cn(
                                    "flex items-center gap-3 p-3 rounded-lg transition-all",
                                    item.checked 
                                      ? "bg-gray-100 dark:bg-gray-800 opacity-60" 
                                      : "hover:bg-white/50 dark:hover:bg-gray-800/50"
                                  )}
                                >
                                  <button
                                    onClick={() => toggleItem(item.id)}
                                    className="flex-shrink-0"
                                  >
                                    {item.checked ? (
                                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                                    ) : (
                                      <Circle className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                                    )}
                                  </button>

                                  <div className="flex-1">
                                    <div className="flex items-start justify-between">
                                      <div>
                                        <p className={cn(
                                          "font-medium dark:text-white",
                                          item.checked && "line-through text-gray-500 dark:text-gray-400"
                                        )}>
                                          {item.name}
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-300">
                                          {item.quantity} {item.unit}
                                          {item.store && ` • ${item.store}`}
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        <p className="font-medium dark:text-white">
                                          ${item.price?.toFixed(2) || '0.00'}
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex gap-1">
                                    <GlassButton
                                      variant="ghost"
                                      size="sm"
                                      className="p-1.5"
                                      onClick={() => {
                                        // TODO: Implement edit
                                      }}
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </GlassButton>
                                    <GlassButton
                                      variant="ghost"
                                      size="sm"
                                      className="p-1.5"
                                      onClick={() => deleteItem(item.id)}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </GlassButton>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </GlassCard>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <GlassCard variant="medium" className="p-6">
                <div className="space-y-3">
                  {Object.values(filteredAndGroupedItems).flat().map(item => {
                    const categoryKey = item.category || 'otros';
                    const CategoryIcon = categoryIcons[categoryKey as keyof typeof categoryIcons]?.icon || Package;
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        whileHover={{ x: 5 }}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg transition-all",
                          item.checked 
                            ? "bg-gray-100 dark:bg-gray-800 opacity-60" 
                            : "hover:bg-white/50 dark:hover:bg-gray-800/50"
                        )}
                      >
                        <button
                          onClick={() => toggleItem(item.id)}
                          className="flex-shrink-0"
                        >
                          {item.checked ? (
                            <CheckCircle2 className="w-6 h-6 text-green-500" />
                          ) : (
                            <Circle className="w-6 h-6 text-gray-400" />
                          )}
                        </button>

                        <CategoryIcon className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />

                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className={cn(
                                "font-medium dark:text-white",
                                item.checked && "line-through text-gray-500 dark:text-gray-400"
                              )}>
                                {item.name}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                {item.quantity} {item.unit} • {item.category}
                                {item.store && ` • ${item.store}`}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium dark:text-white">
                                ${item.price?.toFixed(2) || '0.00'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {activeList && activeList.shopping_items?.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <GlassCard variant="subtle" className="p-8 max-w-md mx-auto">
              <ShoppingCart className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Lista vacía
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Comienza añadiendo items a tu lista de compras.
              </p>
              <GlassButton
                variant="primary"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => setShowAddModal(true)}
              >
                Añadir Primer Item
              </GlassButton>
            </GlassCard>
          </motion.div>
        )}
      </div>

      {/* Add Item Modal */}
      <GlassModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Añadir Item a la Lista"
        size="lg"
      >
        <div className="space-y-4">
          <GlassInput
            label="Nombre del producto"
            placeholder="ej. Leche, Pan, etc."
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <GlassInput
              label="Cantidad"
              type="number"
              placeholder="1"
              value={newItemQuantity}
              onChange={(e) => setNewItemQuantity(Number(e.target.value))}
            />
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-300">Unidad</label>
              <select 
                className="glass-input w-full dark:bg-gray-800 dark:text-white"
                value={newItemUnit}
                onChange={(e) => setNewItemUnit(e.target.value)}
              >
                <option value="unidades">unidades</option>
                <option value="kg">kg</option>
                <option value="gramos">gramos</option>
                <option value="litros">litros</option>
                <option value="ml">ml</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 dark:text-gray-300">Categoría</label>
            <select 
              className="glass-input w-full dark:bg-gray-800 dark:text-white"
              value={newItemCategory}
              onChange={(e) => setNewItemCategory(e.target.value)}
            >
              <option value="dairy">Lácteos</option>
              <option value="vegetables">Vegetales</option>
              <option value="fruits">Frutas</option>
              <option value="grains">Granos</option>
              <option value="proteins">Proteínas</option>
              <option value="beverages">Bebidas</option>
              <option value="snacks">Snacks</option>
              <option value="otros">Otros</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <GlassButton 
              variant="primary" 
              className="flex-1"
              onClick={handleAddItem}
              disabled={!newItemName.trim()}
            >
              Añadir Item
            </GlassButton>
            <GlassButton variant="ghost" onClick={() => setShowAddModal(false)}>
              Cancelar
            </GlassButton>
          </div>
        </div>
      </GlassModal>

      {/* New List Modal */}
      <GlassModal
        isOpen={showNewListModal}
        onClose={() => setShowNewListModal(false)}
        title="Crear Nueva Lista"
        size="md"
      >
        <div className="space-y-4">
          <GlassInput
            label="Nombre de la lista"
            placeholder="ej. Compras semanales"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
          />

          <div className="flex gap-3 pt-4">
            <GlassButton 
              variant="primary" 
              className="flex-1"
              onClick={handleCreateList}
              disabled={!newListName.trim()}
            >
              Crear Lista
            </GlassButton>
            <GlassButton variant="ghost" onClick={() => setShowNewListModal(false)}>
              Cancelar
            </GlassButton>
          </div>
        </div>
      </GlassModal>

      {/* Price Search Modal */}
      <GlassModal
        isOpen={showPriceSearch}
        onClose={() => setShowPriceSearch(false)}
        title="Buscar Precios"
        size="xl"
      >
        <PriceSearchComponent
          onProductSelect={(product) => {
            // Could update item price here
            console.log('Selected product:', product);
          }}
        />
      </GlassModal>
    </div>
  );
}