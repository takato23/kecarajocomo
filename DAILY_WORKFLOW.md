# 🔄 KeCarajoComer - Flujo de Trabajo Diario

## 📅 Rutina Diaria de Desarrollo

### 🌅 Morning Setup (10 min)
1. **Revisar el roadmap**: `PROJECT_ROADMAP.md`
2. **Checkear estado actual**: Ver fase en la que estamos
3. **Leer tareas pendientes**: TodoWrite del día anterior
4. **Identificar prioridad del día**: Basado en criterios de fase actual

### 🎯 Work Session Structure

#### Antes de Empezar Cualquier Tarea:
```bash
# 1. Revisar contexto
cat PROJECT_ROADMAP.md | head -20

# 2. Ver estado actual de todos
git status

# 3. Verificar que estamos en la rama correcta
git branch --show-current

# 4. Verificar el build funciona
npm run build
```

#### Durante el Desarrollo:
- ✅ **Mantener TodoWrite actualizado** en tiempo real
- ✅ **Documentar decisiones técnicas** importantes
- ✅ **Hacer commits frecuentes** con mensajes descriptivos
- ✅ **Testear cambios** antes de marcar como completo

#### Al Completar una Tarea:
1. **Verificar criterios de completado** del roadmap
2. **Actualizar TodoWrite** → status: "completed"
3. **Hacer commit** con mensaje claro
4. **Actualizar roadmap** si es necesario
5. **Documentar** cualquier aprendizaje o decisión importante

### 🚫 EVITAR a Toda Costa:

#### Context Loss Prevention:
- ❌ **NO empezar sin revisar roadmap**
- ❌ **NO hacer cambios sin documentar**
- ❌ **NO proceder sin criterios claros**
- ❌ **NO ignorar errores de build/lint**
- ❌ **NO trabajar en múltiples features a la vez**

#### Focus Maintenance:
- ❌ **NO context switching** sin necesidad
- ❌ **NO rabbit holes** - mantener scope limitado
- ❌ **NO premature optimization** - seguir prioridades
- ❌ **NO feature creep** - completar fase actual primero

---

## 📊 Estado Tracking System

### Fase Actual: **FASE 1 - CORRECCIONES CRÍTICAS**
**Objetivo**: Vulnerabilidades críticas de seguridad resueltas  
**Timeline**: 1-2 semanas  
**Criterio de Completado**: Security score A+, build limpio, auth funcionando

### Tareas de Hoy:
```markdown
[ ] Revisar y actualizar este tracking
[ ] Identificar tarea prioritaria de Fase 1
[ ] Completar 1-2 tareas críticas
[ ] Actualizar roadmap con progreso
```

### Quick Status Check:
```bash
# Ver progreso actual
echo "=== KECARAJOCOMER STATUS ==="
echo "Fase: 1 - Correcciones Críticas"
echo "Prioridad: Seguridad"
echo "Build Status: ❌ (ignoring errors)"
echo "Auth Status: ❌ (disabled in prod)"
echo "API Keys: ❌ (exposed to client)"
echo "Next Action: Fix API key exposure"
```

### Daily Questions:
1. **¿Qué fase estamos?** Fase 1 - Correcciones Críticas  
2. **¿Cuál es la prioridad de hoy?** Mover claves de API al servidor
3. **¿Qué criterio vamos a completar?** Security vulnerabilities fixed
4. **¿Cómo sabemos que terminamos?** No more client-exposed API keys

---

## 🛠️ Comandos Útiles de Context

### Project Overview Quick:
```bash
# Ver estructura del proyecto
tree -I 'node_modules|.next|.git' -L 3

# Ver métricas de código
find src -name "*.ts" -o -name "*.tsx" | wc -l

# Ver estado de build
npm run build 2>&1 | tail -10
```

### Security Check:
```bash
# Buscar claves expuestas
grep -r "NEXT_PUBLIC_.*API" src/ --include="*.ts" --include="*.tsx"

# Ver middleware activo
cat src/middleware.ts | grep -A 5 -B 5 "middleware"
```

### Performance Check:
```bash
# Bundle size check
du -sh .next/static/chunks/

# Ver warnings de build
npm run build 2>&1 | grep -i warning
```

---

## 📝 Decision Log Template

### Cuando tomes una decisión técnica importante:

```markdown
## Decision: [Título de la decisión]
**Date**: [Fecha]
**Context**: [Por qué necesitamos decidir esto]
**Decision**: [Qué decidimos hacer]
**Rationale**: [Por qué elegimos esta opción]
**Consequences**: [Qué implica esta decisión]
**Implementation**: [Pasos específicos]
```

### Ejemplo:
```markdown
## Decision: Move AI API Keys to Server-Side
**Date**: July 25, 2025
**Context**: API keys exposed via NEXT_PUBLIC_ variables - critical security issue
**Decision**: Create /api/ai/proxy endpoints, move all keys server-side
**Rationale**: Client-exposed keys can be abused, cost us money, security risk
**Consequences**: Need to refactor all AI service calls to use proxy
**Implementation**: 
1. Create /api/ai/proxy/route.ts
2. Update UnifiedAIService to call proxy
3. Remove NEXT_PUBLIC_ versions of keys
4. Test all AI functionality still works
```

---

## 🎯 Daily Success Criteria

### End of Day Questions:
1. **¿Completé al menos 1 tarea del roadmap?**
2. **¿Actualicé el estado de mis todos?**
3. **¿Documenté decisiones importantes?**
4. **¿El build sigue funcionando?**
5. **¿Estoy más cerca de completar la fase actual?**

### Red Flags - Stop and Reassess:
- 🚨 **Build roto por más de 30 min**
- 🚨 **Trabajando en algo no relacionado con fase actual**
- 🚨 **No he actualizado todos en 2+ horas**
- 🚨 **Perdí el contexto de lo que estaba haciendo**
- 🚨 **Llevamos >1 día en una sola tarea**

### Green Lights - Keep Going:
- ✅ **Tareas se completan en <1 día**
- ✅ **Build funciona y tests pasan**
- ✅ **Progreso visible hacia criterios de fase**
- ✅ **Documentación actualizada**
- ✅ **Contexto claro en todo momento**

---

## 📞 Escalation Protocol

### Si te sientes perdido:
1. **STOP** - Para lo que estás haciendo
2. **READ** - Revisa PROJECT_ROADMAP.md completo
3. **ASSESS** - ¿En qué fase estamos? ¿Cuál es la prioridad?
4. **PLAN** - Identifica la próxima tarea más pequeña posible
5. **DO** - Ejecuta esa tarea pequeña hasta completarla
6. **REPEAT** - Vuelve al flujo normal

### Si una tarea está tomando demasiado tiempo:
1. **Break it down** - Divide en subtareas más pequeñas
2. **Document blocker** - ¿Qué específicamente está bloqueando?
3. **Seek help** - Research, documentation, o ask for assistance
4. **Re-scope** - ¿Es realmente necesaria para esta fase?

### Mantener Momentum:
- 🎯 **Focus on one thing at a time**
- 📝 **Document as you go**
- ✅ **Celebrate small wins**
- 🔄 **Regular breaks to reassess**
- 📊 **Track progress visibly**

---

**Last Updated**: July 25, 2025  
**Next Review**: Daily before starting work  
**Owner**: Development Team