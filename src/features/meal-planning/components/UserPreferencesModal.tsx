'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { X, Settings } from 'lucide-react';

interface UserPreferencesModalProps {
  onClose: () => void;
}

export function UserPreferencesModal({ onClose }: UserPreferencesModalProps) {
  return (
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
        className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl w-full max-w-2xl p-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/20 rounded-xl">
              <Settings className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Preferencias de Usuario
              </h2>
              <p className="text-white/60 text-sm">
                Personaliza tu experiencia de planificación
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6">
          <div className="text-center py-12">
            <Settings className="w-16 h-16 text-white/40 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              Preferencias de Usuario
            </h3>
            <p className="text-white/60 mb-6">
              Esta funcionalidad se implementará próximamente
            </p>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium rounded-xl"
            >
              Cerrar
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}