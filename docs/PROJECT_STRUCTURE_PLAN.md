# Plan de Reorganización del Proyecto

## Problema Actual
El proyecto tiene archivos dispersos por todas partes:
- 22+ repositorios clonados como training data
- Archivos de configuración mezclados con código
- Documentación dispersa
- Sin estructura clara de carpetas

## Estructura Propuesta

```
kecarajocomer/
├── src/                          # Código fuente principal
│   ├── app/                      # Next.js App Router
│   ├── components/               # Componentes React
│   ├── features/                 # Features modulares
│   ├── lib/                      # Utilities y servicios
│   ├── hooks/                    # Custom hooks
│   ├── stores/                   # Estado global (Zustand)
│   ├── types/                    # TypeScript types
│   └── styles/                   # Estilos globales
├── public/                       # Assets estáticos
├── docs/                         # Documentación del proyecto
├── scripts/                      # Scripts de setup/deployment
├── tests/                        # Tests (renombrar __tests__)
├── .config/                      # Archivos de configuración
├── .github/                      # GitHub workflows
├── training-data/                # Data para entrenar GPT (separado)
└── [archivos raíz necesarios]    # package.json, next.config.js, etc.
```

## Archivos a Mover

### 1. Código Fuente → src/
- app/ → src/app/
- components/ → src/components/
- features/ → src/features/
- lib/ → src/lib/
- hooks/ → src/hooks/
- stores/ → src/stores/
- types/ → src/types/
- styles/ → src/styles/

### 2. Tests → tests/
- __tests__/ → tests/

### 3. Configuración → .config/
- jest.config.js
- playwright.config.ts
- postcss.config.js
- tailwind.config.js
- lighthouserc.js
- vitest.config.ts

### 4. Training Data → training-data/
- aws-cdk/
- nextjs/
- react-docs/
- [22+ repos] → training-data/repos/
- training_data/ → training-data/processed/
- *.py scripts → training-data/scripts/

### 5. Documentación → docs/
- Todos los .md de la raíz
- docs/ existente se mantiene

## Acciones Inmediatas

1. **Crear estructura src/**
2. **Mover archivos de código**
3. **Actualizar imports**
4. **Mover configuraciones**
5. **Limpiar training data**
6. **Actualizar package.json paths**

## Beneficios

- **Claridad**: Estructura estándar de Next.js
- **Mantenibilidad**: Separación clara de responsabilidades  
- **Escalabilidad**: Fácil agregar nuevos features
- **DX**: Mejor experiencia de desarrollo
- **Build**: Builds más rápidos sin archivos innecesarios