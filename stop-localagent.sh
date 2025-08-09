#!/bin/bash
echo "🛑 Deteniendo LocalAgent..."

if [ -f ".localagent/agent.pid" ]; then
    AGENT_PID=$(cat .localagent/agent.pid)
    kill $AGENT_PID 2>/dev/null && echo "✅ Agent detenido (PID: $AGENT_PID)"
    rm .localagent/agent.pid
fi

if [ -f ".localagent/watcher.pid" ]; then
    WATCHER_PID=$(cat .localagent/watcher.pid)
    kill $WATCHER_PID 2>/dev/null && echo "✅ Watcher detenido (PID: $WATCHER_PID)"
    rm .localagent/watcher.pid
fi

echo "🎉 LocalAgent detenido completamente"
