// Le portail de la grande route, en 3D : deux piliers de pierre (assises de briques, losanges de turquoise), un linteau avec une poutre de palmier et des créneaux,
// deux lanternes, deux bandes de laine, et — entre les piliers — un voile de lumière doré qui montre le début de la piste, au loin.
// Époque : Arabie du VIIe siècle → pierre, brique de terre, bois de palmier, laine, lampes à huile. Aucun écrit, aucune figure : seulement des motifs géométriques.
import * as THREE from 'three';
import { piece, fusion, materiau, M } from '../formes.js?v=4';
import { PORTAIL, BLOCS, obstacles } from './portail-plan.js';

const B = () => new THREE.BoxGeometry(1, 1, 1), CYL = (a, b, h, s = 8) => new THREE.CylinderGeometry(a, b, h, s), SPH = (r, w = 8, h = 6) => new THREE.SphereGeometry(r, w, h);

// Ce que l'on voit à travers le voile du portail de RETOUR : le village de Nour au soleil couchant (maisons de terre aux toits plats, palmiers, lanternes allumées, le chemin qui y mène)
function textureVoileVillage() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 512; const g = c.getContext('2d');
  const ciel = g.createLinearGradient(0, 0, 0, 300); ciel.addColorStop(0, '#8fd0d8'); ciel.addColorStop(0.55, '#f8e3ac'); ciel.addColorStop(1, '#f4bf75');
  g.fillStyle = ciel; g.fillRect(0, 0, 256, 512);
  g.fillStyle = '#fff3c8'; g.beginPath(); g.arc(64, 205, 30, 0, 6.283); g.fill();
  g.fillStyle = '#d9a257'; g.beginPath(); g.moveTo(0, 300); for (let x = 0; x <= 256; x += 8) g.lineTo(x, 290 - Math.sin(x * 0.04 + 1) * 14); g.lineTo(256, 330); g.lineTo(0, 330); g.fill();
  const sable = g.createLinearGradient(0, 320, 0, 512); sable.addColorStop(0, '#ecd096'); sable.addColorStop(1, '#d8ae6c'); g.fillStyle = sable; g.fillRect(0, 318, 256, 194);
  const maison = (x, y, w, h, c1) => { g.fillStyle = c1; g.fillRect(x, y, w, h); g.fillStyle = '#c4ab80'; g.fillRect(x - 2, y - 4, w + 4, 5); g.fillStyle = '#6b4a30'; g.fillRect(x + w * 0.38, y + h * 0.45, w * 0.24, h * 0.55); g.fillStyle = '#ffd36b'; g.fillRect(x + w * 0.1, y + h * 0.18, w * 0.16, w * 0.16); };
  maison(108, 292, 44, 34, '#e8d3a2'); maison(160, 282, 52, 44, '#dcc392'); maison(60, 300, 40, 28, '#e2c997'); maison(204, 300, 40, 26, '#e8d3a2');
  for (const [x, y, h] of [[40, 326, 54], [236, 324, 48], [150, 330, 36]]) { g.strokeStyle = '#6b4a30'; g.lineWidth = 4; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 2, y - h); g.stroke(); g.fillStyle = '#5f8f3a'; for (const a of [-1.1, -0.4, 0.4, 1.1]) { g.save(); g.translate(x + 2, y - h); g.rotate(a); g.fillRect(-2, -20, 4, 22); g.restore(); } }
  g.fillStyle = '#f6e3b4'; g.beginPath(); g.moveTo(118, 328); g.lineTo(138, 328); g.lineTo(214, 512); g.lineTo(46, 512); g.closePath(); g.fill();   // le chemin qui mène au village
  g.fillStyle = '#ffd36b'; for (const [x, y] of [[84, 392], [172, 400], [124, 352], [150, 372]]) { g.beginPath(); g.arc(x, y, 5, 0, 6.283); g.fill(); }   // des lanternes
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
// Ce que l'on voit à travers le voile : un ciel doré, des dunes, et la piste claire qui s'enfonce vers l'horizon
function textureVoile() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 512; const g = c.getContext('2d');
  const ciel = g.createLinearGradient(0, 0, 0, 300); ciel.addColorStop(0, '#74c7d2'); ciel.addColorStop(0.55, '#f6dc9a'); ciel.addColorStop(1, '#f2b866');
  g.fillStyle = ciel; g.fillRect(0, 0, 256, 512);
  g.fillStyle = '#fff3c8'; g.beginPath(); g.arc(150, 215, 34, 0, 6.283); g.fill();                                   // le soleil, bas sur l'horizon
  g.fillStyle = '#d9a257'; g.beginPath(); g.moveTo(0, 300); for (let x = 0; x <= 256; x += 8) g.lineTo(x, 292 - Math.sin(x * 0.034) * 16); g.lineTo(256, 330); g.lineTo(0, 330); g.fill();   // dunes lointaines
  g.fillStyle = '#c28a45'; g.beginPath(); g.moveTo(0, 318); for (let x = 0; x <= 256; x += 8) g.lineTo(x, 316 - Math.sin(x * 0.05 + 2) * 12); g.lineTo(256, 340); g.lineTo(0, 340); g.fill();
  const sable = g.createLinearGradient(0, 320, 0, 512); sable.addColorStop(0, '#e8c98c'); sable.addColorStop(1, '#d4a965'); g.fillStyle = sable; g.fillRect(0, 322, 256, 190);
  g.fillStyle = '#f6e3b4'; g.beginPath(); g.moveTo(121, 324); g.lineTo(135, 324); g.lineTo(206, 512); g.lineTo(50, 512); g.closePath(); g.fill();   // la piste, claire, qui part vers l'horizon
  g.fillStyle = '#6b4a30'; for (let k = 0; k < 6; k++) { const u = k / 6, y = 330 + u * u * 170, x = 128 + (k % 2 ? 1 : -1) * (6 + u * 62), h = 5 + u * 26; g.fillRect(x - 1.5 - u, y - h, 3 + u * 2, h); }   // les poteaux du balisage
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// site : où il se trouve (le village par défaut) ; vue : ce que montre le voile ('route' ou 'village') ; obstacles : ses piliers et son voile
export function creerPortail3D({ scene, H, colliders, ombres, site = PORTAIL, obstacles: lesObstacles = obstacles(), vue = 'route' }) {
  const mat = materiau({ finesse: 1.4 });
  const groupe = new THREE.Group(); groupe.name = 'route-portail'; scene.add(groupe);
  const { x, z, cap } = site;
  // le sol est PLAN sous le portail (replat de terrain.js) : y0 est la hauteur du sol, et les marches sont mesurées à partir de lui (portail-plan.js : BLOCS)
  const y0 = H(x, z);
  groupe.position.set(x, y0, z); groupe.rotation.y = cap;        // repère local : z = sens de la traversée, x = de gauche à droite

  const pierre = '#b8a07a', pierreSombre = '#a58c64', brique = '#c4ab80', g = [];
  const COULEURS = { 'marche-basse': brique, 'marche-haute': pierreSombre, socle: '#9a8062' }, PROFOND = 1.2;
  for (const b of BLOCS) g.push(piece(B(), COULEURS[b.id], { p: [(b.x0 + b.x1) / 2, (b.haut - PROFOND) / 2, (b.z0 + b.z1) / 2], s: [b.x1 - b.x0, b.haut + PROFOND, b.z1 - b.z0], m: M.pierre }));   // les marches et le socle : le DESSUS de chaque bloc est exactement sa hauteur, enfoncé dans le sol
  for (const s of [-1, 1]) {
    g.push(piece(B(), pierreSombre, { p: [s * 2.5, 0.45, 0], s: [1.95, 0.5, 1.95], m: M.pierre }), piece(B(), pierre, { p: [s * 2.5, 2.7, 0], s: [1.5, 4.0, 1.5], m: M.pierre }),
      piece(B(), pierreSombre, { p: [s * 2.5, 4.9, 0], s: [1.85, 0.36, 1.85], m: M.pierre }));
    for (const y of [1.4, 2.4, 3.4]) g.push(piece(B(), brique, { p: [s * 2.5, y, 0], s: [1.56, 0.1, 1.56], m: M.pierre }));                       // les assises de briques
    for (const y of [1.9, 3.0, 4.1]) g.push(piece(B(), '#2bb3c0', { p: [s * 2.5, y, -0.77], s: [0.34, 0.34, 0.06], r: [0, 0, Math.PI / 4], m: M.terre }), piece(B(), '#c0504a', { p: [s * 2.5, y, -0.8], s: [0.14, 0.14, 0.06], r: [0, 0, Math.PI / 4], m: M.terre }));   // losanges de turquoise
  }
  g.push(piece(B(), pierreSombre, { p: [0, 5.4, 0], s: [6.9, 0.75, 1.6], m: M.pierre }), piece(B(), brique, { p: [0, 5.82, 0], s: [7.0, 0.1, 1.7], m: M.pierre }),
    piece(CYL(0.17, 0.19, 7.8, 7), '#6b4a30', { p: [0, 5.15, -0.95], r: [0, 0, Math.PI / 2], m: M.bois }));                                           // la poutre de palmier
  for (let k = 0; k < 6; k++) g.push(piece(B(), pierre, { p: [-3.0 + k * 1.2, 6.2, 0], s: [0.6, 0.6, 1.5], m: M.pierre }));                         // les créneaux
  for (const s of [-1, 1]) {            // les bandes de laine suspendues à la poutre
    g.push(piece(B(), s < 0 ? '#b5352a' : '#2bb3c0', { p: [s * 3.45, 4.15, -1.0], s: [0.5, 1.9, 0.04], m: M.laine }), piece(B(), '#e8d6a0', { p: [s * 3.45, 3.1, -1.0], s: [0.5, 0.14, 0.05], m: M.laine }));
    g.push(piece(CYL(0.015, 0.015, 0.6, 4), '#2b2320', { p: [s * 1.2, 4.7, -0.95] }));
  }
  if (vue === 'village') {            // une petite plaque de bois au milieu du linteau, au-dessus de la poutre : une maison de terre aux toits plats (le portail qui ramène chez soi)
    g.push(piece(B(), '#6b4a30', { p: [0, 5.58, -0.84], s: [1.25, 0.46, 0.06], m: M.bois }), piece(B(), '#e8d3a2', { p: [-0.25, 5.53, -0.88], s: [0.5, 0.26, 0.05], m: M.pierre }), piece(B(), '#dcc392', { p: [0.3, 5.58, -0.88], s: [0.46, 0.34, 0.05], m: M.pierre }), piece(B(), '#ffd36b', { p: [0.3, 5.6, -0.915], s: [0.1, 0.1, 0.02] }));
  }
  const m = new THREE.Mesh(fusion(g), mat); m.castShadow = ombres; m.receiveShadow = ombres; groupe.add(m);

  // les deux lanternes (lampes à huile) et le voile de lumière : ce qui vit
  const lampes = [-1.2, 1.2].map(dx => { const l = new THREE.Mesh(SPH(0.17, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffd36b' })); l.position.set(dx, 4.35, -0.95); groupe.add(l);
    const cage = new THREE.Mesh(CYL(0.2, 0.2, 0.34, 6), new THREE.MeshLambertMaterial({ color: '#5a3f28', wireframe: true })); cage.position.copy(l.position); groupe.add(cage); return l; });
  const voile = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 4.5), new THREE.MeshBasicMaterial({ map: vue === 'village' ? textureVoileVillage() : textureVoile(), transparent: true, opacity: 0.94, side: THREE.DoubleSide, depthWrite: false }));
  voile.position.set(0, 2.45, 0); groupe.add(voile);
  const halo = new THREE.Mesh(new THREE.CircleGeometry(0.74, 24), new THREE.MeshBasicMaterial({ color: '#ffd98a', transparent: true, opacity: 0.35, depthWrite: false }));
  halo.rotation.x = -Math.PI / 2; halo.scale.set(2.4, 1.0, 1); halo.position.set(0, 0.41, -2.25); groupe.add(halo);          // un reflet de lumière sur la marche haute, là où l'on se tient

  for (const o of lesObstacles) colliders.push(o);
  return {
    groupe, y0,
    animer(dt, t) {
      voile.material.opacity = 0.9 + Math.sin(t * 1.3) * 0.05; voile.scale.set(1 + Math.sin(t * 0.9) * 0.012, 1 + Math.sin(t * 1.1 + 1) * 0.012, 1);
      halo.material.opacity = 0.3 + Math.sin(t * 1.6) * 0.08;
      lampes.forEach((l, i) => l.scale.setScalar(1 + Math.sin(t * 7 + i * 2) * 0.07));
    }
  };
}
