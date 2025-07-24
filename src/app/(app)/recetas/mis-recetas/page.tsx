import { Metadata } from 'next';
import { User, Plus, Search, Filter, Clock, Users, Star, Edit, Trash2, Eye } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Mis Recetas | KeCarajoComér',
  description: 'Gestiona y organiza tus recetas creadas'
};

export default function MisRecetasPage() {
  const myRecipes = [
    {
      id: 1,
      title: 'Mi Pasta Carbonara Especial',
      description: 'Versión familiar con un toque secreto de hierbas',
      image: '/api/placeholder/300/200',
      status: 'published',
      rating: 4.8,
      views: 234,
      likes: 45,
      prepTime: '25 min',
      servings: 4,
      createdAt: '2024-01-20',
      updatedAt: '2024-01-22',
      category: 'Pasta',
      difficulty: 'Intermedio'
    },
    {
      id: 2,
      title: 'Empanadas de la Abuela',
      description: 'Receta tradicional familiar transmitida por generaciones',
      image: '/api/placeholder/300/200',
      status: 'draft',
      rating: 0,
      views: 0,
      likes: 0,
      prepTime: '2 horas',
      servings: 12,
      createdAt: '2024-01-18',
      updatedAt: '2024-01-18',
      category: 'Tradicional',
      difficulty: 'Difícil'
    },
    {
      id: 3,
      title: 'Smoothie Verde Energizante',
      description: 'Perfecto para empezar el día con energía',
      image: '/api/placeholder/300/200',
      status: 'published',
      rating: 4.5,
      views: 89,
      likes: 23,
      prepTime: '5 min',
      servings: 2,
      createdAt: '2024-01-15',
      updatedAt: '2024-01-16',
      category: 'Bebidas',
      difficulty: 'Fácil'
    }
  ];

  const stats = {
    total: myRecipes.length,
    published: myRecipes.filter(r => r.status === 'published').length,
    drafts: myRecipes.filter(r => r.status === 'draft').length,
    totalViews: myRecipes.reduce((sum, r) => sum + r.views, 0),
    averageRating: myRecipes.filter(r => r.rating > 0).reduce((sum, r, _, arr) => sum + r.rating / arr.length, 0)
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'draft': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'published': return 'Publicada';
      case 'draft': return 'Borrador';
      default: return status;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl">
              <User className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Mis Recetas
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Gestiona y organiza tus creaciones culinarias
              </p>
            </div>
          </div>
          
          <button className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors">
            <Plus className="w-5 h-5" />
            Nueva receta
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total recetas</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.published}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Publicadas</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.drafts}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Borradores</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalViews}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Visualizaciones</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '—'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Rating promedio</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mb-8">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar en mis recetas..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <Filter className="w-4 h-4" />
              Filtrar
            </button>
            
            <select className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option>Todas</option>
              <option>Publicadas</option>
              <option>Borradores</option>
            </select>
            
            <select className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option>Más recientes</option>
              <option>Más antiguas</option>
              <option>Más vistas</option>
              <option>Mejor valoradas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Recipes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {myRecipes.map((recipe) => (
          <div
            key={recipe.id}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all group"
          >
            {/* Recipe Image */}
            <div className="relative h-48 bg-gray-200 dark:bg-gray-700">
              <div className="absolute top-3 right-3 z-10">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(recipe.status)}`}>
                  {getStatusText(recipe.status)}
                </span>
              </div>
              
              {recipe.status === 'published' && (
                <div className="absolute bottom-3 left-3 z-10 flex gap-2 text-white text-xs">
                  <span className="flex items-center gap-1 bg-black/70 px-2 py-1 rounded-full">
                    <Eye className="w-3 h-3" />
                    {recipe.views}
                  </span>
                  <span className="flex items-center gap-1 bg-black/70 px-2 py-1 rounded-full">
                    <Star className="w-3 h-3" />
                    {recipe.rating}
                  </span>
                </div>
              )}
              
              <div className="w-full h-full bg-gradient-to-br from-blue-200 to-purple-200 dark:from-blue-800 dark:to-purple-800 flex items-center justify-center">
                <span className="text-gray-600 dark:text-gray-400 text-sm">Imagen</span>
              </div>
            </div>

            {/* Recipe Info */}
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {recipe.title}
              </h3>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                {recipe.description}
              </p>

              {/* Meta Info */}
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {recipe.prepTime}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {recipe.servings}
                </div>
              </div>

              {/* Category and Difficulty */}
              <div className="flex gap-2 mb-4">
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full">
                  {recipe.category}
                </span>
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full">
                  {recipe.difficulty}
                </span>
              </div>

              {/* Dates */}
              <div className="text-xs text-gray-500 dark:text-gray-500 mb-4">
                <p>Creada: {new Date(recipe.createdAt).toLocaleDateString()}</p>
                {recipe.createdAt !== recipe.updatedAt && (
                  <p>Actualizada: {new Date(recipe.updatedAt).toLocaleDateString()}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                  <Eye className="w-4 h-4" />
                  Ver
                </button>
                <button className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <Edit className="w-4 h-4" />
                </button>
                <button className="px-3 py-2 border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {myRecipes.length === 0 && (
        <div className="text-center py-12">
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <User className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Aún no has creado recetas
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            ¡Empieza a compartir tus creaciones culinarias con la comunidad!
          </p>
          <button className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors">
            Crear mi primera receta
          </button>
        </div>
      )}
    </div>
  );
}