// La halte de repos des caravaniers, en 3D : une grande tente en poils de chèvre avec son auvent, des tapis de laine, un petit feu, des palmiers,
// des provisions (sacs d'orge, dattes, pains, jarres), l'eau de Nour sous un trépied, et — côté est — l'abreuvoir, la mangeoire et l'abri de palmes de Sablo.
// Tout est UNE géométrie fusionnée (la tente, les tapis, les provisions…) + trois petits morceaux qui vivent : les braises, l'eau, le fanion. Aucun fichier, aucune image.
// Époque : Arabie du VIIe siècle → bois, laine, poils de chèvre, argile, cuir, palmes, dattes, orge. Rien de moderne.
import * as THREE from 'three';
import { piece, fusion, materiau, M } from '../formes.js?v=4';
import { ELEMENTS, centre, obstacles, lieuxSoins } from './halte-plan.js';

const B = () => new THREE.BoxGeometry(1, 1, 1), CYL = (a, b, h, s = 8) => new THREE.CylinderGeometry(a, b, h, s), SPH = (r, w = 8, h = 6) => new THREE.SphereGeometry(r, w, h), DOD = r => new THREE.DodecahedronGeometry(r, 0);
const E = id => ELEMENTS.find(e => e.id === id);
const hasard = graine => { let s = graine >>> 0 || 1; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; };

