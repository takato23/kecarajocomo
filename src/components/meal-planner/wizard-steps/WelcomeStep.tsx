'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Utensils, Heart, Clock } from 'lucide-react';

interface WelcomeStepProps {
  data: any;
  updateData: (data: any) => void;
  onNext: () => void;
}

export const WelcomeStep: React.FC<WelcomeStepProps> = ({ onNext }) => {
  const features = [
    {
      icon: <Utensils className="w-6 h-6" />,
      title: 'Personalized Meals',
      description: 'Get recipe suggestions tailored to your taste',
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: 'Nutritional Balance',
      description: 'Meet your health goals with balanced meal plans',
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: 'Save Time',
      description: 'Plan your week in minutes, not hours',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-orange-500/20 to-pink-500/20 backdrop-blur-sm border border-white/20"
        >
          <Sparkles className="w-10 h-10 text-white" />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-3xl font-bold text-white mb-2">
            Welcome to Your Meal Planning Journey!
          </h3>
          <p className="text-white/70 text-lg">
            Let's personalize your experience in just a few steps
          </p>
        </motion.div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + index * 0.1 }}
            className="p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300"
          >
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-pink-500/20 flex items-center justify-center text-white">
                {feature.icon}
              </div>
              <h4 className="text-white font-semibold">{feature.title}</h4>
              <p className="text-white/60 text-sm">{feature.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Bottom Message */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-center"
      >
        <p className="text-white/60 text-sm">
          This will only take 2-3 minutes and you can update your preferences anytime
        </p>
      </motion.div>
    </div>
  );
};