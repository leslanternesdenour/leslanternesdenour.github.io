// LES BÂTISSEURS DE L'OASIS — logique pure (testée sous Node : outils/tests/mini-jeux.test.mjs). Aucun chronomètre, aucune perte : on cherche de l'eau, on plante, on arrose, on récolte.
// Parcelle : 0 vide · 1 graine · 2 pousse · 3 palmier chargé de dattes · 4 palmier qui se repose (un peu d'eau et il refait des dattes).
export const NB_PARCELLES = 9, GOURDE_MAX = 12, EAU_PAR_SOURCE = 3;
export const JALONS = [3, 6, 9];                 // palmiers à atteindre pour 1, 2 puis 3 étoiles
export const etatInitial = () => ({ v: 1, gouttes: 0, dattes: 0, parcelles: Array(NB_PARCELLES).fill(0) });
export function lire(brut) {
  const e = etatInitial(); if (!brut || typeof brut !== 'object') return e;
  e.gouttes = Math.max(0, Math.min(GOURDE_MAX, Math.floor(Number(brut.gouttes) || 0)));
  e.dattes = Math.max(0, Math.min(99999, Math.floor(Number(brut.dattes) || 0)));
  if (Array.isArray(brut.parcelles)) e.parcelles = e.parcelles.map((_, i) => { const v = Math.floor(Number(brut.parcelles[i]) || 0); return v >= 0 && v <= 4 ? v : 0; });
  return e;
}
export const palmiers = e => e.parcelles.filter(p => p >= 3).length;
export const etoiles = e => JALONS.filter(j => palmiers(e) >= j).length;
export const invites = e => Math.floor(e.dattes / 3);               // chaque trois dattes partagées accueillent un voyageur : un petit mot, jamais une obligation
export const termine = e => palmiers(e) >= NB_PARCELLES;

// La source est cachée sous une dune (0, 1 ou 2) : la trouver remplit la gourde de 3 gouttes.
export const cacherSource = (rng = Math.random) => Math.min(2, Math.floor(rng() * 3));
export function chercherEau(e, dune, source) {
  if (dune !== source) return { ok: false, msg: "Pas d'eau sous cette dune. Essaie-en une autre !" };
  if (e.gouttes >= GOURDE_MAX) return { ok: false, trouve: true, msg: "Tu as trouvé de l'eau, mais ta gourde est pleine : va arroser tes plantes !" };
  const ajout = Math.min(EAU_PAR_SOURCE, GOURDE_MAX - e.gouttes); e.gouttes += ajout;
  return { ok: true, trouve: true, msg: '💧 Tu as trouvé de l\'eau ! +' + ajout + ' gouttes dans ta gourde.' };
}
// Une seule action « contextuelle » par parcelle, comme un jeu pour petits : toucher fait ce qui a du sens.
export function agir(e, i) {
  if (!(i >= 0 && i < NB_PARCELLES)) return { ok: false, msg: '' };
  const p = e.parcelles[i];
  if (p === 3) { e.parcelles[i] = 4; e.dattes++; return { ok: true, msg: '🌴 Tu récoltes une datte ! Elle est toute sucrée.' }; }
  if (e.gouttes < 1) return { ok: false, manqueEau: true, msg: "Ta gourde est vide : cherche une source sous les dunes pour avoir de l'eau." };
  e.gouttes--;
  if (p === 0) { e.parcelles[i] = 1; return { ok: true, msg: '🌱 Tu plantes un noyau de datte.' }; }
  if (p === 1) { e.parcelles[i] = 2; return { ok: true, msg: '🌿 Une petite pousse sort du sable.' }; }
  if (p === 2) { e.parcelles[i] = 3; return { ok: true, msg: '🌴 Un palmier a poussé !' }; }
  e.parcelles[i] = 3; return { ok: true, msg: '🌴 Le palmier a de nouveau des dattes.' };
}