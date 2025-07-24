import React from 'react';

import { cn } from '@/lib/utils';

import { LandingPageProps } from '../types';

// Section imports
import { LandingHero } from './sections/Hero';
import { ProductFeatures } from './sections/Features';
import { ProductPricing } from './sections/Pricing';

export function LandingPage({ className, children, ...props }: LandingPageProps) {
  return (
    <div className={cn('min-h-screen bg-white dark:bg-gray-900', className)} {...props}>
      {/* Navigation placeholder - can be added later */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/20 dark:border-gray-700/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-lime-500 to-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">KC</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-lime-600 to-purple-600 bg-clip-text text-transparent">
                KeCaraJoComer
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 dark:text-gray-300 hover:text-lime-600 dark:hover:text-lime-400 transition-colors">
                Features
              </a>
              <a href="#pricing" className="text-gray-600 dark:text-gray-300 hover:text-lime-600 dark:hover:text-lime-400 transition-colors">
                Pricing
              </a>
              <a href="#about" className="text-gray-600 dark:text-gray-300 hover:text-lime-600 dark:hover:text-lime-400 transition-colors">
                About
              </a>
              <button className="bg-gradient-to-r from-lime-500 to-purple-500 text-white px-4 py-2 rounded-lg hover:from-lime-600 hover:to-purple-600 transition-all duration-300">
                Get Started
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <LandingHero />

      {/* Features Section */}
      <ProductFeatures id="features" />

      {/* Pricing Section */}
      <ProductPricing id="pricing" />

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-lime-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">KC</span>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-lime-400 to-purple-400 bg-clip-text text-transparent">
                  KeCaraJoComer
                </span>
              </div>
              <p className="text-gray-400">
                Transform your kitchen into a smart culinary assistant with AI-powered meal planning.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-lime-400 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-lime-400 transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-lime-400 transition-colors">API</a></li>
                <li><a href="#" className="hover:text-lime-400 transition-colors">Mobile App</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-lime-400 transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-lime-400 transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-lime-400 transition-colors">Community</a></li>
                <li><a href="#" className="hover:text-lime-400 transition-colors">Recipes</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-lime-400 transition-colors">About</a></li>
                <li><a href="#" className="hover:text-lime-400 transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-lime-400 transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-lime-400 transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 KeCaraJoComer. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {children}
    </div>
  );
}

// Export individual sections for flexibility
export { LandingHero } from './sections/Hero';
export { ProductFeatures } from './sections/Features';
export { ProductPricing } from './sections/Pricing';

// Export UI components
export { GlassCard, GlassFeatureCard, GlassHeroCard, GlassPricingCard } from './ui/GlassCard';
export { GradientButton, CTAButton, SecondaryButton, AccentButton } from './ui/GradientButton';
export { 
  HeroIllustration, 
  MealPlanningIllustration, 
  SmartPantryIllustration, 
  ShoppingOptimizationIllustration,
  HappyUserIllustration,
  ValuePropositionIllustration
} from './ui/FlatIllustrations';