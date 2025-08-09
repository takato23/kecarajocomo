# 🤖 LocalAgent - Agente AI Autónomo

LocalAgent está ahora instalado en este proyecto y funcionando de forma autónoma.

## 🚀 Cómo usar

### Iniciar el agente:
```bash
./start-localagent.sh
```

### Detener el agente:
```bash
./stop-localagent.sh
```

### Ver actividad del agente:
```bash
tail -f localagent.log
tail -f watcher.log
```

## 🧠 Qué hace el agente

El agente monitorea tu proyecto y automáticamente:
- ✅ Analiza cambios en archivos
- ✅ Detecta bugs y problemas
- ✅ Mejora el código
- ✅ Agrega tests faltantes
- ✅ Optimiza performance
- ✅ Actualiza documentación
- ✅ Hace commits automáticos

## 📁 Archivos del agente

- `local-agent-core.js` - Núcleo del agente AI
- `file-watcher-daemon.sh` - Monitor de archivos
- `.localagent/` - Configuración y memoria
- `localagent.config.json` - Configuración del proyecto

## 🎮 Pruébalo

1. Edita cualquier archivo .js, .ts, .jsx, .tsx
2. Guarda el archivo
3. Observa los logs: `tail -f localagent.log`
4. El agente analizará y mejorará automáticamente tu código

## 🔧 Configuración

Edita `localagent.config.json` para personalizar:
- Extensiones de archivo a monitorear
- Modelos de IA a usar
- Número máximo de acciones automáticas
- Activar/desactivar commits automáticos

¡Disfruta tu agente AI personal! 🎉
