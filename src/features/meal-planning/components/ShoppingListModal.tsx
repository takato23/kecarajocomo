'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, Download, Share2 } from 'lucide-react';
import { toast } from 'sonner';

import { iOS26EnhancedCard } from '@/components/ios26/iOS26EnhancedCard';
import { iOS26LiquidButton } from '@/components/ios26/iOS26LiquidButton';

interface ShoppingListModalProps {
  onClose: () => void;
}

export function ShoppingListModal({ onClose }: ShoppingListModalProps) {
  const handleExport = () => {
    toast.success('Lista de compras exportada');
  };

  const handleShare = () => {
    toast.success('Lista de compras compartida');
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg"
        >
          <iOS26EnhancedCard
            variant="aurora"
            elevation="floating"
            className="max-h-[80vh] overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Lista de Compras
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-4 max-h-[50vh] overflow-y-auto">
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <ShoppingCart className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Lista vacía
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Agrega comidas a tu planificador para generar una lista de compras automáticamente.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/10 flex justify-between">
              <div className="flex gap-2">
                <iOS26LiquidButton
                  variant="glass"
                  icon={<Download className="w-4 h-4" />}
                  iconPosition="left"
                  onClick={handleExport}
                  size="sm"
                >
                  Exportar
                </iOS26LiquidButton>
                <iOS26LiquidButton
                  variant="glass"
                  icon={<Share2 className="w-4 h-4" />}
                  iconPosition="left"
                  onClick={handleShare}
                  size="sm"
                >
                  Compartir
                </iOS26LiquidButton>
              </div>
              <iOS26LiquidButton
                variant="primary"
                onClick={onClose}
                className="bg-gradient-to-r from-green-500 to-blue-500"
              >
                Cerrar
              </iOS26LiquidButton>
            </div>
          </iOS26EnhancedCard>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}