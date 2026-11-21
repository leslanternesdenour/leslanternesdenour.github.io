// Le build Cloudflare refuse toute branche autre que « preproduction » (dont « main ») et ne produit alors aucun dossier publié.
import test from 'node:test'; import assert from 'node:assert/strict'; import { spawnSync } from 'node:child_process'; import fs from 'node:fs';
const lancer = (branche) => spawnSync('node', ['outils/construire.mjs'], { env: { ...process.env, LDN_PREPROD: '1', ...(branche ? { CF_PAGES_BRANCH: branche } : { CF_PAGES_BRANCH: '' }) }, encoding: 'utf8' });
for (const b of ['main', 'master', 'autre', 'Main']) test(`branche « ${b} » : build refusé`, () => { fs.rmSync('dist', { recursive: true, force: true }); const r = lancer(b); assert.equal(r.status, 1); assert.match(r.stderr, /Build refusé/); assert.ok(!fs.existsSync('dist')); });
test('branche « preproduction » : build accepté, noindex posé', () => { const r = lancer('preproduction'); assert.equal(r.status, 0); assert.match(fs.readFileSync('dist/_headers', 'utf8'), /X-Robots-Tag: noindex/); assert.match(fs.readFileSync('dist/robots.txt', 'utf8'), /Disallow: \//); });

// Cloudflare ne garde qu'un seul bloc par chemin : un doublon efface silencieusement les en-têtes de sécurité du premier.
test('dist/_headers : un seul bloc par chemin, et les en-têtes de sécurité + noindex sont dans le même bloc « /* »', () => {
  lancer('preproduction'); const t = fs.readFileSync('dist/_headers', 'utf8'); const chemins = t.split('\n').filter(l => /^\//.test(l)).map(l => l.trim());
  assert.deepEqual(chemins.filter((c, i) => chemins.indexOf(c) !== i), [], 'chemins en double');
  const bloc = t.split(/^\/\*[ \t]*$/m)[1].split(/^\//m)[0];
  for (const h of ['X-Robots-Tag', 'Content-Security-Policy', 'X-Frame-Options', 'Permissions-Policy', 'Cross-Origin-Opener-Policy', 'Referrer-Policy', 'X-Content-Type-Options']) assert.ok(bloc.includes(h + ':'), h);
});
