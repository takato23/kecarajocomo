'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
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
  Fish,
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
import { format, addDays, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import Image from 'next/image';

import { GlassCard, GlassButton, GlassInput, GlassModal } from '@/components/ui/GlassCard';
import { useAuthStore } from '@/stores/auth';
import { cn } from '@/lib/utils';

// Mock data para la despensa
const mockPantryItems = [
  {
    id: '1',
    name: 'Leche',
    category: 'dairy',
    quantity: 2,
    unit: 'litros',
    location: 'refrigerator',
    expiryDate: addDays(new Date(), 5),
    addedDate: addDays(new Date(), -3),
    image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=200',
    brand: 'La Serenísima'
  },
  {
    id: '2',
    name: 'Tomates',
    category: 'vegetables',
    quantity: 6,
    unit: 'unidades',
    location: 'refrigerator',
    expiryDate: addDays(new Date(), 7),
    addedDate: addDays(new Date(), -1),
    image: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=200'
  },
  {
    id: '3',
    name: 'Pasta',
    category: 'grains',
    quantity: 500,
    unit: 'gramos',
    location: 'pantry',
    expiryDate: addDays(new Date(), 180),
    addedDate: addDays(new Date(), -10),
    image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=200',
    brand: 'Barilla'
  },
  {
    id: '4',
    name: 'Pollo',
    category: 'meat',
    quantity: 1.5,
    unit: 'kg',
    location: 'freezer',
    expiryDate: addDays(new Date(), 30),
    addedDate: addDays(new Date(), -2),
    image: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=200'
  },
  {
    id: '5',
    name: 'Manzanas',
    category: 'fruits',
    quantity: 8,
    unit: 'unidades',
    location: 'pantry',
    expiryDate: addDays(new Date(), 10),
    addedDate: addDays(new Date(), -4),
    image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=200'
  },
  {
    id: '6',
    name: 'Yogur',
    category: 'dairy',
    quantity: 4,
    unit: 'unidades',
    location: 'refrigerator',
    expiryDate: addDays(new Date(), 3),
    addedDate: addDays(new Date(), -5),
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=200',
    brand: 'Danone',
    isExpiringSoon: true
  }
];

const categories = [
  { id: 'all', name: 'Todos', icon: Package, color: 'from-gray-400 to-gray-500' },
  { id: 'dairy', name: 'Lácteos', icon: Milk, color: 'from-blue-400 to-blue-500' },
  { id: 'vegetables', name: 'Vegetales', icon: Carrot, color: 'from-green-400 to-green-500' },
  { id: 'fruits', name: 'Frutas', icon: Apple, color: 'from-orange-400 to-orange-500' },
  { id: 'meat', name: 'Carnes', icon: Beef, color: 'from-red-400 to-red-500' },
  { id: 'fish', name: 'Pescados', icon: Fish, color: 'from-cyan-400 to-cyan-500' },
  { id: 'grains', name: 'Granos', icon: Wheat, color: 'from-yellow-400 to-yellow-500' },
  { id: 'snacks', name: 'Snacks', icon: Cookie, color: 'from-purple-400 to-purple-500' },
  { id: 'beverages', name: 'Bebidas', icon: Coffee, color: 'from-amber-400 to-amber-500' }
];

const locations = [
  { id: 'all', name: 'Todos', icon: Home },
  { id: 'pantry', name: 'Despensa', icon: Package },
  { id: 'refrigerator', name: 'Refrigerador', icon: Refrigerator },
  { id: 'freezer', name: 'Congelador', icon: TrendingDown }
];

export default function DespensaPage() {
  const router = useRouter();
  const { user: _user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [sortBy, setSortBy] = useState('name');

  // Calcular días hasta vencimiento
  const getDaysUntilExpiry = (expiryDate: Date) => {
    return differenceInDays(expiryDate, new Date());
  };

  // Filtrar items
  const filteredItems = mockPantryItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.brand?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesLocation = selectedLocation === 'all' || item.location === selectedLocation;
    
    return matchesSearch && matchesCategory && matchesLocation;
  });

  // Ordenar items
  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'expiry':
        return getDaysUntilExpiry(a.expiryDate) - getDaysUntilExpiry(b.expiryDate);
      case 'quantity':
        return b.quantity - a.quantity;
      case 'added':
        return b.addedDate.getTime() - a.addedDate.getTime();
      default:
        return 0;
    }
  });

  // Estadísticas
  const stats = {
    totalItems: mockPantryItems.length,
    expiringSoon: mockPantryItems.filter(item => getDaysUntilExpiry(item.expiryDate) <= 3).length,
    lowStock: mockPantryItems.filter(item => item.quantity <= 2).length,
    categories: new Set(mockPantryItems.map(item => item.category)).size
  };

  const handleItemClick = (item: any) => {
    setSelectedItem(item);
    setShowDetailsModal(true);
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
              <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Mi Despensa
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Gestiona {stats.totalItems} ingredientes y controla fechas de vencimiento
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
                icon={<Camera className="w-4 h-4" />}
                onClick={() => router.push('/pantry/scan')}
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
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Items</p>
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
                <p className="text-sm text-gray-600 dark:text-gray-400">Por Vencer</p>
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
                <p className="text-sm text-gray-600 dark:text-gray-400">Stock Bajo</p>
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
                <p className="text-sm text-gray-600 dark:text-gray-400">Categorías</p>
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
                  className="glass-input"
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
                const daysUntilExpiry = getDaysUntilExpiry(item.expiryDate);
                const CategoryIcon = categories.find(c => c.id === item.category)?.icon || Package;
                
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
                        <img 
                          src={item.image} 
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        
                        {/* Category Badge */}
                        <div className="absolute top-3 left-3">
                          <div className="p-2 bg-white/90 backdrop-blur-sm rounded-lg">
                            <CategoryIcon className="w-5 h-5" />
                          </div>
                        </div>

                        {/* Expiry Badge */}
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

                        {/* Quantity */}
                        <div className="absolute bottom-3 left-3 text-white">
                          <p className="text-2xl font-bold">
                            {item.quantity} {item.unit}
                          </p>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <h3 className="font-semibold text-lg mb-1">{item.name}</h3>
                        {item.brand && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{item.brand}</p>
                        )}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">
                            {locations.find(l => l.id === item.location)?.name}
                          </span>
                          <span className="text-gray-500">
                            Agregado {format(item.addedDate, 'dd/MM', { locale: es })}
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
                const daysUntilExpiry = getDaysUntilExpiry(item.expiryDate);
                const CategoryIcon = categories.find(c => c.id === item.category)?.icon || Package;
                
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
                        <img 
                          src={item.image} 
                          alt={item.name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold">{item.name}</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {item.quantity} {item.unit} • {locations.find(l => l.id === item.location)?.name}
                              </p>
                            </div>
                            <div className={cn(
                              "px-2 py-1 rounded-full text-xs font-medium",
                              getExpiryColor(daysUntilExpiry)
                            )}>
                              {daysUntilExpiry <= 0 ? 'Vencido' : 
                               daysUntilExpiry === 1 ? '1 día' : 
                               `${daysUntilExpiry} días`}
                            </div>
                          </div>
                        </div>

                        <CategoryIcon className="w-5 h-5 text-gray-400" />
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
            className="text-center py-12"
          >
            <GlassCard variant="subtle" className="p-8 max-w-md mx-auto">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
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
        title="Añadir Item a la Despensa"
        size="lg"
      >
        <div className="space-y-4">
          <GlassInput
            label="Nombre del producto"
            placeholder="ej. Leche, Tomates, etc."
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
                {categories.filter(c => c.id !== 'all').map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Ubicación</label>
              <select className="glass-input w-full">
                {locations.filter(l => l.id !== 'all').map(location => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <GlassInput
            label="Fecha de vencimiento"
            type="date"
          />

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

      {/* Item Details Modal */}
      <GlassModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title={selectedItem?.name}
        size="lg"
      >
        {selectedItem && (
          <div className="space-y-6">
            <img 
              src={selectedItem.image} 
              alt={selectedItem.name}
              className="w-full h-48 object-cover rounded-xl"
            />
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Cantidad</p>
                <p className="font-semibold">{selectedItem.quantity} {selectedItem.unit}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Ubicación</p>
                <p className="font-semibold">
                  {locations.find(l => l.id === selectedItem.location)?.name}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Vencimiento</p>
                <p className="font-semibold">
                  {format(selectedItem.expiryDate, "d 'de' MMMM, yyyy", { locale: es })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Agregado</p>
                <p className="font-semibold">
                  {format(selectedItem.addedDate, "d 'de' MMMM, yyyy", { locale: es })}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <GlassButton variant="primary" className="flex-1" icon={<Edit className="w-4 h-4" />}>
                Editar
              </GlassButton>
              <GlassButton variant="secondary" icon={<ShoppingCart className="w-4 h-4" />}>
                Añadir a Lista
              </GlassButton>
              <GlassButton variant="ghost" icon={<Trash2 className="w-4 h-4" />}>
                Eliminar
              </GlassButton>
            </div>
          </div>
        )}
      </GlassModal>
    </div>
  );
}