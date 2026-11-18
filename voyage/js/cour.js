// « Ma cour » : l'espace de l'enfant devant sa maison, dans le village.
// Les objets de collection achetés au souk y sont exposés (l'enfant choisit lesquels dans son armoire).
import * as THREE from 'three';
import { piece, fusion, materiau, M } from './formes.js?v=3';
import { modeleObjet, ARTICLES } from './catalogue.js?v=3';

const mat = materiau({ finesse: 2 });
// place de chaque objet : [côté (-1 gauche … 1 droite), profondeur (0 devant … 1 fond), angle]
const PLACES = {
  'arbre-lumiere': [0, 1, 0], 'metier': [-0.7, 0.85, 0.5], 'tapis-mural': [0.7, 0.85, -0.5], 'coffre-bois': [-0.35, 0.75, 0.2],
  'lanterne-cuivre': [0.35, 0.75, 0], 'coussins': [0, 0.35, 0], 'palmier-pot': [-0.95, 0.4, 0], 'jarre': [0.95, 0.45, 0],
  'cruche': [0.8, 0.2, 0.4], 'plat': [0.2, 0.15, 0], 'lampe-huile': [-0.2, 0.12, 0], 'tapis-sol': [0, 0.3, 0]
};

export function creerCour({ scene, terrain, colliders, ombres }) {
  const H = (x, z) => terrain.hauteur(x, z);
  const a = 310 * Math.PI / 180, cx = Math.cos(a) * 17.5, cz = Math.sin(a) * 17.5;
  const rot = Math.atan2(cx, cz);                 // le fond de la cour est côté maison, on regarde le puits
  const g = new THREE.Group(); g.position.set(cx, H(cx, cz), cz); g.rotation.y = rot + Math.PI; scene.add(g);
  // le sol et le petit muret
  const base = [piece(new THREE.CylinderGeometry(4.6, 4.7, 0.08, 28), '#e9d6ae', { p: [0, 0.03, 0], m: M.pierre }),
    piece(new THREE.TorusGeometry(4.55, 0.07, 5, 40), '#c9a96e', { p: [0, 0.08, 0], r: [Math.PI / 2, 0, 0] })];
  for (let i = 0; i < 9; i++) { const t = -1.1 + i * 0.275; base.push(piece(new THREE.BoxGeometry(1.6, 0.7, 0.4), '#d9bf94', { p: [Math.sin(t) * 4.9, 0.35, -Math.cos(t) * 4.9], r: [0, -t, 0], m: M.terre })); }
  // un petit panneau de bois
  base.push(piece(new THREE.CylinderGeometry(0.06, 0.07, 1.1, 6), '#6b4a30', { p: [3.6, 0.55, 3.2], m: M.bois }), piece(new THREE.BoxGeometry(0.9, 0.45, 0.06), '#a7744a', { p: [3.6, 1.05, 3.2], r: [0, -0.4, 0], m: M.bois }));
  const sol = new THREE.Mesh(fusion(base), mat); sol.receiveShadow = ombres; sol.castShadow = ombres; g.add(sol);
  for (let i = 0; i < 9; i++) { const t = -1.1 + i * 0.275, l = new THREE.Vector3(Math.sin(t) * 4.9, 0, -Math.cos(t) * 4.9).applyAxisAngle(new THREE.Vector3(0, 1, 0), g.rotation.y); colliders.push({ x: cx + l.x, z: cz + l.z, r: 0.75 }); }
  const objets = new THREE.Group(); g.add(objets);
  const lumieres = [];
  return {
    centre: { x: cx, z: cz },
    // affiche les objets exposés
    maj(AV) {
      const avoir = new Set((AV.achats || []).map(x => x.id));
      objets.children.slice().forEach(o => { objets.remove(o); o.geometry.dispose(); });
      lumieres.length = 0;
      for (const art of ARTICLES) {
        if (art.cat !== 'collection' || !avoir.has(art.id) || AV.cour[art.id] === false) continue;
        const [cote, prof, r] = PLACES[art.id] || [0, 0.5, 0];
        const m = new THREE.Mesh(modeleObjet(art.forme), mat); m.castShadow = ombres; m.receiveShadow = ombres;
        m.position.set(cote * 3.3, 0.07, 3.0 - prof * 6.2); m.rotation.y = r;
        if (art.forme === 'lanternedoree' || art.forme === 'lampe') lumieres.push(m);
        objets.add(m);
      }
    }
  };
}
