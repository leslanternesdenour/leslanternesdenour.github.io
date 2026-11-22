// LES MYSTÈRES DU DÉSERT — décors 3D (désert, ruines, montagne) + le passage secret et le piédestal du trésor.
// Oasis, village, bibliothèque et jardin réutilisent les décors de la Chasse aux mots (une seule source de formes).
import * as THREE from 'three';
import { piece, fusion, M } from '../../voyage/js/formes.js?v=4';
import { creerDecor as decorMots, mat, creerObjet } from '../chasse-aux-mots/objets3d.js?v=1';
export { creerObjet, mat };
const B = () => new THREE.BoxGeometry(1, 1, 1), CYL = (a, b, h, s = 12) => new THREE.CylinderGeometry(a, b, h, s), SPH = (r, w = 12, h = 8) => new THREE.SphereGeometry(r, w, h), CON = (r, h, s = 8) => new THREE.ConeGeometry(r, h, s);
const acacia = (x, z, p) => { p.push(piece(CYL(0.12, 0.2, 2.2, 7), '#6b4a30', { p: [x, 1.1, z], m: M.bois })); p.push(piece(SPH(1.1, 10, 6), '#7a9a3a', { p: [x, 2.5, z], s: [1.6, 0.5, 1.6] })); };
const colonne = (x, z, h, p, c = '#d9c49a') => { p.push(piece(CYL(0.42, 0.5, h, 10), c, { p: [x, h / 2, z], m: M.pierre })); p.push(piece(B(), c, { p: [x, h + 0.1, z], s: [1.2, 0.2, 1.2], m: M.pierre })); p.push(piece(B(), c, { p: [x, 0.1, z], s: [1.3, 0.2, 1.3], m: M.pierre })); };
const rocher = (x, z, r, p, c = '#9a8466') => p.push(piece(SPH(r, 7, 5), c, { p: [x, r * 0.5, z], s: [1.2, 0.9, 1], m: M.pierre }));
const DECORS = {
  desert: p => { for (const [x, z, r] of [[-8, -6, 3.4], [7, -7.5, 4], [0, -11, 4.6], [-9.5, 3, 2.6], [9.5, 2, 2.4]]) p.push(piece(SPH(r, 14, 8), '#ecd29a', { p: [x, r * 0.1, z], s: [1.6, 0.55, 1.4], m: M.terre })); acacia(-6.5, -3.5, p); acacia(6.8, -2, p); for (const [x, z, r] of [[-3, -8, 0.7], [4, 7.5, 0.6], [-7.5, 5.5, 0.5], [8, 5, 0.7]]) rocher(x, z, r, p); p.push(piece(CON(0.1, 1.6, 6), '#4fa645', { p: [-2, 0.8, 7.2] })); },
  ruines: p => { for (const [x, z, h] of [[-5, -6, 3.4], [-2.6, -7.5, 4.4], [2.8, -7.6, 3.8], [5.4, -6, 2.2], [-7.5, -1, 2.8], [7.6, -1.5, 1.6]]) colonne(x, z, h, p); p.push(piece(B(), '#cbb584', { p: [0, 4.9, -7.6], s: [6.4, 0.6, 1.2], m: M.pierre })); for (const [x, z, a] of [[-4, 5, 0.3], [4.5, 4.5, -0.4], [0, 7.5, 0.1]]) p.push(piece(B(), '#c4ad7c', { p: [x, 0.35, z], r: [0, a, 0], s: [1.6, 0.7, 1], m: M.pierre })); rocher(-8.5, 4, 0.9, p, '#b8a276'); rocher(8.5, 4.5, 1.1, p, '#b8a276'); p.push(piece(B(), '#e6d3a8', { p: [0, 0.02, 0], s: [9, 0.04, 7], m: M.pierre })); },
  montagne: p => { for (const [x, z, r, h] of [[-8, -7, 4.2, 9], [7.5, -8, 5, 11], [0, -12, 6, 12], [-10.5, 0, 3, 6], [10.5, 1, 3.2, 6.5]]) p.push(piece(CON(r, h, 7), '#a89478', { p: [x, h / 2, z], m: M.pierre })), p.push(piece(CON(r * 0.35, h * 0.3, 7), '#f4f0e8', { p: [x, h * 0.86, z] })); for (let i = 0; i < 6; i++) p.push(piece(B(), '#c9b48a', { p: [-3 + i * 1.1, 0.04 + i * 0.12, 6 - i * 1.7], r: [0.1, 0.3 - i * 0.1, 0], s: [1.8, 0.08, 1.4] })); for (const [x, z] of [[-5.5, -4], [5.5, -3.5], [-4, 6.5]]) rocher(x, z, 0.8, p, '#8f7e60'); p.push(piece(SPH(0.4, 6, 5), '#9a8a6a', { p: [3.4, 0.35, 5.6] }), piece(SPH(0.3, 6, 5), '#9a8a6a', { p: [3.4, 0.9, 5.6] }), piece(SPH(0.2, 6, 5), '#9a8a6a', { p: [3.4, 1.35, 5.6] })); }
};
export function decor(nom) { if (DECORS[nom]) return new THREE.Mesh(fusion((() => { const p = []; DECORS[nom](p); return p; })()), mat); return decorMots(nom); }

// Le passage secret : deux piliers, un linteau, deux portes qui coulissent (ouvrir(k) : k de 0 à 1) ; au milieu, un piédestal pour le trésor
export function creerPassage() {
  const g = new THREE.Group(); g.position.set(0, 0, -7.4);
  const pierre = '#c9b48e', p = [piece(CYL(0.4, 0.46, 3.4, 10), pierre, { p: [-1.9, 1.7, 0], m: M.pierre }), piece(CYL(0.4, 0.46, 3.4, 10), pierre, { p: [1.9, 1.7, 0], m: M.pierre }), piece(B(), pierre, { p: [0, 3.55, 0], s: [4.8, 0.55, 0.9], m: M.pierre }), piece(B(), '#ffe08a', { p: [0, 3.55, 0.46], s: [0.5, 0.3, 0.05] }), piece(CYL(0.5, 0.6, 0.5, 12), '#d9c49a', { p: [0, 0.25, 1.8], m: M.pierre })];
  g.add(new THREE.Mesh(fusion(p), mat));
  const porte = x => { const m = new THREE.Mesh(fusion([piece(B(), '#7a5a3a', { p: [0, 1.5, 0], s: [1.6, 3.0, 0.22], m: M.bois }), piece(B(), '#e8b53a', { p: [x > 0 ? -0.5 : 0.5, 1.5, 0.13], s: [0.12, 0.6, 0.05] })]), mat); m.position.set(x, 0, 0); return m; };
  const gauche = porte(-0.8), droite = porte(0.8); g.add(gauche, droite);
  const lueur = new THREE.PointLight('#ffd666', 0, 8); lueur.position.set(0, 1.8, 1); g.add(lueur);
  g.userData.ouvrir = k => { gauche.position.x = -0.8 - k * 1.5; droite.position.x = 0.8 + k * 1.5; lueur.intensity = k * 3.5; };
  g.userData.ouvrir(0); g.userData.piedestal = new THREE.Vector3(0, 0.5, -7.4 + 1.8); return g;
}
