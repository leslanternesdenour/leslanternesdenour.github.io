// API des Lanternes de Nour (exécutée dans Cloudflare Pages Functions, et dans les tests avec une base en mémoire).
// Toute décision de droits passe par serveur/droits.js. Le navigateur n'écrit jamais directement dans la base.
import { calculerDroits, peutAcceder, verifierActivationInvitation, verifierSouscription, profilsAGeler, creerCodeInvitation, empreinteCode, normaliserEmail, estCreateur, abonnementActif, accesOffertActif } from './droits.js';
import { creerSession, lireSession, lireCookie, enteteCookie } from './session.js';
import { connexionRecente } from './jeton.js';
import { catalogueEffectif, niveauDuFichier, ETATS } from './catalogue.js';
import { verifierSignatureStripe } from './stripe.js';
import { modeles } from './email-modeles.js';

const J = 86400000, PAGE = 20, VALIDITE_INVITATION = 14 * J;
const FORMULE_PRIX = { premium_mensuel: 'STRIPE_PRIX_PREMIUM_MENSUEL', premium_annuel: 'STRIPE_PRIX_PREMIUM_ANNUEL', famille_annuel: 'STRIPE_PRIX_FAMILLE_ANNUEL' };

// ---------- réponses ----------
const json = (data, statut = 200, entetes = {}) => new Response(JSON.stringify(data), { status: statut, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...entetes } });
const erreur = (statut, raison) => json({ erreur: raison }, statut);
// Préférences de la famille : seules les clés connues, avec leur type, sont renvoyées (rien d'autre n'est jamais lu ni écrit)
export const preferencesFamille = f => { const p = f && f.preferences || {}; return typeof p.sansVisage === 'boolean' ? { sansVisage: p.sansVisage } : {}; };

// ---------- en-têtes des fichiers Premium ----------
// Jamais gardés en cache (navigateur, service worker, intermédiaires). Les pages HTML reçoivent la même politique de
// sécurité que le site (les en-têtes de _headers ne s'appliquent pas aux réponses des Functions).
export const CSP = "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://www.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https://i.ytimg.com https://yt3.googleusercontent.com; media-src 'self' data: blob: https://cdn.islamic.network; connect-src 'self' https://cdn.jsdelivr.net https://api.alquran.cloud https://cdn.islamic.network https://www.gstatic.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com; frame-src 'self' https://www.youtube-nocookie.com; worker-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'";
export const TYPES_PREMIUM = { html: 'text/html; charset=utf-8', js: 'text/javascript; charset=utf-8', mjs: 'text/javascript; charset=utf-8', css: 'text/css; charset=utf-8', json: 'application/json; charset=utf-8',
  mp3: 'audio/mpeg', webp: 'image/webp', png: 'image/png', jpg: 'image/jpeg', svg: 'image/svg+xml', woff2: 'font/woff2', txt: 'text/plain; charset=utf-8' };
