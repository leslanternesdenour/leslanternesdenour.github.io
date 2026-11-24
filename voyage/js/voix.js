// Les voix enregistrées du Grand Voyage.
// Le jeu continue de passer du texte : on cherche si ce texte a une voix enregistrée
// (table générée depuis le catalogue des voix, identifiants NOUR-VOIX-…).
// Les fichiers sont listés dans /audio/voix.json : { "NOUR-VOIX-DEC-001": ["fr/decouvertes/nour-voix-dec-001.mp3", 0, 9.4] }.
// S'il n'y a pas de fichier, on répond « non » et le jeu garde la voix du téléphone, comme avant.
// La lecture passe par le lecteur commun du village : une seule voix à la fois, la musique s'efface pendant qu'elle parle.
import { chargerVoix, dire, existe, arreterVoix, ajouterVoix } from '../../monde/socle/voix.js?v=3';
import { PHRASES, SUITE, NOMBRES, LANTERNE } from './voix-textes.js?v=4';
import { PHRASES_LOUMI } from './voix-loumi.js?v=1';

// même façon d'écrire pour le texte du jeu et celui du catalogue
export function normaliser(t) {
  return String(t || '').replace(/<[^>]+>/g, ' ').normalize('NFC').replace(/[’ʼ]/g, "'")
    .replace(/^[^\p{L}\p{N}«]+/u, '').replace(/^(Sens du verset|Le sens de ce verset)\s*:\s*/, '')
    .replace(/\s+/g, ' ').replace(/[\s!?.…:]+$/u, '').trim();
}

const exacts = new Map(), debuts = [], contient = [];
function indexer(liste) {
  for (const [id, texte, mode] of liste) {
    const n = normaliser(texte);
    if (mode === 'debut') debuts.push([n, id]); else if (mode === 'contient') contient.push([n, id]); else if (!exacts.has(n)) exacts.set(n, id);
  }
}
indexer(PHRASES);
indexer(PHRASES_LOUMI);
// Phrases et voix d'une zone Premium, reçues du serveur après vérification des droits (voir premium.js)
export function ajouterPhrases(liste, voix) {
  if (Array.isArray(liste)) indexer(liste.filter(x => Array.isArray(x) && typeof x[0] === 'string' && typeof x[1] === 'string'));
  if (voix) ajouterVoix(voix);
}
// les phrases à trou : un clip fixe + un clip de nombre
const MOTIFS = [
  [/^Lanterne trouvée : (\d+) sur 12$/, m => [LANTERNE[0], NOMBRES[+m[1] - 1], LANTERNE[1]]]
];

let pret = false;
export async function chargerVoixVoyage() { pret = await chargerVoix('../audio/'); return pret; }

// identifiants qui correspondent à ce texte (une liste : une phrase à trou en donne plusieurs)
export function idsPour(texte, prof = 0) {
  const n = normaliser(texte);
  if (!n) return [];
  if (exacts.has(n)) return [exacts.get(n)];
  for (const [re, f] of MOTIFS) { const m = n.match(re); if (m) return f(m); }
  for (const [d, id] of debuts) if (n.startsWith(d)) return [id];
  for (const [c, id] of contient) if (n.includes(c)) return [id];
  // une phrase faite de deux phrases enregistrées (« Mâ châ'a Allâh ! » + l'explication…)
  if (prof < 2) {
    const re = /[!?.…)]\s+/g; let m;
    while ((m = re.exec(n))) {
      const i = m.index + m[0].length, g = idsPour(n.slice(0, i), prof + 1);
      if (!g.length) continue;
      const d = idsPour(n.slice(i), prof + 1);
      if (d.length) return [...g, ...d];
    }
  }
  return [];
}
const enregistres = ids => ids.length > 0 && ids.every(id => id && existe(id));
// ce texte a-t-il une voix enregistrée ? (pour n'afficher « Écouter » que s'il y a quelque chose à écouter)
export function aUneVoix(texte) { return !!pret && enregistres(idsPour(texte)); }

// Joue une suite d'identifiants, l'un après l'autre. Une nouvelle voix coupe la précédente.
let jeton = 0, actif = false, attente = null;
export function direIds(ids, fini) {
  if (!pret || !enregistres(ids)) return false;
  try { speechSynthesis.cancel(); } catch (e) {}
  const moi = ++jeton; let i = 0;
  actif = true;
  const suivant = ok => { if (moi !== jeton) return; if (ok === false || i >= ids.length) { actif = false; fini && fini(); if (attente) { const a = attente; attente = null; direTextes(a); } return; } dire(ids[i++], suivant); };
  suivant(true);
  return true;
}

// un message court (indice) ne coupe jamais une voix en cours : il attend la fin de celle-ci (le dernier message en attente remplace les autres)
export function direApres(segments) {
  if (actif) { attente = segments; return true; }
  return direTextes(segments);
}

// segments : [{ t: texte, opt: true si on peut le sauter }] → true si la voix enregistrée a été lancée
export function direTextes(segments, fini) {
  if (!pret) return false;
  const ids = [];
  for (const s of segments) {
    if (!s || !s.t) continue;
    const trouve = idsPour(s.t);
    if (enregistres(trouve)) ids.push(...trouve);
    else if (!s.opt) return false;
  }
  return ids.length ? direIds(ids, fini) : false;
}

// un mot arabe : le mot, puis son explication en français si elle est enregistrée
export function direMotArabe(mot) {
  const ids = idsPour(mot);
  if (!enregistres(ids)) return false;
  const s = SUITE[ids[0]];
  return direIds(s && existe(s) ? [ids[0], s] : ids);
}

export function arreterVoixVoyage() { jeton++; actif = false; attente = null; arreterVoix(); }
