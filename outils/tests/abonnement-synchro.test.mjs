// Abonnement : au retour du paiement Stripe, le serveur vérifie lui-même la session auprès de Stripe (clé secrète côté serveur) et active
// le Premium tout de suite, sans attendre le webhook. Vraies routes et vraies sessions ; seuls la base et Stripe sont simulés.
import test from 'node:test'; import assert from 'node:assert/strict';
import { traiter, _reinitialiserCompteurs } from '../../serveur/api.js';
import { creerBase } from './base-testee.mjs';
import { verifierJeton } from '../../serveur/jeton.js';
import { clientStripe } from '../../serveur/stripe.js';

const PROJET = 'ldn-test', J = 86400000, O = 'https://preprod.exemple';
const env = { CREATOR_UID: 'uid-createur', SESSION_SECRET: 'secret-de-test-tres-long-0123456789abcdef', FIREBASE_PROJET: PROJET,
  STRIPE_SECRET_WEBHOOK: 'whsec_test_local', STRIPE_PRIX_PREMIUM_MENSUEL: 'price_pm', STRIPE_PRIX_PREMIUM_ANNUEL: 'price_pa', STRIPE_PRIX_FAMILLE_ANNUEL: 'price_fa' };
const cles = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
const b64u = o => Buffer.from(JSON.stringify(o)).toString('base64url');
const maintenant = Date.UTC(2026, 10, 24, 10);
async function jeton(uid, verifie = true) {
  const s = Math.floor(maintenant / 1000), tete = b64u({ alg: 'RS256', kid: 'k1' }) + '.' + b64u({ iss: 'https://securetoken.google.com/' + PROJET, aud: PROJET, firebase: { sign_in_provider: 'password' }, sub: uid, iat: s - 10, exp: s + 3000, auth_time: s - 60, email: uid + '@exemple.fr', email_verified: verifie });
  return tete + '.' + Buffer.from(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cles.privateKey, new TextEncoder().encode(tete))).toString('base64url');
}
const base = creerBase();
const sessionsStripe = {};                 // id de session Checkout → objet renvoyé par Stripe (simulé)
const appelsStripe = [];
const abonnementsStripe = {};              // id d'abonnement → objet renvoyé par Stripe (simulé)
let rechercheStripe = [];                  // résultat de la recherche d'abonnements par compte (simulé : lente à voir les nouveautés)
const clientsStripe = {};                  // adresse e-mail → clients Stripe (simulé : lecture immédiate)
const abonnementsDuClient = {};            // id client → abonnements (simulé : lecture immédiate)
const fauxStripe = async (u, o) => {
  appelsStripe.push({ u, o });
  const lc = /customers\?.*email=([^&]+)/.exec(u); if (lc) return new Response(JSON.stringify({ data: clientsStripe[decodeURIComponent(lc[1])] || [] }), { status: 200 });
  const la = /subscriptions\?.*customer=([^&]+)/.exec(u); if (la) return new Response(JSON.stringify({ data: abonnementsDuClient[decodeURIComponent(la[1])] || [] }), { status: 200 });
  if (u.includes('subscriptions/search')) return new Response(JSON.stringify({ data: rechercheStripe }), { status: 200 });
  const a = /subscriptions\/(sub_[A-Za-z0-9_-]+)$/.exec(u);
  if (a && (!o || o.method === 'GET')) return a[1] in abonnementsStripe ? new Response(JSON.stringify(abonnementsStripe[a[1]]), { status: 200 }) : new Response(JSON.stringify({ error: { message: 'No such subscription' } }), { status: 404 });
  const m = /checkout\/sessions\/(cs_[A-Za-z0-9_]+)/.exec(u);
  if (m) return m[1] in sessionsStripe ? new Response(JSON.stringify(sessionsStripe[m[1]]), { status: 200 }) : new Response(JSON.stringify({ error: { message: 'No such session' } }), { status: 404 });
  return new Response(JSON.stringify({ id: 'cs_test_1', url: 'https://checkout.stripe.com/c/test' }), { status: 200 });
};
const ctx = () => ({ env, base, maintenant,
  auth: { verifierIdToken: (t, m) => verifierJeton(t, { projet: PROJET, obtenirCle: async k => k === 'k1' ? cles.publicKey : null, maintenant: m }) },
  stockage: { async get() { return null; } }, stripe: clientStripe({ STRIPE_CLE_SECRETE: 'sk_test_local' }, { fetcher: fauxStripe }) });
