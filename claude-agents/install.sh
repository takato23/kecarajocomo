#!/bin/bash

# SuperClaude Agents Pack - Universal Installation Script
# Instala los agentes especializados para Claude Code

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE_HOME="${HOME}/.claude"
AGENTS_DIR="${CLAUDE_HOME}/agents"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "🚀 SuperClaude Agents Pack - Universal Installer"
echo "================================================"
echo -e "${NC}"

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Claude is installed
if ! command -v claude &> /dev/null; then
    print_warning "Claude Code no detectado. Instalando agentes para uso manual..."
else
    print_status "Claude Code detectado"
fi

# Create .claude directory if it doesn't exist
if [ ! -d "$CLAUDE_HOME" ]; then
    mkdir -p "$CLAUDE_HOME"
    print_status "Directorio .claude creado"
fi

# Create agents directory
if [ ! -d "$AGENTS_DIR" ]; then
    mkdir -p "$AGENTS_DIR"
    print_status "Directorio de agentes creado"
fi

# Copy agent files
echo -e "\n${BLUE}Instalando agentes...${NC}"

agents=(
    "architect-agent.md"
    "performance-agent.md" 
    "security-agent.md"
    "qa-agent.md"
    "devops-agent.md"
)

for agent in "${agents[@]}"; do
    if [ -f "$SCRIPT_DIR/$agent" ]; then
        cp "$SCRIPT_DIR/$agent" "$AGENTS_DIR/"
        print_status "Instalado: $agent"
    else
        print_warning "No encontrado: $agent"
    fi
done

# Copy README and documentation
cp "$SCRIPT_DIR/README.md" "$AGENTS_DIR/"
print_status "Documentación instalada"

# Create global configuration file
cat > "$CLAUDE_HOME/superclaude-config.yaml" << 'EOF'
# SuperClaude Agents Configuration
superclaude:
  version: "1.0.0"
  auto_activation: true
  agents:
    architect:
      keywords: ["architecture", "design", "microservices", "scalability"]
      auto_activate: true
    performance:
      keywords: ["performance", "optimization", "slow", "bottleneck"]
      auto_activate: true
    security:
      keywords: ["security", "vulnerability", "threat", "breach"]
      auto_activate: true
    qa:
      keywords: ["testing", "quality", "QA", "defect", "bug"]
      auto_activate: true
    devops:
      keywords: ["devops", "deployment", "ci/cd", "infrastructure"]
      auto_activate: true

# Usage examples:
# claude --agent architect "Review system architecture"
# claude --agent performance "Analyze API bottlenecks"
# claude --agent security "Security audit recommendations"
EOF

print_status "Configuración global creada"

# Create quick activation scripts
mkdir -p "$CLAUDE_HOME/scripts"

# Architect activation script
cat > "$CLAUDE_HOME/scripts/architect" << 'EOF'
#!/bin/bash
claude --context ~/.claude/agents/architect-agent.md "$@"
EOF

# Performance activation script
cat > "$CLAUDE_HOME/scripts/performance" << 'EOF'
#!/bin/bash
claude --context ~/.claude/agents/performance-agent.md "$@"
EOF

# Security activation script
cat > "$CLAUDE_HOME/scripts/security" << 'EOF'
#!/bin/bash
claude --context ~/.claude/agents/security-agent.md "$@"
EOF

# QA activation script
cat > "$CLAUDE_HOME/scripts/qa" << 'EOF'
#!/bin/bash
claude --context ~/.claude/agents/qa-agent.md "$@"
EOF

# DevOps activation script
cat > "$CLAUDE_HOME/scripts/devops" << 'EOF'
#!/bin/bash
claude --context ~/.claude/agents/devops-agent.md "$@"
EOF

# Make scripts executable
chmod +x "$CLAUDE_HOME/scripts/"*

print_status "Scripts de activación creados"

# Add to PATH if not already there
if [[ ":$PATH:" != *":$CLAUDE_HOME/scripts:"* ]]; then
    echo "" >> ~/.bashrc
    echo "# SuperClaude Agents PATH" >> ~/.bashrc
    echo "export PATH=\"\$PATH:$CLAUDE_HOME/scripts\"" >> ~/.bashrc
    
    if [ -f ~/.zshrc ]; then
        echo "" >> ~/.zshrc
        echo "# SuperClaude Agents PATH" >> ~/.zshrc
        echo "export PATH=\"\$PATH:$CLAUDE_HOME/scripts\"" >> ~/.zshrc
    fi
    
    print_status "Scripts añadidos al PATH"
    print_warning "Reinicia tu terminal o ejecuta: source ~/.bashrc"
fi

echo -e "\n${GREEN}🎉 Instalación Completada!${NC}"
echo -e "\n${BLUE}Uso:${NC}"
echo "1. Automático: Los agentes se activarán por keywords"
echo "2. Manual: claude --agent architect \"Tu pregunta\""
echo "3. Scripts: architect \"Revisar arquitectura\""
echo "4. Directo: Copia contenido del agente a tu chat"

echo -e "\n${BLUE}Agentes Instalados:${NC}"
echo "🏗️  Architect Agent  - Diseño de sistemas y arquitectura"
echo "⚡ Performance Agent - Optimización y benchmarking"
echo "🛡️  Security Agent   - Análisis de vulnerabilidades"
echo "🧪 QA Agent         - Testing y aseguramiento de calidad"
echo "🚀 DevOps Agent     - CI/CD y deployment"

echo -e "\n${BLUE}Archivos de configuración:${NC}"
echo "📁 Agentes: $AGENTS_DIR"
echo "⚙️  Config: $CLAUDE_HOME/superclaude-config.yaml"
echo "🔧 Scripts: $CLAUDE_HOME/scripts"

echo -e "\n${YELLOW}Para más información: cat ~/.claude/agents/README.md${NC}"