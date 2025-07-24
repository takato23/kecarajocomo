const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Generar certificados autofirmados si no existen
const certDir = path.join(__dirname, 'certificates');
if (!fs.existsSync(certDir)) {
  fs.mkdirSync(certDir);
}

const keyPath = path.join(certDir, 'localhost-key.pem');
const certPath = path.join(certDir, 'localhost.pem');

// Si no existen los certificados, crear unos autofirmados
if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {







  process.exit(1);
}

const httpsOptions = {
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath),
};

app.prepare().then(() => {
  createServer(httpsOptions, (req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(3001, (err) => {
    if (err) throw err;


  });
});