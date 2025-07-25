import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Clock, Users, Flame, Edit2, Trash2 } from 'lucide-react';

interface MealSlotProps {
  isEmpty?: boolean;
  meal?: {
    name: string;
    time: string;
    calories: number;
    servings: number;
    image?: string;
  };
  onAdd?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

// Design 1: Neumorphic Design
export const NeumorphicMealSlot: React.FC<MealSlotProps> = ({ isEmpty, meal, onAdd, onEdit, onDelete }) => {
  if (isEmpty) {
    return (
      <motion.div
        whileHover={{ scale: 0.98 }}
        whileTap={{ scale: 0.96 }}
        className="w-full h-48 bg-gray-900 rounded-3xl p-6 cursor-pointer
                   shadow-[inset_8px_8px_16px_rgba(0,0,0,0.6),inset_-8px_-8px_16px_rgba(255,255,255,0.05)]
                   hover:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.6),inset_-4px_-4px_8px_rgba(255,255,255,0.05)]
                   transition-all duration-300"
        onClick={onAdd}
      >
        <div className="flex flex-col items-center justify-center h-full space-y-3">
          <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center
                          shadow-[4px_4px_8px_rgba(0,0,0,0.6),-4px_-4px_8px_rgba(255,255,255,0.05)]">
            <Plus className="w-8 h-8 text-gray-500" />
          </div>
          <p className="text-gray-500 text-sm font-medium">Agregar Comida</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="w-full bg-gray-900 rounded-3xl p-5 relative overflow-hidden
                 shadow-[8px_8px_16px_rgba(0,0,0,0.6),-8px_-8px_16px_rgba(255,255,255,0.05)]"
    >
      {meal?.image && (
        <div className="absolute inset-0 opacity-10">
          <img src={meal.image} alt={meal.name} className="w-full h-full object-cover" />
        </div>
      )}
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-white font-semibold text-lg">{meal?.name}</h3>
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="w-8 h-8 bg-gray-800 rounded-xl flex items-center justify-center
                         shadow-[2px_2px_4px_rgba(0,0,0,0.6),-2px_-2px_4px_rgba(255,255,255,0.05)]
                         hover:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.6),inset_-2px_-2px_4px_rgba(255,255,255,0.05)]
                         transition-all duration-200"
            >
              <Edit2 className="w-4 h-4 text-gray-400" />
            </button>
            <button
              onClick={onDelete}
              className="w-8 h-8 bg-gray-800 rounded-xl flex items-center justify-center
                         shadow-[2px_2px_4px_rgba(0,0,0,0.6),-2px_-2px_4px_rgba(255,255,255,0.05)]
                         hover:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.6),inset_-2px_-2px_4px_rgba(255,255,255,0.05)]
                         transition-all duration-200"
            >
              <Trash2 className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-3 mt-6">
          <div className="bg-gray-800 rounded-2xl p-3 text-center
                          shadow-[inset_2px_2px_4px_rgba(0,0,0,0.6),inset_-2px_-2px_4px_rgba(255,255,255,0.05)]">
            <Clock className="w-4 h-4 text-gray-500 mx-auto mb-1" />
            <p className="text-xs text-gray-400">{meal?.time}</p>
          </div>
          <div className="bg-gray-800 rounded-2xl p-3 text-center
                          shadow-[inset_2px_2px_4px_rgba(0,0,0,0.6),inset_-2px_-2px_4px_rgba(255,255,255,0.05)]">
            <Flame className="w-4 h-4 text-gray-500 mx-auto mb-1" />
            <p className="text-xs text-gray-400">{meal?.calories} cal</p>
          </div>
          <div className="bg-gray-800 rounded-2xl p-3 text-center
                          shadow-[inset_2px_2px_4px_rgba(0,0,0,0.6),inset_-2px_-2px_4px_rgba(255,255,255,0.05)]">
            <Users className="w-4 h-4 text-gray-500 mx-auto mb-1" />
            <p className="text-xs text-gray-400">{meal?.servings}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Design 2: Minimalist Cards
