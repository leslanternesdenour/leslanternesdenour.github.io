// Le monde 3D de La Route : terrain par tuiles (chargées autour de l'enfant), fond lointain (montagnes), décor en instances partagées.
// Ce module ne dépend d'AUCUN système du village : il reçoit seulement la scène et les réglages de qualité.
// Repère : x = t (écart latéral), z = DEC + s (distance sur la piste). Les hauteurs viennent de relief.js (même fonction pour le dessin et pour les pas).
import * as THREE from 'three';
import { materiauSol } from '../terrain.js?v=3';
import { materiau, piece, fusion } from '../formes.js?v=4';
import { fbm, lisse } from './bruit.js';
import { DEC, relief, hauteur as hRelief, OASIS, versRoute, S_DEBUT, S_FIN_TRANCHE, LARGEUR } from './relief.js';
import { REGIONS_ROUTE } from './donnees.js';
import { TAILLE_TUILE, cleTuile, tuilesAutour } from './tuiles-plan.js';
import { semerTuile } from './decor-plan.js';

const PAS = 4, N = TAILLE_TUILE / PAS;
const TUILES_PAR_IMAGE = 1;                     // budget : une tuile construite par image au plus (jamais de gel)
const C = n => new THREE.Color(n);
const sable = C('#e9c88f'), sable2 = C('#dcb06f'), clair = C('#f3dfb2'), ocre = C('#d39a5c'), chemin = C('#d8b07a'),
  herbe = C('#93bd5f'), herbe2 = C('#6d9a45'), roche = C('#94705c'), roche2 = C('#5d4f48'), mouille = C('#8c7650');
const teintes = REGIONS_ROUTE.map(r => C(r.couleur)), t1 = new THREE.Color(), t2 = new THREE.Color();

function teinteRegion(s, out) {
  let k = REGIONS_ROUTE.findIndex(r => s < r.s1); if (k < 0) k = REGIONS_ROUTE.length - 1;
  const r = REGIONS_ROUTE[k], w = 120; out.copy(teintes[k]);
  if (k > 0 && s - r.s0 < w) out.lerp(teintes[k - 1], 0.5 * (1 - (s - r.s0) / w));
  if (k < REGIONS_ROUTE.length - 1 && r.s1 - s < w) out.lerp(teintes[k + 1], 0.5 * (1 - (r.s1 - s) / w));
  return out;
}
// couleur du sol et matières (sable, herbe, roche) d'un point
function colorier(s, t, r, out, mat) {
  const v1 = fbm(s * 0.05, t * 0.05, 2), g1 = fbm(s * 0.006 + 3.1, t * 0.006 - 1.7, 3), g2 = fbm(s * 0.013 - 5.2, t * 0.011 + 2.4, 2);
  out.copy(sable).lerp(sable2, v1);
  out.lerp(clair, lisse(0.52, 0.72, g1) * 0.75);
  out.lerp(ocre, lisse(0.55, 0.78, g2) * 0.5 * (1 - lisse(0.5, 0.7, g1)));
  out.lerp(teinteRegion(s, t1), 0.4);
  const vert = Math.min(1, r.oasis * lisse(OASIS.r + 4, OASIS.lac + 4, r.dOasis) * 1.2);
  if (vert > 0) { t2.copy(herbe).lerp(herbe2, Math.min(1, v1 * 0.7 + fbm(s * 0.15, t * 0.15, 2) * 0.6)); out.lerp(t2, vert); }
  const roc = lisse(2, 28, r.massif + r.rochers);
  if (roc > 0) { t2.copy(roche).lerp(roche2, v1); out.lerp(t2, roc); out.multiplyScalar(1 - roc * (0.1 + 0.1 * Math.sin(r.h * 0.9 + v1 * 3))); }
  if (r.lac > 0.05) out.lerp(mouille, Math.min(1, r.lac * 1.6));
  if (r.surChemin > 0) out.lerp(chemin, r.surChemin * 0.8);
  mat[0] = Math.max(0, 1 - vert - roc); mat[1] = vert * (1 - r.surChemin); mat[2] = roc * (1 - r.surChemin * 0.6);
  return { herbe: vert, roche: roc };
}

