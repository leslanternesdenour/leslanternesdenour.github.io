// Le faucon du voyageur : un vrai oiseau qui part du bras de l'enfant, bat des ailes pour monter,
// plane ailes déployées, s'incline dans les virages, puis revient. La caméra le suit de derrière.
// Faucon sacre (connu en Arabie, la fauconnerie y était pratiquée) : dos brun, ventre crème tacheté, « moustache » sombre.
import * as THREE from 'three';
import { piece, fusion, materiau } from './formes.js?v=4';

const mat = materiau({ finesse: 2 });
const matAile = mat.clone(); matAile.side = THREE.DoubleSide;
const B = () => new THREE.BoxGeometry(1, 1, 1), S = (r, a = 10, b = 8) => new THREE.SphereGeometry(r, a, b);
const BRUN = '#7a5434', BRUN2 = '#5e3f26', CREME = '#eadcc0', TACHE = '#a07a52', JAUNE = '#d9b44a', NOIR = '#2a1f18';
const lisse = (a, b, k) => a + (b - a) * k;
const angle = a => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };

function modele(ombres) {
  const racine = new THREE.Group(), corps = new THREE.Group(); racine.add(corps);
  const m = (g, pieces, materiel = mat) => { const o = new THREE.Mesh(fusion(pieces), materiel); o.castShadow = ombres; g.add(o); return o; };
  // le corps (il regarde +z)
  const pc = [
    piece(S(0.1, 12, 10), BRUN, { s: [0.85, 0.78, 1.9] }),
    piece(S(0.095, 12, 10), CREME, { p: [0, -0.03, 0.03], s: [0.78, 0.62, 1.6] })];
  for (let i = 0; i < 9; i++) pc.push(piece(S(0.012, 5, 4), TACHE, { p: [(i % 3 - 1) * 0.03, -0.085, 0.1 - Math.floor(i / 3) * 0.05], s: [1, 0.4, 1.4] }));
  // la tête : œil sombre, « moustache », bec crochu jaune à pointe noire
  pc.push(piece(S(0.068, 12, 10), BRUN, { p: [0, 0.045, 0.2] }), piece(S(0.06, 10, 8), CREME, { p: [0, 0.02, 0.215], s: [0.9, 0.8, 0.9] }));
  for (const s of [-1, 1]) {
    pc.push(piece(S(0.014, 8, 6), NOIR, { v: 1, p: [s * 0.045, 0.06, 0.245] }), piece(S(0.017, 8, 6), JAUNE, { v: 1, p: [s * 0.045, 0.06, 0.24], s: [1.1, 1.1, 0.6] }));   // œil
    pc.push(piece(B(), BRUN2, { p: [s * 0.05, 0.02, 0.235], r: [0.3, 0, 0], s: [0.012, 0.05, 0.02] }));       // la moustache du faucon
  }
  pc.push(piece(new THREE.ConeGeometry(0.022, 0.06, 8), JAUNE, { p: [0, 0.028, 0.285], r: [Math.PI / 2 + 0.35, 0, 0] }),
    piece(new THREE.ConeGeometry(0.012, 0.03, 6), NOIR, { p: [0, 0.012, 0.31], r: [Math.PI / 2 + 0.9, 0, 0] }));
  // les pattes repliées sous le ventre
  for (const s of [-1, 1]) pc.push(piece(new THREE.CylinderGeometry(0.009, 0.009, 0.06, 6), JAUNE, { p: [s * 0.03, -0.075, -0.06], r: [1.3, 0, 0] }));
  m(corps, pc);
  // la queue : un éventail de plumes qui s'ouvre dans les virages
  const queue = new THREE.Group(); queue.position.set(0, 0.005, -0.17); corps.add(queue);
  const pq = [];
  for (let i = -2; i <= 2; i++) pq.push(piece(B(), i % 2 ? BRUN : BRUN2, { p: [i * 0.012, 0, -0.08], r: [0, i * 0.12, 0], s: [0.045, 0.012, 0.17] }), piece(B(), NOIR, { p: [i * 0.02, -0.001, -0.165], r: [0, i * 0.12, 0], s: [0.045, 0.013, 0.02] }));
  m(queue, pq, matAile);
  // les ailes : épaule (partie intérieure) et poignet (les grandes plumes), longues et pointues comme chez les faucons
  const ailes = [-1, 1].map(s => {
    const epaule = new THREE.Group(); epaule.position.set(s * 0.065, 0.035, 0.03); corps.add(epaule);
    m(epaule, [piece(B(), BRUN, { p: [s * 0.15, 0, -0.02], s: [0.3, 0.022, 0.2] }),
      piece(B(), CREME, { p: [s * 0.15, -0.012, -0.02], s: [0.29, 0.004, 0.19] }),
      piece(B(), BRUN2, { p: [s * 0.15, 0.012, -0.11], s: [0.3, 0.008, 0.05] })], matAile);
    const poignet = new THREE.Group(); poignet.position.set(s * 0.3, 0, 0); epaule.add(poignet);
    const pp = [];
    for (let i = 0; i < 6; i++) {
      const l = 0.27 - i * 0.025;
      pp.push(piece(B(), i < 2 ? BRUN2 : BRUN, { p: [s * l / 2, 0.002 * i, 0.06 - i * 0.03], r: [0, s * (0.08 + i * 0.12), 0], s: [l, 0.01, 0.045] }),
        piece(B(), NOIR, { p: [s * (l - 0.02), 0.002 * i, 0.06 - i * 0.03 - s * 0], r: [0, s * (0.08 + i * 0.12), 0], s: [0.04, 0.011, 0.04] }));
    }
    m(poignet, pp, matAile);
    return { s, epaule, poignet };
  });
  racine.scale.setScalar(1.25);                  // un peu plus grand que nature, pour bien le voir à l'écran
  return { racine, corps, queue, ailes };
}

