'use client';

// EJEMPLO DE MODAL DE STATUS ESTILO DARK MODE DEMO
// Este es el patrón que usamos para el DarkModeDemo que te gustó
// Puedes usar este ejemplo como base para crear otros modales similares

import React from 'react';
import { motion } from 'framer-motion';
import { Check, X, AlertCircle, Info } from 'lucide-react';
import { GlassCard } from './GlassCard';

interface StatusModalProps {
  title: string;
  subtitle?: string;
  items?: Array<{
    label: string;
    value?: string | number;
    status?: 'success' | 'error' | 'warning' | 'info';
    done?: boolean;
  }>;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  footer?: React.ReactNode;
}

export function StatusModal({ 
  title, 
  subtitle,
  items = [], 
  position = 'bottom-right',
  footer 
}: StatusModalProps) {
  // Mapeo de posiciones
  const positions = {
    'bottom-right': 'bottom-24 right-8',
    'bottom-left': 'bottom-24 left-8',
    'top-right': 'top-24 right-8',
    'top-left': 'top-24 left-8',
  };

  // Iconos según el status
  const getStatusIcon = (status?: string, done?: boolean) => {
    if (done !== undefined) {
      return done ? (
        <Check className="w-4 h-4 text-green-500" />
      ) : (
        <X className="w-4 h-4 text-red-500" />
      );
    }

    switch (status) {
      case 'success':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'error':
        return <X className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />;
      default:
        return null;
    }
  };

  // Colores de valor según status
  const getValueColor = (status?: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 dark:text-green-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'info':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'dark:text-white';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={`fixed ${positions[position]} z-40 w-80`}
    >
      <GlassCard variant="strong" className="p-6">
        {/* Header */}
        <h3 className="text-lg font-semibold mb-1 dark:text-white">
          {title}
        </h3>
        {subtitle && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {subtitle}
          </p>
        )}
        
        {/* Items con animación escalonada */}
        {items.length > 0 && (
          <div className="space-y-2 mb-4">
            {items.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2">
                  {getStatusIcon(item.status, item.done)}
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {item.label}
                  </span>
                </div>
                {item.value !== undefined && (
                  <span className={`text-sm font-medium ${getValueColor(item.status)}`}>
                    {item.value}
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Footer opcional */}
        {footer && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            {footer}
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
}

// Ejemplo de uso:
/*
<StatusModal
  title="Estado del Sistema"
  subtitle="Monitoreo en tiempo real"
  items={[
    { label: 'Servidor', status: 'success', value: 'Online' },
    { label: 'Base de datos', status: 'success', value: '98%' },
    { label: 'API Externa', status: 'warning', value: 'Lenta' },
    { label: 'Cache', done: true },
    { label: 'CDN', done: true },
    { label: 'SSL', status: 'info', value: 'Válido' },
  ]}
  position="bottom-right"
  footer={
    <p className="text-xs text-gray-500 dark:text-gray-400">
      Última actualización: hace 2 min
    </p>
  }
/>
*/

// VARIANTE CON BARRA DE PROGRESO
export function ProgressStatusModal({ 
  title, 
  progress = 0,
  items = [],
  position = 'bottom-right' 
}: StatusModalProps & { progress?: number }) {
  const positions = {
    'bottom-right': 'bottom-24 right-8',
    'bottom-left': 'bottom-24 left-8',
    'top-right': 'top-24 right-8',
    'top-left': 'top-24 left-8',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`fixed ${positions[position]} z-40 w-80`}
    >
      <GlassCard variant="strong" className="p-6">
        <h3 className="text-lg font-semibold mb-4 dark:text-white">
          {title}
        </h3>

        {/* Barra de progreso animada */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600 dark:text-gray-400">Progreso</span>
            <span className="font-medium dark:text-white">{progress}%</span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Items */}
        <div className="space-y-2">
          {items.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-2"
            >
              {item.done ? (
                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600 flex-shrink-0" />
              )}
              <span className={`text-sm ${item.done ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}`}>
                {item.label}
              </span>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </motion.div>
  );
}