export function creerMondeRoute({ scene, Q, TX, ombres = false }) {
  const rayon = Q.leger ? 3 : Q.nom === 'eleve' ? 5 : 4, dens = Q.densiteDeco == null ? 1 : Q.densiteDeco;
  const matSol = materiauSol(TX && TX.sol);
  const groupe = new THREE.Group(); groupe.name = 'route'; scene.add(groupe);

  // ---------- altitude : même grille pour le dessin et pour les pas ----------
  const cache = new Map();
  const hv = (ix, iz) => {
    const k = (ix + 2000) * 20000 + (iz + 4000); let v = cache.get(k);
    if (v === undefined) { v = hRelief(iz * PAS, ix * PAS); if (cache.size > 60000) cache.clear(); cache.set(k, v); }
    return v;
  };
  function hauteur(x, z) {
    const gx = x / PAS, gz = (z - DEC) / PAS, i = Math.floor(gx), j = Math.floor(gz), fx = gx - i, fz = gz - j;
    const a = hv(i, j), b = hv(i + 1, j), c = hv(i, j + 1);
    if (fx + fz <= 1) return a + (b - a) * fx + (c - a) * fz;
    const d = hv(i + 1, j + 1);
    return d + (c - d) * (1 - fx) + (b - d) * (1 - fz);
  }
  const mm = [0, 0, 0];
  function matiere(x, z) { const { s, t } = versRoute(x, z), r = relief(s, t); return colorier(s, t, r, t1, mm); }

  // ---------- le fond lointain : les montagnes et l'horizon, en grosses mailles (une seule fois) ----------
  { const E = 32, s0 = -320, t0 = -1120, nS = Math.ceil((3340 - s0) / E), nT = Math.ceil(-2 * t0 / E), n1 = nT + 1;
    const pos = new Float32Array((nS + 1) * n1 * 3), col = new Float32Array((nS + 1) * n1 * 3), am = new Float32Array((nS + 1) * n1 * 3), c = new THREE.Color(), m3 = [0, 0, 0];
    for (let a = 0; a <= nS; a++) for (let b = 0; b <= nT; b++) {
      const s = s0 + a * E, t = t0 + b * E, r = relief(s, t), k = a * n1 + b;
      pos[k * 3] = t; pos[k * 3 + 1] = r.h - 1.4; pos[k * 3 + 2] = DEC + s;
      colorier(s, t, r, c, m3); col[k * 3] = c.r; col[k * 3 + 1] = c.g; col[k * 3 + 2] = c.b; am.set(m3, k * 3);
    }
    const idx = new Uint32Array(nS * nT * 6); let p = 0;
    for (let a = 0; a < nS; a++) for (let b = 0; b < nT; b++) { const q = a * n1 + b, d = q + n1; idx.set([q, d, q + 1, d, d + 1, q + 1], p); p += 6; }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('aMat', new THREE.BufferAttribute(am, 3));
    g.setIndex(new THREE.BufferAttribute(idx, 1)); g.computeVertexNormals(); g.computeBoundingSphere();
    const fond = new THREE.Mesh(g, matSol); fond.name = 'route-fond'; fond.frustumCulled = false; groupe.add(fond);
  }

  // ---------- les tuiles ----------
  const tuiles = new Map();
  const tmp = new THREE.Color();
  function construireTuile(i, j) {
    const s0 = i * TAILLE_TUILE, t0 = j * TAILLE_TUILE, n1 = N + 1;
    const pos = new Float32Array(n1 * n1 * 3), nor = new Float32Array(n1 * n1 * 3), col = new Float32Array(n1 * n1 * 3), am = new Float32Array(n1 * n1 * 3), m3 = [0, 0, 0];
    for (let vz = 0; vz <= N; vz++) for (let vx = 0; vx <= N; vx++) {
      const s = s0 + vz * PAS, t = t0 + vx * PAS, k = vz * n1 + vx, ix = j * N + vx, iz = i * N + vz;
      pos[k * 3] = t; pos[k * 3 + 1] = hv(ix, iz); pos[k * 3 + 2] = DEC + s;
      const nx = hv(ix - 1, iz) - hv(ix + 1, iz), nz = hv(ix, iz - 1) - hv(ix, iz + 1), ny = 2 * PAS, l = Math.hypot(nx, ny, nz);
      nor[k * 3] = nx / l; nor[k * 3 + 1] = ny / l; nor[k * 3 + 2] = nz / l;
      colorier(s, t, relief(s, t), tmp, m3); col[k * 3] = tmp.r; col[k * 3 + 1] = tmp.g; col[k * 3 + 2] = tmp.b; am.set(m3, k * 3);
    }
    const idx = new Uint16Array(N * N * 6); let p = 0;
    for (let vz = 0; vz < N; vz++) for (let vx = 0; vx < N; vx++) { const a = vz * n1 + vx, b = a + 1, c = a + n1, d = c + 1; idx.set([a, c, b, c, d, b], p); p += 6; }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('aMat', new THREE.BufferAttribute(am, 3));
    g.setIndex(new THREE.BufferAttribute(idx, 1)); g.computeBoundingSphere();
    const mesh = new THREE.Mesh(g, matSol); mesh.receiveShadow = ombres; groupe.add(mesh);
    return { i, j, mesh, objets: semerTuile(i, j) };
  }
  function retirerTuile(key) { const tu = tuiles.get(key); if (!tu) return; groupe.remove(tu.mesh); tu.mesh.geometry.dispose(); tuiles.delete(key); sale = true; }

  // ---------- le décor : une seule instance de chaque forme, partagée par toutes les tuiles ----------
  const mat = materiau({ finesse: 1.6 }), matVent = materiau({ balance: 1 });
  const B = () => new THREE.BoxGeometry(1, 1, 1), DOD = r => new THREE.DodecahedronGeometry(r, 0), ICO = r => new THREE.IcosahedronGeometry(r, 0), CYL = (a, b, h, s = 6) => new THREE.CylinderGeometry(a, b, h, s);
  const FORMES = {
    rocher: { cap: 1200, mat, ombre: true, geos: [
      fusion([piece(DOD(1), '#a38868', { p: [0, 0.35, 0], s: [1.1, 0.75, 0.95], r: [0.3, 0.4, 0] }), piece(DOD(0.6), '#8f7a5e', { p: [0.9, 0.15, 0.3], s: [1, 0.8, 1] })]),
      fusion([piece(DOD(1), '#9a8062', { p: [0, 0.5, 0], s: [0.8, 1.0, 0.85], r: [0.8, 0.1, 0.4] }), piece(DOD(0.5), '#b09672', { p: [-0.7, 0.1, 0.4], s: [1, 0.7, 1] })])] },
    caillou: { cap: 2000, mat, ombre: false, geos: [fusion([piece(DOD(0.22), '#a8906e', { p: [0, 0.08, 0], s: [1, 0.6, 1] }), piece(DOD(0.14), '#8f7a5e', { p: [0.3, 0.05, 0.1], s: [1, 0.6, 1] })])] },
    buisson: { cap: 1200, mat: matVent, ombre: false, geos: [fusion([piece(ICO(0.5), '#8a7a4a', { p: [0, 0.3, 0], s: [1.2, 0.7, 1.1] }), piece(ICO(0.35), '#9a8c58', { p: [0.4, 0.2, 0.2], s: [1, 0.7, 1] }), piece(ICO(0.3), '#7d6e40', { p: [-0.35, 0.18, -0.2] })])] },
    acacia: { cap: 150, mat: matVent, ombre: true, geos: [fusion([piece(CYL(0.12, 0.2, 3, 5), '#6b4a30', { p: [0, 1.5, 0] }), piece(new THREE.SphereGeometry(2.1, 7, 4), '#7d8a45', { p: [0, 3.2, 0], s: [1.2, 0.32, 1.2] }), piece(new THREE.SphereGeometry(1.3, 6, 4), '#8a9650', { p: [0.9, 2.6, 0.3], s: [1, 0.3, 1] })])] },
    touffe: { cap: 2000, mat: matVent, ombre: false, geos: [fusion([0, 1, 2, 3, 4].map(k => piece(new THREE.ConeGeometry(0.05, 0.6 + (k % 3) * 0.12, 3), k % 2 ? '#b5a45a' : '#a39348', { p: [Math.cos(k * 1.3) * 0.12, 0.3, Math.sin(k * 1.3) * 0.12], r: [Math.cos(k * 2) * 0.25, 0, Math.sin(k * 2) * 0.25] })))] },
    palmier: { cap: 300, mat: matVent, ombre: true, geos: [fusion([piece(CYL(0.16, 0.3, 6.2, 6), '#7a5a3a', { p: [0, 3.1, 0], r: [0.04, 0, 0.05] }),
      ...[0, 1, 2, 3, 4, 5, 6].map(k => piece(B(), k % 2 ? '#4f8a3a' : '#5f9a44', { p: [Math.cos(k * 0.9) * 1.4, 6.3, Math.sin(k * 0.9) * 1.4], s: [3.0, 0.05, 0.55], r: [0, -k * 0.9, -0.35] }))])] },
    roseau: { cap: 500, mat: matVent, ombre: false, geos: [fusion([0, 1, 2, 3].map(k => piece(CYL(0.025, 0.035, 1.5, 3), '#7f9a52', { p: [Math.cos(k * 1.6) * 0.15, 0.75, Math.sin(k * 1.6) * 0.15], r: [Math.cos(k) * 0.12, 0, Math.sin(k) * 0.12] })))] }
  };
  const inst = {};
  for (const [nom, f] of Object.entries(FORMES)) f.geos.forEach((g, v) => {
    const im = new THREE.InstancedMesh(g, f.mat, f.cap); im.count = 0; im.frustumCulled = false; im.castShadow = ombres && f.ombre; im.receiveShadow = ombres; im.name = 'route-' + nom;
    groupe.add(im); inst[nom + '#' + v] = { im, nom };
  });
  const colliders = [];
  let sale = false;
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _y = new THREE.Vector3(0, 1, 0);
  function reconstruireDecor() {
    const n = {}; colliders.length = 0;
    for (const tu of tuiles.values()) for (const o of tu.objets) {
      const f = FORMES[o.type]; if (!f) continue;
      const v = Math.floor(o.rot * 100) % f.geos.length, cle = o.type + '#' + v, I = inst[cle], k = n[cle] || 0;
      if (k >= f.cap) continue;
      if (dens < 1 && (Math.floor(o.rot * 977) % 100) / 100 >= dens) continue;   // appareil léger : moins de décor (toujours les mêmes objets)
      const x = o.t, z = DEC + o.s;
      _m.compose(_p.set(x, hauteur(x, z) - 0.05, z), _q.setFromAxisAngle(_y, o.rot), _s.setScalar(o.sc));
      I.im.setMatrixAt(k, _m); n[cle] = k + 1;
      if (o.r > 0) colliders.push({ x, z, r: o.r * o.sc * 0.85 });
    }
    for (const [cle, I] of Object.entries(inst)) { I.im.count = n[cle] || 0; I.im.instanceMatrix.needsUpdate = true; }
  }

  // ---------- chargement progressif autour de l'enfant ----------
  let dernier = { i: NaN, j: NaN }, voulues = [];
  const valide = ({ i, j }) => i * TAILLE_TUILE >= S_DEBUT - 400 && i * TAILLE_TUILE <= S_FIN_TRANCHE + 400 && Math.abs(j * TAILLE_TUILE) <= LARGEUR;
  function planifier(s, t) {
    voulues = tuilesAutour(s, t, rayon).filter(valide);
    const garde = new Set(voulues.map(({ i, j }) => cleTuile(i, j)));
    for (const [key, tu] of tuiles) if (!garde.has(key) && Math.hypot((tu.i + 0.5) * TAILLE_TUILE - s, (tu.j + 0.5) * TAILLE_TUILE - t) > (rayon + 1.5) * TAILLE_TUILE) retirerTuile(key);
  }
  function maj(pos) {
    const { s, t } = versRoute(pos.x, pos.z), ci = Math.floor(s / TAILLE_TUILE), cj = Math.floor(t / TAILLE_TUILE);
    if (ci !== dernier.i || cj !== dernier.j) { dernier = { i: ci, j: cj }; planifier(s, t); }
    let n = 0;
    for (const { i, j } of voulues) { const key = cleTuile(i, j); if (tuiles.has(key)) continue; tuiles.set(key, construireTuile(i, j)); sale = true; if (++n >= TUILES_PAR_IMAGE) break; }
    if (sale) { reconstruireDecor(); sale = false; }
  }
  // à l'arrivée : le sol sous les pieds existe tout de suite
  function preparer(pos, combien = 9) {
    const { s, t } = versRoute(pos.x, pos.z); dernier = { i: Math.floor(s / TAILLE_TUILE), j: Math.floor(t / TAILLE_TUILE) }; planifier(s, t);
    for (const { i, j } of voulues.slice(0, combien)) { const key = cleTuile(i, j); if (!tuiles.has(key)) tuiles.set(key, construireTuile(i, j)); }
    reconstruireDecor(); sale = false;
  }
  const animer = t => { matVent.userData.t = t; };
  return { groupe, hauteur, matiere, colliders, maj, preparer, animer, tuiles: () => tuiles.size, nbObjets: () => Object.values(inst).reduce((a, I) => a + I.im.count, 0),
    montrer(v) { groupe.visible = v; },
    detruire() { for (const k of [...tuiles.keys()]) retirerTuile(k); scene.remove(groupe); } };
}
