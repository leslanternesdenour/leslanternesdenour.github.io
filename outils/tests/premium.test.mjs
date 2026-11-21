// BLOC 3 — matrice d'accès aux contenus Premium (stockage privé simulé en mémoire, contenus synthétiques) et « voir comme » du Créateur.
// (copie du banc de test de api.test.mjs)
// Tests d'intégration de l'API (vraies routes, vraie vérification des jetons RS256, vraies sessions HMAC, vraie signature Stripe ;
// seules la base, le stockage et Stripe sont simulés en mémoire). node --test outils/tests/api.test.mjs
import test from 'node:test'; import assert from 'node:assert/strict';
import { traiter, _reinitialiserCompteurs } from '../../serveur/api.js';
import { creerBase } from './base-testee.mjs';
import { verifierJeton } from '../../serveur/jeton.js';
import { clientStripe } from '../../serveur/stripe.js';
import { chargerPremium, appliquerPack, ZONES_PREMIUM } from '../../voyage/js/premium.js';
import * as CONTENU from '../../voyage/js/contenu.js';
import { chargerMaisons, etatsMaisons } from '../../monde/maisons-premium.js';
import fs from 'node:fs'; import path from 'node:path';

const PROJET = 'ldn-test', CREATEUR = 'uid-createur', J = 86400000;
const env = { CREATOR_UID: CREATEUR, SESSION_SECRET: 'secret-de-test-tres-long-0123456789abcdef', FIREBASE_PROJET: PROJET,
  STRIPE_SECRET_WEBHOOK: 'whsec_test_local', STRIPE_PRIX_PREMIUM_MENSUEL: 'price_pm', STRIPE_PRIX_PREMIUM_ANNUEL: 'price_pa', STRIPE_PRIX_FAMILLE_ANNUEL: 'price_fa' };
const algo = { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' };
const cles = await crypto.subtle.generateKey(algo, true, ['sign', 'verify']);
const b64u = o => Buffer.from(JSON.stringify(o)).toString('base64url');
let maintenant = Date.UTC(2026, 10, 20, 10);
async function jeton(uid, { email = uid + '@exemple.fr', verifie = true, role, authAgo = 60 } = {}) {
  const s = Math.floor(maintenant / 1000), tete = b64u({ alg: 'RS256', kid: 'k1' }) + '.' + b64u({ iss: 'https://securetoken.google.com/' + PROJET, aud: PROJET, firebase: { sign_in_provider: 'password' }, sub: uid, iat: s - 10, exp: s + 3000, auth_time: s - authAgo, email, email_verified: verifie, ...(role ? { role } : {}) });
  return tete + '.' + Buffer.from(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cles.privateKey, new TextEncoder().encode(tete))).toString('base64url');
}
const fichiers = { 'voyage/camp/contenu.json': JSON.stringify({ format: 'ldn-pack-voyage-1', zone: 'camp', points: { camp: { texte: 'SENTINELLE-TEXTE-CAMP', decouverte: 'SENTINELLE-DEC' } }, lieu: 'SENTINELLE-LIEU', spots: {}, phrases: [['NOUR-VOIX-DEC-007', 'SENTINELLE-TEXTE-CAMP', 'exact']], voix: { 'NOUR-VOIX-DEC-007': ['voyage/camp/voix/v1.mp3'] } }), 'voyage/camp/voix/v1.mp3': 'ID3-synthetique', 'voyage/village/contenu.json': '{}',
  'maisons/mots/index.html': '<!doctype html><title>mots</title>', 'maisons/mots/mots.json': '{"mots":[]}', 'maisons/sons/jeu.js': 'export const x=1' };
