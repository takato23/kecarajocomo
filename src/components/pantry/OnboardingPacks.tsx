/**
 * OnboardingPacks - Sistema de packs rápidos para onboarding de despensa
 * Mobile-first, glassmorphism, integrado con Supabase
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  Users, 
  Dumbbell, 
  Home,
  Check,
  ArrowRight,
  Sparkles,
  ShoppingCart,
  TrendingUp,
  DollarSign
} from 'lucide-react';

import { 
  KeCard, 
  KeCardHeader, 
  KeCardTitle, 
  KeCardDescription, 
  KeCardContent, 
  KeCardFooter,
  KeButton,
  KeBadge,
  KeModal
} from '@/components/ui';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase/client';
import { logger } from '@/services/logger';

interface PantryStarterPack {
  id: string;
  name: string;
  description: string;
  category: string;
  target_audience: string[];
  estimated_cost_ars: number;
  ingredients: {
    name: string;
    quantity: number;
    unit: string;
    priority: number;
  }[];
  popularity_score: number;
}

interface OnboardingPacksProps {
  onPackSelected: (ingredients: any[]) => Promise<void>;
  isLoading?: boolean;
}

const packIcons = {
  basico: { icon: Home, color: 'from-blue-400 to-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-900/20' },
  fitness: { icon: Dumbbell, color: 'from-red-400 to-red-600', bgColor: 'bg-red-50 dark:bg-red-900/20' },
  familia: { icon: Users, color: 'from-green-400 to-green-600', bgColor: 'bg-green-50 dark:bg-green-900/20' },
  default: { icon: Package, color: 'from-gray-400 to-gray-600', bgColor: 'bg-gray-50 dark:bg-gray-900/20' }
};

export function OnboardingPacks({ onPackSelected, isLoading = false }: OnboardingPacksProps) {
  const [packs, setPacks] = useState<PantryStarterPack[]>([]);
  const [selectedPack, setSelectedPack] = useState<PantryStarterPack | null>(null);
  const [isLoadingPacks, setIsLoadingPacks] = useState(true);
  const [showPackDetails, setShowPackDetails] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    loadStarterPacks();
  }, []);

  const loadStarterPacks = async () => {
    try {
      setIsLoadingPacks(true);
      
      const { data, error } = await supabase
        .from('pantry_starter_packs')
        .select('*')
        .eq('is_active', true)
        .order('popularity_score', { ascending: false });

      if (error) throw error;

      setPacks(data || []);
      logger.info('Starter packs loaded', 'OnboardingPacks', { count: data?.length });
    } catch (error) {
      logger.error('Error loading starter packs', 'OnboardingPacks', error);
    } finally {
      setIsLoadingPacks(false);
    }
  };

  const handlePackSelect = (pack: PantryStarterPack) => {
    setSelectedPack(pack);
    setShowPackDetails(true);
  };

  const handleApplyPack = async () => {
    if (!selectedPack) return;

    try {
      setIsApplying(true);
      
      // Convertir ingredientes del pack al formato esperado por usePantry
      const ingredientsToAdd = selectedPack.ingredients.map(ingredient => ({
        ingredient_name: ingredient.name,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        location: 'despensa',
        notes: `Pack ${selectedPack.name}`,
        expiration_date: undefined,
        photo: undefined
      }));

      await onPackSelected(ingredientsToAdd);
      
      setShowPackDetails(false);
      logger.info('Starter pack applied', 'OnboardingPacks', { 
        packId: selectedPack.id, 
        itemsCount: ingredientsToAdd.length 
      });
    } catch (error) {
      logger.error('Error applying starter pack', 'OnboardingPacks', error);
    } finally {
      setIsApplying(false);
    }
  };

  const getPackIcon = (category: string) => {
    const key = category.toLowerCase() as keyof typeof packIcons;
    return packIcons[key] || packIcons.default;
  };

  if (isLoadingPacks) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Cargando packs de inicio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          ¡Comenzá con un pack rápido!
        </h2>
        <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto">
          Elegí un pack prearmado para llenar tu despensa con los ingredientes esenciales
        </p>
      </motion.div>

      {/* Packs Grid */}
      <div className="grid gap-4 md:gap-6">
        {packs.map((pack, index) => {
          const iconConfig = getPackIcon(pack.category);
          const Icon = iconConfig.icon;
          
          return (
            <motion.div
              key={pack.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <KeCard
                variant="default"
                hoverable
                clickable
                onClick={() => handlePackSelect(pack)}
                className="relative overflow-hidden"
              >
                {/* Background pattern */}
                <div className={cn(
                  "absolute inset-0 opacity-5",
                  iconConfig.bgColor
                )} />
                
                <KeCardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-3 rounded-xl bg-gradient-to-r",
                        iconConfig.color
                      )}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <KeCardTitle className="text-lg">
                          {pack.name}
                        </KeCardTitle>
                        <KeCardDescription>
                          {pack.description}
                        </KeCardDescription>
                      </div>
                    </div>
                    
                    {/* Cost badge */}
                    <KeBadge variant="secondary" size="sm">
                      <DollarSign className="w-3 h-3" />
                      ${(pack.estimated_cost_ars / 1000).toFixed(0)}k
                    </KeBadge>
                  </div>
                </KeCardHeader>

                <KeCardContent>
                  {/* Target audience tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {pack.target_audience.map((audience) => (
                      <KeBadge 
                        key={audience} 
                        variant="primary" 
                        size="sm"
                        className="capitalize"
                      >
                        {audience}
                      </KeBadge>
                    ))}
                  </div>

                  {/* Quick preview of ingredients */}
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                      Incluye {pack.ingredients.length} ingredientes:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {pack.ingredients.slice(0, 4).map((ingredient, idx) => (
                        <span 
                          key={idx}
                          className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg"
                        >
                          {ingredient.name}
                        </span>
                      ))}
                      {pack.ingredients.length > 4 && (
                        <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                          +{pack.ingredients.length - 4} más
                        </span>
                      )}
                    </div>
                  </div>
                </KeCardContent>

                <KeCardFooter className="pt-4">
                  <KeButton
                    variant="primary"
                    size="sm"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                    className="w-full"
                    disabled={isLoading}
                  >
                    Ver detalles
                  </KeButton>
                </KeCardFooter>
              </KeCard>
            </motion.div>
          );
        })}
      </div>

      {/* Pack Details Modal */}
      <KeModal
        isOpen={showPackDetails}
        onClose={() => setShowPackDetails(false)}
        title={selectedPack?.name}
        description={selectedPack?.description}
        variant="pantry"
        size="lg"
      >
        {selectedPack && (
          <div className="space-y-6">
            {/* Pack info */}
            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-3 rounded-xl bg-gradient-to-r",
                  getPackIcon(selectedPack.category).color
                )}>
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {selectedPack.ingredients.length} ingredientes
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Costo estimado: ${(selectedPack.estimated_cost_ars / 1000).toFixed(0)}k ARS
                  </p>
                </div>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>

            {/* Target audience */}
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                Ideal para:
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedPack.target_audience.map((audience) => (
                  <KeBadge 
                    key={audience} 
                    variant="primary" 
                    className="capitalize"
                  >
                    {audience}
                  </KeBadge>
                ))}
              </div>
            </div>

            {/* Ingredients list */}
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                Ingredientes incluidos:
              </h4>
              <div className="grid gap-2 max-h-60 overflow-y-auto">
                {selectedPack.ingredients
                  .sort((a, b) => a.priority - b.priority)
                  .map((ingredient, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-gray-200/50 dark:border-gray-700/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {ingredient.name}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {ingredient.quantity} {ingredient.unit}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
              <KeButton
                variant="primary"
                className="flex-1"
                leftIcon={<ShoppingCart className="w-4 h-4" />}
                onClick={handleApplyPack}
                loading={isApplying}
                disabled={isApplying || isLoading}
              >
                {isApplying ? 'Agregando...' : 'Agregar a mi despensa'}
              </KeButton>
              <KeButton
                variant="outline"
                onClick={() => setShowPackDetails(false)}
                disabled={isApplying}
              >
                Cancelar
              </KeButton>
            </div>
          </div>
        )}
      </KeModal>
    </div>
  );
}