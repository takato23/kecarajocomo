'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Clock, TrendingUp, ChefHat, Package, Calendar, ShoppingCart } from 'lucide-react';

import { GlassCard, GlassInput } from '@/components/ui/GlassCard';

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const recentSearches = [
    'Pasta carbonara',
    'Ensalada césar',
    'Pollo al curry',
    'Brownies de chocolate'
  ];

  const popularSearches = [
    'Recetas veganas',
    'Comidas rápidas',
    'Postres sin azúcar',
    'Platos mediterráneos'
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent mb-8 text-center">
          Buscar en KeCarajoComer
        </h1>

        {/* Search Input */}
        <GlassCard variant="medium" className="p-6 mb-8">
          <GlassInput
            placeholder="Buscar recetas, ingredientes, planificaciones..."
            icon={<Search className="w-5 h-5" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-lg"
          />
        </GlassCard>

        {/* Recent Searches */}
        <GlassCard variant="subtle" className="p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold">Búsquedas Recientes</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((search) => (
              <button
                key={search}
                onClick={() => setSearchQuery(search)}
                className="px-4 py-2 bg-white/50 dark:bg-gray-800/50 rounded-full text-sm hover:bg-white/70 dark:hover:bg-gray-800/70 transition-colors"
              >
                {search}
              </button>
            ))}
          </div>
        </GlassCard>

        {/* Popular Searches */}
        <GlassCard variant="subtle" className="p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold">Búsquedas Populares</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {popularSearches.map((search) => (
              <button
                key={search}
                onClick={() => setSearchQuery(search)}
                className="px-4 py-2 bg-gradient-to-r from-orange-50 to-pink-50 dark:from-orange-900/20 dark:to-pink-900/20 rounded-full text-sm hover:from-orange-100 hover:to-pink-100 dark:hover:from-orange-900/30 dark:hover:to-pink-900/30 transition-colors"
              >
                {search}
              </button>
            ))}
          </div>
        </GlassCard>

        {/* Search Categories */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: ChefHat, label: 'Recetas', color: 'from-pink-500 to-purple-500' },
            { icon: Package, label: 'Despensa', color: 'from-blue-500 to-green-500' },
            { icon: Calendar, label: 'Planes', color: 'from-purple-500 to-blue-500' },
            { icon: ShoppingCart, label: 'Compras', color: 'from-green-500 to-orange-500' }
          ].map((category) => {
            const Icon = category.icon;
            return (
              <motion.button
                key={category.label}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group"
              >
                <GlassCard variant="medium" className="p-6 text-center" interactive>
                  <div className={`w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center text-white`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <p className="font-medium">{category.label}</p>
                </GlassCard>
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}