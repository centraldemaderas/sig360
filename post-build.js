import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'dist', 'index.html');

try {
  if (fs.existsSync(filePath)) {
    let html = fs.readFileSync(filePath, 'utf8');
    // Cambiamos la referencia de index.tsx a index.js para que el navegador cargue el bundle compilado
    html = html.replace('index.tsx', 'index.js');
    fs.writeFileSync(filePath, html);
    console.log('✅ index.html actualizado para producción.');
  } else {
    console.error('❌ Error: No se encontró dist/index.html');
    process.exit(1);
  }
} catch (err) {
  console.error('❌ Error en post-build:', err);
  process.exit(1);
}