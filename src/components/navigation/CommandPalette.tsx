'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search,
  Hash,
  AtSign,
  ChevronRight,
  Clock,
  Star,
  Home,
  BookOpen,
  Calendar,
  ShoppingCart,
  Package,
  Plus,
  Upload,
  Scan,
  X
} from 'lucide-react';

import { cn } from '@/lib/utils';

interface CommandItem {
  id: string;
  title: string;
  description?: string;
  icon: React.ElementType;
  action: () => void;
  keywords?: string[];
  category: 'navigation' | 'action' | 'search' | 'recent';
  shortcut?: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Command items
  const commands: CommandItem[] = useMemo(() => [
    // Navigation
    {
      id: 'nav-dashboard',
      title: 'Dashboard',
      description: 'Ir al panel principal',
      icon: Home,
      action: () => {
        router.push('/');
        onClose();
      },
      keywords: ['inicio', 'home', 'panel'],
      category: 'navigation',
    },
    {
      id: 'nav-recipes',
      title: 'Recetas',
      description: 'Explorar recetas',
      icon: BookOpen,
      action: () => {
        router.push('/recetas');
        onClose();
      },
      keywords: ['cocinar', 'comida', 'recipe'],
      category: 'navigation',
    },
    // {
    //   id: 'nav-planner',
    //   title: 'Planificador de Comidas',
    //   description: 'Planificar menús semanales',
    //   icon: Calendar,
    //   action: () => {
    //     router.push('/planificador');
    //     onClose();
    //   },
    //   keywords: ['plan', 'menu', 'semana'],
    //   category: 'navigation',
    // },
    {
      id: 'nav-pantry',
      title: 'Despensa',
      description: 'Gestionar inventario',
      icon: Package,
      action: () => {
        router.push('/despensa');
        onClose();
      },
      keywords: ['inventario', 'stock', 'ingredientes'],
      category: 'navigation',
    },
    {
      id: 'nav-shopping',
      title: 'Lista de Compras',
      description: 'Ver lista de compras',
      icon: ShoppingCart,
      action: () => {
        router.push('/lista-compras');
        onClose();
      },
      keywords: ['comprar', 'super', 'mercado'],
      category: 'navigation',
    },
    // Actions
    {
      id: 'action-create-recipe',
      title: 'Crear Receta',
      description: 'Agregar nueva receta',
      icon: Plus,
      action: () => {
        router.push('/recetas/nueva');
        onClose();
      },
      keywords: ['nueva', 'agregar', 'add'],
      category: 'action',
      shortcut: '⌘N',
    },
    {
      id: 'action-generate-recipe',
      title: 'Generar Receta con IA',
      description: 'Crear receta usando inteligencia artificial',
      icon: Star,
      action: () => {
        router.push('/recetas/generar');
        onClose();
      },
      keywords: ['ai', 'ia', 'artificial', 'generar'],
      category: 'action',
      shortcut: '⌘G',
    },
    {
      id: 'action-scan',
      title: 'Escanear Código',
      description: 'Escanear código de barras o recibo',
      icon: Scan,
      action: () => {
        router.push('/despensa/escanear');
        onClose();
      },
      keywords: ['barcode', 'codigo', 'camara'],
      category: 'action',
      shortcut: '⌘S',
    },
    {
      id: 'action-import',
      title: 'Importar Receta',
      description: 'Importar desde URL',
      icon: Upload,
      action: () => {
        router.push('/recetas/importar');
        onClose();
      },
      keywords: ['url', 'link', 'importar'],
      category: 'action',
    },
    // Search examples
    {
      id: 'search-healthy',
      title: 'Buscar recetas saludables',
      icon: Search,
      action: () => {
        router.push('/recetas?filter=saludable');
        onClose();
      },
      keywords: ['saludable', 'dieta', 'fitness'],
      category: 'search',
    },
    {
      id: 'search-quick',
      title: 'Recetas rápidas',
      icon: Clock,
      action: () => {
        router.push('/recetas?filter=rapido');
        onClose();
      },
      keywords: ['rapido', 'facil', 'simple'],
      category: 'search',
    },
  ], [router, onClose]);

