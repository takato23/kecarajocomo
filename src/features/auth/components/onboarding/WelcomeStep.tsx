'use client';

import { ChefHat, Clock, Leaf, ShoppingCart, Sparkles, ArrowRight, Star } from 'lucide-react';
import { motion } from 'framer-motion';

interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  const features = [
    {
      icon: <Sparkles className="h-6 w-6 text-yellow-400" />,
      title: 'Planificación con IA',
      description: 'Recibe sugerencias personalizadas basadas en tus preferencias y necesidades',
      color: 'from-purple-400 to-pink-400'
    },
    {
      icon: <Clock className="h-6 w-6 text-blue-400" />,
      title: 'Ahorra Tiempo',
      description: 'Menos tiempo planeando, más tiempo disfrutando comidas deliciosas',
      color: 'from-blue-400 to-cyan-400'
    },
    {
      icon: <Leaf className="h-6 w-6 text-green-400" />,
      title: 'Reduce Desperdicios',
      description: 'Gestión inteligente de tu despensa para aprovechar lo que tienes',
      color: 'from-green-400 to-emerald-400'
    },
    {
      icon: <ShoppingCart className="h-6 w-6 text-orange-400" />,
      title: 'Compras Optimizadas',
      description: 'Listas organizadas que te ahorran dinero y viajes al super',
      color: 'from-orange-400 to-red-400'
    }
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10"
      >
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full mb-6 shadow-lg"
        >
          <ChefHat className="h-10 w-10 text-white" />
        </motion.div>
        <h1 className="text-4xl font-bold text-white mb-4">
          ¡Bienvenido a Ke Carajo Comer! 🎉
        </h1>
        <p className="text-xl text-white/80">
          Configuremos tu experiencia culinaria personalizada en solo unos minutos
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6 mb-10">
        {features.map((feature, index) => (
          <motion.div 
            key={index} 
            initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
            className="flex gap-4 backdrop-blur-lg bg-white/5 rounded-2xl p-5 border border-white/10 hover:bg-white/10 transition-all"
          >
            <div className="flex-shrink-0">
              <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center shadow-lg`}>
                {feature.icon}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
              <p className="text-sm text-white/60">{feature.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="backdrop-blur-lg bg-white/5 rounded-2xl p-8 mb-10 border border-white/10"
      >
        <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-400" />
          Lo que configuraremos:
        </h2>
        <ul className="space-y-3">
          {[
            'Tu perfil y estilo de cocina',
            'Preferencias dietéticas y restricciones',
            'Nivel de experiencia y tiempo disponible',
            'Objetivos nutricionales (opcional)',
            'Los básicos de tu despensa',
            '¡Tu primer plan de comidas generado por IA!'
          ].map((item, index) => (
            <motion.li 
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}
              className="flex items-center text-white/80"
            >
              <span className="w-7 h-7 bg-gradient-to-br from-purple-400 to-pink-400 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 shadow">
                {index + 1}
              </span>
              {item}
            </motion.li>
          ))}
        </ul>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.2 }}
        className="flex justify-center"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onNext}
          className="group px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-2xl hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-4 focus:ring-purple-500/50 transition-all duration-200 shadow-lg flex items-center gap-3"
        >
          <span className="text-lg">Comencemos</span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </motion.button>
      </motion.div>
    </div>
  );
}