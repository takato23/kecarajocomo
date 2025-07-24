#!/bin/bash

# 🚀 Script de Setup Autónomo - KeCarajoComér v2.0
# Este script configura todo el proyecto de manera autónoma

set -e # Salir si hay errores

echo "🎯 Iniciando setup autónomo de KeCarajoComér..."

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Función para logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

# 1. VERIFICAR PREREQUISITOS
log "Verificando prerequisitos..."

command -v node >/dev/null 2>&1 || error "Node.js no está instalado"
command -v npm >/dev/null 2>&1 || error "npm no está instalado"
command -v git >/dev/null 2>&1 || error "git no está instalado"

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    error "Node.js versión 18 o superior es requerida"
fi

success "Prerequisitos verificados"

# 2. SETUP DEL PROYECTO
log "Configurando estructura del proyecto..."

# Instalar dependencias principales
npm install

# Instalar dependencias de desarrollo
npm install -D \
    @types/react @types/node \
    eslint prettier \
    @typescript-eslint/parser @typescript-eslint/eslint-plugin \
    eslint-config-next eslint-config-prettier \
    husky lint-staged \
    @testing-library/react @testing-library/jest-dom \
    @playwright/test \
    vitest @vitest/ui

# Instalar dependencias del proyecto
npm install \
    @supabase/supabase-js @supabase/auth-helpers-nextjs \
    @tanstack/react-query @tanstack/react-query-devtools \
    zustand immer \
    framer-motion \
    react-hook-form @hookform/resolvers zod \
    @radix-ui/react-dialog @radix-ui/react-dropdown-menu \
    @radix-ui/react-tabs @radix-ui/react-toast \
    lucide-react \
    recharts \
    react-dropzone \
    date-fns \
    openai \
    tesseract.js \
    @tensorflow/tfjs \
    sharp \
    sonner

success "Dependencias instaladas"

# 3. CONFIGURAR SUPABASE
log "Configurando Supabase..."

if [ ! -f ".env.local" ]; then
    cat > .env.local << EOF
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF
    
    echo -e "${YELLOW}⚠️  Por favor, actualiza .env.local con tus credenciales${NC}"
fi

# Inicializar Supabase si no existe
if [ ! -d "supabase" ]; then
    npx supabase init
fi

success "Supabase configurado"

# 4. CREAR ESTRUCTURA DE CARPETAS
log "Creando estructura de carpetas..."

directories=(
    "src/app/(auth)"
    "src/app/(dashboard)"
    "src/app/api/ai"
    "src/app/api/scanner"
    "src/app/api/planner"
    "src/components/ui"
    "src/components/features/scanner"
    "src/components/features/pantry"
    "src/components/features/planner"
    "src/components/features/shopping"
    "src/components/layouts"
    "src/services/ai"
    "src/services/database"
    "src/services/scanner"
    "src/services/planner"
    "src/stores"
    "src/hooks"
    "src/utils"
    "src/types"
    "src/lib"
    "public/images"
    "public/fonts"
    "tests/unit"
    "tests/integration"
    "tests/e2e"
    "scripts"
    "docs"
)

for dir in "${directories[@]}"; do
    mkdir -p "$dir"
done

success "Estructura de carpetas creada"

# 5. CREAR ARCHIVOS DE CONFIGURACIÓN
log "Creando archivos de configuración..."

# TypeScript config
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
EOF

# ESLint config
cat > .eslintrc.json << 'EOF'
{
  "extends": [
    "next/core-web-vitals",
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
EOF

# Prettier config
cat > .prettierrc << 'EOF'
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 80,
  "bracketSpacing": true,
  "arrowParens": "avoid"
}
EOF

# Tailwind config update
cat > tailwind.config.ts << 'EOF'
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'ios-glass': 'rgba(255, 255, 255, 0.1)',
        'ios-border': 'rgba(255, 255, 255, 0.18)',
      },
      backdropBlur: {
        'xs': '2px',
        '3xl': '64px',
      },
      animation: {
        'blob': 'blob 7s infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        blob: {
          '0%': {
            transform: 'translate(0px, 0px) scale(1)',
          },
          '33%': {
            transform: 'translate(30px, -50px) scale(1.1)',
          },
          '66%': {
            transform: 'translate(-20px, 20px) scale(0.9)',
          },
          '100%': {
            transform: 'translate(0px, 0px) scale(1)',
          },
        },
        glow: {
          '0%': {
            boxShadow: '0 0 5px rgba(255, 255, 255, 0.2), 0 0 20px rgba(255, 255, 255, 0.2)',
          },
          '100%': {
            boxShadow: '0 0 10px rgba(255, 255, 255, 0.4), 0 0 30px rgba(255, 255, 255, 0.4)',
          },
        },
      },
    },
  },
  plugins: [],
}
export default config
EOF

