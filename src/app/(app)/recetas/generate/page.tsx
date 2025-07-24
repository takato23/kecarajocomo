import { Metadata } from 'next';
import { Sparkles, Clock, ChefHat, Zap, Target, Wand2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Generar Receta con IA | KeCarajoComér',
  description: 'Crea recetas personalizadas usando inteligencia artificial'
};

export default function RecetasGeneratePage() {
  const quickPrompts = [
    "Algo rápido con pollo y verduras",
    "Comida vegetariana nutritiva",
    "Postre sin gluten fácil", 
    "Plato principal con pasta",
    "Ensalada refrescante de verano",
    "Sopa reconfortante de invierno"
  ];

  const generationOptions = [
    {
      id: 'ingredients',
      icon: ChefHat,
      title: 'Basado en ingredientes',
      description: 'Genera recetas usando ingredientes específicos que tengas',
      color: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
    },
    {
      id: 'dietary',
      icon: Target,
      title: 'Según dieta específica',
      description: 'Recetas adaptadas a restricciones dietéticas',
      color: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400'
    },
    {
      id: 'time',
      icon: Clock,
      title: 'Por tiempo disponible',
      description: 'Recetas que se ajusten a tu tiempo de cocina',
      color: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
    },
    {
      id: 'mood',
      icon: Sparkles,
      title: 'Según tu estado de ánimo',
      description: 'Deja que la IA sugiera según cómo te sientes',
      color: 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/20 dark:to-red-900/20 rounded-2xl">
            <Wand2 className="w-12 h-12 text-orange-600 dark:text-orange-400" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Generar Receta con IA
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Describe lo que quieres cocinar y nuestra IA creará una receta personalizada para ti
        </p>
      </div>

      {/* Main Generation Form */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 mb-8">
        <div className="mb-6">
          <label className="block text-lg font-medium text-gray-900 dark:text-white mb-3">
            ¿Qué quieres cocinar hoy?
          </label>
          <textarea
            placeholder="Ej: Quiero algo saludable con pollo, que sea rápido de hacer y sin gluten..."
            className="w-full h-32 p-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Quick Prompts */}
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            O usa una de estas ideas rápidas:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {quickPrompts.map((prompt, index) => (
              <button
                key={index}
                className="p-3 text-left text-sm bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded-lg transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Advanced Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tiempo de preparación
            </label>
            <select className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option>Cualquiera</option>
              <option>Menos de 15 min</option>
              <option>15-30 min</option>
              <option>30-60 min</option>
              <option>Más de 1 hora</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Porciones
            </label>
            <select className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option>1-2 personas</option>
              <option>3-4 personas</option>
              <option>5-6 personas</option>
              <option>Más de 6 personas</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Dificultad
            </label>
            <select className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option>Cualquiera</option>
              <option>Principiante</option>
              <option>Intermedio</option>
              <option>Avanzado</option>
            </select>
          </div>
        </div>

        {/* Generate Button */}
        <button className="w-full py-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-xl font-medium text-lg flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02]">
          <Sparkles className="w-6 h-6" />
          Generar Receta Mágica
        </button>
      </div>

      {/* Generation Methods */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          Otras formas de generar recetas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {generationOptions.map((option) => {
            const IconComponent = option.icon;
            return (
              <div
                key={option.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all cursor-pointer group"
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${option.color}`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                      {option.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {option.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Features */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/10 dark:to-blue-900/10 border border-purple-200 dark:border-purple-800 rounded-xl p-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Zap className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Powered by Advanced AI
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Nuestra IA considera tus preferencias, restricciones dietéticas, ingredientes disponibles 
            y crea recetas únicas adaptadas específicamente para ti.
          </p>
          <div className="flex flex-wrap justify-center gap-3 text-sm">
            <span className="px-3 py-1 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700">
              Análisis nutricional
            </span>
            <span className="px-3 py-1 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700">
              Sustituciones inteligentes
            </span>
            <span className="px-3 py-1 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700">
              Adaptación a despensa
            </span>
            <span className="px-3 py-1 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700">
              Preferencias personales
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}