'use client';

import React, { useState, useMemo } from 'react';
import { 
  Package,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Edit,
  Trash2,
  ShoppingCart,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { format, differenceInDays, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Tipos para pantry
interface PantryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  expirationDate?: Date;
  purchaseDate: Date;
  location?: string;
  notes?: string;
  emoji?: string;
}

interface PantryCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  count: number;
}

// Categorías predefinidas con emojis
const PANTRY_CATEGORIES: PantryCategory[] = [
  { id: 'carnes', name: 'Carnes', icon: '🥩', color: 'from-red-500 to-pink-600', count: 0 },
  { id: 'lacteos', name: 'Lácteos', icon: '🥛', color: 'from-blue-500 to-cyan-600', count: 0 },
  { id: 'verduras', name: 'Verduras', icon: '🥬', color: 'from-green-500 to-emerald-600', count: 0 },
  { id: 'frutas', name: 'Frutas', icon: '🍎', color: 'from-yellow-500 to-orange-600', count: 0 },
  { id: 'granos', name: 'Granos', icon: '🌾', color: 'from-amber-500 to-yellow-600', count: 0 },
  { id: 'condimentos', name: 'Condimentos', icon: '🧂', color: 'from-purple-500 to-indigo-600', count: 0 },
  { id: 'bebidas', name: 'Bebidas', icon: '🥤', color: 'from-teal-500 to-blue-600', count: 0 },
  { id: 'otros', name: 'Otros', icon: '📦', color: 'from-gray-500 to-slate-600', count: 0 }
];

