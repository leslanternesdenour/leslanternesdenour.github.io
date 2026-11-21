// OBSOLÈTE (bloc 2) : ancien client qui écrivait directement dans Firestore. Remplacé par client.js (tout passe par le serveur).
// Plus importé nulle part et exclu du site publié ; conservé en attendant ta validation pour le supprimer.
// Comptes familiaux : connexion Firebase et synchronisation de la progression.
// La progression des jeux reste dans le navigateur (localStorage), exactement comme avant :
// ce module en garde une copie dans le compte du parent et la redonne sur un autre appareil.
// Aucun jeu n'a été modifié pour cela.
import { FIREBASE } from './config.js?v=1';

const SDK = 'https://www.gstatic.com/firebasejs/10.12.2/';
export const actif = !!(FIREBASE && FIREBASE.apiKey);

// Mêmes clés que la page /transfert/
const CLES = /^(monde|priere|ablutions|lanternes)/;
const META = 'ldn_sync';

let promesse = null;
export function charger() {
  if (!actif) return Promise.resolve(null);
  if (!promesse) promesse = (async () => {
    const [a, au, fs] = await Promise.all([
      import(SDK + 'firebase-app.js'), import(SDK + 'firebase-auth.js'), import(SDK + 'firebase-firestore.js')
    ]);
    const app = a.initializeApp(FIREBASE);
    const auth = au.getAuth(app);
    auth.languageCode = 'fr';
    await au.setPersistence(auth, au.browserLocalPersistence); // session qui reste ouverte
    return { au, fs, auth, db: fs.getFirestore(app) };
  })();
  return promesse;
}

export function utilisateur(c) {
  return new Promise(ok => { const stop = c.au.onAuthStateChanged(c.auth, u => { stop(); ok(u); }); });
}

export function instantane() {
  const o = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (CLES.test(k)) o[k] = localStorage.getItem(k);
  }
  return o;
}

const trie = o => JSON.stringify(Object.keys(o).sort().map(k => [k, o[k]]));

function base(uid) {
  try { const m = JSON.parse(localStorage.getItem(META) || '{}'); return m.uid === uid ? (m.v || {}) : null; }
  catch (e) { return null; }
}
function noterBase(uid, v) { localStorage.setItem(META, JSON.stringify({ uid, v, t: Date.now() })); }

async function lireNuage(c, uid) {
  const s = await c.fs.getDoc(c.fs.doc(c.db, 'familles', uid));
  return s.exists() ? (s.data().progression || {}) : {};
}
async function ecrireNuage(c, uid, progression) {
  await c.fs.setDoc(c.fs.doc(c.db, 'familles', uid), { progression, maj: c.fs.serverTimestamp() });
}

// Fusion à trois : « base » est le dernier état synchronisé sur cet appareil.
// Rien n'est jamais effacé : une progression présente d'un seul côté est gardée.
export function fusionner(local, nuage, b) {
  const res = {}, conflits = [];
  for (const k of new Set([...Object.keys(local), ...Object.keys(nuage)])) {
    const l = local[k], n = nuage[k], o = b ? b[k] : undefined;
    if (l === n) { if (l !== undefined) res[k] = l; continue; }
    if (n === undefined) { res[k] = l; continue; }
    if (l === undefined) { res[k] = n; continue; }
    if (b && l === o) { res[k] = n; continue; }   // seul le compte a avancé
    if (b && n === o) { res[k] = l; continue; }   // seul cet appareil a avancé
    conflits.push(k);                             // les deux ont changé : on demande au parent
  }
  return { res, conflits };
}

// mode : 'complet' (applique aussi les nouveautés du compte sur l'appareil)
//        'envoi'   (n'envoie que les progrès de cet appareil, ne touche à rien sur place)
// choix : en cas de conflit, 'appareil' ou 'compte' (décidé par le parent)
export async function synchroniser(c, uid, { mode = 'complet', choix } = {}) {
  const local = instantane(), nuage = await lireNuage(c, uid);
  const { res, conflits } = fusionner(local, nuage, base(uid));
  if (conflits.length && !choix) return { conflits, change: false };
  for (const k of conflits) res[k] = choix === 'compte' ? nuage[k] : local[k];
  const aChanger = Object.keys(res).filter(k => localStorage.getItem(k) !== res[k]);
  if (mode === 'envoi' && aChanger.length) return { conflits: [], change: false, attente: true };
  aChanger.forEach(k => localStorage.setItem(k, res[k]));
  if (trie(res) !== trie(nuage)) await ecrireNuage(c, uid, res);
  noterBase(uid, res);
  return { conflits: [], change: aChanger.length > 0 };
}

export async function supprimerDonnees(c, uid) {
  await c.fs.deleteDoc(c.fs.doc(c.db, 'familles', uid));
  localStorage.removeItem(META);
}

export function messageErreur(e) {
  const code = (e && e.code) || '';
  return ({
    'auth/invalid-email': "Cette adresse e-mail n'est pas valide.",
    'auth/email-already-in-use': 'Un compte existe déjà avec cette adresse. Essayez de vous connecter.',
    'auth/weak-password': 'Le mot de passe doit contenir au moins 8 caractères.',
    'auth/invalid-credential': 'Adresse e-mail ou mot de passe incorrect.',
    'auth/wrong-password': 'Adresse e-mail ou mot de passe incorrect.',
    'auth/user-not-found': 'Adresse e-mail ou mot de passe incorrect.',
    'auth/too-many-requests': 'Trop de tentatives. Patientez quelques minutes puis réessayez.',
    'auth/network-request-failed': "Pas de connexion internet. Réessayez quand vous serez connecté.",
    'auth/requires-recent-login': 'Pour des raisons de sécurité, reconnectez-vous puis recommencez.'
  })[code] || "Une erreur est survenue. Réessayez dans un instant.";
}
