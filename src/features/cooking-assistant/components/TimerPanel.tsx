'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Timer, 
  Play, 
  Pause, 
  Square, 
  Plus, 
  Trash2, 
  X,
  Clock,
  CheckCircle
} from 'lucide-react';

import { cn } from '@/lib/utils';

import { useCookingAssistantStore } from '../store/cookingAssistantStore';
import { TimerState } from '../types';

import { GlassCard } from '@/components/dashboard/DashboardLayout';

interface TimerPanelProps {
  onClose: () => void;
}

export function TimerPanel({ onClose }: TimerPanelProps) {
  const [newTimerName, setNewTimerName] = useState('');
  const [newTimerMinutes, setNewTimerMinutes] = useState(5);
  const [showAddTimer, setShowAddTimer] = useState(false);

  const {
    timers,
    createTimer,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    deleteTimer,
    updateTimers
  } = useCookingAssistantStore();

  // Update timers every second
  useEffect(() => {
    const interval = setInterval(() => {
      updateTimers();
    }, 1000);

    return () => clearInterval(interval);
  }, [updateTimers]);

  const handleCreateTimer = () => {
    if (newTimerName.trim()) {
      createTimer({
        name: newTimerName.trim(),
        duration_minutes: newTimerMinutes
      });
      setNewTimerName('');
      setNewTimerMinutes(5);
      setShowAddTimer(false);
    }
  };

  const getTimerStateColor = (state: TimerState) => {
    switch (state) {
      case 'running':
        return 'text-green-400 bg-green-500/20';
      case 'paused':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'completed':
        return 'text-blue-400 bg-blue-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getTimerStateIcon = (state: TimerState) => {
    switch (state) {
      case 'running':
        return <Play className="w-4 h-4" />;
      case 'paused':
        return <Pause className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Square className="w-4 h-4" />;
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
  };

  const getProgressPercentage = (timer: any) => {
    if (timer.duration_seconds === 0) return 0;
    return ((timer.duration_seconds - timer.remaining_seconds) / timer.duration_seconds) * 100;
  };

  return (
    <GlassCard className="max-h-[70vh] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Timer className="w-5 h-5 text-orange-400" />
          <h2 className="text-lg font-semibold text-white">Cooking Timers</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Timer list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <AnimatePresence>
          {timers.map((timer) => (
            <motion.div
              key={timer.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={cn(
                "p-4 rounded-lg border transition-all",
                timer.state === 'completed' ? "border-blue-500/30 bg-blue-500/10" :
                timer.state === 'running' ? "border-green-500/30 bg-green-500/10" :
                timer.state === 'paused' ? "border-yellow-500/30 bg-yellow-500/10" :
                "border-gray-500/30 bg-gray-500/10"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "flex items-center justify-center w-6 h-6 rounded-full",
                    getTimerStateColor(timer.state)
                  )}>
                    {getTimerStateIcon(timer.state)}
                  </div>
                  <span className="font-medium text-white">{timer.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  {timer.state === 'idle' && (
                    <button
                      onClick={() => startTimer(timer.id)}
                      className="p-1 rounded hover:bg-white/10 transition-colors"
                    >
                      <Play className="w-4 h-4 text-green-400" />
                    </button>
                  )}
                  {timer.state === 'running' && (
                    <button
                      onClick={() => pauseTimer(timer.id)}
                      className="p-1 rounded hover:bg-white/10 transition-colors"
                    >
                      <Pause className="w-4 h-4 text-yellow-400" />
                    </button>
                  )}
                  {timer.state === 'paused' && (
                    <button
                      onClick={() => resumeTimer(timer.id)}
                      className="p-1 rounded hover:bg-white/10 transition-colors"
                    >
                      <Play className="w-4 h-4 text-green-400" />
                    </button>
                  )}
                  {(timer.state === 'running' || timer.state === 'paused') && (
                    <button
                      onClick={() => stopTimer(timer.id)}
                      className="p-1 rounded hover:bg-white/10 transition-colors"
                    >
                      <Square className="w-4 h-4 text-red-400" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteTimer(timer.id)}
                    className="p-1 rounded hover:bg-white/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>

              {/* Timer display */}
              <div className="text-center mb-2">
                <div className={cn(
                  "text-2xl font-mono font-bold",
                  timer.state === 'completed' ? "text-blue-400" :
                  timer.state === 'running' ? "text-green-400" :
                  timer.state === 'paused' ? "text-yellow-400" :
                  "text-white"
                )}>
                  {formatTime(timer.remaining_seconds)}
                </div>
                <div className="text-sm text-gray-400">
                  {timer.state === 'completed' ? 'Completed!' :
                   timer.state === 'running' ? 'Running' :
                   timer.state === 'paused' ? 'Paused' :
                   'Ready'}
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className={cn(
                    "h-full transition-all duration-1000",
                    timer.state === 'completed' ? "bg-blue-500" :
                    timer.state === 'running' ? "bg-green-500" :
                    timer.state === 'paused' ? "bg-yellow-500" :
                    "bg-gray-500"
                  )}
                  style={{ width: `${getProgressPercentage(timer)}%` }}
                />
              </div>

              {/* Step association */}
              {timer.step_id && (
                <div className="mt-2 text-xs text-gray-400">
                  Associated with cooking step
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Empty state */}
        {timers.length === 0 && (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-400">No timers active</p>
            <p className="text-sm text-gray-500 mt-1">Create a timer to get started</p>
          </div>
        )}
      </div>

      {/* Add timer section */}
      <div className="p-4 border-t border-white/10">
        {!showAddTimer ? (
          <button
            onClick={() => setShowAddTimer(true)}
            className="w-full flex items-center justify-center gap-2 p-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Timer
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <input
              type="text"
              value={newTimerName}
              onChange={(e) => setNewTimerName(e.target.value)}
              placeholder="Timer name..."
              className="w-full p-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={newTimerMinutes}
                onChange={(e) => setNewTimerMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                max="180"
                className="flex-1 p-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
              <span className="text-sm text-gray-400">minutes</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreateTimer}
                className="flex-1 p-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors text-sm"
              >
                Create
              </button>
              <button
                onClick={() => setShowAddTimer(false)}
                className="flex-1 p-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 rounded-lg transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Quick timer presets */}
      <div className="p-4 border-t border-white/10">
        <p className="text-sm text-gray-400 mb-2">Quick Timers:</p>
        <div className="flex flex-wrap gap-2">
          {[
            { name: '5 min', minutes: 5 },
            { name: '10 min', minutes: 10 },
            { name: '15 min', minutes: 15 },
            { name: '20 min', minutes: 20 },
            { name: '30 min', minutes: 30 }
          ].map((preset) => (
            <button
              key={preset.name}
              onClick={() => {
                const timerId = createTimer({
                  name: preset.name,
                  duration_minutes: preset.minutes
                });
                if (timerId) {
                  startTimer(timerId);
                }
              }}
              className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded text-sm transition-colors"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}

export default TimerPanel;