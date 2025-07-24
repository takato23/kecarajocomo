'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, Info } from 'lucide-react';

import { VoiceRecorder } from '@/components/voice/VoiceRecorder';
import { parseSpanishVoiceInput } from '@/lib/voice/spanishVoiceParser';

export default function VoiceDemo() {
  const [parsedItems, setParsedItems] = useState<any[]>([]);
  const [rawTranscript, setRawTranscript] = useState('');

  const handleVoiceComplete = (transcript: string) => {
    setRawTranscript(transcript);
    const result = parseSpanishVoiceInput(transcript);
    setParsedItems(result.items);
  };

  const examples = [
    '1 kilo de milanesa',
    'una docena de huevos',
    'medio kilo de queso',
    '2 litros de leche',
    '3 manzanas y 2 bananas',
    'un cuarto de manteca',
    'dos paquetes de fideos',
    'media docena de facturas',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Mic className="w-8 h-8 text-purple-500" />
            Demo de Reconocimiento de Voz
          </h1>
          <p className="text-gray-600">
            Prueba el sistema de reconocimiento de voz en español para agregar productos a tu despensa
          </p>
        </div>

        {/* Examples */}
        <div className="mb-8 bg-white/80 backdrop-blur-md rounded-xl border border-white/20 shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-500" />
            Ejemplos de frases que puedes decir:
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {examples.map((example, index) => (
              <div
                key={index}
                className="px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-700"
              >
                "{example}"
              </div>
            ))}
          </div>
        </div>

        {/* Voice Recorder */}
        <div className="mb-8">
          <VoiceRecorder
            onComplete={handleVoiceComplete}
            onInterimResult={setRawTranscript}
          />
        </div>

        {/* Raw Transcript */}
        {rawTranscript && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-white/80 backdrop-blur-md rounded-xl border border-white/20 shadow-lg p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Transcripción:
            </h3>
            <p className="text-gray-700 italic">"{rawTranscript}"</p>
          </motion.div>
        )}

        {/* Parsed Results */}
        {parsedItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 backdrop-blur-md rounded-xl border border-white/20 shadow-lg p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Productos detectados:
            </h3>
            <div className="space-y-3">
              {parsedItems.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {item.name}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                      <span>Cantidad: {item.quantity} {item.unit}</span>
                      <span className="px-2 py-0.5 bg-white rounded-full text-xs">
                        {item.category}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      Confianza: {Math.round(item.confidence * 100)}%
                    </p>
                    {item.location && (
                      <p className="text-xs text-gray-400 mt-1">
                        📍 {item.location}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}