// Componente de item de despensa
const PantryItemCard: React.FC<{
  item: PantryItem;
  onEdit: (item: PantryItem) => void;
  onDelete: (item: PantryItem) => void;
  onAddToShoppingList: (item: PantryItem) => void;
}> = ({ item, onEdit, onDelete, onAddToShoppingList }) => {
  const daysUntilExpiration = item.expirationDate ? differenceInDays(item.expirationDate, new Date()) : null;
  const isExpiringSoon = daysUntilExpiration !== null && daysUntilExpiration <= 3 && daysUntilExpiration >= 0;
  const isExpired = daysUntilExpiration !== null && daysUntilExpiration < 0;

  const getExpirationColor = () => {
    if (isExpired) return 'text-red-600 bg-red-50 border-red-200';
    if (isExpiringSoon) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  };

  const getExpirationText = () => {
    if (!item.expirationDate) return 'Sin fecha';
    if (isExpired) return `Expiró hace ${Math.abs(daysUntilExpiration!)} día(s)`;
    if (daysUntilExpiration === 0) return 'Expira hoy';
    if (isExpiringSoon) return `Expira en ${daysUntilExpiration} día(s)`;
    return format(item.expirationDate, 'd MMM yyyy', { locale: es });
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 border-l-4 border-l-gray-200 hover:border-l-emerald-400">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{item.emoji || '📦'}</span>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{item.name}</h3>
              <p className="text-sm text-gray-600">
                {item.quantity} {item.unit} • {item.category}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="sm" variant="ghost" onClick={() => onEdit(item)} aria-label="Editar item">
              <Edit className="w-3 h-3" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onAddToShoppingList(item)} aria-label="Agregar a lista">
              <ShoppingCart className="w-3 h-3" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onDelete(item)} aria-label="Eliminar item">
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {item.expirationDate && (
          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getExpirationColor()}`}>
            <Clock className="w-3 h-3 mr-1" />
            {getExpirationText()}
          </div>
        )}

        {item.location && (
          <p className="text-xs text-gray-500 mt-2">📍 {item.location}</p>
        )}
      </CardContent>
    </Card>
  );
};

// Componente de categoría
const CategoryCard: React.FC<{
  category: PantryCategory;
  isSelected: boolean;
  onClick: () => void;
}> = ({ category, isSelected, onClick }) => (
  <Card 
    className={`cursor-pointer transition-all duration-200 hover:scale-105 ${
      isSelected ? 'ring-2 ring-emerald-500 shadow-lg' : 'hover:shadow-md'
    }`}
    onClick={onClick}
  >
    <CardContent className="p-4 text-center">
      <div className={`w-12 h-12 mx-auto rounded-2xl bg-gradient-to-r ${category.color} flex items-center justify-center text-2xl mb-3`}>
        {category.icon}
      </div>
      <h3 className="font-medium text-gray-900 dark:text-white text-sm">{category.name}</h3>
      <p className="text-xs text-gray-500 mt-1">{category.count} items</p>
    </CardContent>
  </Card>
);

export const PantryDashboard: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showExpiredOnly, setShowExpiredOnly] = useState(false);
  const [showExpiringSoon, setShowExpiringSoon] = useState(false);

  // Datos mock - en una app real vendrían de la store
  const [pantryItems] = useState<PantryItem[]>([
    {
      id: '1',
      name: 'Leche Entera',
      category: 'lacteos',
      quantity: 1,
      unit: 'L',
      expirationDate: addDays(new Date(), 2),
      purchaseDate: new Date(),
      location: 'Refrigerador',
      emoji: '🥛'
    },
    {
      id: '2',
      name: 'Pollo',
      category: 'carnes',
      quantity: 1,
      unit: 'kg',
      expirationDate: addDays(new Date(), -1),
      purchaseDate: addDays(new Date(), -5),
      location: 'Congelador',
      emoji: '🐔'
    },
    {
      id: '3',
      name: 'Tomates',
      category: 'verduras',
      quantity: 6,
      unit: 'u',
      expirationDate: addDays(new Date(), 5),
      purchaseDate: addDays(new Date(), -2),
      location: 'Refrigerador',
      emoji: '🍅'
    },
    {
      id: '4',
      name: 'Arroz',
      category: 'granos',
      quantity: 2,
      unit: 'kg',
      purchaseDate: addDays(new Date(), -10),
      location: 'Despensa',
      emoji: '🍚'
    },
    {
      id: '5',
      name: 'Manzanas',
      category: 'frutas',
      quantity: 8,
      unit: 'u',
      expirationDate: addDays(new Date(), 7),
      purchaseDate: addDays(new Date(), -1),
      location: 'Refrigerador',
      emoji: '🍎'
    }
  ]);

  // Calcular estadísticas
  const stats = useMemo(() => {
    const totalItems = pantryItems.length;
    const expiredItems = pantryItems.filter(item => {
      if (!item.expirationDate) return false;
      return differenceInDays(item.expirationDate, new Date()) < 0;
    }).length;
    
    const expiringSoon = pantryItems.filter(item => {
      if (!item.expirationDate) return false;
      const days = differenceInDays(item.expirationDate, new Date());
      return days >= 0 && days <= 3;
    }).length;

    return { totalItems, expiredItems, expiringSoon };
  }, [pantryItems]);

  // Actualizar contadores de categorías
  const categoriesWithCounts = useMemo(() => {
    return PANTRY_CATEGORIES.map(category => ({
      ...category,
      count: pantryItems.filter(item => item.category === category.id).length
    }));
  }, [pantryItems]);

  // Filtrar items
  const filteredItems = useMemo(() => {
    let filtered = pantryItems;

    // Filtro por búsqueda
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtro por categoría
    if (selectedCategory) {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // Filtro por expiración
    if (showExpiredOnly) {
      filtered = filtered.filter(item => {
        if (!item.expirationDate) return false;
        return differenceInDays(item.expirationDate, new Date()) < 0;
      });
    }

    if (showExpiringSoon) {
      filtered = filtered.filter(item => {
        if (!item.expirationDate) return false;
        const days = differenceInDays(item.expirationDate, new Date());
        return days >= 0 && days <= 3;
      });
    }

    return filtered;
  }, [pantryItems, searchQuery, selectedCategory, showExpiredOnly, showExpiringSoon]);

  // Handlers
  const handleEditItem = (item: PantryItem) => {

  };

  const handleDeleteItem = (item: PantryItem) => {

  };

  const handleAddToShoppingList = (item: PantryItem) => {

  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-6">
      {/* Header con estadísticas */}
      <Card className="shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Package className="w-8 h-8 text-emerald-600" />
              <div>
                <CardTitle className="text-3xl">Gestión de Despensa</CardTitle>
                <p className="text-gray-600 mt-1">
                  Controla tus productos y fechas de vencimiento
                </p>
              </div>
            </div>
            <Button className="group">
              <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" />
              Agregar Producto
            </Button>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Items</p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.totalItems}</p>
                </div>
                <Package className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 p-4 rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">Expiran Pronto</p>
                  <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{stats.expiringSoon}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-yellow-600" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-4 rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 dark:text-red-400 font-medium">Expirados</p>
                  <p className="text-2xl font-bold text-red-700 dark:text-red-300">{stats.expiredItems}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 p-4 rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">En Buen Estado</p>
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                    {stats.totalItems - stats.expiredItems - stats.expiringSoon}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filtros y búsqueda */}
      <Card className="shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Búsqueda */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-800 dark:border-gray-700"
                aria-label="Buscar productos en despensa"
              />
            </div>

            {/* Filtros */}
            <div className="flex items-center space-x-2">
              <Button
                variant={showExpiringSoon ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setShowExpiringSoon(!showExpiringSoon);
                  setShowExpiredOnly(false);
                }}
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Expiran Pronto
              </Button>
              <Button
                variant={showExpiredOnly ? "destructive" : "outline"}
                size="sm"
                onClick={() => {
                  setShowExpiredOnly(!showExpiredOnly);
                  setShowExpiringSoon(false);
                }}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Expirados
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Categorías */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-6 h-6 text-gray-600 mr-2" />
            Categorías
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <CategoryCard
              category={{ id: 'all', name: 'Todas', icon: '📦', color: 'from-gray-500 to-slate-600', count: stats.totalItems }}
              isSelected={selectedCategory === null}
              onClick={() => setSelectedCategory(null)}
            />
            {categoriesWithCounts.map(category => (
              <CategoryCard
                key={category.id}
                category={category}
                isSelected={selectedCategory === category.id}
                onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lista de productos */}
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            Productos ({filteredItems.length})
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <BarChart3 className="w-4 h-4 mr-2" />
              Estadísticas
            </Button>
            <Button variant="outline" size="sm">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Generar Lista
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No se encontraron productos</p>
              <p className="text-gray-400 text-sm">Intenta ajustar los filtros o agregar nuevos productos</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredItems.map(item => (
                <PantryItemCard
                  key={item.id}
                  item={item}
                  onEdit={handleEditItem}
                  onDelete={handleDeleteItem}
                  onAddToShoppingList={handleAddToShoppingList}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};