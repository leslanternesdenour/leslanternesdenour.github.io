// L'intérieur d'une maison en 3D : une seule pièce, posée sur le plateau plat (relief.js), INVISIBLE tant que l'enfant n'y est pas.
// Pas de toit ni de hauts murs : seulement des murets, pour que la caméra voie toujours la pièce (comme dans l'atelier). Aucune personne représentée : seulement des objets du quotidien.
import * as THREE from 'three';
import { piece, fusion, materiau, M } from '../formes.js?v=4';
import { DEC, PLATEAU_INTERIEURS } from './relief.js';
import { PIECE, planInterieur } from './interieur-plan.js';
import { FAITS_INTERIEURS } from './textes-route.js';

const B = () => new THREE.BoxGeometry(1, 1, 1), CYL = (a, b, h, s = 8) => new THREE.CylinderGeometry(a, b, h, s), SPH = (r, w = 8, h = 6) => new THREE.SphereGeometry(r, w, h);

// les objets du quotidien (repère local : l'objet est centré en 0,0 ; y vers le haut)
export const FORMES = {
  jarre: () => [piece(CYL(0.45, 0.55, 1.1, 10), '#a35a34', { p: [0, 0.55, 0], m: M.terre }), piece(CYL(0.3, 0.45, 0.25, 10), '#b0643c', { p: [0, 1.2, 0], m: M.terre }), piece(CYL(0.32, 0.32, 0.05, 10), '#e8dcc4', { p: [0, 1.35, 0], m: M.tissu })],
  tapis: () => [piece(B(), '#a8402f', { p: [0, 0.03, 0], s: [2.6, 0.06, 1.7], m: M.tissu }), piece(B(), '#e8c27a', { p: [0, 0.07, 0], s: [2.1, 0.03, 1.2], m: M.tissu }), piece(B(), '#7a3b4d', { p: [-0.8, 0.2, -0.4], s: [0.5, 0.25, 0.5], m: M.tissu }), piece(B(), '#46587a', { p: [0.7, 0.2, 0.3], s: [0.5, 0.25, 0.5], m: M.tissu })],
  sacs: () => [piece(SPH(0.5, 8, 6), '#c9b58a', { p: [-0.5, 0.4, 0], s: [1, 0.85, 1], m: M.tissu }), piece(SPH(0.5, 8, 6), '#bfa97c', { p: [0.5, 0.4, 0.1], s: [1, 0.85, 1], m: M.tissu }), piece(SPH(0.45, 8, 6), '#d3c196', { p: [0, 1.0, 0], s: [1, 0.85, 1], m: M.tissu })],
  balance: () => [piece(B(), '#6e4e34', { p: [0, 0.65, 0], s: [0.12, 1.3, 0.12], m: M.bois }), piece(B(), '#8a6440', { p: [0, 1.3, 0], s: [1.6, 0.07, 0.07], m: M.bois }), piece(CYL(0.32, 0.32, 0.04, 10), '#a8906e', { p: [-0.7, 0.85, 0], m: M.bois }), piece(CYL(0.32, 0.32, 0.04, 10), '#a8906e', { p: [0.7, 0.85, 0], m: M.bois }), piece(SPH(0.14, 6, 5), '#5a3a22', { p: [-0.7, 0.98, 0], m: M.terre }), piece(SPH(0.14, 6, 5), '#5a3a22', { p: [-0.55, 0.98, 0.1], m: M.terre }), piece(B(), '#6e4e34', { p: [0, 0.04, 0], s: [0.6, 0.08, 0.6], m: M.bois })],
  metier: () => [piece(B(), '#6e4e34', { p: [-0.9, 0.85, 0], s: [0.12, 1.7, 0.12], m: M.bois }), piece(B(), '#6e4e34', { p: [0.9, 0.85, 0], s: [0.12, 1.7, 0.12], m: M.bois }), piece(B(), '#8a6440', { p: [0, 1.65, 0], s: [1.9, 0.1, 0.1], m: M.bois }), piece(B(), '#8a6440', { p: [0, 0.35, 0], s: [1.9, 0.1, 0.1], m: M.bois }),
    ...Array.from({ length: 9 }, (_, k) => piece(B(), k % 3 === 0 ? '#a8402f' : k % 3 === 1 ? '#e8dcc4' : '#46587a', { p: [-0.7 + k * 0.175, 1.0, 0], s: [0.03, 1.3, 0.03], m: M.tissu }))],
  tissus: () => [piece(B(), '#a8402f', { p: [0, 0.06, 0], s: [1.3, 0.12, 0.8], m: M.tissu }), piece(B(), '#46587a', { p: [0.05, 0.18, 0.02], s: [1.2, 0.12, 0.75], m: M.tissu }), piece(B(), '#e8c27a', { p: [-0.05, 0.3, 0], s: [1.15, 0.12, 0.7], m: M.tissu }), piece(B(), '#5f8a56', { p: [0.02, 0.42, 0.03], s: [1.05, 0.12, 0.65], m: M.tissu })],
  laine: () => [piece(SPH(0.5, 8, 6), '#f1ead8', { p: [-0.4, 0.45, 0], m: M.tissu }), piece(SPH(0.45, 8, 6), '#e8dfc8', { p: [0.4, 0.4, 0.1], m: M.tissu }), piece(SPH(0.42, 8, 6), '#f6f0e0', { p: [0, 0.95, 0], m: M.tissu })],
  outre: () => [piece(SPH(0.55, 10, 7), '#7a5a3a', { p: [0, 0.55, 0], s: [1, 1.1, 0.8], m: M.tissu }), piece(CYL(0.1, 0.14, 0.35, 8), '#5a3f2a', { p: [0, 1.25, 0], m: M.bois }), piece(B(), '#5a3f2a', { p: [0, 0.04, 0], s: [0.7, 0.08, 0.7], m: M.bois })],
  outils: () => [piece(B(), '#8a6440', { p: [0, 0.4, 0], s: [1.7, 0.8, 0.7], m: M.bois }), piece(B(), '#5a3f2a', { p: [-0.4, 0.88, 0], s: [0.7, 0.07, 0.07], m: M.bois }), piece(B(), '#7d7a74', { p: [-0.1, 0.9, 0], s: [0.22, 0.14, 0.12], m: M.pierre }), piece(B(), '#7d7a74', { p: [0.5, 0.84, 0.1], s: [0.6, 0.04, 0.1], m: M.pierre })],
  cordes: () => [piece(new THREE.TorusGeometry(0.42, 0.1, 6, 14), '#b59a64', { p: [0, 0.12, 0], r: [Math.PI / 2, 0, 0], m: M.tissu }), piece(new THREE.TorusGeometry(0.4, 0.1, 6, 14), '#a8905a', { p: [0, 0.3, 0], r: [Math.PI / 2, 0, 0], m: M.tissu }), piece(new THREE.TorusGeometry(0.34, 0.1, 6, 14), '#b59a64', { p: [0, 0.48, 0], r: [Math.PI / 2, 0, 0], m: M.tissu }), piece(B(), '#6e4e34', { p: [0.9, 0.6, -0.2], s: [0.1, 1.2, 0.1], m: M.bois })],
  etagere: () => [piece(B(), '#6e4e34', { p: [-0.85, 0.9, 0], s: [0.1, 1.8, 0.5], m: M.bois }), piece(B(), '#6e4e34', { p: [0.85, 0.9, 0], s: [0.1, 1.8, 0.5], m: M.bois }),
    ...[0.5, 1.0, 1.5].flatMap((y, i) => [piece(B(), '#8a6440', { p: [0, y, 0], s: [1.8, 0.07, 0.5], m: M.bois }), ...[-0.5, 0, 0.5].map((x, k) => piece(CYL(0.14, 0.18, 0.3, 8), (i + k) % 2 ? '#b0643c' : '#c99a4a', { p: [x, y + 0.19, 0], m: M.terre }))])]
};

