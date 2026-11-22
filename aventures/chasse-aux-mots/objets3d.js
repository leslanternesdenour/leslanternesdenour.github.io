// LA CHASSE AUX MOTS — modèles 3D : 18 objets du quotidien (formes simples, couleurs chaudes) et 6 décors de lieux.
// Tout est fabriqué avec les pièces communes du jeu (voyage/js/formes.js) : une seule géométrie fusionnée par objet et par décor (léger sur téléphone).
import * as THREE from 'three';
import { piece, fusion, materiau, M } from '../../voyage/js/formes.js?v=4';

const B = () => new THREE.BoxGeometry(1, 1, 1), CYL = (a, b, h, s = 12) => new THREE.CylinderGeometry(a, b, h, s), SPH = (r, w = 12, h = 8) => new THREE.SphereGeometry(r, w, h);
const TOR = (r, t, a = Math.PI * 2) => new THREE.TorusGeometry(r, t, 8, 20, a), CON = (r, h, s = 10) => new THREE.ConeGeometry(r, h, s);
export const mat = materiau();

// Chaque fabrique renvoie des pièces posées sur le sol (y = 0), objet d'environ 0,6 à 1 de haut
const FORMES = {
  lanterne: () => [piece(CYL(0.22, 0.28, 0.1), '#b9822a'), piece(CYL(0.22, 0.2, 0.5), '#38d3c4'), piece(CYL(0.24, 0.24, 0.05), '#e8b53a', { p: [0, 0.3, 0] }), piece(CYL(0.24, 0.24, 0.05), '#e8b53a', { p: [0, 0.05, 0] }),
    piece(CON(0.24, 0.18), '#e8b53a', { p: [0, 0.65, 0] }), piece(TOR(0.12, 0.02, Math.PI), '#e8b53a', { p: [0, 0.78, 0] }), piece(SPH(0.1), '#ffe08a', { p: [0, 0.3, 0] })].map(g => g),
  livre: () => [piece(B(), '#a8403a', { p: [0, 0.07, 0], s: [0.62, 0.14, 0.46] }), piece(B(), '#f5ecd0', { p: [0.02, 0.07, 0], s: [0.56, 0.1, 0.42] }), piece(B(), '#e8b53a', { p: [-0.3, 0.07, 0], s: [0.03, 0.15, 0.47] }), piece(B(), '#e8b53a', { p: [0, 0.145, 0], s: [0.3, 0.01, 0.2] })],
  datte: () => [0, 1, 2].map(i => piece(SPH(0.1, 10, 8), i === 1 ? '#7a3a1c' : '#8f4a22', { p: [(i - 1) * 0.2, 0.1, i === 1 ? 0.12 : 0], s: [0.8, 0.8, 1.7] })).concat([piece(CYL(0.22, 0.26, 0.1), '#c9a060', { p: [0, 0.04, 0.05] })]),
  cruche: () => [piece(SPH(0.28, 14, 10), '#c56a3a', { p: [0, 0.3, 0], s: [1, 1.1, 1] }), piece(CYL(0.1, 0.16, 0.22), '#b85a2c', { p: [0, 0.65, 0] }), piece(TOR(0.12, 0.03, Math.PI), '#9a4a22', { p: [0.2, 0.45, 0], r: [0, 0, -Math.PI / 2] }), piece(TOR(0.28, 0.03), '#e8b53a', { p: [0, 0.4, 0], r: [Math.PI / 2, 0, 0] })],
  tapis: () => [piece(B(), '#9a3a4a', { p: [0, 0.02, 0], s: [1.0, 0.04, 0.66] }), piece(B(), '#f1d27a', { p: [0, 0.045, 0], s: [0.86, 0.01, 0.52] }), piece(B(), '#2f6f8f', { p: [0, 0.05, 0], s: [0.6, 0.01, 0.3] }), piece(B(), '#e8b53a', { p: [0, 0.055, 0], s: [0.2, 0.01, 0.1] })],
  pomme: () => [piece(SPH(0.26, 14, 10), '#c8352f', { p: [0, 0.27, 0] }), piece(CYL(0.02, 0.02, 0.12, 6), '#5a3a1c', { p: [0, 0.56, 0] }), piece(SPH(0.07, 8, 6), '#4fa645', { p: [0.08, 0.58, 0], s: [1.4, 0.5, 0.8] })],
  pain: () => [piece(SPH(0.3, 14, 8), '#d49a50', { p: [0, 0.14, 0], s: [1.5, 0.6, 1] }), ...[-0.25, 0, 0.25].map(x => piece(B(), '#b9783a', { p: [x, 0.3, 0], r: [0, 0.6, 0], s: [0.04, 0.02, 0.3] }))],
  cle: () => [piece(TOR(0.12, 0.035), '#e8b53a', { p: [-0.3, 0.1, 0], r: [Math.PI / 2, 0, 0] }), piece(B(), '#e8b53a', { p: [0.05, 0.1, 0], s: [0.55, 0.06, 0.06] }), piece(B(), '#e8b53a', { p: [0.3, 0.1, 0.07], s: [0.06, 0.06, 0.14] }), piece(B(), '#e8b53a', { p: [0.2, 0.1, 0.07], s: [0.06, 0.06, 0.1] })],
  panier: () => [piece(CYL(0.36, 0.26, 0.34, 14), '#c89a52', { p: [0, 0.17, 0], m: M.bois }), piece(TOR(0.35, 0.03), '#a67a38', { p: [0, 0.34, 0], r: [Math.PI / 2, 0, 0] }), piece(TOR(0.34, 0.03, Math.PI), '#a67a38', { p: [0, 0.34, 0] }), piece(SPH(0.12), '#c8352f', { p: [-0.1, 0.38, 0.05] }), piece(SPH(0.11), '#e9b84a', { p: [0.1, 0.38, -0.04] })],
  rose: () => [piece(CYL(0.025, 0.03, 0.55, 6), '#3f8f3a', { p: [0, 0.28, 0] }), piece(SPH(0.17, 10, 8), '#d83a5a', { p: [0, 0.62, 0] }), piece(SPH(0.12, 8, 6), '#b82a48', { p: [0, 0.68, 0] }), piece(SPH(0.08, 6, 4), '#4fa645', { p: [0.1, 0.3, 0], s: [1.8, 0.4, 0.9] })],
  etoile: () => { const p = []; for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; p.push(piece(CON(0.1, 0.34, 4), '#ffd666', { p: [Math.sin(a) * 0.2, 0.32 + Math.cos(a) * 0.2, 0], r: [0, 0, -a] })); } p.push(piece(SPH(0.16, 8, 6), '#ffe08a', { p: [0, 0.32, 0], s: [1, 1, 0.5] })); return p; },
  lune: () => [piece(TOR(0.28, 0.1, Math.PI * 1.35), '#f1e7c0', { p: [0, 0.4, 0], r: [0, 0, 0.9], s: [1, 1, 1.2] }), piece(SPH(0.05, 6, 4), '#ffe08a', { p: [0.2, 0.55, 0] })],
  tasse: () => [piece(CYL(0.2, 0.15, 0.26, 14), '#f2eadb', { p: [0, 0.15, 0] }), piece(CYL(0.17, 0.17, 0.02, 14), '#8a5a2a', { p: [0, 0.27, 0] }), piece(TOR(0.09, 0.025, Math.PI), '#f2eadb', { p: [0.2, 0.16, 0], r: [0, 0, -Math.PI / 2] }), piece(CYL(0.26, 0.26, 0.03, 14), '#2f6f8f', { p: [0, 0.015, 0] })],
  plume: () => [piece(CYL(0.02, 0.02, 0.8, 6), '#f0e8d0', { p: [0, 0.1, 0], r: [0, 0, 1.2] }), piece(SPH(0.12, 8, 6), '#e8e0c8', { p: [0.2, 0.28, 0], s: [0.5, 1.8, 0.2], r: [0, 0, 0.35] }), piece(CON(0.03, 0.12, 6), '#2a1c10', { p: [-0.3, 0.02, 0], r: [0, 0, 1.6] })],
  raisin: () => { const p = [piece(CYL(0.015, 0.02, 0.3, 6), '#5a3a1c', { p: [0, 0.65, 0] })]; let k = 0; for (let r = 0; r < 4; r++) for (let c = 0; c <= 2 - Math.floor(r / 2); c++) p.push(piece(SPH(0.1, 8, 6), k++ % 2 ? '#6a3a8f' : '#7a4aa0', { p: [(c - (2 - Math.floor(r / 2)) / 2) * 0.2, 0.52 - r * 0.15, 0.02 * r] })); p.push(piece(SPH(0.09, 6, 4), '#4fa645', { p: [0.12, 0.72, 0], s: [1.6, 0.4, 1] })); return p; },
  coussin: () => [piece(SPH(0.4, 14, 8), '#b8403a', { p: [0, 0.16, 0], s: [1, 0.42, 1] }), piece(CYL(0.1, 0.1, 0.02, 10), '#e8b53a', { p: [0, 0.34, 0] }), ...[0, 1, 2, 3].map(i => piece(SPH(0.06, 6, 4), '#e8b53a', { p: [Math.cos(i * 1.57) * 0.38, 0.14, Math.sin(i * 1.57) * 0.38] }))],
  poisson: () => [piece(SPH(0.28, 12, 8), '#3aa0c8', { p: [0, 0.3, 0], s: [1.6, 0.8, 0.5] }), piece(CON(0.2, 0.28, 3), '#2a80a8', { p: [-0.5, 0.3, 0], r: [0, 0, Math.PI / 2], s: [1, 1, 0.3] }), piece(SPH(0.05, 6, 4), '#ffffff', { p: [0.3, 0.36, 0.13] }), piece(SPH(0.025, 6, 4), '#1a1a1a', { p: [0.32, 0.36, 0.16] }), piece(CON(0.08, 0.2, 3), '#2a80a8', { p: [0, 0.5, 0], s: [1, 1, 0.3] })],
  oiseau: () => [piece(SPH(0.22, 12, 8), '#e9a23a', { p: [0, 0.32, 0], s: [1.3, 1, 0.9] }), piece(SPH(0.13, 10, 8), '#e9a23a', { p: [0.24, 0.5, 0] }), piece(CON(0.05, 0.14, 6), '#f27a2a', { p: [0.4, 0.5, 0], r: [0, 0, -Math.PI / 2] }), piece(SPH(0.025, 6, 4), '#1a1a1a', { p: [0.3, 0.55, 0.1] }), piece(CON(0.1, 0.3, 3), '#c98a2a', { p: [-0.32, 0.36, 0], r: [0, 0, Math.PI / 2 + 0.3], s: [1, 1, 0.3] }), piece(CYL(0.015, 0.015, 0.15, 4), '#7a5a3a', { p: [0, 0.07, 0.04] })]
};

