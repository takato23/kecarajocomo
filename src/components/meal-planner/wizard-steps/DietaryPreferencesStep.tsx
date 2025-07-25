'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Leaf, Fish, Beef, Wheat, Apple, Coffee } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WizardData } from '../MealPlannerWizard';

interface DietaryPreferencesStepProps {
  data: WizardData;
  updateData: (data: Partial<WizardData>) => void;
  onNext: () => void;
}

const DIETARY_OPTIONS = [
  { id: 'vegetarian', label: 'Vegetarian', icon: <Leaf className="w-5 h-5" />, color: 'from-green-500 to-emerald-500' },
  { id: 'vegan', label: 'Vegan', icon: <Apple className="w-5 h-5" />, color: 'from-lime-500 to-green-500' },
  { id: 'pescatarian', label: 'Pescatarian', icon: <Fish className="w-5 h-5" />, color: 'from-blue-500 to-cyan-500' },
  { id: 'carnivore', label: 'Carnivore', icon: <Beef className="w-5 h-5" />, color: 'from-red-500 to-orange-500' },
  { id: 'gluten-free', label: 'Gluten-Free', icon: <Wheat className="w-5 h-5" />, color: 'from-amber-500 to-yellow-500' },
  { id: 'keto', label: 'Keto', icon: <Coffee className="w-5 h-5" />, color: 'from-purple-500 to-pink-500' },
];

export const DietaryPreferencesStep: React.FC<DietaryPreferencesStepProps> = ({
  data,
  updateData,
  onNext,
}) => {
  const togglePreference = (id: string) => {
    const current = data.dietaryPreferences || [];
    const updated = current.includes(id)
      ? current.filter((p) => p !== id)
      : [...current, id];
    updateData({ dietaryPreferences: updated });
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h4 className="text-xl font-semibold text-white">
          Do you follow any specific diet?
        </h4>
        <p className="text-white/60">
          Select all that apply, or skip if none
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {DIETARY_OPTIONS.map((option, index) => {
          const isSelected = data.dietaryPreferences.includes(option.id);
          return (
            <motion.button
              key={option.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => togglePreference(option.id)}
              className={cn(
                'relative p-6 rounded-2xl border transition-all duration-300',
                isSelected
                  ? 'bg-white/20 border-white/40 shadow-lg'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              )}
            >
              {/* Selection indicator */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-3 right-3 w-6 h-6 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 flex items-center justify-center"
                >
                  <div className="w-2 h-2 bg-white rounded-full" />
                </motion.div>
              )}

              <div className="flex flex-col items-center space-y-3">
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center text-white',
                  isSelected
                    ? `bg-gradient-to-r ${option.color}`
                    : 'bg-white/10'
                )}>
                  {option.icon}
                </div>
                <span className="text-white font-medium">{option.label}</span>
              </div>
            </motion.button>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-center justify-center pt-4"
      >
        <button
          onClick={onNext}
          className="text-white/60 hover:text-white/80 transition-colors text-sm"
        >
          None of these apply to me →
        </button>
      </motion.div>
    </div>
  );
};