export const MinimalistMealSlot: React.FC<MealSlotProps> = ({ isEmpty, meal, onAdd, onEdit, onDelete }) => {
  if (isEmpty) {
    return (
      <motion.div
        whileHover={{ y: -4 }}
        whileTap={{ scale: 0.98 }}
        className="w-full h-48 border border-gray-800 rounded-lg p-8 cursor-pointer
                   hover:border-gray-700 transition-all duration-300 group"
        onClick={onAdd}
      >
        <div className="flex flex-col items-center justify-center h-full space-y-4">
          <Plus className="w-6 h-6 text-gray-600 group-hover:text-gray-400 transition-colors" />
          <p className="text-gray-600 text-xs uppercase tracking-wider group-hover:text-gray-400 transition-colors">
            Add Meal
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="w-full bg-black border border-gray-800 rounded-lg p-6 relative
                 hover:border-gray-700 transition-all duration-300"
    >
      <div className="flex justify-between items-start mb-8">
        <div>
          <h3 className="text-white font-light text-xl mb-1">{meal?.name}</h3>
          <p className="text-gray-500 text-xs uppercase tracking-wider">{meal?.time}</p>
        </div>
        <div className="flex gap-1 opacity-0 hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="w-8 h-8 hover:bg-gray-900 rounded transition-colors flex items-center justify-center"
          >
            <Edit2 className="w-3 h-3 text-gray-500" />
          </button>
          <button
            onClick={onDelete}
            className="w-8 h-8 hover:bg-gray-900 rounded transition-colors flex items-center justify-center"
          >
            <Trash2 className="w-3 h-3 text-gray-500" />
          </button>
        </div>
      </div>
      
      <div className="flex items-center gap-6 text-xs text-gray-500">
        <span>{meal?.calories} calories</span>
        <span>•</span>
        <span>{meal?.servings} servings</span>
      </div>
    </motion.div>
  );
};

// Design 3: Gradient Orbs
export const GradientOrbMealSlot: React.FC<MealSlotProps> = ({ isEmpty, meal, onAdd, onEdit, onDelete }) => {
  const gradients = [
    'from-purple-600 to-pink-600',
    'from-blue-600 to-cyan-600',
    'from-green-600 to-emerald-600',
    'from-orange-600 to-red-600',
    'from-indigo-600 to-purple-600'
  ];
  
  const randomGradient = gradients[Math.floor(Math.random() * gradients.length)];

  if (isEmpty) {
    return (
      <motion.div
        whileHover={{ scale: 1.05, rotate: 5 }}
        whileTap={{ scale: 0.95 }}
        className="w-full h-48 relative cursor-pointer group"
        onClick={onAdd}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full
                        opacity-20 group-hover:opacity-30 transition-opacity" />
        <div className="absolute inset-4 border-2 border-dashed border-gray-700 rounded-full
                        group-hover:border-gray-600 transition-colors" />
        <div className="flex flex-col items-center justify-center h-full space-y-3">
          <Plus className="w-8 h-8 text-gray-600 group-hover:text-gray-500 transition-colors" />
          <p className="text-gray-600 text-sm font-medium group-hover:text-gray-500 transition-colors">
            Agregar
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="w-full h-48 relative group"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${randomGradient} rounded-full
                       opacity-80 group-hover:opacity-100 transition-opacity blur-xl`} />
      <div className={`absolute inset-0 bg-gradient-to-br ${randomGradient} rounded-full
                       opacity-90`} />
      
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center p-6">
        <h3 className="text-white font-bold text-lg mb-2">{meal?.name}</h3>
        
        <div className="flex items-center gap-4 text-white/80 text-sm mb-4">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{meal?.time}</span>
          </div>
          <div className="flex items-center gap-1">
            <Flame className="w-3 h-3" />
            <span>{meal?.calories}</span>
          </div>
        </div>
        
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center
                       hover:bg-white/30 transition-colors"
          >
            <Edit2 className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={onDelete}
            className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center
                       hover:bg-white/30 transition-colors"
          >
            <Trash2 className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// Design 4: Retro-Futuristic
export const RetroFuturisticMealSlot: React.FC<MealSlotProps> = ({ isEmpty, meal, onAdd, onEdit, onDelete }) => {
  if (isEmpty) {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full h-48 relative cursor-pointer group"
        onClick={onAdd}
      >
        <div className="absolute inset-0 bg-black rounded-lg border border-cyan-500/30
                        group-hover:border-cyan-400/50 transition-colors" />
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-lg" />
        <div className="absolute inset-0 rounded-lg overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_48%,rgba(0,255,255,0.03)_49%,rgba(0,255,255,0.03)_51%,transparent_52%)]
                          bg-[length:20px_20px]" />
        </div>
        
        <div className="relative z-10 flex flex-col items-center justify-center h-full space-y-3">
          <div className="w-16 h-16 border-2 border-cyan-500/50 rounded-lg flex items-center justify-center
                          group-hover:border-cyan-400 transition-colors relative">
            <div className="absolute inset-0 bg-cyan-500/20 blur-md" />
            <Plus className="w-8 h-8 text-cyan-400 relative z-10" />
          </div>
          <p className="text-cyan-400 text-sm font-mono uppercase tracking-wider">Add_Meal</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="w-full relative group"
    >
      <div className="absolute inset-0 bg-black rounded-lg border border-purple-500/50
                      group-hover:border-purple-400 transition-colors" />
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg" />
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-pink-400 to-transparent" />
      
      <div className="relative z-10 p-5">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-purple-300 font-mono text-lg uppercase tracking-wider">{meal?.name}</h3>
            <p className="text-pink-400/60 text-xs font-mono">SCHEDULED: {meal?.time}</p>
          </div>
          <div className="flex gap-1">
            <button
              onClick={onEdit}
              className="w-7 h-7 border border-purple-500/50 bg-purple-500/10 rounded flex items-center justify-center
                         hover:border-purple-400 hover:bg-purple-500/20 transition-all"
            >
              <Edit2 className="w-3 h-3 text-purple-400" />
            </button>
            <button
              onClick={onDelete}
              className="w-7 h-7 border border-pink-500/50 bg-pink-500/10 rounded flex items-center justify-center
                         hover:border-pink-400 hover:bg-pink-500/20 transition-all"
            >
              <Trash2 className="w-3 h-3 text-pink-400" />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-2 mt-6">
          <div className="border border-cyan-500/30 bg-cyan-500/10 rounded p-2 text-center">
            <p className="text-cyan-400 text-xs font-mono">CAL</p>
            <p className="text-cyan-300 text-sm font-mono">{meal?.calories}</p>
          </div>
          <div className="border border-purple-500/30 bg-purple-500/10 rounded p-2 text-center">
            <p className="text-purple-400 text-xs font-mono">SRV</p>
            <p className="text-purple-300 text-sm font-mono">{meal?.servings}</p>
          </div>
          <div className="border border-pink-500/30 bg-pink-500/10 rounded p-2 text-center">
            <p className="text-pink-400 text-xs font-mono">RDY</p>
            <p className="text-pink-300 text-sm font-mono">YES</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Design 5: Nature-Inspired
export const NatureInspiredMealSlot: React.FC<MealSlotProps> = ({ isEmpty, meal, onAdd, onEdit, onDelete }) => {
  if (isEmpty) {
    return (
      <motion.div
        whileHover={{ scale: 1.03, rotate: -2 }}
        whileTap={{ scale: 0.97 }}
        className="w-full h-48 relative cursor-pointer group"
        onClick={onAdd}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/30 to-emerald-900/30 
                        rounded-[2rem] backdrop-blur-sm border border-green-800/30
                        group-hover:border-green-700/50 transition-all duration-300" />
        
        <svg className="absolute top-4 right-4 w-16 h-16 text-green-800/20 group-hover:text-green-700/30 transition-colors"
             viewBox="0 0 100 100">
          <path d="M50 10 Q20 40 30 70 T50 90 Q80 60 70 30 Z" fill="currentColor" />
        </svg>
        
        <div className="relative z-10 flex flex-col items-center justify-center h-full space-y-3">
          <div className="w-14 h-14 bg-gradient-to-br from-green-800/40 to-emerald-800/40 
                          rounded-full flex items-center justify-center backdrop-blur-sm
                          group-hover:from-green-700/50 group-hover:to-emerald-700/50 transition-all">
            <Plus className="w-6 h-6 text-green-400" />
          </div>
          <p className="text-green-400 text-sm font-medium">Cultivar Comida</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02, rotate: 1 }}
      className="w-full relative group overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 to-green-900/40 
                      rounded-[2rem] backdrop-blur-sm border border-emerald-800/40" />
      
      <svg className="absolute -bottom-4 -right-4 w-32 h-32 text-emerald-800/10"
           viewBox="0 0 100 100">
        <path d="M50 10 Q20 40 30 70 T50 90 Q80 60 70 30 Z" fill="currentColor" transform="rotate(45 50 50)" />
      </svg>
      
      <div className="relative z-10 p-5">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-emerald-300 font-semibold text-lg mb-1">{meal?.name}</h3>
            <p className="text-emerald-400/60 text-sm flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {meal?.time}
            </p>
          </div>
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onEdit}
              className="w-8 h-8 bg-emerald-800/30 backdrop-blur-sm rounded-full flex items-center justify-center
                         hover:bg-emerald-700/40 transition-colors"
            >
              <Edit2 className="w-4 h-4 text-emerald-400" />
            </button>
            <button
              onClick={onDelete}
              className="w-8 h-8 bg-green-800/30 backdrop-blur-sm rounded-full flex items-center justify-center
                         hover:bg-green-700/40 transition-colors"
            >
              <Trash2 className="w-4 h-4 text-green-400" />
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-4 mt-6">
          <div className="flex items-center gap-2 bg-emerald-800/20 backdrop-blur-sm rounded-full px-3 py-1">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-emerald-300 text-sm">{meal?.calories} cal</span>
          </div>
          <div className="flex items-center gap-2 bg-green-800/20 backdrop-blur-sm rounded-full px-3 py-1">
            <Users className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-300 text-sm">{meal?.servings} porciones</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Demo Component
export const MealSlotShowcase: React.FC = () => {
  const sampleMeal = {
    name: "Pollo Teriyaki",
    time: "12:30 PM",
    calories: 420,
    servings: 2,
    image: "https://images.unsplash.com/photo-1609501676725-7186f017a4b7"
  };

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <h1 className="text-4xl font-bold text-white text-center mb-12">
        Meal Slot Design Concepts
      </h1>
      
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Neumorphic Design */}
        <section>
          <h2 className="text-2xl font-semibold text-white mb-6">1. Neumorphic Design</h2>
          <p className="text-gray-400 mb-8">Soft, extruded appearance with depth and tactile feel</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
            <NeumorphicMealSlot isEmpty onAdd={() => console.log('Add meal')} />
            <NeumorphicMealSlot 
              meal={sampleMeal} 
              onEdit={() => console.log('Edit')} 
              onDelete={() => console.log('Delete')} 
            />
          </div>
        </section>

        {/* Minimalist Cards */}
        <section>
          <h2 className="text-2xl font-semibold text-white mb-6">2. Minimalist Cards</h2>
          <p className="text-gray-400 mb-8">Ultra-clean with focus on typography and negative space</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
            <MinimalistMealSlot isEmpty onAdd={() => console.log('Add meal')} />
            <MinimalistMealSlot 
              meal={sampleMeal} 
              onEdit={() => console.log('Edit')} 
              onDelete={() => console.log('Delete')} 
            />
          </div>
        </section>

        {/* Gradient Orbs */}
        <section>
          <h2 className="text-2xl font-semibold text-white mb-6">3. Gradient Orbs</h2>
          <p className="text-gray-400 mb-8">Circular designs with vibrant gradients and playful energy</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
            <GradientOrbMealSlot isEmpty onAdd={() => console.log('Add meal')} />
            <GradientOrbMealSlot 
              meal={sampleMeal} 
              onEdit={() => console.log('Edit')} 
              onDelete={() => console.log('Delete')} 
            />
          </div>
        </section>

        {/* Retro-Futuristic */}
        <section>
          <h2 className="text-2xl font-semibold text-white mb-6">4. Retro-Futuristic</h2>
          <p className="text-gray-400 mb-8">Neon borders, grid patterns, and cyberpunk aesthetic</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
            <RetroFuturisticMealSlot isEmpty onAdd={() => console.log('Add meal')} />
            <RetroFuturisticMealSlot 
              meal={sampleMeal} 
              onEdit={() => console.log('Edit')} 
              onDelete={() => console.log('Delete')} 
            />
          </div>
        </section>

        {/* Nature-Inspired */}
        <section>
          <h2 className="text-2xl font-semibold text-white mb-6">5. Nature-Inspired</h2>
          <p className="text-gray-400 mb-8">Organic shapes, leaf patterns, and earthy tones</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
            <NatureInspiredMealSlot isEmpty onAdd={() => console.log('Add meal')} />
            <NatureInspiredMealSlot 
              meal={sampleMeal} 
              onEdit={() => console.log('Edit')} 
              onDelete={() => console.log('Delete')} 
            />
          </div>
        </section>
      </div>
    </div>
  );
};

export default MealSlotShowcase;