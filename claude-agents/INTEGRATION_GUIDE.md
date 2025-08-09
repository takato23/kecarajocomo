# Guía de Integración - SuperClaude Agents en KeCarajoComer

Esta guía explica cómo utilizar los agentes especializados de SuperClaude en el contexto específico del proyecto KeCarajoComer.

## Stack Tecnológico del Proyecto

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, Framer Motion, Glassmorphism
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Testing**: Jest, Playwright, Testing Library
- **AI**: Gemini API, Claude API
- **Deployment**: Vercel

## Casos de Uso por Agente

### 🏗️ Architect Agent - Casos Específicos

**Meal Planning Architecture**:
```bash
claude --context claude-agents/architect-agent.md "Diseñar arquitectura para sistema de meal planning con generación de listas de compras automáticas usando Supabase y Gemini AI"
```

**Recipe System Scalability**:
```bash
claude --context claude-agents/architect-agent.md "Optimizar arquitectura para manejar 100K+ recetas con búsqueda en tiempo real y recomendaciones personalizadas"
```

### ⚡ Performance Agent - Optimizaciones

**API Performance**:
```bash
claude --context claude-agents/performance-agent.md "Optimizar performance de APIs de Supabase para meal planning con 10K usuarios concurrentes"
```

**Frontend Performance**:
```bash
claude --context claude-agents/performance-agent.md "Analizar y optimizar Core Web Vitals para aplicación Next.js con componentes glassmorphism pesados"
```

### 🛡️ Security Agent - Seguridad

**Supabase Security**:
```bash
claude --context claude-agents/security-agent.md "Implementar Row Level Security (RLS) para meal plans y datos de pantry en Supabase"
```

**API Security**:
```bash
claude --context claude-agents/security-agent.md "Audit de seguridad para APIs de generación de recetas con Gemini AI"
```

### 🧪 QA Agent - Testing

**E2E Testing Strategy**:
```bash
claude --context claude-agents/qa-agent.md "Diseñar estrategia de testing E2E para flujo completo de meal planning con Playwright"
```

**Component Testing**:
```bash
claude --context claude-agents/qa-agent.md "Implementar testing para componentes React con glassmorphism y Framer Motion"
```

### 🚀 DevOps Agent - Deployment

**Vercel Optimization**:
```bash
claude --context claude-agents/devops-agent.md "Optimizar deployment en Vercel para aplicación Next.js con Supabase backend"
```

**Monitoring Setup**:
```bash
claude --context claude-agents/devops-agent.md "Configurar monitoring y observabilidad para meal planning app en producción"
```

## Workflows Combinados

### 1. Feature Development Completo

```bash
# 1. Arquitectura (Architect Agent)
claude --context claude-agents/architect-agent.md "Diseñar feature de shopping list inteligente con categorización automática"

# 2. Performance Planning (Performance Agent)  
claude --context claude-agents/performance-agent.md "Definir performance budgets para shopping list con 1000+ items"

# 3. Security Review (Security Agent)
claude --context claude-agents/security-agent.md "Review de seguridad para sharing de shopping lists entre usuarios"

# 4. Testing Strategy (QA Agent)
claude --context claude-agents/qa-agent.md "Estrategia de testing para shopping list feature"

# 5. Deployment Plan (DevOps Agent)
claude --context claude-agents/devops-agent.md "Plan de deployment para shopping list feature"
```

### 2. Performance Optimization Sprint

```bash
# 1. Performance Analysis
claude --context claude-agents/performance-agent.md "Análisis completo de performance para KeCarajoComer dashboard"

# 2. Architecture Review
claude --context claude-agents/architect-agent.md "Review arquitectónico basado en findings de performance"

# 3. Testing Strategy
claude --context claude-agents/qa-agent.md "Testing plan para validar performance improvements"
```

## Prompts Contextualizados

### Para Meal Planning

**Architect Agent**:
- "Diseñar microservicios para meal planning con event sourcing"
- "Arquitectura para sincronización offline-first de meal plans"
- "Integration patterns para Gemini AI en meal planning"

**Performance Agent**:
- "Optimizar queries de Supabase para meal plan generation"
- "Performance testing para generación de meal plans en batch"
- "Caching strategy para recipes y meal suggestions"

### Para Recipe Management

**Security Agent**:
- "Implement content moderation para user-generated recipes"
- "Data privacy compliance para recipe sharing"
- "API rate limiting para recipe generation con AI"

**QA Agent**:
- "Testing strategy para AI-generated recipe validation"
- "Accessibility testing para recipe cards glassmorphism"
- "Performance testing para recipe search con 100K+ recipes"

## Mejores Prácticas

### 1. Contexto Específico
Siempre incluye detalles específicos del proyecto:
- Stack tecnológico actual
- Limitaciones de Supabase
- Requerimientos de performance
- Constraints de Vercel

### 2. Iteración Incremental
Usa los agentes en secuencia para refinar soluciones:
1. Architect → diseño inicial
2. Performance → validación de performance  
3. Security → review de seguridad
4. QA → testing strategy
5. DevOps → deployment plan

### 3. Cross-Agent Validation
Usa diferentes agentes para validar decisiones:
- Architect + Performance para decisiones de stack
- Security + DevOps para deployment security
- QA + Performance para testing strategy

## Auto-Activación en Contexto

Los agentes se activan automáticamente con estos keywords específicos del proyecto:

**Meal Planning Context**:
- "meal plan optimization" → Performance Agent
- "recipe architecture" → Architect Agent  
- "pantry security" → Security Agent
- "shopping list testing" → QA Agent

**AI Integration Context**:
- "Gemini API optimization" → Performance Agent
- "AI security audit" → Security Agent
- "AI testing strategy" → QA Agent

## Recursos Adicionales

- [QUICKSTART.md](./QUICKSTART.md) - Inicio rápido
- [USAGE.md](./USAGE.md) - Guía completa de uso
- [README.md](./README.md) - Overview de agentes