  // Filter commands based on search
  const filteredCommands = useMemo(() => {
    if (!search) return commands;

    const searchLower = search.toLowerCase();
    
    // Handle special prefixes
    if (search.startsWith('@')) {
      // Navigate to page
      const query = search.slice(1).toLowerCase();
      return commands.filter(cmd => 
        cmd.category === 'navigation' && 
        (cmd.title.toLowerCase().includes(query) || 
         cmd.keywords?.some(k => k.includes(query)))
      );
    }
    
    if (search.startsWith('#')) {
      // Search recipes
      const query = search.slice(1).toLowerCase();
      return commands.filter(cmd => 
        cmd.category === 'search' && 
        (cmd.title.toLowerCase().includes(query) || 
         cmd.keywords?.some(k => k.includes(query)))
      );
    }
    
    if (search.startsWith('>')) {
      // Execute command
      const query = search.slice(1).toLowerCase();
      return commands.filter(cmd => 
        cmd.category === 'action' && 
        (cmd.title.toLowerCase().includes(query) || 
         cmd.keywords?.some(k => k.includes(query)))
      );
    }

    // Normal search
    return commands.filter(cmd => 
      cmd.title.toLowerCase().includes(searchLower) ||
      cmd.description?.toLowerCase().includes(searchLower) ||
      cmd.keywords?.some(k => k.includes(searchLower))
    );
  }, [search, commands]);

  // Reset selected index when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && selectedIndex >= 0) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'navigation': return AtSign;
      case 'action': return ChevronRight;
      case 'search': return Hash;
      case 'recent': return Clock;
      default: return Search;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'navigation': return 'Páginas';
      case 'action': return 'Acciones';
      case 'search': return 'Búsquedas';
      case 'recent': return 'Recientes';
      default: return 'Otros';
    }
  };

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    filteredCommands.forEach(cmd => {
      if (!groups[cmd.category]) {
        groups[cmd.category] = [];
      }
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Command palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-20 mx-auto max-w-2xl z-50 p-4"
          >
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden">
              {/* Search input */}
              <div className="border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center px-4 py-3">
                  <Search className="w-5 h-5 text-gray-400 mr-3" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar o escribir un comando..."
                    className="flex-1 bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-500"
                  />
                  <button
                    onClick={onClose}
                    className="ml-3 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* Quick shortcuts */}
                <div className="px-4 pb-2 flex items-center space-x-4 text-xs text-gray-500">
                  <span>@páginas</span>
                  <span>#búsqueda</span>
                  <span>&gt;comandos</span>
                  <span>?ayuda</span>
                </div>
              </div>

              {/* Results */}
              <div ref={listRef} className="max-h-96 overflow-y-auto">
                {Object.entries(groupedCommands).length > 0 ? (
                  Object.entries(groupedCommands).map(([category, items], groupIndex) => (
                    <div key={category}>
                      <div className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center space-x-2">
                        {React.createElement(getCategoryIcon(category), { className: "w-3 h-3" })}
                        <span>{getCategoryLabel(category)}</span>
                      </div>
                      {items.map((item, itemIndex) => {
                        const globalIndex = Object.entries(groupedCommands)
                          .slice(0, groupIndex)
                          .reduce((acc, [, prevItems]) => acc + prevItems.length, 0) + itemIndex;
                        
                        return (
                          <button
                            key={item.id}
                            onClick={item.action}
                            onMouseEnter={() => setSelectedIndex(globalIndex)}
                            className={cn(
                              "w-full px-4 py-3 flex items-center space-x-3 transition-colors",
                              selectedIndex === globalIndex
                                ? "bg-orange-50 dark:bg-orange-900/20"
                                : "hover:bg-gray-50 dark:hover:bg-gray-800"
                            )}
                          >
                            <item.icon className="w-5 h-5 text-gray-400" />
                            <div className="flex-1 text-left">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {item.title}
                              </p>
                              {item.description && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {item.description}
                                </p>
                              )}
                            </div>
                            {item.shortcut && (
                              <span className="text-xs text-gray-400 dark:text-gray-500">
                                {item.shortcut}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    <p className="text-sm">No se encontraron resultados</p>
                    <p className="text-xs mt-1">Intenta con otra búsqueda</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}