// LES MYSTÈRES DU DÉSERT — logique pure (sans 3D ni DOM) : niveaux, âges, énigmes, étoiles, déblocages, sauvegarde. Testée seule (outils/tests/mysteres.test.mjs).
// Règles : aucun chronomètre, aucune sanction : les étoiles ne dépendent que du nombre d'AIDES demandées ; une erreur donne une explication douce et on peut réessayer.
import { ORDRE_CHAPITRES, CHAPITRES } from './contenu.js?v=1';
export const CLE = 'aventure_mysteres';
export const NIVEAUX = ['facile', 'moyen', 'avance'];
export const NOMS_NIVEAUX = { facile: 'Découverte', moyen: 'Explorateur', avance: 'Maître' };
export function groupeAge(age) { if (['petits', 'moyens', 'grands'].includes(age)) return age; const n = Number(age); if (!Number.isFinite(n)) return null; return n <= 5 ? 'petits' : n <= 8 ? 'moyens' : 'grands'; }
export const niveauParDefaut = age => ({ petits: 'facile', moyens: 'moyen', grands: 'avance' }[groupeAge(age)] || 'moyen');

// Paramètres d'un chapitre selon le niveau et l'âge
export function parametres(niveau, age) {
  const n = Math.max(0, NIVEAUX.indexOf(niveau)), g = groupeAge(age) || 'moyens';
  return { niveau: NIVEAUX[n] || 'moyen', indices: [3, 4, 4][n], options: [3, 3, 4][n], etapes: [3, 3, 4][n], paires: [3, 3, 4][n], memoire: [3, 4, 5][n], rayon: g === 'petits' ? 1.7 : g === 'moyens' ? 1.3 : 1.0, aideAutoMs: g === 'petits' ? 15000 : g === 'moyens' ? 35000 : null };
}
export const etoilesPour = aides => (aides <= 0 ? 3 : aides <= 2 ? 2 : 1);
export const mel = (a, rng) => { const p = [...a]; for (let i = p.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; } return p; };

// ---- construction des énigmes (données de jeu, déterministes avec rng) ----
export function construireEnigme(chapitre, niveau, rng = Math.random) {
  const e = CHAPITRES[chapitre].enigme, p = parametres(niveau);
  if (e.type === 'choisir') { const opt = mel([e.bonne, ...mel(e.autres, rng).slice(0, p.options - 1)], rng); return { type: 'choisir', options: opt, bonne: e.bonne }; }
  if (e.type === 'ordre') { const ordre = e.ordre.slice(0, p.etapes); let m; do { m = mel(ordre, rng); } while (m.every((x, i) => x === ordre[i]) && ordre.length > 1); return { type: 'ordre', ordre, affichage: m }; }
  if (e.type === 'paires') { const paires = e.paires.slice(0, p.paires); return { type: 'paires', paires, objets: mel(paires, rng), ombres: mel(paires, rng) }; }
  if (e.type === 'memoire') { const n = p.memoire, pool = e.symboles.slice(0, n <= 3 ? 3 : n === 4 ? 4 : 5); const suite = []; for (let i = 0; i < n; i++) suite.push(pool[Math.floor(rng() * pool.length)]); return { type: 'memoire', suite, symboles: pool }; }
  if (e.type === 'code') { const ordre = niveau === 'avance' ? ['oiseau', ...e.ordre] : e.ordre; return { type: 'code', ordre, options: mel(e.options, rng) }; }
  throw new Error('type inconnu');
}
// Vérifie une réponse. choisir : id ; ordre/code/memoire : tableau. Renvoie { ok, bons } (bons = nombre de places correctes, pour une aide douce)
export function verifier(enigme, reponse) {
  if (enigme.type === 'choisir') return { ok: reponse === enigme.bonne, bons: reponse === enigme.bonne ? 1 : 0 };
  const cible = enigme.type === 'memoire' ? enigme.suite : enigme.ordre; if (!Array.isArray(reponse)) return { ok: false, bons: 0 };
  const bons = cible.filter((x, i) => reponse[i] === x).length; return { ok: reponse.length === cible.length && bons === cible.length, bons };
}
export const paireJuste = (enigme, objet, ombre) => enigme.type === 'paires' && objet === ombre && enigme.paires.includes(objet);