export function creerFaucon(scene, H, ombres) {
  const f = modele(ombres); f.racine.visible = false; scene.add(f.racine);
  const pos = new THREE.Vector3(), avant = new THREE.Vector3(0, 0, 1);
  const E = { etat: 'repos', t: 0, cap: 0, capCible: 0, vy: 0, vit: 0, phase: 0, battre: 1, roulis: 0, tangage: 0, cycle: 0, fini: null };

  // l'envol : depuis le bras de l'enfant, dans la direction donnée (angle comme J.a : avant = (sin a, cos a))
  function envol(depart, cap) { pos.copy(depart); E.etat = 'envol'; E.t = 0; E.cap = E.capCible = cap; E.vy = 3; E.vit = 2; f.racine.visible = true; }
  function rappeler(fini) { if (E.etat === 'repos') { if (fini) fini(); return; } E.etat = 'retour'; E.t = 0; E.fini = fini; }
  function viser(cap) { E.capCible = cap; }

  function maj(dt, t, enfant) {
    if (E.etat === 'repos') return;
    E.t += dt;
    let vitCible = 11, altCible, battreCible;
    if (E.etat === 'envol') {
      // il monte presque à la verticale d'abord (pas à travers les maisons), en battant fort des ailes
      vitCible = 3 + E.t * 4; altCible = H(pos.x, pos.z) + 22; battreCible = 1;
      if (E.t > 2.2) E.etat = 'vol';
    } else if (E.etat === 'vol') {
      // il plane, et bat des ailes de temps en temps (ou quand il remonte)
      const devant = H(pos.x + Math.sin(E.cap) * 25, pos.z + Math.cos(E.cap) * 25);
      altCible = Math.max(devant, H(pos.x, pos.z)) + 20;
      // il ne s'éloigne pas trop de l'enfant, ni du bord du pays
      const dx = enfant.x - pos.x, dz = enfant.z - pos.z, loin = Math.hypot(dx, dz);
      if (loin > 140 || Math.abs(pos.x) > 360 || Math.abs(pos.z) > 360) E.capCible = Math.atan2(dx, dz);
      E.cycle += dt; const enBattement = (E.cycle % 5) < 1.3;
      battreCible = E.vy > 0.8 ? 1 : enBattement ? 0.7 : 0;
    } else {
      // le retour vers l'enfant
      const dx = enfant.x - pos.x, dz = enfant.z - pos.z, d = Math.hypot(dx, dz);
      E.capCible = Math.atan2(dx, dz); vitCible = Math.min(13, 3 + d * 0.4);
      altCible = enfant.y + 1.6 + Math.min(18, d * 0.35); battreCible = d < 12 ? 1 : 0.4;
      if ((d < 1.6 && Math.abs(pos.y - enfant.y - 1.6) < 1.2) || E.t > 9) { E.etat = 'repos'; f.racine.visible = false; const fi = E.fini; E.fini = null; if (fi) fi(); return; }
    }
    // virer en douceur (au plus 0,9 rad/s), s'incliner dans le virage
    const dCap = angle(E.capCible - E.cap), vire = Math.max(-0.9, Math.min(0.9, dCap * 1.5));
    E.cap = angle(E.cap + vire * dt);
    E.roulis = lisse(E.roulis, -vire * 0.75, 1 - Math.exp(-dt * 3));
    // monter, descendre, avancer
    E.vy = lisse(E.vy, Math.max(-4, Math.min(6, (altCible - pos.y) * 0.8)), 1 - Math.exp(-dt * 2));
    E.vit = lisse(E.vit, vitCible, 1 - Math.exp(-dt * 1.5));
    avant.set(Math.sin(E.cap), 0, Math.cos(E.cap));
    pos.addScaledVector(avant, E.vit * dt); pos.y += E.vy * dt;
    pos.y = Math.max(pos.y, H(pos.x, pos.z) + 1.2);
    E.tangage = lisse(E.tangage, -Math.atan2(E.vy, Math.max(2, E.vit)) * 0.8, 1 - Math.exp(-dt * 3));
    // les ailes : battement ↔ vol plané, en douceur
    E.battre = lisse(E.battre, battreCible, 1 - Math.exp(-dt * 3));
    E.phase += dt * (9 + E.battre * 4);
    const b = E.battre, sp = Math.sin(E.phase), sp2 = Math.sin(E.phase - 0.7);
    for (const a of f.ailes) {
      a.epaule.rotation.set(0, 0, a.s * (0.06 + b * 0.75 * sp - (1 - b) * 0.02 * Math.sin(t * 1.3)));
      a.poignet.rotation.set(0, a.s * b * 0.15 * Math.max(0, -sp), a.s * (b * 0.55 * sp2 + (1 - b) * 0.05));
    }
    f.corps.position.y = -b * 0.03 * sp;
    f.queue.scale.x = 1 + Math.min(0.8, Math.abs(vire) * 0.9); f.queue.rotation.set(-E.tangage * 0.4, 0, -vire * 0.25);
    // placer l'oiseau
    f.racine.position.copy(pos);
    f.racine.rotation.set(0, 0, 0); f.racine.rotateY(E.cap); f.racine.rotateX(E.tangage); f.racine.rotateZ(E.roulis);
  }
  // la caméra qui le suit : derrière et un peu au-dessus, elle regarde devant lui et vers le sol
  const _c = new THREE.Vector3(), _v = new THREE.Vector3();
  function camera(sortiePos, sortieVise) {
    const a = new THREE.Vector3(Math.sin(E.cap), 0, Math.cos(E.cap));
    sortiePos.copy(pos).addScaledVector(a, -4.2).add(_c.set(0, 1.5, 0));
    sortieVise.copy(pos).addScaledVector(a, 14).add(_v.set(0, -4.5, 0));
  }
  return { envol, rappeler, viser, maj, camera, etat: () => E.etat, pos, racine: f.racine };
}
