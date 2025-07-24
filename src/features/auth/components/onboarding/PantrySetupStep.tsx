'use client';

import { useState } from 'react';
import { Package, Plus, X, Search } from 'lucide-react';

import { useOnboardingStore } from '../../store/onboardingStore';
import { PantryItem, PantryCategory } from '../../types';

interface PantrySetupStepProps {
  onNext: () => void;
  onBack: () => void;
}

const PANTRY_CATEGORIES = [
  { value: PantryCategory.PROTEINS, label: 'Proteins', icon: '🥩' },
  { value: PantryCategory.GRAINS, label: 'Grains', icon: '🌾' },
  { value: PantryCategory.DAIRY, label: 'Dairy', icon: '🥛' },
  { value: PantryCategory.VEGETABLES, label: 'Vegetables', icon: '🥕' },
  { value: PantryCategory.FRUITS, label: 'Fruits', icon: '🍎' },
  { value: PantryCategory.CONDIMENTS, label: 'Condiments', icon: '🍯' },
  { value: PantryCategory.SPICES, label: 'Spices', icon: '🌿' },
  { value: PantryCategory.OILS, label: 'Oils', icon: '🫒' },
  { value: PantryCategory.CANNED_GOODS, label: 'Canned Goods', icon: '🥫' },
  { value: PantryCategory.FROZEN, label: 'Frozen', icon: '🧊' },
  { value: PantryCategory.BAKING, label: 'Baking', icon: '🧁' },
  { value: PantryCategory.SNACKS, label: 'Snacks', icon: '🥨' },
  { value: PantryCategory.BEVERAGES, label: 'Beverages', icon: '☕' },
];

const COMMON_ITEMS = {
  [PantryCategory.PROTEINS]: ['Chicken breast', 'Ground beef', 'Salmon', 'Eggs', 'Tofu', 'Black beans'],
  [PantryCategory.GRAINS]: ['White rice', 'Brown rice', 'Pasta', 'Bread', 'Quinoa', 'Oats'],
  [PantryCategory.DAIRY]: ['Milk', 'Cheese', 'Greek yogurt', 'Butter', 'Cream cheese'],
  [PantryCategory.VEGETABLES]: ['Onions', 'Garlic', 'Carrots', 'Bell peppers', 'Spinach', 'Tomatoes'],
  [PantryCategory.FRUITS]: ['Bananas', 'Apples', 'Lemons', 'Avocados', 'Berries'],
  [PantryCategory.CONDIMENTS]: ['Olive oil', 'Soy sauce', 'Hot sauce', 'Ketchup', 'Mustard'],
  [PantryCategory.SPICES]: ['Salt', 'Black pepper', 'Garlic powder', 'Paprika', 'Cumin'],
  [PantryCategory.OILS]: ['Olive oil', 'Vegetable oil', 'Coconut oil', 'Sesame oil'],
  [PantryCategory.CANNED_GOODS]: ['Diced tomatoes', 'Chicken broth', 'Coconut milk', 'Tuna'],
  [PantryCategory.FROZEN]: ['Frozen vegetables', 'Frozen berries', 'Ice cream'],
  [PantryCategory.BAKING]: ['Flour', 'Sugar', 'Baking powder', 'Vanilla extract'],
  [PantryCategory.SNACKS]: ['Nuts', 'Crackers', 'Granola bars'],
  [PantryCategory.BEVERAGES]: ['Coffee', 'Tea', 'Sparkling water'],
};

export function PantrySetupStep({ onNext, onBack }: PantrySetupStepProps) {
  const { data, savePantryItems } = useOnboardingStore();
  
  const [pantryItems, setPantryItems] = useState<PantryItem[]>(data.pantryItems || []);
  const [selectedCategory, setSelectedCategory] = useState<PantryCategory>(PantryCategory.PROTEINS);
  const [newItemName, setNewItemName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const filteredCommonItems = COMMON_ITEMS[selectedCategory]?.filter(item =>
    item.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !pantryItems.some(pantryItem => pantryItem.name.toLowerCase() === item.toLowerCase())
  ) || [];

  const addItem = (name: string, category: PantryCategory = selectedCategory) => {
    if (!name.trim() || pantryItems.some(item => item.name.toLowerCase() === name.toLowerCase())) {
      return;
    }

    const newItem: PantryItem = {
      name: name.trim(),
      category,
    };

    setPantryItems([...pantryItems, newItem]);
    setNewItemName('');
  };

  const removeItem = (index: number) => {
    setPantryItems(pantryItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);
    try {
      await savePantryItems(pantryItems);
      onNext();
    } catch (error: unknown) {
      console.error('Failed to save pantry items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const itemsByCategory = pantryItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<PantryCategory, PantryItem[]>);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Set Up Your Pantry
        </h2>
        <p className="text-gray-600">
          Add items you already have to get more accurate meal suggestions
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Add Items Panel */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Package className="h-5 w-5" />
              Add Pantry Items
            </h3>

            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as PantryCategory)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {PANTRY_CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.icon} {category.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Search and Add Custom Item */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search or Add Item
              </label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem(newItemName))}
                    placeholder="Type item name..."
                    className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
                <button
                  type="button"
                  onClick={() => addItem(newItemName)}
                  disabled={!newItemName.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Common Items for Category */}
            {filteredCommonItems.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Common {PANTRY_CATEGORIES.find(c => c.value === selectedCategory)?.label} Items
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {filteredCommonItems.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => addItem(item)}
                      className="text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
                    >
                      + {item}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Current Pantry Panel */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Your Pantry ({pantryItems.length} items)
              </h3>
              {pantryItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setPantryItems([])}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Clear all
                </button>
              )}
            </div>

            {pantryItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No items added yet</p>
                <p className="text-sm">Add items to get better meal suggestions</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {PANTRY_CATEGORIES.map((category) => {
                  const items = itemsByCategory[category.value] || [];
                  if (items.length === 0) return null;

                  return (
                    <div key={category.value} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                        <span>{category.icon}</span>
                        {category.label} ({items.length})
                      </h4>
                      <div className="space-y-2">
                        {items.map((item, index) => (
                          <div key={`${item.name}-${index}`} className="flex items-center justify-between py-1">
                            <span className="text-gray-700">{item.name}</span>
                            <button
                              type="button"
                              onClick={() => removeItem(pantryItems.indexOf(item))}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <span className="font-medium">💡 Tip:</span> Don't worry about being complete! 
            You can always add more items later. This initial setup helps our AI understand 
            what you typically have available.
          </p>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            Back
          </button>
          
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : 'Continue'}
          </button>
        </div>
      </form>
    </div>
  );
}