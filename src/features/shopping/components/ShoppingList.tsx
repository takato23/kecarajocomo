'use client';

import React, { useState, useMemo } from 'react';
import { 
  ShoppingCart,
  Plus,
  Search,
  Check,
  Edit,
  Trash2,
  Star,
  MapPin,
  DollarSign,
  Package,
  Clock,
  Users,
  Share2,
  Download,
  BarChart3,
  Shuffle,
  CheckCircle
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Tipos para shopping list
interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  isPurchased: boolean;
  isRequired: boolean;
  estimatedPrice?: number;
  notes?: string;
  emoji?: string;
  addedBy?: string;
  addedDate: Date;
  store?: string;
}

interface ShoppingCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  items: ShoppingItem[];
  order: number;
}

interface ShoppingList {
  id: string;
  name: string;
  items: ShoppingItem[];
  createdDate: Date;
  isShared: boolean;
  collaborators?: string[];
  estimatedTotal?: number;
  store?: string;
}

// Categorías con orden lógico para compras (siguiendo recorrido típico de supermercado)
const SHOPPING_CATEGORIES: Omit<ShoppingCategory, 'items'>[] = [
  { id: 'frutas-verduras', name: 'Frutas y Verduras', icon: '🥬', color: 'from-green-500 to-emerald-600', order: 1 },
  { id: 'carnes-pescados', name: 'Carnes y Pescados', icon: '🥩', color: 'from-red-500 to-pink-600', order: 2 },
  { id: 'lacteos-huevos', name: 'Lácteos y Huevos', icon: '🥛', color: 'from-blue-500 to-cyan-600', order: 3 },
  { id: 'panaderia', name: 'Panadería', icon: '🍞', color: 'from-amber-500 to-yellow-600', order: 4 },
  { id: 'granos-cereales', name: 'Granos y Cereales', icon: '🌾', color: 'from-orange-500 to-red-600', order: 5 },
  { id: 'condimentos-especias', name: 'Condimentos', icon: '🧂', color: 'from-purple-500 to-indigo-600', order: 6 },
  { id: 'bebidas', name: 'Bebidas', icon: '🥤', color: 'from-teal-500 to-blue-600', order: 7 },
  { id: 'limpieza', name: 'Limpieza', icon: '🧽', color: 'from-cyan-500 to-blue-600', order: 8 },
  { id: 'cuidado-personal', name: 'Cuidado Personal', icon: '🧴', color: 'from-pink-500 to-rose-600', order: 9 },
  { id: 'otros', name: 'Otros', icon: '📦', color: 'from-gray-500 to-slate-600', order: 10 }
];

// Función para categorizar automáticamente productos
const categorizarProducto = (nombre: string): string => {
  const nombreLower = nombre.toLowerCase();
  
  // Frutas y Verduras
  if (nombreLower.match(/(tomate|lechuga|zanahoria|cebolla|papa|manzana|banana|naranja|limón|apio|pepino|brócoli|espinaca|ajo|perejil|cilantro|pimiento|aguacate)/)) {
    return 'frutas-verduras';
  }
  
  // Carnes y Pescados
  if (nombreLower.match(/(pollo|carne|res|cerdo|pescado|salmón|atún|jamón|chorizo|salchicha|pavo|cordero)/)) {
    return 'carnes-pescados';
  }
  
  // Lácteos y Huevos
  if (nombreLower.match(/(leche|queso|yogur|mantequilla|crema|huevo|yogurt)/)) {
    return 'lacteos-huevos';
  }
  
  // Panadería
  if (nombreLower.match(/(pan|tortilla|galleta|pastel|croissant|bagel|dona)/)) {
    return 'panaderia';
  }
  
  // Granos y Cereales
  if (nombreLower.match(/(arroz|pasta|avena|quinoa|lentejas|frijol|garbanzo|cereal|harina)/)) {
    return 'granos-cereales';
  }
  
  // Condimentos
  if (nombreLower.match(/(sal|pimienta|aceite|vinagre|mostaza|ketchup|mayonesa|soya|especias)/)) {
    return 'condimentos-especias';
  }
  
  // Bebidas
  if (nombreLower.match(/(agua|refresco|jugo|café|té|cerveza|vino|soda)/)) {
    return 'bebidas';
  }
  
  // Limpieza
  if (nombreLower.match(/(detergente|jabón|shampoo|suavizante|cloro|desinfectante|papel higiénico|toallas)/)) {
    return 'limpieza';
  }
  
  // Cuidado Personal
  if (nombreLower.match(/(pasta dental|cepillo|desodorante|perfume|crema|loción)/)) {
    return 'cuidado-personal';
  }
  
  return 'otros';
};

