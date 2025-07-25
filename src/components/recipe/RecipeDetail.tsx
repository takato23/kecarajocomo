'use client';

import React, { useState } from 'react';

import { cn } from '@/lib/utils';

import { Card, CardHeader, CardBody } from '../design-system/Card';
import { Badge } from '../design-system/Badge';
import { Heading, Text } from '../design-system/Typography';
import { Button } from '../design-system/Button';
import { Icons } from '../design-system/icons';
import { NutritionDisplay } from '../design-system/NutritionDisplay';
import type { Recipe, RecipeIngredient, RecipeInstruction } from '../../types/recipes';

export interface RecipeDetailProps {
  recipe: Recipe;
  pantryCompatibility?: PantryCompatibility;
  className?: string;
  onFavoriteToggle?: (recipeId: string) => void;
  onShare?: (recipeId: string) => void;
  onStartCooking?: (recipeId: string) => void;
  onAddToMealPlan?: (recipeId: string) => void;
  onScaleServings?: (servings: number) => void;
  onRateRecipe?: (rating: number, review?: string) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onBack?: () => void;
}

const difficultyConfig = {
  facil: { label: 'Fácil', color: 'fresh' as const, icon: '⭐' },
  intermedio: { label: 'Intermedio', color: 'golden' as const, icon: '⭐⭐' },
  dificil: { label: 'Difícil', color: 'warm' as const, icon: '⭐⭐⭐' },
  experto: { label: 'Experto', color: 'rich' as const, icon: '⭐⭐⭐⭐' }
};

const categoryIcons = {
  desayuno: '🌅',
  almuerzo: '🌞',
  cena: '🌙',
  snack: '🍿',
  postre: '🍰',
  bebida: '🥤',
  aperitivo: '🧀',
  ensalada: '🥗',
  sopa: '🍲',
  pasta: '🍝',
  pizza: '🍕',
  sandwich: '🥪',
  parrilla: '🔥',
  vegetariano: '🌱',
  vegano: '🥬',
  sin_gluten: '🌾'
};

