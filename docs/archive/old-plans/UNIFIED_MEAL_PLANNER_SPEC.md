# 🍴 Especificación Unificada del Planificador de Comidas con IA

## 📋 Resumen Ejecutivo

Este documento consolida todos los requerimientos, diseño y arquitectura para crear un planificador de comidas semanal inteligente, potenciado por IA (Google Gemini), con una interfaz moderna y atractiva.

## 🎯 Visión del Producto

Crear un sistema de planificación de comidas que:
- **Genere planes semanales personalizados** usando IA (Gemini)
- **Integre con despensa y recetas** existentes
- **Optimice nutrición, presupuesto y tiempo**
- **Ofrezca una experiencia visual excepcional** con glass morphism y animaciones
- **Sea completamente responsive** y funcione perfecto en móviles
- **Esté en español** para el mercado latinoamericano

## 🏗️ Arquitectura del Sistema

### Stack Tecnológico
- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Animaciones**: Framer Motion
- **Estado**: Zustand con persistencia
- **IA**: Google Gemini API
- **UI Components**: Shadcn/ui customizados
- **Backend**: Supabase (PostgreSQL + Auth + Storage)

### Arquitectura de Componentes

```
/planificador
├── Componentes Principales
│   ├── WeeklyPlanner         # Vista principal 7 días x 4 comidas
│   ├── MealSlotModal         # Modal para agregar/editar comidas
│   ├── ShoppingListModal     # Lista de compras generada
│   └── NutritionalSummary    # Resumen nutricional
├── Servicios IA
│   ├── GeminiMealPlanner     # Generación de planes con IA
│   ├── PromptEngineering     # Optimización de prompts
│   └── NutritionAnalyzer     # Análisis nutricional
└── Gestión de Estado
    ├── weeklyPlannerStore    # Estado principal del planificador
    └── mealSlotStore         # Estado de slots individuales
```

## 🎨 Diseño Visual & UX

### Glass Morphism Theme
```css
/* Efecto glass morphism */
backdrop-filter: blur(12px);
background: rgba(255, 255, 255, 0.7);
border: 1px solid rgba(255, 255, 255, 0.2);
box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
```

### Sistema de Colores por Tipo de Comida
- **🌅 Desayuno**: Gradiente Naranja → Amarillo
- **☀️ Almuerzo**: Gradiente Azul → Cyan  
- **🍎 Snack**: Gradiente Verde → Esmeralda
- **🌙 Cena**: Gradiente Púrpura → Rosa

### Animaciones con Framer Motion
- Hover en cards: scale(1.02) + shadow enhancement
- Click feedback: scale(0.98)
- Transiciones de semana: slide + fade
- Modales: spring physics
- Loading: skeleton shimmer
- Micro-interacciones: rotación de emojis

### Modo Oscuro
- Detección automática del sistema
- Toggle manual en header
- Colores optimizados para ambos temas
- Glass morphism adaptado para dark mode

## 📱 Diseño Mobile-First

### Responsive Breakpoints
- **Mobile**: < 640px (vista apilada vertical)
- **Tablet**: 640px - 1024px (grid adaptativo)
- **Desktop**: > 1024px (vista completa 7 días)

### Optimizaciones Móviles
- Touch targets mínimo 44px
- Swipe para navegar semanas
- Modales fullscreen
- Menú colapsable
- Gestos nativos

## 🤖 Integración con IA (Gemini)

### Capacidades de Generación
1. **Plan Semanal Completo**
   - 28 slots (7 días × 4 comidas)
   - Considera preferencias dietéticas
   - Optimiza uso de despensa
   - Balancea nutrición

2. **Regeneración Inteligente**
   - Regenerar slots individuales
   - Mantener comidas bloqueadas
   - Sugerencias contextuales

3. **Optimizaciones**
   - Minimizar desperdicio
   - Maximizar variedad
   - Considerar tiempo de preparación
   - Ajustar a presupuesto

### Prompt Engineering para Gemini

```javascript
const PROMPT_TEMPLATE = `
Genera un plan de comidas semanal en formato JSON para:

CONTEXTO DEL USUARIO:
- Dieta: {dietType}
- Alergias: {allergies}
- Objetivo calórico: {calories}/día
- Nivel de cocina: {cookingLevel}
- Restricciones: {restrictions}
- Tamaño del hogar: {householdSize}

