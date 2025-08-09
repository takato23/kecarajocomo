'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  Calendar,
  ChefHat,
  ShoppingCart,
  Package,
  Sparkles,
  Coffee,
  Moon,
  Sun,
  Award,
  Heart,
  Activity,
  Timer,
  TrendingUp,
  Clock,
  ArrowRight,
  Zap,
  Star,
  Flame,
  BarChart3,
  Check
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { DarkModeToggle } from '@/components/ui/DarkModeToggle';
import { GlassCard, GlassButton, GlassModal } from '@/components/ui/GlassCard';
import { useAuth } from '@/components/auth/AuthProvider';
import { cn } from '@/lib/utils';
import { logger } from '@/services/logger';

// Mock data for recipes
const trendingRecipes = [
  {
    id: '1',
    name: 'Pasta Alfredo Vegana',
    image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400',
    time: '25 min',
    difficulty: 'Fácil',
    rating: 4.8,
    saves: 234,
    author: 'Chef María',
    tags: ['Vegano', 'Pasta', 'Italiano']
  },
  {
    id: '2',
    name: 'Buddha Bowl Arcoíris',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400',
    time: '20 min',
    difficulty: 'Fácil',
    rating: 4.9,
    saves: 189,
    author: 'Chef Carlos',
    tags: ['Saludable', 'Bowl', 'Vegano']
  },
  {
    id: '3',
    name: 'Tacos de Jackfruit',
    image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400',
    time: '30 min',
    difficulty: 'Medio',
    rating: 4.7,
    saves: 167,
    author: 'Chef Ana',
    tags: ['Mexicano', 'Vegano', 'Tacos']
  },
  {
    id: '4',
    name: 'Smoothie Detox Verde',
    image: 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=400',
    time: '10 min',
    difficulty: 'Fácil',
    rating: 4.6,
    saves: 145,
    author: 'Chef Luis',
    tags: ['Bebida', 'Detox', 'Saludable']
  }
];

