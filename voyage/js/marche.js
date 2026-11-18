// Le marché du village : trois étals, trois marchands (personnages fictifs), des objets utiles et des parures.
// On paie uniquement avec des Pièces de Nour gagnées en jouant. Prix affichés, confirmation avant chaque achat.
// Aucun hasard, aucune boîte mystère, aucun argent réel.
import * as THREE from 'three';
import { piece, fusion, materiau, M } from './formes.js?v=3';
import { Enfant } from './personnages.js?v=3';

const mat = materiau({ finesse: 1.4 });
const B = () => new THREE.BoxGeometry(1, 1, 1);
const CYL = (a, b, h, s = 10) => new THREE.CylinderGeometry(a, b, h, s);
const SPH = (r, w = 10, h = 8) => new THREE.SphereGeometry(r, w, h);

export { MARCHANDS, ARTICLES, article } from './catalogue.js?v=3';

// ---------- les étals ----------
function geoEtal(c1, c2, marchandises) {
  const p = [];
  p.push(piece(B(), '#8a5a35', { p: [0, 0.85, 0], s: [3.2, 0.12, 1.2] }));
  p.push(piece(B(), '#a77a4e', { p: [0, 0.45, 0.55], s: [3.2, 0.8, 0.08] }));
  for (const [x, z] of [[-1.5, -0.55], [1.5, -0.55], [-1.5, 0.55], [1.5, 0.55]]) p.push(piece(CYL(0.06, 0.07, 2.8, 6), '#6b4428', { p: [x, 1.4, z] }));
  for (let i = 0; i < 8; i++) p.push(piece(B(), i % 2 ? c1 : c2, { p: [-1.6 + i * 0.4 + 0.2, 2.75, 0.1], r: [0.28, 0, 0], s: [0.4, 0.05, 1.7] }));
  for (let i = 0; i < 8; i++) p.push(piece(new THREE.ConeGeometry(0.12, 0.25, 4), i % 2 ? c2 : c1, { p: [-1.6 + i * 0.4 + 0.2, 2.42, 0.98], r: [Math.PI, 0, 0] }));
  p.push(...marchandises);
  return fusion(p);
}
function marchandisesVoyage() {
  return [
    piece(CYL(0.16, 0.16, 0.05, 14), '#c9a14a', { p: [-1.1, 0.94, 0.1] }), piece(CYL(0.12, 0.12, 0.06, 14), '#fff8e7', { p: [-1.1, 0.96, 0.1] }),
    piece(B(), '#c94f3c', { p: [-1.1, 0.99, 0.1], s: [0.02, 0.01, 0.18] }),
    piece(B(), '#efe0bf', { p: [-0.4, 0.93, 0.15], r: [0, 0.3, 0], s: [0.6, 0.02, 0.45] }),                // carte
    piece(B(), '#a7744a', { p: [0.4, 1.1, 0.1], s: [0.4, 0.45, 0.25] }), piece(B(), '#8a5a35', { p: [0.4, 1.35, 0.1], s: [0.42, 0.06, 0.27] }), // sac
    piece(CYL(0.06, 0.06, 0.25, 8), '#3a3a4a', { p: [1.0, 0.98, 0.0], r: [0, 0, Math.PI / 2] }), piece(CYL(0.06, 0.06, 0.25, 8), '#3a3a4a', { p: [1.0, 0.98, 0.15], r: [0, 0, Math.PI / 2] }), // jumelles
    piece(CYL(0.1, 0.12, 0.25, 6), '#ffd36b', { p: [1.3, 1.95, 0.5] }), piece(new THREE.ConeGeometry(0.15, 0.15, 6), '#b8741f', { p: [1.3, 2.15, 0.5] })
  ];
}
function marchandisesTapis() {
  const t = [];
  [['#c94f3c', '#f5b942'], ['#2bb3c0', '#fff8e7'], ['#7b4fa0', '#f5b942'], ['#2d3a7a', '#ffe3a3']].forEach(([a, b], i) => {
    t.push(piece(CYL(0.13, 0.13, 1.0, 10), a, { p: [-1.2 + i * 0.5, 1.05, 0.1], r: [Math.PI / 2, 0, 0] }));
    t.push(piece(CYL(0.135, 0.135, 0.15, 10), b, { p: [-1.2 + i * 0.5, 1.05, 0.1], r: [Math.PI / 2, 0, 0] }));
  });
  for (let i = 0; i < 4; i++) { t.push(piece(CYL(0.1, 0.12, 0.25, 6), ['#ffd36b', '#ff9fb2', '#9fe1cb', '#ffe3a3'][i], { p: [-1.2 + i * 0.8, 2.2, 0.5] })); t.push(piece(new THREE.ConeGeometry(0.15, 0.15, 6), '#b8741f', { p: [-1.2 + i * 0.8, 2.4, 0.5] })); }
  t.push(piece(B(), '#c94f3c', { p: [0, 1.6, -0.62], s: [2.6, 1.3, 0.04] }), piece(B(), '#f5b942', { p: [0, 1.6, -0.6], s: [2.0, 0.9, 0.04] }));
  return t;
}
function marchandisesTissus() {
  const t = [];
  // piles de tissus pliés
  [['#e6d6b4', '#b8694a', '#7f9a6a'], ['#3d4f86', '#f1ece0', '#a8503e'], ['#8a6448', '#6f86a8', '#efe4cc']].forEach((pile, i) => pile.forEach((c, j) => t.push(piece(B(), c, { p: [-1.1 + i * 0.55, 0.96 + j * 0.09, 0.15], s: [0.45, 0.08, 0.35], m: M.tissu }))));
  // robes et tuniques suspendues
  [['#e9d8b8', '#2b8f9a'], ['#a8503e', '#efd9a8'], ['#cfa36a', '#8a6440'], ['#3d4f86', '#e8c87a']].forEach(([a, b], i) => {
    t.push(piece(CYL(0.12, 0.24, 0.9, 10), a, { p: [-1.1 + i * 0.72, 1.95, -0.45], m: M.tissu }), piece(B(), b, { p: [-1.1 + i * 0.72, 1.52, -0.45], s: [0.46, 0.04, 0.46] }));
  });
  t.push(piece(CYL(0.02, 0.02, 3.0, 6), '#6b4428', { p: [0, 2.45, -0.45], r: [0, 0, Math.PI / 2] }));
  t.push(piece(CYL(0.13, 0.13, 0.5, 10), '#efe4cc', { p: [1.2, 1.05, 0.1], r: [Math.PI / 2, 0, 0], m: M.laine }), piece(CYL(0.11, 0.11, 0.5, 10), '#b8503c', { p: [1.2, 1.25, 0.1], r: [Math.PI / 2, 0, 0], m: M.laine }));
  return t;
}
function marchandisesPoterie() {
  const t = [];
  for (let i = 0; i < 4; i++) t.push(piece(SPH(0.2, 12, 10), ['#c48452', '#b9652f', '#d9925a', '#a8582c'][i], { p: [-1.2 + i * 0.6, 1.1, 0.1], s: [1, 1.25, 1], m: M.terre }), piece(CYL(0.08, 0.11, 0.12, 10), '#a5552a', { p: [-1.2 + i * 0.6, 1.36, 0.1], m: M.terre }));
  for (let i = 0; i < 5; i++) t.push(piece(SPH(0.08, 10, 6), '#b9652f', { p: [-1.1 + i * 0.5, 1.83, -0.45], s: [1, 0.45, 1.4], m: M.terre }));
  t.push(piece(B(), '#8a6440', { p: [0, 1.75, -0.45], s: [3, 0.06, 0.35], m: M.bois }));
  for (let i = 0; i < 3; i++) t.push(piece(SPH(0.32, 14, 10), '#c48452', { p: [-1.0 + i * 1.0, 0.32, 0.95], s: [1, 1.3, 1], m: M.terre }));
  t.push(piece(CYL(0.3, 0.22, 0.05, 16), '#d9925a', { p: [0.9, 2.05, -0.45], r: [Math.PI / 2 - 0.2, 0, 0], m: M.terre }));
  return t;
}
function marchandisesChameau() {
  return [
    piece(B(), '#f5b942', { p: [-0.9, 1.05, 0.1], s: [0.8, 0.25, 0.6] }), piece(B(), '#c94f3c', { p: [-0.9, 0.95, 0.1], s: [0.95, 0.06, 0.7] }),
    piece(B(), '#a7744a', { p: [0.2, 1.05, 0.1], s: [0.5, 0.35, 0.2] }), piece(B(), '#2bb3c0', { p: [0.2, 1.05, 0.21], s: [0.3, 0.15, 0.02] }),
    ...[0, 1, 2, 3, 4].map(i => piece(SPH(0.07, 6, 5), ['#c94f3c', '#f5b942', '#2bb3c0', '#7b4fa0', '#ff9fb2'][i], { p: [0.8 + i * 0.13, 0.96, 0.15] })),
    piece(B(), '#5d8fd6', { p: [1.0, 1.8, -0.6], s: [0.5, 0.9, 0.03] }), piece(B(), '#5fae7a', { p: [1.3, 1.8, -0.6], s: [0.4, 0.9, 0.03] })
  ];
}

