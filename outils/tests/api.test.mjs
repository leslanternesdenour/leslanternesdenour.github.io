// Tests d'intégration de l'API (vraies routes, vraie vérification des jetons RS256, vraies sessions HMAC, vraie signature Stripe ;
// seules la base, le stockage et Stripe sont simulés en mémoire). node --test outils/tests/api.test.mjs
import test from 'node:test'; import assert from 'node:assert/strict';
import { traiter, _reinitialiserCompteurs } from '../../serveur/api.js';
import { creerBase, instantane } from './base-testee.mjs';
import { verifierJeton } from '../../serveur/jeton.js';
import { clientStripe } from '../../serveur/stripe.js';

const PROJET = 'ldn-test', CREATEUR = 'uid-createur', J = 86400000;
const env = { CREATOR_UID: CREATEUR, SESSION_SECRET: 'secret-de-test-tres-long-0123456789abcdef', FIREBASE_PROJET: PROJET,
  STRIPE_SECRET_WEBHOOK: 'whsec_test_local', STRIPE_PRIX_PREMIUM_MENSUEL: 'price_pm', STRIPE_PRIX_PREMIUM_ANNUEL: 'price_pa', STRIPE_PRIX_FAMILLE_ANNUEL: 'price_fa' };
const algo = { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' };
const cles = await crypto.subtle.generateKey(algo, true, ['sign', 'verify']);
const b64u = o => Buffer.from(JSON.stringify(o)).toString('base64url');
let maintenant = Date.UTC(2026, 10, 20, 10);
async function jeton(uid, { email = uid + '@exemple.fr', verifie = true, role, authAgo = 60 } = {}) {
  const s = Math.floor(maintenant / 1000), tete = b64u({ alg: 'RS256', kid: 'k1' }) + '.' + b64u({ iss: 'https://securetoken.google.com/' + PROJET, aud: PROJET, sub: uid, iat: s - 10, exp: s + 3000, auth_time: s - authAgo, email, email_verified: verifie, ...(role ? { role } : {}) });
  return tete + '.' + Buffer.from(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cles.privateKey, new TextEncoder().encode(tete))).toString('base64url');
}
const fichiers = { 'voyage/camp/zone.json': '{"zone":"camp"}', 'maisons/sons/jeu.js': 'export const x=1', 'voyage/village/zone.json': '{}' };
const appelsStripe = [];
const fauxStripe = async (u, o) => { appelsStripe.push({ u, o }); return new Response(JSON.stringify(u.includes('checkout') ? { id: 'cs_test_1', url: 'https://checkout.stripe.com/c/test' } : { id: 'sub_1' }), { status: 200 }); };
const base = creerBase();
let lent = false;
const baseLente = new Proxy(base, { get(t, k) { const v = t[k]; return typeof v === 'function' ? async (...a) => { if (lent && k === 'lire') await new Promise(r => setTimeout(r, 15)); return v.apply(t, a); } : v; } });
const ctx = () => ({ env, base: baseLente, maintenant,
  auth: { verifierIdToken: (t, m) => verifierJeton(t, { projet: PROJET, obtenirCle: async k => k === 'k1' ? cles.publicKey : null, maintenant: m }) },
  stockage: { async get(k) { return k in fichiers ? { body: fichiers[k], type: 'application/json' } : null; } },
  stripe: clientStripe({ STRIPE_CLE_SECRETE: 'sk_test_local' }, { fetcher: fauxStripe }) });
