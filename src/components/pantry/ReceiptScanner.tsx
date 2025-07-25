'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Camera, Upload, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

import { UnifiedAIService } from '@/services/ai';
import type { ParsedReceipt } from '@/services/ai/types';
import { usePantryActions } from '@/store';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface ReceiptScannerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptScanner = React.memo<ReceiptScannerProps>(({
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();
  const { addPantryItem } = usePantryActions();
  
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState<ParsedReceipt | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleImageCapture = useCallback(async (file: File) => {
    try {
      setError(null);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Convert to base64 for Gemini
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });

      setIsScanning(true);
      const aiService = UnifiedAIService.getInstance();
      const receiptData = await aiService.parseReceipt({ image: base64 });
      
      if (receiptData && receiptData.items && receiptData.items.length > 0) {
        setScannedData(receiptData);
        // Select all items by default
        setSelectedItems(new Set(receiptData.items.map((_, index) => index)));
      } else {
        throw new Error('No se pudieron extraer productos del ticket');
      }
    } catch (err: any) {
      setError(err.message || 'Error al procesar el ticket');
    } finally {
      setIsScanning(false);
    }
  }, []);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageCapture(file);
    }
  }, [handleImageCapture]);

  const handleCameraCapture = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageCapture(file);
    }
  }, [handleImageCapture]);

  const toggleItemSelection = useCallback((index: number) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  }, []);

  const handleAddToPantry = useCallback(async () => {
    if (!scannedData || !user) return;

    setIsScanning(true);
    try {
      // Add selected items to pantry
      for (let i = 0; i < scannedData.items.length; i++) {
        if (selectedItems.has(i)) {
          const item = scannedData.items[i];
          await addPantryItem({
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            category: item.category || 'otros',
            purchaseDate: scannedData.date ? new Date(scannedData.date).toISOString() : new Date().toISOString(),
            price: item.price,
            userId: user.id
          });
        }
      }
      
      // Close modal after successful addition
      onClose();
      
      // Reset state
      setScannedData(null);
      setSelectedItems(new Set());
      setImagePreview(null);
    } catch (err: any) {
      setError('Error al agregar productos a la despensa');
    } finally {
      setIsScanning(false);
    }
  }, [scannedData, selectedItems, user, addItem, onClose]);

  const handleReset = useCallback(() => {
    setScannedData(null);
    setSelectedItems(new Set());
    setImagePreview(null);
    setError(null);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Camera className="w-8 h-8" />
              Escanear Ticket de Compra
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="mt-2 text-purple-100">
            Sube o toma una foto de tu ticket para agregar productos automáticamente
          </p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {!scannedData && !isScanning && (
            <div className="space-y-6">
              {/* Upload Options */}
              <div className="grid grid-cols-2 gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => cameraInputRef.current?.click()}
                  className="p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all group"
                >
                  <Camera className="w-12 h-12 text-gray-400 group-hover:text-purple-500 mx-auto mb-3" />
                  <p className="text-gray-600 group-hover:text-purple-700 font-medium">
                    Tomar Foto
                  </p>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => fileInputRef.current?.click()}
                  className="p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-pink-500 hover:bg-pink-50 transition-all group"
                >
                  <Upload className="w-12 h-12 text-gray-400 group-hover:text-pink-500 mx-auto mb-3" />
                  <p className="text-gray-600 group-hover:text-pink-700 font-medium">
                    Subir Imagen
                  </p>
                </motion.button>
              </div>

              {/* Hidden inputs */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleCameraCapture}
                className="hidden"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* Image Preview */}
              {imagePreview && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2">Vista Previa</h3>
                  <img
                    src={imagePreview}
                    alt="Receipt preview"
                    className="max-w-full h-auto rounded-lg shadow-md"
                  />
                </div>
              )}

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg"
                >
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <p className="text-red-700">{error}</p>
                </motion.div>
              )}
            </div>
          )}

          {/* Scanning State */}
          {isScanning && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
              <p className="text-gray-600 text-lg">Analizando ticket con IA...</p>
              <p className="text-gray-500 text-sm mt-2">Esto puede tomar unos segundos</p>
            </div>
          )}

          {/* Scanned Results */}
          {scannedData && !isScanning && (
            <div className="space-y-6">
              {/* Receipt Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Información del Ticket</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {scannedData.store && (
                    <div>
                      <span className="text-gray-600">Tienda:</span>
                      <span className="ml-2 font-medium">{scannedData.store}</span>
                    </div>
                  )}
                  {scannedData.date && (
                    <div>
                      <span className="text-gray-600">Fecha:</span>
                      <span className="ml-2 font-medium">
                        {new Date(scannedData.date).toLocaleDateString('es-AR')}
                      </span>
                    </div>
                  )}
                  {scannedData.total && (
                    <div>
                      <span className="text-gray-600">Total:</span>
                      <span className="ml-2 font-medium">${scannedData.total.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Scanned Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">
                    Productos Detectados ({scannedData.items.length})
                  </h3>
                  <button
                    onClick={() => {
                      if (selectedItems.size === scannedData.items.length) {
                        setSelectedItems(new Set());
                      } else {
                        setSelectedItems(new Set(scannedData.items.map((_, i) => i)));
                      }
                    }}
                    className="text-sm text-purple-600 hover:text-purple-700"
                  >
                    {selectedItems.size === scannedData.items.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                  </button>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {scannedData.items.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                        selectedItems.has(index)
                          ? 'bg-purple-50 border-purple-300'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => toggleItemSelection(index)}
                    >
                      <div className="flex-shrink-0">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          selectedItems.has(index)
                            ? 'bg-purple-500 border-purple-500'
                            : 'border-gray-300'
                        }`}>
                          {selectedItems.has(index) && (
                            <CheckCircle className="w-3 h-3 text-white" />
                          )}
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{item.quantity} {item.unit}</span>
                          {item.price && <span>${item.price.toFixed(2)}</span>}
                          {item.category && (
                            <span className="px-2 py-0.5 bg-gray-200 rounded-full text-xs">
                              {item.category}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Escanear Otro
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddToPantry}
                  disabled={selectedItems.size === 0}
                  className={`flex-1 px-6 py-2 rounded-lg font-medium transition-all ${
                    selectedItems.size === 0
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
                  }`}
                >
                  Agregar {selectedItems.size} productos a la despensa
                </motion.button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
});

ReceiptScanner.displayName = 'ReceiptScanner';