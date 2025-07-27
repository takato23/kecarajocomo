import {
  Home,
  ChefHat,
  Package,
  Calendar,
  ShoppingCart,
  User,
  BookOpen,
  Camera,
  Mic,
  Bell,
  Settings,
  Heart,
  BarChart3,
  Clock,
  Search,
  Plus,
  Sparkles
} from 'lucide-react';

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: any;
  badge?: number;
  isNew?: boolean;
  isPremium?: boolean;
  subItems?: NavigationItem[];
}

export const navigationItems: NavigationItem[] = [
  {
    id: 'home',
    label: 'Inicio',
    href: '/app',
    icon: Home,
  },
  {
    id: 'recipes',
    label: 'Recetas',
    href: '/recetas',
    icon: BookOpen,
    subItems: [
      {
        id: 'recipes-browse',
        label: 'Explorar Recetas',
        href: '/recetas',
        icon: Search,
      },
      {
        id: 'recipes-favorites',
        label: 'Mis Favoritas',
        href: '/recetas/favorites',
        icon: Heart,
      },
      {
        id: 'recipes-generate',
        label: 'Generar con IA',
        href: '/recetas/generate',
        icon: Sparkles,
        isNew: true,
      },
      {
        id: 'recipes-import',
        label: 'Importar Recetas',
        href: '/recetas/import',
        icon: Plus,
      },
    ],
  },
  {
    id: 'pantry',
    label: 'Despensa',
    href: '/despensa',
    icon: Package,
    badge: 3, // Items expiring soon
    subItems: [
      {
        id: 'pantry-inventory',
        label: 'Mi Inventario',
        href: '/despensa',
        icon: Package,
      },
      {
        id: 'pantry-scan',
        label: 'Escanear Items',
        href: '/scanner',
        icon: Camera,
        isNew: true,
      },
      {
        id: 'pantry-voice',
        label: 'Agregar por Voz',
        href: '/despensa/voice',
        icon: Mic,
      },
      {
        id: 'pantry-analytics',
        label: 'Análisis de Stock',
        href: '/despensa/analytics',
        icon: BarChart3,
        isPremium: true,
      },
    ],
  },
  {
    id: 'planner',
    label: 'Planificador',
    href: '/planificador',
    icon: Calendar,
    subItems: [
      {
        id: 'planner-get-started',
        label: 'Configurar',
        href: '/planificador',
        icon: Calendar,
      },
      {
        id: 'planner-week',
        label: 'Vista Semanal',
        href: '/planificador',
        icon: Calendar,
      },
      {
        id: 'planner-month',
        label: 'Vista Mensual',
        href: '/planificador/monthly',
        icon: Calendar,
        isPremium: true,
      },
      {
        id: 'planner-history',
        label: 'Historial',
        href: '/planificador/history',
        icon: Clock,
      },
    ],
  },
  {
    id: 'shopping',
    label: 'Lista de Compras',
    href: '/lista-compras',
    icon: ShoppingCart,
    badge: 12, // Active items
    subItems: [
      {
        id: 'shopping-active',
        label: 'Lista Activa',
        href: '/lista-compras',
        icon: ShoppingCart,
      },
      {
        id: 'shopping-generate',
        label: 'Generar desde Plan',
        href: '/lista-compras/generate',
        icon: Sparkles,
      },
      {
        id: 'shopping-history',
        label: 'Historial',
        href: '/lista-compras/history',
        icon: Clock,
      },
    ],
  },
  {
    id: 'chef',
    label: 'Chef IA',
    href: '/ai-chef',
    icon: ChefHat,
    isNew: true,
    subItems: [
      {
        id: 'chef-suggest',
        label: '¿Qué cocino hoy?',
        href: '/ai-chef/suggest',
        icon: Sparkles,
      },
      {
        id: 'chef-nutrition',
        label: 'Análisis Nutricional',
        href: '/ai-chef/nutrition',
        icon: BarChart3,
      },
      {
        id: 'chef-substitutes',
        label: 'Sustitutos',
        href: '/ai-chef/substitutes',
        icon: ChefHat,
      },
    ],
  },
  {
    id: 'profile',
    label: 'Mi Perfil',
    href: '/profile',
    icon: User,
    subItems: [
      {
        id: 'profile-settings',
        label: 'Configuración',
        href: '/settings',
        icon: Settings,
      },
      {
        id: 'profile-dietary',
        label: 'Preferencias Dietéticas',
        href: '/profile/preferences',
        icon: Heart,
      },
      {
        id: 'profile-notifications',
        label: 'Notificaciones',
        href: '/profile/notifications',
        icon: Bell,
      },
      {
        id: 'profile-api',
        label: 'API Keys',
        href: '/profile/api',
        icon: Settings,
        isPremium: true,
      },
    ],
  },
];

export const userMenuItems: NavigationItem[] = [
  {
    id: 'user-profile',
    label: 'Mi Perfil',
    href: '/profile',
    icon: User,
  },
  {
    id: 'user-settings',
    label: 'Configuración',
    href: '/settings',
    icon: Settings,
  },
  {
    id: 'user-notifications',
    label: 'Notificaciones',
    href: '/profile/notifications',
    icon: Bell,
  },
];

export const navigationConfig = {
  accessibility: {
    enableKeyboardShortcuts: true,
    enableScreenReaderAnnouncements: true,
    enableFocusIndicators: true,
  },
  hapticFeedback: {
    enabled: true,
    patterns: {
      swipe: [10],
      tap: [5],
      longPress: [20],
      doubleTap: [5, 50, 5],
    },
  },
  animation: {
    duration: 200,
    easing: 'ease-out',
  },
  search: {
    debounceMs: 300,
    minQueryLength: 2,
    maxResults: 10,
  },
};

export const mobileNavigationItems = navigationItems.map(item => ({
  ...item,
  // Remove subItems for mobile bottom navigation
  subItems: undefined,
})).filter(item => 
  // Show only main items in mobile bottom nav
  ['home', 'recipes', 'pantry', 'shopping'].includes(item.id)
);

export const quickActions = [
  {
    id: 'quick-scan',
    label: 'Escanear',
    icon: Camera,
    href: '/scanner',
    color: 'purple',
  },
  {
    id: 'quick-voice',
    label: 'Voz',
    icon: Mic,
    href: '/pantry/voice',
    color: 'blue',
  },
  {
    id: 'quick-generate',
    label: 'Generar Receta',
    icon: Sparkles,
    href: '/recipes/generate',
    color: 'orange',
  },
  {
    id: 'quick-add',
    label: 'Agregar Item',
    icon: Plus,
    href: '/despensa/add',
    color: 'green',
  },
];