'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Bell, 
  User, 
  Menu,
  ChevronDown,
  Home,
  BookOpen,
  Calendar,
  ShoppingCart,
  Package,
  Settings,
  LogOut
} from 'lucide-react';

import { cn } from '@/lib/utils';

import { CommandPalette } from './CommandPalette';

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
  // {
  //   label: 'Planificador',
  //   href: '/planificador',
  //   icon: Calendar,
  //   children: [
  //     { label: 'Vista Semanal', href: '/planificador' },
  //     { label: 'Vista Mensual', href: '/planificador/mensual' },
  //     { label: 'Historial', href: '/planificador/historial' },
  //     { label: 'Sugerencias IA', href: '/planificador/sugerencias' },
  //   ],
  // },
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
    label: 'Lista de Compras',
    href: '/lista-compras',
    icon: ShoppingCart,
    badge: 5,
  },
];

export function Navbar() {
  const pathname = usePathname();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
        setUserMenuOpen(false);
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
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and primary navigation */}
            <div className="flex items-center">
              {/* Logo */}
              <Link href="/" className="flex items-center space-x-3 mr-8">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">K</span>
                </div>
                <span className="hidden lg:block font-bold text-xl text-gray-900 dark:text-white">
                  KeCarajoComer
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
                          "flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                          isActive(item.href)
                            ? "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20"
                            : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
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
                          "flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                          isActive(item.href)
                            ? "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20"
                            : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
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
                          className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1"
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
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <div className={cn(
                  "relative transition-all duration-300",
                  searchFocused ? "w-64" : "w-48"
                )}>
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar... (⌘K)"
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    onClick={() => setCommandPaletteOpen(true)}
                    readOnly
                    className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent cursor-pointer"
                  />
                </div>
              </div>

              {/* Notifications */}
              <button className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1"
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
                        onClick={() => {
                          setUserMenuOpen(false);
                          // Handle logout
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
              <button className="md:hidden p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-pink-500 transform scale-x-0 transition-transform duration-300" />
      </nav>

      {/* Command Palette */}
      <CommandPalette 
        isOpen={commandPaletteOpen} 
        onClose={() => setCommandPaletteOpen(false)} 
      />
    </>
  );
}