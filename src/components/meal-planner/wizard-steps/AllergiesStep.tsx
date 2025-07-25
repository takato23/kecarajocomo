'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WizardData } from '../MealPlannerWizard';

interface AllergiesStepProps {
  data: WizardData;
  updateData: (data: Partial<WizardData>) => void;
  onNext: () => void;
}

const COMMON_ALLERGIES = [
  { id: 'nuts', label: 'Nuts', emoji: '🥜' },
  { id: 'dairy', label: 'Dairy', emoji: '🥛' },
  { id: 'eggs', label: 'Eggs', emoji: '🥚' },
  { id: 'shellfish', label: 'Shellfish', emoji: '🦐' },
  { id: 'soy', label: 'Soy', emoji: '🌱' },
  { id: 'wheat', label: 'Wheat', emoji: '🌾' },
];

export const AllergiesStep: React.FC<AllergiesStepProps> = ({
  data,
  updateData,
  onNext,
}) => {
  const [customAllergy, setCustomAllergy] = useState('');

  const toggleAllergy = (id: string) => {
    const current = data.allergies || [];
    const updated = current.includes(id)
      ? current.filter((a) => a !== id)
      : [...current, id];
    updateData({ allergies: updated });
  };

  const addCustomAllergy = () => {
    if (customAllergy.trim() && !data.allergies.includes(customAllergy.trim())) {
      updateData({ allergies: [...data.allergies, customAllergy.trim()] });
      setCustomAllergy('');
    }
  };

  const removeAllergy = (allergy: string) => {
    updateData({ allergies: data.allergies.filter((a) => a !== allergy) });
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-red-500/20 backdrop-blur-sm border border-red-500/30 mb-4">
          <AlertCircle className="w-6 h-6 text-red-400" />
        </div>
        <h4 className="text-xl font-semibold text-white">
          Any allergies or food restrictions?
        </h4>
        <p className="text-white/60">
          This helps us keep you safe and comfortable
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {COMMON_ALLERGIES.map((allergy, index) => {
          const isSelected = data.allergies.includes(allergy.id);
          return (
            <motion.button
              key={allergy.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => toggleAllergy(allergy.id)}
              className={cn(
                'p-4 rounded-xl border transition-all duration-300 flex items-center gap-3',
                isSelected
                  ? 'bg-red-500/20 border-red-500/40'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              )}
            >
              <span className="text-2xl">{allergy.emoji}</span>
              <span className="text-white font-medium">{allergy.label}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Custom allergy input */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={customAllergy}
            onChange={(e) => setCustomAllergy(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addCustomAllergy()}
            placeholder="Other allergies or restrictions..."
            className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-white/30 transition-all duration-300"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={addCustomAllergy}
            disabled={!customAllergy.trim()}
            className="p-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
          >
            <Plus className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Custom allergies list */}
        {data.allergies.filter((a) => !COMMON_ALLERGIES.find((ca) => ca.id === a)).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {data.allergies
              .filter((a) => !COMMON_ALLERGIES.find((ca) => ca.id === a))
              .map((allergy) => (
                <motion.div
                  key={allergy}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/20 border border-red-500/40"
                >
                  <span className="text-white text-sm">{allergy}</span>
                  <button
                    onClick={() => removeAllergy(allergy)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
          </div>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-center justify-center"
      >
        <button
          onClick={onNext}
          className="text-white/60 hover:text-white/80 transition-colors text-sm"
        >
          I don't have any allergies →
        </button>
      </motion.div>
    </div>
  );
};