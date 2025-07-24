import React, { Suspense } from 'react';
import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';

// Enhanced components
import { AccessibilityProvider, SkipLink } from '../accessibility/AccessibilityEnhanced';
import { PageErrorBoundary, SectionErrorBoundary } from '../error/ErrorBoundary';
import { LoadingOverlay, HeroSkeleton, CardSkeleton, LoadingSpinner } from '../loading/LoadingStates';
import { ScrollProgress } from '../interactive/ScrollAnimations';
import { PerformanceOptimizedLandingPage, usePerformanceMonitor } from '../optimized/PerformanceOptimized';

import { ResponsiveHero } from './ResponsiveHero';

// Lazy load heavy sections
const ProductFeatures = React.lazy(() => 
  import('../sections/Features').then(module => ({ default: module.ProductFeatures }))
);

const ProductPricing = React.lazy(() => 
  import('../sections/Pricing').then(module => ({ default: module.ProductPricing }))
);

interface PolishedLandingPageProps {
  className?: string;
  children?: React.ReactNode;
  performanceMode?: boolean;
  showLoadingStates?: boolean;
}

export function PolishedLandingPage({ 
  className, 
  children, 
  performanceMode = true,
  showLoadingStates = true
}: PolishedLandingPageProps) {
  usePerformanceMonitor();

  const [isLoading, setIsLoading] = React.useState(showLoadingStates);
  const [sectionsLoaded, setSectionsLoaded] = React.useState({
    hero: false,
    features: false,
    pricing: false
  });

  React.useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setIsLoading(false);
      setSectionsLoaded(prev => ({ ...prev, hero: true }));
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleSectionLoad = (section: keyof typeof sectionsLoaded) => {
    setSectionsLoaded(prev => ({ ...prev, [section]: true }));
  };

  const heroProps = {
    title: "Transform Your Kitchen Into a Smart Culinary Assistant",
    subtitle: "AI-Powered Meal Planning",
    description: "Experience the future of cooking with our intelligent meal planning system. Generate personalized recipes, optimize your pantry, and reduce food waste with cutting-edge AI technology.",
    cta: [
      {
        id: 'get-started',
        text: 'Start Cooking Smarter',
        href: '/signup',
        variant: 'primary' as const,
        size: 'lg' as const,
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        )
      },
      {
        id: 'watch-demo',
        text: 'Watch Demo',
        href: '#demo',
        variant: 'secondary' as const,
        size: 'lg' as const,
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.5a2.5 2.5 0 100-5H9v5zm0 0v6m3-3a6 6 0 110-12 6 6 0 010 12z" />
          </svg>
        )
      }
    ],
    stats: [
      { label: 'Happy Users', value: '50K+', gradient: 'from-lime-600 to-purple-600' },
      { label: 'Recipes Created', value: '1M+', gradient: 'from-purple-600 to-cyan-600' },
      { label: 'Time Saved', value: '2hrs', suffix: '/week', gradient: 'from-cyan-600 to-lime-600' },
      { label: 'Food Waste', value: '40%', suffix: ' less', gradient: 'from-lime-600 to-purple-600' }
    ],
    background: {
      gradient: 'bg-gradient-to-br from-lime-400/20 via-purple-500/20 to-cyan-400/20',
      overlay: 'bg-white/5'
    }
  };

  if (performanceMode) {
    return (
      <AccessibilityProvider>
        <PageErrorBoundary>
          <PerformanceOptimizedLandingPage className={className}>
            {children}
          </PerformanceOptimizedLandingPage>
        </PageErrorBoundary>
      </AccessibilityProvider>
    );
  }

  return (
    <AccessibilityProvider>
      <PageErrorBoundary>
        <div className={cn('min-h-screen bg-white dark:bg-gray-900', className)}>
          {/* Accessibility Skip Links */}
          <SkipLink href="#main-content">Skip to main content</SkipLink>
          <SkipLink href="#navigation">Skip to navigation</SkipLink>

          {/* Scroll Progress Indicator */}
          <ScrollProgress />

          {/* Loading Overlay for Initial Load */}
          <LoadingOverlay 
            isLoading={isLoading} 
            message="Loading your culinary journey..."
            spinner={<LoadingSpinner size="xl" />}
          >
            {/* Navigation */}
            <nav 
              id="navigation"
              className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/20 dark:border-gray-700/20"
              role="navigation"
              aria-label="Main navigation"
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-4">
                  <motion.div 
                    className="flex items-center space-x-2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="w-8 h-8 bg-gradient-to-r from-lime-500 to-purple-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">KC</span>
                    </div>
                    <span className="text-xl font-bold bg-gradient-to-r from-lime-600 to-purple-600 bg-clip-text text-transparent">
                      KeCaraJoComer
                    </span>
                  </motion.div>
                  
                  <div className="hidden md:flex items-center space-x-8">
                    <a 
                      href="#features" 
                      className="text-gray-600 dark:text-gray-300 hover:text-lime-600 dark:hover:text-lime-400 transition-colors focus:outline-none focus:ring-2 focus:ring-lime-500 rounded px-2 py-1"
                    >
                      Features
                    </a>
                    <a 
                      href="#pricing" 
                      className="text-gray-600 dark:text-gray-300 hover:text-lime-600 dark:hover:text-lime-400 transition-colors focus:outline-none focus:ring-2 focus:ring-lime-500 rounded px-2 py-1"
                    >
                      Pricing
                    </a>
                    <a 
                      href="#about" 
                      className="text-gray-600 dark:text-gray-300 hover:text-lime-600 dark:hover:text-lime-400 transition-colors focus:outline-none focus:ring-2 focus:ring-lime-500 rounded px-2 py-1"
                    >
                      About
                    </a>
                    <motion.button 
                      className="bg-gradient-to-r from-lime-500 to-purple-500 text-white px-4 py-2 rounded-lg hover:from-lime-600 hover:to-purple-600 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-2"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Get Started
                    </motion.button>
                  </div>
                </div>
              </div>
            </nav>

            {/* Main Content */}
            <main id="main-content" role="main">
              {/* Hero Section */}
              <SectionErrorBoundary>
                <Suspense fallback={<HeroSkeleton />}>
                  <ResponsiveHero 
                    {...heroProps}
                    onLoad={() => handleSectionLoad('hero')}
                  />
                </Suspense>
              </SectionErrorBoundary>

              {/* Features Section */}
              <SectionErrorBoundary>
                <section id="features" aria-labelledby="features-heading">
                  <Suspense 
                    fallback={
                      <div className="py-20">
                        <div className="max-w-7xl mx-auto px-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[...Array(6)].map((_, i) => (
                              <CardSkeleton key={i} />
                            ))}
                          </div>
                        </div>
                      </div>
                    }
                  >
                    <ProductFeatures 
                      onLoad={() => handleSectionLoad('features')}
                    />
                  </Suspense>
                </section>
              </SectionErrorBoundary>

              {/* Pricing Section */}
              <SectionErrorBoundary>
                <section id="pricing" aria-labelledby="pricing-heading">
                  <Suspense 
                    fallback={
                      <div className="py-20">
                        <div className="max-w-7xl mx-auto px-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[...Array(3)].map((_, i) => (
                              <CardSkeleton key={i} className="h-96" />
                            ))}
                          </div>
                        </div>
                      </div>
                    }
                  >
                    <ProductPricing 
                      onLoad={() => handleSectionLoad('pricing')}
                    />
                  </Suspense>
                </section>
              </SectionErrorBoundary>
            </main>

            {/* Footer */}
            <footer 
              className="bg-gray-900 text-white py-12"
              role="contentinfo"
              aria-label="Site footer"
            >
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
                      <li><a href="#" className="hover:text-lime-400 transition-colors focus:outline-none focus:ring-2 focus:ring-lime-500 rounded">Features</a></li>
                      <li><a href="#" className="hover:text-lime-400 transition-colors focus:outline-none focus:ring-2 focus:ring-lime-500 rounded">Pricing</a></li>
                      <li><a href="#" className="hover:text-lime-400 transition-colors focus:outline-none focus:ring-2 focus:ring-lime-500 rounded">API</a></li>
                      <li><a href="#" className="hover:text-lime-400 transition-colors focus:outline-none focus:ring-2 focus:ring-lime-500 rounded">Mobile App</a></li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-4">Resources</h3>
                    <ul className="space-y-2 text-gray-400">
                      <li><a href="#" className="hover:text-lime-400 transition-colors focus:outline-none focus:ring-2 focus:ring-lime-500 rounded">Blog</a></li>
                      <li><a href="#" className="hover:text-lime-400 transition-colors focus:outline-none focus:ring-2 focus:ring-lime-500 rounded">Help Center</a></li>
                      <li><a href="#" className="hover:text-lime-400 transition-colors focus:outline-none focus:ring-2 focus:ring-lime-500 rounded">Community</a></li>
                      <li><a href="#" className="hover:text-lime-400 transition-colors focus:outline-none focus:ring-2 focus:ring-lime-500 rounded">Recipes</a></li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-4">Company</h3>
                    <ul className="space-y-2 text-gray-400">
                      <li><a href="#" className="hover:text-lime-400 transition-colors focus:outline-none focus:ring-2 focus:ring-lime-500 rounded">About</a></li>
                      <li><a href="#" className="hover:text-lime-400 transition-colors focus:outline-none focus:ring-2 focus:ring-lime-500 rounded">Privacy</a></li>
                      <li><a href="#" className="hover:text-lime-400 transition-colors focus:outline-none focus:ring-2 focus:ring-lime-500 rounded">Terms</a></li>
                      <li><a href="#" className="hover:text-lime-400 transition-colors focus:outline-none focus:ring-2 focus:ring-lime-500 rounded">Contact</a></li>
                    </ul>
                  </div>
                </div>
                
                <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
                  <p>&copy; 2024 KeCaraJoComer. All rights reserved.</p>
                </div>
              </div>
            </footer>

            {children}
          </LoadingOverlay>
        </div>
      </PageErrorBoundary>
    </AccessibilityProvider>
  );
}

// Export with performance monitoring
export const EnhancedLandingPage = React.memo(PolishedLandingPage);