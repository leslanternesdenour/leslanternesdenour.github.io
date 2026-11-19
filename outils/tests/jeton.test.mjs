// Tests de la vérification des jetons Firebase (clés RSA générées localement) : node --test outils/tests/jeton.test.mjs
import test from 'node:test'; import assert from 'node:assert/strict';
import { verifierJeton, connexionRecente, cleGoogle, JetonInvalide } from '../../serveur/jeton.js';
import { calculerDroits } from '../../serveur/droits.js';

const PROJET = 'lanternes-de-nour-test', T = Date.UTC(2026, 10, 19, 12), s = Math.floor(T / 1000);
const algo = { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' };
const bonne = await crypto.subtle.generateKey(algo, true, ['sign', 'verify']);
const pirate = await crypto.subtle.generateKey(algo, true, ['sign', 'verify']);
const b64u = o => Buffer.from(typeof o === 'string' ? o : JSON.stringify(o)).toString('base64url');
async function signer(charge, { cle = bonne.privateKey, kid = 'k1', alg = 'RS256' } = {}) {
  const tete = b64u({ alg, kid, typ: 'JWT' }) + '.' + b64u(charge);
  const sig = Buffer.from(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cle, new TextEncoder().encode(tete))).toString('base64url');
  return tete + '.' + sig;
}
const base = (x = {}) => ({ iss: 'https://securetoken.google.com/' + PROJET, aud: PROJET, sub: 'uid-parent', iat: s - 60, exp: s + 3000, auth_time: s - 120, email: 'p@exemple.fr', email_verified: true, ...x });
const obtenirCle = async kid => kid === 'k1' ? bonne.publicKey : null;
const v = (j, o = {}) => verifierJeton(j, { projet: PROJET, obtenirCle, maintenant: T, ...o });
const refus = async (j, raison, o) => { await assert.rejects(v(j, o), e => e instanceof JetonInvalide && e.raison === raison, raison); };

test('jeton valide accepté', async () => {
  const r = await v(await signer(base())); assert.equal(r.uid, 'uid-parent'); assert.equal(r.emailVerifie, true);
});
test('signature d\'une autre clé : refusée', async () => refus(await signer(base(), { cle: pirate.privateKey }), 'signature'));
test('charge modifiée après signature (uid changé) : refusée', async () => {
  const j = (await signer(base())).split('.'); j[1] = b64u(base({ sub: 'uid-createur', role: 'creator' }));
  await refus(j.join('.'), 'signature');
});
test('algorithme « none » ou HS256 : refusé', async () => {
  await refus(b64u({ alg: 'none', kid: 'k1' }) + '.' + b64u(base()) + '.', 'algorithme');
  await refus(await signer(base(), { alg: 'HS256' }), 'algorithme');
});
test('clé inconnue : refusée', async () => refus(await signer(base(), { kid: 'inconnue' }), 'cle-inconnue'));
test('expiré, émis dans le futur, mauvais projet, mauvais émetteur, sans utilisateur : refusés', async () => {
  await refus(await signer(base({ exp: s - 3600 })), 'expire');
  await refus(await signer(base({ iat: s + 3600 })), 'date-emission');
  await refus(await signer(base({ aud: 'autre-projet' })), 'audience');
  await refus(await signer(base({ iss: 'https://securetoken.google.com/autre-projet' })), 'emetteur');
  await refus(await signer(base({ sub: '' })), 'utilisateur');
  await refus('pas-un-jeton', 'format');
});
test('cookie de session : émetteur différent exigé', async () => {
  const sess = base({ iss: 'https://session.firebase.google.com/' + PROJET });
  assert.equal((await v(await signer(sess), { type: 'session' })).uid, 'uid-parent');
  await refus(await signer(base()), 'emetteur', { type: 'session' });
  await refus(await signer(sess), 'emetteur');
});
test('connexion récente (< 15 min) pour l\'administration', async () => {
  assert.equal(connexionRecente(await v(await signer(base({ auth_time: s - 600 }))), T), true);
  assert.equal(connexionRecente(await v(await signer(base({ auth_time: s - 1200 }))), T), false);
});
test('chaîne complète : jeton signé + rôle + CREATOR_UID → Créateur ; jeton forgé → gratuit', async () => {
  const env = { CREATOR_UID: 'uid-createur' };
  const ok = await v(await signer(base({ sub: 'uid-createur', role: 'creator' })));
  assert.equal(calculerDroits({ uid: ok.uid, claims: ok.claims, env, maintenant: T }).statut, 'creator');
  const autre = await v(await signer(base({ sub: 'uid-proche', role: 'creator' })));
  assert.equal(calculerDroits({ uid: autre.uid, claims: autre.claims, env, maintenant: T }).statut, 'gratuit', 'rôle posé sur un autre compte');
  await refus(await signer(base({ sub: 'uid-createur', role: 'creator' }), { cle: pirate.privateKey }), 'signature');
});
test('clés Google : téléchargées une fois puis gardées en cache', async () => {
  const jwk = await crypto.subtle.exportKey('jwk', bonne.publicKey); let appels = 0;
  const fetcher = async () => { appels++; return new Response(JSON.stringify({ keys: [{ ...jwk, kid: 'k1', alg: 'RS256' }] }), { headers: { 'Cache-Control': 'public, max-age=3600' } }); };
  assert.ok(await cleGoogle('k1', 'id', { fetcher, maintenant: T }));
  assert.ok(await cleGoogle('k1', 'id', { fetcher, maintenant: T + 1000 }));
  assert.equal(await cleGoogle('k2', 'id', { fetcher, maintenant: T + 2000 }), null);
  assert.equal(appels, 1);
});
