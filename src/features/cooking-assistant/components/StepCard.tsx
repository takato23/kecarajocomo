'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  Clock, 
  Thermometer, 
  Lightbulb, 
  Timer,
  Play,
  SkipForward,
  MessageSquare
} from 'lucide-react';

import { cn } from '@/lib/utils';

import { CookingStep } from '../types';

import { GlassCard } from '@/components/dashboard/DashboardLayout';

interface StepCardProps {
  step: CookingStep;
  isActive?: boolean;
  onComplete?: () => void;
  onSkip?: () => void;
  onAddNote?: (note: string) => void;
  onStartTimer?: () => void;
}

export function StepCard({ 
  step, 
  isActive = false, 
  onComplete, 
  onSkip, 
  onAddNote, 
  onStartTimer 
}: StepCardProps) {
  const [showNotes, setShowNotes] = useState(false);
  const [noteText, setNoteText] = useState(step.notes || '');
  const [showTips, setShowTips] = useState(false);

  const handleSaveNote = () => {
    if (noteText.trim() && onAddNote) {
      onAddNote(noteText.trim());
      setShowNotes(false);
    }
  };

  const getStatusColor = () => {
    switch (step.status) {
      case 'completed':
        return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'active':
        return 'text-purple-400 bg-purple-500/20 border-purple-500/30';
      case 'skipped':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getStatusIcon = () => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5" />;
      case 'active':
        return <Play className="w-5 h-5" />;
      case 'skipped':
        return <SkipForward className="w-5 h-5" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-current" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <GlassCard className={cn(
        "relative overflow-hidden transition-all duration-300",
        isActive && "ring-2 ring-purple-500/50 shadow-lg shadow-purple-500/20"
      )}>
        {/* Step header */}
        <div className="flex items-start gap-4 mb-4">
          <div className={cn(
            "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all",
            getStatusColor()
          )}>
            {getStatusIcon()}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-white">
                Step {step.step_number}
              </h3>
              {step.status === 'completed' && (
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                  Completed
                </span>
              )}
              {step.status === 'skipped' && (
                <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full">
                  Skipped
                </span>
              )}
            </div>
            
            {/* Time and temperature indicators */}
            <div className="flex items-center gap-4 text-sm text-gray-400">
              {step.time_minutes && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{step.time_minutes} min</span>
                </div>
              )}
              {step.temperature && (
                <div className="flex items-center gap-1">
                  <Thermometer className="w-4 h-4" />
                  <span>
                    {step.temperature.value}°{step.temperature.unit === 'celsius' ? 'C' : 'F'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Step instruction */}
        <div className="mb-4">
          <p className="text-white leading-relaxed text-lg">
            {step.instruction}
          </p>
        </div>

        {/* Step image */}
        {step.image_url && (
          <div className="mb-4">
            <img 
              src={step.image_url} 
              alt={`Step ${step.step_number}`}
              className="w-full h-48 object-cover rounded-lg"
            />
          </div>
        )}

        {/* Tips section */}
        {step.tips && step.tips.length > 0 && (
          <div className="mb-4">
            <button
              onClick={() => setShowTips(!showTips)}
              className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              <Lightbulb className="w-4 h-4" />
              <span>{showTips ? 'Hide' : 'Show'} Tips ({step.tips.length})</span>
            </button>
            
            {showTips && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg"
              >
                <ul className="space-y-1">
                  {step.tips.map((tip, index) => (
                    <li key={index} className="text-sm text-blue-300 flex items-start gap-2">
                      <span className="text-blue-400 mt-1">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </div>
        )}

        {/* Notes section */}
        {step.notes && (
          <div className="mb-4 p-3 bg-gray-500/10 border border-gray-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400">Your Notes</span>
            </div>
            <p className="text-sm text-gray-300">{step.notes}</p>
          </div>
        )}

        {/* Action buttons */}
        {isActive && step.status !== 'completed' && (
          <div className="flex flex-wrap gap-2">
            {/* Timer button */}
            {step.time_minutes && onStartTimer && (
              <button
                onClick={onStartTimer}
                className="flex items-center gap-2 px-3 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-lg transition-colors text-sm"
              >
                <Timer className="w-4 h-4" />
                Start Timer
              </button>
            )}
            
            {/* Add note button */}
            <button
              onClick={() => setShowNotes(!showNotes)}
              className="flex items-center gap-2 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors text-sm"
            >
              <MessageSquare className="w-4 h-4" />
              Add Note
            </button>
            
            {/* Complete button */}
            {onComplete && (
              <button
                onClick={onComplete}
                className="flex items-center gap-2 px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors text-sm"
              >
                <CheckCircle className="w-4 h-4" />
                Complete
              </button>
            )}
            
            {/* Skip button */}
            {onSkip && (
              <button
                onClick={onSkip}
                className="flex items-center gap-2 px-3 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg transition-colors text-sm"
              >
                <SkipForward className="w-4 h-4" />
                Skip
              </button>
            )}
          </div>
        )}

        {/* Notes input */}
        {showNotes && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-3 bg-gray-500/10 border border-gray-500/20 rounded-lg"
          >
            <label className="block text-sm text-gray-400 mb-2">
              Add a note for this step:
            </label>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="w-full p-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              rows={3}
              placeholder="e.g., Used less salt than specified..."
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleSaveNote}
                className="px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded text-sm transition-colors"
              >
                Save Note
              </button>
              <button
                onClick={() => setShowNotes(false)}
                className="px-3 py-1 bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 rounded text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}

        {/* Progress indicator for active step */}
        {isActive && (
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 animate-pulse" />
        )}
      </GlassCard>
    </motion.div>
  );
}

export default StepCard;