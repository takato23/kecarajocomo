import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { cn } from '@/lib/utils';

import { AppShellProps, LayoutBreakpoints, ViewportSize } from '../types';

import { Header } from './navigation/Header';
import { Sidebar, CollapsibleSidebar } from './navigation/Sidebar';
import { FloatingBottomNav } from './navigation/BottomNav';

interface AppShellState {
  sidebarOpen: boolean;
  viewport: ViewportSize;
  breakpoints: LayoutBreakpoints;
  isLoading: boolean;
}

// Utility to detect viewport size
const getViewportSize = (): ViewportSize => {
  if (typeof window === 'undefined') return 'lg';
  
  const width = window.innerWidth;
  if (width < 475) return 'xs';
  if (width < 640) return 'sm';
  if (width < 768) return 'md';
  if (width < 1024) return 'lg';
  if (width < 1280) return 'xl';
  return '2xl';
};

// Determine layout breakpoints based on viewport
const getLayoutBreakpoints = (viewport: ViewportSize): LayoutBreakpoints => {
  const isDesktop = ['lg', 'xl', '2xl'].includes(viewport);
  const isTablet = ['md'].includes(viewport);
  const isMobile = ['xs', 'sm'].includes(viewport);

  return {
    showSidebar: isDesktop,
    showBottomNav: isMobile || isTablet,
    sidebarVariant: isDesktop ? 'desktop' : 'mobile',
    headerVariant: 'glass'
  };
};

export const AppShell: React.FC<AppShellProps> = ({
  children,
  navigation,
  currentRoute,
  sidebarOpen: controlledSidebarOpen,
  onSidebarToggle,
  className,
  variant = 'glass',
  responsive = true
}) => {
  const [state, setState] = useState<AppShellState>({
    sidebarOpen: controlledSidebarOpen ?? false,
    viewport: getViewportSize(),
    breakpoints: getLayoutBreakpoints(getViewportSize()),
    isLoading: true
  });

  // Handle responsive behavior
  useEffect(() => {
    if (!responsive) return;

    const handleResize = () => {
      const newViewport = getViewportSize();
      const newBreakpoints = getLayoutBreakpoints(newViewport);
      
      setState(prev => ({
        ...prev,
        viewport: newViewport,
        breakpoints: newBreakpoints,
        // Auto-close sidebar on mobile when switching from desktop
        sidebarOpen: newBreakpoints.showSidebar ? prev.sidebarOpen : false
      }));
    };

    // Initial load
    handleResize();
    setState(prev => ({ ...prev, isLoading: false }));

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [responsive]);

  // Handle sidebar toggle
  const handleSidebarToggle = () => {
    const newOpen = !state.sidebarOpen;
    setState(prev => ({ ...prev, sidebarOpen: newOpen }));
    onSidebarToggle?.(newOpen);
  };

  // Sync controlled sidebar state
  useEffect(() => {
    if (controlledSidebarOpen !== undefined) {
      setState(prev => ({ ...prev, sidebarOpen: controlledSidebarOpen }));
    }
  }, [controlledSidebarOpen]);

  // Handle search
  const handleSearch = (query: string) => {
    // Implement search logic here

  };

  // Handle profile click
  const handleProfileClick = () => {
    // Implement profile menu logic here

  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Toggle sidebar with Cmd/Ctrl + B
      if ((event.metaKey || event.ctrlKey) && event.key === 'b') {
        event.preventDefault();
        handleSidebarToggle();
      }
      
      // Close sidebar with Escape
      if (event.key === 'Escape' && state.sidebarOpen && !state.breakpoints.showSidebar) {
        handleSidebarToggle();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [state.sidebarOpen, state.breakpoints.showSidebar]);

  // Loading state
  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-lime-50 to-purple-50">
        <motion.div
          className="flex flex-col items-center space-y-4"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="w-16 h-16 bg-gradient-to-r from-lime-500 to-purple-500 rounded-2xl flex items-center justify-center">
            <motion.span
              className="text-white font-bold text-xl"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              KC
            </motion.span>
          </div>
          <p className="text-gray-600 font-medium">Loading KeCaraJoComer...</p>
        </motion.div>
      </div>
    );
  }

  const shellVariants = {
    default: 'bg-gray-50',
    glass: 'bg-gradient-to-br from-lime-50/50 to-purple-50/50'
  };

  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.4,
        ease: 'easeOut'
      }
    }
  };

  return (
    <div className={cn(
      'min-h-screen flex flex-col',
      shellVariants[variant],
      className
    )}>
      {/* Header */}
      <Header
        config={navigation.header}
        onMenuToggle={handleSidebarToggle}
        onSearch={handleSearch}
        onProfileClick={handleProfileClick}
        variant={state.breakpoints.headerVariant}
      />
      
      {/* Debug - Simple Nav for Testing */}
      <div className="bg-red-500 text-white p-2 text-center">
        DEBUG: Navigation should appear here. Sidebar Open: {state.sidebarOpen ? 'Yes' : 'No'}, 
        Show Sidebar: {state.breakpoints.showSidebar ? 'Yes' : 'No'}, 
        Show Bottom Nav: {state.breakpoints.showBottomNav ? 'Yes' : 'No'}
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Sidebar */}
        {state.breakpoints.showSidebar ? (
          // Desktop Sidebar
          <CollapsibleSidebar
            routes={navigation.sidebar}
            isOpen={state.sidebarOpen}
            onToggle={handleSidebarToggle}
            collapsed={!state.sidebarOpen}
          />
        ) : (
          // Mobile Sidebar
          <Sidebar
            routes={navigation.sidebar}
            isOpen={state.sidebarOpen}
            onToggle={handleSidebarToggle}
            variant="mobile"
          />
        )}

        {/* Main Content */}
        <main className={cn(
          'flex-1 flex flex-col overflow-hidden',
          state.breakpoints.showBottomNav && 'pb-20' // Add bottom padding for mobile nav
        )}>
          
          {/* Page Content */}
          <motion.div
            className="flex-1 overflow-auto p-4 lg:p-6"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            key={currentRoute} // Re-animate on route change
          >
            {children}
          </motion.div>

          {/* Scroll to Top Button */}
          <ScrollToTop />
        </main>
      </div>

      {/* Bottom Navigation */}
      {state.breakpoints.showBottomNav && (
        <FloatingBottomNav
          routes={navigation.bottomNav}
          currentRoute={currentRoute}
        />
      )}

      {/* Global Loading Overlay */}
      <GlobalLoadingOverlay />
      
      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
};

