// La cité ancienne en 3D : maisons de pierre et de terre en instances (8 gabarits partagés), monument central sobre sur une grande place dégagée,
// barrière douce autour du monument, placettes de marché. Aucune architecture moderne. Les obstacles ne sont calculés que près de l'enfant.
// Cette cité est une INTERPRÉTATION artistique, jamais une reconstitution exacte.
import * as THREE from 'three';
import { piece, fusion, materiau, M } from '../formes.js?v=4';
import { DEC, CITE } from './relief.js';
import { maisonsVille, PLACETTES, GABARITS } from './ville-plan.js';

const B = () => new THREE.BoxGeometry(1, 1, 1), CYL = (a, b, h, s = 8) => new THREE.CylinderGeometry(a, b, h, s);
const RAYON_OBSTACLES = 110;                      // on ne garde comme obstacles que les maisons à moins de 110 m de l'enfant

// Les 8 gabarits en « boîte unité » : x et z entre -0.5 et 0.5, hauteur entre 0 et 1 (l'instance donne la largeur, la profondeur et la hauteur)
function gabarits() {
  const pierre = '#b8a98f', roof = '#a8996f', porte = '#4a3322', fen = '#3a2e24', tissu = '#b5654a', bois = '#6e4e34';
  const mur = (x, y, z, sx, sy, sz, c = pierre) => piece(B(), c, { p: [x, y, z], s: [sx, sy, sz], m: M.pierre });
  const parapet = (y, w = 1, d = 1) => [mur(0, y, d / 2 - 0.02, w, 0.06, 0.06, roof), mur(0, y, -d / 2 + 0.02, w, 0.06, 0.06, roof), mur(w / 2 - 0.02, y, 0, 0.06, 0.06, d, roof), mur(-w / 2 + 0.02, y, 0, 0.06, 0.06, d, roof)];
  const ouvertures = (h = 0.5) => [piece(B(), porte, { p: [0.1, h / 2, 0.505], s: [0.16, h, 0.02], m: M.bois }), piece(B(), fen, { p: [-0.28, 0.62, 0.505], s: [0.1, 0.1, 0.02] }), piece(B(), fen, { p: [0.36, 0.7, 0.505], s: [0.08, 0.09, 0.02] })];
  return [
    fusion([mur(0, 0.5, 0, 1, 1, 1), ...parapet(1.02), ...ouvertures()]),                                                           // 0 : bloc
    fusion([mur(0, 0.31, 0, 1, 0.62, 1), mur(-0.08, 0.81, 0.05, 0.78, 0.38, 0.78, '#c4a77d'), ...parapet(0.64), ...parapet(1.02, 0.78, 0.78).map(g => g), ...ouvertures(0.4)]),   // 1 : étage en retrait
    fusion([mur(0, 0.5, -0.22, 1, 1, 0.56), mur(0.25, 0.5, 0.25, 0.5, 1, 0.5, '#c4a77d'), ...parapet(1.02), ...ouvertures()]),            // 2 : plan en L
    fusion([mur(0, 0.5, 0, 1, 1, 1), ...parapet(1.02), mur(0.55, 0.12, 0.25, 0.14, 0.24, 0.5, '#a8906e'), mur(0.55, 0.3, 0.05, 0.14, 0.6, 0.12, '#a8906e'), ...ouvertures()]),    // 3 : escalier extérieur
    fusion([mur(0, 0.35, 0.46, 1, 0.7, 0.08), mur(0, 0.35, -0.46, 1, 0.7, 0.08), mur(0.46, 0.35, 0, 0.08, 0.7, 0.84), mur(-0.46, 0.35, 0, 0.08, 0.7, 0.84), mur(-0.22, 0.45, -0.2, 0.4, 0.9, 0.4, '#c4a77d'), piece(B(), porte, { p: [0, 0.2, 0.5], s: [0.2, 0.4, 0.02], m: M.bois })]),  // 4 : cour
    fusion([mur(0, 0.4, 0, 1, 0.8, 1), ...parapet(0.82), piece(B(), tissu, { p: [0, 0.62, 0.7], s: [0.96, 0.04, 0.42], r: [0.35, 0, 0], m: M.tissu }), piece(B(), bois, { p: [-0.46, 0.3, 0.88], s: [0.04, 0.6, 0.04], m: M.bois }), piece(B(), bois, { p: [0.46, 0.3, 0.88], s: [0.04, 0.6, 0.04], m: M.bois }), piece(B(), '#8a6440', { p: [0, 0.24, 0.8], s: [0.7, 0.12, 0.2], m: M.bois })]),   // 5 : échoppe à auvent
    fusion([mur(0, 0.35, 0, 0.8, 0.7, 0.8), mur(0, 0.85, 0, 0.58, 0.3, 0.58, '#c4a77d'), ...parapet(0.71, 0.8, 0.8), ...parapet(1.01, 0.58, 0.58), ...ouvertures(0.35)]),             // 6 : tour basse
    fusion([mur(0.46, 0.2, 0, 0.08, 0.4, 1, '#a8906e'), mur(-0.46, 0.2, 0, 0.08, 0.4, 1, '#a8906e'), mur(0, 0.2, 0.46, 1, 0.4, 0.08, '#a8906e'), mur(0, 0.2, -0.46, 1, 0.4, 0.08, '#a8906e'), mur(0.15, 0.4, -0.12, 0.44, 0.8, 0.44, '#c4a77d'), ...parapet(0.82, 0.44, 0.44).map(g => g)])   // 7 : enclos et cabane
  ];
}

