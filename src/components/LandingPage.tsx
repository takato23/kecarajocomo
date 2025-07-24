'use client';

import React, { useState } from 'react';
import { 
  ChefHat, 
  ShoppingCart, 
  Calendar, 
  Sparkles, 
  Star, 
  Check,
  ArrowRight,
  Menu,
  X
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

// Componente de feature con animación
const FeatureCard: React.FC<{ 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  gradient: string;
}> = ({ icon, title, description, gradient }) => (
  <Card className="group hover:scale-105 transition-all duration-300 border-0 shadow-xl">
    <CardHeader className="text-center">
      <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-r ${gradient} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
      <CardTitle className="text-xl mb-2">{title}</CardTitle>
      <CardDescription className="text-gray-600">{description}</CardDescription>
    </CardHeader>
  </Card>
);

// Componente de testimonio
const TestimonialCard: React.FC<{
  name: string;
  role: string;
  content: string;
  avatar: string;
  rating: number;
}> = ({ name, role, content, avatar, rating }) => (
  <Card className="h-full">
    <CardContent className="p-6">
      <div className="flex mb-4">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
        ))}
      </div>
      <p className="text-gray-600 mb-4 italic">"{content}"</p>
      <div className="flex items-center">
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 flex items-center justify-center text-white font-semibold">
          {avatar}
        </div>
        <div className="ml-3">
          <p className="font-semibold text-gray-900">{name}</p>
          <p className="text-sm text-gray-500">{role}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

