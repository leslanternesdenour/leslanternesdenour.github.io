// Les décors du monde, construits zone par zone quand l'enfant s'en approche (chargement progressif).
// Tout est dessiné avec des formes simples fusionnées : léger, net, et facile à faire évoluer.
import * as THREE from 'three';
import { piece, fusion, placer, hasard, materiau, temps, M } from './formes.js?v=4';
import { LIEUX, CHEMINS, PISTES, distanceChemins, lisse, fbm, LIMITE } from './terrain.js?v=3';

const deg = d => d * Math.PI / 180;
const B = () => new THREE.BoxGeometry(1, 1, 1);
const CYL = (rt, rb, h, s = 10) => new THREE.CylinderGeometry(rt, rb, h, s);
const SPH = (r, w = 12, h = 8, phiLen = Math.PI * 2, thetaLen = Math.PI) => new THREE.SphereGeometry(r, w, h, 0, phiLen, 0, thetaLen);

// ---------- modèles ----------
function geoPalmier(R) {
  const p = [], courbe = 0.25 + R() * 0.5, haut = 5 + R() * 2.5, n = 6;
  let x = 0, y = 0;
  for (let i = 0; i < n; i++) {
    const h = haut / n, dx = courbe * (i / n) * 0.9;
    p.push(piece(CYL(0.2 - i * 0.012, 0.24 - i * 0.012, h * 1.02, 7), i % 2 ? '#8a6440' : '#7a5636', { p: [x + dx / 2, y + h / 2, 0], r: [0, 0, -dx * 0.6] }));
    x += dx; y += h;
  }
  const feuille = new THREE.ConeGeometry(0.55, 3.4, 4, 1); feuille.translate(0, 1.7, 0);
  const nf = 8;
  for (let i = 0; i < nf; i++) {
    const a = i / nf * Math.PI * 2 + R() * 0.3;
    p.push(piece(feuille, i % 2 ? '#3f8f3a' : '#4fa645', { p: [x, y, 0], r: [0, a, -(Math.PI / 2 + 0.25 + R() * 0.35)], s: [0.22, 1, 1] }));
  }
  const dattes = SPH(0.16, 6, 4);
  for (let i = 0; i < 5; i++) p.push(piece(dattes, '#c8702a', { p: [x + Math.cos(i * 1.3) * 0.32, y - 0.25 - (i % 2) * 0.15, Math.sin(i * 1.3) * 0.32] }));
  return fusion(p);
}

function geoRocher(R, couleur = '#a98e72', s = [1, 1, 1]) {
  const g = new THREE.DodecahedronGeometry(1, 0);
  const pos = g.attributes.position, k = R() * 100;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const f = 0.8 + 0.4 * fbm(x * 1.7 + k, z * 1.7 + y * 1.3, 2);
    pos.setXYZ(i, x * f, Math.max(-0.35, y) * f, z * f);
  }
  g.computeVertexNormals();
  return fusion([piece(g, couleur, { p: [0, 0.3 * s[1], 0], s })]);
}

// Une formation de grès en strates : des dalles empilées, un peu décalées, comme les falaises d'Arabie
function geoStrates(R, couleurs = ['#a0705a', '#8e5e4a', '#b98a68', '#7a5848']) {
  const p = [], n = 3 + Math.floor(R() * 3);
  let y = 0, l = 1.6 + R() * 0.6;
  for (let i = 0; i < n; i++) {
    const g = new THREE.DodecahedronGeometry(1, 0), pos = g.attributes.position, k = R() * 100;
    for (let j = 0; j < pos.count; j++) { const x = pos.getX(j), yy = pos.getY(j), z = pos.getZ(j), f = 0.85 + 0.3 * fbm(x * 1.5 + k, z * 1.5 + yy, 2); pos.setXYZ(j, x * f, yy * f, z * f); }
    g.computeVertexNormals();
    const h = 0.35 + R() * 0.3;
    p.push(piece(g, couleurs[i % couleurs.length], { p: [(R() - 0.5) * 0.35, y + h, (R() - 0.5) * 0.35], r: [0, R() * 3, (R() - 0.5) * 0.12], s: [l, h, l * (0.7 + R() * 0.3)], m: M.pierre }));
    y += h * 1.7; l *= 0.72 + R() * 0.2;
  }
  return fusion(p);
}

function geoMaison(w, d, h, mur, dome, R) {
  // Chaque maison tire ses propres détails : étage, terrasse, porte, fenêtres, auvent, balcon, escalier…
  const p = [], bois = R() > 0.5 ? '#6b4428' : '#7b4f2e', bord = '#f6ead2';
  const toile = [['#c94f3c', '#f3e3c3'], ['#2bb3c0', '#fff8e7'], ['#f5b942', '#fff3dc'], ['#7b4fa0', '#f3e3c3']][Math.floor(R() * 4)];
  p.push(piece(B(), mur, { p: [0, h / 2, 0], s: [w, h, d] }));
  p.push(piece(B(), '#d8c2a0', { p: [0, 0.2, 0], s: [w + 0.15, 0.4, d + 0.15] }));                 // soubassement
  // terrasse : rebord simple ou créneaux
  if (R() > 0.5) {
    const n = Math.max(3, Math.round(w / 0.9));
    for (let i = 0; i < n; i++) for (const sz of [-1, 1]) p.push(piece(B(), bord, { p: [-w / 2 + (i + 0.5) * w / n, h + 0.3, sz * d / 2], s: [w / n * 0.55, 0.6, 0.25] }));
    p.push(piece(B(), bord, { p: [0, h + 0.05, 0], s: [w + 0.2, 0.15, d + 0.2] }));
  } else p.push(piece(B(), bord, { p: [0, h + 0.15, 0], s: [w + 0.3, 0.3, d + 0.3] }));
  // la porte : encadrement, arc, clous dorés
  const pz = d / 2 + 0.03;
  p.push(piece(B(), '#efe0bf', { p: [0, 1.15, pz], s: [1.7, 2.4, 0.08] }));
  p.push(piece(B(), bois, { p: [0, 1.05, pz + 0.03], s: [1.2, 2.1, 0.1] }));
  p.push(piece(CYL(0.6, 0.6, 0.1, 14), bois, { p: [0, 2.1, pz + 0.03], r: [Math.PI / 2, 0, 0], s: [1, 1, 1] }));
  if (R() > 0.4) for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) p.push(piece(SPH(0.035, 5, 4), '#f5b942', { p: [-0.35 + i * 0.35, 0.4 + j * 0.45, pz + 0.09] }));
  p.push(piece(B(), toile[0], { p: [0, 0.03, pz + 0.75], s: [1.6, 0.06, 1.2] }));                    // tapis devant la porte
  // fenêtres : arquées avec volets, ou moucharabieh en bois
  const style = R();
  for (const sx of [-1, 1]) {
    const fx = sx * w * 0.3, fy = h * 0.6;
    if (style > 0.5) {
      p.push(piece(B(), '#2d5b8a', { p: [fx, fy, pz], s: [0.7, 0.85, 0.06] }));
      p.push(piece(CYL(0.35, 0.35, 0.06, 10), '#2d5b8a', { p: [fx, fy + 0.42, pz], r: [Math.PI / 2, 0, 0] }));
      for (const vx of [-1, 1]) p.push(piece(B(), toile[0] === '#c94f3c' ? '#2bb3c0' : '#c94f3c', { p: [fx + vx * 0.55, fy, pz + 0.04], s: [0.32, 0.9, 0.05] }));
    } else {
      p.push(piece(B(), bois, { p: [fx, fy, pz + 0.12], s: [0.95, 1.1, 0.25] }));
      for (let i = 0; i < 4; i++) p.push(piece(B(), '#a77a4e', { p: [fx, fy - 0.4 + i * 0.27, pz + 0.26], s: [0.85, 0.05, 0.04] }));
      for (let i = 0; i < 3; i++) p.push(piece(B(), '#a77a4e', { p: [fx - 0.3 + i * 0.3, fy, pz + 0.26], s: [0.05, 1.0, 0.04] }));
    }
    p.push(piece(B(), '#f5b942', { p: [fx, fy - 0.52, pz + 0.07], s: [1.0, 0.08, 0.14] }));
  }
  // auvent de toile rayée au-dessus de la porte
  if (R() > 0.35) for (let i = 0; i < 5; i++) p.push(piece(B(), i % 2 ? toile[0] : toile[1], { p: [-0.8 + i * 0.4, 2.75, pz + 0.55], r: [0.38, 0, 0], s: [0.4, 0.05, 1.2] }));
  // lanterne près de la porte
  p.push(piece(B(), '#4a3a5a', { p: [0.95, 2.4, pz + 0.18], s: [0.05, 0.05, 0.35] }));
  p.push(piece(CYL(0.1, 0.12, 0.26, 6), '#ffd36b', { p: [0.95, 2.18, pz + 0.33] }));
  p.push(piece(new THREE.ConeGeometry(0.15, 0.14, 6), '#d9952a', { p: [0.95, 2.38, pz + 0.33] }));
  // un étage, parfois avec un balcon de bois
  if (R() > 0.45) {
    const w2 = w * 0.55, d2 = d * 0.6, h2 = 2.4, ox = (R() - 0.5) * (w - w2) * 0.8;
    p.push(piece(B(), mur, { p: [ox, h + h2 / 2, -d * 0.15], s: [w2, h2, d2] }));
    p.push(piece(B(), bord, { p: [ox, h + h2 + 0.12, -d * 0.15], s: [w2 + 0.25, 0.25, d2 + 0.25] }));
    p.push(piece(B(), '#2d5b8a', { p: [ox, h + 1.2, -d * 0.15 + d2 / 2 + 0.03], s: [0.7, 1.0, 0.06] }));
    if (R() > 0.4) {
      const bz = -d * 0.15 + d2 / 2 + 0.45;
      p.push(piece(B(), bois, { p: [ox, h + 0.55, bz], s: [1.6, 0.12, 0.8] }));
      for (let i = 0; i < 6; i++) p.push(piece(B(), '#a77a4e', { p: [ox - 0.75 + i * 0.3, h + 0.9, bz + 0.38], s: [0.06, 0.6, 0.06] }));
      p.push(piece(B(), bois, { p: [ox, h + 1.22, bz + 0.38], s: [1.6, 0.08, 0.08] }));
    }
    if (dome) {
      p.push(piece(SPH(0.95, 14, 8, Math.PI * 2, Math.PI / 2), dome, { p: [ox, h + h2 + 0.25, -d * 0.15] }));
      dome = null;
    }
  }
  // escalier extérieur vers la terrasse
  if (R() > 0.55) {
    const sx = w / 2 + 0.45, n = Math.round(h / 0.4);
    for (let i = 0; i < n; i++) p.push(piece(B(), '#e2cba4', { p: [sx, i * 0.4 + 0.2, d / 2 - 0.4 - i * 0.38], s: [0.9, 0.4 + i * 0.4 * 0 + 0.4, 0.38] }));
  }
  if (dome) {
    p.push(piece(CYL(1.4, 1.4, 0.5, 14), bord, { p: [0, h + 0.5, 0] }));
    p.push(piece(SPH(1.4, 14, 8, Math.PI * 2, Math.PI / 2), dome, { p: [0, h + 0.75, 0] }));
    p.push(piece(SPH(0.12, 6, 4), '#f5b942', { p: [0, h + 2.2, 0] }));
  }
  // jarres et plantes devant la maison
  for (const sx of [-1, 1]) if (R() > 0.4) {
    p.push(piece(SPH(0.32, 8, 6), '#c9773f', { p: [sx * (w / 2 - 0.4), 0.32, pz + 0.4], s: [1, 1.15, 1] }));
    p.push(piece(new THREE.IcosahedronGeometry(0.35, 0), '#5f9e45', { p: [sx * (w / 2 - 0.4), 0.85, pz + 0.4] }));
  }
  return fusion(p);
}