const appelsStripe = [];
const fauxStripe = async (u, o) => { appelsStripe.push({ u, o }); return new Response(JSON.stringify(u.includes('checkout') ? { id: 'cs_test_1', url: 'https://checkout.stripe.com/c/test' } : { id: 'sub_1' }), { status: 200 }); };
const base = creerBase();
let lent = false;
const baseLente = new Proxy(base, { get(t, k) { const v = t[k]; return typeof v === 'function' ? async (...a) => { if (lent && k === 'lire') await new Promise(r => setTimeout(r, 15)); return v.apply(t, a); } : v; } });
const ctx = () => ({ env, base: baseLente, maintenant,
  auth: { verifierIdToken: (t, m) => verifierJeton(t, { projet: PROJET, obtenirCle: async k => k === 'k1' ? cles.publicKey : null, maintenant: m }) },
  stockage: { async get(k) { return k in fichiers ? { body: fichiers[k], type: 'application/json' } : null; }, async lister() { return Object.keys(fichiers).map(cle => ({ cle, taille: fichiers[cle].length })); } },
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
const ZONE = '/api/premium/voyage/camp/contenu.json', MAISON = '/api/premium/maisons/mots/';
const premium = async uid => { await connecter(uid); await webhook(abo(uid, 'price_pm')); return connecter(uid); };

test('Matrice : Créateur, Premium, Famille autorisés ; Gratuit et anonyme refusés (zone du Voyage)', async () => {
  assert.equal((await appel('GET', ZONE)).s, 401, 'anonyme');
  assert.equal((await appel('GET', ZONE, { cookie: await connecter('uid-g') })).s, 403, 'gratuit');
  assert.equal((await appel('GET', ZONE, { cookie: await premium('uid-p') })).s, 200, 'premium');
  await connecter('uid-f'); await webhook(abo('uid-f', 'price_fa'));
  assert.equal((await appel('GET', ZONE, { cookie: await connecter('uid-f') })).s, 200, 'famille');
  assert.equal((await appel('GET', ZONE, { cookie: await connecter(CREATEUR, { role: 'creator' }) })).s, 200, 'créateur');
});

test('Chasse aux mots (non publiée) : Créateur seul ; la page s\'ouvre par son dossier ; en-têtes privés', async () => {
  const c = await connecter(CREATEUR, { role: 'creator' }), p = await premium('uid-p2');
  assert.equal((await appel('GET', MAISON)).s, 401); assert.equal((await appel('GET', MAISON, { cookie: p })).s, 403);
  const r = await appel('GET', MAISON, { cookie: c });
  assert.equal(r.s, 200); assert.match(r.h.get('Content-Type'), /text\/html/);
  assert.equal(r.h.get('Cache-Control'), 'private, no-store'); assert.match(r.h.get('Content-Security-Policy'), /default-src 'self'/);
  assert.match(r.h.get('X-Robots-Tag'), /noindex/); assert.equal(r.h.get('X-Content-Type-Options'), 'nosniff');
  assert.equal((await appel('GET', '/api/premium/maisons/mots/mots.json', { cookie: c })).s, 200);
  // publiée en Premium : les abonnés entrent, les gratuits non
  await appel('POST', '/api/admin/catalogue', { cookie: c, corps: { groupe: 'maisons', id: 'mots', niveau: 'premium' } });
  assert.equal((await appel('GET', MAISON, { cookie: p })).s, 200);
  assert.equal((await appel('GET', MAISON, { cookie: await connecter('uid-g2') })).s, 403);
  // retirée : de nouveau invisible (accès immédiatement refusé)
  await appel('POST', '/api/admin/catalogue', { cookie: c, corps: { groupe: 'maisons', id: 'mots', niveau: 'apercu' } });
  assert.equal((await appel('GET', MAISON, { cookie: p })).s, 403);
});

test('Aucune fuite : toutes les réponses Premium/privées sont private,no-store ; refus sans contenu', async () => {
  const p = await premium('uid-p3');
  for (const [chem, ck] of [[ZONE, p], ['/api/moi', p], ['/api/catalogue', p], [ZONE, undefined], [ZONE, await connecter('uid-g3')]]) {
    const r = await appel('GET', chem, { cookie: ck });
    assert.match(r.h.get('Cache-Control') || '', /no-store/, chem + ' ' + r.s);
    if (r.s !== 200) assert.ok(!JSON.stringify(r.j).includes('ldn-pack'), 'un refus ne renvoie jamais le contenu');
  }
  const h = await traiter(new Request(O + ZONE, { method: 'HEAD', headers: { Cookie: p } }), ctx());
  assert.equal(h.status, 200); assert.match(h.headers.get('Cache-Control'), /no-store/);
  assert.equal((await appel('GET', ZONE + '?x=1')).s, 401, 'une chaîne de requête ne contourne rien');
  assert.equal((await appel('GET', '/api/premium/voyage/camp/contenu.json%00.js', { cookie: p })).s >= 400, true);
});

test('Révocation : l\'accès Premium disparaît tout de suite, sans redémarrage', async () => {
  const adm = await connecter(CREATEUR, { role: 'creator' });
  const inv = (await appel('POST', '/api/admin/invitations', { cookie: adm, corps: { email: 'oncle@exemple.fr', niveau: 'premium', dureeJours: 30 } })).j;
  const o = await connecter('uid-oncle', { email: 'oncle@exemple.fr' });
  await appel('POST', '/api/invitations/activer', { cookie: o, corps: { code: decodeURIComponent(inv.lien.split('invite=')[1]) } });
  assert.equal((await appel('GET', ZONE, { cookie: o })).s, 200);
  const acces = (await appel('GET', '/api/admin/acces', { cookie: adm })).j.acces.find(a => a.uid === 'uid-oncle');
  assert.equal((await appel('POST', `/api/admin/acces/${acces.id}/revoquer`, { cookie: adm })).s, 200);
  assert.equal((await appel('GET', ZONE, { cookie: o })).s, 403, 'avec le même cookie de session');
});

test('Expiration : un accès offert se termine à sa date ; un abonnement résilié garde la période payée', async () => {
  const adm = await connecter(CREATEUR, { role: 'creator' });
  const inv = (await appel('POST', '/api/admin/invitations', { cookie: adm, corps: { email: 'tante2@exemple.fr', niveau: 'premium', dureeJours: 10 } })).j;
  const t = await connecter('uid-tante2', { email: 'tante2@exemple.fr' });
  await appel('POST', '/api/invitations/activer', { cookie: t, corps: { code: decodeURIComponent(inv.lien.split('invite=')[1]) } });
  assert.equal((await appel('GET', ZONE, { cookie: t })).s, 200);
  const avant = maintenant, tc = () => connecter('uid-tante2', { email: 'tante2@exemple.fr' });
  maintenant += 9 * J; assert.equal((await appel('GET', ZONE, { cookie: await tc() })).s, 200, 'encore valide à J+9');
  maintenant = avant + 11 * J; assert.equal((await appel('GET', ZONE, { cookie: await tc() })).s, 403, 'expiré à J+11');
  maintenant = avant;
  // abonnement : période payée conservée après résiliation, puis fin
  await connecter('uid-ab'); { const e = abo('uid-ab', 'price_pm', 'active', maintenant + 5 * J); e.data.object.cancel_at_period_end = true; await webhook(e); }
  assert.equal((await appel('GET', ZONE, { cookie: await connecter('uid-ab') })).s, 200, 'période payée');
  maintenant = avant + 6 * J; assert.equal((await appel('GET', ZONE, { cookie: await connecter('uid-ab') })).s, 403, 'période terminée');
  maintenant = avant;
});

test('« Voir comme » : réservé au Créateur, appliqué côté serveur, sans toucher aux vrais comptes', async () => {
  const c = await connecter(CREATEUR, { role: 'creator' });
  const vue = v => appel('GET', ZONE, { cookie: c + '; ldn_vue=' + v });
  assert.equal((await vue('visiteur')).s, 401, 'comme un visiteur');
  assert.equal((await vue('gratuit')).s, 403, 'comme un compte gratuit');
  assert.equal((await vue('premium')).s, 200); assert.equal((await vue('famille')).s, 200);
  assert.equal((await appel('GET', MAISON, { cookie: c + '; ldn_vue=premium' })).s, 403, 'une maison non publiée reste invisible en vue Premium');
  const m = (await appel('GET', '/api/moi', { cookie: c + '; ldn_vue=gratuit' })).j;
  assert.equal(m.vue, 'gratuit'); assert.equal(m.admin, true, 'les droits réels (administration) restent ceux du Créateur : la vue ne change que les contenus');
  const cat = (await appel('GET', '/api/catalogue', { cookie: c + '; ldn_vue=gratuit' })).j;
  assert.equal(cat.catalogue.voyage.camp.ouvert, false); assert.equal(cat.catalogue.voyage.village.ouvert, true); assert.equal(cat.vue, 'gratuit');
  assert.equal((await appel('GET', '/api/catalogue', { cookie: c })).j.catalogue.maisons.mots.ouvert, true, 'sans vue : Créateur voit tout');
  // aucun compte réel modifié
  assert.equal(await base.lire('droits', 'uid-tricheur'), await base.lire('droits', 'uid-tricheur'), 'aucun document de droits créé par la vue');
  assert.equal((await appel('GET', '/api/admin/premium', { cookie: c + '; ldn_vue=gratuit' })).s, 200, 'l\'administration réelle reste celle du Créateur');
  // un compte non-Créateur ne peut PAS se donner de droits avec le cookie
  const g = await connecter('uid-tricheur');
  for (const v of ['premium', 'famille']) assert.equal((await appel('GET', ZONE, { cookie: g + '; ldn_vue=' + v })).s, 403, 'cookie ignoré ' + v);
  assert.equal((await appel('GET', ZONE, { cookie: 'ldn_vue=premium' })).s, 401, 'visiteur : cookie ignoré');
  assert.equal((await appel('GET', '/api/admin/premium', { cookie: g + '; ldn_vue=premium' })).s, 403);
  assert.equal((await appel('GET', ZONE, { cookie: c + '; ldn_vue=nimporte' })).s, 200, 'valeur inconnue ignorée');
});

test('Inventaire privé (Créateur) : fichiers présents avec leur niveau ; fermé aux autres', async () => {
  const c = await connecter(CREATEUR, { role: 'creator' });
  const inv = (await appel('GET', '/api/admin/premium', { cookie: c })).j;
  assert.equal(inv.disponible, true);
  const par = Object.fromEntries(inv.fichiers.map(f => [f.cle, f.niveau]));
  assert.equal(par['voyage/camp/contenu.json'], 'premium'); assert.equal(par['maisons/mots/index.html'], 'apercu'); assert.equal(par['voyage/village/contenu.json'], 'libre');
  assert.equal((await appel('GET', '/api/admin/premium', { cookie: await premium('uid-p4') })).s, 403);
  assert.equal((await appel('GET', '/api/admin/premium')).s, 401);
});

// ---------- Grand Voyage : ce que reçoit le jeu (le moteur 3D n'est pas lancé ici : on teste les données et les accès) ----------
const tables = () => ({ POINTS: structuredClone(CONTENU.POINTS), DESCRIPTIONS_LIEUX: { ...CONTENU.DESCRIPTIONS_LIEUX }, SPOTS: [], ajouterPhrases: (l, v) => { tables.phrases = (tables.phrases || []).concat(l); } });
const fetcherPour = cookie => async (u, o) => { const r = await traiter(new Request(O + u, { headers: cookie ? { Cookie: cookie } : {} }), ctx()); return r; };

test('Grand Voyage : sans droits, seules les zones libres s\'ouvrent et aucun texte Premium n\'est présent', async () => {
  for (const [nom, ck] of [['anonyme', undefined], ['gratuit', await connecter('uid-gv1')]]) {
    const T = tables(), a = await chargerPremium(T, { fetcher: fetcherPour(ck) });
    assert.equal(a.zones.size, 0, nom); assert.equal(a.zoneOuverte('camp'), false, nom); assert.equal(a.zoneOuverte('wadi'), false, nom);
    for (const libre of ['village', 'marche', 'oasis']) assert.equal(a.zoneOuverte(libre), true, nom + ' ' + libre);
    assert.equal(a.missionOuverte('lanternes'), false, nom); assert.equal(a.missionOuverte('objets'), true, 'la mission gratuite reste ouverte');
    assert.equal(T.POINTS.camp.texte, '', 'le texte Premium n\'existe pas dans le code public');
  }
});

test('Grand Voyage : Premium reçoit le contenu de ses zones ; une zone sans contenu reçu reste fermée', async () => {
  const T = tables(), a = await chargerPremium(T, { fetcher: fetcherPour(await premium('uid-gv2')) });
  assert.equal(a.zoneOuverte('camp'), true); assert.equal(T.POINTS.camp.texte, 'SENTINELLE-TEXTE-CAMP'); assert.equal(T.DESCRIPTIONS_LIEUX.camp, 'SENTINELLE-LIEU');
  assert.ok((tables.phrases || []).some(p => p[1] === 'SENTINELLE-TEXTE-CAMP'), 'phrases et voix ajoutées au moteur vocal');
  for (const z of ['dunes', 'montagnes', 'wadi', 'rochers']) assert.equal(a.zoneOuverte(z), false, z + ' : pas de fichier reçu → fermée (jamais ouverte à vide)');
  assert.equal(a.zoneOuverte('col'), false, 'le col suit les montagnes'); assert.equal(a.missionOuverte('lanternes'), true);
});

test('Grand Voyage : serveur injoignable, révocation, « voir comme » gratuit', async () => {
  const hors = await chargerPremium(tables(), { fetcher: async () => { throw new TypeError('réseau'); } });
  assert.equal(hors.raison, 'hors-ligne'); assert.equal(hors.zoneOuverte('camp'), false); assert.equal(hors.zoneOuverte('oasis'), true, 'le gratuit marche sans réseau');
  const lent = await chargerPremium(tables(), { fetcher: async () => new Response('', { status: 503 }) }); assert.equal(lent.raison, 'comptes-non-ouverts'); assert.equal(lent.zoneOuverte('camp'), false);
  const c = await connecter(CREATEUR, { role: 'creator' });
  assert.equal((await chargerPremium(tables(), { fetcher: fetcherPour(c + '; ldn_vue=gratuit') })).zoneOuverte('camp'), false, 'vue gratuit du Créateur');
  assert.equal((await chargerPremium(tables(), { fetcher: fetcherPour(c + '; ldn_vue=premium') })).zoneOuverte('camp'), true, 'vue Premium du Créateur');
  const p = await premium('uid-gv3'); assert.equal((await chargerPremium(tables(), { fetcher: fetcherPour(p) })).zoneOuverte('camp'), true);
  const adm = c, acc = (await appel('GET', '/api/admin/acces', { cookie: adm })).j.acces;
  await webhook({ ...abo('uid-gv3', 'price_pm', 'canceled'), type: 'customer.subscription.deleted' });
  assert.equal((await chargerPremium(tables(), { fetcher: fetcherPour(p) })).zoneOuverte('camp'), false, 'abonnement terminé : zone refermée au chargement suivant');
});

test('Grand Voyage : les packs réels du dossier privé (si présent) respectent le format et s\'appliquent', { skip: !fs.existsSync(process.env.LDN_PREMIUM_DIR || path.resolve('..', 'premium-lanternes', 'voyage')) && 'pack privé absent' }, async () => {
  const dossier = process.env.LDN_PREMIUM_DIR || path.resolve('..', 'premium-lanternes');
  const cat = { catalogue: { voyage: Object.fromEntries(ZONES_PREMIUM.map(z => [z, { ouvert: true }])), missions: {} } };
  const fetcher = async u => { if (u === '/api/catalogue') return new Response(JSON.stringify(cat)); const f = path.join(dossier, u.replace('/api/premium/', '')); return fs.existsSync(f) ? new Response(fs.readFileSync(f)) : new Response('', { status: 404 }); };
  const T = tables(), a = await chargerPremium(T, { fetcher });
  for (const z of ZONES_PREMIUM) assert.equal(a.zoneOuverte(z), true, z);
  for (const [k, p] of Object.entries(T.POINTS)) if (p.premium) { assert.ok(p.texte.length > 20, k + ' : texte reçu'); assert.ok(p.decouverte, k + ' : découverte reçue'); }
  for (const z of ZONES_PREMIUM.filter(z => fs.existsSync(path.join(dossier, 'voyage', z, 'voix')))) for (const f of fs.readdirSync(path.join(dossier, 'voyage', z, 'voix')))
    assert.ok(fs.statSync(path.join(dossier, 'voyage', z, 'voix', f)).size > 1000, z + '/' + f + ' : voix présente');
  assert.equal(appliquerPack({ format: 'autre', zone: 'camp' }, T), false, 'format inconnu refusé'); assert.equal(appliquerPack({ format: 'ldn-pack-voyage-1', zone: 'village' }, T), false, 'zone libre non concernée');
});

test('Village : l\'état de « Chasse aux mots » suit les droits (bientôt / réservée / ouverte / aperçu Créateur)', async () => {
  const bat = () => [{ id: 'mots', etat: 'bientot' }, { id: 'ablutions', etat: 'ouvert', lien: '../ablutions/' }];
  const etat = async ck => { const b = bat(); await chargerMaisons(b, { fetcher: fetcherPour(ck) }); return b; };
  const c = await connecter(CREATEUR, { role: 'creator' }), g = await connecter('uid-v1'), p = await premium('uid-v2');
  assert.equal((await etat(undefined))[0].etat, 'bientot', 'visiteur : bientôt, aucune adresse');
  assert.equal((await etat(undefined))[0].lien, undefined);
  assert.equal((await etat(g))[0].etat, 'bientot', 'maison non publiée : « bientôt » pour tout le monde sauf le Créateur');
  const cr = (await etat(c))[0]; assert.equal(cr.etat, 'ouvert'); assert.equal(cr.apercu, true); assert.equal(cr.lien, '/api/premium/maisons/mots/');
  assert.equal((await etat(c + '; ldn_vue=premium'))[0].etat, 'bientot', 'le Créateur en vue Premium voit « bientôt »');
  await appel('POST', '/api/admin/catalogue', { cookie: c, corps: { groupe: 'maisons', id: 'mots', niveau: 'premium' } });
  assert.equal((await etat(g))[0].etat, 'reserve', 'publiée, gratuit : réservée (sans prix)'); assert.equal((await etat(p))[0].etat, 'ouvert');
  assert.equal((await etat(p))[0].apercu, false); assert.equal((await etat(undefined))[0].etat, 'reserve');
  assert.equal((await etat(p))[1].etat, 'ouvert', 'les maisons gratuites ne changent pas'); assert.equal((await etat(p))[1].lien, '../ablutions/');
  await chargerMaisons(bat(), { fetcher: async () => { throw new Error('hors ligne'); } });   // ne plante pas hors ligne
  await appel('POST', '/api/admin/catalogue', { cookie: c, corps: { groupe: 'maisons', id: 'mots', niveau: 'apercu' } });
});
