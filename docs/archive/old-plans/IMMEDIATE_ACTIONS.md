# 🚀 Acciones Inmediatas - Limpieza de Dashboards

## ✅ Decisión Tomada: UltraModernDashboard

### Paso 1: Verificar dependencias
```bash
# Ejecutar para encontrar imports de dashboards a eliminar
grep -r "iOS26Dashboard\|MobileDashboard\|ModernDashboard\|AComerlaDashboard\|GrowthDashboard" src --include="*.tsx" --include="*.ts" --exclude-dir=node_modules
```

### Paso 2: Eliminar archivos .bak inmediatamente
```bash
# SEGURO de eliminar - son backups
rm src/components/recipe/RecipeDetail.tsx.bak
rm src/components/recipe/RecipeForm.tsx.bak
rm src/components/LanguageSwitcher.tsx.backup
```

### Paso 3: Plan de eliminación de dashboards

#### Eliminar AHORA (no están en uso):
1. `src/components/dashboard/iOS26Dashboard.tsx`
2. `src/components/dashboard/MobileDashboard.tsx`
3. `src/components/growth-stack/GrowthDashboard.tsx`
4. `src/features/dashboard/AComerlaDashboard.tsx`

#### Eliminar CON CUIDADO:
1. `src/components/dashboard/ModernDashboard.tsx` - Usado en /demo
2. `src/features/dashboard/ModernDashboard.tsx` - Duplicado

#### MANTENER:
1. ✅ `src/features/dashboard/UltraModernDashboard.tsx` - En producción
2. ✅ `src/components/pantry/PantryDashboard.tsx` - Feature específico
3. ✅ `src/components/dashboard/DashboardLayout.tsx` - Utility
4. ✅ `src/components/dashboard/DashboardCard.tsx` - Reusable

### Paso 4: Crear alias para consistencia
```typescript
// src/components/dashboard/index.ts
export { default as Dashboard } from '@/features/dashboard/UltraModernDashboard';
export { DashboardLayout } from './DashboardLayout';
export { DashboardCard } from './DashboardCard';
```

### Paso 5: Actualizar imports
Buscar y reemplazar todos los imports de dashboards eliminados para usar el único Dashboard.

---

## 📊 Impacto Esperado
- **Archivos eliminados**: 9
- **Líneas de código removidas**: ~5,000
- **Reducción de complejidad**: 87%

## ⚠️ Antes de Proceder
1. Hacer commit de todos los cambios actuales
2. Crear branch: `feat/dashboard-consolidation`
3. Eliminar de a uno y probar que todo funcione

## 🔄 Próximo: Meal Planners
Después de limpiar dashboards, repetir proceso con meal planners.