async function appel(m, chemin, { corps, cookie } = {}) {
  const r = await traiter(new Request(O + chemin, { method: m, headers: { ...(m !== 'GET' ? { 'X-LDN': '1', Origin: O } : {}), ...(cookie ? { Cookie: cookie } : {}) }, body: corps === undefined ? undefined : JSON.stringify(corps) }), ctx());
  const t = await r.text(); let j; try { j = JSON.parse(t); } catch (e) { j = t; } return { s: r.status, j };
}
async function connecter(uid, verifie = true) {
  const r = await traiter(new Request(O + '/api/session', { method: 'POST', headers: { 'X-LDN': '1', Origin: O }, body: JSON.stringify({ idToken: await jeton(uid, verifie), consentements: { parent: true, cgu: true, confidentialite: true } }) }), ctx());
  assert.equal(r.status, 200); return r.headers.get('Set-Cookie').split(';')[0];
}
const sessionPayee = (uid, prix = 'price_pm', statut = 'active', fin = maintenant + 30 * J) => ({ id: 'cs_test_paye', status: 'complete', mode: 'subscription', client_reference_id: uid,
  subscription: { id: 'sub_' + uid, customer: 'cus_' + uid, status: statut, current_period_end: Math.floor(fin / 1000), cancel_at_period_end: false, metadata: { uid }, items: { data: [{ price: { id: prix } }] } } });

test.beforeEach(() => _reinitialiserCompteurs());

test('au retour du paiement, l\'abonnement s\'active tout de suite (sans webhook) : Premium actif, fin de période de Stripe', async () => {
  const c = await connecter('uid-retour');
  sessionsStripe.cs_test_paye = sessionPayee('uid-retour');
  const r = await appel('POST', '/api/abonnement/synchroniser', { cookie: c, corps: { sessionId: 'cs_test_paye' } });
  assert.equal(r.s, 200, JSON.stringify(r.j));
  const moi = (await appel('GET', '/api/moi', { cookie: c })).j;
  assert.equal(moi.statut, 'abonne'); assert.equal(moi.niveau, 'premium'); assert.equal(moi.expire, maintenant + 30 * J);
});

test('la session de paiement d\'un autre compte est refusée : personne ne peut activer l\'abonnement de quelqu\'un d\'autre', async () => {
  const intrus = await connecter('uid-intrus');
  sessionsStripe.cs_test_victime = { ...sessionPayee('uid-victime'), id: 'cs_test_victime' };
  const r = await appel('POST', '/api/abonnement/synchroniser', { cookie: intrus, corps: { sessionId: 'cs_test_victime' } });
  assert.equal(r.s, 403); assert.equal(r.j.erreur, 'session-autre-compte');
  assert.equal((await appel('GET', '/api/moi', { cookie: intrus })).j.statut, 'gratuit');
});

test('un paiement pas terminé (session ouverte, sans abonnement) n\'active rien', async () => {
  const c = await connecter('uid-pas-fini');
  sessionsStripe.cs_test_ouverte = { id: 'cs_test_ouverte', status: 'open', mode: 'subscription', client_reference_id: 'uid-pas-fini', subscription: null };
  const r = await appel('POST', '/api/abonnement/synchroniser', { cookie: c, corps: { sessionId: 'cs_test_ouverte' } });
  assert.equal(r.s, 409); assert.equal(r.j.erreur, 'paiement-non-termine');
  assert.equal((await appel('GET', '/api/moi', { cookie: c })).j.statut, 'gratuit');
});

test('un identifiant de session invalide est refusé sans appeler Stripe, une session inconnue répond « introuvable » (jamais une erreur serveur)', async () => {
  const c = await connecter('uid-ids');
  const avant = appelsStripe.length;
  for (const mauvais of ['', '../x', 'sub_123', 'cs_test_', 'cs_test_<script>', 'cs_test_' + 'a'.repeat(300)]) {
    const r = await appel('POST', '/api/abonnement/synchroniser', { cookie: c, corps: { sessionId: mauvais } });
    assert.equal(r.s, 400, JSON.stringify(mauvais).slice(0, 30)); assert.equal(r.j.erreur, 'session-invalide');
  }
  assert.equal(appelsStripe.length, avant, 'Stripe n\'est pas appelé pour un identifiant invalide');
  const inconnue = await appel('POST', '/api/abonnement/synchroniser', { cookie: c, corps: { sessionId: 'cs_test_inexistante' } });
  assert.equal(inconnue.s, 404); assert.equal(inconnue.j.erreur, 'session-inconnue');
});

