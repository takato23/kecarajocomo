'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, X, Check, Loader2, Volume2, MicOff } from 'lucide-react';

import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { parseSpanishVoiceInput } from '@/lib/voice/spanishVoiceParser';

interface ParsedItemEditable {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  location?: string;
  confidence: number;
}

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemsConfirmed: (items: ParsedItemEditable[]) => void;
}

export function VoiceModal({ 
  isOpen,
  onClose,
  onItemsConfirmed,
}: VoiceModalProps) {
  const [editableItems, setEditableItems] = useState<ParsedItemEditable[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showEditScreen, setShowEditScreen] = useState(false);
  const [permissionRequested, setPermissionRequested] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [useManualInput, setUseManualInput] = useState(false);
  
  const {
    isListening,
    transcript,
    error,
    audioLevel,
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
  } = useVoiceRecognition({
    language: 'es-AR',
    continuous: true,
    interimResults: true,
    onResult: (result) => {
      // Handle interim results if needed
      if (!result.isFinal && result.transcript) {
        setInterimTranscript(result.transcript);
      }
    },
  });

  const [interimTranscript, setInterimTranscript] = useState('');

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      resetTranscript();
      setInterimTranscript('');
      setEditableItems([]);
      setShowEditScreen(false);
      setPermissionRequested(false);
      setManualInput('');
      setUseManualInput(false);
    }
  }, [isOpen, resetTranscript]);

  // Handle start recording with permission request
  const handleStartRecording = () => {
    if (!isSupported) {
      setUseManualInput(true);
      return;
    }
    setPermissionRequested(true);
    startListening();
  };

  // Process transcript when recording stops
  useEffect(() => {
    if (!isListening && transcript && isOpen && !showEditScreen) {
      setIsProcessing(true);
      
      // Parse the transcript
      const parsed = parseSpanishVoiceInput(transcript);
      
      if (parsed && parsed.items && parsed.items.length > 0) {
        setEditableItems(parsed.items.map(item => ({
          ...item,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          category: item.category,
          location: item.location || 'despensa',
          confidence: item.confidence
        })));
        setShowEditScreen(true);
      }
      
      setIsProcessing(false);
    }
  }, [isListening, transcript, isOpen, showEditScreen]);

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
    handleClose();
  };

  // Close modal
  const handleClose = () => {
    stopListening();
    resetTranscript();
    setInterimTranscript('');
    setEditableItems([]);
    setShowEditScreen(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onClick={(e) => e.target === e.currentTarget && handleClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden"
        >
          {!showEditScreen ? (
            <>
              {/* Recording Screen */}
              <div className="p-8 text-center">
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>

                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {isListening ? 'Escuchando...' : 
                   isProcessing ? 'Procesando...' : 
                   'Agregar productos por voz'}
                </h2>

                {/* Microphone Animation */}
                <div className="relative w-32 h-32 mx-auto mb-6">
                  {!permissionRequested ? (
                    <motion.button
                      onClick={handleStartRecording}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-full h-full rounded-full bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 flex items-center justify-center cursor-pointer shadow-xl"
                    >
                      <Mic className="w-12 h-12 text-white" />
                    </motion.button>
                  ) : (
                    <motion.div
                      className={`absolute inset-0 rounded-full ${
                        isListening ? 'bg-red-500' : 
                        isProcessing ? 'bg-purple-500' : 'bg-gray-300'
                      } flex items-center justify-center`}
                      animate={isListening ? {
                        scale: [1, 1.1, 1],
                      } : {}}
                      transition={{
                        repeat: Infinity,
                        duration: 1.5,
                      }}
                    >
                      {isListening ? (
                        <Volume2 className="w-12 h-12 text-white" />
                      ) : isProcessing ? (
                        <Loader2 className="w-12 h-12 text-white animate-spin" />
                      ) : (
                        <MicOff className="w-12 h-12 text-white" />
                      )}
                    </motion.div>
                  )}

                  {/* Recording Ripples */}
                  {isListening && (
                    <>
                      <motion.div
                        className="absolute inset-0 rounded-full border-4 border-red-500"
                        animate={{
                          scale: [1, 1.5],
                          opacity: [0.5, 0],
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 1.5,
                        }}
                      />
                      <motion.div
                        className="absolute inset-0 rounded-full border-4 border-red-500"
                        animate={{
                          scale: [1, 1.5],
                          opacity: [0.5, 0],
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 1.5,
                          delay: 0.5,
                        }}
                      />
                    </>
                  )}
                </div>

                {/* Transcript */}
                {(transcript || interimTranscript) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-gray-100 rounded-lg"
                  >
                    <p className="text-gray-700">
                      {interimTranscript || transcript}
                    </p>
                  </motion.div>
                )}

                {/* Instructions */}
                <p className="text-gray-600 text-sm">
                  {!permissionRequested 
                    ? 'Tocá el micrófono para empezar a grabar'
                    : isListening 
                      ? 'Decí los productos que querés agregar, por ejemplo: "2 kilos de tomate y una docena de huevos"'
                      : isProcessing
                        ? 'Procesando lo que dijiste...'
                        : 'Esperando...'
                  }
                </p>

                {/* Stop Button */}
                {isListening && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={stopListening}
                    className="mt-6 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                  >
                    Detener
                  </motion.button>
                )}

                {/* Manual Input Option */}
                {!isListening && (error || !permissionRequested || !isSupported) && (
                  <div className="mt-6">
                    <button
                      onClick={() => setUseManualInput(!useManualInput)}
                      className="text-sm text-purple-600 hover:text-purple-700 underline"
                    >
                      {useManualInput ? (isSupported ? 'Volver a intentar con voz' : 'Voz no soportada') : 'Escribir manualmente'}
                    </button>
                  </div>
                )}

                {/* Manual Input Field */}
                {useManualInput && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4"
                  >
                    <textarea
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value)}
                      placeholder="Escribí los productos que querés agregar, por ejemplo: '2 kilos de tomate y una docena de huevos'"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                      rows={3}
                    />
                    <button
                      onClick={() => {
                        if (manualInput.trim()) {
                          const parsed = parseSpanishVoiceInput(manualInput);
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
                            setShowEditScreen(true);
                          }
                        }
                      }}
                      disabled={!manualInput.trim()}
                      className="mt-3 w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Procesar texto
                    </button>
                  </motion.div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Edit Screen */}
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
                  onClick={handleClose}
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
            </>
          )}

          {/* Error handling */}
          {error && (
            <div className="p-4 bg-red-50 border-t border-red-200">
              <p className="text-red-600 text-sm flex items-center gap-2">
                <span>⚠️</span>
                {error}
              </p>
              {(error.includes('micrófono') || error.includes('permisos')) && (
                <div className="mt-3 text-xs text-gray-600 space-y-2">
                  <p className="font-semibold">Para usar el reconocimiento de voz:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Asegurate de estar usando HTTPS (https://...)</li>
                    <li>Permitir acceso al micrófono cuando el navegador lo solicite</li>
                    <li>Si estás en desarrollo local, usá https://localhost o ngrok</li>
                    <li>Verificá la configuración de permisos del navegador</li>
                  </ul>
                  <p className="mt-2">
                    <strong>Alternativa:</strong> Podés escribir los productos manualmente arriba.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Not supported warning */}
          {!isSupported && (
            <div className="p-4 bg-amber-50 border-t border-amber-200">
              <p className="text-amber-700 text-sm flex items-center gap-2">
                <span>ℹ️</span>
                Tu navegador no soporta reconocimiento de voz. Usá la entrada manual.
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}