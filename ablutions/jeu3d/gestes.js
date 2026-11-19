// Les gestes des ablutions : postures du personnage assis devant le robinet.
// Les bras et les jambes sont placés par « cinématique inverse » : on dit où vont les mains et les pieds,
// le calcul plie l'épaule, le coude, la hanche et le genou de façon naturelle (pas de bras tordus).
import * as THREE from 'three';
import { majIndex } from './doigt.js?v=1';
import { cibleCheville } from './cheville.js?v=1';

// ---------- repères (en mètres, dans le repère du personnage : +z devant lui, +y en haut) ----------
// Le personnage regarde +z. Sa main DROITE est du côté x négatif (bras[0]), sa main GAUCHE côté x positif (bras[1]).
export const ROBINET = { x: 0, y: 0.56, z: 0.44 };         // le bec du robinet (l'eau tombe en dessous)
const SOUS_ROBINET = [0, 0.43, 0.43];                        // là où l'on met les mains pour prendre l'eau

const L_BRAS = [0.24, 0.25], L_JAMBE = [0.3, 0.29];         // épaule→coude→main, hanche→genou→cheville

// ---------- une petite cinématique inverse à deux segments ----------
const _v = new THREE.Vector3(), _h = new THREE.Vector3(), _q = new THREE.Quaternion(), _e = new THREE.Vector3(), _p = new THREE.Vector3(), _a = new THREE.Vector3(), _inv = new THREE.Matrix4();
// haut : groupe de l'épaule (ou de la hanche) ; bas : groupe du coude (ou du genou) ; cible : position dans le repère du PARENT de haut
// plie : -1 pour un coude (l'avant-bras se plie vers l'avant), +1 pour un genou ; pole : direction préférée du coude/genou (repère parent)
export function ik(haut, bas, cible, L, plie, pole) {
  const [L1, L2] = L;
  _v.copy(cible).sub(haut.position);
  const d = Math.min(L1 + L2 - 0.002, Math.max(0.06, _v.length()));
  const c = (L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2);
  const phi = Math.PI - Math.acos(Math.max(-1, Math.min(1, c)));   // de combien le coude se plie
  bas.rotation.set(plie * phi, 0, 0);
  // la main dans le repère du segment haut, une fois le coude plié
  _h.set(0, -L1 - L2 * Math.cos(phi), -plie * L2 * Math.sin(phi)).normalize();
  _q.setFromUnitVectors(_h, _a.copy(_v).normalize());
  // on tourne autour de l'axe épaule→main pour mettre le coude du bon côté
  const axe = _a;
  _e.set(0, -1, 0).applyQuaternion(_q);                     // direction du segment haut
  const ep = _e.clone().sub(axe.clone().multiplyScalar(_e.dot(axe)));
  const pp = _p.copy(pole).sub(axe.clone().multiplyScalar(pole.dot(axe)));
  if (ep.lengthSq() > 1e-6 && pp.lengthSq() > 1e-6) {
    ep.normalize(); pp.normalize();
    const ang = Math.atan2(axe.dot(ep.clone().cross(pp)), ep.dot(pp));
    _q.premultiply(new THREE.Quaternion().setFromAxisAngle(axe, ang));
  }
  haut.quaternion.copy(_q);
}

// ---------- les postures ----------
// Chaque posture : corps (bassin, buste, tête) + où vont les mains (repère : 'tete' | 'corps') + où vont les pieds.
// Les mains : { d: [x,y,z], g: [x,y,z], ref: 'corps'|'tete' }  (dans le repère du personnage ou de sa tête)
const ASSIS = { bassinY: 0.335, bassinZ: 0, busteX: 0.12, busteY: 0, teteX: 0.12, teteY: 0, teteZ: 0,
  mains: { ref: 'corps', d: [-0.11, 0.38, 0.24], g: [0.11, 0.38, 0.24] },
  pieds: { d: [-0.09, 0.055, 0.33], g: [0.09, 0.055, 0.33] } };

const P = (o) => ({ ...ASSIS, ...o, mains: o.mains || ASSIS.mains, pieds: o.pieds || ASSIS.pieds });
const sousRobinet = (dx = 0.04, dy = 0, dz = 0) => ({ ref: 'corps', d: [SOUS_ROBINET[0] - dx, SOUS_ROBINET[1] + dy, SOUS_ROBINET[2] + dz], g: [SOUS_ROBINET[0] + dx, SOUS_ROBINET[1] + dy, SOUS_ROBINET[2] + dz] });

