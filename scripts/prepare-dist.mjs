import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const distDir = path.join(root, 'dist');
const indexSrc = path.join(root, 'index.html');
const metadataSrc = path.join(root, 'metadata.json');

async function fileExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  await fs.mkdir(distDir, { recursive: true });

  if (await fileExists(indexSrc)) {
    await fs.copyFile(indexSrc, path.join(distDir, 'index.html'));
  }
  if (await fileExists(metadataSrc)) {
    await fs.copyFile(metadataSrc, path.join(distDir, 'metadata.json'));
  }

  const distIndex = path.join(distDir, 'index.html');
  if (!(await fileExists(distIndex))) {
    throw new Error('No se encontró dist/index.html (no se pudo preparar dist).');
  }

  // Make sure production HTML loads compiled bundle.
  const html = await fs.readFile(distIndex, 'utf8');
  const updated = html.replace('index.tsx', 'index.js');
  await fs.writeFile(distIndex, updated);
}

await main();
