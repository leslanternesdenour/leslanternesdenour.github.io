// Construit un personnage-test complet (maillages lisses liés au squelette commun) pour valider toute la chaîne
// Blender → glTF → Three.js avant d'avoir les modèles définitifs d'un·e artiste.
// Toutes les coordonnées sont celles de la pose de repos, dans le repère du personnage (il regarde +z, ses pieds sont à y = 0).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { creerSquelette } from './squelette.js';
import { tube } from './geometrie.js';

const PEAUX = ['#f0c9a4', '#d9a27a', '#b97f58', '#8d5a3b'];
const TENUE = { robe: '#e6d6b4', bord: '#b89a6a', cuir: '#7a5232' };

export function construirePersonnage(genre) {
  const sq = creerSquelette(genre);
  const os = []; sq.racine.traverse(o => { if (o.isBone) os.push(o); });
  const num = nom => os.findIndex(o => o.name === nom);
  sq.racine.updateMatrixWorld(true);
  const skeleton = new THREE.Skeleton(os);
  const matiere = (couleur, rugosite = 0.85) => new THREE.MeshStandardMaterial({ color: couleur, roughness: rugosite });
  const peau = matiere(PEAUX[1], 0.7), tissu = matiere(TENUE.robe), cuir = matiere(TENUE.cuir, 0.6);

  const partie = (nom, geometrie, materiau) => {
    const m = new THREE.SkinnedMesh(geometrie, materiau); m.name = nom; m.castShadow = true;
    sq.racine.add(m); m.bind(skeleton); return m;
  };
  // une forme rigide (sphère, ellipsoïde, boîte) : tout son poids sur un seul os
  const rigide = (geometrie, centre, nomOs, echelle = [1, 1, 1]) => {
    geometrie.scale(...echelle); geometrie.translate(...centre);
    const n = geometrie.getAttribute('position').count, si = new Uint16Array(n * 4), sw = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) { si[i * 4] = num(nomOs); sw[i * 4] = 1; }
    geometrie.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4)); geometrie.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
    return geometrie;
  };

  const epaule = genre === 'garcon' ? 0.19 : 0.175, ax = epaule - 0.01;
  for (const s of [-1, 1]) {
    const c = s < 0 ? 'd' : 'g', h = 'hanche_' + c, g = 'genou_' + c, ch = 'cheville_' + c, ep = 'epaule_' + c, co = 'coude_' + c, ma = 'main_' + c;
    const I = nom => num(nom);
    partie('jambe_' + c, tube({ chemin: [[s * 0.085, 0.6, 0], [s * 0.085, 0.46, 0], [s * 0.085, 0.32, 0], [s * 0.085, 0.2, 0], [s * 0.085, 0.08, 0]], rayons: [0.075, 0.07, 0.062, 0.054, 0.046],
      os: [[I(h), I(h), 0], [I(h), I(h), 0], [I(h), I(g), 0.5], [I(g), I(g), 0], [I(g), I(ch), 0.5]], cotes: 16 }), tissu);
    partie('bras_' + c, tube({ chemin: [[s * ax, 1.05, 0], [s * ax, 0.93, 0], [s * ax, 0.81, 0], [s * ax, 0.68, 0], [s * ax, 0.58, 0]], rayons: [0.064, 0.06, 0.056, 0.052, 0.05],
      os: [[I(ep), I(ep), 0], [I(ep), I(ep), 0], [I(ep), I(co), 0.5], [I(co), I(co), 0], [I(co), I(ma), 0.5]], cotes: 16 }), tissu);
    partie('main_' + c, rigide(new THREE.SphereGeometry(0.05, 20, 14), [s * ax, 0.545, 0.005], ma, [0.85, 1.1, 0.75]), peau);
    partie('pied_' + c, rigide(new THREE.SphereGeometry(0.05, 20, 14), [s * 0.085, 0.05, 0.06], ch, [1, 0.7, 2]), peau);
    partie('sandale_' + c, rigide(new THREE.BoxGeometry(0.12, 0.028, 0.25), [s * 0.085, 0.014, 0.065], ch), cuir);
  }
  const J = nom => num(nom);
  const torse = tube({ chemin: [[0, 0.58, 0], [0, 0.72, 0], [0, 0.9, 0], [0, 1.06, 0], [0, 1.17, 0]], rayons: [0.15, 0.15, 0.15, 0.158, 0.1],
    os: [[J('bassin'), J('buste'), 0.4], [J('buste'), J('buste'), 0], [J('buste'), J('buste'), 0], [J('buste'), J('buste'), 0], [J('buste'), J('buste'), 0]], cotes: 24 });
  torse.scale(epaule / 0.16, 1, 0.88); torse.computeVertexNormals();
  partie('torse', torse, tissu);
  partie('cou', tube({ chemin: [[0, 1.15, 0.005], [0, 1.22, 0.005], [0, 1.3, 0.005]], rayons: [0.052, 0.05, 0.05], os: [[J('buste'), J('buste'), 0], [J('buste'), J('tete'), 0.5], [J('tete'), J('tete'), 0]], cotes: 14 }), peau);
  const tete = partie('tete', rigide(new THREE.SphereGeometry(0.19, 32, 24), [0, 1.265, 0.005], 'tete', [1, 1.03, 0.98]), peau);
  {
    // forme corrective « sourire » : les coins de la bouche et les pommettes remontent un peu (déplacements relatifs, comme dans glTF)
    const p = tete.geometry.getAttribute('position'), d = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i) - 1.265, z = p.getZ(i) - 0.005;
      const bouche = Math.exp(-((y + 0.075) ** 2) / 0.0012) * Math.min(1, Math.max(0, (z - 0.08) / 0.06)) * Math.min(1, Math.abs(x) / 0.05);
      d[i * 3] = Math.sign(x) * 0.008 * bouche; d[i * 3 + 1] = 0.016 * bouche; d[i * 3 + 2] = 0.004 * bouche;
    }
    const cible = new THREE.Float32BufferAttribute(d, 3); cible.name = 'sourire';
    tete.geometry.morphAttributes.position = [cible]; tete.geometry.morphTargetsRelative = true; tete.updateMorphTargets();
  }

  // ----- le visage : pièces rigides attachées à la tête (le visage regarde +z) ; les yeux sont dans le groupe « yeux », qui sert à cligner -----
  const piece = (nom, geometrie, materiau, p, r = [0, 0, 0], parent = sq.tete, echelle = [1, 1, 1]) => {
    const m = new THREE.Mesh(geometrie, materiau); m.name = nom; m.position.set(...p); m.rotation.set(...r); m.scale.set(...echelle); parent.add(m); return m;
  };
  const blanc = matiere('#fbf7ef', 0.3), iris = matiere(genre === 'garcon' ? '#4a2c1a' : '#3a2418', 0.3), noir = matiere('#140c0a', 0.2), rose = matiere('#f0948a', 0.7), brun = matiere('#4a3020'), levres = matiere('#b4584a', 0.5);
  for (const s of [-1, 1]) {
    const c = s < 0 ? 'd' : 'g';
    const oeil = piece('oeil_' + c, new THREE.SphereGeometry(0.036, 20, 14), blanc, [s * 0.066, 0, 0], [0, 0, 0], sq.yeux, [1, 1.12, 0.55]);
    piece('iris_' + c, new THREE.SphereGeometry(0.026, 18, 12), iris, [0, -0.002, 0.03], [0, 0, 0], oeil, [1, 1, 0.5]);
    piece('pupille_' + c, new THREE.SphereGeometry(0.013, 12, 8), noir, [0, -0.002, 0.04], [0, 0, 0], oeil, [1, 1, 0.5]);
    piece('reflet_' + c, new THREE.SphereGeometry(0.007, 8, 6), blanc, [0.01, 0.012, 0.045], [0, 0, 0], oeil);
    piece('sourcil_' + c, new THREE.BoxGeometry(0.055, 0.011, 0.01), brun, [s * 0.065, 0.068, 0.178], [0.1, -s * 0.25, -s * 0.12]);
    piece('joue_' + c, new THREE.SphereGeometry(0.032, 14, 10), rose, [s * 0.105, -0.055, 0.145], [0, 0, 0], sq.tete, [1.2, 0.8, 0.5]);
  }
  piece('nez', new THREE.SphereGeometry(0.02, 14, 10), peau, [0, -0.025, 0.188], [0, 0, 0], sq.tete, [1.1, 0.9, 1]);
  piece('bouche', new THREE.TorusGeometry(0.03, 0.006, 8, 18, Math.PI), levres, [0, -0.07, 0.176], [0.2, 0, Math.PI]);

  // ----- cheveux et coiffe (rigides, attachés à la tête) -----
  // plis : on gonfle ou on creuse la surface, autour de l'axe vertical, selon l'angle (ondulations régulières + irrégularité)
  const plis = (g, amp, freq, haut = 0.5) => {
    const p = g.getAttribute('position');
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i), a = Math.atan2(x, z), k = 1 + amp * (Math.sin(a * freq + y * 9) * 0.7 + Math.sin(a * freq * 2.3 + 1.7) * 0.3) * (0.4 + 0.6 * Math.min(1, Math.max(0, (haut - y) / haut)));
      p.setXYZ(i, x * k, y, z * k);
    }
    g.computeVertexNormals(); return g;
  };
  if (genre === 'garcon') {
    const noir = matiere('#2b1d14', 0.55), creme = matiere('#f1e8d2', 0.9), or = matiere('#c9a14a', 0.5);
    piece('cheveux', plis(new THREE.SphereGeometry(0.205, 44, 30, Math.PI / 2 + 0.7, Math.PI * 2 - 1.4, 0, Math.PI * 0.6), 0.035, 7, 0.1), noir, [0, 0.0, -0.006]);
    const meches = [];
    for (let i = 0; i < 9; i++) {
      const a = -1.1 + i * 0.275, g = new THREE.ConeGeometry(0.028 - (i % 3) * 0.004, 0.11 + (i % 2) * 0.03, 8, 1);
      g.translate(0, -0.055, 0); g.rotateX(Math.PI * 0.62 - (i % 3) * 0.1); g.rotateY(a); g.translate(Math.sin(a) * 0.15, 0.11 + Math.cos(a * 2) * 0.01, Math.cos(a) * 0.15); meches.push(g);
    }
    piece('meches', mergeGeometries(meches), noir, [0, 0, 0.012]);
    piece('bonnet', new THREE.SphereGeometry(0.214, 40, 16, 0, Math.PI * 2, 0, Math.PI * 0.3), creme, [0, 0.012, -0.012]);
    piece('bonnet_bande', new THREE.TorusGeometry(0.214 * Math.sin(Math.PI * 0.3), 0.01, 8, 48), or, [0, 0.012 + 0.214 * Math.cos(Math.PI * 0.3), -0.012], [Math.PI / 2, 0, 0]);
  } else {
    const voile = matiere('#f2e9d6', 0.9), bord = matiere('#c9b48a', 0.85);
    piece('hijab', plis(new THREE.SphereGeometry(0.218, 44, 30, Math.PI / 2 + 0.85, Math.PI * 2 - 1.7, 0, Math.PI * 0.72), 0.03, 6, 0.05), voile, [0, -0.005, -0.008]);
    piece('hijab_cadre', new THREE.TorusGeometry(0.172, 0.014, 10, 48, Math.PI * 1.22), bord, [0, 0, 0.055], [0, 0, -0.11 * Math.PI]);
    const epaules = new THREE.CylinderGeometry(0.115, 0.275, 0.29, 48, 8, true); epaules.translate(0, -0.145, 0);
    piece('hijab_epaules', plis(epaules, 0.045, 7, 1), voile, [0, 0.52, 0.0], [0, 0, 0], sq.buste, [1, 1, 0.86]);
  }

  // ----- robe (fille) ou tunique (garçon) : le bas du vêtement, avec des plis, attaché au bassin ; le moteur de gestes le fait disparaître quand on s'assoit -----
  {
    const long = genre === 'garcon' ? 0.42 : 0.56, bas = genre === 'garcon' ? 0.235 : 0.3, bord = matiere(TENUE.bord, 0.8);
    const g = new THREE.CylinderGeometry(0.165, bas, long, 56, 12, true); g.translate(0, -long / 2 + 0.04, 0);
    piece('robe', plis(g, 0.028, 9, 1), tissu, [0, 0, 0], [0, 0, 0], sq.jupe);
    piece('robe_bord', new THREE.TorusGeometry(bas - 0.004, 0.016, 8, 56), bord, [0, -long + 0.06, 0], [Math.PI / 2, 0, 0], sq.jupe);
  }

  // ----- mains : doigts repliés, pouce, et l'index (os d'index : le moteur de gestes le lève au tachahhoud) -----
  for (const s of [-1, 1]) {
    const c = s < 0 ? 'd' : 'g', main = sq.bras[s < 0 ? 0 : 1].main, nb = s < 0 ? 3 : 4, doigts = [];
    for (let i = 0; i < nb; i++) { const g = new THREE.CapsuleGeometry(0.0125, 0.05, 4, 8); g.translate(s * (0.02 - i * 0.0125), -0.085, 0.012); doigts.push(g); }
    piece('doigts_' + c, mergeGeometries(doigts), peau, [0, 0, 0], [0, 0, 0], main);
    piece('pouce_' + c, new THREE.CapsuleGeometry(0.014, 0.035, 4, 8), peau, [-s * 0.045, -0.03, 0.02], [0, 0, s * 0.55], main);
  }
  piece('doigt_index', new THREE.CapsuleGeometry(0.0125, 0.06, 4, 8), peau, [0, -0.04, 0.012], [0, 0, 0], sq.bras[0].index);
  return sq;
}
