// Garde-fou d'envoi : ce qui quitte l'ordinateur vers OpenAI ou Google passe par ici.
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';

export const MASQUE = '[SECRET MASQUÉ]';
// Formats de clés connus. La limite « pas précédé d'une lettre ou d'un chiffre » évite de couper des mots ordinaires.
const MOTIFS = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----(?:[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----|[\s\S]*)/,
  /sk-[A-Za-z0-9_-]{20,}/, // OpenAI, Anthropic
  /AIza[A-Za-z0-9_-]{30,}/, // Google (clé standard)
  /AQ\.[A-Za-z0-9_-]{30,}/, // Google (clé d'autorisation)
  /(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{16,}/, // Stripe
  /whsec_[A-Za-z0-9]{16,}/, // Stripe (webhook)
  /sk_[a-f0-9]{40,}/, // ElevenLabs
  /re_[A-Za-z0-9]{8}_[A-Za-z0-9]{16,}/, // Resend
  /gh[pousr]_[A-Za-z0-9]{30,}/, // GitHub
  /github_pat_[A-Za-z0-9_]{30,}/,
];
const SECRETS = new RegExp(`(?<![A-Za-z0-9])(?:${MOTIFS.map(m => m.source).join('|')})`, 'g');

// Fichiers qui ne partent jamais, quel que soit leur contenu (chemin relatif au projet).
const INTERDITS = [
  [/(^|\/)\.env[^/]*$/i, 'fichier de variables d\'environnement'],
  [/(^|\/)\.dev\.vars[^/]*$/i, 'secrets Cloudflare locaux'],
  [/(^|\/)cles\//i, 'dossier de clés'],
  [/service-account[^/]*\.json$/i, 'clé de compte de service'],
  [/(^|\/)\.git(\/|$)/, 'dossier interne de git'],
  [/\.(pem|key|p12|pfx|dpapi)$/i, 'fichier de clé ou de certificat'],
  [/(^|\/)\.claude\/tdd-guard\//, 'journal local de session (chemins et contenus privés)'],
];

export function raisonFichierInterdit(chemin) {
  const normal = chemin.replaceAll('\\', '/');
  const trouve = INTERDITS.find(([motif]) => motif.test(normal));
  return trouve ? trouve[1] : null;
}

export class Refus extends Error {}

export function cheminDansProjet(racine, chemin) {
  const absolu = path.resolve(racine, chemin);
  // realpath : un raccourci placé dans le projet ne doit pas faire sortir un fichier extérieur.
  const reel = fs.existsSync(absolu) ? fs.realpathSync(absolu) : absolu;
  const relatif = path.relative(fs.realpathSync(racine), reel);
  if (!relatif || relatif.startsWith('..') || path.isAbsolute(relatif)) throw new Refus(`${chemin} : hors du projet`);
  return { absolu: reel, relatif: relatif.replaceAll('\\', '/') };
}

export function verifierPresence(racine, chemin) {
  const { absolu, relatif } = cheminDansProjet(racine, chemin);
  if (!fs.existsSync(absolu)) throw new Refus(`${chemin} : fichier introuvable`);
  return relatif;
}

export function lireFichierPartageable(racine, chemin, { estIgnore = () => false, valeursConnues = [] } = {}) {
  const { absolu, relatif } = cheminDansProjet(racine, chemin);
  const refuser = raison => { throw new Refus(`${chemin} : ${raison}`); };
  const raison = raisonFichierInterdit(relatif) || (estIgnore(relatif) && 'fichier ignoré par git');
  if (raison) refuser(raison);
  if (!fs.existsSync(absolu) || !fs.statSync(absolu).isFile()) refuser('fichier introuvable');
  const octets = fs.readFileSync(absolu);
  if (octets.includes(0)) refuser('fichier binaire (pour une image, utiliser --image)');
  const { texte, nombre } = masquerSecrets(octets.toString('utf8'), valeursConnues);
  return { chemin: relatif, contenu: texte, masques: nombre };
}

const SIGNATURES = [['image/png', '89504e47'], ['image/jpeg', 'ffd8ff'], ['image/webp', '52494646']];

// Une image est acceptée si elle vient du projet ou du dossier temporaire (captures d'écran), et si son contenu est bien une image.
export function verifierImagePartageable(racine, chemin, { estIgnore, octetsMax }) {
  const absolu = path.resolve(racine, chemin), refuser = raison => { throw new Refus(`${chemin} : ${raison}`); };
  let relatif = null;
  try { relatif = cheminDansProjet(racine, chemin).relatif; }
  catch (e) { if (path.relative(os.tmpdir(), absolu).startsWith('..') || path.isAbsolute(path.relative(os.tmpdir(), absolu))) throw e; }
  const raison = relatif && (raisonFichierInterdit(relatif) || (estIgnore(relatif) && 'fichier ignoré par git'));
  if (raison) refuser(raison);
  if (!fs.existsSync(absolu)) refuser('fichier introuvable');
  if (fs.statSync(absolu).size > octetsMax) refuser(`image trop lourde (maximum ${octetsMax} octets)`);
  const octets = fs.readFileSync(absolu), debut = octets.subarray(0, 4).toString('hex');
  const mime = SIGNATURES.find(([, s]) => debut.startsWith(s))?.[0];
  if (!mime) refuser('ce n\'est pas une image PNG, JPEG ou WebP');
  return { mime, base64: octets.toString('base64'), chemin: relatif || path.basename(absolu) };
}

export function masquerSecrets(texte, valeursConnues = []) {
  let nombre = 0;
  const masque = () => { nombre++; return MASQUE; };
  const sansConnues = valeursConnues.filter(Boolean).reduce((t, v) => t.replaceAll(v, masque), texte);
  return { texte: sansConnues.replace(SECRETS, masque), nombre };
}
