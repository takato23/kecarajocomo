'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { logger } from '@/services/logger';
import { 
  Package,
  Search,
  Plus,
  Camera,
  AlertTriangle,
  TrendingDown,
  Apple,
  Milk,
  Carrot,
  Beef,
  Wheat,
  Cookie,
  Coffee,
  Home,
  Refrigerator,
  ShoppingCart,
  Grid3X3,
  List,
  Edit,
  Trash2,
  BarChart3
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

import { GlassCard, GlassButton, GlassInput, GlassModal } from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { usePantry } from '@/hooks/usePantry';
import { IngredientCategory } from '@/types/pantry';
import { OnboardingPacks } from '@/components/pantry/OnboardingPacks';

// Category mapping for ingredient categories
const categoryIconMap: Record<IngredientCategory, React.ComponentType> = {
  verduras: Carrot,
  frutas: Apple,
  carnes: Beef,
  lacteos: Milk,
  granos: Wheat,
  condimentos: Package,
  bebidas: Coffee,
  enlatados: Package,
  congelados: TrendingDown,
  panaderia: Package,
  snacks: Cookie,
  otros: Package
};

const categories = [
  { id: 'all', name: 'Todos', icon: Package, color: 'from-gray-400 to-gray-500' },
  { id: 'verduras', name: 'Verduras', icon: Carrot, color: 'from-green-400 to-green-500' },
  { id: 'frutas', name: 'Frutas', icon: Apple, color: 'from-orange-400 to-orange-500' },
  { id: 'carnes', name: 'Carnes', icon: Beef, color: 'from-red-400 to-red-500' },
  { id: 'lacteos', name: 'Lácteos', icon: Milk, color: 'from-blue-400 to-blue-500' },
  { id: 'granos', name: 'Granos', icon: Wheat, color: 'from-yellow-400 to-yellow-500' },
  { id: 'condimentos', name: 'Condimentos', icon: Package, color: 'from-gray-400 to-gray-500' },
  { id: 'bebidas', name: 'Bebidas', icon: Coffee, color: 'from-amber-400 to-amber-500' },
  { id: 'enlatados', name: 'Enlatados', icon: Package, color: 'from-gray-400 to-gray-500' },
  { id: 'congelados', name: 'Congelados', icon: TrendingDown, color: 'from-cyan-400 to-cyan-500' },
  { id: 'panaderia', name: 'Panadería', icon: Package, color: 'from-orange-400 to-orange-500' },
  { id: 'snacks', name: 'Snacks', icon: Cookie, color: 'from-purple-400 to-purple-500' },
  { id: 'otros', name: 'Otros', icon: Package, color: 'from-gray-400 to-gray-500' }
];

const locations = [
  { id: 'all', name: 'Todos', icon: Home },
  { id: 'despensa', name: 'Despensa', icon: Package },
  { id: 'refrigerador', name: 'Refrigerador', icon: Refrigerator },
  { id: 'congelador', name: 'Congelador', icon: TrendingDown }
];

export default function DespensaPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  
  // Pantry hook with database integration
  const {
    items: pantryItems,
    stats: pantryStats,
    isLoading: pantryLoading,
    error: pantryError,
    addItemToPantry,
    updatePantryItem: _updatePantryItem,
    deletePantryItem,
    isAdding,
    isUpdatingItems: _isUpdatingItems,
    isDeleting
  } = usePantry(user?.id);
  
  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [sortBy, setSortBy] = useState('name');
  
  // Add item form state
  const [addItemForm, setAddItemForm] = useState({
    ingredient_name: '',
    quantity: 1,
    unit: 'unidades',
    expiration_date: undefined as Date | undefined,
    location: 'despensa',
    notes: '',
    photo: undefined as File | undefined
  });

  // Calcular días hasta vencimiento
  const getDaysUntilExpiry = (expiryDate: Date | string) => {
    const expiry = typeof expiryDate === 'string' ? new Date(expiryDate) : expiryDate;
    return differenceInDays(expiry, new Date());
  };
  
  // Handle loading and error states
  if (authLoading || pantryLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Cargando despensa...</p>
        </div>
      </div>
    );
  }
  
  if (pantryError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-800">
        <GlassCard variant="medium" className="p-8 max-w-md mx-auto text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Error al cargar la despensa
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {pantryError.message || 'No se pudo conectar con la base de datos'}
          </p>
          <GlassButton
            variant="primary"
            onClick={() => window.location.reload()}
          >
            Reintentar
          </GlassButton>
        </GlassCard>
      </div>
    );
  }

  // Filtrar items
  const filteredItems = pantryItems.filter(item => {
    const matchesSearch = item.ingredient?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.notes?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.ingredient?.category === selectedCategory;
    const matchesLocation = selectedLocation === 'all' || item.location === selectedLocation;
    
    return matchesSearch && matchesCategory && matchesLocation;
  });

  // Ordenar items
  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return (a.ingredient?.name || '').localeCompare(b.ingredient?.name || '');
      case 'expiry':
        if (!a.expiration_date && !b.expiration_date) return 0;
        if (!a.expiration_date) return 1;
        if (!b.expiration_date) return -1;
        return getDaysUntilExpiry(a.expiration_date) - getDaysUntilExpiry(b.expiration_date);
      case 'quantity':
        return b.quantity - a.quantity;
      case 'added':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      default:
        return 0;
    }
  });

  // Estadísticas calculadas desde la base de datos
  const stats = {
    totalItems: pantryStats?.total_items || 0,
    expiringSoon: pantryStats?.expiring_soon || 0,
    lowStock: pantryStats?.low_stock || 0,
    categories: pantryStats?.categories || 0
  };

  const handleItemClick = (item: any) => {
    setSelectedItem(item);
    setShowDetailsModal(true);
  };

  const handleAddItem = async () => {
    if (!addItemForm.ingredient_name.trim()) return;
    
    try {
      await addItemToPantry(addItemForm);
      setShowAddModal(false);
      setAddItemForm({
        ingredient_name: '',
        quantity: 1,
        unit: 'unidades',
        expiration_date: undefined,
        location: 'despensa',
        notes: '',
        photo: undefined
      });
    } catch (error) {
      logger.error('Error adding item:', 'Page:page', error);
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await deletePantryItem(id);
      setShowDetailsModal(false);
    } catch (error) {
      logger.error('Error deleting item:', 'Page:page', error);
    }
  };

  const handlePackSelection = async (ingredients: any[]) => {
    try {
      // Agregar múltiples items secuencialmente
      for (const ingredient of ingredients) {
        await addItemToPantry(ingredient);
      }
    } catch (error) {
      logger.error('Error adding pack items:', 'Page:page', error);
      throw error; // Propagar error para que OnboardingPacks pueda manejarlo
    }
  };

  const getExpiryColor = (daysUntilExpiry: number) => {
    if (daysUntilExpiry <= 0) return 'text-red-600 bg-red-100 dark:bg-red-900/30';
    if (daysUntilExpiry <= 3) return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30';
    if (daysUntilExpiry <= 7) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
    return 'text-green-600 bg-green-100 dark:bg-green-900/30';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-800">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-60 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-700" />
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
              <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 dark:from-green-400 dark:via-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">
                Mi Despensa
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                {stats.totalItems > 0 
                  ? `Gestiona ${stats.totalItems} ingredientes y controla fechas de vencimiento`
                  : 'Comienza agregando ingredientes a tu despensa'}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <GlassButton
                variant="primary"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => setShowAddModal(true)}
                disabled={isAdding}
              >
                {isAdding ? 'Añadiendo...' : 'Añadir Item'}
              </GlassButton>
              <GlassButton
                variant="secondary"
                icon={<Camera className="w-4 h-4" />}
                onClick={() => router.push('/despensa/escanear')}
              >
                Escanear Ticket
              </GlassButton>
              <GlassButton
                variant="ghost"
                icon={<ShoppingCart className="w-4 h-4" />}
                onClick={() => router.push('/lista-compras')}
              >
                Lista de Compras
              </GlassButton>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
            >
              <GlassCard variant="medium" className="p-4" interactive>
                <div className="flex items-center justify-between mb-2">
                  <Package className="w-8 h-8 text-purple-500" />
                  <span className="text-2xl font-bold">{stats.totalItems}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Total Items</p>
              </GlassCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              whileHover={{ scale: 1.05 }}
            >
              <GlassCard variant="medium" className="p-4 relative overflow-hidden" interactive>
                {stats.expiringSoon > 0 && (
                  <div className="absolute top-2 right-2">
                    <span className="animate-pulse w-2 h-2 bg-orange-500 rounded-full inline-block"></span>
                  </div>
                )}
                <div className="flex items-center justify-between mb-2">
                  <AlertTriangle className="w-8 h-8 text-orange-500" />
                  <span className="text-2xl font-bold">{stats.expiringSoon}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Por Vencer</p>
              </GlassCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.05 }}
            >
              <GlassCard variant="medium" className="p-4" interactive>
                <div className="flex items-center justify-between mb-2">
                  <TrendingDown className="w-8 h-8 text-red-500" />
                  <span className="text-2xl font-bold">{stats.lowStock}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Stock Bajo</p>
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
                  <BarChart3 className="w-8 h-8 text-blue-500" />
                  <span className="text-2xl font-bold">{stats.categories}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Categorías</p>
              </GlassCard>
            </motion.div>
          </div>

          {/* Search and Filters */}
          <GlassCard variant="medium" className="p-4 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <GlassInput
                  placeholder="Buscar en tu despensa..."
                  icon={<Search className="w-5 h-5" />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <div className="flex gap-3">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="glass-input dark:bg-gray-800 dark:text-white"
                >
                  <option value="name">Nombre</option>
                  <option value="expiry">Vencimiento</option>
                  <option value="quantity">Cantidad</option>
                  <option value="added">Agregado</option>
                </select>

                <div className="flex items-center bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-1 shadow-sm">
                  <GlassButton
                    variant={viewMode === 'grid' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
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

            {/* Category Filters */}
            <div className="flex flex-wrap gap-2 mt-4">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <motion.button
                    key={category.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedCategory(category.id)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 backdrop-blur-sm',
                      selectedCategory === category.id
                        ? `bg-gradient-to-r ${category.color} text-white shadow-lg shadow-black/20 hover:shadow-xl border border-white/30`
                        : 'glass-container glass-subtle hover:bg-gradient-to-r hover:from-white/15 hover:to-white/10 hover:shadow-md hover:border-white/30 border border-white/10'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{category.name}</span>
                  </motion.button>
                );
              })}
            </div>

            {/* Location Filters */}
            <div className="flex flex-wrap gap-2 mt-3">
              {locations.map((location) => {
                const Icon = location.icon;
                return (
                  <motion.button
                    key={location.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedLocation(location.id)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 backdrop-blur-sm',
                      selectedLocation === location.id
                        ? 'bg-gradient-to-r from-slate-500 to-gray-600 text-white shadow-lg shadow-slate-500/20 hover:shadow-xl border border-white/30'
                        : 'glass-container glass-subtle hover:bg-gradient-to-r hover:from-white/15 hover:to-white/10 hover:shadow-md hover:border-white/30 border border-white/10'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{location.name}</span>
                  </motion.button>
                );
              })}
            </div>
          </GlassCard>
        </motion.div>

        {/* Items Grid/List */}
        <AnimatePresence mode="wait">
          {viewMode === 'grid' ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {sortedItems.map((item, index) => {
                const daysUntilExpiry = item.expiration_date ? getDaysUntilExpiry(item.expiration_date) : null;
                const CategoryIcon = categoryIconMap[item.ingredient?.category || 'otros'] || Package;
                
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -5 }}
                    onClick={() => handleItemClick(item)}
                    className="cursor-pointer"
                  >
                    <GlassCard variant="medium" className="overflow-hidden group" interactive>
                      {/* Image */}
                      <div className="relative h-40 overflow-hidden">
                        {item.photo_url ? (
                          <img 
                            src={item.photo_url} 
                            alt={item.ingredient?.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                            {React.createElement(CategoryIcon, {
                              className: "w-16 h-16 text-gray-400 dark:text-gray-500"
                            })}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        
                        {/* Category Badge */}
                        <div className="absolute top-3 left-3">
                          <div className="p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg">
                            {React.createElement(CategoryIcon, {
                              className: "w-5 h-5 dark:text-white"
                            })}
                          </div>
                        </div>

                        {/* Expiry Badge */}
                        {daysUntilExpiry !== null && (
                          <div className="absolute top-3 right-3">
                            <div className={cn(
                              "px-2 py-1 rounded-full text-xs font-medium",
                              getExpiryColor(daysUntilExpiry)
                            )}>
                              {daysUntilExpiry <= 0 ? 'Vencido' : 
                               daysUntilExpiry === 1 ? '1 día' : 
                               `${daysUntilExpiry} días`}
                            </div>
                          </div>
                        )}

                        {/* Quantity */}
                        <div className="absolute bottom-3 left-3 text-white">
                          <p className="text-2xl font-bold">
                            {item.quantity} {item.unit}
                          </p>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <h3 className="font-semibold text-lg mb-1 dark:text-white">{item.ingredient?.name}</h3>
                        {item.notes && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{item.notes}</p>
                        )}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">
                            {locations.find(l => l.id === item.location)?.name}
                          </span>
                          <span className="text-gray-500 dark:text-gray-400">
                            Agregado {format(new Date(item.created_at), 'dd/MM', { locale: es })}
                          </span>
                        </div>
                      </div>
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
              className="space-y-3"
            >
              {sortedItems.map((item, index) => {
                const daysUntilExpiry = item.expiration_date ? getDaysUntilExpiry(item.expiration_date) : null;
                const CategoryIcon = categoryIconMap[item.ingredient?.category || 'otros'] || Package;
                
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleItemClick(item)}
                    className="cursor-pointer"
                  >
                    <GlassCard variant="subtle" className="p-4" interactive>
                      <div className="flex items-center gap-4">
                        {item.photo_url ? (
                          <img 
                            src={item.photo_url} 
                            alt={item.ingredient?.name}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                            {React.createElement(CategoryIcon, {
                              className: "w-8 h-8 text-gray-400 dark:text-gray-500"
                            })}
                          </div>
                        )}
                        
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold dark:text-white">{item.ingredient?.name}</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                {item.quantity} {item.unit} • {locations.find(l => l.id === item.location)?.name}
                              </p>
                            </div>
                            {daysUntilExpiry !== null && (
                              <div className={cn(
                                "px-2 py-1 rounded-full text-xs font-medium",
                                getExpiryColor(daysUntilExpiry)
                              )}>
                                {daysUntilExpiry <= 0 ? 'Vencido' : 
                                 daysUntilExpiry === 1 ? '1 día' : 
                                 `${daysUntilExpiry} días`}
                              </div>
                            )}
                          </div>
                        </div>

                        {React.createElement(CategoryIcon, {
                          className: "w-5 h-5 text-gray-400 dark:text-gray-500"
                        })}
                      </div>
                    </GlassCard>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {sortedItems.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-12"
          >
            {/* Si hay filtros activos, mostrar mensaje de no encontrados */}
            {(searchQuery || selectedCategory !== 'all' || selectedLocation !== 'all') ? (
              <div className="text-center">
                <GlassCard variant="subtle" className="p-8 max-w-md mx-auto">
                  <Package className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No se encontraron items
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Intenta ajustar tus filtros o añade nuevos items a tu despensa.
                  </p>
                  <GlassButton
                    variant="primary"
                    icon={<Plus className="w-4 h-4" />}
                    onClick={() => setShowAddModal(true)}
                    disabled={isAdding}
                  >
                    {isAdding ? 'Añadiendo...' : 'Añadir Item'}
                  </GlassButton>
                </GlassCard>
              </div>
            ) : (
              /* Si no hay filtros, mostrar onboarding con packs */
              <div className="max-w-4xl mx-auto">
                <OnboardingPacks 
                  onPackSelected={handlePackSelection}
                  isLoading={isAdding}
                />
                
                {/* Divider */}
                <div className="flex items-center gap-4 my-8">
                  <div className="flex-1 border-t border-gray-200/50 dark:border-gray-700/50"></div>
                  <span className="text-sm text-gray-500 dark:text-gray-400 px-3">o agregá manualmente</span>
                  <div className="flex-1 border-t border-gray-200/50 dark:border-gray-700/50"></div>
                </div>

                {/* Manual add option */}
                <div className="text-center">
                  <GlassButton
                    variant="outline"
                    icon={<Plus className="w-4 h-4" />}
                    onClick={() => setShowAddModal(true)}
                    disabled={isAdding}
                    size="lg"
                  >
                    {isAdding ? 'Añadiendo...' : 'Agregar item individual'}
                  </GlassButton>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Add Item Modal */}
      <GlassModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Añadir Item a la Despensa"
        size="lg"
      >
        <div className="space-y-4">
          <GlassInput
            label="Nombre del producto"
            placeholder="ej. Leche, Tomates, etc."
            value={addItemForm.ingredient_name}
            onChange={(e) => setAddItemForm(prev => ({ ...prev, ingredient_name: e.target.value }))}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <GlassInput
              label="Cantidad"
              type="number"
              placeholder="1"
              value={addItemForm.quantity.toString()}
              onChange={(e) => setAddItemForm(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 1 }))}
            />
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-300">Unidad</label>
              <select 
                className="glass-input w-full dark:bg-gray-800 dark:text-white"
                value={addItemForm.unit}
                onChange={(e) => setAddItemForm(prev => ({ ...prev, unit: e.target.value }))}
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
            <label className="block text-sm font-medium mb-2 dark:text-gray-300">Ubicación</label>
            <select 
              className="glass-input w-full dark:bg-gray-800 dark:text-white"
              value={addItemForm.location}
              onChange={(e) => setAddItemForm(prev => ({ ...prev, location: e.target.value }))}
            >
              {locations.filter(l => l.id !== 'all').map(location => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>

          <GlassInput
            label="Fecha de vencimiento (opcional)"
            type="date"
            value={addItemForm.expiration_date ? addItemForm.expiration_date.toISOString().split('T')[0] : ''}
            onChange={(e) => setAddItemForm(prev => ({ 
              ...prev, 
              expiration_date: e.target.value ? new Date(e.target.value) : undefined 
            }))}
          />

          <GlassInput
            label="Notas (opcional)"
            placeholder="Marca, observaciones, etc."
            value={addItemForm.notes}
            onChange={(e) => setAddItemForm(prev => ({ ...prev, notes: e.target.value }))}
          />

          <div className="flex gap-3 pt-4">
            <GlassButton 
              variant="primary" 
              className="flex-1"
              onClick={handleAddItem}
              disabled={isAdding || !addItemForm.ingredient_name.trim()}
            >
              {isAdding ? 'Añadiendo...' : 'Añadir Item'}
            </GlassButton>
            <GlassButton 
              variant="ghost" 
              onClick={() => setShowAddModal(false)}
              disabled={isAdding}
            >
              Cancelar
            </GlassButton>
          </div>
        </div>
      </GlassModal>

      {/* Item Details Modal */}
      <GlassModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title={selectedItem?.ingredient?.name}
        size="lg"
      >
        {selectedItem && (
          <div className="space-y-6">
            {selectedItem.photo_url ? (
              <img 
                src={selectedItem.photo_url} 
                alt={selectedItem.ingredient?.name}
                className="w-full h-48 object-cover rounded-xl"
              />
            ) : (
              <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-xl flex items-center justify-center">
                {React.createElement(categoryIconMap[selectedItem.ingredient?.category || 'otros'] || Package, {
                  className: "w-16 h-16 text-gray-400 dark:text-gray-500"
                })}
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Cantidad</p>
                <p className="font-semibold dark:text-white">{selectedItem.quantity} {selectedItem.unit}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Ubicación</p>
                <p className="font-semibold dark:text-white">
                  {locations.find(l => l.id === selectedItem.location)?.name}
                </p>
              </div>
              {selectedItem.expiration_date && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Vencimiento</p>
                  <p className="font-semibold dark:text-white">
                    {format(new Date(selectedItem.expiration_date), "d 'de' MMMM, yyyy", { locale: es })}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Agregado</p>
                <p className="font-semibold dark:text-white">
                  {format(new Date(selectedItem.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                </p>
              </div>
            </div>

            {selectedItem.notes && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Notas</p>
                <p className="font-semibold dark:text-white">{selectedItem.notes}</p>
              </div>
            )}

            <div className="flex gap-3">
              <GlassButton variant="primary" className="flex-1" icon={<Edit className="w-4 h-4" />}>
                Editar
              </GlassButton>
              <GlassButton variant="secondary" icon={<ShoppingCart className="w-4 h-4" />}>
                Añadir a Lista
              </GlassButton>
              <GlassButton 
                variant="ghost" 
                icon={<Trash2 className="w-4 h-4" />}
                onClick={() => handleDeleteItem(selectedItem.id)}
                disabled={isDeleting[selectedItem.id]}
              >
                {isDeleting[selectedItem.id] ? 'Eliminando...' : 'Eliminar'}
              </GlassButton>
            </div>
          </div>
        )}
      </GlassModal>
    </div>
  );
}