'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Settings } from 'lucide-react';
import { toast } from 'sonner';

import { iOS26EnhancedCard } from '@/components/ios26/iOS26EnhancedCard';
import { iOS26LiquidButton } from '@/components/ios26/iOS26LiquidButton';

interface UserPreferencesModalProps {
  onClose: () => void;
}

export function UserPreferencesModal({ onClose }: UserPreferencesModalProps) {
  const handleSave = () => {
    toast.success('Preferencias guardadas');
    onClose();
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
          className="w-full max-w-md"
        >
          <iOS26EnhancedCard
            variant="aurora"
            elevation="floating"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <Settings className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Preferencias
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
            <div className="px-6 py-4">
              <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                Configuración de preferencias en desarrollo...
              </p>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/10 flex justify-end gap-3">
              <iOS26LiquidButton
                variant="glass"
                onClick={onClose}
              >
                Cancelar
              </iOS26LiquidButton>
              <iOS26LiquidButton
                variant="solid"
                leftIcon={<Save className="w-4 h-4" />}
                onClick={handleSave}
                className="bg-gradient-to-r from-blue-500 to-purple-500"
              >
                Guardar
              </iOS26LiquidButton>
            </div>
          </iOS26EnhancedCard>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}