const O = 'https://preprod.exemple';
async function appel(m, chemin, { corps, cookie, entetes = {} } = {}) {
  const h = { ...(m !== 'GET' ? { 'X-LDN': '1', Origin: O } : {}), ...(cookie ? { Cookie: cookie } : {}), ...entetes };
  const r = await traiter(new Request(O + chemin, { method: m, headers: h, body: corps === undefined ? undefined : (typeof corps === 'string' ? corps : JSON.stringify(corps)) }), ctx());
  const t = await r.text(); let j; try { j = JSON.parse(t); } catch (e) { j = t; }
  return { s: r.status, j, h: r.headers };
}
const CONSENT = { parent: true, cgu: true, confidentialite: true };
async function connecter(uid, o = {}) {
  const r = await appel('POST', '/api/session', { corps: { idToken: await jeton(uid, o), consentements: CONSENT } });
  assert.equal(r.s, 200, 'connexion ' + uid + ' ' + JSON.stringify(r.j));
  return r.h.get('Set-Cookie').split(';')[0];
}
async function webhook(evenement, { secret = env.STRIPE_SECRET_WEBHOOK, t = Math.floor(maintenant / 1000) } = {}) {
  const corps = JSON.stringify(evenement), cle = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = Buffer.from(await crypto.subtle.sign('HMAC', cle, new TextEncoder().encode(t + '.' + corps))).toString('hex');
  return appel('POST', '/api/stripe/webhook', { corps, entetes: { 'Stripe-Signature': `t=${t},v1=${sig}` } });
}
const abo = (uid, prix, statut = 'active', fin = maintenant + 30 * J, id = 'evt_' + Math.random()) => ({ id, livemode: false, type: 'customer.subscription.updated', data: { object: { id: 'sub_' + uid, customer: 'cus_' + uid, status: statut, current_period_end: Math.floor(fin / 1000), cancel_at_period_end: false, metadata: { uid }, items: { data: [{ price: { id: prix } }] } } } });

test.beforeEach(() => _reinitialiserCompteurs());

test('Visiteur et protections de base', async () => {
  assert.deepEqual((await appel('GET', '/api/moi')).j, { connecte: false, statut: 'visiteur' });
  assert.equal((await appel('GET', '/api/enfants')).s, 401);
  const sansEntete = await traiter(new Request(O + '/api/enfants', { method: 'POST', body: '{}' }), ctx());
  assert.equal(sansEntete.status, 403, 'requête d\'un autre site (sans X-LDN) refusée');
  assert.equal((await appel('POST', '/api/enfants', { entetes: { Origin: 'https://pirate.exemple' } })).s, 403, 'mauvaise origine refusée');
  assert.equal((await appel('POST', '/api/session', { corps: { idToken: 'faux' } })).s, 401);
});

test('Inscription : consentements parentaux obligatoires et horodatés', async () => {
  const r = await appel('POST', '/api/session', { corps: { idToken: await jeton('uid-p0') } });
  assert.equal(r.s, 428);
  const c = await connecter('uid-p0'); const f = await base.lire('familles', 'uid-p0');
  assert.equal(f.consentements.parent, maintenant); assert.equal(f.consentements.cgu, maintenant);
  assert.match((await appel('POST', '/api/session', { corps: { idToken: await jeton('uid-p0') } })).h.get('Set-Cookie'), /HttpOnly; SameSite=Lax; Secure/);
  assert.equal((await appel('GET', '/api/moi', { cookie: c })).j.statut, 'gratuit');
});

test('Cookie de session falsifié : ignoré', async () => {
  const c = await connecter('uid-p1');
  const [nom, val] = c.split('='); const [corps, sig] = decodeURIComponent(val).split('.');
  const faux = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(corps, 'base64url')), uid: CREATEUR, role: 'creator' })).toString('base64url');
  assert.equal((await appel('GET', '/api/moi', { cookie: `${nom}=${faux}.${sig}` })).j.connecte, false);
});