export const POSTURES = {
  assis: P({}),
  // se pencher vers l'eau, les deux mains sous le robinet
  puiser: P({ busteX: 0.42, teteX: 0.35, mains: sousRobinet(0.045) }),
  // une seule main (la droite) sous le robinet
  puiserDroite: P({ busteX: 0.4, teteX: 0.3, mains: { ref: 'corps', d: [-0.01, 0.43, 0.43], g: [0.12, 0.4, 0.25] } }),
  // les mains devant soi (on montre les mains, les doigts entre les doigts)
  mainsFrotter: P({ busteX: 0.38, teteX: 0.4, mains: sousRobinet(0.03, 0.02, -0.02) }),
  // la main droite à la bouche
  bouche: P({ busteX: 0.18, teteX: 0.05, mains: { ref: 'tete', d: [-0.01, -0.095, 0.24], g: [0.12, -0.55, 0.2] } }),
  recracher: P({ busteX: 0.5, teteX: 0.45, mains: { ref: 'corps', d: [-0.1, 0.42, 0.3], g: [0.11, 0.38, 0.24] } }),
  // la main droite au nez, puis on souffle (la main gauche devant le nez)
  nez: P({ busteX: 0.16, teteX: -0.02, mains: { ref: 'tete', d: [-0.01, -0.035, 0.25], g: [0.12, -0.55, 0.2] } }),
  souffler: P({ busteX: 0.45, teteX: 0.4, mains: { ref: 'tete', d: [-0.1, -0.5, 0.2], g: [0.015, -0.04, 0.25] } }),
  // le visage : les deux mains montent sur le front, puis descendent jusqu'au menton
  visageHaut: P({ busteX: 0.2, teteX: 0.05, mains: { ref: 'tete', d: [-0.07, 0.07, 0.23], g: [0.07, 0.07, 0.23] } }),
  visageBas: P({ busteX: 0.24, teteX: 0.12, mains: { ref: 'tete', d: [-0.075, -0.1, 0.22], g: [0.075, -0.1, 0.22] } }),
  // les bras : un bras sous l'eau, l'autre main frotte du poignet jusqu'au coude
  brasDroitPoignet: P({ busteX: 0.38, busteY: 0.12, teteX: 0.32, mains: { ref: 'corps', d: [-0.03, 0.44, 0.44], g: [-0.06, 0.47, 0.38] } }),
  brasDroitCoude: P({ busteX: 0.38, busteY: 0.12, teteX: 0.32, mains: { ref: 'corps', d: [-0.03, 0.44, 0.44], g: [-0.14, 0.5, 0.26] } }),
  brasGauchePoignet: P({ busteX: 0.38, busteY: -0.12, teteX: 0.32, mains: { ref: 'corps', d: [0.06, 0.47, 0.38], g: [0.03, 0.44, 0.44] } }),
  brasGaucheCoude: P({ busteX: 0.38, busteY: -0.12, teteX: 0.32, mains: { ref: 'corps', d: [0.14, 0.5, 0.26], g: [0.03, 0.44, 0.44] } }),
  // la tête : les mains mouillées passent de l'avant vers l'arrière, puis reviennent
  teteAvant: P({ busteX: 0.1, teteX: 0.25, mains: { ref: 'tete', d: [-0.06, 0.17, 0.12], g: [0.06, 0.17, 0.12] } }),
  teteArriere: P({ busteX: 0.1, teteX: 0.3, mains: { ref: 'tete', d: [-0.07, 0.12, -0.15], g: [0.07, 0.12, -0.15] } }),
  // les oreilles : les index à l'intérieur, les pouces derrière
  oreilles: P({ busteX: 0.12, teteX: 0.05, mains: { ref: 'tete', d: [-0.215, -0.01, 0.0], g: [0.215, -0.01, 0.0] } }),
  // les pieds : on avance le pied sous le robinet, on se penche et on le frotte jusqu'à la cheville
  piedDroitPose: P({ bassinZ: -0.1, busteX: 0.55, teteX: 0.45,
    pieds: { d: [-0.03, 0.09, 0.42], g: [0.11, 0.055, 0.26] }, mains: { ref: 'corps', d: [-0.11, 0.33, 0.25], g: [0.11, 0.33, 0.25] } }),
  piedDroitFrotter: P({ bassinZ: -0.1, busteX: 0.85, teteX: 0.5,
    pieds: { d: [-0.03, 0.09, 0.42], g: [0.11, 0.055, 0.26] }, mains: { ref: 'corps', d: [-0.09, 0.17, 0.48], g: [0.02, 0.15, 0.44] } }),
  piedDroitCheville: P({ bassinZ: -0.1, busteX: 0.85, teteX: 0.5,
    pieds: { d: [-0.03, 0.09, 0.42], g: [0.11, 0.055, 0.26] }, mains: { ref: 'corps', d: [-0.1, 0.2, 0.36], g: [0.04, 0.2, 0.37] } }),
  piedGauchePose: P({ bassinZ: -0.1, busteX: 0.55, teteX: 0.45,
    pieds: { d: [-0.11, 0.055, 0.26], g: [0.03, 0.09, 0.42] }, mains: { ref: 'corps', d: [-0.11, 0.33, 0.25], g: [0.11, 0.33, 0.25] } }),
  piedGaucheFrotter: P({ bassinZ: -0.1, busteX: 0.85, teteX: 0.5,
    pieds: { d: [-0.11, 0.055, 0.26], g: [0.03, 0.09, 0.42] }, mains: { ref: 'corps', d: [-0.02, 0.15, 0.44], g: [0.09, 0.17, 0.48] } }),
  piedGaucheCheville: P({ bassinZ: -0.1, busteX: 0.85, teteX: 0.5,
    pieds: { d: [-0.11, 0.055, 0.26], g: [0.03, 0.09, 0.42] }, mains: { ref: 'corps', d: [-0.04, 0.2, 0.37], g: [0.1, 0.2, 0.36] } }),
  // debout devant le tabouret (pour s'asseoir et se relever en douceur)
  debout: { ...ASSIS, bassinY: 0.62, bassinZ: -0.34, busteX: 0, teteX: 0, mains: { ref: 'corps', d: [-0.21, 0.4, -0.31], g: [0.21, 0.4, -0.31] }, pieds: { d: [-0.085, 0.033, -0.34], g: [0.085, 0.033, -0.34] } },
  // l'intention (les mains sur le cœur) et Bismillâh (on se tient prêt, les mains ouvertes)
  coeur: P({ busteX: 0.06, teteX: -0.05, mains: { ref: 'corps', d: [-0.02, 0.69, 0.16], g: [0.06, 0.66, 0.17] } }),
  pret: P({ busteX: 0.1, teteX: 0.0, mains: { ref: 'corps', d: [-0.1, 0.5, 0.3], g: [0.1, 0.5, 0.3] } })
};