const RecipeDetail: React.FC<RecipeDetailProps> = ({
  recipe,
  pantryCompatibility,
  className,
  onFavoriteToggle,
  onShare,
  onStartCooking,
  onAddToMealPlan,
  onScaleServings,
  onRateRecipe,
  onEdit,
  onDelete,
  onBack
}) => {
  const [servings, setServings] = useState(recipe.servings);
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState<'overview' | 'ingredients' | 'instructions' | 'nutrition'>('overview');
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [userReview, setUserReview] = useState('');

  const scalingFactor = servings / recipe.servings;
  const difficulty = difficultyConfig[recipe.difficulty];
  const categoryIcon = categoryIcons[recipe.category];
  const isFavorite = recipe.favorited_by?.length > 0;
  const totalTime = recipe.cook_time + recipe.prep_time;

  const handleServingsChange = (newServings: number) => {
    if (newServings >= 1 && newServings <= 20) {
      setServings(newServings);
      if (onScaleServings) {
        onScaleServings(newServings);
      }
    }
  };

  const handleStepToggle = (stepNumber: number) => {
    const newCheckedSteps = new Set(checkedSteps);
    if (newCheckedSteps.has(stepNumber)) {
      newCheckedSteps.delete(stepNumber);
    } else {
      newCheckedSteps.add(stepNumber);
    }
    setCheckedSteps(newCheckedSteps);
  };

  const handleSubmitRating = () => {
    if (onRateRecipe && userRating > 0) {
      onRateRecipe(userRating, userReview.trim() || undefined);
      setShowRatingModal(false);
      setUserRating(0);
      setUserReview('');
    }
  };

  const renderIngredient = (ingredient: RecipeIngredient, index: number) => {
    const scaledQuantity = ingredient.quantity * scalingFactor;
    const isAvailable = pantryCompatibility?.available_ingredients.some(
      avail => avail.ingredient_id === ingredient.ingredient_id
    );
    const isMissing = pantryCompatibility?.missing_ingredients.some(
      missing => missing.ingredient_id === ingredient.ingredient_id
    );

    return (
      <div
        key={index}
        className={cn(
          'flex items-center justify-between p-3 rounded-lg border',
          isAvailable && 'bg-food-fresh-50 border-food-fresh-200 dark:bg-food-fresh-900/20 dark:border-food-fresh-800',
          isMissing && 'bg-warm-50 border-warm-200 dark:bg-warm-900/20 dark:border-warm-800',
          !isAvailable && !isMissing && 'bg-neutral-50 border-neutral-200 dark:bg-neutral-800 dark:border-neutral-700'
        )}
      >
        <div className="flex items-center gap-3">
          {isAvailable && <Icons.CheckCircle size="sm" className="text-food-fresh-500" />}
          {isMissing && <Icons.ShoppingCart size="sm" className="text-warm-500" />}
          
          <div>
            <div className="flex items-center gap-2">
              <Text weight="medium">
                {scaledQuantity % 1 === 0 ? scaledQuantity.toFixed(0) : scaledQuantity.toFixed(1)} {ingredient.unit}
              </Text>
              <Text>
                {ingredient.ingredient?.name || 'Ingrediente personalizado'}
              </Text>
              {ingredient.optional && (
                <Badge size="xs" variant="neutral">opcional</Badge>
              )}
            </div>
            {ingredient.preparation && (
              <Text size="sm" color="muted">
                {ingredient.preparation}
              </Text>
            )}
            {ingredient.notes && (
              <Text size="xs" color="muted" className="italic">
                {ingredient.notes}
              </Text>
            )}
          </div>
        </div>

        {isAvailable && (
          <Badge size="xs" variant="fresh">
            Disponible
          </Badge>
        )}
        {isMissing && (
          <Badge size="xs" variant="warm">
            Falta
          </Badge>
        )}
      </div>
    );
  };

  const renderInstruction = (instruction: RecipeInstruction, index: number) => {
    const isChecked = checkedSteps.has(instruction.step_number);

    return (
      <div
        key={index}
        className={cn(
          'flex gap-4 p-4 rounded-lg border transition-all duration-200',
          isChecked 
            ? 'bg-food-fresh-50 border-food-fresh-200 dark:bg-food-fresh-900/20 dark:border-food-fresh-800' 
            : 'bg-neutral-50 border-neutral-200 dark:bg-neutral-800 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700'
        )}
      >
        <button
          onClick={() => handleStepToggle(instruction.step_number)}
          className={cn(
            'flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-200',
            isChecked
              ? 'bg-food-fresh-500 border-food-fresh-500 text-white'
              : 'border-neutral-300 dark:border-neutral-600 hover:border-food-fresh-300'
          )}
        >
          {isChecked ? (
            <Icons.Check size="sm" />
          ) : (
            <Text size="sm" weight="medium">{instruction.step_number}</Text>
          )}
        </button>

        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {instruction.title && (
                <Heading size="sm" weight="semibold" className="mb-2">
                  {instruction.title}
                </Heading>
              )}
              <Text className={cn(isChecked && 'line-through opacity-75')}>
                {instruction.instruction}
              </Text>
              
              {instruction.notes && (
                <Text size="sm" color="muted" className="mt-2 italic">
                  💡 {instruction.notes}
                </Text>
              )}
            </div>

            <div className="flex flex-col items-end gap-1 ml-4">
              {instruction.duration && (
                <div className="flex items-center gap-1">
                  <Icons.Clock size="xs" className="text-food-golden-500" />
                  <Text size="xs" color="muted">{instruction.duration}m</Text>
                </div>
              )}
              {instruction.temperature && (
                <div className="flex items-center gap-1">
                  <Icons.Thermometer size="xs" className="text-warm-500" />
                  <Text size="xs" color="muted">{instruction.temperature}°C</Text>
                </div>
              )}
            </div>
          </div>

          {instruction.image_url && (
            <div className="mt-3">
              <img
                src={instruction.image_url}
                alt={`Paso ${instruction.step_number}`}
                className="w-full max-w-md h-32 object-cover rounded-lg"
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderPantryCompatibility = () => {
    if (!pantryCompatibility) return null;

    const { can_make, missing_ingredients, compatibility_score } = pantryCompatibility;

    return (
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Icons.Package size="sm" className="text-food-fresh-500" />
            <Heading size="md">Compatibilidad con tu Despensa</Heading>
          </div>
        </CardHeader>
        <CardBody>
          <div className="flex items-center gap-4 mb-4">
            <div className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg',
              can_make ? 'bg-food-fresh-100 text-food-fresh-800 dark:bg-food-fresh-900/20' : 'bg-warm-100 text-warm-800 dark:bg-warm-900/20'
            )}>
              {can_make ? <Icons.CheckCircle size="sm" /> : <Icons.Clock size="sm" />}
              <Text weight="medium">
                {can_make ? 'Puedes cocinar esta receta' : `Faltan ${missing_ingredients.length} ingredientes`}
              </Text>
            </div>
            <div className="flex items-center gap-1">
              <Text size="sm" color="muted">Compatibilidad:</Text>
              <Text weight="medium" color={compatibility_score > 0.7 ? 'fresh' : compatibility_score > 0.4 ? 'golden' : 'muted'}>
                {Math.round(compatibility_score * 100)}%
              </Text>
            </div>
          </div>

          {missing_ingredients.length > 0 && (
            <div>
              <Text size="sm" weight="medium" className="mb-2">Ingredientes faltantes:</Text>
              <div className="flex flex-wrap gap-1">
                {missing_ingredients.slice(0, 5).map((ingredient, index) => (
                  <Badge key={index} size="sm" variant="warm">
                    {ingredient.ingredient?.name}
                  </Badge>
                ))}
                {missing_ingredients.length > 5 && (
                  <Badge size="sm" variant="neutral">
                    +{missing_ingredients.length - 5} más
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    );
  };

  return (
    <div className={cn('max-w-4xl mx-auto', className)}>
      {/* Back Button */}
      {onBack && (
        <div className="mb-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Icons.ArrowLeft size="sm" />
            <span>Volver a recetas</span>
          </button>
        </div>
      )}

      {/* Header Image and Title */}
      <div className="relative mb-6">
        {recipe.image_url ? (
          <div className="relative h-64 md:h-80 rounded-xl overflow-hidden">
            <img
              src={recipe.image_url}
              alt={recipe.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            {/* Floating Action Buttons */}
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={() => onFavoriteToggle?.(recipe.id)}
                className={cn(
                  'p-3 rounded-full glass-interactive backdrop-blur-md transition-all duration-200',
                  'hover:scale-110 focus:outline-none focus:ring-2 focus:ring-food-fresh-300',
                  isFavorite
                    ? 'text-error-500 glow-warm'
                    : 'text-white hover:text-error-500'
                )}
              >
                <Icons.Heart size="md" className={isFavorite ? 'fill-current' : ''} />
              </button>
              
              <button
                onClick={() => onShare?.(recipe.id)}
                className="p-3 rounded-full glass-interactive backdrop-blur-md text-white hover:text-food-fresh-300 transition-all duration-200"
              >
                <Icons.Share size="md" />
              </button>

              {/* Edit Button - Only show if onEdit is provided */}
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="p-3 rounded-full glass-interactive backdrop-blur-md text-white hover:text-blue-300 transition-all duration-200"
                  title="Editar receta"
                >
                  <Icons.Edit size="md" />
                </button>
              )}

              {/* Delete Button - Only show if onDelete is provided */}
              {onDelete && (
                <button
                  onClick={onDelete}
                  className="p-3 rounded-full glass-interactive backdrop-blur-md text-white hover:text-red-300 transition-all duration-200"
                  title="Eliminar receta"
                >
                  <Icons.Trash size="md" />
                </button>
              )}
            </div>

            {/* Title Overlay */}
            <div className="absolute bottom-6 left-6 right-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-2xl">{categoryIcon}</div>
                <Badge variant={difficulty.color} className="glass backdrop-blur-md">
                  {difficulty.icon} {difficulty.label}
                </Badge>
                {recipe.ai_generated && (
                  <Badge variant="rich" className="glass backdrop-blur-md">
                    <Icons.Star size="xs" /> AI
                  </Badge>
                )}
              </div>
              <Heading size="2xl" className="text-white mb-2">
                {recipe.name}
              </Heading>
              {recipe.description && (
                <Text className="text-neutral-200">
                  {recipe.description}
                </Text>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-8xl mb-4">{categoryIcon || '🍽️'}</div>
            <Heading size="2xl" className="mb-2">{recipe.name}</Heading>
            {recipe.description && (
              <Text size="lg" color="muted">{recipe.description}</Text>
            )}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <Card className="mb-6">
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <Icons.Clock className="mx-auto mb-2 text-food-golden-500" />
              <Text size="sm" color="muted">Tiempo total</Text>
              <Text weight="semibold">{totalTime}m</Text>
            </div>
            
            <div className="text-center">
              <Icons.Users className="mx-auto mb-2 text-food-fresh-500" />
              <Text size="sm" color="muted">Porciones</Text>
              <div className="flex items-center justify-center gap-2 mt-1">
                <button
                  onClick={() => handleServingsChange(servings - 1)}
                  className="w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-neutral-700"
                >
                  <Icons.Minus size="xs" />
                </button>
                <Text weight="semibold">{servings}</Text>
                <button
                  onClick={() => handleServingsChange(servings + 1)}
                  className="w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-neutral-700"
                >
                  <Icons.Plus size="xs" />
                </button>
              </div>
            </div>

            <div className="text-center">
              <Icons.ChefHat className="mx-auto mb-2 text-food-warm-500" />
              <Text size="sm" color="muted">Prep + Cook</Text>
              <Text weight="semibold">{recipe.prep_time}m + {recipe.cook_time}m</Text>
            </div>

            {recipe.nutrition?.calories && (
              <div className="text-center">
                <Icons.Flame className="mx-auto mb-2 text-error-500" />
                <Text size="sm" color="muted">Calorías</Text>
                <Text weight="semibold">{Math.round(recipe.nutrition.calories * scalingFactor)}</Text>
              </div>
            )}

            {recipe.rating && (
              <div className="text-center">
                <Icons.Star className="mx-auto mb-2 text-food-golden-500 fill-current" />
                <Text size="sm" color="muted">Rating</Text>
                <Text weight="semibold">{recipe.rating.toFixed(1)}</Text>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Pantry Compatibility */}
      {renderPantryCompatibility()}

      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        {pantryCompatibility?.can_make && onStartCooking && (
          <Button
            variant="warm"
            size="lg"
            onClick={() => onStartCooking(recipe.id)}
            leftIcon={<Icons.Play />}
            className="flex-1"
          >
            Empezar a Cocinar
          </Button>
        )}
        
        {onAddToMealPlan && (
          <Button
            variant="fresh"
            size="lg"
            onClick={() => onAddToMealPlan(recipe.id)}
            leftIcon={<Icons.Calendar />}
            className="flex-1"
          >
            Agregar al Plan
          </Button>
        )}

        <Button
          variant="neutral"
          size="lg"
          onClick={() => setShowRatingModal(true)}
          leftIcon={<Icons.Star />}
        >
          Calificar
        </Button>
      </div>

      {/* Content Tabs */}
      <div className="mb-6">
        <div className="flex border-b border-neutral-200 dark:border-neutral-700">
          {[
            { id: 'overview', label: 'Resumen', icon: Icons.Info },
            { id: 'ingredients', label: 'Ingredientes', icon: Icons.List },
            { id: 'instructions', label: 'Preparación', icon: Icons.ChefHat },
            { id: 'nutrition', label: 'Nutrición', icon: Icons.Activity }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 border-b-2 transition-colors',
                activeTab === tab.id
                  ? 'border-food-fresh-500 text-food-fresh-600 dark:text-food-fresh-400'
                  : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              )}
            >
              <tab.icon size="sm" />
              <Text weight="medium">{tab.label}</Text>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Tags and Dietary Info */}
          <Card>
            <CardHeader>
              <Heading size="md">Información Adicional</Heading>
            </CardHeader>
            <CardBody className="space-y-4">
              {/* Dietary Info */}
              <div>
                <Text size="sm" weight="medium" className="mb-2">Información Dietética:</Text>
                <div className="flex flex-wrap gap-2">
                  {recipe.dietary_info.vegetarian && <Badge variant="fresh">🌱 Vegetariano</Badge>}
                  {recipe.dietary_info.vegan && <Badge variant="fresh">🥬 Vegano</Badge>}
                  {recipe.dietary_info.gluten_free && <Badge variant="golden">🌾 Sin Gluten</Badge>}
                  {recipe.dietary_info.dairy_free && <Badge variant="neutral">🥛 Sin Lácteos</Badge>}
                  {recipe.dietary_info.nut_free && <Badge variant="neutral">🥜 Sin Frutos Secos</Badge>}
                  {recipe.dietary_info.low_carb && <Badge variant="warm">🍞 Bajo en Carbohidratos</Badge>}
                  {recipe.dietary_info.keto && <Badge variant="rich">🥑 Keto</Badge>}
                </div>
              </div>

              {/* Tags */}
              {recipe.tags.length > 0 && (
                <div>
                  <Text size="sm" weight="medium" className="mb-2">Etiquetas:</Text>
                  <div className="flex flex-wrap gap-1">
                    {recipe.tags.map((tag, index) => (
                      <Badge key={index} variant="neutral" size="sm">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Source */}
              {recipe.source && (
                <div>
                  <Text size="sm" weight="medium" className="mb-1">Fuente:</Text>
                  <Text size="sm" color="muted">
                    {recipe.source.type === 'ai_generated' ? 'Generado por IA' : 
                     recipe.source.type === 'imported' ? `Importado de: ${recipe.source.url}` :
                     recipe.source.author || 'Manual'}
                  </Text>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {activeTab === 'ingredients' && (
        <div className="space-y-4">
          {recipe.ingredients.map((ingredient, index) => renderIngredient(ingredient, index))}
        </div>
      )}

      {activeTab === 'instructions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <Text size="sm" color="muted">
              {checkedSteps.size} de {recipe.instructions.length} pasos completados
            </Text>
            <Button
              variant="neutral"
              size="sm"
              onClick={() => setCheckedSteps(new Set())}
              disabled={checkedSteps.size === 0}
            >
              Reiniciar
            </Button>
          </div>
          
          {recipe.instructions
            .sort((a, b) => a.step_number - b.step_number)
            .map((instruction, index) => renderInstruction(instruction, index))}
        </div>
      )}

      {activeTab === 'nutrition' && recipe.nutrition && (
        <NutritionDisplay
          nutrition={{
            calories: Math.round(recipe.nutrition.calories * scalingFactor),
            protein: Math.round(recipe.nutrition.protein * scalingFactor),
            carbs: Math.round(recipe.nutrition.carbs * scalingFactor),
            fat: Math.round(recipe.nutrition.fat * scalingFactor),
            fiber: Math.round(recipe.nutrition.fiber * scalingFactor),
            sugar: Math.round((recipe.nutrition.sugar || 0) * scalingFactor),
            sodium: Math.round((recipe.nutrition.sodium || 0) * scalingFactor)
          }}
          servings={servings}
          className="max-w-2xl"
        />
      )}

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <Heading size="lg">Calificar Receta</Heading>
            </CardHeader>
            <CardBody className="space-y-4">
              <div>
                <Text className="mb-2">¿Cómo calificarías esta receta?</Text>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setUserRating(star)}
                      className={cn(
                        'p-1 transition-colors',
                        star <= userRating ? 'text-food-golden-500' : 'text-neutral-300'
                      )}
                    >
                      <Icons.Star size="lg" className={star <= userRating ? 'fill-current' : ''} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Text className="mb-2">Reseña (opcional):</Text>
                <textarea
                  value={userReview}
                  onChange={(e) => setUserReview(e.target.value)}
                  placeholder="Comparte tu experiencia con esta receta..."
                  className="w-full p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 dark:bg-neutral-800 resize-none"
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="neutral"
                  onClick={() => setShowRatingModal(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  variant="fresh"
                  onClick={handleSubmitRating}
                  disabled={userRating === 0}
                  className="flex-1"
                >
                  Enviar Calificación
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
};

export default RecipeDetail;