'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

import { cn } from '@/lib/utils';

interface VoiceControlsProps {
  isListening: boolean;
  isSpeaking: boolean;
  onStartListening: () => void;
  onStopListening: () => void;
  onSpeakStep: () => void;
}

export function VoiceControls({
  isListening,
  isSpeaking,
  onStartListening,
  onStopListening,
  onSpeakStep
}: VoiceControlsProps) {
  return (
    <div className="flex items-center gap-2">
      {/* Microphone button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={isListening ? onStopListening : onStartListening}
        className={cn(
          "p-2 rounded-lg transition-all duration-200",
          isListening 
            ? "bg-green-500/20 hover:bg-green-500/30 text-green-400" 
            : "bg-gray-500/20 hover:bg-gray-500/30 text-gray-400"
        )}
      >
        {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
      </motion.button>

      {/* Speak button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onSpeakStep}
        disabled={isSpeaking}
        className={cn(
          "p-2 rounded-lg transition-all duration-200",
          isSpeaking 
            ? "bg-blue-500/20 text-blue-400 cursor-not-allowed" 
            : "bg-gray-500/20 hover:bg-gray-500/30 text-gray-400"
        )}
      >
        {isSpeaking ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
      </motion.button>

      {/* Status indicator */}
      <div className="flex items-center gap-1">
        {isListening && (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="w-2 h-2 bg-green-400 rounded-full"
          />
        )}
        {isSpeaking && (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            className="w-2 h-2 bg-blue-400 rounded-full"
          />
        )}
      </div>
    </div>
  );
}

export default VoiceControls;