'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Globe2, Coffee, Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WizardData } from '../MealPlannerWizard';

interface MealPreferencesStepProps {
  data: WizardData;
  updateData: (data: Partial<WizardData>) => void;
  onNext: () => void;
}

const CUISINE_TYPES = [
  { id: 'italian', label: 'Italian', emoji: '🇮🇹' },
  { id: 'mexican', label: 'Mexican', emoji: '🇲🇽' },
  { id: 'asian', label: 'Asian', emoji: '🥢' },
  { id: 'american', label: 'American', emoji: '🇺🇸' },
  { id: 'mediterranean', label: 'Mediterranean', emoji: '🫒' },
  { id: 'indian', label: 'Indian', emoji: '🇮🇳' },
];

const COOKING_TIMES = [
  { value: 15, label: '15 min', icon: <Clock className="w-4 h-4" /> },
  { value: 30, label: '30 min', icon: <Clock className="w-4 h-4" /> },
  { value: 45, label: '45 min', icon: <Clock className="w-4 h-4" /> },
  { value: 60, label: '60+ min', icon: <Clock className="w-4 h-4" /> },
];

const MEALS_PER_DAY = [
  { value: 2, label: '2 meals', icon: <Sun className="w-4 h-4" />, description: 'Breakfast & Dinner' },
  { value: 3, label: '3 meals', icon: <Coffee className="w-4 h-4" />, description: 'Traditional schedule' },
  { value: 4, label: '4+ meals', icon: <Moon className="w-4 h-4" />, description: 'Include snacks' },
];

export const MealPreferencesStep: React.FC<MealPreferencesStepProps> = ({
  data,
  updateData,
  onNext,
}) => {
  const toggleCuisine = (id: string) => {
    const current = data.cuisineTypes || [];
    const updated = current.includes(id)
      ? current.filter((c) => c !== id)
      : [...current, id];
    updateData({ cuisineTypes: updated });
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h4 className="text-xl font-semibold text-white">
          Let's fine-tune your preferences
        </h4>
        <p className="text-white/60">
          Almost done! Just a few more details
        </p>
      </div>

      {/* Cuisine Types */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-3">
          <Globe2 className="w-5 h-5 text-white/60" />
          <h5 className="text-white font-medium">Favorite Cuisines</h5>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {CUISINE_TYPES.map((cuisine, index) => {
            const isSelected = data.cuisineTypes.includes(cuisine.id);
            return (
              <motion.button
                key={cuisine.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.03 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleCuisine(cuisine.id)}
                className={cn(
                  'p-3 rounded-xl border transition-all duration-300 flex flex-col items-center gap-2',
                  isSelected
                    ? 'bg-white/20 border-white/40'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                )}
              >
                <span className="text-2xl">{cuisine.emoji}</span>
                <span className="text-white text-sm">{cuisine.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Cooking Time */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-5 h-5 text-white/60" />
          <h5 className="text-white font-medium">Maximum Cooking Time</h5>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {COOKING_TIMES.map((time, index) => {
            const isSelected = data.maxCookingTime === time.value;
            return (
              <motion.button
                key={time.value}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => updateData({ maxCookingTime: time.value })}
                className={cn(
                  'p-3 rounded-xl border transition-all duration-300 flex flex-col items-center gap-1',
                  isSelected
                    ? 'bg-gradient-to-r from-orange-500/20 to-pink-500/20 border-white/40'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                )}
              >
                {time.icon}
                <span className="text-white text-sm font-medium">{time.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Meals per Day */}
      <div className="space-y-3">
        <h5 className="text-white font-medium">Meals per Day</h5>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {MEALS_PER_DAY.map((option, index) => {
            const isSelected = data.mealsPerDay === option.value;
            return (
              <motion.button
                key={option.value}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.05 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => updateData({ mealsPerDay: option.value })}
                className={cn(
                  'p-4 rounded-xl border transition-all duration-300 text-left',
                  isSelected
                    ? 'bg-white/20 border-white/40'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="text-white/80">{option.icon}</div>
                  <div>
                    <p className="text-white font-medium">{option.label}</p>
                    <p className="text-white/60 text-xs mt-0.5">{option.description}</p>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};