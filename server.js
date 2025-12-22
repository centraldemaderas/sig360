import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Configuración de red para Cloud Run
const PORT = parseInt(process.env.PORT, 10) || 8080;
const HOST = '0.0.0.0';

const distPath = path.join(__dirname, 'dist');

console.log(`[SIG-SERVER] Iniciando en puerto ${PORT}...`);

// Middleware para logging básico
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Ruta de Salud (Vital para que el balanceador de Google marque el contenedor como "Healthy")
app.get('/health', (req, res) => res.status(200).send('OK'));

// Servir archivos de la carpeta dist si existe
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  console.log('[SIG-SERVER] Directorio /dist detectado y servido.');
} else {
  console.error('[SIG-SERVER] ERROR: Directorio /dist NO encontrado. Revisa el build log.');
}

// Redirección SPA para soportar navegación de React
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('La aplicación no está lista o el build falló. Por favor, revisa los logs de compilación.');
  }
});

// Iniciar servidor
const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 [SIG-SERVER] Servidor listo y escuchando en http://${HOST}:${PORT}`);
});

// Captura de errores globales para evitar que el contenedor muera sin dejar rastro
process.on('uncaughtException', (err) => {
  console.error('[SIG-SERVER] CRASH NO CONTROLADO:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[SIG-SERVER] PROMESA NO CONTROLADA:', reason);
});