// ---- sauvegarde ----
export function etatInitial() { return { v: 1, age: null, niveau: null, sousTitres: true, etoiles: {}, tresors: [], diplomes: [], dernier: null }; }
export function lire(brut) {
  const d = etatInitial(); if (!brut || typeof brut !== 'object') return d;
  if (groupeAge(brut.age)) d.age = groupeAge(brut.age); if (NIVEAUX.includes(brut.niveau)) d.niveau = brut.niveau; if (typeof brut.sousTitres === 'boolean') d.sousTitres = brut.sousTitres;
  if (brut.etoiles && typeof brut.etoiles === 'object') for (const c of ORDRE_CHAPITRES) { const a = brut.etoiles[c]; if (Array.isArray(a)) d.etoiles[c] = NIVEAUX.map((_, i) => Math.max(0, Math.min(3, Number(a[i]) || 0))); }
  if (Array.isArray(brut.tresors)) d.tresors = [...new Set(brut.tresors.filter(x => ORDRE_CHAPITRES.includes(x)))];
  if (Array.isArray(brut.diplomes)) d.diplomes = [...new Set(brut.diplomes.filter(x => ['explorateur', 'maitre'].includes(x)))];
  if (brut.dernier && ORDRE_CHAPITRES.includes(brut.dernier.chapitre)) d.dernier = { chapitre: brut.dernier.chapitre, niveau: NIVEAUX.includes(brut.dernier.niveau) ? brut.dernier.niveau : 'moyen' };
  return d;
}
export const etoilesChapitre = (s, c) => (s.etoiles[c] || []).reduce((a, b) => a + b, 0);
export const etoilesTotal = s => ORDRE_CHAPITRES.reduce((a, c) => a + etoilesChapitre(s, c), 0);
export const lanternes = s => ORDRE_CHAPITRES.reduce((a, c) => a + (s.etoiles[c] || []).filter(x => x > 0).length, 0);
export const MAX_ETOILES = ORDRE_CHAPITRES.length * NIVEAUX.length * 3;
export const fait = (s, c) => (s.etoiles[c] || []).some(x => x > 0);
// L'histoire avance chapitre par chapitre ; un chapitre s'ouvre quand le précédent est réussi (à n'importe quel niveau). Jamais de verrou de temps ni d'argent.
export const chapitreOuvert = (s, c) => { const i = ORDRE_CHAPITRES.indexOf(c); return i === 0 || fait(s, ORDRE_CHAPITRES[i - 1]); };
export const prochainChapitre = s => ORDRE_CHAPITRES.find(c => !fait(s, c)) || null;
export function terminerChapitre(s, { chapitre, niveau, aides }) {
  const nouveau = { etoiles: 0, lanterne: false, tresor: false, diplomes: [] };
  const a = s.etoiles[chapitre] || (s.etoiles[chapitre] = [0, 0, 0]), i = NIVEAUX.indexOf(niveau), e = etoilesPour(aides);
  if (!a[i]) nouveau.lanterne = true; if (e > a[i]) { nouveau.etoiles = e - a[i]; a[i] = e; }
  if (!s.tresors.includes(chapitre)) { s.tresors.push(chapitre); nouveau.tresor = true; }
  if (ORDRE_CHAPITRES.every(c => fait(s, c)) && !s.diplomes.includes('explorateur')) { s.diplomes.push('explorateur'); nouveau.diplomes.push('explorateur'); }
  if (ORDRE_CHAPITRES.every(c => (s.etoiles[c] || [])[2] > 0) && !s.diplomes.includes('maitre')) { s.diplomes.push('maitre'); nouveau.diplomes.push('maitre'); }
  s.dernier = { chapitre, niveau }; return nouveau;
}
