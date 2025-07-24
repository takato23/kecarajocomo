'use client';

import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  ShoppingCart, 
  Lightbulb, 
  RefreshCw, 
  Calendar,
  Package,
  AlertTriangle,
  CheckCircle,
  Target,
} from 'lucide-react';

import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import { Heading, Text } from '@/components/design-system/Typography';
import { Badge } from '@/components/design-system/Badge';

import { usePantryStore } from '../store/pantryStore';



interface PantryAnalyticsProps {
  onRecipeSuggestionClick?: (suggestion: string) => void;
  className?: string;
}

export function PantryAnalytics({ onRecipeSuggestionClick, className = '' }: PantryAnalyticsProps) {
  const { analysis, isLoading, fetchAnalysis } = usePantryStore();
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!analysis) {
      fetchAnalysis();
    }
  }, [analysis, fetchAnalysis]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchAnalysis();
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading && !analysis) {
    return (
      <div className={`space-y-6 ${className}`}>
        {/* Loading skeletons */}
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-6">
            <div className="animate-pulse">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-5 w-5 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-32"></div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (!analysis) {
    return (
      <Card className={`p-6 text-center ${className}`}>
        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <Heading as="h3" size="lg" className="text-lg font-medium text-gray-900 mb-2">
          No Analytics Available
        </Heading>
        <Text size="sm" className="text-gray-600 mb-4">
          Add some items to your pantry to see analytics and insights.
        </Text>
        <Button variant="secondary" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </Card>
    );
  }

  const { waste_analysis, usage_patterns, optimization_suggestions } = analysis;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-gray-600" />
          <Heading as="h3" size="lg" className="text-lg font-semibold text-gray-900">
            Pantry Analytics
          </Heading>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Waste Analysis */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className={`p-2 rounded-lg ${
            waste_analysis.expired_items_last_month > 5 ? 'bg-red-100' :
            waste_analysis.expired_items_last_month > 2 ? 'bg-yellow-100' : 'bg-green-100'
          }`}>
            <AlertTriangle className={`h-5 w-5 ${
              waste_analysis.expired_items_last_month > 5 ? 'text-red-600' :
              waste_analysis.expired_items_last_month > 2 ? 'text-yellow-600' : 'text-green-600'
            }`} />
          </div>
          <Heading as="h3" size="lg" className="font-semibold text-gray-900">
            Waste Analysis
          </Heading>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <Heading as="h3" size="lg" className={`text-2xl font-bold ${
              waste_analysis.expired_items_last_month > 5 ? 'text-red-600' :
              waste_analysis.expired_items_last_month > 2 ? 'text-yellow-600' : 'text-green-600'
            }`}>
              {waste_analysis.expired_items_last_month}
            </Heading>
            <Text size="sm" className="text-gray-600">
              Items expired last month
            </Text>
          </div>

          <div className="text-center">
            <Heading as="h3" size="lg" className="text-2xl font-bold text-red-600">
              ${waste_analysis.waste_value.toFixed(2)}
            </Heading>
            <Text size="sm" className="text-gray-600">
              Estimated waste value
            </Text>
          </div>

          <div className="text-center">
            <Heading as="h3" size="lg" className="text-2xl font-bold text-blue-600">
              {waste_analysis.most_wasted_categories.length}
            </Heading>
            <Text size="sm" className="text-gray-600">
              Top waste categories
            </Text>
          </div>
        </div>

        {waste_analysis.most_wasted_categories.length > 0 && (
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <Text size="xs" weight="medium" className="text-gray-700 mb-2 block">
              Most Wasted Categories:
            </Text>
            <div className="flex flex-wrap gap-2">
              {waste_analysis.most_wasted_categories.map((category, index) => (
                <Badge key={index} variant="error" className="text-xs">
                  {category}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Usage Patterns */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <PieChart className="h-5 w-5 text-blue-600" />
          </div>
          <Heading as="h3" size="lg" className="font-semibold text-gray-900">
            Usage Patterns
          </Heading>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Most Used Ingredients */}
          <div>
            <Heading as="h3" size="lg" className="font-medium text-gray-900 mb-3">
              Frequently Used
            </Heading>
            {usage_patterns.most_used_ingredients.length > 0 ? (
              <div className="space-y-2">
                {usage_patterns.most_used_ingredients.map((ingredient, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <Text size="sm" className="text-gray-900">
                      {ingredient}
                    </Text>
                    <Badge variant="neutral" className="text-xs">
                      #{index + 1}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <Text size="sm" className="text-gray-600 italic">
                Start cooking to see your most used ingredients!
              </Text>
            )}
          </div>

          {/* Seasonal Trends */}
          <div>
            <Heading as="h3" size="lg" className="font-medium text-gray-900 mb-3">
              Seasonal Trends
            </Heading>
            <div className="space-y-2">
              {Object.entries(usage_patterns.seasonal_trends).map(([category, trend]) => (
                <div key={category} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <Text size="sm" className="text-gray-900">
                    {category}
                  </Text>
                  <div className="flex items-center gap-1">
                    {trend > 1 ? (
                      <TrendingUp className="h-3 w-3 text-green-600" />
                    ) : trend < 1 ? (
                      <TrendingDown className="h-3 w-3 text-red-600" />
                    ) : null}
                    <Text size="xs" className={
                      trend > 1 ? 'text-green-600' :
                      trend < 1 ? 'text-red-600' : 'text-gray-600'
                    }>
                      {trend > 1 ? '+' : ''}{((trend - 1) * 100).toFixed(0)}%
                    </Text>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Shopping Frequency */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            <Text size="sm" className="text-blue-700">
              <strong>Shopping Frequency:</strong> Every {usage_patterns.shopping_frequency} days
            </Text>
          </div>
        </div>
      </Card>

      {/* Optimization Suggestions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bulk Buy Recommendations */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <ShoppingCart className="h-5 w-5 text-green-600" />
            </div>
            <Heading as="h3" size="lg" className="font-medium text-gray-900">
              Bulk Buy Tips
            </Heading>
          </div>
          <div className="space-y-2">
            {optimization_suggestions.bulk_buy_recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <Text size="sm" className="text-gray-700">
                  {recommendation}
                </Text>
              </div>
            ))}
          </div>
        </Card>

        {/* Storage Improvements */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Package className="h-5 w-5 text-purple-600" />
            </div>
            <Heading as="h3" size="lg" className="font-medium text-gray-900">
              Storage Tips
            </Heading>
          </div>
          <div className="space-y-2">
            {optimization_suggestions.storage_improvements.map((improvement, index) => (
              <div key={index} className="flex items-start gap-2">
                <Target className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                <Text size="sm" className="text-gray-700">
                  {improvement}
                </Text>
              </div>
            ))}
          </div>
        </Card>

        {/* Recipe Suggestions */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Lightbulb className="h-5 w-5 text-orange-600" />
            </div>
            <Heading as="h3" size="lg" className="font-medium text-gray-900">
              Recipe Ideas
            </Heading>
          </div>
          <div className="space-y-2">
            {optimization_suggestions.recipe_suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => onRecipeSuggestionClick?.(suggestion)}
                className="flex items-start gap-2 text-left w-full p-2 rounded hover:bg-gray-50 transition-colors"
              >
                <Lightbulb className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                <Text size="sm" className="text-gray-700 hover:text-orange-700">
                  {suggestion}
                </Text>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Summary Insights */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <BarChart3 className="h-5 w-5 text-blue-600" />
          </div>
          <Heading as="h3" size="lg" className="font-semibold text-blue-900">
            Key Insights
          </Heading>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Text size="sm" className="text-blue-800">
              <strong>Waste Reduction Opportunity:</strong>
            </Text>
            <Text size="sm" className="text-blue-700">
              {waste_analysis.expired_items_last_month > 3 
                ? `Focus on using ${waste_analysis.most_wasted_categories[0] || 'fresh items'} faster to reduce waste.`
                : 'Great job! You\'re keeping food waste low.'
              }
            </Text>
          </div>

          <div className="space-y-2">
            <Text size="sm" className="text-blue-800">
              <strong>Savings Potential:</strong>
            </Text>
            <Text size="sm" className="text-blue-700">
              {waste_analysis.waste_value > 20 
                ? `You could save up to $${(waste_analysis.waste_value * 12).toFixed(0)} per year by reducing waste.`
                : 'Your waste is minimal - keep up the good work!'
              }
            </Text>
          </div>
        </div>
      </Card>
    </div>
  );
}