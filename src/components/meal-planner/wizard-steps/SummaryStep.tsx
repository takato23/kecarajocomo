'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WizardData } from '../MealPlannerWizard';

interface SummaryStepProps {
  data: WizardData;
  updateData: (data: Partial<WizardData>) => void;
  onNext: () => void;
}

export const SummaryStep: React.FC<SummaryStepProps> = ({
  data,
  updateData,
  onNext,
}) => {
  const getDietaryPreferenceLabel = (id: string) => {
    const labels: Record<string, string> = {
      vegetarian: 'Vegetarian',
      vegan: 'Vegan',
      pescatarian: 'Pescatarian',
      carnivore: 'Carnivore',
      'gluten-free': 'Gluten-Free',
      keto: 'Keto',
    };
    return labels[id] || id;
  };

  const getCuisineLabel = (id: string) => {
    const labels: Record<string, string> = {
      italian: 'Italian',
      mexican: 'Mexican',
      asian: 'Asian',
      american: 'American',
      mediterranean: 'Mediterranean',
      indian: 'Indian',
    };
    return labels[id] || id;
  };

  const getSkillLabel = (skill: string) => {
    const labels: Record<string, string> = {
      beginner: 'Beginner',
      intermediate: 'Home Cook',
      advanced: 'Chef Level',
    };
    return labels[skill] || skill;
  };

  const sections = [
    {
      title: 'Dietary Preferences',
      items: data.dietaryPreferences.map(getDietaryPreferenceLabel),
      empty: 'No specific diet',
    },
    {
      title: 'Allergies & Restrictions',
      items: data.allergies,
      empty: 'No allergies',
    },
    {
      title: 'Cooking Skill',
      items: data.cookingSkill ? [getSkillLabel(data.cookingSkill)] : [],
      empty: 'Not specified',
    },
    {
      title: 'Nutritional Goals',
      items: data.nutritionalGoals.map((g) => g.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase())),
      empty: 'No specific goals',
    },
    {
      title: 'Favorite Cuisines',
      items: data.cuisineTypes.map(getCuisineLabel),
      empty: 'All cuisines',
    },
    {
      title: 'Preferences',
      items: [
        `${data.maxCookingTime} min max cooking time`,
        `${data.mealsPerDay} meals per day`,
      ],
      empty: '',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 mb-4"
        >
          <Sparkles className="w-8 h-8 text-white" />
        </motion.div>
        <h4 className="text-2xl font-bold text-white">
          Your Meal Plan is Ready!
        </h4>
        <p className="text-white/60">
          Here's a summary of your preferences
        </p>
      </div>

      <div className="space-y-4">
        {sections.map((section, index) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10"
          >
            <h5 className="text-white/80 text-sm font-medium mb-2">
              {section.title}
            </h5>
            {section.items.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {section.items.map((item, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-full bg-white/10 text-white text-sm"
                  >
                    {item}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-white/40 text-sm">{section.empty}</p>
            )}
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="p-6 rounded-2xl bg-gradient-to-br from-orange-500/10 to-pink-500/10 backdrop-blur-sm border border-white/20"
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 flex items-center justify-center shrink-0">
            <Check className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-medium mb-1">
              Everything looks great!
            </p>
            <p className="text-white/60 text-sm">
              We'll create personalized meal plans based on your preferences. You can update these anytime in your settings.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};