const cacheGeo = new Map();
export function geometrieObjet(id) { if (!cacheGeo.has(id)) cacheGeo.set(id, fusion(FORMES[id]())); return cacheGeo.get(id); }
export function creerObjet(id) { const m = new THREE.Mesh(geometrieObjet(id), mat); m.userData.id = id; return m; }
export const IDS_OBJETS = Object.keys(FORMES);

// ------- décors (une seule géométrie par lieu) : le centre reste dégagé, les objets sont posés sur les « emplacements » -------
const palmier = (x, z, h = 3.2, p) => { p.push(piece(CYL(0.12, 0.2, h, 8), '#7a5a3a', { p: [x, h / 2, z], m: M.bois })); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; p.push(piece(CON(0.22, 1.7, 4), i % 2 ? '#3f8f3a' : '#4fa645', { p: [x + Math.cos(a) * 0.8, h + 0.1, z + Math.sin(a) * 0.8], r: [Math.sin(a) * 1.15, 0, -Math.cos(a) * 1.15] })); } };
const etal = (x, z, rot, c1, c2, p) => { const co = Math.cos(rot), si = Math.sin(rot); p.push(piece(B(), '#8a6440', { p: [x, 0.5, z], r: [0, rot, 0], s: [2.6, 1.0, 1.1], m: M.bois }));
  for (let i = 0; i < 6; i++) p.push(piece(B(), i % 2 ? c1 : c2, { p: [x - si * 0.0 + co * (i - 2.5) * 0.45, 2.45, z - si * (i - 2.5) * 0.45 * 0 + (-si) * (i - 2.5) * 0.45], r: [0.15, rot, 0], s: [0.45, 0.06, 1.7] }));
  for (const s of [-1, 1]) p.push(piece(CYL(0.06, 0.06, 2.4, 6), '#6b4a30', { p: [x + co * s * 1.2 + si * 0.7, 1.2, z - si * s * 1.2 + co * 0.7], m: M.bois })); };
