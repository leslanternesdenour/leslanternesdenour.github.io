// LE DÉCOR DE L'ENCLOS (écurie de Nabil) : mangeoire à foin, litière de paille, vrai abreuvoir avec de l'eau, et les petits tapis de paille des places de repos.
// Les emplacements viennent de enclos-plan.js. Aucune logique de jeu ici : seulement des formes.
import * as THREE from 'three';
import { piece, fusion, M } from './formes.js?v=4';
const B = () => new THREE.BoxGeometry(1, 1, 1);
const CYL = (rt, rb, h, s = 10) => new THREE.CylinderGeometry(rt, rb, h, s);
const SPH = (r, w = 12, h = 8) => new THREE.SphereGeometry(r, w, h);

// Foin et végétaux pour les montures : une mangeoire de bois de palmier, des bottes de foin, des dattes et des feuilles vertes
export function geoFoin() {
  const p = [], foin = '#d8b95a', foin2 = '#c9a748';
  const bois = '#8a6440';
  // la mangeoire (fond + parois) remplie de foin
  p.push(piece(B(), bois, { p: [0, 0.28, 0], s: [2.0, 0.08, 0.9], m: M.bois }));
  for (const sz of [-1, 1]) p.push(piece(B(), bois, { p: [0, 0.5, sz * 0.43], s: [2.0, 0.42, 0.07], m: M.bois }));
  for (const sx of [-1, 1]) p.push(piece(B(), bois, { p: [sx * 0.97, 0.5, 0], s: [0.07, 0.42, 0.8], m: M.bois }));
  for (const x of [-0.85, 0.85]) for (const z of [-0.35, 0.35]) p.push(piece(CYL(0.06, 0.07, 0.3, 6), bois, { p: [x, 0.14, z], m: M.bois }));
  p.push(piece(B(), foin, { p: [0, 0.6, 0], s: [1.82, 0.3, 0.74] }));
  for (let i = 0; i < 14; i++) p.push(piece(B(), i % 2 ? foin : foin2, { p: [-0.8 + (i % 7) * 0.27, 0.78, (i < 7 ? -0.18 : 0.2)], r: [0, i * 0.7, 0.3], s: [0.34, 0.05, 0.05] }));
  // feuilles de palmier vertes et dattes posées sur le foin
  for (let i = 0; i < 4; i++) p.push(piece(new THREE.ConeGeometry(0.1, 0.55, 4), i % 2 ? '#3f8f3a' : '#4fa645', { p: [-0.6 + i * 0.4, 0.86, 0.0], r: [0.2, i, 1.2 - i * 0.2] }));
  for (let i = 0; i < 6; i++) p.push(piece(SPH(0.07, 6, 4), '#a85a22', { p: [0.1 + (i % 3) * 0.18, 0.79, -0.1 + Math.floor(i / 3) * 0.22] }));
  // deux bottes de foin liées avec une corde, à côté
  for (const [x, y, z, r] of [[1.55, 0.27, 0.3, 0.2], [1.55, 0.27, -0.45, -0.1], [1.5, 0.78, -0.08, 0.05]]) {
    p.push(piece(B(), foin, { p: [x, y, z], r: [0, r, 0], s: [0.9, 0.5, 0.6] }));
    p.push(piece(B(), '#8a7a52', { p: [x, y, z], r: [0, r, 0], s: [0.92, 0.52, 0.06] }));
  }
  return fusion(p);
}

// La litière de paille : un coin calme, bordé de bois de palmier, pour se reposer ou dormir
export function geoLitiere() {
  const p = [], paille = '#d9bd6a', paille2 = '#c4a354';
  p.push(piece(CYL(1.95, 2.0, 0.1, 20), paille, { p: [0, 0.05, 0] }));
  p.push(piece(CYL(1.55, 1.6, 0.06, 20), paille2, { p: [0, 0.12, 0] }));
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; p.push(piece(CYL(0.1, 0.11, 0.3, 6), '#8a6440', { p: [Math.cos(a) * 2.0, 0.15, Math.sin(a) * 2.0], m: M.bois })); }
  for (let i = 0; i < 30; i++) { const a = i * 2.39, d = 0.3 + (i % 9) * 0.17; p.push(piece(B(), i % 2 ? paille : paille2, { p: [Math.cos(a) * d, 0.17, Math.sin(a) * d], r: [0, a, 0], s: [0.5, 0.03, 0.04] })); }
  return fusion(p);
}

// Le vrai abreuvoir : un bassin de pierre (fond + quatre parois) ; l'eau est une surface à part, posée sous le bord.
export const EAU_BASSIN = { y: 0.47, l: 2.14, w: 0.54 };
export function geoAbreuvoir() {
  const pierre = '#c9b48e', p = [];
  p.push(piece(B(), pierre, { p: [0, 0.06, 0], s: [2.4, 0.12, 0.8], m: M.pierre }));
  for (const sz of [-1, 1]) p.push(piece(B(), pierre, { p: [0, 0.3, sz * 0.33], s: [2.4, 0.6, 0.14], m: M.pierre }));
  for (const sx of [-1, 1]) p.push(piece(B(), pierre, { p: [sx * 1.13, 0.3, 0], s: [0.14, 0.6, 0.52], m: M.pierre }));
  return fusion(p);
}
export function creerEauBassin(couleur = '#4fb3c4') {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(EAU_BASSIN.l, EAU_BASSIN.w), new THREE.MeshPhongMaterial({ color: couleur, shininess: 160, specular: '#fff6e0', transparent: true, opacity: 0.9 }));
  m.rotation.x = -Math.PI / 2; m.name = 'eau-enclos'; return m;
}

// Un tapis de paille pour une place de repos (visible même quand la place est libre)
export function geoTapis(grand = false) {
  const p = [], paille = '#d9bd6a', paille2 = '#c4a354', L = grand ? 4.4 : 3.0, W = grand ? 3.0 : 1.7;
  p.push(piece(B(), paille, { p: [0, 0.03, 0], s: [L, 0.05, W] }));
  for (let i = 0; i < 10; i++) p.push(piece(B(), i % 2 ? paille : paille2, { p: [((i * 0.37) % 1 - 0.5) * (L - 0.5), 0.07, ((i * 0.61) % 1 - 0.5) * (W - 0.4)], r: [0, i * 0.8, 0], s: [0.55, 0.03, 0.05] }));
  return fusion(p);
}
