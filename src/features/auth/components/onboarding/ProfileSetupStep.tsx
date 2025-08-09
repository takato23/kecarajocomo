'use client';

import { useState, useEffect } from 'react'
import geminiConfig from '@/lib/config/gemini.config';;
import { Camera, User, Sparkles, Wand2, ChefHat, Heart, Utensils, ArrowLeft, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { logger } from '@/services/logger';
import { getAIService } from '@/services/ai/UnifiedAIService';

import { useOnboardingStore } from '../../store/onboardingStore';
import { useAppStore } from '@/store';
import { GlassCard, GlassButton } from './shared/GlassCard';

interface ProfileSetupStepProps {
  onNext: () => void;
  onBack: () => void;
}

const COOKING_PERSONAS = [
  { id: 'beginner', label: 'Principiante Entusiasta', icon: Heart, description: 'Recién empiezo mi aventura culinaria' },
  { id: 'home_cook', label: 'Cocinero Casero', icon: Utensils, description: 'Cocino regularmente para mi familia' },
  { id: 'foodie', label: 'Foodie Aventurero', icon: ChefHat, description: 'Me encanta experimentar con nuevos sabores' },
  { id: 'health_conscious', label: 'Saludable y Consciente', icon: Heart, description: 'Priorizo la nutrición y el bienestar' },
];

export function ProfileSetupStep({ onNext, onBack }: ProfileSetupStepProps) {
  const user = useAppStore((state) => state.user.profile);
  const { data, updateData, saveProfile } = useOnboardingStore();
  
  const [formData, setFormData] = useState({
    display_name: data.profile?.display_name || user?.name || '',
    bio: data.profile?.bio || '',
    avatar_url: data.profile?.avatar_url || '',
    cooking_persona: data.profile?.cooking_persona || ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);
  const [bioSuggestions, setBioSuggestions] = useState<string[]>([]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.display_name.trim()) {
      newErrors.display_name = 'El nombre es obligatorio';
    }
    
    if (!formData.cooking_persona) {
      newErrors.cooking_persona = 'Por favor selecciona tu estilo de cocina';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateBioSuggestions = async () => {
    if (!formData.display_name || !formData.cooking_persona) {
      return;
    }

    setIsGeneratingBio(true);
    try {
      const apiKey = geminiConfig.getApiKey();
      if (!apiKey) {
        throw new Error('Gemini API key not configured');
      }

      const aiService = getAIService();

      const persona = COOKING_PERSONAS.find(p => p.id === formData.cooking_persona);
      const prompt = `Genera 3 biografías cortas y amigables (máximo 2 líneas cada una) para un usuario de una app de planificación de comidas.
      
      Información del usuario:
      - Nombre: ${formData.display_name}
      - Estilo de cocina: ${persona?.label}
      - Descripción: ${persona?.description}
      
      Las biografías deben ser:
      - Personales y cálidas
      - Reflejar su estilo de cocina
      - Motivadoras
      - En español
      - Sin emojis
      
      Responde SOLO con un JSON array de 3 strings, sin markdown ni explicaciones adicionales.`;

      const result = await aiService.generateText({ prompt: prompt);
      const response = await result.response;
      let text = response.text().trim();
      
      // Clean markdown if present
      if (text.startsWith('```json')) {
        text = text.slice(7);
      }
      if (text.startsWith('```')) {
        text = text.slice(3);
      }
      if (text.endsWith('```')) {
        text = text.slice(0, -3);
      }
      
      const suggestions = JSON.parse(text.trim());
      setBioSuggestions(suggestions);
    } catch (error) {
      logger.error('Failed to generate bio suggestions:', 'ProfileSetupStep', error);
      // Fallback suggestions
      setBioSuggestions([
        `Soy ${formData.display_name} y me encanta descubrir nuevos sabores en la cocina.`,
        `Apasionado por la cocina casera y las recetas que alimentan el alma.`,
        `Explorando el mundo a través de sus sabores, un plato a la vez.`
      ]);
    } finally {
      setIsGeneratingBio(false);
    }
  };

  useEffect(() => {
    if (formData.display_name && formData.cooking_persona && bioSuggestions.length === 0) {
      generateBioSuggestions();
    }
  }, [formData.cooking_persona]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      await saveProfile(formData);
      onNext();
    } catch (error: unknown) {
      logger.error('Failed to save profile:', 'ProfileSetupStep', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, avatar_url: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const selectBioSuggestion = (bio: string) => {
    setFormData({ ...formData, bio });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-3xl font-bold text-white mb-2">
          Configuremos tu perfil
        </h2>
        <p className="text-white/60">
          Cuéntanos sobre ti para personalizar tu experiencia culinaria
        </p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar Upload */}
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex justify-center mb-6"
        >
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-white/10 backdrop-blur-xl border-2 border-white/20 flex items-center justify-center">
              {formData.avatar_url ? (
                <img 
                  src={formData.avatar_url} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-12 h-12 text-white/40" />
              )}
            </div>
            <label
              htmlFor="avatar-upload"
              className="absolute bottom-0 right-0 w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center cursor-pointer hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg"
            >
              <Camera className="w-4 h-4 text-white" />
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </label>
          </div>
        </motion.div>

        {/* Display Name */}
        <GlassCard>
          <label htmlFor="display_name" className="block text-sm font-medium text-white mb-2">
            ¿Cómo te llamas? *
          </label>
          <input
            id="display_name"
            type="text"
            value={formData.display_name}
            onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
            className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition-all ${
              errors.display_name ? 'border-red-400' : 'border-white/20'
            }`}
            placeholder="Tu nombre"
          />
          {errors.display_name && (
            <p className="mt-1 text-sm text-red-400">{errors.display_name}</p>
          )}
        </GlassCard>

        {/* Cooking Persona */}
        <div>
          <label className="block text-sm font-medium text-white mb-3">
            ¿Cuál es tu estilo en la cocina? *
          </label>
          <div className="grid grid-cols-2 gap-3">
            {COOKING_PERSONAS.map((persona, index) => {
              const Icon = persona.icon;
              return (
                <motion.button
                  key={persona.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 * index }}
                  type="button"
                  onClick={() => setFormData({ ...formData, cooking_persona: persona.id })}
                  className={`p-4 rounded-xl border-2 transition-all backdrop-blur-xl ${
                    formData.cooking_persona === persona.id
                      ? 'border-purple-400 bg-purple-500/20'
                      : 'border-white/20 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <Icon className={`w-8 h-8 mx-auto mb-2 ${
                    formData.cooking_persona === persona.id ? 'text-purple-400' : 'text-white/60'
                  }`} />
                  <h3 className={`font-medium text-sm ${
                    formData.cooking_persona === persona.id ? 'text-white' : 'text-white/80'
                  }`}>
                    {persona.label}
                  </h3>
                  <p className="text-xs text-white/60 mt-1">{persona.description}</p>
                </motion.button>
              );
            })}
          </div>
          {errors.cooking_persona && (
            <p className="mt-2 text-sm text-red-400">{errors.cooking_persona}</p>
          )}
        </div>

        {/* Bio with AI Suggestions */}
        <GlassCard>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="bio" className="block text-sm font-medium text-white">
              Sobre ti
              <span className="text-white/60 font-normal ml-2">(Opcional)</span>
            </label>
            {formData.display_name && formData.cooking_persona && (
              <button
                type="button"
                onClick={generateBioSuggestions}
                disabled={isGeneratingBio}
                className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
              >
                <Wand2 className="w-4 h-4" />
                {isGeneratingBio ? 'Generando...' : 'Sugerir biografía'}
              </button>
            )}
          </div>
          
          {/* AI Suggestions */}
          {bioSuggestions.length > 0 && !formData.bio && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-3 space-y-2"
            >
              <p className="text-xs text-purple-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Sugerencias de IA - Haz clic para usar:
              </p>
              {bioSuggestions.map((suggestion, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  type="button"
                  onClick={() => selectBioSuggestion(suggestion)}
                  className="w-full text-left p-3 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-400/20 rounded-xl text-sm text-white/80 transition-all"
                >
                  {suggestion}
                </motion.button>
              ))}
            </motion.div>
          )}
          
          <textarea
            id="bio"
            rows={3}
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition-all"
            placeholder="Cuéntanos sobre tu experiencia en la cocina, tus platos favoritos..."
          />
          <p className="mt-2 text-sm text-white/60">
            Esto ayuda a nuestra IA a entender mejor tus preferencias
          </p>
        </GlassCard>

        {/* Email Display */}
        <GlassCard variant="highlight">
          <p className="text-sm text-white/80">
            <span className="font-medium text-white">Email:</span> {user?.email}
          </p>
          <p className="text-xs text-white/60 mt-1">
            Este no puede ser cambiado
          </p>
        </GlassCard>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6">
          <GlassButton
            onClick={onBack}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Atrás
          </GlassButton>
          
          <GlassButton
            type="submit"
            disabled={isLoading}
            variant="primary"
            className="flex items-center gap-2"
          >
            {isLoading ? 'Guardando...' : 'Continuar'}
            <ArrowRight className="w-4 h-4" />
          </GlassButton>
        </div>
      </form>
    </div>
  );
}