import React, { lazy, Suspense, memo, useMemo, useCallback } from 'react';

import { cn } from '@/lib/utils';

// Lazy load heavy components
const HeavyIllustration = lazy(() => import('../ui/FlatIllustrations').then(module => ({
  default: module.HeroIllustration
})));

const LazyFeatures = lazy(() => import('../sections/Features').then(module => ({
  default: module.ProductFeatures
})));

const LazyPricing = lazy(() => import('../sections/Pricing').then(module => ({
  default: module.ProductPricing
})));

// Loading components
const IllustrationSkeleton = memo(() => (
  <div className="w-full h-64 bg-gradient-to-br from-lime-100 to-purple-100 rounded-xl animate-pulse flex items-center justify-center">
    <div className="text-lime-600/60">
      <svg className="w-16 h-16 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
      </svg>
    </div>
  </div>
));

const SectionSkeleton = memo(() => (
  <div className="py-20 animate-pulse">
    <div className="max-w-7xl mx-auto px-4">
      <div className="text-center mb-16">
        <div className="h-12 bg-gradient-to-r from-lime-200 to-purple-200 rounded-lg mb-4 mx-auto max-w-md"></div>
        <div className="h-6 bg-gray-200 rounded-lg mb-2 mx-auto max-w-2xl"></div>
        <div className="h-6 bg-gray-200 rounded-lg mx-auto max-w-xl"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white/50 rounded-xl p-6 border border-gray-200">
            <div className="w-16 h-16 bg-gradient-to-br from-lime-200 to-purple-200 rounded-xl mb-4"></div>
            <div className="h-6 bg-gray-200 rounded mb-3"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
));

// Optimized image component with lazy loading
interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
}

const OptimizedImage = memo(({ 
  src, 
  alt, 
  width, 
  height, 
  className, 
  loading = 'lazy',
  priority = false 
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    setHasError(true);
  }, []);

  if (hasError) {
    return (
      <div className={cn(
        'bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center',
        className
      )}>
        <span className="text-gray-400 text-sm">Image unavailable</span>
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-lime-100 to-purple-100 animate-pulse rounded-lg" />
      )}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0',
          className
        )}
        {...(priority && { fetchPriority: 'high' as any })}
      />
    </div>
  );
});

// Virtualized list for large datasets
interface VirtualizedListProps {
  items: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
  itemHeight: number;
  containerHeight: number;
  className?: string;
}

const VirtualizedList = memo(({ 
  items, 
  renderItem, 
  itemHeight, 
  containerHeight, 
  className 
}: VirtualizedListProps) => {
  const [scrollTop, setScrollTop] = React.useState(0);
  
  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );
    
    return items.slice(startIndex, endIndex).map((item, index) => ({
      item,
      index: startIndex + index
    }));
  }, [scrollTop, itemHeight, containerHeight, items]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return (
    <div 
      className={cn('overflow-auto', className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        {visibleItems.map(({ item, index }) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              top: index * itemHeight,
              height: itemHeight,
              width: '100%'
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
});

// Memoized button to prevent unnecessary re-renders
interface OptimizedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

const OptimizedButton = memo(({ 
  children, 
  onClick, 
  variant = 'primary', 
  disabled = false,
  loading = false,
  className 
}: OptimizedButtonProps) => {
  const buttonClasses = useMemo(() => cn(
    'px-6 py-3 rounded-lg font-semibold transition-all duration-200',
    {
      'bg-gradient-to-r from-lime-500 to-purple-500 text-white hover:from-lime-600 hover:to-purple-600': variant === 'primary',
      'bg-white border-2 border-lime-500 text-lime-600 hover:bg-lime-50': variant === 'secondary',
      'opacity-50 cursor-not-allowed': disabled || loading,
      'transform hover:scale-105 active:scale-95': !disabled && !loading
    },
    className
  ), [variant, disabled, loading, className]);

  const handleClick = useCallback(() => {
    if (!disabled && !loading && onClick) {
      onClick();
    }
  }, [disabled, loading, onClick]);

  return (
    <button
      className={buttonClasses}
      onClick={handleClick}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Loading...
        </div>
      ) : (
        children
      )}
    </button>
  );
});

// Performance monitoring hook
export const usePerformanceMonitor = () => {
  React.useEffect(() => {
    // Monitor Core Web Vitals
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            // Log performance metrics
            if (entry.entryType === 'measure') {

            }
          }
        });
        
        observer.observe({ entryTypes: ['measure', 'navigation', 'paint'] });
        
        return () => observer.disconnect();
      } catch (error: unknown) {
        console.warn('Performance monitoring not available:', error);
      }
    }
  }, []);
};

// Intersection Observer hook for lazy loading
export const useIntersectionObserver = (
  elementRef: React.RefObject<Element>,
  callback: () => void,
  options: IntersectionObserverInit = {}
) => {
  React.useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        callback();
        observer.unobserve(element);
      }
    }, {
      threshold: 0.1,
      rootMargin: '50px',
      ...options
    });

    observer.observe(element);

    return () => observer.unobserve(element);
  }, [elementRef, callback, options]);
};

// Optimized landing page wrapper
interface PerformanceOptimizedLandingPageProps {
  children?: React.ReactNode;
  className?: string;
}

export const PerformanceOptimizedLandingPage = memo(({ 
  children, 
  className 
}: PerformanceOptimizedLandingPageProps) => {
  usePerformanceMonitor();
  
  const [loadFeatures, setLoadFeatures] = React.useState(false);
  const [loadPricing, setLoadPricing] = React.useState(false);
  
  const featuresRef = React.useRef<HTMLDivElement>(null);
  const pricingRef = React.useRef<HTMLDivElement>(null);
  
  useIntersectionObserver(featuresRef, () => setLoadFeatures(true));
  useIntersectionObserver(pricingRef, () => setLoadPricing(true));

  return (
    <div className={cn('min-h-screen bg-white dark:bg-gray-900', className)}>
      {/* Hero section loads immediately */}
      <section className="relative min-h-screen">
        <Suspense fallback={<IllustrationSkeleton />}>
          <HeavyIllustration
            colors={{
              primary: '#84cc16',
              secondary: '#a855f7',
              accent: '#22d3ee'
            }}
            size="xl"
            animated={true}
          />
        </Suspense>
      </section>

      {/* Features section loads when in viewport */}
      <div ref={featuresRef}>
        <Suspense fallback={<SectionSkeleton />}>
          {loadFeatures && <LazyFeatures />}
        </Suspense>
      </div>

      {/* Pricing section loads when in viewport */}
      <div ref={pricingRef}>
        <Suspense fallback={<SectionSkeleton />}>
          {loadPricing && <LazyPricing />}
        </Suspense>
      </div>

      {children}
    </div>
  );
});

// Export components
export {
  OptimizedImage,
  OptimizedButton,
  VirtualizedList,
  IllustrationSkeleton,
  SectionSkeleton
};