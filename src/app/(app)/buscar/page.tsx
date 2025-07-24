import { Metadata } from 'next';
import { Search, Filter, Clock, BookOpen, Package, Calendar, Users, Sparkles, TrendingUp } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Buscar | KeCarajoComér',
  description: 'Busca recetas, ingredientes, planes de comida y más en toda la aplicación'
};

export default function BuscarPage() {
  const searchCategories = [
    {
      id: 'all',
      label: 'Todo',
      icon: Search,
      count: '2,847',
      color: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    },
    {
      id: 'recipes',
      label: 'Recetas',
      icon: BookOpen,
      count: '1,234',
      color: 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400'
    },
    {
      id: 'ingredients',
      label: 'Ingredientes',
      icon: Package,
      count: '856',
      color: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
    },
    {
      id: 'meal-plans',
      label: 'Planes de comida',
      icon: Calendar,
      count: '324',
      color: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
    },
    {
      id: 'users',
      label: 'Usuarios',
      icon: Users,
      count: '189',
      color: 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400'
    }
  ];

  const trendingSearches = [
    'Pasta carbonara',
    'Recetas sin gluten',
    'Comida vegetariana',
    'Postres fáciles',
    'Cenas rápidas',
    'Smoothies saludables',
    'Recetas con pollo',
    'Comida italiana'
  ];

  const recentSearches = [
    { query: 'empanadas argentinas', category: 'Recetas', time: 'Hace 2 horas' },
    { query: 'quinoa', category: 'Ingredientes', time: 'Ayer' },
    { query: 'plan semanal vegetariano', category: 'Planes', time: 'Hace 3 días' },
    { query: 'chef martinez', category: 'Usuarios', time: 'Hace 1 semana' }
  ];

  const quickFilters = [
    'Tiempo < 30min',
    'Vegetariano',
    'Sin gluten',
    'Bajas calorías',
    'Para niños',
    'Fácil',
    'Postres',
    'Bebidas'
  ];

  const searchResults = [
    {
      id: 1,
      type: 'recipe',
      title: 'Pasta Carbonara Auténtica',
      description: 'La receta tradicional italiana con huevos, queso pecorino y panceta',
      author: 'Chef María González',
      rating: 4.8,
      time: '25 min',
      image: '/api/placeholder/200/150',
      tags: ['Italiana', 'Pasta', 'Rápida']
    },
    {
      id: 2,
      type: 'ingredient',
      title: 'Panceta',
      description: 'Corte de cerdo ideal para carbonara y otros platos italianos',
      inStock: true,
      location: 'Refrigerador',
      expiresIn: '5 días',
      recipes: 23
    },
    {
      id: 3,
      type: 'meal-plan',
      title: 'Plan Semanal Mediterráneo',
      description: 'Dieta mediterránea balanceada para toda la semana',
      author: 'Nutricionista Ana López',
      meals: 21,
      followers: 145,
      difficulty: 'Intermedio'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Buscar en KeCarajoComér
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Encuentra recetas, ingredientes, planes de comida y más
          </p>
        </div>

        {/* Search Input */}
        <div className="relative max-w-2xl mx-auto mb-6">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
          <input
            type="text"
            placeholder="Buscar recetas, ingredientes, planes..."
            className="w-full pl-12 pr-4 py-4 text-lg border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm"
          />
          <button className="absolute right-3 top-1/2 transform -translate-y-1/2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors">
            Buscar
          </button>
        </div>

        {/* Search Categories */}
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          {searchCategories.map((category) => {
            const IconComponent = category.icon;
            return (
              <button
                key={category.id}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors hover:opacity-80 ${category.color}`}
              >
                <IconComponent className="w-4 h-4" />
                <span>{category.label}</span>
                <span className="text-sm opacity-75">({category.count})</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Filtros
              </h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Filtros rápidos</h4>
                <div className="space-y-2">
                  {quickFilters.map((filter) => (
                    <label key={filter} className="flex items-center">
                      <input type="checkbox" className="rounded mr-2" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{filter}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Tiempo de preparación</h4>
                <select className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
                  <option>Cualquier tiempo</option>
                  <option>Menos de 15 min</option>
                  <option>15-30 min</option>
                  <option>30-60 min</option>
                  <option>Más de 1 hora</option>
                </select>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Calificación</h4>
                <select className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
                  <option>Cualquier calificación</option>
                  <option>4+ estrellas</option>
                  <option>3+ estrellas</option>
                  <option>2+ estrellas</option>
                </select>
              </div>
            </div>
          </div>

          {/* Trending Searches */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Tendencias
              </h3>
            </div>
            
            <div className="space-y-2">
              {trendingSearches.map((search, index) => (
                <button
                  key={index}
                  className="block w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  {search}
                </button>
              ))}
            </div>
          </div>

          {/* Recent Searches */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Búsquedas recientes
              </h3>
            </div>
            
            <div className="space-y-3">
              {recentSearches.map((search, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {search.query}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {search.category} • {search.time}
                    </p>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <Search className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Search Results Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Resultados de búsqueda
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Encontrados 245 resultados
              </p>
            </div>
            
            <select className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option>Más relevantes</option>
              <option>Más recientes</option>
              <option>Mejor valorados</option>
              <option>Alfabético</option>
            </select>
          </div>

          {/* Search Results */}
          <div className="space-y-6">
            {searchResults.map((result) => (
              <div
                key={result.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex gap-4">
                  {result.type === 'recipe' && (
                    <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0">
                      <div className="w-full h-full bg-gradient-to-br from-orange-200 to-red-200 dark:from-orange-800 dark:to-red-800 rounded-lg flex items-center justify-center">
                        <span className="text-gray-600 dark:text-gray-400 text-xs">Imagen</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                          {result.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                          {result.description}
                        </p>
                      </div>
                      
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        result.type === 'recipe' 
                          ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
                          : result.type === 'ingredient'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                      }`}>
                        {result.type === 'recipe' ? 'Receta' : 
                         result.type === 'ingredient' ? 'Ingrediente' : 'Plan'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {result.type === 'recipe' && (
                        <>
                          <span>Por {result.author}</span>
                          <span>⭐ {result.rating}</span>
                          <span>🕐 {result.time}</span>
                        </>
                      )}
                      
                      {result.type === 'ingredient' && (
                        <>
                          <span className={result.inStock ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                            {result.inStock ? 'En stock' : 'Sin stock'}
                          </span>
                          {result.location && <span>📍 {result.location}</span>}
                          {result.expiresIn && <span>📅 Vence en {result.expiresIn}</span>}
                        </>
                      )}
                      
                      {result.type === 'meal-plan' && (
                        <>
                          <span>Por {result.author}</span>
                          <span>🍽️ {result.meals} comidas</span>
                          <span>👥 {result.followers} seguidores</span>
                        </>
                      )}
                    </div>
                    
                    {result.tags && (
                      <div className="flex gap-2 mb-3">
                        {result.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <button className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors">
                      Ver detalles
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Load More */}
          <div className="text-center mt-8">
            <button className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Cargar más resultados
            </button>
          </div>
        </div>
      </div>

      {/* AI Search Assistant */}
      <div className="mt-12 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/10 dark:to-blue-900/10 border border-purple-200 dark:border-purple-800 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
            <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              Búsqueda inteligente con IA
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Prueba búsquedas como &quot;algo rápido con pollo&quot; o &quot;postre sin gluten para diabéticos&quot; y nuestro asistente IA encontrará exactamente lo que necesitas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}