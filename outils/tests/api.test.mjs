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
async function jeton(uid, { email = uid + '@exemple.fr', verifie = true, role, authAgo = 60, fournisseur = 'password' } = {}) {
  const s = Math.floor(maintenant / 1000), tete = b64u({ alg: 'RS256', kid: 'k1' }) + '.' + b64u({ iss: 'https://securetoken.google.com/' + PROJET, aud: PROJET, firebase: { sign_in_provider: fournisseur }, sub: uid, iat: s - 10, exp: s + 3000, auth_time: s - authAgo, email, email_verified: verifie, ...(role ? { role } : {}) });
  return tete + '.' + Buffer.from(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cles.privateKey, new TextEncoder().encode(tete))).toString('base64url');
}
const fichiers = { 'voyage/camp/zone.json': '{"zone":"camp"}', 'maisons/sons/jeu.js': 'export const x=1', 'voyage/village/zone.json': '{}' };
const appelsStripe = [];
const fauxStripe = async (u, o) => { appelsStripe.push({ u, o }); return new Response(JSON.stringify(u.includes('checkout') ? { id: 'cs_test_1', url: 'https://checkout.stripe.com/c/test' } : { id: 'sub_1' }), { status: 200 }); };
const base = creerBase();
// E-mails personnalisés : faux liens d'action (aucun appel à Google) et faux prestataire d'envoi (aucun appel réseau)
base.liensDemandes = [];
base.lienAction = async (type, email) => { base.liensDemandes.push({ type, email }); return email.startsWith('inconnu') ? null : { oobCode: 'OOB-' + type + '-' + email.split('@')[0] }; };
const courrielTest = { envoyes: [], ko: false, async envoyer(m) { if (this.ko) throw new Error('courriel-refuse:500'); this.envoyes.push(m); return { ok: true }; } };
let courrielActif = false;
let lent = false;
const baseLente = new Proxy(base, { get(t, k) { const v = t[k]; return typeof v === 'function' ? async (...a) => { if (lent && k === 'lire') await new Promise(r => setTimeout(r, 15)); return v.apply(t, a); } : v; } });
const ctx = () => ({ env, base: baseLente, maintenant, courriel: courrielActif ? courrielTest : null,
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
  for (const n of ['Yanis', 'Lina', 'Sara']) assert.equal((await appel('POST', '/api/enfants', { cookie: c, corps: { surnom: n, tranche: '6-10', avatar: 'garcon' } })).s, 201, 'quatre profils possibles');
  assert.equal((await appel('POST', '/api/enfants', { cookie: c, corps: { surnom: 'Cinq', tranche: '6-10', avatar: 'garcon' } })).j.erreur, 'limite-profils', 'le 5e est refusé');
  for (const mauvais of [{ surnom: 'Amina Dupont 2015', tranche: '3-5', avatar: 'fille' }, { surnom: 'a@b.fr', tranche: '3-5', avatar: 'fille' }, { surnom: 'Ali', tranche: '12', avatar: 'fille' }])
    assert.equal((await appel('POST', '/api/enfants', { cookie: await connecter('uid-p2b' + Math.random().toString(36).slice(2, 6)), corps: mauvais })).s, 400);
  const e = (await appel('GET', '/api/enfants', { cookie: c })).j.enfants[0];
  assert.deepEqual(Object.keys(e).filter(k => e[k] !== undefined).sort(), ['avatar', 'creeLe', 'gele', 'id', 'majLe', 'surnom', 'tranche']);
});

