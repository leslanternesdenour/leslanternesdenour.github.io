// LOGIQUE COMMUNE DES MINI-JEUX DES AVENTURES (Oasis, Trésor des sourates et des mots, Défi des cinq prières) — pure, testée sous Node (outils/tests/mini-jeux.test.mjs).
// Règles : jamais de zéro étoile à la fin d'une partie, jamais de sanction, aucun chronomètre ; une erreur donne une explication douce et on réessaie.
export const melanger = (a, rng = Math.random) => { const p = [...a]; for (let i = p.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; } return p; };
export const etoilesPour = (premierCoup, total) => (premierCoup >= total ? 3 : premierCoup * 2 >= total ? 2 : 1);

// qs : [{ q, ar?, choix: [bonneReponse, autre, autre…] (texte), exp, religieux? }] → questions mélangées, réponses mélangées ; bonne = index de la bonne réponse.
export function construireQuestions(qs, rng = Math.random) {
  return melanger(qs.map(q => {
    const choix = melanger(q.choix.map((t, i) => ({ t, bonne: i === 0 })), rng);
    return { q: q.q, ar: q.ar || '', exp: q.exp || '', religieux: !!q.religieux, choix, bonne: choix.findIndex(c => c.bonne) };
  }), rng);
}

// Trois mauvaises réponses au plus, distinctes de la bonne, tirées dans « autres » : (bonne, autres, n) → [bonne, …n mauvaises]
export function avecLeurres(bonne, autres, n = 2, rng = Math.random) {
  const pool = [...new Set(autres.filter(x => x !== bonne))];
  return [bonne, ...melanger(pool, rng).slice(0, n)];
}

// État : { v:1, etoiles:{ id: 0..3 }, … } nettoyé à la lecture (une sauvegarde abîmée ne casse jamais le jeu).
export function lireEtoiles(brut, ids) {
  const o = {}; const e = brut && typeof brut === 'object' && brut.etoiles && typeof brut.etoiles === 'object' ? brut.etoiles : {};
  for (const id of ids) o[id] = Math.max(0, Math.min(3, Math.floor(Number(e[id]) || 0)));
  return o;
}
export const sommeEtoiles = o => Object.values(o).reduce((a, b) => a + b, 0);
export const listeDeTextes = (x, permis) => (Array.isArray(x) ? [...new Set(x.filter(s => typeof s === 'string' && (!permis || permis.includes(s))))] : []);
