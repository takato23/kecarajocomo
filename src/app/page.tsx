'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { 
  ChefHat, 
  Calendar, 
  ShoppingCart, 
  Brain, 
  Clock, 
  Heart,
  Sparkles,
  Users,
  Check,
  Menu,
  X,
  ArrowRight,
  Zap,
  Shield,
  Award,
  TrendingUp,
  Leaf,
  Moon,
  Sun,
  ChevronDown
} from 'lucide-react';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SignInForm } from '@/features/auth/components/SignInForm';
import { SignUpForm } from '@/features/auth/components/SignUpForm';
import { DarkModeToggle } from '@/components/ui/DarkModeToggle';
import { cn } from '@/lib/utils';

const features = [
  {
    icon: Brain,
    title: 'IA Personalizada',
    description: 'Claude y Gemini crean planes de comida adaptados a tus gustos y necesidades',
    color: 'from-purple-500 to-pink-500',
    tooltip: 'Utilizamos las IAs más avanzadas para entender tus preferencias'
  },
  {
    icon: Calendar,
    title: 'Planificación Semanal',
    description: 'Organiza tus comidas con nuestro calendario interactivo drag & drop',
    color: 'from-blue-500 to-cyan-500',
    tooltip: 'Arrastra y suelta comidas para reorganizar tu semana'
  },
  {
    icon: ShoppingCart,
    title: 'Lista de Compras Inteligente',
    description: 'Genera automáticamente tu lista de compras optimizada',
    color: 'from-green-500 to-emerald-500',
    tooltip: 'Agrupa ingredientes y calcula cantidades exactas'
  },
  {
    icon: Heart,
    title: 'Nutrición Balanceada',
    description: 'Monitorea tus objetivos nutricionales y mantén una dieta equilibrada',
    color: 'from-red-500 to-rose-500',
    tooltip: 'Rastrea calorías, macros y micronutrientes'
  },
  {
    icon: Clock,
    title: 'Ahorra Tiempo',
    description: 'Deja de pensar qué cocinar. Nosotros lo hacemos por ti',
    color: 'from-amber-500 to-orange-500',
    tooltip: 'Planifica toda tu semana en minutos'
  },
  {
    icon: Leaf,
    title: 'Reduce Desperdicios',
    description: 'Gestión inteligente de despensa para minimizar el desperdicio de comida',
    color: 'from-lime-500 to-green-500',
    tooltip: 'Recibe alertas de caducidad y sugerencias de uso'
  }
];

const pricingPlans = [
  {
    name: 'Gratis',
    price: '0',
    description: 'Perfecto para empezar',
    features: [
      'Plan semanal básico',
      '10 recetas por mes',
      'Lista de compras',
      'Calendario simple'
    ],
    cta: 'Comenzar Gratis',
    highlighted: false
  },
  {
    name: 'Premium',
    price: '9.99',
    description: 'Para los amantes de la cocina',
    features: [
      'Planes ilimitados con IA',
      'Recetas ilimitadas',
      'Análisis nutricional completo',
      'Gestión de despensa',
      'Exportar listas de compras',
      'Soporte prioritario'
    ],
    cta: 'Prueba 7 días gratis',
    highlighted: true,
    badge: 'Más Popular'
  },
  {
    name: 'Familia',
    price: '19.99',
    description: 'Ideal para hogares',
    features: [
      'Todo de Premium',
      'Hasta 6 perfiles',
      'Planes personalizados por miembro',
      'Presupuesto familiar',
      'Compartir recetas',
      'Historial completo'
    ],
    cta: 'Comenzar prueba',
    highlighted: false
  }
];

const testimonials = [
  {
    name: 'María García',
    role: 'Madre de 3',
    content: 'KeCarajoComer me salvó la vida. Ya no tengo que pensar qué cocinar cada día.',
    rating: 5
  },
  {
    name: 'Carlos Rodríguez',
    role: 'Profesional ocupado',
    content: 'La IA entiende perfectamente mis gustos. Las recetas son deliciosas y fáciles.',
    rating: 5
  },
  {
    name: 'Ana Martínez',
    role: 'Fitness Enthusiast',
    content: 'El tracking nutricional es increíble. Por fin puedo mantener mis macros sin esfuerzo.',
    rating: 5
  }
];

