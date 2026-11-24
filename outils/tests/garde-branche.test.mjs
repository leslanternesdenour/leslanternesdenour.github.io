// Le build Cloudflare refuse toute branche autre que « preproduction » (et « main » tant que la production n'est pas déclarée dans wrangler.toml) et ne produit alors aucun dossier publié.
import test from 'node:test'; import assert from 'node:assert/strict'; import { spawnSync } from 'node:child_process'; import fs from 'node:fs';
// Les tests ne dépendent pas de la branche courante : le wrangler.toml de référence est passé explicitement (LDN_WRANGLER).
const PREPROD_TOML = 'docs/migration/wrangler.preproduction.toml';
const lancer = (branche) => spawnSync('node', ['outils/construire.mjs'], { env: { ...process.env, LDN_PREPROD: '1', LDN_WRANGLER: PREPROD_TOML, ...(branche ? { CF_PAGES_BRANCH: branche } : { CF_PAGES_BRANCH: '' }) }, encoding: 'utf8' });
for (const b of ['main', 'master', 'autre', 'Main']) test(`branche « ${b} » : build refusé`, () => { fs.rmSync('dist', { recursive: true, force: true }); const r = lancer(b); assert.equal(r.status, 1); assert.match(r.stderr, /Build refusé/); assert.ok(!fs.existsSync('dist')); });
test('préproduction : la page de validation des 28 lettres et ses données sont publiées (outil interne) ; aucun audio du site n\'est touché', () => {
  assert.equal(lancer('preproduction').status, 0);
  for (const f of ['outils/voix/lettres-validation/index.html', 'outils/voix/lettres-validation/donnees.js']) assert.ok(fs.existsSync('dist/' + f), f);
  assert.ok(fs.existsSync('dist/audio/jeux/ecole-lettres/nom.alif.mp3'), 'les audios actuels restent en place');
});

test('préproduction : le dossier des enregistrements candidats des lettres est publié en interne, jamais sous le dossier audio du site', () => {
  assert.equal(lancer('preproduction').status, 0);
  assert.ok(fs.existsSync('dist/outils/voix/lettres-candidats/LISEZMOI.txt'));
  assert.ok(!fs.existsSync('dist/audio/jeux/ecole-lettres-candidats'));
});

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
  for (const b of Object.keys(blocs)) if (!['/compte/*', '/admin/*', '/apercu/*', '/soutenir/*', '/*'].includes(b)) assert.ok(!blocs[b].some(x => /^Content-Security-Policy:/.test(x)), b + ' : pas de CSP propre');   // /soutenir/* : contenu fixé par le test suivant (ressources Stripe uniquement)
  assert.ok(!/unsafe-eval/.test(csp('/compte/*')), 'pas de unsafe-eval');
});