export function creerVille3D({ scene, hauteur, ombres }) {
  const mat = materiau({ finesse: 1.5 }), matVent = materiau({ balance: 1 }), groupe = new THREE.Group(); groupe.name = 'route-ville'; scene.add(groupe);
  const maisons = maisonsVille(), geos = gabarits(), colliders = [], fixes = [];
  // ---- les maisons : une instance par maison, les couleurs de la pierre au torchis ----
  const par = Array.from({ length: GABARITS }, () => []);
  maisons.forEach(m => par[m.gabarit].push(m));
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _y = new THREE.Vector3(0, 1, 0), _c = new THREE.Color(), pierre = new THREE.Color('#d8d0c4'), terre = new THREE.Color('#f0dcbc');
  par.forEach((liste, g) => {
    if (!liste.length) return;
    const im = new THREE.InstancedMesh(geos[g], mat, liste.length); im.castShadow = ombres; im.receiveShadow = ombres; im.frustumCulled = false; im.name = 'maisons-' + g;
    liste.forEach((m, i) => { const x = m.t, z = DEC + m.s;
      _m.compose(_p.set(x, hauteur(x, z) - 0.15, z), _q.setFromAxisAngle(_y, m.rot), _s.set(m.w, m.h, m.l)); im.setMatrixAt(i, _m);
      im.setColorAt(i, _c.copy(pierre).lerp(terre, m.teinte).multiplyScalar(0.88 + 0.16 * ((m.s * 7 + m.t * 3) % 1 + 1) % 1)); });
    im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; groupe.add(im);
  });
  // ---- le monument central : un volume cubique sobre, sombre, sur une base de pierre, au milieu de la grande place dégagée ----
  const cx = CITE.t, cz = DEC + CITE.s, y0 = hauteur(cx, cz);
  { const g = [piece(B(), '#c9b99a', { p: [0, 0.2, 0], s: [14.5, 0.4, 12.5], m: M.pierre }), piece(B(), '#26221f', { p: [0, 7.4, 0], s: [12, 14, 10], m: M.tissu }), piece(B(), '#7a6a32', { p: [0, 10.6, 0], s: [12.15, 0.9, 10.15], m: M.tissu })];
    const o = new THREE.Mesh(fusion(g), mat); o.position.set(cx, y0, cz); o.castShadow = ombres; o.receiveShadow = ombres; groupe.add(o); fixes.push({ x: cx, z: cz, r: 8.6 }, { x: cx + 4, z: cz, r: 5 }, { x: cx - 4, z: cz, r: 5 }, { x: cx, z: cz + 5, r: 5 }, { x: cx, z: cz - 5, r: 5 }); }
  // ---- la barrière douce : de petits poteaux de pierre autour du monument (l'entrée est interdite, l'intérieur n'est jamais montré) ----
  const RB = 16.5;
  { const g = []; for (let k = 0; k < 28; k++) { const a = k / 28 * Math.PI * 2, x = Math.cos(a) * RB, z = Math.sin(a) * RB; g.push(piece(CYL(0.16, 0.2, 0.9, 6), '#a8906e', { p: [x, 0.45 + (hauteur(cx + x, cz + z) - y0), z], m: M.pierre })); fixes.push({ x: cx + x, z: cz + z, r: 0.5 }); }
    for (let k = 0; k < 28; k++) { const a = (k + 0.5) / 28 * Math.PI * 2, x = Math.cos(a) * RB, z = Math.sin(a) * RB; g.push(piece(B(), '#e8dcc4', { p: [x, 0.75 + (hauteur(cx + x, cz + z) - y0), z], s: [0.1, 0.06, 2.1], r: [0, -a, 0], m: M.tissu })); }
    const o = new THREE.Mesh(fusion(g), mat); o.position.set(cx, y0, cz); groupe.add(o); }
  // ---- les placettes : quelques jarres et un petit muret de pierres, pour que la place ne soit pas vide ----
  for (const p of PLACETTES) { const x = p.t, z = DEC + p.s, g = []; for (let k = 0; k < 4; k++) g.push(piece(CYL(0.25, 0.32, 0.6, 8), k % 2 ? '#b0643c' : '#a35a34', { p: [Math.cos(k * 1.6) * (p.r * 0.5), 0.3 + (hauteur(x + Math.cos(k * 1.6) * p.r * 0.5, z + Math.sin(k * 1.6) * p.r * 0.5) - hauteur(x, z)), Math.sin(k * 1.6) * (p.r * 0.5)], m: M.terre }));
    const o = new THREE.Mesh(fusion(g), mat); o.position.set(x, hauteur(x, z), z); groupe.add(o); }
  // ---- les obstacles : seulement autour de l'enfant (rafraîchis quand il se déplace) ----
  let dernier = { x: 1e9, z: 1e9 };
  function obstacles(pos) {
    if (Math.hypot(pos.x - dernier.x, pos.z - dernier.z) < 8) return; dernier = { x: pos.x, z: pos.z }; colliders.length = 0;
    for (const m of maisons) { const x = m.t, z = DEC + m.s; if (Math.abs(x - pos.x) > RAYON_OBSTACLES || Math.abs(z - pos.z) > RAYON_OBSTACLES) continue;
      const long = Math.max(m.l, m.w), court = Math.min(m.l, m.w), r = court * 0.46, n = Math.max(2, Math.ceil(long / (r * 1.6))), ax = m.l >= m.w ? [Math.sin(m.rot), Math.cos(m.rot)] : [Math.cos(m.rot), -Math.sin(m.rot)];
      for (let k = 0; k < n; k++) { const u = (k / (n - 1) - 0.5) * (long - court * 0.9); colliders.push({ x: x + ax[0] * u, z: z + ax[1] * u, r }); } }
    for (const c of fixes) colliders.push(c);
  }
  return { groupe, colliders, obstacles, maisons: () => maisons.length, centre: { x: cx, z: cz, rayonBarriere: RB }, montrer(v) { groupe.visible = v; } };
}
