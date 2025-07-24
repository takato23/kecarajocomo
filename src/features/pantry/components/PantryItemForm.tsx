'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, DollarSign, FileText } from 'lucide-react';

import { Button } from '@/components/design-system/Button';
import { Input } from '@/components/design-system/Input';
import { Card } from '@/components/design-system/Card';
import { Heading, Text } from '@/components/design-system/Typography';

import { usePantryStore } from '../store/pantryStore';
import type { AddPantryItemForm, UpdatePantryItemForm, PantryItem } from '../types';

interface PantryItemFormProps {
  item?: PantryItem;
  onClose: () => void;
  onSuccess?: () => void;
}

const COMMON_CATEGORIES = [
  'Produce',
  'Dairy',
  'Meat & Seafood',
  'Pantry Staples',
  'Frozen',
  'Beverages',
  'Snacks',
  'Condiments',
  'Spices & Herbs',
  'Baking',
  'Other',
];

const COMMON_UNITS = [
  'pieces',
  'lbs',
  'oz',
  'kg',
  'g',
  'cups',
  'tsp',
  'tbsp',
  'ml',
  'l',
  'fl oz',
  'pt',
  'qt',
  'gal',
];

const COMMON_LOCATIONS = [
  'Refrigerator',
  'Freezer',
  'Pantry',
  'Counter',
  'Spice Rack',
  'Wine Cellar',
  'Garage',
];

export function PantryItemForm({ item, onClose, onSuccess }: PantryItemFormProps) {
  const { addItem, updateItem, locations, isLoading, error } = usePantryStore();
  
  const [formData, setFormData] = useState<AddPantryItemForm>({
    ingredient_name: item?.ingredient_name || '',
    quantity: item?.quantity || 1,
    unit: item?.unit || '',
    expiration_date: item?.expiration_date 
      ? new Date(item.expiration_date).toISOString().split('T')[0]
      : '',
    location: item?.location || '',
    category: item?.category || '',
    cost: item?.cost || undefined,
    notes: item?.notes || '',
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Show advanced section if any advanced fields have values
    if (item?.cost || item?.notes || item?.location) {
      setShowAdvanced(true);
    }
  }, [item]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.ingredient_name.trim()) {
      errors.ingredient_name = 'Ingredient name is required';
    }
    
    if (!formData.quantity || formData.quantity <= 0) {
      errors.quantity = 'Quantity must be greater than 0';
    }
    
    if (!formData.unit.trim()) {
      errors.unit = 'Unit is required';
    }

    if (formData.cost !== undefined && formData.cost < 0) {
      errors.cost = 'Cost cannot be negative';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      if (item) {
        // Update existing item
        const updateData: UpdatePantryItemForm = {
          id: item.id,
          ...formData,
          expiration_date: formData.expiration_date || undefined,
          cost: formData.cost || undefined,
        };
        await updateItem(updateData);
      } else {
        // Add new item
        const newItemData: AddPantryItemForm = {
          ...formData,
          expiration_date: formData.expiration_date || undefined,
          cost: formData.cost || undefined,
        };
        await addItem(newItemData);
      }
      
      onSuccess?.();
      onClose();
    } catch (error: unknown) {
      console.error('Error saving pantry item:', error);
    }
  };

  const handleInputChange = (field: keyof AddPantryItemForm, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const suggestExpirationDate = () => {
    // Simple logic for suggesting expiration dates based on category
    const categoryDays: Record<string, number> = {
      'Produce': 7,
      'Dairy': 14,
      'Meat & Seafood': 3,
      'Frozen': 90,
      'Pantry Staples': 365,
      'Beverages': 30,
    };
    const days = formData.category ? categoryDays[formData.category] || 30 : 30;

    const suggestedDate = new Date();
    suggestedDate.setDate(suggestedDate.getDate() + days);
    
    handleInputChange('expiration_date', suggestedDate.toISOString().split('T')[0]);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Heading as="h3" size="lg" className="text-xl font-semibold text-gray-900">
              {item ? 'Edit Item' : 'Add New Item'}
            </Heading>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-1"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <Text size="sm" className="text-red-700">
                {error}
              </Text>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Ingredient Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ingredient Name *
              </label>
              <Input
                type="text"
                value={formData.ingredient_name}
                onChange={(e) => handleInputChange('ingredient_name', e.target.value)}
                placeholder="e.g., Organic Bananas"
                error={formErrors.ingredient_name}
                className="w-full"
              />
            </div>

            {/* Quantity and Unit */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity *
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', parseFloat(e.target.value))}
                  error={formErrors.quantity}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit *
                </label>
                <select
                  value={formData.unit}
                  onChange={(e) => handleInputChange('unit', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formErrors.unit ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select unit</option>
                  {COMMON_UNITS.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
                {formErrors.unit && (
                  <Text size="sm" className="text-red-600 mt-1">
                    {formErrors.unit}
                  </Text>
                )}
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select category</option>
                {COMMON_CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Expiration Date */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Expiration Date
                </label>
                {formData.category && !formData.expiration_date && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={suggestExpirationDate}
                    className="text-xs p-1"
                  >
                    <Calendar className="h-3 w-3 mr-1" />
                    Suggest
                  </Button>
                )}
              </div>
              <Input
                type="date"
                value={formData.expiration_date}
                onChange={(e) => handleInputChange('expiration_date', e.target.value)}
                className="w-full"
              />
            </div>

            {/* Advanced Options Toggle */}
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full justify-center"
            >
              {showAdvanced ? 'Hide' : 'Show'} Advanced Options
            </Button>

            {/* Advanced Options */}
            {showAdvanced && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-md">
                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <MapPin className="h-4 w-4 inline mr-1" />
                    Location
                  </label>
                  <select
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select location</option>
                    {COMMON_LOCATIONS.map(location => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                    {locations.map(location => (
                      <option key={location.id} value={location.name}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cost */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <DollarSign className="h-4 w-4 inline mr-1" />
                    Cost
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.cost || ''}
                    onChange={(e) => handleInputChange('cost', e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="0.00"
                    error={formErrors.cost}
                    className="w-full"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FileText className="h-4 w-4 inline mr-1" />
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Additional notes about this item..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                className="flex-1"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="flex-1"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </div>
                ) : (
                  <>
                    {item ? 'Update' : 'Add'} Item
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}