// Scroll to Top Component
const ScrollToTop: React.FC = () => {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowButton(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AnimatePresence>
      {showButton && (
        <motion.button
          className="fixed bottom-24 right-4 z-30 p-3 bg-white/80 backdrop-blur-md border border-white/20 rounded-full shadow-lg hover:shadow-xl transition-shadow"
          onClick={scrollToTop}
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          aria-label="Scroll to top"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </motion.button>
      )}
    </AnimatePresence>
  );
};

// Global Loading Overlay (for page transitions)
const GlobalLoadingOverlay: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);

  // This would typically be connected to a global loading state
  // For now, it's just a placeholder
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="flex flex-col items-center space-y-4"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <div className="w-8 h-8 bg-gradient-to-r from-lime-500 to-purple-500 rounded-lg"></div>
            <p className="text-gray-600 font-medium">Loading...</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Toast Notifications Container
const ToastContainer: React.FC = () => {
  // This would typically be connected to a global toast state
  // For now, it's just a placeholder
  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 max-w-sm">
      {/* Toast notifications would be rendered here */}
    </div>
  );
};

// Glass Shell Variant
export const GlassAppShell: React.FC<AppShellProps> = (props) => {
  return <AppShell {...props} variant="glass" />;
};

// Responsive Shell with automatic adaptation
export const ResponsiveAppShell: React.FC<AppShellProps> = (props) => {
  return <AppShell {...props} responsive={true} />;
};

// Compact Shell for focused workflows
export const CompactAppShell: React.FC<AppShellProps & { hideSecondaryNav?: boolean }> = ({
  navigation,
  hideSecondaryNav = false,
  ...props
}) => {
  const compactNavigation = {
    ...navigation,
    sidebar: hideSecondaryNav 
      ? navigation.sidebar.filter(route => ['home', 'planner', 'recipes', 'pantry', 'shopping'].includes(route.id))
      : navigation.sidebar
  };

  return <AppShell {...props} navigation={compactNavigation} />;
};

export default AppShell;