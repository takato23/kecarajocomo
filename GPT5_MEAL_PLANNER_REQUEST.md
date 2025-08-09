# Solicitud a GPT-5: Sistema Completo de Planificación de Comidas Argentinas

## 🎯 Contexto y Objetivo

Hola GPT-5! Necesitamos tu ayuda para crear un sistema de planificación de comidas COMPLETO y ROBUSTO para una aplicación llamada **KeCarajoComer** - una app argentina de planificación de comidas y gestión de despensa.

### Lo que queremos lograr:
1. **Un planificador semanal de comidas** que genere automáticamente menús argentinos auténticos
2. **Integración con IA (Gemini)** para generar recetas personalizadas
3. **Sincronización en tiempo real** con Supabase
4. **Interfaz hermosa** con efectos glassmorphism (vidrio esmerilado estilo iOS)
5. **Sistema inteligente** que aprenda de las preferencias del usuario

## 🏗️ Arquitectura Técnica Actual

### Stack:
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Estado**: Zustand con persistencia
- **Base de datos**: Supabase (PostgreSQL)
- **IA**: Google Gemini API
- **Estilos**: Tailwind CSS con glassmorphism
- **Autenticación**: NextAuth con Supabase

### Estructura de archivos clave:
```
/src
  /app/(app)/planificador/page.tsx         # Página principal
  /components/meal-planning/               # Componentes UI
  /features/meal-planning/                 # Lógica de negocio
  /hooks/meal-planning/                    # Hooks personalizados
  /lib/services/gemini*                    # Servicios de IA
  /lib/prompts/argentineMealPrompts.ts     # Prompts argentinos
  /store/slices/mealPlanSlice.ts          # Estado Zustand
```

## 📋 Funcionalidades Requeridas

### 1. **Generación de Plan Semanal**
```typescript
// Necesitamos que genere un plan completo de 7 días con:
- Desayuno, Almuerzo, Merienda, Cena
- Comidas 100% argentinas (milanesas, asado, empanadas, etc.)
- Respetando horarios culturales (cena a las 21-22hs)
- Mate en desayuno/merienda
- Asado los domingos
- Ñoquis los 29 de cada mes
```

### 2. **Regeneración Individual de Comidas**
```typescript
// Poder cambiar una comida específica:
- Click en cualquier slot de comida
- Botón "Regenerar con IA"
- Mantener coherencia con el resto del plan
- Evitar repeticiones
```

### 3. **Gestión de Recetas**
```typescript
// Sistema completo de recetas:
interface Recipe {
  id: string;
  name: string;
  ingredients: Ingredient[];
  instructions: string[];
  prepTime: number;
  cookTime: number;
  servings: number;
  nutrition: NutritionalInfo;
  culturalNotes?: string; // "Plato típico de Buenos Aires"
}
```

### 4. **Lista de Compras Inteligente**
```typescript
// Generar lista organizada por comercios argentinos:
- Verdulería: frutas, verduras
- Carnicería: cortes específicos (nalga, roast beef)
- Almacén/Chino: productos secos, yerba
- Panadería: pan, facturas
- Fiambrería: quesos, fiambres
```

### 5. **Sincronización con Supabase**
```sql
-- Tablas necesarias:
CREATE TABLE meal_plans (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  week_start DATE,
  week_end DATE,
  plan_data JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY,
  dietary_restrictions TEXT[],
  favorite_dishes TEXT[],
  disliked_ingredients TEXT[],
  household_size INTEGER,
  budget_weekly DECIMAL
);
```

### 6. **UI/UX Glassmorphism**
```css
/* Efectos de vidrio esmerilado como iOS: */
- backdrop-filter: blur(20px)
- background: rgba(255, 255, 255, 0.1)
- border: 1px solid rgba(255, 255, 255, 0.2)
- Sombras suaves
- Animaciones sutiles (no flashy)
```

## 🔧 Problemas Actuales a Resolver

1. **Autenticación**: Actualmente usa mock session en desarrollo
2. **Schema Supabase**: Falta columna 'is_public' en meal_plans
3. **Modal de selección de recetas**: No está implementado
4. **Real-time subscriptions**: No están configuradas
5. **Tests**: Faltan tests de integración

