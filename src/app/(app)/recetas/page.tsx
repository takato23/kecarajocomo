'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { logger } from '@/services/logger';
import { 
  Search, 
  Clock, 
  Users, 
  Sparkles, 
  Heart, 
  Star,
  ChefHat,
  Flame,
  Zap,
  Grid3X3,
  List,
  SlidersHorizontal,
  Plus,
  Camera,
  Download,
  Share2,
  BookOpen,
  TrendingUp,
  Mic,
  Volume2
} from 'lucide-react';

import { GlassCard, GlassButton, GlassInput, GlassModal } from '@/components/ui/GlassCard';
import { EnhancedRecipeGrid } from '@/components/recipes/EnhancedRecipeGrid';
import { EnhancedRecipeCreationModal } from '@/features/recipes/components/EnhancedRecipeCreationModal';
import { useNotifications } from '@/services/notifications';
import { useAnalytics } from '@/services/analytics';
import { getVoiceService } from '@/services/voice/UnifiedVoiceService';
import { cn } from '@/lib/utils';
import { useUser } from '@/store';

// Mock data mejorado
const mockRecipes = [
  {
    id: '1',
    title: 'Paella Valenciana Tradicional',
    description: 'La auténtica paella con ingredientes frescos del Mediterráneo',
    imageUrl: 'https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=600',
    prepTime: 30,
    cookTime: 45,
    servings: 6,
    difficulty: 'hard' as const,
    rating: 4.9,
    cuisine: 'Española',
    tags: ['Arroz', 'Mariscos', 'Tradicional', 'Sin Gluten'],
    isAIGenerated: false,
    isFavorite: true,
    macronutrients: { calories: 420, protein: 28, carbs: 52, fat: 12 },
    author: 'Chef Carlos Martín',
    views: 1250,
    saves: 234
  },
  {
    id: '2',
    title: 'Bowl de Quinoa y Vegetales Asados',
    description: 'Bowl nutritivo con quinoa orgánica y vegetales de temporada',
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600',
    prepTime: 15,
    cookTime: 25,
    servings: 2,
    difficulty: 'easy' as const,
    rating: 4.7,
    cuisine: 'Internacional',
    tags: ['Vegano', 'Saludable', 'Sin Gluten', 'Bowl'],
    isAIGenerated: true,
    isFavorite: false,
    macronutrients: { calories: 320, protein: 12, carbs: 48, fat: 8 },
    author: 'IA Chef Assistant',
    views: 892,
    saves: 167
  },
  {
    id: '3',
    title: 'Tacos de Carnitas con Salsa Verde',
    description: 'Tacos tradicionales mexicanos con carnitas suculentas',
    imageUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600',
    prepTime: 20,
    cookTime: 180,
    servings: 8,
    difficulty: 'medium' as const,
    rating: 4.8,
    cuisine: 'Mexicana',
    tags: ['Cerdo', 'Picante', 'Tradicional', 'Fiesta'],
    isAIGenerated: false,
    isFavorite: true,
    macronutrients: { calories: 380, protein: 22, carbs: 28, fat: 18 },
    author: 'Chef Ana García',
    views: 2100,
    saves: 445
  },
  {
    id: '4',
    title: 'Ramen Japonés Casero',
    description: 'Ramen auténtico con caldo tonkotsu y toppings tradicionales',
    imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600',
    prepTime: 45,
    cookTime: 240,
    servings: 4,
    difficulty: 'hard' as const,
    rating: 4.9,
    cuisine: 'Japonesa',
    tags: ['Fideos', 'Cerdo', 'Umami', 'Comfort Food'],
    isAIGenerated: false,
    isFavorite: false,
    macronutrients: { calories: 480, protein: 26, carbs: 58, fat: 16 },
    author: 'Chef Takeshi Yamamoto',
    views: 3200,
    saves: 678
  },
  {
    id: '5',
    title: 'Ensalada César con Pollo a la Parrilla',
    description: 'Clásica ensalada césar con pollo jugoso y aderezo casero',
    imageUrl: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=600',
    prepTime: 15,
    cookTime: 15,
    servings: 2,
    difficulty: 'easy' as const,
    rating: 4.6,
    cuisine: 'Americana',
    tags: ['Ensalada', 'Pollo', 'Light', 'Proteína'],
    isAIGenerated: true,
    isFavorite: false,
    macronutrients: { calories: 280, protein: 32, carbs: 12, fat: 14 },
    author: 'IA Chef Assistant',
    views: 1560,
    saves: 234
  },
  {
    id: '6',
    title: 'Curry Verde Tailandés Vegano',
    description: 'Curry aromático con leche de coco y vegetales frescos',
    imageUrl: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=600',
    prepTime: 20,
    cookTime: 25,
    servings: 4,
    difficulty: 'medium' as const,
    rating: 4.8,
    cuisine: 'Tailandesa',
    tags: ['Vegano', 'Picante', 'Curry', 'Sin Gluten'],
    isAIGenerated: true,
    isFavorite: true,
    macronutrients: { calories: 340, protein: 8, carbs: 42, fat: 16 },
    author: 'IA Chef Assistant',
    views: 1890,
    saves: 356
  }
];

