'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Palette, 
  Database,
  AlertTriangle,
  Bell,
  Utensils,
  ChefHat,
  Target,
  Save,
  Download
} from 'lucide-react';

import { GlassCard, GlassButton, GlassInput } from '@/components/ui/GlassCard';
import { useAuth } from '@/components/auth/AuthProvider';
import { cn } from '@/lib/utils';

interface SettingSection {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  settings: Setting[];
}

interface Setting {
  key: string;
  label: string;
  description: string;
  type: 'switch' | 'select' | 'input' | 'slider' | 'multiselect' | 'color';
  value?: any;
  options?: Array<{ value: string; label: string; icon?: React.ComponentType<any> }>;
  min?: number;
  max?: number;
  step?: number;
  validation?: (value: any) => string | null;
}

const dietaryRestrictions = [
  { value: 'vegetarian', label: 'Vegetariano', icon: '🌱' },
  { value: 'vegan', label: 'Vegano', icon: '🥬' },
  { value: 'gluten-free', label: 'Sin Gluten', icon: '🌾' },
  { value: 'dairy-free', label: 'Sin Lácteos', icon: '🥛' },
  { value: 'keto', label: 'Cetogénico', icon: '🥑' },
  { value: 'paleo', label: 'Paleo', icon: '🍖' },
  { value: 'low-carb', label: 'Bajo en Carbohidratos', icon: '🥗' },
  { value: 'halal', label: 'Halal', icon: '☪️' },
  { value: 'kosher', label: 'Kosher', icon: '✡️' }
];

const allergens = [
  { value: 'nuts', label: 'Frutos Secos', icon: '🥜' },
  { value: 'shellfish', label: 'Mariscos', icon: '🦐' },
  { value: 'eggs', label: 'Huevos', icon: '🥚' },
  { value: 'soy', label: 'Soja', icon: '🫘' },
  { value: 'fish', label: 'Pescado', icon: '🐟' },
  { value: 'sesame', label: 'Sésamo', icon: '🌰' }
];

const cuisineTypes = [
  { value: 'mexican', label: 'Mexicana', icon: '🌮' },
  { value: 'italian', label: 'Italiana', icon: '🍝' },
  { value: 'asian', label: 'Asiática', icon: '🍜' },
  { value: 'mediterranean', label: 'Mediterránea', icon: '🫒' },
  { value: 'indian', label: 'India', icon: '🍛' },
  { value: 'american', label: 'Americana', icon: '🍔' },
  { value: 'french', label: 'Francesa', icon: '🥖' },
  { value: 'japanese', label: 'Japonesa', icon: '🍣' }
];

const kitchenEquipment = [
  { value: 'oven', label: 'Horno', icon: '🔥' },
  { value: 'microwave', label: 'Microondas', icon: '📡' },
  { value: 'blender', label: 'Licuadora', icon: '🌪️' },
  { value: 'food-processor', label: 'Procesador de Alimentos', icon: '⚙️' },
  { value: 'air-fryer', label: 'Freidora de Aire', icon: '💨' },
  { value: 'slow-cooker', label: 'Olla de Cocción Lenta', icon: '🍲' },
  { value: 'pressure-cooker', label: 'Olla a Presión', icon: '⚡' },
  { value: 'stand-mixer', label: 'Batidora de Pie', icon: '🥄' }
];

