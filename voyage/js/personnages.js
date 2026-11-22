// Les personnages : le petit explorateur (l'enfant qui joue) et Sablo, le chameau.
// Modèles en formes simples, articulés pour les animations (marche, course, monture, agenouillement).
import * as THREE from 'three';
import { piece, fusion, materiau, M } from './formes.js?v=4';

const mat = materiau();
const B = () => new THREE.BoxGeometry(1, 1, 1);
const SPH = (r, w = 14, h = 10) => new THREE.SphereGeometry(r, w, h);
const CAP = (r, l) => { const g = new THREE.CapsuleGeometry(r, l, 4, 10); g.translate(0, -l / 2 - r, 0); return g; };
const maille = (geo, ombre) => { const m = new THREE.Mesh(geo, mat); m.castShadow = ombre; return m; };

// ================= L'enfant =================
export class Enfant {
  constructor(ombres, couleurs = {}) {
    this.racine = new THREE.Group();
    this.corps = new THREE.Group(); this.racine.add(this.corps);
    const { peau = '#d9a27a', tunique = '#2bb3c0', pantalon = '#3a4f7a', chaussure = '#6b4428', cheche = '#fff3dc', sac = true, barbe = null, voile = null } = couleurs;
    // jambes
    this.jambes = [-1, 1].map(s => {
      const g = new THREE.Group(); g.position.set(s * 0.1, 0.58, 0);
      g.add(maille(fusion([piece(CAP(0.075, 0.36), pantalon), piece(B(), chaussure, { p: [0, -0.54, 0.05], s: [0.15, 0.09, 0.24] })]), ombres));
      this.corps.add(g); return g;
    });
    // tunique, ceinture, sac à dos avec une petite lanterne
    this.corps.add(maille(fusion([
      piece(new THREE.CylinderGeometry(0.17, 0.25, 0.55, 12), tunique, { p: [0, 0.83, 0] }),
      piece(new THREE.CylinderGeometry(0.2, 0.2, 0.06, 12), '#f5b942', { p: [0, 0.72, 0] }),
      ...(sac ? [
        piece(B(), '#a7744a', { p: [0, 0.9, -0.2], s: [0.28, 0.34, 0.14] }),
        piece(B(), '#8a5a35', { p: [0, 1.04, -0.2], s: [0.3, 0.06, 0.16] }),
        piece(new THREE.ConeGeometry(0.06, 0.08, 6), '#d9952a', { p: [0.1, 0.83, -0.29] }),
        piece(new THREE.CylinderGeometry(0.04, 0.045, 0.09, 6), '#ffd36b', { p: [0.1, 0.76, -0.29] })] : [
        piece(new THREE.CylinderGeometry(0.25, 0.3, 0.5, 12), tunique, { p: [0, 0.4, 0] })])  // longue robe (adulte)
    ]), ombres));
    // bras
    this.bras = [-1, 1].map(s => {
      const g = new THREE.Group(); g.position.set(s * 0.22, 1.06, 0);
      g.add(maille(fusion([piece(CAP(0.06, 0.26), tunique), piece(SPH(0.065, 8, 6), peau, { p: [0, -0.42, 0] })]), ombres));
      g.rotation.z = s * 0.12;
      this.corps.add(g); return g;
    });
    // tête : visage tout simple, chèche (foulard du désert) couleur crème
    this.tete = new THREE.Group(); this.tete.position.set(0, 1.26, 0); this.corps.add(this.tete);
    this.tete.add(maille(fusion([
      piece(SPH(0.19), peau),
      ...(voile ? [   // voile qui couvre les cheveux, les oreilles et le cou, et tombe sur les épaules
        piece(new THREE.SphereGeometry(0.214, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.36), voile, { p: [0, 0.006, -0.004], m: M.tissu }),
        piece(new THREE.SphereGeometry(0.216, 18, 12, Math.PI / 2 + 0.78, Math.PI * 2 - 1.56, Math.PI * 0.2, Math.PI * 0.62), voile, { m: M.tissu }),
        piece(new THREE.CylinderGeometry(0.15, 0.3, 0.36, 18), voile, { p: [0, -0.26, -0.02], m: M.tissu })
      ] : [
      piece(new THREE.SphereGeometry(0.205, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), cheche, { p: [0, 0.02, -0.01] }),
      piece(new THREE.TorusGeometry(0.19, 0.035, 6, 16), '#f0dcb4', { p: [0, 0.06, 0], r: [Math.PI / 2 - 0.25, 0, 0] }),
      piece(B(), cheche, { p: [0, -0.06, -0.2], r: [0.35, 0, 0], s: [0.16, 0.26, 0.04] })]),
      piece(SPH(0.027, 6, 5), '#2a2440', { v: 1, p: [-0.065, 0.0, 0.17] }),
      piece(SPH(0.027, 6, 5), '#2a2440', { v: 1, p: [0.065, 0.0, 0.17] }),
      piece(SPH(0.03, 6, 5), '#f19a8a', { v: 1, p: [-0.11, -0.05, 0.14] }),
      piece(SPH(0.03, 6, 5), '#f19a8a', { v: 1, p: [0.11, -0.05, 0.14] }),
      ...(barbe ? [piece(SPH(0.15, 10, 8), barbe, { p: [0, -0.13, 0.08], s: [1, 1.25, 0.8] }), piece(B(), barbe, { p: [0, -0.04, 0.17], s: [0.14, 0.025, 0.03] })] : [])
    ]), ombres));
    this.phase = 0;
    this.pose = 'debout';
  }

