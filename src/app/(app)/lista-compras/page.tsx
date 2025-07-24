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
  Zap
} from 'lucide-react';

import { GlassCard, GlassButton, GlassInput, GlassModal } from '@/components/ui/GlassCard';
import { useAuthStore } from '@/stores/auth';
import { cn } from '@/lib/utils';

// Mock data para la lista de compras
const mockShoppingList = [
  {
    id: '1',
    category: 'dairy',
    categoryName: 'Lácteos',
    items: [
      { id: '1-1', name: 'Leche descremada', quantity: 2, unit: 'litros', checked: false, price: 2.50, store: 'Carrefour' },
      { id: '1-2', name: 'Yogur natural', quantity: 6, unit: 'unidades', checked: true, price: 4.20, store: 'Día' },
      { id: '1-3', name: 'Queso cremoso', quantity: 200, unit: 'gramos', checked: false, price: 3.80, store: 'Carrefour' }
    ]
  },
  {
    id: '2',
    category: 'vegetables',
    categoryName: 'Vegetales',
    items: [
      { id: '2-1', name: 'Tomates', quantity: 1, unit: 'kg', checked: false, price: 2.90, priority: 'high' },
      { id: '2-2', name: 'Lechuga', quantity: 1, unit: 'unidad', checked: false, price: 1.50 },
      { id: '2-3', name: 'Zanahorias', quantity: 500, unit: 'gramos', checked: true, price: 1.80 },
      { id: '2-4', name: 'Cebolla', quantity: 2, unit: 'unidades', checked: false, price: 1.20 }
    ]
  },
  {
    id: '3',
    category: 'fruits',
    categoryName: 'Frutas',
    items: [
      { id: '3-1', name: 'Manzanas rojas', quantity: 1, unit: 'kg', checked: false, price: 3.50 },
      { id: '3-2', name: 'Bananas', quantity: 6, unit: 'unidades', checked: false, price: 2.40 },
      { id: '3-3', name: 'Naranjas', quantity: 2, unit: 'kg', checked: false, price: 2.00, priority: 'high' }
    ]
  },
  {
    id: '4',
    category: 'grains',
    categoryName: 'Granos y Cereales',
    items: [
      { id: '4-1', name: 'Arroz integral', quantity: 1, unit: 'kg', checked: true, price: 4.50 },
      { id: '4-2', name: 'Pasta integral', quantity: 500, unit: 'gramos', checked: false, price: 3.20 },
      { id: '4-3', name: 'Avena', quantity: 500, unit: 'gramos', checked: false, price: 2.80, store: 'Día' }
    ]
  },
  {
    id: '5',
    category: 'proteins',
    categoryName: 'Proteínas',
    items: [
      { id: '5-1', name: 'Pechuga de pollo', quantity: 1, unit: 'kg', checked: false, price: 8.90, priority: 'high' },
      { id: '5-2', name: 'Huevos', quantity: 12, unit: 'unidades', checked: false, price: 4.50 },
      { id: '5-3', name: 'Atún en lata', quantity: 3, unit: 'latas', checked: true, price: 5.70 }
    ]
  }
];

