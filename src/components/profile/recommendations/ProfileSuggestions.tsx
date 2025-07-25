/**
 * @fileoverview Profile Suggestions Component
 * @module components/profile/recommendations/ProfileSuggestions
 * 
 * Displays AI-powered profile suggestions and recommendations
 */

'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Lightbulb,
  Target,
  TrendingUp,
  Check,
  X,
  ChevronRight,
  Clock,
  DollarSign,
  ChefHat,
  Users,
  AlertTriangle,
  Star,
  Zap,
  Filter,
  RefreshCw,
  Brain
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { 
  SmartSuggestion,
  NutritionalGoalSuggestion,
  BudgetOptimizationSuggestion,
  RecipeRecommendation,
  IngredientLearning
} from '@/services/profile/ProfileRecommendationEngine';
import { useProfileRecommendations, useProfileCompletion } from '@/hooks/useProfileRecommendations';

// ============================================================================
// Types
// ============================================================================

interface ProfileSuggestionsProps {
  className?: string;
  showCategories?: boolean;
  maxSuggestions?: number;
  enableFiltering?: boolean;
  autoRefresh?: boolean;
}

type SuggestionCategory = 'all' | 'profile_completion' | 'dietary_preference' | 'budget_optimization' | 'cooking_skill' | 'meal_planning';

// ============================================================================
// Profile Suggestions Component
// ============================================================================

