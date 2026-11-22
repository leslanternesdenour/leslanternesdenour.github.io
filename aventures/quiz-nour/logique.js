// LES QUIZ ET DÉFIS DE NOUR — logique pure : parties, âges, étoiles (jamais de zéro, jamais de sanction), progression, sauvegarde. Testée seule (outils/tests/quiz.test.mjs).
// Règles : réponses mélangées à chaque partie ; une erreur donne une explication douce et on réessaie ; les étoiles reflètent les réponses trouvées du premier coup
// (sans indice) mais une partie terminée donne TOUJOURS au moins une étoile ; aucun chronomètre, aucun classement, aucune perte de progression.
import { CATEGORIES, ORDRE_CATEGORIES, NIVEAUX, id as idQuestion } from './contenu.js?v=1';
export const CLE = 'aventure_quiz';
export { NIVEAUX };
export const NOMS_NIVEAUX = { facile: 'Facile', moyen: 'Intermédiaire', avance: 'Avancé' };
export function groupeAge(age) { if (['petits', 'moyens', 'grands'].includes(age)) return age; const n = Number(age); if (!Number.isFinite(n)) return null; return n <= 5 ? 'petits' : n <= 8 ? 'moyens' : 'grands'; }
export const niveauParDefaut = age => ({ petits: 'facile', moyens: 'moyen', grands: 'avance' }[groupeAge(age)] || 'moyen');
export const aideAutoMs = age => (groupeAge(age) === 'petits' ? 20000 : null);       // les plus petits : un coup de pouce doux (retire une mauvaise réponse) après un long silence

const melanger = (a, rng) => { const p = [...a]; for (let i = p.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; } return p; };
const separer = s => { const k = s.indexOf('|'); return { emoji: s.slice(0, k), texte: s.slice(k + 1) }; };
// Une partie = les 4 questions du thème et du niveau, dans un ordre mélangé, réponses mélangées. bonne = index de la bonne réponse dans choix.
export function construirePartie(cat, niveau, rng = Math.random) {
  const qs = CATEGORIES[cat].questions[niveau];
  return melanger(qs.map((q, i) => ({ id: idQuestion(cat, niveau, i), q: q.q, exp: q.exp, religieux: !!(q.religieux || CATEGORIES[cat].religieux), choix: q.choix.map((c, k) => ({ ...separer(c), bonne: k === 0 })) })), rng)
    .map(q => { const choix = melanger(q.choix, rng); return { ...q, choix, bonne: choix.findIndex(c => c.bonne) }; });
}
export const etoilesPour = (premierCoup, total) => (premierCoup >= total ? 3 : premierCoup * 2 >= total ? 2 : 1);

export function etatInitial() { return { v: 1, age: null, niveau: null, sousTitres: true, etoiles: {}, reussies: [], diplomes: [], dernier: null }; }
export function lire(brut) {
  const d = etatInitial(); if (!brut || typeof brut !== 'object') return d;
  if (groupeAge(brut.age)) d.age = groupeAge(brut.age); if (NIVEAUX.includes(brut.niveau)) d.niveau = brut.niveau; if (typeof brut.sousTitres === 'boolean') d.sousTitres = brut.sousTitres;
  if (brut.etoiles && typeof brut.etoiles === 'object') for (const c of ORDRE_CATEGORIES) { const a = brut.etoiles[c]; if (Array.isArray(a)) d.etoiles[c] = NIVEAUX.map((_, i) => Math.max(0, Math.min(3, Number(a[i]) || 0))); }
  if (Array.isArray(brut.reussies)) d.reussies = [...new Set(brut.reussies.filter(x => typeof x === 'string'))];
  if (Array.isArray(brut.diplomes)) d.diplomes = [...new Set(brut.diplomes.filter(x => ['savant', 'maitre'].includes(x)))];
  if (brut.dernier && ORDRE_CATEGORIES.includes(brut.dernier.categorie)) d.dernier = { categorie: brut.dernier.categorie, niveau: NIVEAUX.includes(brut.dernier.niveau) ? brut.dernier.niveau : 'moyen' };
  return d;
}
export const etoilesCategorie = (s, c) => (s.etoiles[c] || []).reduce((a, b) => a + b, 0);
export const etoilesTotal = s => ORDRE_CATEGORIES.reduce((a, c) => a + etoilesCategorie(s, c), 0);
export const lanternes = s => ORDRE_CATEGORIES.reduce((a, c) => a + (s.etoiles[c] || []).filter(x => x > 0).length, 0);
export const MAX_ETOILES = ORDRE_CATEGORIES.length * NIVEAUX.length * 3;
export const fait = (s, c) => (s.etoiles[c] || []).some(x => x > 0);
// Fin de partie : premierCoup = identifiants des questions trouvées du premier coup, sans indice ; toutes les questions sont retenues comme « vues »
export function terminerPartie(s, { categorie, niveau, premierCoup, total }) {
  const nouveau = { etoiles: 0, lanterne: false, diplomes: [], e: 0 };
  const a = s.etoiles[categorie] || (s.etoiles[categorie] = [0, 0, 0]), i = NIVEAUX.indexOf(niveau), e = etoilesPour(premierCoup.length, total); nouveau.e = e;
  if (!a[i]) nouveau.lanterne = true; if (e > a[i]) { nouveau.etoiles = e - a[i]; a[i] = e; }
  for (const q of premierCoup) if (!s.reussies.includes(q)) s.reussies.push(q);
  if (ORDRE_CATEGORIES.every(c => fait(s, c)) && !s.diplomes.includes('savant')) { s.diplomes.push('savant'); nouveau.diplomes.push('savant'); }
  if (ORDRE_CATEGORIES.every(c => (s.etoiles[c] || [])[2] > 0) && !s.diplomes.includes('maitre')) { s.diplomes.push('maitre'); nouveau.diplomes.push('maitre'); }
  s.dernier = { categorie, niveau }; return nouveau;
}
export const prochaineCategorie = s => ORDRE_CATEGORIES.find(c => !fait(s, c)) || null;
