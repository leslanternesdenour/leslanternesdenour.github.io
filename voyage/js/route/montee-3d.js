// Les sentiers de montée en 3D : de petits cairns de pierre le long du chemin (pour le suivre des yeux), un banc de pierre à chaque halte, et un belvédère dégagé en haut.
// Une seule géométrie fusionnée par montagne : très peu d'appels de dessin. Aucun personnage, aucun symbole : seulement des pierres.
import * as THREE from 'three';
import { piece, fusion, materiau, M } from '../formes.js?v=4';
import { DEC } from './relief.js';
import { sentierMontee, MONTEES } from './sentier-montee.js';

const B = () => new THREE.BoxGeometry(1, 1, 1), DOD = r => new THREE.DodecahedronGeometry(r, 0);

export function creerMontee3D({ scene, hauteur, ombres }) {
  const mat = materiau({ finesse: 1.3 }), groupe = new THREE.Group(); groupe.name = 'route-montee'; scene.add(groupe);
  const haltes = {};
  for (const id of Object.keys(MONTEES)) {
    const { pts, haltes: H } = sentierMontee(id), g = [];
    // un petit cairn (trois pierres empilées) tous les ~14 m le long du sentier
    let depuis = 0; for (let k = 1; k < pts.length; k++) { depuis += Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]); if (depuis < 14) continue; depuis = 0;
      const d = (k % 2 ? 1.6 : -1.6), px = pts[k][1] + d, pz = DEC + pts[k][0], py = hauteur(px, pz);   // posé un peu à côté du chemin, une fois à gauche, une fois à droite
      g.push(piece(DOD(0.34), '#a8906e', { p: [px, py + 0.2, pz], m: M.pierre }), piece(DOD(0.26), '#b8a07a', { p: [px, py + 0.55, pz], m: M.pierre }), piece(DOD(0.17), '#c9b58a', { p: [px, py + 0.82, pz], m: M.pierre })); }
    // à chaque halte : un banc de pierre ; en haut (3e halte) : un belvédère avec un petit muret de pierres plates
    H.forEach((h, k) => { const x = h.t, z = DEC + h.s, y = hauteur(x, z);
      g.push(piece(B(), '#b8a07a', { p: [x + 1.5, y + 0.28, z], s: [1.6, 0.4, 0.6], m: M.pierre }), piece(B(), '#a58c64', { p: [x + 1.5, y + 0.6, z - 0.2], s: [1.7, 0.18, 0.7], m: M.pierre }));
      if (k === 2) for (let a = 0; a < 7; a++) { const an = 3.3 + a * 0.5, px = x + Math.cos(an) * 3.4, pz = z + Math.sin(an) * 3.4; g.push(piece(B(), '#c9b58a', { p: [px, hauteur(px, pz) + 0.3, pz], s: [1.1, 0.6, 0.5], r: [0, -an, 0], m: M.pierre })); }
      haltes[id + ':' + k] = { x, z }; });
    const o = new THREE.Mesh(fusion(g), mat); o.castShadow = ombres; o.receiveShadow = ombres; groupe.add(o);
  }
  return { groupe, haltes };
}
