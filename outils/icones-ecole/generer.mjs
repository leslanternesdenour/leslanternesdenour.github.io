// Génère les trois icônes 3D de l'École arabe (rendu three.js hors-ligne → PNG 512×512 à fond transparent).
// Usage : node outils/icones-ecole/generer.mjs [lettres|lecture|chiffres ...]   (sans argument : les trois)
// Prérequis : three (node_modules), Playwright, et deux polices Google (Baloo Bhaijaan 2 ExtraBold, Amiri Bold) dans POLICES.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ici = path.dirname(fileURLToPath(import.meta.url)), racine = path.resolve(ici, '../..');
const THREE_DIR = process.env.THREE_DIR || '/home/user/node_modules/three';
const POLICES = process.env.POLICES || '/tmp/claude-0/ico';
const SORTIE = process.env.SORTIE || path.join(racine, 'monde/icones');
const require = createRequire(process.env.PLAYWRIGHT_DIR || '/opt/node-tools/node_modules/');
const { chromium } = require('playwright');

const types = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.ttf': 'font/ttf', '.html': 'text/html' };
const noms = process.argv.slice(2).length ? process.argv.slice(2) : ['lettres', 'lecture', 'chiffres'];
const nav = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await nav.newPage({ viewport: { width: 400, height: 400 } });
page.on('pageerror', e => console.log('ERREUR page :', e.message)); page.on('console', m => m.type() === 'error' && console.log('console :', m.text()));
await page.route('https://ico.local/**', r => {
  const u = new URL(r.request().url()).pathname; let f;
  if (u === '/') f = path.join(ici, 'rendu.html'); else if (u.startsWith('/three/')) f = path.join(THREE_DIR, u.slice(7)); else if (u.startsWith('/polices/')) f = path.join(POLICES, u.slice(9));
  try { r.fulfill({ body: readFileSync(f), contentType: types[path.extname(f)] || 'application/octet-stream' }); } catch { r.fulfill({ status: 404, body: '' }); }
});
await page.goto('https://ico.local/'); await page.waitForFunction(() => window.__pret, null, { timeout: 120000 });
mkdirSync(SORTIE, { recursive: true });
for (const n of noms) {
  const { nom, data } = await page.evaluate(async n => await window.__rendre(n), n);
  writeFileSync(path.join(SORTIE, nom + '.png'), Buffer.from(data.split(',')[1], 'base64')); console.log('écrit', nom + '.png');
}
await nav.close();