const mur = (x, z, w, h, rot, c, p, d = 0.45) => p.push(piece(B(), c, { p: [x, h / 2, z], r: [0, rot, 0], s: [w, h, d], m: M.terre }));
const maison = (x, z, rot, c, p) => { mur(x, z, 3.6, 2.6, rot, c, p, 3.4); p.push(piece(B(), '#7a5a3a', { p: [x + Math.sin(rot) * 1.72, 0.85, z + Math.cos(rot) * 1.72], r: [0, rot, 0], s: [0.9, 1.7, 0.08], m: M.bois })); p.push(piece(B(), '#c9aa78', { p: [x, 2.7, z], r: [0, rot, 0], s: [3.8, 0.2, 3.6], m: M.terre })); };
const etagere = (x, z, rot, p) => { const co = Math.cos(rot), si = Math.sin(rot); p.push(piece(B(), '#7a5a3a', { p: [x, 1.4, z], r: [0, rot, 0], s: [3.2, 2.8, 0.5], m: M.bois }));
  const cols = ['#a8403a', '#2f6f8f', '#e8b53a', '#4f9a4a', '#7a5ac0', '#c8664a']; for (let r = 0; r < 4; r++) for (let i = 0; i < 9; i++) p.push(piece(B(), cols[(i + r * 2) % 6], { p: [x + co * (i - 4) * 0.33 - si * 0.28, 0.45 + r * 0.65, z - si * (i - 4) * 0.33 - co * 0.28 * 0 + co * 0.28 * 0 - si * 0], r: [0, rot, 0], s: [0.24, 0.5, 0.3] })); };