success "Archivos de configuración creados"

# 6. CONFIGURAR GIT HOOKS
log "Configurando Git hooks..."

npx husky install

# Pre-commit hook
npx husky add .husky/pre-commit "npm run lint-staged"

# Lint-staged config
cat > .lintstagedrc.json << 'EOF'
{
  "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{json,md}": ["prettier --write"]
}
EOF

success "Git hooks configurados"

# 7. CREAR MIGRACIONES DE BASE DE DATOS
log "Creando migraciones de base de datos..."

mkdir -p supabase/migrations

cat > supabase/migrations/001_initial_schema.sql << 'EOF'
-- Crear las tablas principales del sistema holístico
-- (El contenido completo está en AUTONOMOUS_IMPLEMENTATION_PLAN.md)

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Tabla de perfiles de usuario
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Más tablas según el plan...
EOF

success "Migraciones creadas"

# 8. CREAR SCRIPTS DE UTILIDAD
log "Creando scripts de utilidad..."

# Script de desarrollo
cat > package.json << 'EOF'
{
  "name": "kecarajocomer",
  "version": "2.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "format": "prettier --write .",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test",
    "test:all": "npm run test && npm run test:e2e",
    "db:migrate": "supabase db push",
    "db:reset": "supabase db reset",
    "analyze": "ANALYZE=true next build",
    "dev:autonomous": "node scripts/autonomous-dev.js",
    "deploy:smart": "node scripts/smart-deploy.js",
    "monitor:live": "node scripts/live-monitor.js"
  }
}
EOF

# Script de desarrollo autónomo
cat > scripts/autonomous-dev.js << 'EOF'
#!/usr/bin/env node

const { spawn } = require('child_process');
const chalk = require('chalk');

console.log(chalk.blue('🤖 Iniciando desarrollo autónomo...'));

// Iniciar servicios en paralelo
const services = [
  { name: 'Next.js', command: 'npm', args: ['run', 'dev'] },
  { name: 'Supabase', command: 'supabase', args: ['start'] },
  { name: 'TypeScript', command: 'tsc', args: ['--watch'] }
];

services.forEach(service => {
  const proc = spawn(service.command, service.args, { stdio: 'inherit' });
  console.log(chalk.green(`✓ ${service.name} iniciado`));
});
EOF

chmod +x scripts/autonomous-dev.js

success "Scripts creados"

# 9. CREAR COMPONENTES BASE
log "Creando componentes base..."

# Crear componente iOS26Button base
cat > src/components/ui/iOS26Button.tsx << 'EOF'
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface iOS26ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'elevated' | 'flat' | 'outlined' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export function iOS26Button({
  variant = 'elevated',
  size = 'md',
  loading = false,
  icon,
  className,
  children,
  ...props
}: iOS26ButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      className={cn(
        'relative overflow-hidden backdrop-blur-xl',
        'border border-white/10 rounded-2xl',
        'transition-all duration-300',
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}
EOF

success "Componentes base creados"

# 10. RESUMEN FINAL
echo ""
echo "================================================"
echo -e "${GREEN}✅ Setup autónomo completado exitosamente!${NC}"
echo "================================================"
echo ""
echo "Próximos pasos:"
echo "1. Actualiza las variables de entorno en .env.local"
echo "2. Ejecuta las migraciones: npm run db:migrate"
echo "3. Inicia el desarrollo: npm run dev:autonomous"
echo ""
echo -e "${YELLOW}📚 Documentación disponible en /docs${NC}"
echo -e "${BLUE}🚀 ¡Listo para desarrollar!${NC}"