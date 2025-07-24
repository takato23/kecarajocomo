# 🎯 KeCarajoComer - Plan Maestro de Desarrollo

## 📋 Estado Actual (Enero 2025)

### ✅ Lo que funciona bien:
- **Base de datos robusta** con esquema Prisma bien diseñado
- **Sistema de autenticación** completo con Supabase
- **Gestión de perfiles** con preferencias detalladas
- **Backend sólido** con API routes bien organizadas
- **Integraciones de IA** funcionales (Gemini + Claude)
- **Sistema de despensa** con OCR y escaneo de códigos
- **Planificador de comidas** con generación por IA

### ⚠️ Problemas críticos identificados:
1. **UI fragmentada**: 5+ versiones de dashboards, planificadores y navegación
2. **Sistema de voz duplicado**: 3 implementaciones paralelas
3. **Deuda técnica**: Build errors suprimidos, archivos .bak
4. **Inconsistencia de UX**: Diferentes experiencias en cada sección

## 🏗️ Arquitectura Unificada

### 1. Sistema de Diseño Único
```
/src/design-system/
├── tokens/           # Colores, espaciados, tipografía
├── components/       # Componentes base reutilizables
├── layouts/          # Layouts consistentes
└── patterns/         # Patrones de UI comunes
```

### 2. Servicios Centralizados
```
/src/services/
├── voice/            # Sistema único de voz
├── ai/               # Abstracción para Gemini/Claude
├── storage/          # Gestión de archivos/imágenes
├── notifications/    # Sistema unificado de notificaciones
└── analytics/        # Tracking y métricas
```

### 3. Stores Consistentes
```
/src/stores/
├── auth.ts           # Estado de autenticación
├── user.ts           # Perfil y preferencias
├── pantry.ts         # Estado de despensa
├── planner.ts        # Estado del planificador
├── shopping.ts       # Lista de compras
└── ui.ts             # Estado de UI global
```

## 🛣️ Roadmap de Implementación

### Fase 1: Limpieza y Consolidación (2-3 semanas)
**Objetivo**: Eliminar duplicación y establecer bases sólidas

#### Semana 1-2: UI Unificada
- [ ] Auditoría completa de componentes duplicados
- [ ] Seleccionar UN sistema de diseño (recomendado: ModernDashboard)
- [ ] Crear design tokens y componentes base
- [ ] Migrar navegación a un sistema único
- [ ] Eliminar todos los componentes .bak y duplicados

#### Semana 3: Sistema de Voz Unificado
- [ ] Refactorizar todos los VoiceInput para usar useVoiceRecognition
- [ ] Crear componente VoiceInput único y configurable
- [ ] Implementar en todas las áreas que requieren voz
- [ ] Tests de compatibilidad cross-browser

### Fase 2: Funcionalidades Core (4-6 semanas)
**Objetivo**: Perfeccionar las funcionalidades principales

#### Semana 4-5: Dashboard Inteligente
- [ ] Dashboard único responsive con widgets configurables
- [ ] Vista rápida de: despensa, plan semanal, lista de compras
- [ ] Acciones rápidas con voz
- [ ] Notificaciones integradas

#### Semana 6-7: Despensa Mejorada
- [ ] UI consistente con el nuevo diseño
- [ ] Mejorar precisión del OCR
- [ ] Categorización automática de productos
- [ ] Alertas de caducidad inteligentes
- [ ] Sugerencias basadas en inventario

#### Semana 8-9: Planificador Revolucionario
- [ ] Drag & drop mejorado
- [ ] Vista calendario/lista/kanban
- [ ] Generación de planes con restricciones complejas
- [ ] Integración con calendario externo
- [ ] Modo offline

### Fase 3: Funcionalidades Avanzadas (4-6 semanas)
**Objetivo**: Diferenciación y valor agregado

#### Semana 10-11: Asistente de Cocina 2.0
- [ ] Control por voz completo
- [ ] Modo manos libres
- [ ] Timers inteligentes
- [ ] Video tutoriales integrados
- [ ] Substitución automática de ingredientes

#### Semana 12-13: Optimización de Compras
- [ ] Comparación de precios en tiempo real
- [ ] Rutas optimizadas en supermercado
- [ ] Integración con apps de delivery
- [ ] Presupuesto inteligente
- [ ] Historial y análisis de gastos

#### Semana 14-15: Social y Gamificación
- [ ] Compartir recetas y planes
- [ ] Desafíos familiares/grupales
- [ ] Sistema de logros significativo
- [ ] Recetas comunitarias
- [ ] Rankings y competencias

### Fase 4: Pulido y Lanzamiento (2-3 semanas)
**Objetivo**: Calidad producción

#### Semana 16-17: Performance y Testing
- [ ] Optimización de bundle size
- [ ] Testing E2E completo
- [ ] Auditoría de accesibilidad
- [ ] Optimización de SEO
- [ ] PWA completa con offline

#### Semana 18: Lanzamiento
- [ ] Documentación de usuario
- [ ] Videos tutoriales
- [ ] Landing page
- [ ] Analytics y monitoring
- [ ] Plan de marketing

## 📏 Estándares de Consistencia

