'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  User, 
  Menu,
  ChevronDown,
  Home,
  BookOpen,
  ShoppingCart,
  Package,
  Settings,
  LogOut,
  Calendar,
  Sun,
  Moon
} from 'lucide-react';

import { cn } from '@/lib/utils';

import { CommandPalette } from './CommandPalette';
import { CompactDarkModeToggle } from '@/components/ui/DarkModeToggle';

import { useUser } from '@/store';
import { useTheme } from '@/contexts/ThemeContext';


interface NavItem {
  label: string;
  href: string;
  icon?: React.ElementType;
  children?: NavItem[];
  badge?: number;
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/',
    icon: Home,
  },
  {
    label: 'Planificador',
    href: '/planificador',
    icon: Calendar,
  },
  {
    label: 'Recetas',
    href: '/recetas',
    icon: BookOpen,
    children: [
      { label: 'Explorar', href: '/recetas' },
      { label: 'Mis Recetas', href: '/recetas/mis-recetas' },
      { label: 'Favoritas', href: '/recetas/favoritas' },
      { label: 'Generar con IA', href: '/recetas/generar' },
    ],
  },
  {
    label: 'Despensa',
    href: '/despensa',
    icon: Package,
    children: [
      { label: 'Mi Despensa', href: '/despensa' },
      { label: 'Agregar Items', href: '/despensa/agregar' },
      { label: 'Escanear', href: '/despensa/escanear' },
      { label: 'Alertas', href: '/despensa/alertas' },
    ],
  },
  {
    label: 'Compras',
    href: '/lista-compras',
    icon: ShoppingCart,
    badge: 5,
  },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useUser();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Use theme from context
  const { effectiveTheme, toggleTheme } = useTheme();
  const isDarkMode = effectiveTheme === 'dark';

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
        setUserMenuOpen(false);
        setNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Command palette keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isActive = (href: string) => {
    if (href === '/') return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <>
      <div className="fixed top-4 left-4 right-4 z-50">
        {/* Glow effect behind navbar */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl blur-xl opacity-50 transition-opacity duration-500 hover:opacity-75" />
        
        <nav className="relative rounded-2xl transition-all duration-500"
             style={{
               background: isDarkMode ? 'rgba(17, 24, 39, 0.85)' : 'rgba(255, 255, 255, 0.1)',
               backdropFilter: 'blur(30px)',
               WebkitBackdropFilter: 'blur(30px)',
               border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.2)',
               boxShadow: isDarkMode ? `
                 inset 2px 2px 4px rgba(255, 255, 255, 0.05),
                 inset -2px -2px 4px rgba(0, 0, 0, 0.3),
                 8px 8px 20px rgba(0, 0, 0, 0.6),
                 -2px -2px 4px rgba(255, 255, 255, 0.1)
               ` : `
                 inset 6px 6px 12px rgba(255, 255, 255, 0.3),
                 inset -6px -6px 12px rgba(0, 0, 0, 0.05),
                 12px 12px 30px rgba(0, 0, 0, 0.2),
                 -4px -4px 8px rgba(255, 255, 255, 0.5)
               `,
             }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and primary navigation */}
            <div className="flex items-center">
              {/* Logo */}
              <Link href="/" className="flex items-center space-x-3 mr-8">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">K</span>
                </div>
                <span className={cn(
                  "hidden lg:block font-bold text-xl",
                  isDarkMode ? "text-white" : "text-gray-900"
                )}>
                  Ke Carajo Comer
                </span>
              </Link>

              {/* Primary navigation */}
              <div className="hidden md:flex items-center space-x-1" ref={dropdownRef}>
                {navItems.map((item) => (
                  <div key={item.href} className="relative">
                    {item.children ? (
                      <button
                        onClick={() => setActiveDropdown(activeDropdown === item.label ? null : item.label)}
                        className={cn(
                          "flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300",
                          isActive(item.href)
                            ? "text-gray-900 bg-white/30 backdrop-blur-sm shadow-lg"
                            : "text-gray-700 hover:text-gray-900 hover:bg-white/20 backdrop-blur-sm"
                        )}
                      >
                        {item.icon && <item.icon className="w-4 h-4" />}
                        <span>{item.label}</span>
                        <ChevronDown className={cn(
                          "w-4 h-4 transition-transform",
                          activeDropdown === item.label && "rotate-180"
                        )} />
                        {item.badge && (
                          <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-orange-500 text-white rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    ) : (
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300",
                          isActive(item.href)
                            ? "text-gray-900 bg-white/30 backdrop-blur-sm shadow-lg"
                            : "text-gray-700 hover:text-gray-900 hover:bg-white/20 backdrop-blur-sm"
                        )}
                      >
                        {item.icon && <item.icon className="w-4 h-4" />}
                        <span>{item.label}</span>
                        {item.badge && (
                          <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-orange-500 text-white rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    )}

                    {/* Dropdown menu */}
                    <AnimatePresence>
                      {item.children && activeDropdown === item.label && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="absolute top-full left-0 mt-1 w-56 rounded-xl py-1"
                          style={{
                            zIndex: 9999,
                            background: isDarkMode ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                          }}
                        >
                          {item.children.map((child) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={() => setActiveDropdown(null)}
                              className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors"
                            >
                              {child.label}
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>

            {/* Right side items */}
            <div className="flex items-center space-x-2" ref={dropdownRef}>
              {/* Notifications */}
              <div className="relative">
                <button 
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className={cn(
                    "relative p-2.5 rounded-xl transition-all duration-300",
                    "backdrop-blur-sm border",
                    notificationsOpen
                      ? "bg-white/30 border-white/40 shadow-lg"
                      : isDarkMode 
                        ? "bg-white/10 hover:bg-white/20 border-white/20 text-white"
                        : "bg-white/70 hover:bg-white/90 border-gray-200 text-gray-700"
                  )}
                  aria-label="Notificaciones"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                </button>

                {/* Notifications dropdown */}
                <AnimatePresence>
                  {notificationsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-80 rounded-xl py-2"
                      style={{
                        zIndex: 9999,
                        background: isDarkMode ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                      }}
                    >
                      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="font-semibold text-gray-900 dark:text-white">Notificaciones</h3>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        <div className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Nueva receta disponible</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Hace 5 minutos</p>
                        </div>
                        <div className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Tu lista de compras está lista</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Hace 1 hora</p>
                        </div>
                        <div className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">3 productos por vencer</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Hace 2 horas</p>
                        </div>
                      </div>
                      <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
                        <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                          Ver todas las notificaciones
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Theme toggle */}
              <CompactDarkModeToggle />

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className={cn(
                    "flex items-center space-x-2 p-2 pr-3 rounded-xl transition-all duration-300",
                    "backdrop-blur-sm border",
                    userMenuOpen
                      ? "bg-white/30 border-white/40 shadow-lg"
                      : isDarkMode 
                        ? "bg-white/10 hover:bg-white/20 border-white/20"
                        : "bg-white/70 hover:bg-white/90 border-gray-200"
                  )}
                  aria-label="Menú de usuario"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <ChevronDown className={cn(
                    "w-4 h-4 transition-transform",
                    userMenuOpen && "rotate-180",
                    isDarkMode ? "text-white" : "text-gray-700"
                  )} />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-48 rounded-xl py-1"
                      style={{
                        zIndex: 9999,
                        background: isDarkMode ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                      }}
                    >
                      <Link
                        href="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors"
                      >
                        <User className="w-4 h-4" />
                        <span>Mi Perfil</span>
                      </Link>
                      <Link
                        href="/settings"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Configuración</span>
                      </Link>
                      <hr className="my-1 border-gray-200 dark:border-gray-700" />
                      <button
                        onClick={async () => {
                          setUserMenuOpen(false);
                          try {
                            // TODO: Implement sign out
                            router.push('/login');
                            router.push('/');
                          } catch (error) {
                            console.error('Error al cerrar sesión:', error);
                          }
                        }}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Cerrar Sesión</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile menu button */}
              <button className={cn(
                "md:hidden p-2 transition-colors",
                isDarkMode 
                  ? "text-white hover:text-white/80"
                  : "text-gray-600 hover:text-gray-900"
              )}>
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        </nav>
      </div>

      {/* Command Palette */}
      <CommandPalette 
        isOpen={commandPaletteOpen} 
        onClose={() => setCommandPaletteOpen(false)} 
      />
    </>
  );
}