test('Mode sans visage : préférence de la famille (identique pour tous les profils, conservée, sans effet sur les enfants)', async () => {
  assert.equal((await appel('PATCH', '/api/famille/preferences', { corps: { sansVisage: true } })).s, 401, 'visiteur refusé (le visiteur garde le réglage sur son appareil)');
  const c = await connecter('uid-sv1');
  assert.deepEqual((await appel('GET', '/api/moi', { cookie: c })).j.preferences, {}, 'aucun réglage au départ');
  await appel('POST', '/api/enfants', { cookie: c, corps: { surnom: 'Amina', tranche: '3-5', avatar: 'fille' } });
  const avant = (await appel('GET', '/api/enfants', { cookie: c })).j.enfants;
  assert.equal((await appel('PATCH', '/api/famille/preferences', { cookie: c, corps: { sansVisage: true } })).s, 200);
  assert.deepEqual((await appel('GET', '/api/moi', { cookie: c })).j.preferences, { sansVisage: true });
  assert.deepEqual((await appel('GET', '/api/enfants', { cookie: c })).j.enfants, avant, 'les profils enfants ne sont pas modifiés');
  // conservé après déconnexion / reconnexion (nouvelle session)
  await appel('POST', '/api/session/fin', { cookie: c });
  const c2 = await connecter('uid-sv1');
  assert.deepEqual((await appel('GET', '/api/moi', { cookie: c2 })).j.preferences, { sansVisage: true }, 'relu à la reconnexion');
  assert.equal((await appel('PATCH', '/api/famille/preferences', { cookie: c2, corps: { sansVisage: false } })).s, 200);
  assert.deepEqual((await appel('GET', '/api/moi', { cookie: c2 })).j.preferences, { sansVisage: false });
  // validation : seul un booléen est accepté, rien d'autre n'est écrit
  for (const mauvais of [{ sansVisage: 'oui' }, { sansVisage: 1 }, {}, { autre: true }]) assert.equal((await appel('PATCH', '/api/famille/preferences', { cookie: c2, corps: mauvais })).s, 400);
  assert.equal((await appel('PATCH', '/api/famille/preferences', { cookie: c2, corps: { sansVisage: true, admin: true, email: 'x@y.fr' } })).s, 200);
  const famille = await base.lire('familles', 'uid-sv1'); assert.deepEqual(Object.keys(famille.preferences), ['sansVisage'], 'aucune clé inconnue écrite');
  // une autre famille n'est pas touchée
  assert.deepEqual((await appel('GET', '/api/moi', { cookie: await connecter('uid-sv2') })).j.preferences, {});
  assert.equal((await appel('PATCH', '/api/famille/preferences', { cookie: c2, corps: { sansVisage: true }, entetes: { Origin: 'https://pirate.exemple' } })).s, 403, 'mauvaise origine refusée');
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
  assert.equal(moi.statut, 'invite'); assert.equal(moi.niveau, 'famille'); assert.equal(moi.profilsMax, 4); assert.equal(moi.synchro, true);
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
  assert.equal(moi.statut, 'gratuit'); assert.equal(moi.profilsMax, 4);
  const enfants = (await appel('GET', '/api/enfants', { cookie: frere })).j;
  assert.equal(enfants.total, 3, 'aucun profil supprimé');
  assert.deepEqual(enfants.enfants.map(e => e.gele), [false, false, false], 'plus de gel : 4 profils pour tout compte parent');
  assert.deepEqual((await base.lire('familles/uid-frere/enfants', ids[1])).progression, { ablutions: { g1: 3 } }, 'progression conservée');
  assert.equal((await appel('POST', '/api/enfants', { cookie: frere, corps: { surnom: 'Lina', tranche: '3-5', avatar: 'fille' } })).s, 201);
  assert.equal((await appel('POST', '/api/enfants', { cookie: frere, corps: { surnom: 'Zoe', tranche: '3-5', avatar: 'fille' } })).j.erreur, 'limite-profils');
  // le parent choisit l'enfant actif
  await appel('POST', `/api/enfants/${ids[2]}/actif`, { cookie: frere });
  assert.deepEqual((await appel('GET', '/api/enfants', { cookie: frere })).j.enfants.map(e => e.gele), [false, false, false, false]);
  // prolonger en permanent : tout est dégelé
  assert.equal((await appel('POST', `/api/admin/acces/${acces.id}/prolonger`, { cookie: adm, corps: { permanent: true } })).s, 200);
  assert.equal((await appel('GET', '/api/moi', { cookie: frere })).j.statut, 'invite');
  assert.deepEqual((await appel('GET', '/api/enfants', { cookie: frere })).j.enfants.map(e => e.gele), [false, false, false, false]);
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
  const e = (await appel('GET', '/api/enfants', { cookie: c })).j; assert.equal(e.total, 2, 'profils conservés'); assert.deepEqual(e.enfants.map(x => x.gele), [false, false], 'plus de gel');
  assert.throws(() => clientStripe({ STRIPE_CLE_SECRETE: 'sk_live_xxx' }), /mode test/, 'clé réelle refusée sans accord');
});