// ---------- les séquences : une « fois » de chaque geste ----------
// Chaque image : [posture, durée en s, options] ; options : eau (le robinet coule), frotte (les mains bougent), gouttes, brille (là où ça brille)
export const SEQUENCES = {
  intention: [['coeur', 1.6, { brille: 'coeur' }], ['assis', 0.6]],
  bismillah: [['pret', 1.4, { brille: 'bouche' }], ['assis', 0.5]],
  mains: [['puiser', 0.7, { eau: 1 }], ['mainsFrotter', 1.3, { eau: 1, frotte: 'mains' }], ['puiser', 0.5, { eau: 1, brille: 'mains' }], ['assis', 0.5, { gouttes: 1 }]],
  bouche: [['puiserDroite', 0.7, { eau: 1 }], ['bouche', 0.9, { frotte: 'joues' }], ['recracher', 0.7, { crache: 1 }], ['assis', 0.5, { brille: 'bouche' }]],
  nez: [['puiserDroite', 0.7, { eau: 1 }], ['nez', 0.9], ['souffler', 0.8, { crache: 1 }], ['assis', 0.5, { brille: 'nez' }]],
  visage: [['puiser', 0.7, { eau: 1 }], ['visageHaut', 0.6, { gouttes: 1 }], ['visageBas', 0.8, { gouttes: 1 }], ['assis', 0.5, { brille: 'visage' }]],
  brasDroit: [['brasDroitPoignet', 0.7, { eau: 1 }], ['brasDroitCoude', 0.8, { eau: 1 }], ['brasDroitPoignet', 0.7, { eau: 1 }], ['assis', 0.45, { brille: 'brasD' }]],
  brasGauche: [['brasGauchePoignet', 0.7, { eau: 1 }], ['brasGaucheCoude', 0.8, { eau: 1 }], ['brasGauchePoignet', 0.7, { eau: 1 }], ['assis', 0.45, { brille: 'brasG' }]],
  tete: [['puiser', 0.7, { eau: 1 }], ['teteAvant', 0.6], ['teteArriere', 0.8], ['teteAvant', 0.8], ['assis', 0.5, { brille: 'tete' }]],
  oreilles: [['oreilles', 1.2, { frotte: 'oreilles' }], ['assis', 0.5, { brille: 'oreilles' }]],
  piedDroit: [['piedDroitPose', 0.8, { eau: 1 }], ['piedDroitFrotter', 0.9, { eau: 1, frotte: 'pied' }], ['piedDroitCheville', 0.7, { eau: 1 }], ['piedDroitPose', 0.5, { eau: 1 }], ['assis', 0.7, { brille: 'piedD' }]],
  piedGauche: [['piedGauchePose', 0.8, { eau: 1 }], ['piedGaucheFrotter', 0.9, { eau: 1, frotte: 'pied' }], ['piedGaucheCheville', 0.7, { eau: 1 }], ['piedGauchePose', 0.5, { eau: 1 }], ['assis', 0.7, { brille: 'piedG' }]]
};