// Parsear entrada de texto natural (como "media docena de huevos")
const parsearEntrada = (entrada: string): { nombre: string; cantidad: number; unidad: string } => {
  const entradaLower = entrada.toLowerCase().trim();
  
  // Detectar "media docena" -> 6
  if (entradaLower.includes('media docena')) {
    const producto = entradaLower.replace('media docena de', '').replace('media docena', '').trim();
    return { nombre: producto, cantidad: 6, unidad: 'u' };
  }
  
  // Detectar "docena" -> 12
  if (entradaLower.includes('docena')) {
    const producto = entradaLower.replace('docena de', '').replace('docena', '').trim();
    return { nombre: producto, cantidad: 12, unidad: 'u' };
  }
  
  // Detectar números seguidos de unidades
  const match = entradaLower.match(/(\d+(?:\.\d+)?)\s*(kg|g|l|ml|u|unidad|unidades|litro|litros|gramo|gramos|kilo|kilos)?\s*(.+)/);
  if (match) {
    const [, cantidad, unidad, producto] = match;
    return {
      nombre: producto.trim(),
      cantidad: parseFloat(cantidad),
      unidad: unidad ? (unidad.startsWith('u') ? 'u' : unidad) : 'u'
    };
  }
  
  // Si no se detecta cantidad, asumir 1
  return { nombre: entrada.trim(), cantidad: 1, unidad: 'u' };
};