const DECORS = {
  marche: p => { etal(-5, -5.5, 0.3, '#c8352f', '#f1e3c0', p); etal(5.2, -5.4, -0.3, '#2f6f8f', '#f1e3c0', p); etal(0, -8, 0, '#e8b53a', '#f1e3c0', p); for (const [x, z] of [[-7.5, 1], [7.5, 2], [-3, 7.5], [4, 7.8]]) { p.push(piece(B(), '#a67a38', { p: [x, 0.35, z], s: [1, 0.7, 0.8], m: M.bois })); p.push(piece(B(), '#c9a96e', { p: [x, 0.8, z], s: [0.7, 0.2, 0.5] })); } palmier(-9, -2, 3.4, p); },
  maison: p => { mur(0, -8, 14, 4, 0, '#e8d4a8', p); mur(-7, -1, 14, 4, Math.PI / 2, '#ecd9b0', p); mur(7, -1, 14, 4, Math.PI / 2, '#e4cc9c', p); p.push(piece(B(), '#7a5a3a', { p: [0, 1.2, -7.7], s: [1.6, 2.4, 0.1], m: M.bois })); p.push(piece(B(), '#2f6f8f', { p: [-4, 2.2, -7.7], s: [1.4, 1.2, 0.1] })); p.push(piece(B(), '#9a3a4a', { p: [0, 0.03, 0], s: [8, 0.05, 6], m: M.laine })); p.push(piece(B(), '#8a6440', { p: [-5, 0.4, -5.5], s: [2.4, 0.8, 1.2], m: M.bois })); p.push(piece(B(), '#8a6440', { p: [5.5, 0.9, -5.5], s: [1.6, 1.8, 0.7], m: M.bois })); },
  jardin: p => { for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; p.push(piece(SPH(0.9, 8, 6), i % 3 ? '#4fa645' : '#3f8f3a', { p: [Math.cos(a) * 9.5, 0.6, Math.sin(a) * 9.5], s: [1.2, 0.9, 1.2] })); } palmier(-7, -4, 3.6, p); palmier(7.5, -3, 3.2, p); palmier(0, -9, 4, p);
    for (let i = 0; i < 40; i++) { const a = i * 2.4, d = 3 + (i % 7) * 1.0; p.push(piece(SPH(0.09, 6, 4), ['#d83a5a', '#ffd666', '#ffffff', '#b66ad8'][i % 4], { p: [Math.cos(a) * d, 0.12, Math.sin(a) * d] })); }
    p.push(piece(CYL(1.2, 1.4, 0.6, 16), '#c9b48e', { p: [0, 0.3, 0], m: M.pierre })); p.push(piece(CYL(1.0, 1.0, 0.05, 16), '#4fb3c4', { p: [0, 0.58, 0] })); },
  bibliotheque: p => { etagere(0, -8.5, 0, p); etagere(-7.5, -3, 1.2, p); etagere(7.5, -3, -1.2, p); p.push(piece(B(), '#b88a4a', { p: [0, 0.02, 0], s: [9, 0.04, 7], m: M.laine })); p.push(piece(CYL(1.4, 1.4, 0.8, 14), '#7a5a3a', { p: [0, 0.4, 0], m: M.bois })); for (const x of [-4, 4]) { p.push(piece(CYL(0.08, 0.1, 2.6, 6), '#6b4a30', { p: [x, 1.3, 3.5], m: M.bois })); p.push(piece(SPH(0.22, 8, 6), '#ffe08a', { p: [x, 2.7, 3.5] })); } },
  oasis: p => { p.push(piece(CYL(4.2, 4.4, 0.1, 24), '#3fb3c8', { p: [0, 0.06, 0] })); for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; p.push(piece(SPH(0.5, 6, 5), '#b8a47a', { p: [Math.cos(a) * 4.7, 0.2, Math.sin(a) * 4.7], s: [1.3, 0.6, 1] })); } palmier(-6, -4, 4, p); palmier(6.5, -3.5, 3.6, p); palmier(-2, -7.5, 4.2, p); palmier(5, 5.5, 3.2, p); p.push(piece(CON(2.4, 3, 6), '#c9ab72', { p: [0, 1.5, -11] })); },
  village: p => { maison(-7.5, -5, 0.5, '#e2c896', p); maison(7.5, -5, -0.5, '#eed3a4', p); maison(0, -10, 0, '#e8cf9e', p); p.push(piece(CYL(1.0, 1.1, 0.8, 14), '#c9b48e', { p: [0, 0.4, 0], m: M.pierre })); p.push(piece(CYL(0.8, 0.8, 0.05, 14), '#4fb3c4', { p: [0, 0.78, 0] })); for (const x of [-3.2, 3.2]) { p.push(piece(CYL(0.08, 0.1, 2.6, 6), '#6b4a30', { p: [x, 1.3, 4.5], m: M.bois })); p.push(piece(SPH(0.22, 8, 6), '#ffe08a', { p: [x, 2.7, 4.5] })); } palmier(10, 1, 3.4, p); }
};
export function creerDecor(lieu) { const p = []; DECORS[lieu](p); return new THREE.Mesh(fusion(p), mat); }

// 8 emplacements par lieu : { x, z, y } sur l'anneau, autour du centre (l'enfant tourne pour tout voir)
export function emplacements(lieu) {
  const E = []; const R = [3.3, 5.4, 4.2, 6.2, 3.6, 5.8, 4.6, 6.6];
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + (lieu.length % 3) * 0.3; E.push({ x: Math.sin(a) * R[i], z: -Math.cos(a) * R[i] + 1, y: 0, a }); }
  return E;
}
