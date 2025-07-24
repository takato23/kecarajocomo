'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, 
  Check, 
  X, 
  ArrowLeft, 
  Volume2, 
  VolumeX,
  Search,
  Star
} from 'lucide-react';

import { useToast } from '@/hooks/use-toast';

import { ShoppingVoiceButton } from './ShoppingVoiceButton';
import { CategoryBadge } from './CategoryBadge';

interface SupermarketModeProps {
  items: any[];
  onToggleItem: (itemId: string) => void;
  onAddItem: (item: { name: string; quantity: number; unit: string }) => void;
  onRemoveItem: (itemId: string) => void;
  onExit: () => void;
}

export function SupermarketMode({ 
  items, 
  onToggleItem, 
  onAddItem, 
  onRemoveItem, 
  onExit 
}: SupermarketModeProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { toast } = useToast();

  // Get pending and completed items
  const pendingItems = items.filter(item => !item.is_checked);
  const completedItems = items.filter(item => item.is_checked);
  const totalItems = items.length;
  const completedCount = completedItems.length;
  const progress = totalItems > 0 ? (completedCount / totalItems) * 100 : 0;

  // Filter items based on search and category
  const filteredPendingItems = pendingItems.filter(item => {
    const matchesSearch = !searchQuery || 
      (item.custom_name || item.ingredient?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Play sound when item is checked
  const playCheckSound = () => {
    if (soundEnabled && typeof window !== 'undefined') {
      try {
        const audio = new Audio('/sounds/check.mp3');
        audio.volume = 0.3;
        audio.play().catch(() => {}); // Ignore errors
      } catch (error: unknown) {
        // Ignore audio errors
      }
    }
  };

  // Handle item completion
  const handleCompleteItem = (itemId: string) => {
    onToggleItem(itemId);
    playCheckSound();
    
    const item = items.find(i => i.id === itemId);
    if (item) {
      toast({
        title: '✅ Producto conseguido',
        description: `${item.custom_name || item.ingredient?.name} marcado como comprado`,
      });
    }
  };

  // Handle voice commands
  const handleVoiceAddItem = (item: { name: string; quantity: number; unit: string }) => {
    onAddItem(item);
    toast({
      title: '🎤 Producto agregado',
      description: `${item.quantity} ${item.unit} de ${item.name}`,
    });
  };

  const handleVoiceCompleteItem = (itemName: string) => {
    // Find item by name (fuzzy matching)
    const foundItem = pendingItems.find(item => {
      const name = (item.custom_name || item.ingredient?.name || '').toLowerCase();
      return name.includes(itemName.toLowerCase()) || itemName.toLowerCase().includes(name);
    });
    
    if (foundItem) {
      handleCompleteItem(foundItem.id);
    } else {
      toast({
        title: '❌ Producto no encontrado',
        description: `No se encontró "${itemName}" en la lista`,
      });
    }
  };

  const handleVoiceRemoveItem = (itemName: string) => {
    const foundItem = items.find(item => {
      const name = (item.custom_name || item.ingredient?.name || '').toLowerCase();
      return name.includes(itemName.toLowerCase()) || itemName.toLowerCase().includes(name);
    });
    
    if (foundItem) {
      onRemoveItem(foundItem.id);
      toast({
        title: '🗑️ Producto eliminado',
        description: `${itemName} fue eliminado de la lista`,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-lg border-b border-gray-200">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={onExit}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <ShoppingCart className="w-6 h-6 text-green-600" />
                  Modo Supermercado
                </h1>
                <p className="text-sm text-gray-600">
                  {pendingItems.length} productos por conseguir
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2 rounded-lg transition-colors ${
                  soundEnabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Progreso</span>
              <span className="text-sm text-gray-600">
                {completedCount}/{totalItems} ({Math.round(progress)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full flex items-center justify-end pr-2"
                transition={{ duration: 0.5 }}
              >
                {progress > 15 && (
                  <span className="text-xs text-white font-medium">
                    {Math.round(progress)}%
                  </span>
                )}
              </motion.div>
            </div>
          </div>

          {/* Voice and Search Controls */}
          <div className="flex items-center gap-3">
            <ShoppingVoiceButton
              onAddItem={handleVoiceAddItem}
              onCompleteItem={handleVoiceCompleteItem}
              onRemoveItem={handleVoiceRemoveItem}
            />

            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar producto..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                showCompleted 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {showCompleted ? 'Ocultar' : 'Ver'} completados
            </button>
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="p-4 pb-20">
        {/* Pending Items */}
        <div className="space-y-3">
          {filteredPendingItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleCompleteItem(item.id)}
                  className="w-8 h-8 border-2 border-green-500 rounded-full hover:bg-green-50 transition-colors flex items-center justify-center group"
                >
                  <Check className="w-5 h-5 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {item.custom_name || item.ingredient?.name}
                    </h3>
                    <CategoryBadge 
                      category={item.category || item.ingredient?.category} 
                      size="sm" 
                      showIcon={true}
                      showLabel={false}
                    />
                  </div>
                  <p className="text-gray-600">
                    {item.quantity} {item.unit}
                    {item.price && (
                      <span className="ml-2 text-green-600 font-medium">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    )}
                  </p>
                  {item.notes && (
                    <p className="text-sm text-gray-500 mt-1">{item.notes}</p>
                  )}
                </div>

                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Completed Items */}
        <AnimatePresence>
          {showCompleted && completedItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-8"
            >
              <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600" />
                Productos Conseguidos ({completedItems.length})
              </h2>
              
              <div className="space-y-2">
                {completedItems.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-green-50 rounded-xl p-4 border border-green-200"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-700 line-through">
                            {item.custom_name || item.ingredient?.name}
                          </h3>
                          <CategoryBadge 
                            category={item.category || item.ingredient?.category} 
                            size="sm" 
                            showIcon={true}
                            showLabel={false}
                          />
                        </div>
                        <p className="text-sm text-gray-500">
                          {item.quantity} {item.unit}
                        </p>
                      </div>

                      <button
                        onClick={() => onToggleItem(item.id)}
                        className="p-2 text-gray-500 hover:bg-white rounded-lg transition-colors"
                        title="Marcar como pendiente"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {filteredPendingItems.length === 0 && !showCompleted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              ¡Lista completada!
            </h3>
            <p className="text-gray-600">
              Has conseguido todos los productos de tu lista.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}