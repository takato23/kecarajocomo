# Sistema de Comidas Argentinas - KeCarajoComer

## ✅ Implementación Completada

### 1. Sistema de Prompts Argentinos (`/src/lib/prompts/argentineMealPrompts.ts`)

- **Componentes de comidas por categoría**: Desayuno, almuerzo, merienda, cena
- **Preferencias estacionales**: Adaptación según verano/invierno/otoño/primavera
- **Especialidades regionales**: Buenos Aires, Interior, Litoral, Cuyo, Patagonia, Noroeste
- **Consideraciones de presupuesto**: Económico, moderado, amplio
- **Categorías de tiempo de cocción**: Rápido (15-30min), normal (30-60min), elaborado (>1hr)

### 2. Integración con Gemini AI

#### Actualizado `geminiPromptTemplates.ts`:
- `createMealPlanPrompt`: Genera planes semanales con comida argentina auténtica
- `createRegenerateMealPrompt`: Regenera comidas individuales con contexto argentino
- `createPantryRecipePrompt`: Sugiere recetas argentinas basadas en despensa
- `createShoppingListPrompt`: Organiza lista de compras por comercios argentinos

### 3. Características Culturales Implementadas

- **Horarios argentinos**: 
  - Desayuno: 7-9 AM
  - Almuerzo: 13-14hs (comida principal)
  - Merienda: 17-18hs (mate obligatorio)
  - Cena: 21-22hs

- **Tradiciones incluidas**:
  - Mate en desayuno/merienda
  - Asado dominical
  - Ñoquis el 29 de cada mes
  - Pizza los viernes/sábados
  - Milanesas como plato versátil

### 4. Ejemplos de Comidas Generadas

**Desayuno típico**:
- Café con leche y tostadas con manteca y mermelada
- Mate con medialunas (fin de semana)

**Almuerzo típico**:
- Milanesas con puré o ensalada
- Pastel de papas
- Empanadas (caseras o delivery)
- Guiso de lentejas (invierno)

**Merienda típica**:
- Mate con bizcochos
- Café con facturas
- Torta casera

**Cena típica**:
- Pizza casera
- Tortilla de papas
- Revuelto gramajo
- Fideos con tuco

### 5. Lista de Compras Organizada por Comercios

- **Verdulería**: Verduras frescas, frutas, papas
- **Carnicería**: Cortes argentinos específicos (nalga, roast beef, asado)
- **Almacén/Chino**: Productos secos, yerba mate
- **Panadería**: Pan francés, facturas
- **Fiambrería**: Quesos, fiambres

## 🚀 Próximos Pasos

1. **Testing en producción**: Verificar generación de recetas con API de Gemini
2. **Base de datos**: Resolver problema de esquema con columna 'is_public'
3. **Guardar planes**: Implementar guardado en Supabase
4. **Feedback de usuarios**: Sistema para mejorar sugerencias

## 📝 Notas de Desarrollo

- El sistema detecta automáticamente la estación según la fecha
- El presupuesto se adapta a pesos argentinos (ARS)
- Las recetas respetan restricciones dietéticas manteniendo autenticidad
- Los nombres de platos NO se traducen (milanesas, no "escalopes")