### 1. Principios de Diseño
- **Mobile First**: Toda funcionalidad debe ser usable en móvil
- **Accesibilidad**: WCAG 2.1 AA mínimo
- **Performance**: LCP < 2.5s, FID < 100ms
- **Offline First**: Funcionalidades core sin conexión

### 2. Patrones de Código
```typescript
// ✅ Patrón correcto para componentes
export const FeatureComponent = () => {
  const { data, isLoading } = useFeatureData();
  const { speak, isListening } = useVoiceRecognition();
  
  if (isLoading) return <FeatureSkeleton />;
  
  return (
    <FeatureLayout>
      <VoiceInput onResult={handleVoiceResult} />
      {/* Contenido */}
    </FeatureLayout>
  );
};
```

### 3. Integración de Voz Obligatoria
Toda funcionalidad que involucre input de texto DEBE tener opción de voz:
- Búsquedas
- Formularios de añadir items
- Navegación
- Comandos de acción

### 4. Sistema de Notificaciones
```typescript
// Usar servicio centralizado
import { notify } from '@/services/notifications';

// ❌ No crear sistemas propios
toast.success('...');  // NO

// ✅ Usar sistema unificado
notify.success('Item añadido', { 
  voice: true,  // Opcional: también hablar
  vibrate: true // Opcional: vibración móvil
});
```

### 5. Estados de Carga Consistentes
```typescript
// Siempre usar skeletons, nunca spinners solos
import { PantrySkeleton } from '@/design-system/skeletons';
```

## 🎨 Decisiones de Diseño

### Paleta de Colores
```scss
// Brand
$primary: #FF6B35;    // Naranja vibrante
$secondary: #4ECDC4;  // Turquesa fresco
$accent: #FFE66D;     // Amarillo cálido

// Neutral
$gray-900: #1A1A1A;
$gray-700: #4A4A4A;
$gray-500: #7A7A7A;
$gray-300: #AAAAAA;
$gray-100: #F5F5F5;

// Semantic
$success: #06D6A0;
$warning: #FFD166;
$error: #EF476F;
$info: #118AB2;
```

### Tipografía
```scss
// Headings: Inter
// Body: Inter
// Mono: JetBrains Mono

$font-sizes: (
  'xs': 0.75rem,   // 12px
  'sm': 0.875rem,  // 14px
  'base': 1rem,    // 16px
  'lg': 1.125rem,  // 18px
  'xl': 1.25rem,   // 20px
  '2xl': 1.5rem,   // 24px
  '3xl': 1.875rem, // 30px
  '4xl': 2.25rem,  // 36px
);
```

### Componentes Base
1. **Button**: Primary, Secondary, Ghost, Icon
2. **Input**: Text, Number, Select, Textarea (todos con VoiceInput)
3. **Card**: Default, Interactive, Draggable
4. **Modal**: Standard, Fullscreen (mobile), Drawer
5. **Navigation**: Tab bar (mobile), Sidebar (desktop)
6. **Feedback**: Toast, Alert, Progress, Skeleton

## 🚀 Métricas de Éxito

### Técnicas
- [ ] 0 errores de TypeScript/ESLint
- [ ] 90%+ cobertura de tests
- [ ] Bundle size < 200KB (initial)
- [ ] Lighthouse score > 90

### Usuario
- [ ] Tiempo para añadir item < 3 segundos
- [ ] Tiempo para generar plan semanal < 10 segundos
- [ ] NPS > 50
- [ ] Retención D7 > 40%

### Negocio
- [ ] 10K usuarios activos mensuales
- [ ] 50K recetas generadas/mes
- [ ] 5% conversión a premium

## 🔄 Proceso de Desarrollo

### 1. Feature Development Flow
```
1. Design → Figma mockup siguiendo design system
2. Tech spec → Documento técnico con API design
3. Implementation → TDD con tests primero
4. Review → Code review + design review
5. QA → Testing manual + automatizado
6. Deploy → Feature flags para rollout gradual
```

### 2. Git Flow
```
main
├── develop
│   ├── feature/unified-voice
│   ├── feature/modern-dashboard
│   └── fix/typescript-errors
└── release/v1.0
```

### 3. CI/CD Pipeline
```yaml
- Lint & Type check
- Unit tests
- Integration tests  
- Build
- Lighthouse CI
- Deploy to staging
- E2E tests
- Deploy to production
```

## 📝 Notas para Continuidad

### Si se pierde contexto:
1. Este documento es la fuente de verdad
2. Comenzar siempre por leer `/docs/MASTER_PLAN.md`
3. Verificar fase actual en `/docs/PROGRESS.md`
4. Los estándares son NO negociables

### Prioridades absolutas:
1. **Consistencia > Funcionalidades nuevas**
2. **Mobile experience > Desktop**
3. **Performance > Estética**
4. **Accesibilidad > Conveniencia**

### Recursos clave:
- Figma: [Link al design system]
- Storybook: [Link a componentes]
- Docs API: [Link a documentación]
- Analytics: [Link a dashboard]

---

**Última actualización**: Enero 2025
**Próxima revisión**: Febrero 2025
**Owner**: Equipo KeCarajoComer