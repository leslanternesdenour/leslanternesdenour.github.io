// Bibliothèque côté navigateur de l'Espace famille (module ES), partagée par /compte/, /admin/, /tarifs/, le village et le Grand Voyage.
// Le navigateur ne décide jamais des droits : il demande au serveur (/api/moi) et affiche.
//  - un seul profil enfant actif est gardé sur l'appareil (clé « ldn_profil_actif ») ; les clés de jeu existantes
//    (ablutions, priere, lanternes2, monde, monde_voyage) contiennent SA progression ;
//  - synchronisation SUR ÉVÉNEMENT (changement d'enfant, retour au village, page masquée ou fermée, déconnexion),
//    jamais de minuteur ; uniquement si les droits le permettent (Famille, Créateur) ;
//  - toute réponse 401/403 du serveur et toute déconnexion purgent les caches privés du service worker.
import { FIREBASE, EMULATEUR } from './config.js?v=2';

export const CLES_JEU = ['ablutions', 'priere', 'lanternes2', 'monde', 'monde_voyage', 'maison_mots'];
const CLE_PROFIL = 'ldn_profil_actif', CLE_EMPREINTE = 'ldn_synchro_empreinte';
const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const lsSet = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} };

export const comptesActifs = () => !!(FIREBASE || EMULATEUR);
export const simulation = () => !!EMULATEUR;

const MESSAGES = {
  'auth/invalid-credential': 'Adresse ou mot de passe incorrect.', 'auth/wrong-password': 'Adresse ou mot de passe incorrect.', 'auth/user-not-found': 'Adresse ou mot de passe incorrect.',
  'auth/email-already-in-use': 'Un compte existe déjà avec cette adresse. Connectez-vous.', 'auth/weak-password': 'Mot de passe trop court (8 caractères minimum).',
  'auth/invalid-email': 'Adresse e-mail invalide.', 'auth/too-many-requests': 'Trop d\'essais. Réessayez dans quelques minutes.', 'auth/network-request-failed': 'Pas de connexion internet.',
  'trop-de-tentatives': 'Trop d\'essais. Réessayez plus tard.', 'consentement-requis': 'Merci de cocher les cases demandées.', 'reconnexion-requise': 'Pour votre sécurité, retapez votre mot de passe.',
  'email-non-verifie': 'Validez d\'abord votre adresse e-mail (lien reçu par e-mail).', 'expiree': 'Cette invitation a expiré. Demandez-en une nouvelle.', 'deja-utilisee': 'Cette invitation a déjà été utilisée.',
  'annulee': 'Cette invitation a été annulée.', 'inconnue': 'Invitation inconnue. Vérifiez le lien.', 'compte-createur': 'Le compte Créateur a déjà tous les accès.', 'autre-adresse': 'Cette invitation est prévue pour une autre adresse e-mail.',
  'abonnement-actif': 'Un abonnement payant est déjà actif sur ce compte : rien à faire de plus.', 'deja-premium': 'Votre compte a déjà cet accès.', 'deja-abonne': 'Un abonnement est déjà actif.',
  'acces-offert-actif': 'Votre compte a déjà un accès offert : inutile de payer.', 'limite-profils': 'Nombre maximum de profils atteint pour votre formule.', 'surnom-invalide': 'Prénom ou surnom : des lettres seulement, 20 au maximum.',
  'profil-gele': 'Ce profil est en pause avec la formule actuelle.', 'paiement-non-configure': 'Le paiement n\'est pas encore ouvert.', 'comptes-non-configures': 'Les comptes ne sont pas encore ouverts.',
  'reseau': 'Pas de connexion internet.', 'reserve-createur': 'Réservé au compte Créateur.', 'adresse-non-verifiee': 'Validez d\'abord votre adresse e-mail (lien reçu par e-mail).', 'non-disponible': 'Fonction indisponible pour le moment.'
};
export const messageErreur = e => MESSAGES[(e && (e.raison || e.code)) || ''] || MESSAGES[String(e && e.message || '').replace(/^Firebase: .*\((.*)\)\.?$/, '$1')] || 'Une erreur est survenue. Réessayez.';
export const NOMS_STATUT = { creator: 'Créateur', invite: 'Accès offert', abonne: 'Abonné', gratuit: 'Gratuit', visiteur: 'Visiteur' };
export const NOMS_NIVEAU = { gratuit: 'Gratuit', premium: 'Premium', famille: 'Famille', createur: 'Créateur' };