// Porte d'entrée du village (une grande arche sur le chemin)
function geoPorteVillage(couleur) {
  const p = [];
  for (const sx of [-1, 1]) {
    p.push(piece(B(), couleur, { p: [sx * 3.2, 2.6, 0], s: [1.3, 5.2, 1.3] }));
    p.push(piece(B(), '#f6ead2', { p: [sx * 3.2, 5.35, 0], s: [1.6, 0.3, 1.6] }));
    for (const [ox, oz] of [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]]) p.push(piece(B(), '#e0c08e', { p: [sx * 3.2 + ox, 5.75, oz], s: [0.42, 0.5, 0.42], m: M.terre }));
  }
  p.push(piece(new THREE.TorusGeometry(2.55, 0.55, 8, 20, Math.PI), couleur, { p: [0, 4.4, 0] }));
  p.push(piece(new THREE.TorusGeometry(2.0, 0.08, 6, 20, Math.PI), '#f5b942', { p: [0, 4.4, 0.56] }));
  p.push(piece(new THREE.TorusGeometry(2.0, 0.08, 6, 20, Math.PI), '#f5b942', { p: [0, 4.4, -0.56] }));

  for (let i = 0; i < 7; i++) { const a = Math.PI * (i + 0.5) / 7; p.push(piece(B(), i % 2 ? '#c94f3c' : '#f5b942', { p: [Math.cos(a) * 2.5, 4.4 + Math.sin(a) * 2.5, 0.6], r: [0, 0, a], s: [0.25, 0.25, 0.05] })); }
  return fusion(p);
}

function geoMosquee() {
  // Une mosquée simple, inspirée de ce que l'on sait des premières mosquées d'Arabie :
  // une cour entourée de murs de briques crues, un abri au toit plat de palmes posé sur des troncs de palmier.
  // Pas de dôme ni de minaret (ils sont venus plus tard). C'est une reconstitution imaginée, pas un lieu réel.
  const p = [], mur = '#d9bf94', haut = 2.6, W = 13, D = 11;
  const pan = (x, z, sx, sz) => p.push(piece(B(), mur, { p: [x, haut / 2, z], s: [sx, haut, sz], m: M.terre }), piece(B(), '#cdb184', { p: [x, haut + 0.06, z], s: [sx + 0.1, 0.12, sz + 0.1], m: M.terre }));
  pan(0, -D / 2, W, 0.6);                                   // mur du fond
  pan(-W / 2, 0, 0.6, D); pan(W / 2, 0, 0.6, D);          // côtés
  pan(-W / 2 + 2.7, D / 2, 5.4, 0.6); pan(W / 2 - 2.7, D / 2, 5.4, 0.6);   // façade, avec une large entrée
  for (const sx of [-1, 1]) p.push(piece(B(), '#6b4428', { p: [sx * 1.15, 1.4, D / 2], s: [0.2, 2.8, 0.7], m: M.bois }));
  p.push(piece(B(), '#6b4428', { p: [0, 2.85, D / 2], s: [2.6, 0.22, 0.7], m: M.bois }));
  // l'abri : troncs de palmier et toit de palmes
  const zA = -D / 2 + 0.3, prof = 4.2;
  for (let i = 0; i < 5; i++) for (let j = 0; j < 2; j++) {
    const x = -W / 2 + 1.6 + i * (W - 3.2) / 4, z = zA + 1.5 + j * 2.4;
    p.push(piece(CYL(0.2, 0.24, 3.1, 8), '#7a5a3a', { p: [x, 1.55, z], m: M.bois }));
    for (let k = 0; k < 5; k++) p.push(piece(CYL(0.25, 0.25, 0.06, 8), '#5e4430', { p: [x, 0.4 + k * 0.6, z] }));
  }
  p.push(piece(B(), '#a88a5e', { p: [0, 3.2, zA + prof / 2], s: [W - 0.4, 0.22, prof + 0.8], m: M.bois }));
  for (let i = 0; i < 16; i++) p.push(piece(B(), i % 2 ? '#8f7650' : '#b39468', { p: [-W / 2 + 0.6 + i * (W - 1.2) / 15, 3.34, zA + prof / 2], s: [0.35, 0.06, prof + 0.7] }));
  // la cour : sable bien balayé, des nattes de palmier sous l'abri
  p.push(piece(B(), '#e6d3ac', { p: [0, 0.03, 0], s: [W - 0.6, 0.06, D - 0.6] }));
  for (let i = 0; i < 4; i++) p.push(piece(B(), '#c9a96e', { p: [-4.2 + i * 2.8, 0.08, zA + 2.6], s: [2.5, 0.03, 3.6], m: M.bois }));
  return fusion(p);
}