test('Créateur : profils illimités, pagination de 20 (affichage seulement)', async () => {
  const c = await connecter(CREATEUR, { role: 'creator' });
  const moi = (await appel('GET', '/api/moi', { cookie: c })).j;
  assert.equal(moi.statut, 'creator'); assert.equal(moi.illimite, true); assert.equal(moi.admin, true);
  for (let i = 0; i < 45; i++) assert.equal((await appel('POST', '/api/enfants', { cookie: c, corps: { surnom: 'Test ' + String.fromCharCode(65 + (i % 26)), tranche: '6-10', avatar: 'fille' } })).s, 201);
  const p1 = (await appel('GET', '/api/enfants', { cookie: c })).j; assert.equal(p1.enfants.length, 20); assert.equal(p1.total, 45);
  const p2 = (await appel('GET', '/api/enfants?apres=' + p1.suite, { cookie: c })).j; assert.equal(p2.enfants.length, 20);
  const p3 = (await appel('GET', '/api/enfants?apres=' + p2.suite, { cookie: c })).j; assert.equal(p3.enfants.length, 5); assert.equal(p3.suite, null);
  assert.equal(new Set([...p1.enfants, ...p2.enfants, ...p3.enfants].map(e => e.id)).size, 45, 'aucun doublon entre les pages');
  assert.equal(p1.enfants.filter(e => e.gele).length, 0, 'aucun profil gelé pour le Créateur');
});

test('Le rôle Créateur posé sur un autre compte ne donne rien', async () => {
  const c = await connecter('uid-proche-malin', { role: 'creator' });
  assert.equal((await appel('GET', '/api/moi', { cookie: c })).j.statut, 'gratuit');
  assert.equal((await appel('GET', '/api/admin/resume', { cookie: c })).s, 403);
});

test('Profils enfants : limite du gratuit, minimisation des données', async () => {
  const c = await connecter('uid-p2');
  assert.equal((await appel('POST', '/api/enfants', { cookie: c, corps: { surnom: 'Amina', tranche: '3-5', avatar: 'fille' } })).s, 201);
  assert.equal((await appel('POST', '/api/enfants', { cookie: c, corps: { surnom: 'Yanis', tranche: '6-10', avatar: 'garcon' } })).j.erreur, 'limite-profils');
  for (const mauvais of [{ surnom: 'Amina Dupont 2015', tranche: '3-5', avatar: 'fille' }, { surnom: 'a@b.fr', tranche: '3-5', avatar: 'fille' }, { surnom: 'Ali', tranche: '12', avatar: 'fille' }])
    assert.equal((await appel('POST', '/api/enfants', { cookie: await connecter('uid-p2b' + Math.random().toString(36).slice(2, 6)), corps: mauvais })).s, 400);
  const e = (await appel('GET', '/api/enfants', { cookie: c })).j.enfants[0];
  assert.deepEqual(Object.keys(e).filter(k => e[k] !== undefined).sort(), ['avatar', 'creeLe', 'gele', 'id', 'majLe', 'surnom', 'tranche']);
});

test('Administration : Créateur seul, connexion récente pour toute modification', async () => {
  assert.equal((await appel('GET', '/api/admin/resume', { cookie: await connecter('uid-p3') })).s, 403);
  const ancien = await connecter(CREATEUR, { role: 'creator', authAgo: 3600 });
  assert.equal((await appel('GET', '/api/admin/resume', { cookie: ancien })).s, 200, 'lecture possible');
  assert.equal((await appel('POST', '/api/admin/invitations', { cookie: ancien, corps: { email: 'x@y.fr', niveau: 'premium', dureeJours: 30 } })).j.erreur, 'reconnexion-requise');
});