PARÁMETROS DE PLANIFICACIÓN:
- Días: 7 (Lunes a Domingo)
- Comidas por día: 4 (desayuno, almuerzo, snack, cena)
- Tiempo máximo entre semana: 30 minutos
- Tiempo flexible fin de semana
- Presupuesto: {budget}

ITEMS EN DESPENSA (usar prioritariamente):
{pantryItems}

COMIDAS BLOQUEADAS (no cambiar):
{lockedMeals}

REGLAS:
1. Maximizar uso de ingredientes en despensa
2. Variar proteínas y vegetales
3. Balancear macronutrientes
4. Considerar preparación en lotes
5. Incluir recetas locales/culturales
6. Generar lista de compras optimizada

FORMATO DE SALIDA:
{
  "weekPlan": {
    "monday": {
      "breakfast": { recipe },
      "lunch": { recipe },
      "snack": { recipe },
      "dinner": { recipe }
    },
    // ... resto de días
  },
  "shoppingList": {
    "produce": [],
    "proteins": [],
    "grains": [],
    "dairy": [],
    "pantry": []
  },
  "nutritionalSummary": {
    "dailyAverages": { ... }
  }
}
`;
```

## 💾 Modelos de Datos

### Schema Principal

```typescript
interface WeeklyPlan {
  id: string;
  userId: string;
  weekStartDate: Date;
  status: 'draft' | 'active' | 'completed';
  meals: PlannedMeal[];
  metadata: {
    generatedBy: 'ai' | 'manual' | 'hybrid';
    lastModified: Date;
    aiModel?: string;
    tokenUsage?: number;
  };
}

interface PlannedMeal {
  id: string;
  date: Date;
  mealType: 'breakfast' | 'lunch' | 'snack' | 'dinner';
  recipe: Recipe;
  servings: number;
  isLocked: boolean;
  scheduledTime?: string;
  notes?: string;
  customizations?: {
    excludedIngredients?: string[];
    extraIngredients?: string[];
  };
}

interface Recipe {
  id: string;
  title: string;
  description?: string;
  ingredients: Ingredient[];
  instructions: string[];
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  nutritionalInfo: NutritionalInfo;
  tags: string[];
  imageUrl?: string;
  source?: 'ai' | 'user' | 'community';
}

interface ShoppingListItem {
  id: string;
  ingredientName: string;
  quantity: number;
  unit: string;
  category: string;
  estimatedCost?: number;
  checked: boolean;
  recipeIds: string[]; // Referencias a las recetas que lo usan
}
```

## 🔧 Funcionalidades Core

### 1. Vista Semanal Principal
- **Grid 7×4**: 7 días, 4 tipos de comida
- **Cards interactivas**: Click para editar
- **Quick actions**: Bloquear/eliminar al hover
- **Navegación**: Flechas para cambiar semana
- **Indicadores visuales**: Comidas bloqueadas, completadas

### 2. Modal de Slot de Comida
**4 Tabs principales:**
1. **🔍 Buscar**: Recetas existentes
2. **➕ Crear**: Nueva receta manual
3. **🤖 Generar**: Con IA para este slot
4. **📥 Importar**: Desde URL/foto

### 3. Generación con IA
- **"Planificar mi semana"**: Genera plan completo
- **Regenerar slot**: IA regenera comida específica
- **Sugerencias inteligentes**: Basadas en contexto
- **Progress tracking**: Barra de progreso durante generación

### 4. Lista de Compras
- **Generación automática**: Desde plan semanal
- **Comparación con despensa**: Solo items faltantes
- **Categorización**: Por tipo de alimento
- **Optimización**: Por tienda/pasillo
- **Export**: PDF, WhatsApp, Email

### 5. Resumen Nutricional
- **Vista diaria/semanal**: Promedios y totales
- **Macronutrientes**: Proteínas, carbos, grasas
- **Micronutrientes**: Vitaminas, minerales
- **Comparación con objetivos**: Visual con progress bars
- **Alertas**: Deficiencias o excesos

## 📊 Gestión de Estado (Zustand)