// Hauteurs de l'eau (au-dessus de la base du puits) : toujours EN DESSOUS du bord, jamais dans le même plan qu'une face de pierre
export const EAU_PUITS = { y: 0.66, rayon: 1.19 };                    // bord du puits à 0.95, fond à 0.35
export const EAU_ABREUVOIR = { y: 0.47, x: 0, z: 2.3, l: 2.14, w: 0.54 };   // bords à 0.60, fond à 0.12
function geoPuits() {
  // un puits de pierre CREUX (margelle, paroi intérieure et fond), son portique de bois, sa poulie, sa corde et son seau de cuir, et un abreuvoir en bassin
  const p = [];
  // profil tourné : paroi extérieure montante, dessus de la margelle, paroi intérieure descendante, fond (normales vers l'extérieur de la pierre)
  const profil = [[1.62, 0], [1.45, 0.95], [1.18, 0.95], [1.18, 0.35], [0, 0.35]].map(([r, y]) => new THREE.Vector2(r, y));
  p.push(piece(new THREE.LatheGeometry(profil, 28), '#c9b48e', { m: M.pierre }));
  p.push(piece(new THREE.TorusGeometry(1.33, 0.11, 6, 28), '#b9a27a', { p: [0, 0.97, 0], r: [Math.PI / 2, 0, 0], m: M.pierre }));
  for (const sx of [-1, 1]) p.push(piece(CYL(0.11, 0.13, 2.6, 8), '#6b4a30', { p: [sx * 1.35, 1.3, 0], m: M.bois }));
  p.push(piece(CYL(0.09, 0.09, 3.0, 8), '#6b4a30', { p: [0, 2.55, 0], r: [0, 0, Math.PI / 2], m: M.bois }));
  p.push(piece(CYL(0.22, 0.22, 0.12, 12), '#8a6440', { p: [0, 2.42, 0], r: [0, 0, Math.PI / 2], m: M.bois }));
  p.push(piece(CYL(0.015, 0.015, 1.3, 4), '#d9c79e', { p: [0.06, 1.75, 0] }));
  p.push(piece(CYL(0.16, 0.12, 0.26, 10), '#7a5232', { p: [0.06, 1.05, 0], m: M.cuir }));
  // l'abreuvoir de pierre : un vrai bassin (fond + quatre parois), pour les bêtes
  const az = 2.3, pierre = '#c9b48e';
  p.push(piece(B(), pierre, { p: [0, 0.06, az], s: [2.4, 0.12, 0.8], m: M.pierre }));
  for (const sz of [-1, 1]) p.push(piece(B(), pierre, { p: [0, 0.3, az + sz * 0.33], s: [2.4, 0.6, 0.14], m: M.pierre }));
  for (const sx of [-1, 1]) p.push(piece(B(), pierre, { p: [sx * 1.13, 0.3, az], s: [0.14, 0.6, 0.52], m: M.pierre }));
  return fusion(p);
}

function geoLampadaire() {
  // un poteau de bois de palmier avec une petite niche et une lampe à huile en terre cuite
  return fusion([
    piece(CYL(0.09, 0.12, 2.6, 7), '#6b4a30', { p: [0, 1.3, 0], m: M.bois }),
    piece(B(), '#8a6440', { p: [0, 2.62, 0], s: [0.42, 0.06, 0.42], m: M.bois }),
    piece(SPH(0.13, 10, 6), '#b9652f', { p: [0, 2.7, 0], s: [1, 0.45, 1.35], m: M.terre }),
    piece(CYL(0.03, 0.04, 0.08, 6), '#a5552a', { p: [0, 2.74, 0.16], r: [0.8, 0, 0] })
  ]);
}
function geoLueur() { return fusion([piece(SPH(0.05, 6, 5), '#ffd36b', { p: [0, 2.83, 0.2], s: [0.8, 1.6, 0.8] })]); }

function geoTente(R, c1, c2) {
  const p = [];
  const toit = new THREE.ConeGeometry(4, 2.6, 4, 1, true);
  p.push(piece(toit, c1, { p: [0, 2.4, 0], r: [0, deg(45), 0], s: [1.5, 1, 1] }));
  p.push(piece(new THREE.ConeGeometry(4.02, 1.0, 4, 1, true), c2, { p: [0, 1.7, 0], r: [0, deg(45), 0], s: [1.5, 1, 1] }));
  p.push(piece(new THREE.CylinderGeometry(4, 4, 1.25, 4, 1, true), c2, { p: [0, 0.62, 0], r: [0, deg(45), 0], s: [1.5, 1, 1] }));
  p.push(piece(B(), '#3a2a2a', { p: [0, 0.6, 2.9], s: [1.4, 1.2, 0.08] }));                     // l'entrée
  p.push(piece(B(), '#5b3a22', { p: [0, 1.85, 0], s: [0.15, 3.7, 0.15] }));
  p.push(piece(B(), '#c94f3c', { p: [0, 0.03, 3.8], s: [2.4, 0.06, 1.6] }));
  return fusion(p);
}

function geoStele() {
  return fusion([
    piece(B(), '#d9c7a3', { p: [0, 0.7, 0], s: [1.0, 1.4, 0.4] }),
    piece(B(), '#efe0bf', { p: [0, 1.45, 0], s: [1.15, 0.12, 0.5] }),
    piece(B(), '#2bb3c0', { p: [0, 0.85, 0.21], s: [0.6, 0.5, 0.02] }),
    piece(CYL(0.06, 0.06, 0.4, 6), '#4a3a5a', { p: [0, 1.7, 0] }),
    piece(new THREE.ConeGeometry(0.26, 0.26, 6), '#d9952a', { p: [0, 2.35, 0] })
  ]);
}
function geoLueurStele() { return fusion([piece(CYL(0.17, 0.2, 0.42, 6), '#ffd36b', { p: [0, 2.05, 0] })]); }

function geoBuisson(R) {
  const p = [piece(new THREE.IcosahedronGeometry(0.8, 0), R() > 0.5 ? '#5f9e45' : '#6aa94c', { p: [0, 0.55, 0], s: [1, 0.75, 1] })];
  const fl = R() > 0.5 ? '#ff8fb1' : '#fff3b0';
  for (let i = 0; i < 6; i++) p.push(piece(SPH(0.12, 5, 4), fl, { p: [Math.cos(i * 2.1) * 0.6, 0.6 + (i % 3) * 0.18, Math.sin(i * 2.1) * 0.6] }));
  return fusion(p);
}
// L'acacia du désert : tronc tordu et couronne plate en parasol
function geoAcacia(R) {
  const p = [], bois = '#6e5038';
  p.push(piece(CYL(0.12, 0.2, 2.2, 7), bois, { p: [0, 1.1, 0], r: [0, 0, 0.12] }));
  const branches = [];
  for (let i = 0; i < 3; i++) {
    const a = i * 2.1 + R(), inc = 0.6 + R() * 0.3, L = 1.6 + R() * 0.8;
    const bx = Math.cos(a) * Math.sin(inc) * L / 2, bz = Math.sin(a) * Math.sin(inc) * L / 2;
    p.push(piece(CYL(0.06, 0.1, L, 6), bois, { p: [0.13 + bx, 2.1 + Math.cos(inc) * L / 2, bz], r: [Math.sin(a) * inc, 0, -Math.cos(a) * inc] }));
    branches.push([0.13 + bx * 2, 2.1 + Math.cos(inc) * L, bz * 2]);
  }
  for (const [x, y, z] of branches) for (let k = 0; k < 3; k++)
    p.push(piece(new THREE.IcosahedronGeometry(1, 1), k % 2 ? '#6f8a3c' : '#80984a', { p: [x + (R() - 0.5) * 1.2, y + 0.15 + R() * 0.25, z + (R() - 0.5) * 1.2], s: [1.4 + R() * 0.6, 0.35, 1.3 + R() * 0.6] }));
  return fusion(p);
}
function geoArbuste(R) {
  const p = [], brin = new THREE.ConeGeometry(0.05, 0.9, 3); brin.translate(0, 0.45, 0);
  for (let i = 0; i < 9; i++) p.push(piece(brin, i % 3 ? '#8d8f5a' : '#a49a62', { r: [Math.sin(i * 2.4) * 0.7, 0, Math.cos(i * 2.4) * 0.7], s: [1, 0.7 + R() * 0.6, 1] }));
  for (let i = 0; i < 5; i++) p.push(piece(new THREE.IcosahedronGeometry(0.22, 0), '#7d8a4a', { p: [Math.cos(i * 1.3) * 0.35, 0.45 + (i % 2) * 0.2, Math.sin(i * 1.3) * 0.35] }));
  return fusion(p);
}