## 💡 Características Especiales Deseadas

### 1. **Inteligencia Contextual**
- Detectar estación del año y sugerir comidas apropiadas
- Adaptar presupuesto a economía argentina
- Considerar disponibilidad de ingredientes por región

### 2. **Aprendizaje de Preferencias**
- Trackear qué recetas acepta/rechaza el usuario
- Mejorar sugerencias con el tiempo
- Recordar combinaciones favoritas

### 3. **Integración con Despensa**
- Priorizar ingredientes que ya tiene
- Alertar productos por vencer
- Optimizar compras

### 4. **Modos Especiales**
- Modo "Económico" (crisis mode)
- Modo "Fiesta" (eventos especiales)
- Modo "Dieta" (versiones light)

## 📝 Código que Necesitamos de GPT-5

### 1. **Hook Principal Completo**
```typescript
// useMealPlanning.ts - Con TODAS las funcionalidades
export const useMealPlanning = () => {
  // Generación de planes
  // Sincronización con Supabase
  // Gestión de estado optimista
  // Manejo de errores robusto
  // Cache inteligente
};
```

### 2. **Componentes UI Completos**
- MealPlannerGrid (vista semanal)
- MealSlot (cada comida individual)
- RecipeSelectionModal
- ShoppingListGenerator
- NutritionalSummary

### 3. **Sistema de Prompts Mejorado**
- Prompts más inteligentes para Gemini
- Validación de respuestas
- Fallbacks para errores de API

### 4. **Tests Completos**
- Unit tests para hooks
- Integration tests para API
- E2E tests para flujos completos

### 5. **Documentación de Implementación**
- Guía paso a paso
- Configuración de variables de entorno
- Deploy a producción

## 🚀 Output Esperado

Necesitamos que nos proporciones:

1. **Código TypeScript production-ready** sin comentarios tipo "// TODO" o "// Add your logic here"
2. **Manejo completo de errores** con retry logic y fallbacks
3. **Optimizaciones de performance** (lazy loading, memoización, etc.)
4. **Código que funcione inmediatamente** sin necesidad de ajustes

## 🎨 Ejemplo de UI Deseada

```
┌─────────────────────────────────────────────┐
│  🍽️ Planificador Semanal - Semana del 29/1 │
├─────────────────────────────────────────────┤
│  Lun   Mar   Mié   Jue   Vie   Sáb   Dom   │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ │
│  │☕│ │☕│ │☕│ │☕│ │☕│ │☕│ │☕│ │
│  │Café│ │Mate│ │Café│ │Mate│ │Café│ │Mate│ │Café│ │
│  └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ │
│  │🍖│ │🍝│ │🥟│ │🍗│ │🍕│ │🥘│ │🥩│ │
│  │Mila│ │Ñoqui│ │Empa│ │Pollo│ │Pizza│ │Guiso│ │ASADO│ │
│  └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ │
│  │🧉│ │🧉│ │🧉│ │🧉│ │🧉│ │🧉│ │🧉│ │
│  │Mate│ │Mate│ │Mate│ │Mate│ │Mate│ │Torta│ │Fact│ │
│  └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ │
│  │🍽️│ │🥗│ │🍲│ │🥚│ │🍝│ │🥟│ │🍖│ │
│  │Tarta│ │Ensa│ │Sopa│ │Torti│ │Pasta│ │Pizza│ │Reste│ │
│  └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ │
│                                             │
│ [Generar con IA] [Lista de Compras] [Guardar] │
└─────────────────────────────────────────────┘
```

## 📌 Notas Finales para GPT-5

1. **IMPORTANTE**: El código debe ser 100% funcional, no pseudocódigo
2. **Usar las mejores prácticas** de React 18, Next.js 14, TypeScript 5
3. **Optimizado para móviles** (mobile-first)
4. **Accesible** (WCAG 2.1 AA)
5. **Performante** (<3s de carga en 3G)

Por favor, proporciona el código completo empezando por el hook principal `useMealPlanning` y luego todos los componentes necesarios. Asegúrate de que todo esté listo para copiar, pegar y funcionar.

¡Gracias GPT-5! 🚀