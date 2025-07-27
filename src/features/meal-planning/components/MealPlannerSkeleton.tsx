'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { iOS26EnhancedCard } from '@/components/ios26/iOS26EnhancedCard';

export function MealPlannerSkeleton() {
  const days = Array.from({ length: 7 });
  const meals = Array.from({ length: 4 });

  return (
    <iOS26EnhancedCard
      variant="aurora"
      elevation="high"
      className="relative overflow-hidden"
      data-testid="meal-planner-skeleton"
    >
      {/* Header skeleton */}
      <div className="px-4 md:px-6 py-4 md:py-5 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-2xl animate-pulse" />
            <div>
              <div className="h-6 w-48 bg-white/20 rounded-lg animate-pulse mb-2" />
              <div className="h-4 w-32 bg-white/10 rounded animate-pulse" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-24 h-9 bg-white/20 rounded-lg animate-pulse" />
            <div className="w-16 h-9 bg-white/20 rounded-lg animate-pulse" />
          </div>
        </div>
        
        {/* Progress bar skeleton */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <div className="h-3 w-24 bg-white/10 rounded animate-pulse" />
            <div className="h-3 w-8 bg-white/10 rounded animate-pulse" />
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full w-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
      
      {/* Desktop view skeleton */}
      <div className="hidden md:block p-4 md:p-6">
        {/* Days header skeleton */}
        <div className="grid grid-cols-7 gap-3 mb-4">
          {days.map((_, index) => (
            <div key={index} className="text-center">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className="px-3 py-2 rounded-xl bg-white/10 animate-pulse"
              >
                <div className="h-4 w-16 bg-white/20 rounded mx-auto mb-1" />
                <div className="h-3 w-8 bg-white/10 rounded mx-auto" />
              </motion.div>
            </div>
          ))}
        </div>
        
        {/* Meal slots grid skeleton */}
        <div className="space-y-3">
          {meals.map((_, mealIndex) => (
            <div key={mealIndex}>
              {/* Meal type header skeleton */}
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-white/20 animate-pulse" />
                <div className="h-4 w-20 bg-white/20 rounded animate-pulse" />
                <div className="h-3 w-16 bg-white/10 rounded animate-pulse" />
              </div>
              
              {/* Meal slots skeleton */}
              <div className="grid grid-cols-7 gap-3">
                {days.map((_, dayIndex) => (
                  <motion.div
                    key={`${mealIndex}-${dayIndex}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: (mealIndex * 7 + dayIndex) * 0.02 }}
                  >
                    <iOS26EnhancedCard
                      variant="glass"
                      className="h-32 animate-pulse"
                    >
                      <div className="h-full flex items-center justify-center">
                        <div className="w-10 h-10 bg-white/20 rounded-full" />
                      </div>
                    </iOS26EnhancedCard>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Mobile view skeleton */}
      <div className="block md:hidden p-4">
        {/* Day navigation skeleton */}
        <div className="flex items-center justify-between mb-6">
          <div className="w-10 h-10 bg-white/20 rounded-xl animate-pulse" />
          <div className="text-center">
            <div className="h-5 w-24 bg-white/20 rounded mb-1 mx-auto animate-pulse" />
            <div className="h-4 w-32 bg-white/10 rounded mx-auto animate-pulse" />
          </div>
          <div className="w-10 h-10 bg-white/20 rounded-xl animate-pulse" />
        </div>
        
        {/* Day indicator dots skeleton */}
        <div className="flex justify-center gap-1.5 mb-6">
          {days.map((_, index) => (
            <div
              key={index}
              className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse"
            />
          ))}
        </div>
        
        {/* Current day meals skeleton */}
        <div className="space-y-4">
          {meals.map((_, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-white/20 animate-pulse" />
                <div className="h-4 w-20 bg-white/20 rounded animate-pulse" />
                <div className="h-3 w-16 bg-white/10 rounded animate-pulse ml-auto" />
              </div>
              
              <iOS26EnhancedCard
                variant="glass"
                className="h-32 animate-pulse"
              >
                <div className="h-full flex items-center justify-center">
                  <div className="w-10 h-10 bg-white/20 rounded-full" />
                </div>
              </iOS26EnhancedCard>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Footer stats skeleton */}
      <div className="px-4 md:px-6 py-4 border-t border-white/10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="text-center">
              <div className="h-8 w-12 bg-white/20 rounded mx-auto mb-1 animate-pulse" />
              <div className="h-3 w-16 bg-white/10 rounded mx-auto animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </iOS26EnhancedCard>
  );
}