// Import des contenus Premium par le Créateur (sans ligne de commande) : PUT /api/admin/premium/<chemin>, servi ensuite par /api/premium/<chemin> après contrôle des droits.
// Vraies routes et vraies sessions ; seuls la base et le stockage privé sont simulés en mémoire.
import test from 'node:test'; import assert from 'node:assert/strict';
import { traiter, _reinitialiserCompteurs } from '../../serveur/api.js';
import { creerBase } from './base-testee.mjs';
import { verifierJeton } from '../../serveur/jeton.js';

const PROJET = 'ldn-test', CREATEUR = 'uid-createur', O = 'https://preprod.exemple';
const env = { CREATOR_UID: CREATEUR, SESSION_SECRET: 'secret-de-test-tres-long-0123456789abcdef', FIREBASE_PROJET: PROJET };
const cles = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
const b64u = o => Buffer.from(JSON.stringify(o)).toString('base64url');
const maintenant = Date.UTC(2026, 10, 24, 10);
async function jeton(uid, role) {
  const s = Math.floor(maintenant / 1000), tete = b64u({ alg: 'RS256', kid: 'k1' }) + '.' + b64u({ iss: 'https://securetoken.google.com/' + PROJET, aud: PROJET, firebase: { sign_in_provider: 'password' }, sub: uid, iat: s - 10, exp: s + 3000, auth_time: s - 60, email: uid + '@exemple.fr', email_verified: true, ...(role ? { role } : {}) });
  return tete + '.' + Buffer.from(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cles.privateKey, new TextEncoder().encode(tete))).toString('base64url');
}
const base = creerBase();
const fichiers = new Map();                // stockage privé simulé : chemin → { body (octets), type }
let stockageBranche = true;
const stockage = {
  type: 'r2-simule',
  async get(cle) { const f = fichiers.get(cle); return f ? { body: f.body, type: f.type } : null; },
  async lister() { return [...fichiers].map(([cle, f]) => ({ cle, taille: f.body.length })); },
  async put(cle, corps, type) { fichiers.set(cle, { body: new Uint8Array(corps), type }); },
  async supprimer(cle) { fichiers.delete(cle); }
};
const ctx = () => ({ env, base, maintenant,
  auth: { verifierIdToken: (t, m) => verifierJeton(t, { projet: PROJET, obtenirCle: async k => k === 'k1' ? cles.publicKey : null, maintenant: m }) },
  stockage: stockageBranche ? stockage : { type: 'aucun', async get() { return null; }, async lister() { return []; } }, stripe: null });
async function appel(m, chemin, { corps, cookie, type } = {}) {
  const h = { ...(m !== 'GET' ? { 'X-LDN': '1', Origin: O } : {}), ...(cookie ? { Cookie: cookie } : {}), ...(type ? { 'Content-Type': type } : {}) };
  const r = await traiter(new Request(O + chemin, { method: m, headers: h, body: corps }), ctx());
  const octets = new Uint8Array(await r.arrayBuffer()); let j; try { j = JSON.parse(new TextDecoder().decode(octets)); } catch (e) { j = null; } return { s: r.status, j, octets, h: r.headers };
}
async function connecter(uid, role) {
  const r = await traiter(new Request(O + '/api/session', { method: 'POST', headers: { 'X-LDN': '1', Origin: O }, body: JSON.stringify({ idToken: await jeton(uid, role), consentements: { parent: true, cgu: true, confidentialite: true } }) }), ctx());
  assert.equal(r.status, 200); return r.headers.get('Set-Cookie').split(';')[0];
}
test.beforeEach(() => { _reinitialiserCompteurs(); fichiers.clear(); stockageBranche = true; });

