import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { cn } from '@/lib/utils';

import { HeaderProps, User, Notification } from '../../types';

interface HeaderState {
  searchQuery: string;
  showNotifications: boolean;
  showProfile: boolean;
  notifications: Notification[];
  user: User | null;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  onMenuToggle,
  onSearch,
  onProfileClick,
  className,
  variant = 'glass'
}) => {

  const [state, setState] = useState<HeaderState>({
    searchQuery: '',
    showNotifications: false,
    showProfile: false,
    notifications: [],
    user: null
  });

  const searchRef = useRef<HTMLInputElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setState(prev => ({ ...prev, showNotifications: false }));
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setState(prev => ({ ...prev, showProfile: false }));
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setState(prev => ({ ...prev, showNotifications: false, showProfile: false }));
      }
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearch = (query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }));
    onSearch?.(query);
  };

  const handleNotificationClick = () => {
    setState(prev => ({ ...prev, showNotifications: !prev.showNotifications, showProfile: false }));
  };

  const handleProfileClick = () => {
    setState(prev => ({ ...prev, showProfile: !prev.showProfile, showNotifications: false }));
    onProfileClick?.();
  };

  const variantClasses = {
    default: 'bg-white border-b border-gray-200 shadow-sm',
    glass: 'bg-white/80 backdrop-blur-md border-b border-white/20 shadow-lg',
    transparent: 'bg-transparent'
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full transition-all duration-200',
        variantClasses[variant],
        className
      )}
      role="banner"
    >
      <div className="flex items-center justify-between px-4 lg:px-6 h-16">
        
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          {/* Mobile Menu Button */}
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-lg hover:bg-black/5 transition-colors focus:outline-none focus:ring-2 focus:ring-lime-500"
            aria-label="Toggle navigation menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Logo */}
          {config.showLogo && (
            <motion.div 
              className="flex items-center space-x-2"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-8 h-8 bg-gradient-to-r from-lime-500 to-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">KC</span>
              </div>
              {config.title && (
                <span className="hidden sm:block text-xl font-bold bg-gradient-to-r from-lime-600 to-purple-600 bg-clip-text text-transparent">
                  {config.title}
                </span>
              )}
            </motion.div>
          )}
        </div>

        {/* Center Section - Search */}
        {config.showSearch && (
          <div className="flex-1 max-w-2xl mx-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                ref={searchRef}
                type="text"
                value={state.searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search recipes, ingredients... (⌘K)"
                className={cn(
                  'block w-full pl-10 pr-4 py-2 rounded-lg border transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent',
                  variant === 'glass'
                    ? 'bg-white/50 border-white/30 placeholder-gray-500'
                    : 'bg-gray-50 border-gray-300 placeholder-gray-400'
                )}
                aria-label="Search"
              />
            </div>
          </div>
        )}

        {/* Right Section */}
        <div className="flex items-center space-x-2">
          
          {/* Notifications */}
          {config.showNotifications && (
            <div className="relative" ref={notificationsRef}>
              <motion.button
                onClick={handleNotificationClick}
                className={cn(
                  'relative p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-lime-500',
                  variant === 'glass' ? 'hover:bg-white/20' : 'hover:bg-gray-100'
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="View notifications"
                aria-expanded={state.showNotifications}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 17v-7a8 8 0 1116 0v7" />
                </svg>
                
                {/* Notification Badge */}
                {state.notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {state.notifications.length > 9 ? '9+' : state.notifications.length}
                  </span>
                )}
              </motion.button>

              {/* Notifications Dropdown */}
              <AnimatePresence>
                {state.showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      'absolute right-0 mt-2 w-80 rounded-xl shadow-xl border z-50',
                      variant === 'glass'
                        ? 'bg-white/90 backdrop-blur-md border-white/20'
                        : 'bg-white border-gray-200'
                    )}
                  >
                    <div className="p-4">
                      <h3 className="text-lg font-semibold mb-3">Notifications</h3>
                      {state.notifications.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No new notifications</p>
                      ) : (
                        <div className="space-y-2">
                          {state.notifications.slice(0, 5).map((notification) => (
                            <div
                              key={notification.id}
                              className="p-3 rounded-lg bg-gray-50/50 hover:bg-gray-100/50 transition-colors cursor-pointer"
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{notification.title}</p>
                                  <p className="text-gray-600 text-xs mt-1">{notification.message}</p>
                                </div>
                                <span className="text-xs text-gray-400 ml-2">
                                  {new Date(notification.timestamp).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Profile */}
          {config.showProfile && (
            <div className="relative" ref={profileRef}>
              <motion.button
                onClick={handleProfileClick}
                className={cn(
                  'flex items-center space-x-2 p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-lime-500',
                  variant === 'glass' ? 'hover:bg-white/20' : 'hover:bg-gray-100'
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="User profile menu"
                aria-expanded={state.showProfile}
              >
                <div className="w-8 h-8 bg-gradient-to-r from-lime-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {state.user?.name?.charAt(0) || 'U'}
                  </span>
                </div>
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </motion.button>

              {/* Profile Dropdown */}
              <AnimatePresence>
                {state.showProfile && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      'absolute right-0 mt-2 w-64 rounded-xl shadow-xl border z-50',
                      variant === 'glass'
                        ? 'bg-white/90 backdrop-blur-md border-white/20'
                        : 'bg-white border-gray-200'
                    )}
                  >
                    <div className="p-4">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-lime-500 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium">
                            {state.user?.name?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{state.user?.name || 'User'}</p>
                          <p className="text-sm text-gray-500">{state.user?.email || 'user@example.com'}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <a
                          href="/app/profile"
                          className="block px-3 py-2 rounded-lg text-sm hover:bg-gray-100/50 transition-colors"
                        >
                          Profile Settings
                        </a>
                        <a
                          href="/app/preferences"
                          className="block px-3 py-2 rounded-lg text-sm hover:bg-gray-100/50 transition-colors"
                        >
                          Preferences
                        </a>
                        <hr className="my-2 border-gray-200" />
                        <button
                          className="block w-full text-left px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50/50 transition-colors"
                        >
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;