// ---------- le moteur : il suit les postures en douceur ----------
const lisse = (a, b, k) => a + (b - a) * k;
// Le moteur sert aussi au jeu de prière : on lui donne d'autres postures et séquences.
//   depart : la posture de départ quand le moteur prend la main ; repos : celle qu'il garde entre deux gestes.
export class Gestes {
  constructor(v, { postures = POSTURES, sequences = SEQUENCES, depart = 'debout', repos = 'assis' } = {}) {
    this.v = v;                               // le Voyageur (personnage du Grand Voyage)
    this.P = postures; this.S = sequences; this.depart = depart; this.repos = repos;
    this.etat = null; this.cible = this.P[repos]; this.seq = null; this.opt = {}; this.t = 0;
    this.mainsMonde = [new THREE.Vector3(), new THREE.Vector3()];
    this.piedsMonde = [new THREE.Vector3(), new THREE.Vector3()];
    this.actif = false;
  }
  // passe en mode « assis » (le moteur commande le corps) ou rend la main à l'animation de marche
  activer(oui) {
    this.actif = oui; this.v.jupe.visible = !oui; this.v.jupe.scale.y = 1;
    if (oui && !this.etat) { this.etat = this.copie(this.P[this.depart]); this.cible = this.P[this.repos]; }
    if (!oui) { this.etat = null; this.seq = null; this.v.corps.position.set(0, 0, 0); this.v.bassin.position.set(0, 0.62, 0); this.v.buste.rotation.set(0, 0, 0); this.v.tete.rotation.set(0, 0, 0); }
  }
  copie(p) { return { bassinY: p.bassinY, bassinZ: p.bassinZ, busteX: p.busteX, busteY: p.busteY, teteX: p.teteX, teteY: p.teteY, teteZ: p.teteZ, mains: null, pieds: null }; }
  poser(nom) { this.seq = null; this.cible = this.P[nom] || this.P[this.repos]; this.opt = {}; }
  // joue une fois une séquence ; fin() quand c'est fini
  jouer(nom, fin, garder = false) { const s = this.S[nom]; if (!s) return false; this.seq = { s, i: -1, t: 0, fin, garder }; this.suivante(); return true; }
  suivante() {
    const q = this.seq; q.i++;
    if (q.i >= q.s.length) { const f = q.fin; this.seq = null; this.opt = {}; if (!q.garder) this.cible = this.P[this.repos]; if (f) f(); return; }
    const [nom, d, o] = q.s[q.i]; q.t = 0; q.d = d; this.cible = this.P[nom]; this.opt = o || {};
    if (this.surImage) this.surImage(this.opt);
  }
  enCours() { return !!this.seq; }

  // position d'une main ou d'un pied dans le repère du personnage
  _point(ref, p, sortie) {
    const v = this.v;
    if (ref === 'tete') { sortie.set(p[0], p[1], p[2]); v.tete.localToWorld(sortie); v.racine.worldToLocal(sortie); }
    else sortie.set(p[0], p[1], p[2]);
    return sortie;
  }

