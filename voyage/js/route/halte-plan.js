// LE PLAN DE LA HALTE DE REPOS (au milieu de la Route) : fichier PUR, sans 3D, partagé par le décor (halte-3d.js), le jeu (jeu-route.js, main.js) et les tests.
// Le repère local (dx, dz) se pose sur le monde : x = centre.x + dx, z = centre.z + dz (dx vers l'est, dz vers l'avant de la route).
// Côté est : Sablo (abreuvoir, mangeoire, abri). Côté ouest : la grande tente, les tapis, les provisions et l'eau de Nour. Au centre : le foyer.
// Rien ici n'est obligatoire et rien n'est puni : la halte est un cadeau du chemin.
import { HALTE, DEC } from './relief.js';

export { HALTE };
export const centre = () => ({ x: HALTE.t, z: DEC + HALTE.s });
const W = (dx, dz) => ({ x: HALTE.t + dx, z: DEC + HALTE.s + dz });
export const dansHalte = (x, z, marge = 0) => Math.hypot(x - HALTE.t, z - (DEC + HALTE.s)) < HALTE.r + marge;

// La halte sur la carte ancienne (jamais comptée dans les lieux de mission : pas de compteur, pas de progression à remplir)
export const LIEU_HALTE = { id: 'halte', type: 'halte', nom: 'La halte des caravaniers', icone: '⛺', s: HALTE.s, t: HALTE.t };

// Tout ce que l'on voit (dessiné à la main dans halte-3d.js). rayon : encombrement pour les obstacles (0 = on marche dessus : tapis, braises…)
export const ELEMENTS = [
  { id: 'tente', type: 'tente', dx: -8, dz: -4 },                       // grande tente en poils de chèvre, ouverte vers l'est, avec son auvent
  { id: 'tapis-1', type: 'tapis', dx: -5.0, dz: -4.0, l: 3.2, w: 2.2, couleur: '#a8453a', bord: '#e0c27a' },
  { id: 'tapis-2', type: 'tapis', dx: -1.8, dz: -4.4, l: 2.4, w: 1.6, couleur: '#2f6f7a', bord: '#d9b36a', rot: 0.25 },
  { id: 'tapis-3', type: 'tapis', dx: -6.4, dz: 1.2, l: 2.2, w: 1.5, couleur: '#7d4a2a', bord: '#cfae6a', rot: -0.2 },
  { id: 'foyer', type: 'foyer', dx: 0.5, dz: -0.5 },                    // un petit feu de caravaniers : pierres, braises, marmite
  { id: 'palmier-1', type: 'palmier', dx: 13, dz: -9, h: 1.0 },
  { id: 'palmier-2', type: 'palmier', dx: 15.5, dz: -3, h: 1.15 },
  { id: 'palmier-3', type: 'palmier', dx: 11.5, dz: 11, h: 0.95 },
  { id: 'palmier-4', type: 'palmier', dx: -13, dz: 10, h: 1.1 },
  { id: 'palmier-5', type: 'palmier', dx: -15, dz: -6, h: 1.2 },
  { id: 'provisions', type: 'provisions', dx: -10, dz: 3.4 },            // sacs d'orge, corbeille de dattes, pains, jarres d'huile
  { id: 'eau-nour', type: 'eau-nour', dx: -3.5, dz: 7.5 },              // grandes jarres à l'ombre sur un trépied de bois, avec des outres
  { id: 'abreuvoir', type: 'abreuvoir', dx: 8.5, dz: 3.0 },             // un long abreuvoir de bois pour Sablo
  { id: 'mangeoire', type: 'mangeoire', dx: 13, dz: 3.0 },              // une mangeoire : palmes, orge, dattes
  { id: 'abri-sablo', type: 'abri-sablo', dx: 9.5, dz: -6.5 },          // un abri de palmes sur quatre poteaux, avec un lit de paille
  { id: 'lanterne', type: 'lanterne', dx: 3.5, dz: 5.5 },
  { id: 'fanion', type: 'fanion', dx: 17, dz: 0 }                       // un grand fanion, visible de la piste
];

// Les obstacles : peu nombreux, petits ; jamais sur un geste de Nour ni sur une place de Sablo
const OBST = [
  [-10.4, -4, 2.0], [-8, -6.5, 1.1], [-8, -1.5, 1.1],                    // la tente : le fond et les deux côtés (l'avant reste ouvert)
  [-3.2, -6.3, 0.25], [-3.2, -1.7, 0.25],                                // les poteaux de l'auvent
  [0.5, -0.5, 0.9],                                                      // le foyer
  [13, -9, 0.5], [15.5, -3, 0.5], [11.5, 11, 0.5], [-13, 10, 0.5], [-15, -6, 0.5],   // les troncs de palmiers
  [-10, 3.4, 1.4], [-3.5, 7.5, 1.0],                                     // les provisions, les jarres
  [7.6, 3.0, 0.7], [9.4, 3.0, 0.7], [13, 3.0, 0.8],                       // l'abreuvoir (deux bouts), la mangeoire
  [7.0, -8.3, 0.25], [12.0, -8.3, 0.25], [7.0, -4.7, 0.25], [12.0, -4.7, 0.25],   // les poteaux de l'abri de Sablo
  [3.5, 5.5, 0.2], [17, 0, 0.25]
];
export const obstacles = () => OBST.map(([dx, dz, r]) => ({ ...W(dx, dz), r }));

// Les lieux de soins de Sablo : MÊMES CHAMPS que ceux de l'enclos de l'écurie (enclos-plan.js), pour que le système de soins existant
// (boire, manger, se reposer, récompenses, besoins) fonctionne tel quel. objet : où il se trouve ; stand : où se place la monture ; a : son cap (atan2(x, z)).
export function lieuxSoins() {
  return {
    eau: { objet: W(8.5, 3.0), stand: W(8.5, 4.4), a: Math.PI, rayon: 4.2, action: 'boire', icone: '💧', verbe: 'Faire boire' },
    foin: { objet: W(13, 3.0), stand: W(13, 4.4), a: Math.PI, rayon: 4.2, action: 'manger', icone: '🌾', verbe: 'Donner à manger à' },
    litiere: { objet: W(9.5, -6.5), stand: W(9.5, -6.5), a: Math.PI / 2, rayon: 4.2, action: 'repos', icone: '🌙', verbe: 'Faire reposer' }
  };
}

// Les trois gestes de Nour : boire à la jarre, manger des dattes, se reposer sur le tapis à l'ombre de la tente
export const GESTES_NOUR = [
  { id: 'halte-eau', ...W(-3.5, 5.6), rayon: 2.8, label: 'Boire', icone: '💧' },
  { id: 'halte-vivres', ...W(-7.8, 3.4), rayon: 2.8, label: 'Manger', icone: '🥜' },
  { id: 'halte-tapis', ...W(-4.5, -4.0), rayon: 3.0, label: 'Se reposer', icone: '😌' }
];

// Ce que l'enfant a fait à la halte : un petit compteur facultatif, rangé dans R.vu.halte (aucune sauvegarde existante ne change, rien n'est exigé)
export function etatHalte(R) {
  if (!R.vu || typeof R.vu !== 'object') R.vu = {};
  const h = R.vu.halte && typeof R.vu.halte === 'object' ? R.vu.halte : (R.vu.halte = {});
  h.vue = h.vue === true; for (const k of ['boire', 'manger', 'repos']) h[k] = Number.isFinite(h[k]) && h[k] > 0 ? Math.floor(h[k]) : 0;
  return h;
}
