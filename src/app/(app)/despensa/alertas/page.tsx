import { Metadata } from 'next';
import { Bell, AlertTriangle, Clock, Package, Trash2, ShoppingCart, Settings, Calendar } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Alertas de Despensa | KeCarajoComér',
  description: 'Gestiona alertas de vencimiento y stock bajo en tu despensa'
};

export default function DespensaAlertasPage() {
  const alerts = [
    {
      id: 1,
      type: 'expiring_soon',
      priority: 'high',
      product: 'Yogur Griego La Serenísima',
      message: 'Vence en 2 días',
      daysLeft: 2,
      quantity: '2 unidades',
      location: 'Refrigerador',
      date: '2024-01-24',
      suggestions: ['Usar en smoothie', 'Hacer salsa tzatziki']
    },
    {
      id: 2,
      type: 'expiring_today',
      priority: 'critical',
      product: 'Pan Lactal',
      message: 'Vence hoy',
      daysLeft: 0,
      quantity: '1 paquete',
      location: 'Alacena',
      date: '2024-01-22',
      suggestions: ['Hacer tostadas francesas', 'Congelar rebanadas']
    },
    {
      id: 3,
      type: 'low_stock',
      priority: 'medium',
      product: 'Leche Entera',
      message: 'Stock bajo',
      quantity: '0.5 litros restantes',
      location: 'Refrigerador',
      threshold: '1 litro',
      suggestions: ['Agregar a lista de compras']
    },
    {
      id: 4,
      type: 'expired',
      priority: 'critical',
      product: 'Tomates Cherry',
      message: 'Venció hace 1 día',
      daysLeft: -1,
      quantity: '300g',
      location: 'Cajón verduras',
      date: '2024-01-21',
      suggestions: ['Revisar estado', 'Desechar si es necesario']
    },
    {
      id: 5,
      type: 'expiring_week',
      priority: 'low',
      product: 'Queso Cremoso',
      message: 'Vence en 5 días',
      daysLeft: 5,
      quantity: '200g',
      location: 'Refrigerador',
      date: '2024-01-27',
      suggestions: ['Usar en pasta', 'Hacer empanadas']
    }
  ];

  const alertStats = {
    total: alerts.length,
    critical: alerts.filter(a => a.priority === 'critical').length,
    high: alerts.filter(a => a.priority === 'high').length,
    medium: alerts.filter(a => a.priority === 'medium').length,
    low: alerts.filter(a => a.priority === 'low').length
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'border-red-500 bg-red-50 dark:bg-red-900/20';
      case 'high': return 'border-orange-500 bg-orange-50 dark:bg-orange-900/20';
      case 'medium': return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low': return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
      default: return 'border-gray-300 bg-gray-50 dark:bg-gray-700';
    }
  };

  const getPriorityIcon = (type: string, priority: string) => {
    if (type === 'expired' || priority === 'critical') {
      return <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />;
    }
    if (type === 'low_stock') {
      return <Package className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />;
    }
    return <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />;
  };

  const getPriorityText = (priority: string) => {
    const map = {
      critical: 'Crítica',
      high: 'Alta',
      medium: 'Media',
      low: 'Baja'
    };
    return map[priority as keyof typeof map] || priority;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-xl">
              <Bell className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Alertas de Despensa
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Mantén control sobre vencimientos y stock bajo
              </p>
            </div>
          </div>
          
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Settings className="w-5 h-5" />
            Configurar alertas
          </button>
        </div>

        {/* Alert Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{alertStats.total}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total alertas</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-l-4 border-l-red-500">
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{alertStats.critical}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Críticas</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-l-4 border-l-orange-500">
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{alertStats.high}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Altas</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-l-4 border-l-yellow-500">
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{alertStats.medium}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Medias</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-l-4 border-l-blue-500">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{alertStats.low}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Bajas</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <button className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all">
          <ShoppingCart className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <div className="text-left">
            <p className="font-medium text-gray-900 dark:text-white">Agregar a compras</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Stock bajo automático</p>
          </div>
        </button>
        
        <button className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all">
          <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
          <div className="text-left">
            <p className="font-medium text-gray-900 dark:text-white">Planificar comidas</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Usar productos próximos</p>
          </div>
        </button>
        
        <button className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all">
          <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
          <div className="text-left">
            <p className="font-medium text-gray-900 dark:text-white">Marcar como consumido</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Productos usados</p>
          </div>
        </button>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`border-l-4 rounded-lg p-6 ${getPriorityColor(alert.priority)}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                {getPriorityIcon(alert.type, alert.priority)}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {alert.product}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      alert.priority === 'critical' 
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        : alert.priority === 'high'
                        ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
                        : alert.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                    }`}>
                      {getPriorityText(alert.priority)}
                    </span>
                  </div>
                  
                  <p className="text-gray-700 dark:text-gray-300 font-medium mb-2">
                    {alert.message}
                  </p>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>Cantidad: {alert.quantity}</span>
                    <span>Ubicación: {alert.location}</span>
                    {alert.date && (
                      <span>Fecha: {new Date(alert.date).toLocaleDateString()}</span>
                    )}
                    {alert.threshold && (
                      <span>Umbral: {alert.threshold}</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                  <Settings className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Suggestions */}
            {alert.suggestions && alert.suggestions.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sugerencias:
                </p>
                <div className="flex flex-wrap gap-2">
                  {alert.suggestions.map((suggestion, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer transition-colors"
                    >
                      {suggestion}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Actions */}
            <div className="flex gap-3">
              {alert.type === 'low_stock' ? (
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                  Agregar a lista de compras
                </button>
              ) : alert.type === 'expired' ? (
                <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors">
                  Marcar como desechado
                </button>
              ) : (
                <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors">
                  Marcar como usado
                </button>
              )}
              
              <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Ver recetas sugeridas
              </button>
              
              <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Extender fecha
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Alert Settings */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            <Settings className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Configuración de alertas inteligentes
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Personaliza cuándo y cómo recibir notificaciones sobre tu despensa
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <label className="flex items-center">
                  <input type="checkbox" defaultChecked className="rounded mr-2" />
                  <span>Alertas de vencimiento (3 días antes)</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" defaultChecked className="rounded mr-2" />
                  <span>Alertas de stock bajo</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="rounded mr-2" />
                  <span>Sugerencias de recetas automáticas</span>
                </label>
              </div>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input type="checkbox" defaultChecked className="rounded mr-2" />
                  <span>Notificaciones push</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="rounded mr-2" />
                  <span>Resumen diario por email</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="rounded mr-2" />
                  <span>Alertas de fin de semana</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}