test('le Créateur importe un fichier Premium, qui est ensuite servi ; un autre compte et un visiteur sont refusés', async () => {
  const createur = await connecter(CREATEUR, 'creator'), parent = await connecter('uid-parent');
  const pack = JSON.stringify({ format: 'ldn-pack-voyage-1', zone: 'camp' });
  assert.equal((await appel('PUT', '/api/admin/premium/voyage/camp/contenu.json', { cookie: parent, corps: pack, type: 'application/json' })).s, 403, 'un parent ne peut pas importer');
  assert.equal((await appel('PUT', '/api/admin/premium/voyage/camp/contenu.json', { corps: pack, type: 'application/json' })).s, 401, 'un visiteur non plus');
  assert.equal(fichiers.size, 0);
  const r = await appel('PUT', '/api/admin/premium/voyage/camp/contenu.json', { cookie: createur, corps: pack, type: 'application/json' });
  assert.equal(r.s, 200, JSON.stringify(r.j)); assert.equal(r.j.cle, 'voyage/camp/contenu.json'); assert.equal(r.j.taille, pack.length);
  const lu = await appel('GET', '/api/premium/voyage/camp/contenu.json', { cookie: createur });
  assert.equal(lu.s, 200); assert.equal(new TextDecoder().decode(lu.octets), pack); assert.equal(lu.h.get('Cache-Control'), 'private, no-store');
  assert.equal((await appel('GET', '/api/premium/voyage/camp/contenu.json', { cookie: parent })).s, 403, 'le contenu reste fermé à un compte sans droit');
});

test('l\'import refuse les chemins piégés', async () => {
  const createur = await connecter(CREATEUR, 'creator');
  for (const piege of ['..%2Fdroits%2Fx', 'voyage%2F..%2F..%2Fsecret', 'voyage%2F%2Fcamp', 'VOYAGE%2Fcamp%2Fa.json', 'voyage%2Fcamp%2F', 'voyage%2Fca%20mp%2Fa.json', '%2e%2e%2Fx', 'voyage%2Fcamp%2F' + 'a'.repeat(250) + '.json'])
    assert.equal((await appel('PUT', '/api/admin/premium/' + piege, { cookie: createur, corps: '{}', type: 'application/json' })).s, 400, piege.slice(0, 30));
  assert.equal(fichiers.size, 0, 'rien n\'a été enregistré');
});

test('l\'import n\'accepte que les types du pack (JSON, voix MP3, page, feuille de style, script, image) : un exécutable est refusé (415)', async () => {
  const createur = await connecter(CREATEUR, 'creator');
  assert.equal((await appel('PUT', '/api/admin/premium/voyage/camp/script.exe', { cookie: createur, corps: 'MZ', type: 'application/x-msdownload' })).s, 415);
  assert.equal((await appel('PUT', '/api/admin/premium/voyage/camp/sans-type.bin', { cookie: createur, corps: 'xx' })).s, 415, 'sans type déclaré');
  assert.equal(fichiers.size, 0);
  for (const [nom, type] of [['a.json', 'application/json'], ['voix/a.mp3', 'audio/mpeg'], ['index.html', 'text/html'], ['jeu.css', 'text/css'], ['jeu.js', 'text/javascript'], ['i.png', 'image/png'], ['i.jpg', 'image/jpeg'], ['i.svg', 'image/svg+xml']])
    assert.equal((await appel('PUT', '/api/admin/premium/voyage/camp/' + nom, { cookie: createur, corps: 'x', type })).s, 200, type);
});

test('l\'import refuse un fichier vide (400) et un fichier de plus de 25 Mo (413) sans rien enregistrer', async () => {
  const createur = await connecter(CREATEUR, 'creator');
  assert.equal((await appel('PUT', '/api/admin/premium/voyage/camp/vide.json', { cookie: createur, corps: '', type: 'application/json' })).s, 400);
  assert.equal((await appel('PUT', '/api/admin/premium/voyage/camp/gros.mp3', { cookie: createur, corps: new Uint8Array(26 * 1024 * 1024), type: 'audio/mpeg' })).s, 413);
  assert.equal(fichiers.size, 0);
  assert.equal((await appel('PUT', '/api/admin/premium/voyage/camp/ok.mp3', { cookie: createur, corps: new Uint8Array(24 * 1024 * 1024), type: 'audio/mpeg' })).s, 200, 'une voix de 24 Mo passe');
});

