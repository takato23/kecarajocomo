'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, X, Check, Loader2, Volume2 } from 'lucide-react';

import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { parseSpanishVoiceInput } from '@/lib/voice/spanishVoiceParser';

interface ParsedItemEditable {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  location?: string;
  confidence: number;
}

interface DiscreteVoiceButtonProps {
  onItemsConfirmed: (items: ParsedItemEditable[]) => void;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export function DiscreteVoiceButton({ 
  onItemsConfirmed,
  position = 'bottom-right' 
}: DiscreteVoiceButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [editableItems, setEditableItems] = useState<ParsedItemEditable[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  
  const {
    isRecording,
    transcript,
    interimTranscript,
    error,
    startRecording,
    stopRecording,
    clearTranscript,
  } = useVoiceRecording({
    continuous: true,
    interimResults: true,
    language: 'es-AR', // Spanish Argentina
    maxSilenceDuration: 2000,
    autoParse: false,
  });

  // Show tooltip on first render
  useEffect(() => {
    const hasSeenTooltip = localStorage.getItem('voice-tooltip-seen');
    if (!hasSeenTooltip) {
      setShowTooltip(true);
      setTimeout(() => {
        setShowTooltip(false);
        localStorage.setItem('voice-tooltip-seen', 'true');
      }, 5000);
    }
  }, []);

  // Position classes
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-20 right-6',
    'top-left': 'top-20 left-6',
  };

  // Start recording immediately when button is clicked
  const handleButtonClick = async () => {
    if (!isRecording) {
      clearTranscript();
      setEditableItems([]);
      await startRecording();
    }
  };

  // Process transcript when recording stops
  useEffect(() => {
    if (!isRecording && transcript && !showModal) {
      setIsProcessing(true);
      
      // Parse the transcript
      const parsed = parseSpanishVoiceInput(transcript);
      
      if (parsed.items.length > 0) {
        setEditableItems(parsed.items.map(item => ({
          ...item,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          category: item.category,
          location: item.location || 'despensa',
          confidence: item.confidence
        })));
        setShowModal(true);
      }
      
      setIsProcessing(false);
    }
  }, [isRecording, transcript, showModal]);

  // Handle item field changes
  const handleItemChange = (index: number, field: keyof ParsedItemEditable, value: string | number) => {
    setEditableItems(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: field === 'quantity' ? parseFloat(value as string) || 0 : value
      };
      return updated;
    });
  };

  // Remove item
  const handleRemoveItem = (index: number) => {
    setEditableItems(prev => prev.filter((_, i) => i !== index));
  };

  // Confirm and save items
  const handleConfirm = () => {
    onItemsConfirmed(editableItems);
    setShowModal(false);
    clearTranscript();
    setEditableItems([]);
  };

  // Cancel
  const handleCancel = () => {
    setShowModal(false);
    clearTranscript();
    setEditableItems([]);
  };

  return (
    <>
      {/* Floating Button */}
      <motion.div
        className={`fixed ${positionClasses[position]} z-[9999]`}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          type: "spring",
          stiffness: 260,
          damping: 20,
          delay: 0.1 
        }}
      >
        <div className="relative">
          {/* Main Button */}
          <motion.button
            onClick={handleButtonClick}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className={`w-20 h-20 rounded-full shadow-2xl flex items-center justify-center cursor-pointer ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
            } transition-all duration-300 border-4 border-white ring-4 ring-purple-500/30`}
            animate={isRecording ? { 
              boxShadow: [
                "0 0 0 0 rgba(239, 68, 68, 0.4)",
                "0 0 0 20px rgba(239, 68, 68, 0)",
              ]
            } : {
              boxShadow: [
                "0 0 0 0 rgba(168, 85, 247, 0.4)",
                "0 0 0 15px rgba(168, 85, 247, 0)",
              ]
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 2,
              ease: "easeInOut"
            }}
          >
            {isRecording ? (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                <Volume2 className="w-7 h-7 text-white" />
              </motion.div>
            ) : (
              <Mic className="w-8 h-8 text-white" />
            )}
          </motion.button>

          {/* Recording Ripple Effect */}
          {isRecording && (
            <>
              <motion.div
                className="absolute inset-0 rounded-full bg-red-400"
                animate={{ 
                  scale: [1, 2],
                  opacity: [0.3, 0] 
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 2,
                  ease: "easeOut"
                }}
              />
              <motion.div
                className="absolute inset-0 rounded-full bg-red-400"
                animate={{ 
                  scale: [1, 2],
                  opacity: [0.3, 0] 
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 2,
                  delay: 0.5,
                  ease: "easeOut"
                }}
              />
            </>
          )}

          {/* Processing indicator */}
          {isProcessing && (
            <div className="absolute inset-0 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center">
              <Loader2 className="w-7 h-7 text-purple-500 animate-spin" />
            </div>
          )}

          {/* Tooltip on first use */}
          {showTooltip && !isRecording && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.8 }}
              className="absolute bottom-full mb-3 right-0 bg-black/90 text-white text-sm px-4 py-2 rounded-lg whitespace-nowrap"
            >
              <div className="font-medium">¡Hola! 👋</div>
              <div className="text-xs opacity-90">Tocá para agregar productos por voz</div>
              <div className="absolute bottom-0 right-6 transform translate-y-1/2 rotate-45 w-2 h-2 bg-black/90"></div>
            </motion.div>
          )}

          {/* Live transcript preview */}
          {isRecording && (transcript || interimTranscript) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-full mb-3 right-0 bg-black/90 backdrop-blur-md text-white text-sm px-4 py-3 rounded-lg max-w-xs"
            >
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5 animate-pulse" />
                <div>{interimTranscript || transcript}</div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                <h2 className="text-2xl font-bold">Confirmar productos</h2>
                <p className="text-purple-100 text-sm mt-1">
                  Revisá y editá los productos antes de agregarlos
                </p>
              </div>

              {/* Items list */}
              <div className="p-6 max-h-[50vh] overflow-y-auto">
                {editableItems.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🤔</div>
                    <p className="text-gray-500">
                      No detecté ningún producto
                    </p>
                    <p className="text-gray-400 text-sm mt-2">
                      Intentá hablar más claro o más cerca del micrófono
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {editableItems.map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100"
                      >
                        {/* Product name */}
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            placeholder="Nombre del producto"
                          />
                          <button
                            onClick={() => handleRemoveItem(index)}
                            className="p-2.5 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Quantity and unit */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">Cantidad</label>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                              placeholder="Cantidad"
                              step="0.1"
                              min="0"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">Unidad</label>
                            <select
                              value={item.unit}
                              onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            >
                              <option value="pcs">Unidades</option>
                              <option value="kg">Kilogramos</option>
                              <option value="g">Gramos</option>
                              <option value="L">Litros</option>
                              <option value="ml">Mililitros</option>
                              <option value="docena">Docena</option>
                              <option value="pack">Paquete</option>
                              <option value="bag">Bolsa</option>
                              <option value="box">Caja</option>
                              <option value="can">Lata</option>
                            </select>
                          </div>
                        </div>

                        {/* Category and Location */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">Categoría</label>
                            <select
                              value={item.category}
                              onChange={(e) => handleItemChange(index, 'category', e.target.value)}
                              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            >
                              <option value="frutas">🍎 Frutas y Verduras</option>
                              <option value="carnes">🥩 Carnes y Pescados</option>
                              <option value="lácteos">🥛 Lácteos y Huevos</option>
                              <option value="panadería">🍞 Panadería</option>
                              <option value="despensa">🥫 Despensa</option>
                              <option value="bebidas">🥤 Bebidas</option>
                              <option value="limpieza">🧹 Limpieza</option>
                              <option value="congelados">🧊 Congelados</option>
                              <option value="otros">📦 Otros</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">Ubicación</label>
                            <select
                              value={item.location}
                              onChange={(e) => handleItemChange(index, 'location', e.target.value)}
                              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            >
                              <option value="despensa">🏠 Despensa</option>
                              <option value="refrigerador">❄️ Heladera</option>
                              <option value="congelador">🧊 Freezer</option>
                              <option value="otro">📦 Otro</option>
                            </select>
                          </div>
                        </div>

                        {/* Confidence indicator */}
                        {item.confidence < 0.8 && (
                          <div className="text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg flex items-center gap-2">
                            <span>⚠️</span>
                            <span>Verificá que los datos sean correctos</span>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
                <button
                  onClick={handleCancel}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-all font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={editableItems.length === 0}
                  className={`px-6 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    editableItems.length === 0
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                  }`}
                >
                  <Check className="w-5 h-5" />
                  Agregar {editableItems.length} {editableItems.length === 1 ? 'producto' : 'productos'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error toast */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-24 ${position.includes('right') ? 'right-6' : 'left-6'} bg-red-500 text-white px-4 py-3 rounded-lg shadow-xl backdrop-blur-sm`}
          >
            <div className="flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}