test('Invitations : 14 jours, adresse précise, e-mail vérifié, usage unique, journal', async () => {
  const adm = await connecter(CREATEUR, { role: 'creator' });
  const inv = (await appel('POST', '/api/admin/invitations', { cookie: adm, corps: { email: 'Soeur@Exemple.fr', niveau: 'famille', dureeJours: 30, libelle: 'Sœur' } })).j;
  const code = decodeURIComponent(inv.lien.split('invite=')[1]);
  assert.equal(inv.expireLe, maintenant + 14 * J);
  assert.equal(JSON.stringify(await base.lire('invitations', inv.id)).includes(code), false, 'le code n\'est pas stocké, seulement son empreinte');
  assert.equal((await appel('POST', '/api/invitations/activer', { cookie: await connecter('uid-autre', { email: 'autre@exemple.fr' }), corps: { code } })).j.erreur, 'autre-adresse');
  assert.equal((await appel('POST', '/api/invitations/activer', { cookie: await connecter('uid-nv', { email: 'soeur@exemple.fr', verifie: false }), corps: { code } })).j.erreur, 'email-non-verifie');
  const soeur = await connecter('uid-soeur', { email: 'soeur@exemple.fr' });
  assert.equal((await appel('POST', '/api/invitations/activer', { cookie: soeur, corps: { code: code + 'x' } })).j.erreur, 'inconnue');
  const ok = await appel('POST', '/api/invitations/activer', { cookie: soeur, corps: { code } });
  assert.equal(ok.s, 200); assert.equal(ok.j.niveau, 'famille');
  const moi = (await appel('GET', '/api/moi', { cookie: soeur })).j;
  assert.equal(moi.statut, 'invite'); assert.equal(moi.niveau, 'famille'); assert.equal(moi.profilsMax, 5); assert.equal(moi.synchro, true);
  assert.equal((await appel('POST', '/api/invitations/activer', { cookie: soeur, corps: { code } })).j.erreur, 'deja-utilisee');
  const j = (await appel('GET', '/api/admin/journal', { cookie: adm })).j.journal.map(x => x.action);
  assert.ok(j.includes('invitation-creee') && j.includes('invitation-activee'));
  // invitation non utilisée : expirée après 14 jours
  const inv2 = (await appel('POST', '/api/admin/invitations', { cookie: adm, corps: { email: 'cousin@exemple.fr', niveau: 'premium', dureeJours: null } })).j;
  maintenant += 15 * J;
  assert.equal((await appel('POST', '/api/invitations/activer', { cookie: await connecter('uid-cousin', { email: 'cousin@exemple.fr' }), corps: { code: decodeURIComponent(inv2.lien.split('invite=')[1]) } })).j.erreur, 'expiree');
  maintenant -= 15 * J;
});

test('Révocation : retour au gratuit, profils conservés et gelés, progression gratuite intacte ; prolongation', async () => {
  const adm = await connecter(CREATEUR, { role: 'creator' });
  const inv = (await appel('POST', '/api/admin/invitations', { cookie: adm, corps: { email: 'frere@exemple.fr', niveau: 'famille', dureeJours: 60 } })).j;
  const frere = await connecter('uid-frere', { email: 'frere@exemple.fr' });
  await appel('POST', '/api/invitations/activer', { cookie: frere, corps: { code: decodeURIComponent(inv.lien.split('invite=')[1]) } });
  const ids = [];
  for (const n of ['Adam', 'Sara', 'Ilyes']) ids.push((await appel('POST', '/api/enfants', { cookie: frere, corps: { surnom: n, tranche: '6-10', avatar: 'garcon' } })).j.id);
  assert.equal((await appel('PUT', `/api/enfants/${ids[1]}/progression`, { cookie: frere, corps: { progression: { ablutions: { g1: 3 } } } })).s, 200);
  const acces = (await appel('GET', '/api/admin/acces', { cookie: adm })).j.acces.find(a => a.uid === 'uid-frere');
  assert.equal((await appel('POST', `/api/admin/acces/${acces.id}/revoquer`, { cookie: adm })).s, 200);
  const moi = (await appel('GET', '/api/moi', { cookie: frere })).j;
  assert.equal(moi.statut, 'gratuit'); assert.equal(moi.profilsMax, 1);
  const enfants = (await appel('GET', '/api/enfants', { cookie: frere })).j;
  assert.equal(enfants.total, 3, 'aucun profil supprimé');
  assert.deepEqual(enfants.enfants.map(e => e.gele), [false, true, true], 'le premier reste actif, les autres gelés');
  assert.deepEqual((await base.lire('familles/uid-frere/enfants', ids[1])).progression, { ablutions: { g1: 3 } }, 'progression conservée');
  assert.equal((await appel('POST', '/api/enfants', { cookie: frere, corps: { surnom: 'Lina', tranche: '3-5', avatar: 'fille' } })).j.erreur, 'limite-profils');
  // le parent choisit l'enfant actif
  await appel('POST', `/api/enfants/${ids[2]}/actif`, { cookie: frere });
  assert.deepEqual((await appel('GET', '/api/enfants', { cookie: frere })).j.enfants.map(e => e.gele), [true, true, false]);
  // prolonger en permanent : tout est dégelé
  assert.equal((await appel('POST', `/api/admin/acces/${acces.id}/prolonger`, { cookie: adm, corps: { permanent: true } })).s, 200);
  assert.equal((await appel('GET', '/api/moi', { cookie: frere })).j.statut, 'invite');
  assert.deepEqual((await appel('GET', '/api/enfants', { cookie: frere })).j.enfants.map(e => e.gele), [false, false, false]);
});

