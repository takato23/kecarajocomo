'use client';

import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

export default function RecetasFavoritasPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Enhanced Background */}
      <div className="absolute inset-0" 
           style={{
             background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%)'
           }}>
        <div className="absolute top-10 left-10 w-96 h-96 rounded-full opacity-20"
             style={{
               background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)',
               backdropFilter: 'blur(60px)',
             }} />
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-block p-6 rounded-3xl mb-4"
               style={{
                 background: 'rgba(255, 255, 255, 0.1)',
                 backdropFilter: 'blur(30px)',
                 WebkitBackdropFilter: 'blur(30px)',
                 border: '1px solid rgba(255, 255, 255, 0.2)',
                 boxShadow: `
                   inset 6px 6px 12px rgba(255, 255, 255, 0.5),
                   inset -6px -6px 12px rgba(0, 0, 0, 0.05),
                   12px 12px 30px rgba(0, 0, 0, 0.15)
                 `
               }}>
            <Heart className="w-12 h-12 text-pink-500 mx-auto mb-3" />
            <h1 className="text-3xl font-bold text-white mb-2">Recetas Favoritas</h1>
            <p className="text-white/80">Tus recetas guardadas con amor</p>
          </div>
        </motion.div>
        
        <div className="text-center py-20">
          <div className="inline-block p-8 rounded-3xl"
               style={{
                 background: 'rgba(255, 255, 255, 0.1)',
                 backdropFilter: 'blur(30px)',
                 WebkitBackdropFilter: 'blur(30px)',
                 border: '1px solid rgba(255, 255, 255, 0.2)',
               }}>
            <p className="text-white/80 text-lg">Aún no tienes recetas favoritas</p>
            <p className="text-white/60 mt-2">Explora recetas y marca tus favoritas con ❤️</p>
          </div>
        </div>
      </div>
    </div>
  );
}