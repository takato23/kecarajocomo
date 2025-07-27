'use client';

import { useState } from 'react';
import { Clock, ChefHat, Users, Check, ArrowLeft, ArrowRight, Sparkles, Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { logger } from '@/services/logger';

import { useOnboardingStore } from '../../store/onboardingStore';
import { CookingSkillLevel, CookingTimePreference, CuisineType } from '../../types';
import { GlassCard, GlassButton } from './shared/GlassCard';

interface CookingPreferencesStepProps {
  onNext: () => void;
  onBack: () => void;
}

const SKILL_LEVELS = [
  {
    value: CookingSkillLevel.BEGINNER,
    label: 'Principiante',
    description: 'Puedo seguir recetas simples',
    icon: '👶',
    color: 'from-green-400 to-emerald-400'
  },
  {
    value: CookingSkillLevel.INTERMEDIATE,
    label: 'Intermedio',
    description: 'Me siento cómodo con la mayoría de recetas',
    icon: '👨‍🍳',
    color: 'from-blue-400 to-cyan-400'
  },
  {
    value: CookingSkillLevel.ADVANCED,
    label: 'Avanzado',
    description: 'Disfruto técnicas de cocina complejas',
    icon: '🧑‍🍳',
    color: 'from-purple-400 to-pink-400'
  },
  {
    value: CookingSkillLevel.EXPERT,
    label: 'Experto',
    description: 'Puedo improvisar y crear recetas',
    icon: '⭐',
    color: 'from-yellow-400 to-orange-400'
  }
];

const TIME_PREFERENCES = [
  {
    value: CookingTimePreference.QUICK,
    label: 'Rápido y Fácil',
    description: 'Menos de 30 minutos',
    icon: '⚡',
    color: 'from-yellow-400 to-orange-400'
  },
  {
    value: CookingTimePreference.MODERATE,
    label: 'Moderado',
    description: '30-60 minutos',
    icon: '⏱️',
    color: 'from-blue-400 to-cyan-400'
  },
  {
    value: CookingTimePreference.LEISURELY,
    label: 'Sin Prisa',
    description: 'Disfruto pasar tiempo cocinando',
    icon: '🍲',
    color: 'from-purple-400 to-pink-400'
  }
];

const CUISINE_OPTIONS = [
  { value: CuisineType.ITALIAN, label: 'Italiana', icon: '🇮🇹' },
  { value: CuisineType.MEXICAN, label: 'Mexicana', icon: '🇲🇽' },
  { value: CuisineType.CHINESE, label: 'China', icon: '🇨🇳' },
  { value: CuisineType.JAPANESE, label: 'Japonesa', icon: '🇯🇵' },
  { value: CuisineType.INDIAN, label: 'India', icon: '🇮🇳' },
  { value: CuisineType.THAI, label: 'Tailandesa', icon: '🇹🇭' },
  { value: CuisineType.GREEK, label: 'Griega', icon: '🇬🇷' },
  { value: CuisineType.AMERICAN, label: 'Americana', icon: '🇺🇸' },
  { value: CuisineType.MEDITERRANEAN, label: 'Mediterránea', icon: '🌊' },
  { value: CuisineType.FRENCH, label: 'Francesa', icon: '🇫🇷' },
  { value: CuisineType.KOREAN, label: 'Coreana', icon: '🇰🇷' },
  { value: CuisineType.VIETNAMESE, label: 'Vietnamita', icon: '🇻🇳' }
];

export function CookingPreferencesStep({ onNext, onBack }: CookingPreferencesStepProps) {
  const { data, savePreferences } = useOnboardingStore();
  
  const [skillLevel, setSkillLevel] = useState<CookingSkillLevel>(
    data.preferences?.cooking_skill_level || CookingSkillLevel.INTERMEDIATE
  );
  const [timePreference, setTimePreference] = useState<CookingTimePreference>(
    data.preferences?.cooking_time_preference || CookingTimePreference.MODERATE
  );
  const [cuisinePreferences, setCuisinePreferences] = useState<CuisineType[]>(
    data.preferences?.cuisine_preferences || []
  );
  const [householdSize, setHouseholdSize] = useState(
    data.preferences?.household_size || 2
  );
  const [isLoading, setIsLoading] = useState(false);

  const toggleCuisine = (cuisine: CuisineType) => {
    setCuisinePreferences(prev =>
      prev.includes(cuisine)
        ? prev.filter(c => c !== cuisine)
        : [...prev, cuisine]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);
    try {
      await savePreferences({
        cooking_skill_level: skillLevel,
        cooking_time_preference: timePreference,
        cuisine_preferences: cuisinePreferences,
        household_size: householdSize
      });
      onNext();
    } catch (error: unknown) {
      logger.error('Failed to save preferences:', 'CookingPreferencesStep', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-3xl font-bold text-white mb-2">
          Preferencias de Cocina
        </h2>
        <p className="text-white/60">
          Ayúdanos a entender tu estilo y preferencias en la cocina
        </p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Skill Level */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <ChefHat className="h-5 w-5 text-purple-400" />
            Nivel de Habilidad Culinaria
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {SKILL_LEVELS.map((level, index) => (
              <motion.button
                key={level.value}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.05 * index }}
                type="button"
                onClick={() => setSkillLevel(level.value)}
                className={`p-4 rounded-xl border-2 transition-all text-left backdrop-blur-xl ${
                  skillLevel === level.value
                    ? 'border-purple-400 bg-purple-500/20'
                    : 'border-white/20 bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${level.color} flex items-center justify-center text-2xl`}>
                    {level.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-white flex items-center gap-2">
                      {level.label}
                      {skillLevel === level.value && (
                        <Check className="h-4 w-4 text-purple-400" />
                      )}
                    </div>
                    <div className="text-sm text-white/60 mt-1">
                      {level.description}
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Time Preference */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-purple-400" />
            Preferencia de Tiempo de Cocina
          </h3>
          <div className="grid sm:grid-cols-3 gap-3">
            {TIME_PREFERENCES.map((pref, index) => (
              <motion.button
                key={pref.value}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.05 * index }}
                type="button"
                onClick={() => setTimePreference(pref.value)}
                className={`p-4 rounded-xl border-2 transition-all text-center backdrop-blur-xl ${
                  timePreference === pref.value
                    ? 'border-purple-400 bg-purple-500/20'
                    : 'border-white/20 bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${pref.color} flex items-center justify-center text-2xl mx-auto mb-3`}>
                  {pref.icon}
                </div>
                <div className="font-medium text-white">
                  {pref.label}
                </div>
                <div className="text-sm text-white/60 mt-1">
                  {pref.description}
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Household Size */}
        <GlassCard>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-400" />
            Tamaño del Hogar
          </h3>
          <div className="flex items-center justify-center gap-6">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              type="button"
              onClick={() => setHouseholdSize(Math.max(1, householdSize - 1))}
              className="w-12 h-12 rounded-full bg-white/10 border-2 border-white/20 hover:border-purple-400 hover:bg-purple-500/20 flex items-center justify-center text-white transition-all"
            >
              <Minus className="w-5 h-5" />
            </motion.button>
            <motion.div 
              key={householdSize}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center"
            >
              <div className="text-4xl font-bold text-white bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {householdSize}
              </div>
              <div className="text-sm text-white/60">
                {householdSize === 1 ? 'persona' : 'personas'}
              </div>
            </motion.div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              type="button"
              onClick={() => setHouseholdSize(householdSize + 1)}
              className="w-12 h-12 rounded-full bg-white/10 border-2 border-white/20 hover:border-purple-400 hover:bg-purple-500/20 flex items-center justify-center text-white transition-all"
            >
              <Plus className="w-5 h-5" />
            </motion.button>
          </div>
          <p className="text-sm text-white/60 mt-4 text-center">
            Ajustaremos el tamaño de las porciones según tu hogar
          </p>
        </GlassCard>

        {/* Cuisine Preferences */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">
            Cocinas Favoritas
          </h3>
          <p className="text-sm text-white/60 mb-4">
            Selecciona todas las que te gusten (¡las mezclaremos!)
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {CUISINE_OPTIONS.map((cuisine, index) => (
              <motion.button
                key={cuisine.value}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.02 * index }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => toggleCuisine(cuisine.value)}
                className={`p-3 rounded-xl border-2 transition-all text-center backdrop-blur-xl ${
                  cuisinePreferences.includes(cuisine.value)
                    ? 'border-purple-400 bg-purple-500/20'
                    : 'border-white/20 bg-white/5 hover:bg-white/10'
                }`}
              >
                <span className="text-2xl mb-1 block">{cuisine.icon}</span>
                <div className="text-xs font-medium text-white">
                  {cuisine.label}
                </div>
              </motion.button>
            ))}
          </div>
          {cuisinePreferences.length > 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              <p className="text-sm text-purple-300">
                {cuisinePreferences.length} cocina{cuisinePreferences.length !== 1 ? 's' : ''} seleccionada{cuisinePreferences.length !== 1 ? 's' : ''}
              </p>
            </motion.div>
          )}
        </div>

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
            disabled={isLoading || cuisinePreferences.length === 0}
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