test('Double facturation bloquée dans les deux sens', async () => {
  await connecter('uid-payeur', { email: 'payeur@exemple.fr' });
  assert.equal((await webhook(abo('uid-payeur', 'price_pm'))).s, 200);
  const adm = await connecter(CREATEUR, { role: 'creator' });
  const inv = (await appel('POST', '/api/admin/invitations', { cookie: adm, corps: { email: 'payeur@exemple.fr', niveau: 'premium', dureeJours: 30 } })).j;
  const payeur = await connecter('uid-payeur', { email: 'payeur@exemple.fr' });
  assert.equal((await appel('POST', '/api/invitations/activer', { cookie: payeur, corps: { code: decodeURIComponent(inv.lien.split('invite=')[1]) } })).j.erreur, 'abonnement-actif');
  assert.equal((await appel('POST', '/api/admin/acces', { cookie: adm, corps: { email: 'payeur@exemple.fr', niveau: 'famille', dureeJours: 30 } })).j.erreur, 'abonnement-actif');
  const invite = await connecter('uid-soeur', { email: 'soeur@exemple.fr' });
  assert.equal((await appel('POST', '/api/paiement/session', { cookie: invite, corps: { formule: 'premium_mensuel', consentements: { cgv: true, executionImmediate: true } } })).j.erreur, 'acces-offert-actif');
});

test('Stripe (mode test) : paiement, webhooks signés, doublons, résiliation, fin d\'abonnement', async () => {
  const c = await connecter('uid-client', { email: 'client@exemple.fr' });
  assert.equal((await appel('POST', '/api/paiement/session', { cookie: c, corps: { formule: 'famille_annuel' } })).j.erreur, 'consentement-requis');
  const s = await appel('POST', '/api/paiement/session', { cookie: c, corps: { formule: 'famille_annuel', consentements: { cgv: true, executionImmediate: true } } });
  assert.equal(s.j.url, 'https://checkout.stripe.com/c/test');
  assert.match(appelsStripe.at(-1).o.body, /client_reference_id=uid-client/); assert.match(appelsStripe.at(-1).o.body, /price_fa/);
  assert.equal((await appel('POST', '/api/stripe/webhook', { corps: '{}', entetes: { 'Stripe-Signature': 't=1,v1=00' } })).s, 400, 'signature fausse');
  assert.equal((await webhook(abo('uid-client', 'price_fa'), { secret: 'whsec_pirate' })).s, 400, 'mauvais secret');
  assert.equal((await webhook(abo('uid-client', 'price_fa'), { t: Math.floor(maintenant / 1000) - 3600 })).s, 400, 'événement trop ancien (rejeu)');
  assert.equal((await webhook({ ...abo('uid-client', 'price_fa'), livemode: true })).j.erreur, 'mode-reel-refuse');
  const ev = abo('uid-client', 'price_fa', 'active', maintenant + 365 * J, 'evt_unique');
  assert.equal((await webhook(ev)).s, 200); assert.equal((await webhook(ev)).j.doublon, true);
  let moi = (await appel('GET', '/api/moi', { cookie: c })).j; assert.equal(moi.statut, 'abonne'); assert.equal(moi.niveau, 'famille');
  for (const n of ['Aya', 'Nael']) await appel('POST', '/api/enfants', { cookie: c, corps: { surnom: n, tranche: '3-5', avatar: 'fille' } });
  assert.equal((await appel('POST', '/api/abonnement/resilier', { cookie: c })).s, 200);
  assert.match(appelsStripe.at(-1).u, /subscriptions\/sub_uid-client$/); assert.match(appelsStripe.at(-1).o.body, /cancel_at_period_end=true/);
  assert.equal((await appel('GET', '/api/moi', { cookie: c })).j.statut, 'abonne', 'accès conservé jusqu\'à la fin de la période payée');
  await webhook({ ...abo('uid-client', 'price_fa', 'canceled'), type: 'customer.subscription.deleted' });
  moi = (await appel('GET', '/api/moi', { cookie: c })).j; assert.equal(moi.statut, 'gratuit');
  const e = (await appel('GET', '/api/enfants', { cookie: c })).j; assert.equal(e.total, 2, 'profils conservés'); assert.deepEqual(e.enfants.map(x => x.gele), [false, true]);
  assert.throws(() => clientStripe({ STRIPE_CLE_SECRETE: 'sk_live_xxx' }), /mode test/, 'clé réelle refusée sans accord');
});