// ---------- appels au serveur ----------
export class ErreurApi extends Error { constructor(statut, raison) { super(raison || ('erreur ' + statut)); this.statut = statut; this.raison = raison; } }
export async function api(chemin, { methode = 'GET', corps, garder = false } = {}) {
  const r = await fetch(chemin, { method: methode, credentials: 'same-origin', keepalive: garder,
    headers: methode === 'GET' ? {} : { 'X-LDN': '1', 'Content-Type': 'application/json' }, body: corps === undefined ? undefined : JSON.stringify(corps) });
  let j = null; try { j = await r.json(); } catch (e) {}
  if (r.status === 401 || r.status === 403) purgerCaches();
  if (!r.ok) throw new ErreurApi(r.status, j && j.erreur);
  return j;
}

// ---------- caches du service worker ----------
export async function purgerCaches() {
  try { if (navigator.serviceWorker && navigator.serviceWorker.controller) navigator.serviceWorker.controller.postMessage({ type: 'purger' }); } catch (e) {}
  try { if (window.caches) for (const n of await caches.keys()) if (n.startsWith('lanternes-dyn-')) await caches.delete(n); } catch (e) {}
}

// ---------- authentification (Firebase en production ; émulateur LOCAL clairement identifié en préproduction locale) ----------
let fb = null;
async function firebase() {
  if (fb) return fb;
  const V = 'https://www.gstatic.com/firebasejs/10.12.2/';
  const [app, auth] = await Promise.all([import(V + 'firebase-app.js'), import(V + 'firebase-auth.js')]);
  const a = auth.getAuth(app.initializeApp(FIREBASE));
  fb = { a, m: auth };
  return fb;
}
const emul = (chemin, corps) => api('/api/_emulateur/' + chemin, { methode: 'POST', corps });
export const auth = {
  async inscrire(email, mdp) {
    if (EMULATEUR) return (await emul('inscription', { email, mdp })).idToken;
    const { a, m } = await firebase(); const c = await m.createUserWithEmailAndPassword(a, email, mdp);
    try { await m.sendEmailVerification(c.user); } catch (e) {}
    return c.user.getIdToken();
  },
  async connecter(email, mdp) {
    if (EMULATEUR) return (await emul('connexion', { email, mdp })).idToken;
    const { a, m } = await firebase(); const c = await m.signInWithEmailAndPassword(a, email, mdp); return c.user.getIdToken(true);
  },
  async reauthentifier(mdp) {                      // pour les actions sensibles (administration, suppression)
    if (EMULATEUR) return (await emul('reconnexion', { mdp })).idToken;
    const { a, m } = await firebase(); await a.authStateReady(); const u = a.currentUser; if (!u) throw new ErreurApi(401, 'reconnexion-requise');
    await m.reauthenticateWithCredential(u, m.EmailAuthProvider.credential(u.email, mdp)); return u.getIdToken(true);
  },
  async rafraichir() {                             // nouveau jeton (après validation de l'adresse e-mail)
    if (EMULATEUR) return (await emul('jeton', {})).idToken;
    const { a } = await firebase(); await a.authStateReady(); const u = a.currentUser; if (!u) throw new ErreurApi(401, 'reconnexion-requise');
    await u.reload(); return u.getIdToken(true);
  },
  async motDePasseOublie(email) { if (EMULATEUR) return; const { a, m } = await firebase(); await m.sendPasswordResetEmail(a, email); },
  async renvoyerVerification() { if (EMULATEUR) return; const { a, m } = await firebase(); await a.authStateReady(); if (a.currentUser) await m.sendEmailVerification(a.currentUser); },
  simulerClicVerification: () => emul('verifier', {}),   // SIMULATION LOCALE uniquement (bouton affiché seulement avec l'émulateur)
  async quitter() { if (EMULATEUR) return; try { const { a, m } = await firebase(); await m.signOut(a); } catch (e) {} }
};

export async function ouvrirSession(idToken, consentements) { return api('/api/session', { methode: 'POST', corps: { idToken, consentements } }); }
export async function moi() { try { return await api('/api/moi'); } catch (e) { return { connecte: false, statut: 'visiteur' }; } }

