'use client';

export default function TestRecetasPage() {
  return (
    <div className="container mx-auto max-w-7xl space-y-6 p-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold">🍽️ Módulo Recetas-Despensa</h1>
        <p className="text-lg text-gray-600 mt-2">
          ¡Funciona! Tu módulo está aquí.
        </p>
      </div>
      
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <h2 className="text-xl font-semibold mb-4">✅ Funcionalidades Implementadas</h2>
        <ul className="space-y-2 text-gray-700">
          <li>🥫 Compatibilidad con despensa</li>
          <li>🔍 Filtros inteligentes</li>
          <li>🛒 Integración con lista de compras</li>
          {/* <li>📅 Integración con planificador de comidas</li> */}
          <li>💰 Estimación de costos</li>
          <li>🧠 Análisis nutricional</li>
        </ul>
      </div>

      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <p className="text-blue-800">
          <strong>✨ Próximo paso:</strong> Ve a <code>/recetas</code> para la versión completa
        </p>
      </div>
    </div>
  );
}