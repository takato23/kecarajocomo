'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Plus, Calendar, MapPin, DollarSign, FileText, 
  Mic, Keyboard, Check, ChevronRight, Info
} from 'lucide-react';

import { Button } from '@/components/design-system/Button';
import { Input } from '@/components/design-system/Input';
import { Card } from '@/components/design-system/Card';
import { Heading, Text } from '@/components/design-system/Typography';
import { Badge } from '@/components/design-system/Badge';
import { VoiceRecorder } from '@/components/voice/VoiceRecorder';
import type { ParsedIngredientInput } from '@/types/pantry';

import type { AddPantryItemForm, UpdatePantryItemForm, PantryItem } from '../types';
import { usePantryStore } from '../store/pantryStore';

interface PantryItemFormWithVoiceProps {
  item?: PantryItem;
  onClose: () => void;
  onSuccess?: () => void;
}

type InputMode = 'voice' | 'manual' | 'selection';

const COMMON_UNITS = [
  { value: 'kg', label: 'Kilogramos' },
  { value: 'g', label: 'Gramos' },
  { value: 'L', label: 'Litros' },
  { value: 'ml', label: 'Mililitros' },
  { value: 'pcs', label: 'Piezas' },
  { value: 'pack', label: 'Paquetes' },
  { value: 'cup', label: 'Tazas' },
  { value: 'tbsp', label: 'Cucharadas' },
  { value: 'tsp', label: 'Cucharaditas' },
  { value: 'bunch', label: 'Manojos' },
  { value: 'can', label: 'Latas' },
  { value: 'jar', label: 'Frascos' },
  { value: 'bottle', label: 'Botellas' },
  { value: 'box', label: 'Cajas' },
];

const COMMON_LOCATIONS = [
  'Refrigerador',
  'Congelador',
  'Despensa',
  'Alacena',
  'Cocina',
  'Bodega',
];

