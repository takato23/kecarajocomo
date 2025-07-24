'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ChefHat, Clock, ArrowRight, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { supabase } from '@/lib/supabase/client';

interface PantrySuggestionsProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SuggestedRecipe {
  name: string;
  missingIngredients?: string[];
  difficulty: string;
  timeRequired: number;
  description: string;
}

export function PantrySuggestions({ isOpen, onClose }: PantrySuggestionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestedRecipe[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleGetSuggestions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch('/api/ai/suggest-from-pantry', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get suggestions');
      }

      setSuggestions(data.suggestions || []);
    } catch (err: unknown) {
      setError(err.message || 'Failed to get suggestions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateRecipe = () => {
    // Navigate to recipe generator with pantry items pre-filled
    router.push('/app/recipes?generate=pantry');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">AI Recipe Suggestions</h2>
              <p className="text-purple-100">Based on what's in your pantry</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-200px)]">
          {!suggestions.length && !isLoading && !error && (
            <div className="text-center py-12">
              <ChefHat className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Get AI-Powered Recipe Ideas
              </h3>
              <p className="text-gray-600 mb-6">
                Let AI suggest recipes you can make with ingredients from your pantry
              </p>
              <motion.button
                onClick={handleGetSuggestions}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-lg hover:from-purple-600 hover:to-pink-600 flex items-center gap-2 mx-auto"
              >
                <Sparkles className="w-5 h-5" />
                Get Suggestions
              </motion.button>
            </div>
          )}

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
              <p className="text-gray-600">AI is analyzing your pantry...</p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Recipes You Can Make
              </h3>
              {suggestions.map((recipe, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={handleGenerateRecipe}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">
                        {recipe.name}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">
                        {recipe.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1 text-gray-500">
                          <Clock className="w-4 h-4" />
                          {recipe.timeRequired} min
                        </span>
                        <span className={`capitalize ${
                          recipe.difficulty === 'easy' ? 'text-green-600' :
                          recipe.difficulty === 'medium' ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {recipe.difficulty}
                        </span>
                      </div>
                      {recipe.missingIngredients && recipe.missingIngredients.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500">
                            Missing: {recipe.missingIngredients.join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
          {suggestions.length > 0 && (
            <motion.button
              onClick={handleGenerateRecipe}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600"
            >
              Generate Full Recipe
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  );
}