export function creerInterieur3D({ scene, hauteur, ombres }) {
  const mat = materiau({ finesse: 1.4 }), groupe = new THREE.Group(); groupe.name = 'route-interieur'; groupe.visible = false; scene.add(groupe);
  const P = PLATEAU_INTERIEURS, cx = P.t, cz = DEC + P.s, y0 = hauteur(cx, cz), plan = planInterieur(cx, cz), colliders = [];
  const A = PIECE, murs = [];
  // le sol, les murets (avec l'ouverture de la porte), un tapis de seuil : toujours les mêmes ; seuls les meubles changent selon la maison
  { const m = (x, z, sx, sz) => piece(B(), '#c4a77d', { p: [x, 0.55, z], s: [sx, 1.1, sz], m: M.terre });
    murs.push(piece(B(), '#8a7456', { p: [0, 0.02, 0], s: [A.demiL * 2 + 0.6, 0.06, A.demiP * 2 + 0.6], m: M.terre }), m(0, -A.demiP, A.demiL * 2 + 0.6, 0.5), m(-A.demiL, 0, 0.5, A.demiP * 2), m(A.demiL, 0, 0.5, A.demiP * 2),
      m(-(A.demiL + A.porte) / 2 - 0.1, A.demiP, A.demiL - A.porte + 0.2, 0.5), m((A.demiL + A.porte) / 2 + 0.1, A.demiP, A.demiL - A.porte + 0.2, 0.5), piece(B(), '#6e4e34', { p: [0, 0.07, A.demiP], s: [A.porte * 2, 0.04, 0.6], m: M.bois })); }
  const base = new THREE.Mesh(fusion(murs), mat); base.position.set(cx, y0, cz); base.receiveShadow = ombres; groupe.add(base);
  let meubles = null, gabaritActuel = null;
  // construit les deux meubles de la maison g (reconstruit seulement si la maison change)
  function construire(g) {
    if (g === gabaritActuel) return; gabaritActuel = g;
    if (meubles) { groupe.remove(meubles); meubles.geometry.dispose(); }
    const pieces = []; FAITS_INTERIEURS[g].objets.forEach((o, i) => { const e = A.objets[i]; for (const p of FORMES[o.forme]()) { p.translate && p.translate(e.x, 0, e.z); pieces.push(p); } });
    meubles = new THREE.Mesh(fusion(pieces), mat); meubles.position.set(cx, y0, cz); meubles.castShadow = ombres; groupe.add(meubles);
  }
  return { groupe, plan, colliders, y0, construire, montrer(v) { groupe.visible = v; colliders.length = 0; if (v) for (const c of plan.colliders) colliders.push(c); } };
}
