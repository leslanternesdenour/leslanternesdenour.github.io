// Middleware Cloudflare : il ne s'exécute que pour l'API et les pages d'entrée du jeu (_routes.json), pas pour les ressources.
import test from 'node:test'; import assert from 'node:assert/strict';
import fs from 'node:fs';

test('routes : le middleware ne s\'exécute que pour /api/* et les pages d\'entrée du jeu', () => {
  const r = JSON.parse(fs.readFileSync(new URL('../../_routes.json', import.meta.url), 'utf8'));
  assert.equal(r.version, 1); assert.ok(r.include.includes('/api/*'));
  for (const p of ['/monde/', '/voyage/', '/ablutions/', '/ablutions/jeu3d/', '/priere/', '/priere/jeu3d/', '/calendrier/', '/aventures/', '/aventures/chasse-aux-mots/', '/aventures/mysteres-desert/', '/aventures/quiz-nour/', '/ecole-arabe/', '/ecole-arabe/lettres/', '/ecole-arabe/lecture/', '/ecole-arabe/chiffres/']) assert.ok(r.include.includes(p), p);
  assert.ok(r.include.length <= 100, 'limite Cloudflare');
  assert.ok(!r.include.some(x => x === '/*' || /\.(js|css|mp3|webp|glb|png|json)$/.test(x)), 'aucune ressource ni joker global');
});

const { onRequest } = await import('../../functions/_middleware.js');
const { creerSession } = await import('../../serveur/session.js');
const SECRET = 'secret-de-test-tres-long-0123456789abcdef';
const env = { SESSION_SECRET: SECRET, FIREBASE_PROJET: 'ldn-test', FIREBASE_COMPTE_SERVICE: '{"x":1}' };
const contexte = (chemin, { cookie, e = env } = {}) => { let suivi = 0; return { request: new Request('https://preprod.exemple' + chemin, { headers: cookie ? { Cookie: cookie } : {} }), env: e, next: async () => { suivi++; return new Response('<html>jeu</html>', { status: 200, headers: { 'Cache-Control': 'public, max-age=3600' } }); }, suivi: () => suivi }; };
const cookie = async () => 'ldn_session=' + encodeURIComponent(await creerSession({ uid: 'u1', email: 'p@exemple.fr', emailVerifie: true, authTime: 1 }, SECRET));

test('middleware : une page publique est servie sans aucun contrôle, même sans configuration des comptes', async () => {
  const c = contexte('/decouvrir/', { e: {} }); const r = await onRequest(c);
  assert.equal(r.status, 200); assert.equal(c.suivi(), 1);
});

test('middleware : comptes indisponibles : la page de jeu n\'est jamais servie (503, pas de cache)', async () => {
  const c = contexte('/monde/', { e: {} }); const r = await onRequest(c);
  assert.equal(r.status, 503); assert.equal(c.suivi(), 0, 'la page de jeu n\'est pas demandée'); assert.match(r.headers.get('Cache-Control'), /no-store/); assert.ok(!(await r.text()).includes('jeu</html>'));
});

test('middleware : sans session, redirection vers la connexion ; avec session valide, la page est servie et jamais mise en cache partagé', async () => {
  const sans = contexte('/voyage/'); const r1 = await onRequest(sans);
  assert.equal(r1.status, 302); assert.match(r1.headers.get('Location'), /^\/compte\/\?retour=%2Fvoyage%2F#connexion$/); assert.equal(sans.suivi(), 0);
  const avec = contexte('/voyage/', { cookie: await cookie() }); const r2 = await onRequest(avec);
  assert.equal(r2.status, 200); assert.equal(avec.suivi(), 1); assert.equal(r2.headers.get('Cache-Control'), 'private, no-store');
});

test('middleware : une erreur inattendue pendant le contrôle ferme la page de jeu (fail-closed)', async () => {
  const piege = { get SESSION_SECRET() { throw new Error('boum'); }, FIREBASE_PROJET: 'x', FIREBASE_COMPTE_SERVICE: 'y' };
  const c = contexte('/priere/', { e: piege }); const r = await onRequest(c);
  assert.equal(r.status, 503); assert.equal(c.suivi(), 0);
});