export default function LandingPage() {
  const { user, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  const openAuthModal = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
    setMobileMenuOpen(false);
  };

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/20 dark:border-gray-700/20">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                  <ChefHat className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  KeCarajoComer
                </span>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-8">
                <button 
                  onClick={() => scrollToSection('features')}
                  className="text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                >
                  Características
                </button>
                <button 
                  onClick={() => scrollToSection('pricing')}
                  className="text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                >
                  Precios
                </button>
                <button 
                  onClick={() => scrollToSection('testimonials')}
                  className="text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                >
                  Testimonios
                </button>
                <DarkModeToggle />
                {user ? (
                  <Link href="/dashboard">
                    <Button className="bg-gradient-to-r from-orange-500 to-red-600 text-white hover:from-orange-600 hover:to-red-700">
                      Ir al Dashboard
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Button 
                      variant="ghost" 
                      onClick={() => openAuthModal('signin')}
                      className="text-gray-700 dark:text-gray-300"
                    >
                      Iniciar Sesión
                    </Button>
                    <Button 
                      onClick={() => openAuthModal('signup')}
                      className="bg-gradient-to-r from-orange-500 to-red-600 text-white hover:from-orange-600 hover:to-red-700"
                    >
                      Empezar Gratis
                    </Button>
                  </>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800"
            >
              <div className="container mx-auto px-4 py-4 space-y-2">
                <button 
                  onClick={() => scrollToSection('features')}
                  className="block w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Características
                </button>
                <button 
                  onClick={() => scrollToSection('pricing')}
                  className="block w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Precios
                </button>
                <button 
                  onClick={() => scrollToSection('testimonials')}
                  className="block w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Testimonios
                </button>
                <div className="flex items-center justify-between px-4 py-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Tema</span>
                  <DarkModeToggle />
                </div>
                <div className="border-t border-gray-200 dark:border-gray-800 pt-2">
                  {user ? (
                    <Link href="/dashboard" className="block">
                      <Button className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white">
                        Ir al Dashboard
                      </Button>
                    </Link>
                  ) : (
                    <>
                      <Button 
                        variant="ghost" 
                        onClick={() => openAuthModal('signin')}
                        className="w-full mb-2"
                      >
                        Iniciar Sesión
                      </Button>
                      <Button 
                        onClick={() => openAuthModal('signup')}
                        className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white"
                      >
                        Empezar Gratis
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </nav>

        {/* Hero Section */}
        <section className="relative pt-32 pb-20 px-4 overflow-hidden">
          <div className="container mx-auto max-w-6xl">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div 
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center lg:text-left"
              >
                <Badge className="mb-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Powered by Claude & Gemini AI
                </Badge>
                <h1 className="text-5xl lg:text-6xl font-bold mb-6">
                  <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                    ¿Ke Carajo Comer?
                  </span>
                  <br />
                  <span className="text-gray-900 dark:text-white">
                    Ya no es un problema
                  </span>
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                  Planifica tus comidas con IA, ahorra tiempo y dinero, come más saludable. 
                  Todo en una app diseñada para simplificar tu vida.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Button 
                    size="lg" 
                    onClick={() => openAuthModal('signup')}
                    className="bg-gradient-to-r from-orange-500 to-red-600 text-white hover:from-orange-600 hover:to-red-700 shadow-lg hover:shadow-xl transition-all"
                  >
                    Empezar Gratis
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline"
                    onClick={() => scrollToSection('features')}
                    className="border-gray-300 dark:border-gray-700"
                  >
                    Ver Cómo Funciona
                    <ChevronDown className="ml-2 w-4 h-4" />
                  </Button>
                </div>
                <div className="mt-8 flex items-center gap-8 justify-center lg:justify-start">
                  <div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">10K+</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Usuarios Activos</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">50K+</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Comidas Planificadas</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">4.9</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Rating ⭐</p>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="relative"
              >
                <div className="relative z-10">
                  <GlassCard className="p-8 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80">
                    <div className="aspect-square rounded-xl bg-gradient-to-br from-orange-400 to-red-500 p-1">
                      <div className="w-full h-full rounded-lg bg-white dark:bg-gray-900 flex items-center justify-center">
                        <div className="text-center p-8">
                          <ChefHat className="w-24 h-24 mx-auto mb-4 text-orange-500" />
                          <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            Tu Chef IA Personal
                          </p>
                          <p className="text-gray-600 dark:text-gray-400">
                            Crea planes de comida perfectos para ti
                          </p>
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-red-500/20 blur-3xl -z-10" />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <Badge className="mb-4">
                <Zap className="w-3 h-3 mr-1" />
                Características Principales
              </Badge>
              <h2 className="text-4xl font-bold mb-4">
                Todo lo que necesitas para planificar tus comidas
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Descubre cómo nuestra IA transforma la manera en que planificas y preparas tus comidas
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <GlassCard className="p-6 h-full hover:shadow-xl transition-all cursor-pointer group">
                        <div className={cn(
                          "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4 group-hover:scale-110 transition-transform",
                          feature.color
                        )}>
                          <feature.icon className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                        <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
                      </GlassCard>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{feature.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 px-4 bg-gray-50 dark:bg-gray-900/50">
          <div className="container mx-auto max-w-6xl">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <Badge className="mb-4">
                <Award className="w-3 h-3 mr-1" />
                Planes y Precios
              </Badge>
              <h2 className="text-4xl font-bold mb-4">
                Elige el plan perfecto para ti
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Comienza gratis y mejora cuando lo necesites. Sin compromisos.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {pricingPlans.map((plan, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <GlassCard className={cn(
                    "p-6 h-full relative",
                    plan.highlighted && "border-2 border-orange-500 shadow-xl"
                  )}>
                    {plan.badge && (
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-red-600 text-white border-0">
                        {plan.badge}
                      </Badge>
                    )}
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">{plan.description}</p>
                      <div className="flex items-baseline justify-center">
                        <span className="text-4xl font-bold">${plan.price}</span>
                        <span className="text-gray-600 dark:text-gray-400 ml-2">/mes</span>
                      </div>
                    </div>
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start">
                          <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className={cn(
                        "w-full",
                        plan.highlighted 
                          ? "bg-gradient-to-r from-orange-500 to-red-600 text-white hover:from-orange-600 hover:to-red-700" 
                          : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700"
                      )}
                      onClick={() => openAuthModal('signup')}
                    >
                      {plan.cta}
                    </Button>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <Badge className="mb-4">
                <Users className="w-3 h-3 mr-1" />
                Testimonios
              </Badge>
              <h2 className="text-4xl font-bold mb-4">
                Lo que dicen nuestros usuarios
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Miles de personas ya están ahorrando tiempo y comiendo mejor
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <GlassCard className="p-6 h-full">
                    <div className="flex mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <span key={i} className="text-yellow-500">⭐</span>
                      ))}
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 mb-4 italic">
                      "{testimonial.content}"
                    </p>
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{testimonial.role}</p>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-4xl">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <GlassCard className="p-12 text-center bg-gradient-to-br from-orange-500/10 to-red-500/10">
                <h2 className="text-4xl font-bold mb-4">
                  ¿Listo para simplificar tus comidas?
                </h2>
                <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
                  Únete a miles de usuarios que ya disfrutan de comidas planificadas con IA. 
                  Empieza gratis hoy mismo.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    size="lg" 
                    onClick={() => openAuthModal('signup')}
                    className="bg-gradient-to-r from-orange-500 to-red-600 text-white hover:from-orange-600 hover:to-red-700 shadow-lg hover:shadow-xl transition-all"
                  >
                    Crear Cuenta Gratis
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline"
                    onClick={() => scrollToSection('pricing')}
                    className="border-gray-300 dark:border-gray-700"
                  >
                    Ver Planes Premium
                    <TrendingUp className="ml-2 w-4 h-4" />
                  </Button>
                </div>
                <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                  No necesitas tarjeta de crédito • Cancela cuando quieras
                </p>
              </GlassCard>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-12 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <Link href="/" className="flex items-center space-x-2 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                    <ChefHat className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                    KeCarajoComer
                  </span>
                </Link>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Planifica tus comidas con IA y simplifica tu vida.
                </p>
                <div className="flex space-x-4">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                      </a>
                    </TooltipTrigger>
                    <TooltipContent>Facebook</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                        </svg>
                      </a>
                    </TooltipTrigger>
                    <TooltipContent>Twitter</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z"/>
                        </svg>
                      </a>
                    </TooltipTrigger>
                    <TooltipContent>Instagram</TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-4">Producto</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400">Características</a></li>
                  <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400">Precios</a></li>
                  <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400">Integraciones</a></li>
                  <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400">API</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-4">Empresa</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400">Sobre Nosotros</a></li>
                  <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400">Blog</a></li>
                  <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400">Carreras</a></li>
                  <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400">Contacto</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-4">Legal</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400">Privacidad</a></li>
                  <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400">Términos</a></li>
                  <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400">Cookies</a></li>
                  <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400">Licencias</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-800 mt-8 pt-8 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                © 2024 KeCarajoComer. Todos los derechos reservados. Hecho con ❤️ y IA.
              </p>
            </div>
          </div>
        </footer>

        {/* Auth Modal */}
        <Dialog open={authModalOpen} onOpenChange={setAuthModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center">
                {authMode === 'signin' ? 'Bienvenido de vuelta' : 'Crea tu cuenta'}
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              {authMode === 'signin' ? (
                <>
                  <SignInForm onSuccess={() => setAuthModalOpen(false)} />
                  <p className="text-center mt-4 text-sm text-gray-600 dark:text-gray-400">
                    ¿No tienes cuenta?{' '}
                    <button 
                      onClick={() => setAuthMode('signup')}
                      className="text-orange-600 hover:text-orange-700 font-medium"
                    >
                      Regístrate gratis
                    </button>
                  </p>
                </>
              ) : (
                <>
                  <SignUpForm onSuccess={() => setAuthModalOpen(false)} />
                  <p className="text-center mt-4 text-sm text-gray-600 dark:text-gray-400">
                    ¿Ya tienes cuenta?{' '}
                    <button 
                      onClick={() => setAuthMode('signin')}
                      className="text-orange-600 hover:text-orange-700 font-medium"
                    >
                      Inicia sesión
                    </button>
                  </p>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}