#!/bin/bash
echo "🤖 Iniciando LocalAgent para $(basename $(pwd))"

# Verificar Ollama
if ! curl -s http://localhost:11434/api/tags &> /dev/null; then
    echo "❌ Ollama no está corriendo. Ejecuta: ollama serve"
    exit 1
fi

# Crear directorios necesarios
mkdir -p .localagent

# Iniciar el agente
echo "🧠 Iniciando núcleo del agente..."
nohup node local-agent-core.js start > localagent.log 2>&1 &
AGENT_PID=$!

echo "👁️  Iniciando monitor de archivos..."
nohup bash file-watcher-daemon.sh > watcher.log 2>&1 &
WATCHER_PID=$!

echo "✅ LocalAgent iniciado:"
echo "   - Agent PID: $AGENT_PID"
echo "   - Watcher PID: $WATCHER_PID"
echo "   - Logs: localagent.log, watcher.log"
echo ""
echo "Para detener: kill $AGENT_PID $WATCHER_PID"

# Guardar PIDs para poder detener después
echo "$AGENT_PID" > .localagent/agent.pid
echo "$WATCHER_PID" > .localagent/watcher.pid

echo "🎉 LocalAgent está ahora monitoreando tu proyecto!"
echo "Edita cualquier archivo y observa cómo el agente responde automáticamente."

# Esperar un momento para que arranquen
sleep 2

# Mostrar estado inicial
echo ""
echo "📊 Estado del agente:"
tail -3 localagent.log 2>/dev/null || echo "   Iniciándose..."
