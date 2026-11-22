// LA CHASSE AUX MOTS — logique pure (aucune 3D, aucun DOM) : niveaux, âges, choix des cibles, étoiles, déblocages, sauvegarde.
// Testée seule (outils/tests/chasse-mots.test.mjs). Règles du fondateur : aucune pression, aucune perte de progression, aucun chronomètre,
// aucune sanction d'erreur : les étoiles ne dépendent que du nombre d'AIDES demandées, jamais d'échecs.
export const CLE = 'aventure_mots';                // clé de sauvegarde du jeu (synchronisée par l'Espace famille avec le profil de l'enfant)
export const LIEUX_IDS = ['marche', 'maison', 'jardin', 'bibliotheque', 'oasis', 'village'];
export const NIVEAUX = [1, 2, 3, 4, 5];
export const MODES = { 1: 'image', 2: 'silhouette', 3: 'mot', 4: 'audio', 5: 'enigme' };
export const NOMS_NIVEAUX = { 1: 'Reconnaître les images', 2: 'Reconnaître les objets', 3: 'Associer image et mot', 4: 'Écouter la consigne', 5: 'Petites énigmes' };

// 'petits' = 3-5 ans, 'moyens' = 6-8 ans, 'grands' = 9-10 ans
export function groupeAge(age) {
  if (age === 'petits' || age === 'moyens' || age === 'grands') return age;
  const n = Number(age); if (!Number.isFinite(n)) return null;
  return n <= 5 ? 'petits' : n <= 8 ? 'moyens' : 'grands';
}
// Paramètres d'une manche : nombre d'objets à trouver, aide automatique (douce), zone de toucher, aide visuelle supplémentaire
export function parametres(niveau, age) {
  const g = groupeAge(age) || 'moyens', n = Math.max(1, Math.min(5, niveau | 0));
  const cibles = { petits: [2, 2, 3, 3, 3], moyens: [3, 3, 4, 4, 4], grands: [4, 4, 5, 5, 5] }[g][n - 1];
  return {
    niveau: n, mode: MODES[n], cibles, groupe: g,
    aideAutoMs: g === 'petits' ? 12000 : g === 'moyens' ? 28000 : null,        // un petit scintillement guide l'enfant ; jamais d'échec
    rayon: g === 'petits' ? 1.7 : g === 'moyens' ? 1.3 : 1.0,                   // grande zone de toucher pour les petits
    image: n <= 2 || (n === 5 && g === 'petits') || (n === 4 && g === 'petits'),  // l'image reste affichée en plus de la consigne pour les 3-5 ans
    mot: n >= 3 && g !== 'petits'
  };
}
export const etoilesPour = aides => (aides <= 0 ? 3 : aides <= 2 ? 2 : 1);

// Choix des cibles : distincts, de préférence des mots pas encore vus. rng() ∈ [0,1[
export function choisirCibles(objets, n, rng = Math.random, vus = []) {
  const pool = [...objets]; for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  pool.sort((a, b) => (vus.includes(a) ? 1 : 0) - (vus.includes(b) ? 1 : 0));
  return pool.slice(0, Math.min(n, pool.length));
}

// ---- sauvegarde ----
export function etatInitial() { return { v: 1, age: null, sousTitres: true, etoiles: {}, trouves: [], diplomes: [], dernier: null }; }
export function lire(brut) {
  const d = etatInitial(); if (!brut || typeof brut !== 'object') return d;
  if (groupeAge(brut.age)) d.age = groupeAge(brut.age);
  if (typeof brut.sousTitres === 'boolean') d.sousTitres = brut.sousTitres;
  if (brut.etoiles && typeof brut.etoiles === 'object') for (const l of LIEUX_IDS) { const a = brut.etoiles[l]; if (Array.isArray(a)) d.etoiles[l] = NIVEAUX.map((_, i) => Math.max(0, Math.min(3, Number(a[i]) || 0))); }
  if (Array.isArray(brut.trouves)) d.trouves = [...new Set(brut.trouves.filter(x => typeof x === 'string'))];
  if (Array.isArray(brut.diplomes)) d.diplomes = [...new Set(brut.diplomes.filter(x => typeof x === 'string'))];
  if (brut.dernier && LIEUX_IDS.includes(brut.dernier.lieu)) d.dernier = { lieu: brut.dernier.lieu, niveau: Math.max(1, Math.min(5, brut.dernier.niveau | 0)) };
  return d;
}
export const etoilesLieu = (s, lieu) => (s.etoiles[lieu] || []).reduce((a, b) => a + b, 0);
export const etoilesTotal = s => LIEUX_IDS.reduce((a, l) => a + etoilesLieu(s, l), 0);
export const lanternes = s => LIEUX_IDS.reduce((a, l) => a + (s.etoiles[l] || []).filter(x => x > 0).length, 0);   // une lanterne par lieu et niveau réussis
export const MAX_ETOILES = LIEUX_IDS.length * NIVEAUX.length * 3;
// Un niveau est ouvert quand le précédent a été réussi dans au moins un lieu (jamais de verrou de temps ni de paiement)
export const niveauOuvert = (s, niveau) => niveau <= 1 || LIEUX_IDS.some(l => (s.etoiles[l] || [])[niveau - 2] > 0);
// Fin de manche : met à jour la meilleure note (jamais à la baisse), les mots appris, les diplômes. Renvoie ce qui est NOUVEAU.
export function terminerManche(s, { lieu, niveau, aides, cibles }) {
  const nouveau = { etoiles: 0, mots: [], diplomes: [], lanterne: false };
  const a = s.etoiles[lieu] || (s.etoiles[lieu] = [0, 0, 0, 0, 0]), e = etoilesPour(aides);
  if (!a[niveau - 1]) nouveau.lanterne = true;
  if (e > a[niveau - 1]) { nouveau.etoiles = e - a[niveau - 1]; a[niveau - 1] = e; }
  for (const c of cibles) if (!s.trouves.includes(c)) { s.trouves.push(c); nouveau.mots.push(c); }
  if (a[4] > 0 && !s.diplomes.includes(lieu)) { s.diplomes.push(lieu); nouveau.diplomes.push(lieu); }
  if (LIEUX_IDS.every(l => s.diplomes.includes(l)) && !s.diplomes.includes('grand')) { s.diplomes.push('grand'); nouveau.diplomes.push('grand'); }
  s.dernier = { lieu, niveau };
  return nouveau;
}
// Prochaine proposition : continuer au niveau suivant du même lieu si ouvert, sinon un autre lieu pas fini à ce niveau
export function suite(s, lieu, niveau) {
  if (niveau < 5) return { lieu, niveau: niveau + 1 };
  const autre = LIEUX_IDS.find(l => l !== lieu && !(s.etoiles[l] || [])[4]); return autre ? { lieu: autre, niveau: 1 } : null;
}
