'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Plus, 
  Calendar, 
  MapPin, 
  Camera, 
  StickyNote,
  Search,
  Check,
  Loader2,
  Package,
  Mic
} from 'lucide-react';
import { parseIngredient, categorizeIngredient } from '@/lib/pantry/parser';
import { 
  PantryFormData, 
  ParsedIngredientInput, 
  IngredientSuggestion,
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
    notes: ''
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
        user_id: 'current-user', // This would come from auth context
        ingredient: {
          name: parsedIngredient?.normalized_name || formData.ingredient_name,
          normalized_name: parsedIngredient?.normalized_name || formData.ingredient_name.toLowerCase(),
          category: autoCategory,
          common_names: suggestions
        },
        quantity: formData.quantity,
        unit: formData.unit,
        expiration_date: formData.expiration_date,
        location: formData.location,
        notes: formData.notes
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
      className=\"fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4\"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className=\"bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden\"
      >
        {/* Header */}
        <div className=\"flex items-center justify-between p-6 border-b border-gray-200\">
          <div>
            <h2 className=\"text-2xl font-bold text-gray-900\">
              Agregar ingrediente
            </h2>
            <p className=\"text-sm text-gray-600 mt-1\">
              Completa la información del ingrediente
            </p>
          </div>
          <button
            onClick={onClose}
            className=\"p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors\"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className=\"p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]\">\n          {/* Step 1: Basic Information */}\n          <div className=\"space-y-4\">\n            <h3 className=\"text-lg font-semibold text-gray-900 flex items-center\">\n              <Package className=\"w-5 h-5 mr-2\" />\n              Información básica\n            </h3>\n\n            {/* Ingredient Name */}\n            <div className=\"relative\">\n              <label className=\"block text-sm font-medium text-gray-700 mb-2\">\n                Nombre del ingrediente *\n              </label>\n              <div className=\"relative\">\n                <input\n                  type=\"text\"\n                  value={formData.ingredient_name}\n                  onChange={(e) => handleChange('ingredient_name', e.target.value)}\n                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${\n                    errors.ingredient_name ? 'border-red-300' : 'border-gray-300'\n                  }`}\n                  placeholder=\"Ej: pollo, tomates, leche...\"\n                />\n                \n                {/* Parsing feedback */}\n                {parsedIngredient && (\n                  <div className=\"absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2\">\n                    <div className={`w-2 h-2 rounded-full ${\n                      parsedIngredient.confidence > 0.8 ? 'bg-green-500' : \n                      parsedIngredient.confidence > 0.5 ? 'bg-yellow-500' : 'bg-red-500'\n                    }`} />\n                    <span className=\"text-xs text-gray-500\">\n                      {Math.round(parsedIngredient.confidence * 100)}%\n                    </span>\n                  </div>\n                )}\n              </div>\n              \n              {errors.ingredient_name && (\n                <p className=\"text-red-600 text-sm mt-1\">{errors.ingredient_name}</p>\n              )}\n\n              {/* Auto-categorization feedback */}\n              {autoCategory && autoCategory !== 'otros' && (\n                <div className=\"mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg\">\n                  <div className=\"flex items-center space-x-2 text-sm text-blue-700\">\n                    <span>{INGREDIENT_CATEGORIES[autoCategory as keyof typeof INGREDIENT_CATEGORIES]?.icon}</span>\n                    <span>Categoría detectada: {INGREDIENT_CATEGORIES[autoCategory as keyof typeof INGREDIENT_CATEGORIES]?.label}</span>\n                  </div>\n                </div>\n              )}\n\n              {/* Suggestions dropdown */}\n              <AnimatePresence>\n                {showSuggestions && suggestions.length > 0 && (\n                  <motion.div\n                    initial={{ opacity: 0, y: -10 }}\n                    animate={{ opacity: 1, y: 0 }}\n                    exit={{ opacity: 0, y: -10 }}\n                    className=\"absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-40 overflow-y-auto\"\n                  >\n                    {suggestions.map((suggestion, index) => (\n                      <button\n                        key={index}\n                        type=\"button\"\n                        onClick={() => handleSuggestionSelect(suggestion)}\n                        className=\"w-full px-4 py-2 text-left hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl transition-colors\"\n                      >\n                        <span className=\"text-sm text-gray-900\">{suggestion}</span>\n                      </button>\n                    ))}\n                  </motion.div>\n                )}\n              </AnimatePresence>\n            </div>\n\n            {/* Quantity and Unit */}\n            <div className=\"grid grid-cols-2 gap-4\">\n              <div>\n                <label className=\"block text-sm font-medium text-gray-700 mb-2\">\n                  Cantidad *\n                </label>\n                <input\n                  type=\"number\"\n                  min=\"0\"\n                  step=\"0.1\"\n                  value={formData.quantity}\n                  onChange={(e) => handleChange('quantity', parseFloat(e.target.value) || 0)}\n                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${\n                    errors.quantity ? 'border-red-300' : 'border-gray-300'\n                  }`}\n                />\n                {errors.quantity && (\n                  <p className=\"text-red-600 text-sm mt-1\">{errors.quantity}</p>\n                )}\n              </div>\n\n              <div>\n                <label className=\"block text-sm font-medium text-gray-700 mb-2\">\n                  Unidad *\n                </label>\n                <select\n                  value={formData.unit}\n                  onChange={(e) => handleChange('unit', e.target.value)}\n                  className=\"w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent\"\n                >\n                  {Object.entries(COMMON_UNITS).map(([type, units]) => (\n                    <optgroup key={type} label={type === 'weight' ? 'Peso' : type === 'volume' ? 'Volumen' : 'Cantidad'}>\n                      {units.map(unit => (\n                        <option key={unit.value} value={unit.value}>\n                          {unit.label}\n                        </option>\n                      ))}\n                    </optgroup>\n                  ))}\n                </select>\n              </div>\n            </div>\n          </div>\n\n          {/* Step 2: Additional Details */}\n          <div className=\"space-y-4 pt-4 border-t border-gray-200\">\n            <h3 className=\"text-lg font-semibold text-gray-900 flex items-center\">\n              <Calendar className=\"w-5 h-5 mr-2\" />\n              Detalles adicionales\n            </h3>\n\n            {/* Expiration Date and Location */}\n            <div className=\"grid grid-cols-2 gap-4\">\n              <div>\n                <label className=\"block text-sm font-medium text-gray-700 mb-2\">\n                  Fecha de vencimiento\n                </label>\n                <input\n                  type=\"date\"\n                  value={formData.expiration_date ? formData.expiration_date.toISOString().split('T')[0] : ''}\n                  onChange={(e) => handleChange('expiration_date', e.target.value ? new Date(e.target.value) : undefined)}\n                  className=\"w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent\"\n                />\n              </div>\n\n              <div>\n                <label className=\"block text-sm font-medium text-gray-700 mb-2\">\n                  Ubicación\n                </label>\n                <select\n                  value={formData.location}\n                  onChange={(e) => handleChange('location', e.target.value)}\n                  className=\"w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent\"\n                >\n                  <option value=\"despensa\">🏠 Despensa</option>\n                  <option value=\"refrigerador\">❄️ Refrigerador</option>\n                  <option value=\"congelador\">🧊 Congelador</option>\n                  <option value=\"otro\">📦 Otro</option>\n                </select>\n              </div>\n            </div>\n\n            {/* Notes */}\n            <div>\n              <label className=\"block text-sm font-medium text-gray-700 mb-2\">\n                Notas\n              </label>\n              <textarea\n                value={formData.notes}\n                onChange={(e) => handleChange('notes', e.target.value)}\n                rows={3}\n                className=\"w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent\"\n                placeholder=\"Información adicional sobre el ingrediente...\"\n              />\n            </div>\n\n            {/* Photo Upload */}\n            <div>\n              <label className=\"block text-sm font-medium text-gray-700 mb-2\">\n                Foto (opcional)\n              </label>\n              <div className=\"border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-gray-400 transition-colors\">\n                <Camera className=\"w-8 h-8 text-gray-400 mx-auto mb-2\" />\n                <p className=\"text-sm text-gray-600 mb-2\">Agregar foto del ingrediente</p>\n                <button\n                  type=\"button\"\n                  className=\"px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors\"\n                >\n                  Seleccionar foto\n                </button>\n              </div>\n            </div>\n          </div>\n\n          {/* Submit Error */}\n          {errors.submit && (\n            <div className=\"p-4 bg-red-50 border border-red-200 rounded-xl\">\n              <p className=\"text-red-600 text-sm\">{errors.submit}</p>\n            </div>\n          )}\n        </form>\n\n        {/* Footer */}\n        <div className=\"flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50\">\n          <div className=\"text-sm text-gray-600\">\n            {parsedIngredient && (\n              <span>Confianza de análisis: {Math.round(parsedIngredient.confidence * 100)}%</span>\n            )}\n          </div>\n          \n          <div className=\"flex space-x-3\">\n            <button\n              type=\"button\"\n              onClick={onClose}\n              className=\"px-6 py-2 text-gray-600 hover:bg-gray-200 rounded-full font-medium transition-colors\"\n            >\n              Cancelar\n            </button>\n            \n            <button\n              type=\"submit\"\n              onClick={handleSubmit}\n              disabled={isSubmitting}\n              className=\"px-6 py-2 bg-blue-500 text-white rounded-full font-medium hover:bg-blue-600 transition-colors disabled:opacity-50\"\n            >\n              {isSubmitting ? (\n                <>\n                  <Loader2 size={16} className=\"inline mr-2 animate-spin\" />\n                  Agregando...\n                </>\n              ) : (\n                <>\n                  <Plus size={16} className=\"inline mr-2\" />\n                  Agregar ingrediente\n                </>\n              )}\n            </button>\n          </div>\n        </div>\n      </motion.div>\n    </motion.div>\n  );\n}