  maj(dt, t) {
    if (!this.actif) return;
    const v = this.v, e = this.etat, c = this.cible, k = 1 - Math.exp(-dt * 7.5), kM = 1 - Math.exp(-dt * 9);
    if (this.seq) { this.seq.t += dt; if (this.seq.t >= this.seq.d) this.suivante(); }
    for (const n of ['bassinY', 'bassinZ', 'busteX', 'busteY', 'teteX', 'teteY', 'teteZ']) e[n] = lisse(e[n], c[n], k);
    // le corps
    const resp = Math.sin(t * 2.1) * 0.006;
    v.corps.position.set(0, 0, 0); v.corps.rotation.set(0, 0, 0);
    v.bassin.position.set(0, e.bassinY, e.bassinZ); v.bassin.rotation.set(0, 0, 0);
    v.buste.rotation.set(e.busteX + resp, e.busteY, 0);
    v.tete.rotation.set(e.teteX, e.teteY, e.teteZ);
    // clignement des yeux
    v.clign -= dt; if (v.clign < 0) v.clign = 2.5 + Math.random() * 3;
    v.yeux.scale.y = v.clign < 0.12 ? 0.15 : 1;
    // la robe (ou le bas de la tunique) : seulement dans les postures debout qui le permettent
    if (c.robe) { v.jupe.visible = true; v.jupe.scale.y = lisse(v.jupe.scale.y, 1, k); }
    else { v.jupe.scale.y = lisse(v.jupe.scale.y, 0.01, k * 1.6); v.jupe.visible = v.jupe.scale.y > 0.05; }
    v.racine.updateMatrixWorld(true);

    // les pieds (jambes : hanche → genou → cheville)
    const piedsC = c.pieds;
    const P0 = this.P[this.depart];
    if (!e.pieds) e.pieds = [new THREE.Vector3(...P0.pieds.d), new THREE.Vector3(...P0.pieds.g)];
    const cibleP = [_p.clone().set(...piedsC.d), new THREE.Vector3(...piedsC.g)];
    for (let i = 0; i < 2; i++) {
      e.pieds[i].lerp(cibleP[i], k);
      const j = v.jambes[i === 0 ? 0 : 1];                 // jambes[0] = côté x négatif = jambe droite
      const loc = e.pieds[i].clone(); v.racine.localToWorld(loc); v.bassin.worldToLocal(loc);
      ik(j.haut, j.bas, loc, L_JAMBE, 1, c.genou ? new THREE.Vector3(j.s * c.genou[0], c.genou[1], c.genou[2]).normalize() : new THREE.Vector3(j.s * 0.15, 0.2, 1).normalize());
      this.piedsMonde[i].copy(e.pieds[i]); v.racine.localToWorld(this.piedsMonde[i]);
      // la cheville : 0 = pied à angle droit ; positif = le pied s'étend dans le prolongement de la jambe (à genoux)
      if (!e.cheville) e.cheville = [0, 0];
      _p.set(0, 0, 1);
      if (c.piedsPlats) { j.haut.updateMatrixWorld(true); _p.transformDirection(j.bas.matrixWorld).transformDirection(_inv.copy(v.racine.matrixWorld).invert()); }   // le « devant » du pied, dans le repère du personnage
      e.cheville[i] = lisse(e.cheville[i], cibleCheville(c, i, _p.y, _p.z), k);
      if (j.cheville) j.cheville.rotation.set(e.cheville[i], 0, 0);
    }

    // les mains (bras : épaule → coude → main)
    const mc = c.mains;
    const cibles = [this._point(mc.ref, mc.d, new THREE.Vector3()), this._point(mc.ref, mc.g, new THREE.Vector3())];
    // frotter : petits mouvements des mains
    const f = this.opt.frotte;
    if (f === 'mains') { const o = Math.sin(t * 13) * 0.035; cibles[0].x += o; cibles[1].x -= o; cibles[0].z += Math.cos(t * 13) * 0.02; }
    if (f === 'pied') { const o = Math.sin(t * 11) * 0.03; cibles[0].z += o; cibles[1].z -= o; }
    if (f === 'oreilles') { const o = Math.sin(t * 9) * 0.015; cibles[0].y += o; cibles[1].y += o; }
    if (f === 'joues') { v.tete.rotation.z += Math.sin(t * 8) * 0.04; }
    if (!e.mains) e.mains = [this._point(P0.mains.ref, P0.mains.d, new THREE.Vector3()), this._point(P0.mains.ref, P0.mains.g, new THREE.Vector3())];
    for (let i = 0; i < 2; i++) {
      e.mains[i].lerp(cibles[i], kM);
      const b = v.bras[i];                                   // bras[0] = main droite, bras[1] = main gauche
      const loc = e.mains[i].clone(); v.racine.localToWorld(loc); v.buste.worldToLocal(loc);
      ik(b.haut, b.bas, loc, L_BRAS, -1, new THREE.Vector3(b.s * 0.8, -0.6, -0.25).normalize());
      this.mainsMonde[i].copy(e.mains[i]); v.racine.localToWorld(this.mainsMonde[i]);
    }
    majIndex(v.bras[0].index, e, c, k);   // l'index levé (tachahhoud), main droite
  }
}
