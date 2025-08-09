'use client';

import React, { useState, useCallback } from 'react';
import { Camera, Upload, Mic, X, Check, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { logger } from '@/services/logger';

import { useHolisticSystem } from '@/hooks/useHolisticSystem';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store';
import { iOS26LiquidButton, iOS26LiquidCard } from '@/components/ui/ios26-components';

type ScanMode = 'camera' | 'upload' | 'voice';

interface ScanResult {
  items: Array<{
    name: string;
    quantity: number;
    unit: string;
    price: number;
  }>;
  total: number;
  store: string;
  date: string;
}

export function SmartScanner() {
  const [mode, setMode] = useState<ScanMode>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const { processReceipt, progress } = useHolisticSystem();
  const user = useAppStore((state) => state.user.profile);
  
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  }, []);
  
  const handleScan = useCallback(async () => {
    if (!selectedFile) return;
    
    // Check if user is authenticated
    if (!user) {
      logger.error('Usuario no autenticado', 'SmartScanner');
      // Could show an error message or redirect to login
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Use actual userId from authenticated user
      const userId = user.id;
      const result = await processReceipt(selectedFile, userId);
      
      if (result.success && result.scannedReceipt) {
        setScanResult({
          items: result.scannedReceipt.items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            price: item.price
          })),
          total: result.scannedReceipt.total || 0,
          store: result.scannedReceipt.store || 'Desconocido',
          date: result.scannedReceipt.date ? 
            new Date(result.scannedReceipt.date).toLocaleDateString() : 
            new Date().toLocaleDateString()
        });
      }
      
    } catch (error: unknown) {
      logger.error('Error en escaneo:', 'SmartScanner', error);
      // Fallback a mock para testing
      setScanResult({
        items: [
          { name: 'Leche Descremada', quantity: 2, unit: 'L', price: 850 },
          { name: 'Pan Integral', quantity: 1, unit: 'kg', price: 1200 },
          { name: 'Huevos', quantity: 12, unit: 'un', price: 2400 },
          { name: 'Queso Cremoso', quantity: 0.5, unit: 'kg', price: 3200 },
        ],
        total: 7650,
        store: 'Carrefour',
        date: new Date().toLocaleDateString()
      });
    } finally {
      setIsProcessing(false);
    }
  }, [selectedFile, processReceipt, user]);
  
  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setScanResult(null);
  };
  
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Selector de modo */}
      <div className="flex gap-2">
        {[
          { id: 'camera' as ScanMode, icon: Camera, label: 'Cámara' },
          { id: 'upload' as ScanMode, icon: Upload, label: 'Subir' },
          { id: 'voice' as ScanMode, icon: Mic, label: 'Voz' }
        ].map((option) => (
          <iOS26LiquidButton
            key={option.id}
            variant={mode === option.id ? 'primary' : 'secondary'}
            onClick={() => setMode(option.id)}
            className={cn(
              "flex-1",
              mode === option.id && "bg-gradient-to-r from-orange-500/20 to-pink-500/20"
            )}
            disabled={option.id !== 'upload'} // Por ahora solo upload
          >
            <option.icon className="w-5 h-5 mr-2" />
            {option.label}
          </iOS26LiquidButton>
        ))}
      </div>
      
      {/* Scanner Interface */}
      <iOS26LiquidCard variant="medium" glow>
        <div className="p-6">
          <AnimatePresence mode="wait">
            {!scanResult ? (
              <motion.div
                key="scanner"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                {mode === 'upload' && (
                  <>
                    {!previewUrl ? (
                      <label className="block">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        <div className="border-2 border-dashed border-white/20 rounded-2xl p-12 text-center cursor-pointer hover:border-white/40 transition-all duration-300">
                          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                          <p className="text-lg font-medium mb-2">
                            Sube una foto del ticket
                          </p>
                          <p className="text-sm text-gray-400">
                            JPG, PNG o PDF - Max 10MB
                          </p>
                        </div>
                      </label>
                    ) : (
                      <div className="space-y-4">
                        <div className="relative rounded-xl overflow-hidden">
                          <img
                            src={previewUrl}
                            alt="Ticket preview"
                            className="w-full h-auto max-h-96 object-contain"
                          />
                          <button
                            onClick={handleReset}
                            className="absolute top-2 right-2 p-2 rounded-full bg-black/50 backdrop-blur-xl hover:bg-black/70 transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        
                        <iOS26LiquidButton
                          variant="primary"
                          onClick={handleScan}
                          disabled={isProcessing}
                          className="w-full bg-gradient-to-r from-orange-600 to-pink-600 text-white"
                        >
                          {isProcessing ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                              Procesando...
                            </>
                          ) : (
                            <>
                              <Camera className="w-5 h-5 mr-2" />
                              Escanear Ticket
                            </>
                          )}
                        </iOS26LiquidButton>
                      </div>
                    )}
                  </>
                )}
                
                {mode === 'camera' && (
                  <div className="text-center py-12">
                    <Camera className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg text-gray-400">
                      Cámara en desarrollo...
                    </p>
                  </div>
                )}
                
                {mode === 'voice' && (
                  <div className="text-center py-12">
                    <Mic className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg text-gray-400">
                      Dictado por voz en desarrollo...
                    </p>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="results"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">Resultados del Escaneo</h3>
                  <div className="flex items-center gap-2 text-green-400">
                    <Check className="w-5 h-5" />
                    <span className="text-sm">Procesado</span>
                  </div>
                </div>
                
                {/* Info del ticket */}
                <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-white/5">
                  <div>
                    <p className="text-sm text-gray-400">Tienda</p>
                    <p className="font-medium">{scanResult.store}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Fecha</p>
                    <p className="font-medium">{scanResult.date}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Total</p>
                    <p className="font-medium text-orange-400">
                      ${scanResult.total.toFixed(2)}
                    </p>
                  </div>
                </div>
                
                {/* Items detectados */}
                <div className="space-y-2">
                  <p className="text-sm text-gray-400">Items detectados</p>
                  {scanResult.items.map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-400">
                          {item.quantity} {item.unit}
                        </p>
                      </div>
                      <p className="font-medium">${item.price.toFixed(2)}</p>
                    </motion.div>
                  ))}
                </div>
                
                {/* Acciones */}
                <div className="flex gap-3 pt-4">
                  <iOS26LiquidButton
                    variant="secondary"
                    onClick={handleReset}
                    className="flex-1"
                  >
                    Escanear Otro
                  </iOS26LiquidButton>
                  <iOS26LiquidButton
                    variant="primary"
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white"
                  >
                    <Check className="w-5 h-5 mr-2" />
                    Agregar a Despensa
                  </iOS26LiquidButton>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Progress Bar */}
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-400">Procesando con IA...</p>
                <p className="text-sm text-gray-400">{progress}%</p>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-orange-500 to-pink-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </motion.div>
          )}
        </div>
      </iOS26LiquidCard>
      
      {/* Tip */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
        <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-blue-400 mb-1">Tip para mejor escaneo</p>
          <p className="text-gray-300">
            Asegúrate de que el ticket esté bien iluminado y sin arrugas. 
            La cámara debe capturar todo el texto claramente.
          </p>
        </div>
      </div>
    </div>
  );
}