### weeklyPlannerStore
```typescript
interface WeeklyPlannerState {
  // Estado
  currentWeek: Date;
  weeklyPlan: WeeklyPlan | null;
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
  
  // Preferencias de generación
  planPreferences: {
    avoidRepetitions: boolean;
    preferFavorites: boolean;
    usePantryFirst: boolean;
    maxCookingTimeWeekday: number;
    maxCookingTimeWeekend: number;
    budgetLevel: 'low' | 'medium' | 'high';
    varietyLevel: 'low' | 'medium' | 'high';
  };
  
  // Lista de compras
  shoppingList: ShoppingListItem[];
  
  // Acciones
  generateFullWeekPlan: (preferences) => Promise<void>;
  regenerateSlot: (slotId) => Promise<void>;
  updateMeal: (mealId, updates) => void;
  lockMeal: (mealId, locked) => void;
  removeMeal: (mealId) => void;
  generateShoppingList: () => Promise<void>;
}
```

## 🚀 Características Avanzadas

### 1. Aprendizaje Continuo
- Aprende de las elecciones del usuario
- Mejora sugerencias con el tiempo
- Identifica patrones exitosos
- Adapta a preferencias estacionales

### 2. Optimización Inteligente
- **Batch cooking**: Agrupa preparaciones similares
- **Leftover planning**: Reutiliza sobras creativamente
- **Seasonal awareness**: Prioriza ingredientes de temporada
- **Budget optimization**: Maximiza valor nutricional por peso

### 3. Integraciones Futuras
- **Delivery services**: Orden directa de ingredientes
- **Smart appliances**: Programar cocción automática
- **Fitness trackers**: Ajustar calorías según actividad
- **Social sharing**: Compartir planes con familia

## 📱 API Endpoints

### REST API
```yaml
# Generar plan semanal
POST /api/meal-plans/generate
Body: {
  dateRange: { start, end },
  preferences: { ... },
  lockedSlots: [ ... ]
}

# Actualizar slot específico  
PATCH /api/meal-plans/{planId}/slots/{slotId}

# Regenerar slots con IA
POST /api/meal-plans/{planId}/regenerate
Body: { slotIds: [...] }

# Generar lista de compras
POST /api/meal-plans/{planId}/shopping-list

# Obtener resumen nutricional
GET /api/meal-plans/{planId}/nutrition-summary
```

## 🎯 Métricas de Éxito

### KPIs de Usuario
- **Adopción**: >80% usuarios activos semanales
- **Completitud**: >85% planes completados
- **Satisfacción**: >4.5/5 rating promedio
- **Retención**: >70% usuarios mensuales

### KPIs Técnicos
- **Generación IA**: <30s para plan completo
- **Tiempo de respuesta**: <200ms interacciones
- **Uptime**: >99.9%
- **Error rate**: <0.1%

## 🔐 Seguridad y Privacidad

- **Encriptación**: Datos sensibles encriptados
- **Autenticación**: Supabase Auth con MFA
- **Autorización**: Row Level Security en DB
- **Compliance**: GDPR y protección de datos
- **Sanitización**: Prevenir prompt injection

## 📅 Roadmap de Implementación

### Fase 1: MVP (Semana 1-2)
- [ ] Estructura base del planificador
- [ ] Integración básica con Gemini
- [ ] UI con glass morphism
- [ ] Generación de plan completo
- [ ] Vista y edición básica

### Fase 2: Features Core (Semana 3-4)
- [ ] Lista de compras inteligente
- [ ] Resumen nutricional
- [ ] Modo oscuro completo
- [ ] Optimizaciones móviles
- [ ] Persistencia con Zustand

### Fase 3: IA Avanzada (Semana 5-6)
- [ ] Regeneración por slots
- [ ] Batch processing
- [ ] Aprendizaje de preferencias
- [ ] Optimizaciones de prompts
- [ ] Manejo avanzado de errores

### Fase 4: Polish (Semana 7-8)
- [ ] Animaciones refinadas
- [ ] Testing exhaustivo
- [ ] Optimización de performance
- [ ] Documentación completa
- [ ] Deploy a producción

---

## 🎉 Resultado Final Esperado

Un planificador de comidas que:
1. **Se vea espectacular** con glass morphism y animaciones suaves
2. **Sea inteligente** con IA que aprende y optimiza
3. **Sea práctico** generando listas de compras y planes nutricionales
4. **Sea accesible** funcionando perfecto en móviles
5. **Sea personalizado** adaptándose a cada usuario

Este es el planificador de comidas definitivo para el mercado latinoamericano.