test('un compte dont l\'adresse e-mail n\'est pas vérifiée ne peut pas synchroniser un abonnement (la vérification reste obligatoire côté serveur)', async () => {
  const c = await connecter('uid-non-verifie', false);
  sessionsStripe.cs_test_nv = { ...sessionPayee('uid-non-verifie'), id: 'cs_test_nv' };
  const r = await appel('POST', '/api/abonnement/synchroniser', { cookie: c, corps: { sessionId: 'cs_test_nv' } });
  assert.equal(r.s, 403); assert.equal(r.j.erreur, 'email-non-verifie');
});

test('sans identifiant de session, la synchronisation relit l\'abonnement chez Stripe : un renouvellement prolonge l\'accès, une fin le retire (même sans webhook)', async () => {
  const c = await connecter('uid-renouvelle');
  sessionsStripe.cs_test_renouv = { ...sessionPayee('uid-renouvelle'), id: 'cs_test_renouv' };
  assert.equal((await appel('POST', '/api/abonnement/synchroniser', { cookie: c, corps: { sessionId: 'cs_test_renouv' } })).s, 200);
  abonnementsStripe.sub_uid_renouvelle = undefined; delete abonnementsStripe.sub_uid_renouvelle;
  const sub = sessionsStripe.cs_test_renouv.subscription;
  abonnementsStripe['sub_uid-renouvelle'] = { ...sub, current_period_end: Math.floor((maintenant + 60 * J) / 1000) };
  const r = await appel('POST', '/api/abonnement/synchroniser', { cookie: c, corps: {} });
  assert.equal(r.s, 200, JSON.stringify(r.j));
  assert.equal((await appel('GET', '/api/moi', { cookie: c })).j.expire, maintenant + 60 * J, 'la nouvelle fin de période de Stripe est prise');
  abonnementsStripe['sub_uid-renouvelle'] = { ...sub, status: 'canceled' };
  await appel('POST', '/api/abonnement/synchroniser', { cookie: c, corps: {} });
  assert.equal((await appel('GET', '/api/moi', { cookie: c })).j.statut, 'gratuit', 'abonnement terminé chez Stripe : plus de Premium');
});

test('un abonné qui revient sans identifiant de session (autre appareil, page rechargée) est retrouvé par son compte chez Stripe ; l\'abonnement d\'un autre compte est ignoré', async () => {
  const c = await connecter('uid-autre-appareil');
  const sub = uid => sessionPayee(uid).subscription;
  rechercheStripe = [sub('uid-autre-appareil')];
  const r = await appel('POST', '/api/abonnement/synchroniser', { cookie: c, corps: {} });
  assert.equal(r.s, 200, JSON.stringify(r.j)); assert.equal((await appel('GET', '/api/moi', { cookie: c })).j.statut, 'abonne');
  assert.ok(appelsStripe.some(a => a.u.includes('subscriptions/search') && /metadata\['uid'\]:'uid-autre-appareil'/.test(decodeURIComponent(a.u))), 'la recherche est faite pour CE compte');
  const d = await connecter('uid-sans-rien');
  rechercheStripe = [sub('uid-quelquun-d-autre')];
  const rien = await appel('POST', '/api/abonnement/synchroniser', { cookie: d, corps: {} });
  assert.equal(rien.s, 404); assert.equal(rien.j.erreur, 'aucun-abonnement');
  assert.equal((await appel('GET', '/api/moi', { cookie: d })).j.statut, 'gratuit');
});

test('le repli sans identifiant de session ne dépend pas de l\'index de recherche de Stripe (lent) : il lit les clients de l\'adresse puis leurs abonnements, immédiatement', async () => {
  const c = await connecter('uid-immediat');
  rechercheStripe = [];                                              // l'index de recherche n'a pas encore vu le nouvel abonnement
  clientsStripe['uid-immediat@exemple.fr'] = [{ id: 'cus_immediat' }];
  abonnementsDuClient.cus_immediat = [{ ...sessionPayee('uid-immediat', 'price_fa').subscription, id: 'sub_immediat', customer: 'cus_immediat' }];
  const r = await appel('POST', '/api/abonnement/synchroniser', { cookie: c, corps: {} });
  assert.equal(r.s, 200, JSON.stringify(r.j)); assert.equal(r.j.niveau, 'famille');
  assert.equal((await appel('GET', '/api/moi', { cookie: c })).j.statut, 'abonne');
});

