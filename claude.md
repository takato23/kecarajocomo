

  When analyzing large codebases or multiple files that might exceed context limits, use the Gemini CLI with its massive
  context window. Use `gemini -p` to leverage Google Gemini's large context capacity.

  ## File and Directory Inclusion Syntax

  Use the `@` syntax to include files and directories in your Gemini prompts. The paths should be relative to WHERE you run the
   gemini command:

  ### Examples:

  **Single file analysis:**
  ```bash
  gemini -p "@src/main.py Explain this file's purpose and structure"

  Multiple files:
  gemini -p "@package.json @src/index.js Analyze the dependencies used in the code"

  Entire directory:
  gemini -p "@src/ Summarize the architecture of this codebase"

  Multiple directories:
  gemini -p "@src/ @tests/ Analyze test coverage for the source code"

  Current directory and subdirectories:
  gemini -p "@./ Give me an overview of this entire project"
  
#
 Or use --all_files flag:
  gemini --all_files -p "Analyze the project structure and dependencies"

  Implementation Verification Examples

  Check if a feature is implemented:
  gemini -p "@src/ @lib/ Has dark mode been implemented in this codebase? Show me the relevant files and functions"

  Verify authentication implementation:
  gemini -p "@src/ @middleware/ Is JWT authentication implemented? List all auth-related endpoints and middleware"

  Check for specific patterns:
  gemini -p "@src/ Are there any React hooks that handle WebSocket connections? List them with file paths"

  Verify error handling:
  gemini -p "@src/ @api/ Is proper error handling implemented for all API endpoints? Show examples of try-catch blocks"

  Check for rate limiting:
  gemini -p "@backend/ @middleware/ Is rate limiting implemented for the API? Show the implementation details"

  Verify caching strategy:
  gemini -p "@src/ @lib/ @services/ Is Redis caching implemented? List all cache-related functions and their usage"

  Check for specific security measures:
  gemini -p "@src/ @api/ Are SQL injection protections implemented? Show how user inputs are sanitized"

  Verify test coverage for features:
  gemini -p "@src/payment/ @tests/ Is the payment processing module fully tested? List all test cases"

  When to Use Gemini CLI

  Use gemini -p when:
  - Analyzing entire codebases or large directories
  - Comparing multiple large files
  - Need to understand project-wide patterns or architecture
  - Current context window is insufficient for the task
  - Working with files totaling more than 100KB
  - Verifying if specific features, patterns, or security measures are implemented
  - Checking for the presence of certain coding patterns across the entire codebase

  Important Notes

  - Paths in @ syntax are relative to your current working directory when invoking gemini
  - The CLI will include file contents directly in the context
  - No need for --yolo flag for read-only analysis
  - Gemini's context window can handle entire codebases that would overflow Claude's context
  - When checking implementations, be specific about what you're looking for to get accurate results

# SuperClaude Agents Integration

KeCarajoComer integra un equipo completo de agentes especializados de SuperClaude para maximizar la calidad y efectividad del desarrollo.

## Agentes Disponibles

### 🏗️ Architect Agent
- **Especialidad**: Diseño de sistemas, arquitectura de software, microservicios
- **Ubicación**: `claude-agents/architect-agent.md`
- **Uso**: Decisiones arquitectónicas, escalabilidad, modernización

### ⚡ Performance Agent  
- **Especialidad**: Optimización de performance, load testing, bottlenecks
- **Ubicación**: `claude-agents/performance-agent.md`
- **Uso**: Análisis de performance, optimización de APIs, testing de carga

### 🛡️ Security Agent
- **Especialidad**: Threat modeling, compliance, vulnerability assessment
- **Ubicación**: `claude-agents/security-agent.md`
- **Uso**: Auditorías de seguridad, implementación de controles, compliance

### 🧪 QA Agent
- **Especialidad**: Testing strategy, quality assurance, automation
- **Ubicación**: `claude-agents/qa-agent.md`
- **Uso**: Estrategias de testing, automatización, quality gates

### 🚀 DevOps Agent
- **Especialidad**: CI/CD, infrastructure as code, deployment automation
- **Ubicación**: `claude-agents/devops-agent.md`
- **Uso**: Pipelines, infrastructure, observabilidad

## Auto-Activación

Los agentes se activan automáticamente basado en keywords y contexto:
- **architecture**, **design**, **scalability** → Architect Agent
- **performance**, **slow**, **optimization** → Performance Agent
- **security**, **vulnerability**, **compliance** → Security Agent
- **test**, **quality**, **qa** → QA Agent
- **deploy**, **CI/CD**, **infrastructure** → DevOps Agent

## Integración con KeCarajoComer

Los agentes están optimizados para el stack tecnológico del proyecto:
- Next.js 15 + React
- Supabase (PostgreSQL + Auth)
- Tailwind CSS + Framer Motion
- TypeScript + Jest + Playwright

## Activación Manual

Para usar un agente específico, referencia el archivo directamente:
```bash
# Ejemplo: Consulta arquitectónica
claude --context claude-agents/architect-agent.md "Diseñar sistema de notificaciones en tiempo real"