test('Contenus Premium : 401 / 403 / 200 selon les droits, jamais en cache, chemins piégés refusés', async () => {
  assert.equal((await appel('GET', '/api/premium/voyage/camp/zone.json')).s, 401, 'visiteur');
  const g = await connecter('uid-gratuit2');
  assert.equal((await appel('GET', '/api/premium/voyage/camp/zone.json', { cookie: g })).s, 403, 'gratuit');
  assert.equal((await appel('GET', '/api/premium/voyage/village/zone.json')).s, 200, 'zone libre accessible sans compte');
  await connecter('uid-prem'); await webhook(abo('uid-prem', 'price_pm'));
  const p = await connecter('uid-prem');
  const ok = await appel('GET', '/api/premium/voyage/camp/zone.json', { cookie: p });
  assert.equal(ok.s, 200); assert.equal(ok.h.get('Cache-Control'), 'private, no-store');
  assert.equal((await appel('GET', '/api/premium/maisons/sons/jeu.js', { cookie: p })).s, 403, 'aperçu interdit aux abonnés');
  const c = await connecter(CREATEUR, { role: 'creator' });
  assert.equal((await appel('GET', '/api/premium/maisons/sons/jeu.js', { cookie: c })).s, 200, 'aperçu Créateur');
  for (const piege of ['../droits/x', 'voyage/../../secret', 'voyage//camp', '%2e%2e/x', 'VOYAGE/camp/a'])
    assert.ok([400, 401, 403, 404].includes((await appel('GET', '/api/premium/' + piege, { cookie: c })).s), piege);
  assert.equal((await appel('GET', '/api/premium/inconnu/x.json', { cookie: p })).s, 403, 'chemin inconnu : Créateur seul');
  // le Créateur ouvre une zone sans redéploiement
  assert.equal((await appel('POST', '/api/admin/catalogue', { cookie: c, corps: { groupe: 'voyage', id: 'camp', niveau: 'libre' } })).s, 200);
  assert.equal((await appel('GET', '/api/premium/voyage/camp/zone.json')).s, 200);
  await appel('POST', '/api/admin/catalogue', { cookie: c, corps: { groupe: 'voyage', id: 'camp', niveau: 'premium' } });
  assert.equal((await appel('GET', '/api/premium/voyage/camp/zone.json')).s, 401);
});

