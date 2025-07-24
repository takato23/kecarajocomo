'use client';

import React, { useState, useEffect } from 'react';
import { Users, ChefHat, Target, Heart, AlertCircle, Save, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

import { getProfileManager, type UserProfile, type DietaryRestriction } from '@/services/profile/ProfileManager';
import { getHolisticSystem } from '@/services/core/HolisticSystem';
import { cn } from '@/lib/utils';


const DIETARY_RESTRICTIONS: { value: DietaryRestriction; label: string; icon: string }[] = [
  { value: 'vegetarian', label: 'Vegetariano', icon: '🥗' },
  { value: 'vegan', label: 'Vegano', icon: '🌱' },
  { value: 'gluten_free', label: 'Sin Gluten', icon: '🌾' },
  { value: 'lactose_free', label: 'Sin Lactosa', icon: '🥛' },
  { value: 'kosher', label: 'Kosher', icon: '✡️' },
  { value: 'halal', label: 'Halal', icon: '☪️' },
  { value: 'keto', label: 'Keto', icon: '🥑' },
  { value: 'paleo', label: 'Paleo', icon: '🍖' },
  { value: 'low_carb', label: 'Bajo en Carbos', icon: '🍞' },
  { value: 'diabetic', label: 'Diabético', icon: '💉' },
  { value: 'pescatarian', label: 'Pescetariano', icon: '🐟' }
];

const COMMON_ALLERGIES = [
  'Frutos secos',
  'Maní',
  'Mariscos',
  'Huevos',
  'Soja',
  'Pescado',
  'Apio',
  'Mostaza',
  'Sésamo',
  'Sulfitos'
];

const CUISINES = [
  'Argentina',
  'Italiana',
  'Mexicana',
  'Japonesa',
  'China',
  'Mediterránea',
  'Peruana',
  'Española',
  'India',
  'Tailandesa',
  'Francesa',
  'Americana'
];

export function ProfileView() {
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    householdSize: 2,
    householdMembers: [],
    monthlyBudget: 50000,
    dietaryRestrictions: [],
    allergies: [],
    preferredCuisines: [],
    dislikedIngredients: [],
    cookingSkillLevel: 3,
    nutritionalGoals: {},
    tasteProfile: {
      spicyTolerance: 'medium',
      sweetPreference: 'medium',
      saltyPreference: 'medium',
      sourPreference: 'medium',
      bitterTolerance: 'medium',
      umamiAppreciation: 'medium',
      texturePreferences: []
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newAllergy, setNewAllergy] = useState('');
  const [newDisliked, setNewDisliked] = useState('');
  const [showAddMember, setShowAddMember] = useState(false);
  
  const profileManager = getProfileManager(getHolisticSystem());
  
  // Cargar perfil
  useEffect(() => {
    loadProfile();
  }, []);
  
  async function loadProfile() {
    try {
      setLoading(true);
      const userId = 'temp-user-id'; // TODO: Obtener del contexto
      const existingProfile = await profileManager.getUserProfile(userId);
      
      if (existingProfile) {
        setProfile(existingProfile);
      }
    } catch (error: unknown) {
      console.error('Error cargando perfil:', error);
    } finally {
      setLoading(false);
    }
  }
  
  async function saveProfile() {
    try {
      setSaving(true);
      const userId = 'temp-user-id'; // TODO: Obtener del contexto
      await profileManager.upsertProfile(userId, profile);
      toast.success('Perfil guardado exitosamente');
    } catch (error: unknown) {
      console.error('Error guardando perfil:', error);
      toast.error('Error al guardar perfil');
    } finally {
      setSaving(false);
    }
  }
  
  function toggleDietaryRestriction(restriction: DietaryRestriction) {
    setProfile(prev => ({
      ...prev,
      dietaryRestrictions: prev.dietaryRestrictions?.includes(restriction)
        ? prev.dietaryRestrictions.filter(r => r !== restriction)
        : [...(prev.dietaryRestrictions || []), restriction]
    }));
  }
  
  function toggleCuisine(cuisine: string) {
    setProfile(prev => ({
      ...prev,
      preferredCuisines: prev.preferredCuisines?.includes(cuisine)
        ? prev.preferredCuisines.filter(c => c !== cuisine)
        : [...(prev.preferredCuisines || []), cuisine]
    }));
  }
  
  function addAllergy() {
    if (newAllergy.trim() && !profile.allergies?.includes(newAllergy)) {
      setProfile(prev => ({
        ...prev,
        allergies: [...(prev.allergies || []), newAllergy.trim()]
      }));
      setNewAllergy('');
    }
  }
  
  function removeAllergy(allergy: string) {
    setProfile(prev => ({
      ...prev,
      allergies: prev.allergies?.filter(a => a !== allergy) || []
    }));
  }
  
  function addDislikedIngredient() {
    if (newDisliked.trim() && !profile.dislikedIngredients?.includes(newDisliked)) {
      setProfile(prev => ({
        ...prev,
        dislikedIngredients: [...(prev.dislikedIngredients || []), newDisliked.trim()]
      }));
      setNewDisliked('');
    }
  }
  
  function removeDislikedIngredient(ingredient: string) {
    setProfile(prev => ({
      ...prev,
      dislikedIngredients: prev.dislikedIngredients?.filter(i => i !== ingredient) || []
    }));
  }
  
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Cargando perfil...</p>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold mb-1">Mi Perfil</h2>
          <p className="text-gray-400">Personaliza tu experiencia culinaria</p>
        </div>
        
        <iOS26LiquidButton
          variant="primary"
          onClick={saveProfile}
          disabled={saving}
          className="bg-gradient-to-r from-green-600 to-emerald-600 text-white"
        >
          {saving ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" />
              Guardar Cambios
            </>
          )}
        </iOS26LiquidButton>
      </div>
      
      {/* Información del hogar */}
      <iOS26LiquidCard variant="medium">
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Users className="w-5 h-5" />
            Información del Hogar
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Miembros del hogar
              </label>
              <input
                type="number"
                value={profile.householdSize || 1}
                onChange={(e) => setProfile(prev => ({
                  ...prev,
                  householdSize: Number(e.target.value)
                }))}
                min="1"
                max="20"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-white/30"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Presupuesto mensual (ARS)
              </label>
              <input
                type="number"
                value={profile.monthlyBudget || 0}
                onChange={(e) => setProfile(prev => ({
                  ...prev,
                  monthlyBudget: Number(e.target.value)
                }))}
                min="0"
                step="1000"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-white/30"
              />
            </div>
          </div>
        </div>
      </iOS26LiquidCard>
      
      {/* Restricciones dietéticas */}
      <iOS26LiquidCard variant="medium">
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Heart className="w-5 h-5" />
            Restricciones Dietéticas
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {DIETARY_RESTRICTIONS.map(({ value, label, icon }) => (
              <button
                key={value}
                onClick={() => toggleDietaryRestriction(value)}
                className={cn(
                  "p-3 rounded-xl border transition-all",
                  profile.dietaryRestrictions?.includes(value)
                    ? "bg-gradient-to-r from-orange-500/20 to-pink-500/20 border-orange-500/30"
                    : "bg-white/5 border-white/10 hover:border-white/20"
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{icon}</span>
                  <span className="text-sm">{label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </iOS26LiquidCard>
      
      {/* Alergias */}
      <iOS26LiquidCard variant="medium">
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            Alergias Alimentarias
          </h3>
          
          <div className="space-y-3">
            {/* Alergias comunes */}
            <div className="flex flex-wrap gap-2">
              {COMMON_ALLERGIES.map(allergy => (
                <button
                  key={allergy}
                  onClick={() => profile.allergies?.includes(allergy) 
                    ? removeAllergy(allergy) 
                    : setProfile(prev => ({
                        ...prev,
                        allergies: [...(prev.allergies || []), allergy]
                      }))}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm transition-all",
                    profile.allergies?.includes(allergy)
                      ? "bg-red-500/20 border border-red-500/30 text-red-400"
                      : "bg-white/5 border border-white/10 hover:border-white/20"
                  )}
                >
                  {allergy}
                </button>
              ))}
            </div>
            
            {/* Agregar alergia personalizada */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newAllergy}
                onChange={(e) => setNewAllergy(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addAllergy()}
                placeholder="Agregar otra alergia..."
                className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-white/30"
              />
              <iOS26LiquidButton
                variant="secondary"
                onClick={addAllergy}
                size="small"
              >
                <Plus className="w-4 h-4" />
              </iOS26LiquidButton>
            </div>
            
            {/* Lista de alergias personalizadas */}
            {profile.allergies?.filter(a => !COMMON_ALLERGIES.includes(a)).length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {profile.allergies
                  .filter(a => !COMMON_ALLERGIES.includes(a))
                  .map(allergy => (
                    <div
                      key={allergy}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm"
                    >
                      <span>{allergy}</span>
                      <button
                        onClick={() => removeAllergy(allergy)}
                        className="ml-1 hover:text-red-300"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </iOS26LiquidCard>
      
      {/* Preferencias culinarias */}
      <iOS26LiquidCard variant="medium">
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <ChefHat className="w-5 h-5" />
            Cocinas Preferidas
          </h3>
          
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
            {CUISINES.map(cuisine => (
              <button
                key={cuisine}
                onClick={() => toggleCuisine(cuisine)}
                className={cn(
                  "p-2 rounded-lg text-sm transition-all",
                  profile.preferredCuisines?.includes(cuisine)
                    ? "bg-gradient-to-r from-orange-500/20 to-pink-500/20 border border-orange-500/30"
                    : "bg-white/5 border border-white/10 hover:border-white/20"
                )}
              >
                {cuisine}
              </button>
            ))}
          </div>
        </div>
      </iOS26LiquidCard>
      
      {/* Ingredientes no deseados */}
      <iOS26LiquidCard variant="medium">
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-medium">
            Ingredientes que No Te Gustan
          </h3>
          
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={newDisliked}
                onChange={(e) => setNewDisliked(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addDislikedIngredient()}
                placeholder="Ej: Cebolla, Ajo, Cilantro..."
                className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-white/30"
              />
              <iOS26LiquidButton
                variant="secondary"
                onClick={addDislikedIngredient}
                size="small"
              >
                <Plus className="w-4 h-4" />
              </iOS26LiquidButton>
            </div>
            
            {profile.dislikedIngredients?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {profile.dislikedIngredients.map(ingredient => (
                  <div
                    key={ingredient}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-orange-500/20 border border-orange-500/30 text-orange-400 text-sm"
                  >
                    <span>{ingredient}</span>
                    <button
                      onClick={() => removeDislikedIngredient(ingredient)}
                      className="ml-1 hover:text-orange-300"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </iOS26LiquidCard>
      
      {/* Nivel de habilidad culinaria */}
      <iOS26LiquidCard variant="medium">
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <ChefHat className="w-5 h-5" />
            Nivel de Habilidad Culinaria
          </h3>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-400">
              <span>Principiante</span>
              <span>Chef Experto</span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              value={profile.cookingSkillLevel || 3}
              onChange={(e) => setProfile(prev => ({
                ...prev,
                cookingSkillLevel: Number(e.target.value) as any
              }))}
              className="w-full"
            />
            <div className="flex justify-between">
              {[1, 2, 3, 4, 5].map(level => (
                <span
                  key={level}
                  className={cn(
                    "text-xs",
                    profile.cookingSkillLevel === level && "text-orange-400 font-medium"
                  )}
                >
                  {level}
                </span>
              ))}
            </div>
          </div>
        </div>
      </iOS26LiquidCard>
      
      {/* Objetivos nutricionales */}
      <iOS26LiquidCard variant="medium">
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Target className="w-5 h-5" />
            Objetivos Nutricionales (Opcional)
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Calorías por día
              </label>
              <input
                type="number"
                value={profile.nutritionalGoals?.caloriesPerDay || ''}
                onChange={(e) => setProfile(prev => ({
                  ...prev,
                  nutritionalGoals: {
                    ...prev.nutritionalGoals,
                    caloriesPerDay: e.target.value ? Number(e.target.value) : undefined
                  }
                }))}
                placeholder="Ej: 2000"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-white/30"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Proteína (g) por día
              </label>
              <input
                type="number"
                value={profile.nutritionalGoals?.proteinPerDay || ''}
                onChange={(e) => setProfile(prev => ({
                  ...prev,
                  nutritionalGoals: {
                    ...prev.nutritionalGoals,
                    proteinPerDay: e.target.value ? Number(e.target.value) : undefined
                  }
                }))}
                placeholder="Ej: 50"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-white/30"
              />
            </div>
          </div>
        </div>
      </iOS26LiquidCard>
    </div>
  );
}