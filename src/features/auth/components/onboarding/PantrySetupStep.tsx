'use client';

import { useState, useEffect } from 'react'
import geminiConfig from '@/lib/config/gemini.config';;
import { Package, Plus, X, Search, Sparkles, Wand2, ShoppingCart, ArrowLeft, ArrowRight, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { logger } from '@/services/logger';
import { getAIService } from '@/services/ai/UnifiedAIService';

import { useOnboardingStore } from '../../store/onboardingStore';
import { PantryItem, PantryCategory } from '../../types';
import { GlassCard, GlassButton } from './shared/GlassCard';

interface PantrySetupStepProps {
  onNext: () => void;
  onBack: () => void;
}

const PANTRY_CATEGORIES = [
  { value: PantryCategory.PROTEINS, label: 'Proteínas', icon: '🥩' },
  { value: PantryCategory.GRAINS, label: 'Granos', icon: '🌾' },
  { value: PantryCategory.DAIRY, label: 'Lácteos', icon: '🥛' },
  { value: PantryCategory.VEGETABLES, label: 'Verduras', icon: '🥕' },
  { value: PantryCategory.FRUITS, label: 'Frutas', icon: '🍎' },
  { value: PantryCategory.CONDIMENTS, label: 'Condimentos', icon: '🍯' },
  { value: PantryCategory.SPICES, label: 'Especias', icon: '🌿' },
  { value: PantryCategory.OILS, label: 'Aceites', icon: '🫒' },
  { value: PantryCategory.CANNED_GOODS, label: 'Enlatados', icon: '🥫' },
  { value: PantryCategory.FROZEN, label: 'Congelados', icon: '🧊' },
  { value: PantryCategory.BAKING, label: 'Repostería', icon: '🧁' },
  { value: PantryCategory.SNACKS, label: 'Snacks', icon: '🥨' },
  { value: PantryCategory.BEVERAGES, label: 'Bebidas', icon: '☕' },
];

const COMMON_ITEMS = {
  [PantryCategory.PROTEINS]: ['Pechuga de pollo', 'Carne molida', 'Salmón', 'Huevos', 'Tofu', 'Frijoles negros'],
  [PantryCategory.GRAINS]: ['Arroz blanco', 'Arroz integral', 'Pasta', 'Pan', 'Quinoa', 'Avena'],
  [PantryCategory.DAIRY]: ['Leche', 'Queso', 'Yogurt griego', 'Mantequilla', 'Queso crema'],
  [PantryCategory.VEGETABLES]: ['Cebollas', 'Ajo', 'Zanahorias', 'Pimientos', 'Espinacas', 'Tomates'],
  [PantryCategory.FRUITS]: ['Plátanos', 'Manzanas', 'Limones', 'Aguacates', 'Fresas'],
  [PantryCategory.CONDIMENTS]: ['Aceite de oliva', 'Salsa de soja', 'Salsa picante', 'Ketchup', 'Mostaza'],
  [PantryCategory.SPICES]: ['Sal', 'Pimienta negra', 'Ajo en polvo', 'Paprika', 'Comino'],
  [PantryCategory.OILS]: ['Aceite de oliva', 'Aceite vegetal', 'Aceite de coco', 'Aceite de sésamo'],
  [PantryCategory.CANNED_GOODS]: ['Tomates enlatados', 'Caldo de pollo', 'Leche de coco', 'Atún'],
  [PantryCategory.FROZEN]: ['Verduras congeladas', 'Frutos rojos congelados', 'Helado'],
  [PantryCategory.BAKING]: ['Harina', 'Azúcar', 'Polvo para hornear', 'Extracto de vainilla'],
  [PantryCategory.SNACKS]: ['Nueces', 'Galletas', 'Barras de granola'],
  [PantryCategory.BEVERAGES]: ['Café', 'Té', 'Agua con gas'],
};

// Starter kits based on cooking persona
const STARTER_KITS = {
  beginner: {
    name: 'Kit Básico del Principiante',
    items: [
      { name: 'Pasta', category: PantryCategory.GRAINS },
      { name: 'Salsa de tomate', category: PantryCategory.CONDIMENTS },
      { name: 'Huevos', category: PantryCategory.PROTEINS },
      { name: 'Pan', category: PantryCategory.GRAINS },
      { name: 'Leche', category: PantryCategory.DAIRY },
      { name: 'Queso', category: PantryCategory.DAIRY },
      { name: 'Sal', category: PantryCategory.SPICES },
      { name: 'Aceite de oliva', category: PantryCategory.OILS },
    ]
  },
  home_cook: {
    name: 'Kit del Cocinero Casero',
    items: [
      { name: 'Pechuga de pollo', category: PantryCategory.PROTEINS },
      { name: 'Arroz', category: PantryCategory.GRAINS },
      { name: 'Cebollas', category: PantryCategory.VEGETABLES },
      { name: 'Ajo', category: PantryCategory.VEGETABLES },
      { name: 'Tomates', category: PantryCategory.VEGETABLES },
      { name: 'Especias básicas', category: PantryCategory.SPICES },
      { name: 'Caldo de pollo', category: PantryCategory.CANNED_GOODS },
      { name: 'Aceite de oliva', category: PantryCategory.OILS },
    ]
  },
  foodie: {
    name: 'Kit del Foodie Aventurero',
    items: [
      { name: 'Quinoa', category: PantryCategory.GRAINS },
      { name: 'Salmón', category: PantryCategory.PROTEINS },
      { name: 'Aguacates', category: PantryCategory.FRUITS },
      { name: 'Aceite de sésamo', category: PantryCategory.OILS },
      { name: 'Salsa de soja', category: PantryCategory.CONDIMENTS },
      { name: 'Jengibre fresco', category: PantryCategory.VEGETABLES },
      { name: 'Leche de coco', category: PantryCategory.CANNED_GOODS },
      { name: 'Especias exóticas', category: PantryCategory.SPICES },
    ]
  },
  health_conscious: {
    name: 'Kit Saludable',
    items: [
      { name: 'Espinacas', category: PantryCategory.VEGETABLES },
      { name: 'Quinoa', category: PantryCategory.GRAINS },
      { name: 'Pechuga de pollo', category: PantryCategory.PROTEINS },
      { name: 'Yogurt griego', category: PantryCategory.DAIRY },
      { name: 'Frutos secos', category: PantryCategory.SNACKS },
      { name: 'Aceite de oliva', category: PantryCategory.OILS },
      { name: 'Limones', category: PantryCategory.FRUITS },
      { name: 'Avena', category: PantryCategory.GRAINS },
    ]
  }
};

export function PantrySetupStep({ onNext, onBack }: PantrySetupStepProps) {
  const { data, savePantryItems } = useOnboardingStore();
  
  const [pantryItems, setPantryItems] = useState<PantryItem[]>(data.pantryItems || []);
  const [selectedCategory, setSelectedCategory] = useState<PantryCategory>(PantryCategory.PROTEINS);
  const [newItemName, setNewItemName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [personalizedSuggestions, setPersonalizedSuggestions] = useState<string[]>([]);
  const [showStarterKit, setShowStarterKit] = useState(true);

  const cookingPersona = data.profile?.cooking_persona || 'beginner';
  const dietaryRestrictions = data.preferences?.dietary_restrictions || [];
  
  const filteredCommonItems = COMMON_ITEMS[selectedCategory]?.filter(item =>
    item.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !pantryItems.some(pantryItem => pantryItem.name.toLowerCase() === item.toLowerCase())
  ) || [];

  const generatePersonalizedSuggestions = async () => {
    if (personalizedSuggestions.length > 0) return;
    
    setIsGeneratingSuggestions(true);
    try {
      const apiKey = geminiConfig.getApiKey();
      if (!apiKey) throw new Error('Gemini API key not configured');

      const aiService = getAIService();

      const categoryInfo = PANTRY_CATEGORIES.find(c => c.value === selectedCategory);
      const prompt = `Sugiere 6 ingredientes de la categoría "${categoryInfo?.label}" que serían útiles para alguien con estas características:
      
      - Estilo de cocina: ${cookingPersona}
      - Restricciones dietéticas: ${dietaryRestrictions.length > 0 ? dietaryRestrictions.join(', ') : 'Ninguna'}
      - Categoría: ${categoryInfo?.label}
      
      Los ingredientes deben ser:
      - Comunes y fáciles de encontrar en supermercados
      - Apropiados para las restricciones dietéticas
      - Útiles para múltiples recetas
      - En español
      
      Responde SOLO con un JSON array de 6 strings con los nombres de los ingredientes, sin markdown ni explicaciones.`;

      const result = await aiService.generateText({ prompt: prompt);
      const response = await result.response;
      let text = response.text().trim();
      
      // Clean markdown if present
      if (text.startsWith('```json')) text = text.slice(7);
      if (text.startsWith('```')) text = text.slice(3);
      if (text.endsWith('```')) text = text.slice(0, -3);
      
      const suggestions = JSON.parse(text.trim());
      setPersonalizedSuggestions(suggestions.filter(s => 
        !pantryItems.some(item => item.name.toLowerCase() === s.toLowerCase())
      ));
    } catch (error) {
      logger.error('Failed to generate suggestions:', 'PantrySetupStep', error);
      setPersonalizedSuggestions([]);
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

  useEffect(() => {
    if (selectedCategory) {
      setPersonalizedSuggestions([]);
    }
  }, [selectedCategory]);

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

  const applyStarterKit = () => {
    const kit = STARTER_KITS[cookingPersona] || STARTER_KITS.beginner;
    const newItems = kit.items.filter(kitItem => 
      !pantryItems.some(existing => existing.name.toLowerCase() === kitItem.name.toLowerCase())
    );
    setPantryItems([...pantryItems, ...newItems]);
    setShowStarterKit(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);
    try {
      await savePantryItems(pantryItems);
      onNext();
    } catch (error: unknown) {
      logger.error('Failed to save pantry items:', 'PantrySetupStep', error);
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
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-3xl font-bold text-white mb-2">
          Configura tu Despensa
        </h2>
        <p className="text-white/60">
          Añade los ingredientes que ya tienes para obtener sugerencias de comidas más precisas
        </p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Starter Kit Suggestion */}
        <AnimatePresence>
          {showStarterKit && pantryItems.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <GlassCard variant="highlight">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                    <ShoppingCart className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-white mb-1">
                      {STARTER_KITS[cookingPersona]?.name || 'Kit de Inicio Recomendado'}
                    </h4>
                    <p className="text-sm text-purple-200 mb-3">
                      Basado en tu perfil, te sugerimos estos ingredientes esenciales para empezar
                    </p>
                    <GlassButton
                      onClick={applyStarterKit}
                      variant="primary"
                      className="text-sm"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Añadir kit de inicio
                    </GlassButton>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Add Items Panel */}
          <GlassCard>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-6">
              <Package className="h-5 w-5 text-purple-400" />
              Añadir Ingredientes
            </h3>

            {/* Category Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-white mb-2">
                Categoría
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as PantryCategory)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all [&_option]:bg-gray-900"
              >
                {PANTRY_CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.icon} {category.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Search and Add Custom Item */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-white mb-2">
                Buscar o Añadir Ingrediente
              </label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem(newItemName))}
                    placeholder="Escribe el nombre del ingrediente..."
                    className="w-full px-3 py-2 pl-10 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  />
                  <Search className="absolute left-3 top-2.5 h-5 w-5 text-white/40" />
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => addItem(newItemName)}
                  disabled={!newItemName.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Plus className="h-5 w-5" />
                </motion.button>
              </div>
            </div>

            {/* AI Suggestions */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-white">
                  Sugerencias para {PANTRY_CATEGORIES.find(c => c.value === selectedCategory)?.label}
                </h4>
                <button
                  type="button"
                  onClick={generatePersonalizedSuggestions}
                  disabled={isGeneratingSuggestions}
                  className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
                >
                  <Wand2 className="w-4 h-4" />
                  {isGeneratingSuggestions ? 'Generando...' : 'Sugerencias IA'}
                </button>
              </div>
              
              {/* Personalized Suggestions */}
              <AnimatePresence>
                {personalizedSuggestions.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 p-3 bg-purple-500/20 rounded-xl border border-purple-400/30"
                  >
                    <p className="text-xs text-purple-300 mb-2 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Sugerencias personalizadas para ti:
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {personalizedSuggestions.map((item, index) => (
                        <motion.button
                          key={item}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                          type="button"
                          onClick={() => addItem(item)}
                          className="text-left px-3 py-2 text-sm bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-all text-white"
                        >
                          + {item}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Common Items */}
              {filteredCommonItems.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {filteredCommonItems.map((item, index) => (
                    <motion.button
                      key={item}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.03 }}
                      type="button"
                      onClick={() => addItem(item)}
                      className="text-left px-3 py-2 text-sm bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all text-white/80"
                    >
                      + {item}
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          </GlassCard>

          {/* Current Pantry Panel */}
          <GlassCard>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">
                Tu Despensa ({pantryItems.length} ingredientes)
              </h3>
              {pantryItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setPantryItems([])}
                  className="text-sm text-red-400 hover:text-red-300 transition-colors"
                >
                  Limpiar todo
                </button>
              )}
            </div>

            {pantryItems.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 mx-auto mb-3 text-white/30" />
                <p className="text-white/60">No hay ingredientes añadidos aún</p>
                <p className="text-sm text-white/40 mt-1">Añade ingredientes para obtener mejores sugerencias</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {PANTRY_CATEGORIES.map((category) => {
                  const items = itemsByCategory[category.value] || [];
                  if (items.length === 0) return null;

                  return (
                    <motion.div 
                      key={category.value} 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="bg-white/5 border border-white/10 rounded-xl p-4"
                    >
                      <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                        <span>{category.icon}</span>
                        {category.label} ({items.length})
                      </h4>
                      <div className="space-y-2">
                        {items.map((item, index) => (
                          <motion.div 
                            key={`${item.name}-${index}`} 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="flex items-center justify-between py-1 group"
                          >
                            <span className="text-white/80">{item.name}</span>
                            <button
                              type="button"
                              onClick={() => removeItem(pantryItems.indexOf(item))}
                              className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </GlassCard>
        </div>

        {/* Info Box */}
        <GlassCard className="flex gap-3">
          <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-white mb-1">Consejo</p>
            <p className="text-white/60">
              ¡No te preocupes por ser completo! Siempre puedes añadir más ingredientes después. 
              Esta configuración inicial ayuda a nuestra IA a entender qué sueles tener disponible.
            </p>
          </div>
        </GlassCard>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6">
          <GlassButton
            onClick={onBack}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Atrás
          </GlassButton>
          
          <GlassButton
            type="submit"
            disabled={isLoading}
            variant="primary"
            className="flex items-center gap-2"
          >
            {isLoading ? 'Guardando...' : 'Continuar'}
            <ArrowRight className="w-4 h-4" />
          </GlassButton>
        </div>
      </form>
    </div>
  );
}