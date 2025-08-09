#!/bin/bash
echo "🧪 Probando LocalAgent..."

# Crear un archivo de prueba
cat > test-file.js << 'JSEOF'
// TODO: Esta función necesita refactoring
function badFunction() {
    var x = 1;
    var y = 2;
    return x + y;
}

// BUG: Esta función tiene un error
function brokenFunction() {
    console.log("Hello World"
    // Missing closing parenthesis
}
JSEOF

echo "📝 Archivo de prueba creado: test-file.js"
echo "🔍 Observa localagent.log para ver la respuesta del agente"
echo ""
echo "Para ver logs en tiempo real:"
echo "   tail -f localagent.log"