test('Stripe, API récentes : la fin de période est lue dans items.data[0] quand elle n\'est plus au niveau de l\'abonnement (sinon un abonné payant passerait en Gratuit)', async () => {
  const c = await connecter('uid-api-recente', { email: 'recente@exemple.fr' });
  const fin = Math.floor((maintenant + 30 * J) / 1000);
  const ev = { id: 'evt_items_periode', livemode: false, type: 'customer.subscription.created', data: { object: { id: 'sub_recente', customer: 'cus_recente', status: 'active', cancel_at_period_end: false, metadata: { uid: 'uid-api-recente' }, items: { data: [{ price: { id: 'price_pm' }, current_period_end: fin }] } } } };
  assert.equal((await webhook(ev)).s, 200);
  const moi = (await appel('GET', '/api/moi', { cookie: c })).j;
  assert.equal(moi.statut, 'abonne');
  assert.equal(moi.niveau, 'premium');
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

test('Fournisseurs d\'identité : seuls e-mail + mot de passe et Google ouvrent une session (Apple, anonyme, téléphone, sans fournisseur… refusés)', async () => {
  for (const f of ['apple.com', 'anonymous', 'phone', 'custom', 'github.com', 'facebook.com', 'microsoft.com', 'twitter.com']) {
    const r = await appel('POST', '/api/session', { corps: { idToken: await jeton('uid-idp-' + f, { fournisseur: f }), consentements: CONSENT } });
    assert.equal(r.s, 403, f); assert.equal(r.j.erreur, 'fournisseur-non-autorise'); assert.equal(r.h.get('Set-Cookie'), null, 'aucune session');
  }
  assert.equal(await base.lire('familles', 'uid-idp-apple.com'), null, 'aucun compte famille créé');
  // jeton sans aucune information de fournisseur
  const s = Math.floor(maintenant / 1000), tete = b64u({ alg: 'RS256', kid: 'k1' }) + '.' + b64u({ iss: 'https://securetoken.google.com/' + PROJET, aud: PROJET, sub: 'uid-sans-fournisseur', iat: s - 10, exp: s + 3000, auth_time: s - 60, email: 'x@exemple.fr', email_verified: true });
  const sans = tete + '.' + Buffer.from(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cles.privateKey, new TextEncoder().encode(tete))).toString('base64url');
  assert.equal((await appel('POST', '/api/session', { corps: { idToken: sans, consentements: CONSENT } })).s, 403);
  // le parcours normal reste intact
  assert.equal((await appel('POST', '/api/session', { corps: { idToken: await jeton('uid-idp-ok'), consentements: CONSENT } })).s, 200);
});

test('Connexion Google : acceptée avec adresse vérifiée ; refusée sans adresse vérifiée ; consentements parentaux toujours exigés', async () => {
  const sans = await appel('POST', '/api/session', { corps: { idToken: await jeton('uid-g1', { fournisseur: 'google.com' }) } });
  assert.equal(sans.s, 428, 'nouveau compte Google : consentements parentaux obligatoires'); assert.equal(sans.h.get('Set-Cookie'), null);
  assert.equal(await base.lire('familles', 'uid-g1'), null, 'rien n\'est créé sans consentement');
  const nv = await appel('POST', '/api/session', { corps: { idToken: await jeton('uid-g2', { fournisseur: 'google.com', verifie: false }), consentements: CONSENT } });
  assert.equal(nv.s, 403); assert.equal(nv.j.erreur, 'email-google-non-verifie'); assert.equal(await base.lire('familles', 'uid-g2'), null);
  const r = await appel('POST', '/api/session', { corps: { idToken: await jeton('uid-g1', { fournisseur: 'google.com', email: 'parent.g@exemple.fr' }), consentements: CONSENT } });
  assert.equal(r.s, 200); const c = r.h.get('Set-Cookie').split(';')[0];
  const moi = (await appel('GET', '/api/moi', { cookie: c })).j; assert.equal(moi.connecte, true); assert.equal(moi.fournisseur, 'google.com'); assert.equal(moi.statut, 'gratuit'); assert.equal(moi.email, 'parent.g@exemple.fr');
  // ne conserve que l'adresse : ni nom ni photo de profil Google
  assert.deepEqual(Object.keys(await base.lire('familles', 'uid-g1')).sort(), ['consentements', 'creeLe', 'email', 'profilActif']);
  // profils enfants et droits : identiques aux comptes e-mail
  assert.equal((await appel('POST', '/api/enfants', { cookie: c, corps: { surnom: 'Inaya', tranche: '3-5', avatar: 'fille' } })).s, 201);
  assert.equal((await appel('GET', '/api/admin/resume', { cookie: c })).s, 403);
  assert.equal((await appel('POST', '/api/createur/activer', { cookie: c })).s, 403);
});
test('Même parent, deux méthodes : e-mail + mot de passe puis Google (comptes liés par Firebase = même UID) retrouvent la même famille', async () => {
  const mdp = await connecter('uid-lie', { email: 'lie@exemple.fr' });
  await appel('POST', '/api/enfants', { cookie: mdp, corps: { surnom: 'Rayan', tranche: '6-10', avatar: 'garcon' } });
  const g = await appel('POST', '/api/session', { corps: { idToken: await jeton('uid-lie', { email: 'lie@exemple.fr', fournisseur: 'google.com' }) } });
  assert.equal(g.s, 200, 'famille existante : pas de nouveau consentement demandé'); const cg = g.h.get('Set-Cookie').split(';')[0];
  assert.match(JSON.stringify((await appel('GET', '/api/enfants', { cookie: cg })).j), /Rayan/);
  assert.equal((await appel('GET', '/api/moi', { cookie: cg })).j.fournisseur, 'google.com'); assert.equal((await appel('GET', '/api/moi', { cookie: mdp })).j.fournisseur, 'password');
});
test('Connexion Google : suppression RGPD complète comme pour un compte e-mail (reconnexion récente exigée)', async () => {
  const c = await connecter('uid-g3', { email: 'g3@exemple.fr', fournisseur: 'google.com' });
  await appel('POST', '/api/enfants', { cookie: c, corps: { surnom: 'Maryam', tranche: '3-5', avatar: 'fille' } });
  const vieux = (await appel('POST', '/api/session', { corps: { idToken: await jeton('uid-g3', { email: 'g3@exemple.fr', fournisseur: 'google.com', authAgo: 3600 }) } })).h.get('Set-Cookie').split(';')[0];
  assert.equal((await appel('DELETE', '/api/compte', { cookie: vieux })).j.erreur, 'reconnexion-requise');
  assert.equal((await appel('DELETE', '/api/compte', { cookie: c })).s, 200);
  const d = await instantane(base); assert.deepEqual(Object.keys(d).filter(k => k.includes('uid-g3')), []); assert.equal(JSON.stringify(Object.values(d)).includes('g3@exemple.fr'), false);
});

test('Isolation des familles : un parent ne peut ni lire, ni modifier, ni supprimer, ni sauvegarder, ni activer le profil d\'une autre famille, même en connaissant son identifiant', async () => {
  const a = await connecter('uid-iso-a'), b = await connecter('uid-iso-b');
  const ida = (await appel('POST', '/api/enfants', { cookie: a, corps: { surnom: 'Alia', tranche: '3-5', avatar: 'fille' } })).j.id;
  assert.equal((await appel('PUT', `/api/enfants/${ida}/progression`, { cookie: a, corps: { progression: { ablutions: { g1: 2 } } } })).s, 200, 'un compte Gratuit sauvegarde sa progression');
  for (const [m, suffixe, corps] of [['GET', '', undefined], ['PATCH', '', { surnom: 'Pirate' }], ['DELETE', '', undefined], ['PUT', '/progression', { progression: { x: 1 } }], ['POST', '/actif', undefined]])
    assert.equal((await appel(m, `/api/enfants/${ida}${suffixe}`, { cookie: b, corps })).s, 404, `${m}${suffixe} sur le profil d'une autre famille`);
  assert.deepEqual((await appel('GET', '/api/enfants', { cookie: b })).j.enfants, [], 'la liste de B ne contient rien de A');
  const intact = await base.lire('familles/uid-iso-a/enfants', ida);
  assert.equal(intact.surnom, 'Alia'); assert.deepEqual(intact.progression, { ablutions: { g1: 2 } }, 'rien n\'a changé chez A');
  assert.equal((await appel('GET', '/api/enfants')).s, 401, 'sans connexion : refusé');
  assert.equal((await appel('GET', `/api/enfants/${ida}`)).s, 401);
});

test('Droits : le serveur ignore tout ce que le navigateur prétend (niveau, abonnement, rôle envoyés dans la requête ou la session)', async () => {
  const r = await appel('POST', '/api/session', { corps: { idToken: await jeton('uid-menteur'), consentements: CONSENT, niveau: 'famille', abonne: true, role: 'creator', profilsMax: 99 }, entetes: { 'X-LDN-Niveau': 'famille' } });
  assert.equal(r.s, 200); const c = r.h.get('Set-Cookie').split(';')[0];
  const moi = (await appel('GET', '/api/moi', { cookie: c, entetes: { 'X-LDN-Niveau': 'famille' } })).j;
  assert.equal(moi.niveau, 'gratuit'); assert.equal(moi.statut, 'gratuit'); assert.equal(moi.profilsMax, 4); assert.equal(moi.admin, false);
  assert.equal((await appel('GET', '/api/premium/voyage/camp/zone.json', { cookie: c })).s, 403, 'un contenu Premium reste fermé au compte Gratuit');
});

test('E-mail non vérifié : connexion et /api/moi autorisés, mais profils enfants et progression refusés PAR LE SERVEUR (403 email-non-verifie) ; tout s\'ouvre avec une session vérifiée', async () => {
  const nv = await connecter('uid-nonverif', { verifie: false });
  const moi = (await appel('GET', '/api/moi', { cookie: nv })).j; assert.equal(moi.connecte, true); assert.equal(moi.emailVerifie, false);
  const corps = { surnom: 'Amina', tranche: '3-5', avatar: 'fille' };
  for (const [m, ch, c] of [['GET', '/api/enfants'], ['POST', '/api/enfants', corps], ['GET', '/api/enfants/abc'], ['PUT', '/api/enfants/abc/progression', { progression: {} }], ['PATCH', '/api/enfants/abc', corps], ['DELETE', '/api/enfants/abc'], ['POST', '/api/enfants/abc/actif']]) {
    const r = await appel(m, ch, { cookie: nv, corps: c }); assert.equal(r.s, 403, `${m} ${ch}`); assert.equal(r.j.erreur, 'email-non-verifie', `${m} ${ch}`);
  }
  assert.equal((await base.compter('familles/uid-nonverif/enfants')), 0, 'rien n\'a été créé');
  const v = await connecter('uid-nonverif', { verifie: true });
  assert.equal((await appel('POST', '/api/enfants', { cookie: v, corps })).s, 201, 'après vérification, tout s\'ouvre');
});

test('E-mail non vérifié : les contenus réservés aux comptes (stockage privé) sont refusés par le serveur ; la suppression du compte reste possible', async () => {
  const nv = await connecter('uid-nonverif2', { verifie: false });
  const r = await appel('GET', '/api/premium/voyage/village/zone.json', { cookie: nv }); assert.equal(r.s, 403); assert.equal(r.j.erreur, 'email-non-verifie');
  const v = await connecter('uid-verif2', { verifie: true });
  assert.equal((await appel('GET', '/api/premium/voyage/village/zone.json', { cookie: v })).s, 200, 'avec e-mail vérifié, le contenu gratuit réservé aux comptes s\'ouvre');
  assert.equal((await appel('DELETE', '/api/compte', { cookie: nv })).s, 200, 'un parent non vérifié peut supprimer son compte');
});

// ---------- e-mails personnalisés (vérification, réinitialisation, confirmation, sécurité) : envoi par notre serveur, liens générés côté serveur ----------
const viderCourriel = () => { courrielTest.envoyes.length = 0; base.liensDemandes.length = 0; courrielTest.ko = false; };

test('E-mails personnalisés : sans prestataire configuré, les routes répondent 503 « email-non-configure » (le navigateur retombe alors sur l\'envoi Firebase)', async () => {
  courrielActif = false; viderCourriel();
  const c = await connecter('uid-em0', { verifie: false });
  const r = await appel('POST', '/api/email/verification', { cookie: c }); assert.equal(r.s, 503); assert.equal(r.j.erreur, 'email-non-configure');
  assert.equal((await appel('POST', '/api/email/reinitialisation', { corps: { email: 'a@exemple.fr' } })).s, 503);
  assert.equal(courrielTest.envoyes.length, 0);
});

test('E-mails : la vérification est envoyée à l\'adresse DE LA SESSION (jamais à une adresse fournie), avec un lien sur notre domaine et le code Firebase', async () => {
  courrielActif = true; viderCourriel();
  const c = await connecter('uid-em1', { verifie: false });
  const r = await appel('POST', '/api/email/verification', { cookie: c, corps: { email: 'victime@exemple.fr' } });
  assert.equal(r.s, 200); assert.equal(r.j.envoye, true); assert.equal(r.j.delai, 90);
  assert.equal(courrielTest.envoyes.length, 1); const m = courrielTest.envoyes[0];
  assert.equal(m.a, 'uid-em1@exemple.fr', 'jamais l\'adresse envoyée par le navigateur'); assert.match(m.objet, /Vérifiez votre adresse e-mail/);
  assert.deepEqual(base.liensDemandes, [{ type: 'VERIFY_EMAIL', email: 'uid-em1@exemple.fr' }]);
  assert.ok(m.html.includes('https://leslanternesdenour.fr/compte/action/?mode=verifyEmail&amp;oobCode=OOB-VERIFY_EMAIL-uid-em1&amp;lang=fr'));
  assert.ok(m.texte.includes('https://leslanternesdenour.fr/compte/action/?mode=verifyEmail&oobCode=OOB-VERIFY_EMAIL-uid-em1&lang=fr'));
});

test('E-mails : le lien pointe vers le site qui a fait la demande (préproduction ou production), jamais vers un domaine étranger', async () => {
  courrielActif = true; viderCourriel();
  const c = await connecter('uid-em2', { verifie: false });
  const depuis = async origine => { viderCourriel(); maintenant += 100000; const r = await traiter(new Request(origine + '/api/email/verification', { method: 'POST', headers: { 'X-LDN': '1', Origin: origine, Cookie: c } }), ctx()); assert.equal(r.status, 200); return courrielTest.envoyes[0].texte; };
  assert.ok((await depuis('https://preproduction.lanternes-de-nour.pages.dev')).includes('https://preproduction.lanternes-de-nour.pages.dev/compte/action/?mode=verifyEmail'));
  assert.ok((await depuis('https://www.leslanternesdenour.fr')).includes('https://www.leslanternesdenour.fr/compte/action/'));
  assert.ok((await depuis('https://pirate.exemple')).includes('https://leslanternesdenour.fr/compte/action/'), 'domaine inconnu : repli sur le vrai site');
});

test('E-mails : renvoi limité (90 s entre deux envois, 6 par jour), sans jamais contourner la vérification obligatoire', async () => {
  courrielActif = true; viderCourriel();
  const c = await connecter('uid-em3', { verifie: false });
  assert.equal((await appel('POST', '/api/email/verification', { cookie: c })).s, 200);
  const tot = await appel('POST', '/api/email/verification', { cookie: c });
  assert.equal(tot.s, 429); assert.equal(tot.j.erreur, 'trop-tot'); assert.ok(tot.j.attente >= 1 && tot.j.attente <= 90);
  assert.equal(courrielTest.envoyes.length, 1, 'pas de second e-mail');
  for (let i = 0; i < 5; i++) { maintenant += 91000; assert.equal((await appel('POST', '/api/email/verification', { cookie: c })).s, 200, 'envoi ' + (i + 2)); }
  maintenant += 91000; const jour = await appel('POST', '/api/email/verification', { cookie: c });
  assert.equal(jour.s, 429); assert.equal(jour.j.erreur, 'limite-journaliere'); assert.equal(courrielTest.envoyes.length, 6);
  assert.equal((await appel('GET', '/api/enfants', { cookie: c })).j.erreur, 'email-non-verifie', 'toujours bloqué tant que l\'adresse n\'est pas vérifiée');
});

test('E-mails : adresse déjà vérifiée = aucun envoi ; visiteur sans session = 401 ; deux familles ne reçoivent que leurs propres e-mails', async () => {
  courrielActif = true; viderCourriel();
  const v = await connecter('uid-em4', { verifie: true });
  const r = await appel('POST', '/api/email/verification', { cookie: v }); assert.equal(r.s, 200); assert.equal(r.j.deja, true); assert.equal(courrielTest.envoyes.length, 0);
  assert.equal((await appel('POST', '/api/email/verification')).s, 401);
  const a = await connecter('uid-em4a', { verifie: false }), b = await connecter('uid-em4b', { verifie: false });
  await appel('POST', '/api/email/verification', { cookie: a }); await appel('POST', '/api/email/verification', { cookie: b });
  assert.deepEqual(courrielTest.envoyes.map(m => m.a), ['uid-em4a@exemple.fr', 'uid-em4b@exemple.fr']);
});

test('E-mails : réinitialisation du mot de passe : réponse identique que le compte existe ou non (aucune énumération), e-mail envoyé seulement si le compte existe', async () => {
  courrielActif = true; viderCourriel();
  await connecter('uid-em5', { verifie: true });
  const existe = await appel('POST', '/api/email/reinitialisation', { corps: { email: 'uid-em5@exemple.fr' } });
  const inconnu = await appel('POST', '/api/email/reinitialisation', { corps: { email: 'inconnu-xyz@exemple.fr' } });
  assert.equal(existe.s, 200); assert.equal(inconnu.s, 200); assert.deepEqual(existe.j, inconnu.j); assert.deepEqual(existe.j, { ok: true });
  assert.equal(courrielTest.envoyes.length, 1); const m = courrielTest.envoyes[0];
  assert.equal(m.a, 'uid-em5@exemple.fr'); assert.match(m.objet, /Réinitialisez votre mot de passe/);
  assert.ok(m.texte.includes('/compte/action/?mode=resetPassword&oobCode=OOB-PASSWORD_RESET-uid-em5&lang=fr'));
  assert.equal((await appel('POST', '/api/email/reinitialisation', { corps: { email: 'pas-une-adresse' } })).j.erreur, 'adresse-invalide');
  assert.equal((await appel('POST', '/api/email/reinitialisation', { corps: {} })).s, 400);
});

test('E-mails : réinitialisation limitée par adresse (silencieusement : même réponse, pas de second e-mail) et par IP (429)', async () => {
  courrielActif = true; viderCourriel();
  await connecter('uid-em6', { verifie: true });
  await appel('POST', '/api/email/reinitialisation', { corps: { email: 'uid-em6@exemple.fr' } });
  const encore = await appel('POST', '/api/email/reinitialisation', { corps: { email: 'UID-EM6@exemple.fr' } });
  assert.deepEqual(encore.j, { ok: true }); assert.equal(courrielTest.envoyes.length, 1, 'adresse déjà servie il y a moins de 90 s (majuscules ignorées)');
  maintenant += 91000; await appel('POST', '/api/email/reinitialisation', { corps: { email: 'uid-em6@exemple.fr' } }); assert.equal(courrielTest.envoyes.length, 2, 'au bout de 90 s, un nouvel envoi est possible');
  let dernier = null; for (let i = 0; i < 12; i++) dernier = await appel('POST', '/api/email/reinitialisation', { corps: { email: 'autre' + i + '@exemple.fr' } });
  assert.equal(dernier.s, 429); assert.equal(dernier.j.erreur, 'trop-de-tentatives');
});

test('E-mails : si le prestataire est en panne, la vérification répond 502 neutre (rien ne fuit) et la réinitialisation répond comme d\'habitude', async () => {
  courrielActif = true; viderCourriel(); courrielTest.ko = true;
  const c = await connecter('uid-em7', { verifie: false });
  const r = await appel('POST', '/api/email/verification', { cookie: c }); assert.equal(r.s, 502); assert.deepEqual(r.j, { erreur: 'envoi-impossible' });
  assert.deepEqual((await appel('POST', '/api/email/reinitialisation', { corps: { email: 'uid-em7@exemple.fr' } })).j, { ok: true });
  courrielTest.ko = false;
});

test('E-mails : une fois l\'adresse vérifiée, UN e-mail de confirmation est envoyé à la prochaine ouverture de session, et un seul', async () => {
  courrielActif = true; viderCourriel();
  const nv = await connecter('uid-em8', { verifie: false });
  await appel('POST', '/api/email/verification', { cookie: nv }); assert.equal(courrielTest.envoyes.length, 1);
  await connecter('uid-em8', { verifie: true });
  assert.equal(courrielTest.envoyes.length, 2); assert.match(courrielTest.envoyes[1].objet, /vérifiée/); assert.equal(courrielTest.envoyes[1].a, 'uid-em8@exemple.fr');
  await connecter('uid-em8', { verifie: true }); assert.equal(courrielTest.envoyes.length, 2, 'pas de doublon');
  await connecter('uid-em8b', { verifie: true }); assert.equal(courrielTest.envoyes.length, 2, 'un compte qui n\'a jamais demandé de vérification ne reçoit rien');
});

test('E-mails : la suppression du compte envoie une confirmation (sans jamais bloquer la suppression) et efface aussi les données d\'envoi', async () => {
  courrielActif = true; viderCourriel();
  const c = await connecter('uid-em9', { verifie: false });
  await appel('POST', '/api/email/verification', { cookie: c }); assert.ok((await instantane(base))['courriers/uid-em9'], 'données d\'envoi créées');
  viderCourriel(); const r = await appel('DELETE', '/api/compte', { cookie: c });
  assert.equal(r.s, 200); assert.equal(courrielTest.envoyes.length, 1); assert.match(courrielTest.envoyes[0].objet, /supprimé/); assert.equal(courrielTest.envoyes[0].a, 'uid-em9@exemple.fr');
  assert.equal((await instantane(base))['courriers/uid-em9'], undefined, 'tout est effacé');
  const d = await connecter('uid-em10', { verifie: true }); viderCourriel(); courrielTest.ko = true;
  assert.equal((await appel('DELETE', '/api/compte', { cookie: d })).s, 200, 'prestataire en panne : le compte est tout de même supprimé'); courrielTest.ko = false;
});
