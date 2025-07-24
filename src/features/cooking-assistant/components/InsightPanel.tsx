'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lightbulb, 
  AlertTriangle, 
  Info, 
  Zap, 
  X,
  Clock
} from 'lucide-react';

import { cn } from '@/lib/utils';

import { CookingInsight } from '../types';
import { useCookingAssistantStore } from '../store/cookingAssistantStore';

interface InsightPanelProps {
  insights: CookingInsight[];
}

export function InsightPanel({ insights }: InsightPanelProps) {
  const { dismissInsight } = useCookingAssistantStore();

  if (insights.length === 0) {
    return null;
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'tip':
        return <Lightbulb className="w-4 h-4" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4" />;
      case 'substitution':
        return <Zap className="w-4 h-4" />;
      case 'timing':
        return <Clock className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const getInsightColor = (type: string, priority: string) => {
    if (priority === 'high') {
      return 'border-red-500/30 bg-red-500/10 text-red-400';
    }
    
    switch (type) {
      case 'tip':
        return 'border-blue-500/30 bg-blue-500/10 text-blue-400';
      case 'warning':
        return 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400';
      case 'substitution':
        return 'border-purple-500/30 bg-purple-500/10 text-purple-400';
      case 'timing':
        return 'border-green-500/30 bg-green-500/10 text-green-400';
      default:
        return 'border-gray-500/30 bg-gray-500/10 text-gray-400';
    }
  };

  return (
    <div className="space-y-3 mb-6">
      <AnimatePresence>
        {insights.map((insight) => (
          <motion.div
            key={insight.id}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "p-4 rounded-lg border backdrop-blur-sm",
              getInsightColor(insight.type, insight.priority)
            )}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {getInsightIcon(insight.type)}
              </div>
              
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-medium text-white mb-1">
                      {insight.title}
                    </h4>
                    <p className="text-sm leading-relaxed">
                      {insight.message}
                    </p>
                  </div>
                  
                  {insight.dismissible && (
                    <button
                      onClick={() => dismissInsight(insight.id)}
                      className="flex-shrink-0 p-1 rounded hover:bg-white/10 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                {insight.step_id && (
                  <div className="mt-2 text-xs opacity-75">
                    Related to current step
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default InsightPanel;