  // vitesse en m/s ; pose : 'debout' | 'monte'
  animer(dt, vitesse, t) {
    const [jg, jd] = this.jambes, [bg, bd] = this.bras;
    if (this.pose === 'monte') {
      jg.rotation.set(-1.25, 0, -0.55); jd.rotation.set(-1.25, 0, 0.55);
      bg.rotation.set(-0.9, 0, 0.25); bd.rotation.set(-0.9, 0, -0.25);
      this.corps.position.y = 0; this.corps.rotation.x = 0.05;
      this.tete.rotation.y = Math.sin(t * 0.6) * 0.15;
      return;
    }
    const v = Math.min(vitesse, 7);
    if (v > 0.15) {
      this.phase += dt * (4 + v * 1.6);
      const amp = Math.min(0.9, 0.35 + v * 0.1);
      jg.rotation.set(Math.sin(this.phase) * amp, 0, 0); jd.rotation.set(-Math.sin(this.phase) * amp, 0, 0);
      bg.rotation.set(-Math.sin(this.phase) * amp * 0.9, 0, 0.12); bd.rotation.set(Math.sin(this.phase) * amp * 0.9, 0, -0.12);
      this.corps.position.y = Math.abs(Math.sin(this.phase)) * 0.05 * (v / 3);
      this.corps.rotation.x = Math.min(0.22, v * 0.03);
    } else {
      const r = Math.sin(t * 2) * 0.02;
      for (const j of this.jambes) j.rotation.x *= 0.8;
      bg.rotation.set(bg.rotation.x * 0.8, 0, 0.12 + r); bd.rotation.set(bd.rotation.x * 0.8, 0, -0.12 - r);
      this.corps.position.y = Math.sin(t * 2) * 0.008; this.corps.rotation.x *= 0.85;
      this.tete.rotation.y = Math.sin(t * 0.5) * 0.25;
    }
    this.tete.rotation.y *= 0.98;
  }
}

