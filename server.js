import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';

// Log fatal errors so Cloud Run shows them
process.on('uncaughtException', (err) => {
  console.error('❌ uncaughtException:', err);
  process.exit(1);
});
process.on('unhandledRejection', (err) => {
  console.error('❌ unhandledRejection:', err);
  process.exit(1);
});

// Servir archivos estáticos de la carpeta dist generada por el build
app.use(express.static(path.join(__dirname, 'dist')));

// Ruta de salud para el balanceador de carga de Google
app.get('/health', (req, res) => res.status(200).send('OK'));

// Redirección SPA: Cualquier ruta que no sea un archivo va al index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`🚀 Servidor listo en http://${HOST}:${PORT}`);
}).on('error', (err) => {
  console.error('❌ Error iniciando servidor:', err);
  process.exit(1);
});