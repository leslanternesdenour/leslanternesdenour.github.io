// Synchronisation de l'abonnement avec le VRAI Stripe en MODE TEST (aucun paiement réel). Désactivé par défaut : il appelle l'API Stripe.
//   PowerShell : $env:LDN_STRIPE_TEST='1'; node --test outils/tests/stripe-synchro-reel.test.mjs
// Lit .dev.vars (clés de TEST, jamais affichées). Refuse toute clé réelle. Nettoie ses données de test chez Stripe.
// La route testée est la vraie (traiter) ; seuls la base (mémoire) et la vérification du jeton Firebase (clé de test locale) sont simulés.
import test, { after } from 'node:test'; import assert from 'node:assert/strict';
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto'; import { fileURLToPath } from 'node:url';
import { clientStripe } from '../../serveur/stripe.js';
import { traiter, _reinitialiserCompteurs } from '../../serveur/api.js';
import { creerBase } from './base-testee.mjs';
import { verifierJeton } from '../../serveur/jeton.js';

const ACTIF = process.env.LDN_STRIPE_TEST === '1';
const opts = { skip: !ACTIF && 'LDN_STRIPE_TEST=1 requis (appels réels à Stripe, mode test)' };
const vars = {};
if (ACTIF) for (const l of fs.readFileSync(path.join(fileURLToPath(new URL('../../', import.meta.url)), '.dev.vars'), 'utf8').split(/\r?\n/)) { const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(l); if (m) vars[m[1]] = m[2]; }
if (ACTIF && !/^sk_test_/.test(vars.STRIPE_CLE_SECRETE || '')) throw new Error('STRIPE_CLE_SECRETE de .dev.vars absente ou pas une clé de TEST : arrêt.');
const PROJET = 'ldn-verif', O = 'https://verif.exemple', UID = 'uid-reel-' + crypto.randomBytes(4).toString('hex');
const env = { CREATOR_UID: 'uid-createur', SESSION_SECRET: crypto.randomBytes(32).toString('hex'), FIREBASE_PROJET: PROJET, STRIPE_SECRET_WEBHOOK: 'whsec_local',
  STRIPE_PRIX_PREMIUM_MENSUEL: vars.STRIPE_PRIX_PREMIUM_MENSUEL, STRIPE_PRIX_PREMIUM_ANNUEL: vars.STRIPE_PRIX_PREMIUM_ANNUEL, STRIPE_PRIX_FAMILLE_ANNUEL: vars.STRIPE_PRIX_FAMILLE_ANNUEL, STRIPE_CLE_SECRETE: vars.STRIPE_CLE_SECRETE };
const stripe = ACTIF ? clientStripe({ STRIPE_CLE_SECRETE: vars.STRIPE_CLE_SECRETE }) : null;
const cles = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
const b64u = o => Buffer.from(JSON.stringify(o)).toString('base64url');
const base = creerBase();
const ctx = () => ({ env, base, maintenant: Date.now(), stripe,
  auth: { verifierIdToken: (t, m) => verifierJeton(t, { projet: PROJET, obtenirCle: async k => k === 'k1' ? cles.publicKey : null, maintenant: m }) }, stockage: { async get() { return null; } } });
async function jeton(uid) {
  const s = Math.floor(Date.now() / 1000), tete = b64u({ alg: 'RS256', kid: 'k1' }) + '.' + b64u({ iss: 'https://securetoken.google.com/' + PROJET, aud: PROJET, firebase: { sign_in_provider: 'password' }, sub: uid, iat: s - 10, exp: s + 3000, auth_time: s - 60, email: uid + '@exemple.fr', email_verified: true });
  return tete + '.' + Buffer.from(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cles.privateKey, new TextEncoder().encode(tete))).toString('base64url');
}
async function appel(m, chemin, { corps, cookie } = {}) {
  const r = await traiter(new Request(O + chemin, { method: m, headers: { ...(m !== 'GET' ? { 'X-LDN': '1', Origin: O } : {}), ...(cookie ? { Cookie: cookie } : {}) }, body: corps === undefined ? undefined : JSON.stringify(corps) }), ctx());
  const t = await r.text(); let j; try { j = JSON.parse(t); } catch (e) { j = t; } return { s: r.status, j, h: r.headers };
}
const aplatir = (o, p = '') => Object.entries(o).flatMap(([k, v]) => { const n = p ? `${p}[${k}]` : k; return v && typeof v === 'object' ? aplatir(v, n) : [[n, String(v)]]; });
async function api(methode, chemin, params = {}) {
  const r = await fetch('https://api.stripe.com/v1/' + chemin, { method: methode, headers: { Authorization: 'Bearer ' + vars.STRIPE_CLE_SECRETE, 'Content-Type': 'application/x-www-form-urlencoded' }, body: methode === 'GET' ? undefined : new URLSearchParams(aplatir(params)).toString() });
  const j = await r.json(); if (!r.ok) throw new Error('Stripe ' + chemin + ' : ' + (j.error && (j.error.code || j.error.message))); return j;
}
const etat = {};
after(async () => { if (ACTIF && etat.client) { try { await api('DELETE', 'customers/' + etat.client); } catch (e) {} } });
test.beforeEach(() => _reinitialiserCompteurs());