export const EnhancedProfileSettings: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [activeSection, setActiveSection] = useState('profile');
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  const settingSections: SettingSection[] = [
    {
      id: 'profile',
      title: 'Perfil Personal',
      description: 'Información básica y preferencias personales',
      icon: User,
      settings: [
        {
          key: 'fullName',
          label: 'Nombre Completo',
          description: 'Tu nombre como aparecerá en la aplicación',
          type: 'input',
          value: settings.fullName || '',
          validation: (value) => value.length < 2 ? 'El nombre debe tener al menos 2 caracteres' : null
        },
        {
          key: 'householdSize',
          label: 'Tamaño del Hogar',
          description: 'Número de personas para las que cocinas',
          type: 'slider',
          value: settings.householdSize || 2,
          min: 1,
          max: 10,
          step: 1
        },
        {
          key: 'cookingSkill',
          label: 'Nivel de Cocina',
          description: 'Tu experiencia en la cocina',
          type: 'select',
          value: settings.cookingSkill || 'beginner',
          options: [
            { value: 'beginner', label: 'Principiante' },
            { value: 'intermediate', label: 'Intermedio' },
            { value: 'advanced', label: 'Avanzado' },
            { value: 'expert', label: 'Experto' }
          ]
        }
      ]
    },
    {
      id: 'dietary',
      title: 'Preferencias Dietéticas',
      description: 'Restricciones, alergias y preferencias alimentarias',
      icon: Utensils,
      settings: [
        {
          key: 'dietaryRestrictions',
          label: 'Restricciones Dietéticas',
          description: 'Selecciona todas las que apliquen',
          type: 'multiselect',
          value: settings.dietaryRestrictions || [],
          options: dietaryRestrictions
        },
        {
          key: 'allergies',
          label: 'Alergias Alimentarias',
          description: 'Información crítica para tu seguridad',
          type: 'multiselect',
          value: settings.allergies || [],
          options: allergens
        },
        {
          key: 'favoriteCuisines',
          label: 'Cocinas Favoritas',
          description: 'Tipos de cocina que más disfrutas',
          type: 'multiselect',
          value: settings.favoriteCuisines || [],
          options: cuisineTypes
        }
      ]
    },
    {
      id: 'nutrition',
      title: 'Objetivos Nutricionales',
      description: 'Metas de calorías, macronutrientes y salud',
      icon: Target,
      settings: [
        {
          key: 'dailyCalories',
          label: 'Calorías Diarias',
          description: 'Meta de calorías por día',
          type: 'slider',
          value: settings.dailyCalories || 2000,
          min: 1200,
          max: 4000,
          step: 50
        },
        {
          key: 'proteinGoal',
          label: 'Meta de Proteína (%)',
          description: 'Porcentaje de calorías de proteína',
          type: 'slider',
          value: settings.proteinGoal || 25,
          min: 10,
          max: 40,
          step: 1
        },
        {
          key: 'carbGoal',
          label: 'Meta de Carbohidratos (%)',
          description: 'Porcentaje de calorías de carbohidratos',
          type: 'slider',
          value: settings.carbGoal || 50,
          min: 20,
          max: 70,
          step: 1
        },
        {
          key: 'fatGoal',
          label: 'Meta de Grasas (%)',
          description: 'Porcentaje de calorías de grasas',
          type: 'slider',
          value: settings.fatGoal || 25,
          min: 15,
          max: 50,
          step: 1
        }
      ]
    },
    {
      id: 'kitchen',
      title: 'Equipamiento de Cocina',
      description: 'Electrodomésticos y herramientas disponibles',
      icon: ChefHat,
      settings: [
        {
          key: 'kitchenEquipment',
          label: 'Equipamiento Disponible',
          description: 'Electrodomésticos que tienes en tu cocina',
          type: 'multiselect',
          value: settings.kitchenEquipment || [],
          options: kitchenEquipment
        },
        {
          key: 'maxCookingTime',
          label: 'Tiempo Máximo de Cocina (min)',
          description: 'Tiempo máximo que quieres dedicar a cocinar',
          type: 'slider',
          value: settings.maxCookingTime || 60,
          min: 15,
          max: 180,
          step: 15
        },
        {
          key: 'preferQuickMeals',
          label: 'Preferir Comidas Rápidas',
          description: 'Priorizar recetas que se preparen rápidamente',
          type: 'switch',
          value: settings.preferQuickMeals || false
        }
      ]
    },
    {
      id: 'notifications',
      title: 'Notificaciones',
      description: 'Alertas y recordatorios de la aplicación',
      icon: Bell,
      settings: [
        {
          key: 'expirationAlerts',
          label: 'Alertas de Vencimiento',
          description: 'Notificar cuando los alimentos estén por vencer',
          type: 'switch',
          value: settings.expirationAlerts || true
        },
        {
          key: 'mealPlanReminders',
          label: 'Recordatorios de Planificación',
          description: 'Recordar planificar comidas semanales',
          type: 'switch',
          value: settings.mealPlanReminders || true
        },
        {
          key: 'shoppingListNotifications',
          label: 'Notificaciones de Lista de Compras',
          description: 'Alertar sobre productos en la lista de compras',
          type: 'switch',
          value: settings.shoppingListNotifications || true
        }
      ]
    },
    {
      id: 'appearance',
      title: 'Apariencia',
      description: 'Tema, colores y preferencias visuales',
      icon: Palette,
      settings: [
        {
          key: 'theme',
          label: 'Tema',
          description: 'Apariencia de la aplicación',
          type: 'select',
          value: settings.theme || 'system',
          options: [
            { value: 'light', label: 'Claro' },
            { value: 'dark', label: 'Oscuro' },
            { value: 'system', label: 'Sistema' }
          ]
        },
        {
          key: 'glassEffect',
          label: 'Efecto de Cristal',
          description: 'Activar efectos glassmorphism',
          type: 'switch',
          value: settings.glassEffect !== false
        },
        {
          key: 'animations',
          label: 'Animaciones',
          description: 'Efectos de animación y transiciones',
          type: 'switch',
          value: settings.animations !== false
        }
      ]
    },
    {
      id: 'data',
      title: 'Datos y Privacidad',
      description: 'Gestión de datos personales y configuración de privacidad',
      icon: Database,
      settings: [
        {
          key: 'dataSharing',
          label: 'Compartir Datos Anónimos',
          description: 'Ayudar a mejorar la aplicación compartiendo datos anónimos',
          type: 'switch',
          value: settings.dataSharing || false
        },
        {
          key: 'recipeRecommendations',
          label: 'Recomendaciones Personalizadas',
          description: 'Recibir recomendaciones basadas en tus preferencias',
          type: 'switch',
          value: settings.recipeRecommendations !== false
        }
      ]
    }
  ];

  useEffect(() => {
    // Load settings from localStorage or API
    const savedSettings = localStorage.getItem(`user-settings-${user?.id}`);
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, [user?.id]);

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      // Save to localStorage (in production, save to API)
      localStorage.setItem(`user-settings-${user?.id}`, JSON.stringify(settings));
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setHasChanges(false);
      // Show success toast
    } catch (error: unknown) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const exportData = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `kecarajocomer-settings-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const renderSetting = (setting: Setting) => {
    switch (setting.type) {
      case 'switch':
        return (
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                {setting.label}
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {setting.description}
              </p>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                setting.value ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'
              )}
              onClick={() => updateSetting(setting.key, !setting.value)}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  setting.value ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </motion.button>
          </div>
        );

      case 'select':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              {setting.label}
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              {setting.description}
            </p>
            <select
              value={setting.value}
              onChange={(e) => updateSetting(setting.key, e.target.value)}
              className="glass-input w-full"
            >
              {setting.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        );

      case 'input':
        return (
          <GlassInput
            label={setting.label}
            placeholder={setting.description}
            value={setting.value}
            onChange={(e) => updateSetting(setting.key, e.target.value)}
            error={setting.validation?.(setting.value)}
          />
        );

      case 'slider':
        return (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                {setting.label}
              </label>
              <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                {setting.value}{setting.key.includes('Goal') ? '%' : setting.key.includes('Calories') ? ' cal' : setting.key.includes('Time') ? ' min' : ''}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              {setting.description}
            </p>
            <input
              type="range"
              min={setting.min}
              max={setting.max}
              step={setting.step}
              value={setting.value}
              onChange={(e) => updateSetting(setting.key, parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
        );

      case 'multiselect':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              {setting.label}
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              {setting.description}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {setting.options?.map((option) => {
                const isSelected = setting.value?.includes(option.value);
                return (
                  <motion.button
                    key={option.value}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      'glass-button text-left p-3 rounded-lg transition-all',
                      isSelected 
                        ? 'bg-orange-500/20 border-orange-500/50 text-orange-900 dark:text-orange-100' 
                        : 'bg-white/10 border-white/20'
                    )}
                    onClick={() => {
                      const currentValues = setting.value || [];
                      const newValues = isSelected 
                        ? currentValues.filter((v: string) => v !== option.value)
                        : [...currentValues, option.value];
                      updateSetting(setting.key, newValues);
                    }}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{option.icon || '📋'}</span>
                      <span className="text-sm font-medium">{option.label}</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Configuración del Perfil
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Personaliza tu experiencia gastronómica
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <GlassCard variant="medium" className="p-4">
              <nav className="space-y-2">
                {settingSections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <motion.button
                      key={section.id}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.95 }}
                      className={cn(
                        'w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-all',
                        activeSection === section.id
                          ? 'bg-orange-500/20 text-orange-900 dark:text-orange-100 border border-orange-500/30'
                          : 'hover:bg-white/10 text-gray-700 dark:text-gray-300'
                      )}
                      onClick={() => setActiveSection(section.id)}
                    >
                      <Icon className="w-5 h-5" />
                      <div>
                        <div className="font-medium text-sm">{section.title}</div>
                        <div className="text-xs opacity-70">{section.description}</div>
                      </div>
                    </motion.button>
                  );
                })}
              </nav>
            </GlassCard>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <GlassCard variant="strong" className="p-6">
              {settingSections.map((section) => (
                activeSection === section.id && (
                  <motion.div
                    key={section.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center space-x-3 mb-6">
                      <section.icon className="w-6 h-6 text-orange-600" />
                      <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                          {section.title}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300">
                          {section.description}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {section.settings.map((setting) => (
                        <div key={setting.key} className="glass-container glass-subtle p-4 rounded-lg">
                          {renderSetting(setting)}
                        </div>
                      ))}
                    </div>

                    {/* Danger Zone for Data section */}
                    {section.id === 'data' && (
                      <div className="mt-8 p-6 border border-red-300 dark:border-red-700 rounded-lg bg-red-50 dark:bg-red-900/20">
                        <div className="flex items-center space-x-2 mb-4">
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                          <h3 className="text-lg font-semibold text-red-800 dark:text-red-300">
                            Zona de Peligro
                          </h3>
                        </div>
                        <div className="space-y-4">
                          <GlassButton
                            variant="secondary"
                            icon={<Download className="w-4 h-4" />}
                            onClick={exportData}
                          >
                            Exportar Datos
                          </GlassButton>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )
              ))}
            </GlassCard>
          </div>
        </div>

        {/* Floating Save Button */}
        {hasChanges && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <GlassButton
              variant="primary"
              size="lg"
              icon={<Save className="w-5 h-5" />}
              onClick={saveSettings}
              loading={saving}
              className="shadow-lg"
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </GlassButton>
          </motion.div>
        )}
      </div>
    </div>
  );
};