test('un parent qui se réabonne après la fin d\'un ancien abonnement est retrouvé : le nouvel abonnement actif prime sur l\'ancien terminé', async () => {
  const c = await connecter('uid-reabonne');
  sessionsStripe.cs_test_ancien = { ...sessionPayee('uid-reabonne'), id: 'cs_test_ancien' };
  assert.equal((await appel('POST', '/api/abonnement/synchroniser', { cookie: c, corps: { sessionId: 'cs_test_ancien' } })).s, 200);
  abonnementsStripe['sub_uid-reabonne'] = { ...sessionsStripe.cs_test_ancien.subscription, status: 'canceled' };         // l'ancien est terminé
  assert.equal((await appel('POST', '/api/abonnement/synchroniser', { cookie: c, corps: {} })).s, 200);
  assert.equal((await appel('GET', '/api/moi', { cookie: c })).j.statut, 'gratuit');
  clientsStripe['uid-reabonne@exemple.fr'] = [{ id: 'cus_nouveau' }];
  abonnementsDuClient.cus_nouveau = [{ ...sessionPayee('uid-reabonne', 'price_fa').subscription, id: 'sub_nouveau', customer: 'cus_nouveau', created: 2000 }, { ...sessionsStripe.cs_test_ancien.subscription, status: 'canceled', created: 1000 }];
  const r = await appel('POST', '/api/abonnement/synchroniser', { cookie: c, corps: {} });
  assert.equal(r.s, 200, JSON.stringify(r.j)); assert.equal(r.j.niveau, 'famille', 'le nouvel abonnement est pris, pas l\'ancien terminé');
  assert.equal((await appel('GET', '/api/moi', { cookie: c })).j.statut, 'abonne');
});

test('échec de paiement au renouvellement : l\'accès Premium s\'arrête, mais le parent voit « à régulariser » (et peut mettre à jour sa carte) ; une résiliation programmée est visible aussi', async () => {
  const c = await connecter('uid-echec');
  sessionsStripe.cs_test_echec = { ...sessionPayee('uid-echec'), id: 'cs_test_echec' };
  await appel('POST', '/api/abonnement/synchroniser', { cookie: c, corps: { sessionId: 'cs_test_echec' } });
  let moi = (await appel('GET', '/api/moi', { cookie: c })).j;
  assert.deepEqual({ ...moi.abonnement }, { statut: 'active', formule: 'premium_mensuel', finPeriode: maintenant + 30 * J, annulationFinPeriode: false, aRegulariser: false });
  const sub = sessionsStripe.cs_test_echec.subscription;
  abonnementsStripe['sub_uid-echec'] = { ...sub, status: 'past_due' };
  await appel('POST', '/api/abonnement/synchroniser', { cookie: c, corps: {} });
  moi = (await appel('GET', '/api/moi', { cookie: c })).j;
  assert.equal(moi.statut, 'gratuit', 'pas de Premium gratuit sur un paiement échoué'); assert.equal(moi.abonnement.aRegulariser, true);
  abonnementsStripe['sub_uid-echec'] = { ...sub, cancel_at_period_end: true };
  await appel('POST', '/api/abonnement/synchroniser', { cookie: c, corps: {} });
  moi = (await appel('GET', '/api/moi', { cookie: c })).j;
  assert.equal(moi.statut, 'abonne', 'résilié : accès jusqu\'à la fin de la période payée'); assert.equal(moi.abonnement.annulationFinPeriode, true);
  assert.equal((await appel('GET', '/api/moi')).j.abonnement, undefined, 'visiteur : rien');
});

test('le lien de retour du paiement porte l\'identifiant de la session Stripe (pour l\'activation immédiate), et le lien d\'annulation ne change pas', async () => {
  const c = await connecter('uid-lien-retour');
  const r = await appel('POST', '/api/paiement/session', { cookie: c, corps: { formule: 'premium_annuel', consentements: { cgv: true, executionImmediate: true } } });
  assert.equal(r.s, 200, JSON.stringify(r.j));
  const corps = new URLSearchParams(appelsStripe.at(-1).o.body);
  assert.equal(corps.get('success_url'), O + '/compte/?paiement=ok&session_id={CHECKOUT_SESSION_ID}');
  assert.equal(corps.get('cancel_url'), O + '/tarifs/?paiement=annule');
});