test('Suppression RGPD complète en cascade', async () => {
  const adm = await connecter(CREATEUR, { role: 'creator' });
  const inv = (await appel('POST', '/api/admin/invitations', { cookie: adm, corps: { email: 'tante@exemple.fr', niveau: 'famille', dureeJours: 10 } })).j;
  const t = await connecter('uid-tante', { email: 'tante@exemple.fr' });
  await appel('POST', '/api/invitations/activer', { cookie: t, corps: { code: decodeURIComponent(inv.lien.split('invite=')[1]) } });
  for (const n of ['Rayan', 'Inaya', 'Sofiane', 'Maryam']) await appel('POST', '/api/enfants', { cookie: t, corps: { surnom: n, tranche: '6-10', avatar: 'garcon' } });
  assert.equal((await appel('DELETE', '/api/compte', { cookie: await connecter('uid-tante', { email: 'tante@exemple.fr', authAgo: 3600 }) })).j.erreur, 'reconnexion-requise');
  const r = await appel('DELETE', '/api/compte', { cookie: t });
  assert.equal(r.s, 200); assert.match(r.h.get('Set-Cookie'), /Max-Age=0/);
  const donnees = await instantane(base);
  const restes = Object.keys(donnees).filter(k => k.includes('uid-tante'));
  assert.deepEqual(restes, [], 'plus aucune donnée liée au compte');
  assert.equal(JSON.stringify(Object.values(donnees)).includes('tante@exemple.fr'), false, 'plus aucune trace de l\'adresse');
  assert.ok(base.utilisateursSupprimes.includes('uid-tante'), 'compte Firebase supprimé');
  // un abonné actif doit d'abord résilier
  await connecter('uid-abo3'); await webhook(abo('uid-abo3', 'price_pa'));
  assert.equal((await appel('DELETE', '/api/compte', { cookie: await connecter('uid-abo3') })).j.erreur, 'abonnement-actif');
});

test('Résumé administrateur : payants et accès offerts comptés séparément', async () => {
  const adm = await connecter(CREATEUR, { role: 'creator' });
  const r = (await appel('GET', '/api/admin/resume', { cookie: adm })).j;
  assert.ok(r.payants >= 2); assert.ok(r.accesOffertsActifs >= 1); assert.equal(typeof r.gratuits, 'number');
  const comptes = (await appel('GET', '/api/admin/comptes', { cookie: adm })).j;
  assert.ok(comptes.comptes.length <= 20);
});

test('Invitation : deux activations simultanées du même lien, une seule réussit', async () => {
  const adm = await connecter(CREATEUR, { role: 'creator' });
  const inv = (await appel('POST', '/api/admin/invitations', { cookie: adm, corps: { email: 'jumeau@exemple.fr', niveau: 'premium', dureeJours: 30 } })).j;
  const code = decodeURIComponent(inv.lien.split('invite=')[1]);
  const c = await connecter('uid-jumeau', { email: 'jumeau@exemple.fr' });
  lent = true; const r = await Promise.all([1, 2, 3].map(() => appel('POST', '/api/invitations/activer', { cookie: c, corps: { code } }))); lent = false;
  assert.deepEqual(r.map(x => x.s).sort(), [200, 409, 409]);
  assert.equal((await base.chercher('acces_offerts', 'uid', 'uid-jumeau')).length, 1, 'un seul accès créé');
});

