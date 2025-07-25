'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ChefHat, Flame, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WizardData } from '../MealPlannerWizard';

interface CookingSkillStepProps {
  data: WizardData;
  updateData: (data: Partial<WizardData>) => void;
  onNext: () => void;
}

const SKILL_LEVELS = [
  {
    id: 'beginner',
    title: 'Beginner',
    description: 'I can follow simple recipes',
    icon: <ChefHat className="w-8 h-8" />,
    color: 'from-green-500 to-emerald-500',
    features: ['15-30 min recipes', 'Basic techniques', 'Common ingredients'],
  },
  {
    id: 'intermediate',
    title: 'Home Cook',
    description: 'I'm comfortable in the kitchen',
    icon: <Flame className="w-8 h-8" />,
    color: 'from-blue-500 to-indigo-500',
    features: ['30-45 min recipes', 'Various techniques', 'Diverse ingredients'],
  },
  {
    id: 'advanced',
    title: 'Chef Level',
    description: 'I love culinary challenges',
    icon: <Star className="w-8 h-8" />,
    color: 'from-purple-500 to-pink-500',
    features: ['Complex recipes', 'Advanced techniques', 'Exotic ingredients'],
  },
];

export const CookingSkillStep: React.FC<CookingSkillStepProps> = ({
  data,
  updateData,
  onNext,
}) => {
  const selectSkill = (skill: 'beginner' | 'intermediate' | 'advanced') => {
    updateData({ cookingSkill: skill });
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h4 className="text-xl font-semibold text-white">
          How would you rate your cooking skills?
        </h4>
        <p className="text-white/60">
          We'll suggest recipes that match your experience level
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {SKILL_LEVELS.map((level, index) => {
          const isSelected = data.cookingSkill === level.id;
          return (
            <motion.button
              key={level.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                selectSkill(level.id as 'beginner' | 'intermediate' | 'advanced');
                setTimeout(onNext, 300);
              }}
              className={cn(
                'relative p-6 rounded-2xl border transition-all duration-300',
                isSelected
                  ? 'bg-white/20 border-white/40 shadow-lg'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              )}
            >
              {/* Glow effect */}
              {isSelected && (
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-orange-500/20 to-pink-500/20 blur-xl" />
              )}

              <div className="relative space-y-4">
                <div className={cn(
                  'w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-white',
                  isSelected
                    ? `bg-gradient-to-r ${level.color}`
                    : 'bg-white/10'
                )}>
                  {level.icon}
                </div>

                <div>
                  <h5 className="text-white font-semibold text-lg mb-1">
                    {level.title}
                  </h5>
                  <p className="text-white/60 text-sm mb-3">
                    {level.description}
                  </p>
                </div>

                <div className="space-y-1">
                  {level.features.map((feature, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-white/80 text-sm"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};