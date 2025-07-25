'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Plus, 
  Calendar, 
  Camera,
  Loader2,
  Package,
  Mic
} from 'lucide-react';

import { parseIngredient, categorizeIngredient } from '@/lib/pantry/parser';
import { 
  PantryFormData, 
  ParsedIngredientInput,
  INGREDIENT_CATEGORIES,
  COMMON_UNITS,
  UnitType
} from '@/types/pantry';
import { VoiceInput } from '@/components/voice/VoiceInput';

import { ParsedIngredient } from '@/services/voice/smartParser';

interface PantryAddFormProps {
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export function PantryAddForm({ onClose, onSubmit }: PantryAddFormProps) {
  // Form data
  const [formData, setFormData] = useState<PantryFormData>({
    ingredient_name: '',
    quantity: 1,
    unit: 'pcs',
    expiration_date: undefined,
    location: 'despensa',
    notes: '',
    photo: undefined
  });

  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(1);

  // Parsing state
  const [parsedIngredient, setParsedIngredient] = useState<ParsedIngredientInput | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Auto-complete state
  const [autoCategory, setAutoCategory] = useState<string>('');

  // Voice input state
  const [showVoiceInput, setShowVoiceInput] = useState(false);
  const [voiceIngredients, setVoiceIngredients] = useState<ParsedIngredient[]>([]);

  // Photo state
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  // Parse ingredient name in real-time
  useEffect(() => {
    if (formData.ingredient_name.length >= 2) {
      const parsed = parseIngredient(formData.ingredient_name);
      setParsedIngredient(parsed);
      setSuggestions(parsed.suggestions);
      setShowSuggestions(parsed.suggestions.length > 0);

      // Auto-fill quantity and unit if detected
      if (parsed.quantity && !formData.quantity) {
        setFormData(prev => ({ 
          ...prev, 
          quantity: parsed.quantity!,
          unit: parsed.unit || 'pcs'
        }));
      }

      // Auto-categorize
      const category = categorizeIngredient(parsed.normalized_name);
      setAutoCategory(category);
    } else {
      setParsedIngredient(null);
      setSuggestions([]);
      setShowSuggestions(false);
      setAutoCategory('');
    }
  }, [formData.ingredient_name]);

  // Handle form field changes
  const handleChange = (field: keyof PantryFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear errors for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: string) => {
    setFormData(prev => ({ ...prev, ingredient_name: suggestion }));
    setShowSuggestions(false);
  };

  // Handle voice input results
  const handleVoiceResult = (ingredients: ParsedIngredient[]) => {
    if (ingredients.length > 0) {
      const firstIngredient = ingredients[0];
      setFormData(prev => ({
        ...prev,
        ingredient_name: firstIngredient.name,
        quantity: firstIngredient.quantity || prev.quantity,
        unit: firstIngredient.unit || prev.unit
      }));
      setVoiceIngredients(ingredients);
      setShowVoiceInput(false);
    }
  };

  // Handle photo selection
  const handlePhotoSelect = (file: File) => {
    setPhotoError(null);
    
    // Validate file
    const validationError = validateImageFile(file);
    if (validationError) {
      setPhotoError(validationError);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    setPhotoFile(file);
    setFormData(prev => ({ ...prev, photo: file }));
  };

  // Handle photo removal
  const handlePhotoRemove = () => {
    setPhotoPreview(null);
    setPhotoFile(null);
    setPhotoError(null);
    setFormData(prev => ({ ...prev, photo: undefined }));
  };

  // Handle file input change
  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handlePhotoSelect(file);
    }
  };