// ================= Sablo, le chameau =================
export class Chameau {
  // options : robe [poil, poil2, sabot], bosses (1 = dromadaire, 2 = chameau de Bactriane), etoiles (monture imaginaire), echelle
  constructor(ombres, { robe = ['#d6a868', '#c48f52', '#7a5636'], bosses = 1, etoiles = false, echelle = 0.86 } = {}) {
    this.racine = new THREE.Group();
    this.echelle = echelle; this.bosses = bosses;
    this.racine.scale.setScalar(this.echelle);
    const [poil, poil2, sabot] = robe;
    this.hauteurDebout = 1.75;
    this.corps = new THREE.Group(); this.corps.position.y = this.hauteurDebout; this.racine.add(this.corps);
    this.corps.add(maille(fusion([
      piece(SPH(1, 18, 12), poil, { s: [0.72, 0.68, 1.3] }),
      ...(bosses === 2 ? [                                                                          // deux bosses et une épaisse toison
        piece(SPH(1, 14, 10), poil2, { p: [0, 0.52, 0.62], s: [0.4, 0.55, 0.34] }), piece(SPH(1, 14, 10), poil2, { p: [0, 0.5, -0.72], s: [0.4, 0.52, 0.34] }),
        piece(SPH(1, 12, 8), poil2, { p: [0, -0.35, 0.75], s: [0.45, 0.35, 0.45] })
      ] : [piece(SPH(1, 16, 10), poil2, { p: [0, 0.55, -0.05], s: [0.55, 0.6, 0.72] })]),     // la bosse
      piece(SPH(0.3, 8, 6), poil2, { p: [0, -0.15, -1.25] })
    ]), ombres));
    if (etoiles) {   // monture imaginaire : de petites étoiles qui brillent sur le pelage
      const e = [];
      for (let i = 0; i < 26; i++) { const a = i * 2.4, h = ((i * 37) % 11) / 11; e.push(piece(SPH(0.035, 6, 5), '#fff1b8', { p: [Math.cos(a) * 0.73 * Math.sqrt(1 - (h - 0.5) ** 2 * 0.9), -0.4 + h * 0.75, Math.sin(a) * 1.2 * 0.9] })); }
      this.corps.add(new THREE.Mesh(fusion(e), new THREE.MeshBasicMaterial({ vertexColors: true })));
    }
    // la queue (elle chasse les mouches)
    this.queue = new THREE.Group(); this.queue.position.set(0, -0.1, -1.32); this.corps.add(this.queue);
    this.queue.add(maille(fusion([
      piece(new THREE.CylinderGeometry(0.06, 0.035, 0.75, 6), poil2, { p: [0, -0.36, -0.05], r: [0.18, 0, 0] }),
      piece(new THREE.ConeGeometry(0.07, 0.22, 6), '#8a5a35', { p: [0, -0.8, -0.12], r: [Math.PI + 0.18, 0, 0] })
    ]), ombres));
    // le harnais (tapis, selle, sacoches, lanterne) : il change selon ce que l'enfant a choisi au marché
    this.ombres = ombres;
    this.harnais = new THREE.Group(); this.corps.add(this.harnais);
    this.selle = new THREE.Object3D(); this.selle.position.set(0, 1.08, -0.05); this.corps.add(this.selle);
    // le cou et la tête
    this.cou = new THREE.Group(); this.cou.position.set(0, 0.15, 1.05); this.corps.add(this.cou);
    this.cou.add(maille(fusion([
      piece(new THREE.CylinderGeometry(0.2, 0.3, 1.25, 10), poil, { p: [0, 0.48, 0.35], r: [0.62, 0, 0] }),
      piece(SPH(0.24, 10, 8), poil, { p: [0, 1.0, 0.68] })
    ]), ombres));
    this.tete = new THREE.Group(); this.tete.position.set(0, 1.05, 0.75); this.cou.add(this.tete);
    this.tete.add(maille(fusion([
      piece(SPH(1, 14, 10), poil, { s: [0.22, 0.24, 0.42], p: [0, 0.05, 0.18] }),
      piece(SPH(1, 12, 8), '#e2bb85', { s: [0.17, 0.16, 0.2], p: [0, -0.03, 0.52] }),
      piece(SPH(0.03, 6, 4), '#5a3a22', { v: 1, p: [-0.07, 0.0, 0.69] }), piece(SPH(0.03, 6, 4), '#5a3a22', { v: 1, p: [0.07, 0.0, 0.69] }),
      piece(B(), '#3a2a1a', { v: 1, p: [-0.17, 0.2, 0.26], r: [0, 0, 0.3], s: [0.1, 0.02, 0.04] }), piece(B(), '#3a2a1a', { v: 1, p: [0.17, 0.2, 0.26], r: [0, 0, -0.3], s: [0.1, 0.02, 0.04] }),
      piece(new THREE.ConeGeometry(0.06, 0.16, 6), poil2, { p: [-0.15, 0.3, 0.05], r: [0, 0, 0.5] }),
      piece(new THREE.ConeGeometry(0.06, 0.16, 6), poil2, { p: [0.15, 0.3, 0.05], r: [0, 0, -0.5] }),
      piece(new THREE.TorusGeometry(0.2, 0.025, 5, 14), '#c94f3c', { p: [0, 0.02, 0.38], r: [0, 0, 0], s: [1, 1, 1] }),
      piece(SPH(0.04, 6, 4), '#f5b942', { p: [0, -0.18, 0.38] })
    ]), ombres));
    // les yeux à part, pour pouvoir cligner ; de longs cils doux
    this.yeux = new THREE.Group(); this.yeux.position.set(0, 0.14, 0.26); this.tete.add(this.yeux);
    this.yeux.add(maille(fusion([
      piece(SPH(0.058, 10, 8), '#2a2440', { v: 1, p: [-0.17, 0, 0] }), piece(SPH(0.058, 10, 8), '#2a2440', { v: 1, p: [0.17, 0, 0] }),
      piece(SPH(0.022, 6, 5), '#ffffff', { v: 1, p: [-0.19, 0.025, 0.045] }), piece(SPH(0.022, 6, 5), '#ffffff', { v: 1, p: [0.19, 0.025, 0.045] }),
      ...[-1, 1].flatMap(sx => [0, 1, 2].map(i => piece(B(), '#2a1c12', { v: 1, p: [sx * (0.17 + (i - 1) * 0.025), 0.055, 0.03], r: [0.5, 0, sx * (i - 1) * 0.4], s: [0.008, 0.05, 0.008] })))
    ]), false));
    this.clignement = 3;
    this.regard = null;       // tourner la tête vers quelque chose (angle relatif), null = il regarde autour
    this.caresse = 0;         // petite animation de câlin
    // les pattes (cuisse + jambe, articulées au genou)
    this.pattes = [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sz]) => {
      const haut = new THREE.Group(); haut.position.set(sx * 0.4, -0.3, sz * 0.85); this.corps.add(haut);
      haut.add(maille(fusion([piece(new THREE.CylinderGeometry(0.15, 0.11, 0.8, 8), poil, { p: [0, -0.4, 0] })]), ombres));
      const bas = new THREE.Group(); bas.position.y = -0.78; haut.add(bas);
      bas.add(maille(fusion([
        piece(SPH(0.11, 8, 6), poil2),
        piece(new THREE.CylinderGeometry(0.085, 0.08, 0.7, 8), poil, { p: [0, -0.36, 0] }),
        piece(SPH(1, 8, 6), sabot, { p: [0, -0.7, 0.04], s: [0.13, 0.06, 0.17] })
      ]), ombres));
      return { haut, bas, sx, sz };
    });
    this.phase = 0;
    this.agenouille = 0;      // 0 = debout, 1 = couché
    this.habiller({});
  }

  // tapis : [couleur, bordure] ; selle : couleur ; sacoches, pompons, lanterne : oui/non
  habiller({ tapis = ['#c94f3c', '#2bb3c0'], motif = null, selle = '#f5b942', selleBois = false, sacoches = false, pompons = false, lanterne = false, couverture = null }) {
    for (const g of [this.harnais, this.collier]) if (g) { g.parent.remove(g); g.traverse(o => o.geometry && o.geometry.dispose()); }
    this.harnais = new THREE.Group(); this.corps.add(this.harnais);
    const [t1, t2] = tapis, lz = this.bosses === 2 ? 0.62 : 1;
    const p = [
      piece(B(), t1, { p: [0, 0.98, -0.05], s: [1.25, 0.08, 1.15 * lz], m: M.laine }),
      piece(B(), t2, { p: [0, 0.95, -0.05], s: [1.32, 0.06, 0.9 * lz], m: M.laine }),
      piece(B(), selle, { p: [0, 1.06, -0.05], s: [0.6, 0.1, 0.6], m: selleBois ? M.bois : M.cuir }),
      piece(B(), '#8a5a35', { p: [0, 1.22, 0.24], s: [0.5, 0.3, 0.08] }),
      piece(B(), '#8a5a35', { p: [0, 1.18, -0.34], s: [0.5, 0.22, 0.08] }),
      piece(B(), selle, { p: [0, 1.38, 0.24], s: [0.12, 0.08, 0.12] }),
      ...[-1, 1].map(s => piece(B(), t2, { p: [s * 0.66, 0.72, -0.05], s: [0.04, 0.5, 0.9], m: M.laine })),
      ...[-1, 1].map(s => piece(B(), t1, { p: [s * 0.67, 0.45, -0.05], s: [0.04, 0.08, 0.95] })),
      ...[-1, 1].flatMap(s => Array.from({ length: 7 }, (_, i) => piece(B(), i % 2 ? t1 : t2, { p: [s * 0.68, 0.36, -0.45 + i * 0.13], s: [0.03, 0.1, 0.05] })))
    ];
    // motif tissé sur les pans du tapis
    for (const s of [-1, 1]) {
      const x = s * 0.685;
      if (motif === 'rayures') for (const y of [0.58, 0.72, 0.86]) p.push(piece(B(), t1, { p: [x, y, -0.05], s: [0.012, 0.05, 0.9] }));
      if (motif === 'losanges') for (let i = 0; i < 4; i++) p.push(piece(B(), t1, { p: [x, 0.72, -0.4 + i * 0.235], r: [Math.PI / 4, 0, 0], s: [0.012, 0.15, 0.15] }));
      if (motif === 'etoiles') for (let i = 0; i < 3; i++) for (const r of [0, Math.PI / 4]) p.push(piece(B(), t2, { p: [x * 1.004, 0.72, -0.35 + i * 0.3], r: [r, 0, 0], s: [0.012, 0.12, 0.12] }));
      if (motif === 'nuit') { p.push(piece(new THREE.TorusGeometry(0.1, 0.025, 5, 14, Math.PI * 1.3), t2, { p: [x * 1.01, 0.74, -0.2], r: [0, Math.PI / 2, 0.6] }));
        for (const [y, z] of [[0.86, 0.1], [0.62, 0.22], [0.8, 0.32], [0.6, -0.42]]) p.push(piece(SPH(0.025, 6, 5), t2, { p: [x * 1.01, y, z] })); }
    }
    if (selleBois) p.push(piece(SPH(0.07, 8, 6), '#6b4428', { p: [0, 1.42, 0.24], m: M.bois }), piece(SPH(0.06, 8, 6), '#6b4428', { p: [0, 1.32, -0.34], m: M.bois }),
      ...[-1, 1].map(s => piece(B(), '#c9a26a', { p: [s * 0.2, 1.22, 0.285], s: [0.06, 0.18, 0.01] })));
    if (couverture) {
      p.push(piece(new THREE.CylinderGeometry(0.13, 0.13, 0.95, 12), couverture[0], { p: [0, 1.2, -0.56], r: [0, 0, Math.PI / 2], m: M.laine }));
      for (const x of [-0.3, 0, 0.3]) p.push(piece(new THREE.CylinderGeometry(0.135, 0.135, 0.06, 12), couverture[1], { p: [x, 1.2, -0.56], r: [0, 0, Math.PI / 2] }));
      for (const x of [-0.25, 0.25]) p.push(piece(new THREE.TorusGeometry(0.14, 0.012, 4, 14), '#5a3a22', { p: [x, 1.2, -0.56], r: [0, Math.PI / 2, 0] }));
    }
    if (sacoches) for (const s of [-1, 1]) {
      p.push(piece(B(), '#a7744a', { p: [s * 0.78, 0.55, -0.55], s: [0.2, 0.42, 0.4] }));
      p.push(piece(B(), '#8a5a35', { p: [s * 0.79, 0.76, -0.55], s: [0.22, 0.08, 0.42] }));
      p.push(piece(B(), '#2bb3c0', { p: [s * 0.89, 0.55, -0.55], s: [0.02, 0.18, 0.22] }));
      p.push(piece(SPH(0.03, 5, 4), '#f5b942', { p: [s * 0.9, 0.55, -0.55] }));
    }
    this.harnais.add(maille(fusion(p), this.ombres));
    this.lanterne = null;
    if (lanterne) {
      const l = new THREE.Group(); l.position.set(0.3, 1.32, -0.42); this.harnais.add(l);
      l.add(maille(fusion([piece(B(), '#4a3a5a', { p: [0, 0.1, 0], s: [0.03, 0.2, 0.03] }), piece(new THREE.ConeGeometry(0.1, 0.1, 6), '#b8741f', { p: [0, -0.02, 0] })]), false));
      l.add(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.16, 6), new THREE.MeshBasicMaterial({ color: '#ffd36b' })).translateY(-0.14));
      this.lanterne = l;
    }
    this.collier = null;
    if (pompons) {
      this.collier = new THREE.Group(); this.cou.add(this.collier);
      const c = ['#c94f3c', '#f5b942', '#2bb3c0', '#7b4fa0', '#ff9fb2', '#3fbf7f'];
      this.collier.add(maille(fusion([
        piece(new THREE.TorusGeometry(0.27, 0.035, 6, 18), '#c94f3c', { p: [0, 0.32, 0.18], r: [Math.PI / 2 + 0.6, 0, 0] }),
        ...Array.from({ length: 9 }, (_, i) => { const a = Math.PI * (0.15 + i * 0.0875) * 2 - Math.PI * 0.3; return piece(SPH(0.055, 6, 5), c[i % 6], { p: [Math.cos(a) * 0.28, 0.2 + Math.sin(a) * 0.05 - 0.04, 0.18 + Math.sin(a) * 0.22] }); })
      ]), false));
    }
  }

  // Position de la selle dans le monde (là où s'assoit l'enfant)
  positionSelle(v) { return this.selle.getWorldPosition(v); }

  animer(dt, vitesse, t) {
    const k = this.agenouille, v = vitesse;
    // respiration, clignement des yeux, queue
    const souffle = Math.sin(t * 1.9) * (v > 8 ? 0.03 : 0.012);
    this.corps.scale.set(1 + souffle, 1 + souffle * 0.6, 1);
    this.clignement -= dt;
    if (this.clignement < 0) { this.clignement = 2.5 + Math.random() * 4; this.finClin = 0.14; }
    if (this.finClin > 0) { this.finClin -= dt; this.yeux.scale.y = 0.15; } else this.yeux.scale.y = 1;
    this.queue.rotation.z = Math.sin(t * (v > 0.2 ? 5 : 1.6)) * (v > 0.2 ? 0.25 : 0.35) + (Math.sin(t * 0.37) > 0.92 ? Math.sin(t * 18) * 0.3 : 0);
    this.queue.rotation.x = 0.15 + (v > 8 ? 0.6 : 0);
    if (this.caresse > 0) this.caresse = Math.max(0, this.caresse - dt);
    if (this.lanterne) this.lanterne.rotation.x = Math.sin(t * (v > 0.2 ? 6 : 1.5)) * (v > 0.2 ? 0.35 : 0.08);
    // corps qui descend quand le chameau s'agenouille (l'avant d'abord, comme un vrai chameau)
    const avant = Math.min(1, k * 1.6), arriere = Math.max(0, k * 1.6 - 0.6);
    this.corps.position.y = this.hauteurDebout - (avant + arriere) * 0.5 * 1.05;
    this.corps.rotation.x = (avant - arriere) * 0.28;
    if (k > 0.01) {
      for (const p of this.pattes) {
        const f = p.sz > 0 ? avant : arriere;
        p.haut.rotation.x = -1.35 * f; p.bas.rotation.x = 2.55 * f;
      }
      this.cou.rotation.x = -0.15 * k + Math.sin(t * 0.8) * 0.03;
      this.tete.rotation.x = 0.1 * k;
      return;
    }
    if (v > 0.2) {
      // amble : les deux pattes d'un même côté avancent ensemble, comme les vrais chameaux
      this.phase += dt * (2.2 + v * 0.55);
      const amp = Math.min(0.75, 0.32 + v * 0.045);
      for (const p of this.pattes) {
        const ph = this.phase + (p.sx > 0 ? Math.PI : 0);
        p.haut.rotation.x = Math.sin(ph) * amp;
        p.bas.rotation.x = Math.max(0, -Math.cos(ph)) * amp * 1.3;
      }
      this.corps.position.y = this.hauteurDebout + Math.abs(Math.cos(this.phase)) * 0.04 * Math.min(2, v / 4);
      this.corps.rotation.z = Math.sin(this.phase) * 0.035;
      this.cou.rotation.x = Math.sin(this.phase * 2) * 0.06 + (v > 8 ? 0.18 : 0);
      this.tete.rotation.x = -this.cou.rotation.x * 0.6;
    } else {
      for (const p of this.pattes) { p.haut.rotation.x *= 0.85; p.bas.rotation.x *= 0.85; }
      this.corps.rotation.z *= 0.9;
      // au repos : il regarde l'enfant s'il est proche, sinon il observe les alentours
      const c = this.caresse > 0 ? Math.sin(Math.min(1, this.caresse / 2.5) * Math.PI) : 0;
      this.cou.rotation.x = Math.sin(t * 0.7) * 0.05 + c * 0.55;
      const cible = this.regard ?? Math.sin(t * 0.35) * 0.35;
      this.tete.rotation.y += (Math.max(-0.9, Math.min(0.9, cible)) - this.tete.rotation.y) * Math.min(1, dt * 3);
      this.tete.rotation.x = Math.sin(t * 1.1) * 0.04 - c * 0.3;
      this.tete.rotation.z = c * Math.sin(t * 6) * 0.12;
    }
  }
}
