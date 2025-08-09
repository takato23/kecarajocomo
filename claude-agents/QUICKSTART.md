# ⚡ SuperClaude Agents - Quick Start

**Empieza a usar los agentes en 30 segundos**

---

## 🚀 INSTALACIÓN EXPRESS

```bash
# 1. Ejecuta el instalador
cd superclaude-agents/
./install.sh

# 2. Reinicia terminal o ejecuta:
source ~/.bashrc

# 3. ¡Listo! Los agentes están activos
```

---

## 🎯 PRUEBA INMEDIATA

### Copia y Pega - Método Más Rápido

Simplemente **copia el contenido completo** de cualquier agente y pégalo en tu chat con Claude:

1. **Architect Agent**: [Copia architect-agent.md](./architect-agent.md)
2. **Performance Agent**: [Copia performance-agent.md](./performance-agent.md)  
3. **Security Agent**: [Copia security-agent.md](./security-agent.md)
4. **QA Agent**: [Copia qa-agent.md](./qa-agent.md)
5. **DevOps Agent**: [Copia devops-agent.md](./devops-agent.md)

### Auto-Activación por Keywords

Los agentes se activan automáticamente:

```bash
# Escribe en Claude y el agente se activará:
"Necesito diseñar arquitectura de microservicios"     → 🏗️ Architect
"Mi API está lenta, necesito optimizar"              → ⚡ Performance  
"Quiero hacer security audit"                        → 🛡️ Security
"Necesito estrategia de testing"                     → 🧪 QA
"Configurar CI/CD deployment"                        → 🚀 DevOps
```

---

## 🎭 EJEMPLOS RÁPIDOS

### 🏗️ Architect Agent
```
Tu pregunta: "Diseñar sistema de chat en tiempo real para 100K usuarios"

Respuesta esperada:
- Análisis de requirements
- Architecture pattern recomendado
- Technology stack específico
- Scalability strategy
- Implementation roadmap
```

### ⚡ Performance Agent  
```
Tu pregunta: "API tarda 3 segundos en responder"

Respuesta esperada:
- Profiling methodology
- Bottleneck identification checklist
- Quick wins optimization
- Load testing plan
- Monitoring setup
```

### 🛡️ Security Agent
```
Tu pregunta: "Audit de seguridad para compliance SOC2"

Respuesta esperada:
- Security posture assessment
- Compliance gap analysis
- Risk prioritization matrix
- Implementation roadmap
- Documentation templates
```

---

## 📋 COMANDOS ESENCIALES

### Si instalaste con script:
```bash
# Activación directa
architect "Tu consulta de arquitectura"
performance "Tu problema de performance"  
security "Tu pregunta de seguridad"
qa "Tu consulta de testing"
devops "Tu pregunta de DevOps"

# Con Claude CLI
claude --agent architect "Tu consulta"
```

### Si usas copy-paste:
1. Copia contenido del agente
2. Pega en Claude 
3. Añade tu pregunta específica

---

## 🎯 PRIMER TEST

**Prueba esto ahora mismo:**

1. Copia el contenido de `architect-agent.md`
2. Pégalo en Claude
3. Añade: *"Diseña arquitectura para app de delivery como Uber Eats"*
4. ¡Observa la magia! 🪄

**Deberías recibir:**
- System architecture diagram
- Microservices breakdown
- Technology recommendations  
- Scalability considerations
- Implementation phases

---

## 🔧 ¿NO FUNCIONA?

### Problema: "Agente no se activa"
```bash
# Solución: Activación manual
claude --context ~/.claude/agents/architect-agent.md "Tu pregunta"
```

### Problema: "Scripts no encontrados"  
```bash
# Solución: Añadir al PATH
echo 'export PATH="$PATH:~/.claude/scripts"' >> ~/.bashrc
source ~/.bashrc
```

### Problema: "Respuesta genérica"
```bash
# Solución: Más contexto específico
❌ "Optimiza mi código"
✅ "Performance agent: Optimizar API Node.js con PostgreSQL para 10K RPS"
```

---

## 🚀 SIGUIENTES PASOS

1. **Lee la guía completa**: [USAGE.md](./USAGE.md)
2. **Explora cada agente**: Revisa los .md individuales
3. **Personaliza**: Edita `~/.claude/superclaude-config.yaml`
4. **Contribuye**: Mejora los agentes para tu contexto

---

**⚡ En 30 segundos tienes un equipo senior completo. ¡Empezar nunca fue tan fácil!** ✨