  // Validate image file helper
  const validateImageFile = (file: File): string | null => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return 'Tipo de archivo no válido. Solo se permiten imágenes JPG, PNG y WebP.';
    }
    
    const maxSizeInMB = 10;
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      return `El archivo es demasiado grande. Máximo ${maxSizeInMB}MB.`;
    }
    
    return null;
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.ingredient_name.trim()) {
      newErrors.ingredient_name = 'El nombre del ingrediente es requerido';
    }

    if (formData.quantity <= 0) {
      newErrors.quantity = 'La cantidad debe ser mayor a 0';
    }

    if (!formData.unit) {
      newErrors.unit = 'La unidad es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const submitData = {
        ingredient_name: parsedIngredient?.normalized_name || formData.ingredient_name,
        quantity: formData.quantity,
        unit: formData.unit,
        expiration_date: formData.expiration_date,
        location: formData.location,
        notes: formData.notes,
        photo: photoFile
      };

      await onSubmit(submitData);
      onClose();
    } catch (error: unknown) {
      console.error('Error submitting form:', error);
      setErrors({ submit: 'Error al agregar el ingrediente. Intenta nuevamente.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get current unit type
  const getCurrentUnitType = (): UnitType => {
    for (const [type, units] of Object.entries(COMMON_UNITS)) {
      if (units.some(unit => unit.value === formData.unit)) {
        return type as UnitType;
      }
    }
    return 'count';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Agregar ingrediente
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Completa la información del ingrediente
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowVoiceInput(true)}
              className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
              title="Entrada por voz"
            >
              <Mic size={20} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Step 1: Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Package className="w-5 h-5 mr-2" />
              Información básica
            </h3>

            {/* Ingredient Name */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del ingrediente *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.ingredient_name}
                  onChange={(e) => handleChange('ingredient_name', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.ingredient_name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Ej: pollo, tomates, leche..."
                />
                
                {/* Parsing feedback */}
                {parsedIngredient && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      parsedIngredient.confidence > 0.8 ? 'bg-green-500' : 
                      parsedIngredient.confidence > 0.5 ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    <span className="text-xs text-gray-500">
                      {Math.round(parsedIngredient.confidence * 100)}%
                    </span>
                  </div>
                )}
              </div>
              
              {errors.ingredient_name && (
                <p className="text-red-600 text-sm mt-1">{errors.ingredient_name}</p>
              )}

              {/* Auto-categorization feedback */}
              {autoCategory && autoCategory !== 'otros' && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2 text-sm text-blue-700">
                    <span>{INGREDIENT_CATEGORIES[autoCategory as keyof typeof INGREDIENT_CATEGORIES]?.icon}</span>
                    <span>Categoría detectada: {INGREDIENT_CATEGORIES[autoCategory as keyof typeof INGREDIENT_CATEGORIES]?.label}</span>
                  </div>
                </div>
              )}

              {/* Suggestions dropdown */}
              <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-40 overflow-y-auto"
                  >
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleSuggestionSelect(suggestion)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl transition-colors"
                      >
                        <span className="text-sm text-gray-900">{suggestion}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Quantity and Unit */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cantidad *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.quantity}
                  onChange={(e) => handleChange('quantity', parseFloat(e.target.value) || 0)}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.quantity ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.quantity && (
                  <p className="text-red-600 text-sm mt-1">{errors.quantity}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unidad *
                </label>
                <select
                  value={formData.unit}
                  onChange={(e) => handleChange('unit', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {Object.entries(COMMON_UNITS).map(([type, units]) => (
                    <optgroup key={type} label={type === 'weight' ? 'Peso' : type === 'volume' ? 'Volumen' : 'Cantidad'}>
                      {units.map(unit => (
                        <option key={unit.value} value={unit.value}>
                          {unit.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Step 2: Additional Details */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Detalles adicionales
            </h3>

            {/* Expiration Date and Location */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de vencimiento
                </label>
                <input
                  type="date"
                  value={formData.expiration_date ? formData.expiration_date.toISOString().split('T')[0] : ''}
                  onChange={(e) => handleChange('expiration_date', e.target.value ? new Date(e.target.value) : undefined)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ubicación
                </label>
                <select
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="despensa">🏠 Despensa</option>
                  <option value="refrigerador">❄️ Refrigerador</option>
                  <option value="congelador">🧊 Congelador</option>
                  <option value="otro">📦 Otro</option>
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Información adicional sobre el ingrediente..."
              />
            </div>

            {/* Photo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Foto (opcional)
              </label>
              
              {photoPreview ? (
                <div className="relative">
                  <img
                    src={photoPreview}
                    alt="Vista previa"
                    className="w-full h-48 object-cover rounded-xl border border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={handlePhotoRemove}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-gray-400 transition-colors">
                  <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">Agregar foto del ingrediente</p>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleFileInputChange}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label
                    htmlFor="photo-upload"
                    className="inline-block px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                  >
                    Seleccionar foto
                  </label>
                </div>
              )}
              
              {photoError && (
                <p className="text-red-600 text-sm mt-2">{photoError}</p>
              )}
            </div>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm">{errors.submit}</p>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {parsedIngredient && (
              <span>Confianza de análisis: {Math.round(parsedIngredient.confidence * 100)}%</span>
            )}
          </div>
          
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-600 hover:bg-gray-200 rounded-full font-medium transition-colors"
            >
              Cancelar
            </button>
            
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-500 text-white rounded-full font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="inline mr-2 animate-spin" />
                  Agregando...
                </>
              ) : (
                <>
                  <Plus size={16} className="inline mr-2" />
                  Agregar ingrediente
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Voice Input Modal */}
      {showVoiceInput && (
        <VoiceInput
          onResult={handleVoiceResult}
          onClose={() => setShowVoiceInput(false)}
          placeholder="Di algo como: 'Tengo 2 kilos de pollo'"
        />
      )}
    </motion.div>
  );
}