'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, TrendingDown, DollarSign, Search } from 'lucide-react';

import { PriceSearchComponent } from '@/components/price-scraper/PriceSearchComponent';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function PricesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-blue-500/10" />
        <div className="container mx-auto px-4 py-12 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="flex justify-center mb-6">
              <div className="relative">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="absolute inset-0 bg-emerald-400 rounded-full blur-2xl opacity-30"
                />
                <DollarSign className="h-16 w-16 text-emerald-600 relative" />
              </div>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Buscador de Precios
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Encuentra los mejores precios en supermercados de Argentina
            </p>
            
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="bg-white/80 backdrop-blur border-emerald-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-center space-x-2">
                      <ShoppingCart className="h-5 w-5 text-emerald-600" />
                      <span className="text-2xl font-bold text-gray-900">10+</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Supermercados</p>
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="bg-white/80 backdrop-blur border-blue-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-center space-x-2">
                      <Search className="h-5 w-5 text-blue-600" />
                      <span className="text-2xl font-bold text-gray-900">1000+</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Productos</p>
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
              >
                <Card className="bg-white/80 backdrop-blur border-purple-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-center space-x-2">
                      <TrendingDown className="h-5 w-5 text-purple-600" />
                      <span className="text-2xl font-bold text-gray-900">30%</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Ahorro promedio</p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Search Section */}
      <div className="container mx-auto px-4 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="shadow-xl bg-white/95 backdrop-blur">
            <CardHeader>
              <CardTitle>Buscar Productos</CardTitle>
              <CardDescription>
                Ingresa el nombre del producto que buscas. Puedes escribir ingredientes complejos como &quot;2 pechugas de pollo sin piel&quot; y lo simplificaremos automáticamente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PriceSearchComponent />
            </CardContent>
          </Card>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
            <CardHeader>
              <CardTitle className="text-emerald-700">Parser Inteligente</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                Nuestro sistema entiende ingredientes complejos y los simplifica para encontrar los mejores resultados.
              </p>
              <div className="mt-4 space-y-2">
                <Badge variant="secondary" className="bg-emerald-200 text-emerald-800">
                  &quot;2 kg de papa blanca&quot; → &quot;papa&quot;
                </Badge>
                <Badge variant="secondary" className="bg-emerald-200 text-emerald-800">
                  &quot;pechuga de pollo sin piel&quot; → &quot;pollo&quot;
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-700">Caché Inteligente</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                Resultados instantáneos para búsquedas recientes. El caché se actualiza cada 15 minutos.
              </p>
              <div className="mt-4">
                <Badge variant="secondary" className="bg-blue-200 text-blue-800">
                  Respuesta en &lt; 100ms
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader>
              <CardTitle className="text-purple-700">Comparación Visual</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                Agrupa productos similares y muestra rangos de precios para ayudarte a tomar la mejor decisión.
              </p>
              <div className="mt-4">
                <Badge variant="secondary" className="bg-purple-200 text-purple-800">
                  Ahorra hasta 30%
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="mt-8"
        >
          <Card className="bg-gray-50 border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-700">💡 Tips para mejores búsquedas</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-gray-600">
                <li>• Puedes buscar múltiples productos separándolos por comas</li>
                <li>• El sistema detecta automáticamente cantidades y unidades</li>
                <li>• Los resultados se agrupan por variaciones del mismo producto</li>
                <li>• Usa el modo de configuración para personalizar tu experiencia</li>
                <li>• Las búsquedas recientes se guardan para acceso rápido</li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}