test('vrai Stripe (test) : session de paiement ouverte = rien d\'activé ; abonnement payé par carte de test = retrouvé, activé puis relu (renouvellement, fin) par la vraie route', opts, async () => {
  const r = await appel('POST', '/api/session', { corps: { idToken: await jeton(UID), consentements: { parent: true, cgu: true, confidentialite: true } } });
  assert.equal(r.s, 200); const cookie = r.h.get('Set-Cookie').split(';')[0];
  // 1. vraie session Checkout d'abonnement (page de paiement Stripe, non payée) : la synchronisation la lit et refuse d'activer
  const ouvert = await appel('POST', '/api/paiement/session', { cookie, corps: { formule: 'premium_mensuel', consentements: { cgv: true, executionImmediate: true } } });
  assert.equal(ouvert.s, 200, JSON.stringify(ouvert.j)); assert.match(ouvert.j.url, /^https:\/\/checkout\.stripe\.com\//);
  const sessionId = (await base.lister('consentements_achat', { limite: 5 })).docs[0].id; assert.match(sessionId, /^cs_test_/);
  const nonPaye = await appel('POST', '/api/abonnement/synchroniser', { cookie, corps: { sessionId } });
  assert.equal(nonPaye.s, 409); assert.equal(nonPaye.j.erreur, 'paiement-non-termine');
  assert.equal((await appel('GET', '/api/moi', { cookie })).j.statut, 'gratuit');
  // 2. abonnement payé avec la carte de test (créé directement chez Stripe, comme le fait Checkout), avec la métadonnée « uid »
  const client = await api('POST', 'customers', { email: UID + '@exemple.fr', name: 'Verification Technique', metadata: { uid: UID } }); etat.client = client.id;
  const pm = await api('POST', 'payment_methods/pm_card_visa/attach', { customer: client.id });
  const abo = await api('POST', 'subscriptions', { customer: client.id, items: { 0: { price: vars.STRIPE_PRIX_PREMIUM_MENSUEL } }, default_payment_method: pm.id, metadata: { uid: UID } });
  assert.equal(abo.status, 'active'); assert.equal(abo.livemode, false);
  // 3. la recherche par compte peut mettre un moment à voir le nouvel abonnement (Stripe) : on réessaie jusqu'à 90 s
  let sync; for (let i = 0; i < 30; i++) { sync = await appel('POST', '/api/abonnement/synchroniser', { cookie, corps: {} }); if (sync.s === 200) break; await new Promise(ok => setTimeout(ok, 3000)); }
  assert.equal(sync.s, 200, JSON.stringify(sync.j)); assert.equal(sync.j.niveau, 'premium');
  const moi = (await appel('GET', '/api/moi', { cookie })).j;
  assert.equal(moi.statut, 'abonne'); assert.equal(moi.niveau, 'premium'); assert.equal(moi.abonnement.formule, 'premium_mensuel'); assert.ok(moi.expire > Date.now() + 20 * 86400000, 'la fin de période vient de Stripe');
  // 4. abonnement maintenant connu : la relecture passe par son identifiant (renouvellement, résiliation), puis la fin réelle chez Stripe retire l'accès
  await api('POST', 'subscriptions/' + abo.id, { cancel_at_period_end: 'true' });
  assert.equal((await appel('POST', '/api/abonnement/synchroniser', { cookie, corps: {} })).s, 200);
  const programme = (await appel('GET', '/api/moi', { cookie })).j; assert.equal(programme.abonnement.annulationFinPeriode, true); assert.equal(programme.statut, 'abonne');
  await api('DELETE', 'subscriptions/' + abo.id);
  assert.equal((await appel('POST', '/api/abonnement/synchroniser', { cookie, corps: {} })).s, 200);
  assert.equal((await appel('GET', '/api/moi', { cookie })).j.statut, 'gratuit', 'abonnement terminé chez Stripe : plus de Premium');
});
