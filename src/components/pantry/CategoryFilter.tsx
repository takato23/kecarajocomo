'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, X } from 'lucide-react';

import { IngredientCategory, INGREDIENT_CATEGORIES } from '@/types/pantry';

interface CategoryFilterProps {
  selectedCategory?: IngredientCategory;
  onCategoryChange: (category?: IngredientCategory) => void;
}

export function CategoryFilter({ selectedCategory, onCategoryChange }: CategoryFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleCategorySelect = (category: IngredientCategory) => {
    onCategoryChange(category === selectedCategory ? undefined : category);
    setIsOpen(false);
  };

  const clearFilter = () => {
    onCategoryChange(undefined);
  };

  return (
    <div className="relative">
      {/* Filter Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-4 py-3 rounded-xl border transition-all ${
          selectedCategory
            ? 'bg-blue-50 border-blue-200 text-blue-700'
            : 'bg-white/50 border-gray-200 text-gray-700 hover:bg-white/70'
        }`}
      >
        {selectedCategory ? (
          <>
            <span>{INGREDIENT_CATEGORIES[selectedCategory].icon}</span>
            <span className="font-medium">{INGREDIENT_CATEGORIES[selectedCategory].label}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearFilter();
              }}
              className="p-0.5 hover:bg-blue-200 rounded-full transition-colors"
            >
              <X size={14} />
            </button>
          </>
        ) : (
          <>
            <span>🏷️</span>
            <span>Categorías</span>
            <ChevronDown 
              size={16} 
              className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`} 
            />
          </>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown Content */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 mt-2 w-80 bg-white/95 backdrop-blur-md border border-gray-200 rounded-2xl shadow-lg z-20 overflow-hidden"
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50/50">
                <h3 className="font-medium text-gray-900">Filtrar por categoría</h3>
                <p className="text-xs text-gray-600 mt-1">
                  Selecciona una categoría para filtrar los ingredientes
                </p>
              </div>

              {/* Categories Grid */}
              <div className="p-4">
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(INGREDIENT_CATEGORIES).map(([key, category]) => {
                    const isSelected = selectedCategory === key;
                    
                    return (
                      <motion.button
                        key={key}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleCategorySelect(key as IngredientCategory)}
                        className={`flex items-center space-x-3 p-3 rounded-xl text-left transition-all ${
                          isSelected
                            ? 'bg-blue-100 border-2 border-blue-300 text-blue-800'
                            : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent text-gray-700'
                        }`}
                      >
                        <span className="text-xl">{category.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {category.label}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                            {category.description}
                          </div>
                        </div>
                        
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-2 h-2 bg-blue-500 rounded-full"
                          />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="px-4 py-3 border-t border-gray-200 bg-gray-50/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">
                    {Object.keys(INGREDIENT_CATEGORIES).length} categorías disponibles
                  </span>
                  
                  {selectedCategory && (
                    <button
                      onClick={clearFilter}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Limpiar filtro
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}