import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Servir archivos estáticos con caché optimizada
app.use(express.static(path.join(__dirname, 'dist'), {
  maxAge: '1d',
  etag: true
}));

// Endpoint de salud para Firebase/Google Cloud
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Patrón SPA: Redirigir todas las demás peticiones al index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log('-------------------------------------------');
  console.log(`🚀 SIG-Manager Pro: Producción Activa`);
  console.log(`📍 Puerto: ${PORT}`);
  console.log(`📅 Fecha: ${new Date().toLocaleString()}`);
  console.log('-------------------------------------------');
});