test('sans stockage branché (R2 non lié), l\'import répond clairement « stockage-non-branche » (503) au lieu d\'échouer en silence', async () => {
  const createur = await connecter(CREATEUR, 'creator'); stockageBranche = false;
  const r = await appel('PUT', '/api/admin/premium/voyage/camp/b.json', { cookie: createur, corps: '{}', type: 'application/json' });
  assert.equal(r.s, 503); assert.equal(r.j.erreur, 'stockage-non-branche');
});

test('le Créateur supprime un fichier importé ; supprimer deux fois ne pose pas de problème ; un chemin piégé est refusé', async () => {
  const createur = await connecter(CREATEUR, 'creator');
  await appel('PUT', '/api/admin/premium/voyage/camp/a.json', { cookie: createur, corps: '{}', type: 'application/json' }); assert.equal(fichiers.size, 1);
  assert.equal((await appel('DELETE', '/api/admin/premium/voyage/camp/a.json', { cookie: createur })).s, 200); assert.equal(fichiers.size, 0);
  assert.equal((await appel('DELETE', '/api/admin/premium/voyage/camp/a.json', { cookie: createur })).s, 200);
  assert.equal((await appel('DELETE', '/api/admin/premium/VOYAGE%2Fx', { cookie: createur })).s, 400);
  assert.equal((await appel('DELETE', '/api/admin/premium/voyage/camp/a.json', { cookie: await connecter('uid-parent') })).s, 403, 'réservé au Créateur');
});

test('le stockage R2 réel (liaison R2_PREMIUM) sait écrire, lire, lister et supprimer ; sans liaison, il n\'écrit rien', async () => {
  const { stockagePremium } = await import('../../functions/api/[[route]].js');
  const objets = new Map();
  const r2 = {
    async put(cle, corps, opts) { objets.set(cle, { body: corps, httpMetadata: opts && opts.httpMetadata, size: corps.length, uploaded: 'maintenant' }); },
    async get(cle) { return objets.get(cle) || null; }, async delete(cle) { objets.delete(cle); },
    async list() { return { objects: [...objets].map(([key, o]) => ({ key, size: o.size, uploaded: o.uploaded })), truncated: false }; }
  };
  const s = stockagePremium({ R2_PREMIUM: r2 });
  await s.put('voyage/camp/contenu.json', new TextEncoder().encode('{"a":1}'), 'application/json');
  assert.equal(objets.get('voyage/camp/contenu.json').httpMetadata.contentType, 'application/json', 'le type est enregistré avec le fichier');
  assert.equal((await s.get('voyage/camp/contenu.json')).type, 'application/json');
  assert.deepEqual((await s.lister()).map(f => f.cle), ['voyage/camp/contenu.json']);
  await s.supprimer('voyage/camp/contenu.json'); assert.equal(objets.size, 0);
  const sans = stockagePremium({});
  assert.equal(sans.type, 'aucun'); assert.equal(sans.put, undefined, 'sans R2 lié : pas de fonction d\'écriture, l\'import répond « stockage-non-branche »');
});

test('l\'administration permet d\'importer le dossier du pack sans ligne de commande : sélecteur de dossier, envoi fichier par fichier au même chemin, avec la reconnexion récente gérée', async () => {
  const fs = await import('node:fs'); const h = fs.readFileSync(new URL('../../admin/index.html', import.meta.url), 'utf8');
  assert.match(h, /id="pi-dossier"[^>]*webkitdirectory/);
  assert.match(h, /id="pi-envoyer"/);
  assert.match(h, /f\.webkitRelativePath\.split\('\/'\)\.slice\(1\)\.join\('\/'\)/, 'le chemin dans le stockage = le chemin dans le dossier choisi, sans le nom du dossier lui-même');
  assert.match(h, /method: 'PUT', credentials: 'same-origin', headers: \{ 'X-LDN': '1', 'Content-Type': type \}/);
  assert.match(h, /\$\('pi-envoyer'\)\.onclick = e => occupe\(e\.target/, 'passe par occupe() : la reconnexion récente est redemandée puis l\'envoi reprend');
});
