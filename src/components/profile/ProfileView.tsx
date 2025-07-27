'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Users, ChefHat, Target, Heart, AlertCircle, Save, Plus, X, Clock, Utensils } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { logger } from '@/services/logger';

import { getProfileManager, type UserProfile, type DietaryRestriction } from '@/services/profile/ProfileManager';
import { getHolisticSystem } from '@/services/core/HolisticSystem';
import { useAutoSave } from '@/hooks/useAutoSave';
import { AutoSaveIndicator, AutoSaveHeader } from '@/components/profile/AutoSaveIndicator';
import { iOS26LiquidCard } from '@/components/ios26/iOS26LiquidCard';
import { iOS26LiquidButton } from '@/components/ios26/iOS26LiquidButton';
import { iOS26LiquidInput } from '@/components/ios26/iOS26LiquidInput';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/auth/AuthProvider';


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

// Loading skeleton component
const ProfileSkeleton = () => (
  <div className="max-w-4xl mx-auto space-y-6">
    {[...Array(6)].map((_, i) => (
      <iOS26LiquidCard key={i} variant="medium" className="animate-pulse">
        <div className="p-6 space-y-4">
          <div className="h-6 bg-white/10 rounded-lg w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-12 bg-white/5 rounded-xl" />
            <div className="h-12 bg-white/5 rounded-xl" />
          </div>
        </div>
      </iOS26LiquidCard>
    ))}
  </div>
);

// Error boundary component
const ProfileError = ({ onRetry }: { onRetry: () => void }) => (
  <iOS26LiquidCard variant="medium" className="max-w-md mx-auto">
    <div className="p-6 text-center space-y-4">
      <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
        <AlertCircle className="w-8 h-8 text-red-400" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Error al cargar perfil</h3>
        <p className="text-sm text-gray-400">
          Hubo un problema cargando tu información. Por favor, intenta nuevamente.
        </p>
      </div>
      <iOS26LiquidButton 
        variant="primary" 
        onClick={onRetry}
        className="w-full"
      >
        Reintentar
      </iOS26LiquidButton>
    </div>
  </iOS26LiquidCard>
);

