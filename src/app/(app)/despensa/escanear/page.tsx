import { Metadata } from 'next';
import { Camera, Zap, QrCode, Package, Smartphone, CheckCircle, AlertCircle, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Escanear Items | KeCarajoComér',
  description: 'Escanea códigos de barras para agregar productos automáticamente'
};

export default function DespensaEscanearPage() {
  const scanMethods = [
    {
      id: 'barcode',
      icon: QrCode,
      title: 'Código de barras',
      description: 'Escanea el código EAN/UPC del producto',
      color: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
      accuracy: '95%'
    },
    {
      id: 'receipt',
      icon: Camera,
      title: 'Ticket de compra',
      description: 'Fotografía tu ticket y agregamos todos los productos',
      color: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400',
      accuracy: '85%',
      new: true
    },
    {
      id: 'product',
      icon: Package,
      title: 'Foto del producto',
      description: 'Toma una foto del producto y lo reconocemos',
      color: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
      accuracy: '78%'
    }
  ];

  const recentScans = [
    {
      id: 1,
      product: 'Leche La Serenísima Entera 1L',
      barcode: '7790170003456',
      status: 'success',
      timestamp: '2024-01-22 14:30',
      confidence: 98
    },
    {
      id: 2,
      product: 'Pan Lactal Bimbo',
      barcode: '7791234567890',
      status: 'success',
      timestamp: '2024-01-22 14:28',
      confidence: 95
    },
    {
      id: 3,
      product: 'Producto no reconocido',
      barcode: '1234567890123',
      status: 'failed',
      timestamp: '2024-01-22 14:25',
      confidence: 0
    }
  ];

  const tips = [
    'Asegúrate de que el código esté bien iluminado',
    'Mantén la cámara estable y a 10-15cm del código',
    'Si el producto no se reconoce, puedes agregarlo manualmente',
    'Los tickets funcionan mejor si están extendidos y sin arrugas'
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl">
            <Camera className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Escanear Items
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Agrega productos a tu despensa escaneando códigos o fotos
            </p>
          </div>
        </div>
      </div>

      {/* Scan Methods */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {scanMethods.map((method) => {
          const IconComponent = method.icon;
          return (
            <div
              key={method.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all cursor-pointer group relative"
            >
              {method.new && (
                <span className="absolute -top-2 -right-2 px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                  Nuevo
                </span>
              )}
              
              <div className="text-center">
                <div className={`inline-flex p-4 rounded-2xl ${method.color} mb-4`}>
                  <IconComponent className="w-8 h-8" />
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {method.title}
                </h3>
                
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {method.description}
                </p>
                
                <div className="flex items-center justify-between text-sm mb-4">
                  <span className="text-gray-500 dark:text-gray-500">Precisión:</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {method.accuracy}
                  </span>
                </div>
                
                <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                  Iniciar escaneo
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Scanner Interface Placeholder */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 mb-8">
        <div className="text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-32 h-32 bg-gray-100 dark:bg-gray-700 rounded-2xl mb-4">
              <Camera className="w-16 h-16 text-gray-400" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              Cámara lista para escanear
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Selecciona un método de escaneo arriba para comenzar
            </p>
          </div>
          
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 bg-gray-50 dark:bg-gray-700/50">
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3 text-gray-500 dark:text-gray-400">
                <Smartphone className="w-5 h-5" />
                <span>La cámara se activará aquí</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
                <button className="flex items-center justify-center gap-2 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                  <QrCode className="w-5 h-5" />
                  Código de barras
                </button>
                <button className="flex items-center justify-center gap-2 p-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
                  <Camera className="w-5 h-5" />
                  Foto producto
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Scans */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Escaneos recientes
          </h2>
          <button className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
            Ver todos
          </button>
        </div>
        
        <div className="space-y-3">
          {recentScans.map((scan) => (
            <div
              key={scan.id}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  scan.status === 'success' 
                    ? 'bg-green-100 dark:bg-green-900/20'
                    : 'bg-red-100 dark:bg-red-900/20'
                }`}>
                  {scan.status === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  )}
                </div>
                
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {scan.product}
                  </p>
                  <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <span>{scan.barcode}</span>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {scan.timestamp}
                    </div>
                    {scan.confidence > 0 && (
                      <>
                        <span>•</span>
                        <span>{scan.confidence}% confianza</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                {scan.status === 'success' ? (
                  <button className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors">
                    Agregado
                  </button>
                ) : (
                  <button className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded text-sm transition-colors">
                    Reintentar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <QrCode className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">127</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Productos escaneados</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">94%</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tasa de éxito</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Zap className="w-8 h-8 text-orange-500" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">2.3s</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tiempo promedio</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-purple-500" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">15</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Esta semana</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            <Camera className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Consejos para mejores escaneos
            </h3>
            <ul className="space-y-2 text-gray-600 dark:text-gray-400">
              {tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}