export function creerMarche({ scene, terrain, colliders, ombres }) {
  const H = (x, z) => terrain.hauteur(x, z);
  const ux = -0.928, uz = 0.371, px = -uz, pz = ux;      // le long du chemin du camp, juste après la porte ouest
  const etals = [
    { id: 'karim', d: 57, cote: 1, c: ['#2bb3c0', '#fff8e7'], m: marchandisesVoyage(), habit: { tunique: '#2d5b8a', cheche: '#fff3dc' } },
    { id: 'amina', d: 64, cote: -1, c: ['#c94f3c', '#f3e3c3'], m: marchandisesTapis(), habit: { tunique: '#7b4f6a', voile: '#efe2cf', peau: '#c98e66' } },
    { id: 'hassan', d: 71, cote: 1, c: ['#f5b942', '#fff3dc'], m: marchandisesChameau(), habit: { tunique: '#8a5a35', cheche: '#f6f0e2', peau: '#b97f58' } },
    { id: 'layla', d: 78, cote: -1, c: ['#3d4f86', '#efe4cc'], m: marchandisesTissus(), habit: { tunique: '#3d4f86', voile: '#e8e2d2', peau: '#d9a27a' } },
    { id: 'samira', d: 84, cote: 1, c: ['#b9652f', '#f3e3c3'], m: marchandisesPoterie(), habit: { tunique: '#a8582c', voile: '#efe4cc', peau: '#b97f58' } }
  ];
  const points = [];
  for (const e of etals) {
    const x = ux * e.d + px * 5.5 * e.cote, z = uz * e.d + pz * 5.5 * e.cote;
    const rot = Math.atan2(-px * e.cote, -pz * e.cote);   // l'étal regarde le chemin
    const m = new THREE.Mesh(geoEtal(e.c[0], e.c[1], e.m), mat);
    m.position.set(x, H(x, z), z); m.rotation.y = rot; m.castShadow = ombres; m.receiveShadow = ombres; scene.add(m);
    const v = new Enfant(ombres, { ...e.habit, pantalon: '#4a3a2a', sac: false });
    v.racine.scale.setScalar(1.25);
    const bx = x + px * e.cote * 1.0, bz = z + pz * e.cote * 1.0;
    v.racine.position.set(bx, H(bx, bz), bz); v.racine.rotation.y = rot; scene.add(v.racine);
    colliders.push({ x, z, r: 1.7 }, { x: bx, z: bz, r: 0.5 });
    points.push({ id: e.id, x: x - px * e.cote * 1.6, z: z - pz * e.cote * 1.6, r: 3, vendeur: v, rot });
  }
  return {
    centre: { x: ux * 70, z: uz * 70 },
    points,
    maj(dt, t, J) { for (const p of points) { p.vendeur.animer(dt, 0, t); const d = Math.hypot(J.x - p.x, J.z - p.z); if (d < 7) p.vendeur.tete.rotation.y = Math.max(-0.8, Math.min(0.8, Math.sin(t * 0.3) * 0.2)); } }
  };
}
