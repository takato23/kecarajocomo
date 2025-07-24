import { Metadata } from 'next';
import { Plus, Link, Upload, Camera, Clipboard, FileText } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Importar Recetas | KeCarajoComér',
  description: 'Importa recetas desde diferentes fuentes: URLs, archivos, fotos y más'
};

export default function RecetasImportPage() {
  const importMethods = [
    {
      id: 'url',
      icon: Link,
      title: 'Desde URL',
      description: 'Importa recetas desde cualquier sitio web pegando el enlace',
      color: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
      popular: true
    },
    {
      id: 'photo',
      icon: Camera,
      title: 'Foto de receta',
      description: 'Toma una foto de una receta en libro o revista',
      color: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400',
      new: true
    },
    {
      id: 'file',
      icon: Upload,
      title: 'Subir archivo',
      description: 'Importa desde archivos PDF, Word o imágenes',
      color: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
    },
    {
      id: 'text',
      icon: Clipboard,
      title: 'Pegar texto',
      description: 'Copia y pega recetas desde cualquier fuente',
      color: 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
    }
  ];

  const popularSites = [
    { name: 'YouTube', icon: '📺', supported: true },
    { name: 'Instagram', icon: '📷', supported: true },
    { name: 'AllRecipes', icon: '🍳', supported: true },
    { name: 'Food Network', icon: '🥘', supported: true },
    { name: 'Bon Appétit', icon: '👨‍🍳', supported: true },
    { name: 'Tasty', icon: '🎬', supported: true },
    { name: 'BBC Good Food', icon: '🇬🇧', supported: true },
    { name: 'Recetas Gratis', icon: '🇪🇸', supported: true }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl">
            <Plus className="w-12 h-12 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Importar Recetas
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Agrega recetas a tu colección desde múltiples fuentes de forma rápida y sencilla
        </p>
      </div>

      {/* Import Methods */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {importMethods.map((method) => {
          const IconComponent = method.icon;
          return (
            <div
              key={method.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all cursor-pointer group"
            >
              <div className="relative">
                {method.popular && (
                  <span className="absolute -top-2 -right-2 px-2 py-1 bg-orange-500 text-white text-xs rounded-full">
                    Popular
                  </span>
                )}
                {method.new && (
                  <span className="absolute -top-2 -right-2 px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                    Nuevo
                  </span>
                )}
                
                <div className="flex items-start gap-4 mb-4">
                  <div className={`p-3 rounded-xl ${method.color}`}>
                    <IconComponent className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {method.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {method.description}
                    </p>
                  </div>
                </div>
                
                <button className="w-full py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors">
                  Seleccionar método
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* URL Import Form */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <Link className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Importar desde URL
          </h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Pega el enlace de la receta
            </label>
            <div className="flex gap-3">
              <input
                type="url"
                placeholder="https://ejemplo.com/receta-deliciosa"
                className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                Importar
              </button>
            </div>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Funciona con la mayoría de sitios web de recetas populares
          </p>
        </div>
      </div>

      {/* Supported Sites */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
          Sitios compatibles
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {popularSites.map((site) => (
              <div
                key={site.name}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  site.supported 
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                    : 'bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600'
                }`}
              >
                <span className="text-2xl">{site.icon}</span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">
                    {site.name}
                  </p>
                  <p className={`text-xs ${
                    site.supported 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {site.supported ? 'Compatible' : 'Próximamente'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Imports */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Importaciones recientes
        </h2>
        
        <div className="space-y-3">
          {[
            { title: 'Pasta Carbonara Perfecta', source: 'tasty.co', date: 'Hace 2 horas', status: 'success' },
            { title: 'Tarta de Chocolate', source: 'youtube.com', date: 'Ayer', status: 'success' },
            { title: 'Paella Valenciana', source: 'instagram.com', date: 'Hace 3 días', status: 'processing' }
          ].map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  item.status === 'success' ? 'bg-green-500' : 'bg-orange-500'
                }`}></div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {item.title}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Desde {item.source} • {item.date}
                  </p>
                </div>
              </div>
              <button className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
                Ver receta
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Consejos para mejores importaciones
            </h3>
            <ul className="space-y-1 text-gray-600 dark:text-gray-400 text-sm">
              <li>• Usa URLs directas de recetas, no de búsquedas o listas</li>
              <li>• Para fotos, asegúrate de que el texto sea claro y legible</li>
              <li>• Los archivos PDF funcionan mejor si tienen texto seleccionable</li>
              <li>• Revisa siempre la receta importada antes de guardarla</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}