export const LandingPage: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const features = [
    {
      icon: <Calendar className="w-6 h-6" />,
      title: "Planificación Inteligente",
      description: "Organiza tus comidas semanales con IA que aprende de tus preferencias",
      gradient: "from-blue-500 to-purple-600"
    },
    {
      icon: <ChefHat className="w-6 h-6" />,
      title: "Recetas Personalizadas", 
      description: "Miles de recetas adaptadas a tu dieta, alergias y gustos",
      gradient: "from-emerald-500 to-teal-600"
    },
    {
      icon: <ShoppingCart className="w-6 h-6" />,
      title: "Lista de Compras Automática",
      description: "Genera listas optimizadas basadas en tu planificación",
      gradient: "from-orange-500 to-red-600"
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "Asistente IA",
      description: "Claude y Gemini te ayudan a crear comidas perfectas",
      gradient: "from-purple-500 to-pink-600"
    }
  ];

  const testimonials = [
    {
      name: "María González",
      role: "Madre de familia",
      content: "Kecarajocomer revolucionó la forma en que planificamos nuestras comidas. ¡Ahora es súper fácil!",
      avatar: "MG",
      rating: 5
    },
    {
      name: "Carlos Ruiz",
      role: "Chef profesional",
      content: "La IA realmente entiende mis preferencias culinarias. Las sugerencias son increíbles.",
      avatar: "CR", 
      rating: 5
    },
    {
      name: "Ana Martín",
      role: "Nutricionista",
      content: "Perfecto para crear planes nutricionales balanceados para mis pacientes.",
      avatar: "AM",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 dark:from-gray-900 dark:via-blue-900 dark:to-emerald-900">
      {/* Navigation */}
      <nav className="relative z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/20 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <ChefHat className="w-8 h-8 text-emerald-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                kecarajocomer
              </span>
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-700 hover:text-emerald-600 transition-colors">Características</a>
              <a href="#pricing" className="text-gray-700 hover:text-emerald-600 transition-colors">Precios</a>
              <a href="#testimonials" className="text-gray-700 hover:text-emerald-600 transition-colors">Testimonios</a>
              <Button variant="outline" size="sm">Iniciar Sesión</Button>
              <Button size="sm">Prueba Gratuita</Button>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Abrir menú móvil"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
            <div className="px-4 py-6 space-y-4">
              <a href="#features" className="block text-gray-700 hover:text-emerald-600">Características</a>
              <a href="#pricing" className="block text-gray-700 hover:text-emerald-600">Precios</a>
              <a href="#testimonials" className="block text-gray-700 hover:text-emerald-600">Testimonios</a>
              <Button variant="outline" className="w-full">Iniciar Sesión</Button>
              <Button className="w-full">Prueba Gratuita</Button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-6xl mx-auto">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-emerald-100 text-emerald-800 text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4 mr-2" />
            Powered by IA Claude & Gemini
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-emerald-700 to-teal-600 bg-clip-text text-transparent leading-tight">
            Planifica tus comidas
            <br />
            <span className="text-transparent bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text">
              con inteligencia
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            Organiza tu alimentación semanal, descubre recetas personalizadas y genera listas de compras automáticas. 
            Todo con la ayuda de inteligencia artificial.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Button size="xl" className="group">
              Comenzar Gratis
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="outline" size="xl">
              Ver Demo
            </Button>
          </div>

          {/* Hero Visual */}
          <div className="relative max-w-4xl mx-auto">
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-gray-200/50">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="h-12 bg-gradient-to-r from-emerald-200 to-teal-200 rounded-xl"></div>
                <div className="h-12 bg-gradient-to-r from-blue-200 to-purple-200 rounded-xl"></div>
                <div className="h-12 bg-gradient-to-r from-orange-200 to-red-200 rounded-xl"></div>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {[...Array(14)].map((_, i) => (
                  <div key={i} className={`h-8 rounded-lg ${i % 3 === 0 ? 'bg-emerald-100' : i % 3 === 1 ? 'bg-blue-100' : 'bg-gray-100'}`}></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Todo lo que necesitas para una alimentación perfecta
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Nuestra plataforma combina planificación inteligente con tecnología de vanguardia
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold text-emerald-600 mb-2">10K+</div>
              <div className="text-gray-600">Usuarios activos</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-emerald-600 mb-2">50K+</div>
              <div className="text-gray-600">Recetas disponibles</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-emerald-600 mb-2">98%</div>
              <div className="text-gray-600">Satisfacción</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-emerald-600 mb-2">24/7</div>
              <div className="text-gray-600">Asistente IA</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Lo que dicen nuestros usuarios
            </h2>
            <p className="text-xl text-gray-600">Miles de familias ya transformaron su forma de comer</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard key={index} {...testimonial} />
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Planes para cada necesidad
            </h2>
            <p className="text-xl text-gray-600">Comienza gratis y escala según crezcas</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Plan Gratuito */}
            <Card className="relative">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Gratuito</CardTitle>
                <div className="text-4xl font-bold text-gray-900 mb-2">$0</div>
                <CardDescription>Para empezar</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center"><Check className="w-5 h-5 text-emerald-600 mr-3" />5 recetas por semana</li>
                  <li className="flex items-center"><Check className="w-5 h-5 text-emerald-600 mr-3" />Lista de compras básica</li>
                  <li className="flex items-center"><Check className="w-5 h-5 text-emerald-600 mr-3" />Planificación semanal</li>
                </ul>
                <Button className="w-full mt-6" variant="outline">Comenzar Gratis</Button>
              </CardContent>
            </Card>

            {/* Plan Pro */}
            <Card className="relative border-emerald-200 ring-2 ring-emerald-200 scale-105">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Más Popular
                </span>
              </div>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Pro</CardTitle>
                <div className="text-4xl font-bold text-gray-900 mb-2">$9.99</div>
                <CardDescription>por mes</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center"><Check className="w-5 h-5 text-emerald-600 mr-3" />Recetas ilimitadas</li>
                  <li className="flex items-center"><Check className="w-5 h-5 text-emerald-600 mr-3" />Asistente IA avanzado</li>
                  <li className="flex items-center"><Check className="w-5 h-5 text-emerald-600 mr-3" />Análisis nutricional</li>
                  <li className="flex items-center"><Check className="w-5 h-5 text-emerald-600 mr-3" />Gestión de despensa</li>
                </ul>
                <Button className="w-full mt-6">Comenzar Prueba</Button>
              </CardContent>
            </Card>

            {/* Plan Premium */}
            <Card className="relative">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Premium</CardTitle>
                <div className="text-4xl font-bold text-gray-900 mb-2">$19.99</div>
                <CardDescription>por mes</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center"><Check className="w-5 h-5 text-emerald-600 mr-3" />Todo de Pro</li>
                  <li className="flex items-center"><Check className="w-5 h-5 text-emerald-600 mr-3" />Recetas personalizadas</li>
                  <li className="flex items-center"><Check className="w-5 h-5 text-emerald-600 mr-3" />Soporte prioritario</li>
                  <li className="flex items-center"><Check className="w-5 h-5 text-emerald-600 mr-3" />Integración tiendas</li>
                </ul>
                <Button className="w-full mt-6" variant="premium">Ir Premium</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            ¿Listo para transformar tu alimentación?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Únete a miles de familias que ya disfrutan de una alimentación planificada y deliciosa
          </p>
          <Button size="xl" className="group">
            Comenzar Ahora Gratis
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <ChefHat className="w-8 h-8 text-emerald-400" />
                <span className="text-2xl font-bold">kecarajocomer</span>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                La plataforma de planificación de comidas más inteligente, powered by IA.
              </p>
              <div className="flex space-x-4">
                <Button variant="ghost" size="sm">Política de Privacidad</Button>
                <Button variant="ghost" size="sm">Términos</Button>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Producto</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Características</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Precios</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Soporte</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Centro de Ayuda</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contacto</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Estado del Servicio</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 kecarajocomer. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;