const categoryIcons = {
  dairy: { icon: Milk, color: 'from-blue-400 to-blue-500' },
  vegetables: { icon: Carrot, color: 'from-green-400 to-green-500' },
  fruits: { icon: Apple, color: 'from-orange-400 to-orange-500' },
  grains: { icon: Wheat, color: 'from-yellow-400 to-yellow-500' },
  proteins: { icon: Beef, color: 'from-red-400 to-red-500' },
  beverages: { icon: Coffee, color: 'from-amber-400 to-amber-500' },
  snacks: { icon: Cookie, color: 'from-purple-400 to-purple-500' },
  other: { icon: Package, color: 'from-gray-400 to-gray-500' }
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
  const { user: _user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStore, setSelectedStore] = useState('all');
  const [viewMode, setViewMode] = useState<'categories' | 'list'>('categories');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['1', '2', '3']);
  const [shoppingList, setShoppingList] = useState(mockShoppingList);
  const [_selectedItems, _setSelectedItems] = useState<string[]>([]);
  const [_showFilters, _setShowFilters] = useState(false);

  // Calcular estadísticas
  const calculateStats = () => {
    let totalItems = 0;
    let checkedItems = 0;
    let totalPrice = 0;
    let checkedPrice = 0;

    shoppingList.forEach(category => {
      category.items.forEach(item => {
        totalItems++;
        totalPrice += item.price || 0;
        if (item.checked) {
          checkedItems++;
          checkedPrice += item.price || 0;
        }
      });
    });

    return {
      totalItems,
      checkedItems,
      totalPrice,
      checkedPrice,
      progress: totalItems > 0 ? (checkedItems / totalItems) * 100 : 0,
      savings: totalPrice * 0.15 // 15% de ahorro estimado
    };
  };

  const stats = calculateStats();

  // Toggle item check
  const toggleItem = (categoryId: string, itemId: string) => {
    setShoppingList(prev => 
      prev.map(category => 
        category.id === categoryId
          ? {
              ...category,
              items: category.items.map(item =>
                item.id === itemId
                  ? { ...item, checked: !item.checked }
                  : item
              )
            }
          : category
      )
    );
  };

  // Toggle category expansion
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Filter items based on search and store
  const getFilteredItems = () => {
    return shoppingList.map(category => ({
      ...category,
      items: category.items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStore = selectedStore === 'all' || item.store?.toLowerCase() === selectedStore;
        return matchesSearch && matchesStore;
      })
    })).filter(category => category.items.length > 0);
  };

  const filteredList = getFilteredItems();

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
              <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent mb-2">
                Lista de Compras
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
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
                icon={<Sparkles className="w-4 h-4" />}
                onClick={() => router.push('/pantry/scan')}
              >
                IA Sugerir
              </GlassButton>
              <GlassButton
                variant="ghost"
                icon={<Download className="w-4 h-4" />}
              >
                Exportar
              </GlassButton>
              <GlassButton
                variant="ghost"
                icon={<Share2 className="w-4 h-4" />}
              >
                Compartir
              </GlassButton>
            </div>
          </div>

          {/* Progress Bar */}
          <GlassCard variant="subtle" className="p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                Progreso de compra
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
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
                <p className="text-sm text-gray-600 dark:text-gray-400">Items Total</p>
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
                <p className="text-sm text-gray-600 dark:text-gray-400">Completados</p>
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
                <p className="text-sm text-gray-600 dark:text-gray-400">Presupuesto</p>
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
                <p className="text-sm text-gray-600 dark:text-gray-400">Ahorro Est.</p>
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
                  className="glass-input"
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

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2 mt-4">
              <GlassButton
                variant="subtle"
                size="sm"
                icon={<Zap className="w-4 h-4" />}
                onClick={() => router.push('/despensa')}
              >
                Desde Despensa
              </GlassButton>
              <GlassButton
                variant="subtle"
                size="sm"
                icon={<Receipt className="w-4 h-4" />}
              >
                Historial
              </GlassButton>
              <GlassButton
                variant="subtle"
                size="sm"
                icon={<Copy className="w-4 h-4" />}
              >
                Duplicar Lista
              </GlassButton>
              <GlassButton
                variant="subtle"
                size="sm"
                icon={<RefreshCw className="w-4 h-4" />}
              >
                Limpiar Completados
              </GlassButton>
            </div>
          </GlassCard>
        </motion.div>

        {/* Shopping List */}
        <AnimatePresence mode="wait">
          {viewMode === 'categories' ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {filteredList.map((category, categoryIndex) => {
                const CategoryIcon = categoryIcons[category.category as keyof typeof categoryIcons]?.icon || Package;
                const categoryColor = categoryIcons[category.category as keyof typeof categoryIcons]?.color || 'from-gray-400 to-gray-500';
                const isExpanded = expandedCategories.includes(category.id);
                const completedCount = category.items.filter(item => item.checked).length;

                return (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: categoryIndex * 0.1 }}
                  >
                    <GlassCard variant="medium" className="overflow-hidden">
                      {/* Category Header */}
                      <motion.div
                        className="p-4 cursor-pointer"
                        onClick={() => toggleCategory(category.id)}
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
                              <h3 className="font-semibold text-lg">{category.categoryName}</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {completedCount} de {category.items.length} items
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="font-semibold">
                                ${category.items.reduce((sum, item) => sum + (item.price || 0), 0).toFixed(2)}
                              </p>
                              <p className="text-xs text-gray-500">Total</p>
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
                              {category.items.map((item, itemIndex) => (
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
                                    onClick={() => toggleItem(category.id, item.id)}
                                    className="flex-shrink-0"
                                  >
                                    {item.checked ? (
                                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                                    ) : (
                                      <Circle className="w-6 h-6 text-gray-400" />
                                    )}
                                  </button>

                                  <div className="flex-1">
                                    <div className="flex items-start justify-between">
                                      <div>
                                        <p className={cn(
                                          "font-medium",
                                          item.checked && "line-through text-gray-500"
                                        )}>
                                          {item.name}
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                          {item.quantity} {item.unit}
                                          {item.store && ` • ${item.store}`}
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        <p className="font-medium">
                                          ${item.price?.toFixed(2) || '0.00'}
                                        </p>
                                        {item.priority === 'high' && (
                                          <span className="text-xs text-red-600 font-medium">Urgente</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex gap-1">
                                    <GlassButton
                                      variant="ghost"
                                      size="sm"
                                      className="p-1.5"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </GlassButton>
                                    <GlassButton
                                      variant="ghost"
                                      size="sm"
                                      className="p-1.5"
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
                  {filteredList.flatMap(category => 
                    category.items.map(item => {
                      const CategoryIcon = categoryIcons[category.category as keyof typeof categoryIcons]?.icon || Package;
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
                            onClick={() => toggleItem(category.id, item.id)}
                            className="flex-shrink-0"
                          >
                            {item.checked ? (
                              <CheckCircle2 className="w-6 h-6 text-green-500" />
                            ) : (
                              <Circle className="w-6 h-6 text-gray-400" />
                            )}
                          </button>

                          <CategoryIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />

                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className={cn(
                                  "font-medium",
                                  item.checked && "line-through text-gray-500"
                                )}>
                                  {item.name}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {item.quantity} {item.unit} • {category.categoryName}
                                  {item.store && ` • ${item.store}`}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">
                                  ${item.price?.toFixed(2) || '0.00'}
                                </p>
                                {item.priority === 'high' && (
                                  <span className="text-xs text-red-600 font-medium">Urgente</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {filteredList.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <GlassCard variant="subtle" className="p-8 max-w-md mx-auto">
              <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
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

        {/* Floating Action Buttons */}
        <div className="fixed bottom-6 right-6 flex flex-col gap-3">
          <GlassButton
            variant="primary"
            size="lg"
            className="shadow-xl"
            icon={<MapPin className="w-5 h-5" />}
          >
            Navegar a Tienda
          </GlassButton>
        </div>
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
          />
          
          <div className="grid grid-cols-2 gap-4">
            <GlassInput
              label="Cantidad"
              type="number"
              placeholder="1"
            />
            <select className="glass-input">
              <option>unidades</option>
              <option>kg</option>
              <option>gramos</option>
              <option>litros</option>
              <option>ml</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Categoría</label>
              <select className="glass-input w-full">
                <option value="dairy">Lácteos</option>
                <option value="vegetables">Vegetales</option>
                <option value="fruits">Frutas</option>
                <option value="grains">Granos</option>
                <option value="proteins">Proteínas</option>
                <option value="beverages">Bebidas</option>
                <option value="snacks">Snacks</option>
                <option value="other">Otros</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Tienda</label>
              <select className="glass-input w-full">
                <option value="">Cualquier tienda</option>
                {stores.filter(s => s.id !== 'all').map(store => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <GlassInput
            label="Precio estimado (opcional)"
            type="number"
            placeholder="0.00"
            icon={<DollarSign className="w-4 h-4" />}
          />

          <div className="flex items-center gap-3">
            <input type="checkbox" id="urgent" className="w-4 h-4" />
            <label htmlFor="urgent" className="text-sm font-medium">
              Marcar como urgente
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <GlassButton variant="primary" className="flex-1">
              Añadir Item
            </GlassButton>
            <GlassButton variant="ghost" onClick={() => setShowAddModal(false)}>
              Cancelar
            </GlassButton>
          </div>
        </div>
      </GlassModal>

      {/* Stats Modal */}
      <GlassModal
        isOpen={showStatsModal}
        onClose={() => setShowStatsModal(false)}
        title="Estadísticas de Compra"
        size="lg"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <GlassCard variant="subtle" className="p-4 text-center">
              <DollarSign className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">${stats.totalPrice.toFixed(2)}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Presupuesto Total</p>
            </GlassCard>
            <GlassCard variant="subtle" className="p-4 text-center">
              <TrendingDown className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">${stats.savings.toFixed(2)}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Ahorro Estimado</p>
            </GlassCard>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Distribución por Categoría</h3>
            <div className="space-y-2">
              {shoppingList.map(category => {
                const categoryTotal = category.items.reduce((sum, item) => sum + (item.price || 0), 0);
                const percentage = (categoryTotal / stats.totalPrice) * 100;
                const CategoryIcon = categoryIcons[category.category as keyof typeof categoryIcons]?.icon || Package;
                const categoryColor = categoryIcons[category.category as keyof typeof categoryIcons]?.color || 'from-gray-400 to-gray-500';

                return (
                  <div key={category.id} className="flex items-center gap-3">
                    <CategoryIcon className="w-5 h-5 text-gray-500" />
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span>{category.categoryName}</span>
                        <span className="font-medium">${categoryTotal.toFixed(2)}</span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={cn("h-full bg-gradient-to-r", categoryColor)}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <GlassCard variant="subtle" className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              <h3 className="font-semibold">Consejos de Ahorro</h3>
            </div>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li>• Compara precios entre tiendas para ahorrar hasta 20%</li>
              <li>• Busca ofertas 2x1 en productos no perecederos</li>
              <li>• Considera marcas blancas para reducir costos</li>
            </ul>
          </GlassCard>
        </div>
      </GlassModal>
    </div>
  );
}