# Ejemplo: Optimización de performance  
claude --context claude-agents/performance-agent.md "Analizar y optimizar performance de APIs"
``` # Using Gemini CLI for Large Codebase Analysis


  When analyzing large codebases or multiple files that might exceed context limits, use the Gemini CLI with its massive
  context window. Use `gemini -p` to leverage Google Gemini's large context capacity.


  ## File and Directory Inclusion Syntax


  Use the `@` syntax to include files and directories in your Gemini prompts. The paths should be relative to WHERE you run the
   gemini command:


  ### Examples:


  **Single file analysis:**
  ```bash
  gemini -p "@src/main.py Explain this file's purpose and structure"


  Multiple files:
  gemini -p "@package.json @src/index.js Analyze the dependencies used in the code"


  Entire directory:
  gemini -p "@src/ Summarize the architecture of this codebase"


  Multiple directories:
  gemini -p "@src/ @tests/ Analyze test coverage for the source code"


  Current directory and subdirectories:
  gemini -p "@./ Give me an overview of this entire project"
  # Or use --all_files flag:
  gemini --all_files -p "Analyze the project structure and dependencies"


  Implementation Verification Examples


  Check if a feature is implemented:
  gemini -p "@src/ @lib/ Has dark mode been implemented in this codebase? Show me the relevant files and functions"


  Verify authentication implementation:
  gemini -p "@src/ @middleware/ Is JWT authentication implemented? List all auth-related endpoints and middleware"


  Check for specific patterns:
  gemini -p "@src/ Are there any React hooks that handle WebSocket connections? List them with file paths"


  Verify error handling:
  gemini -p "@src/ @api/ Is proper error handling implemented for all API endpoints? Show examples of try-catch blocks"


  Check for rate limiting:
  gemini -p "@backend/ @middleware/ Is rate limiting implemented for the API? Show the implementation details"


  Verify caching strategy:
  gemini -p "@src/ @lib/ @services/ Is Redis caching implemented? List all cache-related functions and their usage"


  Check for specific security measures:
  gemini -p "@src/ @api/ Are SQL injection protections implemented? Show how user inputs are sanitized"


  Verify test coverage for features:
  gemini -p "@src/payment/ @tests/ Is the payment processing module fully tested? List all test cases"


  When to Use Gemini CLI


  Use gemini -p when:
  - Analyzing entire codebases or large directories
  - Comparing multiple large files
  - Need to understand project-wide patterns or architecture
  - Current context window is insufficient for the task
  - Working with files totaling more than 100KB
  - Verifying if specific features, patterns, or security measures are implemented
  - Checking for the presence of certain coding patterns across the entire codebase


  Important Notes


  - Paths in @ syntax are relative to your current working directory when invoking gemini
  - The CLI will include file contents directly in the context
  - No need for --yolo flag for read-only analysis
  - Gemini's context window can handle entire codebases that would overflow Claude's context
  - When checking implementations, be specific about what you're looking for to get accurate results

# SuperClaude Agents Integration

KeCarajoComer integra un equipo completo de agentes especializados de SuperClaude para maximizar la calidad y efectividad del desarrollo.

## Agentes Disponibles

### 🏗️ Architect Agent
- **Especialidad**: Diseño de sistemas, arquitectura de software, microservicios
- **Ubicación**: `claude-agents/architect-agent.md`
- **Uso**: Decisiones arquitectónicas, escalabilidad, modernización

### ⚡ Performance Agent  
- **Especialidad**: Optimización de performance, load testing, bottlenecks
- **Ubicación**: `claude-agents/performance-agent.md`
- **Uso**: Análisis de performance, optimización de APIs, testing de carga

### 🛡️ Security Agent
- **Especialidad**: Threat modeling, compliance, vulnerability assessment
- **Ubicación**: `claude-agents/security-agent.md`
- **Uso**: Auditorías de seguridad, implementación de controles, compliance

### 🧪 QA Agent
- **Especialidad**: Testing strategy, quality assurance, automation
- **Ubicación**: `claude-agents/qa-agent.md`
- **Uso**: Estrategias de testing, automatización, quality gates

### 🚀 DevOps Agent
- **Especialidad**: CI/CD, infrastructure as code, deployment automation
- **Ubicación**: `claude-agents/devops-agent.md`
- **Uso**: Pipelines, infrastructure, observabilidad

## Auto-Activación

Los agentes se activan automáticamente basado en keywords y contexto:
- **architecture**, **design**, **scalability** → Architect Agent
- **performance**, **slow**, **optimization** → Performance Agent
- **security**, **vulnerability**, **compliance** → Security Agent
- **test**, **quality**, **qa** → QA Agent
- **deploy**, **CI/CD**, **infrastructure** → DevOps Agent

## Integración con KeCarajoComer

Los agentes están optimizados para el stack tecnológico del proyecto:
- Next.js 15 + React
- Supabase (PostgreSQL + Auth)
- Tailwind CSS + Framer Motion
- TypeScript + Jest + Playwright

## Activación Manual

Para usar un agente específico, referencia el archivo directamente:
```bash
# Ejemplo: Consulta arquitectónica
claude --context claude-agents/architect-agent.md "Diseñar sistema de notificaciones en tiempo real"

# Ejemplo: Optimización de performance  
claude --context claude-agents/performance-agent.md "Analizar y optimizar performance de APIs"
```