export function creerHalte3D({ scene, hauteur, colliders, ombres }) {
  const mat = materiau({ finesse: 1.4 }), matVent = materiau({ balance: 1.5 });
  const groupe = new THREE.Group(); groupe.name = 'route-halte'; scene.add(groupe);
  const c = centre(), y0 = hauteur(c.x, c.z);
  const monter = (geo, m) => { const o = new THREE.Mesh(geo, m); o.position.set(c.x, y0, c.z); o.castShadow = ombres; o.receiveShadow = ombres; groupe.add(o); return o; };
  for (const o of obstacles()) colliders.push(o);
  const R = hasard(0x4a17e);
  const g = [], gv = [], gt = [];     // g : tout ce qui ne bouge pas ; gv : les palmes (elles ondulent au vent)

  // ---- la grande tente en poils de chèvre (ouverte vers l'est) et son auvent ----
  { const t = E('tente'), x = t.dx, z = t.dz, noir = '#35291f', bande = '#8c775a';
    g.push(piece(B(), noir, { p: [x - 2.4, 1.1, z], s: [0.14, 2.2, 5.6], m: M.tissu }),                                           // le fond
      piece(B(), noir, { p: [x, 1.05, z - 2.75], s: [4.8, 2.1, 0.12], m: M.tissu }), piece(B(), noir, { p: [x, 1.05, z + 2.75], s: [4.8, 2.1, 0.12], m: M.tissu }),   // les côtés
      piece(CYL(0.09, 0.11, 2.2, 6), '#6b4a30', { p: [x + 5.0, 1.05, z - 2.5], m: M.bois }), piece(CYL(0.09, 0.11, 2.2, 6), '#6b4a30', { p: [x + 5.0, 1.05, z + 2.5], m: M.bois }),   // les deux poteaux de l'auvent
      piece(CYL(0.1, 0.12, 2.4, 6), '#6b4a30', { p: [x - 0.2, 1.2, z - 1.0], m: M.bois }), piece(CYL(0.1, 0.12, 2.4, 6), '#6b4a30', { p: [x - 0.2, 1.2, z + 1.0], m: M.bois }));   // les mâts du milieu
    gt.push(piece(B(), noir, { p: [x, 2.3, z], s: [5.2, 0.14, 5.9], r: [0, 0, -0.05], m: M.tissu }),                                  // le toit, un peu incliné vers l'avant
      piece(B(), bande, { p: [x, 2.38, z - 1.2], s: [5.25, 0.04, 0.35], r: [0, 0, -0.05], m: M.tissu }), piece(B(), bande, { p: [x, 2.38, z + 1.2], s: [5.25, 0.04, 0.35], r: [0, 0, -0.05], m: M.tissu }),   // les bandes claires
      piece(B(), noir, { p: [x + 3.9, 2.12, z], s: [3.3, 0.1, 5.7], r: [0, 0, -0.1], m: M.tissu }),                             // l'auvent
      piece(B(), bande, { p: [x + 3.9, 2.18, z], s: [3.3, 0.04, 0.3], r: [0, 0, -0.1], m: M.tissu }));   // le toit, les bandes claires et l'auvent : un morceau à part, qui disparaît quand on est dessous (la caméra ne cache jamais l'enfant)
    // à l'intérieur : des coussins et un coffre de bois
    g.push(piece(B(), '#7a3b2e', { p: [x - 1.6, 0.18, z - 1.5], s: [1.1, 0.36, 0.8], r: [0, 0.2, 0], m: M.laine }), piece(B(), '#c9a26a', { p: [x - 1.5, 0.15, z + 0.5], s: [0.9, 0.3, 0.7], r: [0, -0.3, 0], m: M.laine }),
      piece(B(), '#6b4a30', { p: [x - 1.7, 0.35, z + 1.8], s: [1.2, 0.7, 0.7], m: M.bois }), piece(B(), '#3f2d1f', { p: [x - 1.7, 0.72, z + 1.8], s: [1.24, 0.08, 0.74], m: M.bois })); }

  // ---- les tapis de laine (un liseré clair, une bande centrale) ----
  for (const e of ELEMENTS.filter(o => o.type === 'tapis')) {
    const r = [0, e.rot || 0, 0];
    g.push(piece(B(), e.bord, { p: [e.dx, 0.03, e.dz], s: [e.l + 0.28, 0.05, e.w + 0.28], r, m: M.laine }), piece(B(), e.couleur, { p: [e.dx, 0.06, e.dz], s: [e.l, 0.05, e.w], r, m: M.laine }),
      piece(B(), e.bord, { p: [e.dx, 0.09, e.dz], s: [e.l * 0.7, 0.03, e.w * 0.22], r, m: M.laine }), piece(B(), '#6b2a22', { p: [e.dx, 0.09, e.dz], s: [e.l * 0.2, 0.035, e.w * 0.6], r, m: M.laine }));
  }

  // ---- le petit feu de caravaniers : des pierres, des bûches, un trépied et une marmite ----
  { const f = E('foyer'), x = f.dx, z = f.dz;
    for (let k = 0; k < 9; k++) { const a = k / 9 * 6.283; g.push(piece(DOD(0.2), k % 2 ? '#8f7a5e' : '#7d6a50', { p: [x + Math.cos(a) * 0.85, 0.14, z + Math.sin(a) * 0.85], s: [1, 0.8, 1] })); }
    g.push(piece(CYL(0.07, 0.07, 0.9, 5), '#4a3322', { p: [x, 0.12, z], r: [0, 0, 1.45], m: M.bois }), piece(CYL(0.07, 0.07, 0.9, 5), '#3f2b1d', { p: [x, 0.16, z], r: [0, 1.1, 1.45], m: M.bois }),
      piece(CYL(0.05, 0.05, 1.9, 5), '#5a3f28', { p: [x - 0.4, 0.85, z - 0.3], r: [0.3, 0, -0.3], m: M.bois }), piece(CYL(0.05, 0.05, 1.9, 5), '#5a3f28', { p: [x + 0.4, 0.85, z - 0.3], r: [0.3, 0, 0.3], m: M.bois }), piece(CYL(0.05, 0.05, 1.9, 5), '#5a3f28', { p: [x, 0.85, z + 0.45], r: [-0.35, 0, 0], m: M.bois }),
      piece(SPH(0.3, 8, 6), '#3a3330', { p: [x, 0.68, z], s: [1, 0.8, 1], m: M.terre }), piece(CYL(0.2, 0.2, 0.05, 8), '#2b2623', { p: [x, 0.88, z] })); }

  // ---- les palmiers : tronc légèrement penché, couronne de palmes, grappes de dattes ----
  for (const e of ELEMENTS.filter(o => o.type === 'palmier')) {
    const h = e.h, x = e.dx, z = e.dz, pen = (R() - 0.5) * 0.5, ht = 5.4 * h; let px = x, pz = z;
    for (let k = 0; k < 5; k++) {   // le tronc : cinq tronçons, qui s'amincissent et se penchent un peu
      const y = (k + 0.5) * ht / 5; px = x + Math.sin(pen) * y * 0.3; pz = z + Math.cos(pen) * y * 0.15;
      g.push(piece(CYL(0.26 - k * 0.03, 0.3 - k * 0.03, ht / 5 + 0.06, 7), k % 2 ? '#7a5a38' : '#6f5233', { p: [px, y, pz], m: M.bois }));
    }
    const cy = ht, cx = px, cz = pz;
    for (let k = 0; k < 10; k++) {
      const a = k / 10 * 6.283 + R() * 0.3, L = (1.7 + R() * 0.3) * h, col = k % 2 ? '#5f7a3a' : '#6f8a45';
      const c1 = Math.cos(a), s1 = Math.sin(a);
      gv.push(piece(B(), col, { p: [cx + c1 * L * 0.45, cy + 0.22 * h, cz + s1 * L * 0.45], s: [L, 0.05, 0.5 * h], r: [0, -a, 0.42] }),
        piece(B(), col, { p: [cx + c1 * L * 1.32, cy + 0.2 * h, cz + s1 * L * 1.32], s: [L, 0.05, 0.42 * h], r: [0, -a, -0.5] }));
    }
    for (let k = 0; k < 7; k++) { const a = R() * 6.283; g.push(piece(SPH(0.14, 6, 4), '#6a3a1c', { p: [cx + Math.cos(a) * 0.35, cy - 0.35 - R() * 0.2, cz + Math.sin(a) * 0.35] })); }
  }

  // ---- les provisions : sacs d'orge, corbeille de dattes, pains sur un linge, jarres, caisse de bois ----
  { const p = E('provisions'), x = p.dx, z = p.dz;
    for (const [dx, dz, s] of [[-0.9, -0.7, 1], [-0.1, -1.1, 0.85], [-1.0, 0.3, 0.9]]) g.push(piece(SPH(0.5 * s, 8, 6), '#c9b58a', { p: [x + dx, 0.38 * s, z + dz], s: [1, 0.85, 0.9], m: M.laine }), piece(CYL(0.1, 0.17, 0.18, 6), '#b49d72', { p: [x + dx, 0.82 * s, z + dz], m: M.laine }));
    g.push(piece(CYL(0.55, 0.42, 0.45, 10), '#8a6a40', { p: [x + 0.8, 0.22, z - 0.6], m: M.bois }), piece(CYL(0.5, 0.5, 0.04, 10), '#4a2a18', { p: [x + 0.8, 0.46, z - 0.6] }));   // la corbeille de dattes
    for (let k = 0; k < 14; k++) { const a = R() * 6.283, d = R() * 0.42; g.push(piece(SPH(0.09, 6, 4), '#4a2a18', { p: [x + 0.8 + Math.cos(a) * d, 0.5 + R() * 0.07, z - 0.6 + Math.sin(a) * d], s: [1, 0.8, 1.3] })); }
    g.push(piece(B(), '#e9ddc0', { p: [x + 1.0, 0.03, z + 0.6], s: [1.5, 0.04, 1.1], r: [0, 0.3, 0], m: M.tissu }));                  // un linge clair
    for (const [dx, dz] of [[0.7, 0.45], [1.15, 0.7], [1.0, 0.95]]) g.push(piece(CYL(0.26, 0.28, 0.07, 10), '#d0a55e', { p: [x + dx, 0.09, z + dz], m: M.terre }));   // les pains d'orge
    g.push(piece(CYL(0.34, 0.26, 0.9, 10), '#b0643c', { p: [x - 0.3, 0.45, z + 1.0], m: M.terre }), piece(SPH(0.42, 9, 7), '#b0643c', { p: [x - 0.3, 0.98, z + 1.0], s: [1, 0.9, 1], m: M.terre }), piece(CYL(0.17, 0.21, 0.2, 8), '#a35a34', { p: [x - 0.3, 1.45, z + 1.0], m: M.terre }),
      piece(B(), '#8a6440', { p: [x + 1.6, 0.3, z - 0.1], s: [0.8, 0.6, 0.6], r: [0, 0.4, 0], m: M.bois })); }

  // ---- l'eau de Nour : de grandes jarres à l'ombre, un trépied de bois, des outres de cuir, une petite vasque ----
  { const w = E('eau-nour'), x = w.dx, z = w.dz;
    for (const [dx, dz, s] of [[0, 0, 1.15], [-0.95, 0.35, 0.9], [0.95, 0.25, 0.85]]) g.push(piece(CYL(0.4 * s, 0.3 * s, 0.9 * s, 10), '#b0643c', { p: [x + dx, 0.45 * s, z + dz], m: M.terre }), piece(SPH(0.52 * s, 10, 8), '#b0643c', { p: [x + dx, 1.05 * s, z + dz], s: [1, 0.9, 1], m: M.terre }),
      piece(CYL(0.22 * s, 0.3 * s, 0.22 * s, 10), '#a35a34', { p: [x + dx, 1.62 * s, z + dz], m: M.terre }), piece(CYL(0.26 * s, 0.26 * s, 0.05, 10), '#e9ddc0', { p: [x + dx, 1.76 * s, z + dz], m: M.tissu }));
    for (const s of [-1, 1]) g.push(piece(CYL(0.05, 0.05, 2.4, 5), '#5a3f28', { p: [x + s * 0.6, 1.15, z - 0.9], r: [0.25, 0, -s * 0.2], m: M.bois }));
    g.push(piece(CYL(0.04, 0.04, 1.5, 5), '#5a3f28', { p: [x, 2.1, z - 0.7], r: [0, 0, Math.PI / 2], m: M.bois }));
    for (const dx of [-0.35, 0.35]) g.push(piece(SPH(0.28, 8, 6), '#7a4a2a', { p: [x + dx, 1.62, z - 0.7], s: [0.8, 1.35, 0.8], m: M.cuir }), piece(CYL(0.04, 0.05, 0.25, 6), '#5a3a22', { p: [x + dx, 2.05, z - 0.7], m: M.cuir }));   // les outres, suspendues
    g.push(piece(CYL(0.42, 0.3, 0.2, 10), '#a8906e', { p: [x, 0.1, z + 1.4], m: M.pierre }), piece(CYL(0.34, 0.34, 0.03, 10), '#3f8fa3', { p: [x, 0.2, z + 1.4] })); }   // la vasque où l'on remplit la gourde

  // ---- l'abreuvoir de Sablo : un long bac de bois sur des pieds, rempli d'eau ----
  const eau = { mesh: null };
  { const a = E('abreuvoir'), x = a.dx, z = a.dz, bois = '#7a5232';
    g.push(piece(B(), bois, { p: [x, 0.62, z - 0.45], s: [3.4, 0.55, 0.12], m: M.bois }), piece(B(), bois, { p: [x, 0.62, z + 0.45], s: [3.4, 0.55, 0.12], m: M.bois }),
      piece(B(), bois, { p: [x - 1.7, 0.62, z], s: [0.12, 0.55, 1.0], m: M.bois }), piece(B(), bois, { p: [x + 1.7, 0.62, z], s: [0.12, 0.55, 1.0], m: M.bois }), piece(B(), '#5a3f28', { p: [x, 0.36, z], s: [3.4, 0.08, 1.0], m: M.bois }));
    for (const s of [-1.4, 0, 1.4]) g.push(piece(B(), '#5a3f28', { p: [x + s, 0.18, z], s: [0.18, 0.36, 1.2], m: M.bois }));
    const e = new THREE.Mesh(new THREE.PlaneGeometry(3.15, 0.8), new THREE.MeshBasicMaterial({ color: '#4aa0b4', transparent: true, opacity: 0.88 }));
    e.rotation.x = -Math.PI / 2; e.position.set(c.x + x, y0 + 0.78, c.z + z); groupe.add(e); eau.mesh = e; }

  // ---- la mangeoire : un râtelier de bois, des palmes, de l'orge, des dattes ----
  { const m = E('mangeoire'), x = m.dx, z = m.dz;
    g.push(piece(B(), '#7a5232', { p: [x, 0.5, z - 0.4], s: [2.7, 0.6, 0.1], m: M.bois }), piece(B(), '#7a5232', { p: [x, 0.5, z + 0.4], s: [2.7, 0.6, 0.1], m: M.bois }), piece(B(), '#7a5232', { p: [x - 1.35, 0.5, z], s: [0.1, 0.6, 0.9], m: M.bois }), piece(B(), '#7a5232', { p: [x + 1.35, 0.5, z], s: [0.1, 0.6, 0.9], m: M.bois }),
      piece(B(), '#5a3f28', { p: [x, 0.2, z], s: [2.7, 0.08, 0.9], m: M.bois }), piece(B(), '#c9b36a', { p: [x, 0.66, z], s: [2.5, 0.2, 0.75], m: M.laine }));
    for (let k = 0; k < 7; k++) g.push(piece(B(), k % 2 ? '#7d9a48' : '#8aa653', { p: [x - 1.0 + k * 0.33, 0.78, z + (R() - 0.5) * 0.3], s: [0.12, 0.05, 0.9], r: [0, (R() - 0.5) * 0.6, 0.15 * (k % 3 - 1)] }));
    for (let k = 0; k < 9; k++) g.push(piece(SPH(0.09, 6, 4), '#4a2a18', { p: [x - 1.0 + R() * 2.0, 0.8, z + (R() - 0.5) * 0.5], s: [1, 0.8, 1.3] })); }

  // ---- l'abri de Sablo : un toit de palmes sur quatre poteaux, et un lit de paille ----
  { const a = E('abri-sablo'), x = a.dx, z = a.dz;
    for (const [dx, dz] of [[-2.5, -1.8], [2.5, -1.8], [-2.5, 1.8], [2.5, 1.8]]) g.push(piece(CYL(0.12, 0.15, 3.0, 7), '#6b4a30', { p: [x + dx, 1.5, z + dz], m: M.bois }));
    g.push(piece(B(), '#5a3f28', { p: [x, 3.0, z - 1.8], s: [5.6, 0.12, 0.14], m: M.bois }), piece(B(), '#5a3f28', { p: [x, 3.0, z + 1.8], s: [5.6, 0.12, 0.14], m: M.bois }));
    for (let k = 0; k < 8; k++) g.push(piece(B(), k % 2 ? '#8a7a45' : '#7d8a45', { p: [x - 2.4 + k * 0.69, 3.1 + (k % 2) * 0.03, z], s: [0.62, 0.07, 4.6], r: [0, 0, (k % 3 - 1) * 0.02] }));
    g.push(piece(B(), '#d1b768', { p: [x, 0.07, z], s: [4.6, 0.13, 3.2], m: M.laine }));
    for (let k = 0; k < 26; k++) g.push(piece(B(), k % 3 ? '#e0c97a' : '#c4a95a', { p: [x + (R() - 0.5) * 4.4, 0.16, z + (R() - 0.5) * 3.0], s: [0.5 + R() * 0.3, 0.03, 0.04], r: [0, R() * 3.14, 0.1] })); }

  // ---- la lanterne sur son poteau (elle ne s'allume que le soir) ----
  const lampe = { mat: new THREE.MeshBasicMaterial({ color: '#8a7a52' }) };
  { const l = E('lanterne'); g.push(piece(CYL(0.06, 0.08, 1.9, 6), '#5a3f28', { p: [l.dx, 0.95, l.dz], m: M.bois }), piece(B(), '#5a3f28', { p: [l.dx + 0.25, 1.85, l.dz], s: [0.55, 0.05, 0.05], m: M.bois }));
    const m = new THREE.Mesh(SPH(0.17, 8, 6), lampe.mat); m.position.set(c.x + l.dx + 0.5, y0 + 1.68, c.z + l.dz); groupe.add(m); lampe.mesh = m; }

  monter(fusion(g), mat); monter(fusion(gv), matVent); const toit = monter(fusion(gt), mat);

  // ---- ce qui vit : les braises, le fanion ----
  const braise = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.55, 6), new THREE.MeshBasicMaterial({ color: '#ff9a3a', transparent: true, opacity: 0.92 }));
  { const f = E('foyer'); braise.position.set(c.x + f.dx, y0 + 0.33, c.z + f.dz); groupe.add(braise); }
  const lueurFeu = new THREE.Mesh(new THREE.CircleGeometry(0.62, 12), new THREE.MeshBasicMaterial({ color: '#ff7a2a', transparent: true, opacity: 0.55 }));
  { const f = E('foyer'); lueurFeu.rotation.x = -Math.PI / 2; lueurFeu.position.set(c.x + f.dx, y0 + 0.2, c.z + f.dz); groupe.add(lueurFeu); }
  const fanion = new THREE.Group();
  { const f = E('fanion'); const mat2 = new THREE.MeshLambertMaterial({ color: '#b5352a', side: THREE.DoubleSide }), matBande = new THREE.MeshLambertMaterial({ color: '#e8d6a0', side: THREE.DoubleSide });
    const mat3 = new THREE.MeshLambertMaterial({ color: '#5a3f28' }); const mat_ = new THREE.Mesh(CYL(0.07, 0.1, 7, 6), mat3); mat_.position.set(c.x + f.dx, y0 + 3.5, c.z + f.dz); mat_.castShadow = ombres; groupe.add(mat_);
    const drap = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.8, 0.03), mat2), bande = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.2, 0.035), matBande);
    drap.position.x = 0.9; bande.position.x = 0.9; fanion.add(drap, bande); fanion.position.set(c.x + f.dx, y0 + 6.3, c.z + f.dz); groupe.add(fanion); }

  let proche = true;
  return {
    groupe, soins: lieuxSoins(),
    montrer(v) { groupe.visible = v; proche = true; },
    // chaque image : n'anime que ce qui est proche ; ne dessine pas la halte quand elle est hors de vue (loin du joueur)
    animer(dt, t, joueur, nuit = 0) {
      const d = Math.hypot(joueur.x - c.x, joueur.z - c.z);
      { const dx = joueur.x - c.x, dz = joueur.z - c.z; toit.visible = !(dx > -11.2 && dx < -2.2 && dz > -7 && dz < -1); }   // sous la tente ou son auvent : le toit s'efface (la caméra ne cache jamais l'enfant)
      proche = d < 420; groupe.visible = proche;
      if (!proche) return;
      lampe.mat.color.set(nuit > 0.35 ? '#ffd36b' : '#8a7a52'); if (lampe.mesh) lampe.mesh.scale.setScalar(nuit > 0.35 ? 1.25 : 1);
      if (d > 140) return;
      braise.scale.set(1 + Math.sin(t * 9) * 0.08, 1 + Math.sin(t * 7.3 + 1) * 0.18 + 0.1, 1 + Math.sin(t * 8.1) * 0.08); braise.material.opacity = 0.85 + Math.sin(t * 11) * 0.1;
      lueurFeu.material.opacity = (0.4 + nuit * 0.35) + Math.sin(t * 6) * 0.07;
      fanion.rotation.y = Math.sin(t * 1.7) * 0.35 + 0.1; fanion.rotation.z = Math.sin(t * 2.6 + 1) * 0.05;
      if (eau.mesh) eau.mesh.position.y = y0 + 0.78 + Math.sin(t * 1.4) * 0.008;
    },
    // l'eau de l'abreuvoir remue un instant quand Sablo boit (appelé par le jeu)
    remuerEau(k) { if (eau.mesh) eau.mesh.material.opacity = 0.88 - 0.12 * k; }
  };
}
