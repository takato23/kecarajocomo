# Configuración de Voz para Desarrollo Local

## El Problema

El reconocimiento de voz del navegador requiere HTTPS por razones de seguridad. En desarrollo local, Next.js corre en HTTP por defecto, lo que causa el error de permisos.

## Soluciones

### Opción 1: Usar HTTPS con Next.js (Recomendado)

1. Instalar mkcert para certificados locales:
```bash
# En macOS con Homebrew
brew install mkcert
mkcert -install
```

2. Crear certificados para localhost:
```bash
cd kecarajocomer
mkdir certificates
cd certificates
mkcert localhost
```

3. Crear un servidor HTTPS personalizado:

Crear archivo `server.js` en la raíz del proyecto:
```javascript
const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const httpsOptions = {
  key: fs.readFileSync('./certificates/localhost-key.pem'),
  cert: fs.readFileSync('./certificates/localhost.pem'),
};

app.prepare().then(() => {
  createServer(httpsOptions, (req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(3001, (err) => {
    if (err) throw err;
    console.log('> Ready on https://localhost:3001');
  });
});
```

4. Actualizar package.json:
```json
"scripts": {
  "dev": "node server.js",
  "dev:http": "next dev -p 3001",
  ...
}
```

### Opción 2: Usar ngrok (Más Rápido)

1. Instalar ngrok:
```bash
brew install ngrok
```

2. En una terminal, correr Next.js normalmente:
```bash
npm run dev
```

3. En otra terminal, exponer con ngrok:
```bash
ngrok http 3001
```

4. Usar la URL HTTPS que proporciona ngrok (ej: https://abc123.ngrok.io)

### Opción 3: Usar Chrome con flags (Solo para testing)

Abrir Chrome con flags especiales que permiten APIs inseguras en localhost:
```bash
# En macOS
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --unsafely-treat-insecure-origin-as-secure="http://localhost:3001" --user-data-dir=/tmp/chrome-test
```

## Verificar Permisos del Navegador

1. Click en el ícono de candado/información en la barra de direcciones
2. Buscar "Micrófono" en la configuración del sitio
3. Asegurarse de que esté en "Permitir"

## Troubleshooting

- **Error persiste con HTTPS**: Limpiar caché y cookies del navegador
- **No aparece el diálogo de permisos**: Revisar configuración de privacidad del navegador
- **En Safari**: Ir a Preferencias > Sitios web > Micrófono