// CSP du don en ligne : /soutenir/* est élargie des seules ressources Stripe documentées (docs.stripe.com/security/guide : Stripe.js + Checkout), rien d'autre.
test('CSP : /soutenir/* élargie des seules ressources Stripe (paiement intégré) ; paiement du navigateur ouvert à Stripe seulement', () => {
  const t = fs.readFileSync('_headers', 'utf8'); const blocs = {}; let cur = null;
  for (const l of t.split('\n')) { if (/^\//.test(l)) { cur = l.trim(); blocs[cur] = blocs[cur] || []; } else if (cur && /^\s+\S/.test(l)) blocs[cur].push(l.trim()); }
  const csp = b => (blocs[b].find(x => /^Content-Security-Policy:/.test(x)) || '').replace(/^Content-Security-Policy:\s*/, '');
  const dirs = c => Object.fromEntries(c.split(';').map(x => x.trim()).filter(Boolean).map(x => { const [k, ...v] = x.split(/\s+/); return [k, v]; }));
  const base = dirs(csp('/*')), b = '/soutenir/*';
  assert.ok(blocs[b], b + ' : bloc présent');
  assert.ok(blocs[b].includes('! Content-Security-Policy'), 'la CSP stricte héritée doit être retirée'); assert.equal(blocs[b].filter(x => /^Content-Security-Policy:/.test(x)).length, 1);
  const e = dirs(csp(b));
  assert.deepEqual(Object.keys(e).sort(), Object.keys(base).sort(), 'mêmes directives');
  const attendus = { 'script-src': ['https://*.js.stripe.com', 'https://checkout.stripe.com', 'https://js.stripe.com'], 'connect-src': ['https://api.stripe.com', 'https://checkout.stripe.com'],
    'frame-src': ['https://*.js.stripe.com', 'https://checkout.stripe.com', 'https://hooks.stripe.com', 'https://js.stripe.com'], 'img-src': ['https://*.stripe.com'] };
  for (const k of Object.keys(base)) { assert.deepEqual(e[k].filter(x => !base[k].includes(x)).sort(), attendus[k] || [], b + ' ' + k); assert.deepEqual(base[k].filter(x => !e[k].includes(x)), [], k + ' : rien de retiré'); }
  assert.ok(!/unsafe-eval/.test(csp(b)), 'pas de unsafe-eval');
  // Permissions-Policy : « payment » (Apple Pay / Google Pay) est bloqué partout (payment=()) ; sur cette page seulement, il est délégué à Stripe. Tout le reste reste bloqué.
  assert.ok(blocs[b].includes('! Permissions-Policy'));
  const pp = blocs[b].find(x => /^Permissions-Policy:/.test(x)) || '';
  assert.match(pp, /payment=\(self "https:\/\/js\.stripe\.com" "https:\/\/\*\.js\.stripe\.com" "https:\/\/checkout\.stripe\.com"\)/);
  for (const f of ['camera', 'microphone', 'geolocation', 'usb', 'interest-cohort']) assert.match(pp, new RegExp(f + '=\\(\\)'), f + ' reste bloqué');
});

// ----- Mise en production : « main » n'est construite que si SON wrangler.toml déclare la production (acte explicite et versionné) -----
const PROD = 'docs/migration/wrangler.production.toml';
const lancerAvec = (branche, wrangler, extra = {}) => spawnSync('node', ['outils/construire.mjs'], { env: { ...process.env, LDN_PREPROD: '', CF_PAGES_BRANCH: branche, LDN_WRANGLER: wrangler, ...extra }, encoding: 'utf8' });
test('production : « main » avec le wrangler.toml de PRÉPRODUCTION est refusée (production non activée)', () => {
  fs.rmSync('dist', { recursive: true, force: true }); const r = lancerAvec('main', PREPROD_TOML);
  assert.equal(r.status, 1); assert.match(r.stderr, /exige ENVIRONNEMENT = "production"/); assert.ok(!fs.existsSync('dist/index.html'), 'aucun dossier publié');
});
test('production : « preproduction » avec un wrangler.toml de PRODUCTION est refusée (une configuration de production n\'est jamais publiée comme préproduction)', () => {
  fs.rmSync('dist', { recursive: true, force: true }); const r = lancerAvec('preproduction', PROD);
  assert.equal(r.status, 1); assert.match(r.stderr, /exige ENVIRONNEMENT = "preproduction"/); assert.ok(!fs.existsSync('dist/index.html'));
});
test('production : une autre branche reste refusée, même avec un wrangler.toml de production', () => {
  for (const b of ['autre', 'master', 'Main', 'Production', 'production2']) { fs.rmSync('dist', { recursive: true, force: true }); const r = lancerAvec(b, PROD); assert.equal(r.status, 1, b); assert.match(r.stderr, /Build refus/); }
});
test('production : « main » + wrangler.toml de production → dossier de PRODUCTION : indexable, sitemap, aucun outil interne, en-têtes de sécurité', () => {
  const r = lancerAvec('main', PROD); assert.equal(r.status, 0, r.stderr); assert.match(r.stdout, /PRODUCTION/);
  const h = fs.readFileSync('dist/_headers', 'utf8');
  const blocs = {}; let cur = null; for (const l of h.split('\n')) { if (/^\//.test(l)) { cur = l.trim(); blocs[cur] = []; } else if (cur && /^\s+\S/.test(l)) blocs[cur].push(l.trim()); }
  assert.ok(!blocs['/*'].some(x => /noindex/i.test(x)), 'production : le site public est indexable (aucun noindex dans le bloc « /* »)');
  for (const b of ['/compte/*', '/admin/*', '/apercu/*']) assert.ok(blocs[b].some(x => /noindex/i.test(x)), b + ' : les pages privées restent en noindex');
  const robots = fs.readFileSync('dist/robots.txt', 'utf8'); assert.ok(!/^Disallow:[ \t]*\/[ \t]*$/m.test(robots) && /^Allow: \/$/m.test(robots), 'production : robots.txt autorise le site (seules les pages privées sont interdites)'); assert.match(robots, /Disallow: \/compte\//); assert.ok(fs.existsSync('dist/sitemap.xml'), 'sitemap présent');
  assert.ok(!fs.existsSync('dist/outils'), 'aucun outil interne publié'); assert.ok(!fs.existsSync('dist/docs') && !fs.existsSync('dist/serveur') && !fs.existsSync('dist/functions'));
  for (const x of ['Content-Security-Policy', 'X-Frame-Options', 'Permissions-Policy', 'Cross-Origin-Opener-Policy', 'Referrer-Policy', 'X-Content-Type-Options', 'Strict-Transport-Security']) if (x !== 'Strict-Transport-Security') assert.ok(h.includes(x + ':'), x);
  assert.deepEqual(JSON.parse(fs.readFileSync('dist/version.json', 'utf8')).branche, 'main');
});
test('production : dossier de production = dossier de préproduction moins les seuls outils internes et le noindex (mêmes jeux, mêmes voix, même portail)', () => {
  const liste = d => { const o = []; (function f(x) { for (const e of fs.readdirSync(x, { withFileTypes: true })) e.isDirectory() ? f(x + '/' + e.name) : o.push((x + '/' + e.name).slice(d.length + 1)); })(d); return o.sort(); };
  lancerAvec('main', PROD); fs.rmSync('/tmp/dist-prod', { recursive: true, force: true }); fs.cpSync('dist', '/tmp/dist-prod', { recursive: true });
  spawnSync('node', ['outils/construire.mjs'], { env: { ...process.env, CF_PAGES_BRANCH: 'preproduction', LDN_WRANGLER: PREPROD_TOML }, encoding: 'utf8' });
  const prod = new Set(liste('/tmp/dist-prod')), pre = new Set(liste('dist'));
  const seulementPre = [...pre].filter(f => !prod.has(f)), seulementProd = [...prod].filter(f => !pre.has(f));
  assert.ok(seulementPre.every(f => f.startsWith('outils/')), 'seuls les outils internes manquent en production : ' + seulementPre.filter(f => !f.startsWith('outils/')).slice(0, 5));
  assert.deepEqual(seulementProd, ['sitemap.xml'], 'seul le sitemap est propre à la production');
  for (const f of ['monde/socle/portail.js', 'monde/voix/accueil-portail.json', 'monde/voix/accueil-portail.mp3', 'audio/narratrice/calendrier/guide.mp3', 'ablutions/jeu3d/index.html', 'compte/index.html', 'tarifs/index.html', 'admin/index.html', 'apercu/index.html']) assert.ok(prod.has(f), f + ' absent de la production');
});

test('production : la branche « production » suit exactement les mêmes règles que « main » (refusée sans déclaration, acceptée avec, mode production)', () => {
  fs.rmSync('dist', { recursive: true, force: true }); let r = lancerAvec('production', PREPROD_TOML); assert.equal(r.status, 1); assert.match(r.stderr, /exige ENVIRONNEMENT = "production"/); assert.ok(!fs.existsSync('dist/index.html'));
  r = lancerAvec('production', PROD); assert.equal(r.status, 0, r.stderr); assert.match(r.stdout, /PRODUCTION/); assert.deepEqual(JSON.parse(fs.readFileSync('dist/version.json', 'utf8')).branche, 'production');
  assert.ok(!/^\/\*[ \t]*\n(?:[ \t]+.*\n)*?[ \t]+X-Robots-Tag: noindex/m.test(fs.readFileSync('dist/_headers', 'utf8')), 'pas de noindex global'); assert.ok(!fs.existsSync('dist/outils'));
});

// Le wrangler.toml de la branche courante doit correspondre à l'une des deux références (préproduction ou production) : jamais une configuration bricolée.
const utile = f => fs.readFileSync(f, 'utf8').split('\n').filter(l => l.trim() && !l.trim().startsWith('#')).join('\n');
test('wrangler.toml courant = exactement la référence de préproduction OU celle de production (même contenu hors commentaires)', () => {
  const c = utile('wrangler.toml'); assert.ok(c === utile(PREPROD_TOML) || c === utile(PROD), 'wrangler.toml inattendu');
  assert.notEqual(utile(PREPROD_TOML), utile(PROD)); assert.match(utile(PROD), /ENVIRONNEMENT = "production"/); assert.match(utile(PREPROD_TOML), /ENVIRONNEMENT = "preproduction"/);
});