function geoTouffe(couleur) {
  const p = [], brin = new THREE.ConeGeometry(0.06, 0.9, 3); brin.translate(0, 0.45, 0);
  for (let i = 0; i < 7; i++) p.push(piece(brin, couleur, { r: [Math.sin(i * 2.4) * 0.5, 0, Math.cos(i * 2.4) * 0.5] }));
  return fusion(p);
}
function geoRoseaux() {
  const p = [], brin = new THREE.ConeGeometry(0.05, 2.2, 3); brin.translate(0, 1.1, 0);
  for (let i = 0; i < 9; i++) p.push(piece(brin, i % 3 ? '#5e9a3e' : '#7fb14d', { p: [Math.cos(i * 2.2) * 0.4, 0, Math.sin(i * 2.2) * 0.4], r: [Math.sin(i) * 0.2, 0, Math.cos(i) * 0.2] }));
  p.push(piece(CYL(0.07, 0.07, 0.35, 6), '#6b4428', { p: [0.1, 2.0, 0.05] }));
  return fusion(p);
}

// Texture ronde et douce pour les halos des lanternes et les petites étoiles
function textureHalo() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,230,160,1)'); g.addColorStop(0.25, 'rgba(255,200,90,.6)'); g.addColorStop(1, 'rgba(255,180,60,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// ---------- le monde ----------
export function creerDecor(scene, terrain, Q, TX = {}) {
  // L'eau : vaguelettes qui bougent (deux couches qui glissent), reflets du soleil
  const eaux = [];
  function matEau(couleur, echelle) {
    const m = new THREE.MeshPhongMaterial({ color: couleur, shininess: 160, specular: '#fff6e0', transparent: true, opacity: 0.9 });
    if (TX.eau) {
      const n1 = TX.eau.clone(); n1.needsUpdate = true; n1.repeat.set(echelle, echelle);
      m.normalMap = n1; m.normalScale.set(0.55, 0.55);
      eaux.push({ m, n1, e: echelle });
    }
    return m;
  }
  const H = (x, z) => terrain.hauteur(x, z);
  const colliders = [];   // { x, z, r }
  const points = [];      // lieux où l'on peut lire : { id, x, z, r }
  const halos = [];       // positions des lanternes (lueur la nuit)
  const animes = [];      // petites animations (feu, papillons…)
  const zones = [];
  const matBase = materiau(), matVent = materiau({ balance: 1 }), matHerbe = materiau({ balance: 3 });
  const matLueur = new THREE.MeshBasicMaterial({ color: '#ffd36b' });
  const ombres = !!Q.ombres;

  const ajouter = (groupe, geo, mat, x, z, { y = null, rot = 0, s = 1, ombre = true } = {}) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y ?? H(x, z), z); m.rotation.y = rot; m.scale.setScalar(s);
    m.castShadow = ombres && ombre; m.receiveShadow = ombres;
    groupe.add(m); return m;
  };
  // Plusieurs copies d'un même objet en un seul dessin
  const copies = (groupe, geo, mat, liste, ombre = true) => {
    if (!liste.length) return null;
    const im = new THREE.InstancedMesh(geo, mat, liste.length), m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    liste.forEach((o, i) => {
      m.compose(new THREE.Vector3(o.x, (o.y ?? H(o.x, o.z)) + (o.dy || 0), o.z), q.setFromEuler(e.set(o.rx || 0, o.rot || 0, o.rz || 0)), new THREE.Vector3(o.sx ?? o.s ?? 1, o.sy ?? o.s ?? 1, o.sz ?? o.s ?? 1));
      im.setMatrixAt(i, m);
    });
    im.castShadow = ombres && ombre; im.receiveShadow = ombres;
    im.computeBoundingSphere();
    groupe.add(im); return im;
  };
  const libre = (x, z, marge) => {
    if (Math.abs(x) > LIMITE - 10 || Math.abs(z) > LIMITE - 10) return false;
    if (distanceChemins(x, z) < 4 + marge) return false;
    for (const c of colliders) if (Math.hypot(c.x - x, c.z - z) < c.r + marge) return false;
    return true;
  };
  // Disperse des objets dans un anneau autour d'un centre
  const disperser = (R, n, cx, cz, r0, r1, marge, filtre = () => true) => {
    const out = [];
    for (let essai = 0; essai < n * 12 && out.length < n; essai++) {
      const a = R() * Math.PI * 2, d = r0 + Math.sqrt(R()) * (r1 - r0);
      const x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d;
      if (libre(x, z, marge) && filtre(x, z) && out.every(o => Math.hypot(o.x - x, o.z - z) > marge * 1.6)) out.push({ x, z });
    }
    return out;
  };
  const stele = (groupe, id, x, z, rot = 0) => {
    ajouter(groupe, geoStele(), matBase, x, z, { rot });
    ajouter(groupe, geoLueurStele(), matLueur, x, z, { rot, ombre: false });
    colliders.push({ x, z, r: 0.8 });
    points.push({ id, x, z, r: 3.2 });
    halos.push(new THREE.Vector3(x, H(x, z) + 2.05, z));
  };
  const palmiers = (groupe, R, liste, varietes = 4) => {
    const geos = Array.from({ length: varietes }, () => geoPalmier(R));
    geos.forEach((g, k) => copies(groupe, g, matVent, liste.filter((_, i) => i % varietes === k).map(o => ({ ...o, rot: R() * 6.28, s: 0.85 + R() * 0.35 }))));
    liste.forEach(o => colliders.push({ x: o.x, z: o.z, r: 0.55 }));
  };
  const zone = (id, centre, construire) => {
    const g = new THREE.Group(); g.name = 'zone-' + id; g.visible = false; scene.add(g);
    zones.push({ id, centre, g, construit: false, construire: () => { construire(g); g.visible = true; } });
  };

  // ===== Le village de Nour =====
  zone('village', LIEUX.village, g => {
    const R = hasard(7);
    ajouter(g, geoPuits(), matBase, 0, 0, { y: H(0, 0) - 0.05 });
    { // l'eau du puits et de l'abreuvoir : des surfaces à part (matériau d'eau animé), posées sous le bord de la pierre, sans aucun plan commun
      const yb = H(0, 0) - 0.05;
      const eauP = new THREE.Mesh(new THREE.CircleGeometry(EAU_PUITS.rayon, 32), matEau('#2fb2c8', 2));
      eauP.rotation.x = -Math.PI / 2; eauP.position.set(0, yb + EAU_PUITS.y, 0); eauP.name = 'eau-puits'; g.add(eauP);
      const eauA = new THREE.Mesh(new THREE.PlaneGeometry(EAU_ABREUVOIR.l, EAU_ABREUVOIR.w), matEau('#4fb3c4', 1));
      eauA.rotation.x = -Math.PI / 2; eauA.position.set(EAU_ABREUVOIR.x, yb + EAU_ABREUVOIR.y, EAU_ABREUVOIR.z); eauA.name = 'eau-abreuvoir'; g.add(eauA);
    }
    colliders.push({ x: 0, z: 0, r: 1.9 }, { x: 0, z: 2.3, r: 1.0 }, { x: -0.8, z: 2.3, r: 0.7 }, { x: 0.8, z: 2.3, r: 0.7 });

    const murs = ['#f3dcb4', '#f7e6c8', '#efcfa0', '#f6d9c4', '#e9d2b0'];
    const domes = [null, null, null, null, null];   // pas de dômes : toits plats en terrasse
    const maisons = [[35, 26], [60, 28], [110, 27], [135, 25], [190, 26], [215, 29], [300, 26], [330, 28]];
    maisons.forEach(([a, r], i) => {
      const x = Math.cos(deg(a)) * r, z = Math.sin(deg(a)) * r;
      const w = 6 + R() * 2.5, d = 5.5 + R() * 2, h = 3.6 + R() * 1.6;
      const rot = Math.atan2(-x, -z); // la porte regarde le puits
      ajouter(g, geoMaison(w, d, h, murs[i % murs.length], domes[i % domes.length], R), matBase, x, z, { rot, y: H(x, z) - 0.1 });
      colliders.push({ x, z, r: Math.max(w, d) * 0.58 });
    });
    // la mosquée du village
    { const a = deg(248), r = 33, x = Math.cos(a) * r, z = Math.sin(a) * r, rot = Math.atan2(-x, -z);
      ajouter(g, geoMosquee(), matBase, x, z, { rot, y: H(x, z) - 0.1 });
      colliders.push({ x, z, r: 7.6 });
    }

    // les portes du village, sur chaque chemin
    for (const c of CHEMINS) {
      const [ax, az] = c[0], [bx, bz] = c[1], L = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / L, uz = (bz - az) / L;
      const x = ax + ux * 47, z = az + uz * 47;
      ajouter(g, geoPorteVillage('#efd2a4'), matBase, x, z, { rot: Math.atan2(ux, uz), y: H(x, z) - 0.1 });
      const px = -uz, pz = ux;
      for (const sgn of [-1, 1]) colliders.push({ x: x + px * 3.2 * sgn, z: z + pz * 3.2 * sgn, r: 0.95 });
    }
    // lampes à huile sur poteaux, le long des chemins et autour du puits
    const lamp = [];
    for (const c of CHEMINS) {
      const [ax, az] = c[0], [bx, bz] = c[1], L = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / L, uz = (bz - az) / L;
      for (const d of [14, 34]) for (const sgn of [-1, 1]) lamp.push({ x: ax + ux * d - uz * 3.4 * sgn, z: az + uz * d + ux * 3.4 * sgn });
    }
    for (let i = 0; i < 4; i++) lamp.push({ x: Math.cos(i * Math.PI / 2 + Math.PI / 4) * 6.5, z: Math.sin(i * Math.PI / 2 + Math.PI / 4) * 6.5 });
    copies(g, geoLampadaire(), matBase, lamp);
    copies(g, geoLueur(), matLueur, lamp, false);
    lamp.forEach(o => { colliders.push({ x: o.x, z: o.z, r: 0.35 }); halos.push(new THREE.Vector3(o.x, H(o.x, o.z) + 2.85, o.z)); });

    palmiers(g, R, disperser(R, 16, 0, 0, 12, 46, 2.5));
    const bu = disperser(R, 26, 0, 0, 8, 40, 1.4);
    const gb = [geoBuisson(R), geoBuisson(R)];
    gb.forEach((geo, k) => copies(g, geo, matHerbe, bu.filter((_, i) => i % 2 === k).map(o => ({ ...o, rot: R() * 6, s: 0.8 + R() * 0.5 }))));
    bu.forEach(o => colliders.push({ x: o.x, z: o.z, r: 0.7 }));

    // l'enclos de Sablo, à la sortie est du village (côté soleil levant)
    const ex = 33, ez = -9;
    const enclos = [];
    for (let i = 0; i <= 8; i++) { const a = deg(-200 + i * 25), x = ex + Math.cos(a) * 7, z = ez + Math.sin(a) * 7; enclos.push({ x, z, rot: -a }); colliders.push({ x, z, r: 0.3 }); }
    copies(g, fusion([piece(CYL(0.1, 0.12, 1.3, 6), '#8a6440', { p: [0, 0.65, 0] }), piece(B(), '#a77a4e', { p: [0, 1.0, 0.9], s: [0.08, 0.1, 1.9] }), piece(B(), '#a77a4e', { p: [0, 0.6, 0.9], s: [0.08, 0.1, 1.9] })]), matBase, enclos);
    ajouter(g, fusion([piece(B(), '#8a6440', { p: [0, 0.35, 0], s: [2.4, 0.7, 0.9] }), piece(B(), '#5fd3e0', { p: [0, 0.66, 0], s: [2.1, 0.05, 0.65] })]), matBase, ex + 3.5, ez - 3.5, { rot: 0.6 });
    colliders.push({ x: ex + 3.5, z: ez - 3.5, r: 1.2 });
    stele(g, 'sablo', ex - 6, ez - 4, deg(-60));
  });

  // ===== L'oasis =====
  zone('oasis', LIEUX.oasis, g => {
    const R = hasard(21), { x: ox, z: oz, lac } = LIEUX.oasis;
    const eau = new THREE.Mesh(new THREE.CircleGeometry(lac + 1, 48), matEau('#2fb2c8', 6));
    eau.rotation.x = -Math.PI / 2; eau.position.set(ox, -0.9, oz); eau.receiveShadow = ombres; g.add(eau);
    // le bord de l'eau : une ligne d'écume claire qui respire
    const ecume = new THREE.Mesh(new THREE.RingGeometry(lac - 1.9, lac - 1.2, 64), new THREE.MeshBasicMaterial({ color: '#e9fbff', transparent: true, opacity: 0.35, depthWrite: false }));
    ecume.rotation.x = -Math.PI / 2; ecume.position.set(ox, -0.86, oz); g.add(ecume);
    animes.push(t => { ecume.material.opacity = 0.22 + Math.sin(t * 1.3) * 0.1; ecume.scale.setScalar(1 + Math.sin(t * 1.3) * 0.006); });
    colliders.push({ x: ox, z: oz, r: lac - 1.6 });
    // les nénuphars
    copies(g, fusion([piece(CYL(0.6, 0.6, 0.04, 9), '#4f9e3a'), piece(SPH(0.14, 6, 4), '#ff9fb2', { p: [0.15, 0.08, 0.1] })]), matBase,
      Array.from({ length: 14 }, () => { const a = R() * 6.28, d = 4 + R() * (lac - 6); return { x: ox + Math.cos(a) * d, z: oz + Math.sin(a) * d, y: -0.86, rot: R() * 6 }; }), false);
    palmiers(g, R, disperser(R, 34, ox, oz, lac + 2, lac + 26, 2.6));
    copies(g, geoRoseaux(), matHerbe, Array.from({ length: 26 }, () => { const a = R() * 6.28, d = lac - 1.8 + R() * 2.4; return { x: ox + Math.cos(a) * d, z: oz + Math.sin(a) * d, rot: R() * 6, s: 0.8 + R() * 0.5 }; }).filter(o => distanceChemins(o.x, o.z) > 3), false);
    copies(g, geoTouffe('#6fae4a'), matHerbe, disperser(R, 60, ox, oz, lac + 1, lac + 30, 0.6).map(o => ({ ...o, rot: R() * 6, s: 0.8 + R() * 0.6 })), false);
    const roc = disperser(R, 10, ox, oz, lac + 3, lac + 28, 2);
    copies(g, geoRocher(R, '#b39a7c'), matBase, roc.map(o => ({ ...o, rot: R() * 6, s: 0.7 + R() * 0.8 })));
    roc.forEach(o => colliders.push({ x: o.x, z: o.z, r: 1 }));
    stele(g, 'oasis', ox - lac - 5, oz + 7, deg(100));
    // papillons
    const pap = new THREE.Group(); g.add(pap);
    const aile = new THREE.PlaneGeometry(0.28, 0.22); aile.translate(0.14, 0, 0);
    const couleurs = ['#ffb3c7', '#fff1a8', '#b9e8ff', '#ffd08a'];
    for (let i = 0; i < 10; i++) {
      const b = new THREE.Group(), m = new THREE.MeshBasicMaterial({ color: couleurs[i % 4], side: THREE.DoubleSide });
      const a1 = new THREE.Mesh(aile, m), a2 = new THREE.Mesh(aile, m); a2.scale.x = -1; b.add(a1, a2); pap.add(b);
      const cx = ox + (R() - 0.5) * 2 * (lac + 18), cz = oz + (R() - 0.5) * 2 * (lac + 18), ph = R() * 10;
      animes.push(t => {
        const tt = t * 0.35 + ph;
        b.position.set(cx + Math.sin(tt) * 4, H(cx, cz) + 1.2 + Math.sin(tt * 3.1) * 0.4, cz + Math.cos(tt * 0.8) * 4);
        b.rotation.y = -tt; const f = Math.sin(t * 16 + ph) * 1.1; a1.rotation.y = f; a2.rotation.y = -f;
      });
    }
  });

  // ===== Le camp des caravanes =====
  zone('camp', LIEUX.camp, g => {
    const R = hasard(33), { x: cx, z: cz } = LIEUX.camp;
    const tentes = [[-2.4, 12, '#c94f3c', '#f3e3c3'], [-1.2, 13, '#f3e3c3', '#2bb3c0'], [0.1, 14, '#7b4fa0', '#f5b942'], [1.4, 12, '#2d5b8a', '#f3e3c3'], [2.6, 13, '#e08a3c', '#c94f3c']];
    tentes.forEach(([a, r, c1, c2]) => {
      const x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r;
      if (distanceChemins(x, z) < 6) return;
      ajouter(g, geoTente(R, c1, c2), materiau(), x, z, { rot: Math.atan2(cx - x, cz - z) });
      colliders.push({ x, z, r: 4.6 });
    });
    // le feu de camp
    const pierres = Array.from({ length: 9 }, (_, i) => ({ x: cx + Math.cos(i * 0.7) * 1.3, z: cz + Math.sin(i * 0.7) * 1.3, rot: i, s: 0.3 }));
    copies(g, geoRocher(R, '#8f8478'), matBase, pierres);
    ajouter(g, fusion([piece(CYL(0.12, 0.12, 1.8, 6), '#6b4428', { r: [0, 0, 1.4], p: [0, 0.25, 0] }), piece(CYL(0.12, 0.12, 1.8, 6), '#6b4428', { r: [1.4, 0.8, 0], p: [0, 0.25, 0] })]), matBase, cx, cz);
    colliders.push({ x: cx, z: cz, r: 1.8 });
    const flammes = [];
    for (let i = 0; i < 3; i++) {
      const f = new THREE.Mesh(new THREE.ConeGeometry(0.35 - i * 0.08, 1.2 - i * 0.25, 7), new THREE.MeshBasicMaterial({ color: ['#ff8a3d', '#ffb347', '#ffe08a'][i], transparent: true, opacity: 0.92 }));
      f.position.set(cx, H(cx, cz) + 0.7, cz); g.add(f); flammes.push(f);
    }
    halos.push(new THREE.Vector3(cx, H(cx, cz) + 0.9, cz));
    animes.push(t => flammes.forEach((f, i) => { const k = 1 + Math.sin(t * (9 + i * 3) + i) * 0.12; f.scale.set(1, k, 1); f.rotation.y = t * (1 + i); }));
    // tapis, jarres et caisses
    ajouter(g, fusion([piece(B(), '#c94f3c', { p: [0, 0.03, 0], s: [3, 0.06, 2] }), piece(B(), '#f5b942', { p: [0, 0.04, 0], s: [2.4, 0.06, 1.4] })]), matBase, cx + 4, cz + 3, { rot: 0.4, ombre: false });
    const jarres = [[cx - 5, cz + 4], [cx - 5.8, cz + 3.2], [cx + 6, cz - 4]];
    const gJarre = fusion([piece(SPH(0.5, 10, 8), '#c9773f', { p: [0, 0.5, 0], s: [1, 1.2, 1] }), piece(CYL(0.22, 0.3, 0.3, 10), '#b9652f', { p: [0, 1.1, 0] })]);
    copies(g, gJarre, matBase, jarres.map(([x, z]) => ({ x, z })));
    jarres.forEach(([x, z]) => colliders.push({ x, z, r: 0.6 }));
    const caisses = [[cx + 7, cz + 6], [cx + 7.8, cz + 6.6], [cx + 7.3, cz + 6.2]];
    copies(g, fusion([piece(B(), '#a77a4e', { p: [0, 0.4, 0], s: [0.8, 0.8, 0.8] })]), matBase, caisses.map(([x, z], i) => ({ x, z, dy: i === 2 ? 0.8 : 0, rot: i })));
    colliders.push({ x: cx + 7.4, z: cz + 6.3, r: 1.1 });
    palmiers(g, R, disperser(R, 6, cx, cz, 16, 30, 3));
    stele(g, 'camp', cx + 9, cz - 8, deg(-120));
  });

  // ===== Le grand désert (dunes) =====
  zone('dunes', LIEUX.dunes, g => {
    const R = hasard(44), { x: dx, z: dz } = LIEUX.dunes;
    stele(g, 'dunes', 34, 212, deg(180));
    // le rocher des étoiles : un endroit secret, loin du chemin
    const sx = -70, sz = 238;
    ajouter(g, geoRocher(R, '#b08a66', [3.2, 2.2, 2.6]), matBase, sx + 4, sz - 3, { rot: 0.7 });
    colliders.push({ x: sx + 4, z: sz - 3, r: 3.2 });
    stele(g, 'etoiles', sx, sz, deg(30));
    const roc = disperser(R, 18, dx, dz, 10, 120, 3);
    copies(g, geoRocher(R, '#b99872'), matBase, roc.map(o => ({ ...o, rot: R() * 6, s: 0.6 + R() * 1.4 })));
    roc.forEach(o => colliders.push({ x: o.x, z: o.z, r: 1.2 }));
  });

  // ===== Des traces de pas autour des chemins les plus fréquentés =====
  {
    const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); x.fillStyle = '#fff';
    x.beginPath(); x.ellipse(32, 22, 10, 16, 0, 0, 7); x.fill(); x.beginPath(); x.ellipse(32, 48, 8, 10, 0, 0, 7); x.fill();
    const tex = new THREE.CanvasTexture(c);
    const geo = new THREE.PlaneGeometry(0.2, 0.32); geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({ alphaMap: tex, color: '#7a5636', transparent: true, opacity: 0.45, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
    const R = hasard(99), liste = [];
    for (const ch of [...CHEMINS, ...PISTES]) {
      let parcouru = 0;
      for (let k = 0; k < ch.length - 1; k++) {
        const [ax, az] = ch[k], [bx, bz] = ch[k + 1], L = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / L, uz = (bz - az) / L, ang = Math.atan2(ux, uz);
        for (let d = 0; d < L; d += 0.75) {
          parcouru += 0.75;
          if (parcouru > 140 && Math.hypot(ax + ux * d, az + uz * d) > 60) continue;          // surtout près des lieux habités
          if (R() < 0.35) continue;
          const pas = (Math.round(d / 0.75) % 2) ? 1 : -1, dec = (R() - 0.5) * 2.4 + pas * 0.13;
          const x2 = ax + ux * d - uz * dec, z2 = az + uz * d + ux * dec;
          liste.push({ x: x2, z: z2, y: H(x2, z2) + 0.04, rot: ang + (R() - 0.5) * 0.3 });
        }
      }
    }
    const im = new THREE.InstancedMesh(geo, mat, liste.length), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), un = new THREE.Vector3(1, 1, 1);
    liste.forEach((o, i) => { m4.compose(new THREE.Vector3(o.x, o.y, o.z), q.setFromEuler(e.set(0, o.rot, 0)), un); im.setMatrixAt(i, m4); });
    im.renderOrder = 1; scene.add(im);
  }

  // ===== Les régions à débloquer : le wadi et les rochers gravés =====
  // À l'entrée de chaque région, un éboulis de pierres ferme la piste tant qu'elle n'est pas débloquée.
  const barrieres = {};
  function eboulis(id, x, z, rot) {
    const R = hasard(id.length * 31), p = [];
    for (let i = 0; i < 9; i++) p.push(piece(new THREE.DodecahedronGeometry(0.6 + R() * 0.7, 0), i % 2 ? '#a8926f' : '#8f7d62', { p: [-4 + i, 0.4 + R() * 0.5, (R() - 0.5) * 1.6], r: [R(), R(), R()], s: [1, 0.8, 1] }));
    p.push(piece(B(), '#8a6440', { p: [0, 1.0, 1.4], s: [0.12, 2, 0.12] }), piece(B(), '#c9a26a', { p: [0, 1.85, 1.45], s: [1.3, 0.6, 0.06] }));
    const m = new THREE.Mesh(fusion(p), matBase); m.castShadow = ombres; m.position.set(x, H(x, z) - 0.1, z); m.rotation.y = rot; scene.add(m);
    const cols = Array.from({ length: 5 }, (_, i) => ({ x: x + Math.cos(rot) * (-4 + i * 2), z: z - Math.sin(rot) * (-4 + i * 2), r: 1.6 }));
    cols.forEach(c => colliders.push(c));
    barrieres[id] = { mesh: m, cols, ouvert: false, ouvrir() { if (this.ouvert) return; this.ouvert = true; scene.remove(m); for (const c of cols) { const k = colliders.indexOf(c); if (k >= 0) colliders.splice(k, 1); } } };
  }
  { const [a, b] = [PISTES[0][1], PISTES[0][2]], t = 0.45, x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t; eboulis('wadi', x, z, Math.atan2(b[0] - a[0], b[1] - a[1]) + Math.PI / 2); }
  { const [a, b] = [PISTES[1][1], PISTES[1][2]], t = 0.5, x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t; eboulis('rochers', x, z, Math.atan2(b[0] - a[0], b[1] - a[1]) + Math.PI / 2); }

  zone('wadi', LIEUX.wadi, g => {
    const R = hasard(66), { x: wx, z: wz } = LIEUX.wadi;
    stele(g, 'wadi', wx + 6, wz - 14, deg(200));
    // la mare (ghadir) qui reste après la pluie
    const mx = -250, mz = 176;
    const mare = new THREE.Mesh(new THREE.CircleGeometry(4.2, 24), matEau('#4fb3c4', 1)); mare.rotation.x = -Math.PI / 2; mare.position.set(mx, H(mx, mz) + 0.25, mz); g.add(mare);
    colliders.push({ x: mx, z: mz, r: 3.6 });
    copies(g, geoRoseaux(), matHerbe, Array.from({ length: 14 }, (_, i) => { const a = i * 0.45 + R() * 0.3, d = 4.3 + R() * 1.2; return { x: mx + Math.cos(a) * d, z: mz + Math.sin(a) * d, rot: R() * 6, s: 0.7 + R() * 0.4 }; }), false);
    // des acacias et des arbustes le long des berges
    const ac = disperser(R, 12, wx, wz, 8, LIEUX.wadi.r, 4);
    copies(g, geoAcacia(R), matVent, ac.map(o => ({ ...o, rot: R() * 6, s: 0.8 + R() * 0.5 })));
    ac.forEach(o => colliders.push({ x: o.x, z: o.z, r: 0.8 }));
    const ar = disperser(R, 16, wx, wz, 6, LIEUX.wadi.r, 2.2);
    copies(g, geoArbuste(R), matHerbe, ar.map(o => ({ ...o, rot: R() * 6, s: 0.8 + R() * 0.6 })));
    // les galets du lit et de gros rochers
    const roc = disperser(R, 14, wx, wz, 10, LIEUX.wadi.r + 6, 2.5);
    copies(g, geoRocher(R, '#9a8e7e'), matBase, roc.map(o => ({ ...o, rot: R() * 6, s: 0.5 + R() * 1.1 })));
    roc.forEach(o => colliders.push({ x: o.x, z: o.z, r: 0.9 }));
    // des fleurs : le wadi fleurit après la pluie
    const fl = [];
    for (let i = 0; i < 180; i++) { const a = R() * 6.28, d = Math.sqrt(R()) * LIEUX.wadi.r; const x = wx + Math.cos(a) * d, z = wz + Math.sin(a) * d; if (distanceChemins(x, z) > 2) fl.push({ x, z, dy: 0.12, s: 0.6 + R() * 0.6 }); }
    ['#f5d35a', '#f2f0e8', '#d98ac9', '#f39a5a'].forEach((c, k) => copies(g, fusion([piece(new THREE.SphereGeometry(0.09, 5, 4), c), piece(CYL(0.015, 0.015, 0.25, 4), '#6f9a50', { p: [0, -0.12, 0] })]), matHerbe, fl.filter((_, i) => i % 4 === k), false));
    copies(g, geoTouffe('#8fae5a'), matHerbe, disperser(R, 40, wx, wz, 3, LIEUX.wadi.r, 1.2).map(o => ({ ...o, rot: R() * 6, s: 0.8 + R() * 0.6 })), false);
  });

  zone('rochers', LIEUX.rochers, g => {
    const R = hasard(77), { x: rx, z: rz } = LIEUX.rochers;
    stele(g, 'rochers', rx - 10, rz + 12, deg(20));
    // de gros blocs de grès rouge (les gravures sont posées dessus par regions.js)
    const blocs = [[rx + 6, rz - 6, 3.4], [rx - 12, rz - 10, 2.8], [rx + 16, rz + 8, 3.0], [rx - 4, rz + 16, 2.6], [rx + 20, rz - 18, 2.4], [rx - 22, rz + 4, 2.2]];
    for (const [x, z, s] of blocs) { ajouter(g, geoRocher(R, '#b46a46', [s, s * 0.9, s * 1.1]), matBase, x, z, { rot: R() * 6 }); colliders.push({ x, z, r: s * 0.95 }); }
    const roc = disperser(R, 22, rx, rz, 8, LIEUX.rochers.r + 8, 2.5);
    copies(g, geoRocher(R, '#c27a52'), matBase, roc.map(o => ({ ...o, rot: R() * 6, s: 0.4 + R() * 1.0 })));
    roc.forEach(o => colliders.push({ x: o.x, z: o.z, r: 0.8 }));
    copies(g, geoTouffe('#a8a060'), matHerbe, disperser(R, 24, rx, rz, 3, LIEUX.rochers.r, 1.4).map(o => ({ ...o, rot: R() * 6 })), false);
  });

  // ===== Le col et les montagnes =====
  const col = { ouvert: false, barre: null, angle: 0 };
  zone('montagnes', { x: 0, z: -200 }, g => {
    const R = hasard(55);
    // la porte du col (x calculé sur le chemin)
    const px = -8.75, pz = -175;
    for (const s of [-1, 1]) {
      ajouter(g, fusion([piece(B(), '#b8a48a', { p: [0, 2.5, 0], s: [1.4, 5, 1.4] }), piece(B(), '#d9c7a3', { p: [0, 5.15, 0], s: [1.7, 0.3, 1.7] })]), matBase, px + s * 4.6, pz);
      ajouter(g, geoLueurStele(), matLueur, px + s * 4.6, pz, { y: H(px + s * 4.6, pz) + 3.4, ombre: false });
      halos.push(new THREE.Vector3(px + s * 4.6, H(px + s * 4.6, pz) + 5.45, pz));
      colliders.push({ x: px + s * 4.6, z: pz, r: 1.1 });
    }
    const pivot = new THREE.Group(); pivot.position.set(px - 3.8, H(px, pz) + 1.4, pz); g.add(pivot);
    const barre = new THREE.Mesh(fusion([piece(B(), '#8a6440', { p: [3.8, 0, 0], s: [7.6, 0.35, 0.3] }), piece(B(), '#f5b942', { p: [3.8, 0, 0.16], s: [0.5, 0.36, 0.02] })]), matBase);
    barre.castShadow = ombres; pivot.add(barre); col.barre = pivot;
    points.push({ id: 'col', x: px, z: pz + 4, r: 6 });
    // rochers de montagne
    // les objectifs de la montagne (grotte, lanternes cachées, belvédère, quêtes, porte du col) restent bien dégagés
    const OBJ = [[-13, -258], [26, -163], [-26, -236], [9, -272], [0, -265], [0, -150], [0, -255], [-8.75, -175], [0, -200]];
    const degage = (x, z, m) => OBJ.every(([ox, oz]) => Math.hypot(x - ox, z - oz) > m);
    // quatre sortes de rochers (formes et teintes différentes) au lieu d'un seul modèle répété
    const sortes = [geoRocher(R, '#9c8470'), geoRocher(R, '#86685a', [1.25, 0.75, 1.05]), geoRocher(R, '#a98f72', [0.85, 1.35, 0.9]), geoStrates(R)];
    const roc = sortes.map(() => []);
    for (let i = 0; i < 70; i++) {
      const x = (R() - 0.5) * 220, z = -160 - R() * 170;
      if (libre(x, z, 3) && degage(x, z, 5)) roc[i % 4].push({ x, z, rot: R() * 6, s: 1 + R() * 2.6 });
    }
    sortes.forEach((geo, k) => { copies(g, geo, matBase, roc[k]); roc[k].forEach(o => colliders.push({ x: o.x, z: o.z, r: 0.9 * o.s })); });
    // de grandes formations de grès sur les pentes raides, loin des chemins : de vraies falaises
    const grandes = [geoStrates(R), geoStrates(R, ['#b07a5e', '#94654f', '#c49674']), geoStrates(R, ['#8a604c', '#a8785e', '#74533f'])], form = grandes.map(() => []);
    for (let i = 0; i < 140 && form.flat().length < 34; i++) {
      const x = (R() - 0.5) * 250, z = -150 - R() * 200;
      if (distanceChemins(x, z) < 16 || !degage(x, z, 16) || !libre(x, z, 8)) continue;
      const pente = (Math.abs(H(x + 4, z) - H(x - 4, z)) + Math.abs(H(x, z + 4) - H(x, z - 4))) / 16;
      if (pente < 0.3) continue;
      const s0 = 3 + R() * 4.5, o = { x, z, rot: R() * 6, s: s0, dy: -0.35 * s0 };   // un peu enfoncée dans la pente
      form[form.flat().length % 3].push(o); colliders.push({ x, z, r: 1.3 * o.s });
    }
    grandes.forEach((geo, k) => copies(g, geo, matBase, form[k]));
    copies(g, geoTouffe('#8a9a4a'), matHerbe, disperser(R, 40, 0, -220, 4, 60, 1).map(o => ({ ...o, rot: R() * 6 })), false);
    // le belvédère
    const { x: bx, z: bz } = LIEUX.montagnes;
    stele(g, 'montagnes', bx + 4, bz + 2, deg(160));
    ajouter(g, fusion([piece(B(), '#c9b08a', { p: [0, 0.25, 0], s: [2.4, 0.15, 0.6] }), piece(B(), '#a8936f', { p: [-0.9, 0.12, 0], s: [0.25, 0.25, 0.5] }), piece(B(), '#a8936f', { p: [0.9, 0.12, 0], s: [0.25, 0.25, 0.5] })]), matBase, bx - 3, bz + 4, { rot: deg(10) });
    colliders.push({ x: bx - 3, z: bz + 4, r: 1.3 });
    stele(g, 'bientot', bx - 2, bz - 9, deg(0));
  });

  // ===== Le désert tout autour (déjà là au départ, très léger) =====
  {
    const g = new THREE.Group(); g.name = 'desert'; scene.add(g);
    const R = hasard(99), dens = Q.densiteDeco;
    const touffes = [], roc = [];
    for (let i = 0; i < 900 * dens; i++) {
      const x = (R() - 0.5) * 2 * (LIMITE - 20), z = (R() - 0.5) * 2 * (LIMITE - 20);
      if (z < -140 || Math.hypot(x, z) < 52 || Math.hypot(x - LIEUX.oasis.x, z - LIEUX.oasis.z) < 70 || distanceChemins(x, z) < 4) continue;
      touffes.push({ x, z, rot: R() * 6, s: 0.6 + R() * 0.7 });
    }
    for (let i = 0; i < 160 * dens; i++) {
      const x = (R() - 0.5) * 2 * (LIMITE - 20), z = (R() - 0.5) * 2 * (LIMITE - 20);
      if (z < -140 || Math.hypot(x, z) < 55 || Math.hypot(x - LIEUX.oasis.x, z - LIEUX.oasis.z) < 72 || Math.hypot(x - LIEUX.camp.x, z - LIEUX.camp.z) < 48 || distanceChemins(x, z) < 5) continue;
      roc.push({ x, z, rot: R() * 6, s: 0.4 + R() * 1.1 });
    }
    copies(g, geoTouffe('#b9b06a'), matHerbe, touffes, false);
    // acacias et arbustes du désert
    const arbres = [], arbustes = [];
    for (let i = 0; i < 70 * dens; i++) {
      const x = (R() - 0.5) * 2 * (LIMITE - 30), z = (R() - 0.5) * 2 * (LIMITE - 30);
      if (z < -150 || Math.hypot(x, z) < 60 || Math.hypot(x - LIEUX.oasis.x, z - LIEUX.oasis.z) < 55 || Math.hypot(x - LIEUX.camp.x, z - LIEUX.camp.z) < 45 || distanceChemins(x, z) < 7) continue;
      if (R() < 0.35) arbres.push({ x, z, rot: R() * 6, s: 0.8 + R() * 0.5 }); else arbustes.push({ x, z, rot: R() * 6, s: 0.8 + R() * 0.6 });
    }
    [geoAcacia(R), geoAcacia(R)].forEach((geo, k) => copies(g, geo, matVent, arbres.filter((_, i) => i % 2 === k)));
    arbres.forEach(o => colliders.push({ x: o.x, z: o.z, r: 0.4 }));
    copies(g, geoArbuste(R), matHerbe, arbustes, false);
    copies(g, geoRocher(R, '#c2a27c'), matBase, roc);
    roc.forEach(o => { if (o.s > 0.8) colliders.push({ x: o.x, z: o.z, r: 0.9 * o.s }); });
  }

  // ===== Les halos des lanternes (visibles surtout le soir) =====
  let nuage = null;
  function majHalos() {
    if (nuage) { scene.remove(nuage); nuage.geometry.dispose(); }
    const geo = new THREE.BufferGeometry().setFromPoints(halos);
    nuage = new THREE.Points(geo, matHalo);
    nuage.frustumCulled = false; scene.add(nuage);
  }
  const matHalo = new THREE.PointsMaterial({ size: 3.2, map: textureHalo(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.2, sizeAttenuation: true });

  // Le village est construit tout de suite ; les autres zones quand on s'en approche
  let enAttente = true;
  function maj(pos, t, nuit) {
    temps.value = t;
    for (const e of eaux) { e.n1.offset.set(t * 0.012, t * 0.007); e.m.normalScale.setScalar(0.45 + Math.sin(t * 0.4) * 0.1); }
    for (const a of animes) a(t);
    let construitIci = false;
    for (const z of zones) {
      const d = Math.hypot(pos.x - z.centre.x, pos.z - z.centre.z);
      if (!z.construit && !construitIci && d < 210) { z.construire(); z.construit = true; construitIci = true; enAttente = true; }
      if (z.construit) z.g.visible = d < 320;
    }
    if (enAttente && !construitIci) { majHalos(); enAttente = false; }
    matHalo.opacity = 0.12 + nuit * 0.85;
    matLueur.color.setRGB(1, 0.82 + nuit * 0.1, 0.42 + nuit * 0.15).multiplyScalar(0.9 + nuit * 0.5);
    if (col.barre) { const cible = col.ouvert ? -1.35 : 0; col.angle += (cible - col.angle) * 0.04; col.barre.rotation.z = -col.angle; }
  }
  function construireTout() { for (const z of zones) if (!z.construit) { z.construire(); z.construit = true; } majHalos(); enAttente = false; }

  return { colliders, points, zones, col, barrieres, maj, construireTout, construireZone: id => { const z = zones.find(z => z.id === id); if (z && !z.construit) { z.construire(); z.construit = true; enAttente = true; } } };
}
