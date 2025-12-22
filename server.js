import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Google Cloud Run/App Hosting inyecta la variable de entorno PORT (normalmente 8080)
const PORT = process.env.PORT || 8080;
const HOST = '0.0.0.0'; // Esencial para entornos de contenedor

const distPath = path.join(__dirname, 'dist');

console.log('--- SIG-Manager Pro Startup ---');
console.log(`Port: ${PORT}`);
console.log(`Target Directory: ${distPath}`);

// Servir archivos estáticos
if (fs.existsSync(distPath)) {
  console.log('✅ Directory "dist" found. Serving static files.');
  app.use(express.static(distPath));
} else {
  console.warn('⚠️ WARNING: "dist" directory not found. The app might not have been built correctly.');
}

// Ruta de salud para el balanceador de carga de Google
app.get('/health', (req, res) => res.status(200).send('OK'));

// Redirección SPA: Cualquier ruta que no sea un archivo va al index.html
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Application not found. Please check build logs.');
  }
});

const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 Server listening on http://${HOST}:${PORT}`);
});

// Manejo de errores de inicio de servidor
server.on('error', (err) => {
  console.error('❌ FATAL ERROR STARTING SERVER:', err);
  process.exit(1);
});