export default function RecetasPage() {
  const router = useRouter();
  const user = useUser();
  const { notify } = useNotifications();
  const { track } = useAnalytics();
  
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [showCreationModal, setShowCreationModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);

  const tabs = [
    { id: 'all', label: 'Todas', icon: Grid3X3, count: 156 },
    { id: 'favorites', label: 'Favoritas', icon: Heart, count: 48 },
    { id: 'ai', label: 'Generadas por IA', icon: Sparkles, count: 73 },
    { id: 'quick', label: 'Rápidas', icon: Zap, count: 89 },
    { id: 'healthy', label: 'Saludables', icon: Flame, count: 92 }
  ];

  const featuredCategories = [
    { name: 'Desayunos', icon: '🌅', color: 'from-orange-400 to-amber-400', count: 32 },
    { name: 'Comida Rápida', icon: '⚡', color: 'from-blue-400 to-cyan-400', count: 45 },
    { name: 'Postres', icon: '🍰', color: 'from-pink-400 to-rose-400', count: 28 },
    { name: 'Vegetariano', icon: '🥗', color: 'from-green-400 to-emerald-400', count: 64 },
    { name: 'Sin Gluten', icon: '🌾', color: 'from-purple-400 to-indigo-400', count: 37 },
    { name: 'Bajo en Calorías', icon: '🥤', color: 'from-teal-400 to-cyan-400', count: 51 }
  ];

  const handleRecipeClick = (recipe: any) => {
    setSelectedRecipe(recipe);
    setShowRecipeModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-800">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-60 -left-40 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-700" />
        <div className="absolute bottom-40 right-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-orange-600 via-pink-600 to-purple-600 dark:from-orange-400 dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">
                Explora Recetas
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Descubre {mockRecipes.length}+ recetas adaptadas a tus ingredientes y preferencias
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <GlassButton
                variant="primary"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => setShowCreationModal(true)}
              >
                Crear Receta
              </GlassButton>
              <GlassButton
                variant="secondary"
                icon={<Camera className="w-4 h-4" />}
              >
                Escanear
              </GlassButton>
              <GlassButton
                variant="ghost"
                icon={<Download className="w-4 h-4" />}
              >
                Exportar
              </GlassButton>
            </div>
          </div>

          {/* Search Bar */}
          <GlassCard variant="medium" className="p-4 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <GlassInput
                  placeholder="Buscar por nombre, ingrediente o categoría..."
                  icon={<Search className="w-5 h-5" />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-12"
                />
                <button
                  onClick={async () => {
                    if (isListening) {
                      return;
                    }
                    
                    try {
                      setIsListening(true);
                      const voiceService = getVoiceService();
                      const command = await voiceService.startListening({
                        language: 'es-MX',
                        continuous: false
                      });
                      
                      if (command.transcript) {
                        setSearchQuery(command.transcript);
                        await voiceService.speak(`Buscando: ${command.transcript}`);
                      }
                    } catch (error: unknown) {
                      logger.error('Voice search error:', 'Page:page', error);
                      notify({
                        type: 'error',
                        title: 'Error de Búsqueda por Voz',
                        message: 'No se pudo activar la búsqueda por voz',
                        priority: 'medium'
                      });
                    } finally {
                      setIsListening(false);
                    }
                  }}
                  className={cn(
                    "absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-lg transition-colors",
                    isListening 
                      ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50" 
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  )}
                  disabled={isListening}
                >
                  {isListening ? (
                    <Volume2 className="w-4 h-4 animate-pulse" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </button>
              </div>
              <div className="flex gap-3">
                <GlassButton
                  variant={showFilters ? 'primary' : 'secondary'}
                  icon={<SlidersHorizontal className="w-4 h-4" />}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  Filtros
                </GlassButton>
                <div className="flex items-center bg-white/10 rounded-lg p-1">
                  <GlassButton
                    variant={viewMode === 'grid' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="p-2"
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </GlassButton>
                  <GlassButton
                    variant={viewMode === 'list' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="p-2"
                  >
                    <List className="w-4 h-4" />
                  </GlassButton>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all',
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg'
                      : 'glass-container glass-subtle hover:bg-white/20'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">
                    {tab.count}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Featured Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 dark:text-white">
            <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            Categorías Populares
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {featuredCategories.map((category, index) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                className="cursor-pointer"
              >
                <GlassCard variant="subtle" className="p-4 text-center group" interactive>
                  <div className={cn(
                    "w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br flex items-center justify-center text-3xl",
                    category.color
                  )}>
                    {category.icon}
                  </div>
                  <h3 className="font-medium text-sm mb-1 dark:text-white">{category.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-300">
                    {category.count} recetas
                  </p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Recipe Grid */}
        <AnimatePresence mode="wait">
          {showFilters ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6"
            >
              <GlassCard variant="medium" className="p-6">
                <h3 className="text-lg font-semibold mb-4 dark:text-white">Filtros Avanzados</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-300">Tiempo de Preparación</label>
                    <select className="glass-input w-full dark:bg-gray-800 dark:text-white">
                      <option>Cualquier duración</option>
                      <option>Menos de 15 min</option>
                      <option>15-30 min</option>
                      <option>30-60 min</option>
                      <option>Más de 1 hora</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-300">Dificultad</label>
                    <select className="glass-input w-full dark:bg-gray-800 dark:text-white">
                      <option>Todas</option>
                      <option>Fácil</option>
                      <option>Media</option>
                      <option>Difícil</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-300">Tipo de Cocina</label>
                    <select className="glass-input w-full dark:bg-gray-800 dark:text-white">
                      <option>Todas las cocinas</option>
                      <option>Mexicana</option>
                      <option>Italiana</option>
                      <option>Asiática</option>
                      <option>Mediterránea</option>
                    </select>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Enhanced Recipe Grid Component */}
        <EnhancedRecipeGrid 
          recipes={mockRecipes}
          onRecipeClick={handleRecipeClick}
        />

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {[
            { label: 'Recetas Guardadas', value: '48', icon: Heart, color: 'text-pink-500' },
            { label: 'Creadas por Ti', value: '12', icon: ChefHat, color: 'text-orange-500' },
            { label: 'Vistas Hoy', value: '23', icon: BookOpen, color: 'text-blue-500' },
            { label: 'Compartidas', value: '7', icon: Share2, color: 'text-purple-500' }
          ].map((stat) => (
            <GlassCard key={stat.label} variant="subtle" className="p-4 text-center">
              <stat.icon className={cn("w-8 h-8 mx-auto mb-2", stat.color)} />
              <div className="text-2xl font-bold dark:text-white">{stat.value}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">{stat.label}</div>
            </GlassCard>
          ))}
        </motion.div>
      </div>

      {/* Recipe Detail Modal */}
      <GlassModal
        isOpen={showRecipeModal}
        onClose={() => setShowRecipeModal(false)}
        title={selectedRecipe?.title}
        size="xl"
      >
        {selectedRecipe && (
          <div className="space-y-6">
            <img 
              src={selectedRecipe.imageUrl} 
              alt={selectedRecipe.title}
              className="w-full h-64 object-cover rounded-xl"
            />
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <Clock className="w-6 h-6 mx-auto mb-1 text-gray-500 dark:text-gray-400" />
                <p className="text-sm font-medium dark:text-white">{selectedRecipe.prepTime + selectedRecipe.cookTime} min</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Tiempo Total</p>
              </div>
              <div className="text-center">
                <Users className="w-6 h-6 mx-auto mb-1 text-gray-500 dark:text-gray-400" />
                <p className="text-sm font-medium dark:text-white">{selectedRecipe.servings} personas</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Porciones</p>
              </div>
              <div className="text-center">
                <Star className="w-6 h-6 mx-auto mb-1 text-yellow-500 dark:text-yellow-400" />
                <p className="text-sm font-medium dark:text-white">{selectedRecipe.rating}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Calificación</p>
              </div>
              <div className="text-center">
                <Flame className="w-6 h-6 mx-auto mb-1 text-orange-500 dark:text-orange-400" />
                <p className="text-sm font-medium dark:text-white">{selectedRecipe.macronutrients?.calories} cal</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Por porción</p>
              </div>
            </div>

            <p className="text-gray-600 dark:text-gray-300">
              {selectedRecipe.description}
            </p>

            <div className="flex gap-3">
              {/* <GlassButton
                variant="primary"
                className="flex-1"
                onClick={() => {
                  setShowRecipeModal(false);
                  router.push('/planificador');
                }}
              >
                Añadir al Plan
              </GlassButton> */}
              <GlassButton
                variant="secondary"
                icon={<Heart className="w-4 h-4" />}
              >
                Guardar
              </GlassButton>
              <GlassButton
                variant="ghost"
                icon={<Share2 className="w-4 h-4" />}
              >
                Compartir
              </GlassButton>
            </div>
          </div>
        )}
      </GlassModal>

      {/* Enhanced Recipe Creation Modal */}
      <EnhancedRecipeCreationModal
        isOpen={showCreationModal}
        onClose={() => setShowCreationModal(false)}
        onRecipeCreated={(recipe) => {
          // Add the new recipe to the mock data
          mockRecipes.unshift({
            ...recipe,
            id: crypto.randomUUID(),
            imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600',
            rating: 4.5,
            views: 0,
            saves: 0,
            isFavorite: false,
            author: user?.name || 'Usuario',
            macronutrients: recipe.nutritional_info || { calories: 0, protein: 0, carbs: 0, fat: 0 }
          });
          
          // Close modal
          setShowCreationModal(false);
          
          // Show success notification
          notify({
            type: 'success',
            title: 'Receta Creada',
            message: `${recipe.title} se ha guardado exitosamente`,
            priority: 'medium'
          });
          
          // Track analytics
          track('recipe_created', {
            method: recipe.ai_generated ? 'ai' : 'manual',
            cuisine: recipe.cuisine,
            difficulty: recipe.difficulty
          });
          
          // Voice feedback
          getVoiceService().speak(`Receta ${recipe.title} creada exitosamente`);
        }}
        userId={user?.id || 'guest'}
        isAdmin={user?.role === 'admin'}
      />
    </div>
  );
}