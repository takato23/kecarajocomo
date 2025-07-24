import { Metadata } from 'next';
import { Plus, Package, Calendar, MapPin, Camera, Mic, Barcode, Search } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Agregar Items | KeCarajoComér',
  description: 'Agrega nuevos items a tu despensa de forma rápida y sencilla'
};

export default function DespensaAgregarPage() {
  const categories = [
    'Lácteos', 'Carnes', 'Pescados', 'Verduras', 'Frutas', 
    'Cereales', 'Legumbres', 'Condimentos', 'Bebidas', 
    'Congelados', 'Enlatados', 'Panadería', 'Otro'
  ];

  const locations = [
    'Refrigerador', 'Congelador', 'Despensa', 'Alacena', 
    'Frutero', 'Heladera puerta', 'Cajón verduras', 'Otro'
  ];

  const quickAddMethods = [
    {
      id: 'manual',
      icon: Plus,
      title: 'Agregar manualmente',
      description: 'Escribe los detalles del producto',
      color: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
    },
    {
      id: 'barcode',
      icon: Barcode,
      title: 'Escanear código',
      description: 'Usa la cámara para escanear el código de barras',
      color: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400'
    },
    {
      id: 'voice',
      icon: Mic,
      title: 'Agregar por voz',
      description: 'Di qué quieres agregar',
      color: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
    },
    {
      id: 'photo',
      icon: Camera,
      title: 'Foto del producto',
      description: 'Toma una foto y lo reconocemos automáticamente',
      color: 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-xl">
            <Plus className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Agregar a Despensa
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Mantén tu inventario actualizado fácilmente
            </p>
          </div>
        </div>
      </div>

      {/* Quick Add Methods */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {quickAddMethods.map((method) => {
          const IconComponent = method.icon;
          return (
            <div
              key={method.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all cursor-pointer group"
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${method.color}`}>
                  <IconComponent className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                    {method.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {method.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Manual Add Form */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8">
        <div className="flex items-center gap-3 mb-6">
          <Package className="w-6 h-6 text-green-600 dark:text-green-400" />
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Agregar producto manualmente
          </h2>
        </div>

        <form className="space-y-6">
          {/* Product Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nombre del producto *
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Ej: Leche entera, Tomates, Pan integral..."
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              Buscaremos automáticamente información nutricional
            </p>
          </div>

          {/* Quantity and Unit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cantidad
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="1"
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Unidad
              </label>
              <select className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent">
                <option>unidades</option>
                <option>gramos</option>
                <option>kilogramos</option>
                <option>litros</option>
                <option>mililitros</option>
                <option>paquetes</option>
                <option>latas</option>
                <option>botellas</option>
              </select>
            </div>
          </div>

          {/* Category and Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Categoría
              </label>
              <select className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent">
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Ubicación
              </label>
              <select className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent">
                {locations.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Expiration Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Fecha de vencimiento
              </label>
              <input
                type="date"
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha de compra
              </label>
              <input
                type="date"
                defaultValue={new Date().toISOString().split('T')[0]}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Brand and Price */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Marca (opcional)
              </label>
              <input
                type="text"
                placeholder="Ej: La Serenísima, Marolio..."
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Precio (opcional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notas (opcional)
            </label>
            <textarea
              placeholder="Ej: Comprado en oferta, para la cena del domingo..."
              className="w-full h-20 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              Agregar a despensa
            </button>
            <button
              type="button"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Agregar y crear otro
            </button>
          </div>
        </form>
      </div>

      {/* Quick Tips */}
      <div className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/10 dark:to-blue-900/10 border border-green-200 dark:border-green-800 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
            <Package className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Consejos para organizar tu despensa
            </h3>
            <ul className="space-y-1 text-gray-600 dark:text-gray-400 text-sm">
              <li>• Agregar fechas de vencimiento te ayudará a recibir alertas</li>
              <li>• Especifica la ubicación para encontrar productos más rápido</li>
              <li>• El precio te permitirá hacer seguimiento de gastos</li>
              <li>• Usa el escáner de códigos para agregar productos más rápido</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}