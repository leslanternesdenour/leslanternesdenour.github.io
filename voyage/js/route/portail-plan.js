// LE PORTAIL DE LA GRANDE ROUTE : un portail de pierre dans le village, au relais de Rachid (le guide). On se place devant, on le franchit, on arrive
// directement au départ de la route, sur la piste, face à l'avant. Fichier PUR (aucune 3D) : partagé par le décor (portail-3d.js), le jeu (jeu-route.js) et les tests.
// Il REMPLACE l'ancienne marche vers l'est (la longue piste de sortie du village) : la progression, la bourse, le sac et les sauvegardes ne changent pas.
import { DEC, pointChemin } from './relief.js';

// Le portail : au bord du village, côté est du relais (là où le sol monte doucement vers les dunes), ouvert vers l'est. cap : le sens dans lequel on le traverse (atan2(x, z)).
export const PORTAIL = { x: 74, z: 32, cap: Math.PI / 2 };
export const ANCIENNE_MARCHE_ACTIVE = false;     // l'ancienne entrée par la marche vers l'est (x ≥ 346) ne déclenche plus rien

// L'endroit où l'on se tient pour le franchir (le bouton « Franchir le portail » apparaît à moins de 3,4 m), et où l'on revient quand on rentre de la route
export const devant = () => ({ x: PORTAIL.x - 3.4 * Math.sin(PORTAIL.cap), z: PORTAIL.z - 3.4 * Math.cos(PORTAIL.cap) });
export const retourVillage = () => { const d = devant(), a = PORTAIL.cap + Math.PI; return { x: d.x, z: d.z, a: Math.atan2(Math.sin(a), Math.cos(a)) }; };

// L'arrivée sur la route : sur l'axe EXACT de la piste, juste après le seuil, et le cap de l'enfant suit la piste (la caméra se place derrière lui)
const S_ARRIVEE = -20;
export function arrivee() {
  const p = pointChemin(S_ARRIVEE), q = pointChemin(S_ARRIVEE + 10);
  return { x: p.t, z: DEC + S_ARRIVEE, a: Math.atan2(q.t - p.t, 10) };
}

// Les obstacles : deux piliers de pierre, et le voile fermé (on ne passe pas « à travers » : on utilise le bouton)
export const obstacles = () => [
  { x: PORTAIL.x, z: PORTAIL.z - 2.5, r: 1.0 }, { x: PORTAIL.x, z: PORTAIL.z + 2.5, r: 1.0 },
  { x: PORTAIL.x, z: PORTAIL.z - 0.9, r: 0.8 }, { x: PORTAIL.x, z: PORTAIL.z + 0.9, r: 0.8 }
];

// Les textes (sobres : pierre, lumière, piste ; rien de religieux)
export const TEXTES_PORTAIL = {
  nom: 'Le portail de la grande route',
  bouton: 'Franchir le portail',
  indice: 'Un portail de pierre s\'ouvre sur le début de la grande route.',
  panneau: 'Un portail de pierre mène au début de la grande piste. Parle à Rachid pour préparer ton sac, puis franchis-le quand tu veux.'
};