export function PantryItemFormWithVoice({ item, onClose, onSuccess }: PantryItemFormWithVoiceProps) {
  const { addItem, updateItem, locations, isLoading, error } = usePantryStore();
  const [inputMode, setInputMode] = useState<InputMode>('selection');
  const [parsedItems, setParsedItems] = useState<ParsedIngredientInput[]>([]);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  
  const [formData, setFormData] = useState<AddPantryItemForm>({
    ingredient_name: item?.ingredient_name || '',
    quantity: item?.quantity || 1,
    unit: item?.unit || 'pcs',
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
  const [showBatchAdd, setShowBatchAdd] = useState(false);

  useEffect(() => {
    if (item?.cost || item?.notes || item?.location) {
      setShowAdvanced(true);
    }
  }, [item]);

  const handleVoiceItemsParsed = (items: ParsedIngredientInput[]) => {
    setParsedItems(items);
    if (items.length > 0) {
      // Auto-select first item if only one
      if (items.length === 1) {
        selectParsedItem(0);
      }
      setInputMode('selection');
    }
  };

  const selectParsedItem = (index: number) => {
    const parsedItem = parsedItems[index];
    if (!parsedItem) return;

    setSelectedItemIndex(index);
    setFormData(prev => ({
      ...prev,
      ingredient_name: parsedItem.extracted_name,
      quantity: parsedItem.quantity || 1,
      unit: parsedItem.unit || 'pcs',
      category: determineCategory(parsedItem.extracted_name),
    }));

    // Auto-fill location based on category
    const categoryLocation = suggestLocationByCategory(parsedItem.extracted_name);
    if (categoryLocation) {
      setFormData(prev => ({ ...prev, location: categoryLocation }));
    }
  };

  const determineCategory = (name: string): string => {
    const lowerName = name.toLowerCase();
    
    for (const [category, info] of Object.entries(INGREDIENT_CATEGORIES)) {
      if (info.label && lowerName.includes(category)) {
        return info.label;
      }
    }
    
    // Check keywords
    if (lowerName.includes('leche') || lowerName.includes('queso') || lowerName.includes('yogur')) {
      return 'Lácteos';
    }
    if (lowerName.includes('carne') || lowerName.includes('pollo') || lowerName.includes('pescado')) {
      return 'Carnes';
    }
    if (lowerName.includes('fruta') || lowerName.includes('manzana') || lowerName.includes('naranja')) {
      return 'Frutas';
    }
    if (lowerName.includes('verdura') || lowerName.includes('lechuga') || lowerName.includes('tomate')) {
      return 'Verduras';
    }
    
    return 'Otros';
  };

  const suggestLocationByCategory = (name: string): string => {
    const lowerName = name.toLowerCase();
    
    if (lowerName.includes('helado') || lowerName.includes('congelado')) {
      return 'Congelador';
    }
    if (lowerName.includes('leche') || lowerName.includes('yogur') || lowerName.includes('queso')) {
      return 'Refrigerador';
    }
    if (lowerName.includes('carne') || lowerName.includes('pollo') || lowerName.includes('pescado')) {
      return 'Refrigerador';
    }
    if (lowerName.includes('pan') || lowerName.includes('galletas') || lowerName.includes('cereal')) {
      return 'Despensa';
    }
    
    return 'Despensa';
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.ingredient_name.trim()) {
      errors.ingredient_name = 'El nombre del ingrediente es requerido';
    }
    
    if (!formData.quantity || formData.quantity <= 0) {
      errors.quantity = 'La cantidad debe ser mayor a 0';
    }
    
    if (!formData.unit.trim()) {
      errors.unit = 'La unidad es requerida';
    }

    if (formData.cost !== undefined && formData.cost < 0) {
      errors.cost = 'El costo no puede ser negativo';
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
        const updateData: UpdatePantryItemForm = {
          id: item.id,
          ...formData,
          expiration_date: formData.expiration_date || undefined,
          cost: formData.cost || undefined,
        };
        await updateItem(updateData);
      } else {
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

  const handleBatchAdd = async () => {
    if (parsedItems.length === 0) return;

    setShowBatchAdd(true);
    
    for (const parsedItem of parsedItems) {
      const itemData: AddPantryItemForm = {
        ingredient_name: parsedItem.extracted_name,
        quantity: parsedItem.quantity || 1,
        unit: parsedItem.unit || 'pcs',
        category: determineCategory(parsedItem.extracted_name),
        location: suggestLocationByCategory(parsedItem.extracted_name),
        expiration_date: undefined,
        cost: undefined,
        notes: '',
      };
      
      try {
        await addItem(itemData);
      } catch (error: unknown) {
        console.error('Error adding item:', parsedItem.extracted_name, error);
      }
    }
    
    onSuccess?.();
    onClose();
  };

  const handleInputChange = (field: keyof AddPantryItemForm, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const suggestExpirationDate = () => {
    const categoryDays: Record<string, number> = {
      'Lácteos': 14,
      'Carnes': 3,
      'Verduras': 7,
      'Frutas': 7,
      'Congelados': 90,
      'Enlatados': 365,
      'Granos': 180,
      'Panadería': 5,
    };
    const days = formData.category ? categoryDays[formData.category] || 30 : 30;

    const suggestedDate = new Date();
    suggestedDate.setDate(suggestedDate.getDate() + days);
    
    handleInputChange('expiration_date', suggestedDate.toISOString().split('T')[0]);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Heading as="h3" size="lg" className="text-xl font-semibold text-gray-900">
              {item ? 'Editar Ingrediente' : 'Agregar Ingredientes'}
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

          {/* Input Mode Selector */}
          {!item && (
            <div className="mb-6">
              <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                <button
                  onClick={() => setInputMode('voice')}
                  className={`
                    flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-all
                    ${inputMode === 'voice' 
                      ? 'bg-white shadow-sm text-blue-600 font-medium' 
                      : 'text-gray-600 hover:text-gray-900'
                    }
                  `}
                >
                  <Mic className="h-4 w-4" />
                  Voz
                </button>
                <button
                  onClick={() => setInputMode('manual')}
                  className={`
                    flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-all
                    ${inputMode === 'manual' 
                      ? 'bg-white shadow-sm text-blue-600 font-medium' 
                      : 'text-gray-600 hover:text-gray-900'
                    }
                  `}
                >
                  <Keyboard className="h-4 w-4" />
                  Manual
                </button>
                {parsedItems.length > 0 && (
                  <button
                    onClick={() => setInputMode('selection')}
                    className={`
                      flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-all
                      ${inputMode === 'selection' 
                        ? 'bg-white shadow-sm text-blue-600 font-medium' 
                        : 'text-gray-600 hover:text-gray-900'
                      }
                    `}
                  >
                    <Check className="h-4 w-4" />
                    Selección ({parsedItems.length})
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <Text size="sm" className="text-red-700">
                {error}
              </Text>
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* Voice Input Mode */}
            {inputMode === 'voice' && !item && (
              <motion.div
                key="voice"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <VoiceRecorder
                  onItemsParsed={handleVoiceItemsParsed}
                  showParsedItems={false}
                  className="mb-6"
                />
              </motion.div>
            )}

            {/* Selection Mode - Show parsed items */}
            {inputMode === 'selection' && parsedItems.length > 0 && !item && (
              <motion.div
                key="selection"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-6"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Text className="font-medium text-gray-700">
                      Ingredientes Detectados:
                    </Text>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleBatchAdd}
                      disabled={isLoading}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Agregar Todos ({parsedItems.length})
                    </Button>
                  </div>
                  
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {parsedItems.map((item, index) => (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => selectParsedItem(index)}
                        className={`
                          w-full text-left p-3 rounded-lg border transition-all
                          ${selectedItemIndex === index
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                          }
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <Text className="font-medium text-gray-900">
                              {item.extracted_name}
                            </Text>
                            <Text size="sm" className="text-gray-600">
                              {item.quantity} {item.unit}
                            </Text>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={item.confidence > 0.8 ? 'success' : 'warning'}
                              size="sm"
                            >
                              {Math.round(item.confidence * 100)}%
                            </Badge>
                            {selectedItemIndex === index && (
                              <Check className="h-4 w-4 text-blue-600" />
                            )}
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                  
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <Text size="sm" className="text-blue-800 flex items-start gap-2">
                      <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>
                        Selecciona un ingrediente para editarlo o usa "Agregar Todos" 
                        para agregarlos rápidamente con valores predeterminados.
                      </span>
                    </Text>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Manual Input Mode or Edit Mode */}
            {(inputMode === 'manual' || item || selectedItemIndex !== null) && (
              <motion.form
                key="manual"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                {/* Ingredient Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Ingrediente *
                  </label>
                  <Input
                    type="text"
                    value={formData.ingredient_name}
                    onChange={(e) => handleInputChange('ingredient_name', e.target.value)}
                    placeholder="ej. Pechuga de Pollo"
                    error={formErrors.ingredient_name}
                    className="w-full"
                  />
                </div>

                {/* Quantity and Unit */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cantidad *
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
                      Unidad *
                    </label>
                    <select
                      value={formData.unit}
                      onChange={(e) => handleInputChange('unit', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        formErrors.unit ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Seleccionar unidad</option>
                      {COMMON_UNITS.map(unit => (
                        <option key={unit.value} value={unit.value}>
                          {unit.label}
                        </option>
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
                    Categoría
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar categoría</option>
                    {Object.entries(INGREDIENT_CATEGORIES).map(([key, info]) => (
                      <option key={key} value={info.label}>
                        {info.icon} {info.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Expiration Date */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Fecha de Vencimiento
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
                        Sugerir
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
                  {showAdvanced ? 'Ocultar' : 'Mostrar'} Opciones Avanzadas
                  <ChevronRight className={`h-4 w-4 ml-1 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} />
                </Button>

                {/* Advanced Options */}
                <AnimatePresence>
                  {showAdvanced && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-4 overflow-hidden"
                    >
                      <div className="space-y-4 p-4 bg-gray-50 rounded-md">
                        {/* Location */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            <MapPin className="h-4 w-4 inline mr-1" />
                            Ubicación
                          </label>
                          <select
                            value={formData.location}
                            onChange={(e) => handleInputChange('location', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Seleccionar ubicación</option>
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
                            Costo
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
                            Notas
                          </label>
                          <textarea
                            value={formData.notes}
                            onChange={(e) => handleInputChange('notes', e.target.value)}
                            placeholder="Notas adicionales sobre este ingrediente..."
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={onClose}
                    className="flex-1"
                    disabled={isLoading}
                  >
                    Cancelar
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
                        Guardando...
                      </div>
                    ) : (
                      <>
                        {item ? 'Actualizar' : 'Agregar'} Ingrediente
                      </>
                    )}
                  </Button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </div>
  );
}