const UltraModernDashboard: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [greeting, setGreeting] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Set greeting based on time of day
  useEffect(() => {
    logger.debug('UltraModernDashboard MONTADO - Los botones del menú deberían aparecer abajo del saludo', 'UltraModernDashboard');
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Buenos días');
    else if (hour < 18) setGreeting('Buenas tardes');
    else setGreeting('Buenas noches');
  }, []);

  // Animated counter
  const AnimatedCounter = ({ value, suffix = '' }: { value: number; suffix?: string }) => {
    const [count, setCount] = useState(0);
    
    useEffect(() => {
      const timer = setTimeout(() => {
        if (count < value) {
          setCount(prev => Math.min(prev + Math.ceil(value / 20), value));
        }
      }, 50);
      return () => clearTimeout(timer);
    }, [count, value]);

    return <span>{count}{suffix}</span>;
  };

  const handleRecipeClick = (recipe: any) => {
    setSelectedRecipe(recipe);
    setShowRecipeModal(true);
  };

  return (
    <div className="relative">

      {/* Content */}
      <div className="relative z-10">

          {/* Main Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Welcome Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <h1 className="text-3xl font-bold mb-2">
                <span className="bg-gradient-to-r from-orange-600 via-pink-600 to-purple-600 dark:from-orange-400 dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent">
                  {greeting}, {user?.user_metadata?.full_name || 'Chef'}
                </span>
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                {format(currentDate, "EEEE, d 'de' MMMM", { locale: es })}
              </p>
            </motion.div>

            {/* Quick Access Cards - Acciones principales del usuario */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
            >
              <GlassCard 
                variant="light" 
                className="p-6 hover:scale-105 transition-transform cursor-pointer group"
                onClick={() => router.push('/planificador')}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl mb-4 group-hover:from-blue-500/30 group-hover:to-cyan-500/30 transition-colors">
                    <Calendar className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Planificar</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Organiza tu semana</p>
                </div>
              </GlassCard>

              <GlassCard 
                variant="light" 
                className="p-6 hover:scale-105 transition-transform cursor-pointer group"
                onClick={() => router.push('/recetas')}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl mb-4 group-hover:from-purple-500/30 group-hover:to-pink-500/30 transition-colors">
                    <ChefHat className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Recetas</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Explora platos nuevos</p>
                </div>
              </GlassCard>

              <GlassCard 
                variant="light" 
                className="p-6 hover:scale-105 transition-transform cursor-pointer group"
                onClick={() => router.push('/despensa')}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl mb-4 group-hover:from-green-500/30 group-hover:to-emerald-500/30 transition-colors">
                    <Package className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Despensa</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Tus ingredientes</p>
                </div>
              </GlassCard>

              <GlassCard 
                variant="light" 
                className="p-6 hover:scale-105 transition-transform cursor-pointer group"
                onClick={() => router.push('/lista-compras')}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-2xl mb-4 group-hover:from-orange-500/30 group-hover:to-red-500/30 transition-colors">
                    <ShoppingCart className="w-8 h-8 text-orange-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Compras</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Lista inteligente</p>
                </div>
              </GlassCard>
            </motion.div>
            
            {/* Main Menu Cards ORIGINAL (comentado por ahora) */}
            {/* <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
            >
              {[
                // {
                //   icon: Calendar,
                //   label: 'Planificar Semana',
                //   description: 'Organiza tus comidas',
                //   href: '/planificador',
                //   color: 'from-blue-500 to-cyan-500',
                //   bgColor: 'bg-blue-50 dark:bg-blue-900/20'
                // },
                {
                  icon: ChefHat,
                  label: 'Explorar Recetas',
                  description: 'Descubre nuevos platos',
                  href: '/recetas',
                  color: 'from-purple-500 to-pink-500',
                  bgColor: 'bg-purple-50 dark:bg-purple-900/20'
                },
                {
                  icon: Package,
                  label: 'Mi Despensa',
                  description: 'Gestiona ingredientes',
                  href: '/despensa',
                  color: 'from-green-500 to-emerald-500',
                  bgColor: 'bg-green-50 dark:bg-green-900/20'
                },
                {
                  icon: ShoppingCart,
                  label: 'Lista de Compras',
                  description: 'Compra inteligente',
                  href: '/lista-compras',
                  color: 'from-orange-500 to-red-500',
                  bgColor: 'bg-orange-50 dark:bg-orange-900/20'
                }
              ].map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * index }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push(item.href)}
                  className="cursor-pointer"
                >
                  <div className={cn(
                    "p-6 h-full rounded-xl border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all",
                    item.bgColor
                  )}>
                    <div className={cn(
                      "p-4 rounded-xl bg-gradient-to-br text-white mb-4 inline-block",
                      item.color
                    )}>
                      <item.icon className="w-8 h-8" />
                    </div>
                    <h3 className="font-bold text-xl mb-2 text-gray-900">{item.label}</h3>
                    <p className="text-base text-gray-600">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>


            {/* Main Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Today's Plan */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="lg:col-span-2"
              >
                <GlassCard variant="strong" className="h-full p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2 dark:text-white">
                      <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      Plan de Hoy
                    </h2>
                    <GlassButton
                      variant="subtle"
                      size="sm"
                      // onClick={() => router.push('/planificador')}
                    >
                      Ver Semana
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </GlassButton>
                  </div>

                  <div className="space-y-4">
                    {[
                      {
                        meal: 'Desayuno',
                        time: '8:00 AM',
                        name: 'Tostadas con Aguacate y Huevo Pochado',
                        calories: 320,
                        icon: Coffee,
                        color: 'from-orange-400 to-amber-400',
                        status: 'completed',
                        image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=200'
                      },
                      {
                        meal: 'Almuerzo',
                        time: '1:00 PM',
                        name: 'Ensalada César con Pollo a la Parrilla',
                        calories: 450,
                        icon: Sun,
                        color: 'from-blue-400 to-cyan-400',
                        status: 'current',
                        timer: 25,
                        image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=200'
                      },
                      {
                        meal: 'Snack',
                        time: '4:00 PM',
                        name: 'Smoothie de Frutos Rojos',
                        calories: 180,
                        icon: Zap,
                        color: 'from-pink-400 to-rose-400',
                        status: 'pending',
                        image: 'https://images.unsplash.com/photo-1638176066666-ffb2f013c7dd?w=200'
                      },
                      {
                        meal: 'Cena',
                        time: '8:00 PM',
                        name: 'Pasta Primavera con Vegetales Asados',
                        calories: 520,
                        icon: Moon,
                        color: 'from-purple-400 to-pink-400',
                        status: 'pending',
                        image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=200'
                      }
                    ].map((mealData, index) => (
                      <motion.div
                        key={mealData.meal}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + index * 0.1 }}
                        whileHover={{ x: 5 }}
                        className={cn(
                          "relative p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 cursor-pointer group",
                          mealData.status === 'current' && "ring-2 ring-blue-500 bg-blue-50/50 dark:bg-blue-900/20"
                        )}
                        // onClick={() => router.push('/planificador')}
                      >
                        <div className="flex items-start gap-4">
                          {/* Image */}
                          <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                            <img 
                              src={mealData.image} 
                              alt={mealData.name}
                              className="w-full h-full object-cover"
                            />
                            {mealData.status === 'completed' && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <Check className="w-8 h-8 text-white" />
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <div className={cn(
                                    "p-1.5 rounded-lg bg-gradient-to-br text-white",
                                    mealData.color
                                  )}>
                                    <mealData.icon className="w-4 h-4" />
                                  </div>
                                  <span className="text-sm font-medium dark:text-white">{mealData.meal}</span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">• {mealData.time}</span>
                                </div>
                                <h4 className="font-medium text-sm dark:text-gray-200">{mealData.name}</h4>
                              </div>
                              
                              {mealData.status === 'current' && mealData.timer && (
                                <GlassButton
                                  variant="subtle"
                                  size="sm"
                                  className="gap-1"
                                >
                                  <Timer className="w-3 h-3" />
                                  {mealData.timer}m
                                </GlassButton>
                              )}
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-300">
                                {mealData.calories} cal
                              </span>
                              <motion.div
                                whileHover={{ x: 5 }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <ArrowRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                              </motion.div>
                            </div>
                          </div>
                        </div>

                        {/* Progress bar for current meal */}
                        {mealData.status === 'current' && (
                          <motion.div
                            className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                            initial={{ width: '0%' }}
                            animate={{ width: '60%' }}
                            transition={{ duration: 1500, ease: 'linear' }}
                          />
                        )}
                      </motion.div>
                    ))}
                  </div>

                  {/* Daily Summary */}
                  <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium mb-1 dark:text-white">Resumen del Día</p>
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                          Total: 1,470 cal • Proteínas: 78g • Carbos: 156g • Grasas: 52g
                        </p>
                      </div>
                      <GlassButton
                        variant="subtle"
                        size="sm"
                      >
                        <BarChart3 className="w-4 h-4" />
                      </GlassButton>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>

              {/* Quick Actions & Insights */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-6"
              >
                {/* AI Suggestions */}
                <GlassCard variant="strong" className="p-6" spotlight>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl text-white">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold dark:text-white">Chef IA Sugiere</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Basado en tu despensa</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl text-left group"
                      onClick={() => router.push('/recetas')}
                    >
                      <p className="font-medium text-sm mb-1 dark:text-white">Risotto de Champiñones</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Tienes todos los ingredientes</p>
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full p-3 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl text-left"
                      onClick={() => router.push('/recetas')}
                    >
                      <p className="font-medium text-sm mb-1 dark:text-white">Curry de Garbanzos</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Te falta: leche de coco</p>
                    </motion.button>
                  </div>

                  <GlassButton
                    variant="subtle"
                    size="sm"
                    className="w-full mt-4 justify-center"
                    onClick={() => router.push('/recetas')}
                  >
                    Generar más ideas
                    <Sparkles className="w-4 h-4 ml-2" />
                  </GlassButton>
                </GlassCard>

                {/* Quick Stats */}
                <GlassCard variant="medium" className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2 dark:text-white">
                    <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    Esta Semana
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Comidas planificadas</span>
                      <span className="font-medium dark:text-white">21/28</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Calorías promedio</span>
                      <span className="font-medium dark:text-white">1,850</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Ahorro estimado</span>
                      <span className="font-medium text-green-600 dark:text-green-400">$45</span>
                    </div>
                  </div>
                </GlassCard>

                {/* Pantry Snapshot - NUEVO */}
                <GlassCard variant="medium" className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold flex items-center gap-2 dark:text-white">
                      <Package className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      Mi Despensa
                    </h3>
                    <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs rounded-full font-medium">
                      2 por vencer
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    {[
                      { name: 'Yogur natural', days: 2, urgent: true },
                      { name: 'Leche entera', days: 4, urgent: false },
                      { name: 'Tomates cherry', days: 6, urgent: false },
                      { name: 'Pan integral', days: 1, urgent: true },
                      { name: 'Espinacas', days: 3, urgent: false }
                    ].slice(0, 4).map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="dark:text-gray-300 flex-1 truncate">{item.name}</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium ml-2",
                          item.days <= 2 ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" :
                          item.days <= 4 ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" :
                          "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                        )}>
                          {item.days}d
                        </span>
                      </div>
                    ))}
                  </div>

                  <GlassButton
                    variant="subtle"
                    size="sm"
                    className="w-full justify-center"
                    onClick={() => router.push('/despensa')}
                  >
                    Ver despensa completa
                  </GlassButton>
                </GlassCard>

                {/* Shopping List Preview */}
                <GlassCard variant="medium" className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold flex items-center gap-2 dark:text-white">
                      <ShoppingCart className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      Lista de Compras
                    </h3>
                    <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs rounded-full font-medium">
                      5 items
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    {['Leche de coco', 'Espinacas frescas', 'Pan integral'].map((item, i) => (
                      <label key={i} className="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox" className="w-4 h-4 text-purple-600 rounded" />
                        <span className="text-sm group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors dark:text-gray-300">{item}</span>
                      </label>
                    ))}
                  </div>

                  <GlassButton
                    variant="subtle"
                    size="sm"
                    className="w-full justify-center"
                    onClick={() => router.push('/lista-compras')}
                  >
                    Ver lista completa
                  </GlassButton>
                </GlassCard>
              </motion.div>
            </div>

            {/* Stats compactas - menos prominentes */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-8 mb-8"
            >
              <GlassCard variant="light" className="p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">Progreso Personal</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { 
                      icon: Flame, 
                      label: 'Racha', 
                      value: 15, 
                      suffix: ' días', 
                      color: 'text-orange-600 dark:text-orange-400',
                    },
                    { 
                      icon: Star, 
                      label: 'Puntos', 
                      value: 2450, 
                      suffix: '', 
                      color: 'text-yellow-600 dark:text-yellow-400',
                    },
                    { 
                      icon: Heart, 
                      label: 'Favoritos', 
                      value: 48, 
                      suffix: '', 
                      color: 'text-pink-600 dark:text-pink-400',
                    },
                    { 
                      icon: Award, 
                      label: 'Nivel', 
                      value: 12, 
                      suffix: '', 
                      color: 'text-purple-600 dark:text-purple-400',
                    }
                  ].map((stat, index) => (
                    <div key={stat.label} className="text-center">
                      <div className="flex justify-center mb-2">
                        <stat.icon className={cn("w-6 h-6", stat.color)} />
                      </div>
                      <p className="text-2xl font-bold dark:text-white">
                        <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </motion.div>

            {/* Trending Recipes Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-4"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2 dark:text-white">
                  <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  Recetas Populares
                </h2>
                
                {/* Filter Tabs */}
                <div className="flex items-center gap-2">
                  {['all', 'vegano', 'rápido', 'saludable'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setActiveFilter(filter)}
                      className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                        activeFilter === filter
                          ? "bg-purple-600 text-white"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                      )}
                    >
                      {filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {trendingRecipes.map((recipe, index) => (
                  <motion.div
                    key={recipe.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    whileHover={{ y: -5 }}
                    className="cursor-pointer"
                    onClick={() => handleRecipeClick(recipe)}
                  >
                    <GlassCard variant="medium" className="h-full overflow-hidden group" interactive>
                      {/* Image */}
                      <div className="relative h-48 overflow-hidden">
                        <img 
                          src={recipe.image} 
                          alt={recipe.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        
                        {/* Badges */}
                        <div className="absolute top-4 left-4 flex gap-2">
                          {recipe.tags.slice(0, 2).map((tag) => (
                            <span 
                              key={tag}
                              className="px-2 py-1 bg-white/90 backdrop-blur-sm text-xs rounded-full font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        {/* Save button */}
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Handle save
                          }}
                        >
                          <Heart className="w-4 h-4" />
                        </motion.button>

                        {/* Time & Difficulty */}
                        <div className="absolute bottom-4 left-4 flex items-center gap-3 text-white">
                          <span className="flex items-center gap-1 text-sm">
                            <Clock className="w-4 h-4" />
                            {recipe.time}
                          </span>
                          <span className="text-sm">{recipe.difficulty}</span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <h3 className="font-semibold mb-2 line-clamp-1 dark:text-white">{recipe.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                          por {recipe.author}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-500 fill-current" />
                              <span className="text-sm font-medium dark:text-white">{recipe.rating}</span>
                            </div>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              ({recipe.saves} guardados)
                            </span>
                          </div>
                          
                          <motion.div
                            whileHover={{ x: 5 }}
                          >
                            <ArrowRight className="w-4 h-4 text-gray-400" />
                          </motion.div>
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

      {/* Recipe Modal */}
      <GlassModal
        isOpen={showRecipeModal}
        onClose={() => setShowRecipeModal(false)}
        title={selectedRecipe?.name}
        size="lg"
      >
        {selectedRecipe && (
          <div className="p-6">
            <img 
              src={selectedRecipe.image} 
              alt={selectedRecipe.name}
              className="w-full h-64 object-cover rounded-xl mb-6"
            />
            
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-1">
                <Clock className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <span className="dark:text-gray-300">{selectedRecipe.time}</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 text-yellow-500 dark:text-yellow-400 fill-current" />
                <span className="dark:text-gray-300">{selectedRecipe.rating}</span>
              </div>
              <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm">
                {selectedRecipe.difficulty}
              </span>
            </div>

            <div className="flex gap-4">
              <GlassButton
                variant="subtle"
                className="flex-1 justify-center"
                onClick={() => {
                  setShowRecipeModal(false);
                  router.push(`/recetas`);
                }}
              >
                Ver Receta Completa
              </GlassButton>
              <GlassButton
                variant="ghost"
                onClick={() => setShowRecipeModal(false)}
              >
                <Heart className="w-5 h-5" />
              </GlassButton>
            </div>
          </div>
        )}
      </GlassModal>

      {/* Notifications Dropdown */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-20 right-6 w-80 glass-container glass-strong rounded-2xl shadow-2xl overflow-hidden z-50"
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold dark:text-white">Notificaciones</h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {[
                {
                  icon: Award,
                  title: '¡Nuevo logro desbloqueado!',
                  message: 'Has completado 7 días seguidos',
                  time: 'Hace 2 horas',
                  color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30'
                },
                {
                  icon: ChefHat,
                  title: 'Receta del día',
                  message: 'Prueba nuestro Pad Thai vegano',
                  time: 'Hace 5 horas',
                  color: 'text-green-600 bg-green-100 dark:bg-green-900/30'
                },
                {
                  icon: ShoppingCart,
                  title: 'Lista actualizada',
                  message: '3 items agregados automáticamente',
                  time: 'Ayer',
                  color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30'
                }
              ].map((notif, i) => (
                <motion.div
                  key={i}
                  initial={{ x: -20 }}
                  animate={{ x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer border-b border-gray-100 dark:border-gray-800"
                >
                  <div className="flex gap-3">
                    <div className={cn("p-2 rounded-lg flex-shrink-0", notif.color)}>
                      <notif.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm dark:text-white">{notif.title}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                        {notif.message}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{notif.time}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Dark Mode Toggle for Demo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1, duration: 0.3 }}
        className="fixed bottom-8 right-8 z-50"
      >
        <DarkModeToggle size="lg" />
      </motion.div>
    </div>
  );
};

export default UltraModernDashboard;