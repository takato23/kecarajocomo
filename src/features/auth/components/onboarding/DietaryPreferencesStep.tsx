'use client';

import { useState, useEffect } from 'react';
import { Check, Info, Plus, X, AlertCircle, Sparkles, ArrowLeft, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { logger } from '@/services/logger';

import { useOnboardingStore } from '../../store/onboardingStore';
import { DietaryRestriction } from '../../types';
import { GlassCard, GlassButton } from './shared/GlassCard';

interface DietaryPreferencesStepProps {
  onNext: () => void;
  onBack: () => void;
}

const DIETARY_OPTIONS = [
  {
    value: DietaryRestriction.VEGETARIAN,
    label: 'Vegetariano',
    description: 'Sin carne ni pescado',
    icon: '🥗'
  },
  {
    value: DietaryRestriction.VEGAN,
    label: 'Vegano',
    description: 'Sin productos animales',
    icon: '🌱'
  },
  {
    value: DietaryRestriction.GLUTEN_FREE,
    label: 'Sin Gluten',
    description: 'Sin trigo, cebada o centeno',
    icon: '🌾'
  },
  {
    value: DietaryRestriction.DAIRY_FREE,
    label: 'Sin Lácteos',
    description: 'Sin productos lácteos',
    icon: '🥛'
  },
  {
    value: DietaryRestriction.NUT_FREE,
    label: 'Sin Frutos Secos',
    description: 'Sin nueces ni cacahuetes',
    icon: '🥜'
  },
  {
    value: DietaryRestriction.KOSHER,
    label: 'Kosher',
    description: 'Siguiendo leyes dietéticas judías',
    icon: '✡️'
  },
  {
    value: DietaryRestriction.HALAL,
    label: 'Halal',
    description: 'Siguiendo leyes dietéticas islámicas',
    icon: '☪️'
  },
  {
    value: DietaryRestriction.LOW_CARB,
    label: 'Bajo en Carbohidratos',
    description: 'Carbohidratos reducidos',
    icon: '🍞'
  },
  {
    value: DietaryRestriction.KETO,
    label: 'Keto',
    description: 'Muy bajo en carbohidratos, alto en grasas',
    icon: '🥑'
  },
  {
    value: DietaryRestriction.PALEO,
    label: 'Paleo',
    description: 'Alimentos integrales, sin granos',
    icon: '🥩'
  },
  {
    value: DietaryRestriction.PESCATARIAN,
    label: 'Pescetariano',
    description: 'Vegetariano más pescado',
    icon: '🐟'
  }
];

const COMMON_ALLERGENS = [
  'Huevos', 'Leche', 'Soja', 'Mariscos', 'Pescado', 
  'Cacahuetes', 'Nueces', 'Trigo', 'Apio', 'Mostaza'
];

// Compatibilidad y advertencias
const COMPATIBILITY_WARNINGS = {
  [DietaryRestriction.VEGAN]: {
    incompatible: [DietaryRestriction.PESCATARIAN],
    includes: [DietaryRestriction.VEGETARIAN, DietaryRestriction.DAIRY_FREE],
    message: 'El veganismo ya incluye vegetariano y sin lácteos'
  },
  [DietaryRestriction.VEGETARIAN]: {
    incompatible: [DietaryRestriction.PESCATARIAN, DietaryRestriction.PALEO],
    message: 'Vegetariano es incompatible con dietas que incluyen carne'
  },
  [DietaryRestriction.KETO]: {
    incompatible: [DietaryRestriction.LOW_CARB],
    message: 'Keto es una versión más estricta de bajo en carbohidratos'
  },
  [DietaryRestriction.KOSHER]: {
    incompatible: [DietaryRestriction.HALAL],
    message: 'Usualmente se sigue una u otra práctica religiosa'
  }
};

export function DietaryPreferencesStep({ onNext, onBack }: DietaryPreferencesStepProps) {
  const { data, savePreferences } = useOnboardingStore();
  
  const [selectedRestrictions, setSelectedRestrictions] = useState<DietaryRestriction[]>(
    data.preferences?.dietary_restrictions || []
  );
  const [allergies, setAllergies] = useState<string[]>(
    data.preferences?.allergies || []
  );
  const [newAllergy, setNewAllergy] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [compatibilityWarning, setCompatibilityWarning] = useState<string | null>(null);
  const [showAllergenSuggestions, setShowAllergenSuggestions] = useState(false);

  // Check compatibility when restrictions change
  useEffect(() => {
    checkCompatibility();
  }, [selectedRestrictions]);

  const checkCompatibility = () => {
    for (const restriction of selectedRestrictions) {
      const warning = COMPATIBILITY_WARNINGS[restriction];
      if (warning) {
        // Check for incompatible selections
        const hasIncompatible = warning.incompatible?.some(inc => 
          selectedRestrictions.includes(inc)
        );
        
        // Check if includes other restrictions
        const hasIncluded = warning.includes?.some(inc => 
          selectedRestrictions.includes(inc)
        );
        
        if (hasIncompatible || hasIncluded) {
          setCompatibilityWarning(warning.message);
          return;
        }
      }
    }
    setCompatibilityWarning(null);
  };

  const toggleRestriction = (restriction: DietaryRestriction) => {
    setSelectedRestrictions(prev => {
      const newRestrictions = prev.includes(restriction)
        ? prev.filter(r => r !== restriction)
        : [...prev, restriction];
      
      // Auto-manage related restrictions
      if (!prev.includes(restriction)) {
        const warning = COMPATIBILITY_WARNINGS[restriction];
        if (warning?.includes) {
          // Auto-select included restrictions
          return [...new Set([...newRestrictions, ...warning.includes])];
        }
      }
      
      return newRestrictions;
    });
  };

  const addAllergy = () => {
    if (newAllergy.trim() && !allergies.includes(newAllergy.trim())) {
      setAllergies([...allergies, newAllergy.trim()]);
      setNewAllergy('');
      setShowAllergenSuggestions(false);
    }
  };

  const removeAllergy = (allergy: string) => {
    setAllergies(allergies.filter(a => a !== allergy));
  };

  const addCommonAllergen = (allergen: string) => {
    if (!allergies.includes(allergen)) {
      setAllergies([...allergies, allergen]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);
    try {
      await savePreferences({
        dietary_restrictions: selectedRestrictions,
        allergies
      });
      onNext();
    } catch (error: unknown) {
      logger.error('Failed to save preferences:', 'DietaryPreferencesStep', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRecommendedRecipeCount = () => {
    const restrictionCount = selectedRestrictions.length;
    const allergyCount = allergies.length;
    const total = restrictionCount + allergyCount;
    
    if (total === 0) return "miles de";
    if (total <= 2) return "cientos de";
    if (total <= 4) return "decenas de";
    return "varias";
  };

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-3xl font-bold text-white mb-2">
          Preferencias y Restricciones Dietéticas
        </h2>
        <p className="text-white/60">
          Selecciona cualquier preferencia o restricción dietética que sigas
        </p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Dietary Restrictions */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">
            Restricciones Dietéticas
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {DIETARY_OPTIONS.map((option, index) => (
              <motion.button
                key={option.value}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.05 * index }}
                type="button"
                onClick={() => toggleRestriction(option.value)}
                className={`p-4 rounded-xl border-2 backdrop-blur-xl transition-all ${
                  selectedRestrictions.includes(option.value)
                    ? 'border-purple-400 bg-purple-500/20'
                    : 'border-white/20 bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{option.icon}</span>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-white flex items-center gap-2">
                      {option.label}
                      {selectedRestrictions.includes(option.value) && (
                        <Check className="h-4 w-4 text-purple-400" />
                      )}
                    </div>
                    <div className="text-sm text-white/60 mt-1">
                      {option.description}
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
          
          {/* Compatibility Warning */}
          <AnimatePresence>
            {compatibilityWarning && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 overflow-hidden"
              >
                <GlassCard variant="error" className="flex gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0" />
                  <p className="text-sm text-amber-200">{compatibilityWarning}</p>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Allergies */}
        <GlassCard>
          <h3 className="text-lg font-semibold text-white mb-2">
            Alergias e Intolerancias
          </h3>
          <p className="text-sm text-white/60 mb-4">
            Añade cualquier ingrediente específico que necesites evitar
          </p>
          
          <div className="space-y-3">
            {/* Common Allergens Quick Add */}
            {!showAllergenSuggestions && allergies.length < 3 && (
              <button
                type="button"
                onClick={() => setShowAllergenSuggestions(true)}
                className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                Mostrar alérgenos comunes
              </button>
            )}
            
            <AnimatePresence>
              {showAllergenSuggestions && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-purple-500/10 rounded-xl p-3 space-y-2 border border-purple-400/20"
                >
                  <p className="text-xs text-purple-300 font-medium">Alérgenos comunes - Haz clic para añadir:</p>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_ALLERGENS.filter(a => !allergies.includes(a)).map((allergen, index) => (
                      <motion.button
                        key={allergen}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.03 }}
                        type="button"
                        onClick={() => addCommonAllergen(allergen)}
                        className="px-3 py-1 bg-white/10 border border-white/20 rounded-full text-sm hover:bg-white/20 transition-all text-white/80"
                      >
                        + {allergen}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Allergy Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newAllergy}
                onChange={(e) => setNewAllergy(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAllergy())}
                placeholder="ej: mariscos, soja, huevos"
                className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition-all"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={addAllergy}
                disabled={!newAllergy.trim()}
                className="px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Plus className="h-5 w-5" />
              </motion.button>
            </div>

            {/* Allergy List */}
            <AnimatePresence>
              {allergies.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-wrap gap-2"
                >
                  {allergies.map((allergy, index) => (
                    <motion.span
                      key={allergy}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ delay: index * 0.05 }}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-red-500/20 text-red-300 border border-red-400/30 rounded-full text-sm backdrop-blur-xl"
                    >
                      {allergy}
                      <button
                        type="button"
                        onClick={() => removeAllergy(allergy)}
                        className="hover:text-red-200 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </motion.span>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </GlassCard>

        {/* Recipe Count Indicator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <GlassCard variant="success" className="flex gap-3">
            <Sparkles className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-green-200">
              <p className="font-medium mb-1">
                Tenemos {getRecommendedRecipeCount()} recetas perfectas para ti
              </p>
              <p className="text-green-300/80">
                Nuestro sistema se adapta a tus preferencias para ofrecerte comidas deliciosas y seguras
                {selectedRestrictions.length > 0 && ' que cumplen con todas tus restricciones'}.
              </p>
            </div>
          </GlassCard>
        </motion.div>

        {/* Info Box */}
        <GlassCard className="flex gap-3">
          <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium mb-1 text-white">Tus preferencias son privadas</p>
            <p className="text-white/60">
              Usamos esta información únicamente para proporcionarte sugerencias de comidas adecuadas 
              y garantizar tu seguridad. Puedes actualizar estas preferencias en cualquier momento.
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
          
          <div className="flex gap-3">
            <GlassButton
              onClick={onNext}
              variant="ghost"
            >
              Omitir por ahora
            </GlassButton>
            
            <GlassButton
              type="submit"
              disabled={isLoading}
              variant="primary"
              className="flex items-center gap-2"
            >
              {isLoading ? 'Guardando...' : 'Guardar y Continuar'}
              <ArrowRight className="w-4 h-4" />
            </GlassButton>
          </div>
        </div>
      </form>
    </div>
  );
}