export function ProfileSuggestions({
  className,
  showCategories = true,
  maxSuggestions = 10,
  enableFiltering = true,
  autoRefresh = false
}: ProfileSuggestionsProps) {
  // Hooks
  const {
    suggestions,
    nutritionalGoals,
    recipeRecommendations,
    ingredientLearnings,
    isLoading,
    error,
    lastUpdated,
    refreshRecommendations,
    applySuggestion,
    dismissSuggestion,
    getRecommendationsByCategory,
    getHighPriorityRecommendations
  } = useProfileRecommendations({
    includeRecipes: true,
    includeBudgetOptimization: true,
    includeNutritionalGoals: true,
    autoRefresh
  });

  const { completionPercentage, isComplete, needsAttention } = useProfileCompletion();

  // State
  const [selectedCategory, setSelectedCategory] = useState<SuggestionCategory>('all');
  const [expandedSuggestions, setExpandedSuggestions] = useState<Set<string>>(new Set());

  // ========================================================================
  // Computed Values
  // ========================================================================

  const filteredSuggestions = useMemo(() => {
    let filtered = suggestions;
    
    if (selectedCategory !== 'all') {
      filtered = getRecommendationsByCategory(selectedCategory);
    }
    
    return filtered.slice(0, maxSuggestions);
  }, [suggestions, selectedCategory, getRecommendationsByCategory, maxSuggestions]);

  const highPrioritySuggestions = useMemo(() => {
    return getHighPriorityRecommendations();
  }, [getHighPriorityRecommendations]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    suggestions.forEach(s => {
      counts[s.category] = (counts[s.category] || 0) + 1;
    });
    return counts;
  }, [suggestions]);

  // ========================================================================
  // Event Handlers
  // ========================================================================

  const handleApplySuggestion = async (suggestion: SmartSuggestion) => {
    try {
      await applySuggestion(suggestion.id);
      toast.success(`Applied: ${suggestion.title}`);
    } catch (error) {
      toast.error('Failed to apply suggestion. Please try again.');
    }
  };

  const handleDismissSuggestion = (suggestion: SmartSuggestion) => {
    dismissSuggestion(suggestion.id);
    toast.success('Suggestion dismissed');
  };

  const toggleExpanded = (suggestionId: string) => {
    setExpandedSuggestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(suggestionId)) {
        newSet.delete(suggestionId);
      } else {
        newSet.add(suggestionId);
      }
      return newSet;
    });
  };

  const handleRefresh = async () => {
    try {
      await refreshRecommendations();
      toast.success('Recommendations refreshed');
    } catch (error) {
      toast.error('Failed to refresh recommendations');
    }
  };

  // ========================================================================
  // Render Functions
  // ========================================================================

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-blue-500 text-white';
      case 'low': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'dietary': return <ChefHat className="h-4 w-4" />;
      case 'budget': return <DollarSign className="h-4 w-4" />;
      case 'cooking': return <Target className="h-4 w-4" />;
      case 'household': return <Users className="h-4 w-4" />;
      case 'profile': return <Users className="h-4 w-4" />;
      case 'behavior': return <TrendingUp className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  const renderSuggestionCard = (suggestion: SmartSuggestion) => {
    const isExpanded = expandedSuggestions.has(suggestion.id);
    
    return (
      <motion.div
        key={suggestion.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="group hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div className="flex-shrink-0">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    {getCategoryIcon(suggestion.category)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge className={cn("text-xs", getPriorityColor(suggestion.score.priority))}>
                      {suggestion.score.priority}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {suggestion.category}
                    </Badge>
                    <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                      <Star className="h-3 w-3" />
                      <span>{suggestion.score.confidence}%</span>
                    </div>
                  </div>
                  <CardTitle className="text-base font-medium group-hover:text-primary transition-colors">
                    {suggestion.title}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {suggestion.description}
                  </p>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleExpanded(suggestion.id)}
                className="flex-shrink-0"
              >
                <ChevronRight className={cn(
                  "h-4 w-4 transition-transform",
                  isExpanded && "rotate-90"
                )} />
              </Button>
            </div>
          </CardHeader>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <CardContent className="pt-0">
                  <Separator className="mb-4" />
                  
                  <div className="space-y-4">
                    {/* Action Description */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">Recommended Action</h4>
                      <p className="text-sm text-muted-foreground">
                        {suggestion.action}
                      </p>
                    </div>

                    {/* Tags */}
                    {suggestion.tags.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Related Topics</h4>
                        <div className="flex flex-wrap gap-1">
                          {suggestion.tags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Confidence Breakdown */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">Recommendation Confidence</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span>Confidence</span>
                          <span>{suggestion.score.confidence}%</span>
                        </div>
                        <Progress value={suggestion.score.confidence} className="h-1" />
                        
                        <div className="flex items-center justify-between text-xs">
                          <span>Relevance</span>
                          <span>{suggestion.score.relevance}%</span>
                        </div>
                        <Progress value={suggestion.score.relevance} className="h-1" />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => handleApplySuggestion(suggestion)}
                        className="flex-1"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Apply
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDismissSuggestion(suggestion)}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    );
  };

  const renderNutritionalGoals = () => (
    <div className="space-y-4">
      {nutritionalGoals.map((goal, index) => (
        <Card key={index}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-sm">{goal.goal}</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {goal.reasoning}
                </p>
                {goal.targetValue && (
                  <div className="mt-2">
                    <Badge variant="secondary" className="text-xs">
                      Target: {goal.targetValue} {goal.unit}
                    </Badge>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <Star className="h-3 w-3" />
                <span>{goal.confidence}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderIngredientLearnings = () => (
    <div className="space-y-4">
      {ingredientLearnings.map((learning, index) => (
        <Card key={index}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-sm capitalize">
                  {learning.ingredient}
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {learning.suggestedAction}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge 
                  className={cn("text-xs", 
                    learning.preference === 'like' ? 'bg-green-500 text-white' : 
                    learning.preference === 'dislike' ? 'bg-red-500 text-white' : 
                    'bg-gray-500 text-white'
                  )}
                >
                  {learning.preference}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {learning.confidence}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // ========================================================================
  // Main Render
  // ========================================================================

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
          <p className="text-red-500 text-center mb-4">
            Failed to load recommendations
          </p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Profile Completion Overview */}
      {needsAttention && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Complete Your Profile</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Your profile is {completionPercentage}% complete. Completing it will unlock better recommendations.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={completionPercentage} className="mb-4" />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Profile Completion</span>
              <span className="font-medium">{completionPercentage}%</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* High Priority Suggestions */}
      {highPrioritySuggestions.length > 0 && (
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Zap className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Priority Actions</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    These recommendations will have the biggest impact on your experience
                  </p>
                </div>
              </div>
              <Badge className="text-xs bg-red-500 text-white">
                {highPrioritySuggestions.length} urgent
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {highPrioritySuggestions.slice(0, 3).map(renderSuggestionCard)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Suggestions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Brain className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Smart Recommendations</CardTitle>
                <p className="text-sm text-muted-foreground">
                  AI-powered suggestions to improve your meal planning experience
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {lastUpdated && (
                <span className="text-xs text-muted-foreground">
                  Updated {lastUpdated.toLocaleTimeString()}
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {showCategories ? (
            <Tabs value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as SuggestionCategory)}>
              <TabsList className="grid grid-cols-6 mb-6">
                <TabsTrigger value="all" className="text-xs">
                  All ({suggestions.length})
                </TabsTrigger>
                <TabsTrigger value="profile_completion" className="text-xs">
                  Profile ({categoryCounts.profile || 0})
                </TabsTrigger>
                <TabsTrigger value="dietary_preference" className="text-xs">
                  Dietary ({categoryCounts.dietary || 0})
                </TabsTrigger>
                <TabsTrigger value="budget_optimization" className="text-xs">
                  Budget ({categoryCounts.budget || 0})
                </TabsTrigger>
                <TabsTrigger value="cooking_skill" className="text-xs">
                  Cooking ({categoryCounts.cooking || 0})
                </TabsTrigger>
                <TabsTrigger value="meal_planning" className="text-xs">
                  Planning ({categoryCounts.behavior || 0})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                <AnimatePresence>
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : filteredSuggestions.length > 0 ? (
                    filteredSuggestions.map(renderSuggestionCard)
                  ) : (
                    <div className="text-center py-8">
                      <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        No suggestions available at the moment. Check back later!
                      </p>
                    </div>
                  )}
                </AnimatePresence>
              </TabsContent>

              {/* Other tab contents would filter by category */}
              {['profile_completion', 'dietary_preference', 'budget_optimization', 'cooking_skill', 'meal_planning'].map(category => (
                <TabsContent key={category} value={category} className="space-y-4">
                  <AnimatePresence>
                    {getRecommendationsByCategory(category).map(renderSuggestionCard)}
                  </AnimatePresence>
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredSuggestions.length > 0 ? (
                  filteredSuggestions.map(renderSuggestionCard)
                ) : (
                  <div className="text-center py-8">
                    <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No suggestions available at the moment. Check back later!
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}