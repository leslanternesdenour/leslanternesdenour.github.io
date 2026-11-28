// LE PORTAIL DE LA GRANDE ROUTE : un portail de pierre dans le village, au relais de Rachid (le guide). On se place devant, on le franchit, on arrive
// directement au départ de la route, sur la piste, face à l'avant. Fichier PUR (aucune 3D) : partagé par le décor (portail-3d.js), le jeu (jeu-route.js) et les tests.
// Il REMPLACE l'ancienne marche vers l'est (la longue piste de sortie du village) : la progression, la bourse, le sac et les sauvegardes ne changent pas.
import { DEC, pointChemin } from './relief.js';

// Le portail : au bord du village, côté est du relais (là où le sol monte doucement vers les dunes), ouvert vers l'est. cap : le sens dans lequel on le traverse (atan2(x, z)).
export const PORTAIL = { x: 74, z: 32, cap: Math.PI / 2 };
export const ANCIENNE_MARCHE_ACTIVE = false;     // l'ancienne entrée par la marche vers l'est (x ≥ 346) ne déclenche plus rien

// Le repère du portail : lx = de gauche à droite (vu de devant), lz = le sens de la traversée (le devant est en lz négatif), (0, 0) = le centre du portail.
export const versMonde = (lx, lz) => { const s = Math.sin(PORTAIL.cap), c = Math.cos(PORTAIL.cap); return { x: PORTAIL.x + lz * s + lx * c, z: PORTAIL.z + lz * c - lx * s }; };
export const versLocal = (x, z) => { const s = Math.sin(PORTAIL.cap), c = Math.cos(PORTAIL.cap), dx = x - PORTAIL.x, dz = z - PORTAIL.z; return { lx: dx * c - dz * s, lz: dx * s + dz * c }; };
const norme = a => Math.atan2(Math.sin(a), Math.cos(a));

// LES MARCHES : trois blocs de pierre posés sur un sol plan (voir PLATEFORME_PORTAIL dans terrain.js). Les hauteurs sont mesurées au-dessus de ce sol.
// Le 3D (portail-3d.js) dessine exactement ces blocs, le jeu (jeu-route.js) pose les pieds exactement dessus : une seule source de vérité.
// raide : de combien la pierre « descend » autour du bloc (m par m). 1 = on monte comme une marche (la pente permise est de 1,05) ; 2,5 = un mur, on ne le grimpe pas.
export const BLOCS = [
  { id: 'marche-basse', x0: -3.8, x1: 3.8, z0: -4.5, z1: -3.0, haut: 0.2, raide: 1 },
  { id: 'marche-haute', x0: -3.1, x1: 3.1, z0: -3.0, z1: -1.5, haut: 0.4, raide: 1 },
  { id: 'socle', x0: -4.3, x1: 4.3, z0: -1.5, z1: 1.5, haut: 0.6, raide: 2.5 }
];
// La hauteur de la pierre (au-dessus du sol plan) à un endroit du village : 0 hors des blocs ; sur une marche, le dessus exact de la marche.
export function hauteurPortail(x, z) {
  if (Math.abs(x - PORTAIL.x) > 10 || Math.abs(z - PORTAIL.z) > 10) return 0;      // loin du portail (appelée pour tout ce qui marche dans le village) : rien
  const { lx, lz } = versLocal(x, z); let h = 0;
  for (const b of BLOCS) {
    const d = Math.hypot(Math.max(b.x0 - lx, 0, lx - b.x1), Math.max(b.z0 - lz, 0, lz - b.z1));
    h = Math.max(h, b.haut - b.raide * d);
  }
  return h;
}

// L'endroit où l'on se tient pour le franchir (le bouton « Franchir le portail » apparaît à moins de 3,6 m) : AU MILIEU de la marche haute, les pieds sur son dessus
const DEVANT = { lx: 0, lz: -2.25 };
export const devant = () => versMonde(DEVANT.lx, DEVANT.lz);
// Le retour de la Route : sur la marche haute, face au portail — la caméra, derrière l'enfant, voit l'enfant et le voile (jamais caché derrière le socle)
export const retourVillage = () => { const d = devant(); return { x: d.x, z: d.z, a: norme(PORTAIL.cap) }; };
// Sablo : de profil sur la marche basse (le dromadaire fait 2,6 m : il ne tiendrait pas dans le sens de la marche), à côté de l'enfant ;
// monté, il est au milieu de la marche basse (même hauteur sous les quatre pattes) et le cavalier le suit.
const DE_PROFIL = () => norme(Math.atan2(Math.cos(PORTAIL.cap), -Math.sin(PORTAIL.cap)));
export const sabloRetour = () => ({ ...versMonde(-1.9, -3.75), a: DE_PROFIL() });
export const retourMonte = () => ({ ...versMonde(0, -3.75), a: DE_PROFIL() });

// L'arrivée sur la route : sur l'axe EXACT de la piste, juste après le seuil, et le cap de l'enfant suit la piste (la caméra se place derrière lui)
const S_ARRIVEE = -20;
export function arrivee() {
  const p = pointChemin(S_ARRIVEE), q = pointChemin(S_ARRIVEE + 10);
  return { x: p.t, z: DEC + S_ARRIVEE, a: Math.atan2(q.t - p.t, 10) };
}

// Les obstacles : deux piliers de pierre, et le voile fermé (on ne passe pas « à travers » : on utilise le bouton)
export const obstacles = () => [[2.5, 1.0], [-2.5, 1.0], [0.9, 0.8], [-0.9, 0.8]].map(([lx, r]) => ({ ...versMonde(lx, 0), r }));

// Les textes (sobres : pierre, lumière, piste ; rien de religieux)
export const TEXTES_PORTAIL = {
  nom: 'Le portail de la grande route',
  bouton: 'Franchir le portail',
  indice: 'Un portail de pierre s\'ouvre sur le début de la grande route.',
  panneau: 'Un portail de pierre mène au début de la grande piste. Parle à Rachid pour préparer ton sac, puis franchis-le quand tu veux.'
};
