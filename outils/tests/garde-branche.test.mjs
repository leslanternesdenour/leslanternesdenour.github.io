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

// CSP : la version élargie (connexion Google) est limitée aux pages de connexion, et ne diffère de la CSP stricte que de deux sources.
test('CSP : /compte/, /admin/, /apercu/ élargies de apis.google.com + cadre firebaseapp seulement ; le reste du site strict', () => {
  const t = fs.readFileSync('_headers', 'utf8'); const blocs = {}; let cur = null;
  for (const l of t.split('\n')) { if (/^\//.test(l)) { cur = l.trim(); blocs[cur] = blocs[cur] || []; } else if (cur && /^\s+\S/.test(l)) blocs[cur].push(l.trim()); }
  const csp = b => (blocs[b].find(x => /^Content-Security-Policy:/.test(x)) || '').replace(/^Content-Security-Policy:\s*/, '');
  const dirs = c => Object.fromEntries(c.split(';').map(x => x.trim()).filter(Boolean).map(x => { const [k, ...v] = x.split(/\s+/); return [k, v]; }));
  const base = dirs(csp('/*'));
  for (const b of ['/compte/*', '/admin/*', '/apercu/*']) {
    assert.ok(blocs[b].includes('! Content-Security-Policy'), b + ' : la CSP stricte héritée doit être retirée'); assert.equal(blocs[b].filter(x => /^Content-Security-Policy:/.test(x)).length, 1, b);
    const e = dirs(csp(b));
    assert.deepEqual(Object.keys(e).sort(), Object.keys(base).sort(), b + ' : mêmes directives');
    for (const k of Object.keys(base)) { const ajouts = e[k].filter(x => !base[k].includes(x)); const attendus = k === 'script-src' ? ['https://apis.google.com'] : k === 'frame-src' ? ['https://lanternes-de-nour.firebaseapp.com'] : []; assert.deepEqual(ajouts, attendus, b + ' ' + k); assert.deepEqual(base[k].filter(x => !e[k].includes(x)), [], b + ' ' + k + ' : rien de retiré'); }
  }
  for (const b of Object.keys(blocs)) if (!['/compte/*', '/admin/*', '/apercu/*', '/*'].includes(b)) assert.ok(!blocs[b].some(x => /^Content-Security-Policy:/.test(x)), b + ' : pas de CSP propre');
  assert.ok(!/unsafe-eval/.test(csp('/compte/*')), 'pas de unsafe-eval');
});