// ---------- activation du rôle Créateur en un clic ----------
test('activation Créateur : seul le compte désigné par CREATOR_UID, adresse vérifiée, connexion récente ; double verrou conservé', async () => {
  base.rolesCreateurPoses.length = 0;
  // un inconnu, même connecté et vérifié : refusé, rien posé, et aucune proposition d'activation dans /api/moi
  const autre = await connecter('uid-curieux');
  assert.equal((await appel('POST', '/api/createur/activer', { cookie: autre })).s, 403);
  assert.equal((await appel('GET', '/api/moi', { cookie: autre })).j.activationCreateur, false);
  assert.equal((await appel('POST', '/api/createur/activer')).s, 403, 'sans session');
  // le compte désigné mais adresse non vérifiée : refusé
  const nv = await connecter(CREATEUR, { verifie: false });
  assert.equal((await appel('POST', '/api/createur/activer', { cookie: nv })).j.erreur, 'adresse-non-verifiee');
  // connexion ancienne : reconnexion demandée
  const vieux = await connecter(CREATEUR, { authAgo: 3600 });
  assert.equal((await appel('POST', '/api/createur/activer', { cookie: vieux })).j.erreur, 'reconnexion-requise');
  assert.equal(base.rolesCreateurPoses.length, 0, 'rien posé jusque-là');
  // le bon compte, avant activation : n'est PAS Créateur (le rôle manque), mais l'activation est proposée
  const c = await connecter(CREATEUR);
  const avant = (await appel('GET', '/api/moi', { cookie: c })).j; assert.notEqual(avant.statut, 'creator'); assert.equal(avant.activationCreateur, true);
  assert.equal((await appel('GET', '/api/admin/comptes', { cookie: c })).s, 403);
  const r = await appel('POST', '/api/createur/activer', { cookie: c }); assert.equal(r.s, 200); assert.equal(r.j.reconnexion, true);
  assert.deepEqual(base.rolesCreateurPoses, [CREATEUR]);
  // après reconnexion avec le rôle dans le jeton : Créateur, plus de proposition, activation idempotente
  const c2 = await connecter(CREATEUR, { role: 'creator' });
  const apres = (await appel('GET', '/api/moi', { cookie: c2 })).j; assert.equal(apres.statut, 'creator'); assert.equal(apres.activationCreateur, false);
  assert.equal((await appel('POST', '/api/createur/activer', { cookie: c2 })).j.deja, true); assert.equal(base.rolesCreateurPoses.length, 1);
  // le journal garde la trace
  const log = (await base.lister('admin_logs', { limite: 500 })).docs.filter(d => d.data.action === 'role-createur-pose'); assert.equal(log.length, 1);
});
test('activation Créateur : sans CREATOR_UID configuré, personne ne peut l\'utiliser', async () => {
  const avant = env.CREATOR_UID; env.CREATOR_UID = '';
  try { const c = await connecter('uid-quelconque'); assert.equal((await appel('POST', '/api/createur/activer', { cookie: c })).s, 403); assert.equal((await appel('GET', '/api/moi', { cookie: c })).j.activationCreateur, false); }
  finally { env.CREATOR_UID = avant; }
});
test('activation Créateur : refusée sans en-tête X-LDN (protection contre les requêtes d\'un autre site)', async () => {
  const c = await connecter(CREATEUR);
  const r = await traiter(new Request(O + '/api/createur/activer', { method: 'POST', headers: { Cookie: c, Origin: 'https://autre-site.exemple' } }), ctx()); assert.equal(r.status, 403);
});

test('Suppression RGPD et Stripe : aucun lien client conservé, preuve d\'achat détachée du compte, événement tardif sans effet', async () => {
  const c = await connecter('uid-abo4', { email: 'abo4@exemple.fr' });
  const s = await appel('POST', '/api/paiement/session', { cookie: c, corps: { formule: 'premium_annuel', consentements: { cgv: true, executionImmediate: true } } }); assert.equal(s.s, 200, JSON.stringify(s.j));
  await webhook(abo('uid-abo4', 'price_pa'));
  assert.ok(Object.keys(await instantane(base)).some(k => k.startsWith('stripe_clients/')), 'lien client créé');
  assert.equal((await appel('POST', '/api/abonnement/resilier', { cookie: c })).s, 200);         // résilié en fin de période : suppression possible
  assert.equal((await appel('DELETE', '/api/compte', { cookie: c })).s, 200);
  let d = await instantane(base);
  assert.deepEqual(Object.entries(d).filter(([k, v]) => k.startsWith('stripe_clients/') && v.uid === 'uid-abo4'), [], 'lien client effacé');
  const achats = Object.entries(d).filter(([k]) => k.startsWith('consentements_achat/')).map(([, v]) => v);
  assert.ok(achats.length >= 1 && achats.every(v => v.uid !== 'uid-abo4'), 'preuve d\'achat conservée mais détachée du compte');
  // fin de période : Stripe envoie « abonnement terminé » pour un compte qui n'existe plus
  const r = await webhook(abo('uid-abo4', 'price_pa', 'canceled'));
  assert.equal(r.s, 200); assert.equal(r.j.ignore, true);
  d = await instantane(base);
  assert.deepEqual(Object.keys(d).filter(k => k.includes('uid-abo4')), [], 'rien recréé pour le compte supprimé');
  assert.equal(JSON.stringify(Object.values(d)).includes('abo4@exemple.fr'), false);
});
