'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Zap, TrendingDown, Dumbbell, Brain, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WizardData } from '../MealPlannerWizard';

interface NutritionalGoalsStepProps {
  data: WizardData;
  updateData: (data: Partial<WizardData>) => void;
  onNext: () => void;
}

const NUTRITIONAL_GOALS = [
  {
    id: 'weight-loss',
    label: 'Weight Loss',
    icon: <TrendingDown className="w-5 h-5" />,
    color: 'from-green-500 to-emerald-500',
    description: 'Calorie-conscious meals',
  },
  {
    id: 'muscle-gain',
    label: 'Muscle Gain',
    icon: <Dumbbell className="w-5 h-5" />,
    color: 'from-red-500 to-orange-500',
    description: 'High protein options',
  },
  {
    id: 'energy',
    label: 'More Energy',
    icon: <Zap className="w-5 h-5" />,
    color: 'from-yellow-500 to-amber-500',
    description: 'Balanced nutrition',
  },
  {
    id: 'heart-health',
    label: 'Heart Health',
    icon: <Heart className="w-5 h-5" />,
    color: 'from-pink-500 to-rose-500',
    description: 'Low sodium & healthy fats',
  },
  {
    id: 'brain-health',
    label: 'Brain Health',
    icon: <Brain className="w-5 h-5" />,
    color: 'from-purple-500 to-indigo-500',
    description: 'Omega-3 rich foods',
  },
  {
    id: 'immune-boost',
    label: 'Immune Boost',
    icon: <Shield className="w-5 h-5" />,
    color: 'from-blue-500 to-cyan-500',
    description: 'Vitamin-rich meals',
  },
];

export const NutritionalGoalsStep: React.FC<NutritionalGoalsStepProps> = ({
  data,
  updateData,
  onNext,
}) => {
  const toggleGoal = (id: string) => {
    const current = data.nutritionalGoals || [];
    const updated = current.includes(id)
      ? current.filter((g) => g !== id)
      : [...current, id];
    updateData({ nutritionalGoals: updated });
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h4 className="text-xl font-semibold text-white">
          What are your nutritional goals?
        </h4>
        <p className="text-white/60">
          Select all that matter to you
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {NUTRITIONAL_GOALS.map((goal, index) => {
          const isSelected = data.nutritionalGoals.includes(goal.id);
          return (
            <motion.button
              key={goal.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => toggleGoal(goal.id)}
              className={cn(
                'relative p-5 rounded-2xl border transition-all duration-300',
                isSelected
                  ? 'bg-white/20 border-white/40 shadow-lg'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              )}
            >
              <div className="flex items-start gap-4">
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0',
                  isSelected
                    ? `bg-gradient-to-r ${goal.color}`
                    : 'bg-white/10'
                )}>
                  {goal.icon}
                </div>
                <div className="text-left">
                  <h5 className="text-white font-medium mb-1">{goal.label}</h5>
                  <p className="text-white/60 text-sm">{goal.description}</p>
                </div>
              </div>

              {/* Selection indicator */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-4 right-4 w-5 h-5 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 flex items-center justify-center"
                >
                  <div className="w-2 h-2 bg-white rounded-full" />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center pt-4"
      >
        <p className="text-white/40 text-sm">
          {data.nutritionalGoals.length > 0
            ? `${data.nutritionalGoals.length} goal${data.nutritionalGoals.length > 1 ? 's' : ''} selected`
            : 'Select at least one goal to continue'}
        </p>
      </motion.div>
    </div>
  );
};