export async function deconnexion() {
  await synchroniser('deconnexion');
  try { await api('/api/session/fin', { methode: 'POST' }); } catch (e) {}
  await auth.quitter();
  lsSet(CLE_PROFIL, null); lsSet(CLE_EMPREINTE, null);
  await purgerCaches();
}

// ---------- profil enfant actif (un seul sur l'appareil) ----------
export function profilActif() { try { return JSON.parse(lsGet(CLE_PROFIL) || 'null'); } catch (e) { return null; } }

function progressionLocale() {
  const p = {};
  for (const k of CLES_JEU) { const v = lsGet(k); if (v == null) continue; try { p[k] = JSON.parse(v); } catch (e) {} }
  if (p.monde_voyage) { const v = { ...p.monde_voyage }; delete v.joueur; delete v.chameau; delete v.monte; delete v.heure; p.monde_voyage = v; }   // données volatiles : jamais synchronisées
  return p;
}
const empreinte = o => { const s = JSON.stringify(o); let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return s.length + ':' + h; };

// Envoie la progression du profil actif si elle a changé depuis le dernier envoi. Appelée sur événement uniquement.
export async function synchroniser(raison = 'evenement') {
  const p = profilActif(); if (!p || !p.synchro || p.gele) return { envoye: false, raison: 'non-applicable' };
  const prog = progressionLocale(), e = empreinte(prog);
  if (lsGet(CLE_EMPREINTE) === p.id + '|' + e) return { envoye: false, raison: 'inchange' };
  try {
    await api(`/api/enfants/${encodeURIComponent(p.id)}/progression`, { methode: 'PUT', corps: { progression: prog }, garder: raison === 'fermeture' });
    lsSet(CLE_EMPREINTE, p.id + '|' + e); return { envoye: true };
  } catch (err) { return { envoye: false, raison: err.raison || 'reseau' }; }
}

// Choisir l'enfant qui joue sur cet appareil. Avec synchronisation : on enregistre l'enfant précédent, puis on
// charge la progression du nouveau. Sans synchronisation (Gratuit, Premium) : un seul profil, progression sur l'appareil.
export async function choisirEnfant(id, droits) {
  const avant = profilActif();
  if (avant && avant.id !== id) await synchroniser('changement');
  await api(`/api/enfants/${encodeURIComponent(id)}/actif`, { methode: 'POST' });
  const e = await api(`/api/enfants/${encodeURIComponent(id)}`);
  const synchro = !!(droits && droits.synchro);
  const aDistant = synchro && e.progression && Object.keys(e.progression).length > 0;
  if (aDistant && !avant && Object.keys(progressionLocale()).length) lsSet('ldn_sauvegarde_appareil', JSON.stringify({ t: Date.now(), progression: progressionLocale() }));   // filet : rien n'est perdu
  if (synchro && (aDistant || (avant && avant.id !== id))) for (const k of CLES_JEU) {   // ne pas mélanger deux enfants
    if (k !== 'monde_voyage') { lsSet(k, null); continue; }
    let loc = {}; try { loc = JSON.parse(lsGet(k) || '{}') || {}; } catch (x) {}
    lsSet(k, loc.joueur || loc.chameau ? JSON.stringify({ joueur: loc.joueur, chameau: loc.chameau }) : null);   // position seulement (donnée d'appareil)
  }
  if (synchro && e.progression) for (const [k, v] of Object.entries(e.progression)) if (CLES_JEU.includes(k)) {
    if (k === 'monde_voyage') { let loc = {}; try { loc = JSON.parse(lsGet(k) || '{}'); } catch (x) {} lsSet(k, JSON.stringify({ ...v, joueur: loc.joueur, chameau: loc.chameau })); }
    else lsSet(k, JSON.stringify(v));
  }
  lsSet(CLE_PROFIL, JSON.stringify({ id, surnom: e.surnom, tranche: e.tranche, avatar: e.avatar, gele: !!e.gele, synchro }));
  lsSet(CLE_EMPREINTE, synchro ? id + '|' + empreinte(progressionLocale()) : null);
  return profilActif();
}

// Déclencheurs d'événements (aucun minuteur)
export function brancherSynchroEvenementielle() {
  if (!profilActif()) return;
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') synchroniser('masquee'); });
  addEventListener('pagehide', () => synchroniser('fermeture'));
  addEventListener('ldn:fin-activite', () => synchroniser('fin-activite'));   // émis par le village au retour d'un jeu
}
