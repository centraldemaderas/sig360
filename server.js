import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Servir archivos estáticos de la carpeta dist generada por el build
app.use(express.static(path.join(__dirname, 'dist')));

// Ruta de salud para el balanceador de carga de Google
app.get('/health', (req, res) => res.status(200).send('OK'));

// Redirección SPA: Cualquier ruta que no sea un archivo va al index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor listo en puerto ${PORT}`);
});