'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, 
  Plus, 
  Check, 
  X, 
  Search,
  Filter,
  Share2,
  Trash2,
  Package,
  AlertTriangle
} from 'lucide-react';

import { useShoppingStore } from '@/stores/shopping';
import { usePantryStore } from '@/stores/pantry';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/hooks/use-toast';
import { INGREDIENT_CATEGORIES } from '@/types/pantry';
import { ShoppingVoiceButton } from '@/components/shopping/ShoppingVoiceButton';
import { SupermarketMode } from '@/components/shopping/SupermarketMode';
import { CategoryBadge } from '@/components/shopping/CategoryBadge';

export default function ShoppingListPage() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const { 
    activeList, 
    isLoading, 
    fetchActiveList, 
    createList,
    addItem,
    toggleItemChecked,
    deleteItem,
    updateItem
  } = useShoppingStore();
  
  const { 
    items: pantryItems,
    checkLowStock,
    suggestRestocking 
  } = usePantryStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState(1);
  const [newItemUnit, setNewItemUnit] = useState('pcs');
  const [newItemCategory, setNewItemCategory] = useState('');
  const [supermarketMode, setSupermarketMode] = useState(false);

  useEffect(() => {
    if (user) {
      fetchActiveList(user.id);
    }
  }, [user, fetchActiveList]);

  const handleCreateList = async () => {
    if (!user) return;
    
    const name = `Lista ${new Date().toLocaleDateString('es-AR')}`;
    const list = await createList(user.id, name);
    if (list) {
      toast({
        title: 'Lista creada',
        description: `Se creó la lista "${name}"`,
      });
    }
  };

  const handleAddItem = async () => {
    if (!activeList || !newItemName.trim()) return;

    await addItem(activeList.id, {
      ingredient_id: null,
      custom_name: newItemName,
      quantity: newItemQuantity,
      unit: newItemUnit,
      category: newItemCategory || undefined,
      is_checked: false,
      price: null,
      notes: null
    });

    setNewItemName('');
    setNewItemQuantity(1);
    setNewItemCategory('');
    setShowAddForm(false);
    
    toast({
      title: 'Producto agregado',
      description: `${newItemName} fue agregado a la lista`,
    });
  };

  const handleToggleItem = async (itemId: string) => {
    if (!activeList) return;
    await toggleItemChecked(activeList.id, itemId);
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!activeList) return;
    await deleteItem(activeList.id, itemId);
    
    toast({
      title: 'Producto eliminado',
      description: 'El producto fue removido de la lista',
    });
  };

  const handleAddLowStockItems = async () => {
    if (!activeList || !user) return;
    
    const lowStockItems = suggestRestocking();
    
    for (const item of lowStockItems) {
      await addItem(activeList.id, {
        ingredient_id: item.ingredient_id,
        custom_name: null,
        quantity: (item.min_quantity || 1) - item.quantity,
        unit: item.unit,
        is_checked: false,
        price: null,
        notes: null
      });
    }
    
    toast({
      title: 'Productos agregados',
      description: `Se agregaron ${lowStockItems.length} productos con stock bajo`,
    });
  };

  const handleShareList = async () => {
    if (!activeList) return;
    
    const itemsText = activeList.items
      ?.filter(item => !item.is_checked)
      .map(item => `• ${item.quantity} ${item.unit} de ${item.custom_name || item.ingredient?.name}`)
      .join('\n');
    
    const message = `🛒 Lista de Compras\n\n${itemsText}\n\n---\nCreada con ¿Qué Carajo Comer?`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Lista de Compras',
          text: message,
        });
      } catch (err: unknown) {
        console.error('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(message);
      toast({
        title: 'Lista copiada',
        description: 'La lista fue copiada al portapapeles',
      });
    }
  };

  // Voice handlers
  const handleVoiceAddItem = async (item: { name: string; quantity: number; unit: string }) => {
    if (!activeList) return;
    
    await addItem(activeList.id, {
      ingredient_id: null,
      custom_name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      is_checked: false,
      price: null,
      notes: null
    });
    
    toast({
      title: '🎤 Producto agregado por voz',
      description: `${item.quantity} ${item.unit} de ${item.name}`,
    });
  };

  const handleVoiceCompleteItem = (itemName: string) => {
    if (!activeList?.items) return;
    
    // Find item by name (fuzzy matching)
    const foundItem = activeList.items.find(item => {
      const name = (item.custom_name || item.ingredient?.name || '').toLowerCase();
      return name.includes(itemName.toLowerCase()) || itemName.toLowerCase().includes(name);
    });
    
    if (foundItem) {
      handleToggleItem(foundItem.id);
      toast({
        title: '✅ Producto marcado por voz',
        description: `${foundItem.custom_name || foundItem.ingredient?.name} completado`,
      });
    } else {
      toast({
        title: '❌ Producto no encontrado',
        description: `No se encontró "${itemName}" en la lista`,
      });
    }
  };

  const handleVoiceRemoveItem = (itemName: string) => {
    if (!activeList?.items) return;
    
    const foundItem = activeList.items.find(item => {
      const name = (item.custom_name || item.ingredient?.name || '').toLowerCase();
      return name.includes(itemName.toLowerCase()) || itemName.toLowerCase().includes(name);
    });
    
    if (foundItem) {
      handleDeleteItem(foundItem.id);
      toast({
        title: '🗑️ Producto eliminado por voz',
        description: `${itemName} fue eliminado de la lista`,
      });
    }
  };

  // Filter items
  const filteredItems = activeList?.items?.filter(item => {
    const name = item.custom_name || item.ingredient?.name || '';
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
    const itemCategory = item.category || item.ingredient?.category;
    const matchesCategory = !selectedCategory || itemCategory === selectedCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  const uncheckedCount = filteredItems.filter(item => !item.is_checked).length;
  const checkedCount = filteredItems.filter(item => item.is_checked).length;
  const progress = filteredItems.length > 0 ? (checkedCount / filteredItems.length) * 100 : 0;

  // Render supermarket mode if activated
  if (supermarketMode && activeList) {
    return (
      <SupermarketMode
        items={activeList.items || []}
        onToggleItem={handleToggleItem}
        onAddItem={handleVoiceAddItem}
        onRemoveItem={handleDeleteItem}
        onExit={() => setSupermarketMode(false)}
      />
    );
  }

  if (!activeList && !isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
        <div className="max-w-lg mx-auto mt-20 text-center">
          <ShoppingCart className="w-20 h-20 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No tenés listas activas</h2>
          <p className="text-gray-600 mb-6">Creá tu primera lista de compras</p>
          <button
            onClick={handleCreateList}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium rounded-lg hover:from-blue-600 hover:to-purple-600"
          >
            Crear Lista
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Lista de Compras</h1>
            <p className="text-gray-600 mt-1">
              {uncheckedCount} productos pendientes • {checkedCount} completados
            </p>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <ShoppingVoiceButton
              onAddItem={handleVoiceAddItem}
              onCompleteItem={handleVoiceCompleteItem}
              onRemoveItem={handleVoiceRemoveItem}
            />
            
            <button
              onClick={() => setSupermarketMode(true)}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 flex items-center gap-2 font-medium"
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">Modo Supermercado</span>
            </button>

            <button
              onClick={handleAddLowStockItems}
              className="px-4 py-2 bg-white border border-orange-300 text-orange-700 rounded-lg hover:bg-orange-50 flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              <span className="hidden sm:inline">Stock Bajo</span>
            </button>
            
            <button
              onClick={handleShareList}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Compartir</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Progreso</span>
            <span className="text-sm text-gray-600">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full"
            />
          </div>
        </div>

        {/* Search and Add */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar productos..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Add Button */}
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Agregar
            </button>
          </div>
        </div>

        {/* Category Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Filtrar por categoría</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                !selectedCategory 
                  ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              🏷️ Todas
            </button>
            
            {Object.entries(INGREDIENT_CATEGORIES).map(([key, data]) => {
              const isSelected = selectedCategory === key;
              const colorClass = isSelected 
                ? `bg-${data.color}-100 text-${data.color}-800 border border-${data.color}-200`
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200';
              
              return (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${colorClass}`}
                  title={data.description}
                >
                  {data.icon} {data.label}
                </button>
              );
            })}

            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory('')}
                className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Add Item Form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white rounded-xl shadow-sm p-4 mb-6"
            >
              <h3 className="font-medium text-gray-900 mb-3">Agregar producto</h3>
              <div className="grid grid-cols-12 gap-2">
                {/* Product Name */}
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="Nombre del producto"
                  className="col-span-4 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                  onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
                />
                
                {/* Category */}
                <select
                  value={newItemCategory}
                  onChange={(e) => setNewItemCategory(e.target.value)}
                  className="col-span-3 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">Auto-categoría</option>
                  {Object.entries(INGREDIENT_CATEGORIES).map(([key, data]) => (
                    <option key={key} value={key}>
                      {data.icon} {data.label}
                    </option>
                  ))}
                </select>
                
                {/* Quantity */}
                <input
                  type="number"
                  value={newItemQuantity}
                  onChange={(e) => setNewItemQuantity(Number(e.target.value))}
                  className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
                
                {/* Unit */}
                <select
                  value={newItemUnit}
                  onChange={(e) => setNewItemUnit(e.target.value)}
                  className="col-span-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pcs">un</option>
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                  <option value="L">L</option>
                  <option value="ml">ml</option>
                </select>
                
                {/* Buttons */}
                <button
                  onClick={handleAddItem}
                  className="col-span-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  <Check className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="col-span-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Items List */}
        <div className="space-y-2">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-xl">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No hay productos en la lista</p>
            </div>
          ) : (
            <>
              {/* Unchecked items */}
              {filteredItems
                .filter(item => !item.is_checked)
                .map(item => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="bg-white rounded-lg shadow-sm p-4 flex items-center gap-3"
                  >
                    <button
                      onClick={() => handleToggleItem(item.id)}
                      className="w-6 h-6 border-2 border-gray-300 rounded hover:border-blue-500 transition-colors"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-900">
                          {item.custom_name || item.ingredient?.name}
                        </p>
                        <CategoryBadge 
                          category={item.category || item.ingredient?.category} 
                          size="sm" 
                          showIcon={true}
                          showLabel={false}
                        />
                      </div>
                      <p className="text-sm text-gray-600">
                        {item.quantity} {item.unit}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}

              {/* Checked items */}
              {checkedCount > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Completados</h3>
                  {filteredItems
                    .filter(item => item.is_checked)
                    .map(item => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-gray-50 rounded-lg p-4 flex items-center gap-3 mb-2"
                      >
                        <button
                          onClick={() => handleToggleItem(item.id)}
                          className="w-6 h-6 bg-green-500 rounded flex items-center justify-center"
                        >
                          <Check className="w-4 h-4 text-white" />
                        </button>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-gray-500 line-through">
                              {item.custom_name || item.ingredient?.name}
                            </p>
                            <CategoryBadge 
                              category={item.category || item.ingredient?.category} 
                              size="sm" 
                              showIcon={true}
                              showLabel={false}
                            />
                          </div>
                          <p className="text-sm text-gray-400">
                            {item.quantity} {item.unit}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </motion.div>
                    ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}