function entetesPremium(fichier, type) {
  const ext = (fichier.split('.').pop() || '').toLowerCase();
  const h = { 'Content-Type': TYPES_PREMIUM[ext] || type || 'application/octet-stream', 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin', 'X-Robots-Tag': 'noindex, nofollow' };
  if (ext === 'html') Object.assign(h, { 'Content-Security-Policy': CSP, 'X-Frame-Options': 'SAMEORIGIN' });
  return h;
}

// ---------- limitation simple du nombre de tentatives (par instance) ----------
const compteurs = new Map();
let sequence = 0;
function tropDeTentatives(cle, max, fenetreMs, maintenant) {
  const c = compteurs.get(cle);
  if (!c || c.debut + fenetreMs < maintenant) { compteurs.set(cle, { debut: maintenant, n: 1 }); return false; }
  c.n++; return c.n > max;
}
export function _reinitialiserCompteurs() { compteurs.clear(); }

async function corpsJson(req, max = 200000) {
  const t = await req.text(); if (t.length > max) throw new Error('trop-gros');
  try { return t ? JSON.parse(t) : {}; } catch (e) { throw new Error('json'); }
}

// ---------- droits ----------
async function sourcesDe(base, uid) { const d = await base.lire('droits', uid); return d ? d.sources || {} : {}; }
// « Voir comme » : le Créateur (et lui seul) peut demander à voir le site comme un visiteur ou un compte Gratuit / Premium / Famille,
// pour vérifier les contenus comme un utilisateur final. Cookie ldn_vue (non sensible) ; ignoré pour tout autre compte.
export const VUES = { visiteur: null, gratuit: 'gratuit', premium: 'premium', famille: 'famille' };
const PROFILS_VUE = { gratuit: 1, premium: 1, famille: 5 };
function vueDemandee(req, ctx, session) {
  const v = lireCookie(req.headers.get('Cookie'), 'ldn_vue');
  return v && v in VUES && session && estCreateur(session.uid, session.claims, ctx.env) ? v : null;
}
function droitsSimules(vue) {
  if (vue === 'visiteur') return null;
  return { statut: vue === 'gratuit' ? 'gratuit' : 'abonne', niveau: vue, profilsMax: PROFILS_VUE[vue], synchro: vue === 'famille', apercu: false, admin: false, payant: vue !== 'gratuit', offert: false, expire: null, vue };
}
// droits utilisés pour l'ACCÈS AUX CONTENUS (catalogue, fichiers Premium) : tient compte de la vue simulée du Créateur
async function droitsContenus(ctx, session, req) {
  const vue = vueDemandee(req, ctx, session);
  if (vue) return { d: droitsSimules(vue), connecte: vue !== 'visiteur', vue };
  return { d: await droitsDe(ctx, session), connecte: !!session, vue: null };
}
async function droitsDe(ctx, session) {
  if (!session) return null;
  return calculerDroits({ uid: session.uid, claims: session.claims, env: ctx.env, sources: await sourcesDe(ctx.base, session.uid), maintenant: ctx.maintenant });
}
// Recalcule la copie des sources de droits et (dé)gèle les profils en conséquence. Ne supprime JAMAIS un profil.
export async function majDroits(ctx, uid, { claims = {} } = {}) {
  const offerts = (await ctx.base.chercher('acces_offerts', 'uid', uid)).map(x => ({ id: x.id, ...x.data }));
  const abonnement = await ctx.base.lire('abonnements', uid);
  await ctx.base.ecrire('droits', uid, { sources: { accesOfferts: offerts, abonnement: abonnement || null }, majLe: ctx.maintenant });
  const d = calculerDroits({ uid, claims, env: ctx.env, sources: { accesOfferts: offerts, abonnement }, maintenant: ctx.maintenant });
  await appliquerGel(ctx, uid, d.profilsMax);
  return d;
}
async function tousLesEnfants(base, uid) {
  const tout = []; let apres = null;
  do { const p = await base.lister(`familles/${uid}/enfants`, { limite: 100, apres }); tout.push(...p.docs); apres = p.suite; } while (apres);
  return tout;
}
async function appliquerGel(ctx, uid, profilsMax) {
  const enfants = await tousLesEnfants(ctx.base, uid);
  const famille = await ctx.base.lire('familles', uid);
  const geler = new Set(profilsAGeler(enfants.map(e => ({ id: e.id, creeLe: e.data.creeLe })), profilsMax, famille && famille.profilActif));
  for (const e of enfants) { const g = geler.has(e.id); if (!!e.data.gele !== g) await ctx.base.maj(`familles/${uid}/enfants`, e.id, { gele: g }); }
}

async function journal(ctx, action, details) {
  await ctx.base.ecrire('admin_logs', String(ctx.maintenant).padStart(15, '0') + '-' + Math.random().toString(36).slice(2, 8), { t: ctx.maintenant, action, ...details });
}

// ---------- contrôles d'accès ----------
const FOURNISSEURS = ['password', 'google.com'];
function memeOrigine(req) {
  if (req.headers.get('X-LDN') !== '1') return false;                 // en-tête personnalisé : impossible depuis un autre site sans autorisation
  const o = req.headers.get('Origin'); if (!o) return true;
  return o === new URL(req.url).origin;
}
function exigerCreateur(ctx, session, { recent = false } = {}) {
  if (!session || !estCreateur(session.uid, session.claims, ctx.env)) return erreur(403, 'reserve-createur');
  if (recent && !connexionRecente(session, ctx.maintenant)) return erreur(401, 'reconnexion-requise');
  return null;
}

// ---------- validation des profils enfants (minimisation RGPD) ----------
function validerEnfant(b) {
  const surnom = String(b.surnom || '').trim();
  if (!/^[\p{L}][\p{L} '’-]{0,19}$/u.test(surnom)) return { erreur: 'surnom-invalide' };   // un prénom ou surnom : lettres, 20 max, pas de chiffres
  if (!['3-5', '6-10'].includes(b.tranche)) return { erreur: 'tranche-invalide' };
  if (!['fille', 'garcon'].includes(b.avatar)) return { erreur: 'avatar-invalide' };
  return { surnom, tranche: b.tranche, avatar: b.avatar };
}

// ---------- e-mails personnalisés (vérification, réinitialisation, confirmation) : envoyés par NOTRE serveur ----------
// Le lien est fabriqué ici : le code d'action vient de Firebase (jeton à usage unique, durée limitée) et mène à notre page /compte/action/.
const DELAI_ENVOI_S = 90, MAX_PAR_JOUR = 6;
const ORIGINES_SITE = [/^https:\/\/(www\.)?leslanternesdenour\.fr$/, /^https:\/\/preproduction\.[a-z0-9-]+\.pages\.dev$/, /^http:\/\/(localhost|127\.0\.0\.1):\d+$/];
const origineSite = url => ORIGINES_SITE.some(r => r.test(url.origin)) ? url.origin : 'https://leslanternesdenour.fr';   // jamais un domaine étranger dans un lien envoyé
const lienAction = (url, mode, code) => `${origineSite(url)}/compte/action/?mode=${mode}&oobCode=${encodeURIComponent(code)}&lang=fr`;
async function empreinteAdresse(email) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(email)); return [...new Uint8Array(b)].slice(0, 16).map(x => x.toString(16).padStart(2, '0')).join(''); }
// 90 s entre deux envois et 6 par jour, mémorisés dans Firestore (collection « courriers », clé = uid ou empreinte de l'adresse) : valables sur toutes les instances.
async function reserverEnvoi(ctx, cle) {
  const d = await ctx.base.lire('courriers', cle) || {}, jour = new Date(ctx.maintenant).toISOString().slice(0, 10), n = d.jour === jour ? d.n || 0 : 0;
  if (d.dernier && ctx.maintenant - d.dernier < DELAI_ENVOI_S * 1000) return { ok: false, raison: 'trop-tot', attente: Math.ceil((DELAI_ENVOI_S * 1000 - (ctx.maintenant - d.dernier)) / 1000) };
  if (n >= MAX_PAR_JOUR) return { ok: false, raison: 'limite-journaliere', attente: 3600 };
  await ctx.base.ecrire('courriers', cle, { dernier: ctx.maintenant, jour, n: n + 1 });
  return { ok: true };
}
// ======================================================================
export async function traiter(req, ctx) {
  const url = new URL(req.url), chemin = url.pathname.replace(/\/+$/, ''), m = req.method;
  ctx.maintenant = ctx.maintenant || Date.now();
  const secure = url.protocol === 'https:';
  const ip = req.headers.get('CF-Connecting-IP') || 'local';
  try {
    // Webhook Stripe : authentifié par signature, pas par cookie
    if (chemin === '/api/stripe/webhook' && m === 'POST') return webhookStripe(req, ctx);

    if (m !== 'GET' && m !== 'HEAD' && !memeOrigine(req)) return erreur(403, 'origine');
    const session = await lireSession(lireCookie(req.headers.get('Cookie')), ctx.env.SESSION_SECRET, ctx.maintenant);

    // Mode des paiements, pour que les pages affichent le bon texte (jamais une valeur de clé) : « ferme » (pas de Stripe configuré), « test » ou « reel ».
    if (chemin === '/api/paiement/mode' && m === 'GET') return json({ mode: !ctx.stripe ? 'ferme' : ctx.stripe.modeTest ? 'test' : 'reel' });

    // ----- session -----
    if (chemin === '/api/session' && m === 'POST') {
      if (tropDeTentatives('session:' + ip, 30, 10 * 60000, ctx.maintenant)) return erreur(429, 'trop-de-tentatives');
      const b = await corpsJson(req, 10000);
      let v; try { v = await ctx.auth.verifierIdToken(b.idToken, ctx.maintenant); } catch (e) { return erreur(401, 'jeton-invalide'); }
      // Deux méthodes de connexion seulement : e-mail + mot de passe, et Google. Tout autre jeton (Apple, anonyme, téléphone…) est refusé, même si ce fournisseur était activé par erreur dans la console Firebase.
      if (!FOURNISSEURS.includes(v.fournisseur)) return erreur(403, 'fournisseur-non-autorise');
      // Google : l'adresse doit exister et être vérifiée par Google (sinon elle ne prouve rien : invitations et paiements s'appuient sur elle).
      if (v.fournisseur === 'google.com' && (!v.email || !v.emailVerifie)) return erreur(403, 'email-google-non-verifie');
      let famille = await ctx.base.lire('familles', v.uid);
      if (!famille) {
        const c = b.consentements || {};
        if (!(c.parent === true && c.cgu === true && c.confidentialite === true)) return erreur(428, 'consentement-requis');
        famille = { email: normaliserEmail(v.email), creeLe: ctx.maintenant, consentements: { parent: ctx.maintenant, cgu: ctx.maintenant, confidentialite: ctx.maintenant, version: ctx.env.VERSION_TEXTES || '2026-11' }, profilActif: null };
        await ctx.base.ecrire('familles', v.uid, famille);
        await majDroits(ctx, v.uid, { claims: v.claims });
      } else if (normaliserEmail(v.email) !== famille.email) await ctx.base.maj('familles', v.uid, { email: normaliserEmail(v.email) });
      const valeur = await creerSession({ uid: v.uid, email: v.email, emailVerifie: v.emailVerifie, role: v.claims.role, authTime: v.authTime, fournisseur: v.fournisseur }, ctx.env.SESSION_SECRET, ctx.maintenant);
      // Adresse tout juste vérifiée après une demande d'e-mail : UN message de confirmation, une seule fois (drapeau posé avant l'envoi).
      if (v.emailVerifie && ctx.courriel && famille.verifDemandeeLe && !famille.verifConfirmeeLe && v.email) {
        try { await ctx.base.maj('familles', v.uid, { verifConfirmeeLe: ctx.maintenant }); await ctx.courriel.envoyer({ a: v.email, ...modeles.confirmationVerification({ lienJeu: origineSite(url) + '/compte/' }) }); } catch (e) { /* la connexion ne doit jamais échouer à cause d'un e-mail */ }
      }      return json({ ok: true }, 200, { 'Set-Cookie': enteteCookie(valeur, { secure }) });
    }
    if (chemin === '/api/session/fin' && m === 'POST') return json({ ok: true }, 200, { 'Set-Cookie': enteteCookie('', { secure, effacer: true }) });

    // ----- activation du rôle Créateur (une fois, en un clic depuis /compte/) -----
    // Double verrou conservé : il faut À LA FOIS l'UID dans le secret CREATOR_UID (posé par le propriétaire dans Cloudflare)
    // et le rôle « creator » dans Firebase. Cette route pose le second, uniquement pour le compte désigné par le premier,
    // adresse e-mail vérifiée et connexion récente. Aucun autre compte ne peut s'en servir.
    if (chemin === '/api/createur/activer' && m === 'POST') {
      const attendu = typeof ctx.env.CREATOR_UID === 'string' ? ctx.env.CREATOR_UID.trim() : '';
      if (!session || !attendu || session.uid !== attendu) return erreur(403, 'reserve-createur');
      if (tropDeTentatives('createur:' + ip, 10, 60 * 60000, ctx.maintenant)) return erreur(429, 'trop-de-tentatives');
      if (!session.emailVerifie) return erreur(403, 'adresse-non-verifiee');
      if (estCreateur(session.uid, session.claims, ctx.env)) return json({ ok: true, deja: true });
      if (!connexionRecente(session, ctx.maintenant)) return erreur(401, 'reconnexion-requise');
      if (typeof ctx.base.poserRoleCreateur !== 'function') return erreur(501, 'non-disponible');
      await ctx.base.poserRoleCreateur(session.uid);
      await journal(ctx, 'role-createur-pose', { uid: session.uid });
      return json({ ok: true, reconnexion: true });
    }

    // ----- qui suis-je -----
    if (chemin === '/api/moi' && m === 'GET') {
      if (!session) return json({ connecte: false, statut: 'visiteur' });
      const d = await droitsDe(ctx, session); const f = await ctx.base.lire('familles', session.uid);
      return json({ connecte: true, uid: session.uid, email: session.email, emailVerifie: session.emailVerifie, fournisseur: session.fournisseur, ...d, vue: vueDemandee(req, ctx, session),
        profilsMax: d.profilsMax === Infinity ? null : d.profilsMax, illimite: d.profilsMax === Infinity, profilActif: f && f.profilActif || null, preferences: preferencesFamille(f),
        activationCreateur: d.statut !== 'creator' && session.emailVerifie && !!String(ctx.env.CREATOR_UID || '').trim() && session.uid === String(ctx.env.CREATOR_UID).trim() });
    }

    // ----- catalogue (pour l'affichage : chaque contenu avec « ouvert » ou non) -----
    if (chemin === '/api/catalogue' && m === 'GET') {
      const cat = catalogueEffectif((await ctx.base.lire('catalogue', 'etat')) || {});
      const { d, connecte, vue: simulee } = await droitsContenus(ctx, session, req);
      const vue = {};
      for (const [g, items] of Object.entries(cat)) vue[g] = Object.fromEntries(Object.entries(items).map(([id, n]) => [id, { niveau: n, publie: n !== 'apercu', ouvert: peutAcceder(n, d) || (n === 'gratuit' && connecte) }]));
      return json({ catalogue: vue, vue: simulee, bandeau: ((await ctx.base.lire('catalogue', 'bandeau')) || {}).texte || null });
    }

    // ----- contenus Premium (stockage privé R2) -----
    if (chemin.startsWith('/api/premium/') && (m === 'GET' || m === 'HEAD')) {
      let fichier; try { fichier = decodeURIComponent(url.pathname.slice('/api/premium/'.length)); } catch (e) { return erreur(400, 'chemin'); }
      if (fichier.endsWith('/')) fichier += 'index.html';                          // une maison s'ouvre par son dossier
      const cat = catalogueEffectif((await ctx.base.lire('catalogue', 'etat')) || {});
      const niveau = niveauDuFichier(fichier, cat);
      if (!niveau) return erreur(400, 'chemin');
      const { d, connecte } = await droitsContenus(ctx, session, req);
      if (connecte && session && !session.emailVerifie) return erreur(403, 'email-non-verifie');   // adresse du parent à vérifier d'abord (contrôlé ici, par le serveur)
      const ok = peutAcceder(niveau, d) || (niveau === 'gratuit' && connecte);
      if (!ok) return erreur(connecte ? 403 : 401, connecte ? 'premium-requis' : 'connexion-requise');
      const obj = await ctx.stockage.get(fichier);
      if (!obj) return erreur(404, 'introuvable');
      return new Response(m === 'HEAD' ? null : obj.body, { headers: entetesPremium(fichier, obj.type) });
    }

    // ----- réinitialisation du mot de passe par e-mail personnalisé (publique : le parent n'est pas connecté) -----
    // Réponse identique que le compte existe ou non (aucune énumération) ; limitée par IP (429) et par adresse (silencieusement).
    if (chemin === '/api/email/reinitialisation' && m === 'POST') {
      if (!ctx.courriel) return erreur(503, 'email-non-configure');
      if (tropDeTentatives('reinit:' + ip, 8, 15 * 60000, ctx.maintenant)) return erreur(429, 'trop-de-tentatives');
      const b = await corpsJson(req, 1000), email = typeof b.email === 'string' ? normaliserEmail(b.email) : '';
      if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return erreur(400, 'adresse-invalide');
      const lim = await reserverEnvoi(ctx, 'r' + await empreinteAdresse(email));
      if (!lim.ok) return json({ ok: true });
      try { const lien = await ctx.base.lienAction('PASSWORD_RESET', email); if (lien) await ctx.courriel.envoyer({ a: email, ...modeles.reinitialisation({ lien: lienAction(url, 'resetPassword', lien.oobCode) }) }); } catch (e) { /* neutre : rien n'est révélé */ }
      return json({ ok: true });
    }
    // ===== tout ce qui suit exige d'être connecté =====
    if (chemin.startsWith('/api/') && !session) return erreur(401, 'connexion-requise');
    const d = await droitsDe(ctx, session);

    // ----- vérification de l'adresse e-mail : e-mail personnalisé envoyé par notre serveur (adresse = celle de la SESSION, jamais celle d'une requête) -----
    if (chemin === '/api/email/verification' && m === 'POST') {
      if (!ctx.courriel) return erreur(503, 'email-non-configure');       // le navigateur retombe alors sur l'envoi Firebase
      if (session.emailVerifie) return json({ deja: true });
      if (!session.email) return erreur(400, 'adresse-absente');
      if (tropDeTentatives('email:' + ip, 20, 10 * 60000, ctx.maintenant)) return erreur(429, 'trop-de-tentatives');
      const lim = await reserverEnvoi(ctx, session.uid);
      if (!lim.ok) return json({ erreur: lim.raison, attente: lim.attente }, 429);
      let lien; try { lien = await ctx.base.lienAction('VERIFY_EMAIL', session.email); } catch (e) { return erreur(502, 'envoi-impossible'); }
      if (!lien) return erreur(404, 'compte-introuvable');
      try { await ctx.courriel.envoyer({ a: session.email, ...modeles.verification({ lien: lienAction(url, 'verifyEmail', lien.oobCode) }) }); } catch (e) { return erreur(502, 'envoi-impossible'); }
      await ctx.base.maj('familles', session.uid, { verifDemandeeLe: ctx.maintenant });
      return json({ envoye: true, delai: DELAI_ENVOI_S });
    }
    // ----- vérification de l'adresse e-mail du parent (décision du 24/11/2026) : obligatoire avant tout profil enfant et toute progression -----
    // Contrôlée par le SERVEUR, jamais seulement par le navigateur. La connexion, /api/moi, la suppression du compte et le réglage de famille restent possibles.
    if (chemin === '/api/enfants' || chemin.startsWith('/api/enfants/')) { if (!session.emailVerifie) return erreur(403, 'email-non-verifie'); }

    // ----- préférences de la famille (identiques pour tous les profils enfants) : mode sans visage -----
    if (chemin === '/api/famille/preferences' && m === 'PATCH') {
      const c = await corpsJson(req, 500);
      if (typeof c.sansVisage !== 'boolean') return erreur(400, 'sansVisage-booleen-requis');
      const f = await ctx.base.lire('familles', session.uid) || {};
      await ctx.base.maj('familles', session.uid, { preferences: { ...preferencesFamille(f), sansVisage: c.sansVisage } });
      return json({ ok: true, preferences: { sansVisage: c.sansVisage } });
    }

    // ----- profils enfants -----
    if (chemin === '/api/enfants' && m === 'GET') {
      const p = await ctx.base.lister(`familles/${session.uid}/enfants`, { limite: PAGE, apres: url.searchParams.get('apres') });
      return json({ enfants: p.docs.map(x => ({ id: x.id, ...x.data, progression: undefined })), suite: p.suite, total: await ctx.base.compter(`familles/${session.uid}/enfants`) });
    }
    if (chemin === '/api/enfants' && m === 'POST') {
      const e = validerEnfant(await corpsJson(req, 2000)); if (e.erreur) return erreur(400, e.erreur);
      const n = await ctx.base.compter(`familles/${session.uid}/enfants`);
      if (d.profilsMax !== Infinity && n >= d.profilsMax) return erreur(403, 'limite-profils');
      const id = 'e' + ctx.maintenant.toString(36).padStart(9, '0') + (sequence++ % 1679616).toString(36).padStart(4, '0') + Math.random().toString(36).slice(2, 5);   // ordre de création stable
      await ctx.base.ecrire(`familles/${session.uid}/enfants`, id, { ...e, creeLe: ctx.maintenant, gele: false, progression: {}, majLe: ctx.maintenant });
      const f = await ctx.base.lire('familles', session.uid);
      if (f && !f.profilActif) await ctx.base.maj('familles', session.uid, { profilActif: id });
      return json({ id }, 201);
    }
    let r = /^\/api\/enfants\/([A-Za-z0-9]{1,40})(\/progression|\/actif)?$/.exec(chemin);
    if (r) {
      const col = `familles/${session.uid}/enfants`, enfant = await ctx.base.lire(col, r[1]);
      if (!enfant) return erreur(404, 'profil-introuvable');
      if (!r[2] && m === 'GET') return json({ id: r[1], ...enfant, progression: d.synchro ? enfant.progression : undefined });
      if (r[2] === '/progression' && m === 'PUT') {
        if (!d.synchro) return erreur(403, 'synchro-famille');
        if (enfant.gele) return erreur(423, 'profil-gele');
        const b = await corpsJson(req, 150000);
        if (!b.progression || typeof b.progression !== 'object' || Array.isArray(b.progression)) return erreur(400, 'progression');
        await ctx.base.maj(col, r[1], { progression: b.progression, majLe: ctx.maintenant });
        return json({ ok: true });
      }
      if (r[2] === '/actif' && m === 'POST') {
        await ctx.base.maj('familles', session.uid, { profilActif: r[1] });
        await appliquerGel(ctx, session.uid, d.profilsMax);
        return json({ ok: true });
      }
      if (!r[2] && m === 'PATCH') {
        const e = validerEnfant({ ...enfant, ...(await corpsJson(req, 2000)) }); if (e.erreur) return erreur(400, e.erreur);
        await ctx.base.maj(col, r[1], e); return json({ ok: true });
      }
      if (!r[2] && m === 'DELETE') {                    // seulement sur demande explicite du parent, jamais automatique
        await ctx.base.supprimer(col, r[1]); return json({ ok: true });
      }
    }

    // ----- invitations : activation par le proche -----
    if (chemin === '/api/invitations/activer' && m === 'POST') {
      if (tropDeTentatives('inv:' + session.uid, 10, 60 * 60000, ctx.maintenant)) return erreur(429, 'trop-de-tentatives');
      const b = await corpsJson(req, 1000);
      const id = await empreinteCode(String(b.code || '').trim());
      const inv = await ctx.base.lire('invitations', id);
      const abonnement = await ctx.base.lire('abonnements', session.uid);
      const verdict = verifierActivationInvitation({ invitation: inv, compte: { email: session.email, emailVerifie: session.emailVerifie }, abonnement, maintenant: ctx.maintenant });
      if (!verdict.ok) { if (verdict.raison === 'abonnement-actif') await journal(ctx, 'invitation-bloquee-abonnement', { uid: session.uid, invitation: id }); return erreur(409, verdict.raison); }
      const accesId = 'a' + id.slice(0, 20);
      const cree = await ctx.base.creerSiAbsent('acces_offerts', accesId, { uid: session.uid, email: normaliserEmail(session.email), niveau: inv.niveau, debut: ctx.maintenant,
        fin: inv.dureeJours ? ctx.maintenant + inv.dureeJours * J : null, libelle: inv.libelle || '', invitation: id, creeLe: ctx.maintenant, revoqueLe: null, historique: [{ t: ctx.maintenant, action: 'activation' }] });
      if (!cree) return erreur(409, 'deja-utilisee');                              // deux clics simultanés : un seul passe
      await ctx.base.maj('invitations', id, { utiliseeLe: ctx.maintenant, utiliseePar: session.uid });
      await majDroits(ctx, session.uid, { claims: session.claims });
      await journal(ctx, 'invitation-activee', { uid: session.uid, invitation: id, niveau: inv.niveau });
      return json({ ok: true, niveau: inv.niveau });
    }

    // ----- abonnement (Stripe, mode test) -----
    if (chemin === '/api/paiement/session' && m === 'POST') {
      if (!ctx.stripe) return erreur(503, 'paiement-non-configure');
      if (!session.emailVerifie) return erreur(403, 'email-non-verifie');
      const b = await corpsJson(req, 2000);
      const v = verifierSouscription({ droits: d, formule: b.formule }); if (!v.ok) return erreur(409, v.raison);
      if (!(b.consentements && b.consentements.cgv === true && b.consentements.executionImmediate === true)) return erreur(428, 'consentement-requis');
      const prix = ctx.env[FORMULE_PRIX[b.formule]]; if (!prix) return erreur(503, 'prix-non-configure');
      const ab = await ctx.base.lire('abonnements', session.uid);
      const s = await ctx.stripe.creerCheckout({ uid: session.uid, email: session.email, prix, client: ab && ab.stripeClient, succes: url.origin + '/compte/?paiement=ok', annulation: url.origin + '/tarifs/?paiement=annule' });
      await ctx.base.ecrire('consentements_achat', s.id, { uid: session.uid, formule: b.formule, cgv: ctx.maintenant, executionImmediate: ctx.maintenant, version: ctx.env.VERSION_TEXTES || '2026-11' });
      return json({ url: s.url });
    }
    if (chemin === '/api/abonnement/resilier' && m === 'POST') {
      const ab = await ctx.base.lire('abonnements', session.uid);
      if (!ab || !abonnementActif(ab, ctx.maintenant)) return erreur(404, 'aucun-abonnement');
      if (ctx.stripe) await ctx.stripe.resilierFinPeriode(ab.stripeAbonnement);
      await ctx.base.maj('abonnements', session.uid, { annulationFinPeriode: true, resilieLe: ctx.maintenant });
      await majDroits(ctx, session.uid, { claims: session.claims });
      return json({ ok: true, finAcces: ab.finPeriode });
    }
    if (chemin === '/api/abonnement/portail' && m === 'POST') {
      const ab = await ctx.base.lire('abonnements', session.uid);
      if (!ctx.stripe || !ab || !ab.stripeClient) return erreur(404, 'aucun-abonnement');
      return json({ url: (await ctx.stripe.creerPortail({ client: ab.stripeClient, retour: url.origin + '/compte/' })).url });
    }

    // ----- suppression complète du compte (RGPD) -----
    if (chemin === '/api/compte' && m === 'DELETE') {
      if (!connexionRecente(session, ctx.maintenant)) return erreur(401, 'reconnexion-requise');
      const ab = await ctx.base.lire('abonnements', session.uid);
      if (ab && abonnementActif(ab, ctx.maintenant) && !ab.annulationFinPeriode) return erreur(409, 'abonnement-actif');
      const emailSuppr = session.email;
      await supprimerToutesLesDonnees(ctx, session.uid);
      if (ctx.courriel && emailSuppr) { try { await ctx.courriel.envoyer({ a: emailSuppr, ...modeles.compteSupprime() }); } catch (e) { /* la suppression ne dépend pas de l'e-mail */ } }
      return json({ ok: true }, 200, { 'Set-Cookie': enteteCookie('', { secure, effacer: true }) });
    }

    // ===== administration : Créateur uniquement =====
    if (chemin.startsWith('/api/admin/')) return administration(req, ctx, session, chemin, url);

    return erreur(404, 'inconnu');
  } catch (e) {
    if (e && (e.message === 'json' || e.message === 'trop-gros')) return erreur(400, e.message);
    console.error(e); return erreur(500, 'erreur-serveur');
  }
}

export async function supprimerToutesLesDonnees(ctx, uid) {
  for (const e of await tousLesEnfants(ctx.base, uid)) await ctx.base.supprimer(`familles/${uid}/enfants`, e.id);   // Firestore ne supprime pas les sous-collections tout seul
  for (const a of await ctx.base.chercher('acces_offerts', 'uid', uid)) await ctx.base.supprimer('acces_offerts', a.id);
  for (const i of await ctx.base.chercher('invitations', 'utiliseePar', uid)) await ctx.base.maj('invitations', i.id, { email: null, utiliseePar: null });
  // journal et invitations : on efface l'identifiant et l'adresse (le journal garde seulement l'action, anonymisée)
  const famille = await ctx.base.lire('familles', uid), email = famille && famille.email;
  if (email) for (const i of await ctx.base.chercher('invitations', 'email', email)) await ctx.base.maj('invitations', i.id, { email: null });
  let apres = null;
  do {
    const pg = await ctx.base.lister('admin_logs', { limite: 200, apres });
    for (const l of pg.docs) if (l.data.uid === uid || (email && l.data.email === email)) await ctx.base.maj('admin_logs', l.id, { uid: l.data.uid === uid ? 'anonymise' : l.data.uid, email: email && l.data.email === email ? null : l.data.email });
    apres = pg.suite;
  } while (apres);
  // Stripe : le lien client → compte est effacé ; la preuve de consentement d'achat est CONSERVÉE (obligation légale, clé = identifiant de session Stripe) mais détachée du compte.
  for (const c of await ctx.base.chercher('stripe_clients', 'uid', uid)) await ctx.base.supprimer('stripe_clients', c.id);
  for (const c of await ctx.base.chercher('consentements_achat', 'uid', uid)) await ctx.base.maj('consentements_achat', c.id, { uid: 'anonymise' });
  await ctx.base.supprimer('courriers', uid);
  if (email) await ctx.base.supprimer('courriers', 'r' + await empreinteAdresse(email));   // données d'envoi : horodatages seulement, clé = empreinte de l'adresse
  await ctx.base.supprimer('droits', uid);
  await ctx.base.supprimer('abonnements', uid);
  await ctx.base.supprimer('familles', uid);
  await ctx.base.supprimerUtilisateur(uid);
  await journal(ctx, 'compte-supprime', { uid: 'anonymise' });
}

// ======================================================================
async function administration(req, ctx, session, chemin, url) {
  const m = req.method, ecriture = m !== 'GET';
  const refus = exigerCreateur(ctx, session, { recent: ecriture }); if (refus) return refus;
  const apres = url.searchParams.get('apres');

  if (chemin === '/api/admin/resume' && m === 'GET') {
    const abos = (await ctx.base.chercher('abonnements', 'statut', 'active', 10000)).concat(await ctx.base.chercher('abonnements', 'statut', 'trialing', 10000)).filter(a => abonnementActif(a.data, ctx.maintenant));
    const parFormule = {}; for (const a of abos) parFormule[a.data.formule] = (parFormule[a.data.formule] || 0) + 1;
    const offerts = [];
    let p = null; do { const pg = await ctx.base.lister('acces_offerts', { limite: 100, apres: p }); offerts.push(...pg.docs); p = pg.suite; } while (p);
    const actifs = offerts.filter(o => accesOffertActif(o.data, ctx.maintenant));
    const familles = await ctx.base.compter('familles');
    return json({ familles, payants: abos.length, parFormule, accesOffertsActifs: actifs.length, gratuits: Math.max(0, familles - abos.length - new Set(actifs.map(o => o.data.uid)).size) });
  }
  if (chemin === '/api/admin/comptes' && m === 'GET') {
    const pg = await ctx.base.lister('familles', { limite: PAGE, apres });
    const comptes = [];
    for (const f of pg.docs) {
      const dr = calculerDroits({ uid: f.id, claims: {}, env: ctx.env, sources: await sourcesDe(ctx.base, f.id), maintenant: ctx.maintenant });
      comptes.push({ uid: f.id, email: f.data.email, creeLe: f.data.creeLe, statut: f.id === ctx.env.CREATOR_UID ? 'creator' : dr.statut, niveau: dr.niveau, expire: dr.expire, enfants: await ctx.base.compter(`familles/${f.id}/enfants`) });
    }
    return json({ comptes, suite: pg.suite });
  }
  let r = /^\/api\/admin\/comptes\/([A-Za-z0-9_-]{1,128})$/.exec(chemin);
  if (r && m === 'GET') {
    const f = await ctx.base.lire('familles', r[1]); if (!f) return erreur(404, 'compte-introuvable');
    const pg = await ctx.base.lister(`familles/${r[1]}/enfants`, { limite: PAGE, apres });
    const ab = await ctx.base.lire('abonnements', r[1]);
    return json({ uid: r[1], email: f.email, creeLe: f.creeLe, consentements: f.consentements, abonnement: ab ? { statut: ab.statut, formule: ab.formule, finPeriode: ab.finPeriode, annulationFinPeriode: !!ab.annulationFinPeriode } : null,
      acces: (await ctx.base.chercher('acces_offerts', 'uid', r[1])).map(a => ({ id: a.id, ...a.data })),
      enfants: pg.docs.map(e => ({ id: e.id, surnom: e.data.surnom, tranche: e.data.tranche, avatar: e.data.avatar, gele: !!e.data.gele, creeLe: e.data.creeLe })), suite: pg.suite,
      totalEnfants: await ctx.base.compter(`familles/${r[1]}/enfants`) });
  }

  // invitations
  if (chemin === '/api/admin/invitations' && m === 'POST') {
    const b = await corpsJson(req, 2000);
    const email = normaliserEmail(b.email);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return erreur(400, 'email-invalide');
    if (!['premium', 'famille'].includes(b.niveau)) return erreur(400, 'niveau-invalide');
    const duree = b.dureeJours == null ? null : Number(b.dureeJours);
    if (duree !== null && !(Number.isInteger(duree) && duree >= 1 && duree <= 3650)) return erreur(400, 'duree-invalide');
    const code = creerCodeInvitation(), id = await empreinteCode(code);
    await ctx.base.ecrire('invitations', id, { email, niveau: b.niveau, dureeJours: duree, libelle: String(b.libelle || '').slice(0, 60), creeLe: ctx.maintenant, expireLe: ctx.maintenant + VALIDITE_INVITATION, utiliseeLe: null, utiliseePar: null, annuleeLe: null });
    await journal(ctx, 'invitation-creee', { invitation: id, email, niveau: b.niveau, dureeJours: duree });
    return json({ id, lien: url.origin + '/compte/?invite=' + encodeURIComponent(code), expireLe: ctx.maintenant + VALIDITE_INVITATION }, 201);   // le code n'est montré qu'une fois
  }
  if (chemin === '/api/admin/invitations' && m === 'GET') {
    const pg = await ctx.base.lister('invitations', { limite: PAGE, apres });
    return json({ invitations: pg.docs.map(i => ({ id: i.id, ...i.data, etat: i.data.annuleeLe ? 'annulee' : i.data.utiliseeLe ? 'utilisee' : i.data.expireLe <= ctx.maintenant ? 'expiree' : 'en-attente' })), suite: pg.suite });
  }
  r = /^\/api\/admin\/invitations\/([0-9a-f]{64})$/.exec(chemin);
  if (r && m === 'DELETE') {
    const inv = await ctx.base.lire('invitations', r[1]); if (!inv) return erreur(404, 'invitation-introuvable');
    if (inv.utiliseeLe) return erreur(409, 'deja-utilisee');
    await ctx.base.maj('invitations', r[1], { annuleeLe: ctx.maintenant }); await journal(ctx, 'invitation-annulee', { invitation: r[1] });
    return json({ ok: true });
  }

  // accès offerts
  if (chemin === '/api/admin/acces' && m === 'GET') {
    const pg = await ctx.base.lister('acces_offerts', { limite: PAGE, apres });
    return json({ acces: pg.docs.map(a => ({ id: a.id, ...a.data, actif: accesOffertActif(a.data, ctx.maintenant) })), suite: pg.suite });
  }
  if (chemin === '/api/admin/acces' && m === 'POST') {                 // attribution directe à un compte existant
    const b = await corpsJson(req, 2000), email = normaliserEmail(b.email);
    const cible = (await ctx.base.chercher('familles', 'email', email, 2))[0];
    if (!cible) return erreur(404, 'compte-introuvable');
    if (!['premium', 'famille'].includes(b.niveau)) return erreur(400, 'niveau-invalide');
    if (abonnementActif(await ctx.base.lire('abonnements', cible.id), ctx.maintenant)) return erreur(409, 'abonnement-actif');
    const duree = b.dureeJours == null ? null : Number(b.dureeJours);
    if (duree !== null && !(Number.isInteger(duree) && duree >= 1 && duree <= 3650)) return erreur(400, 'duree-invalide');
    const id = 'd' + ctx.maintenant.toString(36) + Math.random().toString(36).slice(2, 7);
    await ctx.base.ecrire('acces_offerts', id, { uid: cible.id, email, niveau: b.niveau, debut: ctx.maintenant, fin: duree ? ctx.maintenant + duree * J : null, libelle: String(b.libelle || '').slice(0, 60), invitation: null, creeLe: ctx.maintenant, revoqueLe: null, historique: [{ t: ctx.maintenant, action: 'attribution-directe' }] });
    await majDroits(ctx, cible.id); await journal(ctx, 'acces-attribue', { acces: id, uid: cible.id, niveau: b.niveau, dureeJours: duree });
    return json({ id }, 201);
  }
  r = /^\/api\/admin\/acces\/([A-Za-z0-9]{1,40})\/(prolonger|revoquer)$/.exec(chemin);
  if (r && m === 'POST') {
    const a = await ctx.base.lire('acces_offerts', r[1]); if (!a) return erreur(404, 'acces-introuvable');
    if (r[2] === 'revoquer') {
      if (a.revoqueLe) return json({ ok: true });
      await ctx.base.maj('acces_offerts', r[1], { revoqueLe: ctx.maintenant, historique: [...(a.historique || []), { t: ctx.maintenant, action: 'revocation' }] });
      await majDroits(ctx, a.uid); await journal(ctx, 'acces-revoque', { acces: r[1], uid: a.uid });
      return json({ ok: true });
    }
    const b = await corpsJson(req, 500);
    const fin = b.permanent === true ? null : Number(b.fin);
    if (fin !== null && !(fin > ctx.maintenant)) return erreur(400, 'fin-invalide');
    await ctx.base.maj('acces_offerts', r[1], { fin, revoqueLe: null, historique: [...(a.historique || []), { t: ctx.maintenant, action: fin === null ? 'permanent' : 'prolongation', fin }] });
    await majDroits(ctx, a.uid); await journal(ctx, 'acces-prolonge', { acces: r[1], uid: a.uid, fin });
    return json({ ok: true });
  }

  // contenus et bandeau
  if (chemin === '/api/admin/catalogue' && m === 'GET') return json({ catalogue: catalogueEffectif((await ctx.base.lire('catalogue', 'etat')) || {}), bandeau: ((await ctx.base.lire('catalogue', 'bandeau')) || {}).texte || null });
  if (chemin === '/api/admin/catalogue' && m === 'POST') {
    const b = await corpsJson(req, 5000), cat = catalogueEffectif({});
    if (!cat[b.groupe] || !(b.id in cat[b.groupe]) || !ETATS.includes(b.niveau)) return erreur(400, 'contenu-invalide');
    const etat = (await ctx.base.lire('catalogue', 'etat')) || {};
    etat[b.groupe] = { ...(etat[b.groupe] || {}), [b.id]: b.niveau };
    await ctx.base.ecrire('catalogue', 'etat', etat); await journal(ctx, 'catalogue', { groupe: b.groupe, id: b.id, niveau: b.niveau });
    return json({ ok: true });
  }
  if (chemin === '/api/admin/bandeau' && m === 'POST') {
    const b = await corpsJson(req, 2000), texte = b.texte ? String(b.texte).slice(0, 200) : null;
    await ctx.base.ecrire('catalogue', 'bandeau', { texte, majLe: ctx.maintenant }); await journal(ctx, 'bandeau', { texte });
    return json({ ok: true });
  }
  if (chemin === '/api/admin/premium' && m === 'GET') {                  // ce qui est réellement présent dans le stockage privé
    if (!ctx.stockage.lister) return json({ disponible: false, fichiers: [] });
    const cat = catalogueEffectif((await ctx.base.lire('catalogue', 'etat')) || {});
    const fichiers = (await ctx.stockage.lister()).map(f => ({ ...f, niveau: niveauDuFichier(f.cle, cat) }));
    return json({ disponible: true, fichiers });
  }
  if (chemin === '/api/admin/journal' && m === 'GET') {
    const pg = await ctx.base.lister('admin_logs', { limite: 50, apres });
    return json({ journal: pg.docs.map(x => ({ id: x.id, ...x.data })), suite: pg.suite });
  }
  return erreur(404, 'inconnu');
}

// ======================================================================
// Webhooks Stripe : seule source de vérité des abonnements payants.
async function webhookStripe(req, ctx) {
  const corps = await req.text();
  if (!(await verifierSignatureStripe(corps, req.headers.get('Stripe-Signature'), ctx.env.STRIPE_SECRET_WEBHOOK, ctx.maintenant))) return erreur(400, 'signature');
  const ev = JSON.parse(corps);
  if (ev.livemode === true && ctx.env.STRIPE_MODE_REEL !== 'autorise') return erreur(400, 'mode-reel-refuse');
  if (!(await ctx.base.creerSiAbsent('stripe_evenements', ev.id, { t: ctx.maintenant, type: ev.type }))) return json({ ok: true, doublon: true });   // chaque événement traité une seule fois
  const o = ev.data && ev.data.object || {};
  const formuleDuPrix = prix => Object.entries(FORMULE_PRIX).find(([, cle]) => ctx.env[cle] === prix)?.[0] || null;
  let uid = (o.metadata && o.metadata.uid) || o.client_reference_id || null;
  if (!uid && o.customer) { const c = await ctx.base.lire('stripe_clients', o.customer); uid = c && c.uid; }
  if (!uid) { await journal(ctx, 'stripe-sans-compte', { evenement: ev.id, type: ev.type }); return json({ ok: true }); }
  // Compte supprimé entre-temps (événement tardif, par exemple la fin d'une période résiliée) : on n'écrit plus rien, pour ne pas recréer de données personnelles.
  if (!(await ctx.base.lire('familles', uid))) { await journal(ctx, 'stripe-compte-supprime', { evenement: ev.id, type: ev.type }); return json({ ok: true, ignore: true }); }
  if (o.customer) await ctx.base.ecrire('stripe_clients', o.customer, { uid });

  if (ev.type === 'customer.subscription.created' || ev.type === 'customer.subscription.updated' || ev.type === 'customer.subscription.deleted') {
    const prix = o.items && o.items.data && o.items.data[0] && o.items.data[0].price && o.items.data[0].price.id;
    const statut = ev.type === 'customer.subscription.deleted' ? 'canceled' : o.status;
    // Fin de période : au niveau de l'abonnement (anciennes versions d'API), sinon dans le premier article (versions récentes, comme le compte Stripe actuel).
    const finSecondes = o.current_period_end || (o.items && o.items.data && o.items.data[0] && o.items.data[0].current_period_end) || 0;
    await ctx.base.ecrire('abonnements', uid, { statut, formule: formuleDuPrix(prix), finPeriode: finSecondes * 1000, stripeClient: o.customer, stripeAbonnement: o.id, annulationFinPeriode: !!o.cancel_at_period_end, majLe: ctx.maintenant });
    // garde-fou : un abonnement payé alors qu'un accès offert est actif → signalé au Créateur (aucun remboursement automatique)
    if (statut === 'active' && (await ctx.base.chercher('acces_offerts', 'uid', uid)).some(a => accesOffertActif(a.data, ctx.maintenant)))
      await journal(ctx, 'alerte-double-acces', { uid, abonnement: o.id });
    await majDroits(ctx, uid);
  } else if (ev.type === 'checkout.session.completed') {
    await journal(ctx, 'paiement-confirme', { uid, session: o.id });
  } else if (ev.type === 'invoice.payment_failed') {
    await journal(ctx, 'paiement-echoue', { uid, facture: o.id });
  }
  return json({ ok: true });
}