export function ProfileView() {
  const { user } = useAuth();
  
  const [initialProfile] = useState<Partial<UserProfile>>({
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
  
  const [profile, setProfile] = useState<Partial<UserProfile>>(initialProfile);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newAllergy, setNewAllergy] = useState('');
  const [newDisliked, setNewDisliked] = useState('');
  const [showAddMember, setShowAddMember] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [recoveryData, setRecoveryData] = useState<Partial<UserProfile> | null>(null);
  
  const profileManager = getProfileManager(getHolisticSystem());

  // Auto-save configuration
  const handleSave = useCallback(async (data: Partial<UserProfile>) => {
    if (!user?.id) {
      setError('No se pudo identificar al usuario');
      return;
    }
    await profileManager.upsertProfile(user.id, data);
    setLastSaved(new Date());
  }, [profileManager, user?.id]);

  const handleValidation = useCallback((data: Partial<UserProfile>): boolean | string => {
    // Basic validation
    if (data.householdSize && (data.householdSize < 1 || data.householdSize > 20)) {
      return 'El número de miembros del hogar debe estar entre 1 y 20';
    }
    
    if (data.monthlyBudget && data.monthlyBudget < 0) {
      return 'El presupuesto mensual no puede ser negativo';
    }
    
    return true;
  }, []);

  const handleConflictResolution = useCallback(async (
    localData: Partial<UserProfile>, 
    serverData: Partial<UserProfile>
  ): Promise<Partial<UserProfile>> => {
    // Simple merge strategy - prefer local changes for user input fields
    // and server data for system-generated fields
    return {
      ...serverData,
      ...localData,
      // Always use server timestamp if available
      updatedAt: serverData.updatedAt || localData.updatedAt
    };
  }, []);

  // Initialize auto-save
  const autoSave = useAutoSave(profile, {
    onSave: handleSave,
    onValidate: handleValidation,
    onConflict: handleConflictResolution,
    config: {
      debounceMs: 2000, // 2 seconds debounce
      maxRetries: 3,
      retryDelayMs: 1000,
      enableLocalStorage: true,
      enableConflictDetection: true
    },
    enableOffline: true,
    storageKey: 'profile-autosave',
    onStateChange: (state) => {
      if (state === 'error') {
        // Check for recovery data on error
        const recovery = autoSave.getRecoveryData();
        if (recovery) {
          setRecoveryData(recovery);
        }
      }
    }
  });
  
  // Cargar perfil cuando el usuario cambie
  useEffect(() => {
    if (user?.id) {
      loadProfile();
    }
  }, [user?.id]);

  // Cleanup auto-save on unmount
  useEffect(() => {
    return () => {
      // Force save any pending changes before unmounting
      if (autoSave.hasPendingChanges) {
        autoSave.forceSave().catch(error => {
          logger.error('Error al guardar cambios pendientes:', 'ProfileView', error);
        });
      }
    };
  }, [autoSave]);
  
  async function loadProfile() {
    try {
      setLoading(true);
      setError(null);
      
      if (!user?.id) {
        setError('No se pudo identificar al usuario');
        return;
      }
      
      const existingProfile = await profileManager.getUserProfile(user.id);
      
      if (existingProfile) {
        setProfile(existingProfile);
        // Update auto-save with loaded data
        autoSave.updateData(existingProfile);
        autoSave.clearPendingChanges();
      } else {
        // Check for recovery data
        const recovery = autoSave.getRecoveryData();
        if (recovery) {
          setRecoveryData(recovery);
        }
      }
    } catch (error: unknown) {
      logger.error('Error cargando perfil:', 'ProfileView', error);
      setError('Error al cargar el perfil');
      toast.error('Error al cargar el perfil');
      
      // Check for recovery data on error
      const recovery = autoSave.getRecoveryData();
      if (recovery) {
        setRecoveryData(recovery);
      }
    } finally {
      setLoading(false);
    }
  }
  
  // Manual save function
  const manualSave = useCallback(async () => {
    try {
      await autoSave.manualSave();
    } catch (error) {
      logger.error('Error en guardado manual:', 'ProfileView', error);
    }
  }, [autoSave]);

  // Force save function
  const forceSave = useCallback(async () => {
    try {
      await autoSave.forceSave();
    } catch (error) {
      logger.error('Error en guardado forzado:', 'ProfileView', error);
    }
  }, [autoSave]);

  // Recovery functions
  const acceptRecovery = useCallback(() => {
    if (recoveryData) {
      setProfile(recoveryData);
      autoSave.updateData(recoveryData);
      setRecoveryData(null);
      toast.success('Datos recuperados exitosamente');
    }
  }, [recoveryData, autoSave]);

  const discardRecovery = useCallback(() => {
    setRecoveryData(null);
    toast.info('Datos de recuperación descartados');
  }, []);
  
  function toggleDietaryRestriction(restriction: DietaryRestriction) {
    const updatedProfile = {
      ...profile,
      dietaryRestrictions: profile.dietaryRestrictions?.includes(restriction)
        ? profile.dietaryRestrictions.filter(r => r !== restriction)
        : [...(profile.dietaryRestrictions || []), restriction]
    };
    setProfile(updatedProfile);
    autoSave.updateData(updatedProfile);
  }
  
  function toggleCuisine(cuisine: string) {
    const updatedProfile = {
      ...profile,
      preferredCuisines: profile.preferredCuisines?.includes(cuisine)
        ? profile.preferredCuisines.filter(c => c !== cuisine)
        : [...(profile.preferredCuisines || []), cuisine]
    };
    setProfile(updatedProfile);
    autoSave.updateData(updatedProfile);
  }
  
  function addAllergy() {
    if (newAllergy.trim() && !profile.allergies?.includes(newAllergy)) {
      const updatedProfile = {
        ...profile,
        allergies: [...(profile.allergies || []), newAllergy.trim()]
      };
      setProfile(updatedProfile);
      autoSave.updateData(updatedProfile);
      setNewAllergy('');
    }
  }
  
  function removeAllergy(allergy: string) {
    const updatedProfile = {
      ...profile,
      allergies: profile.allergies?.filter(a => a !== allergy) || []
    };
    setProfile(updatedProfile);
    autoSave.updateData(updatedProfile);
  }
  
  function addDislikedIngredient() {
    if (newDisliked.trim() && !profile.dislikedIngredients?.includes(newDisliked)) {
      const updatedProfile = {
        ...profile,
        dislikedIngredients: [...(profile.dislikedIngredients || []), newDisliked.trim()]
      };
      setProfile(updatedProfile);
      autoSave.updateData(updatedProfile);
      setNewDisliked('');
    }
  }
  
  function removeDislikedIngredient(ingredient: string) {
    const updatedProfile = {
      ...profile,
      dislikedIngredients: profile.dislikedIngredients?.filter(i => i !== ingredient) || []
    };
    setProfile(updatedProfile);
    autoSave.updateData(updatedProfile);
  }
  
  if (loading || !user) {
    return <ProfileSkeleton />;
  }
  
  if (error) {
    return <ProfileError onRetry={loadProfile} />;
  }
  
  return (
    <motion.div 
      className="max-w-4xl mx-auto space-y-6 p-4 sm:p-0"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      {/* Header with Auto-save */}
      <motion.div 
        className="space-y-4 mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <AutoSaveHeader
          state={autoSave.saveState}
          lastSaved={lastSaved}
          onRetry={autoSave.retryFailedSaves}
          onResolveConflict={forceSave}
        />
        
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="space-y-1">
            <p className="text-gray-400 text-sm sm:text-base">
              Personaliza tu experiencia culinaria
            </p>
            {autoSave.hasPendingChanges && (
              <div className="flex items-center gap-2 text-xs text-yellow-400">
                <Clock className="w-3 h-3" />
                <span>Cambios pendientes...</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <AutoSaveIndicator
              state={autoSave.saveState}
              lastSaved={lastSaved}
              onRetry={autoSave.retryFailedSaves}
              onResolveConflict={forceSave}
              size="md"
            />
            
            <iOS26LiquidButton
              variant="secondary"
              size="lg"
              onClick={manualSave}
              disabled={autoSave.saveState === 'saving'}
              className="w-full sm:w-auto"
              aria-label="Guardar cambios manualmente"
            >
              <Save className="w-5 h-5" />
              Guardar Ahora
            </iOS26LiquidButton>
          </div>
        </div>
      </motion.div>

      {/* Recovery Data Alert */}
      <AnimatePresence>
        {recoveryData && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="mb-6"
          >
            <iOS26LiquidCard variant="medium" className="border-2 border-orange-500/30 bg-orange-500/5">
              <div className="p-4 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-orange-500/20 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-orange-400" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className="text-lg font-medium text-orange-300">
                      Datos de Recuperación Disponibles
                    </h3>
                    <p className="text-sm text-gray-300">
                      Se encontraron cambios guardados localmente que no se sincronizaron. 
                      ¿Deseas recuperar estos datos?
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <iOS26LiquidButton
                    variant="primary"
                    onClick={acceptRecovery}
                    className="bg-gradient-to-r from-orange-500 to-amber-500"
                  >
                    Recuperar Datos
                  </iOS26LiquidButton>
                  
                  <iOS26LiquidButton
                    variant="ghost"
                    onClick={discardRecovery}
                  >
                    Descartar
                  </iOS26LiquidButton>
                </div>
              </div>
            </iOS26LiquidCard>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Información del hogar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <iOS26LiquidCard variant="medium" shimmer>
          <div className="p-4 sm:p-6 space-y-6">
            <h3 className="text-lg font-medium flex items-center gap-2 text-white">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                <Users className="w-5 h-5" />
              </div>
              Información del Hogar
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <iOS26LiquidInput
                  label="Miembros del hogar"
                  type="number"
                  value={profile.householdSize?.toString() || '1'}
                  onChange={(e) => {
                    const updatedProfile = {
                      ...profile,
                      householdSize: Number(e.target.value)
                    };
                    setProfile(updatedProfile);
                    autoSave.updateData(updatedProfile);
                  }}
                  min="1"
                  max="20"
                  size="lg"
                  variant="medium"
                  fluid
                  aria-label="Número de miembros del hogar"
                />
              </div>
              
              <div className="space-y-2">
                <iOS26LiquidInput
                  label="Presupuesto mensual (ARS)"
                  type="number"
                  value={profile.monthlyBudget?.toString() || '0'}
                  onChange={(e) => {
                    const updatedProfile = {
                      ...profile,
                      monthlyBudget: Number(e.target.value)
                    };
                    setProfile(updatedProfile);
                    autoSave.updateData(updatedProfile);
                  }}
                  min="0"
                  step="1000"
                  size="lg"
                  variant="medium"
                  fluid
                  aria-label="Presupuesto mensual en pesos argentinos"
                />
              </div>
            </div>
          </div>
        </iOS26LiquidCard>
      </motion.div>
      
      {/* Restricciones dietéticas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <iOS26LiquidCard variant="medium" morph>
          <div className="p-4 sm:p-6 space-y-6">
            <h3 className="text-lg font-medium flex items-center gap-2 text-white">
              <div className="p-2 bg-gradient-to-r from-pink-500 to-red-500 rounded-lg">
                <Heart className="w-5 h-5" />
              </div>
              Restricciones Dietéticas
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <AnimatePresence>
                {DIETARY_RESTRICTIONS.map(({ value, label, icon }, index) => {
                  const isSelected = profile.dietaryRestrictions?.includes(value);
                  return (
                    <motion.div
                      key={value}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <iOS26LiquidButton
                        variant={isSelected ? "primary" : "secondary"}
                        onClick={() => toggleDietaryRestriction(value)}
                        className={cn(
                          "w-full h-auto p-3 justify-start",
                          isSelected && "bg-gradient-to-r from-orange-500 to-pink-500"
                        )}
                        pulse={isSelected}
                        role="checkbox"
                        aria-checked={isSelected}
                        aria-label={`${isSelected ? 'Desactivar' : 'Activar'} restricción dietética: ${label}`}
                      >
                        <div className="flex items-center gap-2 w-full">
                          <span className="text-xl flex-shrink-0">{icon}</span>
                          <span className="text-sm font-medium text-left">{label}</span>
                        </div>
                      </iOS26LiquidButton>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </iOS26LiquidCard>
      </motion.div>
      
      {/* Alergias */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <iOS26LiquidCard variant="medium" glow>
          <div className="p-4 sm:p-6 space-y-6">
            <h3 className="text-lg font-medium flex items-center gap-2 text-white">
              <div className="p-2 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg">
                <AlertCircle className="w-5 h-5" />
              </div>
              Alergias Alimentarias
            </h3>
            
            <div className="space-y-4">
              {/* Alergias comunes */}
              <div>
                <p className="text-sm text-gray-400 mb-3">Alergias comunes:</p>
                <div className="flex flex-wrap gap-2">
                  <AnimatePresence>
                    {COMMON_ALLERGIES.map((allergy, index) => {
                      const isSelected = profile.allergies?.includes(allergy);
                      return (
                        <motion.div
                          key={allergy}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.2, delay: index * 0.03 }}
                        >
                          <iOS26LiquidButton
                            variant={isSelected ? "danger" : "ghost"}
                            size="sm"
                            onClick={() => {
                              if (isSelected) {
                                removeAllergy(allergy);
                              } else {
                                const updatedProfile = {
                                  ...profile,
                                  allergies: [...(profile.allergies || []), allergy]
                                };
                                setProfile(updatedProfile);
                                autoSave.updateData(updatedProfile);
                              }
                            }}
                            className={cn(
                              "transition-all duration-200",
                              isSelected && "ring-2 ring-red-500/50"
                            )}
                            role="checkbox"
                            aria-checked={isSelected}
                            aria-label={`${isSelected ? 'Quitar' : 'Agregar'} alergia: ${allergy}`}
                          >
                            {allergy}
                          </iOS26LiquidButton>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
              
              {/* Agregar alergia personalizada */}
              <div className="space-y-2">
                <p className="text-sm text-gray-400">Agregar alergia personalizada:</p>
                <div className="flex gap-2">
                  <iOS26LiquidInput
                    value={newAllergy}
                    onChange={(e) => setNewAllergy(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addAllergy()}
                    placeholder="Ej: Nueces, Soja..."
                    size="md"
                    variant="medium"
                    className="flex-1"
                    showClear
                    onClear={() => setNewAllergy('')}
                    aria-label="Escribir nueva alergia"
                  />
                  <iOS26LiquidButton
                    variant="secondary"
                    onClick={addAllergy}
                    disabled={!newAllergy.trim()}
                    aria-label="Agregar nueva alergia"
                  >
                    <Plus className="w-4 h-4" />
                  </iOS26LiquidButton>
                </div>
              </div>
              
              {/* Lista de alergias personalizadas */}
              <AnimatePresence>
                {profile.allergies?.filter(a => !COMMON_ALLERGIES.includes(a)).length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2"
                  >
                    <p className="text-sm text-gray-400">Alergias personalizadas:</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.allergies
                        .filter(a => !COMMON_ALLERGIES.includes(a))
                        .map(allergy => (
                          <motion.div
                            key={allergy}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm backdrop-blur-sm"
                          >
                            <span>{allergy}</span>
                            <iOS26LiquidButton
                              variant="ghost"
                              size="sm"
                              onClick={() => removeAllergy(allergy)}
                              className="!p-0 !w-5 !h-5 ml-1 hover:text-red-300"
                              aria-label={`Quitar alergia: ${allergy}`}
                            >
                              <X className="w-3 h-3" />
                            </iOS26LiquidButton>
                          </motion.div>
                        ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </iOS26LiquidCard>
      </motion.div>
      
      {/* Preferencias culinarias */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <iOS26LiquidCard variant="medium" shimmer>
          <div className="p-4 sm:p-6 space-y-6">
            <h3 className="text-lg font-medium flex items-center gap-2 text-white">
              <div className="p-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg">
                <ChefHat className="w-5 h-5" />
              </div>
              Cocinas Preferidas
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              <AnimatePresence>
                {CUISINES.map((cuisine, index) => {
                  const isSelected = profile.preferredCuisines?.includes(cuisine);
                  return (
                    <motion.div
                      key={cuisine}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.04 }}
                    >
                      <iOS26LiquidButton
                        variant={isSelected ? "primary" : "secondary"}
                        size="sm"
                        onClick={() => toggleCuisine(cuisine)}
                        className={cn(
                          "w-full h-auto p-3 text-center",
                          isSelected && "bg-gradient-to-r from-orange-500 to-pink-500"
                        )}
                        pulse={isSelected}
                        role="checkbox"
                        aria-checked={isSelected}
                        aria-label={`${isSelected ? 'Desactivar' : 'Activar'} cocina: ${cuisine}`}
                      >
                        <span className="text-sm font-medium">{cuisine}</span>
                      </iOS26LiquidButton>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </iOS26LiquidCard>
      </motion.div>
      
      {/* Ingredientes no deseados */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <iOS26LiquidCard variant="medium" morph>
          <div className="p-4 sm:p-6 space-y-6">
            <h3 className="text-lg font-medium flex items-center gap-2 text-white">
              <div className="p-2 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-lg">
                <X className="w-5 h-5" />
              </div>
              Ingredientes que No Te Gustan
            </h3>
            
            <div className="space-y-4">
              <div className="flex gap-2">
                <iOS26LiquidInput
                  value={newDisliked}
                  onChange={(e) => setNewDisliked(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addDislikedIngredient()}
                  placeholder="Ej: Cebolla, Ajo, Cilantro..."
                  size="md"
                  variant="medium"
                  className="flex-1"
                  showClear
                  onClear={() => setNewDisliked('')}
                  aria-label="Escribir ingrediente no deseado"
                />
                <iOS26LiquidButton
                  variant="secondary"
                  onClick={addDislikedIngredient}
                  disabled={!newDisliked.trim()}
                  aria-label="Agregar ingrediente no deseado"
                >
                  <Plus className="w-4 h-4" />
                </iOS26LiquidButton>
              </div>
              
              <AnimatePresence>
                {profile.dislikedIngredients?.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2"
                  >
                    <p className="text-sm text-gray-400">Ingredientes evitados:</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.dislikedIngredients.map(ingredient => (
                        <motion.div
                          key={ingredient}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-orange-500/20 border border-orange-500/30 text-orange-400 text-sm backdrop-blur-sm"
                        >
                          <span>{ingredient}</span>
                          <iOS26LiquidButton
                            variant="ghost"
                            size="sm"
                            onClick={() => removeDislikedIngredient(ingredient)}
                            className="!p-0 !w-5 !h-5 ml-1 hover:text-orange-300"
                            aria-label={`Quitar ingrediente: ${ingredient}`}
                          >
                            <X className="w-3 h-3" />
                          </iOS26LiquidButton>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </iOS26LiquidCard>
      </motion.div>
      
      {/* Nivel de habilidad culinaria */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      >
        <iOS26LiquidCard variant="medium" glow>
          <div className="p-4 sm:p-6 space-y-6">
            <h3 className="text-lg font-medium flex items-center gap-2 text-white">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
                <ChefHat className="w-5 h-5" />
              </div>
              Nivel de Habilidad Culinaria
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Principiante
                </span>
                <span className="flex items-center gap-1">
                  Chef Experto
                  <Utensils className="w-4 h-4" />
                </span>
              </div>
              
              <div className="relative">
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={profile.cookingSkillLevel || 3}
                  onChange={(e) => {
                    const updatedProfile = {
                      ...profile,
                      cookingSkillLevel: Number(e.target.value) as any
                    };
                    setProfile(updatedProfile);
                    autoSave.updateData(updatedProfile);
                  }}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #f59e0b ${((profile.cookingSkillLevel || 3) - 1) * 25}%, rgba(255,255,255,0.1) ${((profile.cookingSkillLevel || 3) - 1) * 25}%)`
                  }}
                  aria-label="Nivel de habilidad culinaria"
                  aria-valuemin={1}
                  aria-valuemax={5}
                  aria-valuenow={profile.cookingSkillLevel || 3}
                />
              </div>
              
              <div className="flex justify-between items-center">
                {[1, 2, 3, 4, 5].map(level => {
                  const labels = ['Básico', 'Novato', 'Intermedio', 'Avanzado', 'Experto'];
                  const isActive = profile.cookingSkillLevel === level;
                  return (
                    <motion.div
                      key={level}
                      className="text-center flex-1"
                      animate={{
                        scale: isActive ? 1.1 : 1,
                        opacity: isActive ? 1 : 0.6
                      }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-full border-2 mx-auto mb-1 flex items-center justify-center text-xs font-bold transition-all",
                        isActive 
                          ? "bg-gradient-to-r from-orange-500 to-yellow-500 border-orange-400 text-white scale-110 shadow-lg" 
                          : "border-gray-500 text-gray-400 hover:border-gray-300"
                      )}>
                        {level}
                      </div>
                      <span className={cn(
                        "text-xs transition-all",
                        isActive ? "text-orange-400 font-medium" : "text-gray-500"
                      )}>
                        {labels[level - 1]}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </iOS26LiquidCard>
      </motion.div>
      
      {/* Objetivos nutricionales */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        <iOS26LiquidCard variant="medium" shimmer>
          <div className="p-4 sm:p-6 space-y-6">
            <h3 className="text-lg font-medium flex items-center gap-2 text-white">
              <div className="p-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg">
                <Target className="w-5 h-5" />
              </div>
              Objetivos Nutricionales
              <span className="text-xs bg-white/10 px-2 py-1 rounded-full text-gray-300">Opcional</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <iOS26LiquidInput
                  label="Calorías por día"
                  type="number"
                  value={profile.nutritionalGoals?.caloriesPerDay?.toString() || ''}
                  onChange={(e) => {
                    const updatedProfile = {
                      ...profile,
                      nutritionalGoals: {
                        ...profile.nutritionalGoals,
                        caloriesPerDay: e.target.value ? Number(e.target.value) : undefined
                      }
                    };
                    setProfile(updatedProfile);
                    autoSave.updateData(updatedProfile);
                  }}
                  placeholder="Ej: 2000"
                  size="lg"
                  variant="medium"
                  fluid
                  helperText="Objetivo diario de calorías"
                  aria-label="Objetivo de calorías por día"
                />
              </div>
              
              <div className="space-y-2">
                <iOS26LiquidInput
                  label="Proteína (g) por día"
                  type="number"
                  value={profile.nutritionalGoals?.proteinPerDay?.toString() || ''}
                  onChange={(e) => {
                    const updatedProfile = {
                      ...profile,
                      nutritionalGoals: {
                        ...profile.nutritionalGoals,
                        proteinPerDay: e.target.value ? Number(e.target.value) : undefined
                      }
                    };
                    setProfile(updatedProfile);
                    autoSave.updateData(updatedProfile);
                  }}
                  placeholder="Ej: 50"
                  size="lg"
                  variant="medium"
                  fluid
                  helperText="Objetivo diario de proteína en gramos"
                  aria-label="Objetivo de proteína por día en gramos"
                />
              </div>
            </div>
          </div>
        </iOS26LiquidCard>
      </motion.div>
    </motion.div>
  );
}