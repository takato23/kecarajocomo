'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSwipeable } from 'react-swipeable';
import { 
  Settings, 
  Heart, 
  Home,
  Users,
  Activity
} from 'lucide-react';

import { cn } from '@/lib/utils';

export interface ProfileTab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number;
}

interface ProfileTabsProps {
  tabs: ProfileTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  children: React.ReactNode;
  className?: string;
}

const defaultTabs: ProfileTab[] = [
  { id: 'overview', label: 'Overview', icon: <Home className="w-4 h-4" /> },
  { id: 'preferences', label: 'Preferences', icon: <Heart className="w-4 h-4" /> },
  { id: 'household', label: 'Household', icon: <Users className="w-4 h-4" /> },
  { id: 'activity', label: 'Activity', icon: <Activity className="w-4 h-4" /> },
  { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
];

export function ProfileTabs({
  tabs = defaultTabs,
  activeTab,
  onTabChange,
  children,
  className,
}: ProfileTabsProps) {
  const [tabDirection, setTabDirection] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Update indicator position
  useEffect(() => {
    if (activeTabRef.current && indicatorRef.current && !isMobile) {
      const tab = activeTabRef.current;
      const indicator = indicatorRef.current;
      
      indicator.style.left = `${tab.offsetLeft}px`;
      indicator.style.width = `${tab.offsetWidth}px`;
    }
  }, [activeTab, isMobile]);

  const activeTabIndex = tabs.findIndex(tab => tab.id === activeTab);

  const navigateToTab = (newIndex: number) => {
    if (newIndex < 0 || newIndex >= tabs.length) return;
    
    const direction = newIndex > activeTabIndex ? 1 : -1;
    setTabDirection(direction);
    onTabChange(tabs[newIndex].id);

    // Haptic feedback on mobile (if supported)
    if (isMobile && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => navigateToTab(activeTabIndex + 1),
    onSwipedRight: () => navigateToTab(activeTabIndex - 1),
    threshold: 50,
    trackMouse: false,
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        navigateToTab(activeTabIndex - 1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        navigateToTab(activeTabIndex + 1);
        break;
      case 'Home':
        e.preventDefault();
        navigateToTab(0);
        break;
      case 'End':
        e.preventDefault();
        navigateToTab(tabs.length - 1);
        break;
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Tab Navigation */}
      <div
        className={cn(
          'relative overflow-hidden',
          'bg-glass-subtle backdrop-blur-md',
          'border border-white/10 rounded-xl',
          'p-1'
        )}
      >
        <nav
          ref={tabsRef}
          role="tablist"
          aria-label="Profile sections"
          className={cn(
            'relative flex',
            isMobile ? 'gap-0' : 'gap-1'
          )}
          onKeyDown={handleKeyDown}
        >
          {/* Desktop Indicator */}
          {!isMobile && (
            <div
              ref={indicatorRef}
              className={cn(
                'absolute bottom-1 h-[calc(100%-8px)]',
                'bg-glass-medium backdrop-blur-sm rounded-lg',
                'transition-all duration-300 ease-out',
                'border border-white/10'
              )}
              style={{
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            />
          )}

          {tabs.map((tab, index) => {
            const isActive = tab.id === activeTab;
            
            return (
              <button
                key={tab.id}
                ref={isActive ? activeTabRef : null}
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={isActive}
                aria-controls={`panel-${tab.id}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => {
                  const direction = index > activeTabIndex ? 1 : -1;
                  setTabDirection(direction);
                  onTabChange(tab.id);
                }}
                className={cn(
                  'relative flex items-center justify-center gap-2',
                  'px-4 py-2.5 rounded-lg',
                  'text-sm font-medium',
                  'transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-food-warm/50',
                  'flex-1 md:flex-initial',
                  isActive
                    ? 'text-glass-strong z-10'
                    : 'text-glass-medium hover:text-glass-strong',
                  isMobile && isActive && 'bg-glass-medium'
                )}
              >
                {tab.icon && (
                  <span className={cn(
                    'transition-transform',
                    isActive && 'scale-110'
                  )}>
                    {tab.icon}
                  </span>
                )}
                <span className={cn(
                  'hidden sm:inline',
                  isMobile && !isActive && 'sr-only'
                )}>
                  {tab.label}
                </span>
                {tab.badge && tab.badge > 0 && (
                  <span className={cn(
                    'absolute -top-1 -right-1',
                    'flex items-center justify-center',
                    'w-5 h-5 rounded-full',
                    'bg-food-warm text-white',
                    'text-xs font-semibold'
                  )}>
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div {...(isMobile ? swipeHandlers : {})}>
        <AnimatePresence mode="wait" custom={tabDirection}>
          <motion.div
            key={activeTab}
            custom={tabDirection}
            initial={{ 
              x: tabDirection > 0 ? 100 : -100, 
              opacity: 0 
            }}
            animate={{ 
              x: 0, 
              opacity: 1 
            }}
            exit={{ 
              x: tabDirection > 0 ? -100 : 100, 
              opacity: 0 
            }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30,
            }}
            role="tabpanel"
            id={`panel-${activeTab}`}
            aria-labelledby={`tab-${activeTab}`}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Mobile Swipe Indicator */}
      {isMobile && (
        <div className="flex justify-center gap-1.5 mt-4">
          {tabs.map((tab, index) => (
            <div
              key={tab.id}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                index === activeTabIndex
                  ? 'w-6 bg-food-warm'
                  : 'w-1.5 bg-glass-medium'
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}