// Componente de item de compras
const ShoppingItemCard: React.FC<{
  item: ShoppingItem;
  onTogglePurchased: (item: ShoppingItem) => void;
  onEdit: (item: ShoppingItem) => void;
  onDelete: (item: ShoppingItem) => void;
  showPrices: boolean;
}> = ({ item, onTogglePurchased, onEdit, onDelete, showPrices }) => {
  return (
    <div className={`group p-4 rounded-xl border transition-all duration-200 ${
      item.isPurchased 
        ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20' 
        : 'bg-white border-gray-200 hover:border-emerald-300 dark:bg-gray-800 dark:border-gray-700'
    }`}>
      <div className="flex items-center space-x-3">
        {/* Checkbox */}
        <button
          onClick={() => onTogglePurchased(item)}
          className={`w-6 h-6 rounded-full border-2 transition-all duration-200 flex items-center justify-center ${
            item.isPurchased
              ? 'bg-emerald-500 border-emerald-500 text-white'
              : 'border-gray-300 hover:border-emerald-400'
          }`}
          aria-label={item.isPurchased ? "Marcar como no comprado" : "Marcar como comprado"}
        >
          {item.isPurchased && <Check className="w-4 h-4" />}
        </button>

        {/* Emoji/Icon */}
        <span className="text-2xl">{item.emoji || '📦'}</span>

        {/* Item Info */}
        <div className="flex-1">
          <div className={`font-medium ${item.isPurchased ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}`}>
            {item.name}
          </div>
          <div className="text-sm text-gray-600 flex items-center space-x-2">
            <span>{item.quantity} {item.unit}</span>
            {item.isRequired && <Star className="w-3 h-3 text-yellow-500" />}
            {showPrices && item.estimatedPrice && (
              <span className="text-emerald-600 font-medium">
                ${item.estimatedPrice.toFixed(2)}
              </span>
            )}
          </div>
          {item.notes && (
            <div className="text-xs text-gray-500 mt-1">{item.notes}</div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button size="sm" variant="ghost" onClick={() => onEdit(item)} aria-label="Editar item">
            <Edit className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onDelete(item)} aria-label="Eliminar item">
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// Componente de categoría de compras
const ShoppingCategorySection: React.FC<{
  category: ShoppingCategory;
  onTogglePurchased: (item: ShoppingItem) => void;
  onEditItem: (item: ShoppingItem) => void;
  onDeleteItem: (item: ShoppingItem) => void;
  showPrices: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}> = ({ category, onTogglePurchased, onEditItem, onDeleteItem, showPrices, isCollapsed, onToggleCollapse }) => {
  const completedItems = category.items.filter(item => item.isPurchased).length;
  const totalItems = category.items.length;
  const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  if (category.items.length === 0) return null;

  return (
    <Card className="shadow-lg">
      <CardHeader 
        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        onClick={onToggleCollapse}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${category.color} flex items-center justify-center text-xl`}>
              {category.icon}
            </div>
            <div>
              <CardTitle className="text-lg">{category.name}</CardTitle>
              <p className="text-sm text-gray-600">
                {completedItems} de {totalItems} items
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {progress > 0 && (
              <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r ${category.color} transition-all duration-300`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
            <span className="text-sm text-gray-500">
              {isCollapsed ? '+' : '−'}
            </span>
          </div>
        </div>
      </CardHeader>
      
      {!isCollapsed && (
        <CardContent className="space-y-3">
          {category.items.map(item => (
            <ShoppingItemCard
              key={item.id}
              item={item}
              onTogglePurchased={onTogglePurchased}
              onEdit={onEditItem}
              onDelete={onDeleteItem}
              showPrices={showPrices}
            />
          ))}
        </CardContent>
      )}
    </Card>
  );
};

export const ShoppingList: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [newItemInput, setNewItemInput] = useState('');
  const [showPurchased, setShowPurchased] = useState(true);
  const [showPrices, setShowPrices] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  // Estado de la lista de compras mock
  const [shoppingList, setShoppingList] = useState<ShoppingList>({
    id: '1',
    name: 'Lista Semanal',
    createdDate: new Date(),
    isShared: false,
    items: [
      {
        id: '1',
        name: 'Tomates Cherry',
        quantity: 500,
        unit: 'g',
        category: 'frutas-verduras',
        isPurchased: false,
        isRequired: true,
        estimatedPrice: 3.50,
        emoji: '🍅',
        addedDate: new Date(),
        addedBy: 'Usuario'
      },
      {
        id: '2',
        name: 'Pollo Entero',
        quantity: 1,
        unit: 'kg',
        category: 'carnes-pescados',
        isPurchased: true,
        isRequired: true,
        estimatedPrice: 8.99,
        emoji: '🐔',
        addedDate: new Date(),
        addedBy: 'Usuario'
      },
      {
        id: '3',
        name: 'Leche Entera',
        quantity: 1,
        unit: 'L',
        category: 'lacteos-huevos',
        isPurchased: false,
        isRequired: true,
        estimatedPrice: 2.30,
        emoji: '🥛',
        addedDate: new Date(),
        addedBy: 'Usuario'
      },
      {
        id: '4',
        name: 'Pan Integral',
        quantity: 1,
        unit: 'u',
        category: 'panaderia',
        isPurchased: false,
        isRequired: false,
        estimatedPrice: 1.80,
        emoji: '🍞',
        addedDate: new Date(),
        addedBy: 'Usuario'
      }
    ]
  });

  // Organizar items por categorías
  const categorizedItems = useMemo(() => {
    const filteredItems = shoppingList.items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesVisibility = showPurchased || !item.isPurchased;
      return matchesSearch && matchesVisibility;
    });

    return SHOPPING_CATEGORIES.map(categoryTemplate => {
      const categoryItems = filteredItems.filter(item => item.category === categoryTemplate.id);
      return {
        ...categoryTemplate,
        items: categoryItems.sort((a, b) => a.isPurchased === b.isPurchased ? 0 : a.isPurchased ? 1 : -1)
      };
    }).filter(category => category.items.length > 0);
  }, [shoppingList.items, searchQuery, showPurchased]);

  // Estadísticas
  const stats = useMemo(() => {
    const totalItems = shoppingList.items.length;
    const purchasedItems = shoppingList.items.filter(item => item.isPurchased).length;
    const requiredItems = shoppingList.items.filter(item => item.isRequired).length;
    const estimatedTotal = shoppingList.items.reduce((sum, item) => sum + (item.estimatedPrice || 0), 0);
    const spentSoFar = shoppingList.items
      .filter(item => item.isPurchased)
      .reduce((sum, item) => sum + (item.estimatedPrice || 0), 0);

    return {
      totalItems,
      purchasedItems,
      requiredItems,
      estimatedTotal,
      spentSoFar,
      progress: totalItems > 0 ? Math.round((purchasedItems / totalItems) * 100) : 0
    };
  }, [shoppingList.items]);

  // Handlers
  const handleAddItem = () => {
    if (!newItemInput.trim()) return;

    const parsed = parsearEntrada(newItemInput);
    const category = categorizarProducto(parsed.nombre);
    
    const newItem: ShoppingItem = {
      id: Date.now().toString(),
      name: parsed.nombre,
      quantity: parsed.cantidad,
      unit: parsed.unidad,
      category,
      isPurchased: false,
      isRequired: false,
      addedDate: new Date(),
      addedBy: 'Usuario',
      emoji: getEmojiForProduct(parsed.nombre)
    };

    setShoppingList(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
    
    setNewItemInput('');
  };

  const handleTogglePurchased = (item: ShoppingItem) => {
    setShoppingList(prev => ({
      ...prev,
      items: prev.items.map(i => 
        i.id === item.id ? { ...i, isPurchased: !i.isPurchased } : i
      )
    }));
  };

  const handleEditItem = (item: ShoppingItem) => {

  };

  const handleDeleteItem = (item: ShoppingItem) => {
    setShoppingList(prev => ({
      ...prev,
      items: prev.items.filter(i => i.id !== item.id)
    }));
  };

  const handleToggleCategory = (categoryId: string) => {
    setCollapsedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  // Función para obtener emoji del producto
  const getEmojiForProduct = (nombre: string): string => {
    const nombreLower = nombre.toLowerCase();
    
    if (nombreLower.includes('tomate')) return '🍅';
    if (nombreLower.includes('pollo')) return '🐔';
    if (nombreLower.includes('leche')) return '🥛';
    if (nombreLower.includes('pan')) return '🍞';
    if (nombreLower.includes('manzana')) return '🍎';
    if (nombreLower.includes('banana')) return '🍌';
    if (nombreLower.includes('carne')) return '🥩';
    if (nombreLower.includes('queso')) return '🧀';
    if (nombreLower.includes('huevo')) return '🥚';
    if (nombreLower.includes('arroz')) return '🍚';
    
    return '📦';
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-6">
      {/* Header */}
      <Card className="shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <ShoppingCart className="w-8 h-8 text-emerald-600" />
              <div>
                <CardTitle className="text-3xl">{shoppingList.name}</CardTitle>
                <p className="text-gray-600 mt-1">
                  {stats.purchasedItems} de {stats.totalItems} items completados • {stats.progress}%
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Compartir
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 space-y-2">
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all duration-500"
                style={{ width: `${stats.progress}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>{stats.requiredItems} items esenciales</span>
              {showPrices && (
                <span className="font-medium">
                  ${stats.spentSoFar.toFixed(2)} / ${stats.estimatedTotal.toFixed(2)}
                </span>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Add Item & Controls */}
      <Card className="shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Add Item Input */}
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Ej: 500g tomates, media docena huevos, 2L leche..."
                  value={newItemInput}
                  onChange={(e) => setNewItemInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
                  className="w-full pl-4 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-800 dark:border-gray-700"
                  aria-label="Agregar nuevo producto"
                />
              </div>
              <Button onClick={handleAddItem} className="px-6">
                <Plus className="w-4 h-4 mr-2" />
                Agregar
              </Button>
            </div>

            {/* Search */}
            <div className="relative md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-800 dark:border-gray-700"
                aria-label="Buscar productos"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <Button
              variant={showPurchased ? "default" : "outline"}
              size="sm"
              onClick={() => setShowPurchased(!showPurchased)}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Mostrar Comprados
            </Button>
            
            <Button
              variant={showPrices ? "default" : "outline"}
              size="sm"
              onClick={() => setShowPrices(!showPrices)}
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Ver Precios
            </Button>

            <Button variant="outline" size="sm">
              <MapPin className="w-4 h-4 mr-2" />
              Optimizar Ruta
            </Button>

            <Button variant="outline" size="sm">
              <BarChart3 className="w-4 h-4 mr-2" />
              Comparar Precios
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Shopping Categories */}
      <div className="space-y-4">
        {categorizedItems.length === 0 ? (
          <Card className="shadow-lg">
            <CardContent className="text-center py-12">
              <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No hay productos en tu lista</p>
              <p className="text-gray-400 text-sm">Agrega algunos productos para comenzar</p>
            </CardContent>
          </Card>
        ) : (
          categorizedItems.map(category => (
            <ShoppingCategorySection
              key={category.id}
              category={category}
              onTogglePurchased={handleTogglePurchased}
              onEditItem={handleEditItem}
              onDeleteItem={handleDeleteItem}
              showPrices={showPrices}
              isCollapsed={collapsedCategories.has(category.id)}
              onToggleCollapse={() => handleToggleCategory(category.id)}
            />
          ))
        )}
      </div>

      {/* Quick Actions */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col">
              <Shuffle className="w-6 h-6 mb-2" />
              Optimizar Lista
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <Users className="w-6 h-6 mb-2" />
              Compartir Lista
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <Clock className="w-6 h-6 mb-2" />
              Listas Anteriores
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <Package className="w-6 h-6 mb-2" />
              Desde Despensa
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 