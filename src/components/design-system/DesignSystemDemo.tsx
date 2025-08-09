'use client';

import React from 'react';
import { logger } from '@/services/logger';

import {
  Button,
  Input,
  Card,
  Badge,
  Heading,
  Text,
  RecipeCard,
  NutritionDisplay,
  Icons,
} from './index';

export const DesignSystemDemo: React.FC = () => {
  const sampleRecipe = {
    id: '1',
    name: 'Mediterranean Quinoa Bowl',
    description: 'A healthy and delicious quinoa bowl with fresh vegetables, feta cheese, and a tangy lemon vinaigrette.',
    image: '/api/placeholder/400/300',
    cookTime: 15,
    prepTime: 20,
    servings: 4,
    difficulty: 'easy' as const,
    rating: 4.8,
    tags: ['Healthy', 'Mediterranean', 'Vegetarian', 'Gluten-Free'],
    calories: 420,
    isAiGenerated: true,
    isFavorite: false,
  };

  const sampleNutrition = {
    calories: 420,
    protein: 18,
    carbs: 58,
    fat: 12,
    fiber: 8,
    sugar: 6,
    sodium: 480,
  };

  return (
    <div className="min-h-screen p-8 space-y-12">
      {/* Header */}
      <div className="text-center space-y-4">
        <Heading size="4xl" gradient className="animate-fade-in">
          Liquid Glass Design System
        </Heading>
        <Text size="lg" color="muted">
          A modern, glass-morphic design system for kecarajocomer
        </Text>
      </div>

      {/* Glass Backgrounds Demo */}
      <Card variant="glass" className="p-8">
        <Heading size="2xl" className="mb-6">
          Glass Morphism Showcase
        </Heading>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card variant="glass" className="text-center p-6">
            <Icons.ChefHat size="xl" className="mx-auto mb-4 text-food-fresh-500" />
            <Heading size="lg">Primary Glass</Heading>
            <Text size="sm" color="muted">Standard glass surface</Text>
          </Card>
          
          <Card variant="glass-interactive" className="text-center p-6">
            <Icons.Flame size="xl" className="mx-auto mb-4 text-food-warm-500" />
            <Heading size="lg">Interactive Glass</Heading>
            <Text size="sm" color="muted">Hover to see effects</Text>
          </Card>
          
          <Card variant="fresh" className="text-center p-6">
            <Icons.Heart size="xl" className="mx-auto mb-4 text-food-fresh-600" />
            <Heading size="lg">Themed Glass</Heading>
            <Text size="sm" color="muted">Food-themed variants</Text>
          </Card>
        </div>
      </Card>

      {/* Buttons Demo */}
      <Card variant="glass" className="p-8">
        <Heading size="2xl" className="mb-6">
          Button Variants
        </Heading>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button variant="primary" leftIcon={<Icons.Plus />}>
            Primary
          </Button>
          <Button variant="glass" rightIcon={<Icons.Search />}>
            Glass
          </Button>
          <Button variant="fresh" leftIcon={<Icons.ChefHat />}>
            Fresh
          </Button>
          <Button variant="warm" glow>
            Warm Glow
          </Button>
        </div>
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button variant="primary" size="sm">Small</Button>
          <Button variant="glass" size="md">Medium</Button>
          <Button variant="fresh" size="lg">Large</Button>
        </div>
      </Card>

      {/* Forms Demo */}
      <Card variant="glass" className="p-8">
        <Heading size="2xl" className="mb-6">
          Form Components
        </Heading>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Recipe Name"
            placeholder="Enter recipe name"
            leftIcon={<Icons.BookOpen />}
            helper="Give your recipe a memorable name"
          />
          
          <Input
            label="Cook Time"
            placeholder="30"
            rightAddon="minutes"
            leftIcon={<Icons.Clock />}
            type="number"
          />
          
          <Input
            label="Search Ingredients"
            placeholder="Search..."
            leftIcon={<Icons.Search />}
            variant="glass"
          />
          
          <Input
            label="Servings"
            placeholder="4"
            rightIcon={<Icons.Users />}
            variant="fresh"
            type="number"
          />
        </div>
      </Card>

      {/* Badges Demo */}
      <Card variant="glass" className="p-8">
        <Heading size="2xl" className="mb-6">
          Badges & Tags
        </Heading>
        
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="fresh" leftIcon={<Icons.Check />}>
              Healthy
            </Badge>
            <Badge variant="warm">Spicy</Badge>
            <Badge variant="rich">Premium</Badge>
            <Badge variant="golden" rightIcon={<Icons.Star />}>
              Featured
            </Badge>
            <Badge variant="success">Quick</Badge>
            <Badge variant="info">New</Badge>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Badge variant="fresh" outline>
              Vegetarian
            </Badge>
            <Badge variant="warm" outline>
              Gluten-Free
            </Badge>
            <Badge variant="rich" outline removable>
              Dairy-Free
            </Badge>
          </div>
        </div>
      </Card>

      {/* Recipe Card Demo */}
      <Card variant="glass" className="p-8">
        <Heading size="2xl" className="mb-6">
          Recipe Card Component
        </Heading>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <RecipeCard
            {...sampleRecipe}
            variant="glass"
            onFavoriteToggle={(id) => logger.info('Toggle favorite:', 'DesignSystemDemo', id)}
            onShare={(id) => logger.info('Share:', 'DesignSystemDemo', id)}
            onClick={(id) => logger.info('View recipe:', 'DesignSystemDemo', id)}
          />
          
          <RecipeCard
            {...sampleRecipe}
            name="Classic Margherita Pizza"
            difficulty="medium"
            rating={4.5}
            isAiGenerated={false}
            isFavorite={true}
            variant="default"
          />
          
          <RecipeCard
            {...sampleRecipe}
            name="Spicy Thai Curry"
            difficulty="hard"
            rating={4.9}
            tags={['Spicy', 'Thai', 'Curry']}
            variant="compact"
          />
        </div>
      </Card>

      {/* Nutrition Display Demo */}
      <Card variant="glass" className="p-8">
        <Heading size="2xl" className="mb-6">
          Nutrition Components
        </Heading>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <NutritionDisplay
            nutrition={sampleNutrition}
            servings={2}
            showPercentages={true}
          />
          
          <div className="space-y-6">
            <div>
              <Text size="lg" weight="semibold" className="mb-4">
                Compact Variant
              </Text>
              <NutritionDisplay
                nutrition={sampleNutrition}
                variant="compact"
              />
            </div>
            
            <div>
              <Text size="lg" weight="semibold" className="mb-4">
                Inline Variant
              </Text>
              <NutritionDisplay
                nutrition={sampleNutrition}
                variant="inline"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Typography Demo */}
      <Card variant="glass" className="p-8">
        <Heading size="2xl" className="mb-6">
          Typography Scale
        </Heading>
        
        <div className="space-y-4">
          <Heading size="4xl">Heading 4XL</Heading>
          <Heading size="3xl">Heading 3XL</Heading>
          <Heading size="2xl">Heading 2XL</Heading>
          <Heading size="xl">Heading XL</Heading>
          <Heading size="lg">Heading Large</Heading>
          
          <div className="pt-4 space-y-2">
            <Text size="xl">Text Extra Large</Text>
            <Text size="lg">Text Large</Text>
            <Text size="base">Text Base (Default)</Text>
            <Text size="sm">Text Small</Text>
            <Text size="xs">Text Extra Small</Text>
          </div>
          
          <div className="pt-4">
            <Text color="fresh" weight="semibold">Fresh colored text</Text>
            <Text color="warm" weight="medium">Warm colored text</Text>
            <Text color="muted">Muted text color</Text>
          </div>
        </div>
      </Card>

      {/* Icons Demo */}
      <Card variant="glass" className="p-8">
        <Heading size="2xl" className="mb-6">
          Icon Library
        </Heading>
        
        <div className="grid grid-cols-4 md:grid-cols-8 gap-6">
          {Object.entries(Icons).map(([name, IconComponent]) => (
            <div key={name} className="text-center">
              <div className="glass-interactive rounded-xl p-4 mb-2 hover:glow-fresh transition-all duration-200">
                <IconComponent size="lg" className="mx-auto text-food-fresh-600" />
              </div>
              <Text size="xs" color="muted">
                {name}
              </Text>
            </div>
          ))}
        </div>
      </Card>

      {/* Animation Demo */}
      <Card variant="glass" className="p-8">
        <Heading size="2xl" className="mb-6">
          Animations & Effects
        </Heading>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="glass-interactive rounded-2xl p-6 text-center animate-float">
            <Icons.ChefHat size="xl" className="mx-auto mb-2 text-food-fresh-500" />
            <Text size="sm">Float Animation</Text>
          </div>
          
          <div className="glass-fresh rounded-2xl p-6 text-center animate-pulse-glow">
            <Icons.Star size="xl" className="mx-auto mb-2 text-food-golden-500" />
            <Text size="sm">Pulse Glow</Text>
          </div>
          
          <div className="glass-warm rounded-2xl p-6 text-center animate-bounce-gentle">
            <Icons.Heart size="xl" className="mx-auto mb-2 text-food-warm-500" />
            <Text size="sm">Gentle Bounce</Text>
          </div>
          
          <div className="glass-rich rounded-2xl p-6 text-center">
            <div className="relative overflow-hidden">
              <Icons.Flame size="xl" className="mx-auto mb-2 text-food-rich-500" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </div>
            <Text size="sm">Shimmer Effect</Text>
          </div>
        </div>
      </Card>
    </div>
  );
};