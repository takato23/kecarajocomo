'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { iOS26EnhancedCard } from '@/components/ios26/iOS26EnhancedCard';
import { iOS26LiquidButton } from '@/components/ios26/iOS26LiquidButton';

interface MealPlannerErrorProps {
  error: string;
  onRetry?: () => void;
}

export function MealPlannerError({ error, onRetry }: MealPlannerErrorProps) {
  const router = useRouter();

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <iOS26EnhancedCard
          variant="glass"
          elevation="high"
          className="max-w-md w-full p-8 text-center"
        >
          <motion.div
            initial={{ rotate: 0 }}
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 0.5 }}
            className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-3xl flex items-center justify-center mx-auto mb-6"
          >
            <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
          </motion.div>

          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            ¡Ups! Algo salió mal
          </h3>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error || 'Ha ocurrido un error al cargar el planificador de comidas.'}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <iOS26LiquidButton
              variant="solid"
              leftIcon={<RefreshCw className="w-4 h-4" />}
              onClick={onRetry || (() => window.location.reload())}
              className="bg-gradient-to-r from-blue-500 to-purple-500"
            >
              Reintentar
            </iOS26LiquidButton>
            
            <iOS26LiquidButton
              variant="glass"
              leftIcon={<Home className="w-4 h-4" />}
              onClick={() => router.push('/dashboard')}
            >
              Ir al inicio
            </iOS26LiquidButton>
          </div>

          <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800/50 rounded-xl">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Si el problema persiste, por favor contacta con soporte técnico.
            </p>
          </div>
        </iOS26EnhancedCard>
      </motion.div>
    </div>
  );
}